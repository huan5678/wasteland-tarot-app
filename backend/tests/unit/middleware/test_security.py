"""
Unit tests for Security Headers middleware.

Tests cover:
- Security headers presence and correctness
- HSTS enforcement (production only)
- CSP policy validation
- Sensitive data redaction
- XSS and clickjacking protection

Reference: tasks.md Stage 16.3
"""

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.middleware.security import (
    SecurityHeadersMiddleware,
    SensitiveDataRedactionMiddleware,
)


@pytest.fixture
def app_dev():
    """Create test app with security middleware (development mode)."""
    app = FastAPI()

    with patch('app.middleware.security.settings') as mock_settings:
        mock_settings.environment = "development"
        app.add_middleware(SecurityHeadersMiddleware, enable_hsts=False)
        app.add_middleware(SensitiveDataRedactionMiddleware)

    @app.get("/test")
    async def test_endpoint(request: Request):
        return {"message": "Test response"}

    @app.get("/test/error")
    async def test_error(request: Request):
        return {"error": "Something went wrong", "password": "secret123"}

    return app


@pytest.fixture
def app_prod():
    """Create test app with security middleware (production mode)."""
    app = FastAPI()

    with patch('app.middleware.security.settings') as mock_settings:
        mock_settings.environment = "production"
        app.add_middleware(SecurityHeadersMiddleware, enable_hsts=True)
        app.add_middleware(SensitiveDataRedactionMiddleware)

    @app.get("/test")
    async def test_endpoint(request: Request):
        return {"message": "Test response"}

    return app


@pytest.fixture
def client_dev(app_dev):
    """Create test client for development environment."""
    return TestClient(app_dev)


@pytest.fixture
def client_prod(app_prod):
    """Create test client for production environment."""
    return TestClient(app_prod)


class TestSecurityHeaders:
    """Test security headers are correctly set."""

    def test_x_content_type_options_header(self, client_dev):
        """X-Content-Type-Options header should be set to nosniff."""
        response = client_dev.get("/test")

        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"

    def test_x_frame_options_header(self, client_dev):
        """X-Frame-Options header should be set to DENY."""
        response = client_dev.get("/test")

        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"

    def test_x_xss_protection_header(self, client_dev):
        """X-XSS-Protection header should be enabled."""
        response = client_dev.get("/test")

        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"

    def test_referrer_policy_header(self, client_dev):
        """Referrer-Policy header should be set."""
        response = client_dev.get("/test")

        assert "Referrer-Policy" in response.headers
        assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"

    def test_content_security_policy_header(self, client_dev):
        """Content-Security-Policy header should be set."""
        response = client_dev.get("/test")

        assert "Content-Security-Policy" in response.headers
        csp = response.headers["Content-Security-Policy"]

        # Check for essential CSP directives
        assert "default-src" in csp
        assert "script-src" in csp
        assert "style-src" in csp

    def test_permissions_policy_header(self, client_dev):
        """Permissions-Policy header should be set."""
        response = client_dev.get("/test")

        assert "Permissions-Policy" in response.headers
        permissions = response.headers["Permissions-Policy"]

        # Check for privacy-protecting policies
        assert "geolocation=()" in permissions
        assert "microphone=()" in permissions
        assert "camera=()" in permissions

    def test_custom_powered_by_header(self, client_dev):
        """Custom X-Powered-By header should be set (Fallout theme)."""
        response = client_dev.get("/test")

        assert "X-Powered-By" in response.headers
        assert "Vault-Tec" in response.headers["X-Powered-By"]


class TestHSTSEnforcement:
    """Test HSTS (HTTP Strict Transport Security) enforcement."""

    def test_hsts_not_enabled_in_development(self, client_dev):
        """HSTS should NOT be enabled in development."""
        response = client_dev.get("/test")

        # HSTS should not be present in development
        assert "Strict-Transport-Security" not in response.headers

    def test_hsts_enabled_in_production(self, client_prod):
        """HSTS should be enabled in production."""
        response = client_prod.get("/test")

        # HSTS should be present in production
        assert "Strict-Transport-Security" in response.headers
        hsts = response.headers["Strict-Transport-Security"]

        # Check HSTS configuration
        assert "max-age=" in hsts
        assert "includeSubDomains" in hsts
        assert "preload" in hsts

    def test_hsts_max_age_sufficient(self, client_prod):
        """HSTS max-age should be at least 1 year (31536000 seconds)."""
        response = client_prod.get("/test")

        hsts = response.headers.get("Strict-Transport-Security", "")

        # Extract max-age value
        if "max-age=" in hsts:
            max_age_str = hsts.split("max-age=")[1].split(";")[0].strip()
            max_age = int(max_age_str)

            # Should be at least 1 year
            assert max_age >= 31536000, (
                f"HSTS max-age {max_age} is too short. "
                f"Should be >= 31536000 (1 year) for production security."
            )


class TestCSPPolicy:
    """Test Content Security Policy configuration."""

    def test_csp_development_is_relaxed(self, client_dev):
        """CSP should be relaxed in development for easier debugging."""
        response = client_dev.get("/test")

        csp = response.headers["Content-Security-Policy"]

        # Development should allow unsafe-inline and unsafe-eval
        assert "'unsafe-inline'" in csp
        assert "'unsafe-eval'" in csp

    def test_csp_production_is_strict(self, client_prod):
        """CSP should be strict in production for security."""
        response = client_prod.get("/test")

        csp = response.headers["Content-Security-Policy"]

        # Production should restrict to 'self'
        assert "default-src 'self'" in csp

        # Should NOT allow unsafe-eval in production
        assert "'unsafe-eval'" not in csp

        # Should disallow frames
        assert "frame-ancestors 'none'" in csp

    def test_csp_prevents_object_embedding(self, client_prod):
        """CSP should prevent embedding objects (Flash, etc.)."""
        response = client_prod.get("/test")

        csp = response.headers["Content-Security-Policy"]

        assert "object-src 'none'" in csp


class TestSensitiveDataRedaction:
    """Test sensitive data redaction."""

    def test_redact_password_field(self):
        """Password fields should be redacted."""
        data = {
            "username": "wasteland_user",
            "password": "super_secret_password",
            "email": "user@wasteland.com"
        }

        redacted = SensitiveDataRedactionMiddleware.redact_dict(data)

        assert redacted["password"] == "[REDACTED]"
        assert redacted["username"] == "wasteland_user"

    def test_redact_api_key_field(self):
        """API key fields should be redacted."""
        data = {
            "api_key": "sk-1234567890abcdef",
            "user_id": "user123"
        }

        redacted = SensitiveDataRedactionMiddleware.redact_dict(data)

        assert redacted["api_key"] == "[REDACTED]"
        assert redacted["user_id"] == "user123"

    def test_redact_token_fields(self):
        """Token fields should be redacted."""
        data = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "rt_1234567890",
            "user_id": "user123"
        }

        redacted = SensitiveDataRedactionMiddleware.redact_dict(data)

        assert redacted["access_token"] == "[REDACTED]"
        assert redacted["refresh_token"] == "[REDACTED]"
        assert redacted["user_id"] == "user123"

    def test_redact_credential_fields(self):
        """Credential fields should be redacted."""
        data = {
            "credential_id": "0x1234567890abcdef",
            "public_key": "-----BEGIN PUBLIC KEY-----...",
            "device_name": "MacBook Touch ID"
        }

        redacted = SensitiveDataRedactionMiddleware.redact_dict(data)

        assert redacted["credential_id"] == "[REDACTED]"
        assert redacted["public_key"] == "[REDACTED]"
        assert redacted["device_name"] == "MacBook Touch ID"

    def test_mask_email_address(self):
        """Email addresses should be partially masked."""
        data = {
            "email": "wasteland.user@example.com",
            "name": "Wasteland User"
        }

        redacted = SensitiveDataRedactionMiddleware.redact_dict(data)

        # Email should be masked: u***@example.com
        assert redacted["email"].startswith("w***@")
        assert "@example.com" in redacted["email"]
        assert redacted["name"] == "Wasteland User"

    def test_redact_nested_dictionaries(self):
        """Redaction should work on nested dictionaries."""
        data = {
            "user": {
                "email": "user@wasteland.com",
                "password": "secret123",
                "profile": {
                    "api_key": "sk-12345"
                }
            }
        }

        redacted = SensitiveDataRedactionMiddleware.redact_dict(data)

        assert redacted["user"]["password"] == "[REDACTED]"
        assert redacted["user"]["profile"]["api_key"] == "[REDACTED]"
        assert "user@wasteland.com" not in str(redacted)  # Email should be masked

    def test_redact_lists_of_dictionaries(self):
        """Redaction should work on lists containing dictionaries."""
        data = {
            "credentials": [
                {"credential_id": "cred1", "device_name": "Device 1"},
                {"credential_id": "cred2", "device_name": "Device 2"},
            ]
        }

        redacted = SensitiveDataRedactionMiddleware.redact_dict(data)

        for cred in redacted["credentials"]:
            assert cred["credential_id"] == "[REDACTED]"
            assert "Device" in cred["device_name"]


class TestSecurityHeadersIntegration:
    """Integration tests for security headers."""

    def test_all_security_headers_present_on_success(self, client_dev):
        """All security headers should be present on successful response."""
        response = client_dev.get("/test")

        required_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Referrer-Policy",
            "Content-Security-Policy",
            "Permissions-Policy",
            "X-Powered-By",
        ]

        for header in required_headers:
            assert header in response.headers, f"Missing security header: {header}"

    def test_security_headers_present_on_error_response(self, client_dev):
        """Security headers should be present even on error responses."""
        response = client_dev.get("/test/error")

        # Security headers should still be present
        assert "X-Frame-Options" in response.headers
        assert "X-Content-Type-Options" in response.headers


class TestClickjackingProtection:
    """Test clickjacking protection."""

    def test_x_frame_options_prevents_embedding(self, client_dev):
        """X-Frame-Options: DENY should prevent page from being embedded in iframe."""
        response = client_dev.get("/test")

        assert response.headers["X-Frame-Options"] == "DENY"

    def test_csp_frame_ancestors_none(self, client_prod):
        """CSP frame-ancestors 'none' should prevent embedding."""
        response = client_prod.get("/test")

        csp = response.headers["Content-Security-Policy"]
        assert "frame-ancestors 'none'" in csp


class TestXSSProtection:
    """Test XSS protection measures."""

    def test_x_xss_protection_enabled(self, client_dev):
        """X-XSS-Protection header should enable browser XSS filter."""
        response = client_dev.get("/test")

        xss_header = response.headers["X-XSS-Protection"]
        assert "1" in xss_header  # Filter enabled
        assert "mode=block" in xss_header  # Block mode

    def test_csp_script_src_restrictions(self, client_prod):
        """CSP should restrict script sources in production."""
        response = client_prod.get("/test")

        csp = response.headers["Content-Security-Policy"]

        # Should restrict script sources
        assert "script-src" in csp
        # Should not allow arbitrary scripts in production
        assert "script-src 'self'" in csp


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
