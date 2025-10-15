#!/usr/bin/env python3
"""
檢查並顯示所有 reading_sessions 的狀態
"""

import asyncio
from sqlalchemy import text
from app.db.database import get_db_direct

async def main():
    db = get_db_direct()

    try:
        # 查詢所有 sessions 的狀態分佈
        query = text("""
            SELECT
                status,
                COUNT(*) as count
            FROM reading_sessions
            GROUP BY status
            ORDER BY count DESC
        """)

        result = await db.execute(query)
        rows = result.fetchall()

        print("\n=== Session 狀態分佈 ===")
        for row in rows:
            print(f"Status: {row[0]:15} Count: {row[1]}")

        # 查詢具體的 sessions 資料
        detail_query = text("""
            SELECT
                id,
                user_id,
                question,
                status,
                created_at,
                updated_at
            FROM reading_sessions
            ORDER BY created_at DESC
            LIMIT 10
        """)

        result = await db.execute(detail_query)
        rows = result.fetchall()

        print("\n=== 最近 10 個 Sessions ===")
        for row in rows:
            print(f"\nID: {row[0]}")
            print(f"Question: {row[2][:50]}...")
            print(f"Status: {row[3]}")
            print(f"Created: {row[4]}")
            print(f"Updated: {row[5]}")

    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(main())
