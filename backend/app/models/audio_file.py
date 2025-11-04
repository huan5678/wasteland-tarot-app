"""
Audio File Model - TTS 音檔追蹤與管理
用於儲存 Google Cloud TTS 生成的音檔元資料
"""

from sqlalchemy import Column, String, Integer, Float, Text, Boolean, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSON
from .base import BaseModel
from typing import Optional, Dict, Any
import enum


class AudioType(str, enum.Enum):
    """音檔類型"""
    STATIC_CARD = "static_card"           # 靜態卡牌解讀
    DYNAMIC_READING = "dynamic_reading"   # 動態牌組解讀
    AI_RESPONSE = "ai_response"           # AI 回答 & 故事/測試音檔


class GenerationStatus(str, enum.Enum):
    """生成狀態"""
    PENDING = "pending"           # 等待生成
    PROCESSING = "processing"     # 生成中
    COMPLETED = "completed"       # 已完成
    FAILED = "failed"             # 失敗


class AudioFile(BaseModel):
    """
    TTS 音檔追蹤模型

    功能：
    1. 追蹤所有生成的音檔（靜態 + 動態）
    2. 支援文字 hash 去重（相同文字+角色只生成一次）
    3. 追蹤訪問次數（熱門音檔識別）
    4. 錯誤追蹤與重試

    Attributes:
        card_id: 卡牌 ID（靜態解讀用，可為 NULL）
        character_id: 角色 ID（外鍵至 characters）
        storage_path: Supabase storage 路徑
        storage_url: 公開 URL
        file_size: 檔案大小（位元組）
        duration_seconds: 音檔長度（秒）
        text_length: 原始文字長度（字元數）
        text_hash: 文字 SHA256 hash（去重用）
        language_code: 語言代碼（zh-TW, zh-CN, en-US）
        voice_name: Google TTS 語音名稱
        ssml_params: SSML 參數（JSON: {pitch, rate, volume}）
        audio_type: 音檔類型
        generation_status: 生成狀態
        error_message: 錯誤訊息（失敗時）
        access_count: 訪問次數（熱門度）
    """

    __tablename__ = "audio_files"

    # 關聯 IDs（靜態解讀用）
    card_id = Column(
        UUID(as_uuid=True),
        ForeignKey('wasteland_cards.id', ondelete='CASCADE'),
        nullable=True,  # 動態解讀沒有 card_id
        index=True
    )
    character_id = Column(
        UUID(as_uuid=True),
        ForeignKey('characters.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # Supabase Storage 資訊
    storage_path = Column(String(500), nullable=False, unique=True)
    storage_url = Column(String(1000), nullable=False)

    # 音檔元資料
    file_size = Column(Integer, nullable=False)  # 位元組
    duration_seconds = Column(Float, nullable=False)  # 秒
    text_length = Column(Integer, nullable=False)  # 字元數

    # 文字去重（用於動態 TTS）
    text_hash = Column(
        String(64),  # SHA256 hash
        nullable=False,
        index=True
    )

    # TTS 配置
    language_code = Column(String(10), nullable=False, default="zh-TW")
    voice_name = Column(String(50), nullable=False)
    ssml_params = Column(JSON, nullable=True)  # {pitch: -10, rate: 0.8, volume: 1.0}

    # 音檔類型與狀態
    audio_type = Column(
        SQLEnum(AudioType, name='audio_type_enum', create_type=True),
        nullable=False,
        default=AudioType.STATIC_CARD,
        index=True
    )
    generation_status = Column(
        SQLEnum(GenerationStatus, name='generation_status_enum', create_type=True),
        nullable=False,
        default=GenerationStatus.PENDING,
        index=True
    )

    # 錯誤追蹤
    error_message = Column(Text, nullable=True)

    # 訪問追蹤（熱門度）
    access_count = Column(Integer, default=0, nullable=False, index=True)

    # Relationships
    # card relationship (optional, for static card interpretations)
    # character relationship (from character_voice.py)

    # Indexes for efficient queries
    __table_args__ = (
        # 靜態卡牌解讀查詢（card_id + character_id）
        Index(
            'idx_audio_card_character',
            'card_id',
            'character_id',
            unique=True,
            postgresql_where=(card_id.isnot(None))
        ),
        # 動態 TTS 查詢（text_hash + character_id）
        Index(
            'idx_audio_text_hash_character',
            'text_hash',
            'character_id'
        ),
        # 熱門音檔查詢（access_count DESC）
        Index(
            'idx_audio_access_count',
            'access_count',
            postgresql_using='btree',
            postgresql_ops={'access_count': 'DESC'}
        ),
        # 失敗音檔查詢（需要重試）
        Index(
            'idx_audio_failed',
            'generation_status',
            postgresql_where=(generation_status == GenerationStatus.FAILED)
        ),
    )

    def __repr__(self):
        return f"<AudioFile(id={self.id}, type={self.audio_type}, status={self.generation_status})>"

    def increment_access_count(self) -> None:
        """增加訪問計數"""
        self.access_count += 1

    def mark_completed(self, storage_url: str, file_size: int, duration: float) -> None:
        """標記為已完成"""
        self.storage_url = storage_url
        self.file_size = file_size
        self.duration_seconds = duration
        self.generation_status = GenerationStatus.COMPLETED
        self.error_message = None

    def mark_failed(self, error: str) -> None:
        """標記為失敗"""
        self.generation_status = GenerationStatus.FAILED
        self.error_message = error

    def is_completed(self) -> bool:
        """檢查是否已完成"""
        return self.generation_status == GenerationStatus.COMPLETED

    def is_hot_audio(self, threshold: int = 100) -> bool:
        """檢查是否為熱門音檔"""
        return self.access_count >= threshold

    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        return {
            'id': str(self.id),
            'card_id': str(self.card_id) if self.card_id else None,
            'character_id': str(self.character_id),
            'storage_path': self.storage_path,
            'storage_url': self.storage_url,
            'file_size': self.file_size,
            'duration_seconds': self.duration_seconds,
            'text_length': self.text_length,
            'text_hash': self.text_hash,
            'language_code': self.language_code,
            'voice_name': self.voice_name,
            'ssml_params': self.ssml_params,
            'audio_type': self.audio_type.value,
            'generation_status': self.generation_status.value,
            'error_message': self.error_message,
            'access_count': self.access_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
