"""
Achievement API Endpoints - 成就系統 API 端點

Endpoints:
- GET /achievements - 獲取所有成就定義
- GET /achievements/progress - 獲取使用者成就進度
- POST /achievements/{code}/claim - 領取成就獎勵
- GET /achievements/summary - 獲取成就總覽統計
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import logging

from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.achievement import (
    AchievementResponse,
    AchievementListResponse,
    UserAchievementProgressResponse,
    UserProgressSummaryResponse,
    ClaimRewardRequest,
    ClaimRewardResponse,
    AchievementErrorResponse,
    AchievementCategory,
    AchievementStatus
)
from app.services.achievement_service import AchievementService

logger = logging.getLogger(__name__)
router = APIRouter()


def format_error_response(
    error_code: str,
    message: str,
    detail: Optional[dict] = None
) -> dict:
    """格式化錯誤回應"""
    return {
        "error": error_code,
        "message": message,
        "detail": detail,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get(
    "",
    response_model=AchievementListResponse,
    summary="獲取所有成就定義",
    description="""
    獲取所有成就定義列表

    - 支援依分類篩選（READING, SOCIAL, BINGO, KARMA, EXPLORATION）
    - 隱藏成就預設不顯示
    - 依 display_order 排序

    **Requirements:** 5.1
    """,
    responses={
        200: {"description": "成功取得成就列表"},
        400: {"description": "無效的分類參數", "model": AchievementErrorResponse}
    }
)
async def get_achievements(
    category: Optional[AchievementCategory] = Query(
        None,
        description="成就類別篩選"
    ),
    db: AsyncSession = Depends(get_db)
) -> AchievementListResponse:
    """
    獲取所有成就定義

    Args:
        category: 成就類別篩選（可選）
        db: 資料庫 session

    Returns:
        AchievementListResponse with achievements list and metadata
    """
    try:
        service = AchievementService(db)
        achievements = await service.get_all_achievements(
            category=category,
            include_hidden=False
        )

        # 轉換為回應格式
        achievement_responses = [
            AchievementResponse(
                id=str(a.id),
                code=a.code,
                name=a.name_zh_tw,
                description=a.description_zh_tw,
                category=a.category,
                rarity=a.rarity,
                icon_name=a.icon_name,
                criteria=a.criteria,
                rewards=a.rewards,
                is_hidden=a.is_hidden,
                display_order=a.display_order,
                created_at=a.created_at.isoformat() if a.created_at else "",
                updated_at=a.updated_at.isoformat() if a.updated_at else ""
            )
            for a in achievements
        ]

        return AchievementListResponse(
            achievements=achievement_responses,
            total=len(achievement_responses),
            category_filter=category
        )

    except Exception as e:
        logger.error(f"Error fetching achievements: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                "INTERNAL_ERROR",
                "獲取成就列表時發生錯誤"
            )
        )


@router.get(
    "/progress",
    response_model=UserProgressSummaryResponse,
    summary="獲取使用者成就進度",
    description="""
    獲取當前使用者的所有成就進度

    - 包含當前進度、目標進度、完成百分比
    - 支援依分類篩選
    - 包含已解鎖、已領取、進行中的成就
    - 隱藏成就在未解鎖前不顯示

    **Requirements:** 5.2
    """,
    responses={
        200: {"description": "成功取得進度資料"},
        401: {"description": "未授權", "model": AchievementErrorResponse}
    }
)
async def get_user_progress(
    category: Optional[AchievementCategory] = Query(
        None,
        description="成就類別篩選"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserProgressSummaryResponse:
    """
    獲取使用者成就進度

    Args:
        category: 成就類別篩選（可選）
        db: 資料庫 session
        current_user: 當前登入使用者

    Returns:
        UserProgressSummaryResponse with progress summary
    """
    try:
        service = AchievementService(db)

        # 獲取使用者進度（包含成就定義）
        progress_data = await service.get_user_progress_with_achievements(
            user_id=current_user.id,
            category=category
        )

        # 獲取總覽統計
        summary = await service.checker.get_user_progress_summary(
            user_id=current_user.id,
            category=category.value if category else None
        )

        # 轉換為回應格式
        progress_responses = []
        for item in progress_data:
            achievement = item['achievement']
            progress = item['progress']

            # 過濾隱藏成就（未解鎖前不顯示）
            if achievement.is_hidden and (
                isinstance(progress, dict) and progress.get('status') == 'IN_PROGRESS'
            ):
                continue

            if isinstance(progress, dict):
                # 臨時進度物件
                progress_responses.append(
                    UserAchievementProgressResponse(
                        id="",
                        user_id=str(current_user.id),
                        achievement_id=str(achievement.id),
                        achievement=AchievementResponse(
                            id=str(achievement.id),
                            code=achievement.code,
                            name=achievement.name_zh_tw,
                            description=achievement.description_zh_tw,
                            category=achievement.category,
                            rarity=achievement.rarity,
                            icon_name=achievement.icon_name,
                            criteria=achievement.criteria,
                            rewards=achievement.rewards,
                            is_hidden=achievement.is_hidden,
                            display_order=achievement.display_order,
                            created_at=achievement.created_at.isoformat() if achievement.created_at else "",
                            updated_at=achievement.updated_at.isoformat() if achievement.updated_at else ""
                        ),
                        current_progress=progress['current_progress'],
                        target_progress=progress['target_progress'],
                        progress_percentage=progress['progress_percentage'],
                        status=progress['status'],
                        unlocked_at=None,
                        claimed_at=None,
                        created_at="",
                        updated_at=""
                    )
                )
            else:
                # 真實進度物件
                progress_responses.append(
                    UserAchievementProgressResponse(
                        id=str(progress.id),
                        user_id=str(progress.user_id),
                        achievement_id=str(progress.achievement_id),
                        achievement=AchievementResponse(
                            id=str(achievement.id),
                            code=achievement.code,
                            name=achievement.name_zh_tw,
                            description=achievement.description_zh_tw,
                            category=achievement.category,
                            rarity=achievement.rarity,
                            icon_name=achievement.icon_name,
                            criteria=achievement.criteria,
                            rewards=achievement.rewards,
                            is_hidden=achievement.is_hidden,
                            display_order=achievement.display_order,
                            created_at=achievement.created_at.isoformat() if achievement.created_at else "",
                            updated_at=achievement.updated_at.isoformat() if achievement.updated_at else ""
                        ),
                        current_progress=progress.current_progress,
                        target_progress=progress.target_progress,
                        progress_percentage=progress.progress_percentage,
                        status=progress.status,
                        unlocked_at=progress.unlocked_at.isoformat() if progress.unlocked_at else None,
                        claimed_at=progress.claimed_at.isoformat() if progress.claimed_at else None,
                        created_at=progress.created_at.isoformat() if progress.created_at else "",
                        updated_at=progress.updated_at.isoformat() if progress.updated_at else ""
                    )
                )

        return UserProgressSummaryResponse(
            user_id=str(current_user.id),
            total_achievements=summary['total_achievements'],
            unlocked_count=summary['unlocked_count'],
            claimed_count=summary['claimed_count'],
            in_progress_count=summary['in_progress_count'],
            completion_percentage=summary['completion_percentage'],
            achievements=progress_responses
        )

    except Exception as e:
        logger.error(f"Error fetching user progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                "INTERNAL_ERROR",
                "獲取使用者進度時發生錯誤"
            )
        )


@router.post(
    "/{code}/claim",
    response_model=ClaimRewardResponse,
    status_code=status.HTTP_200_OK,
    summary="領取成就獎勵",
    description="""
    領取已解鎖成就的獎勵

    - 成就必須已解鎖（UNLOCKED 狀態）
    - 獎勵只能領取一次
    - 自動發放 Karma 點數、稱號等獎勵
    - 更新成就狀態為 CLAIMED

    **Requirements:** 4.4, 4.5
    """,
    responses={
        200: {"description": "獎勵領取成功"},
        400: {"description": "成就尚未解鎖或已領取", "model": AchievementErrorResponse},
        404: {"description": "找不到指定的成就", "model": AchievementErrorResponse},
        401: {"description": "未授權", "model": AchievementErrorResponse},
        500: {"description": "獎勵發放失敗", "model": AchievementErrorResponse}
    }
)
async def claim_achievement_reward(
    code: str = Path(..., description="成就唯一代碼"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ClaimRewardResponse:
    """
    領取成就獎勵

    Args:
        code: 成就代碼
        db: 資料庫 session
        current_user: 當前登入使用者

    Returns:
        ClaimRewardResponse with claim result and rewards
    """
    try:
        service = AchievementService(db)

        # 領取獎勵
        result = await service.claim_reward(
            user_id=current_user.id,
            achievement_code=code
        )

        # 組合成功訊息
        rewards = result['rewards']
        reward_messages = []

        if 'karma_points' in rewards:
            reward_messages.append(f"{rewards['karma_points']} Karma 點數")

        if 'title' in rewards:
            reward_messages.append(f"「{rewards['title']}」稱號")

        message = f"獎勵領取成功！你獲得了 {' 和 '.join(reward_messages)}"

        return ClaimRewardResponse(
            success=True,
            achievement_code=code,
            rewards=rewards,
            message=message,
            claimed_at=result['claimed_at']
        )

    except ValueError as e:
        # 業務邏輯錯誤（尚未解鎖、已領取等）
        error_message = str(e)

        if "找不到成就" in error_message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=format_error_response(
                    "ACHIEVEMENT_NOT_FOUND",
                    error_message,
                    {"achievement_code": code}
                )
            )
        elif "尚未解鎖" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=format_error_response(
                    "ACHIEVEMENT_NOT_UNLOCKED",
                    error_message,
                    {"achievement_code": code}
                )
            )
        elif "已經領取" in error_message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=format_error_response(
                    "ACHIEVEMENT_ALREADY_CLAIMED",
                    error_message,
                    {"achievement_code": code}
                )
            )
        elif "獎勵發放失敗" in error_message:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=format_error_response(
                    "REWARD_DISTRIBUTION_FAILED",
                    error_message,
                    {"achievement_code": code}
                )
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=format_error_response(
                    "CLAIM_ERROR",
                    error_message,
                    {"achievement_code": code}
                )
            )

    except Exception as e:
        logger.error(f"Error claiming achievement reward: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                "INTERNAL_ERROR",
                "領取獎勵時發生錯誤",
                {"achievement_code": code}
            )
        )


@router.get(
    "/summary",
    response_model=dict,
    summary="獲取成就總覽統計",
    description="""
    獲取使用者成就的總覽統計資訊

    - 總成就數量
    - 已解鎖/已領取/進行中數量
    - 完成百分比
    - 各分類的完成情況

    **Requirements:** 5.1
    """
)
async def get_achievement_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    獲取成就總覽統計

    Args:
        db: 資料庫 session
        current_user: 當前登入使用者

    Returns:
        Dict with summary statistics
    """
    try:
        service = AchievementService(db)

        # 總覽
        overall_summary = await service.checker.get_user_progress_summary(
            user_id=current_user.id
        )

        # 各分類統計
        categories_summary = {}
        for category in AchievementCategory:
            cat_summary = await service.checker.get_user_progress_summary(
                user_id=current_user.id,
                category=category.value
            )
            categories_summary[category.value] = {
                'total': cat_summary['total_achievements'],
                'unlocked': cat_summary['unlocked_count'],
                'claimed': cat_summary['claimed_count'],
                'completion_percentage': cat_summary['completion_percentage']
            }

        return {
            'user_id': str(current_user.id),
            'overall': overall_summary,
            'by_category': categories_summary
        }

    except Exception as e:
        logger.error(f"Error fetching achievement summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error_response(
                "INTERNAL_ERROR",
                "獲取成就總覽時發生錯誤"
            )
        )
