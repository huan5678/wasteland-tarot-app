#!/usr/bin/env python3
"""
Seed Spread Templates into Database
Execute this script to populate the database with initial spread templates
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.db.spread_templates_seed import create_spread_templates


async def main():
    """Main execution function"""
    print("🎯 Wasteland Tarot - Spread Templates Seeder")
    print("=" * 60)

    # Create async engine with pgbouncer compatibility
    # Disable ALL prepared statement caching for pgbouncer transaction mode
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        future=True,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "prepared_statement_name_func": lambda: None  # Disable named prepared statements
        }
    )

    # Create async session
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        print(f"📊 Connected to database: {settings.database_url[:50]}...")
        print()

        # Create spread templates
        success = await create_spread_templates(session)

        if success:
            print()
            print("✅ Spread templates seeding completed successfully!")
            print("🎴 You can now use these spreads in your tarot readings")
            return 0
        else:
            print()
            print("❌ Spread templates seeding failed")
            return 1

    await engine.dispose()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
