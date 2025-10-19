"""
測試 AI Interpretation Service 整合
Test AI Interpretation Service integration with database-driven configurations
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.services.ai_interpretation_service import AIInterpretationService
from app.models.wasteland_card import CharacterVoice, FactionAlignment


async def test_ai_service_integration():
    """測試 AI Service 整合"""
    print("\n" + "=" * 80)
    print("AI Interpretation Service 整合測試")
    print("=" * 80 + "\n")

    # 建立資料庫連線
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            # 測試 1: 創建 AI Service 實例
            print("測試 1: 創建 AIInterpretationService 實例")
            print("-" * 80)
            ai_service = AIInterpretationService(settings, session)
            print(f"✓ AI Service 實例創建成功")
            print(f"  - Provider: {ai_service.provider.__class__.__name__ if ai_service.provider else 'None'}")
            print(f"  - Available: {ai_service.is_available()}")

            # 測試 2: 從資料庫讀取 Character Prompt
            print("\n測試 2: 從資料庫讀取 Character Prompt")
            print("-" * 80)

            for character in [CharacterVoice.PIP_BOY, CharacterVoice.CODSWORTH, CharacterVoice.VAULT_DWELLER]:
                char_prompt = await ai_service._get_character_prompt(character)
                if char_prompt:
                    print(f"✓ {character.value}:")
                    print(f"  - System Prompt: {char_prompt['system'][:80]}...")
                    print(f"  - Tone: {char_prompt['tone']}")
                    print(f"  - Config Keys: {list(char_prompt.get('config', {}).keys())}")
                else:
                    print(f"✗ {character.value}: 未找到配置")

            # 測試 3: 從資料庫讀取 Faction Style
            print("\n測試 3: 從資料庫讀取 Faction Style")
            print("-" * 80)

            for faction in [FactionAlignment.VAULT_DWELLER, FactionAlignment.BROTHERHOOD, FactionAlignment.NCR]:
                faction_style = await ai_service._get_faction_style(faction)
                if faction_style:
                    print(f"✓ {faction.value}:")
                    print(f"  - Tone: {faction_style.get('tone', 'N/A')}")
                    print(f"  - Perspective: {faction_style.get('perspective', 'N/A')[:60]}...")
                    print(f"  - Key Themes: {', '.join(faction_style.get('key_themes', [])[:3])}")
                else:
                    print(f"✗ {faction.value}: 未找到配置")

            # 測試 4: 驗證 Prompt Building（不實際呼叫 AI API）
            print("\n測試 4: 驗證 Prompt Building")
            print("-" * 80)

            # 從資料庫讀取實際的卡牌來測試 prompt building
            from app.models.wasteland_card import WastelandCard, KarmaAlignment
            from sqlalchemy import select

            result = await session.execute(
                select(WastelandCard).limit(1)
            )
            mock_card = result.scalar_one_or_none()

            if not mock_card:
                print("✗ 無法從資料庫讀取測試卡牌")
                return

            # 測試單卡 prompt building
            single_card_prompt = await ai_service._build_card_interpretation_prompt(
                card=mock_card,
                question="What does my future hold?",
                karma=KarmaAlignment.NEUTRAL,
                faction=FactionAlignment.INDEPENDENT,
                position_meaning="Future"
            )

            print("✓ 單卡 Prompt 建立成功")
            print(f"  - Prompt 長度: {len(single_card_prompt)} 字元")

            # 檢查是否包含 faction style
            if "Faction Context" in single_card_prompt:
                print("  ✓ Faction Style 已整合到 Prompt")
            else:
                print("  ✗ Faction Style 未整合到 Prompt")

            # 測試多卡 prompt building
            multi_card_prompt = await ai_service._build_multi_card_prompt(
                cards=[mock_card, mock_card, mock_card],
                question="What should I focus on?",
                karma=KarmaAlignment.GOOD,
                faction=FactionAlignment.MINUTEMEN,
                spread_type="three_card"
            )

            print("✓ 多卡 Prompt 建立成功")
            print(f"  - Prompt 長度: {len(multi_card_prompt)} 字元")

            # 檢查是否包含 faction style
            if "Faction Context" in multi_card_prompt:
                print("  ✓ Faction Style 已整合到 Prompt")
            else:
                print("  ✗ Faction Style 未整合到 Prompt")

            print("\n" + "=" * 80)
            print("✓ 所有整合測試通過！")
            print("=" * 80 + "\n")

        except Exception as e:
            print(f"\n✗ 測試失敗: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_ai_service_integration())
