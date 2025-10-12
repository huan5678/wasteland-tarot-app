"""Test playlist management API endpoints."""

import pytest
from fastapi.testclient import TestClient
from uuid import uuid4


class TestPlaylistEndpoints:
    """Test suite for playlist API endpoints."""

    # ==========================================
    # GET /api/v1/playlists - 查詢播放清單
    # ==========================================

    def test_get_playlists_success(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test GET /api/v1/playlists returns user playlists."""
        # Create test playlist
        playlist_data = {
            "user_id": test_user["id"],
            "name": "Test Playlist",
            "is_default": False,
        }
        supabase_client.table("playlists").insert(playlist_data).execute()

        # Get playlists
        response = authenticated_client.get("/api/v1/playlists")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(p["name"] == "Test Playlist" for p in data)

    def test_get_playlists_unauthorized(self, authenticated_client: TestClient):
        """Test GET /api/v1/playlists returns 401 without auth."""
        # Remove auth header
        client = TestClient(authenticated_client.app)
        response = client.get("/api/v1/playlists")

        assert response.status_code in [401, 403]

    # ==========================================
    # POST /api/v1/playlists - 建立播放清單
    # ==========================================

    def test_create_playlist_success(
        self,
        authenticated_client: TestClient,
        sample_playlist_data: dict,
    ):
        """Test POST /api/v1/playlists creates playlist."""
        response = authenticated_client.post(
            "/api/v1/playlists",
            json=sample_playlist_data,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_playlist_data["name"]
        assert "id" in data
        assert data["is_default"] is False

    def test_create_playlist_limit_exceeded(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test creating 6th playlist fails (limit: 5)."""
        # Create 5 playlists
        for i in range(5):
            playlist_data = {
                "user_id": test_user["id"],
                "name": f"Playlist {i+1}",
                "is_default": False,
            }
            supabase_client.table("playlists").insert(playlist_data).execute()

        # Try to create 6th playlist
        response = authenticated_client.post(
            "/api/v1/playlists",
            json={"name": "Playlist 6"},
        )

        assert response.status_code == 403
        assert "上限" in response.json()["detail"]

    # ==========================================
    # PUT /api/v1/playlists/{id} - 重新命名
    # ==========================================

    def test_update_playlist_success(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test PUT /api/v1/playlists/{id} renames playlist."""
        # Create playlist
        playlist_data = {
            "user_id": test_user["id"],
            "name": "Old Name",
            "is_default": False,
        }
        insert_response = supabase_client.table("playlists").insert(playlist_data).execute()
        playlist_id = insert_response.data[0]["id"]

        # Rename playlist
        response = authenticated_client.put(
            f"/api/v1/playlists/{playlist_id}",
            json={"name": "New Name"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"

    def test_update_playlist_not_found(
        self,
        authenticated_client: TestClient,
    ):
        """Test renaming non-existent playlist returns 404."""
        fake_id = str(uuid4())
        response = authenticated_client.put(
            f"/api/v1/playlists/{fake_id}",
            json={"name": "New Name"},
        )

        assert response.status_code == 404

    # ==========================================
    # DELETE /api/v1/playlists/{id} - 刪除播放清單
    # ==========================================

    def test_delete_playlist_success(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test DELETE /api/v1/playlists/{id} deletes playlist."""
        # Create non-default playlist
        playlist_data = {
            "user_id": test_user["id"],
            "name": "To Delete",
            "is_default": False,
        }
        insert_response = supabase_client.table("playlists").insert(playlist_data).execute()
        playlist_id = insert_response.data[0]["id"]

        # Delete playlist
        response = authenticated_client.delete(f"/api/v1/playlists/{playlist_id}")

        assert response.status_code == 204

        # Verify deleted
        query_response = supabase_client.table("playlists") \
            .select("*") \
            .eq("id", playlist_id) \
            .execute()
        assert len(query_response.data) == 0

    def test_delete_default_playlist_forbidden(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test deleting default playlist returns 403."""
        # Create default playlist
        playlist_data = {
            "user_id": test_user["id"],
            "name": "Default Playlist",
            "is_default": True,
        }
        insert_response = supabase_client.table("playlists").insert(playlist_data).execute()
        playlist_id = insert_response.data[0]["id"]

        # Try to delete default playlist
        response = authenticated_client.delete(f"/api/v1/playlists/{playlist_id}")

        assert response.status_code == 403
        assert "預設播放清單" in response.json()["detail"]

    # ==========================================
    # POST /api/v1/playlists/{id}/tracks - 加入音樂
    # ==========================================

    def test_add_track_to_playlist_success(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test POST /api/v1/playlists/{id}/tracks adds track."""
        # Create playlist
        playlist_data = {
            "user_id": test_user["id"],
            "name": "My Playlist",
            "is_default": False,
        }
        playlist_response = supabase_client.table("playlists").insert(playlist_data).execute()
        playlist_id = playlist_response.data[0]["id"]

        # Create music track
        music_data = {
            "user_id": test_user["id"],
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
        response = authenticated_client.post(
            f"/api/v1/playlists/{playlist_id}/tracks",
            json={"track_id": track_id},
        )

        assert response.status_code == 204

        # Verify track added
        playlist_tracks_response = supabase_client.table("playlist_tracks") \
            .select("*") \
            .eq("playlist_id", playlist_id) \
            .eq("track_id", track_id) \
            .execute()
        assert len(playlist_tracks_response.data) == 1

    def test_add_duplicate_track_conflict(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test adding duplicate track returns 409."""
        # Create playlist and track
        playlist_data = {
            "user_id": test_user["id"],
            "name": "My Playlist",
            "is_default": False,
        }
        playlist_response = supabase_client.table("playlists").insert(playlist_data).execute()
        playlist_id = playlist_response.data[0]["id"]

        music_data = {
            "user_id": test_user["id"],
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

        # Add track first time (success)
        authenticated_client.post(
            f"/api/v1/playlists/{playlist_id}/tracks",
            json={"track_id": track_id},
        )

        # Add track second time (should fail)
        response = authenticated_client.post(
            f"/api/v1/playlists/{playlist_id}/tracks",
            json={"track_id": track_id},
        )

        assert response.status_code == 409
        assert "已在播放清單中" in response.json()["detail"]

    # ==========================================
    # DELETE /api/v1/playlists/{id}/tracks/{track_id} - 移除音樂
    # ==========================================

    def test_remove_track_from_playlist_success(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test DELETE /api/v1/playlists/{id}/tracks/{track_id} removes track."""
        # Create playlist and track
        playlist_data = {
            "user_id": test_user["id"],
            "name": "My Playlist",
            "is_default": False,
        }
        playlist_response = supabase_client.table("playlists").insert(playlist_data).execute()
        playlist_id = playlist_response.data[0]["id"]

        music_data = {
            "user_id": test_user["id"],
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

        # Remove track from playlist
        response = authenticated_client.delete(
            f"/api/v1/playlists/{playlist_id}/tracks/{track_id}"
        )

        assert response.status_code == 204

        # Verify track removed
        playlist_tracks_response = supabase_client.table("playlist_tracks") \
            .select("*") \
            .eq("playlist_id", playlist_id) \
            .eq("track_id", track_id) \
            .execute()
        assert len(playlist_tracks_response.data) == 0

    # ==========================================
    # PUT /api/v1/playlists/{id}/reorder - 調整順序
    # ==========================================

    def test_reorder_tracks_updates_all_positions(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test PUT /api/v1/playlists/{id}/reorder updates positions."""
        # Create playlist
        playlist_data = {
            "user_id": test_user["id"],
            "name": "My Playlist",
            "is_default": False,
        }
        playlist_response = supabase_client.table("playlists").insert(playlist_data).execute()
        playlist_id = playlist_response.data[0]["id"]

        # Create 3 tracks
        track_ids = []
        for i in range(3):
            music_data = {
                "user_id": test_user["id"],
                "title": f"Track {i+1}",
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
            track_ids.append(track_id)

            # Add to playlist
            playlist_track_data = {
                "playlist_id": playlist_id,
                "track_id": track_id,
                "position": i + 1,
            }
            supabase_client.table("playlist_tracks").insert(playlist_track_data).execute()

        # Reorder tracks (reverse order)
        new_order = list(reversed(track_ids))
        response = authenticated_client.put(
            f"/api/v1/playlists/{playlist_id}/reorder",
            json={"track_ids": new_order},
        )

        assert response.status_code == 204

        # Verify new order
        playlist_tracks_response = supabase_client.table("playlist_tracks") \
            .select("*") \
            .eq("playlist_id", playlist_id) \
            .order("position") \
            .execute()

        tracks = playlist_tracks_response.data
        assert len(tracks) == 3
        for i, track in enumerate(tracks):
            assert track["track_id"] == new_order[i]
            assert track["position"] == i + 1
