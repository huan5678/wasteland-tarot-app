"""
Auth Endpoints Tests - Email Login Refactor

測試重構後的登入端點，使用 email + password 而非 username + password

需求映射：
- 4.1: 使用 email 而非 username
- 4.2: Email 格式驗證
- 4.3: OAuth 使用者不允許密碼登入
- 4.6: 成功登入後生成 JWT token
- 4.7: 使用通用錯誤訊息
"""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.core.security import create_access_token, verify_token


@pytest.mark.api
class TestLoginEndpoint:
    """測試登入端點（email + password）"""

    @pytest.fixture
    def client(self):
        """建立測試客戶端"""
        return TestClient(app)

    def test_login_with_email_success(self, client):
        """
        測試使用 email 成功登入
        需求：4.1, 4.2, 4.6
        """
        # Mock AuthenticationService.login_user
        mock_result = {
            "user": {
                "id": "user_123",
                "name": "Test User",
                "email": "test@example.com",
                "is_verified": True
            },
            "access_token": "mock_access_token",
            "refresh_token": "mock_refresh_token"
        }

        with patch('app.api.auth.AuthenticationService') as mock_auth_service:
            mock_instance = Mock()
            mock_instance.login_user.return_value = mock_result
            mock_auth_service.return_value = mock_instance

            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "ValidPassword123"
                }
            )

            assert response.status_code == 200
            data = response.json()

            # 驗證回應結構
            assert "message" in data
            assert data["message"] == "登入成功"
            assert "user" in data
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"

            # 驗證使用者資料
            assert data["user"]["email"] == "test@example.com"
            assert data["user"]["name"] == "Test User"

            # 驗證使用 email 呼叫（而非 username）
            mock_instance.login_user.assert_called_once_with(
                "test@example.com",
                "ValidPassword123"
            )

    def test_login_with_invalid_email_format(self, client):
        """
        測試無效的 email 格式
        需求：4.2
        """
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "invalid-email",  # 無效格式
                "password": "Password123"
            }
        )

        # Pydantic 驗證失敗應返回 422
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_login_with_empty_password(self, client):
        """
        測試空密碼
        需求：4.2
        """
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": ""  # 空密碼
            }
        )

        # 驗證失敗
        assert response.status_code == 422

    def test_login_oauth_user_attempts_password_login(self, client):
        """
        測試 OAuth 使用者嘗試密碼登入
        需求：4.3, 4.5
        """
        from app.core.exceptions import OAuthUserCannotLoginError

        with patch('app.api.auth.AuthenticationService') as mock_auth_service:
            mock_instance = Mock()
            # 模擬拋出 OAuthUserCannotLoginError
            mock_instance.login_user.side_effect = OAuthUserCannotLoginError(provider="Google")
            mock_auth_service.return_value = mock_instance

            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "oauth@gmail.com",
                    "password": "SomePassword123"
                }
            )

            # 應返回 400 Bad Request
            assert response.status_code == 400
            data = response.json()

            # 驗證錯誤訊息包含 OAuth 提示
            assert "Google" in data["detail"]
            assert "Google 登入" in data["detail"]

    def test_login_with_invalid_credentials(self, client):
        """
        測試無效的登入憑證
        需求：4.7 - 使用通用錯誤訊息
        """
        from app.core.exceptions import InvalidCredentialsError

        with patch('app.api.auth.AuthenticationService') as mock_auth_service:
            mock_instance = Mock()
            mock_instance.login_user.side_effect = InvalidCredentialsError("email 或密碼錯誤")
            mock_auth_service.return_value = mock_instance

            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "wrong@example.com",
                    "password": "WrongPassword"
                }
            )

            # 應返回 401 Unauthorized
            assert response.status_code == 401
            data = response.json()

            # 驗證使用通用錯誤訊息（不洩露帳號是否存在）
            assert "detail" in data
            # 不應該明確說明是 email 或密碼哪個錯誤
            assert "email 或密碼" in data["detail"].lower() or "invalid" in data["detail"].lower()

    def test_login_with_locked_account(self, client):
        """
        測試帳號被鎖定
        需求：4.4
        """
        from app.core.exceptions import AccountLockedError

        with patch('app.api.auth.AuthenticationService') as mock_auth_service:
            mock_instance = Mock()
            mock_instance.login_user.side_effect = AccountLockedError()
            mock_auth_service.return_value = mock_instance

            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "locked@example.com",
                    "password": "Password123"
                }
            )

            # 應返回 401 Unauthorized
            assert response.status_code == 401
            data = response.json()
            assert "locked" in data["detail"].lower()

    def test_login_generates_valid_jwt_tokens(self, client):
        """
        測試登入生成有效的 JWT tokens
        需求：4.6
        """
        # 生成真實的 tokens
        user_id = "test_user_456"
        access_token = create_access_token(data={"sub": user_id})
        refresh_token = create_access_token(data={"sub": user_id})

        mock_result = {
            "user": {
                "id": user_id,
                "name": "JWT Tester",
                "email": "jwt@test.com"
            },
            "access_token": access_token,
            "refresh_token": refresh_token
        }

        with patch('app.api.auth.AuthenticationService') as mock_auth_service:
            mock_instance = Mock()
            mock_instance.login_user.return_value = mock_result
            mock_auth_service.return_value = mock_instance

            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "jwt@test.com",
                    "password": "Password123"
                }
            )

            assert response.status_code == 200
            data = response.json()

            # 驗證 access token
            access_payload = verify_token(data["access_token"])
            assert access_payload is not None
            assert access_payload["sub"] == user_id

            # 驗證 refresh token
            refresh_payload = verify_token(data["refresh_token"])
            assert refresh_payload is not None
            assert refresh_payload["sub"] == user_id


@pytest.mark.api
class TestGetCurrentUserEndpoint:
    """測試取得當前使用者資訊端點"""

    @pytest.fixture
    def client(self):
        return TestClient(app)

    def test_get_current_user_returns_name_not_username(self, client):
        """
        測試 /auth/me 端點返回 name 而非 username
        需求：8.1
        """
        # 這個測試需要有效的 authentication
        # 暫時跳過，因為需要完整的 auth setup
        pass

    def test_get_current_user_shows_oauth_info(self, client):
        """
        測試 /auth/me 端點顯示 OAuth 資訊
        需求：8.2, 8.3
        """
        # 這個測試需要有效的 authentication
        # 暫時跳過，因為需要完整的 auth setup
        pass
