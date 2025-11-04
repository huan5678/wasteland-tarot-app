"""
Unified Karma Service (Task 2.1)
Merges karma_service.py and gamification_karma_service.py into single service
Handles dual-score system: alignment_karma (0-100) + total_karma (cumulative)
"""

from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta, timezone
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from sqlalchemy.exc import SQLAlchemyError

from app.models.user import User
from app.models.gamification import UserKarma, KarmaLog
from app.models.social_features import KarmaHistory, KarmaChangeReason
from app.core.exceptions import UserNotFoundError


class KarmaRulesEngine:
    """Rules engine for karma calculations and validations"""
    
    KARMA_RULES = {
        KarmaChangeReason.READING_ACCURACY: {
            "alignment_change": 2,
            "total_change": 2,
            "max_per_day": 10,
        },
        KarmaChangeReason.HELPING_USERS: {
            "alignment_change": 5,
            "total_change": 5,
            "max_per_day": 25,
        },
        KarmaChangeReason.COMMUNITY_CONTRIBUTION: {
            "alignment_change": 3,
            "total_change": 3,
            "max_per_day": 15,
        },
        KarmaChangeReason.NEGATIVE_BEHAVIOR: {
            "alignment_change": -10,
            "total_change": 0,  # Negative behavior doesn't reduce total_karma
            "max_per_day": -50,
        },
        KarmaChangeReason.SHARING_WISDOM: {
            "alignment_change": 1,
            "total_change": 1,
            "max_per_day": 5,
        },
        KarmaChangeReason.FACTION_ACTIVITIES: {
            "alignment_change": 3,
            "total_change": 3,
            "max_per_day": 15,
        },
        KarmaChangeReason.PASSKEY_LOGIN: {
            "alignment_change": 10,
            "total_change": 10,
            "max_per_day": 10,
        },
        KarmaChangeReason.PASSKEY_REGISTRATION: {
            "alignment_change": 20,
            "total_change": 20,
            "max_per_day": 20,
        }
    }
    
    ALIGNMENT_THRESHOLDS = {
        "very_evil": (0, 19),
        "evil": (20, 39),
        "neutral": (40, 59),
        "good": (60, 79),
        "very_good": (80, 100)
    }
    
    @classmethod
    def get_alignment_category(cls, alignment_karma: int) -> str:
        """Get alignment category from alignment_karma score"""
        for category, (low, high) in cls.ALIGNMENT_THRESHOLDS.items():
            if low <= alignment_karma <= high:
                return category
        return "neutral"
    
    @classmethod
    def calculate_karma_change(
        cls,
        reason: KarmaChangeReason,
        context: Dict[str, Any] = None
    ) -> Tuple[int, int]:
        """
        Calculate karma changes for both scores
        Returns: (alignment_change, total_change)
        """
        if reason not in cls.KARMA_RULES:
            return 0, 0
        
        rule = cls.KARMA_RULES[reason]
        return rule["alignment_change"], rule["total_change"]
    
    @classmethod
    def calculate_level(cls, total_karma: int) -> int:
        """Calculate level from total_karma (Level = floor(total_karma / 500) + 1)"""
        return int(total_karma // 500) + 1
    
    @classmethod
    def calculate_karma_to_next_level(cls, total_karma: int) -> int:
        """Calculate karma needed for next level"""
        current_level = cls.calculate_level(total_karma)
        next_level_requirement = current_level * 500
        return next_level_requirement - total_karma


class UnifiedKarmaService:
    """
    Unified Karma Service - Single entry point for all karma operations
    Replaces: karma_service.py + gamification_karma_service.py
    """
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.rules_engine = KarmaRulesEngine()
    
    # ========================================
    # Core Methods
    # ========================================
    
    async def add_karma(
        self,
        user_id: UUID,
        action_type: str,
        alignment_change: int = 0,
        total_change: int = 0,
        reason: Optional[KarmaChangeReason] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Add karma to user (both alignment and total)
        
        Args:
            user_id: User UUID
            action_type: Action identifier (e.g., 'complete_reading', 'daily_login')
            alignment_change: Change to alignment_karma (-100 to +100)
            total_change: Change to total_karma (0 or positive only)
            reason: KarmaChangeReason enum (for rules engine)
            description: Human-readable description
            metadata: Additional context (JSONB)
        
        Returns:
            Dict with updated karma values and level info
        """
        try:
            # Validate user exists
            user = await self._get_user_by_id(user_id)
            
            # Get or create UserKarma
            user_karma = await self._get_or_create_user_karma(user_id)
            
            # Apply rules engine if reason provided
            if reason:
                alignment_change, total_change = self.rules_engine.calculate_karma_change(reason)
            
            # Calculate new values
            old_alignment = user_karma.alignment_karma
            old_total = user_karma.total_karma
            old_level = user_karma.current_level
            
            new_alignment = max(0, min(100, old_alignment + alignment_change))
            new_total = max(0, old_total + max(0, total_change))  # total_karma never decreases
            
            # Update UserKarma
            user_karma.alignment_karma = new_alignment
            user_karma.total_karma = new_total
            user_karma.current_level = self.rules_engine.calculate_level(new_total)
            user_karma.karma_to_next_level = self.rules_engine.calculate_karma_to_next_level(new_total)
            user_karma.last_karma_at = datetime.now(timezone.utc)
            
            # Create KarmaLog (for total_karma tracking)
            if total_change > 0:
                karma_log = KarmaLog(
                    user_id=user_id,
                    action_type=action_type,
                    karma_amount=total_change,
                    description=description,
                    action_metadata=metadata or {}
                )
                self.db.add(karma_log)
            
            # Create KarmaHistory (for alignment_karma tracking and audit)
            karma_history = KarmaHistory(
                user_id=user_id,
                change_amount=alignment_change,
                new_karma_value=new_alignment,
                reason=reason or KarmaChangeReason.READING_ACCURACY,
                related_entity_type=action_type,
                related_entity_id=metadata.get("reading_id") if metadata else None,
                context=metadata or {}
            )
            self.db.add(karma_history)
            
            await self.db.commit()
            await self.db.refresh(user_karma)
            
            # Check for level up
            level_changed = user_karma.current_level > old_level
            alignment_changed = self.rules_engine.get_alignment_category(new_alignment) != \
                               self.rules_engine.get_alignment_category(old_alignment)
            
            return {
                "success": True,
                "alignment_karma": new_alignment,
                "alignment_change": alignment_change,
                "total_karma": new_total,
                "total_change": total_change,
                "current_level": user_karma.current_level,
                "karma_to_next_level": user_karma.karma_to_next_level,
                "level_changed": level_changed,
                "alignment_changed": alignment_changed,
                "alignment_category": self.rules_engine.get_alignment_category(new_alignment)
            }
            
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise RuntimeError(f"Failed to add karma: {str(e)}") from e
    
    async def get_user_karma(self, user_id: UUID) -> Optional[UserKarma]:
        """Get user karma record"""
        result = await self.db.execute(
            select(UserKarma).where(UserKarma.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_karma_summary(self, user_id: UUID) -> Dict[str, Any]:
        """Get comprehensive karma summary for user"""
        user_karma = await self.get_user_karma(user_id)
        
        if not user_karma:
            return {
                "alignment_karma": 50,
                "total_karma": 50,
                "current_level": 1,
                "karma_to_next_level": 500,
                "alignment_category": "neutral",
                "rank": None,
                "today_earned": 0
            }
        
        # Calculate today's earned karma
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(func.sum(KarmaLog.karma_amount))
            .where(
                KarmaLog.user_id == user_id,
                KarmaLog.created_at >= today_start
            )
        )
        today_earned = result.scalar() or 0
        
        # Calculate karma_to_next_level
        karma_to_next_level = self.rules_engine.calculate_karma_to_next_level(user_karma.total_karma)
        
        return {
            "alignment_karma": user_karma.alignment_karma,
            "total_karma": user_karma.total_karma,
            "current_level": user_karma.current_level,
            "karma_to_next_level": karma_to_next_level,
            "alignment_category": self.rules_engine.get_alignment_category(user_karma.alignment_karma),
            "rank": None,  # rank is not a column in user_karma
            "today_earned": today_earned
        }
    
    async def get_karma_history(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0
    ) -> List[KarmaHistory]:
        """Get paginated karma history"""
        result = await self.db.execute(
            select(KarmaHistory)
            .where(KarmaHistory.user_id == user_id)
            .order_by(desc(KarmaHistory.changed_at))
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())
    
    async def get_karma_logs(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0
    ) -> List[KarmaLog]:
        """Get paginated karma logs (total_karma tracking)"""
        result = await self.db.execute(
            select(KarmaLog)
            .where(KarmaLog.user_id == user_id)
            .order_by(desc(KarmaLog.created_at))
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())
    
    # ========================================
    # Convenience Methods (for backward compatibility)
    # ========================================
    
    async def grant_karma(
        self,
        user_id: UUID,
        action_type: str,
        karma_amount: int,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Grant positive karma (increases both alignment and total)
        Backward compatible with GamificationKarmaService
        """
        return await self.add_karma(
            user_id=user_id,
            action_type=action_type,
            alignment_change=karma_amount,
            total_change=karma_amount,
            description=description,
            metadata=metadata
        )
    
    async def initialize_karma_for_user(self, user_id: UUID) -> UserKarma:
        """
        Initialize karma for new user
        Backward compatible with KarmaService
        """
        user = await self._get_user_by_id(user_id)
        
        # Check if already initialized
        existing = await self.get_user_karma(user_id)
        if existing:
            return existing
        
        # Create new UserKarma with neutral values
        user_karma = UserKarma(
            user_id=user_id,
            alignment_karma=50,
            total_karma=50,
            current_level=1,
            karma_to_next_level=500
        )
        self.db.add(user_karma)
        
        # Create initial history entry
        karma_history = KarmaHistory(
            user_id=user_id,
            change_amount=0,
            new_karma_value=50,
            reason=KarmaChangeReason.READING_ACCURACY,
            related_entity_type="initialization",
            context={"source": "user_registration"}
        )
        self.db.add(karma_history)
        
        await self.db.commit()
        await self.db.refresh(user_karma)
        
        return user_karma
    
    # ========================================
    # Private Helper Methods
    # ========================================
    
    async def _get_user_by_id(self, user_id: UUID) -> User:
        """Get user with validation"""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise UserNotFoundError(f"User with ID {user_id} not found")
        
        return user
    
    async def _get_or_create_user_karma(self, user_id: UUID) -> UserKarma:
        """Get or create UserKarma record"""
        result = await self.db.execute(
            select(UserKarma).where(UserKarma.user_id == user_id)
        )
        user_karma = result.scalar_one_or_none()
        
        if not user_karma:
            user_karma = UserKarma(
                user_id=user_id,
                alignment_karma=50,
                total_karma=50,
                current_level=1,
                karma_to_next_level=500
            )
            self.db.add(user_karma)
            await self.db.flush()
        
        return user_karma
