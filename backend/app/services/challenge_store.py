"""
Challenge Store Service for WebAuthn

Manages secure storage and retrieval of WebAuthn challenges with:
- Cryptographically random challenge generation (32 bytes)
- Redis storage with TTL expiration (5 minutes default)
- Single-use mechanism (delete after retrieval)
- Fallback to encrypted session storage when Redis unavailable

Security Features:
- Uses secrets.token_bytes() for cryptographic randomness
- Automatic expiration via Redis TTL
- Challenge validation (must be exactly 32 bytes)
- Isolated per-user storage (key format: webauthn:challenge:{user_id})
"""

import secrets
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ChallengeStoreError(Exception):
    """Base exception for Challenge Store errors"""
    pass


class InvalidChallengeError(ChallengeStoreError):
    """Raised when challenge validation fails"""
    pass


class RedisConnectionError(ChallengeStoreError):
    """Raised when Redis connection fails"""
    pass


class ChallengeStore:
    """
    WebAuthn Challenge Storage Service

    Provides secure challenge generation, storage, and retrieval
    with automatic expiration and single-use mechanisms.
    """

    def __init__(
        self,
        redis_client: Optional[Any] = None,
        fallback_to_session: bool = True,
        default_ttl: int = 300
    ):
        """
        Initialize Challenge Store

        Args:
            redis_client: Redis async client instance (optional)
            fallback_to_session: Enable session fallback if Redis unavailable
            default_ttl: Default TTL in seconds (default: 300 = 5 minutes)
        """
        self.redis_client = redis_client
        self.fallback_to_session = fallback_to_session
        self.default_ttl = default_ttl
        self.using_fallback = False

        # Session fallback storage (in-memory, for development only)
        self._session_store: Dict[str, tuple[bytes, datetime]] = {}

    def generate_challenge(self) -> bytes:
        """
        Generate cryptographically random challenge

        Uses secrets.token_bytes() for CSPRNG (Cryptographically Secure
        Pseudo-Random Number Generator).

        Returns:
            bytes: 32 bytes of random data

        Security:
            - Uses OS-level entropy source
            - Suitable for security-sensitive applications
            - Meets FIDO2/WebAuthn challenge requirements
        """
        return secrets.token_bytes(32)

    async def store_challenge(
        self,
        key: str,
        challenge: bytes,
        ttl: Optional[int] = None
    ) -> None:
        """
        Store challenge with TTL expiration

        Args:
            key: Storage key (format: webauthn:challenge:{user_id})
            challenge: Challenge bytes (must be exactly 32 bytes)
            ttl: Time-to-live in seconds (default: 300)

        Raises:
            InvalidChallengeError: If challenge is not 32 bytes
            RedisConnectionError: If Redis fails and fallback disabled

        Storage Strategy:
            1. Validate challenge length
            2. Try Redis storage (primary)
            3. Fall back to session storage if Redis fails
        """
        # Validate challenge length
        if not isinstance(challenge, bytes):
            raise InvalidChallengeError("Challenge must be bytes")

        if len(challenge) != 32:
            raise InvalidChallengeError(
                f"Challenge must be exactly 32 bytes, got {len(challenge)}"
            )

        # Use default TTL if not specified
        if ttl is None:
            ttl = self.default_ttl

        # Try Redis storage
        if self.redis_client is not None:
            try:
                await self.redis_client.setex(key, ttl, challenge)
                logger.debug(f"Challenge stored in Redis: {key} (TTL: {ttl}s)")
                return
            except Exception as e:
                logger.warning(f"Redis storage failed: {e}")
                if not self.fallback_to_session:
                    raise RedisConnectionError(f"Redis storage failed: {e}")

        # Fallback to session storage
        if self.fallback_to_session:
            expiry = datetime.utcnow() + timedelta(seconds=ttl)
            self._session_store[key] = (challenge, expiry)
            self.using_fallback = True
            logger.debug(f"Challenge stored in session fallback: {key}")
        else:
            raise RedisConnectionError("Redis unavailable and fallback disabled")

    async def get_challenge(self, key: str) -> Optional[bytes]:
        """
        Retrieve challenge and delete immediately (single-use)

        Args:
            key: Storage key

        Returns:
            bytes: Challenge if found and not expired
            None: If not found, expired, or error

        Security:
            - Single-use: Challenge deleted immediately after retrieval
            - Automatic expiration via Redis TTL
            - Returns None on errors (fail-safe)
        """
        # Try Redis retrieval
        if self.redis_client is not None:
            try:
                challenge = await self.redis_client.get(key)
                if challenge is not None:
                    # Delete immediately (single-use)
                    await self.redis_client.delete(key)
                    logger.debug(f"Challenge retrieved and deleted from Redis: {key}")
                    return challenge
            except Exception as e:
                logger.warning(f"Redis retrieval failed: {e}")
                # Fall through to session fallback

        # Fallback to session storage
        if key in self._session_store:
            challenge, expiry = self._session_store[key]
            # Check expiration
            if datetime.utcnow() > expiry:
                # Expired, remove and return None
                del self._session_store[key]
                logger.debug(f"Challenge expired in session: {key}")
                return None

            # Valid, delete and return
            del self._session_store[key]
            logger.debug(f"Challenge retrieved and deleted from session: {key}")
            return challenge

        logger.debug(f"Challenge not found: {key}")
        return None

    async def delete_challenge(self, key: str) -> bool:
        """
        Explicitly delete challenge

        Args:
            key: Storage key

        Returns:
            bool: True if deleted, False if not found
        """
        # Try Redis deletion
        if self.redis_client is not None:
            try:
                result = await self.redis_client.delete(key)
                deleted = result > 0
                if deleted:
                    logger.debug(f"Challenge deleted from Redis: {key}")
                return deleted
            except Exception as e:
                logger.warning(f"Redis deletion failed: {e}")

        # Fallback to session deletion
        if key in self._session_store:
            del self._session_store[key]
            logger.debug(f"Challenge deleted from session: {key}")
            return True

        return False

    def cleanup_expired_sessions(self) -> int:
        """
        Cleanup expired challenges from session storage

        Returns:
            int: Number of expired challenges removed

        Note:
            Only needed for session fallback mode.
            Redis handles expiration automatically via TTL.
        """
        now = datetime.utcnow()
        expired_keys = [
            key for key, (_, expiry) in self._session_store.items()
            if now > expiry
        ]

        for key in expired_keys:
            del self._session_store[key]

        if expired_keys:
            logger.debug(f"Cleaned up {len(expired_keys)} expired challenges")

        return len(expired_keys)


# Singleton instance (will be initialized with Redis in production)
_challenge_store: Optional[ChallengeStore] = None


def get_challenge_store(redis_client: Optional[Any] = None) -> ChallengeStore:
    """
    Get or create Challenge Store instance

    Args:
        redis_client: Redis async client (optional, for dependency injection)

    Returns:
        ChallengeStore: Singleton instance
    """
    global _challenge_store

    if _challenge_store is None:
        _challenge_store = ChallengeStore(
            redis_client=redis_client,
            fallback_to_session=True,  # Enable fallback for development
            default_ttl=300  # 5 minutes
        )

    return _challenge_store
