"""
WebAuthn Pydantic 資料結構

WebAuthn/Passkeys API 端點的請求/回應 Schema。

參考：docs/passkeys-architecture.md 第 5.1 節
"""

from typing import Optional, List
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, EmailStr


# ==================== Registration Schemas（註冊 Schema）====================

class NewUserRegistrationOptionsRequest(BaseModel):
    """新使用者註冊選項請求（客戶端 → 伺服器）"""
    email: EmailStr = Field(
        ...,
        description="使用者電子郵件地址"
    )
    name: str = Field(
        ...,
        description="使用者顯示名稱",
        min_length=1,
        max_length=50
    )


class NewUserRegistrationVerificationRequest(BaseModel):
    """驗證新使用者註冊回應的請求（客戶端 → 伺服器）"""
    email: EmailStr = Field(
        ...,
        description="使用者電子郵件地址"
    )
    name: str = Field(
        ...,
        description="使用者顯示名稱",
        min_length=1,
        max_length=50
    )
    credential_id: str = Field(
        ...,
        description="Base64URL 編碼的憑證 ID"
    )
    client_data_json: str = Field(
        ...,
        description="Base64URL 編碼的 clientDataJSON"
    )
    attestation_object: str = Field(
        ...,
        description="Base64URL 編碼的 attestationObject"
    )
    device_name: Optional[str] = Field(
        None,
        description="使用者友善的裝置名稱",
        max_length=100
    )


class NewUserRegistrationResponse(BaseModel):
    """新使用者註冊成功後的回應（伺服器 → 客戶端）"""
    success: bool = Field(True, description="註冊成功狀態")
    access_token: str = Field(..., description="JWT 存取權杖")
    refresh_token: str = Field(..., description="JWT 重新整理權杖")
    user: "UserResponse" = Field(..., description="建立的使用者資訊")
    credential: "CredentialResponse" = Field(..., description="建立的憑證")
    message: str = Field("Passkey 註冊成功，歡迎加入！", description="成功訊息")


# ==================== Registration Schemas ====================

class RegistrationOptionsRequest(BaseModel):
    """Request for registration options (client → server)"""
    device_name: Optional[str] = Field(
        None,
        description="User-friendly device name (e.g., 'MacBook Touch ID')",
        max_length=100
    )


class RegistrationOptionsResponse(BaseModel):
    """Response with registration options (server → client)"""
    options: dict = Field(
        ...,
        description="WebAuthn PublicKeyCredentialCreationOptions (JSON)"
    )
    challenge: str = Field(
        ...,
        description="Base64URL encoded challenge"
    )


class RegistrationVerificationRequest(BaseModel):
    """Request to verify registration response (client → server)"""
    credential_id: str = Field(
        ...,
        description="Base64URL encoded credential ID"
    )
    client_data_json: str = Field(
        ...,
        description="Base64URL encoded clientDataJSON"
    )
    attestation_object: str = Field(
        ...,
        description="Base64URL encoded attestationObject"
    )
    device_name: Optional[str] = Field(
        None,
        description="User-friendly device name",
        max_length=100
    )


class RegistrationVerificationResponse(BaseModel):
    """Response after successful registration (server → client)"""
    success: bool = Field(True, description="Registration success status")
    credential: "CredentialResponse" = Field(
        ...,
        description="Created credential information"
    )
    message: str = Field("Passkey 註冊成功", description="Success message")


# ==================== Authentication Schemas ====================

class AuthenticationOptionsRequest(BaseModel):
    """Request for authentication options (client → server)"""
    email: Optional[str] = Field(
        None,
        description="Email for email-guided login (optional for usernameless)"
    )


class AuthenticationOptionsResponse(BaseModel):
    """Response with authentication options (server → client)"""
    options: dict = Field(
        ...,
        description="WebAuthn PublicKeyCredentialRequestOptions (JSON)"
    )
    challenge: str = Field(
        ...,
        description="Base64URL encoded challenge"
    )


class AuthenticationVerificationRequest(BaseModel):
    """Request to verify authentication response (client → server)"""
    credential_id: str = Field(
        ...,
        description="Base64URL encoded credential ID"
    )
    client_data_json: str = Field(
        ...,
        description="Base64URL encoded clientDataJSON"
    )
    authenticator_data: str = Field(
        ...,
        description="Base64URL encoded authenticatorData"
    )
    signature: str = Field(
        ...,
        description="Base64URL encoded signature"
    )
    user_handle: Optional[str] = Field(
        None,
        description="Base64URL encoded user handle (for usernameless login)"
    )


class AuthenticationVerificationResponse(BaseModel):
    """Response after successful authentication (server → client)"""
    success: bool = Field(True, description="Authentication success status")
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    user: "UserResponse" = Field(..., description="Authenticated user information")
    credential: "CredentialResponse" = Field(
        ...,
        description="Used credential information"
    )
    message: str = Field("Passkey 登入成功", description="Success message")


# ==================== Credential Management Schemas（憑證管理 Schema）====================

class CredentialResponse(BaseModel):
    """憑證資訊回應"""
    id: UUID = Field(..., description="憑證 UUID")
    credential_id: str = Field(..., description="截短的憑證 ID（用於顯示）")
    device_name: Optional[str] = Field(None, description="裝置名稱")
    transports: Optional[List[str]] = Field(None, description="支援的傳輸方式")
    backup_eligible: bool = Field(..., description="是否可備份")
    backup_state: bool = Field(..., description="目前的備份狀態")
    created_at: datetime = Field(..., description="建立時間戳記")
    last_used_at: Optional[datetime] = Field(None, description="最後使用時間戳記")
    is_platform_authenticator: bool = Field(
        ...,
        description="若為平台認證器（例如 Touch ID）則為 True"
    )
    is_roaming_authenticator: bool = Field(
        ...,
        description="若為可攜式認證器（例如安全金鑰）則為 True"
    )

    class Config:
        from_attributes = True


class CredentialListResponse(BaseModel):
    """List of credentials response"""
    credentials: List[CredentialResponse] = Field(
        ...,
        description="List of user's credentials"
    )
    total: int = Field(..., description="Total number of credentials")


class UpdateCredentialNameRequest(BaseModel):
    """Request to update credential name"""
    device_name: str = Field(
        ...,
        description="New device name",
        min_length=1,
        max_length=100
    )


class UpdateCredentialNameResponse(BaseModel):
    """Response after updating credential name"""
    success: bool = Field(True, description="Update success status")
    credential: CredentialResponse = Field(
        ...,
        description="Updated credential information"
    )
    message: str = Field("裝置名稱已更新", description="Success message")


class DeleteCredentialResponse(BaseModel):
    """Response after deleting credential"""
    success: bool = Field(True, description="Delete success status")
    message: str = Field("Passkey 已刪除", description="Success message")


# ==================== User Response Schema ====================

class UserResponse(BaseModel):
    """User information response (for authentication)"""
    id: UUID = Field(..., description="User UUID")
    email: str = Field(..., description="User email")
    name: Optional[str] = Field(None, description="User name")
    is_active: bool = Field(..., description="Account active status")
    is_oauth_user: bool = Field(..., description="OAuth user flag")
    oauth_provider: Optional[str] = Field(None, description="OAuth provider")

    class Config:
        from_attributes = True
