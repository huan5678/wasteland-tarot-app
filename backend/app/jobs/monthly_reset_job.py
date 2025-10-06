"""
每月重置定時任務

需求對應: 需求 5.1, 5.2, 5.3, 5.4, 5.5, 6.5, 8.2
Task: Task 11 - 實作每月重置排程器
Task: Task 12 - 實作自動分區建立任務
"""
import logging
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from app.db.session import get_db
from app.services.monthly_reset_scheduler import MonthlyResetScheduler

logger = logging.getLogger(__name__)


async def _execute_monthly_reset() -> dict:
    """
    執行每月重置（異步版本）

    Returns:
        dict: 重置結果統計

    Raises:
        Exception: 重置失敗時
    """
    async for db in get_db():
        try:
            scheduler = MonthlyResetScheduler(db)

            # 1. 執行每月重置
            result = await scheduler.execute_monthly_reset()

            # 2. 建立下月分區
            partition_created = await scheduler.create_next_month_partition(date.today())
            result['partition_created'] = partition_created

            logger.info(
                f"Monthly reset completed: "
                f"{result['cards_archived']} cards, "
                f"{result['claims_archived']} claims archived, "
                f"partition created: {partition_created}"
            )

            return result

        except Exception as e:
            logger.error(f"Monthly reset failed: {str(e)}", exc_info=True)
            raise
        finally:
            await db.close()


def monthly_reset_job() -> dict:
    """
    每月重置定時任務（同步包裝器）

    需求 5.1: 每月1日 00:00 UTC+8 執行
    需求 8.2: 任務排程
    需求 8.3: 記錄任務執行狀態
    需求 8.4: 錯誤處理與重試

    排程: 每月1日 00:00 UTC+8 (Cron: "0 0 1 * *")

    Returns:
        dict: 重置結果統計

    Note:
        此函式為同步版本，用於 APScheduler 呼叫
        內部使用 asyncio.run() 執行異步操作
    """
    logger.info("Starting monthly reset job")

    try:
        # 執行異步任務
        result = asyncio.run(_execute_monthly_reset())

        logger.info(f"Monthly reset job completed successfully")
        return result

    except Exception as e:
        logger.error(
            f"Monthly reset job failed: {str(e)}",
            exc_info=True
        )
        # 重新拋出異常以觸發 APScheduler 重試機制
        raise


def get_job_metadata() -> dict:
    """
    取得任務元資料

    Returns:
        dict: 任務配置資訊
    """
    return {
        'job_id': 'monthly-reset',
        'name': 'Monthly Bingo Game Reset',
        'cron': '0 0 1 * *',  # 每月1日午夜 00:00
        'description': '每月重置賓果遊戲（歸檔資料、清空狀態、建立分區）',
        'retry_limit': 3,
        'retry_delay': 300,  # 秒（5分鐘）
        'timezone': 'Asia/Taipei'
    }
