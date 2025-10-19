"""
Create all tables in test database from SQLAlchemy models
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
import sys

from app.models.base import Base
# Import all models to register them with Base.metadata
from app.models import (
    User,
    UserProfile,
    UserPreferences,
    WastelandCard,
    SpreadTemplate,
    InterpretationTemplate,
    CompletedReading,
    ReadingSession,
    ReadingCardPosition,
    CardSynergy,
    UserAchievement,
    UserFriendship,
    KarmaHistory,
    CommunityEvent,
    SessionEvent,
    UserAnalytics,
    AnalyticsEvent,
    ReadingPattern,
    UserRecommendation,
    UserBingoCard,
    DailyBingoNumber,
    UserNumberClaim,
    BingoReward,
    MonthlyResetLog,
    UserBingoCardHistory,
    UserNumberClaimHistory,
    BingoRewardHistory,
    UserLoginHistory,
    TokenExtensionHistory,
)

TEST_DB_URL = "postgresql+asyncpg://sean@localhost:5432/tarot_test"

async def create_all_tables():
    """Create all tables from models"""
    engine = create_async_engine(TEST_DB_URL, echo=True)

    try:
        async with engine.begin() as conn:
            # Drop all tables first
            await conn.run_sync(Base.metadata.drop_all)
            print("✅ Dropped all existing tables")

            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Created all tables from models")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_all_tables())
