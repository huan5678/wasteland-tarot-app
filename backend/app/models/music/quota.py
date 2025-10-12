"""User AI quota data models."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UserAIQuota(BaseModel):
    """使用者 AI 配額模型"""

    user_id: UUID = Field(description="使用者 ID")
    monthly_quota: int = Field(description="每月配額上限")
    used_quota: int = Field(description="本月已使用次數")
    last_reset_at: datetime = Field(description="上次重置時間")
    created_at: datetime = Field(description="建立時間")
    updated_at: datetime = Field(description="最後更新時間")

    class Config:
        from_attributes = True


class QuotaResponse(BaseModel):
    """配額查詢 API 回應模型"""

    monthly_quota: int = Field(description="每月配額上限")
    used_quota: int = Field(description="本月已使用次數")
    remaining: int = Field(description="剩餘配額")
    last_reset_at: datetime = Field(description="上次重置時間")

    @classmethod
    def from_quota(cls, quota: UserAIQuota) -> "QuotaResponse":
        """從 UserAIQuota 建立回應模型"""
        return cls(
            monthly_quota=quota.monthly_quota,
            used_quota=quota.used_quota,
            remaining=max(0, quota.monthly_quota - quota.used_quota),
            last_reset_at=quota.last_reset_at,
        )
