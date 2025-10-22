"""
Wasteland Tarot Card Model - Fallout-themed tarot card representation
"""

from sqlalchemy import Column, String, Integer, Float, Text, JSON, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import validates
from .base import BaseModel
from .story_constants import (
    VALID_FACTIONS,
    TIMELINE_PATTERNS,
    FACTION_VOICE_MAP,
    DEFAULT_VOICES,
)
from typing import List, Dict, Any, Optional
from enum import Enum
import re


class WastelandSuit(str, Enum):
    """Fallout-themed tarot suits"""
    MAJOR_ARCANA = "major_arcana"
    NUKA_COLA_BOTTLES = "nuka_cola_bottles"
    COMBAT_WEAPONS = "combat_weapons"
    BOTTLE_CAPS = "bottle_caps"
    RADIATION_RODS = "radiation_rods"


class KarmaAlignment(str, Enum):
    """Karma alignment affecting interpretations"""
    GOOD = "good"
    NEUTRAL = "neutral"
    EVIL = "evil"


class CharacterVoice(str, Enum):
    """Character interpretation voices - 完整角色列表（涵蓋所有陣營）"""
    # 通用角色
    PIP_BOY = "pip_boy"
    VAULT_DWELLER = "vault_dweller"
    WASTELAND_TRADER = "wasteland_trader"
    CODSWORTH = "codsworth"
    # 廢土生物與掠奪者
    SUPER_MUTANT = "super_mutant"
    GHOUL = "ghoul"
    RAIDER = "raider"
    # 鋼鐵兄弟會
    BROTHERHOOD_SCRIBE = "brotherhood_scribe"
    BROTHERHOOD_PALADIN = "brotherhood_paladin"
    # NCR
    NCR_RANGER = "ncr_ranger"
    # 凱薩軍團
    LEGION_CENTURION = "legion_centurion"
    # Fallout 4 陣營角色
    MINUTEMAN = "minuteman"
    RAILROAD_AGENT = "railroad_agent"
    INSTITUTE_SCIENTIST = "institute_scientist"


class FactionAlignment(str, Enum):
    """Wasteland faction alignments - 完整陣營列表（合併 Fallout 3/4/NV）"""
    # 經典陣營 (Fallout 3/NV)
    VAULT_DWELLER = "vault_dweller"
    BROTHERHOOD = "brotherhood"
    NCR = "ncr"
    LEGION = "legion"
    RAIDERS = "raiders"
    # Fallout 4 陣營
    MINUTEMEN = "minutemen"
    RAILROAD = "railroad"
    INSTITUTE = "institute"
    # 獨立派
    INDEPENDENT = "independent"


class WastelandCard(BaseModel):
    """
    Fallout-themed Tarot Card with radiation mechanics and faction influences
    """

    __tablename__ = "wasteland_cards"

    # Basic Card Information
    name = Column(String(100), nullable=False)
    suit = Column(String(50), nullable=False)
    number = Column(Integer, nullable=True)  # None for Major Arcana

    # Fallout-specific Attributes
    radiation_level = Column(Float, default=0.0)  # 0.0 to 1.0
    threat_level = Column(Integer, default=1)  # 1-10 scale
    vault_number = Column(Integer, nullable=True)  # Associated vault

    # Card Content
    upright_meaning = Column(Text, nullable=False)
    reversed_meaning = Column(Text, nullable=False)

    # Karma-based Interpretations
    good_karma_interpretation = Column(Text)
    neutral_karma_interpretation = Column(Text)
    evil_karma_interpretation = Column(Text)

    # Character Voice Interpretations
    pip_boy_analysis = Column(Text)
    vault_dweller_perspective = Column(Text)
    wasteland_trader_wisdom = Column(Text)
    super_mutant_simplicity = Column(Text)
    codsworth_analysis = Column(Text)

    # Faction Alignments
    brotherhood_significance = Column(Text)
    ncr_significance = Column(Text)
    legion_significance = Column(Text)
    raiders_significance = Column(Text)
    vault_dweller_significance = Column(Text)

    # Visual and Audio Elements
    image_url = Column(String(500))
    image_alt_text = Column(Text)
    background_image_url = Column(String(500))
    audio_cue_url = Column(String(500))
    geiger_sound_intensity = Column(Float, default=0.1)

    # Pip-Boy Scan Results
    pip_boy_scan_data = Column(JSON)  # Contains detection results, stats, etc.

    # Humor and Flavor
    wasteland_humor = Column(Text)
    nuka_cola_reference = Column(Text)
    fallout_easter_egg = Column(Text)

    # Gameplay Mechanics
    affects_luck_stat = Column(Boolean, default=False)
    affects_charisma_stat = Column(Boolean, default=False)
    affects_intelligence_stat = Column(Boolean, default=False)
    special_ability = Column(Text)

    # Card Metadata
    draw_frequency = Column(Integer, default=0)  # How often this card is drawn
    total_appearances = Column(Integer, default=0)
    last_drawn_at = Column(String)  # Timestamp as string

    # Story Mode Fields (Wasteland Story Mode feature)
    story_background = Column(Text, nullable=True)  # 200-500 字故事背景
    story_character = Column(String(100), nullable=True)  # 主要角色名稱
    story_location = Column(String(100), nullable=True)  # 故事發生地點
    story_timeline = Column(String(50), nullable=True)  # 時間線（戰前/戰後/YYYY 年）
    story_faction_involved = Column(JSONB, nullable=True)  # 涉及的陣營列表
    story_related_quest = Column(String(200), nullable=True)  # 相關任務名稱

    def __repr__(self):
        return f"<WastelandCard(name='{self.name}', suit='{self.suit}', radiation={self.radiation_level})>"

    @property
    def description(self) -> str:
        """Get card description (defaults to upright meaning)"""
        return self.upright_meaning

    def get_karma_interpretation(self, karma: KarmaAlignment) -> str:
        """Get interpretation based on karma alignment"""
        if karma == KarmaAlignment.GOOD:
            return self.good_karma_interpretation or self.upright_meaning
        elif karma == KarmaAlignment.EVIL:
            return self.evil_karma_interpretation or self.reversed_meaning
        else:
            return self.neutral_karma_interpretation or self.upright_meaning

    def get_character_voice_interpretation(self, voice: CharacterVoice) -> str:
        """Get interpretation in specific character voice"""
        voice_map = {
            CharacterVoice.PIP_BOY: self.pip_boy_analysis,
            CharacterVoice.VAULT_DWELLER: self.vault_dweller_perspective,
            CharacterVoice.WASTELAND_TRADER: self.wasteland_trader_wisdom,
            CharacterVoice.SUPER_MUTANT: self.super_mutant_simplicity,
            CharacterVoice.CODSWORTH: self.codsworth_analysis
        }
        return voice_map.get(voice) or self.upright_meaning

    def get_faction_significance(self, faction: FactionAlignment) -> str:
        """Get card significance for specific faction"""
        faction_map = {
            FactionAlignment.BROTHERHOOD: self.brotherhood_significance,
            FactionAlignment.NCR: self.ncr_significance,
            FactionAlignment.LEGION: self.legion_significance,
            FactionAlignment.RAIDERS: self.raiders_significance,
            FactionAlignment.VAULT_DWELLER: self.vault_dweller_significance
        }
        return faction_map.get(faction) or self.upright_meaning

    def is_major_arcana(self) -> bool:
        """Check if this is a Major Arcana card"""
        return self.suit == WastelandSuit.MAJOR_ARCANA

    def is_court_card(self) -> bool:
        """Check if this is a court card (11-14 in Minor Arcana)"""
        return (
            not self.is_major_arcana()
            and self.number is not None
            and self.number >= 11
        )

    def get_radiation_influence(self) -> float:
        """Calculate radiation influence on card randomness"""
        return min(1.0, self.radiation_level * 1.5)  # Cap at 1.0

    def get_image_path(self) -> str:
        """Generate standardized image path"""
        if self.is_major_arcana():
            return f"/public/cards/major_arcana/{self.name.lower().replace(' ', '_')}.jpg"
        else:
            suit_name = self.suit.replace('_', '-')
            return f"/public/cards/minor_arcana/{suit_name}/{self.number:02d}_{self.name.lower().replace(' ', '_')}.jpg"

    # Story Mode Validation Methods

    @validates('story_background')
    def validate_story_background(self, key, value):
        """驗證故事背景字數（200-500字）"""
        if value is None:
            return value

        from .story_constants import MIN_STORY_LENGTH, MAX_STORY_LENGTH

        text_length = len(value)
        if text_length < MIN_STORY_LENGTH or text_length > MAX_STORY_LENGTH:
            raise ValueError(
                f"story_background must be between {MIN_STORY_LENGTH}-{MAX_STORY_LENGTH} characters. "
                f"Current length: {text_length}"
            )

        return value

    @validates('story_timeline')
    def validate_story_timeline(self, key, value):
        """驗證時間格式：「戰前」、「戰後」或「YYYY 年」"""
        if value is None:
            return value

        # 使用共用的時間格式模式
        if not any(re.match(pattern, value) for pattern in TIMELINE_PATTERNS):
            raise ValueError(
                f"story_timeline format invalid: '{value}'. "
                f"Must be '戰前', '戰後', or 'YYYY 年' (e.g., '2277 年')"
            )

        return value

    @validates('story_faction_involved')
    def validate_story_faction_involved(self, key, value):
        """驗證陣營列表內容"""
        if value is None:
            return value

        if not isinstance(value, list):
            raise ValueError("story_faction_involved must be a list")

        if len(value) == 0:
            raise ValueError("story_faction_involved cannot be empty")

        # 使用共用的有效陣營列表
        for faction in value:
            if faction not in VALID_FACTIONS:
                raise ValueError(
                    f"story_faction_involved contains invalid faction: '{faction}'. "
                    f"Valid factions: {', '.join(VALID_FACTIONS)}"
                )

        return value

    def get_story_character_voices(self) -> List[str]:
        """根據陣營推導角色語音"""
        voices = []

        if self.story_faction_involved is None or len(self.story_faction_involved) == 0:
            return DEFAULT_VOICES

        # 使用共用的陣營語音映射
        for faction in self.story_faction_involved:
            if faction in FACTION_VOICE_MAP:
                voices.extend(FACTION_VOICE_MAP[faction])

        # 去重並排序
        voices = list(set(voices))
        voices.sort()

        return voices if voices else DEFAULT_VOICES

    def to_dict(self) -> Dict[str, Any]:
        """Convert card to dictionary representation matching WastelandCard schema"""
        return {
            "id": str(self.id),  # Convert UUID to string for Pydantic
            "name": self.name,
            "suit": self.suit,
            "number": self.number,
            "rank": "Jack" if self.number == 11 else "Queen" if self.number == 12 else "King" if self.number == 13 else None,
            "upright_meaning": self.upright_meaning,
            "reversed_meaning": self.reversed_meaning,

            # Wasteland metadata
            "metadata": {
                "radiation_level": self.radiation_level,
                "threat_level": self.threat_level,
                "vault_number": self.vault_number,
            },

            # Karma interpretations
            "good_karma_interpretation": self.good_karma_interpretation,
            "neutral_karma_interpretation": self.neutral_karma_interpretation,
            "evil_karma_interpretation": self.evil_karma_interpretation,

            # Character voices
            "character_voices": {
                "pip_boy_analysis": self.pip_boy_analysis,
                "vault_dweller_perspective": self.vault_dweller_perspective,
                "wasteland_trader_wisdom": self.wasteland_trader_wisdom,
                "super_mutant_simplicity": self.super_mutant_simplicity,
                "codsworth_analysis": self.codsworth_analysis,
            },

            # Faction meanings
            "faction_meanings": {
                "brotherhood_significance": self.brotherhood_significance,
                "ncr_significance": self.ncr_significance,
                "legion_significance": self.legion_significance,
                "raiders_significance": self.raiders_significance,
                "vault_dweller_significance": self.vault_dweller_significance,
            },

            # Visual elements
            "visuals": {
                "image_url": self.image_url,
                "image_alt_text": self.image_alt_text,
                "background_image_url": self.background_image_url,
                "audio_cue_url": self.audio_cue_url,
                "geiger_sound_intensity": self.geiger_sound_intensity,
            },

            # Flavor content
            "wasteland_humor": self.wasteland_humor,
            "nuka_cola_reference": self.nuka_cola_reference,
            "fallout_easter_egg": self.fallout_easter_egg,

            # Gameplay mechanics
            "affects_luck_stat": self.affects_luck_stat,
            "affects_charisma_stat": self.affects_charisma_stat,
            "affects_intelligence_stat": self.affects_intelligence_stat,
            "special_ability": self.special_ability,

            # Statistics
            "stats": {
                "draw_frequency": self.draw_frequency,
                "total_appearances": self.total_appearances,
                "last_drawn_at": self.last_drawn_at,
            },

            # Computed properties (handle both method and attribute cases)
            "is_major_arcana": self.is_major_arcana() if callable(self.is_major_arcana) else self.is_major_arcana,
            "is_court_card": self.is_court_card() if callable(self.is_court_card) else self.is_court_card
        }