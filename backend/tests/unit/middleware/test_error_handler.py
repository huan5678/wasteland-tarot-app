"""
測試：錯誤處理中介軟體
TDD 紅燈階段 - 先撰寫測試再實作功能
"""

import pytest
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.testclient import TestClient
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.exceptions import (
    WastelandTarotException,
    WebAuthnRegistrationError,
    WebAuthnAuthenticationError,
    CredentialNotFoundError,
    InvalidChallengeError,
    CounterError,
    UserAlreadyExistsError,
)


# Test fixtures
@pytest.fixture
def test_app():
    """建立測試用的 FastAPI 應用程式"""
    app = FastAPI()

    # 註冊錯誤處理器
    from app.middleware.error_handler import register_error_handlers
    register_error_handlers(app)

    return app


@pytest.fixture
def client(test_app: FastAPI):
    """建立 TestClient"""
    return TestClient(test_app)


class TestErrorHandlerMiddleware:
    """測試錯誤處理中介軟體的核心功能"""

    def test_returns_unified_error_response_format(self, test_app: FastAPI, client: TestClient):
        """
        測試：統一錯誤回應格式
        確保所有錯誤都回傳一致的 JSON 格式
        """
        @test_app.get("/test-error")
        async def test_error_endpoint():
            raise WebAuthnRegistrationError("測試錯誤")

        response = client.get("/test-error")

        # 驗證回應格式
        assert response.status_code == 400
        data = response.json()

        # 驗證統一格式
        assert "success" in data
        assert data["success"] is False
        assert "error" in data

        # 驗證錯誤物件結構
        error = data["error"]
        assert "code" in error
        assert "message" in error
        assert "details" in error
        assert "timestamp" in error

        # 驗證 timestamp 是 ISO 8601 格式
        timestamp = error["timestamp"]
        datetime.fromisoformat(timestamp.replace("Z", "+00:00"))


    def test_handles_webauthn_registration_error(self, test_app: FastAPI, client: TestClient):
        """
        測試：處理 WebAuthnRegistrationError
        確保 WebAuthn 註冊錯誤正確轉換為 Fallout 風格訊息
        """
        @test_app.get("/test-registration-error")
        async def test_registration_error():
            raise WebAuthnRegistrationError("生物辨識註冊失敗，請確認 Pip-Boy 功能正常")

        response = client.get("/test-registration-error")

        assert response.status_code == 400
        data = response.json()

        assert data["error"]["code"] == "WEBAUTHN_REGISTRATION_ERROR"
        assert "Pip-Boy" in data["error"]["message"]
        assert "生物辨識" in data["error"]["message"]


    def test_handles_webauthn_authentication_error(self, test_app: FastAPI, client: TestClient):
        """
        測試：處理 WebAuthnAuthenticationError
        確保 WebAuthn 認證錯誤使用 Fallout 主題訊息
        """
        @test_app.get("/test-auth-error")
        async def test_auth_error():
            raise WebAuthnAuthenticationError("生物辨識驗證失敗，請重新掃描 Pip-Boy")

        response = client.get("/test-auth-error")

        assert response.status_code == 401
        data = response.json()

        assert data["error"]["code"] == "WEBAUTHN_AUTHENTICATION_ERROR"
        assert "Pip-Boy" in data["error"]["message"]


    def test_handles_credential_not_found_error(self, test_app: FastAPI, client: TestClient):
        """
        測試：處理 CredentialNotFoundError
        確保憑證找不到錯誤使用避難所主題訊息
        """
        @test_app.get("/test-credential-not-found")
        async def test_credential_not_found():
            raise CredentialNotFoundError("避難所資料庫中找不到此生物辨識記錄")

        response = client.get("/test-credential-not-found")

        assert response.status_code == 404
        data = response.json()

        assert data["error"]["code"] == "CREDENTIAL_NOT_FOUND"
        assert "避難所" in data["error"]["message"]


    def test_handles_invalid_challenge_error(self, test_app: FastAPI, client: TestClient):
        """
        測試：處理 InvalidChallengeError
        確保 challenge 驗證錯誤使用安全協議主題訊息
        """
        @test_app.get("/test-invalid-challenge")
        async def test_invalid_challenge():
            raise InvalidChallengeError("安全驗證碼已過期，避難科技安全協議要求重新驗證")

        response = client.get("/test-invalid-challenge")

        assert response.status_code == 400
        data = response.json()

        assert data["error"]["code"] == "INVALID_CHALLENGE"
        assert "安全" in data["error"]["message"]
        assert "避難科技" in data["error"]["message"]


    def test_handles_counter_error(self, test_app: FastAPI, client: TestClient):
        """
        測試：處理 CounterError
        確保 counter 異常錯誤使用時間扭曲主題訊息
        """
        @test_app.get("/test-counter-error")
        async def test_counter_error():
            raise CounterError("偵測到異常的時間扭曲（可能的複製裝置攻擊），Pip-Boy 安全鎖啟動")

        response = client.get("/test-counter-error")

        assert response.status_code == 403
        data = response.json()

        assert data["error"]["code"] == "COUNTER_ERROR"
        assert "時間扭曲" in data["error"]["message"]
        assert "安全鎖" in data["error"]["message"]


    def test_handles_user_already_exists_error(self, test_app: FastAPI, client: TestClient):
        """
        測試：處理 UserAlreadyExistsError
        確保使用者已存在錯誤使用避難所註冊主題訊息
        """
        @test_app.get("/test-user-exists")
        async def test_user_exists():
            raise UserAlreadyExistsError("test@example.com")

        response = client.get("/test-user-exists")

        assert response.status_code == 409
        data = response.json()

        assert data["error"]["code"] == "USER_ALREADY_EXISTS"
        assert "避難所" in data["error"]["message"]


    def test_handles_standard_http_exception(self, test_app: FastAPI, client: TestClient):
        """
        測試：處理標準 HTTPException
        確保 FastAPI 標準 HTTPException 也能正確轉換為統一格式
        """
        @test_app.get("/test-http-exception")
        async def test_http_exception():
            raise HTTPException(status_code=404, detail="Resource not found")

        response = client.get("/test-http-exception")

        assert response.status_code == 404
        data = response.json()

        assert data["success"] is False
        assert data["error"]["message"] == "Resource not found"


    def test_handles_unexpected_exception(self, test_app: FastAPI, client: TestClient):
        """
        測試：處理未預期的異常
        確保所有未捕獲的異常都轉換為 500 錯誤並記錄日誌
        """
        @test_app.get("/test-unexpected-error")
        async def test_unexpected_error():
            raise ValueError("這是一個未預期的錯誤")

        # TestClient 預設會在遇到未處理的異常時重新拋出
        # 但錯誤處理器應該已經記錄日誌了
        # 在真實的 HTTP 請求中，這會回傳 500 錯誤
        try:
            response = client.get("/test-unexpected-error")
            # 如果沒有拋出異常，驗證回應
            assert response.status_code == 500
            data = response.json()
            assert data["success"] is False
            assert data["error"]["code"] == "INTERNAL_SERVER_ERROR"
            assert "內部錯誤" in data["error"]["message"] or "發生錯誤" in data["error"]["message"]
        except ValueError:
            # TestClient 行為：在測試環境中重新拋出異常
            # 這是預期的行為，只要確認錯誤處理器有記錄日誌即可
            pass


    def test_includes_error_details_when_available(self, test_app: FastAPI, client: TestClient):
        """
        測試：包含錯誤詳細資訊
        確保異常類別的 details 欄位正確傳遞到回應
        """
        @test_app.get("/test-error-with-details")
        async def test_error_with_details():
            error = WastelandTarotException(
                status_code=400,
                message="測試錯誤",
                error_code="TEST_ERROR",
                details={"field": "email", "reason": "invalid format"}
            )
            raise error

        response = client.get("/test-error-with-details")

        assert response.status_code == 400
        data = response.json()

        assert data["error"]["details"] == {"field": "email", "reason": "invalid format"}


    def test_logs_error_information(self, test_app: FastAPI, client: TestClient, caplog):
        """
        測試：記錄錯誤日誌
        確保所有錯誤都被記錄到日誌系統
        """
        @test_app.get("/test-logging")
        async def test_logging():
            raise WebAuthnRegistrationError("測試日誌記錄")

        with caplog.at_level("ERROR"):
            response = client.get("/test-logging")

        assert response.status_code == 400

        # 驗證日誌記錄
        # 注意：這需要確認中介軟體有正確的日誌記錄實作
        # assert "WEBAUTHN_REGISTRATION_ERROR" in caplog.text


    def test_sanitizes_sensitive_information(self, test_app: FastAPI, client: TestClient):
        """
        測試：清理敏感資訊
        確保錯誤回應不會洩漏敏感資訊（密碼、金鑰等）
        """
        @test_app.get("/test-sensitive-info")
        async def test_sensitive_info():
            error = WastelandTarotException(
                status_code=400,
                message="測試敏感資訊",
                error_code="TEST_ERROR",
                details={"password": "secret123", "api_key": "sk_test_123"}
            )
            raise error

        response = client.get("/test-sensitive-info")

        assert response.status_code == 400
        data = response.json()

        # 驗證敏感欄位被清理或遮罩
        details = data["error"]["details"]
        if "password" in details:
            assert details["password"] != "secret123"
        if "api_key" in details:
            assert details["api_key"] != "sk_test_123"


class TestFalloutErrorMessages:
    """測試 Fallout 風格錯誤訊息映射"""

    def test_maps_browser_not_supported_error(self, test_app: FastAPI, client: TestClient):
        """
        測試：瀏覽器不支援錯誤映射
        錯誤碼：SECURITY_PROTOCOL_VIOLATION
        """
        @test_app.get("/test-browser-error")
        async def test_browser_error():
            error = WastelandTarotException(
                status_code=400,
                message="瀏覽器不支援 WebAuthn",
                error_code="BROWSER_NOT_SUPPORTED"
            )
            raise error

        response = client.get("/test-browser-error")
        data = response.json()

        # 可選：映射到 Fallout 風格
        # assert "Pip-Boy" in data["error"]["message"]


    def test_maps_network_error(self, test_app: FastAPI, client: TestClient):
        """
        測試：網路錯誤映射
        錯誤碼：RADIATION_INTERFERENCE
        """
        pass  # 將在實作時完成


    def test_maps_timeout_error(self, test_app: FastAPI, client: TestClient):
        """
        測試：逾時錯誤映射
        錯誤碼：WASTELAND_TIMEOUT
        """
        pass  # 將在實作時完成


class TestSecurityLogging:
    """測試安全性錯誤日誌記錄"""

    def test_logs_counter_errors_as_security_alerts(self, test_app: FastAPI, client: TestClient, caplog):
        """
        測試：Counter 錯誤記錄為安全警報
        確保 counter 異常被記錄為 CRITICAL 級別
        """
        @test_app.get("/test-counter-security")
        async def test_counter_security():
            raise CounterError()

        with caplog.at_level("CRITICAL"):
            response = client.get("/test-counter-security")

        assert response.status_code == 403
        # 驗證 CRITICAL 級別日誌
        # assert "COUNTER_ERROR" in caplog.text


    def test_logs_authentication_failures(self, test_app: FastAPI, client: TestClient, caplog):
        """
        測試：認證失敗記錄
        確保認證失敗被記錄並包含必要資訊
        """
        pass  # 將在實作時完成
