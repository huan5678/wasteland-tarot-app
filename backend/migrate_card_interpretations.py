"""
卡牌角色解讀遷移腳本
從 wasteland_cards 表的舊欄位遷移到新的 card_interpretations 表
確保每張卡牌的每個角色都有解讀內容
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from app.models import WastelandCard, Character, CardInterpretation
from app.config import settings
import uuid


# 舊欄位名稱到新角色 key 的映射
OLD_FIELD_TO_CHARACTER_KEY = {
    'pip_boy_analysis': 'pip_boy',
    'vault_dweller_perspective': 'vault_dweller',
    'wasteland_trader_wisdom': 'wasteland_trader',
    'super_mutant_simplicity': 'super_mutant',
    'codsworth_analysis': 'codsworth',
}

# 為沒有解讀的角色生成的預設模板
DEFAULT_INTERPRETATIONS = {
    'pip_boy': '分析中... 資料不足。建議收集更多資訊以提供完整解讀。',
    'vault_dweller': '這張卡牌的意義對避難所居民來說還需要更多探索和理解。',
    'wasteland_trader': '從商人的角度來看，這張卡牌代表著廢土中的機會與挑戰。',
    'codsworth': '先生/女士，關於這張卡牌，我建議保持謹慎並遵循適當的協議。',
    'super_mutant': '卡牌說話。聽卡牌。變強。',
    'ghoul': '又一張卡牌，又一個故事。在廢土活得夠久，你會看到一切。',
    'raider': '這張卡？誰在乎。拿你想要的，幹掉擋路的。',
    'brotherhood_scribe': '此卡牌需要進一步研究和記錄。資料庫中的資訊尚不完整。',
    'brotherhood_paladin': '身為聖騎士，我們必須謹慎解讀這張卡牌的含義。',
    'ncr_ranger': '作為遊騎兵，我們相信實際行動勝過占卜。但這張卡牌值得思考。',
    'legion_centurion': '軍團不需要卡牌指引。我們的道路由凱薩決定。',
    'minuteman': '這張卡牌提醒我們保護人民的責任。為了聯邦！',
    'railroad_agent': '在暗影中，這張卡牌可能揭示真相，也可能隱藏秘密。',
    'institute_scientist': '從科學的角度來看，這張卡牌的象徵意義需要更多實證研究。',
}


async def migrate_interpretations():
    """主要的解讀遷移函數"""

    engine = create_async_engine(
        settings.database_url,
        echo=False,  # 設為 False 減少輸出
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,
        connect_args={
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
            "prepared_statement_name_func": lambda: f"__pstmt_{uuid.uuid4().hex[:8]}__",
            "server_settings": {"jit": "off"},
        },
        execution_options={"compiled_cache": None},
    )

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("=" * 80)
        print("卡牌角色解讀遷移")
        print("=" * 80)
        print()

        # === 1. 載入所有卡牌 ===
        print("📇 載入所有卡牌...")
        result = await session.execute(
            select(WastelandCard).order_by(WastelandCard.suit, WastelandCard.number)
        )
        cards = result.scalars().all()
        print(f"   找到 {len(cards)} 張卡牌")
        print()

        # === 2. 載入所有角色 ===
        print("🎭 載入所有角色...")
        result = await session.execute(select(Character).order_by(Character.sort_order))
        characters = result.scalars().all()
        characters_by_key = {char.key: char for char in characters}
        print(f"   找到 {len(characters)} 個角色")
        print()

        # === 3. 為每張卡牌建立解讀 ===
        print("📝 建立卡牌解讀...")
        print("-" * 80)

        total_created = 0
        total_skipped = 0
        total_from_old = 0

        for idx, card in enumerate(cards, 1):
            print(f"[{idx}/{len(cards)}] 處理卡牌: {card.name} ({card.suit})")

            # 為每個角色建立解讀
            for character in characters:
                # 檢查是否已存在
                result = await session.execute(
                    select(CardInterpretation).where(
                        CardInterpretation.card_id == card.id,
                        CardInterpretation.character_id == character.id
                    )
                )
                existing = result.scalar_one_or_none()

                if existing:
                    total_skipped += 1
                    continue

                # 嘗試從舊欄位取得解讀內容
                interpretation_text = None

                # 檢查對應的舊欄位
                for old_field, char_key in OLD_FIELD_TO_CHARACTER_KEY.items():
                    if char_key == character.key:
                        interpretation_text = getattr(card, old_field, None)
                        if interpretation_text:
                            total_from_old += 1
                            break

                # 如果沒有舊資料，使用預設模板
                if not interpretation_text:
                    interpretation_text = DEFAULT_INTERPRETATIONS.get(
                        character.key,
                        f'對於 {character.name} 來說，這張卡牌象徵著廢土中的一個重要啟示。'
                    )

                # 建立新的解讀記錄
                new_interpretation = CardInterpretation(
                    card_id=card.id,
                    character_id=character.id,
                    interpretation_text=interpretation_text,
                    is_active=True
                )
                session.add(new_interpretation)
                total_created += 1

            # 每處理 10 張卡牌就提交一次
            if idx % 10 == 0:
                await session.commit()
                print(f"   ✓ 已提交 {idx}/{len(cards)} 張卡牌的解讀")

        # 最後提交剩餘的
        await session.commit()

        print()
        print("=" * 80)
        print("遷移完成！")
        print("=" * 80)
        print()
        print("📊 統計:")
        print(f"  - 處理的卡牌數: {len(cards)}")
        print(f"  - 角色數: {len(characters)}")
        print(f"  - 新建立的解讀: {total_created}")
        print(f"  - 從舊欄位遷移: {total_from_old}")
        print(f"  - 使用預設模板: {total_created - total_from_old}")
        print(f"  - 已存在跳過: {total_skipped}")
        print(f"  - 總解讀數: {total_created + total_skipped}")
        print()

        # === 4. 驗證結果 ===
        print("🔍 驗證結果...")
        result = await session.execute(
            text("""
                SELECT COUNT(*)
                FROM card_interpretations
            """)
        )
        total_in_db = result.scalar()

        expected_total = len(cards) * len(characters)
        print(f"   資料庫中的解讀總數: {total_in_db}")
        print(f"   預期的解讀總數: {expected_total}")

        if total_in_db == expected_total:
            print("   ✅ 驗證通過！所有卡牌都有完整的角色解讀")
        else:
            print(f"   ⚠️  警告：差異 {expected_total - total_in_db} 筆解讀")

        print()

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate_interpretations())
