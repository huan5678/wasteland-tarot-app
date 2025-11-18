"""
Landing Stats Service
業務邏輯層：統計數據查詢

提供首頁統計數據服務，包括總用戶數、總占卜次數、卡牌數和 AI 供應商數。
實作錯誤處理和 fallback 機制，確保 API 穩定性。
"""

import logging
from typing import Dict, Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError

from app.models.user import User
from app.models.reading_session import ReadingSession

# Configure logger
logger = logging.getLogger(__name__)


class LandingStatsService:
    """
    Landing page statistics service
    首頁統計數據服務

    提供首頁統計數據查詢，包含:
    - 總用戶數 (從 users 表查詢)
    - 總占卜次數 (從 reading_sessions 表查詢)
    - 卡牌總數 (固定值 78)
    - AI 供應商數 (固定值 3)
    """

    # Fallback values for graceful degradation
    FALLBACK_USERS = 1000
    FALLBACK_READINGS = 5000
    FALLBACK_CARDS = 78
    FALLBACK_PROVIDERS = 3

    @staticmethod
    async def get_landing_stats(db: AsyncSession) -> Dict[str, Any]:
        """
        獲取首頁統計數據

        執行資料庫 COUNT 查詢以獲取總用戶數和總占卜次數。
        如果資料庫查詢失敗，回傳預設的 fallback 值，確保 API 不會中斷服務。

        Args:
            db: Database session (SQLAlchemy AsyncSession)

        Returns:
            統計數據字典:
            - users: 總用戶數 (int, >= 0)
            - readings: 總占卜次數 (int, >= 0)
            - cards: 卡牌總數 (int, 固定 78)
            - providers: AI 供應商數 (int, 固定 3)

        Raises:
            None - All exceptions are caught and fallback values are returned

        Example:
            >>> from sqlalchemy.ext.asyncio import AsyncSession
            >>> stats = await LandingStatsService.get_landing_stats(db_session)
            >>> print(stats)
            {'users': 1234, 'readings': 5678, 'cards': 78, 'providers': 3}
        """
        try:
            # Query total users from users table
            users_result = await db.execute(select(func.count(User.id)))
            users_count = users_result.scalar()

            # Query total readings from reading_sessions table
            readings_result = await db.execute(select(func.count(ReadingSession.id)))
            readings_count = readings_result.scalar()

            # Static product constants (不會改變的產品常數)
            cards_count = 78  # 22 Major Arcana + 56 Minor Arcana
            providers_count = 3  # Anthropic Claude, OpenAI GPT, Google Gemini

            # Ensure non-None values (scalar() can return None if table is empty)
            return {
                "users": users_count or 0,
                "readings": readings_count or 0,
                "cards": cards_count,
                "providers": providers_count
            }

        except SQLAlchemyError as e:
            # Log database errors for monitoring and debugging
            logger.error(
                f"SQLAlchemy error fetching landing stats: {e}",
                exc_info=True,
                extra={"error_type": "database_query_failed"}
            )

            # Return fallback values to ensure graceful degradation
            return {
                "users": LandingStatsService.FALLBACK_USERS,
                "readings": LandingStatsService.FALLBACK_READINGS,
                "cards": LandingStatsService.FALLBACK_CARDS,
                "providers": LandingStatsService.FALLBACK_PROVIDERS
            }

        except Exception as e:
            # Catch all other unexpected exceptions
            logger.error(
                f"Unexpected error fetching landing stats: {e}",
                exc_info=True,
                extra={"error_type": "unexpected_error"}
            )

            # Return fallback values for any unexpected errors
            return {
                "users": LandingStatsService.FALLBACK_USERS,
                "readings": LandingStatsService.FALLBACK_READINGS,
                "cards": LandingStatsService.FALLBACK_CARDS,
                "providers": LandingStatsService.FALLBACK_PROVIDERS
            }


# Convenience function for backward compatibility
async def get_landing_stats(db: AsyncSession) -> Dict[str, Any]:
    """
    Async wrapper for LandingStatsService.get_landing_stats

    提供 async/await 語法支援的便利函數。
    實際上呼叫 LandingStatsService.get_landing_stats 方法。

    Args:
        db: Database session

    Returns:
        Statistics dictionary with keys: users, readings, cards, providers
    """
    return await LandingStatsService.get_landing_stats(db)
