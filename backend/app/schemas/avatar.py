"""
頭像上傳相關的 Pydantic schemas

定義頭像上傳的請求和回應資料結構
"""

from typing import Optional
from pydantic import BaseModel, Field, validator


class AvatarUploadResponse(BaseModel):
    """頭像上傳成功回應"""
    avatar_url: str = Field(..., description="上傳後的頭像 URL")
    message: str = Field(default="頭像上傳成功", description="回應訊息")

    class Config:
        json_schema_extra = {
            "example": {
                "avatar_url": "https://example.supabase.co/storage/v1/object/public/avatars/uuid.jpg",
                "message": "頭像上傳成功"
            }
        }


class UserResponse(BaseModel):
    """使用者資料回應"""
    id: str
    email: str
    name: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    oauth_provider: Optional[str] = None
    profile_picture_url: Optional[str] = None
    faction_alignment: Optional[str] = None
    karma_score: int = 50
    is_active: bool = True
    is_verified: bool = False
    is_premium: bool = False

    class Config:
        from_attributes = True  # Pydantic v2 用於取代 orm_mode
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "name": "John Doe",
                "display_name": "John",
                "avatar_url": "https://example.supabase.co/storage/v1/object/public/avatars/uuid.jpg",
                "oauth_provider": "google",
                "profile_picture_url": "https://lh3.googleusercontent.com/...",
                "faction_alignment": "independent",
                "karma_score": 50,
                "is_active": True,
                "is_verified": False,
                "is_premium": False
            }
        }


class AvatarUploadError(BaseModel):
    """頭像上傳錯誤回應"""
    error: str = Field(..., description="錯誤類型")
    message: str = Field(..., description="錯誤訊息")
    detail: Optional[str] = Field(None, description="詳細錯誤資訊")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "invalid_file_type",
                "message": "不支援的檔案類型",
                "detail": "只接受 JPEG, PNG, WebP, GIF 格式的圖片"
            }
        }
