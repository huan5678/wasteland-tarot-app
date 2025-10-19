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

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.wasteland_card import WastelandCard, CharacterVoice, KarmaAlignment, FactionAlignment
from app.models.character_voice import Character, Faction
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

    Database-Driven Configuration:
    - Character AI prompts stored in `characters` table
    - Faction AI styles stored in `factions` table
    """

    def __init__(self, settings: Settings, db_session: AsyncSession, provider: Optional[AIProvider] = None):
        """
        Initialize AI Interpretation Service

        Args:
            settings: Application settings
            db_session: Database session for loading AI configurations
            provider: Optional custom AI provider (if not provided, auto-selects based on settings)
        """
        self.settings = settings
        self.db_session = db_session
        self.provider: Optional[AIProvider] = provider
        self.cache = AIInterpretationCache(ttl_seconds=settings.ai_cache_ttl)

        # Only auto-initialize if provider not provided
        if not self.provider:
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

    async def _get_character_prompt(self, character_voice: CharacterVoice) -> Optional[Dict[str, Any]]:
        """
        從資料庫讀取角色 AI 配置

        Args:
            character_voice: 角色類型（Enum）

        Returns:
            Dict with 'system' and 'tone' keys, or None if not found
        """
        try:
            # 將 Enum 轉換為字串 key（例如：CharacterVoice.PIP_BOY -> "pip_boy"）
            character_key = character_voice.value

            result = await self.db_session.execute(
                select(Character).where(Character.key == character_key)
            )
            character = result.scalar_one_or_none()

            if not character or not character.ai_system_prompt:
                logger.warning(f"No AI config found for character '{character_key}', using fallback")
                return None

            return {
                "system": character.ai_system_prompt,
                "tone": character.ai_tone_description or "neutral",
                "config": character.ai_prompt_config or {}
            }

        except Exception as e:
            logger.error(f"Failed to load character prompt for {character_voice.value}: {e}", exc_info=True)
            return None

    async def _get_faction_style(self, faction: FactionAlignment) -> Optional[Dict[str, Any]]:
        """
        從資料庫讀取陣營 AI 風格配置

        Args:
            faction: 陣營類型（Enum）

        Returns:
            Dict with faction style config, or None if not found
        """
        try:
            # 將 Enum 轉換為字串 key（例如：FactionAlignment.VAULT_DWELLER -> "vault_dweller"）
            faction_key = faction.value

            result = await self.db_session.execute(
                select(Faction).where(Faction.key == faction_key)
            )
            faction_obj = result.scalar_one_or_none()

            if not faction_obj or not faction_obj.ai_style_config:
                logger.warning(f"No AI style config found for faction '{faction_key}'")
                return None

            return faction_obj.ai_style_config

        except Exception as e:
            logger.error(f"Failed to load faction style for {faction.value}: {e}", exc_info=True)
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
        """Generate single card interpretation using database-driven configuration"""
        if not self.provider:
            return None

        # Get character prompt from database
        char_prompt = await self._get_character_prompt(character_voice)
        if not char_prompt:
            logger.warning(f"No AI config found for character voice: {character_voice}")
            return None

        # Build user prompt
        user_prompt = await self._build_card_interpretation_prompt(
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
        """Generate multi-card spread interpretation using database-driven configuration"""
        if not self.provider:
            return None

        # Get character prompt from database
        char_prompt = await self._get_character_prompt(character_voice)
        if not char_prompt:
            logger.warning(f"No AI config found for character voice: {character_voice}")
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

    async def _build_card_interpretation_prompt(
        self,
        card: WastelandCard,
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment],
        position_meaning: Optional[str]
    ) -> str:
        """Build prompt for single card interpretation with faction style integration"""
        prompt_parts = [
            "【重要】請務必使用繁體中文 (zh-TW) 回答所有內容。",
            "",
            f"**Card Drawn:** {card.name}",
            f"**Card Meaning:** {card.upright_meaning}",
            f"**Question Asked:** {question}",
            f"**Querent's Karma Alignment:** {karma.value}",
        ]

        if card.suit:
            prompt_parts.append(f"**Suit:** {card.suit.value}")

        if card.radiation_level:
            prompt_parts.append(f"**Radiation Level:** {card.radiation_level}/5 (intensity of change/chaos)")

        # Integrate faction style if provided
        if faction:
            faction_style = await self._get_faction_style(faction)
            if faction_style:
                prompt_parts.append(f"\n**Faction Context: {faction.value}**")
                prompt_parts.append(f"- Faction Tone: {faction_style.get('tone', 'neutral')}")
                prompt_parts.append(f"- Faction Perspective: {faction_style.get('perspective', '')}")
                prompt_parts.append(f"- Key Themes: {', '.join(faction_style.get('key_themes', []))}")

                # Add faction style modifiers as guidance
                style_modifiers = faction_style.get('style_modifiers', '')
                if style_modifiers:
                    prompt_parts.append(f"\n**Style Guidance:** {style_modifiers}")
            else:
                prompt_parts.append(f"**Faction Affiliation:** {faction.value}")

        if position_meaning:
            prompt_parts.append(f"\n**Position in Spread:** {position_meaning}")

        prompt_parts.append(
            f"\n【解讀指引】用繁體中文 (zh-TW) 回答，結合廢土風格的塔羅解讀："
            f"\n1. 直接回答問題：針對「{question}」給出明確的洞見和建議"
            f"\n2. 連結牌義：解釋【{card.name}】如何回應這個問題"
            f"\n3. 具體應用：給出可行的建議或行動方向"
            f"\n4. 廢土風格：融入 Fallout 世界觀、業力/陣營情境，保持角色扮演"
            f"\n5. 字數限制：300字以內，精準有力"
            f"\n\n請提供深刻、實用的解讀，幫助問卜者在廢土中找到方向。"
        )

        return "\n".join(prompt_parts)

    async def _build_multi_card_prompt(
        self,
        cards: List[WastelandCard],
        question: str,
        karma: KarmaAlignment,
        faction: Optional[FactionAlignment],
        spread_type: str
    ) -> str:
        """Build prompt for multi-card spread interpretation with faction style integration"""
        spread_positions = {
            "three_card": ["Past", "Present", "Future"],
            "celtic_cross": ["Present", "Challenge", "Past", "Future", "Above", "Below",
                            "Advice", "External", "Hopes", "Outcome"],
            "relationship": ["You", "Them", "The Relationship"],
            "decision": ["Option A", "Option B", "Outcome if A", "Outcome if B"]
        }

        positions = spread_positions.get(spread_type, [f"Position {i+1}" for i in range(len(cards))])

        # 根據卡牌數量動態設定字數限制
        card_count = len(cards)
        if card_count <= 3:
            max_chars = 300
        elif card_count <= 7:
            max_chars = 600
        else:
            max_chars = 800

        prompt_parts = [
            "【重要】請務必使用繁體中文 (zh-TW) 回答所有內容。",
            "",
            f"**Spread Type:** {spread_type.replace('_', ' ').title()}",
            f"**Question:** {question}",
            f"**Karma Alignment:** {karma.value}",
        ]

        # Integrate faction style if provided
        if faction:
            faction_style = await self._get_faction_style(faction)
            if faction_style:
                prompt_parts.append(f"\n**Faction Context: {faction.value}**")
                prompt_parts.append(f"- Faction Tone: {faction_style.get('tone', 'neutral')}")
                prompt_parts.append(f"- Faction Perspective: {faction_style.get('perspective', '')}")
                prompt_parts.append(f"- Key Themes: {', '.join(faction_style.get('key_themes', []))}")

                # Add faction style modifiers as guidance
                style_modifiers = faction_style.get('style_modifiers', '')
                if style_modifiers:
                    prompt_parts.append(f"\n**Style Guidance:** {style_modifiers}")
            else:
                prompt_parts.append(f"**Faction Affiliation:** {faction.value}")

        prompt_parts.append("\n**Cards Drawn:**")

        for i, card in enumerate(cards):
            position = positions[i] if i < len(positions) else f"Position {i+1}"
            prompt_parts.append(
                f"{i+1}. {position}: **{card.name}** - {card.upright_meaning}"
            )

        prompt_parts.append(
            f"\n【解讀指引】用繁體中文 (zh-TW) 提供完整牌陣解讀："
            f"\n1. 直接回答問題：針對「{question}」給出明確的核心洞見"
            f"\n2. 講述故事：將 {len(cards)} 張牌組合成連貫的敘事，展示它們如何共同回應問題"
            f"\n3. 位置意義：根據每張牌在牌陣中的位置（{', '.join(positions[:len(cards)])}）解釋其意義"
            f"\n4. 牌間關係：說明卡牌之間如何互相影響、支持或挑戰"
            f"\n5. 具體建議：基於整體牌陣，給出可行的行動方向或警示"
            f"\n6. 廢土風格：融入 Fallout 世界觀、業力/陣營情境，保持角色扮演"
            f"\n7. 字數限制：{max_chars}字以內"
            f"\n\n請提供深刻、實用的解讀，將所有牌組成一個完整的答案，幫助問卜者理解當前處境並找到方向。"
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
            # Get character prompt from database
            char_prompt = await self._get_character_prompt(character_voice)
            if not char_prompt:
                logger.warning(f"No AI config found for character voice: {character_voice}")
                return

            # Build user prompt
            user_prompt = await self._build_card_interpretation_prompt(
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
            # Load character prompt from database
            char_prompt = await self._get_character_prompt(character_voice)
            if not char_prompt:
                logger.warning(f"No AI config found for character voice: {character_voice}")
                return

            # Build multi-card prompt with faction style integration
            user_prompt = await self._build_multi_card_prompt(
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