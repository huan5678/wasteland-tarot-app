"""
檢查資料庫中的卡牌數量和角色數量
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func
from app.models import WastelandCard, Character
from app.config import settings
import uuid


async def check_counts():
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__pstmt_{uuid.uuid4().hex[:8]}__",
            "server_settings": {"jit": "off"},
        },
        execution_options={"compiled_cache": None},
    )

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("=" * 80)
        print("檢查資料庫中的卡牌和角色數量")
        print("=" * 80)
        print()

        # 1. 檢查卡牌數量
        result = await session.execute(select(func.count(WastelandCard.id)))
        card_count = result.scalar()
        print(f"📇 卡牌總數: {card_count}")
        print()

        # 2. 檢查角色數量
        result = await session.execute(select(func.count(Character.id)))
        char_count = result.scalar()
        print(f"🎭 角色總數: {char_count}")
        print()

        # 3. 列出所有角色
        result = await session.execute(select(Character).order_by(Character.sort_order))
        characters = result.scalars().all()

        print("角色列表:")
        print("-" * 80)
        for char in characters:
            print(f"  {char.sort_order:2d}. {char.name:25s} ({char.key})")
        print()

        # 4. 計算需要建立的解讀總數
        total_interpretations = card_count * char_count
        print(f"📊 需要建立的解讀總數: {card_count} 張卡牌 × {char_count} 個角色 = {total_interpretations} 筆解讀")
        print()

        # 5. 列出前 10 張卡牌作為範例
        result = await session.execute(
            select(WastelandCard)
            .order_by(WastelandCard.suit, WastelandCard.card_number)
            .limit(10)
        )
        cards = result.scalars().all()

        print("前 10 張卡牌範例:")
        print("-" * 80)
        for card in cards:
            print(f"  {card.card_number:2d}. {card.name:30s} ({card.suit})")

        print()
        print("=" * 80)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check_counts())
