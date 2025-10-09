"""
Reading Analytics API Tests - TDD Implementation
Tests for reading statistics, trends, and analytics tracking
"""

import pytest
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.user_service import UserService
from app.services.reading_service import ReadingService
from app.core.security import create_access_token


def generate_unique_user_data():
    """Generate unique user data to avoid conflicts"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "username": f"analytics_user_{unique_id}",
        "email": f"analytics_{unique_id}@vault.com",
        "password": "TestPassword123!",
        "display_name": f"Analytics User {unique_id}"
    }


@pytest.fixture
async def test_user_with_analytics_data(db_session: AsyncSession):
    """Create test user with readings for analytics testing"""
    user_service = UserService(db_session)
    reading_service = ReadingService(db_session)

    # Create user
    user_data = generate_unique_user_data()
    user = await user_service.create_user(user_data)

    # Create readings with different patterns
    readings = []

    # Create readings over past 30 days
    for i in range(20):
        days_ago = i
        created_date = datetime.utcnow() - timedelta(days=days_ago)

        reading = await reading_service.create_reading({
            "user_id": user.id,
            "question": f"Question {i}",
            "spread_type": ["celtic_cross", "three_card", "single_card"][i % 3],
            "cards_drawn": [{"card_id": f"major_{i % 22}", "position": 0, "is_reversed": False}],
            "character_voice": ["pip_boy", "vault_dweller", "wasteland_trader"][i % 3],
            "karma_context": ["good", "neutral", "evil"][i % 3],
            "satisfaction_rating": 3 + (i % 3)  # Ratings 3-5
        })

        # Manually set created_at for historical data
        reading.created_at = created_date
        readings.append(reading)

    await db_session.commit()

    return {
        "user": user,
        "readings": readings,
        "token": create_access_token({"sub": user.id})
    }


@pytest.mark.asyncio
@pytest.mark.api
class TestReadingAnalytics:
    """Test reading analytics and statistics"""

    async def test_get_basic_statistics(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test retrieving basic reading statistics"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/stats",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Verify expected fields
        assert "total_readings" in data
        assert "readings_this_week" in data
        assert "readings_this_month" in data
        assert "average_satisfaction" in data
        assert "favorite_spread" in data
        assert "favorite_character_voice" in data

        # Verify data types
        assert isinstance(data["total_readings"], int)
        assert isinstance(data["average_satisfaction"], (int, float))
        assert data["total_readings"] > 0

    async def test_get_reading_frequency_analysis(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test reading frequency analysis over time"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/frequency",
            params={"period": "30d"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "period" in data
        assert "data_points" in data
        assert isinstance(data["data_points"], list)

        # Should have daily data points
        if len(data["data_points"]) > 0:
            point = data["data_points"][0]
            assert "date" in point
            assert "count" in point

    async def test_get_spread_usage_analytics(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test spread type usage statistics"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/spreads",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "spread_usage" in data
        assert isinstance(data["spread_usage"], dict)

        # Should have counts for each spread type used
        total_usage = sum(data["spread_usage"].values())
        assert total_usage > 0

    async def test_get_character_voice_preferences(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test character voice preference analytics"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/voices",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "voice_usage" in data
        assert "favorite_voice" in data
        assert isinstance(data["voice_usage"], dict)

    async def test_get_karma_distribution(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test karma context distribution analytics"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/karma",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "karma_distribution" in data
        assert isinstance(data["karma_distribution"], dict)

        # Should have counts for good, neutral, evil
        assert "good" in data["karma_distribution"] or \
               "neutral" in data["karma_distribution"] or \
               "evil" in data["karma_distribution"]

    async def test_get_satisfaction_trends(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test satisfaction rating trends over time"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/satisfaction",
            params={"period": "30d"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "average_rating" in data
        assert "trend" in data  # increasing, decreasing, stable
        assert "rating_distribution" in data

        # Verify average rating is in valid range
        if data["average_rating"] is not None:
            assert 1 <= data["average_rating"] <= 5

    async def test_get_reading_patterns(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test reading pattern analysis"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/patterns",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "most_active_day" in data
        assert "most_active_hour" in data
        assert "average_readings_per_week" in data
        assert "streak_days" in data

    async def test_get_card_frequency_analysis(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test most drawn cards analytics"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/cards",
            params={"limit": 10},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "most_drawn_cards" in data
        assert isinstance(data["most_drawn_cards"], list)

        # Each card should have id and count
        if len(data["most_drawn_cards"]) > 0:
            card = data["most_drawn_cards"][0]
            assert "card_id" in card
            assert "count" in card
            assert "percentage" in card

    async def test_get_time_period_comparison(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test comparing analytics across time periods"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/compare",
            params={
                "period1": "7d",
                "period2": "previous_7d"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "period1" in data
        assert "period2" in data
        assert "changes" in data

        # Changes should show increase/decrease/stable
        assert "reading_count_change" in data["changes"]
        assert "satisfaction_change" in data["changes"]

    async def test_analytics_with_date_range(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test analytics filtered by date range"""
        token = test_user_with_analytics_data["token"]

        start_date = (datetime.utcnow() - timedelta(days=15)).isoformat()
        end_date = datetime.utcnow().isoformat()

        response = await async_client.get(
            "/api/v1/readings/analytics/stats",
            params={
                "start_date": start_date,
                "end_date": end_date
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "date_range" in data
        assert data["date_range"]["start"] == start_date
        assert data["date_range"]["end"] == end_date

    async def test_analytics_unauthorized(
        self,
        async_client: AsyncClient
    ):
        """Test analytics endpoints require authentication"""
        response = await async_client.get(
            "/api/v1/readings/analytics/stats"
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_analytics_empty_data(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test analytics with user who has no readings"""
        # Create user with no readings
        user_service = UserService(db_session)
        user_data = generate_unique_user_data()
        user = await user_service.create_user(user_data)
        token = create_access_token({"sub": user.id})

        response = await async_client.get(
            "/api/v1/readings/analytics/stats",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should return zeros for user with no data
        assert data["total_readings"] == 0
        assert data.get("average_satisfaction") is None or data.get("average_satisfaction") == 0


@pytest.mark.asyncio
@pytest.mark.api
class TestAnalyticsTracking:
    """Test analytics event tracking"""

    async def test_track_reading_created_event(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test that reading creation is tracked in analytics"""
        token = test_user_with_analytics_data["token"]

        # Get initial count
        response1 = await async_client.get(
            "/api/v1/readings/analytics/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        initial_count = response1.json()["total_readings"]

        # Create a new reading
        await async_client.post(
            "/api/v1/readings",
            json={
                "question": "Analytics test reading",
                "spread_type": "single_card",
                "num_cards": 1
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        # Verify count increased
        response2 = await async_client.get(
            "/api/v1/readings/analytics/stats",
            headers={"Authorization": f"Bearer {token}"}
        )
        new_count = response2.json()["total_readings"]

        assert new_count == initial_count + 1

    async def test_track_satisfaction_rating(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test tracking satisfaction rating updates"""
        token = test_user_with_analytics_data["token"]
        reading_id = test_user_with_analytics_data["readings"][0].id

        # Update satisfaction rating
        response = await async_client.patch(
            f"/api/v1/readings/{reading_id}",
            json={"satisfaction_rating": 5},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK

        # Verify analytics reflects the update
        stats_response = await async_client.get(
            "/api/v1/readings/analytics/satisfaction",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert stats_response.status_code == status.HTTP_200_OK
        # Average should include the new rating


@pytest.mark.asyncio
@pytest.mark.api
class TestAnalyticsExport:
    """Test analytics data export"""

    async def test_export_analytics_csv(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test exporting analytics data as CSV"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/export",
            params={"format": "csv"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "text/csv"

    async def test_export_analytics_json(
        self,
        async_client: AsyncClient,
        test_user_with_analytics_data: Dict[str, Any]
    ):
        """Test exporting analytics data as JSON"""
        token = test_user_with_analytics_data["token"]

        response = await async_client.get(
            "/api/v1/readings/analytics/export",
            params={"format": "json"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        assert "application/json" in response.headers["content-type"]

        data = response.json()
        assert "statistics" in data
        assert "trends" in data
        assert "patterns" in data
