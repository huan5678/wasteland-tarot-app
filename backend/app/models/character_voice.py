"""
Character Voice System Models - Normalized character and faction system
角色聲音系統模型 - 正規化的角色與陣營系統
"""

from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel
from typing import Optional, List


class Character(BaseModel):
    """
    角色定義模型 - 儲存所有可用的角色聲音資訊

    Attributes:
        key: 角色唯一識別碼 (如 pip_boy, vault_dweller)
        name: 角色顯示名稱
        description: 角色描述
        personality: 角色性格特點
        voice_style: 角色說話風格
        theme_color: 角色主題顏色 (HEX)
        icon_name: 圖示名稱
        is_active: 是否啟用
        sort_order: 排序順序
    """

    __tablename__ = "characters"

    __table_args__ = {'extend_existing': True}

    key = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    personality = Column(String(200), nullable=True)
    voice_style = Column(Text, nullable=True)
    theme_color = Column(String(7), nullable=True)
    icon_name = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    sort_order = Column(Integer, default=0, nullable=False, index=True)

    # AI Configuration Fields
    ai_system_prompt = Column(Text, nullable=True)
    ai_tone_description = Column(String(200), nullable=True)
    ai_prompt_config = Column(JSON, nullable=True)

    # Relationships
    interpretations = relationship(
        "CardInterpretation",
        back_populates="character",
        cascade="all, delete-orphan"
    )
    faction_associations = relationship(
        "FactionCharacter",
        back_populates="character",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Character(key={self.key}, name={self.name})>"

    def to_dict(self):
        """Convert to dictionary, excluding relationships"""
        return {
            'id': str(self.id),
            'key': self.key,
            'name': self.name,
            'description': self.description,
            'personality': self.personality,
            'voice_style': self.voice_style,
            'theme_color': self.theme_color,
            'icon_name': self.icon_name,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'ai_system_prompt': self.ai_system_prompt,
            'ai_tone_description': self.ai_tone_description,
            'ai_prompt_config': self.ai_prompt_config,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Faction(BaseModel):
    """
    陣營定義模型 - 儲存所有可用的陣營資訊

    Attributes:
        key: 陣營唯一識別碼 (如 vault_dweller, brotherhood)
        name: 陣營顯示名稱
        description: 陣營描述
        alignment: 陣營傾向 (如 lawful_good, chaotic_neutral)
        icon_name: 圖示名稱
        theme_color: 陣營主題顏色 (HEX)
        is_active: 是否啟用
        sort_order: 排序順序
    """

    __tablename__ = "factions"

    __table_args__ = {'extend_existing': True}

    key = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    alignment = Column(String(20), nullable=True)
    icon_name = Column(String(50), nullable=True)
    theme_color = Column(String(7), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    sort_order = Column(Integer, default=0, nullable=False, index=True)

    # AI Style Configuration
    ai_style_config = Column(JSON, nullable=True)

    # Relationships
    character_associations = relationship(
        "FactionCharacter",
        back_populates="faction",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Faction(key={self.key}, name={self.name})>"

    def to_dict(self):
        """Convert to dictionary, excluding relationships"""
        return {
            'id': str(self.id),
            'key': self.key,
            'name': self.name,
            'description': self.description,
            'alignment': self.alignment,
            'icon_name': self.icon_name,
            'theme_color': self.theme_color,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'ai_style_config': self.ai_style_config,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class FactionCharacter(BaseModel):
    """
    陣營-角色關聯模型 - 定義每個陣營可以使用哪些角色聲音

    Attributes:
        faction_id: 陣營 ID
        character_id: 角色 ID
        priority: 角色在該陣營中的優先順序 (數字越小優先級越高)
    """

    __tablename__ = "faction_characters"

    __table_args__ = {'extend_existing': True}

    faction_id = Column(
        UUID(as_uuid=True),
        ForeignKey('factions.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    character_id = Column(
        UUID(as_uuid=True),
        ForeignKey('characters.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    priority = Column(Integer, default=0, nullable=False, index=True)

    # Relationships
    faction = relationship("Faction", back_populates="character_associations")
    character = relationship("Character", back_populates="faction_associations")

    # Note: updated_at is not needed for this junction table
    # Remove it to match the migration schema
    updated_at = None

    def __repr__(self):
        return f"<FactionCharacter(faction_id={self.faction_id}, character_id={self.character_id}, priority={self.priority})>"

    def to_dict(self):
        """Convert to dictionary, excluding relationships"""
        return {
            'id': str(self.id),
            'faction_id': str(self.faction_id),
            'character_id': str(self.character_id),
            'priority': self.priority,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class CardInterpretation(BaseModel):
    """
    卡牌角色解讀模型 - 儲存每張卡牌的各個角色解讀內容

    Attributes:
        card_id: 卡牌 ID (外鍵至 wasteland_cards)
        character_id: 角色 ID (外鍵至 characters)
        interpretation_text: 解讀文字內容
        is_active: 是否啟用
    """

    __tablename__ = "card_interpretations"

    __table_args__ = {'extend_existing': True}

    card_id = Column(
        UUID(as_uuid=True),
        ForeignKey('wasteland_cards.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    character_id = Column(
        UUID(as_uuid=True),
        ForeignKey('characters.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    interpretation_text = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Relationships
    card = relationship("WastelandCard", back_populates="interpretations")
    character = relationship("Character", back_populates="interpretations")

    def __repr__(self):
        return f"<CardInterpretation(card_id={self.card_id}, character_id={self.character_id})>"

    def to_dict(self):
        """Convert to dictionary, excluding relationships"""
        return {
            'id': str(self.id),
            'card_id': str(self.card_id),
            'character_id': str(self.character_id),
            'interpretation_text': self.interpretation_text,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
