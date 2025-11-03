"""
Unit Tests for Voice Model Routing Logic (Task 3.1)

Tests for VoiceModelRouter class including:
- Feature flag logic
- Character-specific routing
- Percentage-based rollout
- User-consistent hashing
"""

import pytest
from unittest.mock import Mock, patch
from app.services.tts_service import VoiceModelRouter, VoiceModel
from app.config import Settings


class TestVoiceModelRouter:
    """Test VoiceModelRouter routing logic"""

    def test_router_initialization(self):
        """Test router initializes correctly"""
        router = VoiceModelRouter()
        assert router.settings is not None
        assert router._enabled_characters_set is None or isinstance(
            router._enabled_characters_set, set
        )

    def test_router_with_custom_settings(self):
        """Test router can use custom settings"""
        custom_settings = Settings(
            chirp3_enabled=True,
            chirp3_rollout_percentage=100,
            chirp3_enabled_characters="",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(custom_settings)
        assert router.settings == custom_settings

    def test_should_use_chirp3_disabled_globally(self):
        """Test that Chirp 3:HD is disabled when global flag is off"""
        settings = Settings(
            chirp3_enabled=False,
            chirp3_rollout_percentage=100,
            chirp3_enabled_characters="",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)
        assert router.should_use_chirp3("pip_boy") is False
        assert router.should_use_chirp3("pip_boy", "user123") is False

    def test_should_use_chirp3_character_specific_enabled(self):
        """Test character-specific enablement"""
        settings = Settings(
            chirp3_enabled=True,
            chirp3_rollout_percentage=0,
            chirp3_enabled_characters="pip_boy,vault_dweller",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)
        assert router.should_use_chirp3("pip_boy") is True
        assert router.should_use_chirp3("vault_dweller") is True
        assert router.should_use_chirp3("wasteland_trader") is False

    def test_should_use_chirp3_percentage_rollout(self):
        """Test percentage-based rollout"""
        settings = Settings(
            chirp3_enabled=True,
            chirp3_rollout_percentage=50,
            chirp3_enabled_characters="",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)

        # Test with user_id (should be consistent)
        user_id = "test_user_123"
        result = router.should_use_chirp3("pip_boy", user_id)
        # Should be consistent for same user
        assert router.should_use_chirp3("pip_boy", user_id) == result

        # Test without user_id (random, but should work)
        result_no_user = router.should_use_chirp3("pip_boy")
        assert isinstance(result_no_user, bool)

    def test_should_use_chirp3_100_percent_rollout(self):
        """Test 100% rollout"""
        settings = Settings(
            chirp3_enabled=True,
            chirp3_rollout_percentage=100,
            chirp3_enabled_characters="",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)
        assert router.should_use_chirp3("pip_boy") is True
        assert router.should_use_chirp3("vault_dweller") is True

    def test_should_use_chirp3_0_percent_rollout(self):
        """Test 0% rollout"""
        settings = Settings(
            chirp3_enabled=True,
            chirp3_rollout_percentage=0,
            chirp3_enabled_characters="",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)
        assert router.should_use_chirp3("pip_boy") is False

    def test_user_consistent_hashing(self):
        """Test that same user_id always gets same result"""
        settings = Settings(
            chirp3_enabled=True,
            chirp3_rollout_percentage=50,
            chirp3_enabled_characters="",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)
        user_id = "consistent_user_123"

        # Call multiple times - should always return same result
        results = [router.should_use_chirp3("pip_boy", user_id) for _ in range(10)]
        assert all(r == results[0] for r in results), "User routing should be consistent"

    def test_get_voice_model_returns_chirp3(self):
        """Test get_voice_model returns CHIRP3_HD when enabled"""
        settings = Settings(
            chirp3_enabled=True,
            chirp3_rollout_percentage=100,
            chirp3_enabled_characters="",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)
        assert router.get_voice_model("pip_boy") == VoiceModel.CHIRP3_HD

    def test_get_voice_model_returns_wavenet(self):
        """Test get_voice_model returns WAVENET when disabled"""
        settings = Settings(
            chirp3_enabled=False,
            chirp3_rollout_percentage=0,
            chirp3_enabled_characters="",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)
        assert router.get_voice_model("pip_boy") == VoiceModel.WAVENET

    def test_enabled_characters_parsing(self):
        """Test enabled characters string parsing"""
        settings = Settings(
            chirp3_enabled=True,
            chirp3_rollout_percentage=0,
            chirp3_enabled_characters="pip_boy, vault_dweller , wasteland_trader",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)
        assert router.should_use_chirp3("pip_boy") is True
        assert router.should_use_chirp3("vault_dweller") is True
        assert router.should_use_chirp3("wasteland_trader") is True
        assert router.should_use_chirp3("super_mutant") is False

    def test_empty_enabled_characters(self):
        """Test empty enabled characters uses percentage rollout"""
        settings = Settings(
            chirp3_enabled=True,
            chirp3_rollout_percentage=100,
            chirp3_enabled_characters="",
            chirp3_fallback_to_wavenet=True,
            secret_key="test",
            supabase_url="https://test.supabase.co",
            supabase_key="test",
            supabase_service_role_key="test",
            db_host="localhost",
            db_password="test"
        )
        router = VoiceModelRouter(settings)
        assert router.should_use_chirp3("pip_boy") is True
        assert router.should_use_chirp3("vault_dweller") is True
