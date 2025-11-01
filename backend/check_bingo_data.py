#!/usr/bin/env python3
"""
檢查賓果資料的位置（當前表 vs 歷史表）
"""
import asyncio
from datetime import date
from sqlalchemy import select, func, and_
from app.db.session import AsyncSessionLocal
from app.models.bingo import (
    UserBingoCard,
    UserNumberClaim,
    UserBingoCardHistory,
    UserNumberClaimHistory,
    MonthlyResetLog
)


async def check_bingo_data():
    """檢查賓果資料位置"""
    async with AsyncSessionLocal() as db:
        print("\n" + "="*60)
        print("賓果資料檢查報告")
        print("="*60)

        # 檢查 10 月資料在當前表
        result = await db.execute(
            select(func.count(UserNumberClaim.id))
            .where(
                and_(
                    UserNumberClaim.claim_date >= date(2025, 10, 1),
                    UserNumberClaim.claim_date < date(2025, 11, 1)
                )
            )
        )
        current_claims_count = result.scalar()

        # 檢查 10 月資料在歷史表
        result = await db.execute(
            select(func.count(UserNumberClaimHistory.id))
            .where(
                and_(
                    UserNumberClaimHistory.claim_date >= date(2025, 10, 1),
                    UserNumberClaimHistory.claim_date < date(2025, 11, 1)
                )
            )
        )
        history_claims_count = result.scalar()

        print(f"\n📊 2025-10 領取記錄數量：")
        print(f"  ├─ 當前表 (user_number_claims): {current_claims_count}")
        print(f"  └─ 歷史表 (user_number_claims_history): {history_claims_count}")

        # 檢查 10 月賓果卡
        result = await db.execute(
            select(func.count(UserBingoCard.id))
            .where(UserBingoCard.month_year == date(2025, 10, 1))
        )
        current_cards_count = result.scalar()

        result = await db.execute(
            select(func.count(UserBingoCardHistory.id))
            .where(UserBingoCardHistory.month_year == date(2025, 10, 1))
        )
        history_cards_count = result.scalar()

        print(f"\n🎴 2025-10 賓果卡數量：")
        print(f"  ├─ 當前表 (user_bingo_cards): {current_cards_count}")
        print(f"  └─ 歷史表 (user_bingo_cards_history): {history_cards_count}")

        # 檢查最近的歸檔執行記錄
        result = await db.execute(
            select(MonthlyResetLog)
            .order_by(MonthlyResetLog.executed_at.desc())
            .limit(5)
        )
        reset_logs = result.scalars().all()

        print(f"\n📝 最近 5 次歸檔記錄：")
        if reset_logs:
            for log in reset_logs:
                print(f"  ├─ {log.reset_date} - {log.status} (執行時間: {log.executed_at})")
                if log.reset_metadata:
                    print(f"  │  └─ 歸檔數量: {log.reset_metadata}")
        else:
            print("  └─ 沒有歸檔記錄")

        # 結論
        print(f"\n🔍 診斷結果：")
        if current_claims_count > 0 and history_claims_count == 0:
            print("  ✅ 10 月資料還在當前表，尚未歸檔")
            print("  ℹ️  這是正常狀態，要等到 11/1 凌晨才會歸檔")
            print("  💡 API 應該查詢當前表，而非歷史表")
        elif history_claims_count > 0:
            print("  ✅ 10 月資料已歸檔到歷史表")
        else:
            print("  ⚠️  找不到 10 月的任何資料")

        print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(check_bingo_data())
