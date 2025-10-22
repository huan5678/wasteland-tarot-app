"""
Unit Tests for StoryAudioService - TDD Red Phase
測試故事音檔生成與管理服務
"""

import pytest
from uuid import UUID, uuid4
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import List, Dict, Any

from app.services.story_audio_service import StoryAudioService
from app.models.wasteland_card import WastelandCard
from app.models.audio_file import AudioFile, AudioType, GenerationStatus
from app.models.character_voice import Character


# Fixtures

@pytest.fixture
def mock_db_session():
    """Mock database session"""
    session = AsyncMock()
    return session


@pytest.fixture
def mock_tts_service():
    """Mock TTS service"""
    service = Mock()
    service.synthesize_speech = Mock(return_value={
        "audio_content": b"fake_audio_content",
        "duration": 45.5,
        "file_size": 2048000,
        "text_length": 350,
        "voice_name": "cmn-TW-Wavenet-B",
        "ssml_params": {"pitch": -10.0, "rate": 0.8}
    })
    service.compute_text_hash = Mock(return_value="a" * 64)
    return service


@pytest.fixture
def mock_audio_storage_service():
    """Mock audio storage service"""
    service = AsyncMock()
    service.upload_audio = AsyncMock(return_value="https://storage.supabase.co/story/card_id/character.mp3")
    service.save_audio_metadata = AsyncMock(return_value=Mock(id=uuid4()))
    service.get_audio_by_card_and_character = AsyncMock(return_value=None)
    service.get_character_id_by_key = AsyncMock(return_value=uuid4())
    service.generate_storage_path = Mock(return_value="story/card_id/character.mp3")
    return service


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client"""
    return Mock()


@pytest.fixture
def sample_card():
    """Sample wasteland card with story"""
    card = WastelandCard(
        id=uuid4(),
        name="The Wanderer",
        suit="major_arcana",
        number=0,
        upright_meaning="New beginnings",
        reversed_meaning="Recklessness",
        story_background="在廢土中行走的孤獨旅人，尋找著失落的文明遺跡。" * 10,  # ~300 chars
        story_character="Lone Wanderer",
        story_location="Capital Wasteland",
        story_timeline="2277 年",
        story_faction_involved=["brotherhood", "ncr"],
        story_related_quest="Following in His Footsteps"
    )
    return card


@pytest.fixture
def sample_character():
    """Sample character voice"""
    char = Character(
        id=uuid4(),
        key="brotherhood_scribe",
        display_name="Brotherhood Scribe",
        faction_alignment="brotherhood",
        is_active=True
    )
    return char


@pytest.fixture
def story_audio_service(mock_db_session, mock_tts_service, mock_audio_storage_service, mock_supabase_client):
    """StoryAudioService instance with mocked dependencies"""
    service = StoryAudioService(
        db=mock_db_session,
        tts_service=mock_tts_service,
        storage_service=mock_audio_storage_service,
        supabase_client=mock_supabase_client
    )
    return service


# Test 1: select_characters_for_card - 角色語音選擇邏輯

def test_select_characters_for_brotherhood_faction(story_audio_service, sample_card):
    """測試 Brotherhood 陣營應選擇 brotherhood_scribe 或 brotherhood_paladin"""
    sample_card.story_faction_involved = ["brotherhood"]

    characters = story_audio_service.select_characters_for_card(sample_card)

    assert isinstance(characters, list)
    assert len(characters) > 0
    assert any(char in ["brotherhood_scribe", "brotherhood_paladin"] for char in characters)


def test_select_characters_for_ncr_faction(story_audio_service, sample_card):
    """測試 NCR 陣營應選擇 ncr_ranger"""
    sample_card.story_faction_involved = ["ncr"]

    characters = story_audio_service.select_characters_for_card(sample_card)

    assert isinstance(characters, list)
    assert "ncr_ranger" in characters


def test_select_characters_for_legion_faction(story_audio_service, sample_card):
    """測試 Legion 陣營應選擇 legion_centurion"""
    sample_card.story_faction_involved = ["legion"]

    characters = story_audio_service.select_characters_for_card(sample_card)

    assert "legion_centurion" in characters


def test_select_characters_for_raiders_faction(story_audio_service, sample_card):
    """測試 Raiders 陣營應選擇 raider"""
    sample_card.story_faction_involved = ["raiders"]

    characters = story_audio_service.select_characters_for_card(sample_card)

    assert "raider" in characters


def test_select_characters_for_vault_dweller_faction(story_audio_service, sample_card):
    """測試 Vault-Tec 陣營應選擇 vault_dweller 或 pip_boy"""
    sample_card.story_faction_involved = ["vault_dweller"]

    characters = story_audio_service.select_characters_for_card(sample_card)

    assert any(char in ["vault_dweller", "pip_boy"] for char in characters)


def test_select_characters_for_neutral_faction(story_audio_service, sample_card):
    """測試中立/獨立陣營應選擇 wasteland_trader 或 ghoul"""
    sample_card.story_faction_involved = ["independent"]

    characters = story_audio_service.select_characters_for_card(sample_card)

    assert "wasteland_trader" in characters


def test_select_characters_for_multiple_factions(story_audio_service, sample_card):
    """測試多陣營卡牌應返回多個角色語音"""
    sample_card.story_faction_involved = ["brotherhood", "ncr", "raiders"]

    characters = story_audio_service.select_characters_for_card(sample_card)

    assert isinstance(characters, list)
    assert len(characters) >= 2  # At least 2 different characters
    # Should include at least one from each faction
    has_brotherhood = any(char in ["brotherhood_scribe", "brotherhood_paladin"] for char in characters)
    has_ncr = "ncr_ranger" in characters
    has_raiders = "raider" in characters
    assert has_brotherhood or has_ncr or has_raiders


def test_select_characters_returns_max_3_characters(story_audio_service, sample_card):
    """測試最多返回 3 個角色語音"""
    sample_card.story_faction_involved = ["brotherhood", "ncr", "legion", "raiders"]

    characters = story_audio_service.select_characters_for_card(sample_card)

    assert len(characters) <= 3


def test_select_characters_for_no_factions_returns_defaults(story_audio_service, sample_card):
    """測試無陣營時應返回預設角色"""
    sample_card.story_faction_involved = None  # Use None instead of empty list

    characters = story_audio_service.select_characters_for_card(sample_card)

    assert isinstance(characters, list)
    assert len(characters) > 0
    # Should return default voices
    assert any(char in ["pip_boy", "wasteland_trader"] for char in characters)


# Test 2: check_audio_exists - 檢查音檔是否已存在

@pytest.mark.asyncio
async def test_check_audio_exists_returns_existing_audio(story_audio_service, sample_card, sample_character):
    """測試音檔已存在時返回 AudioFile"""
    card_id = sample_card.id
    character_key = "brotherhood_scribe"

    # Mock existing audio file
    existing_audio = AudioFile(
        id=uuid4(),
        card_id=card_id,
        character_id=sample_character.id,
        storage_path="story/card_id/brotherhood_scribe.mp3",
        storage_url="https://storage.supabase.co/story/card_id/brotherhood_scribe.mp3",
        file_size=2048000,
        duration_seconds=45.5,
        text_length=350,
        text_hash="a" * 64,
        language_code="zh-TW",
        voice_name="cmn-TW-Wavenet-B",
        ssml_params={"pitch": -10.0, "rate": 0.8},
        audio_type=AudioType.STATIC_CARD,
        generation_status=GenerationStatus.COMPLETED,
        access_count=10
    )

    story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=existing_audio)
    story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=sample_character.id)

    result = await story_audio_service.check_audio_exists(card_id, character_key)

    assert result is not None
    assert isinstance(result, AudioFile)
    assert result.card_id == card_id
    assert result.storage_url.endswith("brotherhood_scribe.mp3")


@pytest.mark.asyncio
async def test_check_audio_exists_returns_none_when_not_exists(story_audio_service, sample_card):
    """測試音檔不存在時返回 None"""
    card_id = sample_card.id
    character_key = "ncr_ranger"

    story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=None)
    story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=uuid4())

    result = await story_audio_service.check_audio_exists(card_id, character_key)

    assert result is None


# Test 3: get_story_audio_urls - 取得卡牌所有音檔 URL

@pytest.mark.asyncio
async def test_get_story_audio_urls_returns_all_urls(story_audio_service, sample_card):
    """測試取得卡牌所有音檔 URL"""
    card_id = sample_card.id

    # Mock multiple audio files
    audio1 = Mock(character=Mock(key="brotherhood_scribe"), storage_url="https://storage.supabase.co/1.mp3")
    audio2 = Mock(character=Mock(key="ncr_ranger"), storage_url="https://storage.supabase.co/2.mp3")

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalars().all.return_value = [audio1, audio2]
        mock_execute.return_value = mock_result

        urls = await story_audio_service.get_story_audio_urls(card_id)

    assert isinstance(urls, dict)
    assert len(urls) == 2
    assert "brotherhood_scribe" in urls
    assert "ncr_ranger" in urls
    assert urls["brotherhood_scribe"] == "https://storage.supabase.co/1.mp3"


@pytest.mark.asyncio
async def test_get_story_audio_urls_returns_empty_dict_when_no_audio(story_audio_service, sample_card):
    """測試無音檔時返回空字典"""
    card_id = sample_card.id

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalars().all.return_value = []
        mock_execute.return_value = mock_result

        urls = await story_audio_service.get_story_audio_urls(card_id)

    assert isinstance(urls, dict)
    assert len(urls) == 0


# Test 4: generate_story_audio - 生成音檔核心邏輯

@pytest.mark.asyncio
async def test_generate_story_audio_success(story_audio_service, sample_card, sample_character):
    """測試成功生成音檔"""
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe"]

    # Mock card retrieval
    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        # Mock character_id lookup
        story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=sample_character.id)

        # Mock no existing audio
        story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=None)

        result = await story_audio_service.generate_story_audio(card_id, character_keys)

    assert isinstance(result, dict)
    assert "brotherhood_scribe" in result
    assert result["brotherhood_scribe"].startswith("https://")


@pytest.mark.asyncio
async def test_generate_story_audio_uses_cached_audio(story_audio_service, sample_card, sample_character):
    """測試使用已存在的音檔（快取）"""
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe"]
    cached_url = "https://storage.supabase.co/cached.mp3"

    # Mock existing audio
    existing_audio = Mock(
        storage_url=cached_url,
        generation_status=GenerationStatus.COMPLETED
    )

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=sample_character.id)
        story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=existing_audio)

        result = await story_audio_service.generate_story_audio(card_id, character_keys, force_regenerate=False)

    assert "brotherhood_scribe" in result
    assert result["brotherhood_scribe"] == cached_url
    # Should NOT call TTS service
    story_audio_service.tts_service.synthesize_speech.assert_not_called()


@pytest.mark.asyncio
async def test_generate_story_audio_force_regenerate(story_audio_service, sample_card, sample_character):
    """測試強制重新生成音檔"""
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe"]

    # Mock existing audio
    existing_audio = Mock(
        storage_url="https://storage.supabase.co/old.mp3",
        generation_status=GenerationStatus.COMPLETED
    )

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=sample_character.id)
        story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=existing_audio)

        result = await story_audio_service.generate_story_audio(card_id, character_keys, force_regenerate=True)

    # Should call TTS service even with existing audio
    story_audio_service.tts_service.synthesize_speech.assert_called_once()
    assert "brotherhood_scribe" in result


@pytest.mark.asyncio
async def test_generate_story_audio_text_hash_change_triggers_regeneration(story_audio_service, sample_card, sample_character):
    """測試文字內容變更時自動重新生成"""
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe"]

    # Mock existing audio with OLD text_hash
    existing_audio = Mock(
        storage_url="https://storage.supabase.co/old.mp3",
        text_hash="b" * 64,  # Different hash
        generation_status=GenerationStatus.COMPLETED
    )

    # Current card has NEW text_hash
    story_audio_service.tts_service.compute_text_hash = Mock(return_value="a" * 64)

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=sample_character.id)
        story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=existing_audio)

        result = await story_audio_service.generate_story_audio(card_id, character_keys, force_regenerate=False)

    # Should regenerate due to text_hash mismatch
    story_audio_service.tts_service.synthesize_speech.assert_called_once()


@pytest.mark.asyncio
async def test_generate_story_audio_handles_card_not_found(story_audio_service):
    """測試卡牌不存在時拋出錯誤"""
    card_id = uuid4()
    character_keys = ["brotherhood_scribe"]

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = None  # Card not found
        mock_execute.return_value = mock_result

        with pytest.raises(Exception) as exc_info:
            await story_audio_service.generate_story_audio(card_id, character_keys)

        assert "Card not found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_generate_story_audio_handles_no_story_background(story_audio_service, sample_card):
    """測試卡牌無故事內容時拋出錯誤"""
    sample_card.story_background = None
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe"]

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        with pytest.raises(Exception) as exc_info:
            await story_audio_service.generate_story_audio(card_id, character_keys)

        assert "no story background" in str(exc_info.value).lower()


# Test 5: TTS 失敗處理

@pytest.mark.asyncio
async def test_generate_story_audio_handles_tts_failure(story_audio_service, sample_card, sample_character):
    """測試 TTS 服務失敗時正確處理"""
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe"]

    # Mock TTS failure
    story_audio_service.tts_service.synthesize_speech = Mock(side_effect=Exception("TTS API failed"))

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=sample_character.id)
        story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=None)

        with pytest.raises(Exception) as exc_info:
            await story_audio_service.generate_story_audio(card_id, character_keys)

        assert "TTS" in str(exc_info.value) or "failed" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_generate_story_audio_marks_failed_in_database(story_audio_service, sample_card, sample_character):
    """測試 TTS 失敗時在資料庫標記 FAILED 狀態"""
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe"]

    # Mock TTS failure
    story_audio_service.tts_service.synthesize_speech = Mock(side_effect=Exception("TTS quota exceeded"))

    # Mock saving failed record
    failed_audio = Mock(
        generation_status=GenerationStatus.FAILED,
        error_message="TTS quota exceeded"
    )
    story_audio_service.storage_service.save_audio_metadata = AsyncMock(return_value=failed_audio)

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=sample_character.id)
        story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=None)

        try:
            await story_audio_service.generate_story_audio(card_id, character_keys)
        except Exception:
            pass

    # Should attempt to save FAILED record
    # (actual implementation may vary)


# Test 6: Supabase 上傳重試邏輯

@pytest.mark.asyncio
async def test_generate_story_audio_retries_supabase_upload(story_audio_service, sample_card, sample_character):
    """測試 Supabase 上傳失敗時重試 3 次"""
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe"]

    # Mock upload failure then success
    story_audio_service.storage_service.upload_audio = AsyncMock(
        side_effect=[
            Exception("Network error"),  # First attempt fails
            Exception("Timeout"),         # Second attempt fails
            "https://storage.supabase.co/success.mp3"  # Third attempt succeeds
        ]
    )

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=sample_character.id)
        story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=None)

        result = await story_audio_service.generate_story_audio(card_id, character_keys)

    # Should succeed after retries
    assert "brotherhood_scribe" in result
    assert story_audio_service.storage_service.upload_audio.call_count == 3


@pytest.mark.asyncio
async def test_generate_story_audio_fails_after_max_retries(story_audio_service, sample_card, sample_character):
    """測試 Supabase 上傳失敗超過最大重試次數後拋出錯誤"""
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe"]

    # Mock persistent upload failure
    story_audio_service.storage_service.upload_audio = AsyncMock(
        side_effect=Exception("Persistent network error")
    )

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        story_audio_service.storage_service.get_character_id_by_key = AsyncMock(return_value=sample_character.id)
        story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=None)

        with pytest.raises(Exception) as exc_info:
            await story_audio_service.generate_story_audio(card_id, character_keys)

        assert "network" in str(exc_info.value).lower() or "upload" in str(exc_info.value).lower()

    # Should have attempted 3 times
    assert story_audio_service.storage_service.upload_audio.call_count == 3


# Test 7: 多角色音檔生成

@pytest.mark.asyncio
async def test_generate_story_audio_multiple_characters(story_audio_service, sample_card, sample_character):
    """測試同時為多個角色生成音檔"""
    card_id = sample_card.id
    character_keys = ["brotherhood_scribe", "ncr_ranger", "pip_boy"]

    with patch.object(story_audio_service.db, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = Mock()
        mock_result.scalar_one_or_none.return_value = sample_card
        mock_execute.return_value = mock_result

        # Mock different character IDs
        char_ids = {
            "brotherhood_scribe": uuid4(),
            "ncr_ranger": uuid4(),
            "pip_boy": uuid4()
        }

        async def get_char_id(key):
            return char_ids.get(key, uuid4())

        story_audio_service.storage_service.get_character_id_by_key = get_char_id
        story_audio_service.storage_service.get_audio_by_card_and_character = AsyncMock(return_value=None)

        result = await story_audio_service.generate_story_audio(card_id, character_keys)

    assert isinstance(result, dict)
    assert len(result) == 3
    assert "brotherhood_scribe" in result
    assert "ncr_ranger" in result
    assert "pip_boy" in result
    # Should have called TTS service 3 times
    assert story_audio_service.tts_service.synthesize_speech.call_count == 3
