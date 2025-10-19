"""快速統計 TTS 完成狀態"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from sqlalchemy import select, func, and_
from app.db.session import AsyncSessionLocal
from app.models.character_voice import CardInterpretation, Character
from app.models.audio_file import AudioFile, AudioType, GenerationStatus


async def main():
    async with AsyncSessionLocal() as session:
        # 查詢應有的解讀數量
        interpretations_query = (
            select(func.count(CardInterpretation.id))
            .join(Character, CardInterpretation.character_id == Character.id)
            .where(CardInterpretation.is_active == True)
            .where(Character.is_active == True)
        )
        result = await session.execute(interpretations_query)
        total_interpretations = result.scalar()

        # 查詢音檔總數
        audio_count_query = select(func.count(AudioFile.id)).where(
            AudioFile.audio_type == AudioType.STATIC_CARD
        )
        result = await session.execute(audio_count_query)
        total_audio = result.scalar()

        # 查詢各狀態的音檔數量
        status_query = (
            select(AudioFile.generation_status, func.count(AudioFile.id))
            .where(AudioFile.audio_type == AudioType.STATIC_CARD)
            .group_by(AudioFile.generation_status)
        )
        result = await session.execute(status_query)
        status_counts = dict(result.all())

        # 顯示結果
        print("=" * 60)
        print("📊 TTS 批次生成完成統計")
        print("=" * 60)
        print(f"應生成音檔數量:        {total_interpretations}")
        print(f"資料庫中音檔總數:      {total_audio}")
        print(f"完成百分比:            {total_audio / total_interpretations * 100:.2f}%")
        print()
        print("各狀態音檔數量:")
        for status, count in status_counts.items():
            print(f"  {status}: {count}")
        print("=" * 60)

        if total_audio < total_interpretations:
            print(f"\n⚠️  缺少 {total_interpretations - total_audio} 個音檔")
        else:
            print("\n✅ 所有音檔都已成功生成！")


if __name__ == "__main__":
    asyncio.run(main())
