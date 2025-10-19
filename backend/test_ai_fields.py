"""
測試 AI 配置欄位是否正常運作
Test script to verify AI configuration fields are working correctly
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.character_voice import Character, Faction


async def test_ai_fields():
    """測試 AI 配置欄位"""
    # 建立資料庫連線
    engine = create_async_engine(settings.database_url, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            # 測試 1: 讀取現有的 Character，檢查新欄位
            print("\n=== 測試 1: 讀取 Character 模型 ===")
            from sqlalchemy import select

            result = await session.execute(
                select(Character).where(Character.key == "pip_boy").limit(1)
            )
            character = result.scalar_one_or_none()

            if character:
                print(f"✓ Character 找到: {character.name}")
                print(f"  - ai_system_prompt: {character.ai_system_prompt}")
                print(f"  - ai_tone_description: {character.ai_tone_description}")
                print(f"  - ai_prompt_config: {character.ai_prompt_config}")
            else:
                print("✗ 找不到 pip_boy character")

            # 測試 2: 更新 Character 的 AI 配置
            print("\n=== 測試 2: 更新 Character AI 配置 ===")
            if character:
                character.ai_system_prompt = "You are Pip-Boy, a helpful wasteland companion."
                character.ai_tone_description = "Cheerful, helpful, slightly robotic"
                character.ai_prompt_config = {
                    "temperature": 0.8,
                    "max_tokens": 500,
                    "style_keywords": ["helpful", "optimistic", "technical"]
                }
                await session.commit()
                print("✓ Character AI 配置已更新")

            # 測試 3: 讀取現有的 Faction，檢查新欄位
            print("\n=== 測試 3: 讀取 Faction 模型 ===")
            result = await session.execute(
                select(Faction).where(Faction.key == "vault_dweller").limit(1)
            )
            faction = result.scalar_one_or_none()

            if faction:
                print(f"✓ Faction 找到: {faction.name}")
                print(f"  - ai_style_config: {faction.ai_style_config}")
            else:
                print("✗ 找不到 vault_dweller faction")

            # 測試 4: 更新 Faction 的 AI 風格配置
            print("\n=== 測試 4: 更新 Faction AI 風格配置 ===")
            if faction:
                faction.ai_style_config = {
                    "tone": "hopeful",
                    "perspective": "optimistic survivor",
                    "key_themes": ["hope", "rebuilding", "community"],
                    "style_modifiers": "Use positive language, focus on cooperation"
                }
                await session.commit()
                print("✓ Faction AI 風格配置已更新")

            # 測試 5: 驗證更新後的資料
            print("\n=== 測試 5: 驗證更新後的資料 ===")
            await session.refresh(character)
            await session.refresh(faction)

            print(f"Character '{character.name}' AI Config:")
            print(f"  System Prompt: {character.ai_system_prompt[:50]}...")
            print(f"  Tone: {character.ai_tone_description}")
            print(f"  Config: {character.ai_prompt_config}")

            print(f"\nFaction '{faction.name}' AI Style:")
            print(f"  Config: {faction.ai_style_config}")

            print("\n=== ✓ 所有測試通過！===")

        except Exception as e:
            print(f"\n✗ 測試失敗: {e}")
            import traceback
            traceback.print_exc()
            await session.rollback()
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_ai_fields())
