"""
Enhanced Reading Service - Advanced reading functionality with interpretation templates,
spread templates, and card synergy detection for Wasteland Tarot
"""

import random
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.models.wasteland_card import WastelandCard, CharacterVoice, KarmaAlignment, FactionAlignment
from app.models.user import User
from app.models.reading_enhanced import (
    SpreadTemplate,
    InterpretationTemplate,
    ReadingSession,
    ReadingCardPosition,
    CardSynergy,
    SpreadType,
    CardSynergyType
)
from app.services.wasteland_card_service import RadiationRandomnessEngine
from app.core.exceptions import (
    UserNotFoundError,
    InsufficientPermissionsError,
    ResourceNotFoundError,
    ReadingLimitExceededError
)


class WastelandInterpretationEngine:
    """Advanced interpretation engine using character voice templates"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def generate_interpretation(
        self,
        card: WastelandCard,
        character_voice: CharacterVoice,
        context: Dict[str, Any] = None,
        position_meaning: str = None
    ) -> str:
        """Generate interpretation using character voice template"""

        # Get interpretation template
        template = await self._get_interpretation_template(character_voice)
        if not template:
            # Fallback to basic interpretation
            return card.get_character_voice_interpretation(character_voice)

        context = context or {}

        # Select appropriate template based on card type
        if card.is_major_arcana():
            template_format = template.card_interpretation_templates.get("major_arcana", "")
        else:
            template_format = template.card_interpretation_templates.get("minor_arcana", "")

        # Handle high radiation cards
        if card.radiation_level and card.radiation_level > 3.0:
            template_format = template.card_interpretation_templates.get("high_radiation", template_format)

        # Replace placeholders
        interpretation = template_format.format(
            card_name=card.name,
            meaning=card.upright_meaning,
            radiation_level=card.radiation_level or 0,
            suit=card.suit,
            number=card.number or 0,
            position_meaning=position_meaning or "general guidance"
        )

        return interpretation

    async def generate_reading_conclusion(
        self,
        character_voice: CharacterVoice,
        summary: str,
        advice: str = None
    ) -> str:
        """Generate reading conclusion using character voice"""

        template = await self._get_interpretation_template(character_voice)
        if not template or not template.conclusion_templates:
            return f"Reading complete. Summary: {summary}"

        # Select random conclusion template
        conclusion_template = random.choice(template.conclusion_templates)

        return conclusion_template.format(
            summary=summary,
            advice=advice or "Trust your instincts in the wasteland.",
            message=summary,
            guidance=advice or "Stay safe out there."
        )

    async def _get_interpretation_template(self, character_voice: CharacterVoice) -> Optional[InterpretationTemplate]:
        """Get interpretation template for character voice"""
        result = await self.db.execute(
            select(InterpretationTemplate).where(
                and_(
                    InterpretationTemplate.character_voice == character_voice.value,
                    InterpretationTemplate.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()


class CardSynergyDetector:
    """Detects and analyzes card synergies in readings"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def detect_synergies(self, cards: List[WastelandCard]) -> List[CardSynergy]:
        """Detect synergies between cards in a reading"""
        synergies = []
        card_ids = [card.id for card in cards]

        if len(cards) < 2:
            return synergies

        # Check for two-card synergies
        for i in range(len(cards)):
            for j in range(i + 1, len(cards)):
                synergy = await self._find_two_card_synergy(cards[i].id, cards[j].id)
                if synergy:
                    synergies.append(synergy)

        # Check for three-card synergies if applicable
        if len(cards) >= 3:
            for i in range(len(cards)):
                for j in range(i + 1, len(cards)):
                    for k in range(j + 1, len(cards)):
                        synergy = await self._find_three_card_synergy(
                            cards[i].id, cards[j].id, cards[k].id
                        )
                        if synergy:
                            synergies.append(synergy)

        return synergies

    async def calculate_synergy_strength(self, synergies: List[CardSynergy]) -> float:
        """Calculate overall synergy strength for a reading"""
        if not synergies:
            return 0.0

        total_strength = sum(synergy.strength_rating for synergy in synergies)
        return min(1.0, total_strength / len(synergies))

    async def _find_two_card_synergy(self, card1_id: str, card2_id: str) -> Optional[CardSynergy]:
        """Find synergy between two specific cards"""
        result = await self.db.execute(
            select(CardSynergy).where(
                or_(
                    and_(
                        CardSynergy.card_1_id == card1_id,
                        CardSynergy.card_2_id == card2_id
                    ),
                    and_(
                        CardSynergy.card_1_id == card2_id,
                        CardSynergy.card_2_id == card1_id
                    )
                )
            )
        )
        return result.scalar_one_or_none()

    async def _find_three_card_synergy(
        self, card1_id: str, card2_id: str, card3_id: str
    ) -> Optional[CardSynergy]:
        """Find synergy between three specific cards"""
        # For three-card synergies, we need to check all possible combinations
        card_set = {card1_id, card2_id, card3_id}

        result = await self.db.execute(
            select(CardSynergy).where(
                and_(
                    CardSynergy.card_3_id.is_not(None),
                    func.json_array_length(
                        func.json_array(
                            CardSynergy.card_1_id,
                            CardSynergy.card_2_id,
                            CardSynergy.card_3_id
                        )
                    ) == 3
                )
            )
        )

        synergies = result.scalars().all()

        for synergy in synergies:
            synergy_cards = {synergy.card_1_id, synergy.card_2_id, synergy.card_3_id}
            if synergy_cards == card_set:
                return synergy

        return None


class EnhancedReadingService:
    """Enhanced reading service with advanced features"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.interpretation_engine = WastelandInterpretationEngine(db_session)
        self.synergy_detector = CardSynergyDetector(db_session)

    async def create_advanced_reading(
        self,
        user_id: str,
        question: str,
        spread_template_id: str,
        character_voice: CharacterVoice,
        radiation_factor: float = 0.5,
        focus_area: str = None
    ) -> ReadingSession:
        """Create a comprehensive reading with enhanced features"""

        # Validate user
        user = await self._get_user_with_validation(user_id)

        # Get spread template
        spread_template = await self._get_spread_template(spread_template_id)
        if not spread_template:
            raise ResourceNotFoundError(f"Spread template '{spread_template_id}' not found")

        # Get interpretation template
        interpretation_template = await self._get_interpretation_template(character_voice)

        # Draw cards based on spread requirements
        cards = await self._draw_cards_for_spread(
            spread_template, user, radiation_factor
        )

        # Create reading session
        reading_session = ReadingSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            spread_template_id=spread_template_id,
            interpretation_template_id=interpretation_template.id if interpretation_template else None,
            question=question,
            focus_area=focus_area,
            character_voice_used=character_voice.value,
            karma_context=user.karma_alignment().value,
            faction_influence=user.faction_alignment,
            radiation_factor=radiation_factor,
            start_time=datetime.utcnow(),
            privacy_level="private",
            allow_public_sharing=False,
            share_with_friends=False
        )

        self.db.add(reading_session)
        await self.db.flush()  # Get the ID

        # Create card positions
        card_positions = []
        for i, (card, position_info) in enumerate(zip(cards, spread_template.positions)):
            position = ReadingCardPosition(
                id=str(uuid.uuid4()),
                reading_session_id=reading_session.id,
                card_id=card.id,
                position_number=position_info["position"],
                position_name=position_info["name"],
                position_meaning=position_info["meaning"],
                is_reversed=random.random() < 0.3,  # 30% chance of reversal
                draw_order=i + 1,
                radiation_influence=card.radiation_level * radiation_factor
            )

            # Generate position-specific interpretation
            position.position_interpretation = await self.interpretation_engine.generate_interpretation(
                card=card,
                character_voice=character_voice,
                context={"position": position_info["name"]},
                position_meaning=position_info["meaning"]
            )

            card_positions.append(position)
            self.db.add(position)

        # Detect card synergies
        synergies = await self.synergy_detector.detect_synergies(cards)
        synergy_strength = await self.synergy_detector.calculate_synergy_strength(synergies)

        # Generate overall interpretation
        overall_interpretation = await self._generate_overall_interpretation(
            cards, card_positions, synergies, character_voice, question
        )

        # Generate summary
        summary = await self._generate_reading_summary(
            cards, synergies, user.karma_alignment()
        )

        # Complete reading session
        reading_session.overall_interpretation = overall_interpretation
        reading_session.summary_message = summary
        reading_session.prediction_confidence = min(0.9, 0.5 + synergy_strength * 0.4)
        reading_session.end_time = datetime.utcnow()

        await self.db.commit()
        return reading_session

    async def get_available_spreads(
        self,
        user_id: str = None,
        difficulty_level: str = None,
        faction_preference: str = None
    ) -> List[SpreadTemplate]:
        """Get available spread templates for user"""

        query = select(SpreadTemplate).where(SpreadTemplate.is_active == True)

        if difficulty_level:
            query = query.where(SpreadTemplate.difficulty_level == difficulty_level)

        if faction_preference:
            query = query.where(
                or_(
                    SpreadTemplate.faction_preference == faction_preference,
                    SpreadTemplate.faction_preference.is_(None)
                )
            )

        result = await self.db.execute(query.order_by(SpreadTemplate.usage_count.desc()))
        return result.scalars().all()

    async def get_available_interpreters(self) -> List[InterpretationTemplate]:
        """Get available character voice interpreters"""
        result = await self.db.execute(
            select(InterpretationTemplate)
            .where(InterpretationTemplate.is_active == True)
            .order_by(InterpretationTemplate.usage_count.desc())
        )
        return result.scalars().all()

    async def get_reading_with_details(self, reading_id: str, user_id: str) -> Optional[ReadingSession]:
        """Get reading with all details including positions and synergies"""
        result = await self.db.execute(
            select(ReadingSession)
            .options(
                selectinload(ReadingSession.card_positions),
                selectinload(ReadingSession.spread_template),
                selectinload(ReadingSession.interpretation_template)
            )
            .where(
                and_(
                    ReadingSession.id == reading_id,
                    ReadingSession.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_user_reading_history(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[ReadingSession]:
        """Get user's reading history"""
        result = await self.db.execute(
            select(ReadingSession)
            .where(ReadingSession.user_id == user_id)
            .order_by(ReadingSession.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def update_reading_feedback(
        self,
        reading_id: str,
        user_id: str,
        satisfaction: int,
        accuracy: int,
        helpfulness: int,
        feedback: str = None
    ) -> bool:
        """Update reading with user feedback"""
        result = await self.db.execute(
            select(ReadingSession).where(
                and_(
                    ReadingSession.id == reading_id,
                    ReadingSession.user_id == user_id
                )
            )
        )

        reading = result.scalar_one_or_none()
        if not reading:
            return False

        reading.user_satisfaction = satisfaction
        reading.accuracy_rating = accuracy
        reading.helpful_rating = helpfulness
        reading.user_feedback = feedback

        await self.db.commit()
        return True

    async def _get_user_with_validation(self, user_id: str) -> User:
        """Get user with validation"""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise UserNotFoundError(f"User with ID '{user_id}' not found")

        if not user.is_active:
            raise InsufficientPermissionsError("User account is not active")

        # Check reading limits
        if not user.can_create_reading():
            raise ReadingLimitExceededError("Daily reading limit exceeded")

        return user

    async def _get_spread_template(self, template_id: str) -> Optional[SpreadTemplate]:
        """Get spread template by ID"""
        result = await self.db.execute(
            select(SpreadTemplate).where(SpreadTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def _get_interpretation_template(self, character_voice: CharacterVoice) -> Optional[InterpretationTemplate]:
        """Get interpretation template for character voice"""
        result = await self.db.execute(
            select(InterpretationTemplate).where(
                and_(
                    InterpretationTemplate.character_voice == character_voice.value,
                    InterpretationTemplate.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()

    async def _draw_cards_for_spread(
        self,
        spread_template: SpreadTemplate,
        user: User,
        radiation_factor: float
    ) -> List[WastelandCard]:
        """Draw cards for a specific spread"""

        # Get all available cards
        result = await self.db.execute(select(WastelandCard))
        all_cards = result.scalars().all()

        if len(all_cards) < spread_template.card_count:
            raise InsufficientPermissionsError("Not enough cards in deck for this spread")

        # Apply user-specific radiation modifications
        karma_modifier = self._calculate_karma_radiation_modifier(user)
        adjusted_radiation = min(1.0, radiation_factor * karma_modifier * spread_template.radiation_sensitivity)

        # Shuffle with radiation influence
        shuffled_cards = RadiationRandomnessEngine.wasteland_fisher_yates_shuffle(
            all_cards, adjusted_radiation
        )

        return shuffled_cards[:spread_template.card_count]

    def _calculate_karma_radiation_modifier(self, user: User) -> float:
        """Calculate radiation modifier based on user karma"""
        karma = user.karma_alignment()

        if karma == KarmaAlignment.GOOD:
            return 0.8  # Less chaos
        elif karma == KarmaAlignment.EVIL:
            return 1.3  # More chaos
        else:
            return 1.0  # Standard

    async def _generate_overall_interpretation(
        self,
        cards: List[WastelandCard],
        positions: List[ReadingCardPosition],
        synergies: List[CardSynergy],
        character_voice: CharacterVoice,
        question: str
    ) -> str:
        """Generate overall reading interpretation"""

        # Combine individual position interpretations
        position_summaries = []
        for position in positions:
            position_summaries.append(f"{position.position_name}: {position.position_interpretation}")

        # Add synergy information
        synergy_text = ""
        if synergies:
            synergy_descriptions = [synergy.description for synergy in synergies]
            synergy_text = f"\n\nCard Synergies: {' '.join(synergy_descriptions)}"

        # Generate conclusion
        overall_summary = f"Your question: {question}\n\n" + "\n".join(position_summaries) + synergy_text

        conclusion = await self.interpretation_engine.generate_reading_conclusion(
            character_voice=character_voice,
            summary="The cards reveal a complex situation with multiple factors at play.",
            advice="Consider all aspects shown by the cards before making your decision."
        )

        return overall_summary + f"\n\n{conclusion}"

    async def _generate_reading_summary(
        self,
        cards: List[WastelandCard],
        synergies: List[CardSynergy],
        karma: KarmaAlignment
    ) -> str:
        """Generate concise reading summary"""

        major_arcana_count = sum(1 for card in cards if card.is_major_arcana())
        avg_radiation = sum(card.radiation_level or 0 for card in cards) / len(cards)

        summary_parts = []

        if major_arcana_count > len(cards) / 2:
            summary_parts.append("Major life themes are at play.")

        if avg_radiation > 3.0:
            summary_parts.append("High energy and transformation are indicated.")

        if synergies:
            summary_parts.append("Strong connections between the cards suggest a unified message.")

        if karma == KarmaAlignment.GOOD:
            summary_parts.append("Your positive actions will influence the outcome.")
        elif karma == KarmaAlignment.EVIL:
            summary_parts.append("Be mindful of how your choices affect others.")

        return " ".join(summary_parts) if summary_parts else "The cards offer guidance for your current situation."