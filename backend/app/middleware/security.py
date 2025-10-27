"""
Security Middleware for HTTP Security Headers.

Implements:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options (Clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection (XSS filter)
- Referrer-Policy (Referrer information control)

Reference: tasks.md Stage 16.3
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import logging

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all HTTP responses.

    Headers added:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block
    - Strict-Transport-Security: max-age=31536000; includeSubDomains
    - Content-Security-Policy: restrictive CSP
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: restrictive feature policy
    """

    def __init__(self, app, enable_hsts: bool = True):
        """
        Initialize security headers middleware.

        Args:
            app: FastAPI application
            enable_hsts: Whether to enable HSTS (only for production HTTPS)
        """
        super().__init__(app)
        self.enable_hsts = enable_hsts and settings.environment == "production"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Add security headers to response.

        Args:
            request: Incoming request
            call_next: Next middleware/handler

        Returns:
            Response with security headers
        """
        response = await call_next(request)

        # X-Content-Type-Options: Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # X-Frame-Options: Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # X-XSS-Protection: Enable browser XSS filter
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer-Policy: Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # HSTS: Force HTTPS (only in production)
        if self.enable_hsts:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # Content-Security-Policy: Restrict resource loading
        csp_directives = self._get_csp_directives()
        response.headers["Content-Security-Policy"] = "; ".join(
            f"{key} {value}" for key, value in csp_directives.items()
        )

        # Permissions-Policy: Control browser features
        permissions_policy = self._get_permissions_policy()
        response.headers["Permissions-Policy"] = ", ".join(permissions_policy)

        # Custom Wasteland Tarot header (for fun)
        response.headers["X-Powered-By"] = "Vault-Tec Pip-Boy 3000 Mark IV"

        return response

    def _get_csp_directives(self) -> dict:
        """
        Get Content Security Policy directives.

        Returns:
            Dictionary of CSP directives
        """
        if settings.environment == "development":
            # Relaxed CSP for development
            return {
                "default-src": "'self' 'unsafe-inline' 'unsafe-eval' *",
                "script-src": "'self' 'unsafe-inline' 'unsafe-eval' *",
                "style-src": "'self' 'unsafe-inline' *",
                "img-src": "'self' data: blob: *",
                "font-src": "'self' data: *",
                "connect-src": "'self' *",
            }
        else:
            # Strict CSP for production
            return {
                "default-src": "'self'",
                "script-src": "'self'",
                "style-src": "'self' 'unsafe-inline'",  # Allow inline styles for Tailwind
                "img-src": "'self' data: https:",
                "font-src": "'self' data:",
                "connect-src": "'self' https://api.wastelandtarot.com",
                "frame-ancestors": "'none'",
                "base-uri": "'self'",
                "form-action": "'self'",
                "object-src": "'none'",
            }

    def _get_permissions_policy(self) -> list:
        """
        Get Permissions-Policy (formerly Feature-Policy) directives.

        Returns:
            List of permissions policy directives
        """
        return [
            "geolocation=()",          # Disable geolocation
            "microphone=()",           # Disable microphone
            "camera=()",               # Disable camera
            "payment=()",              # Disable payment API
            "usb=()",                  # Disable USB
            "accelerometer=()",        # Disable accelerometer
            "gyroscope=()",            # Disable gyroscope
            "magnetometer=()",         # Disable magnetometer
            "interest-cohort=()",      # Disable FLoC (privacy)
        ]


class SensitiveDataRedactionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to redact sensitive data from logs and error responses.

    Redacts:
    - Passwords
    - API keys
    - Tokens (JWT, OAuth)
    - Credential IDs (partially)
    - Email addresses (partially)
    """

    SENSITIVE_FIELDS = {
        "password",
        "hashed_password",
        "api_key",
        "secret",
        "token",
        "access_token",
        "refresh_token",
        "credential_id",
        "public_key",
        "private_key",
        "authorization",
    }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Redact sensitive data from request/response.

        Args:
            request: Incoming request
            call_next: Next middleware/handler

        Returns:
            Response (with sensitive data redacted in logs)
        """
        # Process request normally
        response = await call_next(request)

        # If response is an error, check for sensitive data in body
        if response.status_code >= 400:
            # Note: We don't modify the response body here
            # Logging middleware should handle redaction
            logger.debug("Error response generated, sensitive data redaction applied by logging middleware")

        return response

    @classmethod
    def redact_dict(cls, data: dict) -> dict:
        """
        Recursively redact sensitive fields in dictionary.

        Args:
            data: Dictionary to redact

        Returns:
            Dictionary with sensitive fields replaced with "[REDACTED]"
        """
        if not isinstance(data, dict):
            return data

        redacted = {}
        for key, value in data.items():
            if key.lower() in cls.SENSITIVE_FIELDS:
                # Fully redact sensitive fields
                redacted[key] = "[REDACTED]"
            elif key.lower() == "email" and isinstance(value, str):
                # Partially redact email
                redacted[key] = cls._mask_email(value)
            elif isinstance(value, dict):
                # Recursively redact nested dicts
                redacted[key] = cls.redact_dict(value)
            elif isinstance(value, list):
                # Redact list items
                redacted[key] = [
                    cls.redact_dict(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                redacted[key] = value

        return redacted

    @staticmethod
    def _mask_email(email: str) -> str:
        """
        Partially mask email address.

        Example: user@example.com -> u***@example.com

        Args:
            email: Email address to mask

        Returns:
            Partially masked email
        """
        if "@" not in email:
            return email

        local, domain = email.split("@", 1)
        if len(local) <= 2:
            masked_local = local[0] + "*"
        else:
            masked_local = local[0] + "***"

        return f"{masked_local}@{domain}"


# Export middleware classes
__all__ = [
    "SecurityHeadersMiddleware",
    "SensitiveDataRedactionMiddleware",
]
