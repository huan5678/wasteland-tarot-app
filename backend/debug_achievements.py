"""
成就系統診斷腳本
用於檢查使用者成就進度是否正確追蹤
"""

import asyncio
import sys
from pathlib import Path

# 添加 backend 到 Python path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.achievement import Achievement, UserAchievementProgress
from app.models.reading_enhanced import CompletedReading
from app.models.user import User
from app.config import settings


async def diagnose_achievements():
    """診斷成就系統狀態"""

    # 建立資料庫連線（修復 Supabase PgBouncer 問題）
    engine = create_async_engine(
        settings.database_url,
        echo=False,  # 關閉 SQL 查詢顯示以保持輸出清晰
        connect_args={"statement_cache_size": 0}  # 禁用 prepared statements for PgBouncer
    )

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("\n" + "="*80)
        print("成就系統診斷報告")
        print("="*80 + "\n")

        # 1. 檢查成就定義
        print("【1. 成就定義檢查】")
        print("-" * 80)
        achievement_query = select(Achievement).where(Achievement.is_active == True)
        result = await session.execute(achievement_query)
        achievements = result.scalars().all()

        print(f"✅ 找到 {len(achievements)} 個活躍的成就定義\n")

        for ach in achievements[:5]:  # 只顯示前 5 個
            print(f"  - {ach.code}: {ach.name_zh_tw}")
            print(f"    類別: {ach.category}, 稀有度: {ach.rarity}")
            print(f"    條件: {ach.criteria}")
            print()

        # 2. 檢查使用者資料
        print("\n【2. 使用者資料檢查】")
        print("-" * 80)
        user_query = select(User).limit(1)
        result = await session.execute(user_query)
        user = result.scalar_one_or_none()

        if not user:
            print("❌ 找不到使用者！請先註冊一個帳號。")
            return

        print(f"✅ 測試使用者: {user.email} (ID: {user.id})\n")

        # 3. 檢查使用者的占卜記錄
        print("\n【3. 占卜記錄檢查】")
        print("-" * 80)
        reading_query = select(func.count(CompletedReading.id)).where(
            CompletedReading.user_id == user.id
        )
        result = await session.execute(reading_query)
        reading_count = result.scalar_one()

        print(f"✅ 使用者已完成 {reading_count} 次占卜\n")

        if reading_count > 0:
            # 顯示最近的占卜記錄
            recent_readings_query = (
                select(CompletedReading)
                .where(CompletedReading.user_id == user.id)
                .order_by(CompletedReading.created_at.desc())
                .limit(3)
            )
            result = await session.execute(recent_readings_query)
            recent_readings = result.scalars().all()

            print("  最近的占卜記錄:")
            for reading in recent_readings:
                print(f"  - ID: {reading.id}")
                print(f"    問題: {reading.question}")
                print(f"    建立時間: {reading.created_at}")
                print()

        # 4. 檢查使用者成就進度
        print("\n【4. 使用者成就進度檢查】")
        print("-" * 80)
        progress_query = select(UserAchievementProgress).where(
            UserAchievementProgress.user_id == user.id
        )
        result = await session.execute(progress_query)
        progress_records = result.scalars().all()

        print(f"✅ 找到 {len(progress_records)} 筆成就進度記錄\n")

        if progress_records:
            for prog in progress_records[:10]:  # 只顯示前 10 筆
                # 獲取成就名稱
                ach_query = select(Achievement).where(Achievement.id == prog.achievement_id)
                ach_result = await session.execute(ach_query)
                ach = ach_result.scalar_one_or_none()

                if ach:
                    print(f"  - {ach.code}: {ach.name_zh_tw}")
                    print(f"    狀態: {prog.status}")
                    print(f"    進度: {prog.current_progress}/{prog.target_progress} ({prog.progress_percentage:.1f}%)")
                    if prog.unlocked_at:
                        print(f"    解鎖時間: {prog.unlocked_at}")
                    if prog.claimed_at:
                        print(f"    領取時間: {prog.claimed_at}")
                    print()
        else:
            print("  ⚠️ 沒有任何成就進度記錄！")
            print("  這可能表示:")
            print("  1. 成就檢查的背景任務沒有被觸發")
            print("  2. 背景任務執行失敗")
            print("  3. AchievementChecker 邏輯有問題")
            print()

        # 5. 診斷建議
        print("\n【5. 診斷建議】")
        print("-" * 80)

        if reading_count > 0 and len(progress_records) == 0:
            print("❌ 問題發現：使用者已完成占卜但沒有任何成就進度記錄")
            print("\n可能的原因:")
            print("  1. schedule_achievement_check 背景任務沒有正確執行")
            print("  2. AchievementChecker.check_and_unlock_achievements 執行失敗")
            print("  3. 資料庫寫入失敗（沒有 commit）")
            print("\n建議檢查:")
            print("  - 後端日誌中是否有 achievement check 相關的錯誤")
            print("  - 確認 schedule_achievement_check 是否被正確呼叫")
            print("  - 檢查資料庫權限是否允許寫入 user_achievement_progress 表")
            print()
        elif reading_count > 0 and len(progress_records) > 0:
            # 檢查「廢土新手」成就 (FIRST_READING)
            first_reading_progress = next(
                (p for p in progress_records if any(
                    ach.code == 'FIRST_READING' and ach.id == p.achievement_id
                    for ach in achievements
                )),
                None
            )

            if first_reading_progress:
                if first_reading_progress.status == 'IN_PROGRESS':
                    print("❌ 問題發現：使用者已完成占卜但「廢土新手」成就仍為進行中")
                    print(f"\n當前進度: {first_reading_progress.current_progress}/{first_reading_progress.target_progress}")
                    print("\n可能的原因:")
                    print("  1. check_achievement_progress 邏輯錯誤，current_progress 沒有正確更新")
                    print("  2. 成就條件 criteria 設定錯誤")
                    print("  3. _check_reading_count 查詢邏輯有問題")
                    print()
                elif first_reading_progress.status == 'UNLOCKED':
                    print("✅「廢土新手」成就已解鎖但未領取")
                    print("  這是正常狀態，使用者需要手動領取獎勵")
                    print()
                elif first_reading_progress.status == 'CLAIMED':
                    print("✅「廢土新手」成就已解鎖並領取")
                    print("  成就系統運作正常！")
                    print()
            else:
                print("⚠️ 沒有找到「廢土新手」(FIRST_READING) 成就的進度記錄")
                print("  請檢查成就定義是否存在")
                print()
        elif reading_count == 0:
            print("ℹ️  使用者尚未完成任何占卜")
            print("  請先建立至少一次占卜來測試成就系統")
            print()

        print("="*80)
        print("診斷完成")
        print("="*80 + "\n")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(diagnose_achievements())
