"""
Unit tests for Gamification Karma Service
Tests Karma granting, level calculation, and event triggering
"""

import pytest
from datetime import datetime
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.gamification_karma_service import (
    GamificationKarmaService,
    calculate_level,
    calculate_karma_to_next_level
)
from app.models.gamification import KarmaLog, UserKarma
from app.models.user import User


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user."""
    user = User(
        id=uuid4(),
        email="test@example.com",
        name="testuser",
        password_hash="dummy_hash",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def karma_service(db_session: AsyncSession):
    """Create GamificationKarmaService instance."""
    return GamificationKarmaService(db_session)


class TestLevelCalculation:
    """Test level calculation functions."""

    def test_calculate_level_basic(self):
        """Test basic level calculation."""
        assert calculate_level(0) == 1
        assert calculate_level(499) == 1
        assert calculate_level(500) == 2
        assert calculate_level(999) == 2
        assert calculate_level(1000) == 3
        assert calculate_level(1500) == 4
        assert calculate_level(5000) == 11

    def test_calculate_karma_to_next_level(self):
        """Test karma needed to reach next level."""
        assert calculate_karma_to_next_level(0) == 500
        assert calculate_karma_to_next_level(250) == 250
        assert calculate_karma_to_next_level(499) == 1
        assert calculate_karma_to_next_level(500) == 500  # Just leveled up, need 500 more
        assert calculate_karma_to_next_level(750) == 250
        assert calculate_karma_to_next_level(1000) == 500


class TestGrantKarma:
    """Test grant_karma function."""

    @pytest.mark.asyncio
    async def test_grant_karma_new_user(self, karma_service, test_user, db_session):
        """Test granting Karma to a new user (no existing UserKarma)."""
        result = await karma_service.grant_karma(
            user_id=test_user.id,
            action_type="complete_reading",
            karma_amount=10,
            description="完成占卜",
            metadata={"reading_id": str(uuid4())}
        )

        # Verify result structure
        assert result["success"] is True
        assert result["total_karma"] == 10
        assert result["level_changed"] is False
        assert result["new_level"] == 1

        # Verify UserKarma record created
        from sqlalchemy import select
        user_karma_result = await db_session.execute(
            select(UserKarma).where(UserKarma.user_id == test_user.id)
        )
        user_karma = user_karma_result.scalar_one()

        assert user_karma.total_karma == 10
        assert user_karma.current_level == 1
        assert user_karma.karma_to_next_level == 490

        # Verify KarmaLog created
        log_result = await db_session.execute(
            select(KarmaLog).where(KarmaLog.user_id == test_user.id)
        )
        log = log_result.scalar_one()

        assert log.karma_amount == 10
        assert log.action_type == "complete_reading"
        assert log.description == "完成占卜"

    @pytest.mark.asyncio
    async def test_grant_karma_level_up(self, karma_service, test_user, db_session):
        """Test Karma grant triggering level up."""
        # Initialize user with 490 karma (1 point away from level 2)
        user_karma = UserKarma(
            user_id=test_user.id,
            total_karma=490,
            current_level=1,
            karma_to_next_level=10
        )
        db_session.add(user_karma)
        await db_session.commit()

        # Grant 20 karma (should trigger level up)
        result = await karma_service.grant_karma(
            user_id=test_user.id,
            action_type="complete_task",
            karma_amount=20,
            description="完成每日任務"
        )

        assert result["success"] is True
        assert result["total_karma"] == 510
        assert result["level_changed"] is True
        assert result["new_level"] == 2

        # Verify UserKarma updated
        await db_session.refresh(user_karma)
        assert user_karma.total_karma == 510
        assert user_karma.current_level == 2
        assert user_karma.karma_to_next_level == 490  # Need 1000 total for level 3

    @pytest.mark.asyncio
    async def test_grant_karma_multiple_level_ups(self, karma_service, test_user, db_session):
        """Test multiple level ups in one grant."""
        # Start at level 1 with 0 karma
        result = await karma_service.grant_karma(
            user_id=test_user.id,
            action_type="milestone",
            karma_amount=1200,
            description="特殊里程碑獎勵"
        )

        assert result["total_karma"] == 1200
        assert result["level_changed"] is True
        assert result["new_level"] == 3  # Should jump to level 3

    @pytest.mark.asyncio
    async def test_grant_karma_atomic_transaction(self, karma_service, test_user, db_session):
        """Test that Karma grant is atomic (all-or-nothing)."""
        # This test would require forcing a failure mid-transaction
        # For now, verify that both UserKarma and KarmaLog are created together

        result = await karma_service.grant_karma(
            user_id=test_user.id,
            action_type="daily_login",
            karma_amount=5,
            description="每日首次登入"
        )

        assert result["success"] is True

        # Verify both records exist
        from sqlalchemy import select
        user_karma_result = await db_session.execute(
            select(UserKarma).where(UserKarma.user_id == test_user.id)
        )
        log_result = await db_session.execute(
            select(KarmaLog).where(KarmaLog.user_id == test_user.id)
        )

        assert user_karma_result.scalar_one() is not None
        assert log_result.scalar_one() is not None

    @pytest.mark.asyncio
    async def test_grant_karma_with_metadata(self, karma_service, test_user, db_session):
        """Test Karma grant with rich metadata."""
        metadata = {
            "reading_id": str(uuid4()),
            "spread_type": "three_card",
            "cards_drawn": ["fool", "magician", "empress"]
        }

        result = await karma_service.grant_karma(
            user_id=test_user.id,
            action_type="complete_reading",
            karma_amount=10,
            description="完成占卜",
            metadata=metadata
        )

        assert result["success"] is True

        # Verify metadata stored correctly
        from sqlalchemy import select
        log_result = await db_session.execute(
            select(KarmaLog).where(KarmaLog.user_id == test_user.id)
        )
        log = log_result.scalar_one()

        assert log.action_metadata == metadata
        assert log.action_metadata["spread_type"] == "three_card"


class TestLevelUpEvent:
    """Test level up event triggering."""

    @pytest.mark.asyncio
    async def test_trigger_level_up_event(self, karma_service, test_user):
        """Test that level up event is triggered correctly."""
        # This is a placeholder - actual implementation would trigger notifications
        # or other side effects
        result = await karma_service.trigger_level_up_event(test_user.id, 2)

        # For now, just verify it returns successfully
        assert result is True


class TestEdgeCases:
    """Test edge cases and error handling."""

    @pytest.mark.asyncio
    async def test_grant_karma_nonexistent_user(self, karma_service, db_session):
        """Test granting Karma to non-existent user."""
        fake_user_id = uuid4()

        with pytest.raises(Exception):  # Should raise UserNotFoundError
            await karma_service.grant_karma(
                user_id=fake_user_id,
                action_type="complete_reading",
                karma_amount=10,
                description="Test"
            )

    @pytest.mark.asyncio
    async def test_grant_negative_karma(self, karma_service, test_user):
        """Test that negative Karma amounts are rejected."""
        with pytest.raises(ValueError):
            await karma_service.grant_karma(
                user_id=test_user.id,
                action_type="test",
                karma_amount=-10,  # Should be rejected
                description="Negative karma test"
            )

    @pytest.mark.asyncio
    async def test_grant_zero_karma(self, karma_service, test_user):
        """Test that zero Karma amounts are rejected."""
        with pytest.raises(ValueError):
            await karma_service.grant_karma(
                user_id=test_user.id,
                action_type="test",
                karma_amount=0,  # Should be rejected
                description="Zero karma test"
            )
