"""
Integration tests for streaming API endpoints
Tests the complete streaming flow from API to client
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch

from app.main import app
from app.services.ai_interpretation_service import AIInterpretationService
from app.models.wasteland_card import WastelandCard, CharacterVoice, KarmaAlignment
from app.core.dependencies import get_ai_interpretation_service
from app.db.session import get_db


@pytest.fixture
def client():
    """Create test client"""
    # Clear any existing overrides before tests
    app.dependency_overrides.clear()
    yield TestClient(app)
    # Clean up after tests
    app.dependency_overrides.clear()


@pytest.fixture
def mock_card_in_db():
    """Mock card data in database"""
    card = Mock(spec=WastelandCard)
    card.id = "the-fool"
    card.name = "The Fool"
    card.upright_meaning = "New beginnings"
    card.suit = None
    card.radiation_level = 2
    return card


@pytest.fixture
def mock_db_session():
    """Create mock database session"""
    return AsyncMock()


@pytest.fixture
def mock_ai_service():
    """Create mock AI service"""
    service = Mock(spec=AIInterpretationService)
    service.is_available.return_value = True
    return service


class TestStreamingEndpoints:
    """Integration tests for streaming endpoints"""

    def test_stream_single_card_endpoint(self, client, mock_card_in_db, mock_ai_service):
        """Test streaming single card interpretation endpoint"""

        async def mock_stream():
            """Mock streaming generator"""
            chunks = ["The Fool", " represents", " new", " beginnings"]
            for chunk in chunks:
                yield chunk

        # Setup mock DB session
        mock_session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_card_in_db
        mock_session.execute = AsyncMock(return_value=mock_result)

        async def get_mock_db():
            return mock_session

        # Setup mock AI service
        mock_ai_service.generate_interpretation_stream = Mock(return_value=mock_stream())

        def get_mock_ai_service():
            return mock_ai_service

        # Override dependencies
        app.dependency_overrides[get_db] = get_mock_db
        app.dependency_overrides[get_ai_interpretation_service] = get_mock_ai_service

        # Make request
        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": "the-fool",
                "question": "What is my future?",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            }
        )

        assert response.status_code == 200
        assert response.headers['content-type'] == 'text/event-stream; charset=utf-8'

        # Check streaming content
        content = response.text
        assert 'data:' in content
        assert 'The Fool' in content or 'represents' in content

    def test_stream_endpoint_card_not_found(self, client, mock_ai_service):
        """Test streaming endpoint with non-existent card"""

        # Setup mock DB to return None
        mock_session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_result)

        async def get_mock_db():
            return mock_session

        def get_mock_ai_service():
            return mock_ai_service

        # Override dependencies
        app.dependency_overrides[get_db] = get_mock_db
        app.dependency_overrides[get_ai_interpretation_service] = get_mock_ai_service

        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": "non-existent",
                "question": "Test",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            }
        )

        assert response.status_code == 404

    def test_stream_endpoint_ai_unavailable(self, client, mock_card_in_db):
        """Test streaming endpoint when AI service is unavailable"""

        # Setup mock DB
        mock_session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_card_in_db
        mock_session.execute = AsyncMock(return_value=mock_result)

        async def get_mock_db():
            return mock_session

        # Setup mock AI service as unavailable
        mock_service = Mock(spec=AIInterpretationService)
        mock_service.is_available.return_value = False

        def get_mock_ai_service():
            return mock_service

        # Override dependencies
        app.dependency_overrides[get_db] = get_mock_db
        app.dependency_overrides[get_ai_interpretation_service] = get_mock_ai_service

        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": "the-fool",
                "question": "Test",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            }
        )

        assert response.status_code == 503

    def test_stream_multi_card_endpoint(self, client, mock_card_in_db, mock_ai_service):
        """Test streaming multi-card interpretation endpoint"""

        async def mock_multi_stream():
            """Mock multi-card streaming"""
            chunks = ["Looking at", " your spread", ", the story", " unfolds"]
            for chunk in chunks:
                yield chunk

        # Setup mock DB
        mock_session = AsyncMock()
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = [
            mock_card_in_db,
            mock_card_in_db,
            mock_card_in_db
        ]
        mock_session.execute = AsyncMock(return_value=mock_result)

        async def get_mock_db():
            return mock_session

        # Setup mock AI service
        mock_ai_service.generate_multi_card_interpretation_stream = Mock(
            return_value=mock_multi_stream()
        )

        def get_mock_ai_service():
            return mock_ai_service

        # Override dependencies
        app.dependency_overrides[get_db] = get_mock_db
        app.dependency_overrides[get_ai_interpretation_service] = get_mock_ai_service

        # Make request
        response = client.post(
            "/api/v1/readings/interpretation/stream-multi",
            json={
                "card_ids": ["the-fool", "the-fool", "the-fool"],
                "question": "What is my path?",
                "character_voice": "vault_dweller",
                "karma_alignment": "good",
                "spread_type": "three_card"
            }
        )

        assert response.status_code == 200
        assert response.headers['content-type'] == 'text/event-stream; charset=utf-8'

    def test_stream_multi_card_no_cards(self, client, mock_ai_service):
        """Test multi-card streaming with empty card list"""

        mock_session = AsyncMock()

        async def get_mock_db():
            return mock_session

        def get_mock_ai_service():
            return mock_ai_service

        # Override dependencies
        app.dependency_overrides[get_db] = get_mock_db
        app.dependency_overrides[get_ai_interpretation_service] = get_mock_ai_service

        response = client.post(
            "/api/v1/readings/interpretation/stream-multi",
            json={
                "card_ids": [],
                "question": "Test",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral",
                "spread_type": "three_card"
            }
        )

        assert response.status_code == 400

    def test_stream_multi_card_missing_cards(self, client, mock_card_in_db, mock_ai_service):
        """Test multi-card streaming when some cards are missing"""

        # Setup mock DB to return fewer cards than requested
        mock_session = AsyncMock()
        mock_result = Mock()
        mock_result.scalars.return_value.all.return_value = [mock_card_in_db]  # Only 1 card
        mock_session.execute = AsyncMock(return_value=mock_result)

        async def get_mock_db():
            return mock_session

        def get_mock_ai_service():
            return mock_ai_service

        # Override dependencies
        app.dependency_overrides[get_db] = get_mock_db
        app.dependency_overrides[get_ai_interpretation_service] = get_mock_ai_service

        response = client.post(
            "/api/v1/readings/interpretation/stream-multi",
            json={
                "card_ids": ["card1", "card2", "card3"],  # Request 3 cards
                "question": "Test",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral",
                "spread_type": "three_card"
            }
        )

        assert response.status_code == 404


class TestSSEFormatting:
    """Tests for SSE format compliance"""

    def test_sse_format_structure(self, client, mock_card_in_db, mock_ai_service):
        """Test that SSE format is correct"""

        async def mock_stream():
            yield "Test"
            yield " chunk"

        mock_session = AsyncMock()
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = mock_card_in_db
        mock_session.execute = AsyncMock(return_value=mock_result)

        async def get_mock_db():
            return mock_session

        mock_ai_service.generate_interpretation_stream = Mock(return_value=mock_stream())

        def get_mock_ai_service():
            return mock_ai_service

        # Override dependencies
        app.dependency_overrides[get_db] = get_mock_db
        app.dependency_overrides[get_ai_interpretation_service] = get_mock_ai_service

        response = client.post(
            "/api/v1/readings/interpretation/stream",
            json={
                "card_id": "the-fool",
                "question": "Test",
                "character_voice": "pip_boy",
                "karma_alignment": "neutral"
            }
        )

        # Check SSE format
        content = response.text
        lines = content.split('\n')

        # Should have data: prefix
        data_lines = [line for line in lines if line.startswith('data:')]
        assert len(data_lines) > 0

        # Should end with [DONE]
        assert '[DONE]' in content or 'data: [DONE]' in content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])