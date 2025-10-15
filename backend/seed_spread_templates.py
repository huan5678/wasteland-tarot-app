#!/usr/bin/env python3
"""
Spread Templates Seed Script
Seeds the database with spread template data
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.db.database import get_db
from app.db.spread_templates_seed import create_spread_templates


async def main():
    """Main function to seed spread templates"""
    print("=" * 60)
    print("🎯 Wasteland Tarot - Spread Templates Seeder")
    print("=" * 60)
    print()

    try:
        # Get database session
        async for db in get_db():
            print("📊 Connected to database")
            print()

            # Create spread templates
            success = await create_spread_templates(db)

            if success:
                print()
                print("=" * 60)
                print("✅ Spread templates seeding completed successfully!")
                print("=" * 60)
                return 0
            else:
                print()
                print("=" * 60)
                print("❌ Spread templates seeding failed!")
                print("=" * 60)
                return 1

    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ Fatal error: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
