#!/usr/bin/env python3
"""
Minimal Supabase Seeding Script for Wasteland Tarot
Match existing Supabase table structure
"""

import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase connection
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def get_simple_card_data():
    """Get card data matching existing Supabase structure"""
    cards = [
        {
            "id": "radiation_ace",
            "name": "輻射王牌 (Ace of Radiation Rods)",
            "suit": "RADIATION_RODS",
            "number": 1
        },
        {
            "id": "vault_newbie",
            "name": "新手避難所居民 (The Vault Newbie)",
            "suit": "MAJOR_ARCANA",
            "number": 0
        },
        {
            "id": "tech_specialist",
            "name": "科技專家 (The Tech Specialist)",
            "suit": "MAJOR_ARCANA",
            "number": 1
        },
        {
            "id": "wasteland_oracle",
            "name": "神秘預言家 (The Wasteland Oracle)",
            "suit": "MAJOR_ARCANA",
            "number": 2
        },
        {
            "id": "farm_matriarch",
            "name": "農場主母 (The Farm Matriarch)",
            "suit": "MAJOR_ARCANA",
            "number": 3
        },
        {
            "id": "overseer",
            "name": "避難所監督 (The Overseer)",
            "suit": "MAJOR_ARCANA",
            "number": 4
        },
        {
            "id": "brotherhood_elder",
            "name": "兄弟會長老 (The Brotherhood Elder)",
            "suit": "MAJOR_ARCANA",
            "number": 5
        },
        {
            "id": "wasteland_lovers",
            "name": "廢土戀人 (The Wasteland Lovers)",
            "suit": "MAJOR_ARCANA",
            "number": 6
        },
        {
            "id": "armored_chariot",
            "name": "裝甲戰車 (The Armored Chariot)",
            "suit": "MAJOR_ARCANA",
            "number": 7
        },
        {
            "id": "inner_strength",
            "name": "內在力量 (Inner Strength)",
            "suit": "MAJOR_ARCANA",
            "number": 8
        },
        {
            "id": "wasteland_hermit",
            "name": "廢土隱者 (The Wasteland Hermit)",
            "suit": "MAJOR_ARCANA",
            "number": 9
        },
        # Nuka-Cola Bottles (Cups equivalent)
        {
            "id": "nuka_ace",
            "name": "可樂王牌 (Ace of Nuka-Cola)",
            "suit": "NUKA_COLA_BOTTLES",
            "number": 1
        },
        {
            "id": "nuka_two",
            "name": "雙可樂 (Two of Nuka-Cola)",
            "suit": "NUKA_COLA_BOTTLES",
            "number": 2
        },
        {
            "id": "nuka_three",
            "name": "三可樂 (Three of Nuka-Cola)",
            "suit": "NUKA_COLA_BOTTLES",
            "number": 3
        },
        {
            "id": "nuka_four",
            "name": "四可樂 (Four of Nuka-Cola)",
            "suit": "NUKA_COLA_BOTTLES",
            "number": 4
        },
        {
            "id": "nuka_five",
            "name": "五可樂 (Five of Nuka-Cola)",
            "suit": "NUKA_COLA_BOTTLES",
            "number": 5
        },
        # Combat Weapons (Swords equivalent)
        {
            "id": "weapon_ace",
            "name": "武器王牌 (Ace of Combat Weapons)",
            "suit": "COMBAT_WEAPONS",
            "number": 1
        },
        {
            "id": "weapon_two",
            "name": "雙武器 (Two of Combat Weapons)",
            "suit": "COMBAT_WEAPONS",
            "number": 2
        },
        {
            "id": "weapon_three",
            "name": "三武器 (Three of Combat Weapons)",
            "suit": "COMBAT_WEAPONS",
            "number": 3
        },
        {
            "id": "weapon_four",
            "name": "四武器 (Four of Combat Weapons)",
            "suit": "COMBAT_WEAPONS",
            "number": 4
        },
        {
            "id": "weapon_five",
            "name": "五武器 (Five of Combat Weapons)",
            "suit": "COMBAT_WEAPONS",
            "number": 5
        },
        # Bottle Caps (Pentacles equivalent)
        {
            "id": "caps_two",
            "name": "雙瓶蓋 (Two of Bottle Caps)",
            "suit": "BOTTLE_CAPS",
            "number": 2
        },
        {
            "id": "caps_three",
            "name": "三瓶蓋 (Three of Bottle Caps)",
            "suit": "BOTTLE_CAPS",
            "number": 3
        },
        {
            "id": "caps_four",
            "name": "四瓶蓋 (Four of Bottle Caps)",
            "suit": "BOTTLE_CAPS",
            "number": 4
        },
        {
            "id": "caps_five",
            "name": "五瓶蓋 (Five of Bottle Caps)",
            "suit": "BOTTLE_CAPS",
            "number": 5
        }
    ]
    return cards

async def seed_supabase_minimal():
    """Seed Supabase with minimal matching data"""
    print("🎲 Starting Minimal Supabase Seeding for Wasteland Tarot")
    print("=" * 60)

    try:
        # Check existing table structure first
        print("\n[1/3] Checking table structure...")
        existing_cards = supabase.table('wasteland_cards').select("*").limit(1).execute()
        print(f"  Found {len(existing_cards.data)} existing cards")
        if existing_cards.data:
            print(f"  Sample card columns: {list(existing_cards.data[0].keys())}")

        # 1. Seed Cards (minimal data)
        print("\n[2/3] Seeding Wasteland Cards...")
        cards_data = get_simple_card_data()

        # Insert cards one by one to handle any issues
        success_count = 0
        for card in cards_data:
            try:
                # Check if card already exists
                existing = supabase.table('wasteland_cards').select("id").eq('id', card['id']).execute()
                if existing.data:
                    # Update existing
                    result = supabase.table('wasteland_cards').update(card).eq('id', card['id']).execute()
                    print(f"  Updated: {card['name']}")
                else:
                    # Insert new
                    result = supabase.table('wasteland_cards').insert(card).execute()
                    print(f"  Inserted: {card['name']}")
                success_count += 1
            except Exception as e:
                print(f"  ❌ Failed to insert {card['name']}: {e}")

        print(f"✅ Successfully processed {success_count}/{len(cards_data)} cards!")

        # 2. Summary
        print("\n[3/3] Seeding Complete!")
        print("=" * 60)
        print("🎯 Minimal Supabase Seeding Summary:")
        print(f"   ✅ {success_count} Wasteland Cards processed")
        print("\n🎮 Your basic Wasteland Tarot database is ready!")
        print("   Note: This is a minimal seed. Full features require matching table schemas.")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed_supabase_minimal())