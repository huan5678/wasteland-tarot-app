"""
Database session management for Wasteland Tarot API
Handles Supabase connection and SQLAlchemy session management
"""

import logging
from typing import AsyncGenerator, Optional
import asyncpg
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings
from app.core.exceptions import DatabaseConnectionError

logger = logging.getLogger(__name__)
settings = get_settings()

# Create the SQLAlchemy base class
Base = declarative_base()

# Create database engines
if settings.environment == "testing":
    # Use SQLite for testing
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
    )
else:
    # Use PostgreSQL for development and production
    # Using Supabase Connection Pooler (pgBouncer)
    # Disable statement cache for pgBouncer compatibility
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        connect_args={
            "statement_cache_size": 0,  # Required for pgBouncer compatibility
            "prepared_statement_cache_size": 0
        }
    )

# Create session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initialize database tables."""
    try:
        # Import all models to ensure they are registered with SQLAlchemy
        from app.models import (
            wasteland_card,
            reading_enhanced,
            user,
            social_features,
            base
        )

        logger.info("📦 Imported database models")

        # Create tables if they don't exist
        # Note: In production, use Alembic migrations instead
        if settings.environment in ["development", "testing"]:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                logger.info("🏗️ Database tables created/verified")

    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {str(e)}")
        raise DatabaseConnectionError()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency injection for database session with automatic cleanup.

    Provides a database session for FastAPI endpoints with proper error handling
    and automatic rollback on errors.

    Yields:
        AsyncSession: Active database session

    Raises:
        DatabaseConnectionError: If database connection or session fails

    Example:
        ```python
        @app.get("/users")
        async def get_users(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(User))
            return result.scalars().all()
        ```

    Notes:
        - Automatically commits on success
        - Automatically rolls back on exceptions
        - Always closes the session when done
        - Thread-safe and async-compatible
    """
    session: Optional[AsyncSession] = None
    try:
        async with AsyncSessionLocal() as session:
            yield session
            # Explicit commit on successful completion
            await session.commit()
    except Exception as e:
        logger.error(
            f"Database session error: {str(e)}",
            exc_info=True,
            extra={
                "error_type": type(e).__name__,
                "has_session": session is not None
            }
        )
        if session:
            await session.rollback()
            logger.debug("Session rolled back successfully")
        raise DatabaseConnectionError()
    finally:
        if session:
            await session.close()
            logger.debug("Session closed")


async def get_db_session() -> AsyncSession:
    """
    Get database session for direct use (not dependency injection).

    Returns:
        AsyncSession: Database session

    Note: Remember to close the session when done
    """
    return AsyncSessionLocal()


class DatabaseManager:
    """Database operations manager with connection health monitoring."""

    def __init__(self):
        self.engine = engine
        self.session_factory = AsyncSessionLocal

    async def health_check(self) -> bool:
        """
        Check database connection health.

        Returns:
            bool: True if database is healthy
        """
        try:
            async with self.session_factory() as session:
                await session.execute("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return False

    async def get_connection_info(self) -> dict:
        """
        Get database connection information.

        Returns:
            dict: Connection information
        """
        return {
            "database_url": settings.database_url.split("://")[0] + "://[hidden]",
            "pool_size": settings.database_pool_size,
            "max_overflow": settings.database_max_overflow,
            "environment": settings.environment,
            "echo_sql": settings.debug
        }

    async def close_connections(self) -> None:
        """Close all database connections."""
        try:
            await self.engine.dispose()
            logger.info("🔌 Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {str(e)}")


# Global database manager instance
db_manager = DatabaseManager()