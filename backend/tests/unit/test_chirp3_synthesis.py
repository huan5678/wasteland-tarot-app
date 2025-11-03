"""
Unit Tests for Chirp 3:HD Synthesis (Task 3.1)

Tests for Chirp 3:HD synthesis methods including:
- Synthesis method calls
- Markup generation
- Voice parameter application
- Error handling
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from app.services.tts_service import TTSService, VoiceModel
from app.schemas.audio import CustomPronunciation, VoiceControlParams, Pause
from app.config import Settings


class TestChirp3Synthesis:
    """Test Chirp 3:HD synthesis methods"""

    @pytest.fixture
    def mock_tts_client(self):
        """Mock Google Cloud TTS client"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.audio_content = b"fake_audio_content"
        mock_client.synthesize_speech.return_value = mock_response
        return mock_client

    @pytest.fixture
    def tts_service(self, mock_tts_client):
        """Create TTSService with mocked client"""
        with patch('app.services.tts_service.texttospeech.TextToSpeechClient') as mock_client_class:
            mock_client_class.return_value = mock_tts_client
            service = TTSService()
            service.client = mock_tts_client
            return service

    def test_generate_chirp3_markup_basic(self, tts_service):
        """Test basic Chirp 3:HD markup generation"""
        text = "Hello World"
        markup = tts_service.generate_chirp3_markup(text, "pip_boy")
        assert text in markup
        assert isinstance(markup, str)

    def test_generate_chirp3_markup_with_voice_controls(self, tts_service):
        """Test markup generation with voice controls"""
        text = "Hello World"
        voice_controls = VoiceControlParams(
            pitch=5.0,
            rate=1.2,
            volume=1.0
        )
        markup = tts_service.generate_chirp3_markup(
            text, "pip_boy", voice_controls=voice_controls
        )
        assert "[pitch" in markup or "[pace" in markup
        assert isinstance(markup, str)

    def test_generate_chirp3_markup_with_pauses(self, tts_service):
        """Test markup generation with pauses"""
        text = "Hello World"
        pauses = [
            Pause(position=5, duration="medium"),
            Pause(position=11, duration="short")
        ]
        voice_controls = VoiceControlParams(pauses=pauses)
        markup = tts_service.generate_chirp3_markup(
            text, "pip_boy", voice_controls=voice_controls
        )
        assert "[pause" in markup

    def test_insert_pauses(self, tts_service):
        """Test pause insertion"""
        text = "Hello World"
        pauses = [
            Pause(position=5, duration="medium")
        ]
        result = tts_service._insert_pauses(text, pauses)
        assert "[pause medium]" in result
        assert len(result) > len(text)

    def test_insert_pauses_multiple(self, tts_service):
        """Test multiple pause insertion"""
        text = "Hello World Test"
        pauses = [
            Pause(position=5, duration="medium"),
            Pause(position=11, duration="short")
        ]
        result = tts_service._insert_pauses(text, pauses)
        assert "[pause medium]" in result
        assert "[pause short]" in result

    def test_insert_pauses_invalid_position(self, tts_service):
        """Test pause insertion with invalid position"""
        text = "Hello"
        pauses = [
            Pause(position=100, duration="medium")  # Invalid position
        ]
        result = tts_service._insert_pauses(text, pauses)
        # Should return original text or handle gracefully
        assert isinstance(result, str)

    def test_build_custom_pronunciations(self, tts_service):
        """Test building custom pronunciations"""
        custom_prons = [
            CustomPronunciation(
                phrase="Pip-Boy",
                pronunciation="pɪp bɔɪ"
            )
        ]
        result = tts_service._build_custom_pronunciations(custom_prons)
        assert result is not None
        assert len(result) == 1

    def test_build_custom_pronunciations_empty(self, tts_service):
        """Test building empty pronunciations"""
        result = tts_service._build_custom_pronunciations(None)
        assert result is None

    def test_synthesize_chirp3_success(self, tts_service, mock_tts_client):
        """Test successful Chirp 3:HD synthesis"""
        mock_response = Mock()
        mock_response.audio_content = b"fake_audio_content"
        mock_tts_client.synthesize_speech.return_value = mock_response

        result = tts_service._synthesize_chirp3(
            text="Test text",
            character_key="pip_boy"
        )

        assert result["audio_content"] == b"fake_audio_content"
        assert result["voice_model"] == "chirp3-hd"
        assert result["voice_name"].startswith("en-US-Chirp3-HD-")
        assert "duration" in result
        assert "file_size" in result

    def test_synthesize_chirp3_invalid_character(self, tts_service):
        """Test synthesis with invalid character"""
        with pytest.raises(ValueError, match="No Chirp 3:HD voice"):
            tts_service._synthesize_chirp3(
                text="Test",
                character_key="invalid_character"
            )

    def test_synthesize_chirp3_with_voice_controls(self, tts_service, mock_tts_client):
        """Test synthesis with voice controls"""
        mock_response = Mock()
        mock_response.audio_content = b"fake_audio_content"
        mock_tts_client.synthesize_speech.return_value = mock_response

        voice_controls = VoiceControlParams(
            pitch=5.0,
            rate=1.2
        )

        result = tts_service._synthesize_chirp3(
            text="Test text",
            character_key="pip_boy",
            voice_controls=voice_controls
        )

        assert result["voice_model"] == "chirp3-hd"
        # Verify voice controls were applied
        assert result["ssml_params"]["pitch"] == 5.0
        assert result["ssml_params"]["rate"] == 1.2

    def test_synthesize_chirp3_with_custom_pronunciations(self, tts_service, mock_tts_client):
        """Test synthesis with custom pronunciations"""
        mock_response = Mock()
        mock_response.audio_content = b"fake_audio_content"
        mock_tts_client.synthesize_speech.return_value = mock_response

        custom_prons = [
            CustomPronunciation(
                phrase="Pip-Boy",
                pronunciation="pɪp bɔɪ"
            )
        ]

        result = tts_service._synthesize_chirp3(
            text="Test Pip-Boy text",
            character_key="pip_boy",
            custom_pronunciations=custom_prons
        )

        assert result["voice_model"] == "chirp3-hd"
        # Verify API was called
        mock_tts_client.synthesize_speech.assert_called_once()

    def test_synthesize_chirp3_client_not_initialized(self):
        """Test synthesis when client not initialized"""
        service = TTSService()
        service.client = None

        with pytest.raises(Exception, match="TTS client not initialized"):
            service._synthesize_chirp3(
                text="Test",
                character_key="pip_boy"
            )

    def test_synthesize_chirp3_api_error(self, tts_service, mock_tts_client):
        """Test synthesis with API error"""
        mock_tts_client.synthesize_speech.side_effect = Exception("API Error")

        with pytest.raises(Exception, match="API Error"):
            tts_service._synthesize_chirp3(
                text="Test",
                character_key="pip_boy"
            )

    def test_all_characters_have_chirp3_voices(self, tts_service):
        """Test that all characters have Chirp 3:HD voice assignments"""
        from app.services.tts_service import CHIRP3_VOICE_MAPPING, DEFAULT_VOICE_CONFIGS

        # Check all characters in DEFAULT_VOICE_CONFIGS have Chirp 3:HD voices
        for char_key in DEFAULT_VOICE_CONFIGS.keys():
            assert char_key in CHIRP3_VOICE_MAPPING, \
                f"Character {char_key} missing Chirp 3:HD voice mapping"
            assert CHIRP3_VOICE_MAPPING[char_key].startswith("en-US-Chirp3-HD-"), \
                f"Invalid Chirp 3:HD voice name for {char_key}: {CHIRP3_VOICE_MAPPING[char_key]}"

    def test_chirp3_fallback_to_wavenet(self, tts_service, mock_tts_client):
        """Test automatic fallback to WaveNet on Chirp 3:HD failure"""
        from unittest.mock import patch

        # Mock Chirp 3:HD failure
        mock_tts_client.synthesize_speech.side_effect = Exception("Chirp 3:HD API Error")

        # Mock router settings to enable fallback
        with patch.object(tts_service, 'router') as mock_router:
            mock_router.settings.chirp3_fallback_to_wavenet = True

            # Mock WaveNet synthesis to succeed
            with patch.object(tts_service, '_synthesize_wavenet') as mock_wavenet:
                mock_wavenet.return_value = {
                    "audio_content": b"wavenet_audio",
                    "duration": 1.5,
                    "file_size": 1024,
                    "text_length": 10,
                    "voice_name": "cmn-TW-Wavenet-B",
                    "voice_model": "wavenet",
                    "ssml_params": {"pitch": 0.0, "rate": 1.0}
                }

                # Use synthesize_speech which should trigger fallback
                result = tts_service.synthesize_speech(
                    text="Test",
                    character_key="pip_boy",
                    force_voice_model="chirp3-hd"
                )

                # Should have fallen back to WaveNet
                assert result["voice_model"] == "wavenet"
                assert mock_wavenet.called, "WaveNet fallback should have been called"
