"""
Task 23: 後端單元測試 - OAuth 例外測試
測試 OAuth 相關例外類別
"""

import pytest
from fastapi import status
from app.core.exceptions import (
    OAuthAuthorizationError,
    OAuthCallbackError,
    OAuthUserCreationError,
    OAuthStateValidationError,
    SupabaseConnectionError
)


class TestOAuthExceptions:
    """測試 OAuth 相關例外類別"""

    def test_oauth_authorization_error_default(self):
        """測試 OAuthAuthorizationError 預設訊息"""
        error = OAuthAuthorizationError()

        assert error.status_code == status.HTTP_401_UNAUTHORIZED
        assert "OAuth" in error.message
        assert "登入失敗" in error.message or "授權失敗" in error.message
        assert error.error_code == "OAUTH_AUTHORIZATION_ERROR"

    def test_oauth_authorization_error_with_provider(self):
        """測試 OAuthAuthorizationError 包含 provider"""
        error = OAuthAuthorizationError(provider="Google")

        assert error.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Google" in error.message
        assert error.details["oauth_provider"] == "Google"

    def test_oauth_authorization_error_with_reason(self):
        """測試 OAuthAuthorizationError 包含 reason"""
        error = OAuthAuthorizationError(provider="Google", reason="授權碼無效")

        assert "授權碼無效" in error.message
        assert error.details["reason"] == "授權碼無效"

    def test_oauth_callback_error_default(self):
        """測試 OAuthCallbackError 預設訊息"""
        error = OAuthCallbackError()

        assert error.status_code == status.HTTP_400_BAD_REQUEST
        assert "回調處理失敗" in error.message or "登入處理失敗" in error.message
        assert error.error_code == "OAUTH_CALLBACK_ERROR"

    def test_oauth_callback_error_with_provider_and_reason(self):
        """測試 OAuthCallbackError 包含 provider 和 reason"""
        error = OAuthCallbackError(provider="Google", reason="未返回 email")

        assert error.status_code == status.HTTP_400_BAD_REQUEST
        assert "Google" in error.message
        assert "未返回 email" in error.message
        assert error.details["oauth_provider"] == "Google"
        assert error.details["reason"] == "未返回 email"

    def test_oauth_user_creation_error_default(self):
        """測試 OAuthUserCreationError 預設訊息"""
        error = OAuthUserCreationError()

        assert error.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "帳號建立失敗" in error.message or "建立帳號失敗" in error.message
        assert error.error_code == "OAUTH_USER_CREATION_ERROR"

    def test_oauth_user_creation_error_with_reason(self):
        """測試 OAuthUserCreationError 包含 reason"""
        error = OAuthUserCreationError(provider="Google", reason="資料庫錯誤")

        assert error.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Google" in error.message
        assert "資料庫錯誤" in error.message

    def test_oauth_state_validation_error(self):
        """測試 OAuthStateValidationError"""
        error = OAuthStateValidationError()

        assert error.status_code == status.HTTP_400_BAD_REQUEST
        assert "狀態驗證失敗" in error.message
        assert "CSRF" in error.message
        assert error.error_code == "OAUTH_STATE_VALIDATION_ERROR"

    def test_supabase_connection_error_default(self):
        """測試 SupabaseConnectionError 預設訊息"""
        error = SupabaseConnectionError()

        assert error.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert "Supabase" in error.message
        assert "連線失敗" in error.message or "請稍後再試" in error.message
        assert error.error_code == "SUPABASE_CONNECTION_ERROR"

    def test_supabase_connection_error_with_operation(self):
        """測試 SupabaseConnectionError 包含 operation"""
        error = SupabaseConnectionError(operation="授權碼交換")

        assert error.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert "授權碼交換" in error.message
        assert error.details["operation"] == "授權碼交換"

    def test_all_errors_inherit_from_http_exception(self):
        """測試所有 OAuth 例外都繼承自 HTTPException"""
        from fastapi import HTTPException

        errors = [
            OAuthAuthorizationError(),
            OAuthCallbackError(),
            OAuthUserCreationError(),
            OAuthStateValidationError(),
            SupabaseConnectionError()
        ]

        for error in errors:
            assert isinstance(error, HTTPException)

    def test_error_messages_are_traditional_chinese(self):
        """測試錯誤訊息為繁體中文"""
        errors = [
            OAuthAuthorizationError(provider="Google"),
            OAuthCallbackError(provider="Google"),
            OAuthUserCreationError(provider="Google"),
            OAuthStateValidationError(),
            SupabaseConnectionError()
        ]

        # 檢查包含繁體中文字元
        for error in errors:
            # 繁體中文常見字：登入、失敗、建立、驗證、連線
            assert any(char in error.message for char in ["登", "入", "失", "敗", "建", "立", "驗", "證", "連", "線"])
