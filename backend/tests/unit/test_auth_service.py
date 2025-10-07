"""
測試 AuthenticationService - JWT token 驗證和刷新功能

使用 TDD 方法論測試認證服務的核心功能
"""

import pytest
from datetime import datetime, timedelta
from jose import jwt
from app.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_token,
    get_access_token_cookie_settings,
    get_refresh_token_cookie_settings
)


class TestJWTTokenVerification:
    """測試 JWT token 驗證功能"""

    def test_verify_valid_access_token(self):
        """測試驗證有效的 access token"""
        # Arrange
        user_id = "test-user-123"
        token_data = {"sub": user_id, "email": "test@example.com"}
        token = create_access_token(data=token_data)

        # Act
        payload = verify_token(token)

        # Assert
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "access"
        assert "exp" in payload
        assert "iat" in payload

    def test_verify_valid_refresh_token(self):
        """測試驗證有效的 refresh token"""
        # Arrange
        user_id = "test-user-456"
        token_data = {"sub": user_id}
        token = create_refresh_token(data=token_data)

        # Act
        payload = verify_token(token)

        # Assert
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "refresh"

    def test_verify_expired_token(self):
        """測試驗證過期的 token 應返回 None"""
        # Arrange - 建立已過期的 token
        user_id = "test-user-789"
        past_time = datetime.utcnow() - timedelta(hours=1)
        token_data = {
            "sub": user_id,
            "exp": past_time,
            "iat": past_time - timedelta(minutes=30),
            "type": "access"
        }
        expired_token = jwt.encode(token_data, settings.secret_key, algorithm=settings.algorithm)

        # Act
        payload = verify_token(expired_token)

        # Assert
        assert payload is None

    def test_verify_invalid_signature(self):
        """測試驗證簽章錯誤的 token 應返回 None"""
        # Arrange
        user_id = "test-user-000"
        token_data = {"sub": user_id}
        # 使用錯誤的 secret key 簽署
        invalid_token = jwt.encode(token_data, "wrong-secret-key", algorithm=settings.algorithm)

        # Act
        payload = verify_token(invalid_token)

        # Assert
        assert payload is None

    def test_verify_empty_token(self):
        """測試驗證空字串 token 應返回 None"""
        # Act
        payload = verify_token("")

        # Assert
        assert payload is None

    def test_verify_malformed_token(self):
        """測試驗證格式錯誤的 token 應返回 None"""
        # Act
        payload = verify_token("not.a.valid.jwt.token")

        # Assert
        assert payload is None


class TestCookieSettings:
    """測試 Cookie 配置功能"""

    def test_access_token_cookie_settings(self):
        """測試 access token cookie 配置"""
        # Act
        settings_dict = get_access_token_cookie_settings()

        # Assert
        assert settings_dict["key"] == "access_token"
        assert settings_dict["httponly"] is True
        assert settings_dict["samesite"] == "lax"
        assert settings_dict["max_age"] == 30 * 60  # 30 分鐘

    def test_refresh_token_cookie_settings(self):
        """測試 refresh token cookie 配置"""
        # Act
        settings_dict = get_refresh_token_cookie_settings()

        # Assert
        assert settings_dict["key"] == "refresh_token"
        assert settings_dict["httponly"] is True
        assert settings_dict["samesite"] == "lax"
        assert settings_dict["max_age"] == 7 * 24 * 60 * 60  # 7 天

    def test_secure_flag_in_production(self, monkeypatch):
        """測試生產環境 secure flag 應為 True"""
        # Arrange
        monkeypatch.setattr(settings, "environment", "production")

        # Act
        access_settings = get_access_token_cookie_settings()
        refresh_settings = get_refresh_token_cookie_settings()

        # Assert
        assert access_settings["secure"] is True
        assert refresh_settings["secure"] is True

    def test_secure_flag_in_development(self, monkeypatch):
        """測試開發環境 secure flag 應為 False"""
        # Arrange
        monkeypatch.setattr(settings, "environment", "development")

        # Act
        access_settings = get_access_token_cookie_settings()
        refresh_settings = get_refresh_token_cookie_settings()

        # Assert
        assert access_settings["secure"] is False
        assert refresh_settings["secure"] is False


class TestTokenRefresh:
    """測試 token 刷新邏輯"""

    def test_refresh_token_has_longer_expiry(self):
        """測試 refresh token 的有效期應比 access token 長"""
        # Arrange
        user_id = "test-user-111"
        token_data = {"sub": user_id}

        # Act
        access_token = create_access_token(data=token_data)
        refresh_token = create_refresh_token(data=token_data)

        access_payload = verify_token(access_token)
        refresh_payload = verify_token(refresh_token)

        # Assert
        assert refresh_payload["exp"] > access_payload["exp"]

    def test_refresh_token_type_is_refresh(self):
        """測試 refresh token 的 type 應為 'refresh'"""
        # Arrange
        token_data = {"sub": "test-user-222"}

        # Act
        token = create_refresh_token(data=token_data)
        payload = verify_token(token)

        # Assert
        assert payload["type"] == "refresh"
