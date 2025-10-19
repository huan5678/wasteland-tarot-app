"""
Unit tests for Token Extension Service

Tests cover:
1. Activity-based token extension
2. Loyalty-based token extension
3. Security constraints (max lifetime, rate limiting)
4. Login tracking
5. Edge cases and error handling
"""

import pytest
from datetime import datetime, timedelta, date
from freezegun import freeze_time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.services.token_extension_service import TokenExtensionService
from app.models import User, UserLoginHistory, TokenExtensionHistory
from app.core.exceptions import (
    TokenExtensionError,
    MaxLifetimeExceededError,
    RateLimitExceededError,
)


class TestActivityBasedExtension:
    """Test activity-based token extension"""

    @pytest.mark.asyncio
    async def test_extend_token_by_activity_success(self, db_session: AsyncSession, test_user: User):
        """
        Test: Successfully extend token after 30 minutes of activity
        Expected: Token extended by 30 minutes, history recorded
        """
        service = TokenExtensionService(db_session)

        # Mock current token expiry (1 hour from now)
        current_expiry = int((datetime.utcnow() + timedelta(hours=1)).timestamp())

        # User has been active for 30 minutes (1800 seconds)
        activity_duration = 1800

        # Extend token
        result = await service.extend_token_by_activity(
            user_id=test_user.id,
            current_expiry=current_expiry,
            activity_duration=activity_duration
        )

        # Assertions
        assert result["success"] is True
        assert result["extended_minutes"] == 30
        assert result["new_expiry"] > current_expiry

        # Verify history record created
        history = await service.get_extension_history(test_user.id, limit=1)
        assert len(history) == 1
        assert history[0].extension_type == "activity"
        assert history[0].extended_minutes == 30
        assert history[0].activity_duration == activity_duration

    @pytest.mark.asyncio
    async def test_extend_token_insufficient_activity(self, db_session: AsyncSession, test_user: User):
        """
        Test: Reject extension if activity duration < 30 minutes
        Expected: Raise TokenExtensionError
        """
        service = TokenExtensionService(db_session)
        current_expiry = int((datetime.utcnow() + timedelta(hours=1)).timestamp())

        # Only 29 minutes of activity (1740 seconds)
        activity_duration = 1740

        with pytest.raises(TokenExtensionError, match="Insufficient activity duration"):
            await service.extend_token_by_activity(
                user_id=test_user.id,
                current_expiry=current_expiry,
                activity_duration=activity_duration
            )

    @pytest.mark.asyncio
    async def test_extend_token_max_lifetime_exceeded(self, db_session: AsyncSession, test_user: User):
        """
        Test: Reject extension if token has reached absolute max lifetime (7 days)
        Expected: Raise MaxLifetimeExceededError
        """
        service = TokenExtensionService(db_session)

        # Set user's token_absolute_expiry to now (already expired)
        test_user.token_absolute_expiry = datetime.utcnow() - timedelta(seconds=1)
        await db_session.flush()

        current_expiry = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        activity_duration = 1800

        with pytest.raises(MaxLifetimeExceededError, match="Token has reached maximum lifetime"):
            await service.extend_token_by_activity(
                user_id=test_user.id,
                current_expiry=current_expiry,
                activity_duration=activity_duration
            )

    @pytest.mark.asyncio
    async def test_extend_token_rate_limit(self, db_session: AsyncSession, test_user: User):
        """
        Test: Enforce rate limiting (max 10 extensions per 24 hours)
        Expected: Allow first 10, reject 11th with RateLimitExceededError
        """
        service = TokenExtensionService(db_session)
        current_expiry = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
        activity_duration = 1800

        # Create 10 extension records in the last 24 hours
        for i in range(10):
            await service.extend_token_by_activity(
                user_id=test_user.id,
                current_expiry=current_expiry,
                activity_duration=activity_duration
            )

        # 11th extension should fail
        with pytest.raises(RateLimitExceededError, match="已達上限"):
            await service.extend_token_by_activity(
                user_id=test_user.id,
                current_expiry=current_expiry,
                activity_duration=activity_duration
            )


class TestLoyaltyBasedExtension:
    """Test loyalty-based token extension"""

    @pytest.mark.asyncio
    async def test_extend_token_by_loyalty_success(self, db_session: AsyncSession, test_user: User):
        """
        Test: Successfully extend token after 3 days of login in 7-day window
        Expected: Token extended to 7 days, karma bonus, badge unlocked
        """
        service = TokenExtensionService(db_session)

        # Create login history for 3 days within last 7 days
        today = date.today()
        for i in range(3):
            login_date = today - timedelta(days=i)
            await service.track_daily_login(test_user.id, login_date)

        current_expiry = int((datetime.utcnow() + timedelta(hours=1)).timestamp())

        # Extend by loyalty
        result = await service.extend_token_by_loyalty(
            user_id=test_user.id,
            current_expiry=current_expiry
        )

        # Assertions
        assert result["success"] is True
        assert result["extended_minutes"] > 0
        assert "rewards" in result
        assert result["rewards"]["karma_bonus"] == 10
        assert result["rewards"]["badge_unlocked"] == "loyal_wasteland_resident"

        # Verify user record updated
        await db_session.refresh(test_user)
        assert test_user.loyalty_badge_unlocked is True
        assert test_user.karma_score >= 10

    @pytest.mark.asyncio
    async def test_loyalty_not_eligible_insufficient_days(self, db_session: AsyncSession, test_user: User):
        """
        Test: Reject loyalty extension if < 3 days of login in 7-day window
        Expected: Raise TokenExtensionError
        """
        service = TokenExtensionService(db_session)

        # Only 2 days of login
        today = date.today()
        for i in range(2):
            login_date = today - timedelta(days=i)
            await service.track_daily_login(test_user.id, login_date)

        current_expiry = int((datetime.utcnow() + timedelta(hours=1)).timestamp())

        with pytest.raises(TokenExtensionError, match="Not eligible for loyalty extension"):
            await service.extend_token_by_loyalty(
                user_id=test_user.id,
                current_expiry=current_expiry
            )

    @pytest.mark.asyncio
    async def test_loyalty_already_extended_today(self, db_session: AsyncSession, test_user: User):
        """
        Test: Prevent multiple loyalty extensions in the same day
        Expected: Raise TokenExtensionError on second attempt
        """
        service = TokenExtensionService(db_session)

        # Create 3 days of login history
        today = date.today()
        for i in range(3):
            login_date = today - timedelta(days=i)
            await service.track_daily_login(test_user.id, login_date)

        current_expiry = int((datetime.utcnow() + timedelta(hours=1)).timestamp())

        # First extension should succeed
        result1 = await service.extend_token_by_loyalty(
            user_id=test_user.id,
            current_expiry=current_expiry
        )
        assert result1["success"] is True

        # Second extension on same day should fail
        with pytest.raises(TokenExtensionError, match="Loyalty extension already claimed today"):
            await service.extend_token_by_loyalty(
                user_id=test_user.id,
                current_expiry=current_expiry
            )


class TestLoginTracking:
    """Test daily login tracking"""

    @pytest.mark.asyncio
    async def test_track_login_new_day(self, db_session: AsyncSession, test_user: User):
        """
        Test: Track login on a new day
        Expected: Create new login history record, increment streak
        """
        service = TokenExtensionService(db_session)
        today = date.today()

        result = await service.track_daily_login(test_user.id, today)

        assert result["is_new_day"] is True
        assert result["login_date"] == today.isoformat()
        assert result["consecutive_days"] == 1

        # Verify database record
        history = await db_session.execute(
            text(f"SELECT * FROM user_login_history WHERE user_id = '{test_user.id}' AND login_date = '{today}'")
        )
        record = history.fetchone()
        assert record is not None
        assert record.login_count == 1

    @pytest.mark.asyncio
    async def test_track_login_same_day_multiple_times(self, db_session: AsyncSession, test_user: User):
        """
        Test: Track multiple logins on the same day
        Expected: Increment login_count, no new record created
        """
        service = TokenExtensionService(db_session)
        today = date.today()

        # First login
        result1 = await service.track_daily_login(test_user.id, today)
        assert result1["is_new_day"] is True

        # Second login same day
        result2 = await service.track_daily_login(test_user.id, today)
        assert result2["is_new_day"] is False

        # Verify login_count incremented
        history = await db_session.execute(
            text(f"SELECT * FROM user_login_history WHERE user_id = '{test_user.id}' AND login_date = '{today}'")
        )
        record = history.fetchone()
        assert record.login_count == 2

    @pytest.mark.asyncio
    async def test_check_loyalty_eligibility(self, db_session: AsyncSession, test_user: User):
        """
        Test: Check if user is eligible for loyalty extension
        Expected: Return eligibility status and login day count
        """
        service = TokenExtensionService(db_session)

        # Create 3 days of login
        today = date.today()
        for i in range(3):
            login_date = today - timedelta(days=i)
            await service.track_daily_login(test_user.id, login_date)

        eligibility = await service.check_loyalty_eligibility(test_user.id)

        assert eligibility["is_eligible"] is True
        assert eligibility["login_days_count"] == 3
        assert len(eligibility["login_dates"]) == 3
        assert eligibility["extension_available"] is True


class TestEdgeCases:
    """Test edge cases and error handling"""

    @pytest.mark.asyncio
    async def test_extend_token_user_not_found(self, db_session: AsyncSession):
        """
        Test: Handle non-existent user gracefully
        Expected: Raise appropriate error
        """
        service = TokenExtensionService(db_session)
        fake_user_id = "00000000-0000-0000-0000-000000000000"

        with pytest.raises(Exception, match="找不到居民"):
            await service.extend_token_by_activity(
                user_id=fake_user_id,
                current_expiry=int(datetime.utcnow().timestamp()),
                activity_duration=1800
            )

    @pytest.mark.asyncio
    async def test_extend_token_expired_token(self, db_session: AsyncSession, test_user: User):
        """
        Test: Handle already-expired token
        Expected: Reject extension, require re-login
        """
        service = TokenExtensionService(db_session)

        # Token expired 1 hour ago
        expired_expiry = int((datetime.utcnow() - timedelta(hours=1)).timestamp())

        with pytest.raises(TokenExtensionError, match="Token already expired"):
            await service.extend_token_by_activity(
                user_id=test_user.id,
                current_expiry=expired_expiry,
                activity_duration=1800
            )

    @pytest.mark.asyncio
    async def test_loyalty_streak_calculation(self, db_session: AsyncSession, test_user: User):
        """
        Test: Correctly calculate consecutive login days
        Expected: Streak breaks when a day is missed
        """
        service = TokenExtensionService(db_session)
        today = date.today()

        # Login on days: today, yesterday, 3 days ago (missed day -2)
        await service.track_daily_login(test_user.id, today)
        await service.track_daily_login(test_user.id, today - timedelta(days=1))
        await service.track_daily_login(test_user.id, today - timedelta(days=3))

        eligibility = await service.check_loyalty_eligibility(test_user.id)

        # Should have 2 consecutive days (today and yesterday)
        # Day -3 doesn't count as consecutive
        assert eligibility["current_streak"] == 2


# Fixtures
@pytest.fixture(autouse=True)
async def cleanup_db(db_session: AsyncSession):
    """Auto-cleanup database after each test"""
    yield
    # Rollback any uncommitted changes
    await db_session.rollback()
    # Clean up all test data
    from sqlalchemy import text
    await db_session.execute(text("TRUNCATE TABLE token_extension_history, user_login_history, users CASCADE"))
    await db_session.commit()


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user"""
    user = User(
        email="test@example.com",
        name="Test User",
        password_hash="hashed_password",
        karma_score=50,
        is_active=True
    )
    db_session.add(user)
    await db_session.flush()  # Flush instead of commit, so rollback will clean up
    await db_session.refresh(user)
    return user
