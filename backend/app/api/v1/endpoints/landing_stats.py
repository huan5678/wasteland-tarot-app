"""
Landing Stats API Endpoint
提供首頁統計數據的 RESTful API 端點

GET /api/v1/landing-stats - 獲取首頁統計數據（總用戶數、總占卜次數、卡牌數、AI 供應商數）

Requirements: 5.11, 5.14
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.landing_stats import LandingStatsResponse
from app.services.landing_stats_service import LandingStatsService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/landing-stats",
    response_model=LandingStatsResponse,
    summary="Get landing page statistics",
    description="""
    獲取首頁統計數據

    回傳統計資料包含:
    - users: 總註冊使用者數
    - readings: 總占卜次數
    - cards: 卡牌總數（固定 78）
    - providers: AI 供應商數（固定 3）

    此端點不需要認證，供首頁公開顯示使用。
    資料庫查詢失敗時會回傳 fallback 值以確保使用者體驗不中斷。
    """,
    response_description="Landing page statistics",
    tags=["Landing Page"],
)
async def get_landing_stats(
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get landing page statistics

    獲取首頁統計數據端點

    Args:
        db: Database session (injected by FastAPI dependency)

    Returns:
        LandingStatsResponse: 統計數據物件

    Raises:
        None: 此端點不拋出 HTTP 異常，
              資料庫錯誤時會優雅降級至 fallback 值
    """
    try:
        stats = await LandingStatsService.get_landing_stats(db)
        return stats

    except Exception as e:
        # Log unexpected errors
        logger.error(
            f"Unexpected error in landing stats endpoint: {e}",
            exc_info=True,
        )

        # Return fallback values even if service layer fails
        # This ensures API never returns 500 error
        return {
            "users": 1000,
            "readings": 5000,
            "cards": 78,
            "providers": 3,
        }
