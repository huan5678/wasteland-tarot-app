"""
Rebuild test database from scratch
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import sys

# Database URLs
POSTGRES_URL = "postgresql+asyncpg://sean@localhost:5432/postgres"
TEST_DB_URL = "postgresql+asyncpg://sean@localhost:5432/tarot_test"

async def rebuild_test_db():
    """Drop and recreate test database"""
    # Connect to postgres database to drop/create test db
    engine = create_async_engine(POSTGRES_URL, isolation_level="AUTOCOMMIT")

    async with engine.connect() as conn:
        try:
            # Drop test database if exists
            await conn.execute(text("DROP DATABASE IF EXISTS tarot_test"))
            print("✅ Dropped tarot_test database")

            # Create test database
            await conn.execute(text("CREATE DATABASE tarot_test"))
            print("✅ Created tarot_test database")

        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(rebuild_test_db())
