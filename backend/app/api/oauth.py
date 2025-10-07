"""
OAuth Authentication API endpoints

處理 Google OAuth 授權回調和會話建立
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from app.db.database import get_db
from app.services.oauth_service import create_or_update_oauth_user
from app.services.karma_service import KarmaService
from app.core.supabase import get_supabase_client
from app.core.security import create_access_token, create_refresh_token
from app.core.exceptions import (
    ExternalServiceError,
    InvalidRequestError,
    OAuthAuthorizationError,
    OAuthCallbackError,
    OAuthUserCreationError,
    SupabaseConnectionError
)
from app.core.retry import retry_async, SUPABASE_RETRY_CONFIG
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["oauth"])


class OAuthCallbackRequest(BaseModel):
    """OAuth 回調請求資料"""
    code: str  # 授權碼


class OAuthCallbackResponse(BaseModel):
    """OAuth 回調回應資料"""
    access_token: str
    refresh_token: str
    user: Dict[str, Any]
    token_type: str = "bearer"


# 註釋：傳統登入端點已移至 /api/v1/endpoints/auth.py
# 此檔案僅保留 OAuth 相關端點


@router.post("/oauth/callback", response_model=OAuthCallbackResponse)
async def oauth_callback(
    request: OAuthCallbackRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    處理 OAuth 授權回調

    需求：
    - 2.2: 接收授權碼並交換 session
    - 2.3: 提取使用者資料
    - 2.4: 建立或更新使用者
    - 3.1: 呼叫 OAuth 使用者服務
    - 3.4: 初始化 Karma（若為新使用者）
    - 12.1: 返回 JWT token 和使用者資料

    流程：
    1. 使用授權碼交換 Supabase session
    2. 從 session 提取使用者資料（email, name, sub）
    3. 建立或更新 OAuth 使用者
    4. 若為新使用者，初始化 Karma
    5. 生成 JWT token
    6. 設定 httpOnly cookies
    7. 返回使用者資料和 token
    """
    try:
        # 步驟 1: 使用 Supabase SDK 交換授權碼（帶重試邏輯）
        supabase = get_supabase_client()

        async def exchange_code():
            """授權碼交換（包裝為 async 以支援重試）"""
            try:
                # 執行授權碼交換
                # Supabase Python SDK 2.20.0 使用同步 API
                auth_response = supabase.auth.exchange_code_for_session({
                    "auth_code": request.code
                })

                if not auth_response or not auth_response.session:
                    raise OAuthAuthorizationError(
                        provider="Google",
                        reason="授權碼無效或已過期"
                    )

                return auth_response

            except OAuthAuthorizationError:
                # 已知錯誤直接拋出，不重試
                raise
            except Exception as e:
                logger.error(f"Supabase 授權碼交換失敗: {str(e)}")
                raise SupabaseConnectionError("授權碼交換")

        try:
            # 使用重試邏輯執行交換
            auth_response = await retry_async(
                exchange_code,
                config=SUPABASE_RETRY_CONFIG
            )
            session = auth_response.session
            supabase_user = auth_response.user

        except SupabaseConnectionError as e:
            # Supabase 連線錯誤
            raise
        except OAuthAuthorizationError as e:
            # 授權錯誤（無效授權碼）
            raise

        # 步驟 2: 提取使用者資料
        email = supabase_user.email
        if not email:
            raise OAuthCallbackError(
                provider="Google",
                reason="OAuth 提供者未返回 email"
            )

        # 從 user_metadata 或直接從 user 物件提取 name
        user_metadata = supabase_user.user_metadata or {}
        name = user_metadata.get("full_name") or user_metadata.get("name")

        # 提取 OAuth ID（Supabase 的 sub 就是 OAuth provider 的 user ID）
        oauth_id = supabase_user.id

        # OAuth provider（從 app_metadata 提取）
        app_metadata = supabase_user.app_metadata or {}
        provider = app_metadata.get("provider", "google")

        # 提取頭像
        profile_picture_url = user_metadata.get("avatar_url") or user_metadata.get("picture")

        # 步驟 3: 建立或更新 OAuth 使用者（帶錯誤處理）
        try:
            user = await create_or_update_oauth_user(
                db=db,
                email=email,
                name=name,
                oauth_provider=provider,
                oauth_id=oauth_id,
                profile_picture_url=profile_picture_url
            )
        except Exception as e:
            logger.error(f"建立或更新 OAuth 使用者失敗: {str(e)}", exc_info=True)
            raise OAuthUserCreationError(
                provider="Google",
                reason=str(e)
            )

        # 步驟 4: 檢查是否為新使用者並初始化 Karma（Task 29）
        karma_service = KarmaService(db)
        try:
            # initialize_karma_for_user 會檢查是否已初始化
            # 若已初始化會返回 None，若新使用者則初始化並返回記錄
            karma_init_result = await karma_service.initialize_karma_for_user(str(user.id))

            if karma_init_result:
                logger.info(
                    f"Karma 已為 OAuth 使用者初始化: user_id={user.id}, "
                    f"provider={provider}, karma={user.karma_score}"
                )
        except Exception as e:
            # Karma 初始化失敗不應阻擋登入流程
            logger.warning(f"Karma 初始化失敗（非致命）: {str(e)}")

        # 步驟 5: 生成 JWT token
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        # 步驟 6: 設定 httpOnly cookies（安全儲存 token）
        # TODO: Task 19 會實作完整的 cookie 管理
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,  # 生產環境需要 HTTPS
            samesite="lax",
            max_age=1800  # 30 分鐘
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=604800  # 7 天
        )

        # 步驟 7: 返回使用者資料和 token
        return OAuthCallbackResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user={
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "oauth_provider": user.oauth_provider,
                "profile_picture_url": user.profile_picture_url,
                "is_oauth_user": True
            }
        )

    except (
        OAuthAuthorizationError,
        OAuthCallbackError,
        OAuthUserCreationError,
        SupabaseConnectionError
    ) as e:
        # OAuth 相關錯誤，已有使用者友善訊息
        logger.warning(f"OAuth 流程錯誤: {e.message}")
        raise
    except InvalidRequestError as e:
        # 請求驗證錯誤
        logger.warning(f"無效的 OAuth 請求: {e.message}")
        raise
    except Exception as e:
        # 未預期的錯誤
        logger.error(f"OAuth 回調處理失敗: {str(e)}", exc_info=True)
        raise OAuthCallbackError(
            provider="Google",
            reason="內部處理錯誤"
        )
