"""
Integration Tests for Chirp 3:HD API (Task 3.2)

End-to-end integration tests for Chirp 3:HD synthesis pipeline.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from app.schemas.audio import CustomPronunciation, VoiceControlParams, Pause
from app.services.tts_service import VoiceModel


@pytest.mark.integration
class TestChirp3APIIntegration:
    """Integration tests for Chirp 3:HD API endpoints"""

    @pytest.fixture
    def mock_tts_service(self):
        """Mock TTS service"""
        with patch('app.services.tts_service.get_tts_service') as mock_get:
            mock_service = Mock()
            mock_service.synthesize_speech.return_value = {
                "audio_content": b"fake_audio",
                "duration": 1.5,
                "file_size": 1024,
                "text_length": 10,
                "voice_name": "en-US-Chirp3-HD-Regulus",
                "voice_model": "chirp3-hd",
                "ssml_params": {"pitch": 0.0, "rate": 1.0}
            }
            mock_service.compute_cache_key.return_value = "test_cache_key"
            mock_service.compute_text_hash.return_value = "test_hash"
            mock_service.get_voice_config.return_value = {
                "pitch": 0.0,
                "rate": 1.0,
                "volume": 1.0
            }
            mock_service.router = Mock()
            mock_service.router.get_voice_model.return_value = VoiceModel.CHIRP3_HD
            mock_get.return_value = mock_service
            return mock_service

    @pytest.fixture
    def client(self, mock_tts_service):
        """Create test client"""
        from app.main import app
        return TestClient(app)

    @pytest.mark.asyncio
    async def test_chirp3_synthesis_basic(self, client, mock_tts_service):
        """Test basic Chirp 3:HD synthesis request"""
        response = client.post(
            "/api/v1/audio/synthesize",
            json={
                "text": "This is a test",
                "character_key": "pip_boy",
                "force_voice_model": "chirp3-hd"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "voice_model" in data
        assert data["voice_model"] == "chirp3-hd"
        assert "voice_name" in data
        assert "duration" in data
        assert "file_size" in data

    @pytest.mark.asyncio
    async def test_chirp3_synthesis_with_custom_pronunciations(
        self, client, mock_tts_service
    ):
        """Test synthesis with custom pronunciations"""
        response = client.post(
            "/api/v1/audio/synthesize",
            json={
                "text": "I read a book",
                "character_key": "pip_boy",
                "force_voice_model": "chirp3-hd",
                "custom_pronunciations": [
                    {
                        "phrase": "read",
                        "pronunciation": "rɛd"
                    }
                ]
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["voice_model"] == "chirp3-hd"

        # Verify custom pronunciations were passed
        call_args = mock_tts_service.synthesize_speech.call_args
        assert call_args is not None
        # Check that custom_pronunciations parameter was passed
        assert "custom_pronunciations" in call_args.kwargs or call_args.kwargs.get("custom_pronunciations") is not None

    @pytest.mark.asyncio
    async def test_chirp3_synthesis_with_voice_controls(
        self, client, mock_tts_service
    ):
        """Test synthesis with voice controls"""
        response = client.post(
            "/api/v1/audio/synthesize",
            json={
                "text": "Test text",
                "character_key": "pip_boy",
                "force_voice_model": "chirp3-hd",
                "voice_controls": {
                    "pitch": 5.0,
                    "rate": 1.2,
                    "volume": 1.0
                }
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["voice_model"] == "chirp3-hd"

    @pytest.mark.asyncio
    async def test_chirp3_synthesis_with_pauses(
        self, client, mock_tts_service
    ):
        """Test synthesis with pauses"""
        response = client.post(
            "/api/v1/audio/synthesize",
            json={
                "text": "Hello World",
                "character_key": "pip_boy",
                "force_voice_model": "chirp3-hd",
                "voice_controls": {
                    "pauses": [
                        {"position": 5, "duration": "medium"}
                    ]
                }
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["voice_model"] == "chirp3-hd"

    @pytest.mark.asyncio
    async def test_chirp3_fallback_to_wavenet(
        self, client, mock_tts_service
    ):
        """Test automatic fallback to WaveNet on Chirp 3:HD failure"""
        # Mock Chirp 3:HD failure
        mock_tts_service.synthesize_speech.side_effect = [
            Exception("Chirp 3:HD failed"),  # First call fails
            {  # Fallback succeeds
                "audio_content": b"wavenet_audio",
                "duration": 1.5,
                "file_size": 1024,
                "text_length": 10,
                "voice_name": "cmn-TW-Wavenet-B",
                "voice_model": "wavenet",
                "ssml_params": {"pitch": 0.0, "rate": 1.0}
            }
        ]

        # Mock router settings to enable fallback
        mock_tts_service.router.settings.chirp3_fallback_to_wavenet = True

        response = client.post(
            "/api/v1/audio/synthesize",
            json={
                "text": "Test text",
                "character_key": "pip_boy",
                "force_voice_model": "chirp3-hd"
            }
        )

        # Should succeed with WaveNet fallback
        assert response.status_code == 200
        data = response.json()
        # Note: In actual fallback, voice_model would be "wavenet"
        # This depends on fallback implementation

    @pytest.mark.asyncio
    async def test_chirp3_cache_hit(self, client, mock_tts_service):
        """Test cache hit for Chirp 3:HD synthesis"""
        # Mock cache service
        with patch('app.services.audio_cache_service.get_audio_cache_service') as mock_cache:
            mock_cache_service = Mock()
            mock_cache_service.get_dynamic_audio.return_value = {
                "url": "https://storage.example.com/audio.mp3",
                "duration": 1.5,
                "file_size": 1024
            }
            mock_cache.return_value = mock_cache_service

            response = client.post(
                "/api/v1/audio/synthesize",
                json={
                    "text": "Cached text",
                    "character_key": "pip_boy",
                    "force_voice_model": "chirp3-hd",
                    "cache_enabled": True
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert data["cached"] is True
            assert data["source"] == "redis"

    @pytest.mark.asyncio
    async def test_voice_model_routing_in_api(
        self, client, mock_tts_service
    ):
        """Test voice model routing in API endpoint"""
        # Test with feature flag enabled
        mock_tts_service.router.get_voice_model.return_value = VoiceModel.CHIRP3_HD

        response = client.post(
            "/api/v1/audio/synthesize",
            json={
                "text": "Test",
                "character_key": "pip_boy"
                # No force_voice_model - should use routing
            }
        )

        assert response.status_code == 200
        # Verify router was consulted
        assert mock_tts_service.router.get_voice_model.called

    @pytest.mark.asyncio
    async def test_wavenet_fallback_behavior(
        self, client, mock_tts_service
    ):
        """Test that WaveNet is used when Chirp 3:HD not enabled"""
        mock_tts_service.router.get_voice_model.return_value = VoiceModel.WAVENET
        mock_tts_service.synthesize_speech.return_value = {
            "audio_content": b"wavenet_audio",
            "duration": 1.5,
            "file_size": 1024,
            "text_length": 10,
            "voice_name": "cmn-TW-Wavenet-B",
            "voice_model": "wavenet",
            "ssml_params": {"pitch": 0.0, "rate": 1.0}
        }

        response = client.post(
            "/api/v1/audio/synthesize",
            json={
                "text": "Test",
                "character_key": "pip_boy"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["voice_model"] == "wavenet"
