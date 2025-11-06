"""
Level Service (Task 2.2)
Handles user level progression, privilege unlocking, and level-up events
"""

from typing import Dict, Any, Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError

from app.models.gamification import UserKarma
from app.models.user import User
from app.core.exceptions import UserNotFoundError


class UserLevel:
    """User level data structure"""
    def __init__(
        self,
        level: int,
        required_karma: int,
        title_zh_tw: str,
        title_en: str,
        icon_name: str,
        privileges: Dict[str, Any]
    ):
        self.level = level
        self.required_karma = required_karma
        self.title_zh_tw = title_zh_tw
        self.title_en = title_en
        self.icon_name = icon_name
        self.privileges = privileges


class LevelService:
    """
    Level Service - Manages user level progression and privileges
    """
    
    # Level calculation formula
    KARMA_PER_LEVEL = 500
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
    
    # ========================================
    # Core Level Methods
    # ========================================
    
    @classmethod
    def calculate_level_from_karma(cls, total_karma: int) -> int:
        """
        Calculate level from total_karma
        Formula: Level = floor(total_karma / 500) + 1
        """
        return int(total_karma // cls.KARMA_PER_LEVEL) + 1
    
    @classmethod
    def calculate_karma_for_level(cls, level: int) -> int:
        """
        Calculate required karma to reach a specific level
        Formula: required_karma = (level - 1) * 500
        """
        return (level - 1) * cls.KARMA_PER_LEVEL
    
    @classmethod
    def calculate_karma_to_next_level(cls, total_karma: int) -> int:
        """Calculate karma needed to reach next level"""
        current_level = cls.calculate_level_from_karma(total_karma)
        next_level_karma = cls.calculate_karma_for_level(current_level + 1)
        return next_level_karma - total_karma
    
    @classmethod
    def calculate_level_progress(cls, total_karma: int) -> Dict[str, Any]:
        """
        Calculate detailed level progress information
        
        Returns:
            {
                "current_level": 5,
                "current_karma": 2000,
                "level_start_karma": 2000,
                "level_end_karma": 2500,
                "karma_in_level": 0,
                "karma_to_next": 500,
                "progress_percentage": 0.0
            }
        """
        current_level = cls.calculate_level_from_karma(total_karma)
        level_start_karma = cls.calculate_karma_for_level(current_level)
        level_end_karma = cls.calculate_karma_for_level(current_level + 1)
        
        karma_in_level = total_karma - level_start_karma
        karma_to_next = level_end_karma - total_karma
        progress_percentage = (karma_in_level / cls.KARMA_PER_LEVEL) * 100 if cls.KARMA_PER_LEVEL > 0 else 0
        
        return {
            "current_level": current_level,
            "current_karma": total_karma,
            "level_start_karma": level_start_karma,
            "level_end_karma": level_end_karma,
            "karma_in_level": karma_in_level,
            "karma_to_next": karma_to_next,
            "progress_percentage": round(progress_percentage, 2)
        }
    
    async def get_user_level_info(self, user_id: UUID) -> Dict[str, Any]:
        """
        Get comprehensive level information for user
        
        Returns:
            {
                "level": 5,
                "title": "拾荒者",
                "icon": "box",
                "total_karma": 1200,
                "karma_to_next": 300,
                "progress_percentage": 16.4,
                "privileges": {...}
            }
        """
        # Get user karma
        result = await self.db.execute(
            select(UserKarma).where(UserKarma.user_id == user_id)
        )
        user_karma = result.scalar_one_or_none()
        
        if not user_karma:
            # Return default level 1 info
            return {
                "level": 1,
                "title": "避難所居民",
                "title_en": "Vault Dweller",
                "icon": "home",
                "total_karma": 0,
                "karma_to_next": 500,
                "progress_percentage": 0.0,
                "privileges": {
                    "reading_limit": 3,
                    "unlocked_spreads": ["single_card"],
                    "features": []
                }
            }
        
        # Calculate level progress
        progress = self.calculate_level_progress(user_karma.total_karma)
        
        # Get level details from user_levels table
        level_details = await self.get_level_details(progress["current_level"])
        
        return {
            "level": progress["current_level"],
            "title": level_details["title_zh_tw"],
            "title_en": level_details["title_en"],
            "icon": level_details["icon_name"],
            "total_karma": user_karma.total_karma,
            "karma_to_next": progress["karma_to_next"],
            "progress_percentage": progress["progress_percentage"],
            "privileges": level_details["privileges"]
        }
    
    async def get_level_details(self, level: int) -> Dict[str, Any]:
        """
        Get level details from user_levels table
        
        Args:
            level: Level number (1-100)
        
        Returns:
            Level details including title, icon, privileges
        """
        query = """
            SELECT 
                level,
                required_karma,
                title_zh_tw,
                title_en,
                icon_name,
                privileges
            FROM user_levels
            WHERE level = :level
        """
        
        result = await self.db.execute(
            select(
                text("level"),
                text("required_karma"),
                text("title_zh_tw"),
                text("title_en"),
                text("icon_name"),
                text("privileges")
            ).select_from(text("user_levels")).where(text("level = :level")),
            {"level": level}
        )
        row = result.first()
        
        if not row:
            # Fallback if level not in database
            return {
                "level": level,
                "required_karma": self.calculate_karma_for_level(level),
                "title_zh_tw": f"Level {level}",
                "title_en": f"Level {level}",
                "icon_name": "star",
                "privileges": {}
            }
        
        return {
            "level": row[0],
            "required_karma": row[1],
            "title_zh_tw": row[2],
            "title_en": row[3],
            "icon_name": row[4],
            "privileges": row[5]
        }
    
    async def check_level_up(
        self,
        user_id: UUID,
        old_total_karma: int,
        new_total_karma: int
    ) -> Optional[Dict[str, Any]]:
        """
        Check if user leveled up and return level-up info
        
        Args:
            user_id: User UUID
            old_total_karma: Previous total karma
            new_total_karma: New total karma after change
        
        Returns:
            None if no level up, or dict with level-up details
        """
        old_level = self.calculate_level_from_karma(old_total_karma)
        new_level = self.calculate_level_from_karma(new_total_karma)
        
        if new_level <= old_level:
            return None
        
        # Get new level details
        level_details = await self.get_level_details(new_level)
        
        return {
            "old_level": old_level,
            "new_level": new_level,
            "levels_gained": new_level - old_level,
            "title": level_details["title_zh_tw"],
            "title_en": level_details["title_en"],
            "icon": level_details["icon_name"],
            "new_privileges": level_details["privileges"],
            "unlocked_features": self._get_newly_unlocked_features(old_level, new_level)
        }
    
    def _get_newly_unlocked_features(self, old_level: int, new_level: int) -> List[str]:
        """
        Get list of features newly unlocked between old_level and new_level
        """
        newly_unlocked = []
        
        # Feature unlock milestones
        milestones = {
            4: "daily_quest",
            7: "weekly_quest",
            10: "voice_female",
            12: "voice_male",
            17: "voice_neutral",
            21: "share_reading",
            25: "ai_enhanced_reading",
            30: "custom_spread"
        }
        
        for level, feature in milestones.items():
            if old_level < level <= new_level:
                newly_unlocked.append(feature)
        
        return newly_unlocked
    
    async def get_leaderboard(
        self,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get top users by level/karma
        
        Returns list of users with their level info
        """
        query = """
            SELECT 
                u.id,
                u.username,
                u.email,
                uk.total_karma,
                uk.current_level,
                ul.title_zh_tw,
                ul.icon_name,
                ROW_NUMBER() OVER (ORDER BY uk.total_karma DESC, uk.created_at ASC) as rank
            FROM users u
            JOIN user_karma uk ON u.id = uk.user_id
            LEFT JOIN user_levels ul ON uk.current_level = ul.level
            ORDER BY uk.total_karma DESC, uk.created_at ASC
            LIMIT :limit OFFSET :offset
        """
        
        result = await self.db.execute(
            text(query),
            {"limit": limit, "offset": offset}
        )
        
        leaderboard = []
        for row in result:
            leaderboard.append({
                "rank": row[7],
                "user_id": str(row[0]),
                "username": row[1] or "Anonymous",
                "total_karma": row[3],
                "level": row[4],
                "title": row[5] or f"Level {row[4]}",
                "icon": row[6] or "star"
            })
        
        return leaderboard
    
    async def get_user_rank(self, user_id: UUID) -> Optional[int]:
        """
        Get user's rank in global leaderboard
        
        Returns:
            Rank number (1-indexed) or None if user has no karma
        """
        query = """
            WITH ranked_users AS (
                SELECT 
                    user_id,
                    ROW_NUMBER() OVER (ORDER BY total_karma DESC, created_at ASC) as rank
                FROM user_karma
            )
            SELECT rank 
            FROM ranked_users 
            WHERE user_id = :user_id
        """
        
        result = await self.db.execute(
            text(query),
            {"user_id": str(user_id)}
        )
        row = result.first()
        
        return row[0] if row else None
    
    async def get_next_milestone(self, user_id: UUID) -> Optional[Dict[str, Any]]:
        """
        Get information about next level milestone with special rewards
        
        Returns info about next milestone level (10, 20, 30, etc.)
        """
        # Get user karma
        result = await self.db.execute(
            select(UserKarma).where(UserKarma.user_id == user_id)
        )
        user_karma = result.scalar_one_or_none()
        
        if not user_karma:
            return None
        
        current_level = user_karma.current_level
        
        # Find next milestone (every 10 levels)
        next_milestone_level = ((current_level // 10) + 1) * 10
        
        if next_milestone_level > 100:
            return None
        
        level_details = await self.get_level_details(next_milestone_level)
        required_karma = self.calculate_karma_for_level(next_milestone_level)
        karma_needed = required_karma - user_karma.total_karma
        
        return {
            "milestone_level": next_milestone_level,
            "title": level_details["title_zh_tw"],
            "icon": level_details["icon_name"],
            "required_karma": required_karma,
            "karma_needed": karma_needed,
            "special_rewards": level_details["privileges"]
        }


# Import text for raw SQL queries
from sqlalchemy import text
