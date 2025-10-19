"""生成特定缺失的音檔"""
import asyncio
import sys
from pathlib import Path
from uuid import UUID

sys.path.append(str(Path(__file__).parent))

from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.character_voice import CardInterpretation, Character
from app.models.wasteland_card import WastelandCard
from app.models.audio_file import AudioFile, AudioType, GenerationStatus
from app.services.tts_service import get_tts_service
from app.services.audio_storage_service import get_audio_storage_service
from app.core.supabase import get_supabase_client


async def generate_single_audio(
    card_id: str,
    character_id: str,
):
    """為特定卡牌和角色生成 TTS 音檔"""

    # 初始化服務
    tts_service = get_tts_service()
    supabase_client = get_supabase_client()
    storage_service = get_audio_storage_service(supabase_client)

    # 轉換為 UUID
    card_uuid = UUID(card_id)
    character_uuid = UUID(character_id)

    async with AsyncSessionLocal() as session:
        # 查詢解讀資訊
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
            .where(CardInterpretation.card_id == card_uuid)
            .where(CardInterpretation.character_id == character_uuid)
            .where(CardInterpretation.is_active == True)
        )

        result = await session.execute(query)
        interpretation = result.one_or_none()

        if not interpretation:
            print(f"❌ 找不到對應的解讀記錄！")
            print(f"   card_id: {card_id}")
            print(f"   character_id: {character_id}")
            return False

        print("="* 80)
        print("🎤 開始生成缺失的 TTS 音檔")
        print("="* 80)
        print(f"卡牌: Card {interpretation.card_number:02d} - {interpretation.card_name}")
        print(f"角色: {interpretation.character_name} ({interpretation.character_key})")
        print(f"文字長度: {len(interpretation.interpretation_text)} 字元")
        print()

        # 生成 TTS
        try:
            print("🎤 正在呼叫 Google Cloud TTS API...")
            tts_result = await asyncio.to_thread(
                tts_service.synthesize_speech,
                text=interpretation.interpretation_text,
                character_key=interpretation.character_key,
                language_code="zh-TW",
                return_base64=False
            )
            print(f"✅ TTS 生成成功 ({tts_result['file_size']:,} bytes, {tts_result['duration']:.2f}s)")
            print()

            # 生成 storage path
            card_id_short = str(card_uuid).replace('-', '')[:8]
            storage_path = f"static/{card_id_short}/{interpretation.character_key}.mp3"

            print(f"💾 正在上傳到 Supabase Storage...")
            print(f"   路徑: {storage_path}")

            # 上傳到 Supabase Storage
            storage_url = await storage_service.upload_audio(
                audio_content=tts_result["audio_content"],
                storage_path=storage_path,
                content_type="audio/mpeg"
            )
            print(f"✅ 上傳成功")
            print(f"   URL: {storage_url}")
            print()

            # 計算 text_hash
            text_hash = tts_service.compute_text_hash(
                interpretation.interpretation_text,
                interpretation.character_key
            )

            # 建立 AudioFile 記錄
            print("📝 正在建立資料庫記錄...")
            audio_file = AudioFile(
                card_id=card_uuid,
                character_id=character_uuid,
                storage_path=storage_path,
                storage_url=storage_url,
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

            print(f"✅ 資料庫記錄建立成功")
            print(f"   audio_file_id: {audio_file.id}")
            print()
            print("="* 80)
            print("🎉 音檔生成完成！")
            print("="* 80)

            return True

        except Exception as e:
            import traceback
            print(f"❌ 生成失敗: {str(e)}")
            print(traceback.format_exc())
            await session.rollback()
            return False


async def main():
    """主函式"""
    # 缺失的音檔資訊
    MISSING_CARD_ID = "f5b65648-9bba-439a-b17e-45e8291327ec"
    MISSING_CHARACTER_ID = "302f38db-0657-4b31-8515-c57ac6b3cb37"

    success = await generate_single_audio(
        card_id=MISSING_CARD_ID,
        character_id=MISSING_CHARACTER_ID,
    )

    if success:
        print("\n✅ 任務完成！現在資料庫應該有 1092/1092 個音檔了。")
        return 0
    else:
        print("\n❌ 任務失敗！請檢查錯誤訊息。")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
