"""
查詢並顯示所有 Codsworth 的卡片解讀
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.session import AsyncSessionLocal
from app.models.wasteland_card import WastelandCard
from sqlalchemy import select


async def fetch_codsworth_interpretations():
    """查詢所有卡片的 Codsworth 解讀"""
    async with AsyncSessionLocal() as session:
        # 查詢所有卡片
        result = await session.execute(
            select(WastelandCard).order_by(WastelandCard.number)
        )
        cards = result.scalars().all()

        print(f"\n找到 {len(cards)} 張卡片")
        print("=" * 100)

        # 統計有 Codsworth 解讀的卡片
        cards_with_codsworth = []
        cards_without_codsworth = []

        for card in cards:
            if card.codsworth_analysis:
                cards_with_codsworth.append(card)
            else:
                cards_without_codsworth.append(card)

        print(f"\n✓ 有 Codsworth 解讀: {len(cards_with_codsworth)} 張")
        print(f"✗ 無 Codsworth 解讀: {len(cards_without_codsworth)} 張")

        # 顯示前 10 張卡片的完整 Codsworth 解讀
        print("\n" + "=" * 100)
        print("前 10 張卡片的完整 Codsworth 解讀：")
        print("=" * 100)

        for i, card in enumerate(cards_with_codsworth[:10], 1):
            print(f"\n{i}. {card.name} ({card.suit})")
            print(f"   Codsworth: {card.codsworth_analysis}")

        # 檢查是否有中英混合的問題
        print("\n" + "=" * 100)
        print("檢查中英混合問題：")
        print("=" * 100)

        mixed_lang_cards = []
        for card in cards_with_codsworth:
            text = card.codsworth_analysis or ""
            # 簡單檢查：如果包含英文字母（排除專有名詞）
            has_english = any(
                word in text.lower()
                for word in ['the', 'and', 'or', 'in', 'of', 'to', 'for', 'with', 'on', 'at', 'from', 'by']
            )
            if has_english:
                mixed_lang_cards.append(card)

        print(f"\n發現 {len(mixed_lang_cards)} 張卡片可能有中英混合問題")

        if mixed_lang_cards:
            print("\n示例（前 3 張）：")
            for i, card in enumerate(mixed_lang_cards[:3], 1):
                print(f"\n{i}. {card.name}")
                print(f"   {card.codsworth_analysis[:300]}...")


if __name__ == "__main__":
    asyncio.run(fetch_codsworth_interpretations())
