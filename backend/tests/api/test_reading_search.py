"""
Reading Search API Tests - TDD Implementation
Tests for reading search, filtering, and pagination endpoints
"""

import pytest
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List
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
        "username": f"search_user_{unique_id}",
        "email": f"search_{unique_id}@vault.com",
        "password": "TestPassword123!",
        "display_name": f"Search User {unique_id}"
    }


@pytest.fixture
async def test_user_with_readings(db_session: AsyncSession):
    """Create a test user with multiple readings for search testing"""
    user_service = UserService(db_session)
    reading_service = ReadingService(db_session)

    # Create user
    user_data = generate_unique_user_data()
    user = await user_service.create_user(user_data)

    # Create multiple readings with different attributes
    readings = []

    # Reading 1: Recent, Celtic Cross, tagged "important"
    reading1 = await reading_service.create_reading({
        "user_id": user.id,
        "question": "What is my destiny in the wasteland?",
        "spread_type": "celtic_cross",
        "cards_drawn": [{"card_id": "major_0", "position": 0, "is_reversed": False}],
        "tags": ["important", "destiny"],
        "notes": "This reading speaks about survival"
    })
    readings.append(reading1)

    # Reading 2: Older, Three Card, tagged "daily"
    reading2 = await reading_service.create_reading({
        "user_id": user.id,
        "question": "Daily guidance for the wasteland",
        "spread_type": "three_card",
        "cards_drawn": [{"card_id": "major_1", "position": 0, "is_reversed": False}],
        "tags": ["daily", "guidance"],
        "notes": "Quick daily check-in"
    })
    readings.append(reading2)

    # Reading 3: Single card, no tags
    reading3 = await reading_service.create_reading({
        "user_id": user.id,
        "question": "Should I explore the ruins?",
        "spread_type": "single_card",
        "cards_drawn": [{"card_id": "major_2", "position": 0, "is_reversed": False}],
        "tags": [],
        "notes": "Quick question about exploration"
    })
    readings.append(reading3)

    return {
        "user": user,
        "readings": readings,
        "token": create_access_token({"sub": user.id})
    }


@pytest.mark.asyncio
@pytest.mark.api
class TestReadingSearch:
    """Test reading search functionality"""

    async def test_basic_text_search(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test basic text search in reading questions and notes"""
        token = test_user_with_readings["token"]

        # Search for "wasteland"
        response = await async_client.get(
            "/api/v1/readings/search",
            params={"q": "wasteland"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "results" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

        # Should find at least 2 readings with "wasteland" in question
        assert data["total"] >= 2
        assert len(data["results"]) >= 2

        # Verify results contain the search term
        for result in data["results"]:
            question = result.get("question", "").lower()
            notes = result.get("notes", "").lower()
            assert "wasteland" in question or "wasteland" in notes

    async def test_search_by_spread_type(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test filtering by spread type"""
        token = test_user_with_readings["token"]

        # Search for Celtic Cross spreads
        response = await async_client.get(
            "/api/v1/readings/search",
            params={"spread_type": "celtic_cross"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should find at least 1 Celtic Cross reading
        assert data["total"] >= 1

        # All results should be Celtic Cross
        for result in data["results"]:
            assert result["spread_type"] == "celtic_cross"

    async def test_search_by_tags(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test filtering by tags"""
        token = test_user_with_readings["token"]

        # Search for readings with "important" tag
        response = await async_client.get(
            "/api/v1/readings/search",
            params={"tags": "important"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["total"] >= 1

        # All results should have "important" tag
        for result in data["results"]:
            tags = result.get("tags", [])
            assert "important" in tags

    async def test_search_by_date_range(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test filtering by date range"""
        token = test_user_with_readings["token"]

        # Search for readings from last 7 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)

        response = await async_client.get(
            "/api/v1/readings/search",
            params={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Should find readings within date range
        assert data["total"] >= 0

        # Verify all results are within date range
        for result in data["results"]:
            created_at = datetime.fromisoformat(result["created_at"].replace("Z", "+00:00"))
            assert start_date <= created_at <= end_date

    async def test_search_with_pagination(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test pagination in search results"""
        token = test_user_with_readings["token"]

        # First page
        response = await async_client.get(
            "/api/v1/readings/search",
            params={"page": 1, "page_size": 2},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["results"]) <= 2

        # If there are more results, test second page
        if data["total"] > 2:
            response2 = await async_client.get(
                "/api/v1/readings/search",
                params={"page": 2, "page_size": 2},
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response2.status_code == status.HTTP_200_OK
            data2 = response2.json()

            assert data2["page"] == 2
            # Results should be different from first page
            first_ids = {r["id"] for r in data["results"]}
            second_ids = {r["id"] for r in data2["results"]}
            assert first_ids != second_ids

    async def test_combined_filters(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test combining multiple search filters"""
        token = test_user_with_readings["token"]

        # Search with text + spread type
        response = await async_client.get(
            "/api/v1/readings/search",
            params={
                "q": "wasteland",
                "spread_type": "celtic_cross"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Results should match both criteria
        for result in data["results"]:
            question = result.get("question", "").lower()
            notes = result.get("notes", "").lower()
            assert "wasteland" in question or "wasteland" in notes
            assert result["spread_type"] == "celtic_cross"

    async def test_search_unauthorized(
        self,
        async_client: AsyncClient
    ):
        """Test search without authentication"""
        response = await async_client.get(
            "/api/v1/readings/search",
            params={"q": "test"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_search_no_results(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test search with no matching results"""
        token = test_user_with_readings["token"]

        response = await async_client.get(
            "/api/v1/readings/search",
            params={"q": "nonexistent_query_xyz123"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["total"] == 0
        assert len(data["results"]) == 0

    async def test_search_sorting(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test sorting search results"""
        token = test_user_with_readings["token"]

        # Sort by created_at descending (newest first)
        response = await async_client.get(
            "/api/v1/readings/search",
            params={"sort": "created_at", "order": "desc"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        if len(data["results"]) > 1:
            # Verify results are sorted by date descending
            dates = [
                datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
                for r in data["results"]
            ]
            assert dates == sorted(dates, reverse=True)


@pytest.mark.asyncio
@pytest.mark.api
class TestReadingSearchValidation:
    """Test search parameter validation"""

    async def test_invalid_page_number(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test validation of page number"""
        token = test_user_with_readings["token"]

        response = await async_client.get(
            "/api/v1/readings/search",
            params={"page": 0},  # Invalid: page must be >= 1
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_invalid_page_size(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test validation of page size"""
        token = test_user_with_readings["token"]

        response = await async_client.get(
            "/api/v1/readings/search",
            params={"page_size": 101},  # Invalid: max 100
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_invalid_date_format(
        self,
        async_client: AsyncClient,
        test_user_with_readings: Dict[str, Any]
    ):
        """Test validation of date format"""
        token = test_user_with_readings["token"]

        response = await async_client.get(
            "/api/v1/readings/search",
            params={"start_date": "invalid-date"},
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
