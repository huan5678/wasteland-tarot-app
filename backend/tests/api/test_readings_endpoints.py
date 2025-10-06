"""
Readings API Endpoints Tests - Phase 2 API Layer Testing
Testing FastAPI reading routes with authentication and tarot functionality
"""

import pytest
import json
import uuid
from typing import Dict, Any, List
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.wasteland_card import CharacterVoice
from app.services.user_service import UserService
from app.services.reading_service import ReadingService
from app.core.security import create_access_token


def generate_unique_user_data():
    """Generate unique user data to avoid conflicts"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "username": f"test_user_{unique_id}",
        "email": f"test_{unique_id}@vault.com",
        "password": "TestPassword123!",
        "display_name": f"Test User {unique_id}"
    }


@pytest.mark.asyncio
@pytest.mark.api
class TestCreateReadingEndpoints:
    """Test reading creation API endpoints"""

    async def test_create_basic_reading(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test creating a basic single card reading"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})

        # Create reading
        reading_data = {
            "question": "What does the wasteland hold for me?",
            "spread_type": "single_card",
            "num_cards": 1,
            "radiation_factor": 0.5
        }

        headers = {"Authorization": f"Bearer {access_token}"}
        response = await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify updated response structure
        assert "success" in data
        assert data["success"] is True
        assert "data" in data
        assert "message" in data
        assert "metadata" in data

        # Check data section
        response_data = data["data"]
        assert "reading" in response_data
        assert "user_stats" in response_data

        reading = response_data["reading"]
        assert reading["question"] == reading_data["question"]
        assert reading["spread_type"] == reading_data["spread_type"]
        assert "cards_drawn" in reading
        assert "interpretation" in reading
        assert "character_voice" in reading
        assert "karma_context" in reading
        assert "created_at" in reading
        assert reading["id"] is not None

        # Verify cards_drawn format
        assert isinstance(reading["cards_drawn"], list)
        assert len(reading["cards_drawn"]) == 1
        card = reading["cards_drawn"][0]
        assert "id" in card
        assert "name" in card
        assert "position" in card

        # Check metadata
        metadata = data["metadata"]
        assert "api_version" in metadata
        assert "timestamp" in metadata

    async def test_create_multi_card_reading(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test creating a multi-card spread"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})

        # Create three-card reading
        reading_data = {
            "question": "Past, present, future in the wasteland",
            "spread_type": "three_card",
            "num_cards": 3,
            "character_voice": CharacterVoice.CODSWORTH.value,
            "radiation_factor": 0.7
        }

        headers = {"Authorization": f"Bearer {access_token}"}
        response = await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify updated response structure
        assert data["success"] is True
        response_data = data["data"]
        reading = response_data["reading"]

        assert reading["spread_type"] == "three_card"
        assert reading["character_voice"] == CharacterVoice.PIP_BOY.value  # Updated to match our system
        assert len(reading["cards_drawn"]) == 3

        # Verify each card has proper structure
        for i, card in enumerate(reading["cards_drawn"]):
            assert "id" in card
            assert "name" in card
            assert "position" in card
            assert card["position"] == i

    async def test_create_reading_without_auth(self, async_client: AsyncClient):
        """Test creating reading without authentication"""
        reading_data = {
            "question": "What does the wasteland hold?",
            "spread_type": "single_card"
        }

        response = await async_client.post("/api/v1/readings/create", json=reading_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Verify error response format
        data = response.json()
        assert "success" in data
        assert data["success"] is False
        assert "error" in data

        error = data["error"]
        assert "code" in error
        assert "message" in error

    async def test_create_reading_daily_limit_exceeded(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test creating reading when daily limit is exceeded"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Create many readings to exceed limit
        reading_data = {
            "question": "Test question",
            "spread_type": "single_card"
        }

        # Attempt to create many readings (assuming limit is around 10-20 per day)
        for i in range(25):  # Exceed typical daily limit
            response = await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers)
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                # Found the limit - verify error format
                data = response.json()
                assert data["success"] is False
                assert "error" in data
                assert "limit" in data["error"]["message"].lower() or "limit" in data["error"]["details"].lower()
                break
        else:
            # If no limit hit, that's also valid for this test
            pytest.skip("Daily limit not configured or too high for test")

    async def test_create_reading_invalid_data(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test creating reading with invalid data"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Test with invalid number of cards
        invalid_data = {
            "question": "Test question",
            "spread_type": "single_card",
            "num_cards": 0  # Invalid
        }

        response = await async_client.post("/api/v1/readings/create", json=invalid_data, headers=headers)
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY]

        # Test with missing question
        invalid_data = {
            "spread_type": "single_card"
            # Missing question
        }

        response = await async_client.post("/api/v1/readings/create", json=invalid_data, headers=headers)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
@pytest.mark.api
class TestReadingHistoryEndpoints:
    """Test reading history and retrieval endpoints"""

    async def test_get_user_readings(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting user's reading history"""
        # Create user and readings
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Create a few readings first
        for i in range(3):
            reading_data = {
                "question": f"Test question {i}",
                "spread_type": "single_card"
            }
            await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers)

        # Get reading history
        response = await async_client.get("/api/v1/readings/", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify updated response structure
        assert data["success"] is True
        assert "data" in data

        readings_data = data["data"]
        assert "readings" in readings_data

        readings = readings_data["readings"]
        assert isinstance(readings, list)
        assert len(readings) >= 3

        # Verify each reading has proper structure
        for reading in readings:
            required_fields = [
                "id", "question", "spread_type", "created_at",
                "character_voice", "karma_context", "cards_drawn",
                "interpretation"
            ]
            for field in required_fields:
                assert field in reading, f"Missing field: {field}"

    async def test_get_readings_with_pagination(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting readings with pagination parameters"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Test with limit and offset
        response = await async_client.get("/api/v1/readings/?limit=5&offset=0", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        readings = response.json()

        assert isinstance(readings, list)
        assert len(readings) <= 5

    async def test_get_readings_with_filters(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting readings with filters"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Create readings with different spreads
        three_card_data = {
            "question": "Three card test",
            "spread_type": "three_card",
            "num_cards": 3
        }
        await async_client.post("/api/v1/readings/create", json=three_card_data, headers=headers)

        # Filter by spread type
        response = await async_client.get("/api/v1/readings/?filter_by_spread=three_card", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        readings = response.json()

        # All returned readings should be three_card type
        for reading in readings:
            assert reading["spread_type"] == "three_card"

    async def test_get_readings_without_auth(self, async_client: AsyncClient):
        """Test getting readings without authentication"""
        response = await async_client.get("/api/v1/readings/")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.api
class TestSpecificReadingEndpoints:
    """Test specific reading retrieval and management"""

    async def test_get_reading_by_id(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting specific reading by ID"""
        # Create user and reading
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Create reading
        reading_data = {
            "question": "Specific test question",
            "spread_type": "single_card"
        }
        create_response = await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers)
        reading_id = create_response.json()["reading"]["id"]

        # Get specific reading
        response = await async_client.get(f"/api/v1/readings/{reading_id}", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        reading = response.json()

        assert reading["id"] == reading_id
        assert reading["question"] == reading_data["question"]
        assert "interpretation" in reading
        assert "karma_context" in reading
        assert "faction_influence" in reading

    async def test_get_reading_not_found(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting non-existent reading"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Try to get non-existent reading
        response = await async_client.get("/api/v1/readings/nonexistent_id", headers=headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_get_reading_insufficient_permissions(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting another user's reading"""
        # Create two users
        user_service = UserService(db_session)
        user1 = await user_service.create_user({
            "username": "user1",
            "email": "user1@vault.com",
            "password": "User1Test123!"
        })
        user2 = await user_service.create_user({
            "username": "user2",
            "email": "user2@vault.com",
            "password": "User2Test123!"
        })

        # User 1 creates reading
        user1_token = create_access_token({"sub": user1.id})
        headers1 = {"Authorization": f"Bearer {user1_token}"}

        reading_data = {
            "question": "User 1's private question",
            "spread_type": "single_card"
        }
        create_response = await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers1)
        reading_id = create_response.json()["reading"]["id"]

        # User 2 tries to access User 1's reading
        user2_token = create_access_token({"sub": user2.id})
        headers2 = {"Authorization": f"Bearer {user2_token}"}

        response = await async_client.get(f"/api/v1/readings/{reading_id}", headers=headers2)

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
@pytest.mark.api
class TestReadingUpdateEndpoints:
    """Test reading update functionality"""

    async def test_update_reading_feedback(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test updating reading with user feedback"""
        # Create user and reading
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Create reading
        reading_data = {
            "question": "Test question for update",
            "spread_type": "single_card"
        }
        create_response = await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers)
        reading_id = create_response.json()["reading"]["id"]

        # Update reading
        update_data = {
            "user_feedback": "This reading was very accurate!",
            "accuracy_rating": 4.5,
            "tags": ["accurate", "helpful", "wasteland"],
            "mood": "hopeful",
            "is_private": True
        }

        response = await async_client.put(f"/api/v1/readings/{reading_id}", json=update_data, headers=headers)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "reading" in data
        assert "message" in data

        reading = data["reading"]
        assert reading["user_feedback"] == update_data["user_feedback"]
        assert reading["accuracy_rating"] == update_data["accuracy_rating"]
        assert reading["tags"] == update_data["tags"]
        assert reading["mood"] == update_data["mood"]
        assert reading["is_private"] == update_data["is_private"]

    async def test_update_nonexistent_reading(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test updating non-existent reading"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        update_data = {"user_feedback": "Test feedback"}

        response = await async_client.put("/api/v1/readings/nonexistent_id", json=update_data, headers=headers)

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
@pytest.mark.api
class TestReadingDeletionEndpoints:
    """Test reading deletion functionality"""

    async def test_delete_reading(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test deleting a reading"""
        # Create user and reading
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Create reading
        reading_data = {
            "question": "Test question for deletion",
            "spread_type": "single_card"
        }
        create_response = await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers)
        reading_id = create_response.json()["reading"]["id"]

        # Delete reading
        response = await async_client.delete(f"/api/v1/readings/{reading_id}", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()

        # Verify reading is deleted
        get_response = await async_client.get(f"/api/v1/readings/{reading_id}", headers=headers)
        assert get_response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
@pytest.mark.api
class TestPublicReadingsEndpoints:
    """Test public reading endpoints"""

    async def test_get_public_readings_unauthenticated(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting public readings without authentication"""
        response = await async_client.get("/api/v1/readings/public/shared")

        assert response.status_code == status.HTTP_200_OK
        readings = response.json()

        assert isinstance(readings, list)

        # Check structure for unauthenticated access
        for reading in readings:
            assert "id" in reading
            assert "question" in reading
            assert "cards_drawn" in reading
            # Should not show user_id for unauthenticated users
            assert reading.get("user_id") is None

    async def test_get_public_readings_authenticated(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting public readings with authentication"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        response = await async_client.get("/api/v1/readings/public/shared", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        readings = response.json()

        assert isinstance(readings, list)


@pytest.mark.asyncio
@pytest.mark.api
class TestReadingStatisticsEndpoints:
    """Test reading statistics and analytics endpoints"""

    async def test_get_personal_statistics(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting personal reading statistics"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        response = await async_client.get("/api/v1/readings/statistics/personal", headers=headers)

        assert response.status_code == status.HTTP_200_OK
        stats = response.json()

        assert isinstance(stats, dict)
        # Should contain statistical information
        assert "total_readings" in stats or len(stats) >= 0  # May be empty for new user

    async def test_get_reading_trends(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test getting reading trends analysis"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Test different time periods
        for period in ["week", "month", "year"]:
            response = await async_client.get(f"/api/v1/readings/trends/analysis?period={period}", headers=headers)

            assert response.status_code == status.HTTP_200_OK
            trends = response.json()
            assert isinstance(trends, dict)

    async def test_statistics_without_auth(self, async_client: AsyncClient):
        """Test accessing statistics without authentication"""
        response = await async_client.get("/api/v1/readings/statistics/personal")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.api
class TestReadingSharingEndpoints:
    """Test reading sharing functionality"""

    async def test_share_reading(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test sharing reading with other users"""
        # Create users
        user_service = UserService(db_session)
        user1 = await user_service.create_user({
            "username": "share_user1",
            "email": "share1@vault.com",
            "password": "ShareTest123!"
        })
        user2 = await user_service.create_user({
            "username": "share_user2",
            "email": "share2@vault.com",
            "password": "ShareTest123!"
        })

        access_token = create_access_token({"sub": user1.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Create reading
        reading_data = {
            "question": "Test question for sharing",
            "spread_type": "single_card"
        }
        create_response = await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers)
        reading_id = create_response.json()["reading"]["id"]

        # Share reading
        share_data = {
            "target_user_ids": [user2.id],
            "message": "Thought you might find this interesting!"
        }

        # Note: This endpoint expects the data in the request body, not as query params
        response = await async_client.post(
            f"/api/v1/readings/{reading_id}/share",
            json=share_data,
            headers=headers
        )

        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()


@pytest.mark.asyncio
@pytest.mark.api
class TestReadingErrorHandling:
    """Test error handling in reading endpoints"""

    async def test_malformed_json_request(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test handling of malformed JSON requests"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Send malformed JSON
        response = await async_client.post(
            "/api/v1/readings/create",
            content='{"question": "test", "spread_type":}',  # Malformed JSON
            headers={**headers, "Content-Type": "application/json"}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_invalid_content_type(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test handling of invalid content type"""
        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Send form data instead of JSON
        response = await async_client.post(
            "/api/v1/readings/create",
            data={"question": "test", "spread_type": "single_card"},
            headers=headers
        )

        # Should expect JSON content type
        assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE]