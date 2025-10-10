"""
Reading Service - Business logic for authenticated reading functionality
Handles reading creation, storage, and user-specific customization
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload
from app.models.user import User
from app.models.reading_enhanced import CompletedReading as Reading
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.wasteland_card_service import WastelandCardService, RadiationRandomnessEngine
from app.services.ai_interpretation_service import AIInterpretationService
from app.config import settings
from app.core.exceptions import (
    UserNotFoundError,
    ReadingLimitExceededError,
    InsufficientPermissionsError
)
import logging

logger = logging.getLogger(__name__)


class ReadingService:
    """Service for authenticated reading operations"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.card_service = WastelandCardService(db_session)
        self.ai_service = AIInterpretationService(settings)

    async def create_reading(self, reading_data: Dict[str, Any]) -> Reading:
        """Create a new reading for authenticated user"""
        # Extract data from dictionary
        user_id = reading_data["user_id"]
        question = reading_data["question"]
        reading_type = reading_data["reading_type"]
        num_cards = reading_data.get("num_cards", 1)
        character_voice = reading_data.get("character_voice", CharacterVoice.PIP_BOY)
        radiation_factor = reading_data.get("radiation_factor", 0.5)

        # Get user and check permissions
        user = await self._get_user_with_validation(user_id)

        # Check daily reading limit
        await self._check_daily_reading_limit(user_id)

        # Draw cards using radiation shuffle
        drawn_cards = await self.card_service.draw_cards_with_radiation_shuffle(
            num_cards=num_cards,
            radiation_factor=radiation_factor,
            user_id=user_id
        )

        # Generate interpretation
        if isinstance(character_voice, str):
            character_voice = CharacterVoice(character_voice)
        interpretation = await self._generate_interpretation(user, drawn_cards, question, character_voice)

        # Prepare cards data for storage
        cards_data = []
        for card in drawn_cards:
            cards_data.append({
                "id": card.id,
                "name": card.name,
                "suit": card.suit.value if card.suit else None,
                "position": len(cards_data),
                "reversed": False  # TODO: Implement reversal logic
            })

        # Merge frontend supplied position metadata if provided
        provided_cards = reading_data.get("cards_drawn")
        if isinstance(provided_cards, list):
            for idx, meta in enumerate(provided_cards):
                if idx < len(cards_data) and isinstance(meta, dict) and meta.get("position_meta"):
                    cards_data[idx]["position_meta"] = meta.get("position_meta")

        # Create reading record
        reading = Reading(
            user_id=user_id,
            question=question,
            spread_type=reading_type,
            cards_drawn=cards_data,
            interpretation=interpretation,
            character_voice=character_voice.value if hasattr(character_voice, 'value') else str(character_voice),
            karma_context=user.karma_alignment().value if hasattr(user, 'karma_alignment') else KarmaAlignment.NEUTRAL.value,
            faction_influence=user.faction_alignment if hasattr(user, 'faction_alignment') else None,
            is_private=True,  # Default to private
            allow_public_sharing=False,
            tags=[],
            mood=self._detect_question_mood(question),
            reading_duration=0  # Will be updated when user finishes
        )

        self.db.add(reading)

        # Update user statistics (if fields exist)
        if hasattr(user, 'daily_readings_count'):
            user.daily_readings_count += 1
        if hasattr(user, 'total_readings'):
            user.total_readings += 1

        # Update profile statistics
        if user.profile and hasattr(user.profile, 'total_readings'):
            user.profile.total_readings += 1

        await self.db.commit()
        await self.db.refresh(reading)

        return reading

    async def get_reading_by_id(self, reading_id: str, user_id: str) -> Reading:
        """Get reading by ID with permission check"""
        result = await self.db.execute(
            select(Reading).where(Reading.id == reading_id)
        )
        reading = result.scalar_one_or_none()

        if not reading:
            raise ValueError(f"Reading with ID '{reading_id}' not found")

        # Check if user has permission to view this reading
        if not await self._can_user_access_reading(user_id, reading):
            raise InsufficientPermissionsError("You don't have permission to access this reading")

        return reading

    async def get_user_reading_history(
        self,
        user_id: str,
        limit: int = 10,
        offset: int = 0,
        filter_by_spread: Optional[str] = None,
        filter_by_voice: Optional[str] = None
    ) -> List[Reading]:
        """Get user's reading history with filters"""
        query = select(Reading).where(Reading.user_id == user_id)

        if filter_by_spread:
            query = query.where(Reading.spread_type == filter_by_spread)

        if filter_by_voice:
            query = query.where(Reading.character_voice == filter_by_voice)

        query = query.order_by(desc(Reading.created_at)).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_readings(self, user_id: str) -> List[Reading]:
        """Get all readings for a specific user"""
        result = await self.db.execute(
            select(Reading)
            .where(Reading.user_id == user_id)
            .order_by(desc(Reading.created_at))
        )
        return result.scalars().all()

    async def update_reading(
        self,
        reading_id: str,
        user_id: str,
        update_data: Dict[str, Any]
    ) -> Reading:
        """Update reading with user feedback"""
        reading = await self.get_reading_by_id(reading_id, user_id)

        # Only allow owner to update
        if reading.user_id != user_id:
            raise InsufficientPermissionsError("You can only update your own readings")

        # Update allowed fields
        allowed_fields = [
            "user_feedback", "accuracy_rating", "tags", "mood", "notes", "context_notes",
            "is_private", "allow_public_sharing", "share_with_friends", "is_favorite"
        ]

        for field, value in update_data.items():
            if field in allowed_fields and hasattr(reading, field):
                setattr(reading, field, value)

        await self.db.commit()
        await self.db.refresh(reading)

        return reading

    async def delete_reading(self, reading_id: str, user_id: str) -> bool:
        """Delete reading (owner only)"""
        reading = await self.get_reading_by_id(reading_id, user_id)

        if reading.user_id != user_id:
            raise InsufficientPermissionsError("You can only delete your own readings")

        await self.db.delete(reading)
        await self.db.commit()
        return True

    async def share_reading(
        self,
        reading_id: str,
        owner_id: str,
        target_user_ids: List[str],
        message: Optional[str] = None
    ) -> bool:
        """Share reading with specific users"""
        reading = await self.get_reading_by_id(reading_id, owner_id)

        if reading.user_id != owner_id:
            raise InsufficientPermissionsError("You can only share your own readings")

        # Update shared users list
        current_shared = reading.shared_with_users or []
        updated_shared = list(set(current_shared + target_user_ids))
        reading.shared_with_users = updated_shared
        reading.share_with_friends = True

        await self.db.commit()
        return True

    async def get_public_readings(
        self,
        limit: int = 20,
        offset: int = 0
    ) -> List[Reading]:
        """Get publicly shared readings"""
        result = await self.db.execute(
            select(Reading)
            .where(
                and_(
                    Reading.is_private == False,
                    Reading.allow_public_sharing == True
                )
            )
            .order_by(desc(Reading.created_at))
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def get_reading_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get detailed reading statistics for user"""
        # Get all user readings
        result = await self.db.execute(
            select(Reading).where(Reading.user_id == user_id)
        )
        readings = result.scalars().all()

        if not readings:
            return {
                "total_readings": 0,
                "average_accuracy": 0.0,
                "favorite_spread_types": [],
                "character_voice_usage": {},
                "reading_frequency": {},
                "karma_influence": {},
                "faction_influence": {}
            }

        # Calculate statistics
        total_readings = len(readings)

        # Accuracy statistics
        accuracy_ratings = [r.accuracy_rating for r in readings if r.accuracy_rating]
        average_accuracy = sum(accuracy_ratings) / len(accuracy_ratings) if accuracy_ratings else 0.0

        # Spread type frequency
        spread_types = {}
        for reading in readings:
            spread_types[reading.spread_type] = spread_types.get(reading.spread_type, 0) + 1

        favorite_spread_types = sorted(spread_types.items(), key=lambda x: x[1], reverse=True)

        # Character voice usage
        voice_usage = {}
        for reading in readings:
            voice = reading.character_voice
            voice_usage[voice] = voice_usage.get(voice, 0) + 1

        # Reading frequency by month
        frequency = {}
        for reading in readings:
            if reading.created_at:
                month_key = reading.created_at.strftime("%Y-%m")
                frequency[month_key] = frequency.get(month_key, 0) + 1

        # Karma influence analysis
        karma_influence = {}
        for reading in readings:
            karma = reading.karma_context
            karma_influence[karma] = karma_influence.get(karma, 0) + 1

        # Faction influence analysis
        faction_influence = {}
        for reading in readings:
            faction = reading.faction_influence
            if faction:
                faction_influence[faction] = faction_influence.get(faction, 0) + 1

        return {
            "total_readings": total_readings,
            "average_accuracy": round(average_accuracy, 2),
            "favorite_spread_types": favorite_spread_types[:5],  # Top 5
            "character_voice_usage": voice_usage,
            "reading_frequency": frequency,
            "karma_influence": karma_influence,
            "faction_influence": faction_influence
        }

    async def get_reading_trends(
        self,
        user_id: str,
        period: str = "month"
    ) -> Dict[str, Any]:
        """Get reading trends analysis for user"""
        # Calculate date range based on period
        now = datetime.utcnow()
        if period == "week":
            start_date = now - timedelta(days=7)
        elif period == "month":
            start_date = now - timedelta(days=30)
        elif period == "year":
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)  # Default to month

        # Get readings in period
        result = await self.db.execute(
            select(Reading)
            .where(
                and_(
                    Reading.user_id == user_id,
                    Reading.created_at >= start_date
                )
            )
            .order_by(Reading.created_at)
        )
        readings = result.scalars().all()

        # Analyze trends
        reading_count_by_day = {}
        popular_questions = {}
        accuracy_trends = []

        for reading in readings:
            if reading.created_at:
                day_key = reading.created_at.strftime("%Y-%m-%d")
                reading_count_by_day[day_key] = reading_count_by_day.get(day_key, 0) + 1

                # Track question patterns
                question_words = reading.question.lower().split()
                for word in question_words:
                    if len(word) > 3:  # Skip short words
                        popular_questions[word] = popular_questions.get(word, 0) + 1

                # Track accuracy over time
                if reading.accuracy_rating:
                    accuracy_trends.append({
                        "date": day_key,
                        "accuracy": reading.accuracy_rating
                    })

        # Sort popular questions
        popular_questions = sorted(
            popular_questions.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]  # Top 10 words

        return {
            "reading_count_by_day": reading_count_by_day,
            "popular_questions": popular_questions,
            "character_voice_usage": self._analyze_voice_trends(readings),
            "accuracy_trends": accuracy_trends,
            "period": period,
            "total_readings_in_period": len(readings)
        }

    async def _get_user_with_validation(self, user_id: str) -> User:
        """Get user with validation and preloaded relationships"""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile), selectinload(User.preferences))
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise UserNotFoundError(f"User with ID '{user_id}' not found")

        if not user.is_active:
            raise InsufficientPermissionsError("User account is not active")

        return user

    async def _can_user_access_reading(self, user_id: str, reading: Reading) -> bool:
        """Check if user can access a specific reading"""
        # Owner can always access
        if reading.user_id == user_id:
            return True

        # Public readings are accessible to everyone
        if not reading.is_private and reading.allow_public_sharing:
            return True

        # Check if reading is shared with this user
        if reading.shared_with_users and user_id in reading.shared_with_users:
            return True

        return False

    async def _generate_interpretation(
        self,
        user: User,
        cards: List[WastelandCard],
        question: str,
        character_voice: CharacterVoice
    ) -> str:
        """Generate personalized interpretation based on user context with AI enhancement"""
        # Get user's karma alignment
        karma = user.karma_alignment() if hasattr(user, 'karma_alignment') and callable(user.karma_alignment) else KarmaAlignment.NEUTRAL

        # Base interpretation from first card
        if not cards:
            return "The wasteland reveals nothing... try again later."

        # Get faction if available
        faction = None
        if hasattr(user, 'faction_alignment') and user.faction_alignment:
            try:
                faction = FactionAlignment(user.faction_alignment)
            except:
                pass

        # Try AI-powered interpretation first
        if self.ai_service.is_available() and settings.ai_enabled:
            try:
                logger.info(f"Attempting AI interpretation for {len(cards)} card(s)")

                if len(cards) == 1:
                    # Single card AI interpretation
                    ai_interpretation = await self.ai_service.generate_interpretation(
                        card=cards[0],
                        character_voice=character_voice,
                        question=question,
                        karma=karma,
                        faction=faction,
                        timeout=10.0
                    )
                else:
                    # Multi-card AI interpretation
                    ai_interpretation = await self.ai_service.generate_multi_card_interpretation(
                        cards=cards,
                        character_voice=character_voice,
                        question=question,
                        karma=karma,
                        faction=faction,
                        spread_type="three_card" if len(cards) == 3 else "general",
                        timeout=15.0
                    )

                if ai_interpretation:
                    logger.info("AI interpretation successful")
                    return ai_interpretation
                else:
                    logger.warning("AI interpretation returned None, falling back to template")
            except Exception as e:
                logger.error(f"AI interpretation failed: {e}, falling back to template")

        # Fallback to template-based interpretation
        logger.info("Using template-based interpretation")
        return self._generate_template_interpretation(cards, character_voice, karma, faction)

    def _generate_template_interpretation(
        self,
        cards: List[WastelandCard],
        character_voice: CharacterVoice,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment]
    ) -> str:
        """Generate template-based interpretation (fallback when AI is unavailable)"""
        primary_card = cards[0]

        # Get basic card interpretation
        base_interpretation = f"**{primary_card.name}**: {primary_card.description}"

        # Try to get karma-specific interpretation if available
        karma_interpretation = base_interpretation
        if hasattr(primary_card, 'get_karma_interpretation'):
            try:
                karma_interpretation = primary_card.get_karma_interpretation(karma) or base_interpretation
            except:
                karma_interpretation = base_interpretation

        # Try to get character voice interpretation if available
        voice_interpretation = karma_interpretation
        if hasattr(primary_card, 'get_character_voice_interpretation'):
            try:
                voice_interpretation = primary_card.get_character_voice_interpretation(character_voice) or karma_interpretation
            except:
                voice_interpretation = karma_interpretation

        # Build interpretation parts
        interpretation_parts = [
            f"**{character_voice.value.title() if hasattr(character_voice, 'value') else str(character_voice)} Analysis:**",
            voice_interpretation,
            "",
            f"**Karma Influence ({karma.value.title() if hasattr(karma, 'value') else str(karma)}):**",
            karma_interpretation,
        ]

        # Add faction analysis if user has faction
        if faction:
            faction_significance = "This card holds standard meaning for your faction."
            if hasattr(primary_card, 'get_faction_significance'):
                try:
                    faction_significance = primary_card.get_faction_significance(faction) or faction_significance
                except:
                    pass

            interpretation_parts.extend([
                "",
                f"**{faction.value.title()} Significance:**",
                faction_significance
            ])

        # Add multi-card spread interpretation
        if len(cards) > 1:
            interpretation_parts.extend([
                "",
                "**Additional Cards:**"
            ])
            for i, card in enumerate(cards[1:], 1):
                card_meaning = f"{card.name}: {card.description}"
                if hasattr(card, 'get_karma_interpretation'):
                    try:
                        card_meaning = card.get_karma_interpretation(karma) or card_meaning
                    except:
                        pass
                interpretation_parts.append(f"Card {i + 1}: {card_meaning}")

        return "\n".join(interpretation_parts)

    def _detect_question_mood(self, question: str) -> str:
        """Detect mood/category of the question"""
        question_lower = question.lower()

        if any(word in question_lower for word in ["love", "relationship", "romance", "heart"]):
            return "love"
        elif any(word in question_lower for word in ["career", "work", "job", "profession"]):
            return "career"
        elif any(word in question_lower for word in ["health", "sick", "healing", "body"]):
            return "health"
        elif any(word in question_lower for word in ["money", "wealth", "financial", "caps"]):
            return "financial"
        elif any(word in question_lower for word in ["future", "destiny", "fate", "tomorrow"]):
            return "future"
        elif any(word in question_lower for word in ["past", "history", "memories", "before"]):
            return "past"
        else:
            return "general"

    def _analyze_voice_trends(self, readings: List[Reading]) -> Dict[str, int]:
        """Analyze character voice usage trends"""
        voice_usage = {}
        for reading in readings:
            voice = reading.character_voice
            voice_usage[voice] = voice_usage.get(voice, 0) + 1
        return voice_usage

    async def _check_daily_reading_limit(self, user_id: str) -> None:
        """Check if user has exceeded daily reading limit"""
        from datetime import datetime, timedelta

        # Get today's readings count
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(func.count(Reading.id))
            .where(
                and_(
                    Reading.user_id == user_id,
                    Reading.created_at >= today
                )
            )
        )
        daily_count = result.scalar() or 0

        # Default limit is 20 readings per day
        DAILY_LIMIT = 20
        if daily_count >= DAILY_LIMIT:
            raise ReadingLimitExceededError(f"Daily reading limit of {DAILY_LIMIT} exceeded. Please wait until tomorrow.")