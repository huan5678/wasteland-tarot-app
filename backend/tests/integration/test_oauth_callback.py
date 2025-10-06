"""
OAuth Callback Integration Tests

測試 OAuth 授權回調端點的完整流程，包含：
- 授權碼交換
- 使用者建立/更新
- JWT token 生成
- httpOnly cookie 設定
- 錯誤處理

需求映射：
- 2.2: 接收授權碼並交換 session
- 2.3: 提取使用者資料
- 2.4: 建立或更新使用者
- 3.1: 呼叫 OAuth 使用者服務
- 3.4: 初始化 Karma（若為新使用者）
- 12.1: 返回 JWT token 和使用者資料
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.models.user import User


@pytest.mark.integration
class TestOAuthCallback:
    """測試 OAuth 回調端點"""

    @pytest.fixture
    def client(self):
        """建立測試客戶端"""
        return TestClient(app)

    def test_oauth_callback_success_new_user(self, client, db_session: AsyncSession):
        """
        測試成功的 OAuth 回調 - 新使用者
        需求：2.2, 2.3, 2.4, 3.1, 12.1
        """
        # Mock Supabase auth response
        mock_supabase_user = Mock()
        mock_supabase_user.id = "google_oauth_123456"
        mock_supabase_user.email = "newuser@gmail.com"
        mock_supabase_user.user_metadata = {
            "full_name": "New User",
            "avatar_url": "https://example.com/avatar.jpg"
        }
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_session = Mock()
        mock_auth_response = Mock()
        mock_auth_response.session = mock_session
        mock_auth_response.user = mock_supabase_user

        # Mock Supabase client
        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            # 發送 OAuth 回調請求
            response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "valid_auth_code_123"}
            )

            # 驗證回應
            assert response.status_code == 200
            data = response.json()

            # 驗證 token
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"

            # 驗證使用者資料
            assert "user" in data
            user = data["user"]
            assert user["email"] == "newuser@gmail.com"
            assert user["name"] == "New User"
            assert user["oauth_provider"] == "google"
            assert user["profile_picture_url"] == "https://example.com/avatar.jpg"
            assert user["is_oauth_user"] is True

            # 驗證 cookies 被設定
            assert "access_token" in response.cookies
            assert "refresh_token" in response.cookies

    def test_oauth_callback_success_existing_user(self, client, db_session: AsyncSession):
        """
        測試成功的 OAuth 回調 - 現有使用者
        需求：2.2, 2.3, 2.4, 3.1
        """
        # Mock Supabase auth response
        mock_supabase_user = Mock()
        mock_supabase_user.id = "google_oauth_789"
        mock_supabase_user.email = "existing@gmail.com"
        mock_supabase_user.user_metadata = {"full_name": "Existing User"}
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_auth_response = Mock()
        mock_auth_response.session = Mock()
        mock_auth_response.user = mock_supabase_user

        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            # 第一次請求：建立使用者
            response1 = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "auth_code_1"}
            )
            assert response1.status_code == 200
            user1 = response1.json()["user"]

            # 第二次請求：相同使用者登入
            response2 = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "auth_code_2"}
            )
            assert response2.status_code == 200
            user2 = response2.json()["user"]

            # 驗證是同一個使用者
            assert user1["email"] == user2["email"]
            assert user1["oauth_provider"] == user2["oauth_provider"]

    def test_oauth_callback_invalid_code(self, client):
        """
        測試無效的授權碼
        需求：11.1, 11.2
        """
        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            # 模擬 Supabase 授權失敗
            mock_client.auth.exchange_code_for_session.side_effect = Exception("Invalid auth code")
            mock_get_client.return_value = mock_client

            response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "invalid_code"}
            )

            # 應返回 503 External Service Error
            assert response.status_code == 503
            assert "Supabase" in response.json()["detail"]

    def test_oauth_callback_missing_email(self, client):
        """
        測試 OAuth 提供者未返回 email
        需求：11.1, 11.2
        """
        # Mock Supabase user without email
        mock_supabase_user = Mock()
        mock_supabase_user.id = "oauth_no_email"
        mock_supabase_user.email = None  # 沒有 email
        mock_supabase_user.user_metadata = {}
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_auth_response = Mock()
        mock_auth_response.session = Mock()
        mock_auth_response.user = mock_supabase_user

        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "valid_code"}
            )

            # 應返回 400 Bad Request
            assert response.status_code == 400
            assert "email" in response.json()["detail"].lower()

    def test_oauth_callback_missing_name_uses_email(self, client):
        """
        測試當 OAuth 未提供 name 時，使用 email 本地部分
        需求：3.2
        """
        mock_supabase_user = Mock()
        mock_supabase_user.id = "oauth_no_name"
        mock_supabase_user.email = "testuser@example.com"
        mock_supabase_user.user_metadata = {}  # 沒有 name
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_auth_response = Mock()
        mock_auth_response.session = Mock()
        mock_auth_response.user = mock_supabase_user

        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "valid_code"}
            )

            assert response.status_code == 200
            user = response.json()["user"]
            # name 應為 email 本地部分
            assert user["name"] == "testuser"

    def test_oauth_callback_cookie_security_settings(self, client):
        """
        測試 httpOnly cookie 的安全設定
        需求：7.4, 14.2
        """
        mock_supabase_user = Mock()
        mock_supabase_user.id = "oauth_cookie_test"
        mock_supabase_user.email = "cookie@test.com"
        mock_supabase_user.user_metadata = {"full_name": "Cookie Tester"}
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_auth_response = Mock()
        mock_auth_response.session = Mock()
        mock_auth_response.user = mock_supabase_user

        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "valid_code"}
            )

            assert response.status_code == 200

            # 驗證 access_token cookie 設定
            access_cookie = response.cookies.get("access_token")
            assert access_cookie is not None

            # 驗證 refresh_token cookie 設定
            refresh_cookie = response.cookies.get("refresh_token")
            assert refresh_cookie is not None

            # 注意：TestClient 可能無法完整驗證 httponly, secure, samesite 屬性
            # 這些需要在 E2E 測試或手動測試中驗證

    def test_oauth_callback_generates_valid_jwt(self, client):
        """
        測試生成的 JWT token 是有效的
        需求：12.1
        """
        from app.core.security import verify_token

        mock_supabase_user = Mock()
        mock_supabase_user.id = "oauth_jwt_test"
        mock_supabase_user.email = "jwt@test.com"
        mock_supabase_user.user_metadata = {"full_name": "JWT Tester"}
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_auth_response = Mock()
        mock_auth_response.session = Mock()
        mock_auth_response.user = mock_supabase_user

        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "valid_code"}
            )

            assert response.status_code == 200
            data = response.json()

            # 驗證 access token
            access_token = data["access_token"]
            payload = verify_token(access_token)
            assert payload is not None
            assert "sub" in payload  # 應包含使用者 ID

            # 驗證 refresh token
            refresh_token = data["refresh_token"]
            refresh_payload = verify_token(refresh_token)
            assert refresh_payload is not None
            assert "sub" in refresh_payload
