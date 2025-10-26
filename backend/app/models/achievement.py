"""
Achievement System Models - Wasteland Tarot Gamification
成就系統資料模型：追蹤使用者成就、進度與獎勵
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Index, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Dict, Any, Optional
from datetime import datetime
from enum import Enum
from .base import BaseModel


class AchievementCategory(str, Enum):
    """成就類別列舉"""
    READING = "READING"          # 占卜相關
    SOCIAL = "SOCIAL"            # 社交互動
    BINGO = "BINGO"              # Bingo 活動
    KARMA = "KARMA"              # Karma 相關
    EXPLORATION = "EXPLORATION"  # 探索行為


class AchievementRarity(str, Enum):
    """成就稀有度列舉"""
    COMMON = "COMMON"        # 普通
    RARE = "RARE"            # 稀有
    EPIC = "EPIC"            # 史詩
    LEGENDARY = "LEGENDARY"  # 傳說


class AchievementStatus(str, Enum):
    """成就狀態列舉"""
    IN_PROGRESS = "IN_PROGRESS"  # 進行中
    UNLOCKED = "UNLOCKED"        # 已解鎖
    CLAIMED = "CLAIMED"          # 已領取


class Achievement(BaseModel):
    """
    成就定義資料表
    儲存所有可解鎖的成就及其條件、獎勵等資訊
    """

    __tablename__ = "achievements"

    # 基本資訊
    code = Column(String(100), unique=True, nullable=False, index=True)  # 唯一識別碼
    name_zh_tw = Column(String(200), nullable=False)  # 成就名稱（繁體中文）
    description_zh_tw = Column(Text, nullable=False)  # 成就描述

    # 分類與稀有度
    category = Column(String(50), nullable=False, index=True)  # 成就類別
    rarity = Column(String(50), nullable=False, default=AchievementRarity.COMMON.value)  # 稀有度

    # 視覺呈現
    icon_name = Column(String(100), nullable=False)  # PixelIcon 圖示名稱
    icon_image_url = Column(String(500), nullable=True)  # 成就圖示圖檔路徑（選填）

    # 解鎖條件 (JSON 格式)
    # 範例: {"type": "READING_COUNT", "target": 10, "filters": {"spread_type": "CELTIC_CROSS"}}
    criteria = Column(JSONB, nullable=False)

    # 獎勵 (JSON 格式)
    # 範例: {"karma_points": 100, "title": "占卜大師"}
    rewards = Column(JSONB, nullable=False)

    # 特殊屬性
    is_hidden = Column(Boolean, default=False)  # 是否為隱藏成就（解鎖前不可見）
    is_active = Column(Boolean, default=True)   # 是否啟用（可用於臨時停用某些成就）

    # 顯示順序
    display_order = Column(Integer, default=0)  # 用於排序顯示

    # 關聯
    user_progress = relationship("UserAchievementProgress", back_populates="achievement", cascade="all, delete-orphan")

    # 索引
    __table_args__ = (
        Index('idx_achievement_category', 'category'),
        Index('idx_achievement_rarity', 'rarity'),
        Index('idx_achievement_is_active', 'is_active'),
        CheckConstraint(
            "category IN ('READING', 'SOCIAL', 'BINGO', 'KARMA', 'EXPLORATION')",
            name='check_achievement_category'
        ),
        CheckConstraint(
            "rarity IN ('COMMON', 'RARE', 'EPIC', 'LEGENDARY')",
            name='check_achievement_rarity'
        ),
    )

    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典格式"""
        return {
            'id': str(self.id),
            'code': self.code,
            'name': self.name_zh_tw,
            'description': self.description_zh_tw,
            'category': self.category,
            'rarity': self.rarity,
            'icon_name': self.icon_name,
            'icon_image_url': self.icon_image_url,
            'criteria': self.criteria,
            'rewards': self.rewards,
            'is_hidden': self.is_hidden,
            'is_active': self.is_active,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class UserAchievementProgress(BaseModel):
    """
    使用者成就進度資料表
    追蹤每位使用者對各成就的進度與狀態
    """

    __tablename__ = "user_achievement_progress"

    # 關聯
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    achievement_id = Column(UUID(as_uuid=True), ForeignKey('achievements.id', ondelete='CASCADE'), nullable=False, index=True)

    # 進度追蹤
    current_progress = Column(Integer, default=0, nullable=False)  # 當前進度
    target_progress = Column(Integer, nullable=False)              # 目標進度（從 achievement.criteria 計算）

    # 狀態
    status = Column(String(50), default=AchievementStatus.IN_PROGRESS.value, nullable=False, index=True)

    # 時間戳記
    unlocked_at = Column(DateTime(timezone=True), nullable=True)  # 解鎖時間
    claimed_at = Column(DateTime(timezone=True), nullable=True)   # 領取獎勵時間

    # 關聯
    achievement = relationship("Achievement", back_populates="user_progress")

    # 索引
    __table_args__ = (
        Index('idx_user_achievement_user_id', 'user_id'),
        Index('idx_user_achievement_achievement_id', 'achievement_id'),
        Index('idx_user_achievement_status', 'status'),
        Index('idx_user_achievement_user_status', 'user_id', 'status'),  # 複合索引
        Index('idx_user_achievement_unlocked_at', 'unlocked_at'),
        CheckConstraint(
            "status IN ('IN_PROGRESS', 'UNLOCKED', 'CLAIMED')",
            name='check_user_achievement_status'
        ),
        CheckConstraint(
            'current_progress >= 0',
            name='check_current_progress_non_negative'
        ),
        CheckConstraint(
            'target_progress > 0',
            name='check_target_progress_positive'
        ),
    )

    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典格式"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'achievement_id': str(self.achievement_id),
            'current_progress': self.current_progress,
            'target_progress': self.target_progress,
            'status': self.status,
            'unlocked_at': self.unlocked_at.isoformat() if self.unlocked_at else None,
            'claimed_at': self.claimed_at.isoformat() if self.claimed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'progress_percentage': round((self.current_progress / self.target_progress) * 100, 2) if self.target_progress > 0 else 0
        }

    @property
    def is_completed(self) -> bool:
        """檢查成就是否已完成（達到目標進度）"""
        return self.current_progress >= self.target_progress

    @property
    def progress_percentage(self) -> float:
        """計算進度百分比"""
        if self.target_progress <= 0:
            return 0.0
        return round((self.current_progress / self.target_progress) * 100, 2)
