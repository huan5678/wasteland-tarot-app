"""
Redis 客戶端管理模組

提供統一的 Redis 連線管理和降級策略。
當 Redis 不可用時，相關服務會自動降級到資料庫或無快取模式。

環境變數：
    REDIS_URL: Redis 連線 URL (預設: redis://localhost:6379/0)
    REDIS_ENABLED: 是否啟用 Redis (預設: true)

使用範例：
    ```python
    from app.core.redis import get_redis_client

    redis_client = get_redis_client()
    if redis_client:
        # 使用 Redis
        await redis_client.set("key", "value")
    else:
        # 降級處理（使用資料庫或跳過快取）
        pass
    ```
"""

import logging
import os
from typing import Optional

try:
    from redis.asyncio import Redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    Redis = None

logger = logging.getLogger(__name__)

# 全域 Redis 客戶端實例（單例模式）
_redis_client: Optional[Redis] = None
_redis_initialized = False


def get_redis_client() -> Optional[Redis]:
    """
    獲取 Redis 客戶端（同步版本，用於非 async 上下文）

    Returns:
        Redis 客戶端實例，如果 Redis 不可用則回傳 None（降級）

    Note:
        此函式在非 async 上下文中使用，實際連線檢測會延遲到首次使用時。
        對於 async 上下文，應使用 get_async_redis_client()。
    """
    global _redis_client, _redis_initialized

    # 檢查是否已初始化
    if _redis_initialized:
        return _redis_client

    # 檢查 redis 套件是否可用
    if not REDIS_AVAILABLE:
        logger.warning("⚠️  Redis package not installed, services will use degraded mode")
        _redis_initialized = True
        _redis_client = None
        return None

    # 檢查是否啟用 Redis
    redis_enabled = os.getenv("REDIS_ENABLED", "true").lower() == "true"
    if not redis_enabled:
        logger.warning("⚠️  Redis is disabled via REDIS_ENABLED=false")
        _redis_initialized = True
        _redis_client = None
        return None

    # 建立 Redis 客戶端（連線檢測會延遲到首次使用）
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    try:
        _redis_client = Redis.from_url(
            redis_url,
            decode_responses=True,
            encoding="utf-8",
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30
        )
        logger.info(f"✅ Redis client configured: {redis_url}")
        _redis_initialized = True
        return _redis_client
    except Exception as e:
        logger.error(f"❌ Failed to configure Redis client: {e}")
        logger.warning("⚠️  Redis services will be degraded (using fallback)")
        _redis_initialized = True
        _redis_client = None
        return None


async def get_async_redis_client() -> Optional[Redis]:
    """
    獲取 Redis 客戶端並測試連線（async 版本）

    Returns:
        Redis 客戶端實例，如果 Redis 不可用則回傳 None（降級）

    Note:
        此函式會實際測試 Redis 連線，只應在 async 上下文中使用。
    """
    client = get_redis_client()

    if client is None:
        return None

    # 測試連線
    try:
        await client.ping()
        logger.debug("Redis connection test successful")
        return client
    except Exception as e:
        logger.error(f"❌ Redis connection test failed: {e}")
        logger.warning("⚠️  Redis services will be degraded (using fallback)")
        return None


async def close_redis_client():
    """
    關閉 Redis 客戶端

    Note:
        通常在應用程式關閉時呼叫（FastAPI shutdown event）
    """
    global _redis_client, _redis_initialized

    if _redis_client is not None:
        try:
            await _redis_client.close()
            logger.info("✅ Redis client closed")
        except Exception as e:
            logger.warning(f"⚠️  Error closing Redis client: {e}")
        finally:
            _redis_client = None
            _redis_initialized = False


def reset_redis_client():
    """
    重置 Redis 客戶端（測試用）

    Warning:
        僅供測試使用，不應在生產環境中呼叫
    """
    global _redis_client, _redis_initialized
    _redis_client = None
    _redis_initialized = False
    logger.debug("Redis client reset (test mode)")
