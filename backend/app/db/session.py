"""
Database session management for Wasteland Tarot API
Handles Supabase connection and SQLAlchemy session management
"""

import logging
from typing import AsyncGenerator, Optional
import uuid
import asyncpg
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import HTTPException
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
    # Using Supabase Connection Pooler (Supavisor in Transaction mode - port 6543)
    # Transaction mode does NOT support prepared statements, so we disable them entirely
    # Reference: https://www.pgbouncer.org/features.html
    engine = create_async_engine(
        settings.database_url,
        echo=False,  # Always disable SQL logging in production for performance
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,  # Enable connection health checks before using
        pool_recycle=3600,  # Recycle connections every hour to prevent stale connections
        pool_timeout=30,  # Connection timeout
        connect_args={
            # Supabase/PgBouncer Transaction Mode optimizations
            "statement_cache_size": 0,  # Disable asyncpg statement cache (CRITICAL for Transaction mode)
            "prepared_statement_cache_size": 0,  # Additional safety
            "prepared_statement_name_func": lambda: f"__pstmt_{uuid.uuid4().hex[:8]}__",  # Generate unique prepared statement names
            # Timeout settings to prevent "connection closed" errors
            "command_timeout": 30,  # Command execution timeout (30s)
            "timeout": 60,  # Connection close timeout (60s, prevents asyncpg.ConnectionDoesNotExistError)
            "server_settings": {
                "jit": "off",  # Disable JIT compilation to save memory
                "application_name": "wasteland-tarot",
                "search_path": "public",  # Set default schema
            }
        },
        # CRITICAL: Disable SQLAlchemy's internal prepared statement optimization
        # This prevents the DuplicatePreparedStatementError with pgbouncer transaction mode
        execution_options={
            "compiled_cache": None,  # Disable compiled statement cache
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
    """
    Initialize database connection check.

    Note: Uses Supabase SDK for database operations instead of direct SQLAlchemy.
    This function performs a simple health check to verify Supabase connectivity.
    """
    try:
        from app.core.supabase import get_supabase_client

        logger.info("📦 Initializing Supabase connection...")

        # Get Supabase client and verify connection
        supabase = get_supabase_client()

        # Simple health check - query system presets
        response = supabase.table("user_rhythm_presets")\
            .select("id")\
            .eq("is_system_preset", True)\
            .limit(1)\
            .execute()

        logger.info("✅ Supabase connection verified")
        logger.info("🏗️ Database ready (using Supabase SDK)")

    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {str(e)}")
        logger.warning("⚠️ Database connection failed - API may not work correctly")
        # Don't raise exception - allow API to start even if DB check fails
        # Individual endpoints will handle connection errors


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
    # 🔧 FIX: Do NOT use async with + yield (prevents proper cleanup)
    # Create session directly to ensure finally block always executes
    session = AsyncSessionLocal()
    try:
        yield session
        # Explicit commit on successful completion
        await session.commit()
    except HTTPException:
        # Re-raise HTTPException without modification (preserve status code)
        await session.rollback()
        logger.debug("Session rolled back due to HTTPException")
        raise
    except Exception as e:
        logger.error(
            f"Database session error: {str(e)}",
            exc_info=True,
            extra={
                "error_type": type(e).__name__
            }
        )
        await session.rollback()
        logger.debug("Session rolled back successfully")
        raise DatabaseConnectionError()
    finally:
        # Finally block ALWAYS executes, ensuring connection returns to pool
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

    async def get_pool_stats(self) -> dict:
        """
        Get connection pool statistics.

        Returns:
            dict: Pool statistics including size, checked in/out connections
        """
        pool = self.engine.pool

        stats = {
            "pool_size": getattr(pool, 'size', lambda: 0)(),
            "checked_in": getattr(pool, 'checkedin', lambda: 0)(),
            "checked_out": getattr(pool, 'checkedout', lambda: 0)(),
            "overflow": getattr(pool, 'overflow', lambda: 0)(),
            "max_overflow": getattr(pool, '_max_overflow', 0),
        }

        return stats

    async def check_database_health(self) -> dict:
        """
        Check database connection health with detailed stats.

        Returns:
            dict: Health status and pool statistics
        """
        try:
            from sqlalchemy import text
            async with self.session_factory() as session:
                # Simple query to test connection
                result = await session.execute(text("SELECT 1"))
                result.scalar()

                return {
                    "status": "healthy",
                    "pool_stats": await self.get_pool_stats()
                }
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }


# Global database manager instance
db_manager = DatabaseManager()


# Module-level functions for backward compatibility
async def get_pool_stats() -> dict:
    """Get connection pool statistics (backward compatibility wrapper)."""
    return await db_manager.get_pool_stats()


async def check_database_health() -> dict:
    """Check database health (backward compatibility wrapper)."""
    return await db_manager.check_database_health()


async def close_db_connections() -> None:
    """Close all database connections (backward compatibility wrapper)."""
    await db_manager.close_connections()