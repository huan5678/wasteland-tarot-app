"""
Achievement Database Verification Script - 資料庫驗證腳本
驗證成就系統的資料庫 schema、資料完整性和索引

Usage:
    python scripts/verify_achievement_database.py
"""

import asyncio
import sys
from pathlib import Path
from typing import List, Dict, Any

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session


async def verify_tables_exist(db: AsyncSession) -> Dict[str, bool]:
    """驗證資料表是否存在"""
    print("📋 Verifying tables...")

    tables_to_check = ['achievements', 'user_achievement_progress']
    results = {}

    for table in tables_to_check:
        query = text(f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = '{table}'
            );
        """)
        result = await db.execute(query)
        exists = result.scalar()
        results[table] = exists

        status = "✅" if exists else "❌"
        print(f"   {status} Table '{table}': {'EXISTS' if exists else 'NOT FOUND'}")

    return results


async def verify_columns(db: AsyncSession) -> Dict[str, List[str]]:
    """驗證資料表欄位"""
    print()
    print("📊 Verifying columns...")

    expected_columns = {
        'achievements': [
            'id', 'created_at', 'updated_at',
            'code', 'name_zh_tw', 'description_zh_tw',
            'category', 'rarity', 'icon_name',
            'criteria', 'rewards',
            'is_hidden', 'is_active', 'display_order'
        ],
        'user_achievement_progress': [
            'id', 'created_at', 'updated_at',
            'user_id', 'achievement_id',
            'current_progress', 'target_progress',
            'status', 'unlocked_at', 'claimed_at'
        ]
    }

    results = {}

    for table, expected in expected_columns.items():
        query = text(f"""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = '{table}'
            ORDER BY ordinal_position;
        """)
        result = await db.execute(query)
        actual_columns = [row[0] for row in result]

        missing = set(expected) - set(actual_columns)
        extra = set(actual_columns) - set(expected)

        results[table] = actual_columns

        print(f"   Table '{table}':")
        print(f"      Expected: {len(expected)} columns")
        print(f"      Actual: {len(actual_columns)} columns")

        if missing:
            print(f"      ❌ Missing: {', '.join(missing)}")
        if extra:
            print(f"      ⚠️  Extra: {', '.join(extra)}")
        if not missing and not extra:
            print(f"      ✅ All columns present")

    return results


async def verify_indexes(db: AsyncSession) -> Dict[str, List[str]]:
    """驗證索引"""
    print()
    print("🔍 Verifying indexes...")

    expected_indexes = {
        'achievements': [
            'idx_achievement_code',
            'idx_achievement_category',
            'idx_achievement_rarity',
            'idx_achievement_is_active'
        ],
        'user_achievement_progress': [
            'idx_user_achievement_user_id',
            'idx_user_achievement_achievement_id',
            'idx_user_achievement_status',
            'idx_user_achievement_user_status',
            'idx_user_achievement_unlocked_at'
        ]
    }

    results = {}

    for table, expected in expected_indexes.items():
        query = text(f"""
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename = '{table}'
            AND indexname LIKE 'idx%'
            ORDER BY indexname;
        """)
        result = await db.execute(query)
        actual_indexes = [row[0] for row in result]

        missing = set(expected) - set(actual_indexes)
        extra = set(actual_indexes) - set(expected)

        results[table] = actual_indexes

        print(f"   Table '{table}':")
        print(f"      Expected: {len(expected)} indexes")
        print(f"      Actual: {len(actual_indexes)} indexes")

        if missing:
            print(f"      ❌ Missing: {', '.join(missing)}")
        if extra:
            print(f"      ⚠️  Extra: {', '.join(extra)}")
        if not missing and not extra:
            print(f"      ✅ All indexes present")

    return results


async def verify_constraints(db: AsyncSession) -> Dict[str, List[str]]:
    """驗證約束"""
    print()
    print("🔒 Verifying constraints...")

    query = text("""
        SELECT
            conrelid::regclass AS table_name,
            conname AS constraint_name,
            contype AS constraint_type,
            pg_get_constraintdef(oid) AS constraint_def
        FROM pg_constraint
        WHERE conrelid IN ('achievements'::regclass, 'user_achievement_progress'::regclass)
        ORDER BY table_name, contype, conname;
    """)

    result = await db.execute(query)
    constraints = result.fetchall()

    results = {}

    for row in constraints:
        table = str(row[0])
        if table not in results:
            results[table] = []
        results[table].append({
            'name': row[1],
            'type': row[2],
            'definition': row[3]
        })

    for table, cons in results.items():
        print(f"   {table}:")
        for c in cons:
            type_label = {
                'c': 'CHECK',
                'f': 'FOREIGN KEY',
                'p': 'PRIMARY KEY',
                'u': 'UNIQUE'
            }.get(c['type'], c['type'])

            print(f"      ✅ {type_label}: {c['name']}")

    return results


async def verify_data_counts(db: AsyncSession) -> Dict[str, int]:
    """驗證資料數量"""
    print()
    print("📈 Verifying data counts...")

    tables = ['achievements', 'user_achievement_progress']
    results = {}

    for table in tables:
        query = text(f"SELECT COUNT(*) FROM {table};")
        result = await db.execute(query)
        count = result.scalar()
        results[table] = count

        print(f"   {table}: {count} records")

    # 檢查成就分類
    query = text("""
        SELECT category, COUNT(*) as count
        FROM achievements
        GROUP BY category
        ORDER BY category;
    """)
    result = await db.execute(query)
    categories = result.fetchall()

    if categories:
        print()
        print("   Achievement categories:")
        for cat, count in categories:
            print(f"      {cat}: {count}")

    return results


async def verify_achievement_system(db: AsyncSession):
    """主驗證函式"""
    print("=" * 60)
    print("Achievement System Database Verification")
    print("=" * 60)
    print()

    all_passed = True

    # 1. 驗證資料表
    tables = await verify_tables_exist(db)
    if not all(tables.values()):
        all_passed = False

    # 2. 驗證欄位
    columns = await verify_columns(db)

    # 3. 驗證索引
    indexes = await verify_indexes(db)

    # 4. 驗證約束
    constraints = await verify_constraints(db)

    # 5. 驗證資料數量
    counts = await verify_data_counts(db)

    # 總結
    print()
    print("=" * 60)
    if all_passed:
        print("✅ Database verification PASSED")
    else:
        print("❌ Database verification FAILED - Please check errors above")
    print("=" * 60)


async def main():
    """主函式"""
    db = get_db_session()

    try:
        await verify_achievement_system(db)
    except Exception as e:
        print(f"❌ Verification failed with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(main())
