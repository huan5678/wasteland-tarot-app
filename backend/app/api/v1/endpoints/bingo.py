"""
Bingo API Endpoints - Daily Login Bingo Game
賓果遊戲 API 端點 - 每日登入賓果遊戲

Endpoints:
- POST /card - 建立賓果卡
- GET /card - 取得賓果卡
- GET /status - 取得遊戲狀態
- POST /claim - 領取每日號碼
- GET /daily-number - 取得今日號碼
- GET /lines - 取得連線狀態
- GET /history/{month} - 取得歷史記錄
- GET /rewards - 取得獎勵記錄

Tasks 13-16 Implementation
"""

from typing import List, Optional, Dict, Any
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
import logging

from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.exceptions import (
    CardAlreadyExistsError,
    NoCardFoundError,
    InvalidCardNumbersError,
    AlreadyClaimedError,
    NoDailyNumberError,
    PastDateClaimError
)
from app.schemas.bingo import (
    BingoCardCreate,
    BingoCardResponse,
    BingoStatusResponse,
    ClaimResponse,
    DailyNumberResponse,
    LineCheckResult,
    BingoHistoryResponse,
    RewardResponse,
    ErrorResponse
)
from app.models.bingo import (
    UserBingoCard,
    DailyBingoNumber,
    UserNumberClaim,
    BingoReward,
    UserBingoCardHistory,
    UserNumberClaimHistory,
    BingoRewardHistory
)
from app.services.bingo_card_service import BingoCardManagerService
from app.services.daily_claim_service import DailyClaimService
from app.services.line_detection_service import LineDetectionService
from app.services.daily_number_generator_service import DailyNumberGeneratorService
from app.services.achievement_service import AchievementService
from app.services.achievement_background_tasks import schedule_achievement_check

logger = logging.getLogger(__name__)
router = APIRouter()


# Exception Handler Helper
def format_error_response(
    error_code: str,
    message: str,
    path: str,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Format consistent error response

    Args:
        error_code: Error code identifier
        message: User-friendly message in Traditional Chinese
        path: API path where error occurred
        details: Additional error details

    Returns:
        Formatted error response dict
    """
    return {
        "error": error_code,
        "message": message,
        "details": details,
        "timestamp": datetime.now().isoformat(),
        "path": path
    }


# Task 13: Bingo Card Endpoints

@router.post(
    "/card",
    response_model=BingoCardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="建立賓果卡",
    description="""
    建立本月的賓果卡

    - 每個使用者每月只能建立一張賓果卡
    - 賓果卡必須包含 1-25 所有數字且不重複
    - 卡片為 5x5 格式
    - 建立後無法修改

    **Requirements:** 2.1, 2.3, 2.5, 7.1
    """,
    responses={
        201: {"description": "賓果卡建立成功"},
        400: {"description": "卡片號碼不符合規則", "model": ErrorResponse},
        409: {"description": "本月已建立賓果卡", "model": ErrorResponse}
    }
)
async def create_bingo_card(
    card_data: BingoCardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> BingoCardResponse:
    """
    建立使用者的賓果卡

    Args:
        card_data: 賓果卡資料（5x5 數字陣列）
        db: 資料庫 session
        current_user: 當前使用者

    Returns:
        BingoCardResponse: 建立的賓果卡資料

    Raises:
        CardAlreadyExistsError: 本月已建立賓果卡
        InvalidCardNumbersError: 卡片號碼不符合規則
    """
    try:
        card_service = BingoCardManagerService(db)

        # Create card for current user
        card = await card_service.create_card(
            user_id=current_user.id,
            numbers=card_data.numbers,
            month_year=None  # Defaults to current month
        )

        # Convert to response
        response = card_service.card_to_response(card)

        logger.info(
            f"Created bingo card for user {current_user.id} - "
            f"card_id: {card.id}, month: {card.month_year.strftime('%Y-%m')}"
        )

        return response

    except CardAlreadyExistsError as e:
        logger.warning(f"Card already exists for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=format_error_response(
                error_code="CARD_ALREADY_EXISTS",
                message=e.message,
                path="/api/v1/bingo/card"
            )
        )

    except InvalidCardNumbersError as e:
        logger.warning(f"Invalid card numbers from user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=format_error_response(
                error_code="INVALID_CARD_NUMBERS",
                message=e.message,
                path="/api/v1/bingo/card"
            )
        )

    except Exception as e:
        logger.error(f"Error creating card for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                error_code="INTERNAL_ERROR",
                message="建立賓果卡時發生錯誤",
                path="/api/v1/bingo/card"
            )
        )


@router.get(
    "/card",
    response_model=BingoCardResponse,
    summary="取得賓果卡",
    description="""
    取得使用者本月的賓果卡

    **Requirements:** 2.1, 2.3
    """,
    responses={
        200: {"description": "成功取得賓果卡"},
        404: {"description": "尚未設定本月賓果卡", "model": ErrorResponse}
    }
)
async def get_bingo_card(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> BingoCardResponse:
    """
    取得使用者的賓果卡

    Args:
        db: 資料庫 session
        current_user: 當前使用者

    Returns:
        BingoCardResponse: 賓果卡資料

    Raises:
        NoCardFoundError: 尚未設定本月賓果卡
    """
    try:
        card_service = BingoCardManagerService(db)

        # Get user's card for current month
        card = await card_service.get_user_card(
            user_id=current_user.id,
            month_year=None  # Current month
        )

        if not card:
            raise NoCardFoundError(user_id=current_user.id)

        response = card_service.card_to_response(card)
        return response

    except NoCardFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=format_error_response(
                error_code="NO_CARD_FOUND",
                message=e.message,
                path="/api/v1/bingo/card"
            )
        )

    except Exception as e:
        logger.error(f"Error getting card for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                error_code="INTERNAL_ERROR",
                message="取得賓果卡時發生錯誤",
                path="/api/v1/bingo/card"
            )
        )


@router.get(
    "/status",
    response_model=BingoStatusResponse,
    summary="取得遊戲狀態",
    description="""
    取得使用者的賓果遊戲狀態摘要

    包含：
    - 是否已設定賓果卡
    - 已領取的號碼
    - 當前連線數
    - 是否已獲得獎勵
    - 今日是否已領取
    - 今日號碼

    **Requirements:** 2.5, 7.1
    """,
    responses={
        200: {"description": "成功取得狀態"}
    }
)
async def get_bingo_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> BingoStatusResponse:
    """
    取得使用者的賓果遊戲狀態

    Args:
        db: 資料庫 session
        current_user: 當前使用者

    Returns:
        BingoStatusResponse: 遊戲狀態摘要
    """
    try:
        claim_service = DailyClaimService(db)
        card_service = BingoCardManagerService(db)

        # Get comprehensive status
        status_data = await claim_service.get_user_status(
            user_id=current_user.id,
            month_year=None  # Current month
        )

        # Format card response if exists
        card_response = None
        if status_data["card"]:
            card_response = card_service.card_to_response(status_data["card"])

        return BingoStatusResponse(
            has_card=status_data["has_card"],
            card=card_response,
            claimed_numbers=status_data["claimed_numbers"],
            line_count=status_data["line_count"],
            has_reward=status_data["has_reward"],
            today_claimed=status_data["today_claimed"],
            daily_number=status_data["daily_number"]
        )

    except Exception as e:
        logger.error(f"Error getting status for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                error_code="INTERNAL_ERROR",
                message="取得遊戲狀態時發生錯誤",
                path="/api/v1/bingo/status"
            )
        )


# Task 14: Daily Claim Endpoint

@router.post(
    "/claim",
    response_model=ClaimResponse,
    summary="領取每日號碼",
    description="""
    領取今日的每日號碼

    - 每天只能領取一次
    - 系統會自動檢測連線狀態
    - 達成三連線時自動發放獎勵
    - 無法領取過期日期的號碼

    **Requirements:** 3.1, 3.3, 3.4, 4.2, 7.4
    """,
    responses={
        200: {"description": "領取成功"},
        404: {
            "description": "賓果卡未找到或今日號碼尚未產生",
            "model": ErrorResponse
        },
        409: {"description": "今日已領取", "model": ErrorResponse},
        400: {"description": "嘗試領取過期號碼", "model": ErrorResponse}
    }
)
async def claim_daily_number(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ClaimResponse:
    """
    領取每日號碼

    Args:
        db: 資料庫 session
        current_user: 當前使用者

    Returns:
        ClaimResponse: 領取結果（包含號碼、連線數、獎勵等）

    Raises:
        NoCardFoundError: 尚未設定賓果卡
        NoDailyNumberError: 今日號碼尚未產生
        AlreadyClaimedError: 今日已領取
        PastDateClaimError: 嘗試領取過期號碼
    """
    try:
        claim_service = DailyClaimService(db)

        # Claim daily number (defaults to today)
        result = await claim_service.claim_daily_number(
            user_id=current_user.id,
            claim_date=None  # Today
        )

        # Convert to response
        response = ClaimResponse(
            success=result.success,
            daily_number=result.daily_number,
            is_on_card=result.is_on_card,
            line_count=result.line_count,
            has_reward=result.has_reward,
            reward=result.reward,
            claimed_at=result.claimed_at.isoformat()
        )

        logger.info(
            f"User {current_user.id} claimed number {result.daily_number} - "
            f"lines: {result.line_count}, reward: {result.has_reward}"
        )

        # ===== Achievement System Integration =====
        # Schedule achievement check as background task if got a new line
        if result.line_count > 0:
            background_tasks.add_task(
                schedule_achievement_check,
                user_id=current_user.id,
                trigger_event='bingo_line',
                event_context={
                    'line_count': result.line_count,
                    'claimed_number': result.daily_number
                }
            )
            logger.debug(
                f"Scheduled achievement check for user {current_user.id} "
                f"after Bingo line completion (lines: {result.line_count})"
            )

        return response

    except NoCardFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=format_error_response(
                error_code="NO_CARD_FOUND",
                message=e.message,
                path="/api/v1/bingo/claim"
            )
        )

    except NoDailyNumberError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=format_error_response(
                error_code="NO_DAILY_NUMBER",
                message=e.message,
                path="/api/v1/bingo/claim"
            )
        )

    except AlreadyClaimedError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=format_error_response(
                error_code="ALREADY_CLAIMED",
                message=e.message,
                path="/api/v1/bingo/claim"
            )
        )

    except PastDateClaimError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=format_error_response(
                error_code="PAST_DATE_CLAIM",
                message=e.message,
                path="/api/v1/bingo/claim"
            )
        )

    except Exception as e:
        logger.error(f"Error claiming number for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                error_code="INTERNAL_ERROR",
                message="領取號碼時發生錯誤",
                path="/api/v1/bingo/claim"
            )
        )


# Task 15: Query Endpoints

@router.get(
    "/daily-number",
    response_model=DailyNumberResponse,
    summary="取得今日號碼",
    description="""
    取得今日系統產生的號碼

    **Requirements:** 1.5
    """,
    responses={
        200: {"description": "成功取得今日號碼"},
        404: {"description": "今日號碼尚未產生", "model": ErrorResponse}
    }
)
async def get_daily_number(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> DailyNumberResponse:
    """
    取得今日的每日號碼

    Args:
        db: 資料庫 session
        current_user: 當前使用者

    Returns:
        DailyNumberResponse: 今日號碼資料

    Raises:
        NoDailyNumberError: 今日號碼尚未產生
    """
    try:
        result = await db.execute(
            select(DailyBingoNumber)
            .where(DailyBingoNumber.date == date.today())
        )
        daily_number = result.scalar_one_or_none()

        if not daily_number:
            raise NoDailyNumberError()

        return DailyNumberResponse(
            id=daily_number.id,
            date=daily_number.date.isoformat(),
            number=daily_number.number,
            cycle_number=daily_number.cycle_number,
            generated_at=daily_number.generated_at.isoformat()
        )

    except NoDailyNumberError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=format_error_response(
                error_code="NO_DAILY_NUMBER",
                message=e.message,
                path="/api/v1/bingo/daily-number"
            )
        )

    except Exception as e:
        logger.error(f"Error getting daily number: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                error_code="INTERNAL_ERROR",
                message="取得今日號碼時發生錯誤",
                path="/api/v1/bingo/daily-number"
            )
        )


@router.get(
    "/lines",
    response_model=LineCheckResult,
    summary="取得連線狀態",
    description="""
    取得使用者的連線狀態

    包含：
    - 連線數量
    - 連線類型（橫、直、斜）
    - 是否達成三連線
    - 是否已發放獎勵

    **Requirements:** 4.5
    """,
    responses={
        200: {"description": "成功取得連線狀態"},
        404: {"description": "賓果卡未找到", "model": ErrorResponse}
    }
)
async def get_line_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> LineCheckResult:
    """
    取得使用者的連線狀態

    Args:
        db: 資料庫 session
        current_user: 當前使用者

    Returns:
        LineCheckResult: 連線檢測結果

    Raises:
        NoCardFoundError: 賓果卡未找到
    """
    try:
        line_service = LineDetectionService(db)
        month_year = date.today().replace(day=1)

        # Check if user has card
        result = await db.execute(
            select(UserBingoCard)
            .where(
                and_(
                    UserBingoCard.user_id == current_user.id,
                    UserBingoCard.month_year == month_year
                )
            )
        )
        card = result.scalar_one_or_none()

        if not card:
            raise NoCardFoundError(user_id=current_user.id)

        # Check lines
        line_count, line_types = await line_service.check_lines(
            user_id=current_user.id,
            month_year=month_year
        )

        # Check if reward issued
        reward_issued = await line_service.has_received_reward(
            user_id=current_user.id,
            month_year=month_year
        )

        return LineCheckResult(
            line_count=line_count,
            line_types=line_types,
            has_three_lines=line_count >= 3,
            reward_issued=reward_issued
        )

    except NoCardFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=format_error_response(
                error_code="NO_CARD_FOUND",
                message=e.message,
                path="/api/v1/bingo/lines"
            )
        )

    except Exception as e:
        logger.error(f"Error getting lines for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                error_code="INTERNAL_ERROR",
                message="取得連線狀態時發生錯誤",
                path="/api/v1/bingo/lines"
            )
        )


@router.get(
    "/history/{month}",
    response_model=BingoHistoryResponse,
    summary="取得歷史記錄",
    description="""
    取得指定月份的賓果遊戲歷史記錄

    - 格式：YYYY-MM (例如: 2025-09)
    - 查詢歷史資料表
    - 包含賓果卡、領取記錄、獎勵資訊

    **Requirements:** 6.5
    """,
    responses={
        200: {"description": "成功取得歷史記錄"},
        400: {"description": "月份格式錯誤", "model": ErrorResponse},
        404: {"description": "該月份無歷史記錄", "model": ErrorResponse}
    }
)
async def get_bingo_history(
    month: str = Path(..., description="月份 (YYYY-MM)", example="2025-09"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> BingoHistoryResponse:
    """
    取得指定月份的歷史記錄

    Args:
        month: 月份字串 (YYYY-MM)
        db: 資料庫 session
        current_user: 當前使用者

    Returns:
        BingoHistoryResponse: 歷史記錄資料

    Raises:
        HTTPException: 月份格式錯誤或無歷史記錄
    """
    try:
        # Parse month string
        try:
            year, month_num = month.split("-")
            month_date = date(int(year), int(month_num), 1)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=format_error_response(
                    error_code="INVALID_MONTH_FORMAT",
                    message=f"月份格式錯誤：{month}，應為 YYYY-MM 格式",
                    path=f"/api/v1/bingo/history/{month}"
                )
            )

        # 智能查詢：先查歷史表，找不到再查當前表
        # 這樣可以處理尚未歸檔的當月資料
        user_id_str = str(current_user.id)

        # Step 1: 嘗試查詢歷史表
        result = await db.execute(
            select(UserBingoCardHistory)
            .where(
                and_(
                    UserBingoCardHistory.user_id == user_id_str,
                    UserBingoCardHistory.month_year == month_date
                )
            )
        )
        card_history = result.scalar_one_or_none()

        # Step 2: 如果歷史表沒有，查詢當前表（處理尚未歸檔的情況）
        card_current = None
        if not card_history:
            result = await db.execute(
                select(UserBingoCard)
                .where(
                    and_(
                        UserBingoCard.user_id == current_user.id,
                        UserBingoCard.month_year == month_date
                    )
                )
            )
            card_current = result.scalar_one_or_none()

        # Step 3: 兩個表都沒有才回傳 404
        if not card_history and not card_current:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=format_error_response(
                    error_code="NO_HISTORY_DATA",
                    message=f"{month} 無記錄",
                    path=f"/api/v1/bingo/history/{month}"
                )
            )

        # 根據資料來源選擇查詢方式
        if card_history:
            # 資料在歷史表
            card_id = card_history.id
            card_data = card_history.card_data

            # 查詢歷史領取記錄
            claim_result = await db.execute(
                select(UserNumberClaimHistory.number)
                .where(
                    and_(
                        UserNumberClaimHistory.user_id == user_id_str,
                        UserNumberClaimHistory.card_id == card_id
                    )
                )
                .order_by(UserNumberClaimHistory.claim_date)
            )
            claimed_numbers = list(claim_result.scalars().all())

            # 查詢歷史獎勵
            reward_result = await db.execute(
                select(BingoRewardHistory)
                .where(
                    and_(
                        BingoRewardHistory.user_id == user_id_str,
                        BingoRewardHistory.month_year == month_date
                    )
                )
            )
            reward_record = reward_result.scalar_one_or_none()

            reward_response = None
            if reward_record:
                reward_response = RewardResponse(
                    id=reward_record.id,
                    user_id=reward_record.user_id,
                    card_id=card_id,
                    month_year=month,
                    line_types=reward_record.line_types,
                    line_count=len(reward_record.line_types),
                    issued_at=reward_record.issued_at_original.isoformat()
                )

        else:
            # 資料在當前表（尚未歸檔）
            card_id = str(card_current.id)
            card_data = card_current.card_data

            # 查詢當前領取記錄
            claim_result = await db.execute(
                select(UserNumberClaim.number)
                .where(
                    and_(
                        UserNumberClaim.user_id == current_user.id,
                        UserNumberClaim.card_id == card_current.id
                    )
                )
                .order_by(UserNumberClaim.claim_date)
            )
            claimed_numbers = list(claim_result.scalars().all())

            # 查詢當前獎勵
            reward_result = await db.execute(
                select(BingoReward)
                .where(
                    and_(
                        BingoReward.user_id == current_user.id,
                        BingoReward.month_year == month_date
                    )
                )
            )
            reward_record = reward_result.scalar_one_or_none()

            reward_response = None
            if reward_record:
                reward_response = RewardResponse(
                    id=str(reward_record.id),
                    user_id=str(reward_record.user_id),
                    card_id=card_id,
                    month_year=month,
                    line_types=reward_record.line_types,
                    line_count=len(reward_record.line_types),
                    issued_at=reward_record.issued_at.isoformat()
                )

        # 計算連線數
        line_service = LineDetectionService(db)
        line_count = line_service.detect_lines_static(
            card_data=card_data,
            claimed_numbers=claimed_numbers
        )

        return BingoHistoryResponse(
            month_year=month,
            card_data=card_data,
            claimed_numbers=claimed_numbers,
            line_count=line_count,
            had_reward=reward_record is not None if 'reward_record' in locals() else False,
            reward=reward_response
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error getting history for user {current_user.id}, month {month}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                error_code="INTERNAL_ERROR",
                message="取得歷史記錄時發生錯誤",
                path=f"/api/v1/bingo/history/{month}"
            )
        )


@router.get(
    "/rewards",
    response_model=List[RewardResponse],
    summary="取得獎勵記錄",
    description="""
    取得使用者所有的獎勵記錄

    包含：
    - 所有月份的三連線獎勵
    - 獎勵發放時間
    - 達成的連線類型

    **Requirements:** 6.5
    """,
    responses={
        200: {"description": "成功取得獎勵記錄"}
    }
)
async def get_rewards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[RewardResponse]:
    """
    取得使用者的所有獎勵記錄

    Args:
        db: 資料庫 session
        current_user: 當前使用者

    Returns:
        List[RewardResponse]: 獎勵記錄列表
    """
    try:
        # Query all rewards for user
        result = await db.execute(
            select(BingoReward)
            .where(BingoReward.user_id == current_user.id)
            .order_by(BingoReward.issued_at.desc())
        )
        rewards = result.scalars().all()

        # Convert to response list
        response_list = []
        for reward in rewards:
            response_list.append(RewardResponse(
                id=reward.id,
                user_id=reward.user_id,
                card_id=reward.card_id,
                month_year=reward.month_year.strftime("%Y-%m"),
                line_types=reward.line_types,
                line_count=reward.get_line_count(),
                issued_at=reward.issued_at.isoformat()
            ))

        return response_list

    except Exception as e:
        logger.error(f"Error getting rewards for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                error_code="INTERNAL_ERROR",
                message="取得獎勵記錄時發生錯誤",
                path="/api/v1/bingo/rewards"
            )
        )
