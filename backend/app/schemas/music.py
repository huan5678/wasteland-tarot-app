"""
Music system Pydantic schemas
音樂系統 Pydantic 資料驗證模型
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class Pattern(BaseModel):
    """
    16 步驟節奏 Pattern
    每個軌道包含 16 個布林值，true 表示該步驟啟用
    """
    kick: List[bool] = Field(..., min_length=16, max_length=16, description="Kick Drum 軌道 (16 步驟)")
    snare: List[bool] = Field(..., min_length=16, max_length=16, description="Snare Drum 軌道 (16 步驟)")
    hihat: List[bool] = Field(..., min_length=16, max_length=16, description="Hi-Hat 軌道 (16 步驟)")
    openhat: List[bool] = Field(..., min_length=16, max_length=16, description="Open Hi-Hat 軌道 (16 步驟)")
    clap: List[bool] = Field(..., min_length=16, max_length=16, description="Clap 軌道 (16 步驟)")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "kick": [True, False, False, False, True, False, False, False, True, False, False, False, True, False, False, False],
            "snare": [False, False, False, False, True, False, False, False, False, False, False, False, True, False, False, False],
            "hihat": [False, False, True, False, False, False, True, False, False, False, True, False, False, False, True, False],
            "openhat": [False, False, False, False, False, False, False, False, False, False, False, False, False, False, False, True],
            "clap": [False, False, False, False, True, False, False, False, False, False, False, False, True, False, False, False]
        }
    })


class PresetCreate(BaseModel):
    """建立 Preset 請求 (Task 2.1)"""
    name: str = Field(..., min_length=1, max_length=50, description="Preset 名稱")
    description: Optional[str] = Field(None, max_length=200, description="描述（可選）")
    pattern: Pattern = Field(..., description="16 步驟節奏 Pattern")
    is_public: bool = Field(False, description="是否公開分享（預設：私密）")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "name": "我的 Techno Mix",
            "description": "強勁的 Techno 節奏，適合深夜聆聽",
            "pattern": {
                "kick": [True, False, False, False, True, False, False, False, True, False, False, False, True, False, False, False],
                "snare": [False, False, False, False, True, False, False, False, False, False, False, False, True, False, False, False],
                "hihat": [False, False, True, False, False, False, True, False, False, False, True, False, False, False, True, False],
                "openhat": [False, False, False, False, False, False, False, False, False, False, False, False, False, False, False, True],
                "clap": [False, False, False, False, True, False, False, False, False, False, False, False, True, False, False, False]
            },
            "is_public": True
        }
    })


class PresetUpdate(BaseModel):
    """更新 Preset 請求 (Task 2.1)"""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="Preset 名稱")
    description: Optional[str] = Field(None, max_length=200, description="描述")
    pattern: Optional[Pattern] = Field(None, description="16 步驟節奏 Pattern")
    is_public: Optional[bool] = Field(None, description="是否公開分享")


class PresetResponse(BaseModel):
    """Preset 回傳格式 (Task 2.1)"""
    id: str = Field(..., description="Preset UUID")
    name: str = Field(..., description="Preset 名稱")
    description: Optional[str] = Field(None, description="描述")
    pattern: Pattern = Field(..., description="16 步驟節奏 Pattern")
    is_public: bool = Field(..., description="是否公開分享")
    is_system_preset: bool = Field(..., description="是否為系統預設")
    user_id: Optional[str] = Field(None, description="擁有者 UUID（系統預設為 null）")
    created_at: datetime = Field(..., description="建立時間")
    updated_at: datetime = Field(..., description="更新時間")

    model_config = ConfigDict(from_attributes=True)


class PublicPresetResponse(PresetResponse):
    """公開歌曲回傳格式（含創作者名稱）(Task 2.2)"""
    creator_name: Optional[str] = Field(None, description="創作者名稱")
    creator_email: Optional[str] = Field(None, description="創作者 Email")


class PublicPresetsResponse(BaseModel):
    """公開歌曲列表回傳格式 (Task 2.2)"""
    system_presets: List[PresetResponse] = Field(..., description="系統預設歌曲（5 首）")
    public_presets: List[PublicPresetResponse] = Field(..., description="公開使用者創作歌曲")
    pagination: dict = Field(..., description="分頁資訊")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "system_presets": [],
            "public_presets": [],
            "pagination": {
                "page": 1,
                "limit": 20,
                "total": 45,
                "total_pages": 3
            }
        }
    })


class BatchGetPatternsRequest(BaseModel):
    """批次獲取 Pattern 詳情請求 (Task 2.3)"""
    pattern_ids: List[str] = Field(..., min_length=1, max_length=50, description="Pattern UUID 列表（最多 50 個）")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "pattern_ids": [
                "uuid-techno-preset",
                "uuid-house-preset",
                "uuid-user-pattern-1"
            ]
        }
    })


class BatchGetPatternsResponse(BaseModel):
    """批次獲取 Pattern 詳情回傳 (Task 2.3)"""
    patterns: List[PresetResponse] = Field(..., description="Pattern 列表")
    invalid_ids: List[str] = Field([], description="無效的 Pattern ID 列表")


class PlaylistCreate(BaseModel):
    """建立播放清單請求 (Task 2.4)"""
    name: str = Field(..., min_length=1, max_length=100, description="播放清單名稱")
    description: Optional[str] = Field(None, max_length=500, description="描述（可選）")


class PlaylistUpdate(BaseModel):
    """更新播放清單請求 (Task 2.4)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="播放清單名稱")
    description: Optional[str] = Field(None, max_length=500, description="描述")


class PlaylistPatternResponse(BaseModel):
    """播放清單中的 Pattern 資訊"""
    pattern_id: str = Field(..., description="Pattern UUID")
    position: int = Field(..., description="順序位置（0-based）")
    pattern: Optional[PresetResponse] = Field(None, description="Pattern 詳細資訊（JOIN 查詢時包含）")


class PlaylistResponse(BaseModel):
    """播放清單回傳格式 (Task 2.4)"""
    id: str = Field(..., description="播放清單 UUID")
    name: str = Field(..., description="播放清單名稱")
    description: Optional[str] = Field(None, description="描述")
    user_id: str = Field(..., description="擁有者 UUID")
    patterns: List[PlaylistPatternResponse] = Field([], description="播放清單中的 Patterns")
    created_at: datetime = Field(..., description="建立時間")
    updated_at: datetime = Field(..., description="更新時間")

    model_config = ConfigDict(from_attributes=True)


class AddPatternRequest(BaseModel):
    """加入 Pattern 到播放清單請求 (Task 2.5)"""
    pattern_id: str = Field(..., description="Pattern UUID")


class UpdatePatternPositionRequest(BaseModel):
    """調整 Pattern 順序請求 (Task 2.5)"""
    new_position: int = Field(..., ge=0, description="新的順序位置（0-based）")


class GuestPlaylistPattern(BaseModel):
    """訪客播放清單中的 Pattern"""
    pattern_id: str = Field(..., description="Pattern UUID")
    position: int = Field(..., description="順序位置（0-based）")


class ImportGuestPlaylistRequest(BaseModel):
    """匯入訪客播放清單請求 (Task 2.6)"""
    patterns: List[GuestPlaylistPattern] = Field(..., min_length=1, max_length=4, description="訪客播放清單 Patterns（上限 4 首）")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "patterns": [
                {"pattern_id": "uuid-techno-preset", "position": 0},
                {"pattern_id": "uuid-house-preset", "position": 1}
            ]
        }
    })


class ImportGuestPlaylistResponse(BaseModel):
    """匯入訪客播放清單回傳 (Task 2.6)"""
    playlist_id: str = Field(..., description="新建立的播放清單 UUID")
    pattern_count: int = Field(..., description="成功匯入的 Pattern 數量")
    invalid_pattern_ids: List[str] = Field([], description="無效的 Pattern ID 列表")


class AIGenerateRhythmRequest(BaseModel):
    """AI 生成節奏請求 (Task 2.7)"""
    prompt: str = Field(..., min_length=1, max_length=200, description="生成提示（最多 200 字元）")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "prompt": "Create a dark and heavy industrial techno beat with aggressive kick drums"
        }
    })


class AIGenerateRhythmResponse(BaseModel):
    """AI 生成節奏回傳 (Task 2.7)"""
    pattern: Pattern = Field(..., description="生成的 16 步驟 Pattern")
    quota_remaining: int = Field(..., description="剩餘配額")


class QuotaResponse(BaseModel):
    """配額查詢回傳 (Task 2.8)"""
    quota_limit: int = Field(20, description="配額上限")
    quota_used: int = Field(..., description="已使用配額")
    quota_remaining: int = Field(..., description="剩餘配額")
    reset_at: datetime = Field(..., description="配額重置時間")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "quota_limit": 20,
            "quota_used": 15,
            "quota_remaining": 5,
            "reset_at": "2025-10-14T00:00:00Z"
        }
    })


class ErrorResponse(BaseModel):
    """錯誤回傳格式"""
    error: str = Field(..., description="錯誤類型")
    message: str = Field(..., description="錯誤訊息")
    details: Optional[dict] = Field(None, description="詳細資訊")


class QuotaExceededResponse(ErrorResponse):
    """配額用盡錯誤回傳 (Task 2.7)"""
    quota_limit: int = Field(..., description="配額上限")
    quota_used: int = Field(..., description="已使用配額")
    reset_at: datetime = Field(..., description="配額重置時間")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "error": "Daily quota exceeded",
            "message": "今日 AI 生成配額已用完（20/20），明日重置",
            "quota_limit": 20,
            "quota_used": 20,
            "reset_at": "2025-10-14T00:00:00Z"
        }
    })
