"""
檢查資料庫中 pip_boy, vault_dweller, wasteland_trader 的解讀內容
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import Character, CardInterpretation, WastelandCard
from app.config import settings
import uuid


async def check_interpretations():
    """檢查三個角色的解讀內容"""

    # 創建異步引擎
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__pstmt_{uuid.uuid4().hex[:8]}__",
            "server_settings": {
                "jit": "off",
            }
        },
        execution_options={
            "compiled_cache": None,
        }
    )

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("=" * 80)
        print("檢查角色解讀內容")
        print("=" * 80)
        print()

        # 要檢查的角色
        character_keys = ['pip_boy', 'vault_dweller', 'wasteland_trader']

        for char_key in character_keys:
            # 獲取角色
            result = await session.execute(
                select(Character).where(Character.key == char_key)
            )
            character = result.scalar_one_or_none()

            if not character:
                print(f"⚠️  找不到角色: {char_key}")
                continue

            print(f"\n{'=' * 80}")
            print(f"角色: {character.name} ({character.key})")
            print(f"個性: {character.personality}")
            print(f"語音風格: {character.voice_style}")
            print(f"{'=' * 80}")

            # 獲取該角色的所有解讀
            result = await session.execute(
                select(CardInterpretation, WastelandCard)
                .join(WastelandCard, CardInterpretation.card_id == WastelandCard.id)
                .where(CardInterpretation.character_id == character.id)
                .order_by(WastelandCard.name)
                .limit(5)  # 只顯示前5個作為範例
            )
            interpretations = result.all()

            print(f"\n找到 {len(interpretations)} 個解讀範例：")
            print("-" * 80)

            for interp, card in interpretations:
                print(f"\n卡牌: {card.name}")
                print(f"解讀內容: {interp.interpretation_text[:200]}...")
                print()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check_interpretations())
