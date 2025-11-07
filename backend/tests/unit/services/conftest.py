"""
Unit Tests - Services conftest
Provides test database session with in-memory SQLite for service layer tests
"""
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import MetaData

from app.models.base import Base
from app.models.user import User
from app.models.wishlist import Wishlist


@pytest_asyncio.fixture
async def db_session():
    """
    Create an in-memory SQLite database session for service tests
    Includes User and Wishlist tables only
    """
    # Create in-memory SQLite engine
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        future=True
    )

    # Create only the tables we need (User and Wishlist)
    # This avoids JSONB type issues with other tables
    async with engine.begin() as conn:
        await conn.run_sync(User.__table__.create)
        await conn.run_sync(Wishlist.__table__.create)

    # Create session factory
    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )

    # Create and yield session
    async with async_session() as session:
        yield session
        await session.rollback()

    # Clean up
    await engine.dispose()
