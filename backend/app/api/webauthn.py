"""
WebAuthn API Endpoints

Handles Passkey registration and authentication endpoints.
This module is completely independent from OAuth and Email authentication.

Reference: docs/passkeys-architecture.md Section 5.1
"""

import logging
import secrets
from typing import Optional
from uuid import UUID
import json

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from webauthn.helpers import options_to_json

from app.core.webauthn import get_webauthn_config, is_webauthn_enabled
from app.core.dependencies import get_current_user, get_db
from app.core.security import create_access_token, create_refresh_token
from app.services.webauthn_service import WebAuthnService
from app.services.webauthn_challenge_service import get_challenge_service
from app.services.user_service import UserService
from app.schemas.webauthn import (
    NewUserRegistrationOptionsRequest,
    NewUserRegistrationVerificationRequest,
    NewUserRegistrationResponse,
    RegistrationOptionsRequest,
    RegistrationOptionsResponse,
    RegistrationVerificationRequest,
    RegistrationVerificationResponse,
    AuthenticationOptionsRequest,
    AuthenticationOptionsResponse,
    AuthenticationVerificationRequest,
    AuthenticationVerificationResponse,
    CredentialListResponse,
    CredentialResponse,
    UpdateCredentialNameRequest,
    UpdateCredentialNameResponse,
    DeleteCredentialResponse,
    UserResponse,
)
from app.models.user import User
from app.core.exceptions import (
    WebAuthnRegistrationError,
    WebAuthnAuthenticationError,
    CredentialNotFoundError,
    UserAlreadyExistsError,
    MaxCredentialsReachedError,
)
from app.services.karma_service import KarmaService
from app.services.security_logger import get_security_logger, SecurityEventType

router = APIRouter(prefix="/webauthn", tags=["WebAuthn/Passkeys"])

# Initialize loggers
security_logger = get_security_logger()
logger = logging.getLogger(__name__)


# ==================== Helper Functions ====================

def check_webauthn_enabled():
    """Check if WebAuthn feature is enabled."""
    if not is_webauthn_enabled():
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Passkey 功能目前未啟用"
        )


def get_webauthn_service(db: Session = Depends(get_db)) -> WebAuthnService:
    """Dependency: Get WebAuthn service instance."""
    return WebAuthnService(db)


async def store_challenge(identifier: str, challenge: bytes, request: Request) -> bool:
    """
    Store challenge using Redis (with Session fallback).

    Args:
        identifier: User identifier (email or user_id)
        challenge: WebAuthn challenge bytes
        request: FastAPI Request object

    Returns:
        True if successfully stored
    """
    challenge_service = get_challenge_service()
    return await challenge_service.store_challenge(identifier, challenge, request)


async def get_challenge(identifier: str, request: Request) -> Optional[bytes]:
    """
    Get and delete challenge (single-use) using Redis (with Session fallback).

    Args:
        identifier: User identifier (email or user_id)
        request: FastAPI Request object

    Returns:
        Challenge bytes if found, None otherwise
    """
    challenge_service = get_challenge_service()
    return await challenge_service.get_and_delete_challenge(identifier, request)


# ==================== New User Registration Endpoints (Passwordless) ====================

@router.post(
    "/register-new/options",
    response_model=RegistrationOptionsResponse,
    summary="產生新使用者 Passkey 註冊選項（無密碼註冊）",
    description="""
    ## 說明
    為新使用者產生 Passkey 註冊選項（WebAuthn PublicKeyCredentialCreationOptions），
    用於無密碼註冊流程。這是廢土居民加入 Pip-Boy 系統的第一步。

    ## 流程
    1. 使用者輸入 email 和姓名
    2. 後端驗證 email 尚未註冊
    3. 產生密碼學安全的 challenge（32 bytes）
    4. 儲存 challenge 到 Session（TTL 5 分鐘）
    5. 回傳註冊選項給前端，供 `navigator.credentials.create()` 使用

    ## 安全性
    - Challenge 只能使用一次（single-use）
    - Challenge 有效期限 5 分鐘
    - Email 唯一性檢查防止重複註冊
    - Rate Limit: 10 requests/minute

    ## Fallout 主題
    "Pip-Boy 生物辨識掃描系統準備就緒...請將手指放在掃描器上"
    """,
    responses={
        200: {
            "description": "成功取得註冊選項",
            "content": {
                "application/json": {
                    "example": {
                        "options": {
                            "challenge": "base64url-encoded-challenge",
                            "rp": {"name": "Wasteland Tarot", "id": "localhost"},
                            "user": {"id": "user-uuid", "name": "user@example.com", "displayName": "User Name"},
                            "pubKeyCredParams": [{"type": "public-key", "alg": -7}],
                            "timeout": 300000,
                            "attestation": "none",
                            "authenticatorSelection": {
                                "authenticatorAttachment": "platform",
                                "requireResidentKey": True,
                                "residentKey": "required",
                                "userVerification": "required"
                            }
                        },
                        "challenge": "hex-encoded-challenge"
                    }
                }
            }
        },
        409: {
            "description": "Email 已註冊",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "此 email 已在避難所註冊，請使用生物辨識登入存取你的 Pip-Boy"
                    }
                }
            }
        },
        429: {"description": "Rate limit exceeded（超過請求限制）"},
        501: {"description": "Passkey 功能目前未啟用"}
    },
    tags=["WebAuthn - Registration (New User)"]
)
async def generate_new_user_registration_options(
    request: Request,
    body: NewUserRegistrationOptionsRequest,
    service: WebAuthnService = Depends(get_webauthn_service)
):
    """
    Generate WebAuthn registration options for new user signup.

    No authentication required (new user registration)

    Flow:
    1. User visits registration page
    2. Enters email and name
    3. Clicks "使用 Passkey 註冊"
    4. Backend checks email availability
    5. Backend generates registration options
    6. Frontend calls navigator.credentials.create()
    7. User completes biometric authentication
    8. Frontend sends response to /register-new/verify
    """
    check_webauthn_enabled()

    try:
        # Generate registration options for new user
        options = service.generate_registration_options_for_new_user(
            email=body.email,
            name=body.name
        )

        # Store challenge in Redis/Session (using email as identifier)
        await store_challenge(body.email, options.challenge, request)
        # Store email and name for verification step
        if not hasattr(request, "session"):
            request.session = {}
        request.session["new_user_email"] = body.email
        request.session["new_user_name"] = body.name

        # Convert options to JSON then back to dict for Pydantic
        options_json = options_to_json(options)
        options_dict = json.loads(options_json)

        return RegistrationOptionsResponse(
            options=options_dict,
            challenge=options.challenge.hex()
        )

    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        raise WebAuthnRegistrationError(str(e)) from e


@router.post(
    "/register-new/verify",
    response_model=NewUserRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="驗證新使用者 Passkey 註冊（無密碼註冊）",
    description="""
    ## 說明
    驗證新使用者的 WebAuthn 註冊回應（attestation），建立新帳號並儲存 Passkey 憑證。
    這是完成廢土居民註冊的最後一步，成功後即可進入 Pip-Boy 系統。

    ## 流程
    1. 前端呼叫 `navigator.credentials.create()` 完成生物辨識
    2. 前端傳送 attestation response 到此端點
    3. 後端驗證 attestation（signature、challenge、origin）
    4. 建立新使用者帳號（無密碼）
    5. 儲存 Passkey credential
    6. 初始化 Karma 系統（獎勵 +50 Karma）
    7. 產生 JWT tokens 並設定 httpOnly cookies
    8. 回傳使用者資訊和 credential 資訊

    ## 安全性
    - 驗證 challenge 一致性（防止 replay attack）
    - 驗證 origin 正確性（防止 phishing）
    - 驗證 signature 有效性（使用 public key 驗證）
    - Challenge 單次使用後立即刪除
    - JWT tokens 使用 httpOnly cookies（防止 XSS）

    ## Fallout 主題
    "生物辨識掃描完成！歡迎加入避難所，居民。Pip-Boy 已啟動。"
    """,
    responses={
        201: {
            "description": "註冊成功，帳號已建立",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "user": {
                            "id": "user-uuid",
                            "email": "user@example.com",
                            "name": "User Name",
                            "is_active": True,
                            "is_oauth_user": False,
                            "oauth_provider": None
                        },
                        "credential": {
                            "id": "credential-uuid",
                            "credential_id": "base64url-encoded-id...",
                            "device_name": "iPhone 15 Pro",
                            "transports": ["internal"],
                            "backup_eligible": True,
                            "backup_state": False,
                            "created_at": "2025-10-28T12:00:00Z",
                            "last_used_at": "2025-10-28T12:00:00Z",
                            "is_platform_authenticator": True,
                            "is_roaming_authenticator": False
                        }
                    }
                }
            }
        },
        400: {
            "description": "驗證失敗（challenge 過期、signature 錯誤等）",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "生物辨識註冊失敗，請確認 Pip-Boy 功能正常"
                    }
                }
            }
        },
        409: {
            "description": "Email 已註冊",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "此 email 已在避難所註冊"
                    }
                }
            }
        },
        429: {"description": "Rate limit exceeded"},
        501: {"description": "Passkey 功能未啟用"}
    },
    tags=["WebAuthn - Registration (New User)"]
)
async def verify_new_user_registration(
    request: Request,
    response: Response,
    body: NewUserRegistrationVerificationRequest,
    service: WebAuthnService = Depends(get_webauthn_service),
    db: Session = Depends(get_db)
):
    """
    Verify WebAuthn registration response and create new user account.

    No authentication required (new user registration)

    Flow:
    1. Frontend sends attestation response from authenticator
    2. Backend verifies response
    3. Backend creates new user (passwordless)
    4. Backend creates credential
    5. Backend initializes Karma
    6. Backend creates JWT session
    7. Returns success with user info and tokens
    """
    check_webauthn_enabled()

    # Get stored user info from session first (needed for challenge retrieval)
    if not hasattr(request, "session"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="會話資訊遺失，請重新開始註冊流程"
        )

    stored_email = request.session.get("new_user_email")
    stored_name = request.session.get("new_user_name")

    if not stored_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="會話資訊遺失，請重新開始註冊流程"
        )

    # Get expected challenge from Redis/Session (using email as identifier)
    expected_challenge = await get_challenge(stored_email, request)
    if not expected_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge 已過期或不存在，請重新開始註冊流程"
        )

    # Verify email and name match
    if stored_email != body.email or stored_name != body.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="使用者資訊不符，請重新開始註冊流程"
        )

    try:
        # Register new user with passkey
        user, credential = service.register_new_user_with_passkey(
            email=body.email,
            name=body.name,
            credential_id=body.credential_id,
            client_data_json=body.client_data_json,
            attestation_object=body.attestation_object,
            device_name=body.device_name,
            expected_challenge=expected_challenge
        )

        # Initialize Karma for new user
        karma_service = KarmaService(db)
        karma_service.initialize_karma_for_user(user.id)

        # Award first passkey registration karma
        from app.services.auth_helpers import award_first_passkey_registration_karma
        award_first_passkey_registration_karma(user.id, db)

        # Update last login method
        user.last_login_method = "passkey"
        db.commit()

        # Log security event: Passkey Registration Success
        security_logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_id=str(user.id),
            user_email=user.email,
            success=True,
            credential_id=credential.credential_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={
                "is_first_passkey": True,
                "karma_awarded": 50,
                "authenticator_type": credential.authenticator_attachment or "unknown",
                "device_name": body.device_name
            }
        )

        # Create tokens with auth_method
        access_token = create_access_token({
            "sub": str(user.id),
            "email": user.email,
            "auth_method": "passkey"
        })
        refresh_token = create_refresh_token({
            "sub": str(user.id),
            "email": user.email
        })

        # Set httpOnly cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=1800  # 30 minutes
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=604800  # 7 days
        )

        # Clean up session
        if "new_user_email" in request.session:
            del request.session["new_user_email"]
        if "new_user_name" in request.session:
            del request.session["new_user_name"]

        # Prepare response
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_active=user.is_active,
            is_oauth_user=False,
            oauth_provider=None
        )

        credential_response = CredentialResponse(
            id=credential.id,
            credential_id=credential.credential_id[:20] + "...",
            device_name=credential.device_name,
            transports=credential.transports,
            backup_eligible=credential.backup_eligible,
            backup_state=credential.backup_state,
            created_at=credential.created_at,
            last_used_at=credential.last_used_at,
            is_platform_authenticator=credential.is_platform_authenticator,
            is_roaming_authenticator=credential.is_roaming_authenticator
        )

        return NewUserRegistrationResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_response,
            credential=credential_response
        )

    except UserAlreadyExistsError as e:
        # Log security event: Registration Failed (User Already Exists)
        security_logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_email=body.email,
            success=False,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        # Log security event: Registration Failed (Generic Error)
        security_logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_email=body.email,
            success=False,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            error=str(e),
            exception=e
        )
        raise WebAuthnRegistrationError(str(e)) from e


# ==================== Registration Endpoints (Existing Users) ====================

@router.post(
    "/register/options",
    response_model=RegistrationOptionsResponse,
    summary="產生 Passkey 註冊選項",
    description="為已登入使用者產生 WebAuthn 註冊選項，用於新增 Passkey 認證器"
)
async def generate_registration_options(
    request: Request,
    body: RegistrationOptionsRequest,
    current_user: User = Depends(get_current_user),
    service: WebAuthnService = Depends(get_webauthn_service)
):
    """
    Generate WebAuthn registration options.

    Required: Authenticated user (must be logged in)

    Flow:
    1. User clicks "新增 Passkey" in settings
    2. Backend generates registration options with challenge
    3. Frontend calls navigator.credentials.create()
    4. User completes biometric authentication
    5. Frontend sends response to /register/verify
    """
    check_webauthn_enabled()

    try:
        # Check credential limit (10 passkeys maximum)
        service.check_credential_limit(current_user.id)

        # Generate registration options (includes excludeCredentials)
        options = service.generate_registration_options(
            user=current_user,
            device_name=body.device_name
        )

        # Store challenge in Redis/Session (using user_id as identifier)
        await store_challenge(str(current_user.id), options.challenge, request)

        # Convert options to JSON then back to dict for Pydantic
        options_json = options_to_json(options)
        options_dict = json.loads(options_json)

        return RegistrationOptionsResponse(
            options=options_dict,
            challenge=options.challenge.hex()
        )

    except MaxCredentialsReachedError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise WebAuthnRegistrationError(str(e)) from e


@router.post(
    "/register/verify",
    response_model=RegistrationVerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="驗證 Passkey 註冊回應",
    description="驗證 WebAuthn 註冊回應並儲存新的 Passkey 憑證"
)
async def verify_registration_response(
    request: Request,
    body: RegistrationVerificationRequest,
    current_user: User = Depends(get_current_user),
    service: WebAuthnService = Depends(get_webauthn_service)
):
    """
    Verify WebAuthn registration response.

    Required: Authenticated user (must be logged in)

    Flow:
    1. Frontend sends attestation response from authenticator
    2. Backend verifies response and stores credential
    3. Returns success with credential info
    """
    check_webauthn_enabled()

    # Get expected challenge from Redis/Session (using user_id as identifier)
    expected_challenge = await get_challenge(str(current_user.id), request)
    if not expected_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge 已過期或不存在，請重新開始註冊流程"
        )

    try:
        # Verify registration response
        credential = service.verify_registration_response(
            user=current_user,
            credential_id=body.credential_id,
            client_data_json=body.client_data_json,
            attestation_object=body.attestation_object,
            device_name=body.device_name,
            expected_challenge=expected_challenge
        )

        # 追蹤認證方式變更（Task 11.4: 安全性控制）
        try:
            from app.services.auth_change_tracker import AuthChangeTracker
            from app.core.redis import get_redis_client

            redis_client = get_redis_client()
            tracker = AuthChangeTracker(redis_client)
            change_count = await tracker.record_change(
                user_id=str(current_user.id),
                change_type="add_passkey",
                metadata={
                    "credential_name": credential.device_name or "unnamed",
                    "authenticator_type": "passkey"
                }
            )

            # 檢查可疑活動
            is_suspicious, count, types = await tracker.check_suspicious_activity(str(current_user.id))

            if is_suspicious:
                logger.warning(
                    f"Suspicious activity detected for user {current_user.id}: "
                    f"{count} auth method changes in 1 hour ({', '.join(types)})"
                )
        except Exception as e:
            logger.warning(f"Failed to track Passkey addition: {e}")
            # 不影響主流程

        # Convert to response model
        credential_response = CredentialResponse(
            id=credential.id,
            credential_id=credential.credential_id[:20] + "...",
            device_name=credential.device_name,
            transports=credential.transports,
            backup_eligible=credential.backup_eligible,
            backup_state=credential.backup_state,
            created_at=credential.created_at,
            last_used_at=credential.last_used_at,
            is_platform_authenticator=credential.is_platform_authenticator,
            is_roaming_authenticator=credential.is_roaming_authenticator
        )

        return RegistrationVerificationResponse(
            credential=credential_response
        )

    except Exception as e:
        raise WebAuthnRegistrationError(str(e)) from e


# ==================== Authentication Endpoints ====================

@router.post(
    "/authenticate/options",
    response_model=AuthenticationOptionsResponse,
    summary="產生 Passkey 認證選項",
    description="""
    ## 說明
    產生 WebAuthn 認證選項（PublicKeyCredentialRequestOptions），
    支援兩種登入模式：Email-guided（email 引導）和 Usernameless（無需 email）。

    ## 兩種登入模式

    ### 1. Email-guided Login（Email 引導登入）
    - 使用者輸入 email
    - 後端產生該使用者的 `allowCredentials` 清單
    - 前端只顯示該使用者的 Passkeys
    - 適合桌面瀏覽器

    ### 2. Usernameless Login（無需 email）
    - 使用者不輸入 email
    - 後端產生空的 `allowCredentials`
    - 前端顯示所有可用的 Passkeys（Conditional UI autofill）
    - 適合行動裝置和支援 autofill 的瀏覽器

    ## 流程
    1. 使用者點擊「使用 Passkey 登入」
    2. （可選）使用者輸入 email
    3. 後端產生 challenge 和認證選項
    4. 前端呼叫 `navigator.credentials.get()`
    5. 使用者選擇 Passkey 並完成生物辨識
    6. 前端傳送回應到 `/authenticate/verify`

    ## 安全性
    - Challenge 密碼學安全（32 bytes random）
    - Challenge 單次使用（TTL 5 分鐘）
    - User Verification required（必須生物辨識）
    - Rate Limit: 20 requests/minute

    ## Fallout 主題
    "Pip-Boy 生物辨識掃描器已就位...請驗證身分以進入系統"
    """,
    responses={
        200: {
            "description": "成功取得認證選項",
            "content": {
                "application/json": {
                    "examples": {
                        "email_guided": {
                            "summary": "Email-guided Login",
                            "value": {
                                "options": {
                                    "challenge": "base64url-encoded-challenge",
                                    "timeout": 300000,
                                    "rpId": "localhost",
                                    "allowCredentials": [
                                        {
                                            "type": "public-key",
                                            "id": "credential-id-1",
                                            "transports": ["internal"]
                                        }
                                    ],
                                    "userVerification": "required"
                                },
                                "challenge": "hex-encoded-challenge"
                            }
                        },
                        "usernameless": {
                            "summary": "Usernameless Login（Conditional UI）",
                            "value": {
                                "options": {
                                    "challenge": "base64url-encoded-challenge",
                                    "timeout": 300000,
                                    "rpId": "localhost",
                                    "allowCredentials": [],
                                    "userVerification": "required"
                                },
                                "challenge": "hex-encoded-challenge"
                            }
                        }
                    }
                }
            }
        },
        404: {
            "description": "Email 不存在（僅 Email-guided 模式）",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "找不到此 Email 的使用者"
                    }
                }
            }
        },
        429: {"description": "Rate limit exceeded"},
        501: {"description": "Passkey 功能未啟用"}
    },
    tags=["WebAuthn - Authentication"]
)
async def generate_authentication_options(
    request: Request,
    body: AuthenticationOptionsRequest,
    service: WebAuthnService = Depends(get_webauthn_service),
    db: Session = Depends(get_db)
):
    """
    Generate WebAuthn authentication options.

    Two modes:
    1. Email-guided login: Provide email, restrict to user's credentials
    2. Usernameless login: No email, allow all credentials

    Flow:
    1. User clicks "使用 Passkey 登入"
    2. Backend generates authentication options
    3. Frontend calls navigator.credentials.get()
    4. User selects credential and completes biometric
    5. Frontend sends response to /authenticate/verify
    """
    check_webauthn_enabled()

    user = None
    if body.email:
        # Email-guided login
        user_service = UserService(db)
        user = user_service.get_user_by_email(body.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="找不到此 Email 的使用者"
            )

    try:
        # Generate authentication options
        options = service.generate_authentication_options(user=user)

        # Store challenge in Redis/Session
        # For email-guided login: use email as identifier
        # For usernameless login: use a temporary session token
        if body.email:
            identifier = body.email
        else:
            # Generate a temporary session token for usernameless login
            identifier = f"auth_session_{secrets.token_hex(16)}"

        # Store identifier in session for verification step
        if not hasattr(request, "session"):
            request.session = {}
        request.session["auth_identifier"] = identifier

        await store_challenge(identifier, options.challenge, request)

        # Convert options to JSON then back to dict for Pydantic
        options_json = options_to_json(options)
        options_dict = json.loads(options_json)

        return AuthenticationOptionsResponse(
            options=options_dict,
            challenge=options.challenge.hex()
        )

    except Exception as e:
        raise WebAuthnAuthenticationError(str(e)) from e


@router.post(
    "/authenticate/verify",
    response_model=AuthenticationVerificationResponse,
    summary="驗證 Passkey 認證回應",
    description="驗證 WebAuthn 認證回應並建立使用者會話"
)
async def verify_authentication_response(
    request: Request,
    response: Response,
    body: AuthenticationVerificationRequest,
    service: WebAuthnService = Depends(get_webauthn_service),
    db: Session = Depends(get_db)
):
    """
    Verify WebAuthn authentication response.

    Flow:
    1. Frontend sends assertion response from authenticator
    2. Backend verifies signature and counter
    3. Creates JWT tokens and sets httpOnly cookies
    4. Returns success with user info
    """
    check_webauthn_enabled()

    # Get auth identifier from session
    if not hasattr(request, "session") or "auth_identifier" not in request.session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="會話資訊遺失，請重新開始登入流程"
        )

    identifier = request.session["auth_identifier"]

    # Get expected challenge from Redis/Session using identifier
    expected_challenge = await get_challenge(identifier, request)
    if not expected_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge 已過期或不存在，請重新開始登入流程"
        )

    # Clean up session
    del request.session["auth_identifier"]

    try:
        # Verify authentication response
        user, credential = service.verify_authentication_response(
            credential_id=body.credential_id,
            client_data_json=body.client_data_json,
            authenticator_data=body.authenticator_data,
            signature=body.signature,
            expected_challenge=expected_challenge
        )

        # Award first passkey login karma (only once)
        from app.services.auth_helpers import award_first_passkey_login_karma
        await award_first_passkey_login_karma(user.id, db)

        # Task 11.3: Award daily passkey login karma (10 Karma per day)
        from app.services.auth_helpers import award_daily_passkey_login_karma
        try:
            await award_daily_passkey_login_karma(user.id, db)
        except Exception as e:
            # Log error but don't fail the login
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to award daily Passkey login karma: {e}")

        # Update last login method
        user.last_login_method = "passkey"
        await db.commit()

        # Log security event: Passkey Login Success
        security_logger.log_event(
            event_type=SecurityEventType.PASSKEY_LOGIN,
            user_id=str(user.id),
            user_email=user.email,
            success=True,
            credential_id=credential.credential_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={
                "authenticator_type": credential.authenticator_attachment or "unknown",
                "device_name": credential.device_name,
                "counter": credential.sign_count
            }
        )

        # Create tokens with auth_method
        access_token = create_access_token({
            "sub": str(user.id),
            "email": user.email,
            "auth_method": "passkey"
        })
        refresh_token = create_refresh_token({
            "sub": str(user.id),
            "email": user.email
        })

        # Set httpOnly cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,  # HTTPS only in production
            samesite="lax",
            max_age=1800  # 30 minutes
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=604800  # 7 days
        )

        # Prepare response
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_active=user.is_active,
            is_oauth_user=user.oauth_provider is not None,
            oauth_provider=user.oauth_provider
        )

        credential_response = CredentialResponse(
            id=credential.id,
            credential_id=credential.credential_id[:20] + "...",
            device_name=credential.device_name,
            transports=credential.transports,
            backup_eligible=credential.backup_eligible,
            backup_state=credential.backup_state,
            created_at=credential.created_at,
            last_used_at=credential.last_used_at,
            is_platform_authenticator=credential.is_platform_authenticator,
            is_roaming_authenticator=credential.is_roaming_authenticator
        )

        return AuthenticationVerificationResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_response,
            credential=credential_response
        )

    except CredentialNotFoundError as e:
        # Log security event: Authentication Failed (Credential Not Found)
        security_logger.log_event(
            event_type=SecurityEventType.AUTHENTICATION_FAILED,
            credential_id=body.credential_id,
            success=False,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            error=str(e)
        )
        raise WebAuthnAuthenticationError(str(e)) from e
    except Exception as e:
        # Log security event: Authentication Failed (Generic Error)
        security_logger.log_event(
            event_type=SecurityEventType.AUTHENTICATION_FAILED,
            credential_id=body.credential_id,
            success=False,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            error=str(e),
            exception=e
        )
        raise WebAuthnAuthenticationError(str(e)) from e


# ==================== Credential Management Endpoints ====================

@router.get(
    "/credentials",
    response_model=CredentialListResponse,
    summary="列出使用者的所有 Passkeys",
    description="取得目前使用者註冊的所有 Passkey 認證器清單"
)
async def list_credentials(
    current_user: User = Depends(get_current_user),
    service: WebAuthnService = Depends(get_webauthn_service)
):
    """
    List all credentials for the current user.

    Required: Authenticated user
    """
    check_webauthn_enabled()

    credentials = service.list_user_credentials(current_user.id)

    credential_responses = [
        CredentialResponse(
            id=cred.id,
            credential_id=cred.credential_id[:20] + "...",
            device_name=cred.device_name,
            transports=cred.transports,
            backup_eligible=cred.backup_eligible,
            backup_state=cred.backup_state,
            created_at=cred.created_at,
            last_used_at=cred.last_used_at,
            is_platform_authenticator=cred.is_platform_authenticator,
            is_roaming_authenticator=cred.is_roaming_authenticator
        )
        for cred in credentials
    ]

    return CredentialListResponse(
        credentials=credential_responses,
        total=len(credential_responses)
    )


@router.patch(
    "/credentials/{credential_id}/name",
    response_model=UpdateCredentialNameResponse,
    summary="更新 Passkey 名稱",
    description="更新指定 Passkey 的裝置名稱"
)
async def update_credential_name(
    credential_id: UUID,
    body: UpdateCredentialNameRequest,
    current_user: User = Depends(get_current_user),
    service: WebAuthnService = Depends(get_webauthn_service)
):
    """
    Update credential device name.

    Required: Authenticated user, credential must belong to user
    """
    check_webauthn_enabled()

    try:
        credential = service.update_credential_name(
            credential_id=credential_id,
            user_id=current_user.id,
            new_name=body.device_name
        )

        credential_response = CredentialResponse(
            id=credential.id,
            credential_id=credential.credential_id[:20] + "...",
            device_name=credential.device_name,
            transports=credential.transports,
            backup_eligible=credential.backup_eligible,
            backup_state=credential.backup_state,
            created_at=credential.created_at,
            last_used_at=credential.last_used_at,
            is_platform_authenticator=credential.is_platform_authenticator,
            is_roaming_authenticator=credential.is_roaming_authenticator
        )

        return UpdateCredentialNameResponse(credential=credential_response)

    except CredentialNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/credentials/{credential_id}",
    response_model=DeleteCredentialResponse,
    summary="刪除 Passkey",
    description="刪除指定的 Passkey 認證器"
)
async def delete_credential(
    credential_id: UUID,
    current_user: User = Depends(get_current_user),
    service: WebAuthnService = Depends(get_webauthn_service)
):
    """
    Delete a credential.

    Required: Authenticated user, credential must belong to user

    Safety: Cannot delete last authentication method
    """
    check_webauthn_enabled()

    try:
        service.delete_credential(
            credential_id=credential_id,
            user_id=current_user.id
        )

        # Log security event: Credential Deleted
        security_logger.log_event(
            event_type=SecurityEventType.CREDENTIAL_DELETED,
            user_id=str(current_user.id),
            user_email=current_user.email,
            success=True,
            credential_id=str(credential_id)
        )

        # 追蹤認證方式變更（Task 11.4: 安全性控制）
        try:
            from app.services.auth_change_tracker import AuthChangeTracker
            from app.core.redis import get_redis_client

            redis_client = get_redis_client()
            tracker = AuthChangeTracker(redis_client)
            change_count = await tracker.record_change(
                user_id=str(current_user.id),
                change_type="remove_passkey",
                metadata={"credential_id": str(credential_id)}
            )

            # 檢查可疑活動
            is_suspicious, count, types = await tracker.check_suspicious_activity(str(current_user.id))

            if is_suspicious:
                logger.warning(
                    f"Suspicious activity detected for user {current_user.id}: "
                    f"{count} auth method changes in 1 hour ({', '.join(types)})"
                )
        except Exception as e:
            logger.warning(f"Failed to track Passkey removal: {e}")
            # 不影響主流程

        return DeleteCredentialResponse()

    except CredentialNotFoundError as e:
        # Log security event: Credential Delete Failed (Not Found)
        security_logger.log_event(
            event_type=SecurityEventType.CREDENTIAL_DELETED,
            user_id=str(current_user.id),
            user_email=current_user.email,
            success=False,
            credential_id=str(credential_id),
            error=str(e)
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except WebAuthnRegistrationError as e:
        # Log security event: Credential Delete Failed (Cannot Delete Last Method)
        security_logger.log_event(
            event_type=SecurityEventType.CREDENTIAL_DELETED,
            user_id=str(current_user.id),
            user_email=current_user.email,
            success=False,
            credential_id=str(credential_id),
            error=str(e)
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
