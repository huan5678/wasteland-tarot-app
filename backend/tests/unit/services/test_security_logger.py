"""
Tests for SecurityEventLogger Service (TDD - Red → Green Phase)

Tests security event logging functionality including:
- Event recording (registration, login, deletion, etc.)
- Log format and content validation
- Log level classification
- Sensitive information filtering
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any
import pytest
from unittest.mock import Mock, patch, MagicMock, call

from app.services.security_logger import (
    SecurityEventLogger,
    SecurityEventType,
    SecurityLogLevel,
    get_security_logger,
)


class TestSecurityEventLogger:
    """Tests for SecurityEventLogger service"""

    @pytest.fixture
    def mock_logger(self):
        """Mock logger instance"""
        return MagicMock()

    @pytest.fixture
    def logger(self, mock_logger):
        """Create a SecurityEventLogger instance with mocked logger"""
        with patch('app.services.security_logger.get_logger', return_value=mock_logger):
            instance = SecurityEventLogger()
            yield instance

    # ===== Test 1: Event Recording =====

    def test_log_passkey_registration_event(self, logger, mock_logger):
        """Test logging passkey registration event"""
        # Act
        logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_id="user-123",
            user_email="user@example.com",
            success=True,
            credential_id="cred-abc123",
            metadata={"is_first_passkey": True, "karma_awarded": 50}
        )

        # Assert
        mock_logger.log.assert_called_once()
        call_args = mock_logger.log.call_args

        # Verify log level is INFO
        assert call_args.args[0] == logging.INFO

        # Verify structured log format
        log_data = call_args.kwargs["extra"]["extra_data"]
        assert log_data["event_type"] == "passkey_registration"
        assert log_data["user_id"] == "user-123"
        assert log_data["user_email"] == "user@example.com"
        assert log_data["success"] is True
        assert "timestamp" in log_data

    def test_log_passkey_login_event(self, logger, mock_logger):
        """Test logging passkey login event"""
        # Act
        logger.log_event(
            event_type=SecurityEventType.PASSKEY_LOGIN,
            user_id="user-456",
            user_email="user2@example.com",
            success=True
        )

        # Assert
        mock_logger.log.assert_called_once()
        log_data = mock_logger.log.call_args.kwargs["extra"]["extra_data"]
        assert log_data["event_type"] == "passkey_login"

    def test_log_credential_added_event(self, logger, mock_logger):
        """Test logging credential added event"""
        logger.log_event(
            event_type=SecurityEventType.CREDENTIAL_ADDED,
            user_id="user-789",
            success=True
        )
        mock_logger.log.assert_called_once()

    def test_log_credential_deleted_event(self, logger, mock_logger):
        """Test logging credential deleted event"""
        logger.log_event(
            event_type=SecurityEventType.CREDENTIAL_DELETED,
            user_id="user-789",
            success=True
        )
        mock_logger.log.assert_called_once()

    def test_log_counter_error_event(self, logger, mock_logger):
        """Test logging counter error event (security alert)"""
        # Act
        logger.log_event(
            event_type=SecurityEventType.COUNTER_ERROR,
            user_id="user-suspect",
            success=False,
            error="Counter regression detected"
        )

        # Assert - Counter error should use CRITICAL level
        mock_logger.log.assert_called_once()
        call_args = mock_logger.log.call_args
        assert call_args.args[0] == logging.CRITICAL

    def test_log_authentication_failed_event(self, logger, mock_logger):
        """Test logging authentication failed event"""
        # Act
        logger.log_event(
            event_type=SecurityEventType.AUTHENTICATION_FAILED,
            user_email="attacker@example.com",
            success=False,
            error="Invalid signature"
        )

        # Assert - Failed auth should use WARNING level
        mock_logger.log.assert_called_once()
        call_args = mock_logger.log.call_args
        assert call_args.args[0] == logging.WARNING

    # ===== Test 2: Log Format and Content =====

    def test_log_format_includes_all_required_fields(self, logger, mock_logger):
        """Test log format includes all required fields"""
        # Act
        logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_id="user-123",
            user_email="user@example.com",
            success=True,
            ip_address="192.168.1.100",
            user_agent="Chrome/120.0.0.0"
        )

        # Assert
        log_data = mock_logger.log.call_args.kwargs["extra"]["extra_data"]

        # Required fields
        assert "timestamp" in log_data
        assert "event_type" in log_data
        assert "user_id" in log_data
        assert "user_email" in log_data
        assert "ip_address" in log_data
        assert "user_agent" in log_data
        assert "success" in log_data

        # Validate timestamp format (ISO 8601)
        datetime.fromisoformat(log_data["timestamp"].replace("Z", "+00:00"))

    def test_log_format_is_json_serializable(self, logger, mock_logger):
        """Test log data can be serialized to JSON"""
        # Act
        logger.log_event(
            event_type=SecurityEventType.PASSKEY_LOGIN,
            user_id="user-123",
            success=True,
            metadata={"test": "data"}
        )

        # Assert
        log_data = mock_logger.log.call_args.kwargs["extra"]["extra_data"]

        # Should be JSON serializable
        json_str = json.dumps(log_data)
        assert json_str is not None

        # Should be deserializable
        deserialized = json.loads(json_str)
        assert deserialized["event_type"] == "passkey_login"

    # ===== Test 3: Log Level Classification =====

    def test_successful_events_use_info_level(self, logger, mock_logger):
        """Test successful events use INFO log level"""
        logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_id="user-123",
            success=True
        )

        call_args = mock_logger.log.call_args
        assert call_args.args[0] == logging.INFO

    def test_failed_authentication_uses_warning_level(self, logger, mock_logger):
        """Test failed authentication uses WARNING log level"""
        logger.log_event(
            event_type=SecurityEventType.AUTHENTICATION_FAILED,
            success=False
        )

        call_args = mock_logger.log.call_args
        assert call_args.args[0] == logging.WARNING

    def test_counter_error_uses_critical_level(self, logger, mock_logger):
        """Test counter error uses CRITICAL log level"""
        logger.log_event(
            event_type=SecurityEventType.COUNTER_ERROR,
            success=False
        )

        call_args = mock_logger.log.call_args
        assert call_args.args[0] == logging.CRITICAL

    def test_challenge_expired_uses_warning_level(self, logger, mock_logger):
        """Test challenge expired uses WARNING log level"""
        logger.log_event(
            event_type=SecurityEventType.CHALLENGE_EXPIRED,
            success=False
        )

        call_args = mock_logger.log.call_args
        assert call_args.args[0] == logging.WARNING

    # ===== Test 4: Sensitive Information Filtering =====

    def test_credential_id_is_truncated(self, logger, mock_logger):
        """Test credential_id is truncated to prevent exposure"""
        # Act
        full_credential_id = "very-long-credential-id-abc123def456ghi789"
        logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_id="user-123",
            success=True,
            credential_id=full_credential_id
        )

        # Assert
        log_data = mock_logger.log.call_args.kwargs["extra"]["extra_data"]

        # Credential ID should be truncated (first 16 chars)
        assert len(log_data["credential_id"]) == 16
        assert log_data["credential_id"] == full_credential_id[:16]

    def test_sensitive_metadata_is_filtered(self, logger, mock_logger):
        """Test sensitive information in metadata is filtered"""
        # Act
        logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_id="user-123",
            success=True,
            metadata={
                "private_key": "SHOULD-BE-FILTERED",
                "password": "SHOULD-BE-FILTERED",
                "authenticator_type": "platform"  # OK to log
            }
        )

        # Assert
        log_data = mock_logger.log.call_args.kwargs["extra"]["extra_data"]

        # Sensitive fields should be filtered
        assert "private_key" not in log_data["metadata"]
        assert "password" not in log_data["metadata"]

        # Non-sensitive fields should remain
        assert log_data["metadata"]["authenticator_type"] == "platform"

    def test_email_partial_masking_for_privacy(self, logger, mock_logger):
        """Test email can be partially masked for privacy"""
        # Act
        logger.log_event(
            event_type=SecurityEventType.AUTHENTICATION_FAILED,
            user_email="testuser@example.com",
            success=False,
            mask_email=True
        )

        # Assert
        log_data = mock_logger.log.call_args.kwargs["extra"]["extra_data"]

        # Email should be partially masked (e.g., "t***r@example.com")
        masked_email = log_data["user_email"]
        assert "***" in masked_email
        assert "@example.com" in masked_email

    # ===== Test 5: Error Handling =====

    def test_log_event_with_exception_info(self, logger, mock_logger):
        """Test logging event with exception information"""
        # Arrange
        test_exception = ValueError("Invalid credential format")

        # Act
        logger.log_event(
            event_type=SecurityEventType.AUTHENTICATION_FAILED,
            success=False,
            error=str(test_exception),
            exception=test_exception
        )

        # Assert
        log_data = mock_logger.log.call_args.kwargs["extra"]["extra_data"]
        assert log_data["error"] == "Invalid credential format"

        # Exception info should be passed to logger
        assert mock_logger.log.call_args.kwargs["exc_info"] == test_exception

    def test_log_event_handles_none_values_gracefully(self, logger, mock_logger):
        """Test log event handles None values gracefully"""
        # Act - Should not raise exception
        logger.log_event(
            event_type=SecurityEventType.PASSKEY_LOGIN,
            user_id="user-123",
            user_email=None,
            success=True,
            credential_id=None,
            ip_address=None,
            user_agent=None
        )

        # Assert
        mock_logger.log.assert_called_once()

    # ===== Test 6: Integration Tests =====

    def test_uses_structured_logging_format(self, logger, mock_logger):
        """Test security logger uses existing StructuredFormatter"""
        logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_id="user-123",
            success=True
        )

        # Should use extra_data for structured logging
        call_args = mock_logger.log.call_args
        assert "extra" in call_args.kwargs
        assert "extra_data" in call_args.kwargs["extra"]

    def test_singleton_pattern(self):
        """Test get_security_logger returns singleton instance"""
        logger1 = get_security_logger()
        logger2 = get_security_logger()
        assert logger1 is logger2


# ===== Enum Tests =====

class TestSecurityEventType:
    """Tests for SecurityEventType enum"""

    def test_all_event_types_defined(self):
        """Test all required event types are defined"""
        required_types = [
            "PASSKEY_REGISTRATION",
            "PASSKEY_LOGIN",
            "CREDENTIAL_ADDED",
            "CREDENTIAL_UPDATED",
            "CREDENTIAL_DELETED",
            "COUNTER_ERROR",
            "AUTHENTICATION_FAILED",
            "CHALLENGE_EXPIRED"
        ]

        for event_type in required_types:
            assert hasattr(SecurityEventType, event_type)

    def test_enum_values_are_lowercase(self):
        """Test enum values use lowercase with underscores"""
        assert SecurityEventType.PASSKEY_REGISTRATION.value == "passkey_registration"
        assert SecurityEventType.COUNTER_ERROR.value == "counter_error"
