"""
批次生成卡牌角色解讀 TTS 音檔
為資料庫中所有 card_interpretations 生成對應的 TTS 音檔並回存
"""

import asyncio
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from uuid import UUID

# Add backend to path for imports
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models.character_voice import CardInterpretation, Character
from app.models.wasteland_card import WastelandCard
from app.models.audio_file import AudioFile, AudioType, GenerationStatus
from app.services.tts_service import get_tts_service
from app.services.audio_storage_service import get_audio_storage_service
from app.core.logging_config import get_logger
from app.core.supabase import get_supabase_client

logger = get_logger(__name__)


class BatchTTSGenerator:
    """批次 TTS 生成器"""

    def __init__(self):
        self.tts_service = get_tts_service()
        self.supabase_client = get_supabase_client()
        self.storage_service = get_audio_storage_service(self.supabase_client)
        self.stats = {
            "total": 0,
            "already_generated": 0,
            "newly_generated": 0,
            "failed": 0,
            "skipped": 0,
        }

    async def get_all_interpretations(self, session: AsyncSession) -> List[Dict[str, Any]]:
        """
        查詢所有需要生成 TTS 的解讀

        Returns:
            List of dicts containing:
            - interpretation_id
            - card_id
            - character_id
            - character_key
            - card_number
            - card_name
            - interpretation_text
        """
        query = (
            select(
                CardInterpretation.id.label("interpretation_id"),
                CardInterpretation.card_id,
                CardInterpretation.character_id,
                CardInterpretation.interpretation_text,
                Character.key.label("character_key"),
                Character.name.label("character_name"),
                WastelandCard.number.label("card_number"),
                WastelandCard.name.label("card_name"),
            )
            .join(Character, CardInterpretation.character_id == Character.id)
            .join(WastelandCard, CardInterpretation.card_id == WastelandCard.id)
            .where(CardInterpretation.is_active == True)
            .where(Character.is_active == True)
            .order_by(WastelandCard.number, Character.sort_order)
        )

        result = await session.execute(query)
        rows = result.all()

        interpretations = []
        for row in rows:
            interpretations.append({
                "interpretation_id": row.interpretation_id,
                "card_id": row.card_id,
                "character_id": row.character_id,
                "character_key": row.character_key,
                "character_name": row.character_name,
                "card_number": row.card_number,
                "card_name": row.card_name,
                "interpretation_text": row.interpretation_text,
            })

        return interpretations

    async def check_existing_audio(
        self,
        session: AsyncSession,
        card_id: UUID,
        character_id: UUID
    ) -> Optional[AudioFile]:
        """檢查是否已生成音檔"""
        query = (
            select(AudioFile)
            .where(
                and_(
                    AudioFile.card_id == card_id,
                    AudioFile.character_id == character_id,
                    AudioFile.audio_type == AudioType.STATIC_CARD,
                    AudioFile.generation_status == GenerationStatus.COMPLETED
                )
            )
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()

    async def generate_tts_audio(
        self,
        text: str,
        character_key: str,
    ) -> Dict[str, Any]:
        """
        生成 TTS 音檔

        Args:
            text: 解讀文字
            character_key: 角色 key

        Returns:
            TTS 生成結果（包含 audio_content, duration, file_size 等）
        """
        try:
            # 在線程中執行同步的 TTS API 呼叫
            result = await asyncio.to_thread(
                self.tts_service.synthesize_speech,
                text=text,
                character_key=character_key,
                language_code="zh-TW",
                return_base64=False
            )
            return result
        except Exception as e:
            logger.error(f"TTS generation failed for character {character_key}: {e}")
            raise

    async def save_audio_file(
        self,
        session: AsyncSession,
        card_id: UUID,
        character_id: UUID,
        character_key: str,
        card_number: Optional[int],
        tts_result: Dict[str, Any],
        interpretation_text: str,
    ) -> AudioFile:
        """
        儲存音檔到 Supabase 並建立 AudioFile 記錄

        Args:
            session: 資料庫 session
            card_id: 卡牌 ID
            character_id: 角色 ID
            character_key: 角色 key
            card_number: 卡牌編號
            tts_result: TTS 生成結果
            interpretation_text: 解讀文字

        Returns:
            AudioFile 實例
        """
        # 上傳到 Supabase Storage
        audio_content = tts_result["audio_content"]

        # 生成 storage path: static/{card_id_short}/{character_key}.mp3
        # 使用 card_id 的前 8 位確保唯一性
        card_id_short = str(card_id).replace('-', '')[:8]
        storage_path = f"static/{card_id_short}/{character_key}.mp3"

        # 上傳音檔（返回公開 URL）
        storage_url = await self.storage_service.upload_audio(
            audio_content=audio_content,
            storage_path=storage_path,
            content_type="audio/mpeg"
        )

        # 計算 text_hash
        text_hash = self.tts_service.compute_text_hash(interpretation_text, character_key)

        # 建立 AudioFile 記錄
        audio_file = AudioFile(
            card_id=card_id,
            character_id=character_id,
            storage_path=storage_path,  # 使用我們構建的 storage_path
            storage_url=storage_url,  # 使用上傳後返回的 URL
            file_size=tts_result["file_size"],
            duration_seconds=tts_result["duration"],
            text_length=tts_result["text_length"],
            text_hash=text_hash,
            language_code="zh-TW",
            voice_name=tts_result["voice_name"],
            ssml_params=tts_result["ssml_params"],
            audio_type=AudioType.STATIC_CARD,
            generation_status=GenerationStatus.COMPLETED,
        )

        session.add(audio_file)
        await session.commit()
        await session.refresh(audio_file)

        return audio_file

    async def process_interpretation(
        self,
        session: AsyncSession,
        interpretation: Dict[str, Any],
        index: int,
        total: int,
    ) -> bool:
        """
        處理單一解讀

        Args:
            session: 資料庫 session
            interpretation: 解讀資料
            index: 當前索引
            total: 總數

        Returns:
            是否成功
        """
        card_id = interpretation["card_id"]
        character_id = interpretation["character_id"]
        character_key = interpretation["character_key"]
        character_name = interpretation["character_name"]
        card_number = interpretation["card_number"]
        card_name = interpretation["card_name"]
        text = interpretation["interpretation_text"]

        # 進度顯示
        progress = f"[{index + 1}/{total}]"
        card_info = f"Card {card_number:02d} - {card_name}" if card_number else f"{card_name}"
        logger.info(f"{progress} Processing: {card_info} | {character_name}")

        # 檢查是否已生成
        existing = await self.check_existing_audio(session, card_id, character_id)
        if existing:
            logger.info(f"{progress} ⏭️  Already exists: {existing.storage_url}")
            self.stats["already_generated"] += 1
            return True

        # 生成 TTS
        try:
            logger.info(f"{progress} 🎤 Generating TTS for {character_name}...")
            print(f"{progress} 🎤 Generating TTS for {character_name}...")
            tts_result = await self.generate_tts_audio(text, character_key)
            print(f"{progress} TTS result type: {type(tts_result)}, keys: {tts_result.keys() if isinstance(tts_result, dict) else 'not a dict'}")

            # 儲存音檔
            logger.info(f"{progress} 💾 Saving audio file...")
            print(f"{progress} 💾 Saving audio file...")
            audio_file = await self.save_audio_file(
                session=session,
                card_id=card_id,
                character_id=character_id,
                character_key=character_key,
                card_number=card_number,
                tts_result=tts_result,
                interpretation_text=text,
            )

            logger.info(
                f"{progress} ✅ Success: {audio_file.storage_url} "
                f"({audio_file.file_size} bytes, {audio_file.duration_seconds:.2f}s)"
            )
            print(f"{progress} ✅ Success: {audio_file.storage_url}")
            self.stats["newly_generated"] += 1
            return True

        except Exception as e:
            import traceback
            logger.error(f"{progress} ❌ Failed: {str(e)}")
            print(f"{progress} ❌ Failed: {str(e)}")
            print(traceback.format_exc())
            self.stats["failed"] += 1
            # Rollback the session on error
            await session.rollback()
            return False

    async def run(self, limit: Optional[int] = None, dry_run: bool = False):
        """
        執行批次生成

        Args:
            limit: 限制處理數量（用於測試）
            dry_run: 只顯示將要處理的項目，不實際生成
        """
        print("=" * 80)
        print("🚀 Starting Batch TTS Generation for Card Interpretations")
        print("=" * 80)

        start_time = time.time()

        async with AsyncSessionLocal() as session:
            # 查詢所有解讀
            print("📊 Fetching all card interpretations from database...")
            interpretations = await self.get_all_interpretations(session)

            total = len(interpretations)
            self.stats["total"] = total

            if limit:
                interpretations = interpretations[:limit]
                print(f"⚠️  Limited to first {limit} interpretations (testing mode)")

            print(f"✅ Found {total} interpretations")
            print(f"📝 Will process {len(interpretations)} interpretations")
            print("")

            if dry_run:
                print("🔍 DRY RUN MODE - No actual generation will occur")
                print("")
                for i, interp in enumerate(interpretations):
                    card_info = f"Card {interp['card_number']:02d} - {interp['card_name']}" if interp['card_number'] else interp['card_name']
                    print(
                        f"[{i + 1}/{len(interpretations)}] "
                        f"{card_info} | {interp['character_name']} | "
                        f"{len(interp['interpretation_text'])} chars"
                    )
                return

            # 批次處理
            logger.info("🎬 Starting batch processing...")
            logger.info("")

            for i, interpretation in enumerate(interpretations):
                await self.process_interpretation(
                    session=session,
                    interpretation=interpretation,
                    index=i,
                    total=len(interpretations),
                )

                # 每處理 10 個顯示進度
                if (i + 1) % 10 == 0:
                    elapsed = time.time() - start_time
                    avg_time = elapsed / (i + 1)
                    remaining = avg_time * (len(interpretations) - i - 1)
                    logger.info("")
                    logger.info(
                        f"📈 Progress: {i + 1}/{len(interpretations)} | "
                        f"Elapsed: {elapsed:.1f}s | "
                        f"ETA: {remaining:.1f}s"
                    )
                    logger.info("")

        # 顯示最終統計
        elapsed = time.time() - start_time
        logger.info("")
        logger.info("=" * 80)
        logger.info("📊 Batch TTS Generation Complete")
        logger.info("=" * 80)
        logger.info(f"Total Interpretations: {self.stats['total']}")
        logger.info(f"Already Generated:     {self.stats['already_generated']}")
        logger.info(f"Newly Generated:       {self.stats['newly_generated']}")
        logger.info(f"Failed:                {self.stats['failed']}")
        logger.info(f"Skipped:               {self.stats['skipped']}")
        logger.info(f"Total Time:            {elapsed:.1f}s")
        if self.stats['newly_generated'] > 0:
            logger.info(f"Avg Time per Audio:    {elapsed / self.stats['newly_generated']:.2f}s")
        logger.info("=" * 80)


async def main():
    """主函式"""
    import argparse

    parser = argparse.ArgumentParser(description="批次生成卡牌角色解讀 TTS 音檔")
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="限制處理數量（用於測試）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只顯示將要處理的項目，不實際生成",
    )

    args = parser.parse_args()

    generator = BatchTTSGenerator()
    await generator.run(limit=args.limit, dry_run=args.dry_run)


if __name__ == "__main__":
    asyncio.run(main())
