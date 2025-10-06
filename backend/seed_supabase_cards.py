#!/usr/bin/env python3
"""
Supabase-specific card seeding script for Wasteland Tarot
Ensures all required fields are properly populated for Supabase PostgreSQL
"""

import asyncio
import uuid
import os
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.sql import text
from app.models.wasteland_card import WastelandCard
from app.models.base import Base

# Supabase connection URL from environment
SUPABASE_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres.aelwaolzpraxmzjqdiyw:wasteland_vault_secure_password_2024@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
)

async def create_supabase_tables():
    """Create tables in Supabase if they don't exist"""
    engine = create_async_engine(SUPABASE_DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Tables created successfully in Supabase")

    await engine.dispose()


async def seed_supabase_cards():
    """Seed comprehensive card data to Supabase PostgreSQL"""

    # Create engine for Supabase
    engine = create_async_engine(SUPABASE_DATABASE_URL, echo=True)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    # Comprehensive card data with ALL required fields
    sample_cards = [
        {
            "id": str(uuid.uuid4()),
            "name": "The Fool",
            "suit": "Major Arcana",
            "number": 0,
            "radiation_level": 0.1,
            "threat_level": 1,
            "vault_number": 111,
            "upright_meaning": "New beginnings, innocence, spontaneity, a free spirit. Represents taking the first step into the unknown with optimism and faith in the universe.",
            "reversed_meaning": "Holding back, recklessness, risk-taking without proper consideration. Warns against foolish actions or being overly naive.",
            "good_karma_interpretation": "Your good intentions will guide you through new adventures. Trust your instincts and take that brave first step toward your destiny.",
            "neutral_karma_interpretation": "It's time to step out of your comfort zone. New opportunities await those willing to embrace the unknown.",
            "evil_karma_interpretation": "Beware of impulsive decisions that could lead to unexpected consequences. Consider the cost of your actions.",
            "pip_boy_analysis": "「Records show: New quest initiated. Recommend equipment check and prepare for journey ahead.」",
            "vault_dweller_perspective": "The first day outside the Vault is always filled with unknowns, but that's where adventure begins.",
            "wasteland_trader_wisdom": "Young traveler, everyone must take that first step. I've seen many like you start their journey.",
            "super_mutant_simplicity": "Little human begins big journey!",
            "codsworth_analysis": "New adventures are always exciting, aren't they sir/madam?",
            "brotherhood_significance": "Every Knight was once a recruit. The power of technology begins with the courage to learn.",
            "ncr_significance": "Democracy requires citizen participation. Everyone can contribute to the New California Republic.",
            "legion_significance": "Even in Caesar's Legion, every warrior must prove their worth from the beginning.",
            "raiders_significance": "New meat? Good, more cannon fodder!",
            "vault_dweller_significance": "The fear and excitement of leaving the Vault - every dweller must face this moment.",
            "image_url": "/images/cards/fool.png",
            "image_alt_text": "A young person with a backpack stands at a cliff edge, ready to embark on an adventure",
            "background_image_url": "/images/backgrounds/wasteland_sunrise.png",
            "audio_cue_url": "/audio/cards/fool_entrance.mp3",
            "geiger_sound_intensity": 0.1,
            "pip_boy_scan_data": '{"radiation": "minimal", "threat": "low", "recommendation": "proceed"}',
            "wasteland_humor": "「I used to be an adventurer like you, then I took an arrow to the knee... wait, wrong game.」",
            "nuka_cola_reference": "Nothing's more exciting than a fresh Nuka-Cola and a new adventure!",
            "fallout_easter_egg": "「War... War never changes. But adventures? They always begin the same way.」",
            "affects_luck_stat": True,
            "affects_charisma_stat": False,
            "affects_intelligence_stat": False,
            "special_ability": "Increases Luck by 1 point until next reading",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The Magician",
            "suit": "Major Arcana",
            "number": 1,
            "radiation_level": 0.3,
            "threat_level": 3,
            "vault_number": 111,
            "upright_meaning": "Willpower, desire, manifestation, resourcefulness. Represents the ability to harness one's skills and determination to achieve goals.",
            "reversed_meaning": "Manipulation, poor planning, untapped talents. Warning against misusing abilities or lacking focus.",
            "good_karma_interpretation": "You have the power to change the world. Use your skills to help others and manifest positive change.",
            "neutral_karma_interpretation": "Focus on your goals. You have the ability to achieve anything you set your mind to.",
            "evil_karma_interpretation": "Great power requires wise use. Avoid the temptation to manipulate others for selfish gain.",
            "pip_boy_analysis": "「Skill detection: Ability levels increased. Recommend allocating skill points for maximum efficiency.」",
            "vault_dweller_perspective": "The skills learned in the Vault prove just as useful in the Wasteland.",
            "wasteland_trader_wisdom": "Those who know how to trade control the Wasteland. Skill is currency.",
            "super_mutant_simplicity": "Smart little human knows many things!",
            "codsworth_analysis": "Your skill set is quite impressive, sir/madam.",
            "brotherhood_significance": "Knowledge is power. Technological mastery is the core of the Brotherhood.",
            "ncr_significance": "Professional skills are the foundation of building a new society.",
            "legion_significance": "Military strategy and tactical skills are key to victory.",
            "raiders_significance": "Knows how to shoot, pick locks, and steal - useful skills!",
            "vault_dweller_significance": "Vault-Tec education and training really paid off.",
            "image_url": "/images/cards/magician.png",
            "image_alt_text": "A person stands at a workbench, mastering various tools and materials",
            "background_image_url": "/images/backgrounds/workshop.png",
            "audio_cue_url": "/audio/cards/magician_craft.mp3",
            "geiger_sound_intensity": 0.3,
            "pip_boy_scan_data": '{"radiation": "low", "threat": "moderate", "recommendation": "utilize skills"}',
            "wasteland_humor": "「I can fix anything... except my personal relationships.」",
            "nuka_cola_reference": "Like mixing the perfect Nuka-Cola Quantum, success requires the right formula.",
            "fallout_easter_egg": "「With great power comes great radiation exposure.」",
            "affects_luck_stat": False,
            "affects_charisma_stat": True,
            "affects_intelligence_stat": True,
            "special_ability": "Increases Intelligence by 2 points until next reading",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The High Priestess",
            "suit": "Major Arcana",
            "number": 2,
            "radiation_level": 0.2,
            "threat_level": 2,
            "vault_number": 111,
            "upright_meaning": "Intuition, sacred knowledge, divine feminine, subconscious mind. Represents trusting inner wisdom and spiritual insight.",
            "reversed_meaning": "Secrets, disconnected from intuition, withdrawal. Suggests ignoring inner voice or being overly secretive.",
            "good_karma_interpretation": "Trust your inner wisdom. In silence and contemplation, you'll find the best answers.",
            "neutral_karma_interpretation": "Now is the time for introspection and learning. Listen to your inner voice.",
            "evil_karma_interpretation": "Hidden truths are about to be revealed. Prepare to face reality.",
            "pip_boy_analysis": "「Perception detection: Intuition values abnormally high. Recommend trusting sixth sense.」",
            "vault_dweller_perspective": "In the Vault's library, I learned to listen to the voice of wisdom.",
            "wasteland_trader_wisdom": "In this world, intuition can save your life. I've seen too many who ignored their gut feelings.",
            "super_mutant_simplicity": "Smart woman knows secrets!",
            "codsworth_analysis": "You seem deep in thought, sir/madam. Any profound contemplations?",
            "brotherhood_significance": "Ancient knowledge and wisdom are the Brotherhood's most precious assets.",
            "ncr_significance": "Wise leadership comes from listening and understanding.",
            "legion_significance": "Even on the battlefield, strategic thinking and intuition are necessary.",
            "raiders_significance": "Old woman always knows something... better stay alert.",
            "vault_dweller_significance": "Vault education isn't just science, but also human wisdom.",
            "image_url": "/images/cards/high_priestess.png",
            "image_alt_text": "A wise woman sits in a mystical library, surrounded by ancient books",
            "background_image_url": "/images/backgrounds/library.png",
            "audio_cue_url": "/audio/cards/priestess_wisdom.mp3",
            "geiger_sound_intensity": 0.2,
            "pip_boy_scan_data": '{"radiation": "minimal", "threat": "low", "recommendation": "contemplate"}',
            "wasteland_humor": "「I foresee... you will find a lot of junk in the Wasteland. Shocking!」",
            "nuka_cola_reference": "Like Nuka-Cola's secret formula, some knowledge takes time to understand.",
            "fallout_easter_egg": "「The answers you seek are in another settlement.」",
            "affects_luck_stat": True,
            "affects_charisma_stat": False,
            "affects_intelligence_stat": True,
            "special_ability": "Increases Perception by 1 and Intelligence by 1",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The Emperor",
            "suit": "Major Arcana",
            "number": 4,
            "radiation_level": 0.5,
            "threat_level": 5,
            "vault_number": 111,
            "upright_meaning": "Authority, structure, control, father figure. Represents leadership, stability, and the power to create order from chaos.",
            "reversed_meaning": "Tyranny, rigidity, coldness. Warning against abuse of power or being overly controlling.",
            "good_karma_interpretation": "Your leadership will bring order and protection to those who need it. Use your authority wisely.",
            "neutral_karma_interpretation": "Take charge of your situation. Structure and discipline will help you achieve your goals.",
            "evil_karma_interpretation": "Power without compassion leads to tyranny. Remember that true strength lies in protecting others.",
            "pip_boy_analysis": "「Leadership protocol activated. Command structure analysis: Effective governance detected.」",
            "vault_dweller_perspective": "The Overseer taught us that leadership means responsibility for everyone's wellbeing.",
            "wasteland_trader_wisdom": "A good leader keeps the trade routes safe. Order means business can flourish.",
            "super_mutant_simplicity": "Big boss leads! Strong leader protects tribe!",
            "codsworth_analysis": "You have quite the commanding presence, sir/madam. Born to lead, I'd say.",
            "brotherhood_significance": "Elder's wisdom guides us. Authority serves the preservation of technology.",
            "ncr_significance": "Democratic leadership requires accountability to the people we serve.",
            "legion_significance": "Caesar's authority brings order to the chaos of the Wasteland.",
            "raiders_significance": "Boss calls the shots! Follow or get out of the way!",
            "vault_dweller_significance": "Every Vault needs an Overseer to maintain order and protect residents.",
            "image_url": "/images/cards/emperor.png",
            "image_alt_text": "A powerful figure sits on a throne, holding symbols of authority and protection",
            "background_image_url": "/images/backgrounds/throne_room.png",
            "audio_cue_url": "/audio/cards/emperor_command.mp3",
            "geiger_sound_intensity": 0.5,
            "pip_boy_scan_data": '{"radiation": "moderate", "threat": "significant", "recommendation": "establish authority"}',
            "wasteland_humor": "「I am the Emperor! Also, could someone fix this broken water chip?」",
            "nuka_cola_reference": "Like the Nuka-Cola Corporation's empire, true power comes from strong foundations.",
            "fallout_easter_egg": "「Democracy is non-negotiable!」",
            "affects_luck_stat": False,
            "affects_charisma_stat": True,
            "affects_intelligence_stat": False,
            "special_ability": "Increases Charisma by 3 points and adds leadership bonus",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Death",
            "suit": "Major Arcana",
            "number": 13,
            "radiation_level": 0.8,
            "threat_level": 8,
            "vault_number": 111,
            "upright_meaning": "Endings, transformation, transition, rebirth. Represents the end of one phase and the beginning of another.",
            "reversed_meaning": "Resistance to change, stagnation, fear of letting go. Warning against clinging to what no longer serves.",
            "good_karma_interpretation": "Transformation brings new life. What seems like an ending is actually a new beginning.",
            "neutral_karma_interpretation": "Change is inevitable. Embrace the transformation and let go of what no longer serves you.",
            "evil_karma_interpretation": "The past must die for the future to live. Sometimes destruction is necessary for renewal.",
            "pip_boy_analysis": "「Warning: Major life transition detected. Recommend adaptation protocols.」",
            "vault_dweller_perspective": "Leaving the Vault felt like dying, but it was really being reborn into a new world.",
            "wasteland_trader_wisdom": "In the Wasteland, those who can't adapt don't survive. Change or perish.",
            "super_mutant_simplicity": "Old life ends! New life begins! Circle continues!",
            "codsworth_analysis": "Change can be frightening, but it often leads to wonderful new opportunities, sir/madam.",
            "brotherhood_significance": "Old technologies die so new ones can rise. Progress requires sacrifice.",
            "ncr_significance": "The old world died so the new republic could be born from its ashes.",
            "legion_significance": "The weak civilizations fall so the strong can inherit the earth.",
            "raiders_significance": "Everything dies eventually. Might as well have fun before it happens!",
            "vault_dweller_significance": "The Great War ended one world but began another. Death brings rebirth.",
            "image_url": "/images/cards/death.png",
            "image_alt_text": "A skeletal figure in armor stands among ruins, with new growth sprouting nearby",
            "background_image_url": "/images/backgrounds/ruins_regrowth.png",
            "audio_cue_url": "/audio/cards/death_transformation.mp3",
            "geiger_sound_intensity": 0.8,
            "pip_boy_scan_data": '{"radiation": "high", "threat": "dangerous", "recommendation": "embrace change"}',
            "wasteland_humor": "「I'm not dead! I'm just resting! ...Okay, maybe I'm a little dead.」",
            "nuka_cola_reference": "Even Nuka-Cola Quantum had to replace the original formula. Evolution never stops.",
            "fallout_easter_egg": "「War never changes, but everything else does.」",
            "affects_luck_stat": True,
            "affects_charisma_stat": False,
            "affects_intelligence_stat": True,
            "special_ability": "Triggers major life transformation - resets all stats but adds experience bonus",
            "draw_frequency": 0,
            "total_appearances": 0,
            "last_drawn_at": None
        }
    ]

    async with AsyncSessionLocal() as session:
        try:
            # Clear existing data first (optional)
            print("🧹 Clearing existing cards...")
            await session.execute(text("DELETE FROM wasteland_cards"))

            # Add new cards
            for card_data in sample_cards:
                card = WastelandCard(**card_data)
                session.add(card)
                print(f"➕ Added card: {card_data['name']}")

            await session.commit()
            print(f"✅ Successfully seeded {len(sample_cards)} cards to Supabase database")

        except Exception as e:
            await session.rollback()
            print(f"❌ Error seeding cards: {str(e)}")
            raise
        finally:
            await session.close()

    await engine.dispose()


async def verify_supabase_connection():
    """Test connection to Supabase"""
    try:
        engine = create_async_engine(SUPABASE_DATABASE_URL, echo=False)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            await result.fetchone()
            print("✅ Successfully connected to Supabase PostgreSQL")
        await engine.dispose()
        return True
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {str(e)}")
        return False


async def main():
    """Main seeding process"""
    print("🔄 Starting Supabase card seeding process...")

    # Test connection first
    if not await verify_supabase_connection():
        print("💥 Cannot proceed without database connection")
        return

    # Create tables
    await create_supabase_tables()

    # Seed data
    await seed_supabase_cards()

    print("🎉 Supabase seeding process completed successfully!")


if __name__ == "__main__":
    print("🚀 Wasteland Tarot - Supabase Card Seeding")
    print("=" * 50)
    asyncio.run(main())