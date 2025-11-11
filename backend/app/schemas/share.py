"""
Share Schemas

Pydantic schemas for reading share functionality.
"""

from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class ShareCreateRequest(BaseModel):
    """Request schema for creating a share link"""

    password: Optional[str] = Field(None, description="Optional 4-8 digit password for share protection")

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        """Validate password length if provided"""
        if v is not None:
            if len(v) < 4 or len(v) > 8:
                raise ValueError('密碼必須為 4-8 位數')
        return v


class ShareResponse(BaseModel):
    """Response schema for share link creation"""

    uuid: str = Field(..., description="Public share UUID")
    share_url: str = Field(..., description="Full share URL")
    has_password: bool = Field(..., description="Whether share is password protected")
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
    access_count: int
    is_active: bool
    created_at: datetime
    has_password: bool

    class Config:
        from_attributes = True
