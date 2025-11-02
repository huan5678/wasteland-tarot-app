"""
快速檢查使用者成就進度

用法: python check_user_progress.py [user_email]
"""
import asyncio
import sys
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.achievement import Achievement, UserAchievementProgress
from app.models.reading_enhanced import CompletedReading
from app.models.user import User


async def check_progress(user_email: str = None):
    """檢查使用者成就進度"""
    async with AsyncSessionLocal() as session:
        # 1. 檢查成就定義
        result = await session.execute(select(func.count()).select_from(Achievement))
        achievement_count = result.scalar()
        print(f"\n📊 【成就定義】")
        print(f"   總計: {achievement_count} 個成就")

        # 2. 如果提供 email，檢查該使用者
        if user_email:
            result = await session.execute(
                select(User).where(User.email == user_email)
            )
            user = result.scalar_one_or_none()

            if not user:
                print(f"\n❌ 找不到使用者: {user_email}")
                return

            print(f"\n👤 【使用者資訊】")
            print(f"   Email: {user.email}")
            print(f"   ID: {user.id}")

            # 3. 檢查占卜記錄
            result = await session.execute(
                select(func.count()).select_from(CompletedReading).where(
                    CompletedReading.user_id == user.id
                )
            )
            reading_count = result.scalar()
            print(f"\n📖 【占卜記錄】")
            print(f"   完成占卜數: {reading_count} 次")

            # 4. 檢查成就進度
            result = await session.execute(
                select(UserAchievementProgress).where(
                    UserAchievementProgress.user_id == user.id
                )
            )
            progresses = result.scalars().all()

            print(f"\n🏆 【成就進度】")
            print(f"   進度記錄數: {len(progresses)} 筆")

            if progresses:
                for progress in progresses[:5]:  # 只顯示前 5 筆
                    print(f"   - 成就 ID: {progress.achievement_id}")
                    print(f"     狀態: {progress.status}")
                    print(f"     進度: {progress.current_progress}/{progress.target_progress}")

            # 5. 診斷結論
            print(f"\n💡 【診斷結論】")
            if reading_count > 0 and len(progresses) == 0:
                print(f"   ⚠️ 問題發現：使用者已完成 {reading_count} 次占卜，但沒有任何成就進度記錄")
                print(f"   ❌ 成就背景任務可能沒有執行")
                print(f"\n   建議修復方案：")
                print(f"   1. 檢查 backend 日誌中是否有成就檢查的 log")
                print(f"   2. 手動觸發成就檢查（可以提供腳本）")
            elif len(progresses) > 0:
                unlocked = [p for p in progresses if p.status == 'UNLOCKED']
                claimed = [p for p in progresses if p.status == 'CLAIMED']
                in_progress = [p for p in progresses if p.status == 'IN_PROGRESS']

                print(f"   ✅ 成就系統正常運作")
                print(f"   - 已解鎖: {len(unlocked)} 個")
                print(f"   - 已領取: {len(claimed)} 個")
                print(f"   - 進行中: {len(in_progress)} 個")
            else:
                print(f"   ℹ️ 使用者尚未完成任何占卜，成就系統待觸發")
        else:
            # 不提供 email，顯示所有使用者的成就進度統計
            result = await session.execute(
                select(func.count(User.id.distinct())).select_from(UserAchievementProgress).join(User)
            )
            users_with_progress = result.scalar()

            result = await session.execute(select(func.count()).select_from(User))
            total_users = result.scalar()

            print(f"\n👥 【全體使用者統計】")
            print(f"   總使用者數: {total_users}")
            print(f"   有成就進度的使用者: {users_with_progress}")
            print(f"\n   💡 提示：使用 'python check_user_progress.py <email>' 檢查特定使用者")


if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(check_progress(email))
