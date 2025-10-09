"""
Passkey Registration Flow Integration Tests
測試完整的 Passkey 註冊流程
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock


class TestPasskeyRegistrationFlow:
    """測試 Passkey 註冊流程整合"""

    def test_new_user_passkey_registration_options(self, client: TestClient):
        """測試新使用者取得 Passkey 註冊選項"""
        response = client.post(
            "/api/webauthn/register-new/options",
            json={
                "email": "newuser@example.com",
                "name": "New User"
            }
        )

        assert response.status_code == 200
        data = response.json()

        # 驗證回應包含必要欄位
        assert "options" in data
        assert "challenge" in data
        assert data["options"]["user"]["name"] == "newuser@example.com"
        assert data["options"]["user"]["displayName"] == "New User"

    def test_duplicate_email_registration_options(self, client: TestClient, test_user):
        """測試重複 email 註冊應該失敗"""
        response = client.post(
            "/api/webauthn/register-new/options",
            json={
                "email": test_user.email,  # 使用已存在的 email
                "name": "Another User"
            }
        )

        assert response.status_code == 409  # Conflict
        assert "已被註冊" in response.json()["detail"]

    @patch('app.api.webauthn.get_challenge_from_session')
    @patch('app.services.webauthn_service.verify_registration_response')
    def test_new_user_passkey_verification(
        self,
        mock_verify,
        mock_get_challenge,
        client: TestClient
    ):
        """測試新使用者 Passkey 驗證"""
        # 模擬 session 中的 challenge
        mock_get_challenge.return_value = b'mock_challenge'

        # 模擬驗證成功
        mock_verification = Mock()
        mock_verification.credential_public_key = b'mock_public_key'
        mock_verification.sign_count = 0
        mock_verification.credential_device_type = 'platform'
        mock_verification.aaguid = 'mock_aaguid'
        mock_verification.credential_backed_up = False
        mock_verify.return_value = mock_verification

        # 首先取得註冊選項
        options_response = client.post(
            "/api/webauthn/register-new/options",
            json={
                "email": "passkey@example.com",
                "name": "Passkey User"
            }
        )
        assert options_response.status_code == 200

        # 然後提交驗證
        verify_response = client.post(
            "/api/webauthn/register-new/verify",
            json={
                "email": "passkey@example.com",
                "name": "Passkey User",
                "credential_id": "mock_credential_id",
                "client_data_json": "mock_client_data",
                "attestation_object": "mock_attestation",
                "device_name": "iPhone 15"
            }
        )

        assert verify_response.status_code == 201  # Created
        data = verify_response.json()

        # 驗證回應包含必要欄位
        assert data["success"] is True
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert "credential" in data
        assert data["user"]["email"] == "passkey@example.com"

    def test_passkey_verification_without_options(self, client: TestClient):
        """測試未先取得選項就驗證應該失敗"""
        response = client.post(
            "/api/webauthn/register-new/verify",
            json={
                "email": "test@example.com",
                "name": "Test User",
                "credential_id": "mock_id",
                "client_data_json": "mock_data",
                "attestation_object": "mock_obj",
                "device_name": "Device"
            }
        )

        assert response.status_code == 400
        assert "Challenge" in response.json()["detail"]

    def test_passkey_verification_mismatched_email(self, client: TestClient):
        """測試 email 不一致應該失敗"""
        # 先取得選項
        client.post(
            "/api/webauthn/register-new/options",
            json={
                "email": "original@example.com",
                "name": "Original User"
            }
        )

        # 然後用不同的 email 驗證
        response = client.post(
            "/api/webauthn/register-new/verify",
            json={
                "email": "different@example.com",  # 不同的 email
                "name": "Original User",
                "credential_id": "mock_id",
                "client_data_json": "mock_data",
                "attestation_object": "mock_obj",
                "device_name": "Device"
            }
        )

        assert response.status_code == 400
        assert "使用者資訊不符" in response.json()["detail"]
