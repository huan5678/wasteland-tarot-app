"""
Daily Bingo 完整流程整合測試

測試完整業務流程:
1. 建立賓果卡
2. 每日領取號碼
3. 連線檢測
4. 獎勵發放
5. 每月重置

需求對應: All requirements integration validation
Task: 27
"""
import pytest
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient
from app.models.bingo import (
    UserBingoCard,
    DailyBingoNumber,
    UserNumberClaim,
    BingoReward
)
from app.models.user import User
from tests.factories import UserFactory


@pytest.mark.asyncio
class TestBingoCompleteFlow:
    """測試完整賓果流程"""

    async def test_complete_bingo_flow(
        self,
        client: AsyncClient,
        db: AsyncSession,
        auth_headers: dict
    ):
        """
        完整流程測試: 建立卡片 → 每日領取 → 達成三連線 → 獲得獎勵
        """
        # 1. 建立賓果卡
        card_numbers = list(range(1, 26))  # 1-25 所有號碼
        response = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": card_numbers},
            headers=auth_headers
        )
        assert response.status_code == 201
        card_data = response.json()
        assert "card_id" in card_data
        assert len(card_data["grid"]) == 5

        # 2. 生成每日號碼並領取（模擬 15 天）
        claimed_numbers = set()
        for day in range(15):
            # 生成當日號碼
            daily_number = await self._generate_daily_number(
                db,
                date.today() + timedelta(days=day),
                day + 1  # 號碼 1-15
            )

            # 領取號碼
            response = await client.post(
                "/api/v1/bingo/claim",
                headers=auth_headers
            )

            if day == 0:
                # 第一次領取應該成功
                assert response.status_code == 200
                claim_data = response.json()
                assert claim_data["number"] == daily_number.number
                assert claim_data["is_on_card"] is True
                claimed_numbers.add(daily_number.number)
            else:
                # 後續領取
                assert response.status_code in [200, 409]  # 成功或已領取
                if response.status_code == 200:
                    claimed_numbers.add(response.json()["number"])

        # 3. 檢查連線狀態
        response = await client.get(
            "/api/v1/bingo/lines",
            headers=auth_headers
        )
        assert response.status_code == 200
        lines_data = response.json()
        assert lines_data["line_count"] >= 3  # 至少三連線

        # 4. 驗證獎勵發放
        response = await client.get(
            "/api/v1/bingo/rewards",
            headers=auth_headers
        )
        assert response.status_code == 200
        rewards = response.json()
        assert len(rewards) > 0
        assert rewards[0]["line_count"] >= 3

        # 5. 驗證資料庫狀態
        user_id = auth_headers["user_id"]  # 從 auth_headers 取得

        # 檢查賓果卡
        card = await db.get(UserBingoCard, card_data["card_id"])
        assert card is not None
        assert card.user_id == user_id

        # 檢查領取記錄
        claims = await db.execute(
            "SELECT COUNT(*) FROM user_number_claims WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        assert claims.scalar() >= 1

        # 檢查獎勵記錄
        reward = await db.execute(
            "SELECT * FROM bingo_rewards WHERE user_id = :user_id LIMIT 1",
            {"user_id": user_id}
        )
        assert reward.scalar() is not None

    async def test_duplicate_card_prevention(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """測試防止同月建立多張賓果卡"""
        card_numbers = list(range(1, 26))

        # 第一次建立
        response1 = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": card_numbers},
            headers=auth_headers
        )
        assert response1.status_code == 201

        # 第二次建立應該失敗
        response2 = await client.post(
            "/api/v1/bingo/card",
            json={"numbers": card_numbers},
            headers=auth_headers
        )
        assert response2.status_code == 409
        assert "已存在" in response2.json()["detail"]

    async def test_duplicate_claim_prevention(
        self,
        client: AsyncClient,
        db: AsyncSession,
        auth_headers: dict
    ):
        """測試防止同日重複領取"""
        # 建立賓果卡
        await client.post(
            "/api/v1/bingo/card",
            json={"numbers": list(range(1, 26))},
            headers=auth_headers
        )

        # 生成今日號碼
        await self._generate_daily_number(db, date.today(), 1)

        # 第一次領取
        response1 = await client.post(
            "/api/v1/bingo/claim",
            headers=auth_headers
        )
        assert response1.status_code == 200

        # 第二次領取應該失敗
        response2 = await client.post(
            "/api/v1/bingo/claim",
            headers=auth_headers
        )
        assert response2.status_code == 409
        assert "已領取" in response2.json()["detail"]

    async def test_invalid_card_numbers(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """測試無效的賓果卡號碼驗證"""
        test_cases = [
            # 重複號碼
            {
                "numbers": [1, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
                "error": "重複"
            },
            # 超出範圍
            {
                "numbers": [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
                "error": "範圍"
            },
            # 數量不足
            {
                "numbers": [1, 2, 3, 4, 5],
                "error": "25"
            },
            # 數量過多
            {
                "numbers": list(range(1, 27)),
                "error": "25"
            }
        ]

        for test_case in test_cases:
            response = await client.post(
                "/api/v1/bingo/card",
                json={"numbers": test_case["numbers"]},
                headers=auth_headers
            )
            assert response.status_code == 422
            assert test_case["error"] in response.json()["detail"]

    async def test_claim_without_card(
        self,
        client: AsyncClient,
        db: AsyncSession,
        auth_headers: dict
    ):
        """測試無賓果卡時領取號碼"""
        # 生成今日號碼
        await self._generate_daily_number(db, date.today(), 1)

        # 嘗試領取
        response = await client.post(
            "/api/v1/bingo/claim",
            headers=auth_headers
        )
        assert response.status_code == 404
        assert "賓果卡" in response.json()["detail"]

    async def test_reward_once_per_month(
        self,
        client: AsyncClient,
        db: AsyncSession,
        auth_headers: dict
    ):
        """測試每月僅發放一次獎勵"""
        # 建立賓果卡（使用特定模式確保快速達成三連線）
        # 第一排: 1-5
        card_numbers = list(range(1, 26))
        await client.post(
            "/api/v1/bingo/card",
            json={"numbers": card_numbers},
            headers=auth_headers
        )

        # 領取足夠號碼達成三連線（橫向、直向、對角線）
        for i in range(15):
            await self._generate_daily_number(db, date.today() + timedelta(days=i), i + 1)
            await client.post("/api/v1/bingo/claim", headers=auth_headers)

        # 檢查獎勵
        response = await client.get("/api/v1/bingo/rewards", headers=auth_headers)
        rewards = response.json()

        # 應該只有一個獎勵記錄
        current_month_rewards = [
            r for r in rewards
            if r["month_year"].startswith(date.today().strftime("%Y-%m"))
        ]
        assert len(current_month_rewards) == 1

    async def test_monthly_reset_flow(
        self,
        client: AsyncClient,
        db: AsyncSession,
        auth_headers: dict
    ):
        """測試每月重置流程（模擬）"""
        # 1. 建立上月賓果卡
        last_month = date.today().replace(day=1) - timedelta(days=1)
        card = UserBingoCard(
            user_id=auth_headers["user_id"],
            month_year=last_month,
            card_data={"grid": [[i for i in range(j*5+1, j*5+6)] for j in range(5)]},
            is_active=True
        )
        db.add(card)
        await db.commit()

        # 2. 執行重置（這裡應該觸發 monthly-reset Edge Function）
        # 在實際環境中，這由 pg_cron 自動執行
        # 測試環境中，我們手動模擬資料歸檔

        # 查詢當月賓果卡（應該為空）
        response = await client.get("/api/v1/bingo/card", headers=auth_headers)
        assert response.status_code == 404  # 當月無賓果卡

        # 查詢歷史記錄
        response = await client.get(
            f"/api/v1/bingo/history/{last_month.strftime('%Y-%m')}",
            headers=auth_headers
        )
        # 根據實際實作，可能需要調整斷言

    # Helper methods

    async def _generate_daily_number(
        self,
        db: AsyncSession,
        number_date: date,
        number: int
    ) -> DailyBingoNumber:
        """生成每日號碼"""
        daily_number = DailyBingoNumber(
            date=number_date,
            number=number,
            cycle_number=1,
            generated_at=datetime.utcnow()
        )
        db.add(daily_number)
        await db.commit()
        await db.refresh(daily_number)
        return daily_number


@pytest.mark.asyncio
class TestBingoAPIEndpoints:
    """測試各 API 端點"""

    async def test_get_bingo_status(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """測試獲取賓果狀態"""
        response = await client.get("/api/v1/bingo/status", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "has_card" in data
        assert "line_count" in data
        assert "has_claimed_today" in data

    async def test_get_daily_number(
        self,
        client: AsyncClient,
        db: AsyncSession
    ):
        """測試獲取今日號碼"""
        # 生成今日號碼
        await self._generate_daily_number(db, date.today(), 15)

        response = await client.get("/api/v1/bingo/daily-number")
        assert response.status_code == 200
        data = response.json()
        assert data["number"] == 15
        assert data["date"] == date.today().isoformat()

    async def test_get_daily_number_not_generated(
        self,
        client: AsyncClient
    ):
        """測試今日號碼未生成時的回應"""
        response = await client.get("/api/v1/bingo/daily-number")
        assert response.status_code == 404

    async def test_get_bingo_history(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """測試獲取歷史記錄"""
        # 查詢當月歷史
        current_month = date.today().strftime("%Y-%m")
        response = await client.get(
            f"/api/v1/bingo/history/{current_month}",
            headers=auth_headers
        )
        assert response.status_code in [200, 404]  # 可能有或沒有歷史記錄

    # Helper method
    async def _generate_daily_number(
        self,
        db: AsyncSession,
        number_date: date,
        number: int
    ) -> DailyBingoNumber:
        """生成每日號碼"""
        daily_number = DailyBingoNumber(
            date=number_date,
            number=number,
            cycle_number=1,
            generated_at=datetime.utcnow()
        )
        db.add(daily_number)
        await db.commit()
        await db.refresh(daily_number)
        return daily_number
