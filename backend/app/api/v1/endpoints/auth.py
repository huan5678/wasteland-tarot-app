"""
認證 API 端點

提供 JWT token 驗證、刷新、登出、註冊、登入等認證相關功能
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, field_validator

from app.db.database import get_db
from app.core.security import (
    verify_token,
    create_access_token,
    create_refresh_token,
    get_access_token_cookie_settings,
    get_refresh_token_cookie_settings
)
from app.core.exceptions import (
    InvalidTokenError,
    UserAlreadyExistsError,
    InvalidCredentialsError,
    AccountLockedError,
    AccountInactiveError,
    OAuthUserCannotLoginError
)
from app.services.user_service import UserService
from app.services.achievement_service import AchievementService
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
    token_expires_at: Optional[int] = None  # JWT exp timestamp


class RegisterRequest(BaseModel):
    """註冊請求"""
    email: EmailStr
    password: str
    confirm_password: str
    name: str
    display_name: Optional[str] = None
    faction_alignment: Optional[str] = None
    wasteland_location: Optional[str] = None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('密碼長度必須至少 8 個字元')
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or len(v) < 1 or len(v) > 50:
            raise ValueError('名稱長度必須在 1-50 字元之間')
        return v


class RegisterResponse(BaseModel):
    """註冊回應"""
    message: str
    user: Dict[str, Any]
    token_expires_at: Optional[int] = None  # JWT exp timestamp


class LoginRequest(BaseModel):
    """登入請求"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """登入回應"""
    message: str
    user: Dict[str, Any]
    token_expires_at: Optional[int] = None  # JWT exp timestamp


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
            "karma_alignment": user.karma_alignment.value if hasattr(user.karma_alignment, 'value') else str(user.karma_alignment),
            "is_admin": user.is_admin if hasattr(user, 'is_admin') else False
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

    # 返回完整使用者資訊(包含 token 過期時間)
    return MeResponse(
        user={
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "display_name": user.display_name,
            "oauth_provider": user.oauth_provider,
            "profile_picture_url": user.profile_picture_url,
            "karma_score": user.karma_score,
            "karma_alignment": user.karma_alignment.value if hasattr(user.karma_alignment, 'value') else str(user.karma_alignment),
            "faction_alignment": user.faction_alignment,
            "wasteland_location": user.wasteland_location,
            "is_oauth_user": bool(user.oauth_provider),
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "is_admin": user.is_admin if hasattr(user, 'is_admin') else False,
            "created_at": user.created_at.isoformat() if user.created_at else None
        },
        statistics=statistics,
        token_expires_at=payload.get("exp")  # 返回 JWT exp timestamp
    )


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    request: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    使用者註冊（Email + Password + Name）

    建立新使用者帳號並自動登入（設定 httpOnly cookies）。

    Args:
        request: 註冊請求資料
        response: FastAPI Response 物件用於設定 cookies
        db: 資料庫 session

    Returns:
        RegisterResponse: 包含成功訊息和使用者資料

    Raises:
        HTTPException: 400 - 驗證錯誤
        HTTPException: 409 - Email 已存在
        HTTPException: 500 - 內部錯誤
    """
    try:
        # 驗證密碼確認
        if request.password != request.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="密碼與確認密碼不符"
            )

        # 建立使用者
        user_service = UserService(db)
        user = await user_service.create_user(
            email=request.email,
            password=request.password,
            name=request.name,
            display_name=request.display_name,
            faction_alignment=request.faction_alignment,
            wasteland_location=request.wasteland_location
        )

        # 生成 JWT tokens
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        # 設定 httpOnly cookies
        access_cookie_settings = get_access_token_cookie_settings()
        refresh_cookie_settings = get_refresh_token_cookie_settings()

        response.set_cookie(
            **access_cookie_settings,
            value=access_token
        )
        response.set_cookie(
            **refresh_cookie_settings,
            value=refresh_token
        )

        logger.info(f"User registered successfully: {user.email}")

        # 自動追蹤今日登入（註冊即視為首次登入）
        try:
            from app.services.token_extension_service import TokenExtensionService
            token_service = TokenExtensionService(db)
            await token_service.track_daily_login(user.id)
        except Exception as track_error:
            logger.warning(f"Failed to track login for new user {user.id}: {str(track_error)}")

        # 設定 token 絕對過期時間
        user.token_absolute_expiry = datetime.utcnow() + timedelta(days=7)
        await db.commit()

        # 解碼 access token 取得過期時間
        token_payload = verify_token(access_token)
        token_expires_at = token_payload.get("exp") if token_payload else None

        return RegisterResponse(
            message="註冊成功",
            user={
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "display_name": user.display_name,
                "faction_alignment": user.faction_alignment,
                "karma_score": user.karma_score,
                "wasteland_location": user.wasteland_location,
                "is_oauth_user": False,
                "is_verified": user.is_verified,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None
            },
            token_expires_at=token_expires_at
        )

    except UserAlreadyExistsError as e:
        logger.warning(f"Registration failed - email exists: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except ValueError as e:
        logger.warning(f"Registration failed - validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="註冊失敗，請稍後再試"
        )


@router.post("/login", response_model=LoginResponse)
async def login_user(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    使用者登入（Email + Password）

    驗證使用者憑證並設定 httpOnly cookies。

    Args:
        request: 登入請求資料
        response: FastAPI Response 物件用於設定 cookies
        db: 資料庫 session

    Returns:
        LoginResponse: 包含成功訊息和使用者資料

    Raises:
        HTTPException: 401 - 憑證無效或帳號問題
        HTTPException: 403 - OAuth 使用者無法使用傳統登入
        HTTPException: 500 - 內部錯誤
    """
    try:
        # 驗證使用者憑證
        user_service = UserService(db)
        user = await user_service.authenticate_user(request.email, request.password)

        # 生成 JWT tokens
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        # 設定 httpOnly cookies
        access_cookie_settings = get_access_token_cookie_settings()
        refresh_cookie_settings = get_refresh_token_cookie_settings()

        response.set_cookie(
            **access_cookie_settings,
            value=access_token
        )
        response.set_cookie(
            **refresh_cookie_settings,
            value=refresh_token
        )

        logger.info(f"User logged in successfully: {user.email}")

        # 自動追蹤今日登入（用於忠誠度計算）
        try:
            from app.services.token_extension_service import TokenExtensionService
            token_service = TokenExtensionService(db)
            await token_service.track_daily_login(user.id)
        except Exception as track_error:
            # 追蹤失敗不影響登入流程
            logger.warning(f"Failed to track login for user {user.id}: {str(track_error)}")

        # ===== Achievement System Integration =====
        # Check and unlock achievements for login (consecutive login)
        try:
            achievement_service = AchievementService(db)
            newly_unlocked = await achievement_service.unlock_achievements_for_user(
                user_id=user.id,
                trigger_event='login',
                event_context={
                    'login_time': datetime.utcnow().isoformat()
                }
            )

            if newly_unlocked:
                logger.info(
                    f"User {user.id} unlocked {len(newly_unlocked)} achievement(s) after login"
                )
        except Exception as e:
            # Don't fail the login if achievement check fails
            logger.error(f"Achievement check failed for user {user.id}: {e}", exc_info=True)

        # 設定 token 絕對過期時間（如果尚未設定）
        if not user.token_absolute_expiry:
            user.token_absolute_expiry = datetime.utcnow() + timedelta(days=7)
            await db.commit()

        # 解碼 access token 取得過期時間
        token_payload = verify_token(access_token)
        token_expires_at = token_payload.get("exp") if token_payload else None

        return LoginResponse(
            message="登入成功",
            user={
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "display_name": user.display_name,
                "faction_alignment": user.faction_alignment,
                "karma_score": user.karma_score,
                "karma_alignment": user.karma_alignment.value if hasattr(user.karma_alignment, 'value') else str(user.karma_alignment),
                "wasteland_location": user.wasteland_location,
                "profile_picture_url": user.profile_picture_url,
                "is_oauth_user": bool(user.oauth_provider),
                "is_verified": user.is_verified,
                "is_active": user.is_active,
                "is_admin": user.is_admin if hasattr(user, 'is_admin') else False,
                "created_at": user.created_at.isoformat() if user.created_at else None
            },
            token_expires_at=token_expires_at
        )

    except InvalidCredentialsError as e:
        logger.warning(f"Login failed - invalid credentials: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except OAuthUserCannotLoginError as e:
        logger.warning(f"Login failed - OAuth user: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except AccountLockedError as e:
        logger.warning(f"Login failed - account locked: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except AccountInactiveError as e:
        logger.warning(f"Login failed - account inactive: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Login failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="登入失敗，請稍後再試"
        )


# Token Extension Endpoints


class ExtendTokenRequest(BaseModel):
    """Token 延長請求"""
    extension_type: str  # 'activity' or 'loyalty'
    activity_duration: Optional[int] = None  # Required for activity type (in seconds)


class ExtendTokenResponse(BaseModel):
    """Token 延長回應"""
    success: bool
    message: str
    extended_minutes: int
    token_expires_at: int
    rewards: Optional[Dict[str, Any]] = None  # For loyalty extensions


class LoyaltyStatusResponse(BaseModel):
    """忠誠度狀態回應"""
    is_eligible: bool
    login_days_count: int
    login_dates: List[str]
    current_streak: int
    extension_available: bool


class TrackLoginResponse(BaseModel):
    """登入追蹤回應"""
    login_date: str
    is_new_day: bool
    consecutive_days: int
    loyalty_check_triggered: bool


@router.post("/extend-token", response_model=ExtendTokenResponse)
async def extend_token(
    request: ExtendTokenRequest,
    response: Response,
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    延長 Token 有效期限

    支援兩種延長方式：
    1. activity: 活躍度延長（30分鐘活躍 → 延長30分鐘）
    2. loyalty: 忠誠度延長（7天內3日登入 → 延長至7天）

    需求對應：
    - 活躍度延長：累計30分鐘真實活躍時間
    - 忠誠度延長：7天內有3日上線
    - 安全限制：最大生命週期7天，速率限制10次/24小時

    Args:
        request: 延長請求（包含延長類型和活躍時長）
        response: FastAPI Response 物件用於更新 cookies
        access_token: 從 cookie 提取的 access token
        db: 資料庫 session

    Returns:
        ExtendTokenResponse: 包含新的過期時間和獎勵資訊

    Raises:
        HTTPException: 401 - 未認證
        HTTPException: 400 - 參數錯誤或不符合條件
        HTTPException: 403 - 達到最大生命週期
        HTTPException: 429 - 超過速率限制
    """
    from app.services.token_extension_service import TokenExtensionService
    from app.core.exceptions import (
        TokenExtensionError,
        MaxLifetimeExceededError,
        RateLimitExceededError
    )

    # 檢查認證
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

    user_id = payload.get("sub")
    current_expiry = payload.get("exp")

    if not user_id or not current_expiry:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    service = TokenExtensionService(db)

    try:
        if request.extension_type == "activity":
            # Activity-based extension
            if request.activity_duration is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="activity_duration is required for activity extension"
                )

            result = await service.extend_token_by_activity(
                user_id=user_id,
                current_expiry=current_expiry,
                activity_duration=request.activity_duration
            )

        elif request.extension_type == "loyalty":
            # Loyalty-based extension
            result = await service.extend_token_by_loyalty(
                user_id=user_id,
                current_expiry=current_expiry
            )

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid extension_type: {request.extension_type}. Must be 'activity' or 'loyalty'"
            )

        # Generate new tokens with updated expiry
        new_access_token = create_access_token(
            data={"sub": user_id, "email": payload.get("email")},
            expires_delta=timedelta(seconds=result["new_expiry"] - int(datetime.utcnow().timestamp()))
        )
        new_refresh_token = create_refresh_token(data={"sub": user_id})

        # Update cookies
        access_cookie_settings = get_access_token_cookie_settings()
        refresh_cookie_settings = get_refresh_token_cookie_settings()

        response.set_cookie(**access_cookie_settings, value=new_access_token)
        response.set_cookie(**refresh_cookie_settings, value=new_refresh_token)

        logger.info(f"Token extended for user {user_id}: type={request.extension_type}, minutes={result['extended_minutes']}")

        return ExtendTokenResponse(
            success=True,
            message="Token extended successfully",
            extended_minutes=result["extended_minutes"],
            token_expires_at=result["new_expiry"],
            rewards=result.get("rewards")
        )

    except TokenExtensionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except MaxLifetimeExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except RateLimitExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Token extension failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token extension failed"
        )


@router.get("/loyalty-status", response_model=LoyaltyStatusResponse)
async def get_loyalty_status(
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    查詢使用者忠誠度狀態

    返回使用者是否符合忠誠度延長資格（7天內3日登入）

    Args:
        access_token: 從 cookie 提取的 access token
        db: 資料庫 session

    Returns:
        LoyaltyStatusResponse: 忠誠度狀態資訊

    Raises:
        HTTPException: 401 - 未認證
    """
    from app.services.token_extension_service import TokenExtensionService

    # 檢查認證
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

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    service = TokenExtensionService(db)
    eligibility = await service.check_loyalty_eligibility(user_id)

    return LoyaltyStatusResponse(**eligibility)


@router.post("/track-login", response_model=TrackLoginResponse)
async def track_login(
    access_token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db)
):
    """
    追蹤使用者每日登入

    記錄使用者今日登入，用於忠誠度計算

    Args:
        access_token: 從 cookie 提取的 access token
        db: 資料庫 session

    Returns:
        TrackLoginResponse: 登入追蹤資訊

    Raises:
        HTTPException: 401 - 未認證
    """
    from app.services.token_extension_service import TokenExtensionService

    # 檢查認證
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

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    service = TokenExtensionService(db)
    result = await service.track_daily_login(user_id)

    return TrackLoginResponse(**result)
