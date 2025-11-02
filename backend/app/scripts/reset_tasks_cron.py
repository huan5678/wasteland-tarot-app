#!/usr/bin/env python3
"""
Tasks Reset Cron Job
定時任務重置腳本

使用方法：
1. 每日重置（每天 00:00 UTC+8）：
   python backend/app/scripts/reset_tasks_cron.py --daily

2. 每週重置（每週一 00:00 UTC+8）：
   python backend/app/scripts/reset_tasks_cron.py --weekly

Crontab 設定範例：
# 每日重置（每天 00:00 UTC+8 = 16:00 UTC）
0 16 * * * cd /path/to/project && python backend/app/scripts/reset_tasks_cron.py --daily >> /path/to/project/backend/logs/tasks_reset.log 2>&1

# 每週重置（每週一 00:00 UTC+8 = 週日 16:00 UTC）
0 16 * * 0 cd /path/to/project && python backend/app/scripts/reset_tasks_cron.py --weekly >> /path/to/project/backend/logs/tasks_reset.log 2>&1
"""

import asyncio
import argparse
import sys
import logging
from pathlib import Path
from datetime import datetime

# 添加專案根目錄到 Python path
project_root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(project_root))

from backend.app.db.session import AsyncSessionLocal
from backend.app.services.tasks_reset_service import TasksResetService

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


async def run_daily_reset():
    """執行每日任務重置"""
    logger.info("=" * 60)
    logger.info("Starting Daily Tasks Reset")
    logger.info("=" * 60)

    try:
        async with AsyncSessionLocal() as session:
            result = await TasksResetService.scheduled_daily_reset(session)

            if result["success"]:
                logger.info("Daily reset completed successfully")
                logger.info(f"Daily tasks reset: {result['daily_reset']['reset_count']} records")
                logger.info(f"Old records cleaned: {result['cleanup']['weekly_deleted']} records")
                return True
            else:
                logger.error("Daily reset failed")
                logger.error(f"Error: {result.get('message', 'Unknown error')}")
                return False
    except Exception as e:
        logger.error(f"Exception during daily reset: {e}", exc_info=True)
        return False
    finally:
        logger.info("=" * 60)


async def run_weekly_reset():
    """執行每週任務重置"""
    logger.info("=" * 60)
    logger.info("Starting Weekly Tasks Reset")
    logger.info("=" * 60)

    try:
        async with AsyncSessionLocal() as session:
            result = await TasksResetService.scheduled_weekly_reset(session)

            if result["success"]:
                logger.info("Weekly reset completed successfully")
                logger.info(f"Weekly tasks reset: {result['weekly_reset']['reset_count']} records")
                return True
            else:
                logger.error("Weekly reset failed")
                logger.error(f"Error: {result.get('message', 'Unknown error')}")
                return False
    except Exception as e:
        logger.error(f"Exception during weekly reset: {e}", exc_info=True)
        return False
    finally:
        logger.info("=" * 60)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(description="Reset daily/weekly tasks")
    parser.add_argument(
        '--daily',
        action='store_true',
        help='Run daily tasks reset'
    )
    parser.add_argument(
        '--weekly',
        action='store_true',
        help='Run weekly tasks reset'
    )

    args = parser.parse_args()

    if args.daily:
        success = asyncio.run(run_daily_reset())
        sys.exit(0 if success else 1)
    elif args.weekly:
        success = asyncio.run(run_weekly_reset())
        sys.exit(0 if success else 1)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
