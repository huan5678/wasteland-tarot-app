"""
Unit tests for Line Detection Service
Tests bitmask algorithm, line detection accuracy, and performance
"""

import pytest
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.line_detection_service import LineDetectionService
from app.models.bingo import UserBingoCard, UserNumberClaim, BingoReward
from app.core.exceptions import NoCardFoundError
import time


class TestLineDetectionService:
    """Line Detection Service 單元測試"""

    @pytest.fixture
    async def service(self, db_session: AsyncSession):
        """建立 LineDetectionService 實例"""
        return LineDetectionService(db_session)

    @pytest.fixture
    async def sample_card(self, db_session: AsyncSession):
        """建立測試用賓果卡"""
        card = UserBingoCard(
            user_id="test-user-001",
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

    def test_bitmask_creation_empty(self, service: LineDetectionService):
        """測試：建立空位元遮罩（無已領取號碼）"""
        card_numbers = list(range(1, 26))  # 1-25
        claimed_numbers = []

        bitmask = service.create_bitmask(card_numbers, claimed_numbers)

        assert bitmask == 0, "空領取列表應產生 0 遮罩"

    def test_bitmask_creation_single(self, service: LineDetectionService):
        """測試：建立單一號碼的位元遮罩"""
        card_numbers = list(range(1, 26))  # 1-25 按順序排列
        claimed_numbers = [1]  # 號碼 1 在位置 0

        bitmask = service.create_bitmask(card_numbers, claimed_numbers)

        expected_bitmask = 0b0000000000000000000000001  # 位置 0 為 1
        assert bitmask == expected_bitmask

    def test_bitmask_creation_multiple(self, service: LineDetectionService):
        """測試：建立多個號碼的位元遮罩"""
        card_numbers = list(range(1, 26))
        claimed_numbers = [1, 5, 25]  # 位置 0, 4, 24

        bitmask = service.create_bitmask(card_numbers, claimed_numbers)

        # 位置 0, 4, 24 為 1
        expected_bitmask = 0b1000000000000000000010001
        assert bitmask == expected_bitmask

    def test_bitmask_creation_non_sequential(self, service: LineDetectionService):
        """測試：建立亂序號碼的位元遮罩"""
        # 卡片號碼亂序排列
        card_numbers = [13, 7, 25, 3, 19, 11, 22, 5, 18, 1,
                       9, 15, 21, 6, 24, 2, 14, 8, 20, 17,
                       12, 4, 23, 16, 10]
        claimed_numbers = [13, 7, 25]

        bitmask = service.create_bitmask(card_numbers, claimed_numbers)

        # 找出 13, 7, 25 在卡片中的位置
        positions = [card_numbers.index(n) for n in claimed_numbers]
        expected_bitmask = sum(1 << pos for pos in positions)

        assert bitmask == expected_bitmask

    def test_line_detection_no_lines(self, service: LineDetectionService):
        """測試：檢測無連線情況"""
        # 只標記零散的幾個號碼，無法構成連線
        bitmask = 0b0000000000100000100000100  # 位置 2, 8, 14

        line_count, line_types = service.count_lines(bitmask)

        assert line_count == 0
        assert line_types == []

    def test_line_detection_single_horizontal(self, service: LineDetectionService):
        """測試：檢測單條橫向連線"""
        # 第一列：位置 0-4
        bitmask = service.ROW_0

        line_count, line_types = service.count_lines(bitmask)

        assert line_count == 1
        assert 'row-0' in line_types

    def test_line_detection_single_vertical(self, service: LineDetectionService):
        """測試：檢測單條直向連線"""
        # 第一欄：位置 0, 5, 10, 15, 20
        bitmask = service.COL_0

        line_count, line_types = service.count_lines(bitmask)

        assert line_count == 1
        assert 'col-0' in line_types

    def test_line_detection_single_diagonal_main(self, service: LineDetectionService):
        """測試：檢測主對角線連線"""
        # 主對角線：位置 0, 6, 12, 18, 24
        bitmask = service.DIAG_MAIN

        line_count, line_types = service.count_lines(bitmask)

        assert line_count == 1
        assert 'diagonal-main' in line_types

    def test_line_detection_single_diagonal_anti(self, service: LineDetectionService):
        """測試：檢測反對角線連線"""
        # 反對角線：位置 4, 8, 12, 16, 20
        bitmask = service.DIAG_ANTI

        line_count, line_types = service.count_lines(bitmask)

        assert line_count == 1
        assert 'diagonal-anti' in line_types

    def test_line_detection_three_lines(self, service: LineDetectionService):
        """測試：檢測三條連線（達成獎勵條件）"""
        # 組合三條連線：第一列 + 第一欄 + 主對角線
        bitmask = service.ROW_0 | service.COL_0 | service.DIAG_MAIN

        line_count, line_types = service.count_lines(bitmask)

        assert line_count == 3
        assert 'row-0' in line_types
        assert 'col-0' in line_types
        assert 'diagonal-main' in line_types

    def test_line_detection_all_lines(self, service: LineDetectionService):
        """測試：檢測所有 12 條連線（滿卡）"""
        # 全部 25 位元都為 1
        bitmask = 0b1111111111111111111111111

        line_count, line_types = service.count_lines(bitmask)

        assert line_count == 12
        assert len(line_types) == 12

    def test_line_detection_mixed_lines(self, service: LineDetectionService):
        """測試：檢測混合連線（橫、直、斜各一條）"""
        # 第二列 + 第三欄 + 反對角線
        bitmask = service.ROW_1 | service.COL_2 | service.DIAG_ANTI

        line_count, line_types = service.count_lines(bitmask)

        assert line_count == 3
        assert 'row-1' in line_types
        assert 'col-2' in line_types
        assert 'diagonal-anti' in line_types

    @pytest.mark.asyncio
    async def test_check_lines_no_card(self, service: LineDetectionService):
        """測試：檢查不存在的賓果卡應拋出異常"""
        with pytest.raises(NoCardFoundError):
            await service.check_lines("non-existent-user", date(2025, 10, 1))

    @pytest.mark.asyncio
    async def test_check_lines_no_claims(
        self,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：檢查無任何領取記錄的賓果卡"""
        line_count, line_types = await service.check_lines(
            sample_card.user_id,
            sample_card.month_year
        )

        assert line_count == 0
        assert line_types == []

    @pytest.mark.asyncio
    async def test_check_lines_with_claims(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：檢查有領取記錄的賓果卡"""
        # 建立第一列的領取記錄（號碼 1-5）
        for number in [1, 2, 3, 4, 5]:
            claim = UserNumberClaim(
                user_id=sample_card.user_id,
                card_id=sample_card.id,
                daily_number_id="dummy-id",
                claim_date=date(2025, 10, number),
                number=number,
                claimed_at=datetime.now()
            )
            db_session.add(claim)

        await db_session.commit()

        line_count, line_types = await service.check_lines(
            sample_card.user_id,
            sample_card.month_year
        )

        assert line_count == 1
        assert 'row-0' in line_types

    @pytest.mark.asyncio
    async def test_check_lines_three_lines(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：檢查達成三條連線的賓果卡"""
        # 建立第一列、第一欄、主對角線的領取記錄
        # 第一列：1-5
        # 第一欄：1, 6, 11, 16, 21
        # 主對角線：1, 7, 13, 19, 25
        # 合併去重：1, 2, 3, 4, 5, 6, 7, 11, 13, 16, 19, 21, 25
        claimed_numbers = {1, 2, 3, 4, 5, 6, 7, 11, 13, 16, 19, 21, 25}

        for idx, number in enumerate(claimed_numbers):
            claim = UserNumberClaim(
                user_id=sample_card.user_id,
                card_id=sample_card.id,
                daily_number_id=f"dummy-id-{idx}",
                claim_date=date(2025, 10, idx + 1),
                number=number,
                claimed_at=datetime.now()
            )
            db_session.add(claim)

        await db_session.commit()

        line_count, line_types = await service.check_lines(
            sample_card.user_id,
            sample_card.month_year
        )

        assert line_count >= 3
        assert 'row-0' in line_types
        assert 'col-0' in line_types
        assert 'diagonal-main' in line_types

    @pytest.mark.asyncio
    async def test_issue_reward_success(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：成功發放獎勵"""
        line_types = ['row-0', 'col-0', 'diagonal-main']

        reward = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )

        assert reward is not None
        assert reward.user_id == sample_card.user_id
        assert reward.card_id == sample_card.id
        assert reward.month_year == sample_card.month_year
        assert reward.line_types == line_types
        assert len(reward.line_types) == 3

    @pytest.mark.asyncio
    async def test_issue_reward_duplicate(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：重複發放獎勵應返回 None"""
        line_types = ['row-0', 'col-0', 'diagonal-main']

        # 第一次發放
        reward1 = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )
        assert reward1 is not None

        # 第二次發放（應失敗）
        reward2 = await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )
        assert reward2 is None

    @pytest.mark.asyncio
    async def test_get_user_reward(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：查詢使用者獎勵記錄"""
        line_types = ['row-0', 'col-2', 'diagonal-anti']

        # 發放獎勵
        await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=line_types
        )

        # 查詢獎勵
        reward = await service.get_user_reward(
            sample_card.user_id,
            sample_card.month_year
        )

        assert reward is not None
        assert reward.user_id == sample_card.user_id
        assert reward.line_types == line_types

    @pytest.mark.asyncio
    async def test_has_received_reward(
        self,
        db_session: AsyncSession,
        service: LineDetectionService,
        sample_card: UserBingoCard
    ):
        """測試：檢查使用者是否已領取獎勵"""
        # 尚未發放獎勵
        has_reward = await service.has_received_reward(
            sample_card.user_id,
            sample_card.month_year
        )
        assert has_reward is False

        # 發放獎勵
        await service.issue_reward(
            user_id=sample_card.user_id,
            card_id=sample_card.id,
            month_year=sample_card.month_year,
            line_types=['row-0', 'col-0', 'diagonal-main']
        )

        # 再次檢查
        has_reward = await service.has_received_reward(
            sample_card.user_id,
            sample_card.month_year
        )
        assert has_reward is True

    def test_line_detection_performance(self, service: LineDetectionService):
        """測試：連線檢測效能（應 <10ms）"""
        # 建立滿卡遮罩（最壞情況）
        bitmask = 0b1111111111111111111111111

        # 執行 1000 次測試
        start_time = time.perf_counter()

        for _ in range(1000):
            service.count_lines(bitmask)

        end_time = time.perf_counter()
        elapsed_ms = (end_time - start_time) * 1000

        # 平均每次應 <10ms
        avg_time_ms = elapsed_ms / 1000
        assert avg_time_ms < 10, f"平均檢測時間 {avg_time_ms:.4f}ms 超過 10ms"

    def test_all_line_patterns_valid(self, service: LineDetectionService):
        """測試：驗證所有連線模式常數的正確性"""
        # 驗證橫向連線
        assert bin(service.ROW_0).count('1') == 5, "ROW_0 應有 5 個位元"
        assert bin(service.ROW_1).count('1') == 5, "ROW_1 應有 5 個位元"
        assert bin(service.ROW_2).count('1') == 5, "ROW_2 應有 5 個位元"
        assert bin(service.ROW_3).count('1') == 5, "ROW_3 應有 5 個位元"
        assert bin(service.ROW_4).count('1') == 5, "ROW_4 應有 5 個位元"

        # 驗證直向連線
        assert bin(service.COL_0).count('1') == 5, "COL_0 應有 5 個位元"
        assert bin(service.COL_1).count('1') == 5, "COL_1 應有 5 個位元"
        assert bin(service.COL_2).count('1') == 5, "COL_2 應有 5 個位元"
        assert bin(service.COL_3).count('1') == 5, "COL_3 應有 5 個位元"
        assert bin(service.COL_4).count('1') == 5, "COL_4 應有 5 個位元"

        # 驗證對角線連線
        assert bin(service.DIAG_MAIN).count('1') == 5, "DIAG_MAIN 應有 5 個位元"
        assert bin(service.DIAG_ANTI).count('1') == 5, "DIAG_ANTI 應有 5 個位元"

        # 驗證總共 12 條連線
        assert len(service.LINE_PATTERNS) == 12, "應有 12 條連線模式"
