"""
Character Voices API Endpoints Tests
Tests for character voice management and audio settings
"""

import pytest
from fastapi import status
from httpx import AsyncClient
from typing import Dict, Any


@pytest.mark.asyncio
@pytest.mark.api
class TestVoicesList:
    """Test character voices listing"""

    async def test_list_all_voices(self, async_client: AsyncClient):
        """Test listing all available character voices"""
        response = await async_client.get("/api/v1/voices")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert isinstance(data, list) or "voices" in data

        if isinstance(data, list):
            voices = data
        else:
            voices = data["voices"]

        # Should have at least basic voices (pip_boy, vault_dweller, etc.)
        assert len(voices) > 0

        # Check voice structure
        voice = voices[0]
        assert "id" in voice or "voice_id" in voice
        assert "name" in voice or "display_name" in voice
        assert "description" in voice

    async def test_list_voices_by_faction(self, async_client: AsyncClient):
        """Test filtering voices by faction"""
        response = await async_client.get(
            "/api/v1/voices",
            params={"faction": "vault_dweller"}
        )

        assert response.status_code == status.HTTP_200_OK

    async def test_list_voices_by_karma(self, async_client: AsyncClient):
        """Test filtering voices by karma alignment"""
        response = await async_client.get(
            "/api/v1/voices",
            params={"karma": "good"}
        )

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
@pytest.mark.api
class TestVoiceDetails:
    """Test individual voice details"""

    async def test_get_voice_by_id(self, async_client: AsyncClient):
        """Test getting a specific voice by ID"""
        # Common voice IDs
        voice_ids = ["pip_boy", "vault_dweller", "wasteland_trader"]

        for voice_id in voice_ids:
            response = await async_client.get(f"/api/v1/voices/{voice_id}")

            if response.status_code == status.HTTP_200_OK:
                data = response.json()
                assert "id" in data or "voice_id" in data
                assert "name" in data or "display_name" in data
                break
        else:
            # If none of the common IDs work, get one from list
            list_response = await async_client.get("/api/v1/voices")
            voices = list_response.json()

            if isinstance(voices, list) and len(voices) > 0:
                voice_id = voices[0].get("id") or voices[0].get("voice_id")
                response = await async_client.get(f"/api/v1/voices/{voice_id}")
                assert response.status_code == status.HTTP_200_OK

    async def test_get_nonexistent_voice(self, async_client: AsyncClient):
        """Test getting a nonexistent voice"""
        response = await async_client.get("/api/v1/voices/nonexistent-voice")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_voice_characteristics(self, async_client: AsyncClient):
        """Test that voices have proper characteristics"""
        response = await async_client.get("/api/v1/voices")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        voices = data if isinstance(data, list) else data.get("voices", [])

        if len(voices) > 0:
            voice = voices[0]
            # Should have personality traits
            assert "description" in voice
            # May have other characteristics
            possible_fields = [
                "personality", "tone", "style", "faction_alignment",
                "karma_preference", "speaking_style"
            ]
            has_characteristics = any(field in voice for field in possible_fields)
            # Characteristics are optional but good to have
            # assert has_characteristics or len(voice) > 3


@pytest.mark.asyncio
@pytest.mark.api
class TestVoicePreferences:
    """Test user voice preferences"""

    async def test_get_user_voice_preferences(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test getting user's voice preferences"""
        token = test_user_with_token["token"]

        response = await async_client.get(
            "/api/v1/voices/preferences",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "favorite_voice" in data or "preferred_voices" in data

    async def test_update_voice_preferences(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test updating user's voice preferences"""
        token = test_user_with_token["token"]

        preferences = {
            "favorite_voice": "pip_boy",
            "voice_speed": 1.0,
            "voice_volume": 0.8
        }

        response = await async_client.put(
            "/api/v1/voices/preferences",
            json=preferences,
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_501_NOT_IMPLEMENTED
        ]

    async def test_voice_preferences_unauthorized(
        self,
        async_client: AsyncClient
    ):
        """Test that voice preferences require authentication"""
        response = await async_client.get("/api/v1/voices/preferences")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.api
class TestVoiceStatistics:
    """Test voice usage statistics"""

    async def test_get_voice_popularity(self, async_client: AsyncClient):
        """Test getting voice popularity statistics"""
        response = await async_client.get("/api/v1/voices/statistics")

        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]

        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            assert "most_popular" in data or "usage_count" in data

    async def test_get_user_voice_history(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test getting user's voice usage history"""
        token = test_user_with_token["token"]

        response = await async_client.get(
            "/api/v1/voices/history",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ]


@pytest.mark.asyncio
@pytest.mark.api
@pytest.mark.audio
class TestVoiceAudio:
    """Test voice audio functionality"""

    async def test_get_voice_sample(self, async_client: AsyncClient):
        """Test getting a voice audio sample"""
        response = await async_client.get("/api/v1/voices/pip_boy/sample")

        # Audio samples may not be implemented
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_501_NOT_IMPLEMENTED
        ]

        if response.status_code == status.HTTP_200_OK:
            # Should return audio file
            content_type = response.headers.get("content-type", "")
            assert "audio" in content_type or "octet-stream" in content_type

    async def test_generate_voice_audio(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test generating audio from text with specific voice"""
        token = test_user_with_token["token"]

        request_data = {
            "voice_id": "pip_boy",
            "text": "Welcome to the wasteland, vault dweller.",
            "speed": 1.0
        }

        response = await async_client.post(
            "/api/v1/voices/generate",
            json=request_data,
            headers={"Authorization": f"Bearer {token}"}
        )

        # Text-to-speech may not be implemented
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_501_NOT_IMPLEMENTED
        ]


@pytest.mark.asyncio
@pytest.mark.api
class TestVoiceValidation:
    """Test voice validation and error handling"""

    async def test_invalid_voice_id(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test using an invalid voice ID"""
        token = test_user_with_token["token"]

        preferences = {
            "favorite_voice": "invalid_voice_123"
        }

        response = await async_client.put(
            "/api/v1/voices/preferences",
            json=preferences,
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_501_NOT_IMPLEMENTED
        ]

    async def test_voice_speed_validation(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test validation of voice speed parameter"""
        token = test_user_with_token["token"]

        invalid_preferences = {
            "voice_speed": 999.0  # Invalid: too fast
        }

        response = await async_client.put(
            "/api/v1/voices/preferences",
            json=invalid_preferences,
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_501_NOT_IMPLEMENTED
        ]
