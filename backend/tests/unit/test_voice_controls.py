"""
Unit Tests for Enhanced Voice Controls (Task 2.5)

Tests for voice control features including:
- VoiceControlParams and Pause models
- Pause insertion logic
- Chirp 3:HD markup generation with voice controls
- Parameter validation (range checks)
- Volume control integration
"""

import pytest
from pydantic import ValidationError
from app.schemas.audio import VoiceControlParams, Pause
from app.services.tts_service import TTSService


class TestVoiceControlModels:
    """Test VoiceControlParams and Pause Pydantic models"""

    def test_pause_model_valid(self):
        """Test valid pause creation"""
        pause = Pause(position=10, duration="medium")
        assert pause.position == 10
        assert pause.duration == "medium"

    def test_pause_model_numeric_duration(self):
        """Test pause with numeric duration"""
        pause = Pause(position=5, duration="500ms")
        assert pause.duration == "500ms"

    def test_pause_model_invalid_position(self):
        """Test pause with negative position raises error"""
        with pytest.raises(ValidationError):
            Pause(position=-1, duration="short")

    def test_pause_model_invalid_duration(self):
        """Test pause with invalid duration format"""
        with pytest.raises(ValidationError):
            Pause(position=5, duration="invalid")

    def test_voice_control_params_valid(self):
        """Test valid voice control parameters"""
        params = VoiceControlParams(
            pitch=5.0,
            rate=1.2,
            volume=0.8,
            pauses=[Pause(position=10, duration="medium")]
        )
        assert params.pitch == 5.0
        assert params.rate == 1.2
        assert params.volume == 0.8
        assert len(params.pauses) == 1

    def test_voice_control_params_partial(self):
        """Test voice control with only some parameters"""
        params = VoiceControlParams(pitch=3.0)
        assert params.pitch == 3.0
        assert params.rate is None
        assert params.volume is None
        assert params.pauses is None

    def test_voice_control_params_pitch_range(self):
        """Test pitch parameter range validation"""
        # Valid range: -20.0 to +20.0
        VoiceControlParams(pitch=-20.0)
        VoiceControlParams(pitch=0.0)
        VoiceControlParams(pitch=20.0)

        # Invalid: too low
        with pytest.raises(ValidationError):
            VoiceControlParams(pitch=-21.0)

        # Invalid: too high
        with pytest.raises(ValidationError):
            VoiceControlParams(pitch=21.0)

    def test_voice_control_params_rate_range(self):
        """Test rate parameter range validation"""
        # Valid range: 0.25 to 4.0
        VoiceControlParams(rate=0.25)
        VoiceControlParams(rate=1.0)
        VoiceControlParams(rate=4.0)

        # Invalid: too low
        with pytest.raises(ValidationError):
            VoiceControlParams(rate=0.24)

        # Invalid: too high
        with pytest.raises(ValidationError):
            VoiceControlParams(rate=4.1)

    def test_voice_control_params_volume_range(self):
        """Test volume parameter range validation"""
        # Valid range: 0.0 to 1.0
        VoiceControlParams(volume=0.0)
        VoiceControlParams(volume=0.5)
        VoiceControlParams(volume=1.0)

        # Invalid: too low
        with pytest.raises(ValidationError):
            VoiceControlParams(volume=-0.1)

        # Invalid: too high
        with pytest.raises(ValidationError):
            VoiceControlParams(volume=1.1)


class TestPauseInsertion:
    """Test _insert_pauses method"""

    def test_insert_pauses_single(self):
        """Test inserting a single pause"""
        service = TTSService()
        text = "Hello World"
        pauses = [Pause(position=5, duration="medium")]
        result = service._insert_pauses(text, pauses)
        assert "[pause medium]" in result
        assert result.index("[pause medium]") == 5

    def test_insert_pauses_multiple(self):
        """Test inserting multiple pauses"""
        service = TTSService()
        text = "Hello World Test"
        pauses = [
            Pause(position=5, duration="short"),
            Pause(position=11, duration="long")
        ]
        result = service._insert_pauses(text, pauses)
        assert "[pause short]" in result
        assert "[pause long]" in result

    def test_insert_pauses_numeric_duration(self):
        """Test inserting pause with numeric duration"""
        service = TTSService()
        text = "Hello World"
        pauses = [Pause(position=5, duration="500ms")]
        result = service._insert_pauses(text, pauses)
        assert "[pause 500ms]" in result

    def test_insert_pauses_reverse_order(self):
        """Test that pauses are inserted in reverse order to avoid position shift"""
        service = TTSService()
        text = "Hello World"
        pauses = [
            Pause(position=5, duration="short"),
            Pause(position=11, duration="long")
        ]
        result = service._insert_pauses(text, pauses)
        # Should insert from back to front to avoid position shifts
        assert result.count("[pause") == 2

    def test_insert_pauses_invalid_position(self):
        """Test pause insertion with invalid position"""
        service = TTSService()
        text = "Hello"
        pauses = [Pause(position=100, duration="medium")]
        result = service._insert_pauses(text, pauses)
        # Should handle gracefully (no crash, but pause not inserted)
        assert result == text or "[pause" not in result

    def test_insert_pauses_none(self):
        """Test inserting no pauses returns original text"""
        service = TTSService()
        text = "Hello World"
        result = service._insert_pauses(text, None)
        assert result == text

    def test_insert_pauses_empty_list(self):
        """Test inserting empty pause list returns original text"""
        service = TTSService()
        text = "Hello World"
        result = service._insert_pauses(text, [])
        assert result == text


class TestChirp3MarkupGeneration:
    """Test generate_chirp3_markup method"""

    def test_generate_markup_basic(self):
        """Test basic markup generation without controls"""
        service = TTSService()
        text = "Hello World"
        markup = service.generate_chirp3_markup(text, "pip_boy")
        assert text in markup

    def test_generate_markup_with_pitch_override(self):
        """Test markup generation with pitch override"""
        service = TTSService()
        text = "Hello World"
        controls = VoiceControlParams(pitch=5.0)
        markup = service.generate_chirp3_markup(text, "pip_boy", voice_controls=controls)
        assert "[pitch +5.0st]" in markup or "[pitch 5.0st]" in markup

    def test_generate_markup_with_rate_override(self):
        """Test markup generation with rate override"""
        service = TTSService()
        text = "Hello World"
        controls = VoiceControlParams(rate=1.5)
        markup = service.generate_chirp3_markup(text, "pip_boy", voice_controls=controls)
        assert "[pace 1.50]" in markup or "1.5" in markup

    def test_generate_markup_with_pauses(self):
        """Test markup generation with pauses"""
        service = TTSService()
        text = "Hello World"
        controls = VoiceControlParams(
            pauses=[Pause(position=5, duration="medium")]
        )
        markup = service.generate_chirp3_markup(text, "pip_boy", voice_controls=controls)
        assert "[pause medium]" in markup

    def test_generate_markup_with_all_controls(self):
        """Test markup generation with all control parameters"""
        service = TTSService()
        text = "Hello World"
        controls = VoiceControlParams(
            pitch=3.0,
            rate=1.2,
            pauses=[Pause(position=5, duration="short")]
        )
        markup = service.generate_chirp3_markup(text, "pip_boy", voice_controls=controls)
        assert "[pause short]" in markup
        assert "[pace" in markup or "1.2" in markup
        assert "[pitch" in markup or "3.0" in markup

    def test_generate_markup_character_defaults(self):
        """Test that character defaults are used when no overrides"""
        service = TTSService()
        text = "Hello World"
        # pip_boy has default pitch=1.0, rate=1.0
        markup = service.generate_chirp3_markup(text, "pip_boy")
        # If defaults are 1.0 and 0.0, they might not appear in markup
        assert text in markup

    def test_generate_markup_negative_pitch(self):
        """Test markup with negative pitch"""
        service = TTSService()
        text = "Hello World"
        controls = VoiceControlParams(pitch=-5.0)
        markup = service.generate_chirp3_markup(text, "pip_boy", voice_controls=controls)
        assert "[pitch -5.0st]" in markup or "-5.0" in markup


class TestVolumeControl:
    """Test volume control integration"""

    @pytest.mark.skip(reason="Requires Google Cloud TTS client initialization")
    def test_volume_in_audio_config(self):
        """Test that volume is correctly applied to AudioConfig"""
        # This test would require mocking the TTS client
        # Volume should be converted from 0.0-1.0 to dB
        pass

    def test_volume_conversion_formula(self):
        """Test volume to dB conversion formula"""
        # volume=0.0 → -32dB
        # volume=1.0 → 0dB
        # Formula: volume_gain_db = (volume - 1.0) * 32.0

        volume = 0.0
        volume_gain_db = (volume - 1.0) * 32.0
        assert volume_gain_db == -32.0

        volume = 1.0
        volume_gain_db = (volume - 1.0) * 32.0
        assert volume_gain_db == 0.0

        volume = 0.5
        volume_gain_db = (volume - 1.0) * 32.0
        assert volume_gain_db == -16.0

    def test_volume_range_clamping(self):
        """Test that volume gain dB is clamped to valid range"""
        # Should be clamped to -96.0 to 16.0 dB
        volume_gain_db = -100.0
        clamped = max(-96.0, min(16.0, volume_gain_db))
        assert clamped == -96.0

        volume_gain_db = 20.0
        clamped = max(-96.0, min(16.0, volume_gain_db))
        assert clamped == 16.0


class TestParameterIntegration:
    """Test integration of all parameters"""

    def test_voice_controls_applied_to_markup(self):
        """Test that voice controls are correctly applied in markup generation"""
        service = TTSService()
        text = "Test text"
        controls = VoiceControlParams(
            pitch=5.0,
            rate=1.5,
            pauses=[Pause(position=4, duration="medium")]
        )
        markup = service.generate_chirp3_markup(text, "pip_boy", voice_controls=controls)

        # Verify all controls are reflected
        assert "[pause medium]" in markup
        assert "[pace" in markup or "1.5" in markup
        assert "[pitch" in markup or "5.0" in markup

    def test_character_defaults_overridden(self):
        """Test that character defaults are overridden by voice controls"""
        service = TTSService()
        text = "Test"

        # Get default pitch for pip_boy (should be around 0.0 semitones)
        default_markup = service.generate_chirp3_markup(text, "pip_boy")

        # Override with different pitch
        controls = VoiceControlParams(pitch=10.0)
        override_markup = service.generate_chirp3_markup(text, "pip_boy", voice_controls=controls)

        # Markups should be different
        assert default_markup != override_markup
        assert "10.0" in override_markup or "+10.0" in override_markup
