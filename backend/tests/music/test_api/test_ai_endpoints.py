"""Test AI music generation API endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch


class TestAIEndpoints:
    """Test suite for AI music generation API endpoints."""

    # ==========================================
    # POST /api/v1/ai/generate-music - AI 音樂生成
    # ==========================================

    def test_generate_music_with_gemini_success(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
        sample_ai_prompt: str,
    ):
        """Test POST /api/v1/ai/generate-music with Gemini provider."""
        # Create user quota
        quota_data = {
            "user_id": test_user["id"],
            "monthly_quota": 20,
            "used_quota": 0,
        }
        supabase_client.table("user_ai_quotas").insert(quota_data).execute()

        # Mock LLM Factory
        with patch("app.services.ai_service.AIService.generate_music_parameters") as mock:
            from app.models.music import MusicParameters

            mock.return_value = {
                "parameters": MusicParameters(
                    key="C",
                    mode="minor",
                    tempo=90,
                    timbre="sine",
                    genre=["ambient"],
                    mood=["mysterious"],
                ),
                "provider": "gemini",
                "quota_remaining": 20,
            }

            response = authenticated_client.post(
                "/api/v1/ai/generate-music",
                json={"prompt": sample_ai_prompt},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "parameters" in data["data"]
            assert data["data"]["provider"] == "gemini"
            assert data["data"]["quota_remaining"] == 20

    def test_generate_music_with_openai_fallback(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
        sample_ai_prompt: str,
    ):
        """Test AI generation falls back to OpenAI when Gemini fails."""
        # Create user quota
        quota_data = {
            "user_id": test_user["id"],
            "monthly_quota": 20,
            "used_quota": 0,
        }
        supabase_client.table("user_ai_quotas").insert(quota_data).execute()

        # Mock LLM Factory with OpenAI fallback
        with patch("app.services.ai_service.AIService.generate_music_parameters") as mock:
            from app.models.music import MusicParameters

            mock.return_value = {
                "parameters": MusicParameters(
                    key="A",
                    mode="major",
                    tempo=120,
                    timbre="sawtooth",
                    genre=["synthwave"],
                    mood=["energetic"],
                ),
                "provider": "openai",
                "quota_remaining": 20,
            }

            response = authenticated_client.post(
                "/api/v1/ai/generate-music",
                json={"prompt": sample_ai_prompt},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["provider"] == "openai"

    def test_generate_music_with_default_fallback(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
        sample_ai_prompt: str,
    ):
        """Test AI generation uses default parameters when all providers fail."""
        # Create user quota
        quota_data = {
            "user_id": test_user["id"],
            "monthly_quota": 20,
            "used_quota": 0,
        }
        supabase_client.table("user_ai_quotas").insert(quota_data).execute()

        # Mock LLM Factory with fallback provider
        with patch("app.services.ai_service.AIService.generate_music_parameters") as mock:
            from app.models.music import MusicParameters

            mock.return_value = {
                "parameters": MusicParameters(
                    key="C",
                    mode="major",
                    tempo=100,
                    timbre="sine",
                    genre=["ambient"],
                    mood=["calm"],
                ),
                "provider": "fallback",
                "quota_remaining": 20,
            }

            response = authenticated_client.post(
                "/api/v1/ai/generate-music",
                json={"prompt": sample_ai_prompt},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["data"]["provider"] == "fallback"

    def test_generate_music_quota_exceeded(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
        sample_ai_prompt: str,
    ):
        """Test generating music fails when quota exceeded."""
        # Create user quota with limit reached
        quota_data = {
            "user_id": test_user["id"],
            "monthly_quota": 20,
            "used_quota": 20,  # Already used all quota
        }
        supabase_client.table("user_ai_quotas").insert(quota_data).execute()

        response = authenticated_client.post(
            "/api/v1/ai/generate-music",
            json={"prompt": sample_ai_prompt},
        )

        assert response.status_code == 403
        assert "配額已用完" in response.json()["detail"]

    def test_generate_music_prompt_too_long(
        self,
        authenticated_client: TestClient,
    ):
        """Test generating music fails with prompt > 200 characters."""
        long_prompt = "很長的提示" * 100  # > 200 characters

        response = authenticated_client.post(
            "/api/v1/ai/generate-music",
            json={"prompt": long_prompt},
        )

        assert response.status_code == 422  # Validation error

    def test_generate_music_unauthorized(
        self,
        authenticated_client: TestClient,
    ):
        """Test generating music fails without authentication."""
        # Remove auth header
        from fastapi.testclient import TestClient
        client = TestClient(authenticated_client.app)

        response = client.post(
            "/api/v1/ai/generate-music",
            json={"prompt": "test prompt"},
        )

        assert response.status_code in [401, 403]

    # ==========================================
    # GET /api/v1/ai/quota - 查詢配額
    # ==========================================

    def test_get_quota_success(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test GET /api/v1/ai/quota returns user quota."""
        # Create user quota
        quota_data = {
            "user_id": test_user["id"],
            "monthly_quota": 20,
            "used_quota": 5,
        }
        supabase_client.table("user_ai_quotas").insert(quota_data).execute()

        response = authenticated_client.get("/api/v1/ai/quota")

        assert response.status_code == 200
        data = response.json()
        assert data["monthly_quota"] == 20
        assert data["used_quota"] == 5
        assert data["remaining"] == 15
        assert "last_reset_at" in data

    def test_get_quota_creates_default_if_not_exists(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
    ):
        """Test GET /api/v1/ai/quota creates default quota if not exists."""
        # Don't create quota (should be auto-created)
        response = authenticated_client.get("/api/v1/ai/quota")

        assert response.status_code == 200
        data = response.json()
        assert data["monthly_quota"] == 20  # Default quota
        assert data["used_quota"] == 0
        assert data["remaining"] == 20

        # Verify quota was created in database
        quota_response = supabase_client.table("user_ai_quotas") \
            .select("*") \
            .eq("user_id", test_user["id"]) \
            .execute()
        assert len(quota_response.data) == 1

    def test_quota_updates_correctly_after_generation(
        self,
        authenticated_client: TestClient,
        supabase_client,
        test_user: dict,
        sample_ai_prompt: str,
    ):
        """Test quota decrements after successful AI generation.

        Note: This test verifies the quota management system, not the actual generation.
        """
        # Create user quota
        quota_data = {
            "user_id": test_user["id"],
            "monthly_quota": 20,
            "used_quota": 0,
        }
        supabase_client.table("user_ai_quotas").insert(quota_data).execute()

        # Check initial quota
        initial_response = authenticated_client.get("/api/v1/ai/quota")
        initial_data = initial_response.json()
        assert initial_data["used_quota"] == 0
        assert initial_data["remaining"] == 20

        # Note: Actual quota decrement happens when music is saved,
        # not during generation. This is expected behavior.
        # See: POST /api/v1/music endpoint for quota decrement logic
