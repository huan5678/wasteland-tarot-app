"""
FastAPI dependencies for Wasteland Tarot API
Authentication, authorization, and common dependency injection patterns
"""

from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.db.session import get_db
from app.core.exceptions import InvalidTokenError, UserNotFoundError
from app.config import get_settings
from app.services.ai_interpretation_service import AIInterpretationService

logger = logging.getLogger(__name__)
settings = get_settings()

# Security scheme for JWT tokens
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
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get current authenticated user from JWT token.

    This is a placeholder implementation. In production, implement:
    1. JWT token validation
    2. User lookup from database
    3. Proper error handling
    4. Token refresh logic
    """
    # Placeholder implementation for development
    # In production, validate JWT token and get user from database

    if not credentials:
        # Return demo user for development
        return {
            "id": "demo-user-123",
            "username": "VaultDweller76",
            "email": "dweller@vault76.com",
            "karma_alignment": "good",
            "faction_preference": "vault_dweller",
            "is_active": True,
            "is_premium": False
        }

    try:
        # In production, implement JWT token validation here
        # For now, return demo user
        return {
            "id": "demo-user-123",
            "username": "VaultDweller76",
            "email": "dweller@vault76.com",
            "karma_alignment": "good",
            "faction_preference": "vault_dweller",
            "is_active": True,
            "is_premium": False
        }

    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        raise InvalidTokenError("expired")


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Ensure the current user is active and not suspended.
    """
    if not current_user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vault dweller account inactive. Contact Overseer for reactivation."
        )
    return current_user


async def get_current_premium_user(
    current_user: Dict[str, Any] = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Ensure the current user has premium access.
    """
    if not current_user.get("is_premium", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium vault access required for this feature."
        )
    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[Dict[str, Any]]:
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
    async def good_karma_only(user: dict = Depends(require_karma_alignment(["good"]))):
        pass
    """
    async def karma_check(current_user: Dict[str, Any] = Depends(get_current_active_user)):
        user_karma = current_user.get("karma_alignment")
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
    async def brotherhood_only(user: dict = Depends(require_faction_alignment(["brotherhood"]))):
        pass
    """
    async def faction_check(current_user: Dict[str, Any] = Depends(get_current_active_user)):
        user_faction = current_user.get("faction_preference")
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
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
) -> str:
    """
    Generate rate limiting key based on user or request characteristics.
    """
    if current_user:
        return f"user:{current_user['id']}"

    # For anonymous users, use IP or request headers
    # In production, get actual IP address from request
    return f"anonymous:{request_id or 'unknown'}"


async def check_reading_limit(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
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