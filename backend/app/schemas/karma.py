"""
Pydantic schemas for Gamification Karma System
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class KarmaSummaryResponse(BaseModel):
    """Karma 總覽響應."""

    total_karma: int = Field(..., description="總 Karma", ge=0)
    current_level: int = Field(..., description="當前等級", ge=1)
    karma_to_next_level: int = Field(..., description="到下一級所需 Karma", ge=0)
    rank: Optional[int] = Field(None, description="全服排名")
    today_earned: int = Field(..., description="今日獲得 Karma", ge=0)
    level_title: str = Field(..., description="等級稱號")

    class Config:
        json_schema_extra = {
            "example": {
                "total_karma": 1250,
                "current_level": 3,
                "karma_to_next_level": 250,
                "rank": 42,
                "today_earned": 35,
                "level_title": "廢土流浪者"
            }
        }


class KarmaLogResponse(BaseModel):
    """Karma 記錄響應."""

    id: str = Field(..., description="記錄 ID")
    action_type: str = Field(..., description="行為類型")
    karma_amount: int = Field(..., description="Karma 數量", gt=0)
    description: str = Field(..., description="描述")
    created_at: str = Field(..., description="記錄時間 (ISO 8601)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="額外資訊")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "uuid",
                "action_type": "complete_reading",
                "karma_amount": 10,
                "description": "完成占卜",
                "created_at": "2025-01-04T10:30:00Z",
                "metadata": {"reading_id": "uuid"}
            }
        }


class PaginationInfo(BaseModel):
    """分頁資訊."""

    page: int = Field(..., description="當前頁碼", ge=1)
    limit: int = Field(..., description="每頁數量", ge=1)
    total: int = Field(..., description="總記錄數", ge=0)
    total_pages: int = Field(..., description="總頁數", ge=1)

    class Config:
        json_schema_extra = {
            "example": {
                "page": 1,
                "limit": 20,
                "total": 150,
                "total_pages": 8
            }
        }


class KarmaLogsListResponse(BaseModel):
    """Karma 記錄列表響應."""

    logs: List[KarmaLogResponse] = Field(..., description="Karma 記錄列表")
    pagination: PaginationInfo = Field(..., description="分頁資訊")

    class Config:
        json_schema_extra = {
            "example": {
                "logs": [
                    {
                        "id": "uuid",
                        "action_type": "complete_reading",
                        "karma_amount": 10,
                        "description": "完成占卜",
                        "created_at": "2025-01-04T10:30:00Z",
                        "metadata": {"reading_id": "uuid"}
                    }
                ],
                "pagination": {
                    "page": 1,
                    "limit": 20,
                    "total": 150,
                    "total_pages": 8
                }
            }
        }


class GrantKarmaRequest(BaseModel):
    """授予 Karma 請求（內部 API）."""

    user_id: str = Field(..., description="用戶 ID")
    action_type: str = Field(..., description="行為類型")
    karma_amount: int = Field(..., description="Karma 數量", gt=0)
    description: Optional[str] = Field(None, description="描述")
    metadata: Optional[Dict[str, Any]] = Field(None, description="額外資訊")


class GrantKarmaResponse(BaseModel):
    """授予 Karma 響應."""

    success: bool = Field(..., description="是否成功")
    total_karma: int = Field(..., description="總 Karma")
    level_changed: bool = Field(..., description="等級是否變化")
    new_level: int = Field(..., description="新等級")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "total_karma": 1260,
                "level_changed": False,
                "new_level": 3
            }
        }
