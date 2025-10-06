"""
Authentication API endpoints
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr, field_validator
import re
from app.db.database import get_db
from app.services.user_service import UserService, AuthenticationService
from app.services.karma_service import KarmaService
from app.core.dependencies import get_current_user, get_current_active_user
from app.models.user import User
from app.core.security import get_access_token_cookie_settings, get_refresh_token_cookie_settings
from app.core.exceptions import (
    UserAlreadyExistsError,
    InvalidCredentialsError,
    AccountLockedError,
    AccountInactiveError,
    InvalidTokenError,
    OAuthUserCannotLoginError
)

router = APIRouter(prefix="/auth", tags=["authentication"])


class UserRegistrationRequest(BaseModel):
    """
    使用者註冊請求

    需求：
    - 5.1: 使用 email + password + name 註冊
    - 5.2: 密碼和 confirm_password 必須相符
    - 5.3: Email 格式驗證
    - 5.4: Name 長度驗證（1-50 字元）
    - 5.5: 密碼強度驗證（至少 8 字元）
    """
    email: EmailStr
    password: str
    confirm_password: str
    name: str
    display_name: str | None = None
    faction_alignment: str | None = None
    vault_number: int | None = None
    wasteland_location: str | None = None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """
        驗證密碼強度
        需求 5.5: 至少 8 字元
        """
        if len(v) < 8:
            raise ValueError('密碼長度必須至少 8 字元')
        return v

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        """
        驗證 name 長度
        需求 5.4: 1-50 字元
        """
        if not v or len(v.strip()) == 0:
            raise ValueError('name 不能為空')

        if len(v) < 1 or len(v) > 50:
            raise ValueError('name 長度必須在 1-50 字元之間')

        return v.strip()

    @field_validator('confirm_password')
    @classmethod
    def validate_passwords_match(cls, v, info):
        """
        驗證 password 和 confirm_password 相符
        需求 5.2
        """
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('password 和 confirm_password 不相符')
        return v


class UserLoginRequest(BaseModel):
    """
    使用者登入請求

    需求：
    - 4.1: 使用 email 而非 username
    - 4.2: Email 格式驗證
    """
    email: EmailStr
    password: str

    @field_validator('password')
    @classmethod
    def validate_password_not_empty(cls, v):
        """驗證密碼不為空"""
        if not v or len(v.strip()) == 0:
            raise ValueError('密碼不能為空')
        return v


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirmRequest(BaseModel):
    reset_token: str
    new_password: str


@router.post("/register", response_model=Dict[str, Any])
async def register_user(
    user_data: UserRegistrationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    使用者註冊 (email + password + name)

    需求：
    - 5.1: 使用 email + password + name 註冊
    - 5.2: 密碼和 confirm_password 必須相符（已在 Pydantic 驗證）
    - 5.3: Email 格式驗證（已在 Pydantic 驗證）
    - 5.4: Name 長度驗證（已在 Pydantic 驗證）
    - 5.5: 密碼強度驗證（已在 Pydantic 驗證）
    - 5.6: 成功註冊後自動登入並返回 JWT token
    """
    user_service = UserService(db)
    auth_service = AuthenticationService(db)
    karma_service = KarmaService(db)

    try:
        # 建立使用者（使用 email + password + name，不再使用 username）
        user = await user_service.create_user(
            email=user_data.email,
            password=user_data.password,
            name=user_data.name,
            display_name=user_data.display_name,
            faction_alignment=user_data.faction_alignment,
            vault_number=user_data.vault_number,
            wasteland_location=user_data.wasteland_location
        )

        # 初始化 Karma 系統（Task 29）
        try:
            karma_init_result = await karma_service.initialize_karma_for_user(str(user.id))
            if karma_init_result:
                import logging
                logger = logging.getLogger(__name__)
                logger.info(
                    f"Karma 已為傳統註冊使用者初始化: user_id={user.id}, "
                    f"karma={user.karma_score}"
                )
        except Exception as e:
            # Karma 初始化失敗不應阻擋註冊流程
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Karma 初始化失敗（非致命）: {str(e)}")

        # 自動登入並生成 JWT tokens
        login_result = await auth_service.login_user(user_data.email, user_data.password)

        return {
            "message": "註冊成功",
            "user": login_result["user"],
            "access_token": login_result["access_token"],
            "refresh_token": login_result["refresh_token"],
            "token_type": "bearer"
        }

    except UserAlreadyExistsError as e:
        # Email 已被使用
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message
        )

    except ValueError as e:
        # 驗證錯誤（email 格式、name 長度、密碼強度）
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        # 未預期的錯誤
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"註冊失敗: {str(e)}", exc_info=True)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="註冊失敗，請稍後再試"
        )


@router.post("/login", response_model=Dict[str, Any])
async def login_user(
    login_data: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    使用者登入（使用 email + password）

    需求：
    - 4.1: 使用 email 而非 username 登入
    - 4.2: Email 格式驗證（已在 Pydantic model 處理）
    - 4.3: 處理 OAuth 使用者嘗試密碼登入
    - 4.6: 成功登入後生成 JWT token
    - 4.7: 使用通用錯誤訊息（安全考量）
    """
    auth_service = AuthenticationService(db)

    try:
        # 使用 email 登入（而非 username）
        result = await auth_service.login_user(login_data.email, login_data.password)

        return {
            "message": "登入成功",
            "user": result["user"],
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": "bearer"
        }

    except OAuthUserCannotLoginError as e:
        # OAuth 使用者嘗試使用密碼登入
        # 需求 4.3, 4.5: 提示使用者應使用 OAuth 登入
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message  # 例如："此帳號已綁定 Google 登入，請使用 Google 登入"
        )

    except (InvalidCredentialsError, AccountLockedError, AccountInactiveError) as e:
        # 需求 4.7: 使用通用錯誤訊息，避免洩露帳號是否存在
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message
        )

    except Exception as e:
        # 未預期的錯誤
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"登入失敗: {str(e)}", exc_info=True)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="登入失敗，請稍後再試"
        )


@router.post("/token/refresh", response_model=Dict[str, str])
async def refresh_token(
    token_data: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token"""
    auth_service = AuthenticationService(db)

    try:
        result = await auth_service.refresh_access_token(token_data.refresh_token)
        return {
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": "bearer"
        }
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/logout")
async def logout_user(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    登出使用者

    需求：
    - 7.1: 清除 httpOnly cookies（access_token, refresh_token）
    - 7.2: 對於 OAuth 使用者，前端需呼叫 supabase.auth.signOut()
    - 7.3: 清除所有本地狀態
    - 7.4: 重導向至首頁（前端處理）
    """
    auth_service = AuthenticationService(db)

    # 清除 access_token cookie
    access_token_settings = get_access_token_cookie_settings()
    response.delete_cookie(
        key=access_token_settings["key"],
        path="/",
        domain=None,
        secure=access_token_settings["secure"],
        httponly=access_token_settings["httponly"],
        samesite=access_token_settings["samesite"]
    )

    # 清除 refresh_token cookie
    refresh_token_settings = get_refresh_token_cookie_settings()
    response.delete_cookie(
        key=refresh_token_settings["key"],
        path="/",
        domain=None,
        secure=refresh_token_settings["secure"],
        httponly=refresh_token_settings["httponly"],
        samesite=refresh_token_settings["samesite"]
    )

    return {
        "message": "登出成功",
        "is_oauth_user": current_user.oauth_provider is not None,
        "oauth_provider": current_user.oauth_provider
    }


@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user information"""
    user_service = UserService(db)
    statistics = await user_service.get_user_statistics(current_user.id)

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "display_name": current_user.display_name,
            "oauth_provider": current_user.oauth_provider,
            "profile_picture_url": getattr(current_user, 'profile_picture_url', None),
            "faction_alignment": current_user.faction_alignment,
            "karma_score": current_user.karma_score,
            "karma_alignment": current_user.karma_alignment().value,
            "vault_number": current_user.vault_number,
            "wasteland_location": current_user.wasteland_location,
            "is_verified": current_user.is_verified,
            "is_oauth_user": current_user.oauth_provider is not None,
            "created_at": current_user.created_at,
        },
        "statistics": statistics
    }


@router.post("/password/reset/request")
async def request_password_reset(
    reset_data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset"""
    auth_service = AuthenticationService(db)

    try:
        reset_token = await auth_service.request_password_reset(reset_data.email)
        # In a real implementation, this would send an email
        return {
            "message": "Password reset email sent",
            "reset_token": reset_token  # Only for testing, remove in production
        }
    except Exception as e:
        # Don't reveal if email exists or not
        return {"message": "Password reset email sent"}


@router.post("/password/reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirmRequest,
    db: AsyncSession = Depends(get_db)
):
    """Confirm password reset"""
    auth_service = AuthenticationService(db)

    try:
        success = await auth_service.reset_password(
            reset_data.reset_token,
            reset_data.new_password
        )
        if success:
            return {"message": "Password reset successful"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset failed"
        )


@router.post("/verify-email/{verification_token}")
async def verify_email(
    verification_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify user email"""
    auth_service = AuthenticationService(db)

    try:
        success = await auth_service.verify_user_email(verification_token)
        if success:
            return {"message": "Email verified successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification failed"
        )