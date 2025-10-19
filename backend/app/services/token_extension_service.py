"""
Token Extension Service

Handles token lifetime extension based on:
1. User activity (30 min activity → 30 min extension)
2. User loyalty (3+ days login in 7 days → extend to 7 days)

Security constraints:
- Maximum absolute lifetime: 7 days from first login
- Rate limiting: Max 10 extensions per 24 hours
"""

from datetime import datetime, timedelta, date
from typing import Dict, Any, List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc

from app.models import User, UserLoginHistory, TokenExtensionHistory
from app.core.exceptions import (
    TokenExtensionError,
    MaxLifetimeExceededError,
    RateLimitExceededError,
    UserNotFoundError,
)
from app.core.security import create_access_token, create_refresh_token
import logging

logger = logging.getLogger(__name__)


class TokenExtensionService:
    """Service for managing token extensions"""

    # Constants
    ACTIVITY_THRESHOLD_SECONDS = 1800  # 30 minutes
    EXTENSION_MINUTES_ACTIVITY = 30
    EXTENSION_DAYS_LOYALTY = 7
    MAX_LIFETIME_DAYS = 7
    RATE_LIMIT_COUNT = 10
    RATE_LIMIT_PERIOD_HOURS = 24
    LOYALTY_REQUIRED_DAYS = 3
    LOYALTY_WINDOW_DAYS = 7
    KARMA_BONUS = 10

    def __init__(self, db: AsyncSession):
        self.db = db

    async def extend_token_by_activity(
        self,
        user_id: UUID,
        current_expiry: int,
        activity_duration: int
    ) -> Dict[str, Any]:
        """
        Extend token based on user activity

        Args:
            user_id: User UUID
            current_expiry: Current token expiry (Unix timestamp in seconds)
            activity_duration: Activity duration in seconds

        Returns:
            Dict with extension details

        Raises:
            TokenExtensionError: If activity insufficient or token expired
            MaxLifetimeExceededError: If at maximum lifetime
            RateLimitExceededError: If rate limit exceeded
            UserNotFoundError: If user not found
        """
        # Validate user exists
        user = await self._get_user(user_id)

        # Check if token already expired
        current_time = int(datetime.utcnow().timestamp())
        if current_expiry < current_time:
            raise TokenExtensionError("Token already expired. Please re-login.")

        # Validate activity duration
        if activity_duration < self.ACTIVITY_THRESHOLD_SECONDS:
            raise TokenExtensionError(
                f"Insufficient activity duration. Required: {self.ACTIVITY_THRESHOLD_SECONDS}s, "
                f"provided: {activity_duration}s"
            )

        # Check max lifetime constraint
        await self._check_max_lifetime(user)

        # Check rate limiting
        await self._check_rate_limit(user_id)

        # Calculate new expiry
        new_expiry = current_expiry + (self.EXTENSION_MINUTES_ACTIVITY * 60)

        # Record extension history
        history = TokenExtensionHistory(
            user_id=user_id,
            extension_type="activity",
            extended_at=datetime.utcnow(),
            extended_minutes=self.EXTENSION_MINUTES_ACTIVITY,
            new_expiry_timestamp=new_expiry,
            old_expiry_timestamp=current_expiry,
            activity_duration=activity_duration,
            extension_metadata={}
        )
        self.db.add(history)
        await self.db.commit()

        logger.info(f"Token extended by activity for user {user_id}: +{self.EXTENSION_MINUTES_ACTIVITY} min")

        return {
            "success": True,
            "extended_minutes": self.EXTENSION_MINUTES_ACTIVITY,
            "new_expiry": new_expiry,
            "extension_type": "activity"
        }

    async def extend_token_by_loyalty(
        self,
        user_id: UUID,
        current_expiry: int
    ) -> Dict[str, Any]:
        """
        Extend token based on user loyalty (3+ days login in 7 days)

        Args:
            user_id: User UUID
            current_expiry: Current token expiry (Unix timestamp)

        Returns:
            Dict with extension details and rewards

        Raises:
            TokenExtensionError: If not eligible
            MaxLifetimeExceededError: If at maximum lifetime
        """
        # Validate user exists
        user = await self._get_user(user_id)

        # Check loyalty eligibility
        eligibility = await self.check_loyalty_eligibility(user_id)
        if not eligibility["is_eligible"]:
            raise TokenExtensionError(
                f"Not eligible for loyalty extension. Login days: {eligibility['login_days_count']}/3"
            )

        # Check if already extended today
        today = date.today()
        already_extended = await self._check_loyalty_extended_today(user_id, today)
        if already_extended:
            raise TokenExtensionError("Loyalty extension already claimed today")

        # Check max lifetime constraint
        await self._check_max_lifetime(user)

        # Calculate new expiry (extend to 7 days from now)
        new_expiry = int((datetime.utcnow() + timedelta(days=self.EXTENSION_DAYS_LOYALTY)).timestamp())
        extended_minutes = int((new_expiry - current_expiry) / 60)

        # Update user: unlock badge, increase karma
        if not user.loyalty_badge_unlocked:
            user.loyalty_badge_unlocked = True
            user.karma_score += self.KARMA_BONUS
            logger.info(f"User {user_id} unlocked loyalty badge, karma +{self.KARMA_BONUS}")

        user.loyalty_streak_days = eligibility["current_streak"]

        # Record extension history
        history = TokenExtensionHistory(
            user_id=user_id,
            extension_type="loyalty",
            extended_at=datetime.utcnow(),
            extended_minutes=extended_minutes,
            new_expiry_timestamp=new_expiry,
            old_expiry_timestamp=current_expiry,
            extension_metadata={
                "login_days_count": eligibility["login_days_count"],
                "badge_unlocked": not user.loyalty_badge_unlocked,
                "karma_bonus": self.KARMA_BONUS if not user.loyalty_badge_unlocked else 0
            }
        )
        self.db.add(history)
        await self.db.commit()

        logger.info(f"Token extended by loyalty for user {user_id}: +{extended_minutes} min")

        return {
            "success": True,
            "extended_minutes": extended_minutes,
            "new_expiry": new_expiry,
            "extension_type": "loyalty",
            "rewards": {
                "karma_bonus": self.KARMA_BONUS,
                "badge_unlocked": "loyal_wasteland_resident"
            }
        }

    async def track_daily_login(
        self,
        user_id: UUID,
        login_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Track daily login for loyalty calculation

        Args:
            user_id: User UUID
            login_date: Login date (defaults to today)

        Returns:
            Dict with login tracking info
        """
        if login_date is None:
            login_date = date.today()

        # Check if already logged in today
        stmt = select(UserLoginHistory).where(
            and_(
                UserLoginHistory.user_id == user_id,
                UserLoginHistory.login_date == login_date
            )
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            # Increment login count
            existing.login_count += 1
            existing.updated_at = datetime.utcnow()
            is_new_day = False
        else:
            # Create new record
            existing = UserLoginHistory(
                user_id=user_id,
                login_date=login_date,
                login_count=1
            )
            self.db.add(existing)
            is_new_day = True

        await self.db.commit()

        # Calculate consecutive days
        consecutive_days = await self._calculate_consecutive_days(user_id, login_date)

        # Check if loyalty threshold reached
        loyalty_check_triggered = (consecutive_days >= self.LOYALTY_REQUIRED_DAYS)

        logger.info(f"Login tracked for user {user_id} on {login_date}: streak={consecutive_days}")

        return {
            "login_date": login_date.isoformat(),
            "is_new_day": is_new_day,
            "consecutive_days": consecutive_days,
            "loyalty_check_triggered": loyalty_check_triggered
        }

    async def check_loyalty_eligibility(self, user_id: UUID) -> Dict[str, Any]:
        """
        Check if user is eligible for loyalty extension

        Criteria: 3+ days of login within the last 7 days

        Returns:
            Dict with eligibility status
        """
        # Get login history for last 7 days
        cutoff_date = date.today() - timedelta(days=self.LOYALTY_WINDOW_DAYS - 1)

        stmt = select(UserLoginHistory).where(
            and_(
                UserLoginHistory.user_id == user_id,
                UserLoginHistory.login_date >= cutoff_date
            )
        ).order_by(desc(UserLoginHistory.login_date))

        result = await self.db.execute(stmt)
        login_records = result.scalars().all()

        login_days_count = len(login_records)
        login_dates = [record.login_date.isoformat() for record in login_records]

        # Calculate current streak
        current_streak = await self._calculate_consecutive_days(user_id, date.today())

        # Check if extension already claimed
        extension_available = not await self._check_loyalty_extended_today(user_id, date.today())

        is_eligible = login_days_count >= self.LOYALTY_REQUIRED_DAYS

        return {
            "is_eligible": is_eligible,
            "login_days_count": login_days_count,
            "login_dates": login_dates,
            "current_streak": current_streak,
            "extension_available": extension_available
        }

    async def get_extension_history(
        self,
        user_id: UUID,
        limit: int = 10
    ) -> List[TokenExtensionHistory]:
        """Get token extension history for user"""
        stmt = select(TokenExtensionHistory).where(
            TokenExtensionHistory.user_id == user_id
        ).order_by(desc(TokenExtensionHistory.extended_at)).limit(limit)

        result = await self.db.execute(stmt)
        return result.scalars().all()

    # Private helper methods

    async def _get_user(self, user_id: UUID) -> User:
        """Get user or raise error"""
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise UserNotFoundError(str(user_id))

        return user

    async def _check_max_lifetime(self, user: User):
        """Check if user's token has reached maximum lifetime"""
        if user.token_absolute_expiry:
            max_expiry = user.token_absolute_expiry
            if datetime.utcnow() >= max_expiry:
                raise MaxLifetimeExceededError(
                    "Token has reached maximum lifetime of 7 days. Please re-login."
                )

    async def _check_rate_limit(self, user_id: UUID):
        """Check if user has exceeded extension rate limit"""
        # Count extensions in last 24 hours
        cutoff_time = datetime.utcnow() - timedelta(hours=self.RATE_LIMIT_PERIOD_HOURS)

        stmt = select(func.count(TokenExtensionHistory.id)).where(
            and_(
                TokenExtensionHistory.user_id == user_id,
                TokenExtensionHistory.extended_at >= cutoff_time
            )
        )

        result = await self.db.execute(stmt)
        count = result.scalar()

        if count >= self.RATE_LIMIT_COUNT:
            raise RateLimitExceededError(
                limit=self.RATE_LIMIT_COUNT,
                period=f"{self.RATE_LIMIT_PERIOD_HOURS}小時"
            )

    async def _check_loyalty_extended_today(self, user_id: UUID, check_date: date) -> bool:
        """Check if loyalty extension already claimed today"""
        # Get today's loyalty extensions
        start_of_day = datetime.combine(check_date, datetime.min.time())
        end_of_day = datetime.combine(check_date, datetime.max.time())

        stmt = select(func.count(TokenExtensionHistory.id)).where(
            and_(
                TokenExtensionHistory.user_id == user_id,
                TokenExtensionHistory.extension_type == "loyalty",
                TokenExtensionHistory.extended_at >= start_of_day,
                TokenExtensionHistory.extended_at <= end_of_day
            )
        )

        result = await self.db.execute(stmt)
        count = result.scalar()

        return count > 0

    async def _calculate_consecutive_days(self, user_id: UUID, from_date: date) -> int:
        """Calculate consecutive login days from given date backwards"""
        consecutive_days = 0
        current_date = from_date

        while True:
            stmt = select(UserLoginHistory).where(
                and_(
                    UserLoginHistory.user_id == user_id,
                    UserLoginHistory.login_date == current_date
                )
            )
            result = await self.db.execute(stmt)
            record = result.scalar_one_or_none()

            if record:
                consecutive_days += 1
                current_date = current_date - timedelta(days=1)
            else:
                break

            # Safety limit
            if consecutive_days > 365:
                break

        return consecutive_days
