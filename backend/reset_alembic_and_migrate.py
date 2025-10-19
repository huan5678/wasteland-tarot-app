"""
Reset Alembic version table and re-run all migrations
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
import sys
import subprocess

TEST_DB_URL = "postgresql+asyncpg://sean@localhost:5432/tarot_test"

async def reset_and_migrate():
    """Reset alembic version and run migrations"""
    engine = create_async_engine(TEST_DB_URL)

    async with engine.connect() as conn:
        try:
            # Drop alembic_version table
            await conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
            await conn.commit()
            print("✅ Dropped alembic_version table")

        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)

    await engine.dispose()

    # Run alembic upgrade
    print("\n🔄 Running alembic upgrade head...")
    result = subprocess.run(
        ["bash", "-c", "source .env.test && .venv/bin/alembic upgrade head"],
        capture_output=True,
        text=True
    )
    print(result.stdout)
    if result.stderr:
        print(result.stderr)

    if result.returncode != 0:
        print(f"❌ Alembic upgrade failed with code {result.returncode}")
        sys.exit(1)

    print("✅ Alembic migrations completed")

if __name__ == "__main__":
    asyncio.run(reset_and_migrate())
