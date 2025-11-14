"""
WebAuthn Registration Tests

Tests for Passkey registration flow including:
- Registration options generation
- Registration response verification
- Credential creation and storage
- Error handling and edge cases
"""

import pytest
from unittest.mock import Mock, MagicMock, patch, ANY
from uuid import uuid4
from datetime import datetime

from fastapi import HTTPException

from app.services.webauthn_service import WebAuthnService
from app.models.user import User
from app.models.credential import Credential
from app.core.exceptions import (
    WebAuthnRegistrationError,
    UserAlreadyExistsError,
)


@pytest.fixture
def mock_db():
    """Mock database session"""
    db = Mock()
    db.commit = Mock()
    db.rollback = Mock()
    db.add = Mock()
    db.refresh = Mock()
    db.execute = Mock()
    return db


@pytest.fixture
def mock_user():
    """Mock user object"""
    user = Mock(spec=User)
    user.id = uuid4()
    user.email = "test@example.com"
    user.name = "Test User"
    user.webauthn_user_handle = None
    return user


@pytest.fixture
def mock_webauthn_config():
    """Mock WebAuthn configuration"""
    config = Mock()
    config.enabled = True
    config.rp_id = "localhost"
    config.rp_name = "Wasteland Tarot"
    config.origin = "http://localhost:3000"
    config.timeout_ms = 60000
    return config


@pytest.fixture
def webauthn_service(mock_db, mock_webauthn_config):
    """WebAuthn service with mocked dependencies"""
    # Setup default mock chain for _get_user_credentials
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    with patch('app.services.webauthn_service.get_webauthn_config', return_value=mock_webauthn_config):
        service = WebAuthnService(db=mock_db)

        # Mock helper methods that return enums/lists
        service._get_supported_algorithms = Mock(return_value=[])
        service._get_authenticator_attachment = Mock(return_value=None)
        service._get_user_verification = Mock(return_value="preferred")
        service._get_resident_key_requirement = Mock(return_value="preferred")
        service._get_attestation_preference = Mock(return_value="none")

        return service


class TestRegistrationOptionsGeneration:
    """Test registration options generation"""

    @patch('app.services.webauthn_service.generate_registration_options')
    @patch('app.services.webauthn_service.secrets')
    def test_generate_registration_options_success(
        self,
        mock_secrets,
        mock_generate,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should generate valid registration options"""
        # Mock return value
        mock_options = Mock()
        mock_generate.return_value = mock_options
        mock_secrets.token_bytes.return_value = b'x' * 64

        # Generate options
        options = webauthn_service.generate_registration_options(mock_user)

        assert options == mock_options
        mock_generate.assert_called_once()

    @patch('app.services.webauthn_service.generate_registration_options')
    @patch('app.services.webauthn_service.secrets')
    def test_generate_user_handle_if_not_exists(
        self,
        mock_secrets,
        mock_generate,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should generate user handle if user doesn't have one"""
        mock_user.webauthn_user_handle = None
        mock_generate.return_value = Mock()
        mock_secrets.token_bytes.return_value = b'x' * 64

        webauthn_service.generate_registration_options(mock_user)

        # User handle should be generated
        assert mock_user.webauthn_user_handle is not None
        assert len(mock_user.webauthn_user_handle) == 64
        mock_db.commit.assert_called_once()

    @patch('app.services.webauthn_service.generate_registration_options')
    @patch('app.services.webauthn_service.secrets')
    def test_exclude_existing_credentials(
        self,
        mock_secrets,
        mock_generate,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should exclude existing credentials to prevent duplicate registration"""
        # Mock existing credential (credential_id must be hex)
        existing_cred = Mock(spec=Credential)
        existing_cred.credential_id = "abcdef123456" * 4  # Hex string (even length)
        existing_cred.transports = ["usb", "nfc"]

        mock_db.execute.return_value.scalars.return_value.all.return_value = [existing_cred]
        mock_generate.return_value = Mock()
        mock_secrets.token_bytes.return_value = b'x' * 64

        webauthn_service.generate_registration_options(mock_user)

        # Should call generate_registration_options with exclude_credentials
        call_kwargs = mock_generate.call_args.kwargs
        assert 'exclude_credentials' in call_kwargs
        assert len(call_kwargs['exclude_credentials']) == 1

    def test_webauthn_disabled_raises_error(
        self,
        webauthn_service,
        mock_user
    ):
        """Should raise 501 Not Implemented if WebAuthn is disabled"""
        webauthn_service.config.enabled = False

        with pytest.raises(HTTPException) as exc_info:
            webauthn_service.generate_registration_options(mock_user)

        assert exc_info.value.status_code == 501
        assert "未啟用" in exc_info.value.detail

    @patch('app.services.webauthn_service.generate_registration_options')
    def test_registration_options_exception_handling(
        self,
        mock_generate,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should handle exceptions during options generation"""
        mock_generate.side_effect = Exception("WebAuthn library error")
        mock_db.execute.return_value.scalars.return_value.all.return_value = []

        with pytest.raises(WebAuthnRegistrationError, match="無法生成 Passkey 註冊選項"):
            webauthn_service.generate_registration_options(mock_user)


class TestRegistrationResponseVerification:
    """Test registration response verification"""

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_verify_registration_success(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should successfully verify registration response and create credential"""
        # Mock verification result
        mock_verification = Mock()
        mock_verification.credential_public_key = b"public_key_bytes"
        mock_verification.sign_count = 0
        mock_verification.credential_device_type = ["internal"]
        mock_verification.aaguid = uuid4()
        mock_verification.credential_backed_up = False
        mock_verify.return_value = mock_verification

        # Mock no existing credential
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        # Verify registration
        credential = webauthn_service.verify_registration_response(
            user=mock_user,
            credential_id="test_cred_id",
            client_data_json="client_data",
            attestation_object="attestation",
            device_name="MacBook Touch ID",
            expected_challenge=b"x" * 32
        )

        # Credential should be created
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        assert isinstance(credential, Credential)

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_prevent_duplicate_credential_registration(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should prevent registering the same credential twice"""
        # Mock existing credential
        existing_cred = Mock(spec=Credential)
        mock_db.execute.return_value.scalar_one_or_none.return_value = existing_cred

        with pytest.raises(WebAuthnRegistrationError, match="已經註冊過"):
            webauthn_service.verify_registration_response(
                user=mock_user,
                credential_id="existing_cred_id",
                client_data_json="client_data",
                attestation_object="attestation",
                expected_challenge=b"x" * 32
            )

        # Should not create new credential
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_called()

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_verification_failure_raises_error(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should raise error if verification fails"""
        mock_verify.side_effect = Exception("Signature verification failed")
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        with pytest.raises(WebAuthnRegistrationError, match="驗證失敗"):
            webauthn_service.verify_registration_response(
                user=mock_user,
                credential_id="test_cred",
                client_data_json="client_data",
                attestation_object="attestation",
                expected_challenge=b"x" * 32
            )

        # Should rollback transaction
        mock_db.rollback.assert_called_once()

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_credential_stored_with_correct_data(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should store credential with correct WebAuthn data"""
        # Mock verification result
        mock_verification = Mock()
        mock_verification.credential_public_key = b"\xab\xcd\xef"
        mock_verification.sign_count = 5
        mock_verification.credential_device_type = ["usb", "nfc"]
        mock_verification.aaguid = uuid4()
        mock_verification.credential_backed_up = True
        mock_verify.return_value = mock_verification

        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        credential = webauthn_service.verify_registration_response(
            user=mock_user,
            credential_id="test_credential_id",
            client_data_json="client_data",
            attestation_object="attestation",
            device_name="YubiKey 5",
            expected_challenge=b"x" * 32
        )

        # Verify credential data
        assert credential.user_id == mock_user.id
        assert credential.credential_id == "test_credential_id"
        assert credential.device_name == "YubiKey 5"
        assert credential.counter == 5
        assert credential.transports == ["usb", "nfc"]
        assert credential.backup_eligible is True


class TestCredentialLimitCheck:
    """Test 10 credentials per user limit"""

    @patch('app.services.webauthn_service.generate_registration_options')
    @patch('app.services.webauthn_service.secrets')
    def test_credential_limit_not_enforced_in_options(
        self,
        mock_secrets,
        mock_generate,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Registration options generation does not enforce limit"""
        # Mock 10 existing credentials (credential_id must be hex)
        existing_creds = [Mock(spec=Credential) for _ in range(10)]
        for i, cred in enumerate(existing_creds):
            cred.credential_id = f"{'%02x' % i}" * 32  # Hex string
            cred.transports = ["internal"]

        mock_db.execute.return_value.scalars.return_value.all.return_value = existing_creds
        mock_generate.return_value = Mock()
        mock_secrets.token_bytes.return_value = b'x' * 64

        # Should still generate options (limit enforced at API level)
        options = webauthn_service.generate_registration_options(mock_user)

        assert options is not None


class TestDefaultDeviceName:
    """Test default device name handling"""

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_default_device_name_when_not_provided(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should use default device name if not provided"""
        mock_verification = Mock()
        mock_verification.credential_public_key = b"public_key"
        mock_verification.sign_count = 0
        mock_verification.credential_device_type = []
        mock_verification.aaguid = uuid4()
        mock_verification.credential_backed_up = False
        mock_verify.return_value = mock_verification

        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        credential = webauthn_service.verify_registration_response(
            user=mock_user,
            credential_id="test_cred",
            client_data_json="client_data",
            attestation_object="attestation",
            device_name=None,  # No device name provided
            expected_challenge=b"x" * 32
        )

        assert credential.device_name == "未命名裝置"


class TestChallengeVerification:
    """Test challenge verification during registration"""

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_challenge_passed_to_verification(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should pass expected_challenge to py_webauthn verification"""
        mock_verification = Mock()
        mock_verification.credential_public_key = b"pk"
        mock_verification.sign_count = 0
        mock_verification.credential_device_type = []
        mock_verification.aaguid = uuid4()
        mock_verification.credential_backed_up = False
        mock_verify.return_value = mock_verification

        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        expected_challenge = b"specific_challenge_bytes"

        webauthn_service.verify_registration_response(
            user=mock_user,
            credential_id="test",
            client_data_json="data",
            attestation_object="attestation",
            expected_challenge=expected_challenge
        )

        # Verify challenge was passed
        call_kwargs = mock_verify.call_args.kwargs
        assert call_kwargs['expected_challenge'] == expected_challenge


class TestOriginAndRPIDVerification:
    """Test origin and RP ID verification"""

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_origin_and_rpid_passed_to_verification(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should verify origin and RP ID from config"""
        mock_verification = Mock()
        mock_verification.credential_public_key = b"pk"
        mock_verification.sign_count = 0
        mock_verification.credential_device_type = []
        mock_verification.aaguid = uuid4()
        mock_verification.credential_backed_up = False
        mock_verify.return_value = mock_verification

        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        webauthn_service.verify_registration_response(
            user=mock_user,
            credential_id="test",
            client_data_json="data",
            attestation_object="attestation",
            expected_challenge=b"x" * 32
        )

        # Verify origin and RP ID
        call_kwargs = mock_verify.call_args.kwargs
        assert call_kwargs['expected_origin'] == "http://localhost:3000"
        assert call_kwargs['expected_rp_id'] == "localhost"


class TestFalloutThemedErrors:
    """Test Fallout-themed error messages"""

    @patch('app.services.webauthn_service.verify_registration_response')
    def test_duplicate_credential_error_message(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Error message should use Fallout terminology"""
        existing_cred = Mock(spec=Credential)
        mock_db.execute.return_value.scalar_one_or_none.return_value = existing_cred

        with pytest.raises(WebAuthnRegistrationError) as exc_info:
            webauthn_service.verify_registration_response(
                user=mock_user,
                credential_id="existing",
                client_data_json="data",
                attestation_object="attestation",
                expected_challenge=b"x" * 32
            )

        # Error message should be in Chinese and mention Passkey
        error_msg = str(exc_info.value)
        assert "Passkey" in error_msg or "passkey" in error_msg.lower()

    def test_webauthn_disabled_error_message(
        self,
        webauthn_service,
        mock_user
    ):
        """Disabled feature error should use Fallout terminology"""
        webauthn_service.config.enabled = False

        with pytest.raises(HTTPException) as exc_info:
            webauthn_service.generate_registration_options(mock_user)

        detail = exc_info.value.detail
        assert "Passkey" in detail or "OAuth" in detail or "Email" in detail
