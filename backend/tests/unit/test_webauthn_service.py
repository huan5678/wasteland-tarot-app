"""
WebAuthn Service Unit Tests
測試 Passkey 功能的核心服務層
"""

import pytest
from unittest.mock import Mock, patch
from app.services.webauthn_service import WebAuthnService
from app.core.exceptions import UserAlreadyExistsError


class TestWebAuthnService:
    """測試 WebAuthn 服務"""

    @pytest.fixture
    def mock_db(self):
        """建立模擬的資料庫 session"""
        return Mock()

    @pytest.fixture
    def webauthn_service(self, mock_db):
        """建立 WebAuthn 服務實例"""
        return WebAuthnService(mock_db)

    def test_service_initialization(self, webauthn_service):
        """測試服務初始化"""
        assert webauthn_service is not None
        assert hasattr(webauthn_service, 'generate_registration_options_for_new_user')
        assert hasattr(webauthn_service, 'register_new_user_with_passkey')

    def test_generate_registration_options_new_user(self, webauthn_service, mock_db):
        """測試為新使用者產生註冊選項"""
        # 模擬查詢返回 None（使用者不存在）
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        email = "new_user@example.com"
        name = "New User"

        options = webauthn_service.generate_registration_options_for_new_user(email, name)

        # 驗證選項包含必要欄位
        assert options is not None
        assert hasattr(options, 'challenge')
        assert hasattr(options, 'rp')
        assert hasattr(options, 'user')
        assert options.user.name == email
        assert options.user.display_name == name

    def test_generate_registration_options_existing_user(self, webauthn_service, mock_db):
        """測試為已存在使用者產生註冊選項應該拋出錯誤"""
        # 模擬查詢返回已存在的使用者
        mock_result = Mock()
        mock_user = Mock()
        mock_user.email = "existing@example.com"
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result

        email = "existing@example.com"
        name = "Existing User"

        with pytest.raises(UserAlreadyExistsError):
            webauthn_service.generate_registration_options_for_new_user(email, name)

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_register_new_user_with_passkey(self, mock_verify, webauthn_service, mock_db):
        """測試使用 Passkey 註冊新使用者"""
        # 模擬查詢返回 None（使用者不存在）
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        # 模擬驗證成功
        mock_verification = Mock()
        mock_verification.credential_public_key = b'mock_public_key'
        mock_verification.sign_count = 0
        mock_verification.credential_device_type = 'platform'
        mock_verification.aaguid = 'mock_aaguid'
        mock_verification.credential_backed_up = False
        mock_verify.return_value = mock_verification

        email = "new@example.com"
        name = "New User"
        credential_id = "mock_credential_id"
        client_data_json = "mock_client_data"
        attestation_object = "mock_attestation"
        device_name = "iPhone 15"
        expected_challenge = b'mock_challenge'

        user, credential = webauthn_service.register_new_user_with_passkey(
            email=email,
            name=name,
            credential_id=credential_id,
            client_data_json=client_data_json,
            attestation_object=attestation_object,
            device_name=device_name,
            expected_challenge=expected_challenge
        )

        # 驗證使用者和憑證被建立
        assert user is not None
        assert credential is not None
        mock_db.add.assert_called()
        mock_db.commit.assert_called()

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_register_existing_user_should_fail(self, mock_verify, webauthn_service, mock_db):
        """測試註冊已存在的使用者應該失敗"""
        # 模擬查詢返回已存在的使用者
        mock_result = Mock()
        mock_user = Mock()
        mock_user.email = "existing@example.com"
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result

        email = "existing@example.com"
        name = "Existing User"

        with pytest.raises(UserAlreadyExistsError):
            webauthn_service.register_new_user_with_passkey(
                email=email,
                name=name,
                credential_id="mock_id",
                client_data_json="mock_data",
                attestation_object="mock_obj",
                device_name="Device",
                expected_challenge=b'challenge'
            )
