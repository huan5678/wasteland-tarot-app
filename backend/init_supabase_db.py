#!/usr/bin/env python3
"""
Initialize Supabase database with proper table structure
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.sql import text
from app.models.base import Base
from app.config import settings

async def init_supabase_database():
    """Initialize Supabase database with all required tables"""
    print("🔄 Initializing Supabase database...")

    try:
        # Create engine
        engine = create_async_engine(settings.database_url, echo=True)

        # Test connection
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = await result.fetchone()
            print(f"✅ Connected to PostgreSQL: {version[0]}")

        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("✅ All tables created successfully")

        # Verify tables exist
        async with engine.connect() as conn:
            result = await conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = await result.fetchall()
            print("\n📋 Created tables:")
            for table in tables:
                print(f"  - {table[0]}")

        await engine.dispose()
        print("\n✅ Database initialization completed successfully!")

    except Exception as e:
        print(f"❌ Database initialization failed: {str(e)}")
        raise


if __name__ == "__main__":
    print("🚀 Wasteland Tarot - Database Initialization")
    print("=" * 50)
    asyncio.run(init_supabase_database())