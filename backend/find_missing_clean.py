"""找出缺少音檔的解讀（無日誌輸出版本）"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

# 禁用 SQLAlchemy 日誌
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

from sqlalchemy import select, and_
from app.db.session import AsyncSessionLocal
from app.models.character_voice import CardInterpretation, Character
from app.models.wasteland_card import WastelandCard
from app.models.audio_file import AudioFile, AudioType


async def main():
    async with AsyncSessionLocal() as session:
        # 查詢所有應有音檔的解讀
        interpretations_query = (
            select(
                CardInterpretation.id,
                CardInterpretation.card_id,
                CardInterpretation.character_id,
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
        result = await session.execute(interpretations_query)
        interpretations = result.all()

        print(f"檢查 {len(interpretations)} 條解讀...\n")

        missing_count = 0
        for i, interp in enumerate(interpretations, 1):
            # 檢查是否有對應的音檔
            audio_query = select(AudioFile).where(
                and_(
                    AudioFile.card_id == interp.card_id,
                    AudioFile.character_id == interp.character_id,
                    AudioFile.audio_type == AudioType.STATIC_CARD,
                )
            )
            result = await session.execute(audio_query)
            audio_file = result.scalar_one_or_none()

            if not audio_file:
                missing_count += 1
                print(f"❌ 缺少音檔 #{missing_count}")
                print(f"   序號: {i}/{len(interpretations)}")
                print(f"   卡牌: Card {interp.card_number:02d} - {interp.card_name}")
                print(f"   角色: {interp.character_name} ({interp.character_key})")
                print(f"   card_id: {interp.card_id}")
                print(f"   character_id: {interp.character_id}")
                print(f"   interpretation_id: {interp.id}")
                print()

        if missing_count == 0:
            print("✅ 沒有缺少的音檔！")
        else:
            print(f"總計缺少 {missing_count} 個音檔")


if __name__ == "__main__":
    asyncio.run(main())
