"""
Line Detection Service - 使用位元遮罩演算法檢測賓果連線
Detects bingo lines using bitmask algorithm with O(1) complexity
"""

from typing import List, Optional, Tuple, Dict, Any, Set
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import logging

from app.models.bingo import UserBingoCard, UserNumberClaim, BingoReward
from app.utils.date_helpers import get_month_start
from app.core.exceptions import NoCardFoundError

logger = logging.getLogger(__name__)


class LineDetectionService:
    """
    服務類別：使用位元遮罩演算法檢測賓果連線

    演算法說明：
    - 將 5x5 賓果卡轉換為 25-bit 整數，每個位元代表一個格子
    - 使用預定義的連線模式進行位元 AND 運算
    - 時間複雜度：O(1) - 固定 12 次位元運算
    """

    # 定義 12 種連線模式常數（5 橫、5 直、2 斜）
    # 位置映射：
    #   0  1  2  3  4
    #   5  6  7  8  9
    #  10 11 12 13 14
    #  15 16 17 18 19
    #  20 21 22 23 24

    # 橫向連線 (Horizontal lines)
    ROW_0 = 0b0000000000000000000011111  # 位置 0-4
    ROW_1 = 0b0000000000000000001111100000  # 位置 5-9
    ROW_2 = 0b0000000000000111110000000000  # 位置 10-14
    ROW_3 = 0b0000000011111000000000000000  # 位置 15-19
    ROW_4 = 0b0001111100000000000000000000  # 位置 20-24

    # 直向連線 (Vertical lines)
    COL_0 = 0b0000100001000010000100001  # 位置 0, 5, 10, 15, 20
    COL_1 = 0b0001000010000100001000010  # 位置 1, 6, 11, 16, 21
    COL_2 = 0b0010000100001000010000100  # 位置 2, 7, 12, 17, 22
    COL_3 = 0b0100001000010000100001000  # 位置 3, 8, 13, 18, 23
    COL_4 = 0b1000010000100001000010000  # 位置 4, 9, 14, 19, 24

    # 對角線連線 (Diagonal lines)
    DIAG_MAIN = 0b1000001000001000001000001  # 主對角線：0, 6, 12, 18, 24
    DIAG_ANTI = 0b100010001000100010000      # 反對角線：4, 8, 12, 16, 20 (= 1118480)

    # 所有連線模式字典（用於迭代檢測）
    LINE_PATTERNS: Dict[str, int] = {
        'row-0': ROW_0,
        'row-1': ROW_1,
        'row-2': ROW_2,
        'row-3': ROW_3,
        'row-4': ROW_4,
        'col-0': COL_0,
        'col-1': COL_1,
        'col-2': COL_2,
        'col-3': COL_3,
        'col-4': COL_4,
        'diagonal-main': DIAG_MAIN,
        'diagonal-anti': DIAG_ANTI,
    }

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    def create_bitmask(
        self,
        card_numbers: List[int],
        claimed_numbers: List[int]
    ) -> int:
        """
        將賓果卡與已領取號碼轉換為 25-bit 整數遮罩

        Args:
            card_numbers: 賓果卡上的所有號碼（扁平化的 25 個數字）
            claimed_numbers: 使用者已領取的號碼列表

        Returns:
            25-bit 整數，已領取且在卡片上的號碼對應位元為 1

        Example:
            card_numbers = [1,2,3,4,5, 6,7,8,9,10, ...]  # 25 個號碼
            claimed_numbers = [1, 5, 13]
            如果 1 在位置 0、5 在位置 4、13 在位置 12
            則 bitmask = 0b0001000000000010001
        """
        bitmask = 0
        claimed_set = set(claimed_numbers)

        for position, number in enumerate(card_numbers):
            if number in claimed_set:
                # 將對應位元設為 1
                bitmask |= (1 << position)

        return bitmask

    def count_lines(self, claimed_bitmask: int) -> Tuple[int, List[str]]:
        """
        使用位元 AND 運算檢測連線數量

        Args:
            claimed_bitmask: 已領取號碼的位元遮罩

        Returns:
            Tuple[連線數量, 連線類型列表]

        Algorithm:
            對每個連線模式執行：(claimed_bitmask & pattern) == pattern
            如果成立，表示該連線已完成

        Time Complexity: O(1) - 固定 12 次位元運算
        """
        line_count = 0
        line_types = []

        for line_name, pattern in self.LINE_PATTERNS.items():
            if (claimed_bitmask & pattern) == pattern:
                line_count += 1
                line_types.append(line_name)

        logger.debug(
            f"Line detection: {line_count} lines found - {line_types}"
        )

        return line_count, line_types

    async def check_lines(
        self,
        user_id: str,
        month_year: Optional[date] = None
    ) -> Tuple[int, List[str]]:
        """
        整合查詢賓果卡、計算遮罩、檢測連線的完整流程

        Args:
            user_id: 使用者 ID
            month_year: 月份（預設為當月）

        Returns:
            Tuple[連線數量, 連線類型列表]

        Raises:
            NoCardFoundError: 使用者無賓果卡
        """
        month_year = get_month_start(month_year)

        # 查詢使用者賓果卡
        card_result = await self.db.execute(
            select(UserBingoCard)
            .where(
                and_(
                    UserBingoCard.user_id == user_id,
                    UserBingoCard.month_year == month_year
                )
            )
        )
        card = card_result.scalar_one_or_none()

        if not card:
            raise NoCardFoundError(
                user_id=user_id,
                month=month_year.strftime('%Y-%m')
            )

        # 取得已領取的號碼
        claims_result = await self.db.execute(
            select(UserNumberClaim.number)
            .where(
                and_(
                    UserNumberClaim.user_id == user_id,
                    UserNumberClaim.card_id == card.id
                )
            )
        )
        claimed_numbers = list(claims_result.scalars().all())

        # 將 5x5 卡片扁平化
        card_numbers = card.get_card_numbers()

        # 建立位元遮罩
        bitmask = self.create_bitmask(card_numbers, claimed_numbers)

        # 檢測連線
        line_count, line_types = self.count_lines(bitmask)

        logger.info(
            f"Line check for user {user_id}: {line_count} lines - {line_types}"
        )

        return line_count, line_types

    async def issue_reward(
        self,
        user_id: str,
        card_id: str,
        month_year: date,
        line_types: List[str]
    ) -> Optional[BingoReward]:
        """
        發放三連線獎勵

        Args:
            user_id: 使用者 ID
            card_id: 賓果卡 ID
            month_year: 月份
            line_types: 連線類型列表

        Returns:
            BingoReward 實例（如果發放成功）或 None（已領取過）

        Business Rules:
            - 每位使用者每月僅能領取一次獎勵
            - 檢查 UNIQUE 約束（user_id, month_year）
            - 記錄獎勵發放時間與連線類型
        """
        # 確保 month_year 為月初
        month_year = get_month_start(month_year)

        # 檢查使用者本月是否已領取獎勵
        existing_reward_result = await self.db.execute(
            select(BingoReward)
            .where(
                and_(
                    BingoReward.user_id == user_id,
                    BingoReward.month_year == month_year
                )
            )
        )
        existing_reward = existing_reward_result.scalar_one_or_none()

        if existing_reward:
            logger.info(
                f"User {user_id} already received reward for {month_year.strftime('%Y-%m')}"
            )
            return None

        # 建立獎勵記錄
        reward = BingoReward(
            user_id=user_id,
            card_id=card_id,
            month_year=month_year,
            line_types=line_types,  # JSONB 陣列
            issued_at=datetime.now()
        )

        self.db.add(reward)
        await self.db.commit()
        await self.db.refresh(reward)

        logger.info(
            f"Issued reward to user {user_id} for {month_year.strftime('%Y-%m')} "
            f"with {len(line_types)} lines: {line_types}"
        )

        return reward

    async def get_user_reward(
        self,
        user_id: str,
        month_year: Optional[date] = None
    ) -> Optional[BingoReward]:
        """
        查詢使用者指定月份的獎勵記錄

        Args:
            user_id: 使用者 ID
            month_year: 月份（預設為當月）

        Returns:
            BingoReward 實例或 None
        """
        month_year = get_month_start(month_year)

        result = await self.db.execute(
            select(BingoReward)
            .where(
                and_(
                    BingoReward.user_id == user_id,
                    BingoReward.month_year == month_year
                )
            )
        )

        return result.scalar_one_or_none()

    async def has_received_reward(
        self,
        user_id: str,
        month_year: Optional[date] = None
    ) -> bool:
        """
        檢查使用者是否已領取指定月份的獎勵

        Args:
            user_id: 使用者 ID
            month_year: 月份（預設為當月）

        Returns:
            True 表示已領取，False 表示未領取
        """
        reward = await self.get_user_reward(user_id, month_year)
        return reward is not None

    def detect_lines_static(
        self,
        card_data: List[List[int]],
        claimed_numbers: List[int]
    ) -> int:
        """
        靜態方法：計算連線數（不查詢資料庫）
        用於歷史記錄查詢

        Args:
            card_data: 5x5 賓果卡資料
            claimed_numbers: 已領取號碼列表

        Returns:
            連線數量
        """
        # Flatten card data
        card_numbers = [num for row in card_data for num in row]

        # Create bitmask
        bitmask = self.create_bitmask(card_numbers, claimed_numbers)

        # Count lines
        line_count, _ = self.count_lines(bitmask)

        return line_count
