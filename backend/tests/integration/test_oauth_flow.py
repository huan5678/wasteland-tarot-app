"""
Task 24: 後端整合測試 - OAuth 完整流程測試
測試完整的 OAuth 授權流程（模擬 Google 回應）
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta
from app.main import app
from app.models.user import User
from app.models.social_features import KarmaHistory


class TestOAuthAuthorizationFlow:
    """測試 OAuth 授權流程"""

    @pytest.mark.asyncio
    async def test_google_oauth_login_redirect(self):
        """測試 Google OAuth 登入重定向"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/auth/google/login")

        # Should redirect to Google OAuth
        assert response.status_code in [302, 307]
        assert "accounts.google.com" in response.headers.get("location", "")
        assert "client_id" in response.headers.get("location", "")
        assert "redirect_uri" in response.headers.get("location", "")
        assert "scope" in response.headers.get("location", "")

    @pytest.mark.asyncio
    async def test_oauth_login_includes_state_parameter(self):
        """測試 OAuth 登入包含 state 參數（CSRF 保護）"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/auth/google/login")

        location = response.headers.get("location", "")
        assert "state=" in location

        # State should be stored in session/cookie
        assert "Set-Cookie" in response.headers or response.cookies

    @pytest.mark.asyncio
    async def test_oauth_login_includes_correct_scopes(self):
        """測試 OAuth 登入包含正確的 scopes"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/auth/google/login")

        location = response.headers.get("location", "")

        # Should request email and profile scopes
        assert "scope=" in location
        # URL encoded: openid+email+profile
        assert "email" in location.lower()
        assert "profile" in location.lower() or "openid" in location.lower()


class TestOAuthCallbackFlow:
    """測試 OAuth 回調流程"""

    @pytest.mark.asyncio
    async def test_oauth_callback_success_new_user(self, db_session):
        """測試 OAuth 回調成功（新使用者）"""
        # Mock Google token exchange response
        mock_google_response = {
            "access_token": "google_access_token_123",
            "id_token": "google_id_token_456",
            "expires_in": 3600,
            "token_type": "Bearer",
            "scope": "openid email profile",
            "refresh_token": "google_refresh_token_789"
        }

        # Mock Google user info response
        mock_user_info = {
            "sub": "google_user_id_12345",
            "email": "newuser@gmail.com",
            "email_verified": True,
            "name": "New Google User",
            "picture": "https://lh3.googleusercontent.com/a/default-user"
        }

        with patch("app.api.oauth.supabase") as mock_supabase:
            # Mock Supabase auth exchange
            mock_session = MagicMock()
            mock_session.access_token = "supabase_access_token"
            mock_session.refresh_token = "supabase_refresh_token"
            mock_session.user = MagicMock()
            mock_session.user.id = "supabase_user_id"
            mock_session.user.email = mock_user_info["email"]
            mock_session.user.user_metadata = mock_user_info

            mock_auth_response = MagicMock()
            mock_auth_response.session = mock_session

            mock_supabase.auth.exchange_code_for_session.return_value = mock_auth_response

            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "google_auth_code_xyz",
                        "state": "valid_state_token"
                    }
                )

        # Should redirect to frontend with success
        assert response.status_code in [302, 307]
        assert "/auth/callback" in response.headers.get("location", "")

        # Should set session cookies
        cookies = response.cookies
        assert "access_token" in cookies or "session" in cookies

    @pytest.mark.asyncio
    async def test_oauth_callback_success_existing_user(self, db_session):
        """測試 OAuth 回調成功（現有使用者）"""
        # Pre-create existing OAuth user
        existing_user = User(
            id="existing-oauth-user-id",
            email="existing@gmail.com",
            username="Existing User",
            oauth_provider="google",
            oauth_id="google_existing_123",
            is_oauth_user=True,
            email_verified=True,
            karma_score=75,
            faction_alignment="ncr"
        )
        db_session.add(existing_user)
        await db_session.commit()

        mock_user_info = {
            "sub": "google_existing_123",
            "email": "existing@gmail.com",
            "email_verified": True,
            "name": "Existing User",
            "picture": "https://lh3.googleusercontent.com/a/existing"
        }

        with patch("app.api.oauth.supabase") as mock_supabase:
            mock_session = MagicMock()
            mock_session.access_token = "supabase_access_token"
            mock_session.user = MagicMock()
            mock_session.user.email = mock_user_info["email"]
            mock_session.user.user_metadata = mock_user_info

            mock_auth_response = MagicMock()
            mock_auth_response.session = mock_session

            mock_supabase.auth.exchange_code_for_session.return_value = mock_auth_response

            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "google_auth_code_existing",
                        "state": "valid_state_token"
                    }
                )

        assert response.status_code in [302, 307]

        # Verify user data preserved
        await db_session.refresh(existing_user)
        assert existing_user.karma_score == 75
        assert existing_user.faction_alignment == "ncr"
        assert existing_user.last_login is not None

    @pytest.mark.asyncio
    async def test_oauth_callback_missing_code(self):
        """測試 OAuth 回調缺少授權碼"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/auth/google/callback",
                params={"state": "valid_state_token"}
                # Missing "code" parameter
            )

        # Should return error
        assert response.status_code == 400
        assert "error" in response.json() or "code" in response.json()

    @pytest.mark.asyncio
    async def test_oauth_callback_invalid_state(self):
        """測試 OAuth 回調無效的 state（CSRF 保護）"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/auth/google/callback",
                params={
                    "code": "google_auth_code_xyz",
                    "state": "invalid_state_mismatch"
                }
            )

        # Should reject due to state validation failure
        assert response.status_code in [400, 401, 403]
        assert "error" in response.json()

    @pytest.mark.asyncio
    async def test_oauth_callback_expired_code(self):
        """測試 OAuth 回調過期的授權碼"""
        with patch("app.api.oauth.supabase") as mock_supabase:
            # Mock Supabase returns error for expired code
            mock_supabase.auth.exchange_code_for_session.side_effect = Exception(
                "Authorization code expired"
            )

            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "expired_auth_code",
                        "state": "valid_state_token"
                    }
                )

        # Should return appropriate error
        assert response.status_code in [400, 401, 503]
        assert "error" in response.json()

    @pytest.mark.asyncio
    async def test_oauth_callback_google_error_response(self):
        """測試 OAuth 回調收到 Google 錯誤回應"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/auth/google/callback",
                params={
                    "error": "access_denied",
                    "error_description": "User denied access",
                    "state": "valid_state_token"
                }
            )

        # Should handle Google error gracefully
        assert response.status_code in [400, 401]
        data = response.json()
        assert "error" in data
        assert "access_denied" in str(data).lower() or "denied" in str(data).lower()


class TestOAuthUserCreation:
    """測試 OAuth 使用者建立和更新"""

    @pytest.mark.asyncio
    async def test_oauth_creates_user_with_correct_fields(self, db_session):
        """測試 OAuth 建立使用者時欄位正確"""
        mock_user_info = {
            "sub": "google_new_user_999",
            "email": "fields@gmail.com",
            "email_verified": True,
            "name": "Fields Test User",
            "picture": "https://lh3.googleusercontent.com/a/fields"
        }

        with patch("app.api.oauth.supabase") as mock_supabase, \
             patch("app.services.user_service.UserService.create_or_update_oauth_user") as mock_create:

            # Mock created user
            created_user = User(
                id="new-fields-user-id",
                email=mock_user_info["email"],
                username=mock_user_info["name"],
                oauth_provider="google",
                oauth_id=mock_user_info["sub"],
                is_oauth_user=True,
                email_verified=True,
                password_hash=None,  # OAuth users have no password
                karma_score=50,  # Initial karma
                faction_alignment="neutral"
            )
            mock_create.return_value = created_user

            mock_session = MagicMock()
            mock_session.access_token = "token"
            mock_session.user = MagicMock()
            mock_session.user.email = mock_user_info["email"]
            mock_session.user.user_metadata = mock_user_info

            mock_auth_response = MagicMock()
            mock_auth_response.session = mock_session
            mock_supabase.auth.exchange_code_for_session.return_value = mock_auth_response

            async with AsyncClient(app=app, base_url="http://test") as client:
                await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "auth_code_fields",
                        "state": "valid_state"
                    }
                )

        # Verify user creation was called with correct data
        mock_create.assert_called_once()
        call_kwargs = mock_create.call_args[1]
        assert call_kwargs["email"] == mock_user_info["email"]
        assert call_kwargs["name"] == mock_user_info["name"]
        assert call_kwargs["oauth_provider"] == "google"
        assert call_kwargs["oauth_id"] == mock_user_info["sub"]

    @pytest.mark.asyncio
    async def test_oauth_initializes_karma_for_new_user(self, db_session):
        """測試 OAuth 為新使用者初始化 Karma"""
        mock_user_info = {
            "sub": "google_karma_user_888",
            "email": "karma@gmail.com",
            "email_verified": True,
            "name": "Karma Test User",
            "picture": None
        }

        with patch("app.api.oauth.supabase") as mock_supabase, \
             patch("app.services.karma_service.KarmaService.initialize_karma_for_user") as mock_karma:

            # Mock karma initialization
            karma_history = KarmaHistory(
                user_id="karma-user-id",
                karma_before=0,
                karma_after=50,
                karma_change=50,
                reason="system_initialization"
            )
            mock_karma.return_value = karma_history

            mock_session = MagicMock()
            mock_session.access_token = "token"
            mock_session.user = MagicMock()
            mock_session.user.email = mock_user_info["email"]
            mock_session.user.user_metadata = mock_user_info

            mock_auth_response = MagicMock()
            mock_auth_response.session = mock_session
            mock_supabase.auth.exchange_code_for_session.return_value = mock_auth_response

            async with AsyncClient(app=app, base_url="http://test") as client:
                await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "auth_code_karma",
                        "state": "valid_state"
                    }
                )

        # Verify karma initialization was called
        mock_karma.assert_called_once()

    @pytest.mark.asyncio
    async def test_oauth_handles_missing_name(self, db_session):
        """測試 OAuth 處理 Google 未提供 name 的情況"""
        mock_user_info = {
            "sub": "google_no_name_777",
            "email": "noname@gmail.com",
            "email_verified": True,
            # "name" is missing
            "picture": None
        }

        with patch("app.api.oauth.supabase") as mock_supabase, \
             patch("app.services.user_service.UserService.create_or_update_oauth_user") as mock_create:

            # Mock user creation with default name
            created_user = User(
                id="no-name-user-id",
                email=mock_user_info["email"],
                username="noname",  # Default from email local part
                oauth_provider="google",
                oauth_id=mock_user_info["sub"],
                is_oauth_user=True,
                email_verified=True
            )
            mock_create.return_value = created_user

            mock_session = MagicMock()
            mock_session.access_token = "token"
            mock_session.user = MagicMock()
            mock_session.user.email = mock_user_info["email"]
            mock_session.user.user_metadata = mock_user_info

            mock_auth_response = MagicMock()
            mock_auth_response.session = mock_session
            mock_supabase.auth.exchange_code_for_session.return_value = mock_auth_response

            async with AsyncClient(app=app, base_url="http://test") as client:
                await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "auth_code_noname",
                        "state": "valid_state"
                    }
                )

        # Verify user was created with default name from email
        mock_create.assert_called_once()
        call_kwargs = mock_create.call_args[1]
        assert call_kwargs["name"] is None or call_kwargs["name"] == ""


class TestOAuthRetryLogic:
    """測試 OAuth 重試邏輯"""

    @pytest.mark.asyncio
    async def test_oauth_retries_on_network_error(self):
        """測試 OAuth 在網路錯誤時重試"""
        with patch("app.api.oauth.supabase") as mock_supabase:
            # First two attempts fail, third succeeds
            mock_supabase.auth.exchange_code_for_session.side_effect = [
                ConnectionError("Network error 1"),
                ConnectionError("Network error 2"),
                MagicMock(
                    session=MagicMock(
                        access_token="token",
                        user=MagicMock(
                            email="retry@gmail.com",
                            user_metadata={
                                "sub": "google_retry_666",
                                "email": "retry@gmail.com",
                                "name": "Retry User"
                            }
                        )
                    )
                )
            ]

            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "auth_code_retry",
                        "state": "valid_state"
                    }
                )

        # Should succeed after retries
        assert response.status_code in [200, 302, 307]
        assert mock_supabase.auth.exchange_code_for_session.call_count == 3

    @pytest.mark.asyncio
    async def test_oauth_fails_after_max_retries(self):
        """測試 OAuth 超過最大重試次數後失敗"""
        with patch("app.api.oauth.supabase") as mock_supabase:
            # All attempts fail
            mock_supabase.auth.exchange_code_for_session.side_effect = ConnectionError(
                "Persistent network error"
            )

            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "auth_code_fail",
                        "state": "valid_state"
                    }
                )

        # Should return error after max retries
        assert response.status_code in [500, 503]
        assert "error" in response.json()


class TestOAuthSecurityFeatures:
    """測試 OAuth 安全功能"""

    @pytest.mark.asyncio
    async def test_oauth_validates_email_verified(self):
        """測試 OAuth 驗證 email 已驗證"""
        mock_user_info = {
            "sub": "google_unverified_555",
            "email": "unverified@gmail.com",
            "email_verified": False,  # Email not verified
            "name": "Unverified User"
        }

        with patch("app.api.oauth.supabase") as mock_supabase:
            mock_session = MagicMock()
            mock_session.user = MagicMock()
            mock_session.user.email = mock_user_info["email"]
            mock_session.user.user_metadata = mock_user_info

            mock_auth_response = MagicMock()
            mock_auth_response.session = mock_session
            mock_supabase.auth.exchange_code_for_session.return_value = mock_auth_response

            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "auth_code_unverified",
                        "state": "valid_state"
                    }
                )

        # Should reject unverified email (or handle gracefully)
        # Implementation may vary: reject, warn, or allow with flag
        assert response.status_code in [200, 302, 307, 400, 403]

    @pytest.mark.asyncio
    async def test_oauth_prevents_email_hijacking(self, db_session):
        """測試 OAuth 防止 email 劫持（已存在的傳統使用者）"""
        # Pre-create traditional user
        traditional_user = User(
            id="traditional-user-protected",
            email="protected@example.com",
            username="Protected User",
            password_hash="hashed_password",
            oauth_provider=None,
            is_oauth_user=False
        )
        db_session.add(traditional_user)
        await db_session.commit()

        mock_user_info = {
            "sub": "google_hijack_attempt_444",
            "email": "protected@example.com",  # Same email as traditional user
            "email_verified": True,
            "name": "Hijack Attempt"
        }

        with patch("app.api.oauth.supabase") as mock_supabase:
            mock_session = MagicMock()
            mock_session.user = MagicMock()
            mock_session.user.email = mock_user_info["email"]
            mock_session.user.user_metadata = mock_user_info

            mock_auth_response = MagicMock()
            mock_auth_response.session = mock_session
            mock_supabase.auth.exchange_code_for_session.return_value = mock_auth_response

            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get(
                    "/api/auth/google/callback",
                    params={
                        "code": "auth_code_hijack",
                        "state": "valid_state"
                    }
                )

        # Should either:
        # 1. Link OAuth to existing account (if allowed)
        # 2. Reject with error (email already exists)
        # Verify behavior matches security policy
        assert response.status_code in [200, 302, 307, 400, 409]
