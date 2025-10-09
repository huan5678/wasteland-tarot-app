"""
占卜會話儲存/恢復功能的 Pydantic 資料結構

這些 Schema 處理占卜會話儲存/恢復功能的驗證與序列化，
包含離線同步與衝突解決。
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime
import re


# Task 2.1: SessionCreateSchema
class SessionCreateSchema(BaseModel):
    """
    建立新占卜會話的 Schema

    驗證建立新的未完成占卜會話時的使用者輸入，
    該會話可被儲存並稍後恢復。
    """
    user_id: str = Field(
        ...,
        min_length=36,
        max_length=36,
        description="建立會話的使用者 UUID"
    )
    spread_type: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="塔羅牌陣類型（例如：'three-card'、'celtic-cross'）"
    )
    spread_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="牌陣佈局的選用配置"
    )
    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="使用者的問題或占卜意圖"
    )
    session_state: Dict[str, Any] = Field(
        ...,
        description="會話的當前狀態（已抽取的卡牌、位置等）"
    )
    status: Literal["active", "paused", "complete"] = Field(
        default="active",
        description="會話的當前狀態"
    )

    @field_validator('user_id')
    @classmethod
    def validate_user_id(cls, v: str) -> str:
        """驗證 user_id 是否為有效的 UUID 格式"""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        if not uuid_pattern.match(v):
            raise ValueError('user_id must be a valid UUID')
        return v

    @field_validator('question')
    @classmethod
    def sanitize_question(cls, v: str) -> str:
        """移除問題文字前後空白"""
        return v.strip()

    @field_validator('session_state')
    @classmethod
    def validate_session_state(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        """驗證 session_state 包含必要欄位"""
        if not isinstance(v, dict):
            raise ValueError('session_state 必須是字典')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "spread_type": "three-card",
                "spread_config": {"positions": ["past", "present", "future"]},
                "question": "What should I focus on today?",
                "session_state": {
                    "cards_drawn": ["the-fool", "the-magician"],
                    "current_position": 2,
                    "total_positions": 3
                },
                "status": "active"
            }
        }


# Task 2.2: SessionUpdateSchema
class SessionUpdateSchema(BaseModel):
    """
    Schema for updating an existing reading session.

    All fields are optional to support partial updates.
    Includes sanitization validators for text fields.
    """
    spread_type: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
        description="Type of tarot spread"
    )
    spread_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Spread configuration"
    )
    question: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=1000,
        description="User's question"
    )
    session_state: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Session state"
    )
    status: Optional[Literal["active", "paused", "complete"]] = Field(
        default=None,
        description="Session status"
    )
    last_accessed_at: Optional[datetime] = Field(
        default=None,
        description="Timestamp of last access"
    )

    @field_validator('question')
    @classmethod
    def sanitize_question(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize question text by stripping whitespace."""
        if v is not None:
            return v.strip()
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "session_state": {
                    "cards_drawn": ["the-fool", "the-magician", "the-empress"],
                    "current_position": 3,
                    "total_positions": 3
                },
                "status": "paused",
                "last_accessed_at": "2025-10-01T14:30:00Z"
            }
        }


# Task 2.3: SessionResponseSchema
class SessionResponseSchema(BaseModel):
    """
    Schema for API responses containing session data.

    Includes all session fields plus timestamps for complete client representation.
    """
    id: str = Field(..., description="Session UUID")
    user_id: str = Field(..., description="User UUID")
    spread_type: str = Field(..., description="Spread type")
    spread_config: Optional[Dict[str, Any]] = Field(default=None, description="Spread configuration")
    question: str = Field(..., description="User's question")
    session_state: Dict[str, Any] = Field(..., description="Session state")
    status: str = Field(..., description="Session status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    last_accessed_at: Optional[datetime] = Field(default=None, description="Last access timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174001",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "spread_type": "three-card",
                "spread_config": {"positions": ["past", "present", "future"]},
                "question": "What should I focus on today?",
                "session_state": {
                    "cards_drawn": ["the-fool", "the-magician", "the-empress"],
                    "current_position": 3,
                    "total_positions": 3
                },
                "status": "paused",
                "created_at": "2025-10-01T14:00:00Z",
                "updated_at": "2025-10-01T14:30:00Z",
                "last_accessed_at": "2025-10-01T14:30:00Z"
            }
        }


# Task 2.4: SessionMetadataSchema
class SessionMetadataSchema(BaseModel):
    """
    Lightweight schema for session list responses.

    Contains only essential metadata for efficient list operations,
    excluding large fields like session_state and spread_config.
    """
    id: str = Field(..., description="Session UUID")
    user_id: str = Field(..., description="User UUID")
    spread_type: str = Field(..., description="Spread type")
    question: str = Field(..., description="User's question")
    status: str = Field(..., description="Session status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    last_accessed_at: Optional[datetime] = Field(default=None, description="Last access timestamp")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174001",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "spread_type": "three-card",
                "question": "What should I focus on today?",
                "status": "paused",
                "created_at": "2025-10-01T14:00:00Z",
                "updated_at": "2025-10-01T14:30:00Z",
                "last_accessed_at": "2025-10-01T14:30:00Z"
            }
        }


# Task 2.5: OfflineSessionSchema
class OfflineSessionSchema(BaseModel):
    """
    Schema for offline session sync requests.

    Supports offline-first architecture by allowing clients to sync
    sessions created while offline, including temporary client-side IDs.
    """
    client_id: str = Field(
        ...,
        description="Temporary client-side UUID for ID remapping"
    )
    user_id: str = Field(..., description="User UUID")
    spread_type: str = Field(..., description="Spread type")
    spread_config: Optional[Dict[str, Any]] = Field(default=None, description="Spread configuration")
    question: str = Field(..., description="User's question")
    session_state: Dict[str, Any] = Field(..., description="Session state")
    status: Literal["active", "paused", "complete"] = Field(..., description="Session status")
    created_at: datetime = Field(..., description="Client-side creation timestamp")
    updated_at: datetime = Field(..., description="Client-side update timestamp")

    @field_validator('user_id', 'client_id')
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        """Validate UUID format."""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        if not uuid_pattern.match(v):
            raise ValueError(f'{v} must be a valid UUID')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "client_id": "temp-123e4567-e89b-12d3-a456-426614174099",
                "user_id": "123e4567-e89b-12d3-a456-426614174000",
                "spread_type": "celtic-cross",
                "question": "What lies ahead in my career?",
                "session_state": {
                    "cards_drawn": ["the-tower", "the-star"],
                    "current_position": 2,
                    "total_positions": 10
                },
                "status": "active",
                "created_at": "2025-10-01T10:00:00Z",
                "updated_at": "2025-10-01T10:15:00Z"
            }
        }


# Task 2.6: ConflictResolutionSchema and ConflictInfoSchema
class ConflictInfoSchema(BaseModel):
    """
    Schema for conflict information in sync responses.

    Provides details about detected conflicts including timestamps
    and conflicting field values.
    """
    field: str = Field(..., description="Name of the conflicting field")
    server_value: Any = Field(..., description="Current server value")
    client_value: Any = Field(..., description="Client's attempted value")
    server_updated_at: datetime = Field(..., description="Server's last update timestamp")
    client_updated_at: datetime = Field(..., description="Client's update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "field": "session_state",
                "server_value": {"cards_drawn": ["the-fool", "the-magician", "the-empress"]},
                "client_value": {"cards_drawn": ["the-fool", "the-magician"]},
                "server_updated_at": "2025-10-01T14:35:00Z",
                "client_updated_at": "2025-10-01T14:30:00Z"
            }
        }


class ConflictResolutionSchema(BaseModel):
    """
    Schema for conflict resolution requests.

    Allows clients to specify resolution strategy when conflicts are detected
    during offline sync operations.
    """
    session_id: str = Field(..., description="Server-side session UUID")
    strategy: Literal["last-write-wins", "server-wins", "client-wins"] = Field(
        ...,
        description="Conflict resolution strategy to apply"
    )
    conflicts: List[ConflictInfoSchema] = Field(
        ...,
        description="List of detected conflicts"
    )
    client_data: OfflineSessionSchema = Field(
        ...,
        description="Client's session data for resolution"
    )

    @field_validator('session_id')
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        """Validate session_id is a valid UUID."""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        if not uuid_pattern.match(v):
            raise ValueError('session_id must be a valid UUID')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "123e4567-e89b-12d3-a456-426614174001",
                "strategy": "last-write-wins",
                "conflicts": [
                    {
                        "field": "session_state",
                        "server_value": {"cards_drawn": ["the-fool", "the-magician", "the-empress"]},
                        "client_value": {"cards_drawn": ["the-fool", "the-magician"]},
                        "server_updated_at": "2025-10-01T14:35:00Z",
                        "client_updated_at": "2025-10-01T14:30:00Z"
                    }
                ],
                "client_data": {
                    "client_id": "temp-123e4567-e89b-12d3-a456-426614174099",
                    "user_id": "123e4567-e89b-12d3-a456-426614174000",
                    "spread_type": "three-card",
                    "question": "What should I focus on?",
                    "session_state": {"cards_drawn": ["the-fool", "the-magician"]},
                    "status": "active",
                    "created_at": "2025-10-01T14:00:00Z",
                    "updated_at": "2025-10-01T14:30:00Z"
                }
            }
        }
