"""
執行成就系統種子資料腳本

重用 app.db.session 中已配置好的 engine 和 session factory
確保與主應用程式使用相同的資料庫配置（包括 PgBouncer 相容設定）
"""
import asyncio

# 直接使用已配置好的 session factory，避免重複配置
from app.db.session import AsyncSessionLocal
from app.db.seeds.achievement_seeds import seed_achievements


async def main():
    """執行成就種子資料"""
    async with AsyncSessionLocal() as session:
        print("\n🌱 開始執行成就種子資料...")
        try:
            result = await seed_achievements(session)
            await session.commit()  # 確保 commit
            print(f"\n✅ 成就種子資料執行成功！")
            print(f"  - 新增: {result['seeded']} 個成就")
            print(f"  - 更新: {result['updated']} 個成就")
            print(f"  - 總計: {result['total']} 個成就\n")
        except Exception as e:
            await session.rollback()
            print(f"\n❌ 執行失敗: {e}\n")
            raise


if __name__ == "__main__":
    asyncio.run(main())
