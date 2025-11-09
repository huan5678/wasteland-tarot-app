#!/usr/bin/env python3
"""
Startup script for Wasteland Tarot backend
Handles database initialization and verification
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql import text
from app.config import settings
from app.models.base import Base

async def check_database_connection():
    """Verify database connection"""
    try:
        engine = create_async_engine(settings.database_url, echo=False)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            await result.fetchone()
            print("✅ Database connection successful")
        await engine.dispose()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

async def ensure_tables_exist():
    """Ensure all required tables exist"""
    try:
        engine = create_async_engine(settings.database_url, echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Database tables verified/created")
        await engine.dispose()
        return True
    except Exception as e:
        print(f"❌ Table creation failed: {str(e)}")
        return False

async def check_required_data():
    """Check if the database has the required seed data"""
    try:
        engine = create_async_engine(settings.database_url, echo=False)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT COUNT(*) FROM wasteland_cards"))
            count = await result.fetchone()
            card_count = count[0] if count else 0
            print(f"📊 Found {card_count} cards in database")

            if card_count == 0:
                print("⚠️  No cards found! Run 'python seed_supabase_cards.py' to seed the database")
                return False
            return True
        await engine.dispose()
    except Exception as e:
        print(f"⚠️  Could not check card data: {str(e)}")
        return False

async def startup_checks():
    """Run all startup checks"""
    print("🚀 Wasteland Tarot Backend - Startup Checks")
    print("=" * 50)

    print(f"🔧 Environment: {settings.environment}")
    print(f"🗄️  Database: {'Supabase PostgreSQL' if 'postgresql' in settings.database_url else 'Local SQLite'}")

    # Check database connection
    if not await check_database_connection():
        print("💥 Cannot start without database connection")
        sys.exit(1)

    # Ensure tables exist
    if not await ensure_tables_exist():
        print("💥 Cannot start without required tables")
        sys.exit(1)

    # Check for seed data
    await check_required_data()

    print("\n✅ All startup checks completed!")
    print("🎯 Ready to serve Wasteland Tarot readings!")

if __name__ == "__main__":
    asyncio.run(startup_checks())