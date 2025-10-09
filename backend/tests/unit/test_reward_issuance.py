"""
Unit tests for Reward Issuance Logic
Tests the reward issuance functionality in LineDetectionService
"""

import pytest
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.line_detection_service import LineDetectionService
from app.models.bingo import UserBingoCard, BingoReward


class TestRewardIssuance:
    """獎勵發放邏輯單元測試"""

    @pytest.fixture
    async def service(self, db_session: AsyncSession):
        """建立 LineDetectionService 實例"""
        return LineDetectionService(db_session)

    @pytest.fixture
    async def sample_card(self, db_session: AsyncSession):
        """建立測試用賓果卡"""
        card = UserBingoCard(
            user_id="reward-test-user-001",
            month_year=date(2025, 10, 1),
            card_data=[
                [1, 2, 3, 4, 5],
                [6, 7, 8, 9, 10],
                [11, 12, 13, 14, 15],
                [16, 17, 18, 19, 20],
                [21, 22, 23, 24, 25]
            ],
            is_active=True
        )
        db_session.add(card)
        await db_session.commit()
        await db_session.refresh(card)
        return card

    @pytest.mark.asyncio
    async def test_issue_reward_first_time(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：首次發放獎勵應成功"""
        line_types = ['row-0', 'col-0', 'diagonal-main']

        reward = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )

        # 驗證獎勵已發放
        assert reward is not None
        assert isinstance(reward, BingoReward)
        assert reward.user_id == sample_card.user_id
        assert reward.card_id == sample_card.id
        assert reward.month_year == sample_card.month_year
        assert reward.line_types == line_types
        assert len(reward.line_types) == 3
        assert isinstance(reward.issued_at, datetime)

    @pytest.mark.asyncio
    async def test_issue_reward_with_different_line_types(
        self,
        db_session: AsyncSession,
        service: LineDetectionService
    ):
        """測試：不同連線類型的獎勵發放"""
        # 測試案例：不同的連線組合
        test_cases = [
            {
                'user_id': 'reward-user-001',
                'line_types': ['row-0', 'row-1', 'row-2']
            },
            {
                'user_id': 'reward-user-002',
                'line_types': ['col-0', 'col-1', 'col-2']
            },
            {
                'user_id': 'reward-user-003',
                'line_types': ['diagonal-main', 'diagonal-anti', 'row-0']
            },
            {
                'user_id': 'reward-user-004',
                'line_types': ['row-0', 'col-0', 'diagonal-main', 'row-1', 'col-1']  # 5 條線
            }
        ]

        for i, case in enumerate(test_cases):
            # 建立賓果卡
            card = UserBingoCard(
                user_id=case['user_id'],
                month_year=date(2025, 10, 1),
                card_data=[[1, 2, 3, 4, 5]] * 5,
                is_active=True
            )
            db_session.add(card)
            await db_session.commit()
            await db_session.refresh(card)

            # 發放獎勵
            reward = await service.issue_reward(
                user_id=card.user_id,
                card_id=card.id,
                month_year=card.month_year,
                line_types=case['line_types']
            )

            # 驗證
            assert reward is not None
            assert reward.line_types == case['line_types']
            assert len(reward.line_types) == len(case['line_types'])

    @pytest.mark.asyncio
    async def test_issue_reward_duplicate_same_month(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：同月重複發放獎勵應返回 None"""
        line_types = ['row-0', 'col-0', 'diagonal-main']

        # 第一次發放
        reward1 = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )
        assert reward1 is not None

        # 第二次發放（應返回 None）
        reward2 = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=['row-1', 'col-1', 'row-2']  # 不同連線類型
        )
        assert reward2 is None

    @pytest.mark.asyncio
    async def test_issue_reward_different_months(
        self,
        db_session: AsyncSession,
        service: LineDetectionService
    ):
        """測試：不同月份可以發放多次獎勵"""
        user_id = "reward-multi-month-001"
        line_types = ['row-0', 'col-0', 'diagonal-main']

        # 建立 10 月賓果卡
        card_oct = UserBingoCard(
            user_id=user_id,
            month_year=date(2025, 10, 1),
            card_data=[[1, 2, 3, 4, 5]] * 5,
            is_active=True
        )
        db_session.add(card_oct)
        await db_session.commit()
        await db_session.refresh(card_oct)

        # 建立 11 月賓果卡
        card_nov = UserBingoCard(
            user_id=user_id,
            month_year=date(2025, 11, 1),
            card_data=[[1, 2, 3, 4, 5]] * 5,
            is_active=True
        )
        db_session.add(card_nov)
        await db_session.commit()
        await db_session.refresh(card_nov)

        # 10 月發放獎勵
        reward_oct = await service.issue_reward(
            user_id=user_id,
            card_id=card_oct.id,
            month_year=date(2025, 10, 1),
            line_types=line_types
        )
        assert reward_oct is not None

        # 11 月發放獎勵（應成功）
        reward_nov = await service.issue_reward(
            user_id=user_id,
            card_id=card_nov.id,
            month_year=date(2025, 11, 1),
            line_types=line_types
        )
        assert reward_nov is not None

        # 驗證兩個獎勵不同
        assert reward_oct.id != reward_nov.id
        assert reward_oct.month_year != reward_nov.month_year

    @pytest.mark.asyncio
    async def test_get_user_reward_exists(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：查詢已存在的獎勵記錄"""
        line_types = ['row-0', 'col-2', 'diagonal-anti']

        # 發放獎勵
        issued_reward = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )

        # 查詢獎勵
        retrieved_reward = await service.get_user_reward(
            sample_card.user_id,
            sample_card.month_year
        )

        # 驗證
        assert retrieved_reward is not None
        assert retrieved_reward.id == issued_reward.id
        assert retrieved_reward.user_id == sample_card.user_id
        assert retrieved_reward.line_types == line_types

    @pytest.mark.asyncio
    async def test_get_user_reward_not_exists(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：查詢不存在的獎勵記錄應返回 None"""
        # 不發放獎勵，直接查詢
        reward = await service.get_user_reward(
            sample_card.user_id,
            sample_card.month_year
        )

        assert reward is None

    @pytest.mark.asyncio
    async def test_has_received_reward_true(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：檢查已領取獎勵應返回 True"""
        # 發放獎勵
        await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=['row-0', 'col-0', 'diagonal-main']
        )

        # 檢查是否已領取
        has_received = await service.has_received_reward(
            sample_card.user_id,
            sample_card.month_year
        )

        assert has_received is True

    @pytest.mark.asyncio
    async def test_has_received_reward_false(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：檢查未領取獎勵應返回 False"""
        # 不發放獎勵，直接檢查
        has_received = await service.has_received_reward(
            sample_card.user_id,
            sample_card.month_year
        )

        assert has_received is False

    @pytest.mark.asyncio
    async def test_reward_unique_constraint_user_month(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：驗證 UNIQUE 約束（user_id, month_year）"""
        line_types = ['row-0', 'col-0', 'diagonal-main']

        # 第一次發放
        reward1 = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )
        assert reward1 is not None

        # 查詢資料庫驗證只有一筆記錄
        from sqlalchemy import select, func
        result = await db_session.execute(
            select(func.count(BingoReward.id))
            .where(
                BingoReward.user_id == sample_card.user_id,
                BingoReward.month_year == sample_card.month_year
            )
        )
        count = result.scalar()
        assert count == 1

        # 第二次發放（應被阻止）
        reward2 = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=['row-1', 'col-1', 'row-2']
        )
        assert reward2 is None

        # 再次查詢，應仍為 1 筆
        result = await db_session.execute(
            select(func.count(BingoReward.id))
            .where(
                BingoReward.user_id == sample_card.user_id,
                BingoReward.month_year == sample_card.month_year
            )
        )
        count = result.scalar()
        assert count == 1

    @pytest.mark.asyncio
    async def test_reward_line_types_jsonb_storage(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：驗證連線類型以 JSONB 陣列儲存"""
        line_types = ['row-0', 'col-2', 'diagonal-main', 'row-4', 'col-4']

        # 發放獎勵
        reward = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )

        # 重新查詢驗證儲存格式
        from sqlalchemy import select
        result = await db_session.execute(
            select(BingoReward)
            .where(BingoReward.id == reward.id)
        )
        retrieved = result.scalar_one()

        # 驗證 JSONB 陣列
        assert isinstance(retrieved.line_types, list)
        assert retrieved.line_types == line_types
        assert len(retrieved.line_types) == 5

    @pytest.mark.asyncio
    async def test_reward_issued_at_timestamp(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：驗證獎勵發放時間戳記"""
        before_issue = datetime.now()

        # 發放獎勵
        reward = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=['row-0', 'col-0', 'diagonal-main']
        )

        after_issue = datetime.now()

        # 驗證時間戳記
        assert reward.issued_at is not None
        assert isinstance(reward.issued_at, datetime)
        assert before_issue <= reward.issued_at <= after_issue

    @pytest.mark.asyncio
    async def test_reward_with_minimal_three_lines(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：驗證最少三條連線即可獲得獎勵"""
        # 恰好三條連線
        line_types_3 = ['row-0', 'col-0', 'diagonal-main']

        reward = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types_3
        )

        assert reward is not None
        assert len(reward.line_types) == 3

    @pytest.mark.asyncio
    async def test_reward_with_more_than_three_lines(
        self,
        db_session: AsyncSession,
        service: LineDetectionService
    ):
        """測試：驗證超過三條連線的獎勵發放"""
        user_id = "reward-many-lines-001"

        # 建立賓果卡
        card = UserBingoCard(
            user_id=user_id,
            month_year=date(2025, 10, 1),
            card_data=[[1, 2, 3, 4, 5]] * 5,
            is_active=True
        )
        db_session.add(card)
        await db_session.commit()
        await db_session.refresh(card)

        # 5 條連線
        line_types_5 = ['row-0', 'row-1', 'col-0', 'col-1', 'diagonal-main']

        reward = await service.issue_reward(
            user_id=user_id,
            card_id=card.id,
            month_year=card.month_year,
            line_types=line_types_5
        )

        assert reward is not None
        assert len(reward.line_types) == 5

    @pytest.mark.asyncio
    async def test_reward_get_line_count_method(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：驗證 BingoReward.get_line_count() 方法"""
        line_types = ['row-0', 'col-0', 'diagonal-main', 'row-1']

        # 發放獎勵
        reward = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )

        # 驗證 get_line_count() 方法
        assert reward.get_line_count() == 4

    @pytest.mark.asyncio
    async def test_reward_month_year_normalization(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：驗證 month_year 自動標準化為月初"""
        # 使用月中日期
        month_year_mid = date(2025, 10, 15)

        # 發放獎勵
        reward = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=month_year_mid,  # 10 月 15 日
            line_types=['row-0', 'col-0', 'diagonal-main']
        )

        # 驗證儲存的是月初日期
        assert reward.month_year == date(2025, 10, 1)
