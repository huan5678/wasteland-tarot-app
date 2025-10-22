"""
Test Audio Story API Endpoints (Task 8.1 - Red Phase)

測試故事音檔 API 端點：
- POST /api/v1/audio/generate/story - 生成故事音檔
- GET /api/v1/audio/story/{card_id} - 取得故事音檔 URL
- GET /api/v1/cards/{id}?include_story=true - 整合音檔 URL
"""

import pytest
import pytest_asyncio
from uuid import uuid4
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.models.wasteland_card import WastelandCard
from app.models.audio_file import AudioFile, AudioType, GenerationStatus
from app.models.character_voice import Character


@pytest.mark.asyncio
class TestAudioStoryEndpoints:
    """測試故事音檔 API 端點"""

    # ==========================================
    # POST /api/v1/audio/generate/story - 生成故事音檔
    # ==========================================

    async def test_generate_story_audio_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試成功生成故事音檔

        Given: 有效的卡牌 ID 和角色列表
        When: POST /api/v1/audio/generate/story
        Then: 返回 201 狀態碼和音檔 URL
        """
        # 建立測試卡牌與故事
        card = WastelandCard(
            id=uuid4(),
            name="The Wanderer",
            suit="major_arcana",
            number=0,
            upright_meaning="New beginnings",
            reversed_meaning="Fear of change",
            story_background="這是一個200到500字之間的故事內容..." * 10,
            story_character="Lone Wanderer",
            story_location="Vault 101",
            story_timeline="2277 年",
            story_faction_involved=["brotherhood", "ncr"],
            story_related_quest="Following in His Footsteps"
        )
        db_session.add(card)

        # 建立測試角色
        characters = [
            Character(
                id=uuid4(),
                key="brotherhood_scribe",
                name="Brotherhood Scribe",
                description="A learned member of the Brotherhood of Steel",
                is_active=True
            ),
            Character(
                id=uuid4(),
                key="ncr_ranger",
                name="NCR Ranger",
                description="A veteran ranger from New California Republic",
                is_active=True
            )
        ]
        for char in characters:
            db_session.add(char)

        await db_session.commit()

        # Mock TTS 和 Storage 服務
        with patch('app.services.story_audio_service.StoryAudioService.generate_story_audio') as mock_generate:
            mock_generate.return_value = {
                "brotherhood_scribe": "https://storage.supabase.co/story/card-001/brotherhood_scribe.mp3",
                "ncr_ranger": "https://storage.supabase.co/story/card-001/ncr_ranger.mp3"
            }

            # 發送請求
            response = await async_client.post(
                "/api/v1/audio/generate/story",
                json={
                    "card_id": str(card.id),
                    "character_keys": ["brotherhood_scribe", "ncr_ranger"],
                    "force_regenerate": False
                }
            )

            # 驗證
            assert response.status_code == 201
            data = response.json()
            assert data["card_id"] == str(card.id)
            assert "brotherhood_scribe" in data["audio_urls"]
            assert "ncr_ranger" in data["audio_urls"]
            assert "cached" in data
            assert "generated_at" in data

    async def test_generate_story_audio_cached_response(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試快取回應

        Given: 已存在的音檔
        When: POST /api/v1/audio/generate/story
        Then: 返回快取的 URL，cached=True
        """
        # 建立測試卡牌
        card = WastelandCard(
            id=uuid4(),
            name="The Fool",
            suit="major_arcana",
            number=0,
            upright_meaning="New journey",
            reversed_meaning="Recklessness",
            is_major_arcana=True,
            is_court_card=False,
            story_background="測試故事內容..." * 30
        )
        db_session.add(card)

        # 建立角色
        character = Character(
            id=uuid4(),
            key="pip_boy",
            name="Pip-Boy",
            description="Your faithful Pip-Boy companion",
            is_active=True
        )
        db_session.add(character)
        await db_session.commit()

        # 建立已存在的音檔記錄
        audio_file = AudioFile(
            id=uuid4(),
            card_id=card.id,
            character_id=character.id,
            storage_path="story/card-001/pip_boy.mp3",
            storage_url="https://storage.supabase.co/story/card-001/pip_boy.mp3",
            file_size=1024000,
            duration_seconds=30.5,
            text_length=300,
            text_hash="abc123def456",
            language_code="zh-TW",
            voice_name="zh-TW-Wavenet-A",
            ssml_params={},
            audio_type=AudioType.STATIC_CARD,
            generation_status=GenerationStatus.COMPLETED
        )
        db_session.add(audio_file)
        await db_session.commit()

        # Mock service to return cached URL
        with patch('app.services.story_audio_service.StoryAudioService.generate_story_audio') as mock_generate:
            mock_generate.return_value = {
                "pip_boy": audio_file.storage_url
            }

            response = await async_client.post(
                "/api/v1/audio/generate/story",
                json={
                    "card_id": str(card.id),
                    "character_keys": ["pip_boy"]
                }
            )

            assert response.status_code == 201
            data = response.json()
            assert data["cached"]["pip_boy"] is True

    async def test_generate_story_audio_rate_limiting(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試 Rate Limiting（每分鐘 10 次請求）

        Given: 超過 10 次請求
        When: POST /api/v1/audio/generate/story
        Then: 返回 429 Too Many Requests
        """
        # 建立測試卡牌
        card = WastelandCard(
            id=uuid4(),
            name="Test Card",
            suit="major_arcana",
            number=0,
            upright_meaning="Test",
            reversed_meaning="Test",
            is_major_arcana=True,
            is_court_card=False,
            story_background="測試內容..." * 30
        )
        db_session.add(card)

        character = Character(
            id=uuid4(),
            key="pip_boy",
            name="Pip-Boy",
            description="Your faithful Pip-Boy companion",
            is_active=True
        )
        db_session.add(character)
        await db_session.commit()

        # Mock service
        with patch('app.services.story_audio_service.StoryAudioService.generate_story_audio') as mock_generate:
            mock_generate.return_value = {"pip_boy": "https://test.mp3"}

            # 發送 11 次請求
            for i in range(11):
                response = await async_client.post(
                    "/api/v1/audio/generate/story",
                    json={
                        "card_id": str(card.id),
                        "character_keys": ["pip_boy"]
                    }
                )

                if i < 10:
                    # 前 10 次應該成功
                    assert response.status_code in [200, 201]
                else:
                    # 第 11 次應該被限制
                    assert response.status_code == 429
                    assert "rate limit" in response.json()["detail"].lower()

    async def test_generate_story_audio_card_not_found(
        self,
        async_client: AsyncClient
    ):
        """
        測試卡牌不存在錯誤

        Given: 不存在的卡牌 ID
        When: POST /api/v1/audio/generate/story
        Then: 返回 404 Not Found
        """
        fake_id = uuid4()
        response = await async_client.post(
            "/api/v1/audio/generate/story",
            json={
                "card_id": str(fake_id),
                "character_keys": ["pip_boy"]
            }
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_generate_story_audio_tts_failure(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試 TTS 服務失敗

        Given: TTS 服務無法使用
        When: POST /api/v1/audio/generate/story
        Then: 返回 503 Service Unavailable 和降級方案提示
        """
        # 建立測試卡牌
        card = WastelandCard(
            id=uuid4(),
            name="Test Card",
            suit="major_arcana",
            number=0,
            upright_meaning="Test",
            reversed_meaning="Test",
            is_major_arcana=True,
            is_court_card=False,
            story_background="測試內容..." * 30
        )
        db_session.add(card)

        character = Character(
            id=uuid4(),
            key="pip_boy",
            name="Pip-Boy",
            description="Your faithful Pip-Boy companion",
            is_active=True
        )
        db_session.add(character)
        await db_session.commit()

        # Mock TTS service to fail
        with patch('app.services.story_audio_service.StoryAudioService.generate_story_audio') as mock_generate:
            mock_generate.side_effect = Exception("TTS service unavailable")

            response = await async_client.post(
                "/api/v1/audio/generate/story",
                json={
                    "card_id": str(card.id),
                    "character_keys": ["pip_boy"]
                }
            )

            assert response.status_code == 503
            data = response.json()
            assert data["error"] == "tts_service_unavailable"
            assert data["fallback"] == "web_speech_api"

    # ==========================================
    # GET /api/v1/audio/story/{card_id} - 取得故事音檔 URL
    # ==========================================

    async def test_get_story_audio_urls_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試成功取得故事音檔 URL

        Given: 卡牌有已生成的音檔
        When: GET /api/v1/audio/story/{card_id}
        Then: 返回 200 和所有音檔 URL
        """
        # 建立測試卡牌
        card = WastelandCard(
            id=uuid4(),
            name="The Wanderer",
            suit="major_arcana",
            number=0,
            upright_meaning="New beginnings",
            reversed_meaning="Fear",
            is_major_arcana=True,
            is_court_card=False
        )
        db_session.add(card)

        # 建立角色
        characters = [
            Character(id=uuid4(), key="pip_boy", name="Pip-Boy", description="Your faithful Pip-Boy companion", is_active=True),
            Character(id=uuid4(), key="vault_dweller", name="Vault Dweller", description="A resident of the vault", is_active=True)
        ]
        for char in characters:
            db_session.add(char)
        await db_session.commit()

        # 建立音檔記錄
        audio_files = [
            AudioFile(
                id=uuid4(),
                card_id=card.id,
                character_id=characters[0].id,
                storage_path="story/pip_boy.mp3",
                storage_url="https://storage.supabase.co/story/pip_boy.mp3",
                file_size=1024000,
                duration_seconds=30.0,
                text_length=300,
                text_hash="hash1",
                language_code="zh-TW",
                voice_name="zh-TW-Wavenet-A",
                ssml_params={},
                audio_type=AudioType.STATIC_CARD,
                generation_status=GenerationStatus.COMPLETED
            ),
            AudioFile(
                id=uuid4(),
                card_id=card.id,
                character_id=characters[1].id,
                storage_path="story/vault_dweller.mp3",
                storage_url="https://storage.supabase.co/story/vault_dweller.mp3",
                file_size=1024000,
                duration_seconds=32.0,
                text_length=300,
                text_hash="hash2",
                language_code="zh-TW",
                voice_name="zh-TW-Wavenet-B",
                ssml_params={},
                audio_type=AudioType.STATIC_CARD,
                generation_status=GenerationStatus.COMPLETED
            )
        ]
        for audio in audio_files:
            db_session.add(audio)
        await db_session.commit()

        # 發送請求
        response = await async_client.get(f"/api/v1/audio/story/{card.id}")

        # 驗證
        assert response.status_code == 200
        data = response.json()
        assert data["card_id"] == str(card.id)
        assert "pip_boy" in data["audio_urls"]
        assert "vault_dweller" in data["audio_urls"]
        assert data["audio_urls"]["pip_boy"] == "https://storage.supabase.co/story/pip_boy.mp3"

        # 驗證 Cache-Control header
        assert "cache-control" in response.headers
        assert "public" in response.headers["cache-control"]

    async def test_get_story_audio_urls_filter_by_character(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試過濾特定角色

        Given: 卡牌有多個角色音檔
        When: GET /api/v1/audio/story/{card_id}?character_key=pip_boy
        Then: 只返回該角色的 URL
        """
        # 建立測試資料（同上）
        card = WastelandCard(
            id=uuid4(),
            name="Test",
            suit="major_arcana",
            number=0,
            upright_meaning="Test",
            reversed_meaning="Test",
            is_major_arcana=True,
            is_court_card=False
        )
        db_session.add(card)

        characters = [
            Character(id=uuid4(), key="pip_boy", name="Pip-Boy", description="Your faithful Pip-Boy companion", is_active=True),
            Character(id=uuid4(), key="vault_dweller", name="Vault Dweller", description="A resident of the vault", is_active=True)
        ]
        for char in characters:
            db_session.add(char)
        await db_session.commit()

        audio_files = [
            AudioFile(
                id=uuid4(),
                card_id=card.id,
                character_id=characters[0].id,
                storage_path="story/pip_boy.mp3",
                storage_url="https://storage.supabase.co/pip_boy.mp3",
                file_size=1024000,
                duration_seconds=30.0,
                text_length=300,
                text_hash="hash1",
                language_code="zh-TW",
                voice_name="zh-TW-Wavenet-A",
                ssml_params={},
                audio_type=AudioType.STATIC_CARD,
                generation_status=GenerationStatus.COMPLETED
            ),
            AudioFile(
                id=uuid4(),
                card_id=card.id,
                character_id=characters[1].id,
                storage_path="story/vault_dweller.mp3",
                storage_url="https://storage.supabase.co/vault_dweller.mp3",
                file_size=1024000,
                duration_seconds=32.0,
                text_length=300,
                text_hash="hash2",
                language_code="zh-TW",
                voice_name="zh-TW-Wavenet-B",
                ssml_params={},
                audio_type=AudioType.STATIC_CARD,
                generation_status=GenerationStatus.COMPLETED
            )
        ]
        for audio in audio_files:
            db_session.add(audio)
        await db_session.commit()

        # 發送請求，只要 pip_boy
        response = await async_client.get(
            f"/api/v1/audio/story/{card.id}",
            params={"character_key": "pip_boy"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "pip_boy" in data["audio_urls"]
        assert "vault_dweller" not in data["audio_urls"]

    async def test_get_story_audio_urls_card_not_found(
        self,
        async_client: AsyncClient
    ):
        """
        測試卡牌不存在

        Given: 不存在的卡牌 ID
        When: GET /api/v1/audio/story/{card_id}
        Then: 返回 404
        """
        fake_id = uuid4()
        response = await async_client.get(f"/api/v1/audio/story/{fake_id}")

        assert response.status_code == 404

    # ==========================================
    # GET /api/v1/cards/{id}?include_story=true - 整合測試
    # ==========================================

    async def test_get_card_with_audio_urls_integration(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試卡牌查詢端點整合音檔 URL

        Given: include_story=true
        When: GET /api/v1/cards/{id}?include_story=true
        Then: 回應包含 story 和 audioUrls
        """
        # 建立完整測試卡牌
        card = WastelandCard(
            id=uuid4(),
            name="The Wanderer",
            suit="major_arcana",
            number=0,
            upright_meaning="New beginnings",
            reversed_meaning="Fear",
            is_major_arcana=True,
            is_court_card=False,
            story_background="完整故事內容..." * 30,
            story_character="Lone Wanderer",
            story_location="Vault 101",
            story_timeline="2277 年",
            story_faction_involved=["brotherhood"],
            story_related_quest="Following in His Footsteps"
        )
        db_session.add(card)

        character = Character(
            id=uuid4(),
            key="pip_boy",
            name="Pip-Boy",
            description="Your faithful Pip-Boy companion",
            is_active=True
        )
        db_session.add(character)
        await db_session.commit()

        audio = AudioFile(
            id=uuid4(),
            card_id=card.id,
            character_id=character.id,
            storage_path="story/pip_boy.mp3",
            storage_url="https://storage.supabase.co/story/pip_boy.mp3",
            file_size=1024000,
            duration_seconds=30.0,
            text_length=300,
            text_hash="hash",
            language_code="zh-TW",
            voice_name="zh-TW-Wavenet-A",
            ssml_params={},
            audio_type=AudioType.STATIC_CARD,
            generation_status=GenerationStatus.COMPLETED
        )
        db_session.add(audio)
        await db_session.commit()

        # 發送請求
        response = await async_client.get(
            f"/api/v1/cards/{card.id}",
            params={"include_story": True}
        )

        # 驗證
        assert response.status_code == 200
        data = response.json()

        # 驗證故事內容
        assert "story" in data
        assert data["story"]["background"] is not None
        assert data["story"]["character"] == "Lone Wanderer"

        # 驗證音檔 URL
        assert "audio_urls" in data
        assert "pip_boy" in data["audio_urls"]

        # 驗證效能（應該 <150ms）
        # 這裡只是結構測試，效能測試應在 performance tests

    async def test_get_card_without_story_no_audio_urls(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試不包含故事時不返回音檔 URL

        Given: include_story=false (預設)
        When: GET /api/v1/cards/{id}
        Then: 不包含 audioUrls 欄位
        """
        card = WastelandCard(
            id=uuid4(),
            name="Test Card",
            suit="major_arcana",
            number=0,
            upright_meaning="Test",
            reversed_meaning="Test",
            is_major_arcana=True,
            is_court_card=False
        )
        db_session.add(card)
        await db_session.commit()

        response = await async_client.get(f"/api/v1/cards/{card.id}")

        assert response.status_code == 200
        data = response.json()
        assert "story" not in data
        assert "audio_urls" not in data
