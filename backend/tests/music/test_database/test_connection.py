"""Test database connection and Supabase integration."""

import pytest
import pytest_asyncio
from supabase import Client, create_client
import os


@pytest_asyncio.fixture(scope="module")
async def supabase_client_no_user() -> Client:
    """
    Create Supabase client WITHOUT needing test_user fixture.
    Used for basic connection tests.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        pytest.skip("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required")

    client = create_client(supabase_url, supabase_key)
    return client


class TestDatabaseConnection:
    """Test suite for database connection."""

    @pytest.mark.asyncio
    async def test_supabase_client_connection(self, supabase_client_no_user: Client):
        """Test Supabase client can connect."""
        assert supabase_client_no_user is not None
        assert hasattr(supabase_client_no_user, "auth")
        assert hasattr(supabase_client_no_user, "table")

    @pytest.mark.asyncio
    async def test_supabase_service_role_key(self, supabase_client_no_user: Client):
        """Test service role key has admin permissions."""
        # Service role key should bypass RLS
        # Try to access a table without user context
        try:
            response = supabase_client_no_user.table("music_tracks").select("*").limit(1).execute()
            assert response is not None
            print(f"✅ Service role key working, found {len(response.data)} music tracks")
        except Exception as e:
            pytest.fail(f"Service role key failed: {str(e)}")

    @pytest.mark.asyncio
    async def test_database_tables_exist(
        self,
        supabase_client_no_user: Client,
        expected_music_tables: list
    ):
        """Test all required music tables exist."""
        for table_name in expected_music_tables:
            try:
                # Try to query table (will fail if table doesn't exist)
                response = supabase_client_no_user.table(table_name).select("*").limit(1).execute()
                assert response is not None, f"Table {table_name} query failed"
                print(f"✅ Table '{table_name}' exists")
            except Exception as e:
                pytest.fail(f"Table {table_name} does not exist: {str(e)}")

    @pytest.mark.asyncio
    async def test_environment_variables(self):
        """Test required environment variables are set."""
        import os

        required_vars = [
            "SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY",
        ]

        for var in required_vars:
            value = os.getenv(var)
            assert value is not None, f"{var} environment variable not set"
            assert len(value) > 0, f"{var} environment variable is empty"
            print(f"✅ {var} is set")
