"""
Authentication API Endpoints Tests - Phase 2 API Layer Testing
Testing FastAPI authentication routes with HTTP requests and responses
"""

import pytest
import json
from typing import Dict, Any
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.user import User
from app.services.user_service import UserService
from app.core.security import get_password_hash, create_access_token, create_refresh_token


@pytest.mark.asyncio
@pytest.mark.api
class TestUserRegistrationEndpoints:
    """Test user registration API endpoints"""

    async def test_successful_user_registration(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test successful user registration via API"""
        registration_data = {
            "username": "wasteland_wanderer",
            "email": "wanderer@vault101.com",
            "password": "SecureVault123!",
            "display_name": "Vault Dweller",
            "faction_alignment": "Brotherhood of Steel",
            "vault_number": 101,
            "wasteland_location": "Capital Wasteland"
        }

        response = await async_client.post("/api/v1/auth/register", json=registration_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify response structure
        assert "message" in data
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

        # Verify user data
        user_data = data["user"]
        assert user_data["username"] == registration_data["username"]
        assert user_data["email"] == registration_data["email"]
        assert user_data["display_name"] == registration_data["display_name"]
        assert user_data["faction_alignment"] == registration_data["faction_alignment"]
        assert user_data["vault_number"] == registration_data["vault_number"]
        assert user_data["wasteland_location"] == registration_data["wasteland_location"]

        # Verify tokens are not empty
        assert len(data["access_token"]) > 50
        assert len(data["refresh_token"]) > 50

    async def test_registration_duplicate_username(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test registration with duplicate username"""
        # Create first user
        user_service = UserService(db_session)
        await user_service.create_user({
            "username": "existing_user",
            "email": "existing@vault.com",
            "password": "password123"
        })

        # Try to register with same username
        registration_data = {
            "username": "existing_user",
            "email": "different@vault.com",
            "password": "SecureVault123!"
        }

        response = await async_client.post("/api/v1/auth/register", json=registration_data)

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "already exists" in response.json()["detail"].lower()

    async def test_registration_duplicate_email(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test registration with duplicate email"""
        # Create first user
        user_service = UserService(db_session)
        await user_service.create_user({
            "username": "user1",
            "email": "duplicate@vault.com",
            "password": "password123"
        })

        # Try to register with same email
        registration_data = {
            "username": "user2",
            "email": "duplicate@vault.com",
            "password": "SecureVault123!"
        }

        response = await async_client.post("/api/v1/auth/register", json=registration_data)

        assert response.status_code == status.HTTP_409_CONFLICT
        assert "already exists" in response.json()["detail"].lower()

    async def test_registration_invalid_email(self, async_client: AsyncClient):
        """Test registration with invalid email format"""
        registration_data = {
            "username": "testuser",
            "email": "invalid-email-format",
            "password": "SecureVault123!"
        }

        response = await async_client.post("/api/v1/auth/register", json=registration_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_registration_weak_password(self, async_client: AsyncClient):
        """Test registration with weak password"""
        registration_data = {
            "username": "testuser",
            "email": "test@vault.com",
            "password": "123"  # Too weak
        }

        response = await async_client.post("/api/v1/auth/register", json=registration_data)

        # Should fail validation or business logic
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY]

    async def test_registration_missing_required_fields(self, async_client: AsyncClient):
        """Test registration with missing required fields"""
        registration_data = {
            "username": "testuser"
            # Missing email and password
        }

        response = await async_client.post("/api/v1/auth/register", json=registration_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
@pytest.mark.api
class TestUserLoginEndpoints:
    """Test user login API endpoints"""

    async def test_successful_login(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test successful user login"""
        # Create user first
        user_service = UserService(db_session)
        user_data = {
            "username": "login_test",
            "email": "login@vault.com",
            "password": "LoginTest123!"
        }
        user = await user_service.create_user(user_data)

        # Login
        login_data = {
            "username": "login_test",
            "password": "LoginTest123!"
        }

        response = await async_client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify response structure
        assert "message" in data
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

        # Verify user data
        user_data = data["user"]
        assert user_data["username"] == "login_test"
        assert user_data["email"] == "login@vault.com"

    async def test_login_wrong_password(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test login with wrong password"""
        # Create user first
        user_service = UserService(db_session)
        await user_service.create_user({
            "username": "password_test",
            "email": "password@vault.com",
            "password": "CorrectPassword123!"
        })

        # Login with wrong password
        login_data = {
            "username": "password_test",
            "password": "WrongPassword123!"
        }

        response = await async_client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "invalid username or password" in response.json()["detail"].lower()

    async def test_login_nonexistent_user(self, async_client: AsyncClient):
        """Test login with nonexistent user"""
        login_data = {
            "username": "nonexistent_user",
            "password": "AnyPassword123!"
        }

        response = await async_client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_login_inactive_user(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test login with inactive user"""
        # Create inactive user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "inactive_user",
            "email": "inactive@vault.com",
            "password": "Password123!"
        })

        # Deactivate user
        await user_service.deactivate_user(user.id)

        # Try to login
        login_data = {
            "username": "inactive_user",
            "password": "Password123!"
        }

        response = await async_client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_login_missing_credentials(self, async_client: AsyncClient):
        """Test login with missing credentials"""
        # Missing password
        response = await async_client.post("/api/v1/auth/login", json={"username": "test"})
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Missing username
        response = await async_client.post("/api/v1/auth/login", json={"password": "test"})
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
@pytest.mark.api
class TestTokenManagementEndpoints:
    """Test token management API endpoints"""

    async def test_token_refresh_success(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test successful token refresh"""
        # Create user and get tokens
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "refresh_test",
            "email": "refresh@vault.com",
            "password": "RefreshTest123!"
        })

        # Create refresh token
        refresh_token = create_refresh_token({"sub": user.id})

        # Refresh token
        refresh_data = {"refresh_token": refresh_token}
        response = await async_client.post("/api/v1/auth/token/refresh", json=refresh_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"

    async def test_token_refresh_invalid_token(self, async_client: AsyncClient):
        """Test token refresh with invalid token"""
        refresh_data = {"refresh_token": "invalid.jwt.token"}
        response = await async_client.post("/api/v1/auth/token/refresh", json=refresh_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_token_refresh_access_token_used(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test token refresh with access token instead of refresh token"""
        # Create user and get access token
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "access_test",
            "email": "access@vault.com",
            "password": "AccessTest123!"
        })

        # Create access token (not refresh token)
        access_token = create_access_token({"sub": user.id})

        # Try to use access token for refresh
        refresh_data = {"refresh_token": access_token}
        response = await async_client.post("/api/v1/auth/token/refresh", json=refresh_data)

        # Should fail because wrong token type
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_logout_functionality(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test logout functionality"""
        # Create user and get token
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "logout_test",
            "email": "logout@vault.com",
            "password": "LogoutTest123!"
        })

        access_token = create_access_token({"sub": user.id})

        # Logout
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await async_client.post("/api/v1/auth/logout", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()


@pytest.mark.asyncio
@pytest.mark.api
class TestAuthenticatedEndpoints:
    """Test endpoints that require authentication"""

    async def test_get_current_user_info(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting current user info"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "info_test",
            "email": "info@vault.com",
            "password": "InfoTest123!",
            "display_name": "Info Tester",
            "vault_number": 111
        })

        access_token = create_access_token({"sub": user.id})

        # Get user info
        headers = {"Authorization": f"Bearer {access_token}"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "user" in data
        assert "statistics" in data

        user_data = data["user"]
        assert user_data["username"] == "info_test"
        assert user_data["email"] == "info@vault.com"
        assert user_data["display_name"] == "Info Tester"
        assert user_data["vault_number"] == 111

    async def test_protected_endpoint_without_auth(self, async_client: AsyncClient):
        """Test protected endpoint without authentication"""
        response = await async_client.get("/api/v1/auth/me")

        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    async def test_protected_endpoint_invalid_token(self, async_client: AsyncClient):
        """Test protected endpoint with invalid token"""
        headers = {"Authorization": "Bearer invalid.jwt.token"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_protected_endpoint_expired_token(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test protected endpoint with expired token"""
        from datetime import timedelta

        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "expired_test",
            "email": "expired@vault.com",
            "password": "ExpiredTest123!"
        })

        # Create expired token
        expired_token = create_access_token(
            {"sub": user.id},
            expires_delta=timedelta(seconds=-1)  # Already expired
        )

        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.api
class TestPasswordResetEndpoints:
    """Test password reset API endpoints"""

    async def test_password_reset_request(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test password reset request"""
        # Create user
        user_service = UserService(db_session)
        await user_service.create_user({
            "username": "reset_test",
            "email": "reset@vault.com",
            "password": "ResetTest123!"
        })

        # Request password reset
        reset_data = {"email": "reset@vault.com"}
        response = await async_client.post("/api/v1/auth/password/reset/request", json=reset_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        # In test mode, should return reset token
        assert "reset_token" in data

    async def test_password_reset_nonexistent_email(self, async_client: AsyncClient):
        """Test password reset request with nonexistent email"""
        reset_data = {"email": "nonexistent@vault.com"}
        response = await async_client.post("/api/v1/auth/password/reset/request", json=reset_data)

        # Should return 200 to not reveal email existence
        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()

    async def test_password_reset_confirm(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test password reset confirmation"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "confirm_test",
            "email": "confirm@vault.com",
            "password": "ConfirmTest123!"
        })

        # Request reset to get token
        reset_data = {"email": "confirm@vault.com"}
        response = await async_client.post("/api/v1/auth/password/reset/request", json=reset_data)
        reset_token = response.json()["reset_token"]

        # Confirm reset
        confirm_data = {
            "reset_token": reset_token,
            "new_password": "NewPassword123!"
        }
        response = await async_client.post("/api/v1/auth/password/reset/confirm", json=confirm_data)

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()

        # Verify can login with new password
        login_data = {
            "username": "confirm_test",
            "password": "NewPassword123!"
        }
        login_response = await async_client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
@pytest.mark.api
class TestEmailVerificationEndpoints:
    """Test email verification API endpoints"""

    async def test_email_verification_success(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test successful email verification"""
        from app.core.security import create_verification_token

        # Create unverified user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "verify_test",
            "email": "verify@vault.com",
            "password": "VerifyTest123!"
        })

        # Create verification token
        verification_token = create_verification_token(user.id)

        # Verify email
        response = await async_client.post(f"/api/v1/auth/verify-email/{verification_token}")

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()

    async def test_email_verification_invalid_token(self, async_client: AsyncClient):
        """Test email verification with invalid token"""
        response = await async_client.post("/api/v1/auth/verify-email/invalid_token")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
@pytest.mark.api
class TestAuthenticationFlow:
    """Test complete authentication flows"""

    async def test_complete_registration_and_login_flow(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test complete flow from registration to login"""
        # Register user
        registration_data = {
            "username": "flow_test",
            "email": "flow@vault.com",
            "password": "FlowTest123!",
            "display_name": "Flow Tester"
        }

        register_response = await async_client.post("/api/v1/auth/register", json=registration_data)
        assert register_response.status_code == status.HTTP_200_OK

        register_data = register_response.json()
        assert "access_token" in register_data

        # Use the access token to get user info
        headers = {"Authorization": f"Bearer {register_data['access_token']}"}
        user_info_response = await async_client.get("/api/v1/auth/me", headers=headers)
        assert user_info_response.status_code == status.HTTP_200_OK

        # Login with same credentials
        login_data = {
            "username": "flow_test",
            "password": "FlowTest123!"
        }
        login_response = await async_client.post("/api/v1/auth/login", json=login_data)
        assert login_response.status_code == status.HTTP_200_OK

        # Refresh token
        login_response_data = login_response.json()
        refresh_data = {"refresh_token": login_response_data["refresh_token"]}
        refresh_response = await async_client.post("/api/v1/auth/token/refresh", json=refresh_data)
        assert refresh_response.status_code == status.HTTP_200_OK

        # Logout
        new_headers = {"Authorization": f"Bearer {login_response_data['access_token']}"}
        logout_response = await async_client.post("/api/v1/auth/logout", headers=new_headers)
        assert logout_response.status_code == status.HTTP_200_OK