"""
AI-Powered Tarot Card Interpretation Service
Provides Fallout/Wasteland themed interpretations with character voice personalities
"""

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, AsyncIterator

from app.models.wasteland_card import WastelandCard, CharacterVoice, KarmaAlignment, FactionAlignment
from app.config import Settings
from app.services.ai_providers import AIProvider, create_ai_provider
from app.services.ai_providers.factory import auto_select_provider

logger = logging.getLogger(__name__)


class AIInterpretationCache:
    """Simple in-memory cache for AI interpretations"""

    def __init__(self, ttl_seconds: int = 3600):
        self._cache: Dict[str, tuple[str, datetime]] = {}
        self._ttl_seconds = ttl_seconds

    def get(self, key: str) -> Optional[str]:
        """Get cached interpretation if not expired"""
        if key in self._cache:
            interpretation, timestamp = self._cache[key]
            if datetime.utcnow() - timestamp < timedelta(seconds=self._ttl_seconds):
                return interpretation
            else:
                # Remove expired entry
                del self._cache[key]
        return None

    def set(self, key: str, interpretation: str) -> None:
        """Store interpretation in cache"""
        self._cache[key] = (interpretation, datetime.utcnow())

    def clear(self) -> None:
        """Clear entire cache"""
        self._cache.clear()

    def _generate_cache_key(
        self,
        card_name: str,
        character_voice: str,
        karma: str,
        question: str
    ) -> str:
        """Generate cache key from parameters"""
        key_string = f"{card_name}:{character_voice}:{karma}:{question}"
        return hashlib.md5(key_string.encode()).hexdigest()


class AIInterpretationService:
    """
    AI-powered tarot interpretation with Fallout character voices
    Supports multiple AI providers: OpenAI, Gemini, and Anthropic
    """

    # Character voice system prompts with Fallout personality
    CHARACTER_PROMPTS = {
        CharacterVoice.PIP_BOY: {
            "system": """You are a Pip-Boy 3000 Mark IV personal information processor from Fallout.
You analyze tarot readings with precise, data-driven insights. Your responses are:
- Technical and analytical, like a diagnostic computer
- Include statistics and probability assessments when relevant
- Use dry, matter-of-fact humor
- Reference S.P.E.C.I.A.L. stats, radiation levels, and vault-tec protocols
- Keep responses concise (150-250 words)
- End with a practical "Recommended Action" based on vault dweller survival protocols""",
            "tone": "analytical, technical, dry humor"
        },
        CharacterVoice.VAULT_DWELLER: {
            "system": """You are an optimistic Vault Dweller from Fallout who interprets tarot cards.
Your interpretations are:
- Hopeful and encouraging, seeing potential in every card
- Reference vault life, overseer wisdom, and community values
- Use vault-tec terminology and pre-war optimism
- Focus on growth, cooperation, and rebuilding
- Keep responses warm and supportive (150-250 words)
- End with an encouraging message about making the wasteland a better place""",
            "tone": "optimistic, hopeful, community-focused"
        },
        CharacterVoice.SUPER_MUTANT: {
            "system": """You are a Super Mutant from Fallout interpreting tarot cards.
Your interpretations are:
- Direct and simple, using straightforward language
- Focus on strength, survival, and action
- Occasionally mention "weak humans" vs "strong mutants"
- Use short, punchy sentences
- Reference hunting, fighting, and wasteland survival
- Keep responses brief and forceful (150-200 words)
- End with a blunt call to action: "You do this. Strong choice." or similar""",
            "tone": "direct, forceful, simple language"
        },
        CharacterVoice.WASTELAND_TRADER: {
            "system": """You are a pragmatic Wasteland Trader from Fallout.
Your interpretations are:
- Practical and transactional, viewing life through supply and demand
- Frequently mention caps, trades, and value
- Use merchant wisdom and economic metaphors
- Reference caravans, settlements, and trade routes
- Keep responses business-minded but street-smart (150-250 words)
- End with advice framed as a "good deal" or "bad investment" metaphor""",
            "tone": "pragmatic, business-minded, street-smart"
        },
        CharacterVoice.CODSWORTH: {
            "system": """You are Codsworth, a polite Mr. Handy robot from Fallout.
Your interpretations are:
- Extremely polite and proper, using British butler mannerisms
- Reference pre-war etiquette, proper behavior, and household management
- Express concern for "mum" or "sir" with genteel worry
- Use phrases like "I dare say," "most concerning," "if I may be so bold"
- Keep responses courteous and refined (150-250 words)
- End with a polite offer of assistance: "Shall I prepare tea whilst you ponder this?"
""",
            "tone": "polite, British, butler-like"
        }
    }

    def __init__(self, settings: Settings):
        self.settings = settings
        self.provider: Optional[AIProvider] = None
        self.cache = AIInterpretationCache(ttl_seconds=settings.ai_cache_ttl)
        self._initialize_provider()

    def _initialize_provider(self) -> None:
        """Initialize AI provider based on configuration"""
        if not self.settings.ai_enabled:
            logger.info("AI interpretation service disabled in configuration")
            return

        try:
            # Auto-select provider if not explicitly specified or no key for specified provider
            provider_info = auto_select_provider(
                openai_key=self.settings.openai_api_key,
                gemini_key=self.settings.gemini_api_key,
                anthropic_key=self.settings.anthropic_api_key,
                preferred_provider=self.settings.ai_provider
            )

            if not provider_info:
                logger.warning("No AI provider available (no API keys configured)")
                return

            provider_name, api_key = provider_info

            # Get model name based on provider
            if provider_name == "openai":
                model = self.settings.openai_model
                kwargs = {}
                if self.settings.openai_organization:
                    kwargs["organization"] = self.settings.openai_organization
            elif provider_name == "gemini":
                model = self.settings.gemini_model
                kwargs = {}
            elif provider_name == "anthropic":
                model = self.settings.anthropic_model
                kwargs = {}
            else:
                logger.error(f"Unknown provider: {provider_name}")
                return

            # Create provider instance
            self.provider = create_ai_provider(
                provider_name=provider_name,
                api_key=api_key,
                model=model,
                **kwargs
            )

            if self.provider and self.provider.is_available():
                info = self.provider.get_provider_info()
                logger.info(
                    f"AI interpretation service initialized: "
                    f"provider={info['provider']}, model={info['model']}, "
                    f"estimated_cost=${info['estimated_cost']:.6f}/request"
                )
            else:
                logger.error("Failed to initialize AI provider")
                self.provider = None

        except Exception as e:
            logger.error(f"Failed to initialize AI provider: {e}", exc_info=True)
            self.provider = None

    def is_available(self) -> bool:
        """Check if AI service is available"""
        return (
            self.provider is not None
            and self.provider.is_available()
            and self.settings.ai_enabled
        )

    def get_provider_info(self) -> Optional[Dict[str, Any]]:
        """Get current provider information"""
        if self.provider:
            return self.provider.get_provider_info()
        return None

    async def generate_interpretation(
        self,
        card: WastelandCard,
        character_voice: CharacterVoice,
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment] = None,
        position_meaning: Optional[str] = None,
        timeout: float = 10.0
    ) -> Optional[str]:
        """
        Generate AI-powered interpretation for a tarot card

        Returns None if AI is unavailable or fails (caller should use fallback)
        """
        if not self.is_available():
            logger.debug("AI service not available, returning None for fallback")
            return None

        # Check cache first
        cache_key = self._generate_cache_key(
            card.name, character_voice.value, karma.value, question
        )
        cached = self.cache.get(cache_key)
        if cached:
            logger.info(f"Returning cached interpretation for {card.name}")
            return cached

        try:
            # Generate interpretation with timeout
            interpretation = await asyncio.wait_for(
                self._generate_single_card_interpretation(
                    card, character_voice, question, karma, faction, position_meaning
                ),
                timeout=timeout
            )

            if interpretation:
                # Cache successful result
                self.cache.set(cache_key, interpretation)
                logger.info(f"Generated AI interpretation for {card.name} as {character_voice.value}")

            return interpretation

        except asyncio.TimeoutError:
            logger.warning(f"AI interpretation timeout after {timeout}s for card {card.name}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in AI interpretation: {e}", exc_info=True)
            return None

    async def generate_multi_card_interpretation(
        self,
        cards: List[WastelandCard],
        character_voice: CharacterVoice,
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment] = None,
        spread_type: str = "three_card",
        timeout: float = 15.0
    ) -> Optional[str]:
        """
        Generate AI interpretation for multiple cards in a spread

        Returns None if AI is unavailable or fails
        """
        if not self.is_available() or len(cards) == 0:
            return None

        try:
            interpretation = await asyncio.wait_for(
                self._generate_multi_card_interpretation_internal(
                    cards, character_voice, question, karma, faction, spread_type
                ),
                timeout=timeout
            )

            if interpretation:
                logger.info(f"Generated multi-card AI interpretation for {len(cards)} cards")

            return interpretation

        except asyncio.TimeoutError:
            logger.warning(f"Multi-card AI interpretation timeout after {timeout}s")
            return None
        except Exception as e:
            logger.error(f"Error in multi-card AI interpretation: {e}", exc_info=True)
            return None

    async def _generate_single_card_interpretation(
        self,
        card: WastelandCard,
        character_voice: CharacterVoice,
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment],
        position_meaning: Optional[str]
    ) -> Optional[str]:
        """Generate single card interpretation using configured provider"""
        if not self.provider:
            return None

        # Get character prompt
        char_prompt = self.CHARACTER_PROMPTS.get(character_voice)
        if not char_prompt:
            logger.warning(f"Unknown character voice: {character_voice}")
            return None

        # Build user prompt
        user_prompt = self._build_card_interpretation_prompt(
            card, question, karma, faction, position_meaning
        )

        try:
            # Call provider API
            interpretation = await self.provider.generate_completion(
                system_prompt=char_prompt["system"],
                user_prompt=user_prompt,
                max_tokens=self.settings.ai_max_tokens,
                temperature=self.settings.ai_temperature
            )

            return interpretation

        except Exception as e:
            logger.error(f"AI provider call failed: {e}")
            raise

    async def _generate_multi_card_interpretation_internal(
        self,
        cards: List[WastelandCard],
        character_voice: CharacterVoice,
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment],
        spread_type: str
    ) -> Optional[str]:
        """Generate multi-card spread interpretation using configured provider"""
        if not self.provider:
            return None

        char_prompt = self.CHARACTER_PROMPTS.get(character_voice)
        if not char_prompt:
            return None

        user_prompt = self._build_multi_card_prompt(
            cards, question, karma, faction, spread_type
        )

        try:
            # Call provider API with more tokens for multi-card
            interpretation = await self.provider.generate_completion(
                system_prompt=char_prompt["system"],
                user_prompt=user_prompt,
                max_tokens=self.settings.ai_max_tokens * 2,
                temperature=self.settings.ai_temperature
            )

            return interpretation

        except Exception as e:
            logger.error(f"Multi-card AI provider call failed: {e}")
            raise

    def _build_card_interpretation_prompt(
        self,
        card: WastelandCard,
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment],
        position_meaning: Optional[str]
    ) -> str:
        """Build prompt for single card interpretation"""
        prompt_parts = [
            f"**Card Drawn:** {card.name}",
            f"**Card Meaning:** {card.upright_meaning}",
            f"**Question Asked:** {question}",
            f"**Querent's Karma Alignment:** {karma.value}",
        ]

        if card.suit:
            prompt_parts.append(f"**Suit:** {card.suit.value}")

        if card.radiation_level:
            prompt_parts.append(f"**Radiation Level:** {card.radiation_level}/5 (intensity of change/chaos)")

        if faction:
            prompt_parts.append(f"**Faction Affiliation:** {faction.value}")

        if position_meaning:
            prompt_parts.append(f"**Position in Spread:** {position_meaning}")

        prompt_parts.append(
            "\nProvide a Fallout-themed interpretation of this card in relation to the question. "
            "Stay in character. Reference Fallout lore, wasteland survival, and the specific karma/faction context. "
            "Keep it to 150-250 words. Be insightful, entertaining, and true to the Fallout universe."
        )

        return "\n".join(prompt_parts)

    def _build_multi_card_prompt(
        self,
        cards: List[WastelandCard],
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment],
        spread_type: str
    ) -> str:
        """Build prompt for multi-card spread interpretation"""
        spread_positions = {
            "three_card": ["Past", "Present", "Future"],
            "celtic_cross": ["Present", "Challenge", "Past", "Future", "Above", "Below",
                            "Advice", "External", "Hopes", "Outcome"],
            "relationship": ["You", "Them", "The Relationship"],
            "decision": ["Option A", "Option B", "Outcome if A", "Outcome if B"]
        }

        positions = spread_positions.get(spread_type, [f"Position {i+1}" for i in range(len(cards))])

        prompt_parts = [
            f"**Spread Type:** {spread_type.replace('_', ' ').title()}",
            f"**Question:** {question}",
            f"**Karma Alignment:** {karma.value}",
        ]

        if faction:
            prompt_parts.append(f"**Faction:** {faction.value}")

        prompt_parts.append("\n**Cards Drawn:**")

        for i, card in enumerate(cards):
            position = positions[i] if i < len(positions) else f"Position {i+1}"
            prompt_parts.append(
                f"{i+1}. {position}: **{card.name}** - {card.upright_meaning}"
            )

        prompt_parts.append(
            "\nProvide a cohesive Fallout-themed interpretation of this entire spread. "
            "Explain how the cards connect to tell a story. Reference Fallout lore and wasteland wisdom. "
            "Address the question directly. Stay in character. Keep it to 250-400 words total."
        )

        return "\n".join(prompt_parts)

    def _generate_cache_key(
        self,
        card_name: str,
        character_voice: str,
        karma: str,
        question: str
    ) -> str:
        """Generate cache key for interpretation"""
        key_string = f"{card_name}:{character_voice}:{karma}:{question[:50]}"
        return hashlib.md5(key_string.encode()).hexdigest()

    async def generate_interpretation_stream(
        self,
        card: WastelandCard,
        character_voice: CharacterVoice,
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment] = None,
        position_meaning: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """
        Generate AI-powered interpretation for a tarot card as a stream

        Yields text chunks as they are generated from the AI provider.
        Does not use cache for streaming responses.

        Args:
            card: The wasteland card to interpret
            character_voice: Character voice personality
            question: User's question
            karma: Karma alignment context
            faction: Optional faction influence
            position_meaning: Optional position in spread

        Yields:
            Text chunks as they are generated
        """
        if not self.is_available():
            logger.debug("AI service not available for streaming")
            return

        try:
            # Get character prompt
            char_prompt = self.CHARACTER_PROMPTS.get(character_voice)
            if not char_prompt:
                logger.warning(f"Unknown character voice: {character_voice}")
                return

            # Build user prompt
            user_prompt = self._build_card_interpretation_prompt(
                card, question, karma, faction, position_meaning
            )

            # Stream from provider
            async for chunk in self.provider.generate_completion_stream(
                system_prompt=char_prompt["system"],
                user_prompt=user_prompt,
                max_tokens=self.settings.ai_max_tokens,
                temperature=self.settings.ai_temperature
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Error in streaming interpretation: {e}", exc_info=True)
            return

    async def generate_multi_card_interpretation_stream(
        self,
        cards: List[WastelandCard],
        character_voice: CharacterVoice,
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment] = None,
        spread_type: str = "three_card",
    ) -> AsyncIterator[str]:
        """
        Generate AI interpretation for multiple cards in a spread as a stream

        Args:
            cards: List of cards in the spread
            character_voice: Character voice personality
            question: User's question
            karma: Karma alignment context
            faction: Optional faction influence
            spread_type: Type of spread layout

        Yields:
            Text chunks as they are generated
        """
        if not self.is_available() or len(cards) == 0:
            return

        try:
            char_prompt = self.CHARACTER_PROMPTS.get(character_voice)
            if not char_prompt:
                return

            user_prompt = self._build_multi_card_prompt(
                cards, question, karma, faction, spread_type
            )

            # Stream from provider with more tokens for multi-card
            async for chunk in self.provider.generate_completion_stream(
                system_prompt=char_prompt["system"],
                user_prompt=user_prompt,
                max_tokens=self.settings.ai_max_tokens * 2,
                temperature=self.settings.ai_temperature
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Error in multi-card streaming: {e}", exc_info=True)
            return