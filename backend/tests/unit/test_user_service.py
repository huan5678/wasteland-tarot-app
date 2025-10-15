"""
User Service Tests - Testing business logic for user management
"""

import pytest
import asyncio
from typing import Dict, Any, List
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_service import UserService, AuthenticationService
from app.models.user import User, UserProfile, UserPreferences
from app.models.wasteland_card import KarmaAlignment, CharacterVoice, FactionAlignment
from app.core.security import create_access_token, verify_token
from app.core.exceptions import (
    UserNotFoundError,
    InvalidCredentialsError,
    UserAlreadyExistsError,
    AccountLockedError
)


@pytest.mark.unit
class TestUserService:
    """Test UserService business logic"""

    @pytest.fixture
    def user_service(self, db_session: AsyncSession):
        """Create UserService instance for testing"""
        return UserService(db_session)

    async def test_create_user_success(self, user_service: UserService):
        """Test successful user creation"""
        user_data = {
            "username": "new_wanderer",
            "email": "wanderer@wasteland.com",
            "password": "SecurePass123!",
            "display_name": "Wasteland Wanderer",
            "faction_alignment": FactionAlignment.VAULT_DWELLER
        }

        created_user = await user_service.create_user(user_data)

        assert created_user.username == "new_wanderer"
        assert created_user.email == "wanderer@wasteland.com"
        assert created_user.display_name == "Wasteland Wanderer"
        assert created_user.faction_alignment == FactionAlignment.VAULT_DWELLER
        assert created_user.is_active is True
        assert created_user.is_verified is False
        assert created_user.password_hash != "SecurePass123!"  # Should be hashed

    async def test_create_user_duplicate_username(self, user_service: UserService):
        """Test user creation with duplicate username"""
        user_data1 = {
            "username": "duplicate_user",
            "email": "user1@test.com",
            "password": "Pass123!"
        }

        user_data2 = {
            "username": "duplicate_user",  # Same username
            "email": "user2@test.com",
            "password": "Pass456!"
        }

        # Create first user
        await user_service.create_user(user_data1)

        # Try to create second user with same username
        with pytest.raises(UserAlreadyExistsError):
            await user_service.create_user(user_data2)

    async def test_create_user_duplicate_email(self, user_service: UserService):
        """Test user creation with duplicate email"""
        user_data1 = {
            "username": "user1",
            "email": "duplicate@test.com",
            "password": "Pass123!"
        }

        user_data2 = {
            "username": "user2",
            "email": "duplicate@test.com",  # Same email
            "password": "Pass456!"
        }

        # Create first user
        await user_service.create_user(user_data1)

        # Try to create second user with same email
        with pytest.raises(UserAlreadyExistsError):
            await user_service.create_user(user_data2)

    async def test_get_user_by_id(self, user_service: UserService):
        """Test retrieving user by ID"""
        # Create a user first
        user_data = {
            "username": "findable_user",
            "email": "findable@test.com",
            "password": "Pass123!"
        }
        created_user = await user_service.create_user(user_data)

        # Find the user
        found_user = await user_service.get_user_by_id(created_user.id)

        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.username == "findable_user"

    async def test_get_user_by_id_not_found(self, user_service: UserService):
        """Test retrieving non-existent user by ID"""
        with pytest.raises(UserNotFoundError):
            await user_service.get_user_by_id("non-existent-id")

    async def test_get_user_by_username(self, user_service: UserService):
        """Test retrieving user by username"""
        user_data = {
            "username": "searchable_user",
            "email": "searchable@test.com",
            "password": "Pass123!"
        }
        created_user = await user_service.create_user(user_data)

        found_user = await user_service.get_user_by_username("searchable_user")

        assert found_user is not None
        assert found_user.username == "searchable_user"
        assert found_user.email == "searchable@test.com"

    async def test_update_user_profile(self, user_service: UserService):
        """Test updating user profile information"""
        # Create user
        user_data = {
            "username": "updatable_user",
            "email": "update@test.com",
            "password": "Pass123!"
        }
        user = await user_service.create_user(user_data)

        # Update profile
        profile_updates = {
            "display_name": "Updated Wanderer",
            "bio": "A seasoned wasteland survivor",
            "wasteland_location": "Mojave Wasteland"
        }

        updated_user = await user_service.update_user_profile(user.id, profile_updates)

        assert updated_user.display_name == "Updated Wanderer"
        # Profile should be created if it doesn't exist
        assert updated_user.profile is not None
        assert updated_user.profile.bio == "A seasoned wasteland survivor"

    async def test_update_user_preferences(self, user_service: UserService):
        """Test updating user preferences"""
        user_data = {
            "username": "pref_user",
            "email": "pref@test.com",
            "password": "Pass123!"
        }
        user = await user_service.create_user(user_data)

        preferences_updates = {
            "default_character_voice": CharacterVoice.WASTELAND_TRADER,
            "theme": "dark_vault",
            "auto_save_readings": True,
            "notification_frequency": "daily"
        }

        updated_user = await user_service.update_user_preferences(user.id, preferences_updates)

        assert updated_user.preferences is not None
        assert updated_user.preferences.default_character_voice == CharacterVoice.WASTELAND_TRADER
        assert updated_user.preferences.theme == "dark_vault"

    async def test_delete_user(self, user_service: UserService):
        """Test user deletion"""
        user_data = {
            "username": "deletable_user",
            "email": "delete@test.com",
            "password": "Pass123!"
        }
        user = await user_service.create_user(user_data)

        # Delete user
        await user_service.delete_user(user.id)

        # Verify user is deleted
        with pytest.raises(UserNotFoundError):
            await user_service.get_user_by_id(user.id)

    async def test_user_reading_history(self, user_service: UserService):
        """Test retrieving user reading history"""
        user_data = {
            "username": "reader_user",
            "email": "reader@test.com",
            "password": "Pass123!"
        }
        user = await user_service.create_user(user_data)

        # Get reading history (should be empty for new user)
        history = await user_service.get_user_reading_history(
            user.id,
            limit=10,
            offset=0
        )

        assert isinstance(history, list)
        assert len(history) == 0  # New user should have no readings

    async def test_user_statistics(self, user_service: UserService):
        """Test calculating user statistics"""
        user_data = {
            "username": "stats_user",
            "email": "stats@test.com",
            "password": "Pass123!"
        }
        user = await user_service.create_user(user_data)

        stats = await user_service.get_user_statistics(user.id)

        assert "total_readings" in stats
        assert "karma_alignment" in stats
        assert "faction_alignment" in stats
        assert "accuracy_rate" in stats
        assert "favorite_cards" in stats
        assert stats["total_readings"] == 0  # New user


@pytest.mark.unit
class TestAuthenticationService:
    """Test AuthenticationService for login, logout, and token management"""

    @pytest.fixture
    def auth_service(self, db_session: AsyncSession):
        """Create AuthenticationService instance"""
        return AuthenticationService(db_session)

    @pytest.fixture
    def sample_user_data(self):
        """Sample user data for authentication tests"""
        return {
            "username": "auth_test_user",
            "email": "auth@test.com",
            "password": "SecurePass123!",
            "display_name": "Auth Test User"
        }

    async def test_register_user_success(self, auth_service: AuthenticationService, sample_user_data):
        """Test successful user registration"""
        result = await auth_service.register_user(sample_user_data)

        assert "user" in result
        assert "access_token" in result
        assert "refresh_token" in result
        assert result["user"]["username"] == "auth_test_user"
        assert result["user"]["email"] == "auth@test.com"
        assert result["user"]["is_verified"] is False

    async def test_login_success(self, auth_service: AuthenticationService, sample_user_data):
        """Test successful user login"""
        # Register user first
        await auth_service.register_user(sample_user_data)

        # Attempt login
        login_result = await auth_service.login_user(
            "auth_test_user",
            "SecurePass123!"
        )

        assert "user" in login_result
        assert "access_token" in login_result
        assert "refresh_token" in login_result
        assert login_result["user"]["username"] == "auth_test_user"

    async def test_login_invalid_username(self, auth_service: AuthenticationService):
        """Test login with invalid username"""
        with pytest.raises(InvalidCredentialsError):
            await auth_service.login_user("non_existent_user", "password")

    async def test_login_invalid_password(self, auth_service: AuthenticationService, sample_user_data):
        """Test login with invalid password"""
        # Register user first
        await auth_service.register_user(sample_user_data)

        # Attempt login with wrong password
        with pytest.raises(InvalidCredentialsError):
            await auth_service.login_user("auth_test_user", "wrong_password")

    async def test_login_account_locked(self, auth_service: AuthenticationService, sample_user_data):
        """Test login with locked account"""
        # Register user
        user_result = await auth_service.register_user(sample_user_data)
        user_id = user_result["user"]["id"]

        # Lock the account (simulate too many failed attempts)
        await auth_service.lock_user_account(user_id)

        # Attempt login
        with pytest.raises(AccountLockedError):
            await auth_service.login_user("auth_test_user", "SecurePass123!")

    async def test_refresh_token(self, auth_service: AuthenticationService, sample_user_data):
        """Test refreshing access token"""
        # Register and login user
        login_result = await auth_service.register_user(sample_user_data)
        refresh_token = login_result["refresh_token"]

        # Refresh token
        refresh_result = await auth_service.refresh_access_token(refresh_token)

        assert "access_token" in refresh_result
        assert "refresh_token" in refresh_result
        assert refresh_result["access_token"] != login_result["access_token"]

    async def test_logout_user(self, auth_service: AuthenticationService, sample_user_data):
        """Test user logout and token invalidation"""
        # Register and login user
        login_result = await auth_service.register_user(sample_user_data)
        access_token = login_result["access_token"]

        # Logout user
        await auth_service.logout_user(access_token)

        # Verify token is invalidated
        is_valid = await auth_service.is_token_valid(access_token)
        assert is_valid is False

    async def test_verify_user_email(self, auth_service: AuthenticationService, sample_user_data):
        """Test email verification process"""
        # Register user
        user_result = await auth_service.register_user(sample_user_data)
        user_id = user_result["user"]["id"]

        # Generate verification token
        verification_token = await auth_service.generate_verification_token(user_id)

        # Verify email
        result = await auth_service.verify_user_email(verification_token)

        assert result is True
        # User should now be verified
        user = await auth_service.get_user_by_id(user_id)
        assert user.is_verified is True

    async def test_password_reset(self, auth_service: AuthenticationService, sample_user_data):
        """Test password reset functionality"""
        # Register user
        await auth_service.register_user(sample_user_data)

        # Request password reset
        reset_token = await auth_service.request_password_reset("auth@test.com")

        # Reset password
        new_password = "NewSecurePass456!"
        result = await auth_service.reset_password(reset_token, new_password)

        assert result is True

        # Verify can login with new password
        login_result = await auth_service.login_user("auth_test_user", new_password)
        assert "access_token" in login_result


@pytest.mark.unit
class TestUserSocialFeatures:
    """Test social features in user service"""

    @pytest.fixture
    def user_service(self, db_session: AsyncSession):
        return UserService(db_session)

    async def test_send_friend_request(self, user_service: UserService):
        """Test sending friend requests between users"""
        # Create two users
        user1_data = {"username": "user1", "email": "user1@test.com", "password": "Pass123!"}
        user2_data = {"username": "user2", "email": "user2@test.com", "password": "Pass123!"}

        user1 = await user_service.create_user(user1_data)
        user2 = await user_service.create_user(user2_data)

        # Send friend request
        request_id = await user_service.send_friend_request(user1.id, user2.id)

        assert request_id is not None

    async def test_accept_friend_request(self, user_service: UserService):
        """Test accepting friend requests"""
        # Create users and send request
        user1_data = {"username": "requester", "email": "req@test.com", "password": "Pass123!"}
        user2_data = {"username": "accepter", "email": "acc@test.com", "password": "Pass123!"}

        user1 = await user_service.create_user(user1_data)
        user2 = await user_service.create_user(user2_data)

        request_id = await user_service.send_friend_request(user1.id, user2.id)

        # Accept request
        result = await user_service.accept_friend_request(request_id)
        assert result is True

        # Check if they are now friends
        friends = await user_service.get_user_friends(user1.id)
        assert any(friend.id == user2.id for friend in friends)

    async def test_share_reading_with_friends(self, user_service: UserService):
        """Test sharing readings with friends"""
        user_data = {"username": "sharer", "email": "share@test.com", "password": "Pass123!"}
        user = await user_service.create_user(user_data)

        reading_id = "test-reading-123"
        friend_ids = ["friend1", "friend2"]

        result = await user_service.share_reading_with_friends(user.id, reading_id, friend_ids)
        assert result is True


@pytest.mark.unit
class TestUserDataManagement:
    """Test user data management and privacy features"""

    @pytest.fixture
    def user_service(self, db_session: AsyncSession):
        return UserService(db_session)

    async def test_export_user_data(self, user_service: UserService):
        """Test exporting user data for privacy compliance"""
        user_data = {
            "username": "export_user",
            "email": "export@test.com",
            "password": "Pass123!",
            "display_name": "Export Test User"
        }
        user = await user_service.create_user(user_data)

        exported_data = await user_service.export_user_data(user.id)

        assert "user_info" in exported_data
        assert "profile" in exported_data
        assert "preferences" in exported_data
        assert "reading_history" in exported_data
        assert "password_hash" not in exported_data["user_info"]  # Sensitive data excluded

    async def test_anonymize_user_data(self, user_service: UserService):
        """Test anonymizing user data while preserving analytics"""
        user_data = {
            "username": "anonymize_user",
            "email": "anon@test.com",
            "password": "Pass123!"
        }
        user = await user_service.create_user(user_data)

        result = await user_service.anonymize_user_data(user.id)
        assert result is True

        # Check that user data is anonymized
        anonymized_user = await user_service.get_user_by_id(user.id)
        assert anonymized_user.username.startswith("anonymous_")
        assert anonymized_user.email == "anonymized@domain.com"

    async def test_user_data_retention_cleanup(self, user_service: UserService):
        """Test cleaning up old user data according to retention policies"""
        # This would test cleanup of old, inactive accounts
        cleanup_date = datetime.utcnow() - timedelta(days=365 * 2)  # 2 years ago

        result = await user_service.cleanup_inactive_users(cleanup_date)
        assert isinstance(result, dict)
        assert "deleted_count" in result
        assert "anonymized_count" in result