"""
Security Middleware
Implements NFR-3.1 (HTTPS enforcement) and security headers
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all HTTP responses

    Implements:
        - X-Content-Type-Options: nosniff (prevent MIME sniffing)
        - X-Frame-Options: DENY (prevent clickjacking)
        - X-XSS-Protection: 1; mode=block (XSS protection)
        - Strict-Transport-Security: HSTS for HTTPS enforcement
        - Content-Security-Policy: Basic CSP
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.is_production = settings.is_production

    async def dispatch(self, request: Request, call_next):
        # Process request
        response: Response = await call_next(request)

        # Add security headers to response
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # HSTS only in production (NFR-3.1: HTTPS enforcement)
        if self.is_production:
            # Enforce HTTPS for 1 year (31536000 seconds)
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

            # Content-Security-Policy: enforce HTTPS for all resources
            response.headers["Content-Security-Policy"] = (
                "default-src 'self' https:; "
                "script-src 'self' 'unsafe-inline' https:; "
                "style-src 'self' 'unsafe-inline' https:; "
                "img-src 'self' data: https:; "
                "font-src 'self' https:; "
                "connect-src 'self' https:; "
                "upgrade-insecure-requests"
            )

        # Add Referrer-Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Add Permissions-Policy (formerly Feature-Policy)
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        return response


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """
    Redirect HTTP requests to HTTPS in production

    Implements NFR-3.1: Enforce HTTPS in production
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.is_production = settings.is_production

    async def dispatch(self, request: Request, call_next):
        # Only enforce HTTPS in production
        if not self.is_production:
            return await call_next(request)

        # Check if request is using HTTPS
        is_https = request.url.scheme == "https"

        # Check X-Forwarded-Proto header (for reverse proxies)
        forwarded_proto = request.headers.get("X-Forwarded-Proto", "")
        is_forwarded_https = forwarded_proto.lower() == "https"

        if not is_https and not is_forwarded_https:
            # Redirect to HTTPS
            https_url = request.url.replace(scheme="https")
            logger.warning(
                f"Redirecting HTTP request to HTTPS: {request.url} -> {https_url}"
            )

            return Response(
                status_code=301,  # Permanent redirect
                headers={
                    "Location": str(https_url),
                    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
                }
            )

        # Request is already HTTPS, proceed normally
        return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log all requests for security monitoring

    Logs:
        - Request method, path, user agent
        - Response status code
        - Processing time
        - Authentication failures
    """

    async def dispatch(self, request: Request, call_next):
        import time

        # Record start time
        start_time = time.time()

        # Extract request info
        method = request.method
        path = request.url.path
        user_agent = request.headers.get("user-agent", "unknown")
        client_ip = request.client.host if request.client else "unknown"

        # Process request
        response = await call_next(request)

        # Calculate processing time
        process_time = (time.time() - start_time) * 1000  # Convert to milliseconds

        # Log request
        log_data = {
            "method": method,
            "path": path,
            "status_code": response.status_code,
            "process_time_ms": round(process_time, 2),
            "user_agent": user_agent,
            "client_ip": client_ip,
        }

        # Log with appropriate level
        if response.status_code >= 500:
            logger.error(f"Server error: {log_data}")
        elif response.status_code >= 400:
            logger.warning(f"Client error: {log_data}")
        elif process_time > settings.slow_request_threshold_ms:
            logger.warning(f"Slow request: {log_data}")
        else:
            logger.info(f"Request: {log_data}")

        # Add custom header with processing time
        response.headers["X-Process-Time-Ms"] = str(round(process_time, 2))

        return response
