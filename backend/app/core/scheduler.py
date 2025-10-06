"""
APScheduler 排程器配置與管理

需求對應: 需求 8.1, 8.2
Task: Task 9 - 安裝並配置 APScheduler
"""
import logging
from typing import Callable, Optional
import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.triggers.cron import CronTrigger

from app.config import settings

logger = logging.getLogger(__name__)

# 全域排程器實例
_scheduler: Optional[BackgroundScheduler] = None


def get_database_url() -> str:
    """
    取得 PostgreSQL 連接字串

    Returns:
        str: Database URL for APScheduler
    """
    # 使用現有的 database_url，但確保使用同步驅動
    db_url = str(settings.database_url)

    # 轉換 asyncpg 為 psycopg2 (APScheduler 需要同步驅動)
    if 'asyncpg' in db_url:
        db_url = db_url.replace('postgresql+asyncpg', 'postgresql+psycopg2')
    elif 'postgresql://' in db_url and '+' not in db_url:
        db_url = db_url.replace('postgresql://', 'postgresql+psycopg2://')

    return db_url


def initialize_scheduler() -> BackgroundScheduler:
    """
    初始化 APScheduler 排程器

    需求 8.1: 配置 APScheduler 連接 PostgreSQL

    Returns:
        BackgroundScheduler: 配置完成的排程器實例
    """
    # Job store 配置 (使用 PostgreSQL)
    jobstores = {
        'default': SQLAlchemyJobStore(
            url=get_database_url(),
            tablename='apscheduler_jobs'  # 任務儲存表名
        )
    }

    # 執行器配置
    executors = {
        'default': ThreadPoolExecutor(max_workers=10)
    }

    # 任務預設配置
    job_defaults = {
        'coalesce': True,  # 合併錯過的執行
        'max_instances': 1,  # 每個任務同時只允許一個實例
        'misfire_grace_time': 300  # 錯過任務的寬限時間（5分鐘）
    }

    # 建立排程器（使用 Asia/Taipei UTC+8）
    scheduler = BackgroundScheduler(
        jobstores=jobstores,
        executors=executors,
        job_defaults=job_defaults,
        timezone=pytz.timezone('Asia/Taipei')
    )

    logger.info("APScheduler initialized with PostgreSQL jobstore")
    return scheduler


def get_scheduler() -> BackgroundScheduler:
    """
    取得排程器單例實例

    Returns:
        BackgroundScheduler: 排程器實例
    """
    global _scheduler

    if _scheduler is None:
        _scheduler = initialize_scheduler()

    return _scheduler


def register_cron_job(
    scheduler: BackgroundScheduler,
    job_func: Callable,
    job_id: str,
    cron_expression: str,
    **kwargs
) -> str:
    """
    註冊 Cron 定時任務

    需求 8.2: 任務註冊機制

    Args:
        scheduler: APScheduler 實例
        job_func: 要執行的任務函式
        job_id: 任務唯一 ID
        cron_expression: Cron 表達式 (e.g., "0 0 * * *" 為每日午夜)
        **kwargs: 額外的任務配置參數

    Returns:
        str: 已註冊任務的 ID
    """
    # 解析 Cron 表達式
    # 格式: minute hour day month day_of_week
    parts = cron_expression.split()

    if len(parts) != 5:
        raise ValueError(f"Invalid cron expression: {cron_expression}")

    minute, hour, day, month, day_of_week = parts

    # 建立 CronTrigger
    trigger = CronTrigger(
        minute=minute,
        hour=hour,
        day=day,
        month=month,
        day_of_week=day_of_week,
        timezone=pytz.timezone('Asia/Taipei')
    )

    # 註冊任務
    job = scheduler.add_job(
        func=job_func,
        trigger=trigger,
        id=job_id,
        replace_existing=True,  # 替換已存在的同 ID 任務
        **kwargs
    )

    logger.info(f"Registered cron job: {job_id} with schedule: {cron_expression}")
    return job.id


def start_scheduler():
    """
    啟動排程器

    需求 8.1: 排程器生命週期管理
    """
    scheduler = get_scheduler()

    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started successfully")
    else:
        logger.warning("APScheduler is already running")


def shutdown_scheduler(wait: bool = True):
    """
    關閉排程器

    需求 8.1: 排程器生命週期管理

    Args:
        wait: 是否等待所有執行中的任務完成
    """
    global _scheduler

    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=wait)
        logger.info("APScheduler shut down successfully")
        _scheduler = None
    else:
        logger.warning("APScheduler is not running")


def get_job_config(job_name: str) -> dict:
    """
    取得任務配置

    需求 8.4: 任務重試配置

    Args:
        job_name: 任務名稱

    Returns:
        dict: 任務配置字典
    """
    # 預設重試配置
    configs = {
        'daily-number-generation': {
            'retryLimit': 3,
            'retryDelay': 60,  # 60 秒後重試
            'retryBackoff': 2  # 指數退避倍數
        },
        'monthly-reset': {
            'retryLimit': 3,
            'retryDelay': 300,  # 5 分鐘後重試
            'retryBackoff': 2
        },
        'partition-creation': {
            'retryLimit': 2,
            'retryDelay': 120,
            'retryBackoff': 1.5
        }
    }

    return configs.get(job_name, {
        'retryLimit': 3,
        'retryDelay': 60,
        'retryBackoff': 2
    })
