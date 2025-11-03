"""
Unit Tests for Custom Pronunciation Support (Task 3.1)

Tests for custom pronunciation functionality including:
- CustomPronunciation model validation
- Cache key computation with pronunciations
- Pronunciation application
"""

import pytest
from app.schemas.audio import CustomPronunciation, VoiceControlParams
from app.services.tts_service import TTSService, VoiceModel


class TestCustomPronunciation:
    """Test custom pronunciation functionality"""

    def test_custom_pronunciation_model(self):
        """Test CustomPronunciation model creation"""
        pron = CustomPronunciation(
            phrase="Pip-Boy",
            pronunciation="pɪp bɔɪ"
        )
        assert pron.phrase == "Pip-Boy"
        assert pron.pronunciation == "pɪp bɔɪ"
        assert pron.phonetic_encoding == "PHONETIC_ENCODING_IPA"

    def test_custom_pronunciation_validation(self):
        """Test CustomPronunciation validation"""
        # Should work with valid data
        pron = CustomPronunciation(
            phrase="Tarot",
            pronunciation="ˈtæ.roʊ"
        )
        assert pron.phrase == "Tarot"

    def test_compute_cache_key_with_pronunciations(self):
        """Test cache key includes pronunciations"""
        service = TTSService()

        text = "I read a book"
        character_key = "pip_boy"

        # Without pronunciations
        key1 = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.CHIRP3_HD
        )

        # With pronunciations
        pronunciations = [
            CustomPronunciation(phrase="read", pronunciation="rɛd")
        ]
        key2 = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.CHIRP3_HD,
            custom_pronunciations=pronunciations
        )

        # Keys should be different
        assert key1 != key2

    def test_compute_cache_key_different_pronunciations(self):
        """Test different pronunciations produce different keys"""
        service = TTSService()

        text = "I read a book"
        character_key = "pip_boy"

        pronunciations1 = [
            CustomPronunciation(phrase="read", pronunciation="rɛd")
        ]
        key1 = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.CHIRP3_HD,
            custom_pronunciations=pronunciations1
        )

        pronunciations2 = [
            CustomPronunciation(phrase="read", pronunciation="riːd")
        ]
        key2 = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.CHIRP3_HD,
            custom_pronunciations=pronunciations2
        )

        # Keys should be different
        assert key1 != key2

    def test_compute_cache_key_same_pronunciations(self):
        """Test same pronunciations produce same key"""
        service = TTSService()

        text = "I read a book"
        character_key = "pip_boy"

        pronunciations = [
            CustomPronunciation(phrase="read", pronunciation="rɛd")
        ]

        key1 = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.CHIRP3_HD,
            custom_pronunciations=pronunciations
        )

        key2 = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.CHIRP3_HD,
            custom_pronunciations=pronunciations
        )

        # Keys should be identical
        assert key1 == key2

    def test_compute_cache_key_pronunciation_order(self):
        """Test pronunciation order doesn't affect key (sorted)"""
        service = TTSService()

        text = "Test"
        character_key = "pip_boy"

        # Different order
        pronunciations1 = [
            CustomPronunciation(phrase="b", pronunciation="b"),
            CustomPronunciation(phrase="a", pronunciation="a")
        ]
        key1 = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.CHIRP3_HD,
            custom_pronunciations=pronunciations1
        )

        pronunciations2 = [
            CustomPronunciation(phrase="a", pronunciation="a"),
            CustomPronunciation(phrase="b", pronunciation="b")
        ]
        key2 = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.CHIRP3_HD,
            custom_pronunciations=pronunciations2
        )

        # Keys should be identical (sorted)
        assert key1 == key2

    def test_compute_cache_key_voice_model_difference(self):
        """Test different voice models produce different keys"""
        service = TTSService()

        text = "Test"
        character_key = "pip_boy"

        key_wavenet = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.WAVENET
        )

        key_chirp3 = service.compute_cache_key(
            text=text,
            character_key=character_key,
            voice_model=VoiceModel.CHIRP3_HD
        )

        # Keys should be different
        assert key_wavenet != key_chirp3
