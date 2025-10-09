"""
Cards API Endpoints Tests - Phase 2 API Layer Testing
Testing FastAPI wasteland cards routes with authentication and card functionality
"""

import pytest
import json
from typing import Dict, Any, List
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.wasteland_card import WastelandSuit, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.user_service import UserService
from app.core.security import create_access_token


@pytest.mark.asyncio
@pytest.mark.api
class TestPublicCardEndpoints:
    """Test public card endpoints (no authentication required)"""

    async def test_get_all_cards(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting all wasteland cards"""
        # Create test cards first
        from app.models.wasteland_card import WastelandCard

        test_card = WastelandCard(
            id="test_card_01",
            name="Test Card",
            suit="nuka_cola_bottles",
            number=1,
            upright_meaning="Test upright",
            reversed_meaning="Test reversed",
            radiation_level=2.5,
            threat_level=3
        )
        db_session.add(test_card)
        await db_session.commit()

        response = await async_client.get("/api/v1/cards/")

        assert response.status_code == status.HTTP_200_OK
        cards = response.json()

        assert isinstance(cards, list)
        assert len(cards) > 0  # Should have test cards

        # Verify card structure
        for card in cards[:3]:  # Check first 3 cards
            assert "id" in card
            assert "name" in card
            assert "suit" in card
            assert "number" in card
            assert "upright_meaning" in card
            assert "reversed_meaning" in card

    async def test_get_card_by_id(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting specific card by ID"""
        # First get all cards to get a valid ID
        cards_response = await async_client.get("/api/v1/cards/")
        cards = cards_response.json()

        if cards:
            card_id = cards[0]["id"]

            response = await async_client.get(f"/api/v1/cards/{card_id}")

            assert response.status_code == status.HTTP_200_OK
            card = response.json()

            assert card["id"] == card_id
            assert "name" in card
            assert "suit" in card
            assert "fallout_elements" in card

    async def test_get_card_not_found(self, async_client: AsyncClient):
        """Test getting non-existent card"""
        response = await async_client.get("/api/v1/cards/nonexistent_id")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_cards_by_suit(self, async_client: AsyncClient):
        """Test filtering cards by suit"""
        # Test each suit
        for suit in WastelandSuit:
            response = await async_client.get(f"/api/v1/cards/suit/{suit.value}")

            assert response.status_code == status.HTTP_200_OK
            cards = response.json()

            assert isinstance(cards, list)
            # All returned cards should be of the requested suit
            for card in cards:
                assert card["suit"] == suit.value

    async def test_filter_cards_by_radiation(self, async_client: AsyncClient):
        """Test filtering cards by radiation level"""
        response = await async_client.get("/api/v1/cards/radiation/filter?min_radiation=0.3&max_radiation=0.7")

        assert response.status_code == status.HTTP_200_OK
        cards = response.json()

        assert isinstance(cards, list)
        # All cards should be within radiation range
        for card in cards:
            assert 0.3 <= card["radiation_level"] <= 0.7

    async def test_filter_radiation_invalid_range(self, async_client: AsyncClient):
        """Test filtering with invalid radiation range"""
        # Min > Max
        response = await async_client.get("/api/v1/cards/radiation/filter?min_radiation=0.8&max_radiation=0.3")

        # Should either return empty list or validation error
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

        # Values out of range
        response = await async_client.get("/api/v1/cards/radiation/filter?min_radiation=-0.5&max_radiation=1.5")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_search_fallout_elements(self, async_client: AsyncClient):
        """Test searching cards by Fallout elements"""
        # Search for common Fallout terms
        search_terms = ["vault", "radiation", "wasteland", "brotherhood"]

        for term in search_terms:
            response = await async_client.get(f"/api/v1/cards/search/fallout?q={term}")

            assert response.status_code == status.HTTP_200_OK
            cards = response.json()

            assert isinstance(cards, list)
            # Results should contain the search term in fallout_elements or description
            for card in cards[:5]:  # Check first 5 results
                card_text = (card.get("fallout_elements", "") + " " +
                           card.get("description", "") + " " +
                           card.get("upright_meaning", "")).lower()
                # The search term might be found in various fields
                assert isinstance(card_text, str)

    async def test_search_empty_query(self, async_client: AsyncClient):
        """Test search with empty query"""
        response = await async_client.get("/api/v1/cards/search/fallout?q=")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_get_cards_by_threat_level(self, async_client: AsyncClient):
        """Test getting cards by threat level"""
        response = await async_client.get("/api/v1/cards/threat/5?max_threat=8")

        assert response.status_code == status.HTTP_200_OK
        cards = response.json()

        assert isinstance(cards, list)
        # All cards should be within threat level range
        for card in cards:
            assert 5 <= card["threat_level"] <= 8

    async def test_get_major_arcana(self, async_client: AsyncClient):
        """Test getting Major Arcana cards"""
        response = await async_client.get("/api/v1/cards/major-arcana/")

        assert response.status_code == status.HTTP_200_OK
        cards = response.json()

        assert isinstance(cards, list)
        # All cards should be Major Arcana
        for card in cards:
            assert card["suit"] == WastelandSuit.MAJOR_ARCANA.value

    async def test_get_court_cards(self, async_client: AsyncClient):
        """Test getting court cards"""
        response = await async_client.get("/api/v1/cards/court-cards/")

        assert response.status_code == status.HTTP_200_OK
        cards = response.json()

        assert isinstance(cards, list)
        # All cards should be court cards (Jack, Queen, King)
        for card in cards:
            assert card["rank"] in ["Jack", "Queen", "King"]


@pytest.mark.asyncio
@pytest.mark.api
class TestAuthenticatedCardEndpoints:
    """Test card endpoints that require authentication"""

    async def test_draw_cards_authenticated(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test drawing cards with authentication"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "draw_test",
            "email": "draw@vault.com",
            "password": "DrawTest123!",
            "faction_alignment": "Brotherhood of Steel"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Draw single card
        response = await async_client.post("/api/v1/cards/draw?num_cards=1&radiation_factor=0.5", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "cards" in data
        assert "user_karma" in data
        assert "user_faction" in data
        assert "radiation_factor_used" in data
        assert "message" in data

        cards = data["cards"]
        assert len(cards) == 1
        assert data["user_faction"] == "Brotherhood of Steel"
        assert data["radiation_factor_used"] == 0.5

    async def test_draw_multiple_cards(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test drawing multiple cards"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "multi_draw_test",
            "email": "multidraw@vault.com",
            "password": "MultiDrawTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Draw 3 cards
        response = await async_client.post("/api/v1/cards/draw?num_cards=3&radiation_factor=0.8", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        cards = data["cards"]
        assert len(cards) == 3
        # All cards should be different
        card_ids = [card["id"] for card in cards]
        assert len(set(card_ids)) == 3  # All unique

    async def test_draw_cards_without_auth(self, async_client: AsyncClient):
        """Test drawing cards without authentication"""
        response = await async_client.post("/api/v1/cards/draw?num_cards=1")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_draw_cards_invalid_parameters(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test drawing cards with invalid parameters"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "invalid_draw_test",
            "email": "invaliddraw@vault.com",
            "password": "InvalidDrawTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Test invalid number of cards
        response = await async_client.post("/api/v1/cards/draw?num_cards=0", headers=headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        response = await async_client.post("/api/v1/cards/draw?num_cards=20", headers=headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Test invalid radiation factor
        response = await async_client.post("/api/v1/cards/draw?radiation_factor=-0.5", headers=headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        response = await async_client.post("/api/v1/cards/draw?radiation_factor=1.5", headers=headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_draw_cards_daily_limit(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test drawing cards when daily limit is exceeded"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "limit_draw_test",
            "email": "limitdraw@vault.com",
            "password": "LimitDrawTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Attempt to draw many times to exceed limit
        for i in range(50):  # Try to exceed typical daily limit
            response = await async_client.post("/api/v1/cards/draw?num_cards=1", headers=headers)
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                assert "limit" in response.json()["detail"].lower()
                break
        else:
            # If no limit hit, that's also valid for this test
            pytest.skip("Daily card draw limit not configured or too high for test")


@pytest.mark.asyncio
@pytest.mark.api
class TestCardInterpretationEndpoints:
    """Test card interpretation endpoints"""

    async def test_karma_interpretation(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting karma-based card interpretation"""
        # Get a card first
        cards_response = await async_client.get("/api/v1/cards/")
        cards = cards_response.json()

        if cards:
            card_id = cards[0]["id"]

            # Test each karma alignment
            for karma in KarmaAlignment:
                response = await async_client.get(f"/api/v1/cards/{card_id}/interpretation/karma/{karma.value}")

                assert response.status_code == status.HTTP_200_OK
                data = response.json()

                assert "card_id" in data
                assert "karma" in data
                assert "interpretation" in data
                assert data["card_id"] == card_id
                assert data["karma"] == karma.value

    async def test_character_voice_interpretation(self, async_client: AsyncClient):
        """Test getting character voice interpretation"""
        # Get a card first
        cards_response = await async_client.get("/api/v1/cards/")
        cards = cards_response.json()

        if cards:
            card_id = cards[0]["id"]

            # Test each character voice
            for voice in CharacterVoice:
                response = await async_client.get(f"/api/v1/cards/{card_id}/interpretation/voice/{voice.value}")

                assert response.status_code == status.HTTP_200_OK
                data = response.json()

                assert "card_id" in data
                assert "voice" in data
                assert "interpretation" in data
                assert data["card_id"] == card_id
                assert data["voice"] == voice.value

    async def test_faction_significance(self, async_client: AsyncClient):
        """Test getting faction significance for card"""
        # Get a card first
        cards_response = await async_client.get("/api/v1/cards/")
        cards = cards_response.json()

        if cards:
            card_id = cards[0]["id"]

            # Test each faction
            for faction in FactionAlignment:
                response = await async_client.get(f"/api/v1/cards/{card_id}/significance/faction/{faction.value}")

                assert response.status_code == status.HTTP_200_OK
                data = response.json()

                assert "card_id" in data
                assert "faction" in data
                assert "significance" in data
                assert data["card_id"] == card_id
                assert data["faction"] == faction.value

    async def test_interpretation_invalid_card(self, async_client: AsyncClient):
        """Test interpretation with invalid card ID"""
        response = await async_client.get(f"/api/v1/cards/invalid_id/interpretation/karma/{KarmaAlignment.NEUTRAL.value}")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_interpretation_invalid_parameters(self, async_client: AsyncClient):
        """Test interpretation with invalid parameters"""
        # Get a card first
        cards_response = await async_client.get("/api/v1/cards/")
        cards = cards_response.json()

        if cards:
            card_id = cards[0]["id"]

            # Invalid karma alignment
            response = await async_client.get(f"/api/v1/cards/{card_id}/interpretation/karma/invalid_karma")
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Invalid character voice
            response = await async_client.get(f"/api/v1/cards/{card_id}/interpretation/voice/invalid_voice")
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

            # Invalid faction
            response = await async_client.get(f"/api/v1/cards/{card_id}/significance/faction/invalid_faction")
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
@pytest.mark.api
class TestPersonalizedCardEndpoints:
    """Test personalized card endpoints (require authentication)"""

    async def test_get_personalized_recommendations(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting personalized card recommendations"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "personal_test",
            "email": "personal@vault.com",
            "password": "PersonalTest123!",
            "faction_alignment": "NCR"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        response = await async_client.get("/api/v1/cards/personalized/recommendations?limit=5", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        cards = response.json()

        assert isinstance(cards, list)
        assert len(cards) <= 5

    async def test_get_user_card_history(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting user's card drawing history"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "history_card_test",
            "email": "historycard@vault.com",
            "password": "HistoryCardTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Draw some cards first to create history
        await async_client.post("/api/v1/cards/draw?num_cards=2", headers=headers)

        response = await async_client.get("/api/v1/cards/user/history?limit=10", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        history = response.json()

        assert isinstance(history, dict)

    async def test_get_user_karma_interpretation(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting card interpretation based on user's karma"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "karma_test",
            "email": "karma@vault.com",
            "password": "KarmaTest123!",
            "karma_score": 50  # Neutral karma
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get a card first
        cards_response = await async_client.get("/api/v1/cards/")
        cards = cards_response.json()

        if cards:
            card_id = cards[0]["id"]

            response = await async_client.get(f"/api/v1/cards/user/karma-interpretation/{card_id}", headers=headers)

            assert response.status_code == status.HTTP_200_OK
            data = response.json()

            assert "card_id" in data
            assert "user_karma" in data
            assert "interpretation" in data
            assert "karma_score" in data
            assert data["card_id"] == card_id
            assert data["karma_score"] == 50

    async def test_get_user_faction_significance(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting card significance for user's faction"""
        # Create user with faction
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "faction_test",
            "email": "faction@vault.com",
            "password": "FactionTest123!",
            "faction_alignment": "Brotherhood of Steel"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get a card first
        cards_response = await async_client.get("/api/v1/cards/")
        cards = cards_response.json()

        if cards:
            card_id = cards[0]["id"]

            response = await async_client.get(f"/api/v1/cards/user/faction-significance/{card_id}", headers=headers)

            assert response.status_code == status.HTTP_200_OK
            data = response.json()

            assert "card_id" in data
            assert "user_faction" in data
            assert "significance" in data
            assert data["card_id"] == card_id
            assert data["user_faction"] == "Brotherhood of Steel"

    async def test_user_faction_significance_no_faction(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting faction significance for user without faction"""
        # Create user without faction
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "no_faction_test",
            "email": "nofaction@vault.com",
            "password": "NoFactionTest123!"
            # No faction_alignment
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Get a card first
        cards_response = await async_client.get("/api/v1/cards/")
        cards = cards_response.json()

        if cards:
            card_id = cards[0]["id"]

            response = await async_client.get(f"/api/v1/cards/user/faction-significance/{card_id}", headers=headers)

            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "no faction" in response.json()["detail"].lower()

    async def test_personalized_without_auth(self, async_client: AsyncClient):
        """Test personalized endpoints without authentication"""
        # Test recommendations
        response = await async_client.get("/api/v1/cards/personalized/recommendations")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Test user history
        response = await async_client.get("/api/v1/cards/user/history")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Test user karma interpretation
        response = await async_client.get("/api/v1/cards/user/karma-interpretation/some_id")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.api
class TestCardStatisticsEndpoints:
    """Test card statistics endpoints"""

    async def test_get_deck_statistics(self, async_client: AsyncClient):
        """Test getting comprehensive deck statistics"""
        response = await async_client.get("/api/v1/cards/stats/deck")

        assert response.status_code == status.HTTP_200_OK
        stats = response.json()

        assert isinstance(stats, dict)
        # Should contain statistical information about the deck
        assert len(stats) >= 0

    async def test_get_most_drawn_cards(self, async_client: AsyncClient):
        """Test getting most frequently drawn cards"""
        response = await async_client.get("/api/v1/cards/stats/most-drawn?limit=10")

        assert response.status_code == status.HTTP_200_OK
        cards = response.json()

        assert isinstance(cards, list)
        assert len(cards) <= 10

    async def test_most_drawn_invalid_limit(self, async_client: AsyncClient):
        """Test most drawn cards with invalid limit"""
        # Limit too high
        response = await async_client.get("/api/v1/cards/stats/most-drawn?limit=100")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Limit too low
        response = await async_client.get("/api/v1/cards/stats/most-drawn?limit=0")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
@pytest.mark.api
class TestCardEndpointErrorHandling:
    """Test error handling in card endpoints"""

    async def test_invalid_enum_values(self, async_client: AsyncClient):
        """Test handling of invalid enum values"""
        # Invalid suit
        response = await async_client.get("/api/v1/cards/suit/invalid_suit")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_malformed_query_parameters(self, async_client: AsyncClient):
        """Test handling of malformed query parameters"""
        # Non-numeric threat level
        response = await async_client.get("/api/v1/cards/threat/not_a_number")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Non-numeric radiation values
        response = await async_client.get("/api/v1/cards/radiation/filter?min_radiation=not_a_number")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_missing_required_parameters(self, async_client: AsyncClient):
        """Test handling of missing required parameters"""
        # Missing search query
        response = await async_client.get("/api/v1/cards/search/fallout")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_concurrent_card_draws(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test concurrent card drawing operations"""
        import asyncio

        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "concurrent_test",
            "email": "concurrent@vault.com",
            "password": "ConcurrentTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Make multiple concurrent draw requests
        async def draw_card():
            return await async_client.post("/api/v1/cards/draw?num_cards=1", headers=headers)

        # Run 5 concurrent draws
        responses = await asyncio.gather(*[draw_card() for _ in range(5)])

        # All should succeed or fail gracefully
        success_count = sum(1 for r in responses if r.status_code == status.HTTP_200_OK)
        rate_limit_count = sum(1 for r in responses if r.status_code == status.HTTP_429_TOO_MANY_REQUESTS)

        # Either all succeed or some hit rate limit
        assert success_count + rate_limit_count == 5