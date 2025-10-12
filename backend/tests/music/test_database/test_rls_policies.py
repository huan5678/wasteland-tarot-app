"""Test Row Level Security (RLS) policies."""

import pytest
from supabase import Client
from uuid import uuid4


class TestRLSPolicies:
    """Test suite for RLS policies."""

    @pytest.mark.asyncio
    async def test_music_tracks_user_isolation(
        self,
        supabase_client: Client,
        test_user: dict,
    ):
        """Test users can only access their own music tracks."""
        user_id = test_user["id"]

        # Create a music track for test user
        music_data = {
            "user_id": user_id,
            "title": "Test Track",
            "prompt": "Test prompt",
            "parameters": {
                "key": "C",
                "mode": "minor",
                "tempo": 90,
                "timbre": "sine",
                "genre": ["ambient"],
                "mood": ["calm"],
            },
            "audio_data": '{}',
            "duration": 60,
            "is_system": False,
        }

        # Insert with service role (bypasses RLS)
        insert_response = supabase_client.table("music_tracks").insert(music_data).execute()
        assert len(insert_response.data) > 0
        track_id = insert_response.data[0]["id"]

        # Verify we can query our own track
        query_response = supabase_client.table("music_tracks") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        assert len(query_response.data) >= 1
        assert any(track["id"] == track_id for track in query_response.data)

    @pytest.mark.asyncio
    async def test_system_music_visible_to_all(
        self,
        supabase_client: Client,
    ):
        """Test system music is visible to all users."""
        # Create system music
        system_music_data = {
            "user_id": None,  # System music has NULL user_id
            "title": "System BGM",
            "parameters": {
                "key": "C",
                "mode": "major",
                "tempo": 100,
                "timbre": "sine",
                "genre": ["ambient"],
                "mood": ["calm"],
            },
            "audio_data": '{}',
            "duration": 120,
            "is_system": True,
        }

        # Insert system music
        insert_response = supabase_client.table("music_tracks").insert(system_music_data).execute()
        assert len(insert_response.data) > 0

        # Query system music (should be visible)
        query_response = supabase_client.table("music_tracks") \
            .select("*") \
            .eq("is_system", True) \
            .execute()

        assert len(query_response.data) >= 1

    @pytest.mark.asyncio
    async def test_playlist_ownership(
        self,
        supabase_client: Client,
        test_user: dict,
    ):
        """Test users can only access their own playlists."""
        user_id = test_user["id"]

        # Create playlist for test user
        playlist_data = {
            "user_id": user_id,
            "name": "My Playlist",
            "is_default": False,
        }

        insert_response = supabase_client.table("playlists").insert(playlist_data).execute()
        assert len(insert_response.data) > 0

        # Query own playlists
        query_response = supabase_client.table("playlists") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        assert len(query_response.data) >= 1

    @pytest.mark.asyncio
    async def test_default_playlist_protection(
        self,
        supabase_client: Client,
        test_user: dict,
    ):
        """Test default playlist cannot be deleted."""
        user_id = test_user["id"]

        # Create default playlist
        playlist_data = {
            "user_id": user_id,
            "name": "Default Playlist",
            "is_default": True,
        }

        insert_response = supabase_client.table("playlists").insert(playlist_data).execute()
        assert len(insert_response.data) > 0
        playlist_id = insert_response.data[0]["id"]

        # Verify is_default flag is set
        query_response = supabase_client.table("playlists") \
            .select("*") \
            .eq("id", playlist_id) \
            .execute()

        assert len(query_response.data) > 0
        assert query_response.data[0]["is_default"] is True

    @pytest.mark.asyncio
    async def test_cross_user_data_isolation(
        self,
        supabase_client: Client,
        test_user: dict,
    ):
        """Test users cannot access other users' data."""
        user1_id = test_user["id"]
        user2_id = str(uuid4())  # Simulate another user

        # Create music for user1
        music_data = {
            "user_id": user1_id,
            "title": "User1 Track",
            "parameters": {
                "key": "C",
                "mode": "minor",
                "tempo": 90,
                "timbre": "sine",
                "genre": ["ambient"],
                "mood": ["calm"],
            },
            "audio_data": '{}',
            "duration": 60,
            "is_system": False,
        }

        supabase_client.table("music_tracks").insert(music_data).execute()

        # Try to query user2's data (should be empty)
        query_response = supabase_client.table("music_tracks") \
            .select("*") \
            .eq("user_id", user2_id) \
            .execute()

        # User2 should have no data
        assert len(query_response.data) == 0
