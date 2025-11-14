"""
Share Schemas

Pydantic schemas for reading share functionality.
"""

from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List


class ShareCreateRequest(BaseModel):
    """Request schema for creating a share link"""

    require_password: bool = Field(False, description="Whether to require password protection")
    password: Optional[str] = Field(None, description="Optional 4-8 digit password for share protection")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str], info) -> Optional[str]:
        """Validate password length if provided"""
        if v is not None:
            if len(v) < 4 or len(v) > 8:
                raise ValueError('密碼長度必須為 4-8 位數')

        # Check if password required but not provided
        data = info.data
        if data.get('require_password') and not v:
            raise ValueError('密碼保護已啟用但未提供密碼')

        return v


class ShareResponse(BaseModel):
    """Response schema for share link creation"""

    uuid: str = Field(..., description="Public share UUID")
    url: str = Field(..., description="Full share URL")
    require_password: bool = Field(..., description="Whether share is password protected")
    access_count: int = Field(..., description="Number of times share has been accessed")
    created_at: datetime = Field(..., description="Share creation timestamp")
    is_active: bool = Field(..., description="Whether share link is active")

    class Config:
        from_attributes = True


class ShareViewRequest(BaseModel):
    """Request schema for viewing a password-protected share"""

    password: Optional[str] = Field(None, description="Password if share is protected")


class ShareListItem(BaseModel):
    """Schema for individual share in list"""

    uuid: str
    url: str
    access_count: int
    is_active: bool
    created_at: datetime
    has_password: bool

    class Config:
        from_attributes = True


class ShareListResponse(BaseModel):
    """Response schema for list of shares"""

    shares: List[ShareListItem]
