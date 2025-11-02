"""
Seed data for Dashboard Gamification System - Tasks
載入每日任務和每週任務的初始定義
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import engine, AsyncSessionLocal


# Daily Tasks Initial Data (每日任務定義)
DAILY_TASKS_DATA = [
    {
        "task_key": "daily_reading",
        "name": "完成 1 次占卜",
        "description": "進行一次塔羅占卜解讀",
        "target_value": 1,
        "karma_reward": 20,
        "display_order": 1,
        "is_active": True
    },
    {
        "task_key": "daily_login",
        "name": "每日登入",
        "description": "登入 Pip-Boy 終端機",
        "target_value": 1,
        "karma_reward": 20,
        "display_order": 2,
        "is_active": True
    },
    {
        "task_key": "daily_share",
        "name": "分享 1 次解讀",
        "description": "將占卜結果分享到社交平台",
        "target_value": 1,
        "karma_reward": 20,
        "display_order": 3,
        "is_active": True
    }
]

# Weekly Tasks Initial Data (每週任務定義)
WEEKLY_TASKS_DATA = [
    {
        "task_key": "weekly_readings",
        "name": "完成 5 次占卜",
        "description": "進行 5 次塔羅占卜",
        "target_value": 5,
        "karma_reward": 50,
        "display_order": 1,
        "is_active": True
    },
    {
        "task_key": "weekly_streak",
        "name": "連續登入 3 天",
        "description": "連續 3 天登入系統",
        "target_value": 3,
        "karma_reward": 50,
        "display_order": 2,
        "is_active": True
    },
    {
        "task_key": "weekly_collection",
        "name": "收集 10 張卡牌",
        "description": "在占卜中抽到 10 張不同的卡牌",
        "target_value": 10,
        "karma_reward": 50,
        "display_order": 3,
        "is_active": True
    },
    {
        "task_key": "weekly_social",
        "name": "獲得 3 個讚",
        "description": "分享的解讀獲得 3 個讚",
        "target_value": 3,
        "karma_reward": 50,
        "display_order": 4,
        "is_active": True
    },
    {
        "task_key": "weekly_daily_complete",
        "name": "完成每日任務 3 次",
        "description": "完成 3 天的所有每日任務",
        "target_value": 3,
        "karma_reward": 50,
        "display_order": 5,
        "is_active": True
    }
]


async def seed_daily_tasks(db: AsyncSession) -> None:
    """Seed daily tasks definitions."""
    print("🔧 載入每日任務定義...")

    for task_data in DAILY_TASKS_DATA:
        # Check if task already exists
        result = await db.execute(
            select(DailyTask).where(DailyTask.task_key == task_data["task_key"])
        )
        existing_task = result.scalar_one_or_none()

        if existing_task:
            print(f"  ⏭️  已存在: {task_data['name']} ({task_data['task_key']})")
            # Update existing task (in case of changes)
            for key, value in task_data.items():
                setattr(existing_task, key, value)
        else:
            print(f"  ✅ 新增: {task_data['name']} ({task_data['task_key']})")
            db.add(DailyTask(**task_data))

    await db.commit()
    print(f"✅ 每日任務定義載入完成 ({len(DAILY_TASKS_DATA)} 個任務)")


async def seed_weekly_tasks(db: AsyncSession) -> None:
    """Seed weekly tasks definitions."""
    print("🔧 載入每週任務定義...")

    for task_data in WEEKLY_TASKS_DATA:
        # Check if task already exists
        result = await db.execute(
            select(WeeklyTask).where(WeeklyTask.task_key == task_data["task_key"])
        )
        existing_task = result.scalar_one_or_none()

        if existing_task:
            print(f"  ⏭️  已存在: {task_data['name']} ({task_data['task_key']})")
            # Update existing task (in case of changes)
            for key, value in task_data.items():
                setattr(existing_task, key, value)
        else:
            print(f"  ✅ 新增: {task_data['name']} ({task_data['task_key']})")
            db.add(WeeklyTask(**task_data))

    await db.commit()
    print(f"✅ 每週任務定義載入完成 ({len(WEEKLY_TASKS_DATA)} 個任務)")


async def seed_all_tasks() -> None:
    """Main function to seed all gamification tasks."""
    print("=" * 60)
    print("Dashboard Gamification System - Tasks Seed Data")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        try:
            await seed_daily_tasks(db)
            print()
            await seed_weekly_tasks(db)

            print()
            print("=" * 60)
            print("✅ 所有任務定義載入完成！")
            print("=" * 60)
            print()
            print("摘要:")
            print(f"  • 每日任務: {len(DAILY_TASKS_DATA)} 個")
            print(f"  • 每週任務: {len(WEEKLY_TASKS_DATA)} 個")
            print(f"  • 總計: {len(DAILY_TASKS_DATA) + len(WEEKLY_TASKS_DATA)} 個任務定義")
            print()

        except Exception as e:
            print(f"❌ 錯誤: {str(e)}")
            await db.rollback()
            raise


# Import models after engine is defined
from app.models.gamification import DailyTask, WeeklyTask


if __name__ == "__main__":
    asyncio.run(seed_all_tasks())
