"""
Karma Service - Comprehensive karma tracking and history management for Wasteland Tarot
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.social_features import KarmaHistory, KarmaChangeReason
from app.models.reading_enhanced import ReadingSession
from app.models.wasteland_card import KarmaAlignment
from app.core.exceptions import UserNotFoundError, InsufficientPermissionsError


class KarmaRulesEngine:
    """Rules engine for karma calculations and validations"""

    # Karma change rules by action type
    KARMA_RULES = {
        KarmaChangeReason.READING_ACCURACY: {
            "base_change": 2,
            "max_per_day": 10,
            "requires_verification": False,
            "multiplier_factors": ["user_level", "reading_complexity"]
        },
        KarmaChangeReason.HELPING_USERS: {
            "base_change": 5,
            "max_per_day": 25,
            "requires_verification": True,
            "multiplier_factors": ["community_standing"]
        },
        KarmaChangeReason.COMMUNITY_CONTRIBUTION: {
            "base_change": 3,
            "max_per_day": 15,
            "requires_verification": True,
            "multiplier_factors": ["contribution_quality"]
        },
        KarmaChangeReason.NEGATIVE_BEHAVIOR: {
            "base_change": -10,
            "max_per_day": -50,
            "requires_verification": True,
            "multiplier_factors": ["severity_level"]
        },
        KarmaChangeReason.SHARING_WISDOM: {
            "base_change": 1,
            "max_per_day": 5,
            "requires_verification": False,
            "multiplier_factors": ["wisdom_quality"]
        },
        KarmaChangeReason.FACTION_ACTIVITIES: {
            "base_change": 3,
            "max_per_day": 15,
            "requires_verification": False,
            "multiplier_factors": ["faction_alignment", "activity_impact"]
        }
    }

    # Karma thresholds for alignment changes
    ALIGNMENT_THRESHOLDS = {
        "evil_to_neutral": 31,
        "neutral_to_good": 70,
        "good_to_neutral": 69,
        "neutral_to_evil": 30
    }

    @classmethod
    def calculate_karma_change(
        cls,
        reason: KarmaChangeReason,
        context: Dict[str, Any] = None,
        user_current_karma: int = 50
    ) -> Tuple[int, float]:
        """Calculate karma change and confidence score"""

        if reason not in cls.KARMA_RULES:
            return 0, 0.0

        rule = cls.KARMA_RULES[reason]
        base_change = rule["base_change"]
        multiplier = 1.0
        confidence = 0.8

        context = context or {}

        # Apply multiplier factors
        for factor in rule["multiplier_factors"]:
            factor_value = context.get(factor, 1.0)

            if factor == "user_level":
                # Higher level users get less karma per action (diminishing returns)
                level = max(1, user_current_karma // 10)
                multiplier *= max(0.5, 1.0 - (level * 0.05))

            elif factor == "reading_complexity":
                # More complex readings give more karma
                complexity = context.get("reading_complexity", 1.0)
                multiplier *= complexity

            elif factor == "severity_level":
                # More severe negative behavior causes more karma loss
                severity = context.get("severity_level", 1.0)
                multiplier *= severity
                confidence = min(0.95, confidence + (severity * 0.1))

            elif factor == "faction_alignment":
                # Faction activities may have alignment bonuses
                faction_bonus = context.get("faction_bonus", 1.0)
                multiplier *= faction_bonus

        final_change = int(base_change * multiplier)

        # Ensure we don't exceed daily limits
        daily_limit = rule["max_per_day"]
        if daily_limit > 0:
            final_change = min(final_change, daily_limit)
        else:
            final_change = max(final_change, daily_limit)

        return final_change, confidence

    @classmethod
    def check_alignment_change(cls, old_karma: int, new_karma: int) -> Tuple[bool, Optional[str], Optional[str]]:
        """Check if karma change triggers alignment change"""

        old_alignment = cls.get_alignment_from_karma(old_karma)
        new_alignment = cls.get_alignment_from_karma(new_karma)

        if old_alignment != new_alignment:
            return True, old_alignment, new_alignment

        return False, None, None

    @classmethod
    def get_alignment_from_karma(cls, karma: int) -> str:
        """Get alignment string from karma score"""
        if karma >= 70:
            return "good"
        elif karma <= 30:
            return "evil"
        else:
            return "neutral"

    @classmethod
    def is_significant_change(cls, karma_change: int) -> bool:
        """Determine if karma change is significant (requires special handling)"""
        return abs(karma_change) >= 10


class KarmaService:
    """Service for managing karma tracking and history"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.rules_engine = KarmaRulesEngine()

    async def initialize_karma_for_user(self, user_id: str) -> KarmaHistory:
        """
        初始化新使用者的 Karma 系統

        Task 29: 確保 OAuth 和傳統註冊使用者都正確初始化 Karma

        Args:
            user_id: 使用者 ID

        Returns:
            KarmaHistory: 初始化記錄

        Raises:
            UserNotFoundError: 若使用者不存在
        """
        # 驗證使用者存在
        user = await self._get_user_with_validation(user_id)

        # 檢查是否已初始化（避免重複初始化）
        existing_history = await self.db.execute(
            select(KarmaHistory)
            .where(KarmaHistory.user_id == user_id)
            .limit(1)
        )
        if existing_history.scalar_one_or_none():
            # 已經有 karma 記錄，不需要重新初始化
            return None

        # 初始化 Karma 分數為 50（中性）
        initial_karma = 50
        user.karma_score = initial_karma

        # 建立初始化記錄
        karma_history = KarmaHistory(
            user_id=user_id,
            karma_before=0,
            karma_after=initial_karma,
            karma_change=initial_karma,
            reason=KarmaChangeReason.SYSTEM_INITIALIZATION.value,
            reason_description="使用者 Karma 系統初始化",
            triggered_by_action="user_registration",
            action_context={"is_oauth_user": user.oauth_provider is not None},
            faction_influence=user.faction_alignment,
            alignment_before="neutral",
            alignment_after="neutral",
            alignment_changed=False,
            significant_threshold_crossed=False,
            automated_change=True,
            confidence_score=1.0,
            is_verified=True
        )

        self.db.add(karma_history)
        await self.db.commit()
        await self.db.refresh(karma_history)

        return karma_history

    async def apply_karma_change(
        self,
        user_id: str,
        reason: KarmaChangeReason,
        reason_description: str,
        context: Dict[str, Any] = None,
        triggered_by_action: str = None,
        related_reading_id: str = None,
        related_user_id: str = None,
        admin_override: bool = False
    ) -> KarmaHistory:
        """Apply karma change and record in history"""

        # Get user
        user = await self._get_user_with_validation(user_id)

        # Check daily limits unless admin override
        if not admin_override:
            can_apply, daily_used = await self._check_daily_karma_limits(user_id, reason)
            if not can_apply:
                raise InsufficientPermissionsError(f"Daily karma limit exceeded for {reason.value}")

        # Calculate karma change
        karma_change, confidence = self.rules_engine.calculate_karma_change(
            reason=reason,
            context=context,
            user_current_karma=user.karma_score
        )

        if karma_change == 0:
            raise ValueError("No karma change calculated")

        # Store original values
        karma_before = user.karma_score
        karma_after = max(0, min(100, karma_before + karma_change))  # Clamp to 0-100
        actual_change = karma_after - karma_before

        # Check for alignment change
        alignment_changed, old_alignment, new_alignment = self.rules_engine.check_alignment_change(
            karma_before, karma_after
        )

        # Update user karma
        user.karma_score = karma_after

        # Create karma history record
        karma_history = KarmaHistory(
            user_id=user_id,
            karma_before=karma_before,
            karma_after=karma_after,
            karma_change=actual_change,
            reason=reason.value,
            reason_description=reason_description,
            triggered_by_action=triggered_by_action,
            related_reading_id=related_reading_id,
            related_user_id=related_user_id,
            action_context=context,
            faction_influence=user.faction_alignment,
            alignment_before=old_alignment or self.rules_engine.get_alignment_from_karma(karma_before),
            alignment_after=new_alignment or self.rules_engine.get_alignment_from_karma(karma_after),
            alignment_changed=alignment_changed,
            significant_threshold_crossed=self.rules_engine.is_significant_change(actual_change),
            automated_change=not admin_override,
            confidence_score=confidence,
            is_verified=not self.rules_engine.KARMA_RULES[reason]["requires_verification"]
        )

        self.db.add(karma_history)
        await self.db.commit()

        return karma_history

    async def get_user_karma_history(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        reason_filter: Optional[KarmaChangeReason] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> List[KarmaHistory]:
        """Get user's karma change history with filters"""

        query = select(KarmaHistory).where(KarmaHistory.user_id == user_id)

        if reason_filter:
            query = query.where(KarmaHistory.reason == reason_filter.value)

        if date_from:
            query = query.where(KarmaHistory.created_at >= date_from)

        if date_to:
            query = query.where(KarmaHistory.created_at <= date_to)

        query = query.order_by(desc(KarmaHistory.created_at)).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_karma_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive karma statistics for user"""

        user = await self._get_user_with_validation(user_id)

        # Get karma history summary
        result = await self.db.execute(
            select(
                func.count(KarmaHistory.id).label('total_changes'),
                func.sum(KarmaHistory.karma_change).label('total_karma_gained'),
                func.avg(KarmaHistory.karma_change).label('average_change'),
                func.max(KarmaHistory.karma_change).label('biggest_gain'),
                func.min(KarmaHistory.karma_change).label('biggest_loss')
            ).where(KarmaHistory.user_id == user_id)
        )
        stats = result.fetchone()

        # Get changes by reason
        result = await self.db.execute(
            select(
                KarmaHistory.reason,
                func.count(KarmaHistory.id).label('count'),
                func.sum(KarmaHistory.karma_change).label('total_change')
            )
            .where(KarmaHistory.user_id == user_id)
            .group_by(KarmaHistory.reason)
        )
        changes_by_reason = {row[0]: {"count": row[1], "total_change": row[2]} for row in result.fetchall()}

        # Get recent alignment changes
        result = await self.db.execute(
            select(KarmaHistory)
            .where(
                and_(
                    KarmaHistory.user_id == user_id,
                    KarmaHistory.alignment_changed == True
                )
            )
            .order_by(desc(KarmaHistory.created_at))
            .limit(5)
        )
        recent_alignment_changes = result.scalars().all()

        # Calculate karma trajectory (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        result = await self.db.execute(
            select(func.sum(KarmaHistory.karma_change))
            .where(
                and_(
                    KarmaHistory.user_id == user_id,
                    KarmaHistory.created_at >= thirty_days_ago
                )
            )
        )
        karma_trend_30d = result.scalar() or 0

        return {
            "current_karma": user.karma_score,
            "current_alignment": user.karma_alignment().value,
            "total_changes": stats[0] if stats else 0,
            "total_karma_gained": stats[1] if stats else 0,
            "average_change": round(stats[2], 2) if stats and stats[2] else 0,
            "biggest_gain": stats[3] if stats else 0,
            "biggest_loss": stats[4] if stats else 0,
            "changes_by_reason": changes_by_reason,
            "recent_alignment_changes": [
                {
                    "date": change.created_at.isoformat(),
                    "from": change.alignment_before,
                    "to": change.alignment_after,
                    "reason": change.reason
                }
                for change in recent_alignment_changes
            ],
            "karma_trend_30d": karma_trend_30d,
            "next_alignment_threshold": self._get_next_alignment_threshold(user.karma_score)
        }

    async def get_karma_leaderboard(
        self,
        limit: int = 50,
        faction_filter: Optional[str] = None,
        alignment_filter: Optional[KarmaAlignment] = None
    ) -> List[Dict[str, Any]]:
        """Get karma leaderboard with optional filters"""

        query = select(User).where(User.is_active == True)

        if faction_filter:
            query = query.where(User.faction_alignment == faction_filter)

        if alignment_filter:
            if alignment_filter == KarmaAlignment.GOOD:
                query = query.where(User.karma_score >= 70)
            elif alignment_filter == KarmaAlignment.EVIL:
                query = query.where(User.karma_score <= 30)
            else:  # NEUTRAL
                query = query.where(and_(User.karma_score > 30, User.karma_score < 70))

        query = query.order_by(desc(User.karma_score)).limit(limit)

        result = await self.db.execute(query)
        users = result.scalars().all()

        leaderboard = []
        for i, user in enumerate(users, 1):
            leaderboard.append({
                "rank": i,
                "user_id": user.id,
                "display_name": user.get_sanitized_display_name(),
                "karma_score": user.karma_score,
                "alignment": user.karma_alignment().value,
                "faction": user.faction_alignment,
                "total_readings": user.total_readings
            })

        return leaderboard

    async def validate_karma_change_request(
        self,
        user_id: str,
        reason: KarmaChangeReason,
        requested_change: int,
        admin_user_id: str = None
    ) -> Tuple[bool, str]:
        """Validate if a karma change request is valid"""

        # Check if user exists
        try:
            user = await self._get_user_with_validation(user_id)
        except UserNotFoundError:
            return False, "User not found"

        # Check daily limits
        can_apply, daily_used = await self._check_daily_karma_limits(user_id, reason)
        if not can_apply:
            return False, f"Daily limit exceeded. Used: {daily_used}"

        # Check if change is within reasonable bounds
        rule = self.rules_engine.KARMA_RULES.get(reason)
        if rule:
            max_single_change = abs(rule["base_change"]) * 3  # Allow 3x base change
            if abs(requested_change) > max_single_change:
                return False, f"Change too large. Maximum: {max_single_change}"

        # Check if admin approval required
        if rule and rule["requires_verification"] and not admin_user_id:
            return False, "Admin approval required for this type of change"

        return True, "Valid request"

    async def revert_karma_change(
        self,
        karma_history_id: str,
        admin_user_id: str,
        reason: str
    ) -> bool:
        """Revert a karma change (admin only)"""

        # Get karma history record
        result = await self.db.execute(
            select(KarmaHistory).where(KarmaHistory.id == karma_history_id)
        )
        karma_record = result.scalar_one_or_none()

        if not karma_record:
            return False

        if not karma_record.is_reversible:
            raise InsufficientPermissionsError("This karma change cannot be reversed")

        # Get user and revert karma
        user = await self._get_user_with_validation(karma_record.user_id)
        user.karma_score = max(0, min(100, user.karma_score - karma_record.karma_change))

        # Create reversal record
        reversal_record = KarmaHistory(
            user_id=karma_record.user_id,
            karma_before=karma_record.karma_after,
            karma_after=user.karma_score,
            karma_change=-karma_record.karma_change,
            reason=KarmaChangeReason.ADMIN_ADJUSTMENT.value,
            reason_description=f"Reversal of change {karma_history_id}: {reason}",
            automated_change=False,
            admin_review_required=False,
            reviewed_by_admin=admin_user_id,
            review_notes=f"Reverted karma change: {reason}",
            is_verified=True,
            confidence_score=1.0
        )

        # Mark original record as reversed
        karma_record.is_reversible = False
        karma_record.review_notes = f"Reversed by admin {admin_user_id}: {reason}"

        self.db.add(reversal_record)
        await self.db.commit()

        return True

    async def _get_user_with_validation(self, user_id: str) -> User:
        """Get user with validation"""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise UserNotFoundError(f"User with ID '{user_id}' not found")

        return user

    async def _check_daily_karma_limits(
        self,
        user_id: str,
        reason: KarmaChangeReason
    ) -> Tuple[bool, int]:
        """Check if user has exceeded daily karma limits for specific reason"""

        rule = self.rules_engine.KARMA_RULES.get(reason)
        if not rule:
            return True, 0

        # Get karma changes for today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        result = await self.db.execute(
            select(func.sum(KarmaHistory.karma_change))
            .where(
                and_(
                    KarmaHistory.user_id == user_id,
                    KarmaHistory.reason == reason.value,
                    KarmaHistory.created_at >= today_start
                )
            )
        )

        daily_total = result.scalar() or 0
        daily_limit = rule["max_per_day"]

        if daily_limit > 0:
            # Positive karma limit
            return daily_total < daily_limit, daily_total
        else:
            # Negative karma limit
            return daily_total > daily_limit, daily_total

    def _get_next_alignment_threshold(self, current_karma: int) -> Dict[str, Any]:
        """Get information about the next alignment threshold"""

        current_alignment = self.rules_engine.get_alignment_from_karma(current_karma)

        if current_alignment == "evil":
            return {
                "next_alignment": "neutral",
                "points_needed": 31 - current_karma,
                "threshold": 31
            }
        elif current_alignment == "neutral":
            if current_karma < 50:
                return {
                    "next_alignment": "good",
                    "points_needed": 70 - current_karma,
                    "threshold": 70
                }
            else:
                return {
                    "next_alignment": "good",
                    "points_needed": 70 - current_karma,
                    "threshold": 70
                }
        else:  # good
            return {
                "next_alignment": "maintaining good",
                "points_needed": 0,
                "threshold": 70
            }