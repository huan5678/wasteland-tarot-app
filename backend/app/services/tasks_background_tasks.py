"""
Tasks Background Tasks
任務系統背景任務處理：異步任務進度更新
"""

import logging
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.gamification_tasks_service import GamificationTasksService

logger = logging.getLogger(__name__)


async def update_task_progress_background(
    user_id: UUID,
    task_keys: list[str],
    increment: int = 1
) -> None:
    """
    背景任務：更新任務進度

    Args:
        user_id: 用戶 ID
        task_keys: 任務鍵列表（例如：['daily_reading', 'weekly_readings']）
        increment: 進度增量（預設 1）

    Note:
        此函式在背景執行，不會回傳結果給前端
        任務進度更新會在下次使用者查詢時顯示
    """
    from app.db.session import AsyncSessionLocal

    try:
        async with AsyncSessionLocal() as session:
            service = GamificationTasksService()

            for task_key in task_keys:
                try:
                    result = await service.update_task_progress(
                        db=session,
                        user_id=user_id,
                        task_key=task_key,
                        increment=increment
                    )

                    if result.get("is_completed"):
                        logger.info(
                            f"[Background] User {user_id} completed task '{task_key}' "
                            f"(value: {result.get('new_value')})"
                        )
                    else:
                        logger.debug(
                            f"[Background] User {user_id} updated task '{task_key}' "
                            f"progress to {result.get('new_value')}"
                        )

                except ValueError as e:
                    # 任務不存在或其他錯誤，記錄但繼續處理其他任務
                    logger.warning(
                        f"[Background] Failed to update task '{task_key}' for user {user_id}: {e}"
                    )

    except Exception as e:
        # 背景任務失敗不影響主流程，但要記錄錯誤
        logger.error(
            f"[Background] Failed to update task progress for user {user_id}: {e}",
            exc_info=True
        )


# Convenience function for FastAPI BackgroundTasks
async def schedule_task_progress_update(
    user_id: UUID,
    task_keys: list[str],
    increment: int = 1
) -> None:
    """
    FastAPI BackgroundTasks 包裝函式（async 版本）

    Args:
        user_id: 用戶 ID
        task_keys: 任務鍵列表
        increment: 進度增量

    Usage:
        background_tasks.add_task(
            schedule_task_progress_update,
            user_id=current_user.id,
            task_keys=['daily_reading', 'weekly_readings'],
            increment=1
        )
    """
    await update_task_progress_background(
        user_id=user_id,
        task_keys=task_keys,
        increment=increment
    )
