"""
Basic integration test to verify the system works
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.user_service import UserService, AuthenticationService
from app.services.reading_service import ReadingService
from app.services.wasteland_card_service import WastelandCardService
from app.models.user import User
from app.models.wasteland_card import CharacterVoice, WastelandCard, WastelandSuit
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.models.base import Base

async def test_basic_integration():
    """Test basic integration between user authentication and reading creation"""
    print("🧪 Starting basic integration test...")

    # Create in-memory SQLite database for testing
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create async session
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Add some test cards first
        print("🎴 Setting up test cards...")
        test_cards = [
            WastelandCard(
                name="The Vault Dweller",
                suit=WastelandSuit.MAJOR_ARCANA.value,
                number=0,
                radiation_level=0.1,
                threat_level=1,
                upright_meaning="A symbol of new beginnings in the wasteland",
                reversed_meaning="Fear of the unknown outside",
                wasteland_humor="Like stepping out of the vault for the first time",
                fallout_easter_egg="Vault 101 reference"
            ),
            WastelandCard(
                name="The Wanderer",
                suit=WastelandSuit.MAJOR_ARCANA.value,
                number=1,
                radiation_level=0.3,
                threat_level=3,
                upright_meaning="The journey through the wasteland",
                reversed_meaning="Lost in the wasteland without direction",
                wasteland_humor="War... war never changes",
                fallout_easter_egg="Lone Wanderer reference"
            )
        ]

        for card in test_cards:
            session.add(card)
        await session.commit()

        # Initialize services
        auth_service = AuthenticationService(session)
        reading_service = ReadingService(session)
        card_service = WastelandCardService(session)

        # Test 1: Register a user
        print("📝 Test 1: Registering user...")
        user_data = {
            "username": "test_vault_dweller",
            "email": "test@vault101.com",
            "password": "TestPassword123!",
            "display_name": "Test Vault Dweller",
            "faction_alignment": "Vault Dweller",
            "karma_score": 75
        }

        try:
            registration_result = await auth_service.register_user(user_data)
            user_id = registration_result["user"]["id"]
            print(f"✅ User registered successfully: {user_id}")
        except Exception as e:
            print(f"❌ User registration failed: {e}")
            return False

        # Test 2: Login user
        print("🔐 Test 2: Logging in user...")
        try:
            login_result = await auth_service.login_user(
                user_data["username"],
                user_data["password"]
            )
            access_token = login_result["access_token"]
            print(f"✅ User logged in successfully, got token: {access_token[:20]}...")
        except Exception as e:
            print(f"❌ User login failed: {e}")
            return False

        # Test 3: Create a reading
        print("🔮 Test 3: Creating reading...")
        try:
            reading = await reading_service.create_reading(
                user_id=user_id,
                question="What does the wasteland hold for me?",
                spread_type="single_card",
                num_cards=1,
                character_voice=CharacterVoice.PIP_BOY,
                radiation_factor=0.7
            )
            print(f"✅ Reading created successfully: {reading.id}")
            print(f"   Question: {reading.question}")
            print(f"   Cards drawn: {reading.cards_drawn}")
            print(f"   Character voice: {reading.character_voice}")
        except Exception as e:
            print(f"❌ Reading creation failed: {e}")
            return False

        # Test 4: Get user reading history
        print("📚 Test 4: Getting user reading history...")
        try:
            readings = await reading_service.get_user_reading_history(user_id, limit=5)
            print(f"✅ Retrieved {len(readings)} readings from history")
        except Exception as e:
            print(f"❌ Reading history retrieval failed: {e}")
            return False

        # Test 5: Draw cards with user authentication
        print("🎴 Test 5: Drawing cards with user authentication...")
        try:
            cards = await card_service.draw_cards_with_radiation_shuffle(
                num_cards=3,
                radiation_factor=0.5,
                user_id=user_id
            )
            print(f"✅ Drew {len(cards)} cards successfully")
            for i, card in enumerate(cards, 1):
                print(f"   Card {i}: {card.name}")
        except Exception as e:
            print(f"❌ Card drawing failed: {e}")
            return False

        # Test 6: Get reading statistics
        print("📊 Test 6: Getting reading statistics...")
        try:
            stats = await reading_service.get_reading_statistics(user_id)
            print(f"✅ Statistics retrieved:")
            print(f"   Total readings: {stats['total_readings']}")
            print(f"   Average accuracy: {stats['average_accuracy']}")
        except Exception as e:
            print(f"❌ Statistics retrieval failed: {e}")
            return False

        print("\n🎉 All tests passed! Integration is working correctly.")
        return True

if __name__ == "__main__":
    success = asyncio.run(test_basic_integration())
    if success:
        print("\n✨ Integration test completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Integration test failed!")
        sys.exit(1)