"""
Wasteland Card Service - Business logic for Fallout-themed tarot cards
Enhanced with user authentication and reading integration
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from app.models.wasteland_card import (
    WastelandCard,
    WastelandSuit,
    KarmaAlignment,
    CharacterVoice,
    FactionAlignment,
)
from app.models.user import User
from app.core.exceptions import UserNotFoundError, InsufficientPermissionsError
import random
import time
import math


class RadiationRandomnessEngine:
    """Radiation-influenced randomness for wasteland card shuffling"""

    @staticmethod
    def generate_geiger_seed() -> float:
        """Generate pseudo-random seed based on simulated Geiger counter clicks"""
        base_time = time.time()
        # Simulate Geiger counter randomness
        radiation_clicks = sum(
            math.sin(base_time * i * 0.1) * random.random() for i in range(10)
        )
        return abs(radiation_clicks) % 1.0

    @staticmethod
    def wasteland_fisher_yates_shuffle(cards: List[WastelandCard], radiation_factor: float = 0.5) -> List[WastelandCard]:
        """Modified Fisher-Yates shuffle with radiation influence"""
        shuffled = cards.copy()
        n = len(shuffled)

        for i in range(n - 1, 0, -1):
            # Standard random component
            base_random = random.random()

            # Radiation influence
            radiation_influence = RadiationRandomnessEngine.generate_geiger_seed() * radiation_factor

            # Combine randomness sources
            combined_random = (base_random + radiation_influence) % 1.0
            j = int(combined_random * (i + 1))

            shuffled[i], shuffled[j] = shuffled[j], shuffled[i]

        return shuffled


class WastelandCardService:
    """Service layer for wasteland card operations"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def get_all_cards(self) -> List[WastelandCard]:
        """Get all cards from the database"""
        result = await self.db.execute(select(WastelandCard))
        return result.scalars().all()

    async def get_card_by_id(self, card_id: str) -> Optional[WastelandCard]:
        """Get a specific card by ID"""
        result = await self.db.execute(
            select(WastelandCard).where(WastelandCard.id == card_id)
        )
        return result.scalar_one_or_none()

    async def filter_cards_by_suit(self, suit: WastelandSuit) -> List[WastelandCard]:
        """Filter cards by suit"""
        result = await self.db.execute(
            select(WastelandCard).where(WastelandCard.suit == suit.value)
        )
        return result.scalars().all()

    async def filter_cards_by_radiation_level(self, min_radiation: float, max_radiation: float) -> List[WastelandCard]:
        """Filter cards by radiation level range"""
        result = await self.db.execute(
            select(WastelandCard).where(
                and_(
                    WastelandCard.radiation_level >= min_radiation,
                    WastelandCard.radiation_level <= max_radiation
                )
            )
        )
        return result.scalars().all()

    async def search_by_fallout_elements(self, search_term: str) -> List[WastelandCard]:
        """Search cards by Fallout-specific elements"""
        search_pattern = f"%{search_term}%"
        result = await self.db.execute(
            select(WastelandCard).where(
                or_(
                    WastelandCard.wasteland_humor.ilike(search_pattern),
                    WastelandCard.nuka_cola_reference.ilike(search_pattern),
                    WastelandCard.fallout_easter_egg.ilike(search_pattern),
                    WastelandCard.special_ability.ilike(search_pattern)
                )
            )
        )
        return result.scalars().all()

    async def get_cards_by_threat_level(self, min_threat: int, max_threat: int = 10) -> List[WastelandCard]:
        """Get cards by threat level range"""
        result = await self.db.execute(
            select(WastelandCard).where(
                and_(
                    WastelandCard.threat_level >= min_threat,
                    WastelandCard.threat_level <= max_threat
                )
            )
        )
        return result.scalars().all()

    async def get_major_arcana_cards(self) -> List[WastelandCard]:
        """Get all Major Arcana cards"""
        return await self.filter_cards_by_suit(WastelandSuit.MAJOR_ARCANA)

    async def get_minor_arcana_by_suit(self, suit: WastelandSuit) -> List[WastelandCard]:
        """Get all cards from a specific Minor Arcana suit"""
        if suit == WastelandSuit.MAJOR_ARCANA:
            raise ValueError("Use get_major_arcana_cards() for Major Arcana")
        return await self.filter_cards_by_suit(suit)

    async def get_court_cards(self) -> List[WastelandCard]:
        """Get all court cards (11-14 in Minor Arcana)"""
        result = await self.db.execute(
            select(WastelandCard).where(
                and_(
                    WastelandCard.suit != WastelandSuit.MAJOR_ARCANA.value,
                    WastelandCard.number >= 11
                )
            )
        )
        return result.scalars().all()

    async def draw_cards_with_radiation_shuffle(
        self,
        num_cards: int = 1,
        radiation_factor: float = 0.5,
        user_id: Optional[str] = None
    ) -> List[WastelandCard]:
        """Draw cards using radiation-influenced shuffle

        Args:
            num_cards: Number of cards to draw
            radiation_factor: Influence of radiation on randomness (0.0-1.0)
            user_id: Optional user ID for personalized drawing and validation
        """
        # Validate user if provided
        user = None
        if user_id:
            user = await self._get_user_with_validation(user_id)

            # Check if user can draw cards (daily limit check)
            if not user.can_create_reading():
                raise InsufficientPermissionsError("Daily reading limit exceeded")

        all_cards = await self.get_all_cards()

        if not all_cards:
            return []

        # Apply user-personalized radiation factor if authenticated
        if user:
            # Adjust radiation factor based on user's karma
            karma_modifier = self._calculate_karma_radiation_modifier(user)
            radiation_factor = min(1.0, radiation_factor * karma_modifier)

        # Apply radiation shuffle
        shuffled_cards = RadiationRandomnessEngine.wasteland_fisher_yates_shuffle(
            all_cards, radiation_factor
        )

        # Return requested number of cards
        drawn_cards = shuffled_cards[:num_cards]

        # Update draw statistics
        for card in drawn_cards:
            card.draw_frequency += 1
            card.total_appearances += 1
            card.last_drawn_at = str(int(time.time()))

        await self.db.commit()
        return drawn_cards

    async def calculate_deck_statistics(self) -> Dict[str, Any]:
        """Calculate various deck statistics"""
        all_cards = await self.get_all_cards()

        if not all_cards:
            return {
                "total_cards": 0,
                "major_arcana_count": 0,
                "minor_arcana_count": 0,
                "average_radiation": 0.0,
                "average_threat_level": 0.0,
                "suit_distribution": {},
                "radiation_distribution": {}
            }

        # Basic counts
        total_cards = len(all_cards)
        major_arcana = [c for c in all_cards if c.suit == WastelandSuit.MAJOR_ARCANA.value]
        minor_arcana = [c for c in all_cards if c.suit != WastelandSuit.MAJOR_ARCANA.value]

        # Suit distribution
        suit_counts = {}
        for suit in WastelandSuit:
            count = len([c for c in all_cards if c.suit == suit.value])
            suit_counts[suit.value] = count

        # Radiation levels
        radiation_levels = [c.radiation_level for c in all_cards if c.radiation_level is not None]
        avg_radiation = sum(radiation_levels) / len(radiation_levels) if radiation_levels else 0.0

        # Threat levels
        threat_levels = [c.threat_level for c in all_cards if c.threat_level is not None]
        avg_threat = sum(threat_levels) / len(threat_levels) if threat_levels else 0.0

        # Radiation distribution buckets
        radiation_buckets = {"low": 0, "medium": 0, "high": 0}
        for level in radiation_levels:
            if level < 0.3:
                radiation_buckets["low"] += 1
            elif level < 0.7:
                radiation_buckets["medium"] += 1
            else:
                radiation_buckets["high"] += 1

        return {
            "total_cards": total_cards,
            "major_arcana_count": len(major_arcana),
            "minor_arcana_count": len(minor_arcana),
            "average_radiation": round(avg_radiation, 3),
            "average_threat_level": round(avg_threat, 1),
            "suit_distribution": suit_counts,
            "radiation_distribution": radiation_buckets
        }

    async def get_most_drawn_cards(self, limit: int = 10) -> List[WastelandCard]:
        """Get cards sorted by draw frequency"""
        result = await self.db.execute(
            select(WastelandCard)
            .order_by(WastelandCard.draw_frequency.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def cache_all_cards(self) -> bool:
        """Simulate caching all cards (for testing)"""
        cards = await self.get_all_cards()
        # In a real implementation, this would cache to Redis
        return len(cards) > 0

    async def invalidate_card_cache(self, card_id: str) -> bool:
        """Simulate cache invalidation for a specific card"""
        card = await self.get_card_by_id(card_id)
        # In a real implementation, this would remove from Redis cache
        return card is not None

    def get_karma_interpretation(self, card: WastelandCard, karma: KarmaAlignment) -> str:
        """Get card interpretation based on karma alignment"""
        return card.get_karma_interpretation(karma)

    def get_character_voice_interpretation(self, card: WastelandCard, voice: CharacterVoice) -> str:
        """Get card interpretation in specific character voice"""
        return card.get_character_voice_interpretation(voice)

    def get_faction_significance(self, card: WastelandCard, faction: FactionAlignment) -> str:
        """Get card significance for specific faction"""
        return card.get_faction_significance(faction)

    async def _get_user_with_validation(self, user_id: str) -> User:
        """Get user with validation for card drawing permissions"""
        from sqlalchemy.orm import selectinload

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

    def _calculate_karma_radiation_modifier(self, user: User) -> float:
        """Calculate radiation factor modifier based on user's karma alignment"""
        karma = user.karma_alignment()

        if karma == KarmaAlignment.GOOD:
            # Good karma reduces chaos/radiation influence
            return 0.8
        elif karma == KarmaAlignment.EVIL:
            # Evil karma increases chaos/radiation influence
            return 1.3
        else:
            # Neutral karma has standard influence
            return 1.0

    async def get_personalized_cards_for_user(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[WastelandCard]:
        """Get cards personalized for user based on their preferences and faction"""
        user = await self._get_user_with_validation(user_id)

        # Get cards that align with user's faction
        if user.faction_alignment:
            # In a real implementation, this would filter cards by faction affinity
            # For now, return all cards sorted by threat level preference
            all_cards = await self.get_all_cards()

            # Sort by faction relevance (simplified)
            if user.faction_alignment == "Brotherhood":
                # Brotherhood prefers technology-related cards
                return all_cards[:limit]
            elif user.faction_alignment == "NCR":
                # NCR prefers order and civilization cards
                return all_cards[:limit]
            else:
                return all_cards[:limit]

        return await self.get_all_cards()[:limit]

    async def get_user_card_history(
        self,
        user_id: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get user's card drawing history and preferences"""
        user = await self._get_user_with_validation(user_id)

        # In a real implementation, this would query Reading records
        # For now, return mock data structure
        return {
            "total_draws": user.total_readings or 0,
            "favorite_suit": "major_arcana",  # Would be calculated from readings
            "most_drawn_cards": [],  # Would be calculated from readings
            "karma_influence": user.karma_alignment().value,
            "faction_preference": user.faction_alignment
        }