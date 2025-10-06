#!/usr/bin/env python3
"""
Simple Supabase card seeding script - matches actual schema
Uses the service role key and only includes fields that exist in the table
"""

import uuid
from supabase import create_client

# Supabase configuration
SUPABASE_URL = "https://aelwaolzpraxmzjqdiyw.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbHdhb2x6cHJheG16anFkaXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzNTIwNywiZXhwIjoyMDc0MjExMjA3fQ.RvRptRqlpJJjTVek5wT_uiVCTUatF9dtnBYvJ8Txra0"

def get_simple_cards_data():
    """Get simplified card data matching actual schema"""
    return [
        {
            "id": str(uuid.uuid4()),
            "name": "The Fool",
            "suit": "major_arcana",
            "number": 0,
            "upright_meaning": "New beginnings, innocence, spontaneity, a free spirit in the post-apocalyptic world. Represents taking the first step into the unknown Wasteland with optimism and faith.",
            "reversed_meaning": "Holding back, recklessness, risk-taking without proper preparation for the harsh Wasteland. Warns against foolish actions that could lead to radiation poisoning or death.",
            "radiation_level": 0.1,
            "threat_level": 1,
            "vault_number": 111
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The Magician",
            "suit": "major_arcana",
            "number": 1,
            "upright_meaning": "Willpower, desire, manifestation, resourcefulness in the harsh Wasteland. Represents the ability to harness one's skills and technology to survive and thrive.",
            "reversed_meaning": "Manipulation, poor planning, untapped talents going to waste. Warning against misusing advanced technology or lacking focus in survival situations.",
            "radiation_level": 0.3,
            "threat_level": 3,
            "vault_number": 111
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The High Priestess",
            "suit": "major_arcana",
            "number": 2,
            "upright_meaning": "Intuition, sacred knowledge, hidden wisdom, subconscious understanding of the Wasteland's mysteries. Represents trusting inner guidance for survival.",
            "reversed_meaning": "Secrets, disconnected from intuition, withdrawal from harsh realities. Suggests ignoring survival instincts or being overly secretive about vital information.",
            "radiation_level": 0.2,
            "threat_level": 2,
            "vault_number": 101
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The Emperor",
            "suit": "major_arcana",
            "number": 4,
            "upright_meaning": "Authority, structure, control, protective leadership in chaotic times. Represents the power to create order and civilization from the chaos of the post-nuclear world.",
            "reversed_meaning": "Tyranny, rigidity, oppressive control, abuse of power. Warning against becoming a ruthless dictator or being overly controlling of fellow survivors.",
            "radiation_level": 0.5,
            "threat_level": 5,
            "vault_number": 111
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Death",
            "suit": "major_arcana",
            "number": 13,
            "upright_meaning": "Endings, transformation, rebirth, the cycle of destruction and renewal. Represents the end of the old world and the beginning of something entirely new from the ashes.",
            "reversed_meaning": "Resistance to change, stagnation, fear of letting go of the past. Warning against clinging to pre-war ideals that no longer serve in the post-nuclear reality.",
            "radiation_level": 0.8,
            "threat_level": 8,
            "vault_number": 111
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ace of Nuka-Cola Bottles",
            "suit": "nuka_cola_bottles",
            "number": 1,
            "upright_meaning": "New emotional beginnings, pure refreshment, the spark of happiness and joy in the bleakest times. Represents hope and positive energy.",
            "reversed_meaning": "Emotional emptiness, dehydration of the soul, loss of hope. Warning against addiction to temporary pleasures that don't truly nourish.",
            "radiation_level": 0.1,
            "threat_level": 1,
            "vault_number": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Five of Combat Weapons",
            "suit": "combat_weapons",
            "number": 5,
            "upright_meaning": "Conflict, struggle, competition for scarce resources. Represents the need to fight for survival but warns against unnecessary violence.",
            "reversed_meaning": "Avoiding conflict, running from necessary battles, inability to defend oneself. Suggests weakness in the face of threats.",
            "radiation_level": 0.4,
            "threat_level": 6,
            "vault_number": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Ten of Bottle Caps",
            "suit": "bottle_caps",
            "number": 10,
            "upright_meaning": "Wealth, abundance, financial security in the post-apocalyptic economy. Represents successful trading and resource accumulation.",
            "reversed_meaning": "Financial loss, poverty, inability to afford necessities. Warning against hoarding or mismanaging valuable resources.",
            "radiation_level": 0.2,
            "threat_level": 2,
            "vault_number": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Three of Radiation Rods",
            "suit": "radiation_rods",
            "number": 3,
            "upright_meaning": "Creative energy, manifestation of ideas, building something new from the ruins. Represents innovation and adaptation.",
            "reversed_meaning": "Lack of focus, scattered energy, inability to follow through on plans. Warning against starting projects without finishing them.",
            "radiation_level": 0.6,
            "threat_level": 4,
            "vault_number": None
        }
    ]

def seed_simple_cards():
    """Seed simplified card data to Supabase"""
    print("🚀 Starting Simple Wasteland Tarot Card Seeding...")

    try:
        # Create Supabase client with service role
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        # Clear existing data
        print("🧹 Clearing existing cards...")
        delete_result = supabase.table('wasteland_cards').delete().neq('id', 'non-existent').execute()
        print(f"Cleared existing records")

        # Get simplified card data
        cards_data = get_simple_cards_data()

        # Insert cards
        successful_inserts = 0
        for card_data in cards_data:
            try:
                result = supabase.table('wasteland_cards').insert(card_data).execute()
                if result.data:
                    print(f"✅ Successfully inserted: {card_data['name']}")
                    successful_inserts += 1
                else:
                    print(f"⚠️ Warning: No data returned for {card_data['name']}")
            except Exception as e:
                print(f"❌ Failed to insert {card_data['name']}: {str(e)}")

        print(f"\n🎉 Seeding completed! Successfully inserted {successful_inserts}/{len(cards_data)} cards")

        # Verify the data
        print("\n🔍 Verifying inserted data...")
        verification_result = supabase.table('wasteland_cards').select('name', 'suit', 'upright_meaning').execute()
        if verification_result.data:
            print(f"✅ Verified {len(verification_result.data)} cards in database:")
            for card in verification_result.data:
                print(f"   - {card['name']} ({card['suit']})")
        else:
            print("❌ No cards found in verification")

        return True

    except Exception as e:
        print(f"💥 Seeding failed with error: {str(e)}")
        return False

def main():
    """Main function"""
    print("=" * 60)
    print("🎴 Simple Wasteland Tarot - Supabase Card Seeding")
    print("=" * 60)

    success = seed_simple_cards()

    if success:
        print("\n✅ Simple seeding completed successfully!")
        print("🎯 Basic Wasteland Tarot database is ready!")
    else:
        print("\n❌ Simple seeding encountered errors.")

if __name__ == "__main__":
    main()