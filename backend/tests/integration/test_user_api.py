"""
User API Integration Tests - Testing user authentication and management endpoints
"""

import pytest
import asyncio
from typing import Dict, Any
from httpx import AsyncClient
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.models.user import User, FactionAlignment, CharacterVoice
from app.core.security import create_access_token


@pytest.mark.integration
class TestUserRegistrationAPI:
    """Test user registration endpoints"""

    async def test_register_user_success(self, client: AsyncClient):
        """Test successful user registration"""
        user_data = {
            "username": "new_vault_dweller",
            "email": "dweller@vault101.com",
            "password": "SecurePass123!",
            "display_name": "Vault Dweller",
            "faction_alignment": "vault_dweller"
        }

        response = await client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()

        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["username"] == "new_vault_dweller"
        assert data["user"]["email"] == "dweller@vault101.com"
        assert data["user"]["is_verified"] is False

    async def test_register_user_duplicate_username(self, client: AsyncClient):
        """Test registration with duplicate username"""
        user_data = {
            "username": "duplicate_user",
            "email": "user1@test.com",
            "password": "Pass123!"
        }

        # Register first user
        response1 = await client.post("/api/v1/auth/register", json=user_data)
        assert response1.status_code == status.HTTP_201_CREATED

        # Try to register with same username
        user_data["email"] = "user2@test.com"  # Different email
        response2 = await client.post("/api/v1/auth/register", json=user_data)

        assert response2.status_code == status.HTTP_409_CONFLICT
        assert "username already exists" in response2.json()["detail"].lower()

    async def test_register_user_duplicate_email(self, client: AsyncClient):
        """Test registration with duplicate email"""
        user_data = {
            "username": "user1",
            "email": "duplicate@test.com",
            "password": "Pass123!"
        }

        # Register first user
        response1 = await client.post("/api/v1/auth/register", json=user_data)
        assert response1.status_code == status.HTTP_201_CREATED

        # Try to register with same email
        user_data["username"] = "user2"  # Different username
        response2 = await client.post("/api/v1/auth/register", json=user_data)

        assert response2.status_code == status.HTTP_409_CONFLICT
        assert "email already exists" in response2.json()["detail"].lower()

    async def test_register_user_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email format"""
        user_data = {
            "username": "test_user",
            "email": "invalid-email-format",
            "password": "Pass123!"
        }

        response = await client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_register_user_weak_password(self, client: AsyncClient):
        """Test registration with weak password"""
        user_data = {
            "username": "weak_password_user",
            "email": "weak@test.com",
            "password": "123"  # Too weak
        }

        response = await client.post("/api/v1/auth/register", json=user_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert "password" in response.json()["detail"][0]["loc"]


@pytest.mark.integration
class TestUserAuthenticationAPI:
    """Test user login and authentication endpoints"""

    @pytest.fixture
    async def registered_user(self, client: AsyncClient):
        """Create a registered user for authentication tests"""
        user_data = {
            "username": "auth_test_user",
            "email": "auth@test.com",
            "password": "SecurePass123!",
            "display_name": "Auth Test User"
        }

        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == status.HTTP_201_CREATED

        return {
            "username": "auth_test_user",
            "password": "SecurePass123!",
            "user_data": response.json()
        }

    async def test_login_success(self, client: AsyncClient, registered_user):
        """Test successful user login"""
        login_data = {
            "username": registered_user["username"],
            "password": registered_user["password"]
        }

        response = await client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["username"] == "auth_test_user"

    async def test_login_invalid_username(self, client: AsyncClient):
        """Test login with non-existent username"""
        login_data = {
            "username": "non_existent_user",
            "password": "somepassword"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalid credentials" in response.json()["detail"].lower()

    async def test_login_invalid_password(self, client: AsyncClient, registered_user):
        """Test login with incorrect password"""
        login_data = {
            "username": registered_user["username"],
            "password": "wrong_password"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalid credentials" in response.json()["detail"].lower()

    async def test_refresh_token(self, client: AsyncClient, registered_user):
        """Test refreshing access token"""
        # Login to get tokens
        login_data = {
            "username": registered_user["username"],
            "password": registered_user["password"]
        }

        login_response = await client.post("/api/v1/auth/login", json=login_data)
        refresh_token = login_response.json()["refresh_token"]

        # Refresh token
        refresh_data = {"refresh_token": refresh_token}
        response = await client.post("/api/v1/auth/refresh", json=refresh_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "access_token" in data
        assert "refresh_token" in data

    async def test_logout_user(self, client: AsyncClient, registered_user):
        """Test user logout"""
        # Login first
        login_data = {
            "username": registered_user["username"],
            "password": registered_user["password"]
        }

        login_response = await client.post("/api/v1/auth/login", json=login_data)
        access_token = login_response.json()["access_token"]

        # Logout
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await client.post("/api/v1/auth/logout", headers=headers)

        assert response.status_code == status.HTTP_200_OK

        # Verify token is invalid after logout
        protected_response = await client.get("/api/v1/auth/me", headers=headers)
        assert protected_response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.integration
class TestUserProfileAPI:
    """Test user profile management endpoints"""

    @pytest.fixture
    async def authenticated_user(self, client: AsyncClient):
        """Create authenticated user with access token"""
        user_data = {
            "username": "profile_user",
            "email": "profile@test.com",
            "password": "SecurePass123!"
        }

        response = await client.post("/api/v1/auth/register", json=user_data)
        user_info = response.json()

        return {
            "user": user_info["user"],
            "access_token": user_info["access_token"],
            "headers": {"Authorization": f"Bearer {user_info['access_token']}"}
        }

    async def test_get_current_user(self, client: AsyncClient, authenticated_user):
        """Test getting current user information"""
        response = await client.get("/api/v1/auth/me", headers=authenticated_user["headers"])

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["username"] == "profile_user"
        assert data["email"] == "profile@test.com"

    async def test_update_user_profile(self, client: AsyncClient, authenticated_user):
        """Test updating user profile information"""
        profile_data = {
            "display_name": "Updated Wasteland Wanderer",
            "bio": "A seasoned survivor of the wasteland",
            "vault_number": 111,
            "wasteland_location": "Mojave Wasteland",
            "preferred_voice": "wasteland_trader",
            "faction_alignment": "brotherhood"
        }

        response = await client.put(
            "/api/v1/users/profile",
            json=profile_data,
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["display_name"] == "Updated Wasteland Wanderer"
        assert data["bio"] == "A seasoned survivor of the wasteland"
        assert data["vault_number"] == 111

    async def test_update_user_preferences(self, client: AsyncClient, authenticated_user):
        """Test updating user preferences"""
        preferences_data = {
            "default_character_voice": "pip_boy",
            "theme": "dark_vault",
            "auto_save_readings": True,
            "share_readings_publicly": False,
            "notification_frequency": "weekly",
            "geiger_counter_volume": 0.8
        }

        response = await client.put(
            "/api/v1/users/preferences",
            json=preferences_data,
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["default_character_voice"] == "pip_boy"
        assert data["theme"] == "dark_vault"
        assert data["auto_save_readings"] is True

    async def test_get_user_statistics(self, client: AsyncClient, authenticated_user):
        """Test getting user statistics"""
        response = await client.get(
            "/api/v1/users/statistics",
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "total_readings" in data
        assert "karma_alignment" in data
        assert "faction_alignment" in data
        assert "accuracy_rate" in data
        assert "favorite_cards" in data

    async def test_get_user_reading_history(self, client: AsyncClient, authenticated_user):
        """Test getting user reading history"""
        response = await client.get(
            "/api/v1/users/readings",
            headers=authenticated_user["headers"],
            params={"limit": 10, "offset": 0}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert isinstance(data, list)
        # New user should have empty reading history

    async def test_delete_user_account(self, client: AsyncClient, authenticated_user):
        """Test user account deletion"""
        response = await client.delete(
            "/api/v1/users/account",
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK

        # Verify user can no longer access protected endpoints
        me_response = await client.get("/api/v1/auth/me", headers=authenticated_user["headers"])
        assert me_response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.integration
class TestUserSocialAPI:
    """Test social features endpoints"""

    @pytest.fixture
    async def two_users(self, client: AsyncClient):
        """Create two authenticated users for social testing"""
        user1_data = {
            "username": "social_user1",
            "email": "user1@social.com",
            "password": "Pass123!"
        }

        user2_data = {
            "username": "social_user2",
            "email": "user2@social.com",
            "password": "Pass123!"
        }

        # Register both users
        response1 = await client.post("/api/v1/auth/register", json=user1_data)
        response2 = await client.post("/api/v1/auth/register", json=user2_data)

        user1_info = response1.json()
        user2_info = response2.json()

        return {
            "user1": {
                "user": user1_info["user"],
                "access_token": user1_info["access_token"],
                "headers": {"Authorization": f"Bearer {user1_info['access_token']}"}
            },
            "user2": {
                "user": user2_info["user"],
                "access_token": user2_info["access_token"],
                "headers": {"Authorization": f"Bearer {user2_info['access_token']}"}
            }
        }

    async def test_send_friend_request(self, client: AsyncClient, two_users):
        """Test sending friend request"""
        user2_id = two_users["user2"]["user"]["id"]

        response = await client.post(
            f"/api/v1/users/friends/request/{user2_id}",
            headers=two_users["user1"]["headers"]
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "request_id" in data

    async def test_accept_friend_request(self, client: AsyncClient, two_users):
        """Test accepting friend request"""
        # Send friend request first
        user2_id = two_users["user2"]["user"]["id"]
        request_response = await client.post(
            f"/api/v1/users/friends/request/{user2_id}",
            headers=two_users["user1"]["headers"]
        )
        request_id = request_response.json()["request_id"]

        # Accept the request
        response = await client.post(
            f"/api/v1/users/friends/accept/{request_id}",
            headers=two_users["user2"]["headers"]
        )

        assert response.status_code == status.HTTP_200_OK

    async def test_get_friends_list(self, client: AsyncClient, two_users):
        """Test getting user's friends list"""
        response = await client.get(
            "/api/v1/users/friends",
            headers=two_users["user1"]["headers"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    async def test_share_reading_with_friends(self, client: AsyncClient, two_users):
        """Test sharing reading with friends"""
        reading_id = "test-reading-123"
        friend_ids = [two_users["user2"]["user"]["id"]]

        share_data = {
            "reading_id": reading_id,
            "friend_ids": friend_ids,
            "message": "Check out this interesting reading!"
        }

        response = await client.post(
            "/api/v1/users/readings/share",
            json=share_data,
            headers=two_users["user1"]["headers"]
        )

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.integration
class TestUserDataPrivacyAPI:
    """Test data privacy and export endpoints"""

    @pytest.fixture
    async def privacy_user(self, client: AsyncClient):
        """Create user for privacy testing"""
        user_data = {
            "username": "privacy_user",
            "email": "privacy@test.com",
            "password": "SecurePass123!"
        }

        response = await client.post("/api/v1/auth/register", json=user_data)
        user_info = response.json()

        return {
            "user": user_info["user"],
            "access_token": user_info["access_token"],
            "headers": {"Authorization": f"Bearer {user_info['access_token']}"}
        }

    async def test_export_user_data(self, client: AsyncClient, privacy_user):
        """Test exporting user data"""
        response = await client.get(
            "/api/v1/users/data/export",
            headers=privacy_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "user_info" in data
        assert "profile" in data
        assert "preferences" in data
        assert "reading_history" in data
        # Should not include sensitive data
        assert "password_hash" not in str(data)

    async def test_request_data_deletion(self, client: AsyncClient, privacy_user):
        """Test requesting complete data deletion"""
        response = await client.post(
            "/api/v1/users/data/delete-request",
            headers=privacy_user["headers"]
        )

        assert response.status_code == status.HTTP_202_ACCEPTED
        data = response.json()
        assert "deletion_request_id" in data

    async def test_anonymize_user_data(self, client: AsyncClient, privacy_user):
        """Test user data anonymization"""
        response = await client.post(
            "/api/v1/users/data/anonymize",
            headers=privacy_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.integration
class TestUserSecurityAPI:
    """Test security-related endpoints"""

    @pytest.fixture
    async def security_user(self, client: AsyncClient):
        """Create user for security testing"""
        user_data = {
            "username": "security_user",
            "email": "security@test.com",
            "password": "SecurePass123!"
        }

        response = await client.post("/api/v1/auth/register", json=user_data)
        user_info = response.json()

        return {
            "user": user_info["user"],
            "access_token": user_info["access_token"],
            "headers": {"Authorization": f"Bearer {user_info['access_token']}"}
        }

    async def test_change_password(self, client: AsyncClient, security_user):
        """Test changing user password"""
        password_data = {
            "current_password": "SecurePass123!",
            "new_password": "NewSecurePass456!",
            "confirm_password": "NewSecurePass456!"
        }

        response = await client.post(
            "/api/v1/users/security/change-password",
            json=password_data,
            headers=security_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK

    async def test_enable_two_factor_auth(self, client: AsyncClient, security_user):
        """Test enabling two-factor authentication"""
        response = await client.post(
            "/api/v1/users/security/2fa/enable",
            headers=security_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "qr_code" in data
        assert "backup_codes" in data

    async def test_get_security_log(self, client: AsyncClient, security_user):
        """Test getting user security activity log"""
        response = await client.get(
            "/api/v1/users/security/activity",
            headers=security_user["headers"],
            params={"limit": 20}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)