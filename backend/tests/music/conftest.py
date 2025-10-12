"""
Pytest configuration for playlist-music-player tests
Provides fixtures for Supabase client, authentication, and test data
"""

import asyncio
import os
from datetime import datetime
from typing import AsyncGenerator, Dict, Any
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from supabase import create_client, Client
from unittest.mock import Mock, patch

# Load test environment
test_env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env.test")
if os.path.exists(test_env_path):
    load_dotenv(test_env_path, override=True)
    print(f"✅ Loaded test environment from: {test_env_path}")


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def supabase_client() -> Client:
    """
    Create Supabase client for testing.

    Uses SERVICE_ROLE_KEY for admin operations (bypassing RLS).
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        pytest.skip("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for tests")

    client = create_client(supabase_url, supabase_key)
    print(f"✅ Supabase client created: {supabase_url[:50]}...")

    return client


@pytest_asyncio.fixture
async def test_user(supabase_client: Client) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Create a test user with authentication using Mock Auth approach.

    This fixture bypasses Supabase Auth email confirmation issues by:
    1. Creating user directly in auth.users table using service role
    2. Generating a mock JWT token for testing
    3. No email confirmation required

    Returns:
        Dict with keys:
            - id: user UUID
            - email: user email
            - access_token: JWT token (mocked)
            - session: mock session object

    Cleanup:
        Deletes user and all related data after test
    """
    import random
    import jwt
    from datetime import datetime, timedelta

    # Generate test user data
    domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"]
    test_email = f"test_{uuid4().hex[:8]}@{random.choice(domains)}"
    test_password = "TestPassword123!"
    user_id = str(uuid4())

    # Generate mock JWT token
    jwt_secret = os.getenv("SECRET_KEY", "test_secret_key_for_development_only_12345")
    token_payload = {
        "sub": user_id,
        "email": test_email,
        "role": "authenticated",
        "aud": "authenticated",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
    }
    mock_access_token = jwt.encode(token_payload, jwt_secret, algorithm="HS256")

    user_data = {
        "id": user_id,
        "email": test_email,
        "access_token": mock_access_token,
        "session": {
            "access_token": mock_access_token,
            "user": {"id": user_id, "email": test_email},
        },
    }

    try:
        # Create user directly in auth.users table using admin API
        # This bypasses email confirmation
        auth_user_created = False
        try:
            # Create user with explicit ID
            create_response = supabase_client.auth.admin.create_user({
                "email": test_email,
                "password": test_password,
                "email_confirm": True,  # Auto-confirm email
                "user_metadata": {"test_user": True},
                "id": user_id,  # Use our generated UUID
            })
            auth_user_created = True
            print(f"✅ Auth user created: {test_email} (ID: {user_id})")
        except Exception as e:
            print(f"⚠️  Auth user creation failed, continuing with mock: {e}")

        yield user_data

    finally:
        # Cleanup: delete test user and data
        try:
            # Delete user data first (to avoid FK constraints)
            await cleanup_user_data(supabase_client, user_id)

            # Delete auth user if it was created
            if auth_user_created:
                try:
                    supabase_client.auth.admin.delete_user(user_id)
                    print(f"🧹 Auth user deleted: {test_email}")
                except Exception as e:
                    print(f"⚠️  Error deleting auth user: {e}")
        except Exception as e:
            print(f"⚠️  Error cleaning up test user: {e}")


@pytest_asyncio.fixture
async def authenticated_client(test_user: Dict[str, Any]) -> AsyncGenerator[TestClient, None]:
    """
    Create FastAPI test client with authentication headers.

    Args:
        test_user: Test user fixture

    Returns:
        TestClient with Authorization header set
    """
    from app.main_music import app  # Use main_music.py for Music API tests

    client = TestClient(app)
    client.headers = {
        "Authorization": f"Bearer {test_user['access_token']}"
    }

    yield client


@pytest_asyncio.fixture
async def async_authenticated_client(test_user: Dict[str, Any]) -> AsyncGenerator[AsyncClient, None]:
    """
    Create async HTTP client with authentication headers.

    Args:
        test_user: Test user fixture

    Returns:
        AsyncClient with Authorization header set
    """
    from app.main_music import app  # Use main_music.py for Music API tests

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {test_user['access_token']}"}
    ) as client:
        yield client


@pytest_asyncio.fixture(autouse=False)  # Changed to autouse=False to make it optional
async def cleanup_database(supabase_client: Client, test_user: Dict[str, Any]):
    """
    Clean up test data after each test.

    This fixture is now optional (autouse=False).
    Tests that need cleanup should explicitly request this fixture.
    """
    yield

    # Cleanup test user data
    try:
        await cleanup_user_data(supabase_client, test_user["id"])
        print(f"🧹 Cleaned up test data for user: {test_user['id']}")
    except Exception as e:
        print(f"⚠️  Error cleaning up database: {e}")


async def cleanup_user_data(supabase_client: Client, user_id: str):
    """
    Delete all test user data from database.

    Args:
        supabase_client: Supabase client
        user_id: User UUID to clean up
    """
    # Delete in reverse dependency order
    tables = [
        "playlist_tracks",  # 先刪除關聯表
        "playlists",        # 再刪除播放清單
        "music_tracks",     # 最後刪除音樂
        "user_ai_quotas",   # 清理配額
    ]

    for table in tables:
        try:
            supabase_client.table(table).delete().eq("user_id", user_id).execute()
        except Exception as e:
            # Ignore errors (table might not have user_id or no data to delete)
            pass


# ==========================================
# Mock Fixtures for External Services
# ==========================================

@pytest.fixture
def mock_gemini_provider():
    """Mock Gemini provider for testing."""
    with patch("app.providers.gemini_provider.GeminiProvider") as mock:
        mock_instance = Mock()
        mock_instance.name = "gemini"
        mock_instance.parse_prompt = Mock(return_value={
            "key": "C",
            "mode": "minor",
            "tempo": 90,
            "timbre": "sine",
            "genre": ["ambient"],
            "mood": ["mysterious"],
        })
        mock.return_value = mock_instance
        yield mock


@pytest.fixture
def mock_openai_provider():
    """Mock OpenAI provider for testing."""
    with patch("app.providers.openai_provider.OpenAIProvider") as mock:
        mock_instance = Mock()
        mock_instance.name = "openai"
        mock_instance.parse_prompt = Mock(return_value={
            "key": "A",
            "mode": "major",
            "tempo": 120,
            "timbre": "sawtooth",
            "genre": ["synthwave"],
            "mood": ["energetic"],
        })
        mock.return_value = mock_instance
        yield mock


@pytest.fixture
def mock_llm_factory_success():
    """Mock LLM Factory with successful response."""
    from app.models.music import MusicParameters

    with patch("app.providers.factory.LLMProviderFactory") as mock:
        mock_instance = Mock()
        mock_instance.parse_prompt = Mock(return_value={
            "parameters": MusicParameters(
                key="C",
                mode="minor",
                tempo=90,
                timbre="sine",
                genre=["ambient"],
                mood=["mysterious"],
            ),
            "provider": "gemini",
        })
        mock.return_value = mock_instance
        yield mock


@pytest.fixture
def mock_llm_factory_fallback():
    """Mock LLM Factory with fallback response."""
    from app.models.music import MusicParameters

    with patch("app.providers.factory.LLMProviderFactory") as mock:
        mock_instance = Mock()
        mock_instance.parse_prompt = Mock(return_value={
            "parameters": MusicParameters(
                key="C",
                mode="major",
                tempo=100,
                timbre="sine",
                genre=["ambient"],
                mood=["calm"],
            ),
            "provider": "fallback",
        })
        mock.return_value = mock_instance
        yield mock


# ==========================================
# Test Data Fixtures
# ==========================================

@pytest.fixture
def sample_music_parameters() -> Dict[str, Any]:
    """Sample music parameters for testing."""
    return {
        "key": "C",
        "mode": "minor",
        "tempo": 90,
        "timbre": "sine",
        "genre": ["ambient", "synthwave"],
        "mood": ["mysterious", "dark"],
    }


@pytest.fixture
def sample_music_track_data(sample_music_parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Sample music track data for creating tracks."""
    return {
        "title": "Wasteland Night",
        "prompt": "神秘的廢土夜晚，帶有合成器和電子鼓",
        "parameters": sample_music_parameters,
        "audio_data": '{"oscillators":[{"type":"sine","frequency":440}]}',
        "duration": 60,
        "is_public": False,
    }


@pytest.fixture
def sample_playlist_data() -> Dict[str, Any]:
    """Sample playlist data for creating playlists."""
    return {
        "name": "我的播放清單",
        "description": "測試播放清單",
    }


@pytest.fixture
def sample_ai_prompt() -> str:
    """Sample AI prompt for music generation."""
    return "神秘的廢土夜晚，帶有合成器和電子鼓"


# ==========================================
# Performance Testing Fixtures
# ==========================================

@pytest.fixture
def performance_threshold():
    """Performance thresholds for testing."""
    return {
        "api_response_time": 2.0,  # seconds
        "database_query_time": 1.0,  # seconds
        "ai_generation_time": 10.0,  # seconds (with timeout)
    }


# ==========================================
# Database Schema Fixtures
# ==========================================

@pytest.fixture
def expected_music_tables() -> list:
    """Expected database tables for music system."""
    return [
        "music_tracks",
        "playlists",
        "playlist_tracks",
        "user_ai_quotas",
    ]


@pytest.fixture
def expected_music_indexes() -> list:
    """Expected database indexes for music system."""
    return [
        "idx_music_tracks_user_id",
        "idx_music_tracks_is_system",
        "idx_playlists_user_id",
        "idx_playlist_tracks_playlist_id",
        "idx_playlist_tracks_track_id",
        "idx_user_ai_quotas_user_id",
    ]
