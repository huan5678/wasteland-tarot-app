"""
API tests for Gamification Karma endpoints
Tests /api/v1/karma/* endpoints
"""

import pytest
from httpx import AsyncClient
from uuid import uuid4
from datetime import datetime

from app.models.gamification import KarmaLog, UserKarma
from app.models.user import User


@pytest.fixture
async def test_user_with_karma(db_session):
    """Create a test user with some Karma."""
    user = User(
        id=uuid4(),
        email=f"karma_{uuid4()}@example.com",
        name="Karma Test User",
        password_hash="dummy_hash",
        is_active=True
    )
    db_session.add(user)

    # Add UserKarma
    user_karma = UserKarma(
        user_id=user.id,
        total_karma=1250,
        current_level=3,
        karma_to_next_level=250,
        rank=42
    )
    db_session.add(user_karma)

    # Add some karma logs
    logs = [
        KarmaLog(
            user_id=user.id,
            action_type="complete_reading",
            karma_amount=10,
            description="完成占卜",
            action_metadata={"reading_id": str(uuid4())}
        ),
        KarmaLog(
            user_id=user.id,
            action_type="daily_login",
            karma_amount=5,
            description="每日登入"
        ),
        KarmaLog(
            user_id=user.id,
            action_type="complete_task",
            karma_amount=20,
            description="完成每日任務"
        )
    ]
    for log in logs:
        db_session.add(log)

    await db_session.commit()
    await db_session.refresh(user)

    return user


@pytest.mark.asyncio
async def test_get_karma_summary(client: AsyncClient, test_user_with_karma, auth_headers):
    """Test GET /api/v1/karma/summary."""
    response = await client.get(
        "/api/v1/karma/summary",
        headers=auth_headers(test_user_with_karma.id)
    )

    assert response.status_code == 200

    data = response.json()
    assert "total_karma" in data
    assert "current_level" in data
    assert "karma_to_next_level" in data
    assert "rank" in data
    assert "today_earned" in data
    assert "level_title" in data

    assert data["total_karma"] == 1250
    assert data["current_level"] == 3
    assert data["karma_to_next_level"] == 250
    assert data["rank"] == 42


@pytest.mark.asyncio
async def test_get_karma_logs(client: AsyncClient, test_user_with_karma, auth_headers):
    """Test GET /api/v1/karma/logs."""
    response = await client.get(
        "/api/v1/karma/logs?page=1&limit=20",
        headers=auth_headers(test_user_with_karma.id)
    )

    assert response.status_code == 200

    data = response.json()
    assert "logs" in data
    assert "pagination" in data

    logs = data["logs"]
    assert len(logs) >= 1

    # Check log structure
    log = logs[0]
    assert "id" in log
    assert "action_type" in log
    assert "karma_amount" in log
    assert "description" in log
    assert "created_at" in log
    assert "metadata" in log


@pytest.mark.asyncio
async def test_get_karma_logs_pagination(client: AsyncClient, test_user_with_karma, auth_headers):
    """Test Karma logs pagination."""
    response = await client.get(
        "/api/v1/karma/logs?page=1&limit=2",
        headers=auth_headers(test_user_with_karma.id)
    )

    assert response.status_code == 200
    data = response.json()

    pagination = data["pagination"]
    assert pagination["page"] == 1
    assert pagination["limit"] == 2
    assert pagination["total"] >= 3


@pytest.mark.asyncio
async def test_get_karma_summary_unauthenticated(client: AsyncClient):
    """Test Karma summary endpoint without authentication."""
    response = await client.get("/api/v1/karma/summary")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_karma_logs_unauthenticated(client: AsyncClient):
    """Test Karma logs endpoint without authentication."""
    response = await client.get("/api/v1/karma/logs")

    assert response.status_code == 401
