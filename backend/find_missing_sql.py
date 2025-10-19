"""使用 SQL JOIN 直接找出缺失的音檔"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as session:
        # 使用 LEFT JOIN 找出沒有對應 audio_file 的 card_interpretation
        query = text("""
            SELECT
                ci.id as interpretation_id,
                ci.card_id,
                ci.character_id,
                c.key as character_key,
                c.name as character_name,
                wc.number as card_number,
                wc.name as card_name
            FROM card_interpretations ci
            INNER JOIN characters c ON ci.character_id = c.id
            INNER JOIN wasteland_cards wc ON ci.card_id = wc.id
            LEFT JOIN audio_files af ON (
                af.card_id = ci.card_id
                AND af.character_id = ci.character_id
                AND af.audio_type = 'STATIC_CARD'
            )
            WHERE ci.is_active = true
                AND c.is_active = true
                AND af.id IS NULL
            ORDER BY wc.number, c.sort_order
        """)

        result = await session.execute(query)
        missing = result.all()

        if not missing:
            print("✅ 沒有缺少的音檔！")
        else:
            print(f"找到 {len(missing)} 個缺失的音檔：\n")
            for i, row in enumerate(missing, 1):
                print(f"❌ 缺少音檔 #{i}")
                print(f"   序號: {i}")
                print(f"   卡牌: Card {row.card_number:02d} - {row.card_name}")
                print(f"   角色: {row.character_name} ({row.character_key})")
                print(f"   card_id: {row.card_id}")
                print(f"   character_id: {row.character_id}")
                print(f"   interpretation_id: {row.interpretation_id}")
                print()


if __name__ == "__main__":
    asyncio.run(main())
