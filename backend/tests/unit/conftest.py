"""
OAuth 服務測試專用 conftest

使用 PostgreSQL 測試資料庫（來自 .env.test）
"""
import os
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import MetaData, text

@pytest_asyncio.fixture
async def db_session():
    """
    使用 PostgreSQL 測試資料庫
    如果 DATABASE_URL 未設定或不是 PostgreSQL，回退到 SQLite
    """
    # 從環境變數取得資料庫 URL（應該已被父層 conftest 載入）
    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

    print(f"\n🔧 unit/conftest.py db_session using: {db_url[:60]}...")

    # 建立 engine
    engine = create_async_engine(
        db_url,
        echo=False
    )

    # 如果是 PostgreSQL，使用現有的 schema
    # 如果是 SQLite，需要建立基本的 users 表
    if not db_url.startswith("postgresql"):
        async with engine.begin() as conn:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    password_hash TEXT,
                    oauth_provider TEXT,
                    oauth_id TEXT,
                    profile_picture_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))

    # 建立 session
    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()

    # 清理
    await engine.dispose()


@pytest_asyncio.fixture
async def clean_db_session():
    """建立一個乾淨的測試資料庫 session，支援完整 User 模型但避免其他表"""
    # 使用 SQLite 記憶體資料庫
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )

    # 導入 User 模型但不觸發其他關係
    from app.models.user import User
    from sqlalchemy import MetaData

    # 只建立 users 表，忽略其他表
    metadata = MetaData()
    async with engine.begin() as conn:
        # 直接建立 users 表結構
        await conn.run_sync(User.__table__.create, checkfirst=True)

    # 建立 session
    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()

    # 清理
    await engine.dispose()
