"""
WebAuthn Test Configuration and Fixtures
Provides fixtures for WebAuthn/FIDO2 passkey testing
"""

import pytest
import secrets
from typing import Dict, Any, Generator
from unittest.mock import Mock, AsyncMock, patch
from uuid import uuid4

# Redis mock for testing
try:
    import fakeredis.aioredis
    HAS_FAKEREDIS = True
except ImportError:
    HAS_FAKEREDIS = False


@pytest.fixture
def webauthn_config() -> Dict[str, Any]:
    """WebAuthn configuration for testing"""
    return {
        "rp_id": "localhost",
        "rp_name": "Wasteland Tarot Test",
        "origin": "http://localhost:3000",
        "challenge_ttl": 300,  # 5 minutes
        "max_credentials_per_user": 10,
    }


@pytest.fixture
def test_challenge() -> bytes:
    """Generate a test challenge (32 bytes)"""
    return secrets.token_bytes(32)


@pytest.fixture
def test_user_id() -> str:
    """Generate a test user ID"""
    return str(uuid4())


@pytest.fixture
def test_credential_id() -> str:
    """Generate a test credential ID (Base64URL encoded)"""
    import base64
    credential_bytes = secrets.token_bytes(32)
    return base64.urlsafe_b64encode(credential_bytes).decode('utf-8').rstrip('=')


@pytest.fixture
async def mock_redis():
    """
    Mock Redis client for testing
    Uses fakeredis if available, otherwise mock
    """
    if HAS_FAKEREDIS:
        redis_client = await fakeredis.aioredis.create_redis_pool()
        yield redis_client
        redis_client.close()
        await redis_client.wait_closed()
    else:
        # Fallback to Mock if fakeredis not available
        mock_redis = AsyncMock()
        mock_redis.setex = AsyncMock(return_value=True)
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.delete = AsyncMock(return_value=1)
        yield mock_redis


@pytest.fixture
def mock_attestation_object() -> str:
    """
    Mock attestation object (Base64URL encoded)
    Simplified for testing - not a real attestation
    """
    import base64
    # Minimal CBOR-like structure for testing
    attestation_bytes = b'\xa3\x63fmt\x64none\x67attStmt\xa0\x68authData\x58\x25' + secrets.token_bytes(37)
    return base64.urlsafe_b64encode(attestation_bytes).decode('utf-8').rstrip('=')


@pytest.fixture
def mock_client_data_json(test_challenge: bytes) -> str:
    """
    Mock client data JSON (Base64URL encoded)
    """
    import base64
    import json

    challenge_b64 = base64.urlsafe_b64encode(test_challenge).decode('utf-8').rstrip('=')
    client_data = {
        "type": "webauthn.create",
        "challenge": challenge_b64,
        "origin": "http://localhost:3000",
        "crossOrigin": False
    }
    client_data_bytes = json.dumps(client_data).encode('utf-8')
    return base64.urlsafe_b64encode(client_data_bytes).decode('utf-8').rstrip('=')


@pytest.fixture
def mock_authenticator_data() -> str:
    """
    Mock authenticator data (Base64URL encoded)
    """
    import base64
    import hashlib

    # RP ID hash (32 bytes)
    rp_id_hash = hashlib.sha256(b"localhost").digest()

    # Flags (1 byte): UP=1, UV=1, BE=1, BS=1, AT=1 (0x45)
    flags = bytes([0x45])

    # Counter (4 bytes)
    counter = bytes([0, 0, 0, 1])

    # AAGUID (16 bytes)
    aaguid = bytes([0] * 16)

    # Credential ID length (2 bytes)
    cred_id_len = bytes([0, 32])

    # Credential ID (32 bytes)
    cred_id = secrets.token_bytes(32)

    # Public key (simplified CBOR structure)
    public_key = secrets.token_bytes(77)

    auth_data = rp_id_hash + flags + counter + aaguid + cred_id_len + cred_id + public_key
    return base64.urlsafe_b64encode(auth_data).decode('utf-8').rstrip('=')


@pytest.fixture
def mock_signature() -> str:
    """
    Mock signature (Base64URL encoded)
    """
    import base64
    signature_bytes = secrets.token_bytes(64)
    return base64.urlsafe_b64encode(signature_bytes).decode('utf-8').rstrip('=')


@pytest.fixture
def mock_registration_options(test_challenge: bytes) -> Dict[str, Any]:
    """
    Mock WebAuthn registration options
    """
    import base64
    challenge_b64 = base64.urlsafe_b64encode(test_challenge).decode('utf-8').rstrip('=')

    return {
        "challenge": challenge_b64,
        "rp": {
            "id": "localhost",
            "name": "Wasteland Tarot Test"
        },
        "user": {
            "id": base64.urlsafe_b64encode(secrets.token_bytes(16)).decode('utf-8').rstrip('='),
            "name": "test@example.com",
            "displayName": "Test User"
        },
        "pubKeyCredParams": [
            {"type": "public-key", "alg": -7},  # ES256
            {"type": "public-key", "alg": -257}  # RS256
        ],
        "timeout": 60000,
        "attestation": "none",
        "authenticatorSelection": {
            "authenticatorAttachment": "platform",
            "requireResidentKey": False,
            "residentKey": "preferred",
            "userVerification": "preferred"
        }
    }


@pytest.fixture
def mock_authentication_options(test_challenge: bytes) -> Dict[str, Any]:
    """
    Mock WebAuthn authentication options
    """
    import base64
    challenge_b64 = base64.urlsafe_b64encode(test_challenge).decode('utf-8').rstrip('=')

    return {
        "challenge": challenge_b64,
        "timeout": 60000,
        "rpId": "localhost",
        "allowCredentials": [],
        "userVerification": "preferred"
    }


@pytest.fixture
def mock_credential_data(test_user_id: str, test_credential_id: str) -> Dict[str, Any]:
    """
    Mock credential database record
    """
    import base64

    return {
        "id": str(uuid4()),
        "user_id": test_user_id,
        "credential_id": test_credential_id,
        "public_key": base64.urlsafe_b64encode(secrets.token_bytes(77)).decode('utf-8'),
        "counter": 0,
        "transports": ["internal"],
        "device_name": "Test Device",
        "aaguid": str(uuid4()),
        "backup_eligible": True,
        "backup_state": False,
        "created_at": "2025-10-27T12:00:00Z",
        "last_used_at": None
    }


@pytest.fixture
def mock_user_data(test_user_id: str) -> Dict[str, Any]:
    """
    Mock user database record
    """
    return {
        "id": test_user_id,
        "email": "test@example.com",
        "name": "Test User",
        "karma": 0,
        "last_login_method": None,
        "created_at": "2025-10-27T12:00:00Z"
    }


# Factory functions for test data generation

def create_mock_attestation_response(
    test_challenge: bytes,
    credential_id: str,
    attestation_object: str,
    client_data_json: str
) -> Dict[str, Any]:
    """
    Create a complete mock attestation response
    """
    return {
        "id": credential_id,
        "rawId": credential_id,
        "response": {
            "clientDataJSON": client_data_json,
            "attestationObject": attestation_object
        },
        "type": "public-key",
        "clientExtensionResults": {},
        "transports": ["internal"]
    }


def create_mock_assertion_response(
    test_challenge: bytes,
    credential_id: str,
    authenticator_data: str,
    client_data_json: str,
    signature: str,
    user_handle: str
) -> Dict[str, Any]:
    """
    Create a complete mock assertion response
    """
    return {
        "id": credential_id,
        "rawId": credential_id,
        "response": {
            "clientDataJSON": client_data_json,
            "authenticatorData": authenticator_data,
            "signature": signature,
            "userHandle": user_handle
        },
        "type": "public-key",
        "clientExtensionResults": {}
    }


# Helper assertions for WebAuthn testing

def assert_valid_challenge(challenge: bytes) -> None:
    """Assert challenge is valid (32 bytes, cryptographically random)"""
    assert isinstance(challenge, bytes), "Challenge must be bytes"
    assert len(challenge) == 32, f"Challenge must be 32 bytes, got {len(challenge)}"


def assert_valid_credential_id(credential_id: str) -> None:
    """Assert credential ID is valid Base64URL string"""
    import base64
    assert isinstance(credential_id, str), "Credential ID must be string"
    try:
        # Try to decode Base64URL
        decoded = base64.urlsafe_b64decode(credential_id + '==')
        assert len(decoded) > 0, "Credential ID must not be empty"
    except Exception as e:
        pytest.fail(f"Invalid credential ID: {e}")


def assert_counter_increased(old_counter: int, new_counter: int) -> None:
    """Assert counter value has increased (prevents replay attacks)"""
    assert new_counter > old_counter, f"Counter must increase: {old_counter} -> {new_counter}"


# Parametrize helpers for common test scenarios

CHALLENGE_TTL_TEST_CASES = [
    ("valid", 300, True),
    ("expired", 0, False),
    ("future", 600, True)
]

COUNTER_VALIDATION_TEST_CASES = [
    ("increment", 10, 11, True),
    ("same", 10, 10, False),
    ("decrement", 10, 9, False),
    ("large_jump", 10, 100, True)
]


# ==========================================
# Fixtures for Authentication Tests
# ==========================================

@pytest.fixture
def user_factory(db_session):
    """
    Factory fixture for creating User instances (supports sync mode)
    """
    from app.models.user import User
    import asyncio

    def _create_user(**kwargs):
        defaults = {
            "id": uuid4(),
            "email": f"test_{uuid4().hex[:8]}@wasteland.vault",
            "name": f"TestUser_{uuid4().hex[:6]}",
            "password_hash": "$2b$12$hashed_password_placeholder",
            "karma_score": 50,
            "webauthn_user_handle": secrets.token_bytes(64),
        }
        defaults.update(kwargs)

        user = User(**defaults)
        db_session.add(user)

        # Handle async flush
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're in async context, return a coroutine that caller should await
                # For now, we'll use sync approach for simplicity
                pass
        except RuntimeError:
            pass

        # For sync tests, don't flush here - let the test handle it
        # db_session.flush()

        return user

    return _create_user


@pytest.fixture
def credential_factory(db_session):
    """
    Factory fixture for creating Credential instances (supports sync mode)
    """
    from app.models.credential import Credential
    import asyncio

    def _create_credential(user_id=None, **kwargs):
        if user_id is None:
            # Create a test user if not provided
            from app.models.user import User
            test_user = User(
                id=uuid4(),
                email=f"test_{uuid4().hex[:8]}@wasteland.vault",
                name=f"TestUser_{uuid4().hex[:6]}",
                password_hash="$2b$12$hashed_password_placeholder",
                karma_score=50,
                webauthn_user_handle=secrets.token_bytes(64),
            )
            db_session.add(test_user)
            # Don't flush here, let test handle it
            user_id = test_user.id

        defaults = {
            "id": uuid4(),
            "user_id": user_id,
            "credential_id": f"cred_{uuid4().hex}",
            "public_key": secrets.token_hex(64),  # 128 hex chars (64 bytes)
            "counter": 0,
            "transports": ["internal"],
            "device_name": "Test Device",
            "backup_eligible": True,
            "backup_state": False,
        }
        defaults.update(kwargs)

        credential = Credential(**defaults)
        db_session.add(credential)
        # Don't flush here, let test handle it

        return credential

    return _create_credential
