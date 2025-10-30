"""
OAuth Authentication API endpoints

處理 Google OAuth 授權回調和會話建立
"""

from typing import Dict, Any, List, Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from app.db.database import get_db
from app.services.oauth_service import create_or_update_oauth_user
from app.services.karma_service import KarmaService
from app.services.auth_method_coordinator import AuthMethodCoordinatorService
from app.services.auth_analytics_tracker import AuthAnalyticsTracker
from app.core.supabase import get_supabase_client
from app.core.security import create_access_token, create_refresh_token
from app.core.dependencies import get_current_user
from app.models.user import User
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


class OAuthLoginRequest(BaseModel):
    """OAuth 登入請求資料"""
    redirect_url: str = "http://localhost:3000/auth/callback"  # 前端 callback URL


class OAuthLoginResponse(BaseModel):
    """OAuth 登入回應資料"""
    authorization_url: str  # Google OAuth 授權 URL


class OAuthCallbackRequest(BaseModel):
    """OAuth 回調請求資料"""
    code: str  # 授權碼
    state: Optional[str] = None  # CSRF 防護 state 參數（安全性需求）


class OAuthCallbackResponse(BaseModel):
    """OAuth 回調回應資料"""
    access_token: str
    refresh_token: str
    token_expires_at: int  # JWT exp timestamp（秒）
    user: Dict[str, Any]
    token_type: str = "bearer"


# 註釋：傳統登入端點已移至 /api/v1/endpoints/auth.py
# 此檔案僅保留 OAuth 相關端點


@router.post("/oauth/google/login", response_model=OAuthLoginResponse)
async def initiate_google_oauth(
    request: OAuthLoginRequest,
    response: Response
):
    """
    啟動 Google OAuth 登入流程（使用 PKCE）

    此 endpoint 生成 Google OAuth 授權 URL 並返回給前端。
    使用 PKCE (Proof Key for Code Exchange) 來確保安全性。

    流程：
    1. 後端生成 code_verifier 和 code_challenge
    2. 將 code_verifier 儲存到 HTTP-only cookie
    3. 返回包含 code_challenge 的 OAuth URL 給前端
    4. 前端重導向到 OAuth URL
    5. 使用者授權後，Supabase 重導向到前端並帶上 code
    6. 前端呼叫 /oauth/callback，傳遞 code
    7. 後端從 cookie 讀取 code_verifier
    8. 後端用 code + code_verifier 交換 session

    Args:
        request: OAuth 登入請求，包含 redirect_url（前端 callback URL）
        response: FastAPI Response 物件，用於設定 cookie

    Returns:
        OAuthLoginResponse: 包含 Google OAuth 授權 URL
    """
    try:
        from app.config import settings
        import urllib.parse
        import secrets
        import hashlib
        import base64

        supabase_url = settings.supabase_url
        provider = "google"

        # 生成 PKCE code_verifier 和 code_challenge
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        code_challenge_bytes = hashlib.sha256(code_verifier.encode('utf-8')).digest()
        code_challenge = base64.urlsafe_b64encode(code_challenge_bytes).decode('utf-8').rstrip('=')

        # 將 code_verifier 儲存到 HTTP-only cookie（TTL 10 分鐘）
        # 使用 httponly=True 確保前端 JavaScript 無法訪問（防止 XSS）
        # 使用 samesite='lax' 允許從 OAuth 重定向回來時攜帶 cookie
        response.set_cookie(
            key="oauth_code_verifier",
            value=code_verifier,
            max_age=600,  # 10 分鐘
            httponly=True,
            secure=False,  # 本地開發使用 HTTP，生產環境應設為 True
            samesite="lax"
        )

        logger.info("已儲存 code_verifier 到 HTTP-only cookie")

        # 構建查詢參數（包含 PKCE 參數但不包含自定義 state）
        params = {
            "provider": provider,
            "redirect_to": request.redirect_url,
            # Google OAuth 特定參數
            "access_type": "offline",
            "prompt": "consent",
            # PKCE 參數
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }

        # 生成完整的 OAuth URL
        query_string = urllib.parse.urlencode(params)
        authorization_url = f"{supabase_url}/auth/v1/authorize?{query_string}"

        logger.info("生成 Google OAuth URL (PKCE=enabled)")

        return OAuthLoginResponse(
            authorization_url=authorization_url
        )

    except Exception as e:
        logger.error(f"生成 OAuth URL 失敗: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="無法啟動 Google OAuth 登入流程"
        )


@router.post("/oauth/callback", response_model=OAuthCallbackResponse)
async def oauth_callback(
    request: OAuthCallbackRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    oauth_code_verifier: Annotated[Optional[str], Cookie(alias="oauth_code_verifier")] = None
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
    - 安全性需求：PKCE 保護

    流程：
    1. 從 cookie 讀取 code_verifier
    2. 使用授權碼 + code_verifier 交換 Supabase session
    3. 從 session 提取使用者資料（email, name, sub）
    4. 建立或更新 OAuth 使用者
    5. 若為新使用者，初始化 Karma
    6. 生成 JWT token
    7. 設定 httpOnly cookies
    8. 返回使用者資料和 token
    """
    try:
        # 步驟 1: 從 cookie 讀取 code_verifier（用於 PKCE flow）
        code_verifier = oauth_code_verifier

        if code_verifier:
            logger.info("已從 cookie 取得 code_verifier (PKCE enabled)")
            # Note: code_verifier cookie 將在返回 response 時被刪除
        else:
            logger.warning("Cookie 中找不到 code_verifier，將使用非 PKCE 流程")

        # 步驟 2: 使用 Supabase SDK 交換授權碼（帶重試邏輯）
        supabase = get_supabase_client()

        async def exchange_code():
            """授權碼交換（包裝為 async 以支援重試）"""
            try:
                # 執行授權碼交換
                # Supabase Python SDK 2.20.0 使用同步 API
                # 如果有 code_verifier，則使用 PKCE flow
                exchange_params = {"auth_code": request.code}
                if code_verifier:
                    exchange_params["code_verifier"] = code_verifier
                    logger.info("使用 PKCE flow 進行授權碼交換")

                auth_response = supabase.auth.exchange_code_for_session(exchange_params)

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

        # 步驟 3: 使用協調器處理 OAuth 註冊（偵測衝突）
        try:
            coordinator = AuthMethodCoordinatorService()
            oauth_data = {
                "email": email,
                "name": name or email.split("@")[0],  # 確保 name 不為 None
                "oauth_provider": provider,
                "oauth_id": oauth_id,
                "profile_picture_url": profile_picture_url
            }

            result = await coordinator.handle_oauth_registration(
                oauth_data=oauth_data,
                db=db
            )

            # 檢查是否有帳號衝突
            if not result["success"]:
                # 回傳 409 Conflict 和衝突資訊
                conflict_info = result["conflict"]

                # 追蹤帳號衝突偵測事件（需求 9）
                tracker = AuthAnalyticsTracker(db)
                await tracker.track_oauth_conflict_detected(
                    email=email,
                    existing_methods=conflict_info["existing_auth_methods"],
                    oauth_provider=provider
                )

                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "error": "account_conflict",
                        "message": "此 email 已註冊，請先使用現有方式登入後連結 Google 帳號",
                        "conflict_info": conflict_info
                    }
                )

            user = result["user"]
            is_new_user = result.get("is_new_user", False)

        except HTTPException:
            # 帳號衝突錯誤，直接拋出
            raise
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

        # 步驟 4.5: 追蹤 OAuth 註冊或登入成功事件（需求 9）
        tracker = AuthAnalyticsTracker(db)
        try:
            if is_new_user:
                # 新用戶註冊
                await tracker.track_oauth_registration_success(
                    user_id=str(user.id),
                    provider=provider,
                    metadata={"email": email}
                )
            else:
                # 現有用戶登入
                await tracker.track_oauth_login_success(
                    user_id=str(user.id),
                    provider=provider,
                    metadata={"has_passkey": False}  # TODO: 從 result 取得實際值
                )
        except Exception as e:
            # 事件追蹤失敗不應阻擋登入流程
            logger.warning(f"OAuth 事件追蹤失敗（非致命）: {str(e)}")

        # 步驟 5: 生成 JWT token
        from datetime import datetime, timedelta
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        # 計算 access token 過期時間（30 分鐘）
        token_expires_at = int((datetime.utcnow() + timedelta(minutes=30)).timestamp())

        # 步驟 6: 準備回應資料
        from app.config import settings
        is_production = settings.environment == "production"

        response_data = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_expires_at": token_expires_at,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "oauth_provider": user.oauth_provider,
                "profile_picture_url": user.profile_picture_url,
                "is_oauth_user": True
            }
        }

        # 步驟 7: 創建 JSONResponse 並設定 httpOnly cookies
        # 重要：必須返回 JSONResponse 而不是 Pydantic model
        # 因為 Pydantic model 會導致 FastAPI 創建新的 response，丟失 cookies
        json_response = JSONResponse(content=response_data)

        # 刪除已使用的 code_verifier cookie（PKCE 一次性使用）
        if code_verifier:
            json_response.delete_cookie(key="oauth_code_verifier", path="/")
            logger.info("已刪除 oauth_code_verifier cookie")

        # 設置認證 tokens 為 httpOnly cookies
        json_response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=is_production,  # 生產環境使用 HTTPS
            samesite="lax",
            max_age=1800,  # 30 分鐘
            path="/"  # 確保在所有路徑下都可用
        )
        json_response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=604800,  # 7 天
            path="/"  # 確保在所有路徑下都可用
        )

        logger.info(f"✅ OAuth callback 成功，已設置 access_token 和 refresh_token cookies: {user.email}")
        return json_response

    except HTTPException:
        # HTTP 異常（包含 409 Conflict），直接拋出
        raise
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


# ==================== 認證方式查詢 API ====================

class CredentialInfoResponse(BaseModel):
    """Credential 簡化資訊回應"""
    id: str
    name: Optional[str] = None
    device_name: Optional[str] = None
    created_at: Optional[str] = None
    last_used_at: Optional[str] = None
    device_type: str = "unknown"


class AuthMethodsResponse(BaseModel):
    """認證方式查詢回應"""
    # OAuth 相關
    has_oauth: bool = False
    oauth_provider: Optional[str] = None
    profile_picture: Optional[str] = None

    # Passkey 相關
    has_passkey: bool = False
    passkey_count: int = 0
    passkey_credentials: List[Dict[str, Any]] = []

    # 密碼相關
    has_password: bool = False


@router.get("/methods", response_model=AuthMethodsResponse)
async def get_auth_methods(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查詢當前用戶的所有認證方式

    需求：
    - 需求 5: 認證方式狀態同步（前後端一致性）

    回傳資訊：
    - OAuth 狀態（是否綁定、提供者、頭像）
    - Passkey 狀態（是否註冊、數量、裝置清單）
    - 密碼狀態（是否設定）

    使用場景：
    - 用戶設定頁面：顯示已啟用的認證方式
    - Passkey 註冊流程：檢查是否已註冊 Passkey
    - 安全性檢查：確認用戶至少有一種認證方式

    回應範例：
    ```json
    {
      "has_oauth": true,
      "oauth_provider": "google",
      "profile_picture": "https://...",
      "has_passkey": true,
      "passkey_count": 2,
      "passkey_credentials": [
        {
          "id": "...",
          "device_name": "MacBook Touch ID",
          "created_at": "2025-01-15T10:30:00Z",
          "device_type": "platform"
        }
      ],
      "has_password": false
    }
    ```
    """
    try:
        # 使用 AuthMethodCoordinatorService 查詢認證方式
        coordinator = AuthMethodCoordinatorService()
        auth_info = await coordinator.get_auth_methods(
            user_id=current_user.id,
            db=db
        )

        # 轉換為 API 回應格式
        return AuthMethodsResponse(
            has_oauth=auth_info.has_oauth,
            oauth_provider=auth_info.oauth_provider,
            profile_picture=auth_info.profile_picture,
            has_passkey=auth_info.has_passkey,
            passkey_count=auth_info.passkey_count,
            passkey_credentials=auth_info.passkey_credentials,
            has_password=auth_info.has_password
        )

    except ValueError as e:
        # 用戶不存在（理論上不應發生，因為已通過身份驗證）
        logger.error(f"用戶查詢失敗: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except Exception as e:
        # 未預期的錯誤
        logger.error(f"認證方式查詢失敗: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve authentication methods"
        )
