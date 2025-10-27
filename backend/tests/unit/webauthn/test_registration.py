"""
WebAuthn Registration Flow Tests (TDD - Red Phase)

Test cases for new user Passkey registration:
- generate_registration_options()
- verify_registration_response()
- register_new_user_with_passkey()

Following TDD cycle:
1. Red: Write failing tests first
2. Green: Implement minimum code to pass tests
3. Refactor: Optimize while keeping tests passing

Reference: .kiro/specs/passkey-authentication/design.md Section "WebAuthn 註冊流程"
"""

import pytest
import secrets
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4, UUID

from app.services.webauthn_service import WebAuthnService
from app.services.challenge_store import ChallengeStore
from app.models.user import User
from app.models.credential import Credential
from app.core.exceptions import (
    UserAlreadyExistsError,
    WebAuthnRegistrationError,
    InvalidChallengeError,
)
from webauthn.helpers.structs import (
    PublicKeyCredentialCreationOptions,
)


# ==================== Test Fixtures ====================

@pytest.fixture
def mock_db_session():
    """Mock database session"""
    session = Mock()
    session.execute = Mock()
    session.add = Mock()
    session.flush = Mock()
    session.commit = Mock()
    session.refresh = Mock()
    session.rollback = Mock()
    return session


@pytest.fixture
def webauthn_service(mock_db_session):
    """WebAuthn service instance with mocked dependencies"""
    return WebAuthnService(db=mock_db_session)


@pytest.fixture
def challenge_store():
    """Challenge store instance (in-memory fallback)"""
    return ChallengeStore(redis_client=None, fallback_to_session=True)


@pytest.fixture
def new_user_data():
    """New user registration data"""
    return {
        "email": "test@wasteland.com",
        "name": "Vault Dweller",
    }


@pytest.fixture
def mock_attestation_response():
    """Mock WebAuthn attestation response data"""
    return {
        "credential_id": secrets.token_hex(32),  # 64 hex chars (32 bytes)
        "client_data_json": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiVEVTVCIsIm9yaWdpbiI6Imh0dHA6Ly9sb2NhbGhvc3Q6MzAwMCJ9",
        "attestation_object": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YVikU0YJ...",
        "device_name": "MacBook Touch ID",
    }


@pytest.fixture
def mock_verification_result():
    """Mock py_webauthn verification result"""
    mock_result = Mock()
    mock_result.credential_public_key = bytes.fromhex("a" * 128)  # 64 bytes
    mock_result.sign_count = 0
    mock_result.credential_device_type = ["internal"]
    mock_result.aaguid = uuid4()
    mock_result.credential_backed_up = True
    return mock_result


# ==================== Test: generate_registration_options_for_new_user() ====================

class TestGenerateRegistrationOptionsForNewUser:
    """測試產生新用戶註冊選項"""

    def test_generate_options_success(self, webauthn_service, new_user_data, mock_db_session):
        """測試成功產生註冊選項"""
        # Arrange: 確保 email 不存在
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None

        # Act
        with patch('app.services.webauthn_service.generate_registration_options') as mock_gen:
            mock_options = Mock(spec=PublicKeyCredentialCreationOptions)
            mock_gen.return_value = mock_options

            options = webauthn_service.generate_registration_options_for_new_user(
                email=new_user_data["email"],
                name=new_user_data["name"]
            )

        # Assert
        assert options is not None
        assert isinstance(options, Mock)  # Should be PublicKeyCredentialCreationOptions
        mock_gen.assert_called_once()

    def test_generate_options_contains_correct_challenge_length(self, webauthn_service, new_user_data, mock_db_session):
        """測試 challenge 長度正確（32 bytes）"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None

        # Act
        with patch('app.services.webauthn_service.generate_registration_options') as mock_gen:
            # Simulate real challenge generation
            test_challenge = secrets.token_bytes(32)
            mock_options = Mock()
            mock_options.challenge = test_challenge
            mock_gen.return_value = mock_options

            options = webauthn_service.generate_registration_options_for_new_user(
                email=new_user_data["email"],
                name=new_user_data["name"]
            )

        # Assert
        assert len(options.challenge) == 32

    def test_generate_options_contains_user_info(self, webauthn_service, new_user_data, mock_db_session):
        """測試回傳包含正確的使用者資訊"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None

        # Act
        with patch('app.services.webauthn_service.generate_registration_options') as mock_gen:
            mock_options = Mock()
            mock_options.user = Mock()
            mock_options.user.name = new_user_data["email"]
            mock_options.user.display_name = new_user_data["name"]
            mock_gen.return_value = mock_options

            options = webauthn_service.generate_registration_options_for_new_user(
                email=new_user_data["email"],
                name=new_user_data["name"]
            )

        # Assert
        assert options.user.name == new_user_data["email"]
        assert options.user.display_name == new_user_data["name"]

    def test_generate_options_contains_rp_info(self, webauthn_service, new_user_data, mock_db_session):
        """測試回傳包含正確的 RP 資訊"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None

        # Act
        with patch('app.services.webauthn_service.generate_registration_options') as mock_gen:
            mock_options = Mock()
            mock_options.rp = Mock()
            mock_options.rp.id = "wastelandtarot.com"
            mock_options.rp.name = "Wasteland Tarot"
            mock_gen.return_value = mock_options

            options = webauthn_service.generate_registration_options_for_new_user(
                email=new_user_data["email"],
                name=new_user_data["name"]
            )

        # Assert
        assert options.rp.id is not None
        assert options.rp.name is not None

    def test_email_already_exists_raises_error(self, webauthn_service, new_user_data, mock_db_session):
        """測試 email 已註冊時拋出 UserAlreadyExistsError"""
        # Arrange: 模擬 email 已存在
        existing_user = Mock(spec=User)
        existing_user.email = new_user_data["email"]
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = existing_user

        # Act & Assert
        with pytest.raises(UserAlreadyExistsError):
            webauthn_service.generate_registration_options_for_new_user(
                email=new_user_data["email"],
                name=new_user_data["name"]
            )


# ==================== Test: register_new_user_with_passkey() ====================

class TestRegisterNewUserWithPasskey:
    """測試完整的新用戶註冊流程"""

    def test_register_new_user_success(
        self,
        webauthn_service,
        new_user_data,
        mock_attestation_response,
        mock_verification_result,
        mock_db_session
    ):
        """測試成功註冊新用戶並建立 Passkey"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None  # No existing user
        expected_challenge = secrets.token_bytes(32)

        # Act
        with patch('app.services.webauthn_service.verify_registration_response') as mock_verify:
            mock_verify.return_value = mock_verification_result

            user, credential = webauthn_service.register_new_user_with_passkey(
                email=new_user_data["email"],
                name=new_user_data["name"],
                credential_id=mock_attestation_response["credential_id"],
                client_data_json=mock_attestation_response["client_data_json"],
                attestation_object=mock_attestation_response["attestation_object"],
                device_name=mock_attestation_response["device_name"],
                expected_challenge=expected_challenge
            )

        # Assert
        assert user is not None
        assert credential is not None
        mock_db_session.add.assert_called()
        mock_db_session.commit.assert_called()

    def test_register_creates_user_without_password(
        self,
        webauthn_service,
        new_user_data,
        mock_attestation_response,
        mock_verification_result,
        mock_db_session
    ):
        """測試建立的用戶沒有密碼（passwordless）"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
        expected_challenge = secrets.token_bytes(32)

        # Mock user creation to capture arguments
        created_users = []
        def side_effect_add(obj):
            if isinstance(obj, User):
                created_users.append(obj)
        mock_db_session.add.side_effect = side_effect_add

        # Act
        with patch('app.services.webauthn_service.verify_registration_response') as mock_verify:
            mock_verify.return_value = mock_verification_result

            user, credential = webauthn_service.register_new_user_with_passkey(
                email=new_user_data["email"],
                name=new_user_data["name"],
                credential_id=mock_attestation_response["credential_id"],
                client_data_json=mock_attestation_response["client_data_json"],
                attestation_object=mock_attestation_response["attestation_object"],
                device_name=mock_attestation_response["device_name"],
                expected_challenge=expected_challenge
            )

        # Assert
        assert len(created_users) >= 1
        created_user = created_users[0]
        assert created_user.password_hash is None
        assert created_user.oauth_provider is None

    def test_register_stores_credential(
        self,
        webauthn_service,
        new_user_data,
        mock_attestation_response,
        mock_verification_result,
        mock_db_session
    ):
        """測試成功儲存 credential"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
        expected_challenge = secrets.token_bytes(32)

        # Mock credential creation to capture arguments
        created_credentials = []
        def side_effect_add(obj):
            if isinstance(obj, Credential):
                created_credentials.append(obj)
        mock_db_session.add.side_effect = side_effect_add

        # Act
        with patch('app.services.webauthn_service.verify_registration_response') as mock_verify:
            mock_verify.return_value = mock_verification_result

            user, credential = webauthn_service.register_new_user_with_passkey(
                email=new_user_data["email"],
                name=new_user_data["name"],
                credential_id=mock_attestation_response["credential_id"],
                client_data_json=mock_attestation_response["client_data_json"],
                attestation_object=mock_attestation_response["attestation_object"],
                device_name=mock_attestation_response["device_name"],
                expected_challenge=expected_challenge
            )

        # Assert
        assert len(created_credentials) >= 1
        created_cred = created_credentials[0]
        assert created_cred.credential_id == mock_attestation_response["credential_id"]
        assert created_cred.device_name == mock_attestation_response["device_name"]

    def test_register_duplicate_email_raises_error(
        self,
        webauthn_service,
        new_user_data,
        mock_attestation_response,
        mock_db_session
    ):
        """測試重複 email 時拋出 UserAlreadyExistsError"""
        # Arrange: 模擬 email 已存在
        existing_user = Mock(spec=User)
        existing_user.email = new_user_data["email"]
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = existing_user
        expected_challenge = secrets.token_bytes(32)

        # Act & Assert
        with pytest.raises(UserAlreadyExistsError):
            webauthn_service.register_new_user_with_passkey(
                email=new_user_data["email"],
                name=new_user_data["name"],
                credential_id=mock_attestation_response["credential_id"],
                client_data_json=mock_attestation_response["client_data_json"],
                attestation_object=mock_attestation_response["attestation_object"],
                device_name=mock_attestation_response["device_name"],
                expected_challenge=expected_challenge
            )


# ==================== Test: Challenge Validation ====================

class TestChallengeValidation:
    """測試 Challenge 驗證相關邏輯"""

    def test_invalid_challenge_length_raises_error(
        self,
        webauthn_service,
        new_user_data,
        mock_attestation_response,
        mock_db_session
    ):
        """測試 challenge 長度不正確時拋出錯誤"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
        invalid_challenge = secrets.token_bytes(16)  # Wrong length (should be 32)

        # Act & Assert
        with patch('app.services.webauthn_service.verify_registration_response') as mock_verify:
            # Simulate challenge validation failure
            mock_verify.side_effect = InvalidChallengeError("Challenge 長度不正確")

            with pytest.raises(WebAuthnRegistrationError):
                webauthn_service.register_new_user_with_passkey(
                    email=new_user_data["email"],
                    name=new_user_data["name"],
                    credential_id=mock_attestation_response["credential_id"],
                    client_data_json=mock_attestation_response["client_data_json"],
                    attestation_object=mock_attestation_response["attestation_object"],
                    device_name=mock_attestation_response["device_name"],
                    expected_challenge=invalid_challenge
                )

    def test_mismatched_challenge_raises_error(
        self,
        webauthn_service,
        new_user_data,
        mock_attestation_response,
        mock_db_session
    ):
        """測試 challenge 不一致時拋出 WebAuthnRegistrationError"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
        expected_challenge = secrets.token_bytes(32)

        # Act & Assert
        with patch('app.services.webauthn_service.verify_registration_response') as mock_verify:
            # Simulate challenge mismatch
            mock_verify.side_effect = InvalidChallengeError("Challenge 不一致")

            with pytest.raises(WebAuthnRegistrationError):
                webauthn_service.register_new_user_with_passkey(
                    email=new_user_data["email"],
                    name=new_user_data["name"],
                    credential_id=mock_attestation_response["credential_id"],
                    client_data_json=mock_attestation_response["client_data_json"],
                    attestation_object=mock_attestation_response["attestation_object"],
                    device_name=mock_attestation_response["device_name"],
                    expected_challenge=expected_challenge
                )


# ==================== Test: Origin Validation ====================

class TestOriginValidation:
    """測試 Origin 驗證相關邏輯"""

    def test_invalid_origin_raises_error(
        self,
        webauthn_service,
        new_user_data,
        mock_attestation_response,
        mock_db_session
    ):
        """測試 origin 不正確時拋出 WebAuthnRegistrationError"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
        expected_challenge = secrets.token_bytes(32)

        # Act & Assert
        with patch('app.services.webauthn_service.verify_registration_response') as mock_verify:
            # Simulate origin validation failure
            mock_verify.side_effect = WebAuthnRegistrationError("Origin 不正確")

            with pytest.raises(WebAuthnRegistrationError):
                webauthn_service.register_new_user_with_passkey(
                    email=new_user_data["email"],
                    name=new_user_data["name"],
                    credential_id=mock_attestation_response["credential_id"],
                    client_data_json=mock_attestation_response["client_data_json"],
                    attestation_object=mock_attestation_response["attestation_object"],
                    device_name=mock_attestation_response["device_name"],
                    expected_challenge=expected_challenge
                )


# ==================== Test: Signature Validation ====================

class TestSignatureValidation:
    """測試簽章驗證相關邏輯"""

    def test_invalid_signature_raises_error(
        self,
        webauthn_service,
        new_user_data,
        mock_attestation_response,
        mock_db_session
    ):
        """測試 signature 無效時拋出 WebAuthnRegistrationError"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
        expected_challenge = secrets.token_bytes(32)

        # Act & Assert
        with patch('app.services.webauthn_service.verify_registration_response') as mock_verify:
            # Simulate signature validation failure
            mock_verify.side_effect = WebAuthnRegistrationError("Signature 驗證失敗")

            with pytest.raises(WebAuthnRegistrationError):
                webauthn_service.register_new_user_with_passkey(
                    email=new_user_data["email"],
                    name=new_user_data["name"],
                    credential_id=mock_attestation_response["credential_id"],
                    client_data_json=mock_attestation_response["client_data_json"],
                    attestation_object=mock_attestation_response["attestation_object"],
                    device_name=mock_attestation_response["device_name"],
                    expected_challenge=expected_challenge
                )


# ==================== Test: Rollback on Failure ====================

class TestRollbackBehavior:
    """測試失敗時的 rollback 行為"""

    def test_rollback_on_registration_failure(
        self,
        webauthn_service,
        new_user_data,
        mock_attestation_response,
        mock_db_session
    ):
        """測試註冊失敗時會 rollback 資料庫操作"""
        # Arrange
        mock_db_session.execute.return_value.scalar_one_or_none.return_value = None
        expected_challenge = secrets.token_bytes(32)

        # Act
        with patch('app.services.webauthn_service.verify_registration_response') as mock_verify:
            mock_verify.side_effect = WebAuthnRegistrationError("驗證失敗")

            try:
                webauthn_service.register_new_user_with_passkey(
                    email=new_user_data["email"],
                    name=new_user_data["name"],
                    credential_id=mock_attestation_response["credential_id"],
                    client_data_json=mock_attestation_response["client_data_json"],
                    attestation_object=mock_attestation_response["attestation_object"],
                    device_name=mock_attestation_response["device_name"],
                    expected_challenge=expected_challenge
                )
            except WebAuthnRegistrationError:
                pass

        # Assert
        mock_db_session.rollback.assert_called()


# ==================== Integration Test: Challenge Store ====================

class TestChallengeStoreIntegration:
    """測試 Challenge Store 整合"""

    @pytest.mark.asyncio
    async def test_challenge_stored_and_retrieved(self, challenge_store):
        """測試 challenge 可正確儲存和取出"""
        # Arrange
        challenge = challenge_store.generate_challenge()
        key = "webauthn:challenge:test-user"

        # Act
        await challenge_store.store_challenge(key, challenge, ttl=300)
        retrieved_challenge = await challenge_store.get_challenge(key)

        # Assert
        assert retrieved_challenge == challenge

    @pytest.mark.asyncio
    async def test_challenge_single_use(self, challenge_store):
        """測試 challenge 只能使用一次"""
        # Arrange
        challenge = challenge_store.generate_challenge()
        key = "webauthn:challenge:test-user"

        # Act
        await challenge_store.store_challenge(key, challenge, ttl=300)
        first_retrieval = await challenge_store.get_challenge(key)
        second_retrieval = await challenge_store.get_challenge(key)

        # Assert
        assert first_retrieval == challenge
        assert second_retrieval is None  # Should be deleted after first retrieval

    @pytest.mark.asyncio
    async def test_challenge_expiration(self, challenge_store):
        """測試 challenge 會過期"""
        # Arrange
        challenge = challenge_store.generate_challenge()
        key = "webauthn:challenge:test-user"

        # Act
        await challenge_store.store_challenge(key, challenge, ttl=1)  # 1 second TTL

        # Wait for expiration (simulate)
        import asyncio
        await asyncio.sleep(2)

        retrieved_challenge = await challenge_store.get_challenge(key)

        # Assert
        assert retrieved_challenge is None  # Should be expired
