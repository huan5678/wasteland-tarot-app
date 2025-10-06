"""
User Model Tests - Wasteland Tarot User System
Testing user authentication, profiles, and preferences
"""

import pytest
import asyncio
from typing import Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import (
    User,
    UserProfile,
    UserPreferences,
    FactionAlignment
)
from app.models.reading_enhanced import Reading
from app.models.wasteland_card import KarmaAlignment, CharacterVoice
from app.services.user_service import UserService
from app.core.security import get_password_hash, verify_password


@pytest.mark.unit
class TestUserModel:
    """Test User model functionality"""

    def test_user_model_creation(self, db_session: AsyncSession):
        """Test basic user model creation and validation"""
        user_data = {
            "username": "vault_dweller_101",
            "email": "dweller@vault101.com",
            "password_hash": get_password_hash("SecurePass123!"),
            "display_name": "Vault Dweller",
            "faction_alignment": FactionAlignment.VAULT_DWELLER.value,  # Use .value for string
            "karma_score": 50,  # Neutral karma
            "is_active": True,
            "is_verified": False
        }

        user = User(**user_data)
        assert user.username == "vault_dweller_101"
        assert user.email == "dweller@vault101.com"
        assert user.display_name == "Vault Dweller"
        assert user.faction_alignment == FactionAlignment.VAULT_DWELLER.value
        assert user.karma_score == 50
        assert user.is_active is True
        assert user.is_verified is False
        # created_at is only set when saved to database, so we'll test the model structure

    def test_user_password_hashing(self, db_session: AsyncSession):
        """Test password hashing and verification"""
        plain_password = "WastelandSurvivor123!"
        hashed_password = get_password_hash(plain_password)

        user = User(
            username="wasteland_survivor",
            email="survivor@wasteland.com",
            password_hash=hashed_password
        )

        # Verify password
        assert verify_password(plain_password, user.password_hash) is True
        assert verify_password("wrong_password", user.password_hash) is False

    def test_user_karma_properties(self, db_session: AsyncSession):
        """Test karma-based user properties"""
        # Good karma user
        good_user = User(
            username="saint_wanderer",
            email="good@wasteland.com",
            karma_score=80
        )
        assert good_user.karma_alignment() == KarmaAlignment.GOOD

        # Neutral karma user
        neutral_user = User(
            username="neutral_trader",
            email="neutral@wasteland.com",
            karma_score=50
        )
        assert neutral_user.karma_alignment() == KarmaAlignment.NEUTRAL

        # Evil karma user
        evil_user = User(
            username="raider_boss",
            email="evil@wasteland.com",
            karma_score=20
        )
        assert evil_user.karma_alignment() == KarmaAlignment.EVIL

    def test_user_faction_methods(self, db_session: AsyncSession):
        """Test faction-related user methods"""
        brotherhood_user = User(
            username="brotherhood_knight",
            email="knight@brotherhood.org",
            faction_alignment=FactionAlignment.BROTHERHOOD
        )

        assert brotherhood_user.is_brotherhood_member() is True
        assert brotherhood_user.get_faction_rank() == "Initiate"  # Default rank
        assert brotherhood_user.get_faction_benefits() is not None

    def test_user_reading_limits(self, db_session: AsyncSession):
        """Test daily reading limits and restrictions"""
        user = User(
            username="frequent_reader",
            email="reader@vault.com",
            daily_readings_count=15  # Near limit
        )

        assert user.can_create_reading() is True  # Under limit

        # Simulate reaching daily limit
        user.daily_readings_count = 20  # At limit
        assert user.can_create_reading() is False


@pytest.mark.unit
class TestUserProfile:
    """Test UserProfile model functionality"""

    def test_user_profile_creation(self, db_session: AsyncSession):
        """Test user profile creation and preferences"""
        user_id = "test-user-id-123"

        profile_data = {
            "user_id": user_id,
            "preferred_voice": CharacterVoice.PIP_BOY,
            "bio": "Wandering the wasteland seeking wisdom through the cards",
            "vault_number": 101,
            "wasteland_location": "Capital Wasteland",
            "favorite_faction": FactionAlignment.BROTHERHOOD,
            "experience_level": "Novice Survivor",
            "total_readings": 25,
            "favorite_card_suit": "major_arcana",
            "preferred_reading_style": "detailed_analysis"
        }

        profile = UserProfile(**profile_data)
        assert profile.user_id == user_id
        assert profile.preferred_voice == CharacterVoice.PIP_BOY
        assert profile.vault_number == 101
        assert profile.wasteland_location == "Capital Wasteland"
        assert profile.total_readings == 25

    def test_profile_achievements(self, db_session: AsyncSession):
        """Test user achievement tracking"""
        profile = UserProfile(
            user_id="achiever-123",
            total_readings=100,
            consecutive_days=30,
            rare_cards_found=5
        )

        achievements = profile.get_achievements()
        assert "century_reader" in achievements  # 100+ readings
        assert "month_streak" in achievements    # 30 day streak
        assert "rare_collector" in achievements # 5+ rare cards

    def test_profile_statistics(self, db_session: AsyncSession):
        """Test profile statistics calculation"""
        profile = UserProfile(
            user_id="stats-user",
            total_readings=50,
            accurate_predictions=35,
            favorite_card_suit="major_arcana"
        )

        stats = profile.calculate_statistics()
        assert stats["accuracy_rate"] == 0.7  # 35/50
        assert stats["total_readings"] == 50
        assert stats["preferred_suit"] == "major_arcana"


@pytest.mark.unit
class TestUserPreferences:
    """Test UserPreferences model functionality"""

    def test_reading_preferences(self, db_session: AsyncSession):
        """Test user reading preferences"""
        preferences = UserPreferences(
            user_id="pref-user-123",
            default_character_voice=CharacterVoice.WASTELAND_TRADER,
            auto_save_readings=True,
            share_readings_publicly=False,
            notification_frequency="weekly",
            preferred_card_back="vault_tech",
            reading_reminder_time="19:00",
            favorite_spread_types=["single_card", "three_card", "celtic_cross"]
        )

        assert preferences.default_character_voice == CharacterVoice.WASTELAND_TRADER
        assert preferences.auto_save_readings is True
        assert preferences.share_readings_publicly is False
        assert "celtic_cross" in preferences.favorite_spread_types

    def test_ui_preferences(self, db_session: AsyncSession):
        """Test UI and display preferences"""
        preferences = UserPreferences(
            user_id="ui-user-123",
            theme="dark_vault",
            pip_boy_color="amber",
            terminal_effects=True,
            sound_effects=True,
            geiger_counter_volume=0.7,
            background_radiation_level=0.3
        )

        assert preferences.theme == "dark_vault"
        assert preferences.pip_boy_color == "amber"
        assert preferences.terminal_effects is True
        assert preferences.geiger_counter_volume == 0.7

    def test_privacy_preferences(self, db_session: AsyncSession):
        """Test privacy and sharing preferences"""
        preferences = UserPreferences(
            user_id="privacy-user",
            public_profile=False,
            allow_friend_requests=True,
            share_reading_history=False,
            data_collection_consent=True
        )

        assert preferences.is_profile_public() is False
        assert preferences.allows_social_features() is True
        assert preferences.shares_data() is False


@pytest.mark.unit
class TestUserReadingHistory:
    """Test user reading history and relationships"""

    def test_user_reading_relationship(self, db_session: AsyncSession):
        """Test relationship between users and readings"""
        user_id = "reader-123"

        reading_data = {
            "user_id": user_id,
            "question": "What challenges await me in the wasteland?",
            "spread_type": "three_card",
            "cards_drawn": ["The Vault Newbie", "The Tech Specialist", "The Wanderer"],
            "interpretation": "Your journey begins with innocence...",
            "character_voice": CharacterVoice.PIP_BOY,
            "karma_context": KarmaAlignment.GOOD,
            "faction_influence": FactionAlignment.VAULT_DWELLER
        }

        reading = Reading(**reading_data)
        assert reading.user_id == user_id
        assert reading.question == "What challenges await me in the wasteland?"
        assert reading.character_voice == CharacterVoice.PIP_BOY
        assert len(reading.cards_drawn) == 3

    def test_reading_privacy_settings(self, db_session: AsyncSession):
        """Test reading privacy and sharing options"""
        reading = Reading(
            user_id="private-user",
            question="Personal wasteland guidance",
            is_private=True,
            allow_public_sharing=False,
            share_with_friends=True
        )

        assert reading.is_accessible_to_public() is False
        assert reading.is_shareable_with_friends() is True
        assert reading.is_completely_private() is False

    def test_reading_search_and_filtering(self, db_session: AsyncSession):
        """Test reading search and filtering capabilities"""
        readings = [
            Reading(
                user_id="search-user",
                question="Love guidance",
                tags=["love", "relationships"],
                character_voice=CharacterVoice.VAULT_DWELLER
            ),
            Reading(
                user_id="search-user",
                question="Career advice",
                tags=["career", "work"],
                character_voice=CharacterVoice.WASTELAND_TRADER
            )
        ]

        # Test filtering by tags
        love_readings = [r for r in readings if "love" in r.tags]
        assert len(love_readings) == 1

        # Test filtering by character voice
        trader_readings = [r for r in readings if r.character_voice == CharacterVoice.WASTELAND_TRADER]
        assert len(trader_readings) == 1


@pytest.mark.unit
class TestUserSocialFeatures:
    """Test social features and user interactions"""

    def test_user_friendships(self, db_session: AsyncSession):
        """Test user friendship system"""
        user1 = User(
            username="wanderer_1",
            email="w1@wasteland.com",
            allow_friend_requests=True
        )

        user2 = User(
            username="wanderer_2",
            email="w2@wasteland.com",
            allow_friend_requests=True
        )

        # Test friend request functionality
        assert user1.can_send_friend_request_to(user2) is True
        assert user1.get_mutual_friends_with(user2) == []

    def test_reading_sharing(self, db_session: AsyncSession):
        """Test reading sharing between users"""
        shared_reading = Reading(
            user_id="sharer-123",
            question="Wisdom to share",
            is_private=False,
            allow_public_sharing=True,
            shared_with_users=["friend1", "friend2"]
        )

        assert shared_reading.is_shared_with_user("friend1") is True
        assert shared_reading.is_shared_with_user("stranger") is False
        assert shared_reading.get_share_count() == 2

    def test_community_features(self, db_session: AsyncSession):
        """Test community and group features"""
        user = User(
            username="community_member",
            email="member@community.com",
            joined_groups=["Brotherhood Knights", "Vault Dwellers Union"],
            community_points=150
        )

        assert user.is_community_member() is True
        assert user.get_community_rank() == "Regular Member"
        assert "Brotherhood Knights" in user.joined_groups


@pytest.mark.unit
class TestUserSecurityAndValidation:
    """Test user security, validation, and data integrity"""

    def test_email_validation(self, db_session: AsyncSession):
        """Test email format validation"""
        valid_emails = [
            "user@vault-tec.com",
            "survivor123@wasteland.org",
            "test.user+tag@example.co.uk"
        ]

        invalid_emails = [
            "invalid-email",
            "@missing-local.com",
            "no-at-symbol.com",
            "spaces in@email.com"
        ]

        for email in valid_emails:
            user = User(username="test", email=email)
            assert user.is_valid_email() is True

        for email in invalid_emails:
            user = User(username="test", email=email)
            assert user.is_valid_email() is False

    def test_username_validation(self, db_session: AsyncSession):
        """Test username format and uniqueness validation"""
        valid_usernames = [
            "vault_dweller_101",
            "WastelandWanderer",
            "survivor-2281",
            "user123"
        ]

        invalid_usernames = [
            "a",  # Too short
            "a" * 51,  # Too long
            "user with spaces",
            "user@special",
            ""  # Empty
        ]

        for username in valid_usernames:
            user = User(username=username, email="test@example.com")
            assert user.is_valid_username() is True

        for username in invalid_usernames:
            user = User(username=username, email="test@example.com")
            assert user.is_valid_username() is False

    def test_user_data_sanitization(self, db_session: AsyncSession):
        """Test user input sanitization and security"""
        user = User(
            username="test_user",
            email="test@example.com",
            display_name="<script>alert('xss')</script>Test User"
        )

        # Should sanitize XSS attempts
        assert "<script>" not in user.get_sanitized_display_name()
        assert "Test User" in user.get_sanitized_display_name()

    def test_session_management(self, db_session: AsyncSession):
        """Test user session and token management"""
        user = User(
            username="session_user",
            email="session@test.com",
            last_login=datetime.utcnow(),
            session_count=5,
            failed_login_attempts=0
        )

        # Test session validation
        assert user.is_session_valid() is True

        # Test account locking after failed attempts
        user.failed_login_attempts = 5
        assert user.is_account_locked() is True

    def test_data_export_and_privacy(self, db_session: AsyncSession):
        """Test user data export and privacy compliance"""
        user = User(
            username="privacy_user",
            email="privacy@test.com"
        )

        profile = UserProfile(user_id=user.id, bio="Test bio")
        preferences = UserPreferences(user_id=user.id, theme="dark")

        # Test data export functionality
        exported_data = user.export_user_data(include_profile=True, include_preferences=True)

        assert "username" in exported_data
        assert "email" in exported_data
        assert "profile" in exported_data
        assert "preferences" in exported_data
        assert "password_hash" not in exported_data  # Should not export sensitive data