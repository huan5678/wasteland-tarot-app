"""
Audio Storage Service - Supabase 音檔儲存管理
處理音檔上傳、URL 生成、元資料儲存
"""

from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from supabase import Client
from app.config import get_settings
from app.core.logging_config import get_logger
from app.models.audio_file import AudioFile, AudioType, GenerationStatus
from app.models.character_voice import Character

logger = get_logger(__name__)


class AudioStorageService:
    """
    音檔儲存服務

    功能：
    1. 上傳音檔到 Supabase Storage
    2. 生成公開 URL
    3. 儲存音檔元資料到資料庫
    4. 查詢音檔記錄
    """

    def __init__(self, supabase_client: Client):
        """
        初始化儲存服務

        Args:
            supabase_client: Supabase 客戶端
        """
        self.supabase = supabase_client
        settings = get_settings()
        self.bucket_name = getattr(settings, 'SUPABASE_STORAGE_BUCKET', 'audio-files')

    def generate_storage_path(
        self,
        audio_type: AudioType,
        identifier: str,
        character_key: str
    ) -> str:
        """
        生成儲存路徑

        Args:
            audio_type: 音檔類型
            identifier: 識別碼（card_id 或 text_hash[:8]）
            character_key: 角色 key

        Returns:
            儲存路徑

        Examples:
            static/a1b2c3d4-e5f6-7890-abcd-ef1234567890/super_mutant.mp3
            dynamic/f3a2b1c0/codsworth.mp3
        """
        if audio_type == AudioType.STATIC_CARD:
            # 靜態卡牌解讀: static/{card_id}/{character_key}.mp3
            return f"static/{identifier}/{character_key}.mp3"
        else:
            # 動態解讀: dynamic/{hash[:8]}/{character_key}.mp3
            return f"dynamic/{identifier}/{character_key}.mp3"

    async def upload_audio(
        self,
        audio_content: bytes,
        storage_path: str,
        content_type: str = "audio/mpeg"
    ) -> str:
        """
        上傳音檔到 Supabase Storage

        Args:
            audio_content: 音檔二進位資料
            storage_path: 儲存路徑
            content_type: MIME 類型

        Returns:
            公開 URL

        Raises:
            Exception: 上傳失敗
        """
        try:
            # 上傳到 Supabase Storage
            response = self.supabase.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=audio_content,
                file_options={
                    "content-type": content_type,
                    "cache-control": "3600",  # 快取 1 小時
                    "upsert": "true"  # 允許覆寫
                }
            )

            # 取得公開 URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(
                storage_path
            )

            logger.info(f"[AudioStorage] Uploaded audio: {storage_path}")
            return public_url

        except Exception as e:
            logger.error(f"[AudioStorage] Upload failed: {e}")
            raise Exception(f"Failed to upload audio: {str(e)}")

    async def save_audio_metadata(
        self,
        db: AsyncSession,
        card_id: Optional[UUID],
        character_id: UUID,
        storage_path: str,
        storage_url: str,
        file_size: int,
        duration_seconds: float,
        text_length: int,
        text_hash: str,
        language_code: str,
        voice_name: str,
        ssml_params: Dict[str, float],
        audio_type: AudioType
    ) -> AudioFile:
        """
        儲存音檔元資料到資料庫

        Args:
            db: 資料庫 session
            card_id: 卡牌 ID（靜態解讀用，動態為 None）
            character_id: 角色 ID
            storage_path: 儲存路徑
            storage_url: 公開 URL
            file_size: 檔案大小（位元組）
            duration_seconds: 時長（秒）
            text_length: 文字長度
            text_hash: 文字 hash
            language_code: 語言代碼
            voice_name: 語音名稱
            ssml_params: SSML 參數
            audio_type: 音檔類型

        Returns:
            AudioFile 實例

        Raises:
            Exception: 儲存失敗
        """
        try:
            # 建立 AudioFile 記錄
            audio_file = AudioFile(
                card_id=card_id,
                character_id=character_id,
                storage_path=storage_path,
                storage_url=storage_url,
                file_size=file_size,
                duration_seconds=duration_seconds,
                text_length=text_length,
                text_hash=text_hash,
                language_code=language_code,
                voice_name=voice_name,
                ssml_params=ssml_params,
                audio_type=audio_type,
                generation_status=GenerationStatus.COMPLETED,
                access_count=0
            )

            db.add(audio_file)
            await db.commit()
            await db.refresh(audio_file)

            logger.info(f"[AudioStorage] Saved metadata: {audio_file.id}")
            return audio_file

        except Exception as e:
            await db.rollback()
            logger.error(f"[AudioStorage] Failed to save metadata: {e}")
            raise Exception(f"Failed to save audio metadata: {str(e)}")

    async def get_audio_by_card_and_character(
        self,
        db: AsyncSession,
        card_id: UUID,
        character_id: UUID
    ) -> Optional[AudioFile]:
        """
        查詢靜態卡牌解讀音檔

        Args:
            db: 資料庫 session
            card_id: 卡牌 ID
            character_id: 角色 ID

        Returns:
            AudioFile 或 None
        """
        try:
            result = await db.execute(
                select(AudioFile)
                .where(
                    AudioFile.card_id == card_id,
                    AudioFile.character_id == character_id,
                    AudioFile.generation_status == GenerationStatus.COMPLETED
                )
            )
            audio_file = result.scalar_one_or_none()

            if audio_file:
                # 增加訪問計數
                audio_file.increment_access_count()
                await db.commit()

            return audio_file

        except Exception as e:
            logger.error(f"[AudioStorage] Query failed: {e}")
            return None

    async def get_audio_by_text_hash(
        self,
        db: AsyncSession,
        text_hash: str,
        character_id: UUID
    ) -> Optional[AudioFile]:
        """
        查詢動態解讀音檔（用文字 hash）

        Args:
            db: 資料庫 session
            text_hash: 文字 hash
            character_id: 角色 ID

        Returns:
            AudioFile 或 None
        """
        try:
            result = await db.execute(
                select(AudioFile)
                .where(
                    AudioFile.text_hash == text_hash,
                    AudioFile.character_id == character_id,
                    AudioFile.generation_status == GenerationStatus.COMPLETED
                )
            )
            audio_file = result.scalar_one_or_none()

            if audio_file:
                # 增加訪問計數
                audio_file.increment_access_count()
                await db.commit()

            return audio_file

        except Exception as e:
            logger.error(f"[AudioStorage] Query failed: {e}")
            return None

    async def get_character_id_by_key(
        self,
        db: AsyncSession,
        character_key: str
    ) -> Optional[UUID]:
        """
        根據 character_key 查詢 character_id

        Args:
            db: 資料庫 session
            character_key: 角色 key（如 'super_mutant'）

        Returns:
            UUID 或 None
        """
        try:
            result = await db.execute(
                select(Character.id)
                .where(Character.key == character_key, Character.is_active == True)
            )
            character_id = result.scalar_one_or_none()
            return character_id

        except Exception as e:
            logger.error(f"[AudioStorage] Failed to get character_id: {e}")
            return None

    async def delete_audio(
        self,
        db: AsyncSession,
        audio_file_id: UUID
    ) -> bool:
        """
        刪除音檔（資料庫記錄 + Supabase Storage）

        Args:
            db: 資料庫 session
            audio_file_id: AudioFile ID

        Returns:
            是否成功
        """
        try:
            # 查詢音檔記錄
            result = await db.execute(
                select(AudioFile).where(AudioFile.id == audio_file_id)
            )
            audio_file = result.scalar_one_or_none()

            if not audio_file:
                return False

            # 從 Supabase Storage 刪除
            try:
                self.supabase.storage.from_(self.bucket_name).remove(
                    [audio_file.storage_path]
                )
            except Exception as e:
                logger.warning(f"[AudioStorage] Failed to delete from storage: {e}")

            # 從資料庫刪除
            await db.delete(audio_file)
            await db.commit()

            logger.info(f"[AudioStorage] Deleted audio: {audio_file_id}")
            return True

        except Exception as e:
            await db.rollback()
            logger.error(f"[AudioStorage] Delete failed: {e}")
            return False


def get_audio_storage_service(supabase_client: Client) -> AudioStorageService:
    """取得 AudioStorage 服務實例"""
    return AudioStorageService(supabase_client)
