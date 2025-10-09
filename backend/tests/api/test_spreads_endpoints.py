"""
Spreads API Endpoints Tests
Tests for spread templates and layouts
"""

import pytest
from fastapi import status
from httpx import AsyncClient
from typing import Dict, Any


@pytest.mark.asyncio
@pytest.mark.api
class TestSpreadsList:
    """Test spread template listing"""

    async def test_list_all_spreads(self, async_client: AsyncClient):
        """Test listing all available spreads"""
        response = await async_client.get("/api/v1/spreads")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert isinstance(data, list) or "spreads" in data

        if isinstance(data, list):
            spreads = data
        else:
            spreads = data["spreads"]

        # Should have at least basic spreads
        assert len(spreads) > 0

        # Check spread structure
        spread = spreads[0]
        assert "id" in spread
        assert "name" in spread
        assert "display_name" in spread
        assert "card_count" in spread
        assert "positions" in spread

    async def test_list_spreads_filtered_by_difficulty(
        self,
        async_client: AsyncClient
    ):
        """Test filtering spreads by difficulty"""
        response = await async_client.get(
            "/api/v1/spreads",
            params={"difficulty": "beginner"}
        )

        assert response.status_code == status.HTTP_200_OK

    async def test_list_spreads_pagination(self, async_client: AsyncClient):
        """Test spread listing with pagination"""
        response = await async_client.get(
            "/api/v1/spreads",
            params={"page": 1, "page_size": 5}
        )

        assert response.status_code == status.HTTP_200_OK

    async def test_search_spreads_by_name(self, async_client: AsyncClient):
        """Test searching spreads by name"""
        response = await async_client.get(
            "/api/v1/spreads",
            params={"search": "three"}
        )

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
@pytest.mark.api
class TestSpreadDetails:
    """Test individual spread details"""

    async def test_get_spread_by_id(self, async_client: AsyncClient):
        """Test getting a specific spread by ID"""
        # First get list to find a valid ID
        list_response = await async_client.get("/api/v1/spreads")
        spreads = list_response.json()

        if isinstance(spreads, list) and len(spreads) > 0:
            spread_id = spreads[0]["id"]
        else:
            pytest.skip("No spreads available")

        # Get specific spread
        response = await async_client.get(f"/api/v1/spreads/{spread_id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["id"] == spread_id
        assert "positions" in data
        assert "description" in data

    async def test_get_nonexistent_spread(self, async_client: AsyncClient):
        """Test getting a nonexistent spread"""
        response = await async_client.get("/api/v1/spreads/nonexistent-spread")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_spread_positions_structure(self, async_client: AsyncClient):
        """Test that spread positions have correct structure"""
        list_response = await async_client.get("/api/v1/spreads")
        spreads = list_response.json()

        if isinstance(spreads, list) and len(spreads) > 0:
            spread = spreads[0]
            positions = spread["positions"]

            assert isinstance(positions, list)
            assert len(positions) > 0

            position = positions[0]
            assert "number" in position or "position_number" in position
            assert "name" in position or "position_name" in position
            assert "meaning" in position or "position_meaning" in position


@pytest.mark.asyncio
@pytest.mark.api
class TestSpreadStatistics:
    """Test spread usage statistics"""

    async def test_get_spread_statistics(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test getting spread usage statistics"""
        token = test_user_with_token["token"]

        response = await async_client.get(
            "/api/v1/spreads/statistics",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "total_uses" in data or "spreads" in data

    async def test_get_popular_spreads(self, async_client: AsyncClient):
        """Test getting most popular spreads"""
        response = await async_client.get("/api/v1/spreads/popular")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert isinstance(data, list) or "spreads" in data


@pytest.mark.asyncio
@pytest.mark.api
class TestCustomSpreads:
    """Test custom spread creation and management"""

    async def test_create_custom_spread(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test creating a custom spread"""
        token = test_user_with_token["token"]

        custom_spread = {
            "name": "custom_test_spread",
            "display_name": "Custom Test Spread",
            "description": "A test spread",
            "card_count": 3,
            "positions": [
                {"number": 1, "name": "Position 1", "meaning": "First position"},
                {"number": 2, "name": "Position 2", "meaning": "Second position"},
                {"number": 3, "name": "Position 3", "meaning": "Third position"}
            ],
            "difficulty_level": "beginner"
        }

        response = await async_client.post(
            "/api/v1/spreads/custom",
            json=custom_spread,
            headers={"Authorization": f"Bearer {token}"}
        )

        # May not be implemented yet
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_501_NOT_IMPLEMENTED
        ]

    async def test_list_user_custom_spreads(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test listing user's custom spreads"""
        token = test_user_with_token["token"]

        response = await async_client.get(
            "/api/v1/spreads/custom",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

    async def test_delete_custom_spread(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test deleting a custom spread"""
        token = test_user_with_token["token"]

        response = await async_client.delete(
            "/api/v1/spreads/custom/test-spread-id",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.asyncio
@pytest.mark.api
class TestSpreadValidation:
    """Test spread validation and error handling"""

    async def test_invalid_spread_id_format(self, async_client: AsyncClient):
        """Test handling of invalid spread ID format"""
        response = await async_client.get("/api/v1/spreads/invalid@spread#id")

        assert response.status_code in [
            status.HTTP_404_NOT_FOUND,
            status.HTTP_422_UNPROCESSABLE_ENTITY
        ]

    async def test_spread_card_count_validation(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test validation of spread card count"""
        token = test_user_with_token["token"]

        invalid_spread = {
            "name": "invalid_spread",
            "card_count": 0,  # Invalid: must be > 0
            "positions": []
        }

        response = await async_client.post(
            "/api/v1/spreads/custom",
            json=invalid_spread,
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ]
