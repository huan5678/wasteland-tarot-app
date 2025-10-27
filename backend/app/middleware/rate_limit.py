"""
Rate Limiting Middleware for WebAuthn endpoints.

Protects against:
- Brute force registration attacks
- Brute force authentication attacks
- Challenge generation abuse
- Credential enumeration attacks

Reference: tasks.md Stage 16.2
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


def get_user_identifier(request: Request) -> str:
    """
    Get user identifier for rate limiting.

    Priority order:
    1. Authenticated user ID (from JWT token)
    2. Email from request body (for registration/login)
    3. Remote IP address (fallback)

    Args:
        request: FastAPI request object

    Returns:
        User identifier string (user_id, email, or IP)
    """
    # Try to get user from token (if authenticated)
    if hasattr(request.state, "user") and request.state.user:
        user_id = getattr(request.state.user, "id", None)
        if user_id:
            return f"user:{user_id}"

    # Try to get email from request body (for unauthenticated requests)
    if hasattr(request, "_json") and request._json:
        email = request._json.get("email")
        if email:
            return f"email:{email}"

    # Fallback to IP address
    return f"ip:{get_remote_address(request)}"


# Initialize limiter with user identifier
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["100/minute"],  # Global default
    storage_uri="memory://",  # Use Redis in production: "redis://localhost:6379"
    strategy="fixed-window",  # or "moving-window" for smoother limiting
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add rate limiting headers and logging.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Add rate limit information to response headers.

        Args:
            request: Incoming request
            call_next: Next middleware in chain

        Returns:
            Response with rate limit headers
        """
        try:
            response = await call_next(request)

            # Add rate limit info headers (if available)
            if hasattr(request.state, "view_rate_limit"):
                limit_info = request.state.view_rate_limit
                response.headers["X-RateLimit-Limit"] = str(limit_info.limit)
                response.headers["X-RateLimit-Remaining"] = str(limit_info.remaining)
                response.headers["X-RateLimit-Reset"] = str(limit_info.reset_time)

            return response

        except RateLimitExceeded as e:
            # Log rate limit violations
            identifier = get_user_identifier(request)
            logger.warning(
                f"Rate limit exceeded for {identifier} on {request.url.path}. "
                f"Limit: {e.detail}"
            )

            # Return 429 Too Many Requests with Fallout theme
            return Response(
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "☢️ 避難所安全協議：請求過於頻繁，請稍後再試",
                        "detail": f"你已達到安全請求限制。請在 {e.detail} 後重試。",
                        "radiation_level": "🔴 警戒狀態",
                    },
                    "success": False,
                },
                status_code=429,
                headers={
                    "Retry-After": str(e.detail),
                    "X-RateLimit-Reset": str(e.detail),
                },
                media_type="application/json"
            )


# Define rate limits for different endpoint categories
RATE_LIMITS = {
    # WebAuthn Registration (strict to prevent spam)
    "registration_options": "10/minute",  # Generate registration options
    "registration_verify": "10/minute",    # Verify registration response

    # WebAuthn Authentication (more lenient for legitimate users)
    "authentication_options": "20/minute",  # Generate authentication options
    "authentication_verify": "20/minute",   # Verify authentication response

    # Credential Management (moderate)
    "credential_list": "30/minute",         # List user credentials
    "credential_create": "10/minute",       # Add new credential
    "credential_update": "20/minute",       # Update credential name
    "credential_delete": "10/minute",       # Delete credential

    # Challenge Generation (strict to prevent abuse)
    "challenge_generation": "15/minute",    # Any challenge generation

    # Admin/Debug endpoints (very strict)
    "admin_operations": "5/minute",         # Administrative operations
}


def get_rate_limit(endpoint_type: str) -> str:
    """
    Get rate limit configuration for endpoint type.

    Args:
        endpoint_type: Type of endpoint (e.g., "registration_options")

    Returns:
        Rate limit string (e.g., "10/minute")
    """
    return RATE_LIMITS.get(endpoint_type, "100/minute")


# Export limiter and rate limits for use in routes
__all__ = [
    "limiter",
    "RateLimitMiddleware",
    "get_rate_limit",
    "RATE_LIMITS",
    "get_user_identifier",
]
