"""Music track data models."""

from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class MusicParameters(BaseModel):
    """
    音樂參數模型（由 LLM 解析生成）

    Attributes:
        key: 調性 (C, D, E, F, G, A, B)
        mode: 模式 (major, minor)
        tempo: 速度 (60-180 BPM)
        timbre: 音色 (sine, square, sawtooth, triangle)
        genre: 風格標籤列表 (例如: ambient, synthwave, lofi, industrial)
        mood: 情緒標籤列表 (例如: mysterious, energetic, calm, dark)
    """

    key: Literal["C", "D", "E", "F", "G", "A", "B"] = Field(
        description="調性",
    )
    mode: Literal["major", "minor"] = Field(
        description="模式 (大調/小調)",
    )
    tempo: int = Field(
        ge=60,
        le=180,
        description="速度 (BPM)",
    )
    timbre: Literal["sine", "square", "sawtooth", "triangle"] = Field(
        description="音色波形",
    )
    genre: List[str] = Field(
        default_factory=list,
        description="風格標籤",
        max_length=5,
    )
    mood: List[str] = Field(
        default_factory=list,
        description="情緒標籤",
        max_length=5,
    )

    @field_validator("genre", "mood")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """驗證標籤不為空字串"""
        return [tag.strip() for tag in v if tag.strip()]


class MusicTrackBase(BaseModel):
    """音樂軌道基礎模型"""

    title: str = Field(
        min_length=1,
        max_length=100,
        description="音樂標題",
    )
    prompt: Optional[str] = Field(
        default=None,
        max_length=500,
        description="生成 prompt（系統音樂無此欄位）",
    )
    parameters: MusicParameters = Field(
        description="音樂參數",
    )
    audio_data: str = Field(
        description="序列化的 Web Audio API 參數",
    )
    duration: int = Field(
        default=0,
        ge=0,
        description="音樂時長（秒）",
    )
    is_public: bool = Field(
        default=False,
        description="是否公開分享",
    )


class MusicTrackCreate(MusicTrackBase):
    """建立音樂軌道請求模型"""

    pass


class MusicTrackUpdate(BaseModel):
    """更新音樂軌道請求模型"""

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    is_public: Optional[bool] = None


class MusicTrack(MusicTrackBase):
    """音樂軌道資料庫模型"""

    id: UUID = Field(description="音樂 ID")
    user_id: Optional[UUID] = Field(description="擁有者 ID (NULL 表示系統音樂)")
    is_system: bool = Field(description="系統預設音樂標記")
    play_count: int = Field(default=0, description="播放次數")
    created_at: datetime = Field(description="建立時間")
    updated_at: datetime = Field(description="最後更新時間")

    class Config:
        from_attributes = True


class MusicTrackResponse(MusicTrack):
    """音樂軌道 API 回應模型"""

    pass


class MusicListResponse(BaseModel):
    """音樂清單 API 回應模型（含分頁）"""

    data: List[MusicTrackResponse] = Field(description="音樂清單")
    pagination: dict = Field(
        description="分頁資訊",
        example={
            "page": 1,
            "limit": 20,
            "total": 100,
            "total_pages": 5,
        }
    )
