"""
Seed data for Wasteland Tarot cards
Creates initial set of cards for testing and development
"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.wasteland_card import WastelandCard, WastelandSuit, KarmaAlignment, CharacterVoice, FactionAlignment


async def create_sample_cards(db: AsyncSession) -> None:
    """Create sample cards for testing"""

    # Major Arcana sample cards
    sample_cards = [
        WastelandCard(
            id="the_wanderer",
            name="The Wanderer",
            suit=WastelandSuit.MAJOR_ARCANA.value,
            number=None,
            upright_meaning="New beginnings in the wasteland, adventure awaits",
            reversed_meaning="Lost in the wasteland, confusion and misdirection",
            radiation_level=2.0,
            threat_level=3,
            good_karma_interpretation="A noble journey awaits, guided by righteous purpose",
            neutral_karma_interpretation="The path ahead is uncertain but full of possibilities",
            evil_karma_interpretation="Power can be taken from those who wander unprepared",
            pip_boy_analysis="Initiating exploration protocol. Good luck out there!",
            vault_dweller_perspective="The surface world is vast and full of opportunities",
            wasteland_trader_wisdom="New territories mean new trading opportunities, friend",
            super_mutant_simplicity="BIG WORLD. MUCH TO EXPLORE. STRONG SURVIVE.",
            brotherhood_significance="Technology can be found in the most unexpected places",
            ncr_significance="Expansion and exploration serve the Republic's interests",
            legion_significance="New lands to conquer for Caesar's glory",
            raiders_significance="Fresh territories to raid and pillage"
        ),
        WastelandCard(
            id="the_vault_door",
            name="The Vault Door",
            suit=WastelandSuit.MAJOR_ARCANA.value,
            number=None,
            upright_meaning="Safety, security, but also isolation and stagnation",
            reversed_meaning="Breakthrough, emergence, but also exposure to danger",
            radiation_level=0.5,
            threat_level=1,
            good_karma_interpretation="Protection for those who need shelter",
            neutral_karma_interpretation="Balance between safety and freedom",
            evil_karma_interpretation="Isolation breeds weakness and dependence"
        ),
        WastelandCard(
            id="steel_be_with_you",
            name="Steel Be With You",
            suit=WastelandSuit.COMBAT_WEAPONS.value,
            number=1,
            upright_meaning="Technology brings salvation and order",
            reversed_meaning="Technology corrupts and enslaves",
            radiation_level=1.0,
            threat_level=5,
            brotherhood_significance="This card resonates deeply with Brotherhood values",
            ncr_significance="The NCR sees this as militaristic expansion",
            legion_significance="Caesar views this as weakness through reliance on machines"
        ),
        WastelandCard(
            id="nuka_cola_ace",
            name="Ace of Nuka-Cola",
            suit=WastelandSuit.NUKA_COLA_BOTTLES.value,
            number=1,
            upright_meaning="Pure refreshment, new energy, commercial success",
            reversed_meaning="Addiction, empty promises, corporate manipulation",
            radiation_level=3.0,
            threat_level=2
        ),
        WastelandCard(
            id="bottlecap_fortune",
            name="King of Bottle Caps",
            suit=WastelandSuit.BOTTLE_CAPS.value,
            number=14,
            upright_meaning="Wealth, prosperity, successful trading",
            reversed_meaning="Greed, hoarding, economic collapse",
            radiation_level=0.8,
            threat_level=4
        )
    ]

    # Add cards to session
    for card in sample_cards:
        db.add(card)

    await db.commit()


async def seed_database(db: AsyncSession) -> bool:
    """Seed database with initial data"""
    try:
        await create_sample_cards(db)
        return True
    except Exception as e:
        print(f"Error seeding database: {e}")
        await db.rollback()
        return False