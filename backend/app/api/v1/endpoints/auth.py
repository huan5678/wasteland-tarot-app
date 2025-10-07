"""
認證 API 端點

提供 JWT token 驗證、刷新、登出等認證相關功能
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.database import get_db
from app.core.security import (
    verify_token,
    create_access_token,
    create_refresh_token,
    get_access_token_cookie_settings,
    get_refresh_token_cookie_settings
)
from app.core.exceptions import InvalidTokenError
from app.services.user_service import UserService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["🔐 認證"])


class VerifyResponse(BaseModel):
    """Token 驗證回應"""
    user: Dict[str, Any]
    is_valid: bool = True


class RefreshResponse(BaseModel):
    """Token 刷新回應"""
    access_token: str
    message: str = "Token refreshed successfully"


class LogoutResponse(BaseModel):
    """登出回應"""
    message: str
    is_oauth_user: bool = False


class MeResponse(BaseModel):
    """當前使用者資訊回應"""
    user: Dict[str, Any]
    statistics: Optional[Dict[str, Any]] = None


@router.post("/verify", response_model=VerifyResponse)
async def verify_access_token(
    request: Request,
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    驗證 JWT access token

    從 httpOnly cookie 讀取 access token 並驗證其有效性。

    需求對應：
    - 6.1: 實作 POST /api/v1/auth/verify 端點
    - 2.1: Middleware 使用此端點驗證 token

    Args:
        request: FastAPI Request 物件
        access_token: 從 cookie 提取的 access token
        db: 資料庫 session

    Returns:
        VerifyResponse: 包含使用者資訊和驗證狀態

    Raises:
        HTTPException: 401 - Token 無效或過期
    """
    # 檢查是否提供 token
    if not access_token:
        logger.warning("Token verification failed: No access token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No access token provided"
        )

    # 驗證 token
    payload = verify_token(access_token)
    if not payload:
        logger.warning("Token verification failed: Invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token"
        )

    # 檢查 token 類型
    if payload.get("type") != "access":
        logger.warning(f"Token verification failed: Wrong token type - {payload.get('type')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected access token."
        )

    # 從 payload 提取使用者 ID
    user_id = payload.get("sub")
    if not user_id:
        logger.error("Token payload missing 'sub' field")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # 查詢使用者（驗證使用者仍然存在且活躍）
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

    # 返回使用者資訊
    return VerifyResponse(
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "display_name": user.display_name,
            "is_oauth_user": bool(user.oauth_provider),
            "oauth_provider": user.oauth_provider,
            "karma_score": user.karma_score,
            "karma_alignment": user.karma_alignment
        },
        is_valid=True
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_access_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    刷新 JWT access token

    使用 refresh token 生成新的 access token 和 refresh token。

    需求對應：
    - 6.2: 實作 POST /api/v1/auth/refresh 端點
    - 2.4: Middleware 在 token 即將過期時呼叫此端點

    Args:
        response: FastAPI Response 物件用於設定新 cookies
        refresh_token: 從 cookie 提取的 refresh token
        db: 資料庫 session

    Returns:
        RefreshResponse: 包含新的 access token

    Raises:
        HTTPException: 401 - Refresh token 無效或過期
    """
    # 檢查是否提供 refresh token
    if not refresh_token:
        logger.warning("Token refresh failed: No refresh token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )

    # 驗證 refresh token
    payload = verify_token(refresh_token)
    if not payload:
        logger.warning("Token refresh failed: Invalid or expired refresh token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    # 檢查 token 類型必須是 refresh
    if payload.get("type") != "refresh":
        logger.warning(f"Token refresh failed: Wrong token type - {payload.get('type')}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Expected refresh token."
        )

    # 提取使用者 ID
    user_id = payload.get("sub")
    if not user_id:
        logger.error("Refresh token payload missing 'sub' field")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # 驗證使用者仍然存在且活躍
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

    # 生成新的 tokens
    new_access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # 設定新的 httpOnly cookies
    access_cookie_settings = get_access_token_cookie_settings()
    refresh_cookie_settings = get_refresh_token_cookie_settings()

    response.set_cookie(
        **access_cookie_settings,
        value=new_access_token
    )
    response.set_cookie(
        **refresh_cookie_settings,
        value=new_refresh_token
    )

    logger.info(f"Token refreshed successfully for user: {user_id}")

    return RefreshResponse(
        access_token=new_access_token,
        message="Token refreshed successfully"
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout_user(
    response: Response,
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    登出使用者

    清除 access token 和 refresh token cookies。

    需求對應：
    - 3.3: 實作 POST /api/v1/auth/logout 端點

    Args:
        response: FastAPI Response 物件用於清除 cookies
        access_token: 可選的 access token 用於識別 OAuth 使用者
        db: 資料庫 session

    Returns:
        LogoutResponse: 登出成功訊息
    """
    is_oauth_user = False

    # 如果有提供 token，嘗試解析以判斷是否為 OAuth 使用者
    if access_token:
        payload = verify_token(access_token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                try:
                    user_service = UserService(db)
                    user = await user_service.get_user_by_id(user_id)
                    if user and user.oauth_provider:
                        is_oauth_user = True
                except Exception as e:
                    logger.warning(f"Failed to check OAuth user status: {str(e)}")

    # 清除 cookies（設定過期時間為 0）
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")

    logger.info("User logged out successfully")

    return LogoutResponse(
        message="Logged out successfully",
        is_oauth_user=is_oauth_user
    )


@router.get("/me", response_model=MeResponse)
async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    取得當前使用者資訊

    返回當前認證使用者的完整資料和統計資訊。

    需求對應：
    - 3.5: 實作 GET /api/v1/auth/me 端點
    - 6.3: 返回當前使用者完整資訊

    Args:
        access_token: 從 cookie 提取的 access token
        db: 資料庫 session

    Returns:
        MeResponse: 使用者資訊和統計資料

    Raises:
        HTTPException: 401 - 未認證或 token 無效
    """
    # 檢查 token
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # 驗證 token
    payload = verify_token(access_token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token"
        )

    # 提取使用者 ID
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # 查詢使用者
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # 取得使用者統計資料（可選）
    statistics = {}
    try:
        # TODO: 實作完整的統計資料查詢
        # statistics = await user_service.get_user_statistics(user_id)
        pass
    except Exception as e:
        logger.warning(f"Failed to fetch user statistics: {str(e)}")

    # 返回完整使用者資訊
    return MeResponse(
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "display_name": user.display_name,
            "oauth_provider": user.oauth_provider,
            "profile_picture_url": user.profile_picture_url,
            "karma_score": user.karma_score,
            "karma_alignment": user.karma_alignment,
            "faction_alignment": user.faction_alignment,
            "vault_number": user.vault_number,
            "wasteland_location": user.wasteland_location,
            "is_oauth_user": bool(user.oauth_provider),
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None
        },
        statistics=statistics
    )
