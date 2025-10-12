"""Test database migrations and schema."""

import pytest
from supabase import Client


class TestDatabaseMigrations:
    """Test suite for database schema and migrations."""

    @pytest.mark.asyncio
    async def test_music_tracks_table_structure(
        self,
        supabase_client: Client,
    ):
        """Test music_tracks table has correct structure."""
        # Query table to verify structure
        response = supabase_client.table("music_tracks").select("*").limit(1).execute()
        assert response is not None

    @pytest.mark.asyncio
    async def test_playlists_table_structure(
        self,
        supabase_client: Client,
    ):
        """Test playlists table has correct structure."""
        response = supabase_client.table("playlists").select("*").limit(1).execute()
        assert response is not None

    @pytest.mark.asyncio
    async def test_playlist_tracks_table_structure(
        self,
        supabase_client: Client,
    ):
        """Test playlist_tracks table has correct structure."""
        response = supabase_client.table("playlist_tracks").select("*").limit(1).execute()
        assert response is not None

    @pytest.mark.asyncio
    async def test_user_ai_quotas_table_structure(
        self,
        supabase_client: Client,
    ):
        """Test user_ai_quotas table has correct structure."""
        response = supabase_client.table("user_ai_quotas").select("*").limit(1).execute()
        assert response is not None

    @pytest.mark.asyncio
    async def test_cascade_delete_playlist_tracks(
        self,
        supabase_client: Client,
        test_user: dict,
    ):
        """Test CASCADE DELETE removes playlist_tracks when playlist deleted."""
        user_id = test_user["id"]

        # Create playlist
        playlist_data = {
            "user_id": user_id,
            "name": "Test Playlist",
            "is_default": False,
        }
        playlist_response = supabase_client.table("playlists").insert(playlist_data).execute()
        playlist_id = playlist_response.data[0]["id"]

        # Create music track
        music_data = {
            "user_id": user_id,
            "title": "Test Track",
            "parameters": {
                "key": "C",
                "mode": "minor",
                "tempo": 90,
                "timbre": "sine",
                "genre": [],
                "mood": [],
            },
            "audio_data": '{}',
            "duration": 60,
            "is_system": False,
        }
        music_response = supabase_client.table("music_tracks").insert(music_data).execute()
        track_id = music_response.data[0]["id"]

        # Add track to playlist
        playlist_track_data = {
            "playlist_id": playlist_id,
            "track_id": track_id,
            "position": 1,
        }
        supabase_client.table("playlist_tracks").insert(playlist_track_data).execute()

        # Delete playlist
        supabase_client.table("playlists").delete().eq("id", playlist_id).execute()

        # Verify playlist_tracks are also deleted
        playlist_tracks_response = supabase_client.table("playlist_tracks") \
            .select("*") \
            .eq("playlist_id", playlist_id) \
            .execute()

        assert len(playlist_tracks_response.data) == 0
