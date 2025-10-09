"""
WebAuthn API Endpoints

Handles Passkey registration and authentication endpoints.
This module is completely independent from OAuth and Email authentication.

Reference: docs/passkeys-architecture.md Section 5.1
"""

import secrets
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from webauthn.helpers import options_to_json

from app.core.webauthn import get_webauthn_config, is_webauthn_enabled
from app.core.dependencies import get_current_user, get_db
from app.core.security import create_access_token, create_refresh_token
from app.services.webauthn_service import WebAuthnService
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
)
from app.services.karma_service import KarmaService

router = APIRouter(prefix="/webauthn", tags=["WebAuthn/Passkeys"])


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


def store_challenge_in_session(request: Request, challenge: bytes):
    """Store challenge in session (temporary implementation using cookies)."""
    # TODO: Implement Redis storage for production
    # For now, using session storage
    if not hasattr(request, "session"):
        request.session = {}
    request.session["webauthn_challenge"] = challenge.hex()


def get_challenge_from_session(request: Request) -> Optional[bytes]:
    """Get challenge from session."""
    if hasattr(request, "session") and "webauthn_challenge" in request.session:
        challenge_hex = request.session["webauthn_challenge"]
        del request.session["webauthn_challenge"]  # Single-use
        return bytes.fromhex(challenge_hex)
    return None


# ==================== New User Registration Endpoints (Passwordless) ====================

@router.post(
    "/register-new/options",
    response_model=RegistrationOptionsResponse,
    summary="產生新使用者 Passkey 註冊選項（無密碼註冊）",
    description="為新使用者產生 WebAuthn 註冊選項，用於無密碼註冊流程"
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

        # Store challenge and user info in session
        store_challenge_in_session(request, options.challenge)
        # Store email and name for verification step
        if not hasattr(request, "session"):
            request.session = {}
        request.session["new_user_email"] = body.email
        request.session["new_user_name"] = body.name

        # Convert options to JSON
        options_json = options_to_json(options)

        return RegistrationOptionsResponse(
            options=options_json,
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
    description="驗證新使用者 WebAuthn 註冊回應並建立帳號"
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

    # Get expected challenge from session
    expected_challenge = get_challenge_from_session(request)
    if not expected_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge 已過期或不存在，請重新開始註冊流程"
        )

    # Get stored user info from session
    if not hasattr(request, "session"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="會話資訊遺失，請重新開始註冊流程"
        )

    stored_email = request.session.get("new_user_email")
    stored_name = request.session.get("new_user_name")

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

        # Create tokens
        access_token = create_access_token({"sub": str(user.id), "email": user.email})
        refresh_token = create_refresh_token({"sub": str(user.id), "email": user.email})

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
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
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
        # Generate registration options
        options = service.generate_registration_options(
            user=current_user,
            device_name=body.device_name
        )

        # Store challenge in session
        store_challenge_in_session(request, options.challenge)

        # Convert options to JSON
        options_json = options_to_json(options)

        return RegistrationOptionsResponse(
            options=options_json,
            challenge=options.challenge.hex()
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

    # Get expected challenge from session
    expected_challenge = get_challenge_from_session(request)
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
    description="產生 WebAuthn 認證選項，支援 Email 引導登入和 Usernameless 登入"
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

        # Store challenge in session
        store_challenge_in_session(request, options.challenge)

        # Convert options to JSON
        options_json = options_to_json(options)

        return AuthenticationOptionsResponse(
            options=options_json,
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
    service: WebAuthnService = Depends(get_webauthn_service)
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

    # Get expected challenge from session
    expected_challenge = get_challenge_from_session(request)
    if not expected_challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge 已過期或不存在，請重新開始登入流程"
        )

    try:
        # Verify authentication response
        user, credential = service.verify_authentication_response(
            credential_id=body.credential_id,
            client_data_json=body.client_data_json,
            authenticator_data=body.authenticator_data,
            signature=body.signature,
            expected_challenge=expected_challenge
        )

        # Create tokens
        access_token = create_access_token({"sub": str(user.id), "email": user.email})
        refresh_token = create_refresh_token({"sub": str(user.id), "email": user.email})

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

    except Exception as e:
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

        return DeleteCredentialResponse()

    except CredentialNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except WebAuthnRegistrationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
