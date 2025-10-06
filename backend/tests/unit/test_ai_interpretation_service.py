"""
Unit tests for AI Interpretation Service
Tests AI-powered tarot interpretation with Fallout character voices
Supports multiple providers: OpenAI, Gemini, and Anthropic
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from app.services.ai_interpretation_service import (
    AIInterpretationService,
    AIInterpretationCache
)
from app.models.wasteland_card import WastelandCard, CharacterVoice, KarmaAlignment, FactionAlignment
from app.config import Settings
import asyncio


@pytest.fixture
def mock_settings_openai():
    """Create mock settings with OpenAI provider"""
    settings = Mock(spec=Settings)
    settings.ai_enabled = True
    settings.ai_provider = "openai"
    settings.openai_api_key = "test_openai_key"
    settings.openai_model = "gpt-4o"
    settings.openai_organization = None
    settings.gemini_api_key = None
    settings.anthropic_api_key = None
    settings.ai_max_tokens = 500
    settings.ai_temperature = 0.8
    settings.ai_cache_ttl = 3600
    settings.ai_fallback_to_template = True
    return settings


@pytest.fixture
def mock_settings_gemini():
    """Create mock settings with Gemini provider"""
    settings = Mock(spec=Settings)
    settings.ai_enabled = True
    settings.ai_provider = "gemini"
    settings.gemini_api_key = "test_gemini_key"
    settings.gemini_model = "gemini-1.5-pro"
    settings.openai_api_key = None
    settings.anthropic_api_key = None
    settings.ai_max_tokens = 500
    settings.ai_temperature = 0.8
    settings.ai_cache_ttl = 3600
    settings.ai_fallback_to_template = True
    return settings


@pytest.fixture
def mock_settings_anthropic():
    """Create mock settings with Anthropic provider"""
    settings = Mock(spec=Settings)
    settings.ai_enabled = True
    settings.ai_provider = "anthropic"
    settings.anthropic_api_key = "test_anthropic_key"
    settings.anthropic_model = "claude-3-5-sonnet-20241022"
    settings.openai_api_key = None
    settings.gemini_api_key = None
    settings.ai_max_tokens = 500
    settings.ai_temperature = 0.8
    settings.ai_cache_ttl = 3600
    settings.ai_fallback_to_template = True
    return settings


@pytest.fixture
def mock_settings_disabled():
    """Create mock settings with AI disabled"""
    settings = Mock(spec=Settings)
    settings.ai_enabled = False
    settings.openai_api_key = None
    settings.gemini_api_key = None
    settings.anthropic_api_key = None
    settings.ai_cache_ttl = 3600
    return settings


@pytest.fixture
def sample_card():
    """Create a sample wasteland card for testing"""
    card = Mock(spec=WastelandCard)
    card.id = "test_card_001"
    card.name = "The Vault Dweller"
    card.upright_meaning = "New beginnings, hope, and adventure in the wasteland"
    card.description = "A lone figure emerges from Vault 101, ready to face the wastes"
    card.suit = None  # Major Arcana
    card.radiation_level = 2.5
    return card


@pytest.fixture
def multiple_cards():
    """Create multiple cards for spread testing"""
    cards = []
    for i in range(3):
        card = Mock(spec=WastelandCard)
        card.id = f"test_card_{i:03d}"
        card.name = f"Test Card {i}"
        card.upright_meaning = f"Meaning {i}"
        card.description = f"Description {i}"
        card.suit = None
        card.radiation_level = float(i + 1)
        cards.append(card)
    return cards


class TestAIInterpretationCache:
    """Test the AI interpretation cache"""

    def test_cache_stores_and_retrieves(self):
        """Test basic cache storage and retrieval"""
        cache = AIInterpretationCache(ttl_seconds=3600)

        cache.set("test_key", "test_interpretation")
        result = cache.get("test_key")

        assert result == "test_interpretation"

    def test_cache_returns_none_for_missing_key(self):
        """Test cache returns None for non-existent keys"""
        cache = AIInterpretationCache()

        result = cache.get("nonexistent_key")

        assert result is None

    def test_cache_expiration(self):
        """Test cache entries expire after TTL"""
        cache = AIInterpretationCache(ttl_seconds=0)  # Immediate expiration

        cache.set("test_key", "test_value")
        import time
        time.sleep(0.1)  # Wait a bit
        result = cache.get("test_key")

        assert result is None

    def test_cache_clear(self):
        """Test cache clearing"""
        cache = AIInterpretationCache()
        cache.set("key1", "value1")
        cache.set("key2", "value2")

        cache.clear()

        assert cache.get("key1") is None
        assert cache.get("key2") is None


class TestAIInterpretationServiceInitialization:
    """Test AI service initialization with multiple providers"""

    def test_service_initializes_with_openai(self, mock_settings_openai):
        """Test service initializes with OpenAI provider"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            assert service.is_available() is True
            assert service.provider is not None
            info = service.get_provider_info()
            assert info['provider'] == 'openai'

    def test_service_initializes_with_gemini(self, mock_settings_gemini):
        """Test service initializes with Gemini provider"""
        with patch('google.generativeai.configure'):
            with patch('app.services.ai_providers.gemini_provider.genai.GenerativeModel'):
                service = AIInterpretationService(mock_settings_gemini)

                assert service.is_available() is True
                assert service.provider is not None
                info = service.get_provider_info()
                assert info['provider'] == 'gemini'

    def test_service_initializes_with_anthropic(self, mock_settings_anthropic):
        """Test service initializes with Anthropic provider"""
        with patch('app.services.ai_providers.anthropic_provider.AsyncAnthropic'):
            service = AIInterpretationService(mock_settings_anthropic)

            assert service.is_available() is True
            assert service.provider is not None
            info = service.get_provider_info()
            assert info['provider'] == 'anthropic'

    def test_service_disabled_without_api_key(self, mock_settings_disabled):
        """Test service is disabled without API key"""
        service = AIInterpretationService(mock_settings_disabled)

        assert service.is_available() is False
        assert service.provider is None

    def test_service_handles_initialization_error(self, mock_settings_openai):
        """Test service handles initialization errors gracefully"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI',
                  side_effect=Exception("Init failed")):
            service = AIInterpretationService(mock_settings_openai)

            assert service.is_available() is False


@pytest.mark.character
class TestCharacterVoicePrompts:
    """Test character voice prompt configurations"""

    def test_all_character_voices_have_prompts(self, mock_settings_openai):
        """Test all character voices have configured prompts"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            # Test all 5 implemented character voices
            expected_voices = [
                CharacterVoice.PIP_BOY,
                CharacterVoice.VAULT_DWELLER,
                CharacterVoice.SUPER_MUTANT,
                CharacterVoice.WASTELAND_TRADER,
                CharacterVoice.CODSWORTH
            ]

            for voice in expected_voices:
                assert voice in service.CHARACTER_PROMPTS, f"{voice} missing from CHARACTER_PROMPTS"
                prompt = service.CHARACTER_PROMPTS[voice]
                assert "system" in prompt, f"{voice} prompt missing 'system' key"
                assert "tone" in prompt, f"{voice} prompt missing 'tone' key"
                assert len(prompt["system"]) > 0, f"{voice} system prompt is empty"

    def test_pip_boy_prompt_characteristics(self, mock_settings_openai):
        """Test Pip-Boy prompt has technical, analytical tone"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            prompt = service.CHARACTER_PROMPTS[CharacterVoice.PIP_BOY]

            assert "technical" in prompt["tone"].lower() or "analytical" in prompt["tone"].lower()
            assert "pip-boy" in prompt["system"].lower()
            assert "s.p.e.c.i.a.l" in prompt["system"].lower() or "statistics" in prompt["system"].lower()

    def test_super_mutant_prompt_characteristics(self, mock_settings_openai):
        """Test Super Mutant prompt has simple, direct language"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            prompt = service.CHARACTER_PROMPTS[CharacterVoice.SUPER_MUTANT]

            assert "simple" in prompt["tone"].lower() or "direct" in prompt["tone"].lower()
            assert "super mutant" in prompt["system"].lower()

    def test_wasteland_trader_prompt_characteristics(self, mock_settings_openai):
        """Test Wasteland Trader prompt has pragmatic, business-minded tone"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            prompt = service.CHARACTER_PROMPTS[CharacterVoice.WASTELAND_TRADER]

            assert "pragmatic" in prompt["tone"].lower() or "business" in prompt["tone"].lower()
            assert "trader" in prompt["system"].lower() or "merchant" in prompt["system"].lower()
            assert "caps" in prompt["system"].lower() or "trade" in prompt["system"].lower()

    def test_codsworth_prompt_characteristics(self, mock_settings_openai):
        """Test Codsworth prompt has polite, British butler tone"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            prompt = service.CHARACTER_PROMPTS[CharacterVoice.CODSWORTH]

            assert "polite" in prompt["tone"].lower() or "british" in prompt["tone"].lower()
            assert "codsworth" in prompt["system"].lower() or "handy" in prompt["system"].lower()


@pytest.mark.asyncio
class TestAIInterpretationGeneration:
    """Test AI interpretation generation"""

    async def test_returns_none_when_disabled(self, mock_settings_disabled, sample_card):
        """Test service returns None when AI is disabled"""
        service = AIInterpretationService(mock_settings_disabled)

        result = await service.generate_interpretation(
            card=sample_card,
            character_voice=CharacterVoice.PIP_BOY,
            question="What does my future hold?",
            karma=KarmaAlignment.NEUTRAL
        )

        assert result is None

    async def test_uses_cache_for_repeated_requests(self, mock_settings_openai, sample_card):
        """Test service uses cache for repeated identical requests"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            # First call - populate cache
            service.cache.set("test_hash", "cached_interpretation")

            # Mock the cache key generation to return our test key
            with patch.object(service, '_generate_cache_key', return_value="test_hash"):
                result = await service.generate_interpretation(
                    card=sample_card,
                    character_voice=CharacterVoice.PIP_BOY,
                    question="What does my future hold?",
                    karma=KarmaAlignment.NEUTRAL
                )

            assert result == "cached_interpretation"

    async def test_calls_provider_api_successfully(self, mock_settings_openai, sample_card):
        """Test successful API call to provider"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            # Mock the provider
            mock_provider = AsyncMock()
            mock_provider.is_available.return_value = True
            mock_provider.generate_completion = AsyncMock(
                return_value="This is a wasteland interpretation"
            )
            service.provider = mock_provider

            result = await service.generate_interpretation(
                card=sample_card,
                character_voice=CharacterVoice.PIP_BOY,
                question="What does my future hold?",
                karma=KarmaAlignment.GOOD
            )

            assert result == "This is a wasteland interpretation"
            mock_provider.generate_completion.assert_called_once()

    async def test_handles_api_error_gracefully(self, mock_settings_openai, sample_card):
        """Test service handles API errors and returns None"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            # Mock provider that raises an error
            mock_provider = AsyncMock()
            mock_provider.is_available.return_value = True
            mock_provider.generate_completion = AsyncMock(side_effect=Exception("API failed"))
            service.provider = mock_provider

            result = await service.generate_interpretation(
                card=sample_card,
                character_voice=CharacterVoice.PIP_BOY,
                question="Test question",
                karma=KarmaAlignment.NEUTRAL
            )

            assert result is None

    async def test_respects_timeout(self, mock_settings_openai, sample_card):
        """Test service respects timeout parameter"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            # Mock provider with slow response
            mock_provider = AsyncMock()
            mock_provider.is_available.return_value = True

            async def slow_call(*args, **kwargs):
                await asyncio.sleep(2)
                return "Too slow"

            mock_provider.generate_completion = slow_call
            service.provider = mock_provider

            result = await service.generate_interpretation(
                card=sample_card,
                character_voice=CharacterVoice.PIP_BOY,
                question="Test",
                karma=KarmaAlignment.NEUTRAL,
                timeout=0.1  # Very short timeout
            )

            assert result is None

    async def test_includes_faction_in_prompt(self, mock_settings_openai, sample_card):
        """Test service includes faction information when provided"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            # Mock provider
            mock_provider = AsyncMock()
            mock_provider.is_available.return_value = True
            mock_provider.generate_completion = AsyncMock(return_value="Brotherhood interpretation")
            service.provider = mock_provider

            await service.generate_interpretation(
                card=sample_card,
                character_voice=CharacterVoice.VAULT_DWELLER,
                question="Should I trust this technology?",
                karma=KarmaAlignment.GOOD,
                faction=FactionAlignment.BROTHERHOOD
            )

            # Check that the provider was called
            mock_provider.generate_completion.assert_called_once()
            call_kwargs = mock_provider.generate_completion.call_args.kwargs

            # Verify faction was included in the user prompt
            user_prompt = call_kwargs.get('user_prompt', '')
            assert "brotherhood" in user_prompt.lower(), f"Expected 'brotherhood' in prompt, got: {user_prompt}"


@pytest.mark.asyncio
class TestMultiCardInterpretation:
    """Test multi-card spread interpretation"""

    async def test_multi_card_interpretation(self, mock_settings_openai, multiple_cards):
        """Test multi-card spread interpretation"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            # Mock provider
            mock_provider = AsyncMock()
            mock_provider.is_available.return_value = True
            mock_provider.generate_completion = AsyncMock(return_value="Three card spread interpretation")
            service.provider = mock_provider

            result = await service.generate_multi_card_interpretation(
                cards=multiple_cards,
                character_voice=CharacterVoice.VAULT_DWELLER,
                question="What is my path forward?",
                karma=KarmaAlignment.GOOD,
                spread_type="three_card"
            )

            assert result == "Three card spread interpretation"
            mock_provider.generate_completion.assert_called_once()

    async def test_multi_card_uses_more_tokens(self, mock_settings_openai, multiple_cards):
        """Test multi-card interpretation requests more tokens"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            # Mock provider
            mock_provider = AsyncMock()
            mock_provider.is_available.return_value = True
            mock_provider.generate_completion = AsyncMock(return_value="Result")
            service.provider = mock_provider

            await service.generate_multi_card_interpretation(
                cards=multiple_cards,
                character_voice=CharacterVoice.PIP_BOY,
                question="Test",
                karma=KarmaAlignment.NEUTRAL,
                spread_type="three_card"
            )

            call_kwargs = mock_provider.generate_completion.call_args.kwargs
            # Should request double tokens for multi-card
            assert call_kwargs["max_tokens"] == mock_settings_openai.ai_max_tokens * 2

    async def test_multi_card_returns_none_when_disabled(self, mock_settings_disabled, multiple_cards):
        """Test multi-card returns None when AI is disabled"""
        service = AIInterpretationService(mock_settings_disabled)

        result = await service.generate_multi_card_interpretation(
            cards=multiple_cards,
            character_voice=CharacterVoice.WASTELAND_TRADER,
            question="What's ahead?",
            karma=KarmaAlignment.NEUTRAL
        )

        assert result is None

    async def test_multi_card_with_empty_list(self, mock_settings_openai):
        """Test multi-card gracefully handles empty card list"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            result = await service.generate_multi_card_interpretation(
                cards=[],
                character_voice=CharacterVoice.PIP_BOY,
                question="Test",
                karma=KarmaAlignment.NEUTRAL
            )

            assert result is None


@pytest.mark.asyncio
class TestPromptBuilding:
    """Test prompt building methods"""

    def test_single_card_prompt_includes_all_details(self, mock_settings_openai, sample_card):
        """Test single card prompt includes all required details"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            prompt = service._build_card_interpretation_prompt(
                card=sample_card,
                question="What should I do?",
                karma=KarmaAlignment.GOOD,
                faction=FactionAlignment.NCR,
                position_meaning="Future"
            )

            assert sample_card.name in prompt
            assert sample_card.upright_meaning in prompt
            assert "What should I do?" in prompt
            assert "good" in prompt.lower()
            assert "ncr" in prompt.lower()
            assert "Future" in prompt

    def test_multi_card_prompt_structure(self, mock_settings_openai, multiple_cards):
        """Test multi-card prompt has proper structure"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            prompt = service._build_multi_card_prompt(
                cards=multiple_cards,
                question="Path forward?",
                karma=KarmaAlignment.NEUTRAL,
                faction=None,
                spread_type="three_card"
            )

            assert "three card" in prompt.lower()
            assert "Path forward?" in prompt
            assert all(card.name in prompt for card in multiple_cards)

    def test_cache_key_generation_consistent(self, mock_settings_openai):
        """Test cache key generation is consistent"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            key1 = service._generate_cache_key("The Fool", "pip_boy", "neutral", "Test question")
            key2 = service._generate_cache_key("The Fool", "pip_boy", "neutral", "Test question")

            assert key1 == key2

    def test_cache_key_differs_for_different_inputs(self, mock_settings_openai):
        """Test cache key changes with different inputs"""
        with patch('app.services.ai_providers.openai_provider.AsyncOpenAI'):
            service = AIInterpretationService(mock_settings_openai)

            key1 = service._generate_cache_key("Card1", "pip_boy", "neutral", "Question1")
            key2 = service._generate_cache_key("Card2", "pip_boy", "neutral", "Question1")

            assert key1 != key2