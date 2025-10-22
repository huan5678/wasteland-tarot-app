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
