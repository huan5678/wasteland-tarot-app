"""
初始化 Supabase 資料庫 Schema

此腳本會：
1. 使用 SQLAlchemy metadata 創建所有表
2. 標記 Alembic 遷移為已執行（避免重複執行）

使用方式：
    uv run python init_database.py
"""

import asyncio
import logging
from sqlalchemy import text
from app.db.session import engine
from app.models.base import Base
from app.config import settings

# 導入所有模型以註冊到 Base.metadata
from app.models import (
    User, UserProfile, UserPreferences,
    WastelandCard, SpreadTemplate, InterpretationTemplate,
    ReadingSession, ReadingCardPosition, CardSynergy,
    UserAchievement, UserFriendship, KarmaHistory, CommunityEvent,
    SessionSave, SessionEvent,
    UserAnalytics, AnalyticsEvent, ReadingPattern, UserRecommendation,
    UserBingoCard, DailyBingoNumber, UserNumberClaim, BingoReward,
    MonthlyResetLog, UserBingoCardHistory, UserNumberClaimHistory, BingoRewardHistory
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_database():
    """初始化資料庫 schema"""

    logger.info(f"Connecting to database: {settings.database_url[:50]}...")

    async with engine.begin() as conn:
        logger.info("Creating all tables from SQLAlchemy metadata...")

        # 創建所有表
        await conn.run_sync(Base.metadata.create_all)

        logger.info(f"✅ Created {len(Base.metadata.sorted_tables)} tables:")
        for table in Base.metadata.sorted_tables:
            logger.info(f"   - {table.name} ({len(table.columns)} columns)")

        # 創建 Alembic 版本表並標記遷移為已執行
        logger.info("\nSetting up Alembic version tracking...")

        # 創建 alembic_version 表（如果不存在）
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(32) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            )
        """))

        # 標記遷移 001-004 為已執行（跳過這些舊遷移）
        migrations_to_skip = ['001_performance_indexes', '002_analytics', '003_bingo', '004_supabase_auth']

        for migration in migrations_to_skip:
            await conn.execute(text(f"""
                INSERT INTO alembic_version (version_num)
                VALUES ('{migration}')
                ON CONFLICT (version_num) DO NOTHING
            """))
            logger.info(f"   ✓ Marked {migration} as applied")

        logger.info("\n✅ Database initialization complete!")
        logger.info("Next step: Run 'uv run alembic upgrade head' to apply OAuth migration (005)")


async def main():
    try:
        await init_database()
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}", exc_info=True)
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
