"""
Delete deprecated spread types from database
- custom_spread
- horseshoe
"""
import asyncio
from sqlalchemy import select, delete
from app.db.session import AsyncSessionLocal
from app.models.reading_enhanced import CompletedReading


async def delete_deprecated_spreads():
    """Delete readings with deprecated spread types"""
    async with AsyncSessionLocal() as session:
        try:
            # Query for deprecated spreads
            custom_query = select(CompletedReading).where(CompletedReading.spread_type == 'custom_spread')
            custom_results = await session.execute(custom_query)
            custom_readings = custom_results.scalars().all()

            horseshoe_query = select(CompletedReading).where(CompletedReading.spread_type == 'horseshoe')
            horseshoe_results = await session.execute(horseshoe_query)
            horseshoe_readings = horseshoe_results.scalars().all()

            print(f"\n找到 custom_spread 記錄: {len(custom_readings)}")
            print(f"找到 horseshoe 記錄: {len(horseshoe_readings)}")

            if custom_readings:
                print("\ncustom_spread IDs:")
                for r in custom_readings[:10]:
                    print(f"  - {str(r.id)[:8]}... ({r.created_at})")

            if horseshoe_readings:
                print("\nhorseshoe IDs:")
                for r in horseshoe_readings[:10]:
                    print(f"  - {str(r.id)[:8]}... ({r.created_at})")

            total = len(custom_readings) + len(horseshoe_readings)

            if total > 0:
                print(f"\n準備刪除 {total} 筆記錄...")

                # Delete custom_spread
                if custom_readings:
                    delete_custom = delete(CompletedReading).where(CompletedReading.spread_type == 'custom_spread')
                    result = await session.execute(delete_custom)
                    print(f"✅ 已刪除 {result.rowcount} 筆 custom_spread 記錄")

                # Delete horseshoe
                if horseshoe_readings:
                    delete_horseshoe = delete(CompletedReading).where(CompletedReading.spread_type == 'horseshoe')
                    result = await session.execute(delete_horseshoe)
                    print(f"✅ 已刪除 {result.rowcount} 筆 horseshoe 記錄")

                await session.commit()
                print("\n🎉 所有過時的牌陣記錄已刪除")
            else:
                print("\n✅ 沒有找到需要刪除的記錄")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ 錯誤: {str(e)}")
            raise


if __name__ == "__main__":
    asyncio.run(delete_deprecated_spreads())
