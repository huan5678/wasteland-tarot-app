"""
Unit tests for streaming AI interpretation functionality
Tests streaming for all 3 providers: OpenAI, Gemini, and Anthropic
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import AsyncIterator

from app.services.ai_providers.openai_provider import OpenAIProvider
from app.services.ai_providers.anthropic_provider import AnthropicProvider
from app.services.ai_providers.gemini_provider import GeminiProvider
from app.services.ai_interpretation_service import AIInterpretationService
from app.models.wasteland_card import (
    WastelandCard,
    CharacterVoice,
    KarmaAlignment,
    FactionAlignment,
    WastelandSuit
)
from app.config import Settings


@pytest.fixture
def mock_settings():
    """Create mock settings for testing"""
    settings = Mock(spec=Settings)
    settings.ai_enabled = True
    settings.ai_max_tokens = 500
    settings.ai_temperature = 0.8
    settings.ai_cache_ttl = 3600
    settings.openai_api_key = "test-openai-key"
    settings.openai_model = "gpt-4o"
    settings.gemini_api_key = "test-gemini-key"
    settings.gemini_model = "gemini-1.5-pro"
    settings.anthropic_api_key = "test-anthropic-key"
    settings.anthropic_model = "claude-3-5-sonnet-20241022"
    settings.ai_provider = "openai"
    settings.openai_organization = None
    return settings


@pytest.fixture
def mock_wasteland_card():
    """Create mock wasteland card for testing"""
    card = Mock(spec=WastelandCard)
    card.id = "the-fool"
    card.name = "The Fool"
    card.upright_meaning = "New beginnings, innocence, adventure in the wasteland"
    card.suit = WastelandSuit.MAJOR_ARCANA
    card.radiation_level = 2
    return card


class TestOpenAIStreamingProvider:
    """Tests for OpenAI streaming provider"""

    @pytest.mark.asyncio
    async def test_openai_stream_basic(self):
        """Test basic OpenAI streaming"""
        provider = OpenAIProvider(api_key="test-key", model="gpt-4o")

        # Mock the client
        mock_client = AsyncMock()
        provider.client = mock_client

        # Mock streaming response
        async def mock_stream():
            """Mock async generator for streaming"""
            chunks = ["Hello", " wasteland", " dweller", "!"]
            for chunk in chunks:
                mock_choice = Mock()
                mock_delta = Mock()
                mock_delta.content = chunk
                mock_choice.delta = mock_delta
                mock_chunk = Mock()
                mock_chunk.choices = [mock_choice]
                yield mock_chunk

        mock_client.chat.completions.create = AsyncMock(return_value=mock_stream())

        # Test streaming
        result_chunks = []
        async for chunk in provider.generate_completion_stream(
            system_prompt="Test system",
            user_prompt="Test user"
        ):
            result_chunks.append(chunk)

        assert result_chunks == ["Hello", " wasteland", " dweller", "!"]

    @pytest.mark.asyncio
    async def test_openai_stream_empty(self):
        """Test OpenAI streaming with empty response"""
        provider = OpenAIProvider(api_key="test-key", model="gpt-4o")
        provider.client = AsyncMock()

        async def mock_empty_stream():
            return
            yield  # pragma: no cover

        provider.client.chat.completions.create = AsyncMock(return_value=mock_empty_stream())

        result_chunks = []
        async for chunk in provider.generate_completion_stream(
            system_prompt="Test",
            user_prompt="Test"
        ):
            result_chunks.append(chunk)

        assert result_chunks == []


class TestAnthropicStreamingProvider:
    """Tests for Anthropic streaming provider"""

    @pytest.mark.asyncio
    async def test_anthropic_stream_basic(self):
        """Test basic Anthropic streaming"""
        provider = AnthropicProvider(api_key="test-key", model="claude-3-5-sonnet-20241022")

        # Mock the client
        mock_client = AsyncMock()
        provider.client = mock_client

        # Mock streaming context manager
        mock_stream_manager = AsyncMock()

        async def mock_text_stream():
            """Mock text stream generator"""
            chunks = ["The", " wasteland", " awaits"]
            for chunk in chunks:
                yield chunk

        mock_stream_manager.__aenter__ = AsyncMock(return_value=Mock(text_stream=mock_text_stream()))
        mock_stream_manager.__aexit__ = AsyncMock(return_value=None)

        mock_client.messages.stream = Mock(return_value=mock_stream_manager)

        # Test streaming
        result_chunks = []
        async for chunk in provider.generate_completion_stream(
            system_prompt="Test system",
            user_prompt="Test user"
        ):
            result_chunks.append(chunk)

        assert result_chunks == ["The", " wasteland", " awaits"]


class TestGeminiStreamingProvider:
    """Tests for Gemini streaming provider"""

    @pytest.mark.asyncio
    async def test_gemini_stream_basic(self):
        """Test basic Gemini streaming"""
        provider = GeminiProvider(api_key="test-key", model="gemini-1.5-pro")
        provider._initialized = True

        # Mock the client
        mock_client = Mock()
        provider.client = mock_client

        # Mock streaming response
        async def mock_stream_response():
            """Mock stream response generator"""
            chunks_data = [
                Mock(text="War..."),
                Mock(text=" war never"),
                Mock(text=" changes"),
            ]
            for chunk in chunks_data:
                yield chunk

        mock_client.generate_content_async = AsyncMock(return_value=mock_stream_response())

        # Test streaming
        result_chunks = []
        async for chunk in provider.generate_completion_stream(
            system_prompt="Test system",
            user_prompt="Test user"
        ):
            result_chunks.append(chunk)

        assert result_chunks == ["War...", " war never", " changes"]


class TestAIInterpretationServiceStreaming:
    """Tests for AI interpretation service streaming methods"""

    @pytest.mark.asyncio
    async def test_single_card_stream(self, mock_settings, mock_wasteland_card):
        """Test single card interpretation streaming"""
        service = AIInterpretationService(mock_settings)

        # Mock provider with streaming
        mock_provider = AsyncMock()

        async def mock_stream():
            chunks = ["The Fool", " represents", " new beginnings"]
            for chunk in chunks:
                yield chunk

        mock_provider.generate_completion_stream = Mock(return_value=mock_stream())
        mock_provider.is_available = Mock(return_value=True)
        service.provider = mock_provider

        # Test streaming
        result_chunks = []
        async for chunk in service.generate_interpretation_stream(
            card=mock_wasteland_card,
            character_voice=CharacterVoice.PIP_BOY,
            question="What is my future?",
            karma=KarmaAlignment.NEUTRAL
        ):
            result_chunks.append(chunk)

        assert result_chunks == ["The Fool", " represents", " new beginnings"]
        mock_provider.generate_completion_stream.assert_called_once()

    @pytest.mark.asyncio
    async def test_multi_card_stream(self, mock_settings, mock_wasteland_card):
        """Test multi-card spread interpretation streaming"""
        service = AIInterpretationService(mock_settings)

        # Mock provider
        mock_provider = AsyncMock()

        async def mock_stream():
            chunks = ["Looking at", " your spread", ", the cards", " tell a story"]
            for chunk in chunks:
                yield chunk

        mock_provider.generate_completion_stream = Mock(return_value=mock_stream())
        mock_provider.is_available = Mock(return_value=True)
        service.provider = mock_provider

        # Test streaming
        cards = [mock_wasteland_card, mock_wasteland_card, mock_wasteland_card]
        result_chunks = []
        async for chunk in service.generate_multi_card_interpretation_stream(
            cards=cards,
            character_voice=CharacterVoice.VAULT_DWELLER,
            question="What should I do?",
            karma=KarmaAlignment.GOOD,
            spread_type="three_card"
        ):
            result_chunks.append(chunk)

        assert result_chunks == ["Looking at", " your spread", ", the cards", " tell a story"]

    @pytest.mark.asyncio
    async def test_stream_unavailable_service(self, mock_settings, mock_wasteland_card):
        """Test streaming when AI service is unavailable"""
        service = AIInterpretationService(mock_settings)
        service.provider = None

        result_chunks = []
        async for chunk in service.generate_interpretation_stream(
            card=mock_wasteland_card,
            character_voice=CharacterVoice.PIP_BOY,
            question="Test",
            karma=KarmaAlignment.NEUTRAL
        ):
            result_chunks.append(chunk)

        assert result_chunks == []

    @pytest.mark.asyncio
    async def test_stream_with_error(self, mock_settings, mock_wasteland_card):
        """Test streaming with provider error - errors are logged but stream continues"""
        service = AIInterpretationService(mock_settings)

        mock_provider = AsyncMock()

        async def mock_error_stream():
            yield "Starting..."
            raise Exception("Provider error")

        mock_provider.generate_completion_stream = Mock(return_value=mock_error_stream())
        mock_provider.is_available = Mock(return_value=True)
        service.provider = mock_provider

        result_chunks = []
        # Service catches errors internally and logs them
        async for chunk in service.generate_interpretation_stream(
            card=mock_wasteland_card,
            character_voice=CharacterVoice.PIP_BOY,
            question="Test",
            karma=KarmaAlignment.NEUTRAL
        ):
            result_chunks.append(chunk)

        # Should have received at least the first chunk before error
        assert "Starting..." in result_chunks


class TestStreamingEndToEnd:
    """End-to-end streaming tests"""

    @pytest.mark.asyncio
    async def test_full_streaming_pipeline(self, mock_settings, mock_wasteland_card):
        """Test complete streaming pipeline from service to consumer"""
        service = AIInterpretationService(mock_settings)

        # Mock provider with realistic streaming
        mock_provider = AsyncMock()

        async def mock_realistic_stream():
            """Simulate realistic AI streaming"""
            response = "The Fool card represents a new journey into the wasteland. "
            response += "You stand at the precipice of adventure, vault dweller. "
            response += "Embrace the unknown with optimism."

            # Stream in small chunks
            chunk_size = 10
            for i in range(0, len(response), chunk_size):
                chunk = response[i:i + chunk_size]
                yield chunk
                await asyncio.sleep(0.01)  # Simulate network delay

        mock_provider.generate_completion_stream = Mock(return_value=mock_realistic_stream())
        mock_provider.is_available = Mock(return_value=True)
        service.provider = mock_provider

        # Collect all chunks
        full_text = ""
        chunk_count = 0
        async for chunk in service.generate_interpretation_stream(
            card=mock_wasteland_card,
            character_voice=CharacterVoice.VAULT_DWELLER,
            question="What awaits me?",
            karma=KarmaAlignment.GOOD
        ):
            full_text += chunk
            chunk_count += 1

        assert chunk_count > 1  # Multiple chunks received
        assert "The Fool card" in full_text
        assert "vault dweller" in full_text
        assert len(full_text) > 100  # Reasonable length


if __name__ == "__main__":
    pytest.main([__file__, "-v"])