"""
Database connection and session management for Wasteland Tarot API
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import event
from app.config import settings
import logging
import uuid

logger = logging.getLogger(__name__)

# Supabase-optimized connection arguments
connect_args = {
    "server_settings": {
        "application_name": "wasteland_tarot_api",
        "search_path": "public",
    },
    "command_timeout": 30,
    "timeout": 60,  # Connection close timeout (default: 10s, increased to 60s)
    "statement_cache_size": 0,  # Disable statement cache for Supabase (PgBouncer)
    "prepared_statement_cache_size": 0,  # Disable prepared statements for Supabase
    # Generate unique prepared statement names to avoid PgBouncer conflicts
    "prepared_statement_name_func": lambda: f"__pstmt_{uuid.uuid4().hex[:8]}__"
}

# Create async engine with Supabase PostgreSQL optimizations
# Add prepared_statement_name_func to fully disable prepared statements for PgBouncer
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Always disable SQL logging for performance
    pool_pre_ping=True,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_recycle=3600,  # Recycle connections every hour
    pool_timeout=30,
    poolclass=NullPool if settings.environment == "testing" else None,
    connect_args=connect_args,
    # Critical fix for Supabase PgBouncer: disable prepared statement caching entirely
    execution_options={"compiled_cache": None}
)

# Add event listener for connection testing
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    # This ensures the connection is properly configured
    if settings.environment != "testing":
        logger.info("Database connection established successfully")

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    session = AsyncSessionLocal()
    try:
        yield session
        # Commit successful transactions
        await session.commit()
    except Exception:
        # Rollback on error
        await session.rollback()
        raise
    finally:
        # Close session (returns connection to pool)
        await session.close()


async def init_db():
    """Initialize database - create all tables"""
    from app.models.base import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def check_db_connection():
    """Check database connection health"""
    try:
        async with engine.connect() as conn:
            from sqlalchemy.sql import text
            result = await conn.execute(text("SELECT 1"))
            await result.fetchone()
            logger.info("✅ Database connection successful")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        # For now, we'll work with Supabase client directly
        logger.info("🔄 Attempting to use Supabase client as fallback...")
        return False


async def get_db_info():
    """Get database information for debugging"""
    try:
        async with engine.connect() as conn:
            result = await conn.execute("SELECT version()")
            version = await result.fetchone()
            logger.info(f"Database version: {version[0]}")
            return version[0]
    except Exception as e:
        logger.error(f"Failed to get database info: {e}")
        return None


def get_pool_class():
    """Get appropriate pool class based on environment"""
    from sqlalchemy.pool import StaticPool
    if settings.environment == "test":
        # Use StaticPool for testing (single connection)
        return StaticPool
    elif settings.database_url and "sqlite" in settings.database_url:
        # SQLite doesn't support connection pooling well
        return NullPool
    else:
        # Use AsyncAdaptedQueuePool for PostgreSQL (async-compatible)
        from sqlalchemy.pool import AsyncAdaptedQueuePool
        return AsyncAdaptedQueuePool


def create_engine_with_pool():
    """
    Create database engine with optimized connection pool.
    This function exists for testing purposes. Production code should use the module-level engine.
    """
    from sqlalchemy.pool import AsyncAdaptedQueuePool
    pool_class = get_pool_class()

    # Connection pool settings
    pool_settings = {
        "poolclass": pool_class,
    }

    # Only add pool parameters for AsyncAdaptedQueuePool
    if pool_class == AsyncAdaptedQueuePool:
        pool_settings.update({
            "pool_size": settings.database_pool_size,
            "max_overflow": settings.database_max_overflow,
            "pool_timeout": 30,
            "pool_recycle": 3600,
            "pool_pre_ping": True,
            "echo_pool": False,
        })

    test_engine = create_async_engine(
        settings.database_url,
        **pool_settings,
        echo=settings.debug,
        future=True,
        connect_args=connect_args if "postgresql" in settings.database_url else {}
    )

    logger.info(
        f"Database engine created with {pool_class.__name__} "
        f"(pool_size={pool_settings.get('pool_size', 'N/A')})"
    )

    return test_engine


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


async def check_database_health() -> dict:
    """Check database connection health"""
    try:
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            # Simple query to test connection
            result = await session.execute(text("SELECT 1"))
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


async def close_db_connections():
    """Close all database connections"""
    await engine.dispose()
    logger.info("Database connections closed")