"""
批次更新解讀到資料庫
Batch Update Interpretations to Database

讀取 generated_interpretations.json 並更新到資料庫
"""
import asyncio
import json
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models import Character, CardInterpretation, WastelandCard
from app.config import settings


async def batch_update_interpretations():
    """批次更新所有解讀"""

    # 讀取生成的解讀
    print("=" * 80)
    print("讀取生成的解讀檔案")
    print("=" * 80)

    try:
        with open('generated_interpretations.json', 'r', encoding='utf-8') as f:
            all_interpretations = json.load(f)
        print("✓ 成功讀取 generated_interpretations.json")
    except FileNotFoundError:
        print("❌ 找不到 generated_interpretations.json")
        print("   請先執行 interpretation_generator.py")
        return

    # 建立資料庫連線
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        connect_args={
            'statement_cache_size': 0,
            'prepared_statement_cache_size': 0,
            'prepared_statement_name_func': lambda: f'__pstmt_{uuid.uuid4().hex[:8]}__',
            'server_settings': {'jit': 'off'},
        },
        execution_options={'compiled_cache': None},
    )

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print()
        print("=" * 80)
        print("開始批次更新")
        print("=" * 80)
        print()

        # 獲取所有角色
        result = await session.execute(select(Character))
        characters = {char.key: char for char in result.scalars().all()}
        print(f"✓ 找到 {len(characters)} 個角色")

        # 統計
        total_updated = 0
        total_created = 0
        total_failed = 0

        # 更新大阿爾克那
        print("\n【更新大阿爾克那】")
        major_data = all_interpretations.get('major_arcana', {})

        for card_num_str, char_interpretations in major_data.items():
            card_num = int(card_num_str)

            # 獲取卡牌
            result = await session.execute(
                select(WastelandCard)
                .where(WastelandCard.suit == 'major_arcana')
                .where(WastelandCard.number == card_num)
            )
            card = result.scalar_one_or_none()

            if not card:
                print(f"  ⚠️  找不到卡牌 #{card_num}")
                total_failed += len(char_interpretations)
                continue

            # 為每個角色更新解讀
            for char_key, interpretation_text in char_interpretations.items():
                character = characters.get(char_key)
                if not character:
                    print(f"  ⚠️  找不到角色 {char_key}")
                    total_failed += 1
                    continue

                # 檢查是否已存在解讀
                result = await session.execute(
                    select(CardInterpretation)
                    .where(CardInterpretation.card_id == card.id)
                    .where(CardInterpretation.character_id == character.id)
                )
                existing = result.scalar_one_or_none()

                if existing:
                    # 更新現有解讀
                    existing.interpretation_text = interpretation_text
                    total_updated += 1
                else:
                    # 創建新解讀
                    new_interp = CardInterpretation(
                        card_id=card.id,
                        character_id=character.id,
                        interpretation_text=interpretation_text,
                        is_active=True
                    )
                    session.add(new_interp)
                    total_created += 1

            print(f"  ✓ 卡牌 #{card_num} ({card.name}) - 14 個角色")

        # 提交大阿爾克那的更新
        await session.commit()
        print(f"\n✓ 大阿爾克那更新完成")

        # 更新小阿爾克那
        print("\n【更新小阿爾克那】")
        minor_data = all_interpretations.get('minor_arcana', {})

        for suit, cards_data in minor_data.items():
            print(f"\n  處理牌組：{suit}")

            for card_num_str, char_interpretations in cards_data.items():
                card_num = int(card_num_str)

                # 獲取卡牌
                result = await session.execute(
                    select(WastelandCard)
                    .where(WastelandCard.suit == suit)
                    .where(WastelandCard.number == card_num)
                )
                card = result.scalar_one_or_none()

                if not card:
                    print(f"    ⚠️  找不到卡牌 {suit} #{card_num}")
                    total_failed += len(char_interpretations)
                    continue

                # 為每個角色更新解讀
                for char_key, interpretation_text in char_interpretations.items():
                    character = characters.get(char_key)
                    if not character:
                        print(f"    ⚠️  找不到角色 {char_key}")
                        total_failed += 1
                        continue

                    # 檢查是否已存在解讀
                    result = await session.execute(
                        select(CardInterpretation)
                        .where(CardInterpretation.card_id == card.id)
                        .where(CardInterpretation.character_id == character.id)
                    )
                    existing = result.scalar_one_or_none()

                    if existing:
                        # 更新現有解讀
                        existing.interpretation_text = interpretation_text
                        total_updated += 1
                    else:
                        # 創建新解讀
                        new_interp = CardInterpretation(
                            card_id=card.id,
                            character_id=character.id,
                            interpretation_text=interpretation_text,
                            is_active=True
                        )
                        session.add(new_interp)
                        total_created += 1

            # 每個牌組提交一次
            await session.commit()
            print(f"  ✓ {suit} - 14 張 × 14 角色 = 196 個解讀")

        print(f"\n✓ 小阿爾克那更新完成")

        # 最終統計
        print()
        print("=" * 80)
        print("更新完成統計")
        print("=" * 80)
        print(f"新增解讀：{total_created} 個")
        print(f"更新解讀：{total_updated} 個")
        print(f"失敗數量：{total_failed} 個")
        print(f"總計處理：{total_created + total_updated + total_failed} 個")
        print("=" * 80)

    await engine.dispose()


async def verify_final_state():
    """驗證最終狀態"""
    print()
    print("=" * 80)
    print("驗證最終狀態")
    print("=" * 80)

    engine = create_async_engine(
        settings.database_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        connect_args={
            'statement_cache_size': 0,
            'prepared_statement_cache_size': 0,
            'prepared_statement_name_func': lambda: f'__pstmt_{uuid.uuid4().hex[:8]}__',
            'server_settings': {'jit': 'off'},
        },
        execution_options={'compiled_cache': None},
    )

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # 統計每個角色的解讀數量
        result = await session.execute(select(Character).order_by(Character.sort_order))
        characters = result.scalars().all()

        print()
        for char in characters:
            result = await session.execute(
                select(CardInterpretation)
                .where(CardInterpretation.character_id == char.id)
            )
            count = len(result.scalars().all())
            status = "✓" if count == 78 else "⚠️"
            print(f"{status} {char.name:20s} - {count:2d}/78 個解讀")

        # 隨機抽樣檢查
        print()
        print("=" * 80)
        print("隨機抽樣檢查")
        print("=" * 80)

        import random

        # 抽樣大阿爾克那
        sample_major = random.randint(0, 21)
        result = await session.execute(
            select(WastelandCard)
            .where(WastelandCard.suit == 'major_arcana')
            .where(WastelandCard.number == sample_major)
        )
        card = result.scalar_one()

        print(f"\n【大阿爾克那 #{sample_major} - {card.name}】")

        # 隨機選3個角色
        sample_chars = random.sample(characters, 3)
        for char in sample_chars:
            result = await session.execute(
                select(CardInterpretation)
                .where(CardInterpretation.card_id == card.id)
                .where(CardInterpretation.character_id == char.id)
            )
            interp = result.scalar_one_or_none()
            if interp:
                print(f"\n{char.name}:")
                print(f"  {interp.interpretation_text[:100]}...")

        # 抽樣小阿爾克那
        suits = ['nuka_cola_bottles', 'combat_weapons', 'bottle_caps', 'radiation_rods']
        sample_suit = random.choice(suits)
        sample_minor = random.randint(1, 14)

        result = await session.execute(
            select(WastelandCard)
            .where(WastelandCard.suit == sample_suit)
            .where(WastelandCard.number == sample_minor)
        )
        card = result.scalar_one()

        print(f"\n【小阿爾克那 {sample_suit} #{sample_minor} - {card.name}】")

        sample_chars = random.sample(characters, 3)
        for char in sample_chars:
            result = await session.execute(
                select(CardInterpretation)
                .where(CardInterpretation.card_id == card.id)
                .where(CardInterpretation.character_id == char.id)
            )
            interp = result.scalar_one_or_none()
            if interp:
                print(f"\n{char.name}:")
                print(f"  {interp.interpretation_text[:100]}...")

        print()
        print("=" * 80)

    await engine.dispose()


async def main():
    """主程式"""
    await batch_update_interpretations()
    await verify_final_state()

    print()
    print("🎉 全部完成！")
    print()


if __name__ == "__main__":
    asyncio.run(main())
