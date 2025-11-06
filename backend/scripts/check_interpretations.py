"""
檢查卡牌角色解讀完整性
Check card character interpretations completeness
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.wasteland_card import WastelandCard
from app.models.character_voice import Character, Faction, FactionCharacter, CardInterpretation


async def check_interpretations():
    """檢查卡牌解讀完整性"""
    async with AsyncSessionLocal() as db:
        # Get all active characters
        characters_result = await db.execute(
            select(Character).where(Character.is_active == True)
        )
        characters = characters_result.scalars().all()
        
        # Get all active factions
        factions_result = await db.execute(
            select(Faction).where(Faction.is_active == True)
        )
        factions = factions_result.scalars().all()
        
        # Get faction-character associations
        assoc_result = await db.execute(select(FactionCharacter))
        associations = assoc_result.scalars().all()
        
        # Get all cards
        cards_result = await db.execute(select(WastelandCard))
        cards = cards_result.scalars().all()
        
        # Get all interpretations
        interp_result = await db.execute(select(CardInterpretation))
        interpretations = interp_result.scalars().all()
        
        print("=" * 80)
        print("📊 角色與陣營系統狀態檢查")
        print("=" * 80)
        
        print(f"\n✅ 角色數量: {len(characters)}")
        for char in sorted(characters, key=lambda x: x.sort_order):
            print(f"   - {char.key:30s} | {char.name}")
        
        print(f"\n✅ 陣營數量: {len(factions)}")
        for faction in sorted(factions, key=lambda x: x.sort_order):
            # Count associated characters
            faction_chars = [a for a in associations if a.faction_id == faction.id]
            print(f"   - {faction.key:30s} | {faction.name:20s} | {len(faction_chars)} 個角色")
        
        print(f"\n✅ 陣營-角色關聯: {len(associations)} 筆")
        
        # Build faction -> characters mapping
        faction_char_map = {}
        for assoc in associations:
            faction_key = next((f.key for f in factions if f.id == assoc.faction_id), None)
            char_key = next((c.key for c in characters if c.id == assoc.character_id), None)
            if faction_key and char_key:
                if faction_key not in faction_char_map:
                    faction_char_map[faction_key] = []
                faction_char_map[faction_key].append(char_key)
        
        print("\n📋 陣營角色分配:")
        for faction_key, char_keys in sorted(faction_char_map.items()):
            print(f"   {faction_key}:")
            for char_key in sorted(char_keys):
                print(f"      - {char_key}")
        
        print(f"\n✅ 卡牌總數: {len(cards)}")
        print(f"✅ 現有解讀: {len(interpretations)} 筆")
        
        # Calculate expected interpretations
        expected_total = len(cards) * len(characters)
        print(f"\n📈 預期解讀總數: {expected_total} ({len(cards)} 張卡 × {len(characters)} 個角色)")
        print(f"📉 缺少解讀: {expected_total - len(interpretations)} 筆")
        print(f"📊 完成率: {len(interpretations) / expected_total * 100:.1f}%")
        
        # Find cards without interpretations
        cards_with_interp = set(i.card_id for i in interpretations)
        cards_without_interp = [c for c in cards if c.id not in cards_with_interp]
        
        if cards_without_interp:
            print(f"\n⚠️  完全沒有解讀的卡牌: {len(cards_without_interp)} 張")
            for card in cards_without_interp[:10]:  # Show first 10
                print(f"   - {card.name}")
            if len(cards_without_interp) > 10:
                print(f"   ... 還有 {len(cards_without_interp) - 10} 張")
        
        # Find cards with partial interpretations
        from collections import Counter
        card_interp_counts = Counter(i.card_id for i in interpretations)
        partial_cards = [
            (card_id, count)
            for card_id, count in card_interp_counts.items()
            if count < len(characters)
        ]
        
        if partial_cards:
            print(f"\n⚠️  部分缺少解讀的卡牌: {len(partial_cards)} 張")
            for card_id, count in partial_cards[:10]:
                card = next((c for c in cards if c.id == card_id), None)
                if card:
                    print(f"   - {card.name:30s} | {count}/{len(characters)} 個角色")
            if len(partial_cards) > 10:
                print(f"   ... 還有 {len(partial_cards) - 10} 張")
        
        # Check for orphaned interpretations (interpretations for non-existent cards/characters)
        valid_card_ids = set(c.id for c in cards)
        valid_char_ids = set(c.id for c in characters)
        orphaned = [
            i for i in interpretations
            if i.card_id not in valid_card_ids or i.character_id not in valid_char_ids
        ]
        
        if orphaned:
            print(f"\n⚠️  孤立的解讀記錄 (需清理): {len(orphaned)} 筆")
        
        print("\n" + "=" * 80)


if __name__ == "__main__":
    asyncio.run(check_interpretations())
