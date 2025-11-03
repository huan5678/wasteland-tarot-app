"""
Quest Service (Task 2.3)
Handles quest assignment, progress tracking, and reward distribution
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta, timezone
from uuid import UUID
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import UserNotFoundError


class QuestService:
    """
    Quest Service - Manages daily/weekly quests and user progress
    """
    
    QUEST_TYPE_DAILY = "DAILY"
    QUEST_TYPE_WEEKLY = "WEEKLY"
    
    QUEST_STATUS_AVAILABLE = "AVAILABLE"
    QUEST_STATUS_IN_PROGRESS = "IN_PROGRESS"
    QUEST_STATUS_COMPLETED = "COMPLETED"
    QUEST_STATUS_CLAIMED = "CLAIMED"
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    # ========================================
    # Quest Assignment
    # ========================================
    
    async def assign_daily_quests(self, user_id: UUID) -> List[Dict[str, Any]]:
        """
        Assign daily quests to user (1 fixed + 2 random)
        Should be called at daily reset (00:00 UTC)
        
        Returns list of assigned quest progress records
        """
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        # Check if user already has today's quests
        existing_count = await self._count_user_quests(
            user_id, 
            self.QUEST_TYPE_DAILY, 
            today_start
        )
        
        if existing_count > 0:
            return await self.get_user_active_quests(user_id, self.QUEST_TYPE_DAILY)
        
        # Get fixed daily quest
        fixed_quest = await self._get_fixed_quest(self.QUEST_TYPE_DAILY)
        
        # Get 2 random daily quests
        random_quests = await self._get_random_quests(self.QUEST_TYPE_DAILY, count=2)
        
        # Assign quests to user
        assigned_quests = []
        for quest in [fixed_quest] + random_quests:
            progress = await self._create_quest_progress(
                user_id=user_id,
                quest=quest,
                available_at=today_start,
                expires_at=today_end
            )
            assigned_quests.append(progress)
        
        await self.db.commit()
        return assigned_quests
    
    async def assign_weekly_quests(self, user_id: UUID) -> List[Dict[str, Any]]:
        """
        Assign weekly quests to user (1 fixed + 2 random from hard pool)
        Should be called at weekly reset (Monday 00:00 UTC)
        
        Returns list of assigned quest progress records
        """
        now = datetime.now(timezone.utc)
        week_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = week_start - timedelta(days=week_start.weekday())  # Monday
        week_end = week_start + timedelta(days=7)
        
        # Check if user already has this week's quests
        existing_count = await self._count_user_quests(
            user_id,
            self.QUEST_TYPE_WEEKLY,
            week_start
        )
        
        if existing_count > 0:
            return await self.get_user_active_quests(user_id, self.QUEST_TYPE_WEEKLY)
        
        # Get fixed weekly quest
        fixed_quest = await self._get_fixed_quest(self.QUEST_TYPE_WEEKLY)
        
        # Get 2 random weekly quests from hard pool
        random_quests = await self._get_random_quests(
            self.QUEST_TYPE_WEEKLY,
            count=2,
            difficulty="HARD"
        )
        
        # Assign quests to user
        assigned_quests = []
        for quest in [fixed_quest] + random_quests:
            progress = await self._create_quest_progress(
                user_id=user_id,
                quest=quest,
                available_at=week_start,
                expires_at=week_end
            )
            assigned_quests.append(progress)
        
        await self.db.commit()
        return assigned_quests
    
    # ========================================
    # Progress Tracking
    # ========================================
    
    async def update_quest_progress(
        self,
        user_id: UUID,
        quest_code: str,
        progress_increment: int = 1
    ) -> Optional[Dict[str, Any]]:
        """
        Update progress for a specific quest
        
        Args:
            user_id: User UUID
            quest_code: Quest code identifier
            progress_increment: Amount to increment progress by
        
        Returns:
            Updated progress record or None if quest not found/active
        """
        # Find active quest progress
        query = """
            SELECT 
                uqp.id,
                uqp.current_progress,
                uqp.target_progress,
                uqp.status,
                q.rewards
            FROM user_quest_progress uqp
            JOIN quests q ON uqp.quest_id = q.id
            WHERE uqp.user_id = :user_id
              AND q.code = :quest_code
              AND uqp.status IN ('AVAILABLE', 'IN_PROGRESS')
              AND uqp.expires_at > NOW()
            ORDER BY uqp.created_at DESC
            LIMIT 1
        """
        
        result = await self.db.execute(
            text(query),
            {"user_id": str(user_id), "quest_code": quest_code}
        )
        row = result.first()
        
        if not row:
            return None
        
        progress_id = row[0]
        current_progress = row[1]
        target_progress = row[2]
        current_status = row[3]
        rewards = row[4]
        
        # Calculate new progress
        new_progress = min(current_progress + progress_increment, target_progress)
        
        # Update status if completed
        new_status = current_status
        completed_at = None
        
        if new_progress >= target_progress and current_status != self.QUEST_STATUS_COMPLETED:
            new_status = self.QUEST_STATUS_COMPLETED
            completed_at = datetime.now(timezone.utc)
        elif new_progress > 0 and current_status == self.QUEST_STATUS_AVAILABLE:
            new_status = self.QUEST_STATUS_IN_PROGRESS
        
        # Update database
        update_query = """
            UPDATE user_quest_progress
            SET 
                current_progress = :new_progress,
                status = :new_status,
                completed_at = COALESCE(:completed_at, completed_at)
            WHERE id = :progress_id
            RETURNING 
                id, user_id, quest_id, status, 
                current_progress, target_progress,
                completed_at
        """
        
        result = await self.db.execute(
            text(update_query),
            {
                "progress_id": str(progress_id),
                "new_progress": new_progress,
                "new_status": new_status,
                "completed_at": completed_at
            }
        )
        
        await self.db.commit()
        
        updated_row = result.first()
        return {
            "id": str(updated_row[0]),
            "user_id": str(updated_row[1]),
            "quest_id": str(updated_row[2]),
            "status": updated_row[3],
            "current_progress": updated_row[4],
            "target_progress": updated_row[5],
            "completed": updated_row[3] == self.QUEST_STATUS_COMPLETED,
            "rewards": rewards if updated_row[3] == self.QUEST_STATUS_COMPLETED else None
        }
    
    async def claim_quest_rewards(
        self,
        user_id: UUID,
        progress_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """
        Claim rewards for completed quest
        
        Returns reward details if successful, None if quest not claimable
        """
        # Get quest progress
        query = """
            SELECT 
                uqp.id,
                uqp.status,
                q.rewards,
                q.name_zh_tw
            FROM user_quest_progress uqp
            JOIN quests q ON uqp.quest_id = q.id
            WHERE uqp.id = :progress_id
              AND uqp.user_id = :user_id
              AND uqp.status = 'COMPLETED'
        """
        
        result = await self.db.execute(
            text(query),
            {"progress_id": str(progress_id), "user_id": str(user_id)}
        )
        row = result.first()
        
        if not row:
            return None
        
        rewards = row[2]
        quest_name = row[3]
        
        # Update status to CLAIMED
        update_query = """
            UPDATE user_quest_progress
            SET 
                status = 'CLAIMED',
                claimed_at = NOW()
            WHERE id = :progress_id
        """
        
        await self.db.execute(
            text(update_query),
            {"progress_id": str(progress_id)}
        )
        
        await self.db.commit()
        
        return {
            "quest_name": quest_name,
            "rewards": rewards,
            "claimed_at": datetime.now(timezone.utc)
        }
    
    # ========================================
    # Query Methods
    # ========================================
    
    async def get_user_active_quests(
        self,
        user_id: UUID,
        quest_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all active (not expired, not claimed) quests for user
        """
        type_filter = f"AND q.type = '{quest_type}'" if quest_type else ""
        
        query = f"""
            SELECT 
                q.id as quest_id,
                q.code,
                q.name_zh_tw,
                q.description,
                q.type,
                q.category,
                q.objectives,
                q.rewards,
                q.difficulty,
                uqp.id as progress_id,
                uqp.status,
                uqp.current_progress,
                uqp.target_progress,
                uqp.available_at,
                uqp.expires_at,
                uqp.completed_at
            FROM user_quest_progress uqp
            JOIN quests q ON uqp.quest_id = q.id
            WHERE uqp.user_id = :user_id
              AND uqp.status IN ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED')
              AND uqp.expires_at > NOW()
              {type_filter}
            ORDER BY q.display_order ASC, uqp.created_at ASC
        """
        
        result = await self.db.execute(
            text(query),
            {"user_id": str(user_id)}
        )
        
        quests = []
        for row in result:
            quests.append({
                "quest_id": str(row[0]),
                "code": row[1],
                "name": row[2],
                "description": row[3],
                "type": row[4],
                "category": row[5],
                "objectives": row[6],
                "rewards": row[7],
                "difficulty": row[8],
                "progress_id": str(row[9]),
                "status": row[10],
                "current_progress": row[11],
                "target_progress": row[12],
                "available_at": row[13],
                "expires_at": row[14],
                "completed_at": row[15],
                "progress_percentage": round((row[11] / row[12]) * 100, 1) if row[12] > 0 else 0
            })
        
        return quests
    
    async def get_user_quest_stats(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get user's quest statistics
        """
        query = """
            SELECT 
                COUNT(*) FILTER (WHERE status = 'CLAIMED') as completed_total,
                COUNT(*) FILTER (WHERE status = 'CLAIMED' AND q.type = 'DAILY') as completed_daily,
                COUNT(*) FILTER (WHERE status = 'CLAIMED' AND q.type = 'WEEKLY') as completed_weekly,
                COUNT(*) FILTER (WHERE status IN ('AVAILABLE', 'IN_PROGRESS')) as active_quests,
                COALESCE(SUM((q.rewards->>'karma_points')::INTEGER) FILTER (WHERE status = 'CLAIMED'), 0) as total_karma_earned
            FROM user_quest_progress uqp
            JOIN quests q ON uqp.quest_id = q.id
            WHERE uqp.user_id = :user_id
        """
        
        result = await self.db.execute(
            text(query),
            {"user_id": str(user_id)}
        )
        row = result.first()
        
        return {
            "completed_total": row[0],
            "completed_daily": row[1],
            "completed_weekly": row[2],
            "active_quests": row[3],
            "total_karma_earned": row[4]
        }
    
    # ========================================
    # Helper Methods
    # ========================================
    
    async def _get_fixed_quest(self, quest_type: str) -> Dict[str, Any]:
        """Get the fixed quest for given type"""
        query = """
            SELECT id, code, name_zh_tw, description, type, category, 
                   objectives, rewards, difficulty
            FROM quests
            WHERE type = :quest_type
              AND is_fixed = TRUE
              AND is_active = TRUE
            LIMIT 1
        """
        
        result = await self.db.execute(
            text(query),
            {"quest_type": quest_type}
        )
        row = result.first()
        
        return self._row_to_quest_dict(row)
    
    async def _get_random_quests(
        self,
        quest_type: str,
        count: int = 2,
        difficulty: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get random quests from pool"""
        difficulty_filter = f"AND difficulty = '{difficulty}'" if difficulty else ""
        
        query = f"""
            SELECT id, code, name_zh_tw, description, type, category,
                   objectives, rewards, difficulty
            FROM quests
            WHERE type = :quest_type
              AND is_fixed = FALSE
              AND is_active = TRUE
              {difficulty_filter}
            ORDER BY RANDOM()
            LIMIT :count
        """
        
        result = await self.db.execute(
            text(query),
            {"quest_type": quest_type, "count": count}
        )
        
        return [self._row_to_quest_dict(row) for row in result]
    
    async def _create_quest_progress(
        self,
        user_id: UUID,
        quest: Dict[str, Any],
        available_at: datetime,
        expires_at: datetime
    ) -> Dict[str, Any]:
        """Create new quest progress record"""
        target_progress = quest["objectives"].get("target", 1)
        
        query = """
            INSERT INTO user_quest_progress (
                user_id, quest_id, status, current_progress, target_progress,
                available_at, expires_at
            ) VALUES (
                :user_id, :quest_id, 'AVAILABLE', 0, :target_progress,
                :available_at, :expires_at
            )
            RETURNING id, user_id, quest_id, status, current_progress, target_progress
        """
        
        result = await self.db.execute(
            text(query),
            {
                "user_id": str(user_id),
                "quest_id": quest["id"],
                "target_progress": target_progress,
                "available_at": available_at,
                "expires_at": expires_at
            }
        )
        
        row = result.first()
        return {
            "id": str(row[0]),
            "user_id": str(row[1]),
            "quest_id": str(row[2]),
            "quest_code": quest["code"],
            "quest_name": quest["name"],
            "status": row[3],
            "current_progress": row[4],
            "target_progress": row[5],
            "objectives": quest["objectives"],
            "rewards": quest["rewards"]
        }
    
    async def _count_user_quests(
        self,
        user_id: UUID,
        quest_type: str,
        available_after: datetime
    ) -> int:
        """Count user quests of given type after certain date"""
        query = """
            SELECT COUNT(*)
            FROM user_quest_progress uqp
            JOIN quests q ON uqp.quest_id = q.id
            WHERE uqp.user_id = :user_id
              AND q.type = :quest_type
              AND uqp.available_at >= :available_after
        """
        
        result = await self.db.execute(
            text(query),
            {
                "user_id": str(user_id),
                "quest_type": quest_type,
                "available_after": available_after
            }
        )
        
        return result.scalar() or 0
    
    def _row_to_quest_dict(self, row) -> Dict[str, Any]:
        """Convert database row to quest dictionary"""
        return {
            "id": str(row[0]),
            "code": row[1],
            "name": row[2],
            "description": row[3],
            "type": row[4],
            "category": row[5],
            "objectives": row[6],
            "rewards": row[7],
            "difficulty": row[8]
        }
