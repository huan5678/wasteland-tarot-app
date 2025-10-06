#!/usr/bin/env python3
"""
Working Supabase card seeding script using Supabase Python client
This script uses the Supabase client library since direct PostgreSQL connection has auth issues
"""

import os
import uuid
from datetime import datetime
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://aelwaolzpraxmzjqdiyw.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbHdhb2x6cHJheG16anFkaXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzNTIwNywiZXhwIjoyMDc0MjExMjA3fQ.RvRptRqlpJJjTVek5wT_uiVCTUatF9dtnBYvJ8Txra0"

def create_supabase_client() -> Client:
    """Create and return Supabase client with service role key"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_wasteland_cards_data():
    """Get comprehensive Wasteland Tarot card data"""
    return [
        {
            "id": str(uuid.uuid4()),
            "name": "The Fool",
            "suit": "major_arcana",
            "number": 0,
            "radiation_level": 0.1,
            "threat_level": 1,
            "vault_number": 111,
            "upright_meaning": "New beginnings, innocence, spontaneity, a free spirit in the post-apocalyptic world. Represents taking the first step into the unknown Wasteland with optimism and faith.",
            "reversed_meaning": "Holding back, recklessness, risk-taking without proper preparation for the harsh Wasteland. Warns against foolish actions that could lead to radiation poisoning or death.",
            "good_karma_interpretation": "Your good intentions will guide you through new adventures in the Wasteland. Trust your Pip-Boy and take that brave first step toward your destiny.",
            "neutral_karma_interpretation": "It's time to step out of your Vault. New opportunities await those willing to embrace the unknown dangers of the surface world.",
            "evil_karma_interpretation": "Beware of impulsive decisions that could lead to unexpected consequences in the unforgiving Wasteland. Consider the cost of your actions on innocent survivors.",
            "pip_boy_analysis": "Records show: New quest initiated. Recommend equipment check and prepare for journey ahead. Radiation levels: minimal.",
            "vault_dweller_perspective": "The first day outside the Vault is always filled with unknowns, but that's where true adventure begins.",
            "wasteland_trader_wisdom": "Young traveler, everyone must take that first step. I've seen many like you start their journey - some return as legends.",
            "super_mutant_simplicity": "Little human begins big journey! Strong survive, weak become ghoul food!",
            "codsworth_analysis": "New adventures are always exciting, aren't they sir/madam? Do mind the radiation, though.",
            "brotherhood_significance": "Every Knight was once a recruit. The power of technology begins with the courage to learn and explore.",
            "ncr_significance": "Democracy requires citizen participation. Everyone can contribute to rebuilding civilization in the New California Republic.",
            "legion_significance": "Even in Caesar's Legion, every warrior must prove their worth from the beginning. Strength through trial.",
            "raiders_significance": "New meat? Good, more cannon fodder for our raids! But maybe this one's got potential...",
            "vault_dweller_significance": "The fear and excitement of leaving the Vault - every dweller must face this life-changing moment of freedom.",
            "image_url": "/images/cards/major_arcana/fool.jpg",
            "image_alt_text": "A young Vault Dweller with a backpack stands at a Vault entrance, ready to embark on their first Wasteland adventure",
            "background_image_url": "/images/backgrounds/wasteland_sunrise.jpg",
            "audio_cue_url": "/audio/cards/fool_entrance.mp3",
            "geiger_sound_intensity": 0.1,
            "pip_boy_scan_data": '{"radiation": "minimal", "threat": "low", "recommendation": "proceed with caution", "SPECIAL_bonus": "luck"}',
            "wasteland_humor": "I used to be an adventurer like you, then I took a Deathclaw claw to the knee... wait, that's a different Wasteland tale.",
            "nuka_cola_reference": "Nothing's more exciting than a fresh Nuka-Cola Quantum and a brand new adventure ahead!",
            "fallout_easter_egg": "War... War never changes. But adventures? They always begin with that first brave step outside.",
            "affects_luck_stat": True,
            "affects_charisma_stat": False,
            "affects_intelligence_stat": False,
            "special_ability": "Increases Luck by 1 point until next reading. Provides beginner's luck bonus.",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The Magician",
            "suit": "major_arcana",
            "number": 1,
            "radiation_level": 0.3,
            "threat_level": 3,
            "vault_number": 111,
            "upright_meaning": "Willpower, desire, manifestation, resourcefulness in the harsh Wasteland. Represents the ability to harness one's skills and technology to survive and thrive.",
            "reversed_meaning": "Manipulation, poor planning, untapped talents going to waste. Warning against misusing advanced technology or lacking focus in survival situations.",
            "good_karma_interpretation": "You have the power to change the Wasteland for the better. Use your skills and technology to help fellow survivors and build a brighter future.",
            "neutral_karma_interpretation": "Focus on your survival goals. You have the technical ability and determination to achieve anything you set your mind to in this post-nuclear world.",
            "evil_karma_interpretation": "Great power requires wise use. Avoid the temptation to exploit other survivors or use advanced technology for selfish, destructive purposes.",
            "pip_boy_analysis": "Skill detection: Technical abilities significantly elevated. Recommend allocating skill points for maximum efficiency in Science and Repair.",
            "vault_dweller_perspective": "The advanced technical training from Vault-Tec education proves invaluable for surviving and thriving in the Wasteland.",
            "wasteland_trader_wisdom": "Those who understand pre-war technology control the trade routes. Technical skill is the most valuable currency in this new world.",
            "super_mutant_simplicity": "Smart little human knows how to fix things! Make good ally for tribe!",
            "codsworth_analysis": "Your technical expertise is quite impressive, sir/madam. Very reminiscent of the pre-war engineers.",
            "brotherhood_significance": "Knowledge is power, and technology is salvation. Technical mastery is the very foundation of our order's mission.",
            "ncr_significance": "Professional technical skills and engineering expertise are essential for rebuilding civilized society and infrastructure.",
            "legion_significance": "While we reject most technology, understanding the enemy's tools is crucial for military strategy and tactical superiority.",
            "raiders_significance": "Knows how to fix weapons, hack terminals, and jury-rig explosives - definitely useful skills for the gang!",
            "vault_dweller_significance": "Vault-Tec's comprehensive technical education and advanced training programs really prove their worth in the real world.",
            "image_url": "/images/cards/major_arcana/magician.jpg",
            "image_alt_text": "A skilled technician working at a high-tech workshop, surrounded by advanced tools, weapons, and electronic equipment",
            "background_image_url": "/images/backgrounds/tech_workshop.jpg",
            "audio_cue_url": "/audio/cards/magician_tech.mp3",
            "geiger_sound_intensity": 0.3,
            "pip_boy_scan_data": '{"radiation": "low", "threat": "moderate", "recommendation": "utilize technical skills", "SPECIAL_bonus": "intelligence"}',
            "wasteland_humor": "I can repair anything in the Wasteland... except for my own broken relationships and the world's broken state.",
            "nuka_cola_reference": "Like mixing the perfect Nuka-Cola Quantum formula, technical success requires the right combination of knowledge and precision.",
            "fallout_easter_egg": "With great technological power comes great responsibility... and radiation exposure. Always wear your Rad-X.",
            "affects_luck_stat": False,
            "affects_charisma_stat": True,
            "affects_intelligence_stat": True,
            "special_ability": "Increases Intelligence by 2 points and Science skill by 15 until next reading.",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The High Priestess",
            "suit": "major_arcana",
            "number": 2,
            "radiation_level": 0.2,
            "threat_level": 2,
            "vault_number": 101,
            "upright_meaning": "Intuition, sacred knowledge, hidden wisdom, subconscious understanding of the Wasteland's mysteries. Represents trusting inner guidance for survival.",
            "reversed_meaning": "Secrets, disconnected from intuition, withdrawal from harsh realities. Suggests ignoring survival instincts or being overly secretive about vital information.",
            "good_karma_interpretation": "Trust your inner wisdom and moral compass. In meditation and quiet contemplation, you'll find the best path to help your fellow survivors.",
            "neutral_karma_interpretation": "This is a time for introspection and learning about the Wasteland's hidden truths. Listen to your survival instincts and inner voice.",
            "evil_karma_interpretation": "Hidden truths about your past actions are about to surface. The spirits of those you've wronged may seek their due justice.",
            "pip_boy_analysis": "Perception detection: Intuitive abilities registering abnormal readings. Recommend trusting sixth sense for detecting hidden threats and opportunities.",
            "vault_dweller_perspective": "In the Vault's extensive library, I learned that knowledge and wisdom are different things - one is facts, the other is understanding.",
            "wasteland_trader_wisdom": "In this dangerous world, intuition can save your life. I've seen too many traders who ignored their gut feelings end up as ghoul food.",
            "super_mutant_simplicity": "Wise woman knows secret things! She help tribe avoid bad places with angry spirits!",
            "codsworth_analysis": "You seem particularly contemplative today, sir/madam. Any profound insights about our post-nuclear predicament?",
            "brotherhood_significance": "Ancient pre-war knowledge and accumulated wisdom are among the Brotherhood's most precious and carefully guarded assets.",
            "ncr_significance": "Wise and thoughtful leadership comes from listening carefully to citizens and understanding the deeper needs of society.",
            "legion_significance": "Even in warfare, strategic thinking, battlefield intuition, and understanding enemy psychology are absolutely essential for victory.",
            "raiders_significance": "Mysterious old lady always seems to know things before they happen... better keep her around, might be useful.",
            "vault_dweller_significance": "Vault education emphasizes not just scientific knowledge, but also the importance of human wisdom, ethics, and intuitive understanding.",
            "image_url": "/images/cards/major_arcana/high_priestess.jpg",
            "image_alt_text": "A wise woman sits in a makeshift library among salvaged books, scrolls, and pre-war knowledge, emanating mystical wisdom",
            "background_image_url": "/images/backgrounds/ruined_library.jpg",
            "audio_cue_url": "/audio/cards/priestess_wisdom.mp3",
            "geiger_sound_intensity": 0.2,
            "pip_boy_scan_data": '{"radiation": "minimal", "threat": "low", "recommendation": "contemplate and learn", "SPECIAL_bonus": "perception"}',
            "wasteland_humor": "I foresee... that you will encounter many irradiated creatures and find lots of useful junk. Truly shocking revelations, indeed!",
            "nuka_cola_reference": "Like the closely guarded secret formula of Nuka-Cola, some wisdom and knowledge takes patience and time to fully understand.",
            "fallout_easter_egg": "The answers you seek are in another settlement... but they're probably being held hostage by raiders again.",
            "affects_luck_stat": True,
            "affects_charisma_stat": False,
            "affects_intelligence_stat": True,
            "special_ability": "Increases Perception by 1 and Intelligence by 1, grants temporary clairvoyance for detecting hidden items.",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The Emperor",
            "suit": "major_arcana",
            "number": 4,
            "radiation_level": 0.5,
            "threat_level": 5,
            "vault_number": 111,
            "upright_meaning": "Authority, structure, control, protective leadership in chaotic times. Represents the power to create order and civilization from the chaos of the post-nuclear world.",
            "reversed_meaning": "Tyranny, rigidity, oppressive control, abuse of power. Warning against becoming a ruthless dictator or being overly controlling of fellow survivors.",
            "good_karma_interpretation": "Your natural leadership abilities will bring much-needed order and protection to those who desperately need it. Use your authority wisely and compassionately.",
            "neutral_karma_interpretation": "Take charge of your situation and surroundings. Structure, discipline, and strong leadership will help you and your allies achieve your survival goals.",
            "evil_karma_interpretation": "Power without compassion inevitably leads to tyranny and suffering. Remember that true strength lies in protecting others, not exploiting them for personal gain.",
            "pip_boy_analysis": "Leadership protocol activated. Command structure analysis indicates: Effective governance capabilities detected. Recommend establishing clear chain of command.",
            "vault_dweller_perspective": "The Overseer taught us that true leadership means taking responsibility for everyone's safety, well-being, and collective survival.",
            "wasteland_trader_wisdom": "A strong leader keeps the trade routes safe and secure. When there's law and order, business can flourish and communities can grow.",
            "super_mutant_simplicity": "Big boss leads well! Strong leader protects whole tribe from bad things! Tribe follows strong boss!",
            "codsworth_analysis": "You possess quite the commanding presence, sir/madam. Clearly born to lead others through these most trying times.",
            "brotherhood_significance": "The Elder's wisdom and absolute authority guide our sacred mission. Strong leadership serves the greater goal of preserving humanity's technological heritage.",
            "ncr_significance": "Democratic leadership in the New California Republic requires accountability to the people we serve and the ideals we've sworn to protect.",
            "legion_significance": "Caesar's unquestionable authority and iron will bring order and strength to the chaos and weakness of the post-nuclear Wasteland.",
            "raiders_significance": "Boss calls all the shots around here! Everyone follows orders or gets thrown to the rad-scorpions!",
            "vault_dweller_significance": "Every Vault needs a strong Overseer to maintain essential order, discipline, and protection for all residents' survival.",
            "image_url": "/images/cards/major_arcana/emperor.jpg",
            "image_alt_text": "A powerful figure sits on a throne made from salvaged materials, holding symbols of authority while overlooking a protected settlement",
            "background_image_url": "/images/backgrounds/fortified_settlement.jpg",
            "audio_cue_url": "/audio/cards/emperor_command.mp3",
            "geiger_sound_intensity": 0.5,
            "pip_boy_scan_data": '{"radiation": "moderate", "threat": "significant", "recommendation": "establish leadership authority", "SPECIAL_bonus": "charisma"}',
            "wasteland_humor": "I am the supreme Emperor of this settlement! Also, could someone please fix our perpetually broken water purification system?",
            "nuka_cola_reference": "Like the mighty Nuka-Cola Corporation's vast business empire, true lasting power comes from building strong, reliable foundations.",
            "fallout_easter_egg": "Democracy is non-negotiable! But sometimes a little benevolent dictatorship helps keep the raiders away from our settlement.",
            "affects_luck_stat": False,
            "affects_charisma_stat": True,
            "affects_intelligence_stat": False,
            "special_ability": "Increases Charisma by 3 points and adds significant leadership bonuses to all social interactions and commanding followers.",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Death",
            "suit": "major_arcana",
            "number": 13,
            "radiation_level": 0.8,
            "threat_level": 8,
            "vault_number": 111,
            "upright_meaning": "Endings, transformation, rebirth, the cycle of destruction and renewal. Represents the end of the old world and the beginning of something entirely new from the ashes.",
            "reversed_meaning": "Resistance to change, stagnation, fear of letting go of the past. Warning against clinging to pre-war ideals that no longer serve in the post-nuclear reality.",
            "good_karma_interpretation": "Transformation brings new life and hope. What seems like a devastating ending is actually a powerful new beginning for you and those you care about.",
            "neutral_karma_interpretation": "Change is inevitable in the Wasteland. Embrace the transformation, adapt to survive, and let go of what no longer serves your survival.",
            "evil_karma_interpretation": "The old world and its innocence must die completely for your new, harder self to emerge. Sometimes destruction is necessary for personal evolution.",
            "pip_boy_analysis": "Warning: Major life transition detected. Significant paradigm shift imminent. Recommend immediate adaptation protocols and mental preparation.",
            "vault_dweller_perspective": "Leaving the Vault felt like dying and being reborn. Everything familiar was gone, but I became someone stronger in the wasteland.",
            "wasteland_trader_wisdom": "In this harsh world, those who cannot adapt to constant change don't survive long. Evolve your thinking or perish with your old ways.",
            "super_mutant_simplicity": "Old life ends! New stronger life begins! Great circle continues forever! Death brings new strength!",
            "codsworth_analysis": "Change can be quite frightening, but it often leads to wonderful new opportunities and personal growth, sir/madam.",
            "brotherhood_significance": "Old, outdated technologies must be abandoned so new, superior innovations can rise. Progress always requires difficult sacrifices.",
            "ncr_significance": "The corrupt old world died in nuclear fire so our democratic republic could be born from its ashes and build something better.",
            "legion_significance": "Weak, decadent civilizations must fall and die so that strong, disciplined societies can inherit and control the earth.",
            "raiders_significance": "Everything dies eventually in this wasteland. Might as well have some violent fun and take what we want before it all ends!",
            "vault_dweller_significance": "The Great War ended one world completely, but it also began an entirely new one. Death and destruction always bring rebirth and opportunity.",
            "image_url": "/images/cards/major_arcana/death.jpg",
            "image_alt_text": "A skeletal figure in power armor stands among nuclear ruins, with new green growth and hope sprouting from the irradiated soil nearby",
            "background_image_url": "/images/backgrounds/ruins_with_regrowth.jpg",
            "audio_cue_url": "/audio/cards/death_transformation.mp3",
            "geiger_sound_intensity": 0.8,
            "pip_boy_scan_data": '{"radiation": "high", "threat": "dangerous", "recommendation": "embrace necessary change", "SPECIAL_bonus": "endurance"}',
            "wasteland_humor": "I'm not dead! I'm just resting in this nice radioactive crater! ...Okay, maybe I'm a little dead, but I got better.",
            "nuka_cola_reference": "Even Nuka-Cola Quantum had to completely replace the original formula. Evolution and adaptation never stop, even for beloved classics.",
            "fallout_easter_egg": "War never changes, but absolutely everything else does. The only constant in the Wasteland is constant change and adaptation.",
            "affects_luck_stat": True,
            "affects_charisma_stat": False,
            "affects_intelligence_stat": True,
            "special_ability": "Triggers major life transformation - resets negative karma but adds significant experience bonus and wisdom points.",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        }
    ]

def seed_cards_to_supabase():
    """Seed card data to Supabase using the Python client"""
    print("🚀 Starting Wasteland Tarot card seeding with Supabase client...")

    try:
        # Create Supabase client
        supabase = create_supabase_client()

        # Clear existing data first
        print("🧹 Clearing existing cards...")
        delete_result = supabase.table('wasteland_cards').delete().neq('id', 'non-existent').execute()
        print(f"Cleared {len(delete_result.data) if delete_result.data else 0} existing records")

        # Get card data
        cards_data = get_wasteland_cards_data()

        # Insert cards one by one to handle any errors
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
    print("🎴 Wasteland Tarot - Supabase Card Seeding Script")
    print("=" * 60)

    success = seed_cards_to_supabase()

    if success:
        print("\n✅ All operations completed successfully!")
        print("🎯 Your Wasteland Tarot database is ready for fortune telling!")
    else:
        print("\n❌ Seeding process encountered errors.")
        print("🔧 Please check the output above for details.")

if __name__ == "__main__":
    main()