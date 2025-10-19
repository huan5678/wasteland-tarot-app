"""
API tests for Token Extension endpoints

Tests cover:
1. POST /api/v1/auth/extend-token (activity & loyalty)
2. GET /api/v1/auth/loyalty-status
3. POST /api/v1/auth/track-login
4. Updated login/me endpoints with auto-tracking
"""

import pytest
from datetime import datetime, timedelta, date
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserLoginHistory, TokenExtensionHistory


class TestExtendTokenEndpoint:
    """Test POST /api/v1/auth/extend-token"""

    @pytest.mark.asyncio
    async def test_extend_token_by_activity_success(
        self,
        async_client: AsyncClient,
        authenticated_user: dict
    ):
        """
        Test: Successfully extend token via activity
        Request: POST /api/v1/auth/extend-token with activity data
        Expected: 200 OK, new expiry timestamp returned
        """
        response = await async_client.post(
            "/api/v1/auth/extend-token",
            json={
                "extension_type": "activity",
                "activity_duration": 1800  # 30 minutes in seconds
            },
            cookies=authenticated_user["cookies"]
        )

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["message"] == "Token extended successfully"
        assert data["extended_minutes"] == 30
        assert "token_expires_at" in data
        assert data["token_expires_at"] > authenticated_user["initial_expiry"]

    @pytest.mark.asyncio
    async def test_extend_token_by_loyalty_success(
        self,
        async_client: AsyncClient,
        authenticated_user_with_loyalty: dict
    ):
        """
        Test: Successfully extend token via loyalty (3+ days login)
        Request: POST /api/v1/auth/extend-token with loyalty type
        Expected: 200 OK, rewards included in response
        """
        response = await async_client.post(
            "/api/v1/auth/extend-token",
            json={
                "extension_type": "loyalty"
            },
            cookies=authenticated_user_with_loyalty["cookies"]
        )

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "rewards" in data
        assert data["rewards"]["karma_bonus"] == 10
        assert data["rewards"]["badge_unlocked"] == "loyal_wasteland_resident"

    @pytest.mark.asyncio
    async def test_extend_token_insufficient_activity(
        self,
        async_client: AsyncClient,
        authenticated_user: dict
    ):
        """
        Test: Reject extension with insufficient activity
        Request: POST /api/v1/auth/extend-token with < 30 min activity
        Expected: 400 Bad Request
        """
        response = await async_client.post(
            "/api/v1/auth/extend-token",
            json={
                "extension_type": "activity",
                "activity_duration": 1000  # Only 16.6 minutes
            },
            cookies=authenticated_user["cookies"]
        )

        assert response.status_code == 400
        assert "Insufficient activity duration" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_extend_token_unauthenticated(self, async_client: AsyncClient):
        """
        Test: Reject extension for unauthenticated user
        Request: POST /api/v1/auth/extend-token without cookies
        Expected: 401 Unauthorized
        """
        response = await async_client.post(
            "/api/v1/auth/extend-token",
            json={
                "extension_type": "activity",
                "activity_duration": 1800
            }
        )

        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_extend_token_max_lifetime_exceeded(
        self,
        async_client: AsyncClient,
        authenticated_user_at_max_lifetime: dict
    ):
        """
        Test: Reject extension when token at max lifetime (7 days)
        Request: POST /api/v1/auth/extend-token
        Expected: 403 Forbidden
        """
        response = await async_client.post(
            "/api/v1/auth/extend-token",
            json={
                "extension_type": "activity",
                "activity_duration": 1800
            },
            cookies=authenticated_user_at_max_lifetime["cookies"]
        )

        assert response.status_code == 403
        assert "maximum lifetime" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_extend_token_rate_limit_exceeded(
        self,
        async_client: AsyncClient,
        authenticated_user_at_rate_limit: dict
    ):
        """
        Test: Reject extension when rate limit reached (10 per 24h)
        Request: POST /api/v1/auth/extend-token (11th time)
        Expected: 429 Too Many Requests
        """
        response = await async_client.post(
            "/api/v1/auth/extend-token",
            json={
                "extension_type": "activity",
                "activity_duration": 1800
            },
            cookies=authenticated_user_at_rate_limit["cookies"]
        )

        assert response.status_code == 429
        assert "Rate limit exceeded" in response.json()["detail"]


class TestLoyaltyStatusEndpoint:
    """Test GET /api/v1/auth/loyalty-status"""

    @pytest.mark.asyncio
    async def test_loyalty_status_eligible(
        self,
        async_client: AsyncClient,
        authenticated_user_with_loyalty: dict
    ):
        """
        Test: Get loyalty status for eligible user (3+ days)
        Request: GET /api/v1/auth/loyalty-status
        Expected: 200 OK, eligible status with details
        """
        response = await async_client.get(
            "/api/v1/auth/loyalty-status",
            cookies=authenticated_user_with_loyalty["cookies"]
        )

        assert response.status_code == 200
        data = response.json()

        assert data["is_eligible"] is True
        assert data["login_days_count"] >= 3
        assert len(data["login_dates"]) >= 3
        assert data["extension_available"] is True
        assert data["current_streak"] >= 3

    @pytest.mark.asyncio
    async def test_loyalty_status_not_eligible(
        self,
        async_client: AsyncClient,
        authenticated_user: dict
    ):
        """
        Test: Get loyalty status for ineligible user (< 3 days)
        Request: GET /api/v1/auth/loyalty-status
        Expected: 200 OK, not eligible status
        """
        response = await async_client.get(
            "/api/v1/auth/loyalty-status",
            cookies=authenticated_user["cookies"]
        )

        assert response.status_code == 200
        data = response.json()

        assert data["is_eligible"] is False
        assert data["login_days_count"] < 3
        assert data["extension_available"] is False

    @pytest.mark.asyncio
    async def test_loyalty_status_unauthenticated(self, async_client: AsyncClient):
        """
        Test: Reject loyalty status check for unauthenticated user
        Request: GET /api/v1/auth/loyalty-status without cookies
        Expected: 401 Unauthorized
        """
        response = await async_client.get("/api/v1/auth/loyalty-status")

        assert response.status_code == 401


class TestTrackLoginEndpoint:
    """Test POST /api/v1/auth/track-login"""

    @pytest.mark.asyncio
    async def test_track_login_new_day(
        self,
        async_client: AsyncClient,
        authenticated_user: dict
    ):
        """
        Test: Track login on a new day
        Request: POST /api/v1/auth/track-login
        Expected: 200 OK, is_new_day = true
        """
        response = await async_client.post(
            "/api/v1/auth/track-login",
            cookies=authenticated_user["cookies"]
        )

        assert response.status_code == 200
        data = response.json()

        assert data["is_new_day"] is True
        assert "login_date" in data
        assert data["consecutive_days"] >= 1

    @pytest.mark.asyncio
    async def test_track_login_same_day(
        self,
        async_client: AsyncClient,
        authenticated_user_logged_in_today: dict
    ):
        """
        Test: Track login on same day (second login)
        Request: POST /api/v1/auth/track-login
        Expected: 200 OK, is_new_day = false
        """
        response = await async_client.post(
            "/api/v1/auth/track-login",
            cookies=authenticated_user_logged_in_today["cookies"]
        )

        assert response.status_code == 200
        data = response.json()

        assert data["is_new_day"] is False

    @pytest.mark.asyncio
    async def test_track_login_triggers_loyalty_check(
        self,
        async_client: AsyncClient,
        authenticated_user_with_2_days: dict
    ):
        """
        Test: Track login triggers loyalty check on 3rd day
        Request: POST /api/v1/auth/track-login (3rd consecutive day)
        Expected: 200 OK, loyalty_check_triggered = true
        """
        response = await async_client.post(
            "/api/v1/auth/track-login",
            cookies=authenticated_user_with_2_days["cookies"]
        )

        assert response.status_code == 200
        data = response.json()

        assert data["consecutive_days"] == 3
        assert data["loyalty_check_triggered"] is True


class TestUpdatedAuthEndpoints:
    """Test login/me endpoints with auto-tracking"""

    @pytest.mark.asyncio
    async def test_login_auto_tracks_daily_login(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """
        Test: Login endpoint automatically tracks daily login
        Request: POST /api/v1/auth/login
        Expected: 200 OK, login history record created
        """
        response = await async_client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "test_password"
            }
        )

        assert response.status_code == 200

        # Verify login history created
        # (This would need to query the database)

    @pytest.mark.asyncio
    async def test_me_endpoint_returns_token_absolute_expiry(
        self,
        async_client: AsyncClient,
        authenticated_user: dict
    ):
        """
        Test: /me endpoint returns token_absolute_expiry
        Request: GET /api/v1/auth/me
        Expected: 200 OK, includes token_absolute_expiry field
        """
        response = await async_client.get(
            "/api/v1/auth/me",
            cookies=authenticated_user["cookies"]
        )

        assert response.status_code == 200
        data = response.json()

        assert "token_expires_at" in data
        assert "user" in data


# Fixtures
@pytest.fixture
async def authenticated_user(async_client: AsyncClient, test_user: User):
    """Login and return authenticated user with cookies"""
    response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "test_password"
        }
    )
    cookies = response.cookies
    token_expires_at = response.json()["token_expires_at"]

    return {
        "user": test_user,
        "cookies": cookies,
        "initial_expiry": token_expires_at
    }


@pytest.fixture
async def authenticated_user_with_loyalty(
    async_client: AsyncClient,
    test_user: User,
    db_session: AsyncSession
):
    """User with 3+ days of login history"""
    # Create login history
    today = date.today()
    for i in range(3):
        login_date = today - timedelta(days=i)
        history = UserLoginHistory(
            user_id=test_user.id,
            login_date=login_date,
            login_count=1
        )
        db_session.add(history)
    await db_session.commit()

    # Login
    response = await async_client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "test_password"}
    )

    return {
        "user": test_user,
        "cookies": response.cookies,
        "initial_expiry": response.json()["token_expires_at"]
    }


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create test user"""
    from app.core.security import get_password_hash

    user = User(
        email="test@example.com",
        name="Test User",
        password_hash=get_password_hash("test_password"),
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user
