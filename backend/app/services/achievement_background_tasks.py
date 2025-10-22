"""
Achievement Background Tasks
成就系統背景任務處理：異步成就檢查與解鎖
"""

import asyncio
from typing import Dict, Any, Optional
from uuid import UUID
import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.services.achievement_service import AchievementService
from app.core.config import settings

logger = logging.getLogger(__name__)


class AchievementBackgroundTasks:
    """
    成就系統背景任務處理器
    處理耗時的成就檢查操作，避免阻塞主 API
    """

    # Timeout threshold: 如果成就檢查預期超過此時間，改用背景任務
    TIMEOUT_THRESHOLD = 2.0  # seconds

    @staticmethod
    async def check_achievements_in_background(
        user_id: UUID,
        trigger_event: str,
        event_context: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        背景任務：檢查並解鎖使用者成就

        Args:
            user_id: 使用者 ID
            trigger_event: 觸發事件類型
            event_context: 事件上下文資料

        Note:
            此函式在背景執行，不會回傳結果給前端
            解鎖的成就會在下次使用者查詢時顯示
        """
        # Create a new database session for background task
        engine = create_async_engine(
            settings.SQLALCHEMY_DATABASE_URI,
            echo=False,
            pool_pre_ping=True
        )
        async_session_maker = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        try:
            async with async_session_maker() as session:
                achievement_service = AchievementService(session)

                # 執行成就檢查
                newly_unlocked = await achievement_service.unlock_achievements_for_user(
                    user_id=user_id,
                    trigger_event=trigger_event,
                    event_context=event_context
                )

                # 記錄結果
                if newly_unlocked:
                    logger.info(
                        f"[Background] User {user_id} unlocked {len(newly_unlocked)} achievement(s) "
                        f"for event '{trigger_event}'"
                    )
                else:
                    logger.debug(
                        f"[Background] No new achievements unlocked for user {user_id} "
                        f"(event: {trigger_event})"
                    )

        except Exception as e:
            # 背景任務失敗不影響主流程，但要記錄錯誤
            logger.error(
                f"[Background] Failed to check achievements for user {user_id}: {e}",
                exc_info=True
            )
        finally:
            await engine.dispose()

    @staticmethod
    async def check_achievements_with_timeout(
        db: AsyncSession,
        user_id: UUID,
        trigger_event: str,
        event_context: Optional[Dict[str, Any]] = None,
        timeout: float = TIMEOUT_THRESHOLD
    ) -> Optional[list]:
        """
        帶超時檢測的成就檢查

        Args:
            db: 資料庫 session
            user_id: 使用者 ID
            trigger_event: 觸發事件類型
            event_context: 事件上下文資料
            timeout: 超時閾值（秒）

        Returns:
            如果在超時前完成，回傳解鎖的成就列表
            如果超時，回傳 None（任務轉為背景執行）
        """
        achievement_service = AchievementService(db)

        try:
            # 使用 asyncio.wait_for 設定超時
            newly_unlocked = await asyncio.wait_for(
                achievement_service.unlock_achievements_for_user(
                    user_id=user_id,
                    trigger_event=trigger_event,
                    event_context=event_context
                ),
                timeout=timeout
            )

            logger.debug(
                f"Achievement check completed in < {timeout}s for user {user_id}"
            )

            return newly_unlocked

        except asyncio.TimeoutError:
            # 超時，記錄警告
            logger.warning(
                f"Achievement check timeout (>{timeout}s) for user {user_id}, "
                f"task continues in background"
            )

            # 返回 None 表示超時（前端不會收到解鎖通知，需要下次查詢時才會看到）
            return None

        except Exception as e:
            # 其他錯誤，記錄但不中斷主流程
            logger.error(
                f"Achievement check failed for user {user_id}: {e}",
                exc_info=True
            )
            return None


# Convenience function for FastAPI BackgroundTasks
def schedule_achievement_check(
    user_id: UUID,
    trigger_event: str,
    event_context: Optional[Dict[str, Any]] = None
) -> None:
    """
    FastAPI BackgroundTasks 包裝函式（同步版本）

    Args:
        user_id: 使用者 ID
        trigger_event: 觸發事件類型
        event_context: 事件上下文資料

    Usage:
        background_tasks.add_task(
            schedule_achievement_check,
            user_id=current_user.id,
            trigger_event='reading_completed',
            event_context={...}
        )
    """
    # 在背景執行異步任務
    asyncio.create_task(
        AchievementBackgroundTasks.check_achievements_in_background(
            user_id=user_id,
            trigger_event=trigger_event,
            event_context=event_context
        )
    )
