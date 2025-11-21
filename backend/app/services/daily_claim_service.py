"""
Daily Claim Service - 每日號碼領取服務
Handles daily number claiming with automatic line detection and reward issuance
"""

from typing import Optional, Tuple, Dict, Any, List
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.exc import IntegrityError
import logging

from app.models.bingo import (
    UserBingoCard,
    DailyBingoNumber,
    UserNumberClaim,
    BingoReward
)
from app.schemas.bingo import ClaimResult
from app.utils.date_helpers import get_month_start
from app.core.exceptions import (
    NoCardFoundError,
    AlreadyClaimedError,
    NoDailyNumberError,
    PastDateClaimError
)
from app.services.line_detection_service import LineDetectionService

logger = logging.getLogger(__name__)


class DailyClaimService:
    """
    每日領取服務

    功能：
    1. 處理使用者每日號碼領取
    2. 自動檢測連線狀態
    3. 達成三連線時自動發放獎勵
    """

    def __init__(
        self,
        db_session: AsyncSession,
        line_detection_service: Optional[LineDetectionService] = None
    ):
        """
        初始化每日領取服務

        Args:
            db_session: 資料庫 session
            line_detection_service: 連線檢測服務（可選，預設自動建立）
        """
        self.db = db_session
        self.line_detection_service = line_detection_service or LineDetectionService(db_session)

    async def claim_daily_number(
        self,
        user_id: str,
        claim_date: Optional[date] = None
    ) -> ClaimResult:
        """
        領取每日號碼

        Args:
            user_id: 使用者 ID
            claim_date: 領取日期（預設為今天）

        Returns:
            ClaimResult: 領取結果，包含號碼、連線數、是否獲得獎勵等資訊

        Raises:
            NoCardFoundError: 使用者無賓果卡
            AlreadyClaimedError: 今日已領取
            NoDailyNumberError: 今日號碼尚未產生
            PastDateClaimError: 嘗試領取過期日期

        Business Logic:
            1. 驗證領取日期（不能是過去日期，除非是今天）
            2. 檢查每日號碼是否存在
            3. 檢查使用者賓果卡是否存在
            4. 檢查是否已領取過
            5. 建立領取記錄
            6. 檢測連線狀態
            7. 如果達成三連線，自動發放獎勵
        """
        if claim_date is None:
            claim_date = date.today()

        # 驗證日期（禁止領取未來日期和過去日期，但今天可以）
        today = date.today()
        if claim_date > today:
            raise PastDateClaimError(claim_date.isoformat())

        # 如果不是今天，則不允許領取
        if claim_date < today:
            raise PastDateClaimError(claim_date.isoformat())

        # 取得當月月份
        month_year = get_month_start(claim_date)

        # 1. 檢查每日號碼是否存在
        daily_number = await self._get_daily_number(claim_date)
        if not daily_number:
            raise NoDailyNumberError(claim_date.isoformat())

        # 2. 檢查使用者賓果卡
        card = await self._get_user_card(user_id, month_year)
        if not card:
            raise NoCardFoundError(user_id=user_id, month=month_year.strftime('%Y-%m'))

        # 3. 檢查是否已領取
        if await self.has_claimed_today(user_id, claim_date):
            raise AlreadyClaimedError(claim_date.isoformat())

        # 4. 建立領取記錄
        claim = UserNumberClaim(
            user_id=user_id,
            card_id=card.id,
            daily_number_id=daily_number.id,
            claim_date=claim_date,
            number=daily_number.number,
            claimed_at=datetime.now()
        )

        try:
            self.db.add(claim)
            await self.db.commit()
            await self.db.refresh(claim)
        except IntegrityError as e:
            await self.db.rollback()
            # UNIQUE 約束違反（user_id, claim_date）
            logger.warning(
                f"Integrity error when claiming for user {user_id} on {claim_date}: {e}"
            )
            raise AlreadyClaimedError(claim_date.isoformat())

        logger.info(
            f"User {user_id} claimed number {daily_number.number} on {claim_date}"
        )

        # 5. 檢查號碼是否在賓果卡上
        is_on_card = daily_number.number in card.get_card_numbers()

        # 6. 檢測連線狀態
        line_count, line_types = await self.line_detection_service.check_lines(
            user_id, month_year
        )

        logger.info(
            f"User {user_id} line status: {line_count} lines - {line_types}"
        )

        # 7. 如果達成三連線，自動發放獎勵
        reward_data = None
        has_reward = False

        if line_count >= 3:
            # 嘗試發放獎勵
            reward = await self.line_detection_service.issue_reward(
                user_id=user_id,
                card_id=card.id,
                month_year=month_year,
                line_types=line_types
            )

            if reward:
                has_reward = True
                reward_data = {
                    "id": reward.id,
                    "type": "THREE_LINES",
                    "issued_at": reward.issued_at.isoformat()
                }
                logger.info(
                    f"Issued three-line reward to user {user_id} for {month_year.strftime('%Y-%m')}"
                )
            else:
                # 已領取過獎勵
                existing_reward = await self.line_detection_service.get_user_reward(
                    user_id, month_year
                )
                if existing_reward:
                    has_reward = True
                    reward_data = {
                        "id": existing_reward.id,
                        "type": "THREE_LINES",
                        "issued_at": existing_reward.issued_at.isoformat()
                    }

        # 8. 建立回應結果
        result = ClaimResult(
            success=True,
            daily_number=daily_number.number,
            is_on_card=is_on_card,
            line_count=line_count,
            has_reward=has_reward,
            reward=reward_data,
            claimed_at=claim.claimed_at
        )

        return result

    async def has_claimed_today(
        self,
        user_id: str,
        claim_date: Optional[date] = None
    ) -> bool:
        """
        檢查使用者是否已領取指定日期的號碼

        Args:
            user_id: 使用者 ID
            claim_date: 日期（預設為今天）

        Returns:
            True 表示已領取，False 表示未領取
        """
        if claim_date is None:
            claim_date = date.today()

        result = await self.db.execute(
            select(func.count(UserNumberClaim.id))
            .where(
                and_(
                    UserNumberClaim.user_id == user_id,
                    UserNumberClaim.claim_date == claim_date
                )
            )
        )

        count = result.scalar()
        return count > 0

    async def get_claimed_numbers(
        self,
        user_id: str,
        month_year: Optional[date] = None
    ) -> List[int]:
        """
        取得使用者指定月份已領取的所有號碼

        Args:
            user_id: 使用者 ID
            month_year: 月份（預設為當月）

        Returns:
            已領取號碼列表
        """
        month_year = get_month_start(month_year)

        # 取得使用者賓果卡
        card = await self._get_user_card(user_id, month_year)
        if not card:
            return []

        # 查詢已領取號碼
        result = await self.db.execute(
            select(UserNumberClaim.number)
            .where(
                and_(
                    UserNumberClaim.user_id == user_id,
                    UserNumberClaim.card_id == card.id
                )
            )
            .order_by(UserNumberClaim.claim_date)
        )

        return list(result.scalars().all())

    async def get_claim_history(
        self,
        user_id: str,
        month_year: Optional[date] = None
    ) -> List[UserNumberClaim]:
        """
        取得使用者指定月份的領取歷史記錄

        Args:
            user_id: 使用者 ID
            month_year: 月份（預設為當月）

        Returns:
            領取記錄列表
        """
        month_year = get_month_start(month_year)

        # 取得使用者賓果卡
        card = await self._get_user_card(user_id, month_year)
        if not card:
            return []

        result = await self.db.execute(
            select(UserNumberClaim)
            .where(
                and_(
                    UserNumberClaim.user_id == user_id,
                    UserNumberClaim.card_id == card.id
                )
            )
            .order_by(UserNumberClaim.claim_date)
        )

        return list(result.scalars().all())

    async def get_user_status(
        self,
        user_id: str,
        month_year: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        取得使用者賓果遊戲狀態摘要

        Args:
            user_id: 使用者 ID
            month_year: 月份（預設為當月）

        Returns:
            狀態摘要字典
        """
        month_year = get_month_start(month_year)

        # 檢查賓果卡
        card = await self._get_user_card(user_id, month_year)
        has_card = card is not None

        # 已領取號碼
        claimed_numbers = await self.get_claimed_numbers(user_id, month_year) if has_card else []

        # 連線數
        line_count = 0
        if has_card:
            line_count, _ = await self.line_detection_service.check_lines(
                user_id, month_year
            )

        # 檢查獎勵
        has_reward = False
        if has_card:
            has_reward = await self.line_detection_service.has_received_reward(
                user_id, month_year
            )

        # 今日領取狀態
        today_claimed = await self.has_claimed_today(user_id, date.today())

        # 今日號碼
        today_number = None
        daily_number = await self._get_daily_number(date.today())
        if daily_number:
            today_number = daily_number.number

        return {
            "has_card": has_card,
            "card": card,
            "claimed_numbers": claimed_numbers,
            "line_count": line_count,
            "has_reward": has_reward,
            "today_claimed": today_claimed,
            "daily_number": today_number
        }

    # Private helper methods

    async def _get_daily_number(self, target_date: date) -> Optional[DailyBingoNumber]:
        """取得指定日期的每日號碼"""
        result = await self.db.execute(
            select(DailyBingoNumber)
            .where(DailyBingoNumber.date == target_date)
        )
        return result.scalar_one_or_none()

    async def _get_user_card(
        self,
        user_id: str,
        month_year: date
    ) -> Optional[UserBingoCard]:
        """取得使用者指定月份的賓果卡"""
        month_year = get_month_start(month_year)

        result = await self.db.execute(
            select(UserBingoCard)
            .where(
                and_(
                    UserBingoCard.user_id == user_id,
                    UserBingoCard.month_year == month_year
                )
            )
        )
        return result.scalar_one_or_none()
