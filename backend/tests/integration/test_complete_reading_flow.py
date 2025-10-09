"""
Complete Reading Flow Integration Tests
End-to-end tests for the complete reading workflow
"""

import pytest
import uuid
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.services.user_service import UserService
from app.core.security import create_access_token


def generate_unique_user_data():
    """Generate unique user data"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "username": f"flow_test_user_{unique_id}",
        "email": f"flow_{unique_id}@wasteland.com",
        "password": "TestPassword123!",
        "display_name": f"Flow Test User {unique_id}"
    }


@pytest.mark.asyncio
@pytest.mark.integration
class TestCompleteReadingFlow:
    """Test complete end-to-end reading flow"""

    async def test_full_reading_lifecycle(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test complete reading lifecycle from user creation to reading deletion"""

        # Step 1: Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)
        token = create_access_token({"sub": user.id})

        # Step 2: List available spreads
        spreads_response = await async_client.get("/api/v1/spreads")
        assert spreads_response.status_code == status.HTTP_200_OK
        spreads = spreads_response.json()

        if isinstance(spreads, list):
            spread_list = spreads
        else:
            spread_list = spreads.get("spreads", [])

        assert len(spread_list) > 0, "Should have available spreads"
        spread_id = spread_list[0]["id"]

        # Step 3: Create a reading
        reading_data = {
            "question": "What does the wasteland hold for me?",
            "spread_template_id": spread_id,
            "character_voice": "pip_boy",
            "karma_context": "neutral",
            "radiation_factor": 0.5
        }

        create_response = await async_client.post(
            "/api/v1/readings",
            json=reading_data,
            headers={"Authorization": f"Bearer {token}"}
        )

        assert create_response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        reading = create_response.json()
        reading_id = reading["id"]

        # Step 4: Get reading details
        get_response = await async_client.get(
            f"/api/v1/readings/{reading_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_response.status_code == status.HTTP_200_OK

        # Step 5: Update reading (add feedback)
        update_data = {
            "user_satisfaction": 5,
            "user_feedback": "Excellent reading!",
            "tags": ["important", "wasteland"]
        }

        update_response = await async_client.patch(
            f"/api/v1/readings/{reading_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert update_response.status_code == status.HTTP_200_OK

        # Step 6: Search for the reading
        search_response = await async_client.get(
            "/api/v1/readings/search",
            params={"q": "wasteland"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert search_response.status_code == status.HTTP_200_OK
        search_results = search_response.json()
        assert search_results["total"] >= 1

        # Step 7: Get analytics
        stats_response = await async_client.get(
            "/api/v1/readings/analytics/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert stats_response.status_code == status.HTTP_200_OK
        stats = stats_response.json()
        assert stats["total_readings"] >= 1

        # Step 8: Delete reading
        delete_response = await async_client.delete(
            f"/api/v1/readings/{reading_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert delete_response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT
        ]

        # Step 9: Verify deletion
        get_deleted_response = await async_client.get(
            f"/api/v1/readings/{reading_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert get_deleted_response.status_code == status.HTTP_404_NOT_FOUND

    async def test_multiple_readings_workflow(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test creating and managing multiple readings"""

        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)
        token = create_access_token({"sub": user.id})

        # Create multiple readings
        reading_ids = []
        for i in range(5):
            reading_data = {
                "question": f"Question {i}",
                "spread_template_id": "single_card",
                "character_voice": "pip_boy",
                "karma_context": ["good", "neutral", "evil"][i % 3]
            }

            response = await async_client.post(
                "/api/v1/readings",
                json=reading_data,
                headers={"Authorization": f"Bearer {token}"}
            )

            if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
                reading_ids.append(response.json()["id"])

        assert len(reading_ids) >= 3, "Should create multiple readings"

        # List all readings
        list_response = await async_client.get(
            "/api/v1/readings",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert list_response.status_code == status.HTTP_200_OK
        readings_list = list_response.json()

        if isinstance(readings_list, dict):
            total = readings_list.get("total_count", len(readings_list.get("readings", [])))
        else:
            total = len(readings_list)

        assert total >= len(reading_ids)

        # Get analytics with multiple readings
        analytics_response = await async_client.get(
            "/api/v1/readings/analytics/karma",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert analytics_response.status_code == status.HTTP_200_OK

    async def test_reading_with_different_spreads(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test readings with different spread types"""

        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)
        token = create_access_token({"sub": user.id})

        # Get available spreads
        spreads_response = await async_client.get("/api/v1/spreads")
        spreads_data = spreads_response.json()

        if isinstance(spreads_data, list):
            spreads = spreads_data
        else:
            spreads = spreads_data.get("spreads", [])

        # Try creating readings with different spreads
        for spread in spreads[:3]:  # Test first 3 spreads
            reading_data = {
                "question": f"Test with {spread['name']}",
                "spread_template_id": spread["id"],
                "character_voice": "pip_boy",
                "karma_context": "neutral"
            }

            response = await async_client.post(
                "/api/v1/readings",
                json=reading_data,
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_201_CREATED
            ], f"Failed to create reading with spread {spread['name']}"

        # Check spread usage analytics
        spread_stats_response = await async_client.get(
            "/api/v1/readings/analytics/spreads",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert spread_stats_response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
@pytest.mark.integration
class TestReadingSearchAndFilter:
    """Test reading search and filtering integration"""

    async def test_search_and_filter_workflow(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test searching and filtering readings"""

        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)
        token = create_access_token({"sub": user.id})

        # Create readings with different attributes
        readings_data = [
            {
                "question": "What lies in the wasteland?",
                "spread_template_id": "single_card",
                "character_voice": "pip_boy",
                "karma_context": "good",
                "tags": ["wasteland", "exploration"]
            },
            {
                "question": "Will I survive the vault?",
                "spread_template_id": "single_card",
                "character_voice": "vault_dweller",
                "karma_context": "neutral",
                "tags": ["vault", "survival"]
            },
            {
                "question": "Should I trust the Brotherhood?",
                "spread_template_id": "single_card",
                "character_voice": "wasteland_trader",
                "karma_context": "neutral",
                "tags": ["brotherhood", "trust"]
            }
        ]

        for reading_data in readings_data:
            await async_client.post(
                "/api/v1/readings",
                json=reading_data,
                headers={"Authorization": f"Bearer {token}"}
            )

        # Search by text
        search_response = await async_client.get(
            "/api/v1/readings/search",
            params={"q": "wasteland"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert search_response.status_code == status.HTTP_200_OK
        results = search_response.json()
        assert results["total"] >= 1

        # Filter by tags
        tag_response = await async_client.get(
            "/api/v1/readings/search",
            params={"tags": "vault"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert tag_response.status_code == status.HTTP_200_OK

        # Filter by voice
        voice_response = await async_client.get(
            "/api/v1/readings",
            params={"character_voice": "pip_boy"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert voice_response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.asyncio
@pytest.mark.integration
class TestReadingAnalyticsIntegration:
    """Test analytics integration with reading operations"""

    async def test_analytics_update_on_reading_creation(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test that analytics update when readings are created"""

        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)
        token = create_access_token({"sub": user.id})

        # Get initial stats
        initial_stats = await async_client.get(
            "/api/v1/readings/analytics/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        initial_total = initial_stats.json()["total_readings"]

        # Create a reading
        reading_data = {
            "question": "Analytics test",
            "spread_template_id": "single_card",
            "character_voice": "pip_boy",
            "karma_context": "neutral"
        }

        await async_client.post(
            "/api/v1/readings",
            json=reading_data,
            headers={"Authorization": f"Bearer {token}"}
        )

        # Get updated stats
        updated_stats = await async_client.get(
            "/api/v1/readings/analytics/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        updated_total = updated_stats.json()["total_readings"]

        assert updated_total == initial_total + 1

    async def test_analytics_with_satisfaction_ratings(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test analytics with satisfaction ratings"""

        # Create user
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)
        token = create_access_token({"sub": user.id})

        # Create readings with different ratings
        for rating in [3, 4, 5, 4, 5]:
            reading_data = {
                "question": f"Test rating {rating}",
                "spread_template_id": "single_card",
                "character_voice": "pip_boy",
                "karma_context": "neutral",
                "satisfaction_rating": rating
            }

            await async_client.post(
                "/api/v1/readings",
                json=reading_data,
                headers={"Authorization": f"Bearer {token}"}
            )

        # Get satisfaction trends
        trends_response = await async_client.get(
            "/api/v1/readings/analytics/satisfaction",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert trends_response.status_code == status.HTTP_200_OK
        trends = trends_response.json()

        assert trends["average_rating"] is not None
        assert trends["average_rating"] >= 3.0
        assert trends["average_rating"] <= 5.0
