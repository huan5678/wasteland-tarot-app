"""
Authentication Dependencies Tests - FastAPI dependency injection testing
Testing user authentication, authorization, and permission checks
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.core.dependencies import (
    get_current_user,
    get_current_active_user,
    get_optional_current_user,
    get_current_premium_user
)
from app.models.user import User
from app.core.exceptions import UserNotFoundError


@pytest.mark.asyncio
@pytest.mark.unit
class TestGetCurrentUser:
    """Test get_current_user dependency function"""

    async def test_get_current_user_success(self):
        """Test successful user authentication"""
        # Mock credentials
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token"
        )

        # Mock database session
        mock_db = AsyncMock()

        # Mock user
        mock_user = User(
            id="user123",
            username="test_user",
            email="test@example.com",
            is_active=True
        )

        # Mock dependencies
        with patch('app.core.dependencies.verify_token') as mock_verify, \
             patch('app.core.dependencies.UserService') as mock_user_service:

            # Setup mocks
            mock_verify.return_value = {"sub": "user123"}
            mock_service_instance = AsyncMock()
            mock_service_instance.get_user_by_id.return_value = mock_user
            mock_user_service.return_value = mock_service_instance

            # Test the function
            result = await get_current_user(mock_credentials, mock_db)

            # Assertions
            assert result == mock_user
            mock_verify.assert_called_once_with("valid.jwt.token")
            mock_service_instance.get_user_by_id.assert_called_once_with("user123")

    async def test_get_current_user_no_credentials(self):
        """Test authentication failure with no credentials"""
        mock_db = AsyncMock()

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(None, mock_db)

        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Could not validate credentials" in exc_info.value.detail

    async def test_get_current_user_invalid_token(self):
        """Test authentication failure with invalid token"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid.jwt.token"
        )
        mock_db = AsyncMock()

        with patch('app.core.dependencies.verify_token') as mock_verify:
            mock_verify.return_value = None

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(mock_credentials, mock_db)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_current_user_no_user_id_in_token(self):
        """Test authentication failure when token has no user ID"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token"
        )
        mock_db = AsyncMock()

        with patch('app.core.dependencies.verify_token') as mock_verify:
            mock_verify.return_value = {"other_field": "value"}  # No 'sub' field

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(mock_credentials, mock_db)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_current_user_user_not_found(self):
        """Test authentication failure when user doesn't exist"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token"
        )
        mock_db = AsyncMock()

        with patch('app.core.dependencies.verify_token') as mock_verify, \
             patch('app.core.dependencies.UserService') as mock_user_service:

            mock_verify.return_value = {"sub": "nonexistent_user"}
            mock_service_instance = AsyncMock()
            mock_service_instance.get_user_by_id.side_effect = UserNotFoundError("User not found")
            mock_user_service.return_value = mock_service_instance

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(mock_credentials, mock_db)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_current_user_inactive_user(self):
        """Test authentication failure with inactive user"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token"
        )
        mock_db = AsyncMock()

        mock_user = User(
            id="user123",
            username="inactive_user",
            email="inactive@example.com",
            is_active=False  # Inactive user
        )

        with patch('app.core.dependencies.verify_token') as mock_verify, \
             patch('app.core.dependencies.UserService') as mock_user_service:

            mock_verify.return_value = {"sub": "user123"}
            mock_service_instance = AsyncMock()
            mock_service_instance.get_user_by_id.return_value = mock_user
            mock_user_service.return_value = mock_service_instance

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(mock_credentials, mock_db)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Inactive user" in exc_info.value.detail

    async def test_get_current_user_database_error(self):
        """Test authentication failure with database error"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token"
        )
        mock_db = AsyncMock()

        with patch('app.core.dependencies.verify_token') as mock_verify, \
             patch('app.core.dependencies.UserService') as mock_user_service:

            mock_verify.return_value = {"sub": "user123"}
            mock_service_instance = AsyncMock()
            mock_service_instance.get_user_by_id.side_effect = Exception("Database error")
            mock_user_service.return_value = mock_service_instance

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(mock_credentials, mock_db)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.unit
class TestGetCurrentActiveUser:
    """Test get_current_active_user dependency function"""

    async def test_get_current_active_user_success(self):
        """Test that active user is returned correctly"""
        mock_user = User(
            id="user123",
            username="active_user",
            email="active@example.com",
            is_active=True
        )

        # Test that it simply returns the user passed to it
        result = await get_current_active_user(mock_user)
        assert result == mock_user


@pytest.mark.asyncio
@pytest.mark.unit
class TestGetOptionalUser:
    """Test get_optional_user dependency function"""

    async def test_get_optional_user_success(self):
        """Test optional user authentication success"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token"
        )
        mock_db = AsyncMock()

        mock_user = User(
            id="user123",
            username="test_user",
            email="test@example.com",
            is_active=True
        )

        with patch('app.core.dependencies.verify_token') as mock_verify, \
             patch('app.core.dependencies.UserService') as mock_user_service:

            mock_verify.return_value = {"sub": "user123"}
            mock_service_instance = AsyncMock()
            mock_service_instance.get_user_by_id.return_value = mock_user
            mock_user_service.return_value = mock_service_instance

            result = await get_optional_user(mock_credentials, mock_db)
            assert result == mock_user

    async def test_get_optional_user_no_credentials(self):
        """Test optional user with no credentials returns None"""
        mock_db = AsyncMock()

        result = await get_optional_user(None, mock_db)
        assert result is None

    async def test_get_optional_user_invalid_token(self):
        """Test optional user with invalid token returns None"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid.jwt.token"
        )
        mock_db = AsyncMock()

        with patch('app.core.dependencies.verify_token') as mock_verify:
            mock_verify.return_value = None

            result = await get_optional_user(mock_credentials, mock_db)
            assert result is None

    async def test_get_optional_user_inactive_user(self):
        """Test optional user with inactive user returns None"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token"
        )
        mock_db = AsyncMock()

        mock_user = User(
            id="user123",
            username="inactive_user",
            email="inactive@example.com",
            is_active=False
        )

        with patch('app.core.dependencies.verify_token') as mock_verify, \
             patch('app.core.dependencies.UserService') as mock_user_service:

            mock_verify.return_value = {"sub": "user123"}
            mock_service_instance = AsyncMock()
            mock_service_instance.get_user_by_id.return_value = mock_user
            mock_user_service.return_value = mock_service_instance

            result = await get_optional_user(mock_credentials, mock_db)
            assert result is None

    async def test_get_optional_user_database_error(self):
        """Test optional user with database error returns None"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="valid.jwt.token"
        )
        mock_db = AsyncMock()

        with patch('app.core.dependencies.verify_token') as mock_verify, \
             patch('app.core.dependencies.UserService') as mock_user_service:

            mock_verify.return_value = {"sub": "user123"}
            mock_service_instance = AsyncMock()
            mock_service_instance.get_user_by_id.side_effect = Exception("Database error")
            mock_user_service.return_value = mock_service_instance

            result = await get_optional_user(mock_credentials, mock_db)
            assert result is None


@pytest.mark.unit
class TestPermissionRequirements:
    """Test permission requirement functions"""

    def test_require_admin_user_success(self):
        """Test admin requirement with admin user"""
        mock_user = User(
            id="admin123",
            username="admin_user",
            email="admin@example.com",
            is_active=True
        )
        # Mock admin attribute
        mock_user.is_admin = True

        result = require_admin_user(mock_user)
        assert result == mock_user

    def test_require_admin_user_failure(self):
        """Test admin requirement with non-admin user"""
        mock_user = User(
            id="user123",
            username="regular_user",
            email="user@example.com",
            is_active=True
        )
        # Mock non-admin user (no is_admin attribute or False)

        with pytest.raises(HTTPException) as exc_info:
            require_admin_user(mock_user)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Admin privileges required" in exc_info.value.detail

    def test_require_verified_user_success(self):
        """Test verified user requirement with verified user"""
        mock_user = User(
            id="user123",
            username="verified_user",
            email="verified@example.com",
            is_active=True,
            is_verified=True
        )

        result = require_verified_user(mock_user)
        assert result == mock_user

    def test_require_verified_user_failure(self):
        """Test verified user requirement with unverified user"""
        mock_user = User(
            id="user123",
            username="unverified_user",
            email="unverified@example.com",
            is_active=True,
            is_verified=False
        )

        with pytest.raises(HTTPException) as exc_info:
            require_verified_user(mock_user)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Email verification required" in exc_info.value.detail

    def test_require_premium_user_success(self):
        """Test premium user requirement with premium user"""
        mock_user = User(
            id="user123",
            username="premium_user",
            email="premium@example.com",
            is_active=True
        )
        # Mock premium attribute
        mock_user.is_premium = True

        result = require_premium_user(mock_user)
        assert result == mock_user

    def test_require_premium_user_failure(self):
        """Test premium user requirement with non-premium user"""
        mock_user = User(
            id="user123",
            username="regular_user",
            email="regular@example.com",
            is_active=True
        )
        # Mock non-premium user (no is_premium attribute or False)

        with pytest.raises(HTTPException) as exc_info:
            require_premium_user(mock_user)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
        assert "Premium subscription required" in exc_info.value.detail


@pytest.mark.asyncio
@pytest.mark.unit
class TestDependencyIntegration:
    """Test integration scenarios for authentication dependencies"""

    async def test_full_authentication_flow(self):
        """Test complete authentication flow from token to user"""
        token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.test.token"
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        mock_db = AsyncMock()

        mock_user = User(
            id="user123",
            username="flow_test_user",
            email="flow@example.com",
            is_active=True,
            is_verified=True
        )

        with patch('app.core.dependencies.verify_token') as mock_verify, \
             patch('app.core.dependencies.UserService') as mock_user_service:

            mock_verify.return_value = {
                "sub": "user123",
                "type": "access",
                "exp": 9999999999
            }
            mock_service_instance = AsyncMock()
            mock_service_instance.get_user_by_id.return_value = mock_user
            mock_user_service.return_value = mock_service_instance

            # Test get_current_user
            current_user = await get_current_user(mock_credentials, mock_db)
            assert current_user == mock_user

            # Test get_current_active_user
            active_user = await get_current_active_user(current_user)
            assert active_user == mock_user

            # Test require_verified_user
            verified_user = require_verified_user(current_user)
            assert verified_user == mock_user

    async def test_authentication_chain_failure_propagation(self):
        """Test that authentication failures propagate correctly through the chain"""
        mock_credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid.token"
        )
        mock_db = AsyncMock()

        with patch('app.core.dependencies.verify_token') as mock_verify:
            mock_verify.return_value = None

            # First dependency should fail
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(mock_credentials, mock_db)

            assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_concurrent_authentication_requests(self):
        """Test concurrent authentication requests"""
        import asyncio

        async def authenticate_user(user_id):
            mock_credentials = HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=f"token_for_{user_id}"
            )
            mock_db = AsyncMock()

            mock_user = User(
                id=user_id,
                username=f"user_{user_id}",
                email=f"user{user_id}@example.com",
                is_active=True
            )

            with patch('app.core.dependencies.verify_token') as mock_verify, \
                 patch('app.core.dependencies.UserService') as mock_user_service:

                mock_verify.return_value = {"sub": user_id}
                mock_service_instance = AsyncMock()
                mock_service_instance.get_user_by_id.return_value = mock_user
                mock_user_service.return_value = mock_service_instance

                return await get_current_user(mock_credentials, mock_db)

        # Run multiple concurrent authentications
        tasks = [authenticate_user(f"user{i}") for i in range(5)]
        results = await asyncio.gather(*tasks)

        # Verify all authentications succeeded
        assert len(results) == 5
        for i, user in enumerate(results):
            assert user.id == f"user{i}"
            assert user.username == f"user_user{i}"

    def test_permission_stacking(self):
        """Test stacking multiple permission requirements"""
        # Create a user with all permissions
        mock_user = User(
            id="superuser123",
            username="superuser",
            email="super@example.com",
            is_active=True,
            is_verified=True
        )
        mock_user.is_admin = True
        mock_user.is_premium = True

        # Test that all permission checks pass
        admin_result = require_admin_user(mock_user)
        verified_result = require_verified_user(admin_result)
        premium_result = require_premium_user(verified_result)

        assert premium_result == mock_user

    def test_permission_stacking_failure(self):
        """Test that permission stacking fails at first unmet requirement"""
        # Create a user missing one permission
        mock_user = User(
            id="user123",
            username="limited_user",
            email="limited@example.com",
            is_active=True,
            is_verified=True
        )
        mock_user.is_admin = False  # Missing admin permission

        # First check should pass
        verified_result = require_verified_user(mock_user)
        assert verified_result == mock_user

        # Admin check should fail
        with pytest.raises(HTTPException) as exc_info:
            require_admin_user(verified_result)

        assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN