"""
Enhanced Reading Models - Comprehensive reading system for Wasteland Tarot
Includes spread templates, interpretation templates, card positions, and synergies
"""

from sqlalchemy import Column, String, Integer, Float, Text, JSON, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import List, Dict, Any, Optional
from enum import Enum as PyEnum
from datetime import datetime
from .base import BaseModel
from .wasteland_card import CharacterVoice, KarmaAlignment, FactionAlignment


class SpreadType(str, PyEnum):
    """Available spread types in the Wasteland Tarot system"""
    SINGLE_WASTELAND = "single_wasteland"  # 單卡廢土占卜（1張）
    VAULT_TEC_SPREAD = "vault_tec_spread"  # 避難所科技三牌陣（3張）
    RAIDER_CHAOS = "raider_chaos"  # 掠奪者混沌陣（4張）
    WASTELAND_SURVIVAL = "wasteland_survival"  # 廢土生存五牌陣（5張）
    NCR_STRATEGIC = "ncr_strategic"  # NCR戰略陣（6張）
    BROTHERHOOD_COUNCIL = "brotherhood_council"  # 兄弟會議會（7張）
    CELTIC_CROSS = "celtic_cross"  # 十字路口抉擇陣（10張）


class InterpretationStyle(str, PyEnum):
    """Interpretation styles available"""
    DETAILED_ANALYSIS = "detailed_analysis"
    QUICK_INSIGHT = "quick_insight"
    STORY_NARRATIVE = "story_narrative"
    TACTICAL_BRIEFING = "tactical_briefing"
    HUMOROUS_TAKE = "humorous_take"


class CardSynergyType(str, PyEnum):
    """Types of card synergies"""
    AMPLIFICATION = "amplification"  # Cards strengthen each other
    CONTRADICTION = "contradiction"  # Cards oppose each other
    COMPLEMENTARY = "complementary"  # Cards complete each other
    SEQUENTIAL = "sequential"  # Cards follow a progression
    THEMATIC = "thematic"  # Cards share common themes


class AchievementType(str, PyEnum):
    """Types of achievements users can earn"""
    READING_COUNT = "reading_count"
    CONSECUTIVE_DAYS = "consecutive_days"
    RARE_CARDS = "rare_cards"
    SOCIAL = "social"
    ACCURACY = "accuracy"
    EXPLORATION = "exploration"


class SpreadTemplate(BaseModel):
    """
    Flexible divination method definitions for different reading styles
    """

    __tablename__ = "spread_templates"

    # Basic Template Info
    name = Column(String(100), nullable=False)
    display_name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    spread_type = Column(String(50), nullable=False)

    # Template Configuration
    card_count = Column(Integer, nullable=False)
    positions = Column(JSON, nullable=False)  # Array of position definitions
    interpretation_guide = Column(Text)
    difficulty_level = Column(String(20), default="beginner")  # beginner, intermediate, advanced

    # Wasteland-specific Attributes
    faction_preference = Column(String(50))  # Which faction prefers this spread
    radiation_sensitivity = Column(Float, default=0.5)  # How much radiation affects this spread
    vault_origin = Column(Integer)  # Which vault this spread originated from

    # Visual and Experience
    background_theme = Column(String(100))
    audio_ambience = Column(String(200))
    pip_boy_interface = Column(JSON)  # Pip-Boy specific UI configuration

    # Usage Statistics
    usage_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    last_used = Column(DateTime(timezone=True))

    # Metadata
    is_active = Column(Boolean, default=True)
    is_premium = Column(Boolean, default=False)
    created_by = Column(String)  # User ID who created custom spreads

    def get_position_meanings(self) -> List[Dict[str, Any]]:
        """Get detailed meanings for each position in the spread"""
        return self.positions or []

    def calculate_complexity(self) -> str:
        """Calculate spread complexity based on card count and features"""
        if self.card_count <= 3:
            return "simple"
        elif self.card_count <= 7:
            return "moderate"
        else:
            return "complex"

    def is_suitable_for_karma(self, karma: KarmaAlignment) -> bool:
        """Check if spread is suitable for user's karma alignment"""
        # Different spreads might work better with different karma alignments
        karma_preferences = {
            KarmaAlignment.GOOD: ["vault_tec_spread", "brotherhood_council"],
            KarmaAlignment.NEUTRAL: ["single_wasteland", "wasteland_survival"],
            KarmaAlignment.EVIL: ["raider_chaos", "wasteland_survival"]
        }
        return self.spread_type in karma_preferences.get(karma, [self.spread_type])

    def to_dict(self) -> Dict[str, Any]:
        """Convert spread template to dictionary"""
        return {
            "id": str(self.id),  # Convert UUID to string
            "name": self.name,
            "display_name": self.display_name,
            "description": self.description,
            "spread_type": self.spread_type,
            "card_count": self.card_count,
            "positions": self.positions,
            "interpretation_guide": self.interpretation_guide,
            "difficulty_level": self.difficulty_level,
            "faction_preference": self.faction_preference,
            "radiation_sensitivity": self.radiation_sensitivity,
            "vault_origin": self.vault_origin,
            "background_theme": self.background_theme,
            "audio_ambience": self.audio_ambience,
            "pip_boy_interface": self.pip_boy_interface,
            "usage_count": self.usage_count,
            "average_rating": self.average_rating,
            "last_used": self.last_used,
            "is_active": self.is_active,
            "is_premium": self.is_premium,
            "created_by": getattr(self, 'created_by', None),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "complexity": self.calculate_complexity(),
            "estimated_duration": self.card_count * 2 + 5,  # Rough estimate in minutes
            "reading_tips": None  # Optional field, not stored in DB
        }


class InterpretationTemplate(BaseModel):
    """
    Character voice templates with personality traits for consistent interpretations
    """

    __tablename__ = "interpretation_templates"

    # Character Information
    character_voice = Column(String(50), nullable=False)
    character_name = Column(String(100))
    personality_traits = Column(JSON, nullable=False)  # List of personality characteristics

    # Voice Characteristics
    tone = Column(String(50))  # analytical, humorous, wise, etc.
    vocabulary_style = Column(String(50))  # technical, simple, poetic, etc.
    speaking_patterns = Column(JSON)  # Common phrases, sentence structures

    # Response Templates
    greeting_templates = Column(JSON)  # How this character starts readings
    card_interpretation_templates = Column(JSON)  # Templates for card interpretations
    conclusion_templates = Column(JSON)  # How this character ends readings

    # Fallout-specific Elements
    faction_alignment = Column(String(50))
    technical_expertise = Column(JSON)  # Areas of expertise
    humor_style = Column(String(50))  # wasteland, sarcastic, wholesome, etc.
    fallout_references = Column(JSON)  # Common references this character makes

    # Customization
    custom_phrases = Column(JSON, default=list)  # User-added custom phrases
    response_length = Column(String(20), default="medium")  # short, medium, long
    detail_level = Column(String(20), default="balanced")  # minimal, balanced, detailed

    # Metadata
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    user_ratings = Column(JSON, default=list)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())

    def get_average_rating(self) -> float:
        """Calculate average user rating for this character voice"""
        if not self.user_ratings:
            return 0.0
        return sum(self.user_ratings) / len(self.user_ratings)

    def get_random_greeting(self) -> str:
        """Get a random greeting template for this character"""
        if not self.greeting_templates:
            return f"{self.character_name}: Let's see what the wasteland has in store..."
        import random
        return random.choice(self.greeting_templates)

    def generate_interpretation(self, card_data: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Generate interpretation based on character voice and card data"""
        # This would contain the logic for generating character-specific interpretations
        base_interpretation = card_data.get('upright_meaning', '')
        character_style = self.tone

        # Apply character-specific modifications
        if self.character_voice == CharacterVoice.PIP_BOY.value:
            return f"Data analysis complete: {base_interpretation}"
        elif self.character_voice == CharacterVoice.SUPER_MUTANT.value:
            return f"BIG WORDS MEAN: {base_interpretation.upper()}"
        else:
            return base_interpretation

    def to_dict(self) -> Dict[str, Any]:
        """Convert interpretation template to dictionary"""
        return {
            "id": self.id,
            "character_voice": self.character_voice,
            "character_name": self.character_name,
            "personality_traits": self.personality_traits,
            "tone": self.tone,
            "vocabulary_style": self.vocabulary_style,
            "speaking_patterns": self.speaking_patterns,
            "greeting_templates": self.greeting_templates,
            "card_interpretation_templates": self.card_interpretation_templates,
            "conclusion_templates": self.conclusion_templates,
            "faction_alignment": self.faction_alignment,
            "technical_expertise": self.technical_expertise,
            "humor_style": self.humor_style,
            "fallout_references": self.fallout_references,
            "custom_phrases": self.custom_phrases,
            "response_length": self.response_length,
            "detail_level": self.detail_level,
            "is_active": self.is_active,
            "usage_count": self.usage_count,
            "average_rating": self.get_average_rating(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class CompletedReading(BaseModel):
    """
    Enhanced reading tracking with privacy controls and comprehensive metadata

    This model represents COMPLETED readings with full interpretation and social features.
    Uses the 'completed_readings' table to store finalized readings with interpretations.
    """

    __tablename__ = "completed_readings"

    # Basic Reading Information
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    spread_template_id = Column(UUID(as_uuid=True), ForeignKey("spread_templates.id"), index=True)
    interpretation_template_id = Column(UUID(as_uuid=True), ForeignKey("interpretation_templates.id"), index=True)

    # Reading Content
    question = Column(Text, nullable=False)
    focus_area = Column(String(100))  # career, relationships, health, etc.
    context_notes = Column(Text)  # Additional context provided by user

    # Session Configuration
    character_voice_used = Column(String(50), nullable=False)
    karma_context = Column(String(20), nullable=False)
    faction_influence = Column(String(50))
    radiation_factor = Column(Float, default=0.5)

    # Results and Interpretation
    overall_interpretation = Column(Text)
    summary_message = Column(Text)
    prediction_confidence = Column(Float)  # 0.0 to 1.0
    energy_reading = Column(JSON)  # Emotional/energy analysis

    # Session Metadata
    session_duration = Column(Integer)  # seconds
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    location = Column(String(100))  # Virtual location in wasteland
    mood_before = Column(String(50))
    mood_after = Column(String(50))

    # Privacy and Sharing
    privacy_level = Column(String(20), default="private")  # private, friends, public
    allow_public_sharing = Column(Boolean, default=False)
    is_favorite = Column(Boolean, default=False)  # user favorite flag
    share_with_friends = Column(Boolean, default=False)
    anonymous_sharing = Column(Boolean, default=False)
    shared_with_users = Column(JSON, default=list)

    # User Feedback and Analytics
    user_satisfaction = Column(Integer)  # 1-5 rating
    accuracy_rating = Column(Integer)  # 1-5 rating how accurate it felt
    helpful_rating = Column(Integer)  # 1-5 rating how helpful it was
    user_feedback = Column(Text)

    # Social Features
    likes_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)

    # AI Interpretation Tracking
    ai_interpretation_requested = Column(Boolean, default=False, nullable=False)
    ai_interpretation_at = Column(DateTime(timezone=True), nullable=True)
    ai_interpretation_provider = Column(String(50), nullable=True)  # "openai", "anthropic", etc.
    interpretation_audio_url = Column(Text, nullable=True)  # TTS audio URL for AI interpretation

    # Share Link Feature
    share_token = Column(UUID(as_uuid=True), nullable=True, unique=True, index=True)  # Unique token for sharing

    # Relationships
    user = relationship("User", back_populates="readings")
    spread_template = relationship("SpreadTemplate")
    interpretation_template = relationship("InterpretationTemplate")
    card_positions = relationship("ReadingCardPosition", back_populates="completed_reading")
    journals = relationship("ReadingJournal", back_populates="reading", cascade="all, delete-orphan")

    def calculate_total_duration(self) -> int:
        """Calculate reading duration in seconds"""
        if self.start_time and self.end_time:
            delta = self.end_time - self.start_time
            return int(delta.total_seconds())
        return self.session_duration or 0

    def is_accessible_to_user(self, user_id: str) -> bool:
        """Check if reading is accessible to specific user"""
        if user_id == self.user_id:
            return True
        if self.privacy_level == "public":
            return True
        if self.privacy_level == "friends" and self.share_with_friends:
            # Would need to check friendship status
            return True
        return user_id in self.shared_with_users

    def get_overall_rating(self) -> float:
        """Calculate overall rating from multiple feedback metrics"""
        ratings = [r for r in [self.user_satisfaction, self.accuracy_rating, self.helpful_rating] if r is not None]
        return sum(ratings) / len(ratings) if ratings else 0.0

    def generate_share_token(self):
        """
        Generate and set a unique share token for this reading.

        This method is idempotent - if a share_token already exists, it will be returned.
        If no token exists, a new UUID v4 will be generated.

        Returns:
            UUID: The generated or existing share token

        Example:
            >>> reading = CompletedReading()
            >>> token1 = reading.generate_share_token()
            >>> token2 = reading.generate_share_token()
            >>> assert token1 == token2  # Idempotent
        """
        import uuid
        if not self.share_token:
            self.share_token = uuid.uuid4()
        return self.share_token

    def to_dict(self) -> Dict[str, Any]:
        """Convert reading session to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question": self.question,
            "focus_area": self.focus_area,
            "character_voice_used": self.character_voice_used,
            "karma_context": self.karma_context,
            "faction_influence": self.faction_influence,
            "radiation_factor": self.radiation_factor,
            "overall_interpretation": self.overall_interpretation,
            "summary_message": self.summary_message,
            "prediction_confidence": self.prediction_confidence,
            "energy_reading": self.energy_reading,
            "session_duration": self.calculate_total_duration(),
            "location": self.location,
            "mood_before": self.mood_before,
            "mood_after": self.mood_after,
            "privacy_level": self.privacy_level,
            "user_satisfaction": self.user_satisfaction,
            "accuracy_rating": self.accuracy_rating,
            "helpful_rating": self.helpful_rating,
            "overall_rating": self.get_overall_rating(),
            "likes_count": self.likes_count,
            "shares_count": self.shares_count,
            "comments_count": self.comments_count,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ReadingCardPosition(BaseModel):
    """
    Normalized card positions within readings for flexible spread layouts
    """

    __tablename__ = "reading_card_positions"

    # Reading and Card References
    completed_reading_id = Column(UUID(as_uuid=True), ForeignKey("completed_readings.id"), nullable=False, index=True)
    card_id = Column(UUID(as_uuid=True), ForeignKey("wasteland_cards.id"), nullable=False, index=True)

    # Position Information
    position_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    position_name = Column(String(100))  # "Past", "Present", "Future", etc.
    position_meaning = Column(Text)  # What this position represents

    # Card State in Reading
    is_reversed = Column(Boolean, default=False)
    draw_order = Column(Integer)  # Order in which card was drawn
    radiation_influence = Column(Float, default=0.0)  # Radiation effect on this card

    # Interpretation for this Position
    position_interpretation = Column(Text)  # Interpretation specific to this position
    card_significance = Column(Text)  # Why this card is significant here
    connection_to_question = Column(Text)  # How this position relates to the question

    # Visual and Experience
    visual_effects = Column(JSON)  # Special visual effects for this card
    audio_cue = Column(String(200))  # Sound effect when card is revealed
    reveal_delay = Column(Float, default=0.0)  # Delay before revealing this card

    # Analytics
    user_resonance = Column(Integer)  # 1-5 how much user connected with this card
    interpretation_confidence = Column(Float)  # AI confidence in interpretation

    # Relationships
    completed_reading = relationship("CompletedReading", back_populates="card_positions")
    card = relationship("WastelandCard")

    def get_effective_meaning(self) -> str:
        """Get the meaning considering if card is reversed"""
        if hasattr(self.card, 'upright_meaning') and hasattr(self.card, 'reversed_meaning'):
            return self.card.reversed_meaning if self.is_reversed else self.card.upright_meaning
        return self.position_interpretation or ""

    def calculate_position_strength(self) -> float:
        """Calculate how strong this card's influence is in this position"""
        base_strength = 1.0
        if self.radiation_influence > 0:
            base_strength += self.radiation_influence * 0.5
        if self.user_resonance:
            base_strength += (self.user_resonance - 3) * 0.2  # Normalize around 3
        return min(2.0, max(0.1, base_strength))  # Clamp between 0.1 and 2.0

    def to_dict(self) -> Dict[str, Any]:
        """Convert card position to dictionary"""
        return {
            "id": self.id,
            "completed_reading_id": self.completed_reading_id,
            "card_id": self.card_id,
            "position_number": self.position_number,
            "position_name": self.position_name,
            "position_meaning": self.position_meaning,
            "is_reversed": self.is_reversed,
            "draw_order": self.draw_order,
            "radiation_influence": self.radiation_influence,
            "position_interpretation": self.position_interpretation,
            "card_significance": self.card_significance,
            "connection_to_question": self.connection_to_question,
            "effective_meaning": self.get_effective_meaning(),
            "position_strength": self.calculate_position_strength(),
            "user_resonance": self.user_resonance,
            "interpretation_confidence": self.interpretation_confidence,
            "visual_effects": self.visual_effects,
            "audio_cue": self.audio_cue,
            "reveal_delay": self.reveal_delay
        }


class CardSynergy(BaseModel):
    """
    Card combination relationships with strength ratings
    """

    __tablename__ = "card_synergies"

    # Card Combination
    card_1_id = Column(UUID(as_uuid=True), ForeignKey("wasteland_cards.id"), nullable=False, index=True)
    card_2_id = Column(UUID(as_uuid=True), ForeignKey("wasteland_cards.id"), nullable=False, index=True)
    card_3_id = Column(UUID(as_uuid=True), ForeignKey("wasteland_cards.id"), nullable=True, index=True)  # For 3-card synergies

    # Synergy Properties
    synergy_type = Column(String(30), nullable=False)  # amplification, contradiction, etc.
    strength_rating = Column(Float, nullable=False)  # 0.0 to 1.0
    description = Column(Text, nullable=False)

    # Contextual Information
    works_best_in_spreads = Column(JSON)  # Which spread types enhance this synergy
    faction_resonance = Column(JSON)  # Which factions this synergy resonates with
    karma_influence = Column(JSON)  # How different karma alignments affect this synergy

    # Effects and Manifestation
    combined_meaning = Column(Text)  # Meaning when these cards appear together
    wasteland_scenario = Column(Text)  # Fallout-themed scenario this represents
    special_effects = Column(JSON)  # Special visual/audio effects

    # Discovery and Usage
    discovered_by_user = Column(String)  # User ID who first discovered this synergy
    discovery_date = Column(DateTime(timezone=True))
    occurrence_count = Column(Integer, default=0)  # How often this combination appears
    user_ratings = Column(JSON, default=list)  # User ratings for this synergy

    # Relationships
    card_1 = relationship("WastelandCard", foreign_keys=[card_1_id])
    card_2 = relationship("WastelandCard", foreign_keys=[card_2_id])
    card_3 = relationship("WastelandCard", foreign_keys=[card_3_id])

    def is_three_card_synergy(self) -> bool:
        """Check if this is a three-card synergy"""
        return self.card_3_id is not None

    def get_card_ids(self) -> List[str]:
        """Get list of all card IDs in this synergy"""
        cards = [self.card_1_id, self.card_2_id]
        if self.card_3_id:
            cards.append(self.card_3_id)
        return cards

    def calculate_average_rating(self) -> float:
        """Calculate average user rating"""
        if not self.user_ratings:
            return 0.0
        return sum(self.user_ratings) / len(self.user_ratings)

    def is_suitable_for_karma(self, karma: KarmaAlignment) -> bool:
        """Check if synergy resonates with user's karma"""
        if not self.karma_influence:
            return True
        return karma.value in self.karma_influence.get('compatible_alignments', [])

    def to_dict(self) -> Dict[str, Any]:
        """Convert synergy to dictionary"""
        return {
            "id": self.id,
            "card_1_id": self.card_1_id,
            "card_2_id": self.card_2_id,
            "card_3_id": self.card_3_id,
            "synergy_type": self.synergy_type,
            "strength_rating": self.strength_rating,
            "description": self.description,
            "combined_meaning": self.combined_meaning,
            "wasteland_scenario": self.wasteland_scenario,
            "works_best_in_spreads": self.works_best_in_spreads,
            "faction_resonance": self.faction_resonance,
            "karma_influence": self.karma_influence,
            "special_effects": self.special_effects,
            "occurrence_count": self.occurrence_count,
            "average_rating": self.calculate_average_rating(),
            "is_three_card": self.is_three_card_synergy(),
            "discovered_by_user": self.discovered_by_user,
            "discovery_date": self.discovery_date.isoformat() if self.discovery_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }