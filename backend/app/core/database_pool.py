"""
Database Connection Pool Configuration
Optimized pooling settings for production
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool, QueuePool, StaticPool
from typing import AsyncGenerator
import logging

from app.config import settings


logger = logging.getLogger(__name__)


def get_pool_class():
    """Get appropriate pool class based on environment"""
    if settings.environment == "test":
        # Use StaticPool for testing (single connection)
        return StaticPool
    elif settings.database_url and "sqlite" in settings.database_url:
        # SQLite doesn't support connection pooling well
        return NullPool
    else:
        # Use QueuePool for PostgreSQL
        return QueuePool


def create_engine_with_pool():
    """Create database engine with optimized connection pool"""

    pool_class = get_pool_class()

    # Connection pool settings
    pool_settings = {
        "poolclass": pool_class,
    }

    # Only add pool parameters for QueuePool
    if pool_class == QueuePool:
        pool_settings.update({
            "pool_size": 20,              # Base pool size
            "max_overflow": 10,            # Additional connections when pool exhausted
            "pool_timeout": 30,            # Timeout for getting connection
            "pool_recycle": 3600,          # Recycle connections after 1 hour
            "pool_pre_ping": True,         # Test connections before using
            "echo_pool": False,            # Don't log pool events
        })

    engine = create_async_engine(
        settings.database_url,
        **pool_settings,
        echo=settings.debug,
        future=True,
        # Additional engine settings
        connect_args={
            "server_settings": {
                "application_name": "wasteland_tarot",
            }
        } if "postgresql" in settings.database_url else {}
    )

    logger.info(
        f"Database engine created with {pool_class.__name__} "
        f"(pool_size={pool_settings.get('pool_size', 'N/A')})"
    )

    return engine


# Create engine instance
engine = create_engine_with_pool()


# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting database session
    Automatically handles session lifecycle
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_pool_stats() -> dict:
    """Get connection pool statistics"""
    pool = engine.pool

    stats = {
        "pool_size": getattr(pool, 'size', lambda: 0)(),
        "checked_in": getattr(pool, 'checkedin', lambda: 0)(),
        "checked_out": getattr(pool, 'checkedout', lambda: 0)(),
        "overflow": getattr(pool, 'overflow', lambda: 0)(),
        "max_overflow": getattr(pool, '_max_overflow', 0),
    }

    return stats


async def close_db_connections():
    """Close all database connections"""
    await engine.dispose()
    logger.info("Database connections closed")


# Health check
async def check_database_health() -> dict:
    """Check database connection health"""
    try:
        async with AsyncSessionLocal() as session:
            # Simple query to test connection
            result = await session.execute("SELECT 1")
            result.scalar()

            return {
                "status": "healthy",
                "pool_stats": await get_pool_stats()
            }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# Query optimization helpers
class DatabaseSession:
    """Context manager for database sessions with automatic rollback"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.committed = False

    async def __aenter__(self):
        return self.session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            await self.session.rollback()
        elif not self.committed:
            await self.session.commit()
            self.committed = True


def get_db_with_context():
    """Get database session with context manager"""
    async def _get_db_context():
        async with AsyncSessionLocal() as session:
            yield DatabaseSession(session)

    return _get_db_context()
