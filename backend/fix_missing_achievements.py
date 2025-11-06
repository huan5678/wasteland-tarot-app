"""
補償腳本：手動觸發成就檢查

用於修復之前因背景任務 Bug 而遺漏的成就追蹤
為所有已完成占卜的使用者重新檢查成就
"""
import asyncio
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.reading_enhanced import CompletedReading
from app.services.achievement_service import AchievementService


async def fix_achievements_for_all_users():
    """為所有使用者補償成就檢查"""
    async with AsyncSessionLocal() as session:
        # 1. 獲取所有有占卜記錄的使用者
        result = await session.execute(
            select(User.id, User.email, func.count(CompletedReading.id).label('reading_count'))
            .join(CompletedReading, User.id == CompletedReading.user_id)
            .group_by(User.id, User.email)
            .having(func.count(CompletedReading.id) > 0)
        )
        users_with_readings = result.all()

        if not users_with_readings:
            print("\n❌ 沒有找到任何有占卜記錄的使用者")
            return

        print(f"\n🔍 找到 {len(users_with_readings)} 位有占卜記錄的使用者")
        print("=" * 60)

        # 2. 為每個使用者檢查成就
        total_unlocked = 0
        achievement_service = AchievementService(session)

        for user_id, email, reading_count in users_with_readings:
            print(f"\n👤 處理使用者: {email}")
            print(f"   占卜次數: {reading_count}")

            try:
                # ✅ 手動觸發成就檢查（會檢查所有成就類別）
                newly_unlocked = await achievement_service.checker.check_and_unlock_achievements(
                    user_id=user_id,
                    achievement_codes=None  # 檢查所有成就
                )

                if newly_unlocked:
                    print(f"   ✅ 解鎖 {len(newly_unlocked)} 個成就:")
                    for item in newly_unlocked:
                        achievement = item['achievement']
                        print(f"      - {achievement.code}: {achievement.name_zh_tw}")
                    total_unlocked += len(newly_unlocked)
                else:
                    print(f"   ℹ️ 沒有新成就解鎖")

                # Commit changes
                await session.commit()

            except Exception as e:
                print(f"   ❌ 處理失敗: {e}")
                import traceback
                traceback.print_exc()  # 顯示完整錯誤追踪
                await session.rollback()

        # 3. 總結
        print("\n" + "=" * 60)
        print(f"✅ 補償完成！")
        print(f"   處理使用者數: {len(users_with_readings)}")
        print(f"   總解鎖成就數: {total_unlocked}")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    print("\n🔧 成就系統補償腳本")
    print("=" * 60)
    print("此腳本會為所有已完成占卜的使用者重新檢查成就")
    print("用於修復之前因背景任務 Bug 而遺漏的成就追蹤")
    print("=" * 60)

    asyncio.run(fix_achievements_for_all_users())
