"""
Story Audio Service - 故事音檔生成與管理
整合 TTSService、AudioStorageService、AudioCacheService 提供故事音檔生成
"""

from typing import List, Dict, Optional, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from supabase import Client

from app.core.logging_config import get_logger
from app.models.wasteland_card import WastelandCard
from app.models.audio_file import AudioFile, AudioType, GenerationStatus
from app.models.character_voice import Character
from app.models.story_constants import FACTION_VOICE_MAP, DEFAULT_VOICES
from app.services.tts_service import TTSService
from app.services.audio_storage_service import AudioStorageService

logger = get_logger(__name__)


class StoryAudioService:
    """
    故事音檔管理服務

    功能：
    1. 根據卡牌陣營選擇適當的角色語音
    2. 生成故事音檔（整合 TTSService）
    3. 上傳音檔到 Supabase Storage
    4. 管理音檔元資料
    5. 支援快取與重新生成
    """

    def __init__(
        self,
        db: AsyncSession,
        tts_service: TTSService,
        storage_service: AudioStorageService,
        supabase_client: Client
    ):
        """
        初始化故事音檔服務

        Args:
            db: 資料庫 session
            tts_service: TTS 服務
            storage_service: 音檔儲存服務
            supabase_client: Supabase 客戶端
        """
        self.db = db
        self.tts_service = tts_service
        self.storage_service = storage_service
        self.supabase = supabase_client

    def select_characters_for_card(self, card: WastelandCard) -> List[str]:
        """
        根據卡牌陣營選擇適當的角色語音

        Logic:
        - Brotherhood → brotherhood_scribe, brotherhood_paladin
        - NCR → ncr_ranger
        - Legion → legion_centurion
        - Raiders → raider
        - Vault-Tec → vault_dweller, pip_boy
        - Neutral/Independent → wasteland_trader, ghoul
        - 最多返回 3 個角色
        - 無陣營時返回預設角色

        Args:
            card: WastelandCard 實例

        Returns:
            角色 key 列表（最多 3 個）
        """
        voices = []

        # 如果沒有陣營資訊，返回預設角色
        if not card.story_faction_involved or len(card.story_faction_involved) == 0:
            return DEFAULT_VOICES

        # 根據陣營映射到角色語音
        for faction in card.story_faction_involved:
            if faction in FACTION_VOICE_MAP:
                faction_voices = FACTION_VOICE_MAP[faction]
                # 每個陣營隨機選 1 個角色（這裡簡化為取第一個）
                if faction_voices:
                    voices.append(faction_voices[0])

        # 去重並限制最多 3 個
        voices = list(set(voices))
        voices.sort()  # 排序確保穩定性
        voices = voices[:3]

        return voices if voices else DEFAULT_VOICES

    async def check_audio_exists(
        self,
        card_id: UUID,
        character_key: str
    ) -> Optional[AudioFile]:
        """
        檢查音檔是否已存在

        Args:
            card_id: 卡牌 ID
            character_key: 角色 key

        Returns:
            AudioFile 或 None
        """
        try:
            # 取得 character_id
            character_id = await self.storage_service.get_character_id_by_key(
                self.db,
                character_key
            )

            if not character_id:
                logger.warning(f"[StoryAudio] Character not found: {character_key}")
                return None

            # 查詢音檔
            audio_file = await self.storage_service.get_audio_by_card_and_character(
                self.db,
                card_id,
                character_id
            )

            return audio_file

        except Exception as e:
            logger.error(f"[StoryAudio] Failed to check audio exists: {e}")
            return None

    async def get_story_audio_urls(
        self,
        card_id: UUID
    ) -> Dict[str, str]:
        """
        取得卡牌故事的所有音檔 URL

        Args:
            card_id: 卡牌 ID

        Returns:
            {character_key: url} 映射
        """
        try:
            # 查詢所有音檔並 JOIN character
            result = await self.db.execute(
                select(AudioFile, Character)
                .join(Character, AudioFile.character_id == Character.id)
                .where(
                    AudioFile.card_id == card_id,
                    AudioFile.audio_type == AudioType.STATIC_CARD,
                    AudioFile.generation_status == GenerationStatus.COMPLETED
                )
            )
            rows = result.all()

            # 建立映射
            urls = {}
            for audio_file, character in rows:
                urls[character.key] = audio_file.storage_url

            return urls

        except Exception as e:
            logger.error(f"[StoryAudio] Failed to get story audio URLs: {e}")
            return {}

    async def generate_story_audio(
        self,
        card_id: UUID,
        character_keys: List[str],
        force_regenerate: bool = False
    ) -> Dict[str, str]:
        """
        為卡牌故事生成音檔

        Process:
        1. 取得卡牌和故事內容
        2. 檢查音檔是否已存在（除非 force_regenerate）
        3. 呼叫 TTSService 合成語音
        4. 上傳到 Supabase Storage（重試 3 次）
        5. 儲存元資料到 audio_files 表
        6. 返回所有角色的 URL 映射

        Args:
            card_id: 卡牌 ID
            character_keys: 要生成的角色列表
            force_regenerate: 強制重新生成

        Returns:
            {character_key: storage_url} 映射

        Raises:
            Exception: 卡牌不存在、無故事內容、TTS 失敗、上傳失敗
        """
        # 1. 取得卡牌
        result = await self.db.execute(
            select(WastelandCard).where(WastelandCard.id == card_id)
        )
        card = result.scalar_one_or_none()

        if not card:
            raise Exception(f"Card not found: {card_id}")

        if not card.story_background:
            raise Exception(f"Card {card_id} has no story background")

        # 2. 為每個角色生成音檔
        urls = {}

        for character_key in character_keys:
            try:
                # 取得 character_id
                character_id = await self.storage_service.get_character_id_by_key(
                    self.db,
                    character_key
                )

                if not character_id:
                    logger.warning(f"[StoryAudio] Character not found: {character_key}, skipping")
                    continue

                # 檢查是否已存在
                existing_audio = None
                if not force_regenerate:
                    existing_audio = await self.storage_service.get_audio_by_card_and_character(
                        self.db,
                        card_id,
                        character_id
                    )

                    if existing_audio and existing_audio.generation_status == GenerationStatus.COMPLETED:
                        # 檢查 text_hash 是否變更
                        current_hash = self.tts_service.compute_text_hash(
                            card.story_background,
                            character_key
                        )

                        if existing_audio.text_hash == current_hash:
                            # 使用快取
                            logger.info(f"[StoryAudio] Using cached audio: {card_id}/{character_key}")
                            urls[character_key] = existing_audio.storage_url
                            continue
                        else:
                            logger.info(f"[StoryAudio] Text hash changed, regenerating: {card_id}/{character_key}")

                # 3. 呼叫 TTS 服務
                logger.info(f"[StoryAudio] Generating audio: {card_id}/{character_key}")
                tts_result = self.tts_service.synthesize_speech(
                    text=card.story_background,
                    character_key=character_key,
                    language_code="zh-TW"
                )

                # 4. 上傳到 Supabase Storage（重試 3 次）
                storage_path = self.storage_service.generate_storage_path(
                    audio_type=AudioType.STATIC_CARD,
                    identifier=str(card_id),
                    character_key=character_key
                )

                storage_url = await self._upload_with_retry(
                    audio_content=tts_result["audio_content"],
                    storage_path=storage_path,
                    max_retries=3
                )

                # 5. 儲存元資料
                text_hash = self.tts_service.compute_text_hash(
                    card.story_background,
                    character_key
                )

                await self.storage_service.save_audio_metadata(
                    db=self.db,
                    card_id=card_id,
                    character_id=character_id,
                    storage_path=storage_path,
                    storage_url=storage_url,
                    file_size=tts_result["file_size"],
                    duration_seconds=tts_result["duration"],
                    text_length=tts_result["text_length"],
                    text_hash=text_hash,
                    language_code="zh-TW",
                    voice_name=tts_result["voice_name"],
                    ssml_params=tts_result["ssml_params"],
                    audio_type=AudioType.STATIC_CARD
                )

                urls[character_key] = storage_url
                logger.info(f"[StoryAudio] Generated audio: {card_id}/{character_key} -> {storage_url}")

            except Exception as e:
                logger.error(f"[StoryAudio] Failed to generate audio for {character_key}: {e}")
                # 標記失敗並繼續處理其他角色
                try:
                    await self._mark_audio_failed(card_id, character_key, str(e))
                except:
                    pass
                raise  # 重新拋出錯誤

        return urls

    async def _upload_with_retry(
        self,
        audio_content: bytes,
        storage_path: str,
        max_retries: int = 3
    ) -> str:
        """
        上傳音檔到 Supabase Storage（帶重試）

        Args:
            audio_content: 音檔二進位資料
            storage_path: 儲存路徑
            max_retries: 最大重試次數

        Returns:
            storage_url

        Raises:
            Exception: 超過最大重試次數後仍失敗
        """
        last_error = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"[StoryAudio] Upload attempt {attempt}/{max_retries}: {storage_path}")
                storage_url = await self.storage_service.upload_audio(
                    audio_content=audio_content,
                    storage_path=storage_path
                )
                logger.info(f"[StoryAudio] Upload success: {storage_path}")
                return storage_url

            except Exception as e:
                last_error = e
                logger.warning(f"[StoryAudio] Upload attempt {attempt} failed: {e}")

                if attempt == max_retries:
                    logger.error(f"[StoryAudio] Upload failed after {max_retries} attempts: {last_error}")
                    raise Exception(f"Failed to upload audio after {max_retries} attempts: {last_error}")

        raise Exception(f"Unexpected error in upload retry: {last_error}")

    async def _mark_audio_failed(
        self,
        card_id: UUID,
        character_key: str,
        error_message: str
    ):
        """
        標記音檔生成失敗

        Args:
            card_id: 卡牌 ID
            character_key: 角色 key
            error_message: 錯誤訊息
        """
        try:
            character_id = await self.storage_service.get_character_id_by_key(
                self.db,
                character_key
            )

            if not character_id:
                return

            # 建立 FAILED 記錄
            failed_audio = AudioFile(
                card_id=card_id,
                character_id=character_id,
                storage_path=f"failed/{card_id}/{character_key}.mp3",
                storage_url="",
                file_size=0,
                duration_seconds=0,
                text_length=0,
                text_hash="",
                language_code="zh-TW",
                voice_name="",
                ssml_params={},
                audio_type=AudioType.STATIC_CARD,
                generation_status=GenerationStatus.FAILED,
                error_message=error_message
            )

            self.db.add(failed_audio)
            await self.db.commit()

            logger.info(f"[StoryAudio] Marked as failed: {card_id}/{character_key}")

        except Exception as e:
            logger.error(f"[StoryAudio] Failed to mark audio failed: {e}")
