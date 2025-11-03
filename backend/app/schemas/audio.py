"""
Audio API Schemas - 故事音檔生成請求與回應
提供故事音檔 API 的資料驗證與序列化模型
"""

from typing import List, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
import re


class GenerateStoryAudioRequest(BaseModel):
    """
    生成故事音檔請求 Schema

    用於觸發故事音檔生成
    """

    card_id: UUID = Field(
        ...,
        description="卡牌 ID（UUID 格式）",
        example="123e4567-e89b-12d3-a456-426614174000"
    )

    character_keys: List[str] = Field(
        ...,
        description="要生成的角色語音列表（角色 key 列表）",
        min_length=1,
        max_length=3,
        example=["brotherhood_scribe", "ncr_ranger"]
    )

    force_regenerate: bool = Field(
        default=False,
        description="強制重新生成音檔（即使已存在）"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "card_id": "123e4567-e89b-12d3-a456-426614174000",
                "character_keys": ["brotherhood_scribe", "ncr_ranger"],
                "force_regenerate": False
            }
        }
    )


class GenerateStoryAudioResponse(BaseModel):
    """
    生成故事音檔回應 Schema

    返回生成的音檔 URL 與快取狀態
    """

    card_id: UUID = Field(
        ...,
        description="卡牌 ID"
    )

    audio_urls: Dict[str, str] = Field(
        ...,
        description="音檔 URL 對應表（角色 key -> URL）",
        example={
            "brotherhood_scribe": "https://storage.supabase.co/story/card-001/brotherhood_scribe.mp3",
            "ncr_ranger": "https://storage.supabase.co/story/card-001/ncr_ranger.mp3"
        }
    )

    cached: Dict[str, bool] = Field(
        ...,
        description="快取狀態（角色 key -> 是否為快取）",
        example={
            "brotherhood_scribe": True,
            "ncr_ranger": False
        }
    )

    generated_at: datetime = Field(
        ...,
        description="生成時間（ISO 8601 格式）"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "card_id": "123e4567-e89b-12d3-a456-426614174000",
                "audio_urls": {
                    "brotherhood_scribe": "https://storage.supabase.co/story/card-001/brotherhood_scribe.mp3",
                    "ncr_ranger": "https://storage.supabase.co/story/card-001/ncr_ranger.mp3"
                },
                "cached": {
                    "brotherhood_scribe": True,
                    "ncr_ranger": False
                },
                "generated_at": "2025-10-22T10:30:00Z"
            }
        }
    )


class GetStoryAudioResponse(BaseModel):
    """
    取得故事音檔 URL 回應 Schema

    返回指定卡牌的所有音檔 URL
    """

    card_id: UUID = Field(
        ...,
        description="卡牌 ID"
    )

    audio_urls: Dict[str, str] = Field(
        ...,
        description="音檔 URL 對應表（角色 key -> URL）",
        example={
            "pip_boy": "https://storage.supabase.co/story/card-001/pip_boy.mp3",
            "vault_dweller": "https://storage.supabase.co/story/card-001/vault_dweller.mp3"
        }
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "card_id": "123e4567-e89b-12d3-a456-426614174000",
                "audio_urls": {
                    "pip_boy": "https://storage.supabase.co/story/card-001/pip_boy.mp3",
                    "vault_dweller": "https://storage.supabase.co/story/card-001/vault_dweller.mp3"
                }
            }
        }
    )


# ============================================================================
# Chirp 3:HD TTS Schemas (Task 2.4, 2.5)
# ============================================================================

class CustomPronunciation(BaseModel):
    """
    自訂發音覆寫 Schema

    用於指定特定詞彙的 IPA 發音，特別適用於專有名詞、技術術語等。
    """
    phrase: str = Field(..., description="要覆寫的文字（例如：'Pip-Boy', 'Tarot'）")
    pronunciation: str = Field(..., description="IPA 音標發音（例如：'pɪp bɔɪ', 'ˈtæ.roʊ'）")
    phonetic_encoding: str = Field(
        default="PHONETIC_ENCODING_IPA",
        description="音標編碼類型（目前僅支援 IPA）"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "phrase": "Pip-Boy",
                "pronunciation": "pɪp bɔɪ",
                "phonetic_encoding": "PHONETIC_ENCODING_IPA"
            }
        }
    )


class Pause(BaseModel):
    """
    暫停控制 Schema

    用於在語音合成中插入自訂暫停，增強戲劇效果。
    """
    position: int = Field(..., ge=0, description="文字中的字元位置（從 0 開始）")
    duration: str = Field(
        ...,
        description="暫停時長：'short'、'medium'、'long' 或數字格式（如 '500ms'）",
        pattern="^(short|medium|long|\\d+ms)$"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "position": 10,
                "duration": "medium"
            }
        }
    )

    @field_validator("duration")
    @classmethod
    def validate_duration(cls, v: str) -> str:
        """驗證暫停時長格式"""
        if v in ["short", "medium", "long"]:
            return v
        if re.match(r"^\d+ms$", v):
            return v
        raise ValueError("duration must be 'short', 'medium', 'long', or '{number}ms' format")


class VoiceControlParams(BaseModel):
    """
    語音控制參數 Schema

    用於在運行時覆寫預設的語音參數，支援音高、語速、音量調整和自訂暫停。
    """
    pitch: Optional[float] = Field(
        None,
        ge=-20.0,
        le=20.0,
        description="音高調整（半音）：-20 到 +20（預設：使用角色預設值）"
    )
    rate: Optional[float] = Field(
        None,
        ge=0.25,
        le=4.0,
        description="語速倍率：0.25 到 4.0（預設：使用角色預設值）"
    )
    volume: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="音量：0.0 到 1.0（預設：1.0）"
    )
    pauses: Optional[List[Pause]] = Field(
        None,
        description="自訂暫停位置列表（預設：無）"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pitch": 5.0,
                "rate": 1.2,
                "volume": 1.0,
                "pauses": [
                    {"position": 10, "duration": "medium"},
                    {"position": 25, "duration": "500ms"}
                ]
            }
        }
    )
