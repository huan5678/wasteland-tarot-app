"""
Reading Integration Tests with User Authentication
Testing reading functionality with user authentication and data persistence
"""

import pytest
import asyncio
from typing import Dict, Any, List
from httpx import AsyncClient
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.models.user import User
from app.models.reading_enhanced import Reading
from app.models.wasteland_card import WastelandCard, KarmaAlignment, CharacterVoice, FactionAlignment
from app.services.user_service import UserService
from app.services.reading_service import ReadingService


@pytest.mark.integration
class TestAuthenticatedReadings:
    """Test reading functionality with user authentication"""

    @pytest.fixture
    async def authenticated_user(self, client: AsyncClient):
        """Create an authenticated user for testing"""
        user_data = {
            "username": "wasteland_reader",
            "email": "reader@wasteland.com",
            "password": "SecurePass123!",
            "display_name": "Wasteland Reader",
            "faction_alignment": "vault_dweller"
        }

        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == status.HTTP_201_CREATED

        user_info = response.json()
        return {
            "user": user_info["user"],
            "access_token": user_info["access_token"],
            "headers": {"Authorization": f"Bearer {user_info['access_token']}"}
        }

    async def test_create_reading_authenticated(self, client: AsyncClient, authenticated_user):
        """Test creating a reading as authenticated user"""
        reading_data = {
            "question": "What does the wasteland hold for me?",
            "spread_type": "three_card",
            "character_voice": "pip_boy",
            "num_cards": 3,
            "radiation_factor": 0.5
        }

        response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()

        # Verify reading structure
        assert data["user_id"] == authenticated_user["user"]["id"]
        assert data["question"] == reading_data["question"]
        assert data["spread_type"] == reading_data["spread_type"]
        assert data["character_voice"] == reading_data["character_voice"]
        assert len(data["cards_drawn"]) == 3
        assert "interpretation" in data
        assert "created_at" in data

    async def test_create_reading_unauthenticated(self, client: AsyncClient):
        """Test that unauthenticated users cannot create readings"""
        reading_data = {
            "question": "Test question",
            "spread_type": "single_card",
            "num_cards": 1
        }

        response = await client.post("/api/v1/readings/create", json=reading_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_get_user_reading_history(self, client: AsyncClient, authenticated_user):
        """Test retrieving user's reading history"""
        # Create a few readings first
        reading_requests = [
            {
                "question": f"Question {i}",
                "spread_type": "single_card",
                "num_cards": 1
            }
            for i in range(3)
        ]

        for reading_data in reading_requests:
            await client.post(
                "/api/v1/readings/create",
                json=reading_data,
                headers=authenticated_user["headers"]
            )

        # Get reading history
        response = await client.get(
            "/api/v1/readings/history",
            headers=authenticated_user["headers"],
            params={"limit": 10, "offset": 0}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert isinstance(data, list)
        assert len(data) >= 3  # At least the 3 we created

        # Verify all readings belong to the user
        for reading in data:
            assert reading["user_id"] == authenticated_user["user"]["id"]

    async def test_get_specific_reading(self, client: AsyncClient, authenticated_user):
        """Test retrieving a specific reading by ID"""
        # Create a reading
        reading_data = {
            "question": "Specific reading test",
            "spread_type": "three_card",
            "num_cards": 3
        }

        create_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=authenticated_user["headers"]
        )
        reading = create_response.json()
        reading_id = reading["id"]

        # Retrieve the specific reading
        response = await client.get(
            f"/api/v1/readings/{reading_id}",
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["id"] == reading_id
        assert data["user_id"] == authenticated_user["user"]["id"]
        assert data["question"] == reading_data["question"]

    async def test_access_other_user_reading_forbidden(self, client: AsyncClient):
        """Test that users cannot access other users' readings"""
        # Create two users
        user1_data = {
            "username": "user1",
            "email": "user1@test.com",
            "password": "Pass123!"
        }
        user2_data = {
            "username": "user2",
            "email": "user2@test.com",
            "password": "Pass123!"
        }

        # Register both users
        user1_response = await client.post("/api/v1/auth/register", json=user1_data)
        user2_response = await client.post("/api/v1/auth/register", json=user2_data)

        user1_token = user1_response.json()["access_token"]
        user2_token = user2_response.json()["access_token"]

        # User 1 creates a reading
        reading_data = {
            "question": "Private reading",
            "spread_type": "single_card",
            "num_cards": 1
        }

        create_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers={"Authorization": f"Bearer {user1_token}"}
        )
        reading_id = create_response.json()["id"]

        # User 2 tries to access User 1's reading
        response = await client.get(
            f"/api/v1/readings/{reading_id}",
            headers={"Authorization": f"Bearer {user2_token}"}
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    async def test_update_reading_interpretation(self, client: AsyncClient, authenticated_user):
        """Test updating reading interpretation by user"""
        # Create a reading
        reading_data = {
            "question": "Reading to update",
            "spread_type": "single_card",
            "num_cards": 1
        }

        create_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=authenticated_user["headers"]
        )
        reading_id = create_response.json()["id"]

        # Update the reading
        update_data = {
            "user_feedback": "This reading was very accurate!",
            "accuracy_rating": 5,
            "tags": ["accurate", "helpful", "insightful"]
        }

        response = await client.put(
            f"/api/v1/readings/{reading_id}",
            json=update_data,
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["user_feedback"] == update_data["user_feedback"]
        assert data["accuracy_rating"] == update_data["accuracy_rating"]
        assert data["tags"] == update_data["tags"]

    async def test_delete_reading(self, client: AsyncClient, authenticated_user):
        """Test deleting a reading"""
        # Create a reading
        reading_data = {
            "question": "Reading to delete",
            "spread_type": "single_card",
            "num_cards": 1
        }

        create_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=authenticated_user["headers"]
        )
        reading_id = create_response.json()["id"]

        # Delete the reading
        response = await client.delete(
            f"/api/v1/readings/{reading_id}",
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK

        # Verify reading is deleted
        get_response = await client.get(
            f"/api/v1/readings/{reading_id}",
            headers=authenticated_user["headers"]
        )
        assert get_response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.integration
class TestReadingPermissions:
    """Test reading permissions and sharing functionality"""

    @pytest.fixture
    async def two_authenticated_users(self, client: AsyncClient):
        """Create two authenticated users for permission testing"""
        user1_data = {
            "username": "sharing_user1",
            "email": "user1@sharing.com",
            "password": "Pass123!"
        }
        user2_data = {
            "username": "sharing_user2",
            "email": "user2@sharing.com",
            "password": "Pass123!"
        }

        # Register both users
        user1_response = await client.post("/api/v1/auth/register", json=user1_data)
        user2_response = await client.post("/api/v1/auth/register", json=user2_data)

        return {
            "user1": {
                "user": user1_response.json()["user"],
                "token": user1_response.json()["access_token"],
                "headers": {"Authorization": f"Bearer {user1_response.json()['access_token']}"}
            },
            "user2": {
                "user": user2_response.json()["user"],
                "token": user2_response.json()["access_token"],
                "headers": {"Authorization": f"Bearer {user2_response.json()['access_token']}"}
            }
        }

    async def test_share_reading_with_user(self, client: AsyncClient, two_authenticated_users):
        """Test sharing a reading with another user"""
        # User 1 creates a reading
        reading_data = {
            "question": "Shared reading",
            "spread_type": "three_card",
            "num_cards": 3
        }

        create_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=two_authenticated_users["user1"]["headers"]
        )
        reading_id = create_response.json()["id"]

        # Share reading with user 2
        share_data = {
            "user_ids": [two_authenticated_users["user2"]["user"]["id"]],
            "message": "Check out this interesting reading!"
        }

        response = await client.post(
            f"/api/v1/readings/{reading_id}/share",
            json=share_data,
            headers=two_authenticated_users["user1"]["headers"]
        )

        assert response.status_code == status.HTTP_200_OK

        # User 2 should now be able to view the reading
        view_response = await client.get(
            f"/api/v1/readings/{reading_id}",
            headers=two_authenticated_users["user2"]["headers"]
        )

        assert view_response.status_code == status.HTTP_200_OK

    async def test_make_reading_public(self, client: AsyncClient, authenticated_user):
        """Test making a reading publicly accessible"""
        # Create a reading
        reading_data = {
            "question": "Public reading",
            "spread_type": "single_card",
            "num_cards": 1
        }

        create_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=authenticated_user["headers"]
        )
        reading_id = create_response.json()["id"]

        # Make reading public
        update_data = {
            "is_private": False,
            "allow_public_sharing": True
        }

        response = await client.put(
            f"/api/v1/readings/{reading_id}/privacy",
            json=update_data,
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK

        # Anyone should be able to view the public reading
        public_response = await client.get(f"/api/v1/readings/public/{reading_id}")
        assert public_response.status_code == status.HTTP_200_OK


@pytest.mark.integration
class TestUserReadingLimits:
    """Test user reading limits and restrictions"""

    async def test_daily_reading_limit(self, client: AsyncClient, authenticated_user):
        """Test that users respect daily reading limits"""
        # Create readings up to the limit (assuming 20 for regular users)
        reading_data = {
            "question": "Test reading",
            "spread_type": "single_card",
            "num_cards": 1
        }

        successful_readings = 0
        for i in range(25):  # Try to create more than the limit
            response = await client.post(
                "/api/v1/readings/create",
                json=reading_data,
                headers=authenticated_user["headers"]
            )

            if response.status_code == status.HTTP_201_CREATED:
                successful_readings += 1
            elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                break

        # Should hit the limit before creating 25 readings
        assert successful_readings <= 20

    async def test_premium_user_higher_limits(self, client: AsyncClient):
        """Test that premium users have higher reading limits"""
        # Create premium user
        user_data = {
            "username": "premium_user",
            "email": "premium@test.com",
            "password": "Pass123!",
            "is_premium": True
        }

        response = await client.post("/api/v1/auth/register", json=user_data)
        headers = {"Authorization": f"Bearer {response.json()['access_token']}"}

        # Premium users should have higher limits (50 vs 20)
        reading_data = {
            "question": "Premium reading",
            "spread_type": "single_card",
            "num_cards": 1
        }

        successful_readings = 0
        for i in range(55):  # Try to exceed premium limit
            response = await client.post(
                "/api/v1/readings/create",
                json=reading_data,
                headers=headers
            )

            if response.status_code == status.HTTP_201_CREATED:
                successful_readings += 1
            elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                break

        # Premium users should be able to create more readings
        assert successful_readings > 20


@pytest.mark.integration
class TestReadingAnalytics:
    """Test reading analytics and user statistics"""

    async def test_user_reading_statistics(self, client: AsyncClient, authenticated_user):
        """Test retrieving user reading statistics"""
        # Create several readings with different outcomes
        reading_data_list = [
            {
                "question": "Accurate prediction",
                "spread_type": "single_card",
                "num_cards": 1,
                "accuracy_rating": 5
            },
            {
                "question": "Moderate prediction",
                "spread_type": "three_card",
                "num_cards": 3,
                "accuracy_rating": 3
            },
            {
                "question": "Poor prediction",
                "spread_type": "single_card",
                "num_cards": 1,
                "accuracy_rating": 1
            }
        ]

        # Create readings
        for reading_data in reading_data_list:
            await client.post(
                "/api/v1/readings/create",
                json=reading_data,
                headers=authenticated_user["headers"]
            )

        # Get user statistics
        response = await client.get(
            "/api/v1/users/statistics/readings",
            headers=authenticated_user["headers"]
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "total_readings" in data
        assert "average_accuracy" in data
        assert "favorite_spread_types" in data
        assert "reading_frequency" in data
        assert data["total_readings"] >= 3

    async def test_reading_trends_analysis(self, client: AsyncClient, authenticated_user):
        """Test reading trends and patterns analysis"""
        response = await client.get(
            "/api/v1/readings/trends",
            headers=authenticated_user["headers"],
            params={"period": "month"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "reading_count_by_day" in data
        assert "popular_questions" in data
        assert "character_voice_usage" in data
        assert "accuracy_trends" in data


@pytest.mark.integration
class TestReadingWithKarmaAndFaction:
    """Test reading integration with user karma and faction alignment"""

    async def test_reading_interpretation_with_karma(self, client: AsyncClient):
        """Test that reading interpretations reflect user karma"""
        # Create users with different karma scores
        good_karma_user = {
            "username": "good_karma_user",
            "email": "good@test.com",
            "password": "Pass123!",
            "karma_score": 85  # Good karma
        }

        evil_karma_user = {
            "username": "evil_karma_user",
            "email": "evil@test.com",
            "password": "Pass123!",
            "karma_score": 15  # Evil karma
        }

        # Register users
        good_response = await client.post("/api/v1/auth/register", json=good_karma_user)
        evil_response = await client.post("/api/v1/auth/register", json=evil_karma_user)

        good_headers = {"Authorization": f"Bearer {good_response.json()['access_token']}"}
        evil_headers = {"Authorization": f"Bearer {evil_response.json()['access_token']}"}

        # Same question for both users
        reading_data = {
            "question": "What does my future hold?",
            "spread_type": "single_card",
            "num_cards": 1
        }

        # Create readings
        good_reading_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=good_headers
        )
        evil_reading_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=evil_headers
        )

        good_reading = good_reading_response.json()
        evil_reading = evil_reading_response.json()

        # Interpretations should differ based on karma
        assert good_reading["interpretation"] != evil_reading["interpretation"]
        assert good_reading["karma_context"] == "good"
        assert evil_reading["karma_context"] == "evil"

    async def test_reading_with_faction_influence(self, client: AsyncClient):
        """Test that readings are influenced by user faction alignment"""
        brotherhood_user = {
            "username": "brotherhood_member",
            "email": "brotherhood@test.com",
            "password": "Pass123!",
            "faction_alignment": "brotherhood"
        }

        raider_user = {
            "username": "raider_member",
            "email": "raider@test.com",
            "password": "Pass123!",
            "faction_alignment": "raiders"
        }

        # Register users
        brotherhood_response = await client.post("/api/v1/auth/register", json=brotherhood_user)
        raider_response = await client.post("/api/v1/auth/register", json=raider_user)

        brotherhood_headers = {"Authorization": f"Bearer {brotherhood_response.json()['access_token']}"}
        raider_headers = {"Authorization": f"Bearer {raider_response.json()['access_token']}"}

        reading_data = {
            "question": "How should I approach conflict?",
            "spread_type": "single_card",
            "num_cards": 1
        }

        # Create readings
        brotherhood_reading_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=brotherhood_headers
        )
        raider_reading_response = await client.post(
            "/api/v1/readings/create",
            json=reading_data,
            headers=raider_headers
        )

        brotherhood_reading = brotherhood_reading_response.json()
        raider_reading = raider_reading_response.json()

        # Faction influence should be reflected
        assert brotherhood_reading["faction_influence"] == "brotherhood"
        assert raider_reading["faction_influence"] == "raiders"