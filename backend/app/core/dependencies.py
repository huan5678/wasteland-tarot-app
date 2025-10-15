"""
FastAPI dependencies for Wasteland Tarot API
Authentication, authorization, and common dependency injection patterns
"""

from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Header, Cookie, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.db.session import get_db
from app.models.user import User
from app.core.exceptions import InvalidTokenError, UserNotFoundError
from app.core.security import verify_token
from app.config import get_settings
from app.services.ai_interpretation_service import AIInterpretationService
from app.services.user_service import UserService

logger = logging.getLogger(__name__)
settings = get_settings()

# Security scheme for JWT tokens (fallback for Authorization header)
security = HTTPBearer(auto_error=False)

# AI service singleton
_ai_service: Optional[AIInterpretationService] = None


def get_ai_interpretation_service() -> AIInterpretationService:
    """
    Get AI interpretation service singleton instance.
    Creates the service on first access.
    """
    global _ai_service
    if _ai_service is None:
        _ai_service = AIInterpretationService(settings)
    return _ai_service


async def get_current_user(
    request: Request,
    access_token: Optional[str] = Cookie(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.

    驗證 JWT token 並回傳使用者資訊。

    優先順序：
    1. httpOnly cookie (access_token)
    2. Authorization Bearer header (fallback)

    Args:
        request: FastAPI Request object
        access_token: JWT token from httpOnly cookie
        credentials: HTTP Bearer token (fallback)
        db: Database session

    Returns:
        User: SQLAlchemy User object

    Raises:
        HTTPException: 401 if token is invalid or missing
    """
    # Try to get token from cookie first (primary method)
    token = access_token

    # Fallback to Authorization header if no cookie
    if not token and credentials:
        token = credentials.credentials

    if not token:
        logger.warning("No authentication token provided (cookie or header)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No access token provided"
        )

    try:
        # Verify JWT token using our own security module
        payload = verify_token(token)

        if not payload:
            logger.warning("Token verification failed: Invalid or expired token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token"
            )

        # Check token type
        if payload.get("type") != "access":
            logger.warning(f"Wrong token type: {payload.get('type')}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Expected access token."
            )

        # Extract user ID
        user_id = payload.get("sub")
        if not user_id:
            logger.error("Token payload missing 'sub' field")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        # Query user from database
        user_service = UserService(db)
        user = await user_service.get_user_by_id(user_id)

        if not user:
            logger.warning(f"User not found for ID: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        if not user.is_active:
            logger.warning(f"User is inactive: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive"
            )

        # Return user object
        return user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed"
        )


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensure the current user is active and not suspended.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vault dweller account inactive. Contact Overseer for reactivation."
        )
    return current_user


async def get_current_premium_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Ensure the current user has premium access.
    """
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium vault access required for this feature."
        )
    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None.
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    if not credentials:
        return None

    try:
        return await get_current_user(credentials, db)
    except Exception:
        return None


def require_karma_alignment(required_alignments: list[str]):
    """
    Dependency factory to require specific karma alignments.

    Usage:
    @app.get("/good-only")
    async def good_karma_only(user: User = Depends(require_karma_alignment(["good"]))):
        pass
    """
    async def karma_check(current_user: User = Depends(get_current_active_user)):
        user_karma = current_user.karma_alignment.value if hasattr(current_user.karma_alignment, 'value') else str(current_user.karma_alignment)
        if user_karma not in required_alignments:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires {' or '.join(required_alignments)} karma alignment. Current: {user_karma}"
            )
        return current_user

    return karma_check


def require_faction_alignment(required_factions: list[str]):
    """
    Dependency factory to require specific faction alignments.

    Usage:
    @app.get("/brotherhood-only")
    async def brotherhood_only(user: User = Depends(require_faction_alignment(["brotherhood"]))):
        pass
    """
    async def faction_check(current_user: User = Depends(get_current_active_user)):
        user_faction = current_user.faction_alignment
        if user_faction not in required_factions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires {' or '.join(required_factions)} faction alignment. Current: {user_faction}"
            )
        return current_user

    return faction_check


async def get_rate_limit_key(
    request_id: Optional[str] = Header(None, alias="X-Request-ID"),
    user_agent: Optional[str] = Header(None, alias="User-Agent"),
    current_user: Optional[User] = Depends(get_optional_current_user)
) -> str:
    """
    Generate rate limiting key based on user or request characteristics.
    """
    if current_user:
        return f"user:{current_user.id}"

    # For anonymous users, use IP or request headers
    # In production, get actual IP address from request
    return f"anonymous:{request_id or 'unknown'}"


async def check_reading_limit(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Check if user has exceeded daily reading limit.
    """
    # Placeholder implementation
    # In production, check actual reading count from database

    daily_reading_count = 5  # Mock current count
    max_readings_per_day = settings.max_readings_per_user_per_day

    if daily_reading_count >= max_readings_per_day:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily reading limit reached ({daily_reading_count}/{max_readings_per_day}). The cards need rest, vault dweller."
        )

    return current_user


class PaginationParams:
    """
    Common pagination parameters dependency.
    """
    def __init__(
        self,
        page: int = 1,
        page_size: int = 20
    ):
        self.page = max(1, page)
        self.page_size = min(max(1, page_size), 100)  # Limit to 100 items per page
        self.offset = (self.page - 1) * self.page_size


def get_pagination_params(
    page: int = 1,
    page_size: int = 20
) -> PaginationParams:
    """
    Dependency for pagination parameters with validation.
    """
    return PaginationParams(page=page, page_size=page_size)