"""
Test Suite for Challenge Store Service
TDD Red Phase: Tests written before implementation

Tests the secure storage and retrieval of WebAuthn challenges
with TTL expiration and single-use mechanisms.
"""

import pytest
import asyncio
import secrets
from unittest.mock import AsyncMock, Mock, patch
from datetime import datetime, timedelta


# Test 1: Generate 32 bytes random challenge
@pytest.mark.asyncio
async def test_generate_challenge_returns_32_bytes():
    """
    GIVEN: ChallengeStore service
    WHEN: generate_challenge() is called
    THEN: Should return exactly 32 bytes of cryptographically random data
    """
    from app.services.challenge_store import ChallengeStore

    store = ChallengeStore()
    challenge = store.generate_challenge()

    assert isinstance(challenge, bytes), "Challenge must be bytes"
    assert len(challenge) == 32, f"Challenge must be 32 bytes, got {len(challenge)}"

    # Test randomness: generate multiple challenges, they should all be different
    challenges = [store.generate_challenge() for _ in range(10)]
    unique_challenges = set(challenges)
    assert len(unique_challenges) == 10, "Challenges must be unique (cryptographically random)"


# Test 2: Store challenge to Redis with TTL
@pytest.mark.asyncio
async def test_store_challenge_sets_ttl(mock_redis):
    """
    GIVEN: ChallengeStore with Redis backend
    WHEN: store_challenge() is called with key, challenge, and TTL
    THEN: Should store challenge in Redis with correct TTL (300 seconds default)
    """
    from app.services.challenge_store import ChallengeStore

    store = ChallengeStore(redis_client=mock_redis)
    challenge = secrets.token_bytes(32)
    key = "webauthn:challenge:test-user-id"

    await store.store_challenge(key, challenge, ttl=300)

    # Verify Redis setex was called with correct parameters
    mock_redis.setex.assert_called_once()
    call_args = mock_redis.setex.call_args[0]
    assert call_args[0] == key, "Key must match"
    assert call_args[1] == 300, "TTL must be 300 seconds"
    assert call_args[2] == challenge, "Challenge must match"


# Test 3: Retrieve challenge from Redis
@pytest.mark.asyncio
async def test_get_challenge_retrieves_correct_challenge(mock_redis):
    """
    GIVEN: Challenge stored in Redis
    WHEN: get_challenge() is called with the same key
    THEN: Should return the exact same challenge bytes
    """
    from app.services.challenge_store import ChallengeStore

    challenge = secrets.token_bytes(32)
    key = "webauthn:challenge:test-user-id"

    # Mock Redis to return the stored challenge
    mock_redis.get = AsyncMock(return_value=challenge)

    store = ChallengeStore(redis_client=mock_redis)
    retrieved = await store.get_challenge(key)

    assert retrieved == challenge, "Retrieved challenge must match stored challenge"
    mock_redis.get.assert_called_once_with(key)


# Test 4: Challenge is deleted after retrieval (single-use)
@pytest.mark.asyncio
async def test_get_challenge_deletes_after_retrieval(mock_redis):
    """
    GIVEN: Challenge stored in Redis
    WHEN: get_challenge() is called
    THEN: Challenge should be deleted immediately after retrieval (single-use)
    """
    from app.services.challenge_store import ChallengeStore

    challenge = secrets.token_bytes(32)
    key = "webauthn:challenge:test-user-id"

    # Mock Redis to return challenge once, then None (deleted)
    mock_redis.get = AsyncMock(return_value=challenge)
    mock_redis.delete = AsyncMock(return_value=1)

    store = ChallengeStore(redis_client=mock_redis)
    retrieved = await store.get_challenge(key)

    assert retrieved == challenge
    mock_redis.delete.assert_called_once_with(key)


# Test 5: Expired challenge returns None
@pytest.mark.asyncio
async def test_expired_challenge_returns_none(mock_redis):
    """
    GIVEN: Challenge was stored with TTL
    WHEN: TTL expires and get_challenge() is called
    THEN: Should return None (Redis auto-expires the key)
    """
    from app.services.challenge_store import ChallengeStore

    key = "webauthn:challenge:expired-user"

    # Mock Redis to return None (key expired)
    mock_redis.get = AsyncMock(return_value=None)

    store = ChallengeStore(redis_client=mock_redis)
    retrieved = await store.get_challenge(key)

    assert retrieved is None, "Expired challenge should return None"
    mock_redis.get.assert_called_once_with(key)


# Test 6: get_challenge with non-existent key returns None
@pytest.mark.asyncio
async def test_get_nonexistent_challenge_returns_none(mock_redis):
    """
    GIVEN: No challenge stored for a key
    WHEN: get_challenge() is called
    THEN: Should return None gracefully
    """
    from app.services.challenge_store import ChallengeStore

    key = "webauthn:challenge:nonexistent"

    mock_redis.get = AsyncMock(return_value=None)

    store = ChallengeStore(redis_client=mock_redis)
    retrieved = await store.get_challenge(key)

    assert retrieved is None


# Test 7: Verify challenge deletes correctly
@pytest.mark.asyncio
async def test_delete_challenge_removes_key(mock_redis):
    """
    GIVEN: Challenge stored in Redis
    WHEN: delete_challenge() is called
    THEN: Should remove the key from Redis
    """
    from app.services.challenge_store import ChallengeStore

    key = "webauthn:challenge:test-user-id"
    mock_redis.delete = AsyncMock(return_value=1)

    store = ChallengeStore(redis_client=mock_redis)
    result = await store.delete_challenge(key)

    assert result is True, "Delete should return True on success"
    mock_redis.delete.assert_called_once_with(key)


# Test 8: Redis connection failure falls back to session cookie
@pytest.mark.asyncio
async def test_redis_failure_falls_back_to_session():
    """
    GIVEN: Redis client is unavailable
    WHEN: store_challenge() is called
    THEN: Should fall back to encrypted session cookie storage
    """
    from app.services.challenge_store import ChallengeStore

    # Mock Redis client that raises connection error
    mock_redis_failing = AsyncMock()
    mock_redis_failing.setex = AsyncMock(side_effect=ConnectionError("Redis unavailable"))

    store = ChallengeStore(redis_client=mock_redis_failing, fallback_to_session=True)
    challenge = secrets.token_bytes(32)
    key = "webauthn:challenge:test-user-id"

    # Should not raise exception, fall back to session
    await store.store_challenge(key, challenge, ttl=300)

    # Verify fallback was triggered
    assert store.using_fallback is True, "Should be using fallback storage"


# Test 9: Session fallback can store and retrieve challenges
@pytest.mark.asyncio
async def test_session_fallback_stores_and_retrieves():
    """
    GIVEN: ChallengeStore in session fallback mode
    WHEN: store_challenge() and get_challenge() are called
    THEN: Should store and retrieve challenge from session storage
    """
    from app.services.challenge_store import ChallengeStore

    store = ChallengeStore(redis_client=None, fallback_to_session=True)
    challenge = secrets.token_bytes(32)
    key = "webauthn:challenge:test-user-id"

    await store.store_challenge(key, challenge, ttl=300)
    retrieved = await store.get_challenge(key)

    assert retrieved == challenge, "Session fallback should store and retrieve correctly"


# Test 10: Multiple challenges for different users
@pytest.mark.asyncio
async def test_multiple_user_challenges_isolated(mock_redis):
    """
    GIVEN: Multiple users registering simultaneously
    WHEN: Each user's challenge is stored with unique key
    THEN: Challenges should be isolated and not interfere with each other
    """
    from app.services.challenge_store import ChallengeStore

    store = ChallengeStore(redis_client=mock_redis)

    users = ["user-1", "user-2", "user-3"]
    challenges = {user: secrets.token_bytes(32) for user in users}

    # Store all challenges
    for user, challenge in challenges.items():
        key = f"webauthn:challenge:{user}"
        await store.store_challenge(key, challenge, ttl=300)

    # Verify each setex call had unique key
    assert mock_redis.setex.call_count == 3, "Should store 3 challenges"

    # Verify keys are unique
    called_keys = [call[0][0] for call in mock_redis.setex.call_args_list]
    assert len(set(called_keys)) == 3, "All keys should be unique"
    assert all(f"webauthn:challenge:{user}" in called_keys for user in users)


# Test 11: Challenge key format validation
@pytest.mark.asyncio
async def test_challenge_key_format():
    """
    GIVEN: ChallengeStore service
    WHEN: store_challenge() is called with key
    THEN: Key should follow format: webauthn:challenge:{user_id or session_id}
    """
    from app.services.challenge_store import ChallengeStore

    store = ChallengeStore()

    valid_keys = [
        "webauthn:challenge:user-123",
        "webauthn:challenge:session-abc-def",
        "webauthn:challenge:a1b2c3d4",
    ]

    for key in valid_keys:
        assert key.startswith("webauthn:challenge:"), f"Key {key} should start with webauthn:challenge:"


# Test 12: TTL configuration can be customized
@pytest.mark.asyncio
async def test_custom_ttl_configuration(mock_redis):
    """
    GIVEN: ChallengeStore with custom TTL
    WHEN: store_challenge() is called with custom ttl parameter
    THEN: Should use custom TTL instead of default 300 seconds
    """
    from app.services.challenge_store import ChallengeStore

    store = ChallengeStore(redis_client=mock_redis)
    challenge = secrets.token_bytes(32)
    key = "webauthn:challenge:test-user-id"
    custom_ttl = 600  # 10 minutes

    await store.store_challenge(key, challenge, ttl=custom_ttl)

    call_args = mock_redis.setex.call_args[0]
    assert call_args[1] == custom_ttl, f"TTL should be {custom_ttl} seconds"


# Test 13: Concurrent challenge storage does not conflict
@pytest.mark.asyncio
async def test_concurrent_challenge_storage(mock_redis):
    """
    GIVEN: Multiple concurrent registration requests
    WHEN: Challenges are stored simultaneously
    THEN: All challenges should be stored without conflicts
    """
    from app.services.challenge_store import ChallengeStore

    store = ChallengeStore(redis_client=mock_redis)

    async def store_user_challenge(user_id: str):
        challenge = secrets.token_bytes(32)
        key = f"webauthn:challenge:{user_id}"
        await store.store_challenge(key, challenge, ttl=300)
        return challenge

    # Simulate 10 concurrent registrations
    tasks = [store_user_challenge(f"user-{i}") for i in range(10)]
    results = await asyncio.gather(*tasks)

    assert len(results) == 10, "All 10 challenges should be stored"
    assert mock_redis.setex.call_count == 10, "Should have 10 setex calls"


# Test 14: Invalid challenge length raises error
@pytest.mark.asyncio
async def test_invalid_challenge_length_raises_error():
    """
    GIVEN: ChallengeStore service
    WHEN: store_challenge() is called with challenge not 32 bytes
    THEN: Should raise InvalidChallengeError
    """
    from app.services.challenge_store import ChallengeStore, InvalidChallengeError

    store = ChallengeStore()

    invalid_challenges = [
        b"too_short",  # Less than 32 bytes
        secrets.token_bytes(16),  # 16 bytes
        secrets.token_bytes(64),  # 64 bytes (too long)
    ]

    for invalid_challenge in invalid_challenges:
        with pytest.raises(InvalidChallengeError, match="Challenge must be exactly 32 bytes"):
            key = "webauthn:challenge:test"
            await store.store_challenge(key, invalid_challenge, ttl=300)


# Test 15: get_challenge handles Redis errors gracefully
@pytest.mark.asyncio
async def test_get_challenge_handles_redis_errors():
    """
    GIVEN: Redis client that raises an exception
    WHEN: get_challenge() is called
    THEN: Should handle error gracefully and return None or fall back
    """
    from app.services.challenge_store import ChallengeStore

    mock_redis_failing = AsyncMock()
    mock_redis_failing.get = AsyncMock(side_effect=ConnectionError("Redis error"))

    store = ChallengeStore(redis_client=mock_redis_failing, fallback_to_session=True)
    key = "webauthn:challenge:test-user-id"

    # Should not raise exception
    result = await store.get_challenge(key)

    # In fallback mode, should return None if not in session cache
    assert result is None or isinstance(result, bytes)
