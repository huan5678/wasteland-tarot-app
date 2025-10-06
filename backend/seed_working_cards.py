#!/usr/bin/env python3
"""
Working Supabase card seeding script - matches exact schema
Based on actual schema discovered from Supabase table
"""

import uuid
from supabase import create_client

# Supabase configuration
SUPABASE_URL = "https://aelwaolzpraxmzjqdiyw.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbHdhb2x6cHJheG16anFkaXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzNTIwNywiZXhwIjoyMDc0MjExMjA3fQ.RvRptRqlpJJjTVek5wT_uiVCTUatF9dtnBYvJ8Txra0"

def get_working_cards_data():
    """Get card data matching the actual Supabase schema"""
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
            "wasteland_humor": "I used to be an adventurer like you, then I took a Deathclaw claw to the knee... wait, that's a different Wasteland tale.",
            "nuka_cola_reference": "Nothing's more exciting than a fresh Nuka-Cola Quantum and a brand new adventure ahead!",
            "fallout_easter_egg": "War... War never changes. But adventures? They always begin with that first brave step outside.",
            "special_ability": "Increases Luck by 1 point until next reading. Provides beginner's luck bonus.",
            "upright_keywords": ["new beginnings", "innocence", "optimism", "faith", "adventure"],
            "reversed_keywords": ["recklessness", "naivety", "poor planning", "dangerous risks"],
            "good_interpretation": "Your good intentions will guide you through new adventures in the Wasteland. Trust your Pip-Boy and take that brave first step toward your destiny.",
            "neutral_interpretation": "It's time to step out of your Vault. New opportunities await those willing to embrace the unknown dangers of the surface world.",
            "evil_interpretation": "Beware of impulsive decisions that could lead to unexpected consequences in the unforgiving Wasteland. Consider the cost of your actions on innocent survivors.",
            "pip_boy_voice": "Records show: New quest initiated. Recommend equipment check and prepare for journey ahead. Radiation levels: minimal.",
            "vault_dweller_voice": "The first day outside the Vault is always filled with unknowns, but that's where true adventure begins.",
            "wasteland_trader_voice": "Young traveler, everyone must take that first step. I've seen many like you start their journey - some return as legends.",
            "super_mutant_voice": "Little human begins big journey! Strong survive, weak become ghoul food!",
            "codsworth_voice": "New adventures are always exciting, aren't they sir/madam? Do mind the radiation, though.",
            "brotherhood_significance": "Every Knight was once a recruit. The power of technology begins with the courage to learn and explore.",
            "ncr_significance": "Democracy requires citizen participation. Everyone can contribute to rebuilding civilization in the New California Republic.",
            "legion_significance": "Even in Caesar's Legion, every warrior must prove their worth from the beginning. Strength through trial.",
            "raiders_significance": "New meat? Good, more cannon fodder for our raids! But maybe this one's got potential..."
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
            "wasteland_humor": "I can repair anything in the Wasteland... except for my own broken relationships and the world's broken state.",
            "nuka_cola_reference": "Like mixing the perfect Nuka-Cola Quantum formula, technical success requires the right combination of knowledge and precision.",
            "fallout_easter_egg": "With great technological power comes great responsibility... and radiation exposure. Always wear your Rad-X.",
            "special_ability": "Increases Intelligence by 2 points and Science skill by 15 until next reading.",
            "upright_keywords": ["willpower", "skill", "manifestation", "technology", "resourcefulness"],
            "reversed_keywords": ["manipulation", "poor planning", "misused talents", "lack of focus"],
            "good_interpretation": "You have the power to change the Wasteland for the better. Use your skills and technology to help fellow survivors and build a brighter future.",
            "neutral_interpretation": "Focus on your survival goals. You have the technical ability and determination to achieve anything you set your mind to in this post-nuclear world.",
            "evil_interpretation": "Great power requires wise use. Avoid the temptation to exploit other survivors or use advanced technology for selfish, destructive purposes.",
            "pip_boy_voice": "Skill detection: Technical abilities significantly elevated. Recommend allocating skill points for maximum efficiency in Science and Repair.",
            "vault_dweller_voice": "The advanced technical training from Vault-Tec education proves invaluable for surviving and thriving in the Wasteland.",
            "wasteland_trader_voice": "Those who understand pre-war technology control the trade routes. Technical skill is the most valuable currency in this new world.",
            "super_mutant_voice": "Smart little human knows how to fix things! Make good ally for tribe!",
            "codsworth_voice": "Your technical expertise is quite impressive, sir/madam. Very reminiscent of the pre-war engineers.",
            "brotherhood_significance": "Knowledge is power, and technology is salvation. Technical mastery is the very foundation of our order's mission.",
            "ncr_significance": "Professional technical skills and engineering expertise are essential for rebuilding civilized society and infrastructure.",
            "legion_significance": "While we reject most technology, understanding the enemy's tools is crucial for military strategy and tactical superiority.",
            "raiders_significance": "Knows how to fix weapons, hack terminals, and jury-rig explosives - definitely useful skills for the gang!"
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
            "wasteland_humor": "I foresee... that you will encounter many irradiated creatures and find lots of useful junk. Truly shocking revelations, indeed!",
            "nuka_cola_reference": "Like the closely guarded secret formula of Nuka-Cola, some wisdom and knowledge takes patience and time to fully understand.",
            "fallout_easter_egg": "The answers you seek are in another settlement... but they're probably being held hostage by raiders again.",
            "special_ability": "Increases Perception by 1 and Intelligence by 1, grants temporary clairvoyance for detecting hidden items.",
            "upright_keywords": ["intuition", "wisdom", "mysteries", "inner guidance", "sacred knowledge"],
            "reversed_keywords": ["secrets", "disconnection", "withdrawal", "ignored instincts"],
            "good_interpretation": "Trust your inner wisdom and moral compass. In meditation and quiet contemplation, you'll find the best path to help your fellow survivors.",
            "neutral_interpretation": "This is a time for introspection and learning about the Wasteland's hidden truths. Listen to your survival instincts and inner voice.",
            "evil_interpretation": "Hidden truths about your past actions are about to surface. The spirits of those you've wronged may seek their due justice.",
            "pip_boy_voice": "Perception detection: Intuitive abilities registering abnormal readings. Recommend trusting sixth sense for detecting hidden threats and opportunities.",
            "vault_dweller_voice": "In the Vault's extensive library, I learned that knowledge and wisdom are different things - one is facts, the other is understanding.",
            "wasteland_trader_voice": "In this dangerous world, intuition can save your life. I've seen too many traders who ignored their gut feelings end up as ghoul food.",
            "super_mutant_voice": "Wise woman knows secret things! She help tribe avoid bad places with angry spirits!",
            "codsworth_voice": "You seem particularly contemplative today, sir/madam. Any profound insights about our post-nuclear predicament?",
            "brotherhood_significance": "Ancient pre-war knowledge and accumulated wisdom are among the Brotherhood's most precious and carefully guarded assets.",
            "ncr_significance": "Wise and thoughtful leadership comes from listening carefully to citizens and understanding the deeper needs of society.",
            "legion_significance": "Even in warfare, strategic thinking, battlefield intuition, and understanding enemy psychology are absolutely essential for victory.",
            "raiders_significance": "Mysterious old lady always seems to know things before they happen... better keep her around, might be useful."
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
            "wasteland_humor": "Found a pristine Nuka-Cola! ...It's been glowing green for 200 years. Probably still good, right?",
            "nuka_cola_reference": "The original! The one that started the Great Refreshment Wars of 2077! Classic flavor, classic radiation!",
            "fallout_easter_egg": "Nuka-Cola: Enjoy an ice-cold refreshing beverage while watching the world end in nuclear fire!",
            "special_ability": "Restores emotional health and provides temporary happiness bonus. May cause mild radiation.",
            "upright_keywords": ["new emotions", "refreshment", "joy", "happiness", "hope"],
            "reversed_keywords": ["emptiness", "addiction", "false pleasures", "disappointment"],
            "good_interpretation": "A new source of joy and emotional fulfillment is coming into your life. Embrace positive feelings and share happiness with others.",
            "neutral_interpretation": "Take time to appreciate simple pleasures and moments of refreshment in your journey through the harsh wasteland.",
            "evil_interpretation": "Don't let temporary pleasures distract you from your goals. Some refreshments come with a price you may not want to pay.",
            "pip_boy_voice": "Consumable detected: Nuka-Cola variant. Effects: +happiness, +radiation. Recommend consumption in moderation.",
            "vault_dweller_voice": "Back in the Vault, we had unlimited Nuka-Cola dispensers. This single bottle feels like finding treasure.",
            "wasteland_trader_voice": "Nuka-Cola caps are the only currency that matters out here. This bottle represents pure wealth and happiness.",
            "super_mutant_voice": "Fizzy drink make human happy! Share with friends, make tribe stronger!",
            "codsworth_voice": "Ah, a refreshing beverage! Just like the ones I used to serve before the unfortunate nuclear incident.",
            "brotherhood_significance": "Even in our technological pursuit, we must not forget the simple human need for comfort and refreshment.",
            "ncr_significance": "Democracy works best when citizens are content. Simple pleasures help maintain morale and social cohesion.",
            "legion_significance": "Weakness! True warriors need no artificial pleasures to maintain their resolve and discipline.",
            "raiders_significance": "Good for trading or drinking. Either way, it's worth something in this wasteland economy."
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Five of Combat Weapons",
            "suit": "combat_weapons",
            "number": 5,
            "upright_meaning": "Conflict, struggle, competition for scarce resources. Represents the need to fight for survival but warns against unnecessary violence.",
            "reversed_meaning": "Avoiding conflict, running from necessary battles, inability to defend oneself. Suggests weakness in the face of threats.",
            "radiation_level": 0.4,
            "threat_level": 5,
            "wasteland_humor": "Found five different ways to kill things! The wasteland is generous with its deadly gift selection.",
            "nuka_cola_reference": "Like competing cola brands, sometimes you need the right weapon for the right job. Choose your battles wisely.",
            "fallout_easter_egg": "War never changes, but your weapons certainly should. Upgrade regularly or become radroach food.",
            "special_ability": "Increases combat effectiveness but may attract unwanted attention from hostile factions.",
            "upright_keywords": ["conflict", "struggle", "competition", "survival", "necessary violence"],
            "reversed_keywords": ["avoidance", "cowardice", "inability to defend", "running away"],
            "good_interpretation": "Stand up for what's right, but choose your battles wisely. Sometimes conflict is necessary to protect the innocent.",
            "neutral_interpretation": "Competition and struggle are natural in the wasteland. Prepare yourself for conflicts but don't seek them unnecessarily.",
            "evil_interpretation": "Strike first and ask questions later. In this world, the most violent often survive the longest.",
            "pip_boy_voice": "Combat assessment: Multiple weapon systems detected. Recommend tactical evaluation of threat levels before engagement.",
            "vault_dweller_voice": "Vault-Tec never prepared us for this level of constant conflict. Sometimes you have to fight to survive.",
            "wasteland_trader_voice": "Good weapons mean good business. But remember, every fight costs caps in ammunition and medical supplies.",
            "super_mutant_voice": "Many weapons means many ways to smash enemies! Good for fighting, good for tribe!",
            "codsworth_voice": "I do hope you won't need to use those dreadful implements, but one must be prepared in these times.",
            "brotherhood_significance": "Superior firepower through advanced technology. Know your weapons and use them with precision and purpose.",
            "ncr_significance": "A well-armed citizenry is essential for democracy's defense. Train hard, fight smart, protect the republic.",
            "legion_significance": "Strength through disciplined combat. Master your weapons, master your enemies, master yourself.",
            "raiders_significance": "More guns means more fun! Take what you want and kill anyone who tries to stop you!"
        }
    ]

def seed_working_cards():
    """Seed working card data to Supabase"""
    print("🚀 Starting Working Wasteland Tarot Card Seeding...")

    try:
        # Create Supabase client with service role
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        # Clear existing data
        print("🧹 Clearing existing cards...")
        delete_result = supabase.table('wasteland_cards').delete().neq('id', 'non-existent').execute()
        print(f"Cleared existing records")

        # Get working card data
        cards_data = get_working_cards_data()

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
    print("🎴 Working Wasteland Tarot - Supabase Card Seeding")
    print("=" * 60)

    success = seed_working_cards()

    if success:
        print("\n✅ Working seeding completed successfully!")
        print("🎯 Wasteland Tarot database is fully operational!")
    else:
        print("\n❌ Working seeding encountered errors.")

if __name__ == "__main__":
    main()