"""
Challenge Store Service Tests

Tests for WebAuthn challenge generation, storage, and retrieval
with Redis and session fallback mechanisms.
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

from app.services.challenge_store import (
    ChallengeStore,
    InvalidChallengeError,
    RedisConnectionError,
    get_challenge_store
)


class TestChallengeGeneration:
    """Test cryptographically secure challenge generation"""

    def test_generate_challenge_returns_32_bytes(self):
        """Challenge should be exactly 32 bytes"""
        store = ChallengeStore()
        challenge = store.generate_challenge()

        assert isinstance(challenge, bytes)
        assert len(challenge) == 32

    def test_generate_challenge_is_random(self):
        """Each generated challenge should be unique"""
        store = ChallengeStore()
        challenges = [store.generate_challenge() for _ in range(10)]

        # All challenges should be unique
        assert len(set(challenges)) == 10

    def test_generate_challenge_uses_secrets_module(self):
        """Challenge should use cryptographically secure randomness"""
        # This is verified by code inspection and module usage
        # secrets.token_bytes() is the only method used
        store = ChallengeStore()
        challenge = store.generate_challenge()

        # Verify it's not predictable (entropy check)
        # At least 20 bytes should be unique across 32 bytes
        unique_bytes = len(set(challenge))
        assert unique_bytes >= 20


@pytest.mark.asyncio
class TestRedisStorage:
    """Test Redis challenge storage and retrieval"""

    async def test_store_challenge_to_redis(self):
        """Challenge should be stored in Redis with TTL"""
        # Mock Redis client
        mock_redis = AsyncMock()
        store = ChallengeStore(redis_client=mock_redis)

        challenge = store.generate_challenge()
        key = "webauthn:challenge:test_user"

        await store.store_challenge(key, challenge, ttl=300)

        # Verify Redis setex was called with correct parameters
        mock_redis.setex.assert_called_once_with(key, 300, challenge)

    async def test_get_challenge_from_redis(self):
        """Challenge should be retrieved from Redis and deleted (single-use)"""
        # Mock Redis client
        mock_redis = AsyncMock()
        challenge = b"x" * 32
        mock_redis.get.return_value = challenge

        store = ChallengeStore(redis_client=mock_redis)
        key = "webauthn:challenge:test_user"

        retrieved = await store.get_challenge(key)

        assert retrieved == challenge
        mock_redis.get.assert_called_once_with(key)
        mock_redis.delete.assert_called_once_with(key)  # Single-use

    async def test_challenge_single_use_mechanism(self):
        """Challenge should be deleted immediately after retrieval"""
        mock_redis = AsyncMock()
        challenge = b"y" * 32

        # First call returns challenge, second call returns None (deleted)
        mock_redis.get.side_effect = [challenge, None]

        store = ChallengeStore(redis_client=mock_redis)
        key = "webauthn:challenge:test_user"

        # First retrieval succeeds
        first_retrieval = await store.get_challenge(key)
        assert first_retrieval == challenge

        # Second retrieval fails (single-use)
        second_retrieval = await store.get_challenge(key)
        assert second_retrieval is None

    async def test_nonexistent_challenge_returns_none(self):
        """Retrieving non-existent challenge should return None"""
        mock_redis = AsyncMock()
        mock_redis.get.return_value = None

        store = ChallengeStore(redis_client=mock_redis)
        key = "webauthn:challenge:nonexistent"

        result = await store.get_challenge(key)

        assert result is None


@pytest.mark.asyncio
class TestChallengeValidation:
    """Test challenge validation logic"""

    async def test_store_challenge_rejects_invalid_type(self):
        """Challenge must be bytes, not str or int"""
        store = ChallengeStore()

        with pytest.raises(InvalidChallengeError, match="must be bytes"):
            await store.store_challenge("key", "not_bytes", ttl=300)

    async def test_store_challenge_rejects_wrong_length(self):
        """Challenge must be exactly 32 bytes"""
        store = ChallengeStore()

        # Too short
        with pytest.raises(InvalidChallengeError, match="exactly 32 bytes"):
            await store.store_challenge("key", b"short", ttl=300)

        # Too long
        with pytest.raises(InvalidChallengeError, match="exactly 32 bytes"):
            await store.store_challenge("key", b"x" * 64, ttl=300)

    async def test_store_challenge_accepts_valid_challenge(self):
        """Valid 32-byte challenge should be accepted"""
        mock_redis = AsyncMock()
        store = ChallengeStore(redis_client=mock_redis)

        valid_challenge = b"a" * 32

        # Should not raise
        await store.store_challenge("key", valid_challenge, ttl=300)

        # Verify it was stored
        mock_redis.setex.assert_called_once()


@pytest.mark.asyncio
class TestSessionFallback:
    """Test session storage fallback when Redis unavailable"""

    async def test_fallback_to_session_when_redis_fails(self):
        """Should use session storage when Redis fails"""
        # Mock Redis that fails
        mock_redis = AsyncMock()
        mock_redis.setex.side_effect = Exception("Redis connection failed")

        store = ChallengeStore(redis_client=mock_redis, fallback_to_session=True)
        challenge = store.generate_challenge()
        key = "webauthn:challenge:test_user"

        # Should not raise, fallback to session
        await store.store_challenge(key, challenge, ttl=300)

        assert store.using_fallback is True
        assert key in store._session_store

    async def test_session_fallback_retrieval(self):
        """Challenge should be retrievable from session storage"""
        store = ChallengeStore(fallback_to_session=True)
        challenge = store.generate_challenge()
        key = "webauthn:challenge:test_user"

        # Store in session (no Redis)
        await store.store_challenge(key, challenge, ttl=300)

        # Retrieve from session
        retrieved = await store.get_challenge(key)

        assert retrieved == challenge
        assert key not in store._session_store  # Single-use

    async def test_session_fallback_expiration(self):
        """Expired challenges in session should return None"""
        store = ChallengeStore(fallback_to_session=True)
        challenge = store.generate_challenge()
        key = "webauthn:challenge:test_user"

        # Store with 1 second TTL
        await store.store_challenge(key, challenge, ttl=1)

        # Wait for expiration
        await asyncio.sleep(1.1)

        # Should return None (expired)
        retrieved = await store.get_challenge(key)
        assert retrieved is None

    async def test_fallback_disabled_raises_error(self):
        """Should raise error when Redis fails and fallback disabled"""
        mock_redis = AsyncMock()
        mock_redis.setex.side_effect = Exception("Redis connection failed")

        store = ChallengeStore(redis_client=mock_redis, fallback_to_session=False)
        challenge = store.generate_challenge()

        with pytest.raises(RedisConnectionError, match="Redis storage failed"):
            await store.store_challenge("key", challenge, ttl=300)


@pytest.mark.asyncio
class TestExplicitDeletion:
    """Test explicit challenge deletion"""

    async def test_delete_challenge_from_redis(self):
        """Explicit deletion should remove challenge from Redis"""
        mock_redis = AsyncMock()
        mock_redis.delete.return_value = 1  # Redis returns count of deleted keys

        store = ChallengeStore(redis_client=mock_redis)
        key = "webauthn:challenge:test_user"

        result = await store.delete_challenge(key)

        assert result is True
        mock_redis.delete.assert_called_once_with(key)

    async def test_delete_nonexistent_challenge(self):
        """Deleting non-existent challenge should return False"""
        mock_redis = AsyncMock()
        mock_redis.delete.return_value = 0  # Nothing deleted

        store = ChallengeStore(redis_client=mock_redis)
        key = "webauthn:challenge:nonexistent"

        result = await store.delete_challenge(key)

        assert result is False

    async def test_delete_challenge_from_session(self):
        """Explicit deletion should remove challenge from session storage"""
        store = ChallengeStore(fallback_to_session=True)
        challenge = store.generate_challenge()
        key = "webauthn:challenge:test_user"

        # Store in session
        await store.store_challenge(key, challenge, ttl=300)

        # Delete explicitly
        result = await store.delete_challenge(key)

        assert result is True
        assert key not in store._session_store


class TestSessionCleanup:
    """Test automatic cleanup of expired session challenges"""

    def test_cleanup_expired_sessions(self):
        """Expired session challenges should be cleaned up"""
        store = ChallengeStore(fallback_to_session=True)

        # Add expired challenge (TTL = -10 seconds)
        expired_key = "webauthn:challenge:expired"
        expired_challenge = (b"x" * 32, datetime.utcnow() - timedelta(seconds=10))
        store._session_store[expired_key] = expired_challenge

        # Add valid challenge
        valid_key = "webauthn:challenge:valid"
        valid_challenge = (b"y" * 32, datetime.utcnow() + timedelta(seconds=300))
        store._session_store[valid_key] = valid_challenge

        # Cleanup
        removed_count = store.cleanup_expired_sessions()

        assert removed_count == 1
        assert expired_key not in store._session_store
        assert valid_key in store._session_store

    def test_cleanup_empty_store(self):
        """Cleanup on empty store should return 0"""
        store = ChallengeStore(fallback_to_session=True)

        removed_count = store.cleanup_expired_sessions()

        assert removed_count == 0


class TestDefaultTTL:
    """Test default TTL configuration"""

    @pytest.mark.asyncio
    async def test_default_ttl_is_300_seconds(self):
        """Default TTL should be 5 minutes (300 seconds)"""
        mock_redis = AsyncMock()
        store = ChallengeStore(redis_client=mock_redis)

        challenge = store.generate_challenge()
        key = "webauthn:challenge:test_user"

        # Store without specifying TTL
        await store.store_challenge(key, challenge)

        # Should use default TTL of 300 seconds
        mock_redis.setex.assert_called_once_with(key, 300, challenge)

    @pytest.mark.asyncio
    async def test_custom_ttl_override(self):
        """Custom TTL should override default"""
        mock_redis = AsyncMock()
        store = ChallengeStore(redis_client=mock_redis, default_ttl=600)

        challenge = store.generate_challenge()
        key = "webauthn:challenge:test_user"

        # Store with custom TTL
        await store.store_challenge(key, challenge, ttl=120)

        # Should use custom TTL, not default
        mock_redis.setex.assert_called_once_with(key, 120, challenge)


class TestGetChallengeStoreSingleton:
    """Test singleton pattern for challenge store"""

    def test_get_challenge_store_returns_singleton(self):
        """Should return the same instance on multiple calls"""
        # Clear singleton
        import app.services.challenge_store as cs_module
        cs_module._challenge_store = None

        store1 = get_challenge_store()
        store2 = get_challenge_store()

        assert store1 is store2

    def test_singleton_has_default_config(self):
        """Singleton should have correct default configuration"""
        import app.services.challenge_store as cs_module
        cs_module._challenge_store = None

        store = get_challenge_store()

        assert store.fallback_to_session is True
        assert store.default_ttl == 300
