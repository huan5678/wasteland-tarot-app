"""
Caching utilities for API responses
Simple in-memory cache with TTL support
"""

import time
import hashlib
import json
from typing import Any, Optional, Callable
from functools import wraps
from collections import OrderedDict


class SimpleCache:
    """
    Simple in-memory LRU cache with TTL
    For production, consider Redis or Memcached
    """

    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.default_ttl = default_ttl

    def _generate_key(self, *args, **kwargs) -> str:
        """Generate cache key from function arguments"""
        key_data = {
            'args': args,
            'kwargs': kwargs
        }
        key_string = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_string.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key not in self.cache:
            return None

        value, expiry = self.cache[key]

        # Check if expired
        if time.time() > expiry:
            del self.cache[key]
            return None

        # Move to end (LRU)
        self.cache.move_to_end(key)
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache with TTL"""
        if ttl is None:
            ttl = self.default_ttl

        expiry = time.time() + ttl

        # If cache is full, remove oldest
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)

        self.cache[key] = (value, expiry)

    def delete(self, key: str):
        """Delete key from cache"""
        self.cache.pop(key, None)

    def clear(self):
        """Clear all cache"""
        self.cache.clear()

    def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern"""
        keys_to_delete = [k for k in self.cache.keys() if pattern in k]
        for key in keys_to_delete:
            del self.cache[key]


# Global cache instance
_cache = SimpleCache(max_size=1000, default_ttl=300)


def get_cache() -> SimpleCache:
    """Get global cache instance"""
    return _cache


def cached(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator for caching function results

    Usage:
        @cached(ttl=60, key_prefix="user")
        async def get_user_data(user_id: str):
            # expensive operation
            return data
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            cache = get_cache()

            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{cache._generate_key(*args, **kwargs)}"

            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function
            result = await func(*args, **kwargs)

            # Store in cache
            cache.set(cache_key, result, ttl=ttl)

            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            cache = get_cache()

            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{cache._generate_key(*args, **kwargs)}"

            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function
            result = func(*args, **kwargs)

            # Store in cache
            cache.set(cache_key, result, ttl=ttl)

            return result

        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def invalidate_cache(pattern: str):
    """Invalidate cache entries matching pattern"""
    cache = get_cache()
    cache.invalidate_pattern(pattern)


def clear_cache():
    """Clear all cache"""
    cache = get_cache()
    cache.clear()


# Cache statistics
def get_cache_stats() -> dict:
    """Get cache statistics"""
    cache = get_cache()
    return {
        "size": len(cache.cache),
        "max_size": cache.max_size,
        "default_ttl": cache.default_ttl
    }
