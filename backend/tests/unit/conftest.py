"""
Unit Tests - Shared conftest

提供資料庫 session 和服務 fixtures
- OAuth 服務測試
- AI 解讀服務測試
"""
import os
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import MetaData, text
from dotenv import load_dotenv
from app.config import settings
from app.services.ai_interpretation_service import AIInterpretationService
from app.db.database import AsyncSessionLocal  # 使用已配置好的 session factory

# ⚠️ 強制使用生產環境變數（Supabase）進行測試
# 這些測試是 read-only，安全地使用生產資料庫
backend_env = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
if os.path.exists(backend_env):
    # 使用 override=True 確保覆蓋 .env.test 的設定
    load_dotenv(backend_env, override=True)
    print(f"✅ [FORCE] Loaded production .env from: {backend_env} (overriding .env.test)")

@pytest_asyncio.fixture(scope="function")
async def db_session():
    """
    使用生產資料庫 (read-only)
    直接使用 app.db.database.AsyncSessionLocal（已配置 Supabase PgBouncer 相容參數）

    每個測試函數獨立建立 session，避免 event loop 衝突
    """
    print(f"\n🔧 unit/conftest.py db_session using AsyncSessionLocal")

    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        # rollback 任何未提交的變更，但不關閉 session
        # 讓 SQLAlchemy 在 event loop 關閉前自行清理
        try:
            await session.rollback()
        except Exception:
            pass  # 忽略 rollback 錯誤


@pytest_asyncio.fixture
async def clean_db_session():
    """建立一個乾淨的測試資料庫 session，支援 User 和 Credential 模型"""
    # 使用 SQLite 記憶體資料庫
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )

    # 導入需要的模型
    from app.models.user import User
    from app.models.base import Base  # 使用 Base 的 metadata
    from sqlalchemy import MetaData, Table, Column, String, BigInteger, Boolean, TIMESTAMP, ForeignKey, Text

    # 建立新的 metadata（避免使用全域的 Base.metadata）
    metadata = MetaData()

    async with engine.begin() as conn:
        # 1. 建立 users 表（使用 User 模型的完整結構，不執行 server_default）
        # 直接使用 User.__table__ 的定義，但綁定到新的 metadata
        await conn.run_sync(User.__table__.to_metadata(metadata).create, checkfirst=True)

        # 2. 手動建立 credentials 表（避免 ARRAY 類型問題）
        credentials_table = Table(
            'credentials',
            metadata,
            Column('id', String, primary_key=True),
            Column('user_id', String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            Column('credential_id', Text, unique=True, nullable=False),
            Column('public_key', Text, nullable=False),
            Column('counter', BigInteger, nullable=False, default=0),
            Column('transports', Text, nullable=True),  # 儲存為 JSON 字串
            Column('device_name', Text, nullable=True),
            Column('aaguid', String, nullable=True),
            Column('backup_eligible', Boolean, nullable=False, default=False),
            Column('backup_state', Boolean, nullable=False, default=False),
            Column('created_at', TIMESTAMP, nullable=False),
            Column('last_used_at', TIMESTAMP, nullable=True),
        )

        await conn.run_sync(credentials_table.create, checkfirst=True)

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

@pytest_asyncio.fixture(scope="function")
async def ai_service(db_session: AsyncSession) -> AIInterpretationService:
    """
    提供 AI Interpretation Service 實例用於測試

    Args:
        db_session: 資料庫 session fixture

    Returns:
        AIInterpretationService 實例（不初始化 provider，避免 API 呼叫）

    每個測試函數獨立建立 service，避免 session 重用問題
    """
    # 建立 AI 服務實例，不自動初始化 provider（避免實際 API 呼叫）
    service = AIInterpretationService(
        settings=settings,
        db_session=db_session,
        provider=None  # 不提供 provider，避免實際 AI 呼叫
    )
    yield service
    # 清理資源（如果需要）
