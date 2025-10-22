"""
Achievement Seeds Execution Script
執行成就系統資料種子腳本

Usage:
    python scripts/run_achievement_seeds.py          # 插入/更新成就
    python scripts/run_achievement_seeds.py --rollback  # 回滾（刪除所有初始成就）
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.session import get_db_session
from app.db.seeds.achievement_seeds import seed_achievements, rollback_achievement_seeds


async def main():
    """Main execution function"""
    is_rollback = "--rollback" in sys.argv

    # Get database session
    db = get_db_session()

    try:
        if is_rollback:
            print("🔄 Rolling back achievement seeds...")
            result = await rollback_achievement_seeds(db)
            print(f"✅ Rollback complete!")
            print(f"   Deleted: {result['deleted']} achievements")
        else:
            print("🌱 Seeding achievements...")
            result = await seed_achievements(db)
            print(f"✅ Seed complete!")
            print(f"   New achievements: {result['seeded']}")
            print(f"   Updated achievements: {result['updated']}")
            print(f"   Total achievements: {result['total']}")
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(main())
