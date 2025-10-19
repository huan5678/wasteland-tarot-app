"""
快速獲取 Major Arcana 卡牌的號碼對應
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import WastelandCard
from app.config import settings
import uuid


async def get_major_arcana_numbers():
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        connect_args={
            'statement_cache_size': 0,
            'prepared_statement_cache_size': 0,
            'prepared_statement_name_func': lambda: f'__pstmt_{uuid.uuid4().hex[:8]}__',
            'server_settings': {'jit': 'off'},
        },
        execution_options={'compiled_cache': None},
    )

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(
            select(WastelandCard.number, WastelandCard.name)
            .where(WastelandCard.suit == 'major_arcana')
            .order_by(WastelandCard.number)
        )
        cards = result.all()

        print('=== Major Arcana 號碼對應 ===\n')
        for number, name in cards:
            print(f'{number:2d}: {name}')

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(get_major_arcana_numbers())
