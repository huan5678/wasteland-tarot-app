"""
Tasks Reset Service
每日/每週任務重置服務，用於定時任務（Cron Job）
"""

import logging
from datetime import datetime, timedelta, date
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.gamification import (
    UserDailyTask,
    UserWeeklyTask
)
from app.services.gamification_tasks_service import get_week_start

logger = logging.getLogger(__name__)


class TasksResetService:
    """
    任務重置服務
    處理每日/每週任務的重置與舊記錄清理
    """

    @staticmethod
    async def reset_daily_tasks(db: AsyncSession) -> dict:
        """
        重置所有用戶的每日任務

        刪除所有用戶的每日任務進度記錄，使其在下次訪問時自動重建。

        Args:
            db: 資料庫 session

        Returns:
            dict: {
                "success": bool,
                "reset_count": int,
                "message": str
            }
        """
        try:
            # 刪除所有用戶每日任務記錄
            result = await db.execute(delete(UserDailyTask))
            reset_count = result.rowcount

            await db.commit()

            logger.info(f"[Reset] Successfully reset {reset_count} daily task records")

            return {
                "success": True,
                "reset_count": reset_count,
                "message": f"Successfully reset {reset_count} daily tasks"
            }

        except Exception as e:
            await db.rollback()
            logger.error(f"[Reset] Failed to reset daily tasks: {e}", exc_info=True)
            return {
                "success": False,
                "reset_count": 0,
                "message": f"Failed to reset daily tasks: {str(e)}"
            }

    @staticmethod
    async def reset_weekly_tasks(db: AsyncSession) -> dict:
        """
        重置所有用戶的每週任務

        刪除非本週的所有用戶每週任務進度記錄。

        Args:
            db: 資料庫 session

        Returns:
            dict: {
                "success": bool,
                "reset_count": int,
                "message": str
            }
        """
        try:
            # 獲取當前週一日期
            current_week_start = get_week_start()

            # 刪除非本週的每週任務記錄
            result = await db.execute(
                delete(UserWeeklyTask).where(UserWeeklyTask.week_start < current_week_start)
            )
            reset_count = result.rowcount

            await db.commit()

            logger.info(
                f"[Reset] Successfully reset {reset_count} weekly task records "
                f"(before {current_week_start})"
            )

            return {
                "success": True,
                "reset_count": reset_count,
                "message": f"Successfully reset {reset_count} weekly tasks"
            }

        except Exception as e:
            await db.rollback()
            logger.error(f"[Reset] Failed to reset weekly tasks: {e}", exc_info=True)
            return {
                "success": False,
                "reset_count": 0,
                "message": f"Failed to reset weekly tasks: {str(e)}"
            }

    @staticmethod
    async def cleanup_old_task_records(db: AsyncSession, retention_days: int = 7) -> dict:
        """
        清理舊的任務記錄

        刪除超過保留天數的用戶任務記錄。

        Args:
            db: 資料庫 session
            retention_days: 保留天數（預設 7 天）

        Returns:
            dict: {
                "success": bool,
                "daily_deleted": int,
                "weekly_deleted": int,
                "message": str
            }
        """
        try:
            # 計算截止日期（UTC+8）
            tz = ZoneInfo("Asia/Taipei")
            cutoff_date = datetime.now(tz).date() - timedelta(days=retention_days)

            # 刪除舊的每日任務記錄
            # 注意：UserDailyTask 沒有 created_at 欄位，所以我們只能刪除所有已領取的舊記錄
            # 實際上，每日任務每天都會重置，所以不需要特別清理

            # 刪除舊的每週任務記錄（超過 retention_days 的週）
            cutoff_week_start = cutoff_date - timedelta(days=cutoff_date.weekday())

            result = await db.execute(
                delete(UserWeeklyTask).where(UserWeeklyTask.week_start < cutoff_week_start)
            )
            weekly_deleted = result.rowcount

            await db.commit()

            logger.info(
                f"[Cleanup] Deleted {weekly_deleted} old weekly task records "
                f"(before {cutoff_week_start})"
            )

            return {
                "success": True,
                "daily_deleted": 0,  # 每日任務每天重置，不需要清理
                "weekly_deleted": weekly_deleted,
                "message": f"Successfully cleaned up {weekly_deleted} old task records"
            }

        except Exception as e:
            await db.rollback()
            logger.error(f"[Cleanup] Failed to cleanup old task records: {e}", exc_info=True)
            return {
                "success": False,
                "daily_deleted": 0,
                "weekly_deleted": 0,
                "message": f"Failed to cleanup: {str(e)}"
            }

    @staticmethod
    async def scheduled_daily_reset(db: AsyncSession) -> dict:
        """
        定時每日重置任務（適用於 Cron Job）

        執行：
        1. 重置每日任務
        2. 清理舊的任務記錄

        Args:
            db: 資料庫 session

        Returns:
            dict: 操作結果摘要
        """
        logger.info("[Cron] Starting scheduled daily reset...")

        # 1. 重置每日任務
        daily_result = await TasksResetService.reset_daily_tasks(db)

        # 2. 清理舊記錄
        cleanup_result = await TasksResetService.cleanup_old_task_records(db)

        logger.info("[Cron] Scheduled daily reset completed")

        return {
            "success": daily_result["success"] and cleanup_result["success"],
            "daily_reset": daily_result,
            "cleanup": cleanup_result
        }

    @staticmethod
    async def scheduled_weekly_reset(db: AsyncSession) -> dict:
        """
        定時每週重置任務（適用於 Cron Job）

        執行：
        1. 重置每週任務

        Args:
            db: 資料庫 session

        Returns:
            dict: 操作結果摘要
        """
        logger.info("[Cron] Starting scheduled weekly reset...")

        # 重置每週任務
        weekly_result = await TasksResetService.reset_weekly_tasks(db)

        logger.info("[Cron] Scheduled weekly reset completed")

        return {
            "success": weekly_result["success"],
            "weekly_reset": weekly_result
        }
