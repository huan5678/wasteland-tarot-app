"""
測試卡牌角色解讀載入
Test card character voice loading
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSessionLocal
from app.models.wasteland_card import WastelandCard
from app.models.character_voice import CardInterpretation, Character


async def test_card_voices():
    """測試卡牌角色解讀載入"""
    async with AsyncSessionLocal() as db:
        # Load a single card with interpretations
        query = (
            select(WastelandCard)
            .options(
                selectinload(WastelandCard.interpretations)
                .selectinload(CardInterpretation.character)
            )
            .limit(1)
        )
        
        result = await db.execute(query)
        card = result.scalar_one_or_none()
        
        if not card:
            print("❌ No cards found in database")
            return
        
        print("=" * 80)
        print(f"🎴 測試卡牌: {card.name}")
        print("=" * 80)
        
        # Test to_dict() method
        card_dict = card.to_dict()
        
        print(f"\n✅ character_voices 欄位:")
        voices = card_dict.get('character_voices', {})
        print(f"   總數: {len(voices)}")
        
        for char_key, interp_text in sorted(voices.items()):
            status = "✅" if interp_text else "❌"
            preview = (interp_text[:50] + "...") if interp_text and len(interp_text) > 50 else (interp_text or "NULL")
            print(f"   {status} {char_key:30s} | {preview}")
        
        # Check if interpretations were loaded
        print(f"\n✅ interpretations 關聯:")
        if hasattr(card, 'interpretations'):
            print(f"   載入數量: {len(card.interpretations)}")
            for interp in card.interpretations[:5]:  # Show first 5
                char_name = interp.character.name if interp.character else "Unknown"
                preview = (interp.interpretation_text[:50] + "...") if len(interp.interpretation_text) > 50 else interp.interpretation_text
                print(f"   - {char_name:20s} | {preview}")
            if len(card.interpretations) > 5:
                print(f"   ... 還有 {len(card.interpretations) - 5} 個角色")
        else:
            print("   ❌ 沒有載入 interpretations 關聯")
        
        print("\n" + "=" * 80)


if __name__ == "__main__":
    asyncio.run(test_card_voices())
