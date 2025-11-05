"""
Script to update all wasteland cards with their standard tarot names
Based on suit and number mapping
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()


# Suit mapping: Wasteland -> Standard Tarot
SUIT_MAPPING = {
    'major_arcana': 'Major Arcana',
    'nuka_cola_bottles': 'Cups',
    'combat_weapons': 'Swords',
    'bottle_caps': 'Pentacles',
    'radiation_rods': 'Wands'
}

# Major Arcana names (0-21)
MAJOR_ARCANA_NAMES = {
    0: ("The Fool", "愚者"),
    1: ("The Magician", "魔術師"),
    2: ("The High Priestess", "女祭司"),
    3: ("The Empress", "皇后"),
    4: ("The Emperor", "皇帝"),
    5: ("The Hierophant", "教皇"),
    6: ("The Lovers", "戀人"),
    7: ("The Chariot", "戰車"),
    8: ("Strength", "力量"),
    9: ("The Hermit", "隱者"),
    10: ("Wheel of Fortune", "命運之輪"),
    11: ("Justice", "正義"),
    12: ("The Hanged Man", "倒吊人"),
    13: ("Death", "死神"),
    14: ("Temperance", "節制"),
    15: ("The Devil", "惡魔"),
    16: ("The Tower", "塔"),
    17: ("The Star", "星星"),
    18: ("The Moon", "月亮"),
    19: ("The Sun", "太陽"),
    20: ("Judgement", "審判"),
    21: ("The World", "世界")
}

# Number card names (1-10)
NUMBER_NAMES = {
    1: ("Ace", "王牌"),
    2: ("Two", "二"),
    3: ("Three", "三"),
    4: ("Four", "四"),
    5: ("Five", "五"),
    6: ("Six", "六"),
    7: ("Seven", "七"),
    8: ("Eight", "八"),
    9: ("Nine", "九"),
    10: ("Ten", "十")
}

# Court card names (11-14)
COURT_NAMES = {
    11: ("Page", "侍者"),
    12: ("Knight", "騎士"),
    13: ("Queen", "王后"),
    14: ("King", "國王")
}

# Suit names in Chinese
SUIT_NAMES_ZH = {
    'Cups': '聖杯',
    'Swords': '寶劍',
    'Pentacles': '錢幣',
    'Wands': '權杖'
}


def get_standard_tarot_name(suit: str, number: int) -> tuple[str, str, str]:
    """
    Get standard tarot name based on suit and number
    
    Returns:
        tuple: (english_name, chinese_name, standard_suit)
    """
    standard_suit = SUIT_MAPPING.get(suit, suit)
    
    # Major Arcana
    if suit == 'major_arcana':
        if number in MAJOR_ARCANA_NAMES:
            en, zh = MAJOR_ARCANA_NAMES[number]
            return en, zh, standard_suit
        else:
            return f"Major Arcana {number}", f"大阿爾克那 {number}", standard_suit
    
    # Minor Arcana - Number cards (1-10)
    elif 1 <= number <= 10:
        num_en, num_zh = NUMBER_NAMES[number]
        suit_zh = SUIT_NAMES_ZH.get(standard_suit, standard_suit)
        
        en_name = f"{num_en} of {standard_suit}"
        zh_name = f"{suit_zh}{num_zh}"
        
        return en_name, zh_name, standard_suit
    
    # Minor Arcana - Court cards (11-14)
    elif 11 <= number <= 14:
        court_en, court_zh = COURT_NAMES[number]
        suit_zh = SUIT_NAMES_ZH.get(standard_suit, standard_suit)
        
        en_name = f"{court_en} of {standard_suit}"
        zh_name = f"{suit_zh}{court_zh}"
        
        return en_name, zh_name, standard_suit
    
    else:
        return f"Unknown {standard_suit}", f"未知{standard_suit}", standard_suit


async def update_card_names():
    """Update all cards with standard tarot names"""
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        return
    
    # Disable statement caching for pgbouncer compatibility
    engine = create_async_engine(
        database_url, 
        echo=False,
        connect_args={"statement_cache_size": 0}
    )
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get all cards
        result = await session.execute(
            text("""
                SELECT id, name, suit, number 
                FROM wasteland_cards 
                ORDER BY 
                    CASE suit 
                        WHEN 'major_arcana' THEN 0
                        WHEN 'nuka_cola_bottles' THEN 1
                        WHEN 'combat_weapons' THEN 2
                        WHEN 'bottle_caps' THEN 3
                        WHEN 'radiation_rods' THEN 4
                    END,
                    number NULLS FIRST
            """)
        )
        
        cards = result.fetchall()
        print(f"📊 Found {len(cards)} cards to update\n")
        
        updated_count = 0
        skipped_count = 0
        
        for card in cards:
            card_id, wasteland_name, suit, number = card
            
            # Skip if number is None (shouldn't happen, but safety check)
            if number is None:
                print(f"⚠️  Skipping {wasteland_name}: No number")
                skipped_count += 1
                continue
            
            # Get standard names
            en_name, zh_name, standard_suit = get_standard_tarot_name(suit, number)
            
            # Update card
            await session.execute(
                text("""
                    UPDATE wasteland_cards 
                    SET 
                        standard_tarot_name = :en_name,
                        standard_tarot_name_zh = :zh_name,
                        standard_suit = :standard_suit
                    WHERE id = :card_id
                """),
                {
                    'en_name': en_name,
                    'zh_name': zh_name,
                    'standard_suit': standard_suit,
                    'card_id': card_id
                }
            )
            
            print(f"✅ {wasteland_name:<35} -> {zh_name:<15} ({en_name})")
            updated_count += 1
        
        # Commit all changes
        await session.commit()
        
        print(f"\n🎉 Update complete!")
        print(f"   ✅ Updated: {updated_count} cards")
        print(f"   ⚠️  Skipped: {skipped_count} cards")
    
    await engine.dispose()


if __name__ == "__main__":
    print("🃏 Starting Standard Tarot Name Update...\n")
    asyncio.run(update_card_names())
