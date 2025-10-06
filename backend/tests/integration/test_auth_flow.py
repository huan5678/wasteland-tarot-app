"""
Authentication Flow Integration Tests
Testing complete authentication workflows including registration, login, token refresh, and security
"""

import pytest
import asyncio
from typing import Dict, Any
from datetime import datetime, timedelta
from httpx import AsyncClient

from app.main import app
from app.services.user_service import UserService, AuthenticationService
from app.core.security import verify_token, create_access_token
from app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    AccountLockedError
)


@pytest.mark.integration
@pytest.mark.asyncio
class TestUserRegistrationFlow:
    """Test complete user registration workflow"""

    async def test_successful_user_registration(self, async_client: AsyncClient, cleanup_database):
        """Test successful user registration end-to-end"""
        registration_data = {
            "username": "new_vault_dweller",
            "email": "newuser@vault101.com",
            "password": "SecurePassword123!",
            "display_name": "New Vault Dweller",
            "faction_alignment": "Vault Dweller",
            "vault_number": 101,
            "wasteland_location": "Capital Wasteland"
        }

        response = await async_client.post(
            "/api/v1/auth/register",
            json=registration_data
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

        # Verify user data
        user = data["user"]
        assert user["username"] == registration_data["username"]
        assert user["email"] == registration_data["email"]
        assert user["display_name"] == registration_data["display_name"]
        assert user["faction_alignment"] == registration_data["faction_alignment"]
        assert user["is_verified"] is False  # Should start unverified

        # Verify tokens are valid
        access_token_payload = verify_token(data["access_token"])
        refresh_token_payload = verify_token(data["refresh_token"])

        assert access_token_payload is not None
        assert refresh_token_payload is not None
        assert access_token_payload["sub"] == user["id"]
        assert refresh_token_payload["sub"] == user["id"]
        assert access_token_payload["type"] == "access"
        assert refresh_token_payload["type"] == "refresh"

    async def test_registration_duplicate_username(self, async_client: AsyncClient, cleanup_database):
        """Test registration failure with duplicate username"""
        # Register first user
        first_user_data = {
            "username": "duplicate_username",
            "email": "first@example.com",
            "password": "Password123!"
        }

        first_response = await async_client.post(
            "/api/v1/auth/register",
            json=first_user_data
        )
        assert first_response.status_code == 200

        # Try to register second user with same username
        second_user_data = {
            "username": "duplicate_username",  # Same username
            "email": "second@example.com",     # Different email
            "password": "Password123!"
        }

        second_response = await async_client.post(
            "/api/v1/auth/register",
            json=second_user_data
        )

        assert second_response.status_code == 409  # Conflict
        assert "already exists" in second_response.json()["detail"]

    async def test_registration_duplicate_email(self, async_client: AsyncClient, cleanup_database):
        """Test registration failure with duplicate email"""
        # Register first user
        first_user_data = {
            "username": "first_user",
            "email": "duplicate@example.com",
            "password": "Password123!"
        }

        first_response = await async_client.post(
            "/api/v1/auth/register",
            json=first_user_data
        )
        assert first_response.status_code == 200

        # Try to register second user with same email
        second_user_data = {
            "username": "second_user",         # Different username
            "email": "duplicate@example.com", # Same email
            "password": "Password123!"
        }

        second_response = await async_client.post(
            "/api/v1/auth/register",
            json=second_user_data
        )

        assert second_response.status_code == 409  # Conflict
        assert "already exists" in second_response.json()["detail"]

    async def test_registration_invalid_email(self, async_client: AsyncClient):
        """Test registration failure with invalid email format"""
        invalid_emails = [
            "invalid-email",
            "@missing-local.com",
            "no-at-symbol.com",
            "spaces in@email.com",
            "double@@email.com"
        ]

        for invalid_email in invalid_emails:
            registration_data = {
                "username": f"user_for_{invalid_email.replace('@', '_').replace('.', '_')}",
                "email": invalid_email,
                "password": "Password123!"
            }

            response = await async_client.post(
                "/api/v1/auth/register",
                json=registration_data
            )

            assert response.status_code == 422  # Validation error

    async def test_registration_weak_password(self, async_client: AsyncClient):
        """Test registration with various password requirements"""
        weak_passwords = [
            "",           # Empty
            "123",        # Too short
            "password",   # No capitals/numbers
            "PASSWORD",   # No lowercase/numbers
            "Password",   # No numbers
            "password123", # No capitals
        ]

        for weak_password in weak_passwords:
            registration_data = {
                "username": f"user_weak_pass_{len(weak_password)}",
                "email": f"weak_{len(weak_password)}@example.com",
                "password": weak_password
            }

            response = await async_client.post(
                "/api/v1/auth/register",
                json=registration_data
            )

            # Note: This depends on your password validation rules
            # Adjust status code based on your implementation
            assert response.status_code in [400, 422]


@pytest.mark.integration
@pytest.mark.asyncio
class TestUserLoginFlow:
    """Test complete user login workflow"""

    async def test_successful_login(self, async_client: AsyncClient, test_user_data, cleanup_database):
        """Test successful user login"""
        # First register a user
        registration_response = await async_client.post(
            "/api/v1/auth/register",
            json=test_user_data
        )
        assert registration_response.status_code == 200

        # Now login with the same credentials
        login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }

        login_response = await async_client.post(
            "/api/v1/auth/login",
            json=login_data
        )

        assert login_response.status_code == 200
        data = login_response.json()

        # Verify response structure
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data

        # Verify user data matches registration
        user = data["user"]
        assert user["username"] == test_user_data["username"]
        assert user["email"] == test_user_data["email"]

        # Verify tokens
        access_token_payload = verify_token(data["access_token"])
        assert access_token_payload["type"] == "access"
        assert access_token_payload["sub"] == user["id"]

    async def test_login_wrong_password(self, async_client: AsyncClient, test_user_data, cleanup_database):
        """Test login failure with wrong password"""
        # Register user
        await async_client.post("/api/v1/auth/register", json=test_user_data)

        # Try login with wrong password
        login_data = {
            "username": test_user_data["username"],
            "password": "WrongPassword123!"
        }

        response = await async_client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]

    async def test_login_nonexistent_user(self, async_client: AsyncClient):
        """Test login failure with nonexistent user"""
        login_data = {
            "username": "nonexistent_user",
            "password": "Password123!"
        }

        response = await async_client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 401
        assert "Invalid username or password" in response.json()["detail"]

    async def test_login_multiple_failed_attempts(self, async_client: AsyncClient, test_user_data, cleanup_database):
        """Test account locking after multiple failed login attempts"""
        # Register user
        await async_client.post("/api/v1/auth/register", json=test_user_data)

        login_data = {
            "username": test_user_data["username"],
            "password": "WrongPassword123!"
        }

        # Make multiple failed attempts
        for attempt in range(5):
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            assert response.status_code == 401

        # Next attempt should trigger account lock
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401

        # Even correct password should fail due to lock
        correct_login_data = {
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }

        response = await async_client.post("/api/v1/auth/login", json=correct_login_data)
        assert response.status_code == 401
        assert "locked" in response.json()["detail"].lower()


@pytest.mark.integration
@pytest.mark.asyncio
class TestTokenManagement:
    """Test token refresh and management workflows"""

    async def test_token_refresh_success(self, async_client: AsyncClient, authenticated_user, cleanup_database):
        """Test successful token refresh"""
        refresh_data = {
            "refresh_token": authenticated_user["refresh_token"]
        }

        response = await async_client.post(
            "/api/v1/auth/token/refresh",
            json=refresh_data
        )

        assert response.status_code == 200
        data = response.json()

        # Should get new tokens
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data

        # New tokens should be different from original
        assert data["access_token"] != authenticated_user["access_token"]
        assert data["refresh_token"] != authenticated_user["refresh_token"]

        # New tokens should be valid
        new_access_payload = verify_token(data["access_token"])
        new_refresh_payload = verify_token(data["refresh_token"])

        assert new_access_payload is not None
        assert new_refresh_payload is not None
        assert new_access_payload["type"] == "access"
        assert new_refresh_payload["type"] == "refresh"

    async def test_token_refresh_invalid_token(self, async_client: AsyncClient):
        """Test token refresh with invalid refresh token"""
        refresh_data = {
            "refresh_token": "invalid.refresh.token"
        }

        response = await async_client.post(
            "/api/v1/auth/token/refresh",
            json=refresh_data
        )

        assert response.status_code == 401
        assert "Invalid refresh token" in response.json()["detail"]

    async def test_token_refresh_access_token_used(self, async_client: AsyncClient, authenticated_user):
        """Test that access token cannot be used for refresh"""
        refresh_data = {
            "refresh_token": authenticated_user["access_token"]  # Using access token instead
        }

        response = await async_client.post(
            "/api/v1/auth/token/refresh",
            json=refresh_data
        )

        assert response.status_code == 401

    async def test_logout_functionality(self, async_client: AsyncClient, authenticated_user):
        """Test user logout"""
        headers = authenticated_user["headers"]

        response = await async_client.post(
            "/api/v1/auth/logout",
            headers=headers
        )

        assert response.status_code == 200
        assert "Logout successful" in response.json()["message"]


@pytest.mark.integration
@pytest.mark.asyncio
class TestAuthenticatedEndpoints:
    """Test endpoints that require authentication"""

    async def test_get_current_user_info(self, async_client: AsyncClient, authenticated_user):
        """Test getting current user information"""
        headers = authenticated_user["headers"]

        response = await async_client.get(
            "/api/v1/auth/me",
            headers=headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "user" in data
        assert "statistics" in data

        user = data["user"]
        assert user["id"] == authenticated_user["user"]["id"]
        assert user["username"] == authenticated_user["user"]["username"]
        assert user["email"] == authenticated_user["user"]["email"]

    async def test_protected_endpoint_without_auth(self, async_client: AsyncClient):
        """Test that protected endpoints reject unauthenticated requests"""
        response = await async_client.get("/api/v1/auth/me")

        assert response.status_code == 403  # or 401 depending on your setup

    async def test_protected_endpoint_invalid_token(self, async_client: AsyncClient):
        """Test protected endpoint with invalid token"""
        headers = {"Authorization": "Bearer invalid.token.here"}

        response = await async_client.get(
            "/api/v1/auth/me",
            headers=headers
        )

        assert response.status_code in [401, 403]

    async def test_protected_endpoint_expired_token(self, async_client: AsyncClient, db_session):
        """Test protected endpoint with expired token"""
        # Create an expired token
        expired_token = create_access_token(
            {"sub": "user123"},
            expires_delta=timedelta(seconds=-1)
        )

        headers = {"Authorization": f"Bearer {expired_token}"}

        response = await async_client.get(
            "/api/v1/auth/me",
            headers=headers
        )

        assert response.status_code in [401, 403]


@pytest.mark.integration
@pytest.mark.asyncio
class TestPasswordResetFlow:
    """Test password reset functionality"""

    async def test_password_reset_request(self, async_client: AsyncClient, test_user_data, cleanup_database):
        """Test password reset request"""
        # Register user first
        await async_client.post("/api/v1/auth/register", json=test_user_data)

        reset_request_data = {
            "email": test_user_data["email"]
        }

        response = await async_client.post(
            "/api/v1/auth/password/reset/request",
            json=reset_request_data
        )

        assert response.status_code == 200
        assert "Password reset email sent" in response.json()["message"]

        # For testing purposes, check if reset_token is returned
        # In production, this would be sent via email
        if "reset_token" in response.json():
            reset_token = response.json()["reset_token"]
            assert reset_token is not None

            # Verify the reset token is valid
            token_payload = verify_token(reset_token)
            assert token_payload is not None
            assert token_payload["type"] == "password_reset"
            assert token_payload["sub"] == test_user_data["email"]

    async def test_password_reset_nonexistent_email(self, async_client: AsyncClient):
        """Test password reset request for nonexistent email"""
        reset_request_data = {
            "email": "nonexistent@example.com"
        }

        response = await async_client.post(
            "/api/v1/auth/password/reset/request",
            json=reset_request_data
        )

        # Should still return success for security (don't reveal if email exists)
        assert response.status_code == 200
        assert "Password reset email sent" in response.json()["message"]

    async def test_password_reset_confirm(self, async_client: AsyncClient, test_user_data, cleanup_database):
        """Test password reset confirmation"""
        # Register user
        await async_client.post("/api/v1/auth/register", json=test_user_data)

        # Request password reset
        reset_request_response = await async_client.post(
            "/api/v1/auth/password/reset/request",
            json={"email": test_user_data["email"]}
        )

        # Extract reset token (in real app, this would come from email)
        reset_token = reset_request_response.json().get("reset_token")

        if reset_token:
            # Confirm password reset
            new_password = "NewSecurePassword123!"
            reset_confirm_data = {
                "reset_token": reset_token,
                "new_password": new_password
            }

            response = await async_client.post(
                "/api/v1/auth/password/reset/confirm",
                json=reset_confirm_data
            )

            assert response.status_code == 200
            assert "Password reset successful" in response.json()["message"]

            # Test login with new password
            login_data = {
                "username": test_user_data["username"],
                "password": new_password
            }

            login_response = await async_client.post("/api/v1/auth/login", json=login_data)
            assert login_response.status_code == 200

            # Test that old password no longer works
            old_login_data = {
                "username": test_user_data["username"],
                "password": test_user_data["password"]
            }

            old_login_response = await async_client.post("/api/v1/auth/login", json=old_login_data)
            assert old_login_response.status_code == 401


@pytest.mark.integration
@pytest.mark.asyncio
class TestConcurrentAuthOperations:
    """Test concurrent authentication operations"""

    async def test_concurrent_registrations(self, async_client: AsyncClient, cleanup_database):
        """Test concurrent user registrations"""
        async def register_user(user_id: int):
            user_data = {
                "username": f"concurrent_user_{user_id}",
                "email": f"concurrent{user_id}@example.com",
                "password": "Password123!"
            }
            return await async_client.post("/api/v1/auth/register", json=user_data)

        # Register multiple users concurrently
        tasks = [register_user(i) for i in range(5)]
        responses = await asyncio.gather(*tasks)

        # All registrations should succeed
        for response in responses:
            assert response.status_code == 200

    async def test_concurrent_logins(self, async_client: AsyncClient, cleanup_database):
        """Test concurrent user logins"""
        # Register multiple users first
        users = []
        for i in range(3):
            user_data = {
                "username": f"login_user_{i}",
                "email": f"login{i}@example.com",
                "password": "Password123!"
            }
            response = await async_client.post("/api/v1/auth/register", json=user_data)
            assert response.status_code == 200
            users.append(user_data)

        # Login concurrently
        async def login_user(user_data):
            login_data = {
                "username": user_data["username"],
                "password": user_data["password"]
            }
            return await async_client.post("/api/v1/auth/login", json=login_data)

        tasks = [login_user(user) for user in users]
        responses = await asyncio.gather(*tasks)

        # All logins should succeed
        for response in responses:
            assert response.status_code == 200

    async def test_concurrent_token_refresh(self, async_client: AsyncClient, cleanup_database):
        """Test concurrent token refresh operations"""
        # Register and login a user
        user_data = {
            "username": "refresh_test_user",
            "email": "refresh@example.com",
            "password": "Password123!"
        }

        await async_client.post("/api/v1/auth/register", json=user_data)
        login_response = await async_client.post("/api/v1/auth/login", json={
            "username": user_data["username"],
            "password": user_data["password"]
        })

        refresh_token = login_response.json()["refresh_token"]

        # Refresh token concurrently
        async def refresh_token_request():
            return await async_client.post(
                "/api/v1/auth/token/refresh",
                json={"refresh_token": refresh_token}
            )

        tasks = [refresh_token_request() for _ in range(3)]
        responses = await asyncio.gather(*tasks)

        # At least one should succeed (depending on implementation)
        success_count = sum(1 for r in responses if r.status_code == 200)
        assert success_count >= 1