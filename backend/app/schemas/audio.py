"""
Audio API Schemas - 故事音檔生成請求與回應
提供故事音檔 API 的資料驗證與序列化模型
"""

from typing import List, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


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
