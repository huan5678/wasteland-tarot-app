"""
Test Reading History API Endpoints
Tests for GET /api/v1/readings with pagination, search, and filtering
"""

import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.reading_enhanced import CompletedReading
from app.models.user import User


@pytest.fixture
def test_user(db: Session):
    """Create a test user"""
    user = User(
        id="test-user-123",
        username="testuser",
        email="test@example.com"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_readings(db: Session, test_user: User):
    """Create multiple test readings"""
    readings = []

    # Create readings with different attributes for filtering
    for i in range(15):
        reading = CompletedReading(
            id=f"reading-{i}",
            user_id=test_user.id,
            question=f"Test question {i}" if i % 2 == 0 else f"愛情問題 {i}",
            spread_template_id="single-card",
            interpretation=f"Test interpretation {i}" if i % 2 == 0 else f"愛情解讀 {i}",
            created_at=datetime.utcnow() - timedelta(days=i),
            is_favorite=(i % 3 == 0),
            archived=(i > 12)
        )
        db.add(reading)
        readings.append(reading)

    db.commit()
    return readings


class TestReadingHistoryEndpoints:
    """Test suite for reading history API endpoints"""

    def test_get_readings_basic(self, client: TestClient, test_user: User, test_readings: list):
        """Test basic GET /api/v1/readings"""
        response = client.get(
            "/api/v1/readings",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()

        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert "readings" in data
        assert data["total"] == 15
        assert len(data["readings"]) <= 20  # Default limit

    def test_get_readings_pagination(self, client: TestClient, test_user: User, test_readings: list):
        """Test pagination parameters"""
        # Page 1, limit 5
        response = client.get(
            "/api/v1/readings?page=1&limit=5",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["page"] == 1
        assert data["limit"] == 5
        assert len(data["readings"]) == 5

        # Page 2, limit 5
        response2 = client.get(
            "/api/v1/readings?page=2&limit=5",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        data2 = response2.json()
        assert data2["page"] == 2
        assert len(data2["readings"]) == 5

        # Different readings on different pages
        assert data["readings"][0]["id"] != data2["readings"][0]["id"]

    def test_get_readings_search(self, client: TestClient, test_user: User, test_readings: list):
        """Test search functionality"""
        response = client.get(
            "/api/v1/readings?search=愛情",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()

        # Should only return readings with "愛情" in question or interpretation
        assert data["total"] < 15
        for reading in data["readings"]:
            assert "愛情" in reading["question"] or "愛情" in reading.get("interpretation", "")

    def test_get_readings_filter_by_tags(self, client: TestClient, test_user: User, test_readings: list):
        """Test filtering by tags (OR logic)"""
        # First, add tags to some readings
        # This would require the tags system to be implemented
        # For now, we'll test the endpoint accepts the parameter
        response = client.get(
            "/api/v1/readings?tags=愛情,未來",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "readings" in data

    def test_get_readings_filter_by_category(self, client: TestClient, test_user: User, test_readings: list):
        """Test filtering by category_id"""
        response = client.get(
            "/api/v1/readings?category_id=cat-love",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "readings" in data

    def test_get_readings_filter_favorite_only(self, client: TestClient, test_user: User, test_readings: list):
        """Test filtering favorite readings only"""
        response = client.get(
            "/api/v1/readings?favorite_only=true",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()

        # All returned readings should be favorites
        for reading in data["readings"]:
            assert reading["is_favorite"] is True

    def test_get_readings_filter_archived(self, client: TestClient, test_user: User, test_readings: list):
        """Test filtering archived readings"""
        # Archived only
        response = client.get(
            "/api/v1/readings?archived=true",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()

        for reading in data["readings"]:
            assert reading.get("archived") is True

        # Non-archived only (default)
        response2 = client.get(
            "/api/v1/readings?archived=false",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        data2 = response2.json()

        for reading in data2["readings"]:
            assert reading.get("archived", False) is False

    def test_get_readings_sort_by_created_at(self, client: TestClient, test_user: User, test_readings: list):
        """Test sorting by created_at"""
        # Descending (newest first)
        response = client.get(
            "/api/v1/readings?sort_by=created_at&sort_order=desc",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response.status_code == 200
        data = response.json()

        readings = data["readings"]
        for i in range(len(readings) - 1):
            assert readings[i]["created_at"] >= readings[i + 1]["created_at"]

        # Ascending (oldest first)
        response2 = client.get(
            "/api/v1/readings?sort_by=created_at&sort_order=asc",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        data2 = response2.json()
        readings2 = data2["readings"]

        for i in range(len(readings2) - 1):
            assert readings2[i]["created_at"] <= readings2[i + 1]["created_at"]

    def test_get_readings_unauthorized(self, client: TestClient):
        """Test unauthorized access"""
        response = client.get("/api/v1/readings")

        assert response.status_code == 401

    def test_get_readings_invalid_pagination(self, client: TestClient, test_user: User):
        """Test invalid pagination parameters"""
        # Negative page
        response = client.get(
            "/api/v1/readings?page=-1",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response.status_code == 400

        # Zero limit
        response2 = client.get(
            "/api/v1/readings?limit=0",
            headers={"Authorization": f"Bearer {test_user.id}"}
        )

        assert response2.status_code == 400

    def test_get_readings_user_isolation(self, client: TestClient, db: Session):
        """Test that users can only see their own readings"""
        # Create two users
        user1 = User(id="user1", username="user1", email="user1@example.com")
        user2 = User(id="user2", username="user2", email="user2@example.com")
        db.add_all([user1, user2])
        db.commit()

        # Create readings for each user
        reading1 = CompletedReading(
            id="reading-user1",
            user_id=user1.id,
            question="User 1 question",
            spread_template_id="single-card",
            interpretation="User 1 interpretation"
        )
        reading2 = CompletedReading(
            id="reading-user2",
            user_id=user2.id,
            question="User 2 question",
            spread_template_id="single-card",
            interpretation="User 2 interpretation"
        )
        db.add_all([reading1, reading2])
        db.commit()

        # User 1 should only see their reading
        response1 = client.get(
            "/api/v1/readings",
            headers={"Authorization": f"Bearer {user1.id}"}
        )

        data1 = response1.json()
        assert data1["total"] == 1
        assert data1["readings"][0]["id"] == "reading-user1"

        # User 2 should only see their reading
        response2 = client.get(
            "/api/v1/readings",
            headers={"Authorization": f"Bearer {user2.id}"}
        )

        data2 = response2.json()
        assert data2["total"] == 1
        assert data2["readings"][0]["id"] == "reading-user2"
