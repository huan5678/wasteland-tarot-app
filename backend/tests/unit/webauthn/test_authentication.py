"""
WebAuthn Authentication Tests

Tests for Passkey authentication flow including:
- Authentication options generation (email-guided & usernameless)
- Authentication response verification
- Counter validation and replay attack prevention
- Challenge verification
- Error handling and security
"""

import pytest
from unittest.mock import Mock, MagicMock, patch, ANY
from uuid import uuid4

from fastapi import HTTPException

from app.services.webauthn_service import WebAuthnService
from app.models.user import User
from app.models.credential import Credential
from app.core.exceptions import (
    WebAuthnAuthenticationError,
    CredentialNotFoundError,
    CounterError,
)


@pytest.fixture
def mock_db():
    """Mock database session"""
    db = Mock()
    db.commit = Mock()
    db.rollback = Mock()
    db.execute = Mock()
    return db


@pytest.fixture
def mock_user():
    """Mock user object"""
    user = Mock(spec=User)
    user.id = uuid4()
    user.email = "test@example.com"
    user.name = "Test User"
    return user


@pytest.fixture
def mock_credential(mock_user):
    """Mock credential object"""
    cred = Mock(spec=Credential)
    cred.id = uuid4()
    cred.user_id = mock_user.id
    cred.credential_id = "abcdef123456" * 4  # Hex string
    cred.public_key = "abcdef123456" * 8  # Hex string
    cred.counter = 100
    cred.transports = ["internal"]
    cred.device_name = "MacBook Touch ID"
    cred.update_last_used = Mock()
    cred.increment_counter = Mock(return_value=True)
    return cred


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
    # Setup default mock chain
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    with patch('app.services.webauthn_service.get_webauthn_config', return_value=mock_webauthn_config):
        service = WebAuthnService(db=mock_db)

        # Mock helper methods
        service._get_user_verification = Mock(return_value="preferred")

        return service


class TestAuthenticationOptionsGeneration:
    """Test authentication options generation"""

    @patch('app.services.webauthn_service.generate_authentication_options')
    def test_email_guided_login_success(
        self,
        mock_generate,
        webauthn_service,
        mock_user,
        mock_credential,
        mock_db
    ):
        """Should generate authentication options for email-guided login"""
        # Mock user has credentials
        mock_db.execute.return_value.scalars.return_value.all.return_value = [mock_credential]

        mock_options = Mock()
        mock_generate.return_value = mock_options

        # Email-guided login
        options = webauthn_service.generate_authentication_options(user=mock_user)

        assert options == mock_options

        # Should include allow_credentials
        call_kwargs = mock_generate.call_args.kwargs
        assert 'allow_credentials' in call_kwargs
        assert len(call_kwargs['allow_credentials']) == 1

    @patch('app.services.webauthn_service.generate_authentication_options')
    def test_usernameless_login_success(
        self,
        mock_generate,
        webauthn_service
    ):
        """Should generate authentication options for usernameless login"""
        mock_options = Mock()
        mock_generate.return_value = mock_options

        # Usernameless login (no user provided)
        options = webauthn_service.generate_authentication_options(user=None)

        assert options == mock_options

        # Should NOT include allow_credentials (or set to None)
        call_kwargs = mock_generate.call_args.kwargs
        allow_creds = call_kwargs.get('allow_credentials')
        assert allow_creds is None or allow_creds == []

    def test_email_guided_login_no_credentials_raises_error(
        self,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should raise error if user has no registered credentials"""
        # Mock user has NO credentials
        mock_db.execute.return_value.scalars.return_value.all.return_value = []

        with pytest.raises(CredentialNotFoundError, match="尚未註冊任何 Passkey"):
            webauthn_service.generate_authentication_options(user=mock_user)

    def test_webauthn_disabled_raises_error(
        self,
        webauthn_service,
        mock_user
    ):
        """Should raise 501 Not Implemented if WebAuthn is disabled"""
        webauthn_service.config.enabled = False

        with pytest.raises(HTTPException) as exc_info:
            webauthn_service.generate_authentication_options(user=mock_user)

        assert exc_info.value.status_code == 501
        assert "未啟用" in exc_info.value.detail

    @patch('app.services.webauthn_service.generate_authentication_options')
    def test_authentication_options_exception_handling(
        self,
        mock_generate,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should handle exceptions during options generation"""
        mock_db.execute.return_value.scalars.return_value.all.return_value = []
        mock_generate.side_effect = Exception("WebAuthn library error")

        with pytest.raises(WebAuthnAuthenticationError, match="無法生成 Passkey 認證選項"):
            webauthn_service.generate_authentication_options(user=None)

    @patch('app.services.webauthn_service.generate_authentication_options')
    def test_credential_transports_passed_correctly(
        self,
        mock_generate,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Should pass credential transports to allow_credentials"""
        # Mock credential with multiple transports
        cred = Mock(spec=Credential)
        cred.credential_id = "abcdef123456" * 4
        cred.transports = ["usb", "nfc", "ble"]

        mock_db.execute.return_value.scalars.return_value.all.return_value = [cred]
        mock_generate.return_value = Mock()

        webauthn_service.generate_authentication_options(user=mock_user)

        # Verify transports were passed
        call_kwargs = mock_generate.call_args.kwargs
        descriptor = call_kwargs['allow_credentials'][0]
        assert descriptor.transports == ["usb", "nfc", "ble"]


class TestAuthenticationResponseVerification:
    """Test authentication response verification"""

    @patch('app.services.webauthn_service.verify_authentication_response')
    def test_verify_authentication_success(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_credential,
        mock_db
    ):
        """Should successfully verify authentication response"""
        # Mock verification result
        mock_verification = Mock()
        mock_verification.new_sign_count = 150
        mock_verify.return_value = mock_verification

        # Mock credential lookup
        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_credential

        # Mock user lookup
        mock_db.execute.return_value.scalar_one.return_value = mock_user

        # Verify authentication
        user, credential = webauthn_service.verify_authentication_response(
            credential_id="abcdef123456" * 4,
            client_data_json="client_data",
            authenticator_data="auth_data",
            signature="signature",
            expected_challenge=b"x" * 32
        )

        assert user == mock_user
        assert credential == mock_credential

        # Counter should be incremented
        mock_credential.increment_counter.assert_called_once_with(150)

        # Last used should be updated
        mock_credential.update_last_used.assert_called_once()

        # Database should commit
        mock_db.commit.assert_called_once()

    def test_verify_authentication_credential_not_found(
        self,
        webauthn_service,
        mock_db
    ):
        """Should raise error if credential not found"""
        # Mock credential not found
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        with pytest.raises(CredentialNotFoundError, match="找不到對應的 Passkey"):
            webauthn_service.verify_authentication_response(
                credential_id="nonexistent_cred",
                client_data_json="client_data",
                authenticator_data="auth_data",
                signature="signature",
                expected_challenge=b"x" * 32
            )

    @patch('app.services.webauthn_service.verify_authentication_response')
    def test_counter_regression_raises_error(
        self,
        mock_verify,
        webauthn_service,
        mock_credential,
        mock_db
    ):
        """Should raise CounterError on counter regression (replay attack)"""
        # Mock verification with LOWER counter (regression)
        mock_verification = Mock()
        mock_verification.new_sign_count = 50  # Lower than current (100)
        mock_verify.return_value = mock_verification

        # Mock credential lookup
        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_credential

        # Mock increment_counter to raise ValueError
        mock_credential.increment_counter.side_effect = ValueError("Counter regression!")

        with pytest.raises(CounterError):
            webauthn_service.verify_authentication_response(
                credential_id="abcdef123456" * 4,
                client_data_json="client_data",
                authenticator_data="auth_data",
                signature="signature",
                expected_challenge=b"x" * 32
            )

        # CounterError is re-raised directly, no rollback
        # (See: except (CredentialNotFoundError, CounterError): raise)
        mock_db.rollback.assert_not_called()

    @patch('app.services.webauthn_service.verify_authentication_response')
    def test_verification_failure_raises_error(
        self,
        mock_verify,
        webauthn_service,
        mock_credential,
        mock_db
    ):
        """Should raise error if signature verification fails"""
        mock_verify.side_effect = Exception("Invalid signature")

        # Mock credential lookup
        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_credential

        with pytest.raises(WebAuthnAuthenticationError, match="認證驗證失敗"):
            webauthn_service.verify_authentication_response(
                credential_id="abcdef123456" * 4,
                client_data_json="client_data",
                authenticator_data="auth_data",
                signature="bad_signature",
                expected_challenge=b"x" * 32
            )

        # Should rollback transaction
        mock_db.rollback.assert_called_once()

    @patch('app.services.webauthn_service.verify_authentication_response')
    def test_last_used_timestamp_updated(
        self,
        mock_verify,
        webauthn_service,
        mock_user,
        mock_credential,
        mock_db
    ):
        """Should update credential's last_used_at timestamp"""
        mock_verification = Mock()
        mock_verification.new_sign_count = 105
        mock_verify.return_value = mock_verification

        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_credential
        mock_db.execute.return_value.scalar_one.return_value = mock_user

        webauthn_service.verify_authentication_response(
            credential_id="abcdef123456" * 4,
            client_data_json="client_data",
            authenticator_data="auth_data",
            signature="signature",
            expected_challenge=b"x" * 32
        )

        # Verify last_used was updated
        mock_credential.update_last_used.assert_called_once()


class TestChallengeAndOriginVerification:
    """Test challenge and origin verification"""

    @patch('app.services.webauthn_service.verify_authentication_response')
    def test_challenge_passed_to_verification(
        self,
        mock_verify,
        webauthn_service,
        mock_credential,
        mock_user,
        mock_db
    ):
        """Should pass expected_challenge to py_webauthn verification"""
        mock_verification = Mock()
        mock_verification.new_sign_count = 105
        mock_verify.return_value = mock_verification

        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_credential
        mock_db.execute.return_value.scalar_one.return_value = mock_user

        expected_challenge = b"specific_challenge_bytes"

        webauthn_service.verify_authentication_response(
            credential_id="abcdef123456" * 4,
            client_data_json="data",
            authenticator_data="auth_data",
            signature="sig",
            expected_challenge=expected_challenge
        )

        # Verify challenge was passed
        call_kwargs = mock_verify.call_args.kwargs
        assert call_kwargs['expected_challenge'] == expected_challenge

    @patch('app.services.webauthn_service.verify_authentication_response')
    def test_origin_and_rpid_verification(
        self,
        mock_verify,
        webauthn_service,
        mock_credential,
        mock_user,
        mock_db
    ):
        """Should verify origin and RP ID from config"""
        mock_verification = Mock()
        mock_verification.new_sign_count = 105
        mock_verify.return_value = mock_verification

        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_credential
        mock_db.execute.return_value.scalar_one.return_value = mock_user

        webauthn_service.verify_authentication_response(
            credential_id="abcdef123456" * 4,
            client_data_json="data",
            authenticator_data="auth_data",
            signature="sig",
            expected_challenge=b"x" * 32
        )

        # Verify origin and RP ID
        call_kwargs = mock_verify.call_args.kwargs
        assert call_kwargs['expected_origin'] == "http://localhost:3000"
        assert call_kwargs['expected_rp_id'] == "localhost"


class TestSecurityAndEdgeCases:
    """Test security features and edge cases"""

    @patch('app.services.webauthn_service.verify_authentication_response')
    def test_public_key_passed_as_bytes(
        self,
        mock_verify,
        webauthn_service,
        mock_credential,
        mock_user,
        mock_db
    ):
        """Should convert hex public key to bytes for verification"""
        mock_verification = Mock()
        mock_verification.new_sign_count = 105
        mock_verify.return_value = mock_verification

        mock_credential.public_key = "abcdef123456" * 8  # Hex string

        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_credential
        mock_db.execute.return_value.scalar_one.return_value = mock_user

        webauthn_service.verify_authentication_response(
            credential_id="abcdef123456" * 4,
            client_data_json="data",
            authenticator_data="auth_data",
            signature="sig",
            expected_challenge=b"x" * 32
        )

        # Verify public key was converted to bytes
        call_kwargs = mock_verify.call_args.kwargs
        assert isinstance(call_kwargs['credential_public_key'], bytes)

    @patch('app.services.webauthn_service.verify_authentication_response')
    def test_counter_value_passed_correctly(
        self,
        mock_verify,
        webauthn_service,
        mock_credential,
        mock_user,
        mock_db
    ):
        """Should pass current counter value to verification"""
        mock_verification = Mock()
        mock_verification.new_sign_count = 205
        mock_verify.return_value = mock_verification

        mock_credential.counter = 200  # Current counter

        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_credential
        mock_db.execute.return_value.scalar_one.return_value = mock_user

        webauthn_service.verify_authentication_response(
            credential_id="abcdef123456" * 4,
            client_data_json="data",
            authenticator_data="auth_data",
            signature="sig",
            expected_challenge=b"x" * 32
        )

        # Verify counter was passed
        call_kwargs = mock_verify.call_args.kwargs
        assert call_kwargs['credential_current_sign_count'] == 200


class TestFalloutThemedErrors:
    """Test Fallout-themed error messages"""

    def test_credential_not_found_error_message(
        self,
        webauthn_service,
        mock_db
    ):
        """Error message should use Fallout terminology"""
        mock_db.execute.return_value.scalar_one_or_none.return_value = None

        with pytest.raises(CredentialNotFoundError) as exc_info:
            webauthn_service.verify_authentication_response(
                credential_id="nonexistent",
                client_data_json="data",
                authenticator_data="auth_data",
                signature="sig",
                expected_challenge=b"x" * 32
            )

        # Error message should mention Passkey
        error_msg = str(exc_info.value)
        assert "Passkey" in error_msg

    def test_no_credentials_error_message(
        self,
        webauthn_service,
        mock_user,
        mock_db
    ):
        """Error when user has no credentials should use Fallout theme"""
        mock_db.execute.return_value.scalars.return_value.all.return_value = []

        with pytest.raises(CredentialNotFoundError) as exc_info:
            webauthn_service.generate_authentication_options(user=mock_user)

        error_msg = str(exc_info.value)
        assert "Passkey" in error_msg or "passkey" in error_msg.lower()
