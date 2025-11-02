#!/usr/bin/env python3
"""
Run Character & Faction Seed Script
執行角色與陣營種子資料腳本
"""

import asyncio
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.db.session import AsyncSessionLocal
from app.db.seeds.character_faction_seeds import seed_character_faction_data
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """Main execution function"""
    try:
        async with AsyncSessionLocal() as db:
            await seed_character_faction_data(db)
        logger.info("\n✅ Seed script completed successfully!")
        return 0
    except Exception as e:
        logger.error(f"\n❌ Seed script failed: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
