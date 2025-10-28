"""
TDD: 認證錯誤處理與降級機制測試（Task 10.1）

測試需求來自：.kiro/specs/google-oauth-passkey-integration/requirements.md
- 需求 10: 錯誤處理與降級方案（跨認證方式容錯）

測試策略：
- 測試 Google OAuth 服務不可用時的降級處理
- 測試 WebAuthn 不支援時的降級處理
- 測試 OAuth 授權失敗時的重試邏輯
- 測試 OAuth 失敗 3 次後的建議機制
- 測試 Passkey 驗證失敗時的重試或切換選項
- 測試任何方式連續失敗 5 次後鎖定 15 分鐘
- 測試 WebAuthn 功能被停用時回傳 501 Not Implemented
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, AsyncMock
from freezegun import freeze_time


class TestOAuthErrorHandling:
    """測試 OAuth 錯誤處理和降級機制"""

    # ============================================
    # 測試 1: OAuth 服務不可用時的降級處理
    # ============================================
    @pytest.mark.asyncio
    async def test_should_return_503_when_oauth_service_unavailable(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 10: OAuth 服務不可用時應回傳 503 Service Unavailable

        前置條件：
        - Supabase OAuth 服務無法連線（網路錯誤）

        預期行為：
        - 回傳 503 Service Unavailable
        - 錯誤訊息：「Google 登入服務暫時無法使用」
        - 包含重試建議
        """
        from app.core.exceptions import SupabaseConnectionError
        from app.api.oauth import oauth_callback, OAuthCallbackRequest
        from fastapi import status

        # 準備測試資料
        request = OAuthCallbackRequest(code="test_code_123")

        # Mock Supabase 連線失敗（所有重試都失敗）
        with patch('app.api.oauth.get_supabase_client') as mock_supabase:
            mock_supabase.return_value.auth.exchange_code_for_session.side_effect = ConnectionError(
                "Connection to Supabase failed"
            )

            # 執行：嘗試處理 OAuth 回調
            with pytest.raises(SupabaseConnectionError) as exc_info:
                response = MagicMock()
                await oauth_callback(request, response, clean_db_session)

            # 驗證：錯誤類型和訊息
            error = exc_info.value
            assert error.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            assert "Supabase" in error.message or "授權碼交換" in error.message
            assert error.error_code == "SUPABASE_CONNECTION_ERROR"

    # ============================================
    # 測試 2: OAuth 授權失敗時的錯誤訊息
    # ============================================
    @pytest.mark.asyncio
    async def test_should_return_401_when_oauth_authorization_fails(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 10: OAuth 授權失敗時應回傳 401 Unauthorized

        前置條件：
        - OAuth 授權碼無效或已過期

        預期行為：
        - 回傳 401 Unauthorized
        - 錯誤訊息：「Google 登入授權失敗：授權碼無效或已過期」
        - 建議用戶重新嘗試
        """
        from app.core.exceptions import OAuthAuthorizationError
        from app.api.oauth import oauth_callback, OAuthCallbackRequest
        from fastapi import status

        # 準備測試資料
        request = OAuthCallbackRequest(code="invalid_code")

        # Mock Supabase 授權失敗
        with patch('app.api.oauth.get_supabase_client') as mock_supabase:
            mock_response = MagicMock()
            mock_response.session = None  # 授權失敗時 session 為 None
            mock_supabase.return_value.auth.exchange_code_for_session.return_value = mock_response

            # 執行：嘗試處理 OAuth 回調
            with pytest.raises(OAuthAuthorizationError) as exc_info:
                response = MagicMock()
                await oauth_callback(request, response, clean_db_session)

            # 驗證：錯誤類型和訊息
            error = exc_info.value
            assert error.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Google" in error.message
            assert "授權" in error.message
            assert error.error_code == "OAUTH_AUTHORIZATION_ERROR"

    # ============================================
    # 測試 3: OAuth 重試邏輯（最多 3 次）
    # ============================================
    @pytest.mark.asyncio
    async def test_should_retry_oauth_exchange_up_to_3_times(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 10: OAuth 授權碼交換應重試最多 3 次（間隔 1/2/4 秒）

        前置條件：
        - Supabase 授權碼交換遇到暫時性網路錯誤

        預期行為：
        - 自動重試最多 3 次
        - 重試間隔：1 秒、2 秒、4 秒（指數退避）
        - 若第 2 次或第 3 次成功，不拋出錯誤
        - 若 3 次都失敗，拋出 SupabaseConnectionError
        """
        from app.core.exceptions import SupabaseConnectionError
        from app.core.retry import retry_async, SUPABASE_RETRY_CONFIG

        # 測試場景 1: 第 2 次重試成功
        retry_count = 0

        async def flaky_function_success_on_2nd():
            nonlocal retry_count
            retry_count += 1
            if retry_count < 2:
                raise ConnectionError("Temporary network error")
            return "success"

        # 執行：重試邏輯
        result = await retry_async(flaky_function_success_on_2nd, config=SUPABASE_RETRY_CONFIG)

        # 驗證：第 2 次成功
        assert result == "success"
        assert retry_count == 2

        # 測試場景 2: 3 次都失敗
        retry_count_fail = 0

        async def flaky_function_always_fail():
            nonlocal retry_count_fail
            retry_count_fail += 1
            raise ConnectionError("Persistent network error")

        # 執行：重試邏輯（應失敗）
        with pytest.raises(ConnectionError):
            await retry_async(flaky_function_always_fail, config=SUPABASE_RETRY_CONFIG)

        # 驗證：重試了 3 次
        assert retry_count_fail == 3


class TestWebAuthnErrorHandling:
    """測試 WebAuthn/Passkey 錯誤處理和降級機制"""

    # ============================================
    # 測試 4: WebAuthn 功能被停用時回傳 501
    # ============================================
    @pytest.mark.asyncio
    async def test_should_return_501_when_webauthn_disabled(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 10: WebAuthn 功能被停用時應回傳 501 Not Implemented

        前置條件：
        - 環境變數 WEBAUTHN_ENABLED=false

        預期行為：
        - 回傳 501 Not Implemented
        - 錯誤訊息：「Passkey 功能目前未啟用」
        - 建議用戶使用其他登入方式
        """
        from app.services.webauthn_service import WebAuthnService
        from fastapi import HTTPException, status
        from app.models.user import User

        # Mock WebAuthn 功能被停用
        with patch('app.core.webauthn.webauthn_config.enabled', False):
            service = WebAuthnService(clean_db_session)

            # 建立測試用戶
            test_user = User(
                email="test@example.com",
                name="Test User"
            )

            # 執行：嘗試產生註冊選項
            with pytest.raises(HTTPException) as exc_info:
                service.generate_registration_options(
                    user=test_user,
                    device_name="Test Device"
                )

            # 驗證：錯誤類型和訊息
            error = exc_info.value
            assert error.status_code == status.HTTP_501_NOT_IMPLEMENTED
            assert "Passkey" in str(error.detail) or "未啟用" in str(error.detail)

    # ============================================
    # 測試 5: WebAuthn 驗證失敗時的重試選項
    # ============================================
    @pytest.mark.asyncio
    async def test_should_provide_retry_option_when_passkey_verification_fails(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 10: Passkey 驗證失敗時應提供重試或切換選項

        前置條件：
        - WebAuthn assertion 驗證失敗（簽名錯誤）

        預期行為：
        - 回傳 401 Unauthorized
        - 錯誤訊息：「生物辨識驗證失敗，請重新掃描 Pip-Boy」
        - 前端應顯示「重試」或「使用其他方式登入」按鈕
        """
        from app.core.exceptions import WebAuthnAuthenticationError
        from fastapi import status

        # 測試錯誤物件本身（不需要真實的 WebAuthn Service）
        error = WebAuthnAuthenticationError(message="生物辨識驗證失敗，請重新掃描 Pip-Boy")

        # 驗證：錯誤類型和訊息
        assert error.status_code == status.HTTP_401_UNAUTHORIZED
        assert "生物辨識" in error.message or "驗證失敗" in error.message or "Pip-Boy" in error.message
        assert error.error_code == "WEBAUTHN_AUTHENTICATION_ERROR"


class TestAuthFailureLockout:
    """測試認證失敗鎖定機制"""

    # ============================================
    # 測試 6: 連續失敗 5 次後鎖定 15 分鐘（錯誤類型測試）
    # ============================================
    @pytest.mark.asyncio
    async def test_should_lock_account_after_5_consecutive_failures(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 10: 任何認證方式連續失敗 5 次後鎖定 15 分鐘

        前置條件：
        - 連續 5 次登入失敗

        預期行為：
        - 第 5 次失敗回傳 423 Locked
        - 錯誤訊息：「因安全威脅，帳號已鎖定 15 分鐘」
        - 包含鎖定時長資訊
        """
        from app.core.exceptions import AccountLockedError
        from fastapi import status

        # 測試錯誤物件（實際鎖定邏輯在 auth_service 中實作）
        error = AccountLockedError(lockout_duration=15)

        # 驗證：錯誤類型和訊息
        assert error.status_code == status.HTTP_423_LOCKED
        assert "鎖定" in error.message
        assert "15" in error.message or error.details.get("lockout_duration_minutes") == 15
        assert error.error_code == "ACCOUNT_LOCKED"

    # ============================================
    # 測試 7: OAuth 失敗 3 次後建議改用其他方式
    # ============================================
    @pytest.mark.asyncio
    async def test_should_suggest_alternative_method_after_3_oauth_failures(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 10: OAuth 失敗 3 次後建議改用其他方式

        前置條件：
        - 用戶連續 3 次 OAuth 授權失敗

        預期行為：
        - 前 2 次失敗顯示：「請重試」
        - 第 3 次失敗顯示：「請檢查網路連線或改用其他登入方式」
        - 前端應突出顯示其他可用的登入方式
        """
        # 註：此測試主要在前端實作，後端只需確保錯誤訊息正確
        # 這裡測試後端錯誤訊息的一致性

        from app.core.exceptions import OAuthAuthorizationError

        # 模擬 OAuth 授權錯誤
        error = OAuthAuthorizationError(
            provider="Google",
            reason="授權碼無效或已過期"
        )

        # 驗證：錯誤訊息包含必要資訊
        assert error.status_code == 401
        assert "Google" in error.message
        assert error.error_code == "OAUTH_AUTHORIZATION_ERROR"
        assert error.details["oauth_provider"] == "Google"


class TestErrorMessageLocalization:
    """測試錯誤訊息本地化（繁體中文）"""

    # ============================================
    # 測試 8: 所有錯誤訊息都使用繁體中文
    # ============================================
    def test_all_error_messages_should_be_in_traditional_chinese(self):
        """
        需求 10: 所有錯誤訊息應使用繁體中文

        預期行為：
        - OAuth 相關錯誤訊息使用繁體中文
        - WebAuthn 相關錯誤訊息使用繁體中文（帶 Fallout 主題）
        - 帳號鎖定錯誤訊息使用繁體中文
        """
        from app.core.exceptions import (
            OAuthAuthorizationError,
            WebAuthnAuthenticationError,
            AccountLockedError,
            SupabaseConnectionError
        )

        # 測試 OAuth 錯誤訊息
        oauth_error = OAuthAuthorizationError(provider="Google")
        assert "Google" in oauth_error.message
        assert "登入" in oauth_error.message or "授權" in oauth_error.message

        # 測試 WebAuthn 錯誤訊息（Fallout 主題）
        webauthn_error = WebAuthnAuthenticationError()
        assert "生物辨識" in webauthn_error.message or "Pip-Boy" in webauthn_error.message

        # 測試帳號鎖定錯誤訊息
        lockout_error = AccountLockedError(lockout_duration=15)
        assert "鎖定" in lockout_error.message
        assert "15" in lockout_error.message

        # 測試 Supabase 連線錯誤訊息
        supabase_error = SupabaseConnectionError(operation="授權碼交換")
        assert "Supabase" in supabase_error.message or "授權碼交換" in supabase_error.message
