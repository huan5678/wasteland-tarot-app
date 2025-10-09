"""
WebAuthn Configuration Module

Manages WebAuthn/FIDO2 Passkey configuration for the Wasteland Tarot application.
This module is completely independent from OAuth and Email authentication.

Reference: docs/passkeys-architecture.md Section 6
"""

import os
from typing import Dict, Any, List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class WebAuthnConfig(BaseSettings):
    """
    WebAuthn/FIDO2 Configuration Settings

    These settings control the Relying Party (RP) configuration for WebAuthn.
    Proper configuration is critical for security and compatibility.

    Environment Variables:
    - WEBAUTHN_RP_ID: Domain name only (no protocol, no port)
    - WEBAUTHN_RP_NAME: Display name for the service
    - WEBAUTHN_ORIGIN: Full origin URL (protocol + domain + port if needed)
    - WEBAUTHN_CHALLENGE_TTL: Challenge expiration time in seconds
    - WEBAUTHN_ENABLED: Feature flag to enable/disable Passkeys
    """

    # Feature flag
    enabled: bool = Field(
        default=False,
        description="Enable/disable Passkeys feature",
        validation_alias="WEBAUTHN_ENABLED"
    )

    # Relying Party Identification
    rp_id: str = Field(
        default="localhost",
        description="Relying Party ID (domain only, no protocol or port)",
        validation_alias="WEBAUTHN_RP_ID"
    )

    rp_name: str = Field(
        default="Wasteland Tarot",
        description="Relying Party display name",
        validation_alias="WEBAUTHN_RP_NAME"
    )

    # Origin Configuration
    origin: str = Field(
        default="http://localhost:3000",
        description="Full origin URL (must match browser origin exactly)",
        validation_alias="WEBAUTHN_ORIGIN"
    )

    # Challenge Configuration
    challenge_ttl: int = Field(
        default=300,
        ge=60,
        le=600,
        description="Challenge TTL in seconds (60-600)",
        validation_alias="WEBAUTHN_CHALLENGE_TTL"
    )

    # Authenticator Selection Criteria
    authenticator_attachment: str = Field(
        default="platform",
        description="Preferred authenticator type: platform, cross-platform, or null",
        validation_alias="WEBAUTHN_AUTHENTICATOR_ATTACHMENT"
    )

    user_verification: str = Field(
        default="preferred",
        description="User verification requirement: required, preferred, discouraged",
        validation_alias="WEBAUTHN_USER_VERIFICATION"
    )

    resident_key: str = Field(
        default="preferred",
        description="Resident key requirement: required, preferred, discouraged",
        validation_alias="WEBAUTHN_RESIDENT_KEY"
    )

    # Timeout Configuration
    timeout_ms: int = Field(
        default=60000,
        ge=30000,
        le=300000,
        description="WebAuthn operation timeout in milliseconds (30s-5m)",
        validation_alias="WEBAUTHN_TIMEOUT_MS"
    )

    # Attestation Configuration
    attestation: str = Field(
        default="none",
        description="Attestation conveyance: none, indirect, direct, enterprise",
        validation_alias="WEBAUTHN_ATTESTATION"
    )

    # Supported Algorithms (COSE Algorithm Identifiers)
    supported_algorithms: List[int] = Field(
        default=[-7, -257],
        description="Supported public key algorithms (ES256, RS256)",
        validation_alias="WEBAUTHN_SUPPORTED_ALGORITHMS"
    )

    @field_validator("rp_id")
    @classmethod
    def validate_rp_id(cls, v: str) -> str:
        """
        Validate RP_ID format.

        RP_ID must be:
        - Domain name only (no protocol, no port)
        - Not contain '://' or ':'
        - Valid domain format

        Examples:
        - ✅ localhost
        - ✅ wasteland-tarot.com
        - ❌ http://localhost
        - ❌ localhost:3000
        """
        if "://" in v:
            raise ValueError(
                f"RP_ID must not contain protocol. Got: {v}. "
                f"Example: 'localhost' or 'wasteland-tarot.com'"
            )
        if ":" in v and not v.startswith("["):  # Allow IPv6
            raise ValueError(
                f"RP_ID must not contain port. Got: {v}. "
                f"Example: 'localhost' or 'wasteland-tarot.com'"
            )
        return v.lower()  # Normalize to lowercase

    @field_validator("origin")
    @classmethod
    def validate_origin(cls, v: str) -> str:
        """
        Validate Origin format.

        Origin must:
        - Include protocol (http:// or https://)
        - Match exactly what browser sends
        - Include port if non-standard

        Examples:
        - ✅ http://localhost:3000
        - ✅ https://wasteland-tarot.com
        - ❌ localhost:3000
        - ❌ wasteland-tarot.com
        """
        if not v.startswith(("http://", "https://")):
            raise ValueError(
                f"Origin must include protocol (http:// or https://). Got: {v}"
            )
        return v

    @field_validator("authenticator_attachment")
    @classmethod
    def validate_authenticator_attachment(cls, v: str) -> str:
        """Validate authenticator attachment preference."""
        valid_values = ["platform", "cross-platform", "null"]
        if v not in valid_values:
            raise ValueError(
                f"authenticator_attachment must be one of {valid_values}. Got: {v}"
            )
        return v

    @field_validator("user_verification")
    @classmethod
    def validate_user_verification(cls, v: str) -> str:
        """Validate user verification requirement."""
        valid_values = ["required", "preferred", "discouraged"]
        if v not in valid_values:
            raise ValueError(
                f"user_verification must be one of {valid_values}. Got: {v}"
            )
        return v

    @field_validator("resident_key")
    @classmethod
    def validate_resident_key(cls, v: str) -> str:
        """Validate resident key requirement."""
        valid_values = ["required", "preferred", "discouraged"]
        if v not in valid_values:
            raise ValueError(
                f"resident_key must be one of {valid_values}. Got: {v}"
            )
        return v

    @field_validator("attestation")
    @classmethod
    def validate_attestation(cls, v: str) -> str:
        """Validate attestation conveyance."""
        valid_values = ["none", "indirect", "direct", "enterprise"]
        if v not in valid_values:
            raise ValueError(
                f"attestation must be one of {valid_values}. Got: {v}"
            )
        return v

    def get_authenticator_selection(self) -> Dict[str, Any]:
        """
        Get authenticator selection criteria for WebAuthn registration.

        Returns:
            Dictionary compatible with py_webauthn's generate_registration_options
        """
        selection: Dict[str, Any] = {
            "user_verification": self.user_verification,
            "resident_key": self.resident_key,
        }

        if self.authenticator_attachment != "null":
            selection["authenticator_attachment"] = self.authenticator_attachment

        return selection

    def get_supported_pub_key_algs(self) -> List[int]:
        """
        Get supported public key algorithms (COSE identifiers).

        Default algorithms:
        - -7: ES256 (ECDSA with SHA-256)
        - -257: RS256 (RSASSA-PKCS1-v1_5 with SHA-256)

        Returns:
            List of COSE algorithm identifiers
        """
        return self.supported_algorithms

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global configuration instance
webauthn_config = WebAuthnConfig()


def get_webauthn_config() -> WebAuthnConfig:
    """
    Get WebAuthn configuration instance.

    Returns:
        WebAuthnConfig: Configuration instance

    Example:
        ```python
        from app.core.webauthn import get_webauthn_config

        config = get_webauthn_config()
        if config.enabled:
            # Passkeys feature is enabled
            rp_id = config.rp_id
            origin = config.origin
        ```
    """
    return webauthn_config


def is_webauthn_enabled() -> bool:
    """
    Check if WebAuthn/Passkeys feature is enabled.

    Returns:
        bool: True if enabled, False otherwise

    Example:
        ```python
        from app.core.webauthn import is_webauthn_enabled

        if is_webauthn_enabled():
            # Show Passkey option in UI
            pass
        ```
    """
    return webauthn_config.enabled
