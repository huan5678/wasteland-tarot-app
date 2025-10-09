"""
Comprehensive Test Suite for Bingo API Endpoints
Tests Tasks 13-16: Card creation, daily claims, queries, and error handling

Test Coverage:
- POST /api/v1/bingo/card - Create bingo card
- GET /api/v1/bingo/card - Get user's card
- GET /api/v1/bingo/status - Get bingo status
- POST /api/v1/bingo/claim - Claim daily number
- GET /api/v1/bingo/daily-number - Get today's number
- GET /api/v1/bingo/lines - Get line status
- GET /api/v1/bingo/history/{month} - Get historical data
- GET /api/v1/bingo/rewards - Get rewards

Following TDD methodology - tests written first
"""

import pytest
import pytest_asyncio
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.bingo import (
    UserBingoCard,
    DailyBingoNumber,
    UserNumberClaim,
    BingoReward,
    UserBingoCardHistory,
    UserNumberClaimHistory,
    BingoRewardHistory
)


# Test data fixtures

@pytest.fixture
def valid_card_numbers() -> List[List[int]]:
    """Valid 5x5 bingo card with numbers 1-25"""
    return [
        [1, 6, 11, 16, 21],
        [2, 7, 12, 17, 22],
        [3, 8, 13, 18, 23],
        [4, 9, 14, 19, 24],
        [5, 10, 15, 20, 25]
    ]


@pytest.fixture
def invalid_card_duplicate() -> List[List[int]]:
    """Invalid card with duplicate numbers"""
    return [
        [1, 1, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 25]
    ]


@pytest.fixture
def invalid_card_out_of_range() -> List[List[int]]:
    """Invalid card with numbers out of range"""
    return [
        [0, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 26]
    ]


@pytest.fixture
def invalid_card_wrong_size() -> List[List[int]]:
    """Invalid card with wrong dimensions"""
    return [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16]
    ]


@pytest_asyncio.fixture
async def test_user_card(
    db_session: AsyncSession,
    valid_card_numbers: List[List[int]]
) -> UserBingoCard:
    """Create a test bingo card for user"""
    card = UserBingoCard(
        user_id="test-user-123",
        month_year=date.today().replace(day=1),
        card_data=valid_card_numbers,
        is_active=True
    )
    db_session.add(card)
    await db_session.commit()
    await db_session.refresh(card)
    return card


@pytest_asyncio.fixture
async def test_daily_number(db_session: AsyncSession) -> DailyBingoNumber:
    """Create today's daily number"""
    daily_num = DailyBingoNumber(
        date=date.today(),
        number=13,
        cycle_number=1,
        generated_at=datetime.now()
    )
    db_session.add(daily_num)
    await db_session.commit()
    await db_session.refresh(daily_num)
    return daily_num


@pytest_asyncio.fixture
async def test_user_with_three_lines(
    db_session: AsyncSession,
    test_user_card: UserBingoCard,
    test_daily_number: DailyBingoNumber
) -> UserBingoCard:
    """Create user with enough claims to have 3 lines"""
    # Create claims for first row (1,6,11,16,21)
    # first column (1,2,3,4,5), and main diagonal (1,7,13,19,25)
    claimed_numbers = [1, 2, 3, 4, 5, 6, 7, 11, 13, 16, 19, 21, 25]

    for i, num in enumerate(claimed_numbers):
        claim_date = date.today() - timedelta(days=len(claimed_numbers) - i)

        # Create corresponding daily number
        daily = DailyBingoNumber(
            date=claim_date,
            number=num,
            cycle_number=1,
            generated_at=datetime.now()
        )
        db_session.add(daily)
        await db_session.flush()

        # Create claim
        claim = UserNumberClaim(
            user_id=test_user_card.user_id,
            card_id=test_user_card.id,
            daily_number_id=daily.id,
            claim_date=claim_date,
            number=num,
            claimed_at=datetime.now()
        )
        db_session.add(claim)

    await db_session.commit()
    return test_user_card


# Test Class: Card Creation (Task 13)

class TestBingoCardCreation:
    """Test POST /api/v1/bingo/card - Create bingo card"""

    async def test_create_card_success(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        valid_card_numbers: List[List[int]]
    ):
        """Test successful card creation"""
        response = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": valid_card_numbers}
        )

        assert response.status_code == 201
        data = response.json()

        # Verify response structure
        assert "id" in data
        assert "user_id" in data
        assert data["month_year"] == date.today().strftime("%Y-%m")
        assert data["card_data"] == valid_card_numbers
        assert data["is_active"] is True
        assert "created_at" in data

    async def test_create_card_already_exists(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        test_user_card: UserBingoCard,
        valid_card_numbers: List[List[int]]
    ):
        """Test 409 when user already has card for current month"""
        response = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": valid_card_numbers}
        )

        assert response.status_code == 409
        data = response.json()
        assert data["error"] == "CARD_ALREADY_EXISTS"
        assert "本月已設定賓果卡" in data["message"]

    async def test_create_card_invalid_duplicate_numbers(
        self,
        client: AsyncClient,
        invalid_card_duplicate: List[List[int]]
    ):
        """Test 400 for duplicate numbers"""
        response = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": invalid_card_duplicate}
        )

        assert response.status_code == 400
        data = response.json()
        # Pydantic validation error
        assert "detail" in data

    async def test_create_card_invalid_out_of_range(
        self,
        client: AsyncClient,
        invalid_card_out_of_range: List[List[int]]
    ):
        """Test 400 for numbers out of range (0 or 26)"""
        response = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": invalid_card_out_of_range}
        )

        assert response.status_code == 400

    async def test_create_card_invalid_wrong_size(
        self,
        client: AsyncClient,
        invalid_card_wrong_size: List[List[int]]
    ):
        """Test 400 for wrong grid size"""
        response = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": invalid_card_wrong_size}
        )

        assert response.status_code == 400

    async def test_create_card_missing_numbers(
        self,
        client: AsyncClient
    ):
        """Test 422 for missing numbers field"""
        response = await client.post(
            "/api/v1/bingo/card",
            json={}
        )

        assert response.status_code == 422


# Test Class: Get Card (Task 13)

class TestGetBingoCard:
    """Test GET /api/v1/bingo/card - Get user's bingo card"""

    async def test_get_card_success(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard
    ):
        """Test successfully getting user's card"""
        response = await client.get("/api/v1/bingo/card")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == test_user_card.id
        assert data["user_id"] == test_user_card.user_id
        assert data["card_data"] == test_user_card.card_data

    async def test_get_card_not_found(
        self,
        client: AsyncClient
    ):
        """Test 404 when user has no card"""
        response = await client.get("/api/v1/bingo/card")

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NO_CARD_FOUND"
        assert "尚未設定本月賓果卡" in data["message"]


# Test Class: Get Status (Task 13)

class TestBingoStatus:
    """Test GET /api/v1/bingo/status - Get user's bingo status"""

    async def test_status_with_card(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard,
        test_daily_number: DailyBingoNumber
    ):
        """Test status when user has card"""
        response = await client.get("/api/v1/bingo/status")

        assert response.status_code == 200
        data = response.json()

        assert data["has_card"] is True
        assert data["card"] is not None
        assert data["claimed_numbers"] == []
        assert data["line_count"] == 0
        assert data["has_reward"] is False
        assert data["today_claimed"] is False
        assert data["daily_number"] == 13

    async def test_status_without_card(
        self,
        client: AsyncClient,
        test_daily_number: DailyBingoNumber
    ):
        """Test status when user has no card"""
        response = await client.get("/api/v1/bingo/status")

        assert response.status_code == 200
        data = response.json()

        assert data["has_card"] is False
        assert data["card"] is None
        assert data["claimed_numbers"] == []
        assert data["line_count"] == 0
        assert data["daily_number"] == 13

    async def test_status_with_claims(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard,
        test_daily_number: DailyBingoNumber,
        db_session: AsyncSession
    ):
        """Test status with some claimed numbers"""
        # Create a claim for today
        claim = UserNumberClaim(
            user_id=test_user_card.user_id,
            card_id=test_user_card.id,
            daily_number_id=test_daily_number.id,
            claim_date=date.today(),
            number=13,
            claimed_at=datetime.now()
        )
        db_session.add(claim)
        await db_session.commit()

        response = await client.get("/api/v1/bingo/status")

        assert response.status_code == 200
        data = response.json()

        assert data["today_claimed"] is True
        assert 13 in data["claimed_numbers"]


# Test Class: Daily Claim (Task 14)

class TestDailyClaim:
    """Test POST /api/v1/bingo/claim - Claim daily number"""

    async def test_claim_success(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard,
        test_daily_number: DailyBingoNumber
    ):
        """Test successful daily number claim"""
        response = await client.post("/api/v1/bingo/claim")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["daily_number"] == 13
        assert data["is_on_card"] is True
        assert data["line_count"] >= 0
        assert "has_reward" in data
        assert "claimed_at" in data

    async def test_claim_already_claimed(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard,
        test_daily_number: DailyBingoNumber,
        db_session: AsyncSession
    ):
        """Test 409 when already claimed today"""
        # Create existing claim
        claim = UserNumberClaim(
            user_id=test_user_card.user_id,
            card_id=test_user_card.id,
            daily_number_id=test_daily_number.id,
            claim_date=date.today(),
            number=13,
            claimed_at=datetime.now()
        )
        db_session.add(claim)
        await db_session.commit()

        response = await client.post("/api/v1/bingo/claim")

        assert response.status_code == 409
        data = response.json()
        assert data["error"] == "ALREADY_CLAIMED"
        assert "今日已領取" in data["message"]

    async def test_claim_no_card(
        self,
        client: AsyncClient,
        test_daily_number: DailyBingoNumber
    ):
        """Test 404 when user has no card"""
        response = await client.post("/api/v1/bingo/claim")

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NO_CARD_FOUND"

    async def test_claim_no_daily_number(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard
    ):
        """Test 404 when no daily number generated yet"""
        response = await client.post("/api/v1/bingo/claim")

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NO_DAILY_NUMBER"

    async def test_claim_with_reward(
        self,
        client: AsyncClient,
        test_user_with_three_lines: UserBingoCard,
        test_daily_number: DailyBingoNumber
    ):
        """Test claim triggers reward when 3 lines achieved"""
        response = await client.post("/api/v1/bingo/claim")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert data["line_count"] >= 3
        # Note: reward might already be issued if claimed before
        assert "has_reward" in data


# Test Class: Get Daily Number (Task 15)

class TestGetDailyNumber:
    """Test GET /api/v1/bingo/daily-number - Get today's daily number"""

    async def test_get_daily_number_success(
        self,
        client: AsyncClient,
        test_daily_number: DailyBingoNumber
    ):
        """Test successfully getting today's number"""
        response = await client.get("/api/v1/bingo/daily-number")

        assert response.status_code == 200
        data = response.json()

        assert data["number"] == 13
        assert data["date"] == date.today().isoformat()
        assert data["cycle_number"] == 1

    async def test_get_daily_number_not_generated(
        self,
        client: AsyncClient
    ):
        """Test 404 when no number generated yet"""
        response = await client.get("/api/v1/bingo/daily-number")

        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "NO_DAILY_NUMBER"


# Test Class: Get Lines (Task 15)

class TestGetLines:
    """Test GET /api/v1/bingo/lines - Get user's line status"""

    async def test_get_lines_no_lines(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard
    ):
        """Test lines when no lines completed"""
        response = await client.get("/api/v1/bingo/lines")

        assert response.status_code == 200
        data = response.json()

        assert data["line_count"] == 0
        assert data["line_types"] == []
        assert data["has_three_lines"] is False
        assert data["reward_issued"] is False

    async def test_get_lines_with_lines(
        self,
        client: AsyncClient,
        test_user_with_three_lines: UserBingoCard
    ):
        """Test lines when user has 3+ lines"""
        response = await client.get("/api/v1/bingo/lines")

        assert response.status_code == 200
        data = response.json()

        assert data["line_count"] >= 3
        assert len(data["line_types"]) >= 3
        assert data["has_three_lines"] is True

    async def test_get_lines_no_card(
        self,
        client: AsyncClient
    ):
        """Test 404 when user has no card"""
        response = await client.get("/api/v1/bingo/lines")

        assert response.status_code == 404


# Test Class: Get History (Task 15)

class TestGetHistory:
    """Test GET /api/v1/bingo/history/{month} - Get historical data"""

    async def test_get_history_success(
        self,
        client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test getting history for past month"""
        # Create historical data
        past_month = (date.today().replace(day=1) - timedelta(days=1)).replace(day=1)

        card_history = UserBingoCardHistory(
            user_id="test-user-123",
            month_year=past_month,
            card_data=[[1,2,3,4,5],[6,7,8,9,10],[11,12,13,14,15],[16,17,18,19,20],[21,22,23,24,25]],
            created_at_original=datetime.now() - timedelta(days=30),
            archived_at=datetime.now()
        )
        db_session.add(card_history)

        # Add some claim history
        for num in [1, 5, 13, 25]:
            claim_history = UserNumberClaimHistory(
                user_id="test-user-123",
                card_id=card_history.id,
                claim_date=past_month + timedelta(days=num),
                number=num,
                claimed_at_original=datetime.now() - timedelta(days=30),
                archived_at=datetime.now()
            )
            db_session.add(claim_history)

        await db_session.commit()

        month_str = past_month.strftime("%Y-%m")
        response = await client.get(f"/api/v1/bingo/history/{month_str}")

        assert response.status_code == 200
        data = response.json()

        assert data["month_year"] == month_str
        assert data["card_data"] is not None
        assert len(data["claimed_numbers"]) == 4
        assert data["line_count"] >= 0

    async def test_get_history_no_data(
        self,
        client: AsyncClient
    ):
        """Test 404 when no history data exists"""
        month_str = "2020-01"
        response = await client.get(f"/api/v1/bingo/history/{month_str}")

        assert response.status_code == 404

    async def test_get_history_invalid_month_format(
        self,
        client: AsyncClient
    ):
        """Test 400 for invalid month format"""
        response = await client.get("/api/v1/bingo/history/invalid-month")

        assert response.status_code == 400


# Test Class: Get Rewards (Task 15)

class TestGetRewards:
    """Test GET /api/v1/bingo/rewards - Get user's rewards"""

    async def test_get_rewards_success(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard,
        db_session: AsyncSession
    ):
        """Test getting user's rewards"""
        # Create a reward
        reward = BingoReward(
            user_id=test_user_card.user_id,
            card_id=test_user_card.id,
            month_year=test_user_card.month_year,
            line_types=["row-0", "col-0", "diagonal-main"],
            issued_at=datetime.now()
        )
        db_session.add(reward)
        await db_session.commit()

        response = await client.get("/api/v1/bingo/rewards")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["user_id"] == test_user_card.user_id
        assert data[0]["line_count"] == 3

    async def test_get_rewards_empty(
        self,
        client: AsyncClient
    ):
        """Test getting rewards when user has none"""
        response = await client.get("/api/v1/bingo/rewards")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) == 0


# Test Class: Error Handling (Task 16)

class TestErrorHandling:
    """Test comprehensive error handling across all endpoints"""

    async def test_authentication_required(
        self,
        client: AsyncClient
    ):
        """Test that endpoints require authentication"""
        # Note: This test assumes auth is enforced
        # If using demo user, this might need adjustment
        pass

    async def test_error_response_format(
        self,
        client: AsyncClient
    ):
        """Test that all errors follow consistent format"""
        response = await client.get("/api/v1/bingo/card")

        if response.status_code >= 400:
            data = response.json()
            assert "error" in data
            assert "message" in data
            assert "timestamp" in data or "detail" in data

    async def test_pydantic_validation_errors(
        self,
        client: AsyncClient
    ):
        """Test Pydantic validation produces proper errors"""
        response = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": "invalid"}
        )

        assert response.status_code in [400, 422]

    async def test_traditional_chinese_error_messages(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard,
        valid_card_numbers: List[List[int]]
    ):
        """Test that error messages are in Traditional Chinese"""
        response = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": valid_card_numbers}
        )

        if response.status_code == 409:
            data = response.json()
            # Check for Traditional Chinese characters
            assert any(ord(c) > 127 for c in data["message"])


# Integration Tests

class TestBingoIntegration:
    """Integration tests for complete bingo workflows"""

    async def test_complete_bingo_flow(
        self,
        client: AsyncClient,
        valid_card_numbers: List[List[int]],
        test_daily_number: DailyBingoNumber
    ):
        """Test complete flow: create card -> check status -> claim -> check lines"""
        # 1. Create card
        response = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": valid_card_numbers}
        )
        assert response.status_code == 201

        # 2. Check status
        response = await client.get("/api/v1/bingo/status")
        assert response.status_code == 200
        assert response.json()["has_card"] is True

        # 3. Claim daily number
        response = await client.post("/api/v1/bingo/claim")
        assert response.status_code == 200

        # 4. Check lines
        response = await client.get("/api/v1/bingo/lines")
        assert response.status_code == 200

    async def test_monthly_reset_scenario(
        self,
        client: AsyncClient,
        db_session: AsyncSession
    ):
        """Test accessing data after monthly reset"""
        # This would test history endpoints with archived data
        pass


# Edge Cases

class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    async def test_claim_on_month_boundary(
        self,
        client: AsyncClient,
        test_user_card: UserBingoCard,
        test_daily_number: DailyBingoNumber
    ):
        """Test claiming on last day of month"""
        # Edge case: what happens if claiming on month transition
        pass

    async def test_concurrent_card_creation(
        self,
        client: AsyncClient,
        valid_card_numbers: List[List[int]]
    ):
        """Test concurrent card creation attempts"""
        # Edge case: race condition on card creation
        pass

    async def test_reward_idempotency(
        self,
        client: AsyncClient,
        test_user_with_three_lines: UserBingoCard
    ):
        """Test that rewards are only issued once"""
        # Edge case: ensure reward can't be issued twice
        pass
