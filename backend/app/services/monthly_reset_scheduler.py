"""
每月重置排程器服務

需求對應: 需求 5.1, 5.2, 5.3, 5.4, 5.5, 6.5, 8.2
Task: Task 11 - 實作每月重置排程器
"""
import logging
from datetime import date, datetime
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, func, text

from app.models.bingo import (
    UserBingoCard,
    DailyBingoNumber,
    UserNumberClaim,
    BingoReward,
    MonthlyResetLog
)

logger = logging.getLogger(__name__)


class MonthlyResetScheduler:
    """
    每月重置排程器

    職責:
    - 執行每月重置
    - 歸檔上月資料至歷史表
    - 清空當月遊戲資料
    - 記錄重置執行日誌
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_monthly_reset(self, reset_date: Optional[date] = None) -> Dict:
        """
        執行每月重置

        需求 5.1: 每月1日 00:00 UTC+8 執行
        需求 5.2: 清空號碼池、重置賓果卡、清除領取記錄
        需求 5.3: 保留歷史記錄至歷史表
        需求 5.4: 記錄錯誤日誌
        需求 5.5: 記錄重置執行狀態

        Args:
            reset_date: 重置日期（預設為今天）

        Returns:
            Dict: 重置結果統計
        """
        if reset_date is None:
            reset_date = date.today()

        logger.info(f"Starting monthly reset for {reset_date}")

        metadata = {
            'reset_date': reset_date.isoformat(),
            'cards_archived': 0,
            'claims_archived': 0,
            'rewards_archived': 0,
            'numbers_archived': 0,
            'errors': []
        }

        try:
            # 1. 計算上月日期範圍
            year = reset_date.year
            month = reset_date.month - 1 if reset_date.month > 1 else 12
            prev_year = year if reset_date.month > 1 else year - 1

            prev_month_start = date(prev_year, month, 1)

            # 2. 歸檔上月資料
            logger.info(f"Archiving data for {prev_year}-{month:02d}")

            # 歸檔賓果卡
            cards_count = await self._archive_bingo_cards(prev_month_start)
            metadata['cards_archived'] = cards_count

            # 歸檔號碼領取記錄
            claims_count = await self._archive_number_claims(prev_month_start)
            metadata['claims_archived'] = claims_count

            # 歸檔獎勵記錄
            rewards_count = await self._archive_rewards(prev_month_start)
            metadata['rewards_archived'] = rewards_count

            # 歸檔每日號碼
            numbers_count = await self._archive_daily_numbers(prev_month_start)
            metadata['numbers_archived'] = numbers_count

            # 3. 清空當月資料（重置狀態）
            await self._clear_current_month_data()

            # 4. 記錄重置成功日誌
            await self._log_reset(reset_date, 'SUCCESS', metadata)

            logger.info(
                f"Monthly reset completed successfully: "
                f"{cards_count} cards, {claims_count} claims, "
                f"{rewards_count} rewards archived"
            )

            return metadata

        except Exception as e:
            logger.error(f"Monthly reset failed: {str(e)}", exc_info=True)

            # 記錄錯誤
            metadata['errors'].append(str(e))
            await self._log_reset(reset_date, 'FAILED', metadata)

            raise

    async def _archive_bingo_cards(self, month_start: date) -> int:
        """
        歸檔賓果卡至歷史表

        Args:
            month_start: 月份開始日期

        Returns:
            int: 歸檔數量
        """
        # 查詢需要歸檔的賓果卡
        result = await self.db.execute(
            select(UserBingoCard).where(
                func.date_trunc('month', UserBingoCard.month_year) == month_start
            )
        )
        cards = result.scalars().all()

        if not cards:
            return 0

        # 插入至歷史表
        for card in cards:
            await self.db.execute(
                text("""
                    INSERT INTO user_bingo_cards_history
                    (id, user_id, month_year, card_data, created_at, archived_at)
                    VALUES (:id, :user_id, :month_year, :card_data, :created_at, NOW())
                """),
                {
                    'id': str(card.id),
                    'user_id': str(card.user_id),
                    'month_year': card.month_year,
                    'card_data': card.card_data,
                    'created_at': card.created_at
                }
            )

        # 刪除主表資料
        await self.db.execute(
            delete(UserBingoCard).where(
                func.date_trunc('month', UserBingoCard.month_year) == month_start
            )
        )

        await self.db.commit()

        logger.info(f"Archived {len(cards)} bingo cards")
        return len(cards)

    async def _archive_number_claims(self, month_start: date) -> int:
        """
        歸檔號碼領取記錄至歷史表

        Args:
            month_start: 月份開始日期

        Returns:
            int: 歸檔數量
        """
        # 查詢需要歸檔的領取記錄
        result = await self.db.execute(
            select(UserNumberClaim).where(
                func.date_trunc('month', UserNumberClaim.claim_date) == month_start
            )
        )
        claims = result.scalars().all()

        if not claims:
            return 0

        # 插入至歷史表
        for claim in claims:
            await self.db.execute(
                text("""
                    INSERT INTO user_number_claims_history
                    (id, user_id, card_id, claim_date, number, claimed_at, archived_at)
                    VALUES (:id, :user_id, :card_id, :claim_date, :number, :claimed_at, NOW())
                """),
                {
                    'id': str(claim.id),
                    'user_id': str(claim.user_id),
                    'card_id': str(claim.card_id),
                    'claim_date': claim.claim_date,
                    'number': claim.number,
                    'claimed_at': claim.claimed_at
                }
            )

        # 刪除主表資料
        await self.db.execute(
            delete(UserNumberClaim).where(
                func.date_trunc('month', UserNumberClaim.claim_date) == month_start
            )
        )

        await self.db.commit()

        logger.info(f"Archived {len(claims)} number claims")
        return len(claims)

    async def _archive_rewards(self, month_start: date) -> int:
        """
        歸檔獎勵記錄至歷史表

        Args:
            month_start: 月份開始日期

        Returns:
            int: 歸檔數量
        """
        # 查詢需要歸檔的獎勵記錄
        result = await self.db.execute(
            select(BingoReward).where(
                func.date_trunc('month', BingoReward.month_year) == month_start
            )
        )
        rewards = result.scalars().all()

        if not rewards:
            return 0

        # 插入至歷史表
        for reward in rewards:
            await self.db.execute(
                text("""
                    INSERT INTO bingo_rewards_history
                    (id, user_id, month_year, line_types, issued_at, archived_at)
                    VALUES (:id, :user_id, :month_year, :line_types, :issued_at, NOW())
                """),
                {
                    'id': str(reward.id),
                    'user_id': str(reward.user_id),
                    'month_year': reward.month_year,
                    'line_types': reward.line_types,
                    'issued_at': reward.issued_at
                }
            )

        # 刪除主表資料
        await self.db.execute(
            delete(BingoReward).where(
                func.date_trunc('month', BingoReward.month_year) == month_start
            )
        )

        await self.db.commit()

        logger.info(f"Archived {len(rewards)} rewards")
        return len(rewards)

    async def _archive_daily_numbers(self, month_start: date) -> int:
        """
        歸檔每日號碼（可選，視需求決定是否保留）

        Args:
            month_start: 月份開始日期

        Returns:
            int: 歸檔數量
        """
        # 每日號碼通常保留，不刪除
        # 此處僅作為範例，可依需求決定是否歸檔
        return 0

    async def _clear_current_month_data(self) -> None:
        """
        清空當月遊戲資料（重置狀態）

        需求 5.2: 重置所有使用者賓果卡狀態
        """
        # 將所有活躍賓果卡標記為非活躍
        await self.db.execute(
            text("UPDATE user_bingo_cards SET is_active = FALSE WHERE is_active = TRUE")
        )

        await self.db.commit()

        logger.info("Cleared current month data")

    async def _log_reset(
        self,
        reset_date: date,
        status: str,
        metadata: Dict
    ) -> None:
        """
        記錄重置執行日誌

        需求 5.5: 記錄重置執行狀態

        Args:
            reset_date: 重置日期
            status: 執行狀態 (SUCCESS/FAILED/PARTIAL)
            metadata: 執行元資料
        """
        log_entry = MonthlyResetLog(
            reset_date=reset_date,
            status=status,
            metadata=metadata,
            executed_at=datetime.now()
        )

        self.db.add(log_entry)
        await self.db.commit()

        logger.info(f"Logged reset execution: {status}")

    async def create_next_month_partition(self, reference_date: date) -> bool:
        """
        建立下月分區

        需求 6.5: 自動建立分區
        Task 12: 實作自動分區建立任務

        Args:
            reference_date: 參考日期

        Returns:
            bool: 是否成功建立分區
        """
        from dateutil.relativedelta import relativedelta

        # 計算下月日期
        next_month = reference_date + relativedelta(months=1)
        month_after = next_month + relativedelta(months=1)

        partition_name = f"user_bingo_cards_{next_month.strftime('%Y_%m')}"

        try:
            # 建立分區
            await self.db.execute(
                text(f"""
                    CREATE TABLE IF NOT EXISTS {partition_name}
                    PARTITION OF user_bingo_cards
                    FOR VALUES FROM ('{next_month.strftime('%Y-%m-01')}')
                    TO ('{month_after.strftime('%Y-%m-01')}')
                """)
            )

            await self.db.commit()

            logger.info(f"Created partition: {partition_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to create partition {partition_name}: {str(e)}")
            await self.db.rollback()
            return False
