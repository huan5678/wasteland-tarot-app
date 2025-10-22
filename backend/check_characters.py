#!/usr/bin/env python
"""查詢資料庫中的角色列表"""
import asyncio
from app.db.session import AsyncSessionLocal
from app.models.character_voice import Character
from sqlalchemy import select


async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Character.key, Character.name, Character.is_active)
            .order_by(Character.key)
        )
        chars = result.all()

        print("\n角色列表:")
        print("=" * 80)
        for key, name, is_active in chars:
            status = "✓" if is_active else "✗"
            print(f"{status} {key:30} {name}")
        print("=" * 80)
        print(f"\n總計: {len(chars)} 個角色")


if __name__ == "__main__":
    asyncio.run(main())
