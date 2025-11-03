"""
Quest Scheduler - Background Tasks (Phase 4: Tasks 4.1-4.3)
Handles daily/weekly quest reset and cleanup
"""

import asyncio
from datetime import datetime, timezone
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.db.database import async_session_maker
from app.services.quest_service import QuestService
from app.models.user import User


async def get_active_users(db: AsyncSession, limit: int = 1000) -> List[User]:
    """
    Get list of active users for quest assignment
    
    Active user criteria:
    - Has logged in within last 30 days
    - Has at least 1 karma record
    """
    query = """
        SELECT DISTINCT u.id
        FROM users u
        JOIN user_karma uk ON u.id = uk.user_id
        WHERE u.last_login_at > NOW() - INTERVAL '30 days'
        OR uk.updated_at > NOW() - INTERVAL '7 days'
        LIMIT :limit
    """
    
    result = await db.execute(text(query), {"limit": limit})
    user_ids = [row[0] for row in result]
    
    # Fetch full user objects
    if user_ids:
        result = await db.execute(
            select(User).where(User.id.in_(user_ids))
        )
        return list(result.scalars().all())
    
    return []


async def daily_quest_reset_task():
    """Task 4.1: Daily Quest Reset - Every day at 00:00 UTC"""
    print(f"[{datetime.now(timezone.utc)}] Starting daily quest reset...")
    
    async with async_session_maker() as db:
        try:
            users = await get_active_users(db, limit=10000)
            print(f"Found {len(users)} active users")
            
            quest_service = QuestService(db)
            success_count = 0
            
            for user in users:
                try:
                    await quest_service.assign_daily_quests(user.id)
                    success_count += 1
                except Exception as e:
                    print(f"Error assigning to user {user.id}: {str(e)}")
            
            print(f"Daily quest reset complete: {success_count} success")
        except Exception as e:
            print(f"Daily quest reset failed: {str(e)}")
            raise


async def weekly_quest_reset_task():
    """Task 4.2: Weekly Quest Reset - Every Monday at 00:00 UTC"""
    print(f"[{datetime.now(timezone.utc)}] Starting weekly quest reset...")
    
    async with async_session_maker() as db:
        try:
            users = await get_active_users(db, limit=10000)
            print(f"Found {len(users)} active users")
            
            quest_service = QuestService(db)
            success_count = 0
            
            for user in users:
                try:
                    await quest_service.assign_weekly_quests(user.id)
                    success_count += 1
                except Exception as e:
                    print(f"Error assigning to user {user.id}: {str(e)}")
            
            print(f"Weekly quest reset complete: {success_count} success")
        except Exception as e:
            print(f"Weekly quest reset failed: {str(e)}")
            raise


async def cleanup_expired_quests_task():
    """Task 4.3: Cleanup Expired Quests - Daily at 01:00 UTC"""
    print(f"[{datetime.now(timezone.utc)}] Starting expired quest cleanup...")
    
    async with async_session_maker() as db:
        try:
            query = """
                UPDATE user_quest_progress
                SET status = 'EXPIRED'
                WHERE expires_at < NOW()
                  AND status IN ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED')
                RETURNING id
            """
            
            result = await db.execute(text(query))
            expired_ids = [row[0] for row in result]
            await db.commit()
            
            print(f"Expired {len(expired_ids)} quests")
            
            # Delete old expired quests
            cleanup_query = """
                DELETE FROM user_quest_progress
                WHERE status = 'EXPIRED'
                  AND expires_at < NOW() - INTERVAL '7 days'
                RETURNING id
            """
            
            result = await db.execute(text(cleanup_query))
            deleted_ids = [row[0] for row in result]
            await db.commit()
            
            print(f"Deleted {len(deleted_ids)} old quests")
        except Exception as e:
            await db.rollback()
            print(f"Cleanup failed: {str(e)}")
            raise


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        task = sys.argv[1]
        if task == "daily":
            asyncio.run(daily_quest_reset_task())
        elif task == "weekly":
            asyncio.run(weekly_quest_reset_task())
        elif task == "cleanup":
            asyncio.run(cleanup_expired_quests_task())
        else:
            print("Unknown task. Use: daily, weekly, or cleanup")
    else:
        print("Usage: python quest_scheduler.py [daily|weekly|cleanup]")
