"""
每日賓果號碼生成定時任務

需求對應: 需求 1.1, 1.4, 8.1, 8.3, 8.4
Task: Task 10 - 實作每日號碼生成定時任務
"""
import logging
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from app.db.session import get_db
from app.services.daily_number_generator_service import DailyNumberGeneratorService

logger = logging.getLogger(__name__)


async def _execute_daily_number_generation() -> int:
    """
    執行每日號碼生成（異步版本）

    Returns:
        int: 生成的號碼

    Raises:
        Exception: 號碼生成失敗時
    """
    async for db in get_db():
        try:
            service = DailyNumberGeneratorService(db)
            daily_number = await service.generate_daily_number(date.today())

            logger.info(
                f"Daily number generation completed: {daily_number.number} "
                f"(cycle: {daily_number.cycle_number})"
            )

            return daily_number.number

        except Exception as e:
            logger.error(f"Daily number generation failed: {str(e)}", exc_info=True)
            raise
        finally:
            await db.close()


def daily_number_generation_job() -> int:
    """
    每日號碼生成定時任務（同步包裝器）

    需求 1.4: 每日 00:00 UTC+8 執行
    需求 8.3: 記錄任務執行狀態
    需求 8.4: 錯誤處理與重試

    排程: 每日 00:00 UTC+8 (Cron: "0 0 * * *")

    Returns:
        int: 生成的號碼

    Note:
        此函式為同步版本，用於 APScheduler 呼叫
        內部使用 asyncio.run() 執行異步操作
    """
    logger.info("Starting daily number generation job")

    try:
        # 執行異步任務
        number = asyncio.run(_execute_daily_number_generation())

        logger.info(f"Daily number generation job completed successfully: {number}")
        return number

    except Exception as e:
        logger.error(
            f"Daily number generation job failed: {str(e)}",
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
        'job_id': 'daily-number-generation',
        'name': 'Daily Bingo Number Generation',
        'cron': '0 0 * * *',  # 每日午夜 00:00
        'description': '每日自動產生賓果號碼（1-25 循環）',
        'retry_limit': 3,
        'retry_delay': 60,  # 秒
        'timezone': 'Asia/Taipei'
    }
