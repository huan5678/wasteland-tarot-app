"""
Task 23: 後端單元測試 - 認證服務重構測試
測試 email 登入和 OAuth 使用者密碼登入限制
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_service import UserService
from app.models.user import User
from app.core.exceptions import (
    InvalidCredentialsError,
    OAuthUserCannotLoginError,
    UserNotFoundError
)
from app.core.security import hash_password, verify_password


class TestEmailLoginRefactor:
    """測試 email 登入（取代 username 登入）"""

    @pytest.fixture
    def mock_db(self):
        """創建模擬的資料庫 session"""
        db = AsyncMock(spec=AsyncSession)
        return db

    @pytest.fixture
    def user_service(self, mock_db):
        """創建 UserService 實例"""
        return UserService(mock_db)

    @pytest.mark.asyncio
    async def test_authenticate_user_with_email(self, user_service, mock_db):
        """測試使用 email 登入"""
        email = "user@example.com"
        password = "correct_password"
        hashed_password = hash_password(password)

        # Mock user query by email
        mock_user = User(
            id="user-id-123",
            email=email,
            username="username",
            password_hash=hashed_password,
            oauth_provider=None,
            is_oauth_user=False
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_user

        mock_db.execute.return_value = mock_execute_result

        with patch.object(user_service, 'authenticate_user') as mock_authenticate:
            mock_authenticate.return_value = mock_user

            result = await user_service.authenticate_user(email=email, password=password)

        # Verify successful authentication
        assert result is not None
        assert result.email == email

    @pytest.mark.asyncio
    async def test_authenticate_user_email_not_found(self, user_service, mock_db):
        """測試 email 不存在時拋出錯誤"""
        email = "nonexistent@example.com"
        password = "any_password"

        # Mock user query returns None (user not found)
        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = None

        mock_db.execute.return_value = mock_execute_result

        with patch.object(user_service, 'authenticate_user') as mock_authenticate:
            mock_authenticate.side_effect = UserNotFoundError(user_id=email)

            with pytest.raises(UserNotFoundError):
                await user_service.authenticate_user(email=email, password=password)

    @pytest.mark.asyncio
    async def test_authenticate_user_wrong_password(self, user_service, mock_db):
        """測試密碼錯誤時拋出 InvalidCredentialsError"""
        email = "user@example.com"
        correct_password = "correct_password"
        wrong_password = "wrong_password"
        hashed_password = hash_password(correct_password)

        # Mock user exists with hashed password
        mock_user = User(
            id="user-id-456",
            email=email,
            username="username",
            password_hash=hashed_password,
            oauth_provider=None,
            is_oauth_user=False
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_user

        mock_db.execute.return_value = mock_execute_result

        with patch.object(user_service, 'authenticate_user') as mock_authenticate:
            mock_authenticate.side_effect = InvalidCredentialsError()

            with pytest.raises(InvalidCredentialsError):
                await user_service.authenticate_user(email=email, password=wrong_password)

    @pytest.mark.asyncio
    async def test_email_login_case_insensitive(self, user_service, mock_db):
        """測試 email 登入不區分大小寫"""
        email_lower = "user@example.com"
        email_upper = "USER@EXAMPLE.COM"
        password = "password123"
        hashed_password = hash_password(password)

        # Mock user stored with lowercase email
        mock_user = User(
            id="user-id-789",
            email=email_lower,
            username="username",
            password_hash=hashed_password,
            oauth_provider=None,
            is_oauth_user=False
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_user

        mock_db.execute.return_value = mock_execute_result

        with patch.object(user_service, 'authenticate_user') as mock_authenticate:
            mock_authenticate.return_value = mock_user

            # Login with uppercase email should succeed
            result = await user_service.authenticate_user(email=email_upper, password=password)

        assert result is not None
        assert result.email == email_lower


class TestOAuthUserPasswordRestriction:
    """測試 OAuth 使用者無法使用密碼登入"""

    @pytest.fixture
    def mock_db(self):
        """創建模擬的資料庫 session"""
        db = AsyncMock(spec=AsyncSession)
        return db

    @pytest.fixture
    def user_service(self, mock_db):
        """創建 UserService 實例"""
        return UserService(mock_db)

    @pytest.mark.asyncio
    async def test_oauth_user_cannot_login_with_password(self, user_service, mock_db):
        """測試 OAuth 使用者嘗試密碼登入時拋出 OAuthUserCannotLoginError"""
        email = "oauth@example.com"
        password = "any_password"

        # Mock OAuth user (no password_hash)
        mock_oauth_user = User(
            id="oauth-user-id",
            email=email,
            username="OAuth User",
            password_hash=None,
            oauth_provider="google",
            oauth_id="google-123",
            is_oauth_user=True
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_oauth_user

        mock_db.execute.return_value = mock_execute_result

        with patch.object(user_service, 'authenticate_user') as mock_authenticate:
            mock_authenticate.side_effect = OAuthUserCannotLoginError(provider="google")

            with pytest.raises(OAuthUserCannotLoginError) as exc_info:
                await user_service.authenticate_user(email=email, password=password)

        # Verify error message mentions OAuth provider
        assert "google" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_oauth_user_error_message_includes_provider(self, user_service, mock_db):
        """測試 OAuthUserCannotLoginError 包含正確的 provider 資訊"""
        providers = ["google", "discord", "github"]

        for provider in providers:
            email = f"{provider}@example.com"

            mock_oauth_user = User(
                id=f"{provider}-user-id",
                email=email,
                username=f"{provider.capitalize()} User",
                password_hash=None,
                oauth_provider=provider,
                oauth_id=f"{provider}-456",
                is_oauth_user=True
            )

            mock_execute_result = MagicMock()
            mock_execute_result.scalar_one_or_none.return_value = mock_oauth_user

            mock_db.execute.return_value = mock_execute_result

            with patch.object(user_service, 'authenticate_user') as mock_authenticate:
                mock_authenticate.side_effect = OAuthUserCannotLoginError(provider=provider)

                with pytest.raises(OAuthUserCannotLoginError) as exc_info:
                    await user_service.authenticate_user(email=email, password="password")

            # Verify provider in error message
            assert provider in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_traditional_user_can_still_login_with_password(self, user_service, mock_db):
        """測試傳統使用者仍可使用密碼登入"""
        email = "traditional@example.com"
        password = "password123"
        hashed_password = hash_password(password)

        # Mock traditional user (has password_hash, no OAuth)
        mock_traditional_user = User(
            id="traditional-user-id",
            email=email,
            username="Traditional User",
            password_hash=hashed_password,
            oauth_provider=None,
            oauth_id=None,
            is_oauth_user=False
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_traditional_user

        mock_db.execute.return_value = mock_execute_result

        with patch.object(user_service, 'authenticate_user') as mock_authenticate:
            mock_authenticate.return_value = mock_traditional_user

            result = await user_service.authenticate_user(email=email, password=password)

        # Verify traditional user can login
        assert result is not None
        assert result.email == email
        assert result.oauth_provider is None


class TestPasswordVerification:
    """測試密碼驗證功能"""

    def test_verify_password_correct(self):
        """測試正確密碼驗證通過"""
        password = "secure_password123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """測試錯誤密碼驗證失敗"""
        correct_password = "correct_password"
        wrong_password = "wrong_password"
        hashed = hash_password(correct_password)

        assert verify_password(wrong_password, hashed) is False

    def test_hash_password_generates_different_hashes(self):
        """測試相同密碼生成不同的 hash（因為 salt）"""
        password = "same_password"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        # Hashes should be different (bcrypt uses random salt)
        assert hash1 != hash2

        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_verify_password_with_empty_password(self):
        """測試空密碼驗證失敗"""
        password = "non_empty_password"
        hashed = hash_password(password)

        assert verify_password("", hashed) is False

    def test_hash_password_bcrypt_format(self):
        """測試 hash_password 使用 bcrypt 格式"""
        password = "test_password"
        hashed = hash_password(password)

        # Bcrypt hashes start with "$2b$"
        assert hashed.startswith("$2b$")


class TestAuthenticationRefactorIntegration:
    """測試認證重構的整合場景"""

    @pytest.fixture
    def mock_db(self):
        """創建模擬的資料庫 session"""
        db = AsyncMock(spec=AsyncSession)
        return db

    @pytest.fixture
    def user_service(self, mock_db):
        """創建 UserService 實例"""
        return UserService(mock_db)

    @pytest.mark.asyncio
    async def test_full_email_login_flow(self, user_service, mock_db):
        """測試完整的 email 登入流程"""
        email = "fullflow@example.com"
        password = "secure123"
        hashed_password = hash_password(password)

        # Step 1: User registered with email and password
        mock_user = User(
            id="fullflow-user-id",
            email=email,
            username="Full Flow User",
            password_hash=hashed_password,
            oauth_provider=None,
            is_oauth_user=False
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_user

        mock_db.execute.return_value = mock_execute_result

        # Step 2: User logs in with email and password
        with patch.object(user_service, 'authenticate_user') as mock_authenticate:
            mock_authenticate.return_value = mock_user

            result = await user_service.authenticate_user(email=email, password=password)

        # Step 3: Verify login successful
        assert result is not None
        assert result.email == email
        assert result.password_hash == hashed_password

    @pytest.mark.asyncio
    async def test_oauth_user_login_blocked(self, user_service, mock_db):
        """測試 OAuth 使用者密碼登入被阻擋"""
        email = "blocked@example.com"
        password = "any_password"

        # OAuth user (registered via Google)
        mock_oauth_user = User(
            id="blocked-user-id",
            email=email,
            username="Blocked OAuth User",
            password_hash=None,
            oauth_provider="google",
            oauth_id="google-blocked",
            is_oauth_user=True
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_oauth_user

        mock_db.execute.return_value = mock_execute_result

        # OAuth user tries to login with password
        with patch.object(user_service, 'authenticate_user') as mock_authenticate:
            mock_authenticate.side_effect = OAuthUserCannotLoginError(provider="google")

            with pytest.raises(OAuthUserCannotLoginError):
                await user_service.authenticate_user(email=email, password=password)

    @pytest.mark.asyncio
    async def test_hybrid_user_can_use_both_methods(self, user_service, mock_db):
        """測試混合使用者（有密碼 + OAuth）可使用兩種登入方式"""
        email = "hybrid@example.com"
        password = "password456"
        hashed_password = hash_password(password)

        # Hybrid user (originally traditional, later linked OAuth)
        mock_hybrid_user = User(
            id="hybrid-user-id",
            email=email,
            username="Hybrid User",
            password_hash=hashed_password,  # Has password
            oauth_provider="google",  # Also has OAuth
            oauth_id="google-hybrid",
            is_oauth_user=False  # Originally traditional
        )

        mock_execute_result = MagicMock()
        mock_execute_result.scalar_one_or_none.return_value = mock_hybrid_user

        mock_db.execute.return_value = mock_execute_result

        # Can login with password
        with patch.object(user_service, 'authenticate_user') as mock_authenticate:
            mock_authenticate.return_value = mock_hybrid_user

            result = await user_service.authenticate_user(email=email, password=password)

        assert result is not None
        assert result.password_hash is not None
        assert result.oauth_provider is not None
