"""
Security Event Logger Service

Logs security-related events for WebAuthn/Passkey operations with structured format.
Integrates with existing logging infrastructure (app/core/logging_config.py).

Security Events:
- passkey_registration: Passkey 註冊
- passkey_login: Passkey 登入
- credential_added: 新增 Credential
- credential_updated: 更新 Credential
- credential_deleted: 刪除 Credential
- counter_error: Counter 回歸錯誤（安全警報）
- authentication_failed: 驗證失敗
- challenge_expired: Challenge 過期

Log Format (JSON):
{
  "timestamp": "2025-10-27T12:00:00Z",
  "event_type": "passkey_registration",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "ip_address": "192.168.1.1",
  "user_agent": "Chrome/120.0.0.0",
  "success": true,
  "credential_id": "credential-id-hash",
  "metadata": {...}
}
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any

from app.core.logging_config import get_logger


class SecurityEventType(Enum):
    """Security event types for WebAuthn operations"""
    PASSKEY_REGISTRATION = "passkey_registration"
    PASSKEY_LOGIN = "passkey_login"
    CREDENTIAL_ADDED = "credential_added"
    CREDENTIAL_UPDATED = "credential_updated"
    CREDENTIAL_DELETED = "credential_deleted"
    COUNTER_ERROR = "counter_error"
    AUTHENTICATION_FAILED = "authentication_failed"
    CHALLENGE_EXPIRED = "challenge_expired"


class SecurityLogLevel(Enum):
    """Log level classification for security events"""
    INFO = "info"           # Successful operations
    WARNING = "warning"     # Failed authentication, expired challenges
    ERROR = "error"         # General errors
    CRITICAL = "critical"   # Security alerts (counter errors, suspicious activity)


class SecurityEventLogger:
    """
    Security Event Logger Service

    Logs structured security events for WebAuthn operations.
    Uses existing logging infrastructure with structured format.
    """

    # Sensitive field names to filter from logs
    SENSITIVE_FIELDS = {
        "private_key", "password", "api_key", "token", "secret",
        "credential_private_key", "challenge_response"
    }

    # Event type to log level mapping
    EVENT_LOG_LEVELS = {
        SecurityEventType.PASSKEY_REGISTRATION: logging.INFO,
        SecurityEventType.PASSKEY_LOGIN: logging.INFO,
        SecurityEventType.CREDENTIAL_ADDED: logging.INFO,
        SecurityEventType.CREDENTIAL_UPDATED: logging.INFO,
        SecurityEventType.CREDENTIAL_DELETED: logging.INFO,
        SecurityEventType.COUNTER_ERROR: logging.CRITICAL,  # Security alert
        SecurityEventType.AUTHENTICATION_FAILED: logging.WARNING,
        SecurityEventType.CHALLENGE_EXPIRED: logging.WARNING,
    }

    def __init__(self):
        """Initialize SecurityEventLogger"""
        self.logger = get_logger("security.webauthn")

    def log_event(
        self,
        event_type: SecurityEventType,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        success: bool = True,
        credential_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        error: Optional[str] = None,
        exception: Optional[Exception] = None,
        metadata: Optional[Dict[str, Any]] = None,
        mask_email: bool = False
    ) -> None:
        """
        Log a security event

        Args:
            event_type: Type of security event
            user_id: User ID (UUID)
            user_email: User email
            success: Whether the operation was successful
            credential_id: Credential ID (will be truncated)
            ip_address: IP address of the request
            user_agent: User agent string
            error: Error message if failed
            exception: Exception object if available
            metadata: Additional metadata (will be filtered for sensitive info)
            mask_email: Whether to partially mask email for privacy
        """
        # Build structured log data
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": event_type.value,
            "success": success
        }

        # Add user information
        if user_id:
            log_data["user_id"] = user_id

        if user_email:
            log_data["user_email"] = self._mask_email(user_email) if mask_email else user_email

        # Add credential information (truncated for security)
        if credential_id:
            log_data["credential_id"] = self._truncate_credential_id(credential_id)

        # Add request context
        if ip_address:
            log_data["ip_address"] = ip_address

        if user_agent:
            log_data["user_agent"] = user_agent

        # Add error information
        if error:
            log_data["error"] = error

        # Add filtered metadata
        if metadata:
            log_data["metadata"] = self._filter_sensitive_data(metadata)

        # Determine log level
        log_level = self.EVENT_LOG_LEVELS.get(event_type, logging.INFO)

        # Build log message
        message = self._build_log_message(event_type, success, user_email or user_id)

        # Log the event using structured logging
        self.logger.log(
            log_level,
            message,
            extra={"extra_data": log_data},
            exc_info=exception
        )

    def _build_log_message(
        self,
        event_type: SecurityEventType,
        success: bool,
        identifier: Optional[str]
    ) -> str:
        """Build human-readable log message"""
        status = "succeeded" if success else "failed"
        event_name = event_type.value.replace("_", " ").title()

        if identifier:
            return f"Security Event: {event_name} {status} for {identifier}"
        else:
            return f"Security Event: {event_name} {status}"

    def _truncate_credential_id(self, credential_id: str, max_length: int = 16) -> str:
        """
        Truncate credential ID to prevent full exposure in logs

        Args:
            credential_id: Full credential ID
            max_length: Maximum length to keep (default: 16)

        Returns:
            Truncated credential ID
        """
        if len(credential_id) <= max_length:
            return credential_id
        return credential_id[:max_length]

    def _filter_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter sensitive information from metadata

        Args:
            data: Dictionary that may contain sensitive information

        Returns:
            Filtered dictionary with sensitive fields removed
        """
        filtered = {}
        for key, value in data.items():
            # Skip sensitive fields
            if key.lower() in self.SENSITIVE_FIELDS:
                continue

            # Recursively filter nested dictionaries
            if isinstance(value, dict):
                filtered[key] = self._filter_sensitive_data(value)
            else:
                filtered[key] = value

        return filtered

    def _mask_email(self, email: str) -> str:
        """
        Partially mask email for privacy

        Args:
            email: Full email address

        Returns:
            Partially masked email (e.g., "t***r@example.com")
        """
        if "@" not in email:
            return email

        local, domain = email.split("@", 1)

        if len(local) <= 2:
            masked_local = local[0] + "*" * (len(local) - 1)
        else:
            masked_local = local[0] + "***" + local[-1]

        return f"{masked_local}@{domain}"


# Global singleton instance
_security_logger: Optional[SecurityEventLogger] = None


def get_security_logger() -> SecurityEventLogger:
    """
    Get global SecurityEventLogger instance (singleton)

    Returns:
        SecurityEventLogger instance
    """
    global _security_logger
    if _security_logger is None:
        _security_logger = SecurityEventLogger()
    return _security_logger
