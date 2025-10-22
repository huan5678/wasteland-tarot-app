"""
Achievement Backfill Script - 歷史資料回溯
為現有使用者初始化成就進度並自動解鎖已達成的成就

Usage:
    python scripts/backfill_user_achievements.py
    python scripts/backfill_user_achievements.py --dry-run  # 僅測試不實際寫入
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime
from uuid import UUID
from typing import List, Dict, Any

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.models.user import User
from app.models.achievement import Achievement, UserAchievementProgress
from app.services.achievement_checker import AchievementChecker


async def get_all_users(db: AsyncSession) -> List[User]:
    """取得所有使用者"""
    result = await db.execute(select(User))
    return list(result.scalars().all())


async def get_all_achievements(db: AsyncSession) -> List[Achievement]:
    """取得所有成就定義"""
    result = await db.execute(
        select(Achievement)
        .where(Achievement.is_active == True)
        .order_by(Achievement.display_order)
    )
    return list(result.scalars().all())


async def get_existing_progress(db: AsyncSession, user_id: UUID) -> set:
    """取得使用者已存在的成就進度記錄（achievement_id集合）"""
    result = await db.execute(
        select(UserAchievementProgress.achievement_id)
        .where(UserAchievementProgress.user_id == user_id)
    )
    return set(result.scalars().all())


async def backfill_user_achievements(db: AsyncSession, dry_run: bool = False):
    """
    主要回溯邏輯

    Args:
        db: 資料庫 session
        dry_run: 如果為 True，只計算不實際寫入資料庫
    """
    print("📊 Starting achievement backfill...")

    # 取得所有使用者和成就
    users = await get_all_users(db)
    achievements = await get_all_achievements(db)

    total_users = len(users)
    total_achievements = len(achievements)

    print(f"   Total users: {total_users}")
    print(f"   Total achievements: {total_achievements}")
    print()

    if dry_run:
        print("🧪 DRY RUN MODE - No data will be written")
        print()

    # 統計數據
    stats = {
        'users_processed': 0,
        'progress_created': 0,
        'achievements_unlocked': 0,
        'errors': 0,
    }

    # AchievementChecker 實例
    checker = AchievementChecker(db)

    print("Processing users:")

    # 處理每個使用者
    for i, user in enumerate(users, 1):
        try:
            # 顯示進度條
            progress_pct = (i / total_users) * 100
            progress_bar = '█' * int(progress_pct / 5) + '░' * (20 - int(progress_pct / 5))
            print(f"\r[{progress_bar}] {i}/{total_users} ({progress_pct:.0f}%)", end='', flush=True)

            # 取得使用者已存在的成就進度
            existing_achievement_ids = await get_existing_progress(db, user.id)

            # 為每個成就初始化進度
            for achievement in achievements:
                # 如果已存在，跳過
                if achievement.id in existing_achievement_ids:
                    continue

                # 計算當前進度
                current_progress = await checker.calculate_progress(
                    user_id=user.id,
                    criteria=achievement.criteria
                )

                target_progress = achievement.criteria.get('target', 1)

                # 判斷是否已達成
                is_unlocked = current_progress >= target_progress

                # 建立進度記錄
                if not dry_run:
                    progress_record = UserAchievementProgress(
                        user_id=user.id,
                        achievement_id=achievement.id,
                        current_progress=current_progress,
                        target_progress=target_progress,
                        status='UNLOCKED' if is_unlocked else 'IN_PROGRESS',
                        unlocked_at=datetime.utcnow() if is_unlocked else None,
                        claimed_at=None,  # 不自動領取獎勵
                    )
                    db.add(progress_record)

                stats['progress_created'] += 1
                if is_unlocked:
                    stats['achievements_unlocked'] += 1

            # 每處理 50 個使用者提交一次
            if not dry_run and i % 50 == 0:
                await db.commit()

            stats['users_processed'] += 1

        except Exception as e:
            print(f"\n❌ Error processing user {user.email}: {e}")
            stats['errors'] += 1
            continue

    # 最後提交
    if not dry_run:
        await db.commit()

    print()  # 換行
    print()
    print("✅ Backfill complete!")
    print(f"   Users processed: {stats['users_processed']}")
    print(f"   Progress records created: {stats['progress_created']}")
    print(f"   Achievements auto-unlocked: {stats['achievements_unlocked']}")
    print(f"   Errors: {stats['errors']}")

    if dry_run:
        print()
        print("⚠️  This was a DRY RUN - no data was written to the database")


async def main():
    """主函式"""
    dry_run = "--dry-run" in sys.argv

    start_time = datetime.now()

    # Get database session
    db = get_db_session()

    try:
        await backfill_user_achievements(db, dry_run=dry_run)
    finally:
        await db.close()

    execution_time = (datetime.now() - start_time).total_seconds()
    print()
    print(f"⏱️  Execution time: {execution_time:.1f}s")


if __name__ == "__main__":
    asyncio.run(main())
