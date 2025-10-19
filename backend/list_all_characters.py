"""
列出資料庫中的所有角色
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import Character
from app.config import settings
import uuid


async def list_characters():
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
        result = await session.execute(select(Character).order_by(Character.sort_order))
        characters = result.scalars().all()

        print('=' * 80)
        print(f'資料庫中的所有角色 (共 {len(characters)} 個)')
        print('=' * 80)
        print()

        for char in characters:
            print(f'Key: {char.key}')
            print(f'名稱: {char.name}')
            print(f'個性: {char.personality}')
            print(f'語音風格: {char.voice_style}')
            print(f'啟用: {"是" if char.is_active else "否"}')
            print(f'排序: {char.sort_order}')
            print('-' * 80)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(list_characters())
