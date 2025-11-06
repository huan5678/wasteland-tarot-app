"""
Unit Tests for UnifiedKarmaService (Task 2.1)
Tests dual-score system, level calculations, and backward compatibility
"""

import pytest
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.unified_karma_service import UnifiedKarmaService, KarmaRulesEngine
from app.models.user import User
from app.models.gamification import UserKarma, KarmaLog
from app.models.social_features import KarmaHistory, KarmaChangeReason
from app.core.exceptions import UserNotFoundError


class TestKarmaRulesEngine:
    """Test KarmaRulesEngine utility functions"""
    
    def test_get_alignment_category(self):
        """Test alignment category calculation"""
        assert KarmaRulesEngine.get_alignment_category(0) == "very_evil"
        assert KarmaRulesEngine.get_alignment_category(19) == "very_evil"
        assert KarmaRulesEngine.get_alignment_category(20) == "evil"
        assert KarmaRulesEngine.get_alignment_category(39) == "evil"
        assert KarmaRulesEngine.get_alignment_category(40) == "neutral"
        assert KarmaRulesEngine.get_alignment_category(59) == "neutral"
        assert KarmaRulesEngine.get_alignment_category(60) == "good"
        assert KarmaRulesEngine.get_alignment_category(79) == "good"
        assert KarmaRulesEngine.get_alignment_category(80) == "very_good"
        assert KarmaRulesEngine.get_alignment_category(100) == "very_good"
    
    def test_calculate_level(self):
        """Test level calculation formula"""
        assert KarmaRulesEngine.calculate_level(0) == 1
        assert KarmaRulesEngine.calculate_level(499) == 1
        assert KarmaRulesEngine.calculate_level(500) == 2
        assert KarmaRulesEngine.calculate_level(999) == 2
        assert KarmaRulesEngine.calculate_level(1000) == 3
        assert KarmaRulesEngine.calculate_level(5000) == 11
    
    def test_calculate_karma_to_next_level(self):
        """Test karma to next level calculation"""
        assert KarmaRulesEngine.calculate_karma_to_next_level(0) == 500
        assert KarmaRulesEngine.calculate_karma_to_next_level(250) == 250
        assert KarmaRulesEngine.calculate_karma_to_next_level(500) == 500
        assert KarmaRulesEngine.calculate_karma_to_next_level(750) == 250
        assert KarmaRulesEngine.calculate_karma_to_next_level(1000) == 500
    
    def test_calculate_karma_change(self):
        """Test karma change calculation from reason"""
        alignment, total = KarmaRulesEngine.calculate_karma_change(KarmaChangeReason.READING_ACCURACY)
        assert alignment == 2
        assert total == 2
        
        alignment, total = KarmaRulesEngine.calculate_karma_change(KarmaChangeReason.NEGATIVE_BEHAVIOR)
        assert alignment == -10
        assert total == 0  # Negative actions don't reduce total_karma


@pytest.mark.asyncio
class TestUnifiedKarmaService:
    """Test UnifiedKarmaService async methods"""
    
    @pytest.fixture
    async def service(self, db_session: AsyncSession):
        """Create service instance"""
        return UnifiedKarmaService(db_session)
    
    @pytest.fixture
    async def test_user(self, db_session: AsyncSession):
        """Create test user"""
        user = User(
            id=uuid4(),
            email=f"test_{uuid4()}@example.com",
            password_hash="dummy_hash"
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user
    
    async def test_initialize_karma_for_user(self, service, test_user, db_session):
        """Test user karma initialization"""
        # Initialize karma
        user_karma = await service.initialize_karma_for_user(test_user.id)
        
        assert user_karma is not None
        assert user_karma.user_id == test_user.id
        assert user_karma.alignment_karma == 50
        assert user_karma.total_karma == 50
        assert user_karma.current_level == 1
        assert user_karma.karma_to_next_level == 500
        
        # Should not create duplicate
        user_karma2 = await service.initialize_karma_for_user(test_user.id)
        assert user_karma2.id == user_karma.id
    
    async def test_add_karma_positive(self, service, test_user, db_session):
        """Test adding positive karma"""
        await service.initialize_karma_for_user(test_user.id)
        
        result = await service.add_karma(
            user_id=test_user.id,
            action_type="complete_reading",
            alignment_change=10,
            total_change=10,
            description="Completed first reading"
        )
        
        assert result["success"] is True
        assert result["alignment_karma"] == 60
        assert result["alignment_change"] == 10
        assert result["total_karma"] == 60
        assert result["total_change"] == 10
        assert result["current_level"] == 1
        assert result["level_changed"] is False
        assert result["alignment_category"] == "good"
    
    async def test_add_karma_level_up(self, service, test_user, db_session):
        """Test level up when total_karma crosses threshold"""
        await service.initialize_karma_for_user(test_user.id)
        
        # Add 500 karma to trigger level up
        result = await service.add_karma(
            user_id=test_user.id,
            action_type="achievement_unlock",
            alignment_change=50,
            total_change=500,
            description="Unlocked major achievement"
        )
        
        assert result["success"] is True
        assert result["total_karma"] == 550
        assert result["current_level"] == 2
        assert result["level_changed"] is True
        assert result["karma_to_next_level"] == 450  # 1000 - 550
    
    async def test_add_karma_alignment_bounds(self, service, test_user, db_session):
        """Test alignment_karma clamping to 0-100 range"""
        await service.initialize_karma_for_user(test_user.id)
        
        # Try to exceed 100
        result = await service.add_karma(
            user_id=test_user.id,
            action_type="test",
            alignment_change=100,
            total_change=0
        )
        assert result["alignment_karma"] == 100  # Clamped to 100
        
        # Try to go below 0
        result = await service.add_karma(
            user_id=test_user.id,
            action_type="test",
            alignment_change=-150,
            total_change=0
        )
        assert result["alignment_karma"] == 0  # Clamped to 0
    
    async def test_add_karma_negative_behavior(self, service, test_user, db_session):
        """Test that negative behavior reduces alignment but not total"""
        await service.initialize_karma_for_user(test_user.id)
        
        result = await service.add_karma(
            user_id=test_user.id,
            action_type="negative_action",
            reason=KarmaChangeReason.NEGATIVE_BEHAVIOR
        )
        
        assert result["alignment_karma"] == 40  # 50 - 10
        assert result["total_karma"] == 50  # Unchanged
        assert result["alignment_category"] == "neutral"
    
    async def test_get_karma_summary(self, service, test_user, db_session):
        """Test karma summary retrieval"""
        await service.initialize_karma_for_user(test_user.id)
        await service.add_karma(test_user.id, "test", 20, 100)
        
        summary = await service.get_karma_summary(test_user.id)
        
        assert summary["alignment_karma"] == 70
        assert summary["total_karma"] == 150
        assert summary["current_level"] == 1
        assert summary["karma_to_next_level"] == 350
        assert summary["alignment_category"] == "good"
        assert summary["today_earned"] == 100
    
    async def test_grant_karma_backward_compat(self, service, test_user, db_session):
        """Test grant_karma method (backward compatibility)"""
        await service.initialize_karma_for_user(test_user.id)
        
        result = await service.grant_karma(
            user_id=test_user.id,
            action_type="daily_login",
            karma_amount=10,
            description="Daily login bonus"
        )
        
        assert result["success"] is True
        assert result["alignment_karma"] == 60
        assert result["total_karma"] == 60
    
    async def test_get_karma_logs(self, service, test_user, db_session):
        """Test karma logs retrieval"""
        await service.initialize_karma_for_user(test_user.id)
        await service.add_karma(test_user.id, "action1", 5, 10)
        await service.add_karma(test_user.id, "action2", 0, 20)
        
        logs = await service.get_karma_logs(test_user.id, limit=10)
        
        assert len(logs) == 2
        assert logs[0].karma_amount in [10, 20]
        assert logs[0].action_type in ["action1", "action2"]
    
    async def test_get_karma_history(self, service, test_user, db_session):
        """Test karma history retrieval"""
        await service.initialize_karma_for_user(test_user.id)
        await service.add_karma(test_user.id, "test", 10, 10)
        
        history = await service.get_karma_history(test_user.id, limit=10)
        
        assert len(history) >= 1
        assert isinstance(history[0], KarmaHistory)
    
    async def test_user_not_found(self, service, db_session):
        """Test error handling for non-existent user"""
        fake_user_id = uuid4()
        
        with pytest.raises(UserNotFoundError):
            await service.add_karma(fake_user_id, "test", 10, 10)


@pytest.mark.asyncio
class TestKarmaServiceIntegration:
    """Integration tests with database"""
    
    async def test_dual_score_independence(self, db_session: AsyncSession):
        """Test that alignment and total karma can be updated independently"""
        service = UnifiedKarmaService(db_session)
        
        user = User(id=uuid4(), email=f"test_{uuid4()}@example.com", password_hash="dummy")
        db_session.add(user)
        await db_session.commit()
        
        await service.initialize_karma_for_user(user.id)
        
        # Increase only alignment
        await service.add_karma(user.id, "test", alignment_change=20, total_change=0)
        summary = await service.get_karma_summary(user.id)
        assert summary["alignment_karma"] == 70
        assert summary["total_karma"] == 50
        
        # Increase only total
        await service.add_karma(user.id, "test", alignment_change=0, total_change=100)
        summary = await service.get_karma_summary(user.id)
        assert summary["alignment_karma"] == 70
        assert summary["total_karma"] == 150
    
    async def test_alignment_category_transitions(self, db_session: AsyncSession):
        """Test alignment category changes as karma changes"""
        service = UnifiedKarmaService(db_session)
        
        user = User(id=uuid4(), email=f"test_{uuid4()}@example.com", password_hash="dummy")
        db_session.add(user)
        await db_session.commit()
        
        await service.initialize_karma_for_user(user.id)
        
        # Start at neutral (50)
        summary = await service.get_karma_summary(user.id)
        assert summary["alignment_category"] == "neutral"
        
        # Move to good (60+)
        result = await service.add_karma(user.id, "test", alignment_change=15, total_change=0)
        assert result["alignment_category"] == "good"
        assert result["alignment_changed"] is True
        
        # Move to very_good (80+)
        await service.add_karma(user.id, "test", alignment_change=20, total_change=0)
        summary = await service.get_karma_summary(user.id)
        assert summary["alignment_category"] == "very_good"
        
        # Move back to neutral with negative karma
        await service.add_karma(user.id, "test", alignment_change=-50, total_change=0)
        summary = await service.get_karma_summary(user.id)
        assert summary["alignment_category"] == "neutral"
