"""
Integration tests for Daily Claim Flow
Tests the complete flow: claim → line detection → reward issuance
"""

import pytest
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.daily_claim_service import DailyClaimService
from app.services.line_detection_service import LineDetectionService
from app.services.bingo_card_service import BingoCardManagerService
from app.services.daily_number_generator_service import DailyNumberGeneratorService
from app.models.bingo import UserBingoCard, DailyBingoNumber, UserNumberClaim, BingoReward
from app.schemas.bingo import ClaimResult
from app.core.exceptions import (
    NoCardFoundError,
    AlreadyClaimedError,
    NoDailyNumberError,
    PastDateClaimError
)


class TestDailyClaimFlow:
    """每日領取流程整合測試"""

    @pytest.fixture
    async def claim_service(self, db_session: AsyncSession):
        """建立 DailyClaimService 實例"""
        return DailyClaimService(db_session)

    @pytest.fixture
    async def card_service(self, db_session: AsyncSession):
        """建立 BingoCardManagerService 實例"""
        return BingoCardManagerService(db_session)

    @pytest.fixture
    async def number_generator(self, db_session: AsyncSession):
        """建立 DailyNumberGeneratorService 實例"""
        return DailyNumberGeneratorService(db_session)

    @pytest.fixture
    async def line_detector(self, db_session: AsyncSession):
        """建立 LineDetectionService 實例"""
        return LineDetectionService(db_session)

    @pytest.fixture
    async def test_user_card(
        self,
        db_session: AsyncSession,
        card_service: BingoCardManagerService
    ):
        """建立測試用賓果卡"""
        user_id = "test-user-claim-001"
        card_numbers = [
            [1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10],
            [11, 12, 13, 14, 15],
            [16, 17, 18, 19, 20],
            [21, 22, 23, 24, 25]
        ]

        card = await card_service.create_card(
            user_id=user_id,
            numbers=card_numbers,
            month_year=date.today().replace(day=1)
        )

        return card

    @pytest.mark.asyncio
    async def test_claim_daily_number_success(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService,
        test_user_card: UserBingoCard
    ):
        """測試：成功領取每日號碼"""
        # 產生今日號碼
        today = date.today()
        daily_number = await number_generator.generate_daily_number(today)

        # 領取號碼
        result = await claim_service.claim_daily_number(
            user_id=test_user_card.user_id,
            claim_date=today
        )

        assert result.success is True
        assert result.daily_number == daily_number.number
        assert result.is_on_card is True  # 號碼在卡片上
        assert result.line_count >= 0
        assert isinstance(result.claimed_at, datetime)

    @pytest.mark.asyncio
    async def test_claim_no_card_error(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService
    ):
        """測試：無賓果卡時領取應拋出異常"""
        # 產生今日號碼
        today = date.today()
        await number_generator.generate_daily_number(today)

        # 嘗試領取（使用者無賓果卡）
        with pytest.raises(NoCardFoundError):
            await claim_service.claim_daily_number(
                user_id="non-existent-user",
                claim_date=today
            )

    @pytest.mark.asyncio
    async def test_claim_no_daily_number_error(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        test_user_card: UserBingoCard
    ):
        """測試：每日號碼尚未產生時領取應拋出異常"""
        # 不產生今日號碼，直接領取
        with pytest.raises(NoDailyNumberError):
            await claim_service.claim_daily_number(
                user_id=test_user_card.user_id,
                claim_date=date.today()
            )

    @pytest.mark.asyncio
    async def test_claim_duplicate_error(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService,
        test_user_card: UserBingoCard
    ):
        """測試：重複領取應拋出異常"""
        # 產生今日號碼
        today = date.today()
        await number_generator.generate_daily_number(today)

        # 第一次領取
        result1 = await claim_service.claim_daily_number(
            user_id=test_user_card.user_id,
            claim_date=today
        )
        assert result1.success is True

        # 第二次領取（應失敗）
        with pytest.raises(AlreadyClaimedError):
            await claim_service.claim_daily_number(
                user_id=test_user_card.user_id,
                claim_date=today
            )

    @pytest.mark.asyncio
    async def test_claim_past_date_error(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService,
        test_user_card: UserBingoCard
    ):
        """測試：嘗試領取過期日期應拋出異常"""
        # 嘗試領取昨天的號碼
        yesterday = date.today() - timedelta(days=1)

        with pytest.raises(PastDateClaimError):
            await claim_service.claim_daily_number(
                user_id=test_user_card.user_id,
                claim_date=yesterday
            )

    @pytest.mark.asyncio
    async def test_claim_with_line_detection(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService,
        card_service: BingoCardManagerService
    ):
        """測試：領取後自動檢測連線"""
        user_id = "test-user-line-001"
        today = date.today()

        # 建立賓果卡（第一列為 1-5）
        card = await card_service.create_card(
            user_id=user_id,
            numbers=[
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15],
                [16, 17, 18, 19, 20],
                [21, 22, 23, 24, 25]
            ],
            month_year=today.replace(day=1)
        )

        # 模擬領取第一列的號碼（1-5）
        for i, number in enumerate([1, 2, 3, 4, 5]):
            # 產生每日號碼
            daily_num = DailyBingoNumber(
                date=today + timedelta(days=i),
                number=number,
                cycle_number=1,
                generated_at=datetime.now()
            )
            db_session.add(daily_num)
            await db_session.commit()

        # 領取前 4 個號碼（尚未成線）
        for i in range(4):
            result = await claim_service.claim_daily_number(
                user_id=user_id,
                claim_date=today + timedelta(days=i)
            )
            assert result.line_count == 0

        # 領取第 5 個號碼（完成第一列）
        result = await claim_service.claim_daily_number(
            user_id=user_id,
            claim_date=today + timedelta(days=4)
        )

        assert result.line_count == 1
        assert result.has_reward is False  # 僅 1 條線，未達獎勵條件

    @pytest.mark.asyncio
    async def test_claim_with_three_lines_reward(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService,
        card_service: BingoCardManagerService
    ):
        """測試：達成三連線時自動發放獎勵"""
        user_id = "test-user-reward-001"
        today = date.today()
        month_year = today.replace(day=1)

        # 建立賓果卡
        card = await card_service.create_card(
            user_id=user_id,
            numbers=[
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15],
                [16, 17, 18, 19, 20],
                [21, 22, 23, 24, 25]
            ],
            month_year=month_year
        )

        # 建立足以達成三連線的號碼
        # 第一列 (1-5) + 第一欄 (1, 6, 11, 16, 21) + 主對角線 (1, 7, 13, 19, 25)
        # 合併去重：1, 2, 3, 4, 5, 6, 7, 11, 13, 16, 19, 21, 25
        numbers_to_claim = [1, 2, 3, 4, 5, 6, 7, 11, 13, 16, 19, 21, 25]

        # 產生每日號碼並領取
        for i, number in enumerate(numbers_to_claim):
            daily_num = DailyBingoNumber(
                date=today + timedelta(days=i),
                number=number,
                cycle_number=1,
                generated_at=datetime.now()
            )
            db_session.add(daily_num)
            await db_session.commit()

            result = await claim_service.claim_daily_number(
                user_id=user_id,
                claim_date=today + timedelta(days=i)
            )

            # 最後一個號碼領取後應達成三連線並獲得獎勵
            if i == len(numbers_to_claim) - 1:
                assert result.line_count >= 3, f"應達成至少 3 條連線，實際 {result.line_count}"
                assert result.has_reward is True, "應獲得三連線獎勵"
                assert result.reward is not None
                assert result.reward["type"] == "THREE_LINES"

    @pytest.mark.asyncio
    async def test_claim_reward_only_once_per_month(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        line_detector: LineDetectionService,
        card_service: BingoCardManagerService
    ):
        """測試：每月僅能領取一次獎勵"""
        user_id = "test-user-once-001"
        today = date.today()
        month_year = today.replace(day=1)

        # 建立賓果卡
        card = await card_service.create_card(
            user_id=user_id,
            numbers=[
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15],
                [16, 17, 18, 19, 20],
                [21, 22, 23, 24, 25]
            ],
            month_year=month_year
        )

        # 直接發放獎勵
        reward1 = await line_detector.issue_reward(
            user_id=user_id,
            card_id=card.id,
            month_year=month_year,
            line_types=['row-0', 'col-0', 'diagonal-main']
        )
        assert reward1 is not None

        # 嘗試第二次發放（應返回 None）
        reward2 = await line_detector.issue_reward(
            user_id=user_id,
            card_id=card.id,
            month_year=month_year,
            line_types=['row-1', 'col-1', 'diagonal-anti']
        )
        assert reward2 is None

    @pytest.mark.asyncio
    async def test_has_claimed_today(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService,
        test_user_card: UserBingoCard
    ):
        """測試：檢查今日領取狀態"""
        today = date.today()

        # 尚未領取
        has_claimed = await claim_service.has_claimed_today(
            test_user_card.user_id,
            today
        )
        assert has_claimed is False

        # 產生並領取號碼
        await number_generator.generate_daily_number(today)
        await claim_service.claim_daily_number(
            user_id=test_user_card.user_id,
            claim_date=today
        )

        # 已領取
        has_claimed = await claim_service.has_claimed_today(
            test_user_card.user_id,
            today
        )
        assert has_claimed is True

    @pytest.mark.asyncio
    async def test_get_claimed_numbers(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService,
        test_user_card: UserBingoCard
    ):
        """測試：取得已領取號碼列表"""
        today = date.today()
        month_year = today.replace(day=1)

        # 領取多個號碼
        numbers_to_claim = [1, 5, 13]
        for i, number in enumerate(numbers_to_claim):
            daily_num = DailyBingoNumber(
                date=today + timedelta(days=i),
                number=number,
                cycle_number=1,
                generated_at=datetime.now()
            )
            db_session.add(daily_num)
            await db_session.commit()

            await claim_service.claim_daily_number(
                user_id=test_user_card.user_id,
                claim_date=today + timedelta(days=i)
            )

        # 取得已領取號碼
        claimed_numbers = await claim_service.get_claimed_numbers(
            test_user_card.user_id,
            month_year
        )

        assert len(claimed_numbers) == 3
        assert set(claimed_numbers) == set(numbers_to_claim)

    @pytest.mark.asyncio
    async def test_get_user_status(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService,
        test_user_card: UserBingoCard
    ):
        """測試：取得使用者狀態摘要"""
        today = date.today()
        month_year = today.replace(day=1)

        # 產生今日號碼
        daily_number = await number_generator.generate_daily_number(today)

        # 取得狀態（尚未領取）
        status = await claim_service.get_user_status(
            test_user_card.user_id,
            month_year
        )

        assert status["has_card"] is True
        assert status["card"].id == test_user_card.id
        assert status["claimed_numbers"] == []
        assert status["line_count"] == 0
        assert status["has_reward"] is False
        assert status["today_claimed"] is False
        assert status["daily_number"] == daily_number.number

        # 領取號碼
        await claim_service.claim_daily_number(
            user_id=test_user_card.user_id,
            claim_date=today
        )

        # 再次取得狀態（已領取）
        status = await claim_service.get_user_status(
            test_user_card.user_id,
            month_year
        )

        assert status["today_claimed"] is True
        assert len(status["claimed_numbers"]) == 1
        assert status["claimed_numbers"][0] == daily_number.number

    @pytest.mark.asyncio
    async def test_get_claim_history(
        self,
        db_session: AsyncSession,
        claim_service: DailyClaimService,
        number_generator: DailyNumberGeneratorService,
        test_user_card: UserBingoCard
    ):
        """測試：取得領取歷史記錄"""
        today = date.today()
        month_year = today.replace(day=1)

        # 領取多個號碼
        numbers_to_claim = [1, 2, 3]
        for i, number in enumerate(numbers_to_claim):
            daily_num = DailyBingoNumber(
                date=today + timedelta(days=i),
                number=number,
                cycle_number=1,
                generated_at=datetime.now()
            )
            db_session.add(daily_num)
            await db_session.commit()

            await claim_service.claim_daily_number(
                user_id=test_user_card.user_id,
                claim_date=today + timedelta(days=i)
            )

        # 取得歷史記錄
        history = await claim_service.get_claim_history(
            test_user_card.user_id,
            month_year
        )

        assert len(history) == 3
        assert all(isinstance(claim, UserNumberClaim) for claim in history)
        assert [claim.number for claim in history] == numbers_to_claim
