#!/usr/bin/env python
"""
Seed script for all 78 Wasteland Tarot card stories
完整的 78 張廢土塔羅牌故事 seed script

包含：
- 22 張 Major Arcana (大阿卡納)
- 56 張 Minor Arcana (小阿卡納)
  - 14 張 Nuka Cola Bottles (可樂瓶)
  - 14 張 Combat Weapons (戰鬥武器)
  - 14 張 Bottle Caps (瓶蓋)
  - 14 張 Radiation Rods (輻射棒)
"""
import asyncio
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.wasteland_card import WastelandCard
from app.db.seed_major_arcana_stories import MAJOR_ARCANA_STORIES
from app.db.wasteland_stories_complete import (
    NUKA_COLA_BOTTLES_STORIES,
    COMBAT_WEAPONS_STORIES,
    BOTTLE_CAPS_STORIES,
    RADIATION_RODS_STORIES
)


async def seed_stories(session: AsyncSession) -> dict:
    """
    將所有 78 張卡牌故事寫入資料庫

    Returns:
        dict: 統計資訊 {
            "total": 總卡牌數,
            "updated": 更新數量,
            "not_found": 未找到的卡牌列表,
            "errors": 錯誤列表
        }
    """
    # 合併所有故事
    all_stories = (
        MAJOR_ARCANA_STORIES +
        NUKA_COLA_BOTTLES_STORIES +
        COMBAT_WEAPONS_STORIES +
        BOTTLE_CAPS_STORIES +
        RADIATION_RODS_STORIES
    )

    stats = {
        "total": len(all_stories),
        "updated": 0,
        "not_found": [],
        "errors": []
    }

    print(f"🎴 開始 seed {stats['total']} 張卡牌故事...")
    print("=" * 70)

    for story in all_stories:
        card_name = story["card_name"]

        try:
            # 尋找卡牌
            result = await session.execute(
                select(WastelandCard).where(WastelandCard.name == card_name)
            )
            card = result.scalar_one_or_none()

            if not card:
                stats["not_found"].append(card_name)
                print(f"  ⚠️  卡牌未找到: {card_name}")
                continue

            # 更新故事欄位
            card.story_background = story["story_background"]
            card.story_character = story["story_character"]
            card.story_location = story["story_location"]
            card.story_timeline = story["story_timeline"]
            card.story_faction_involved = story["story_faction_involved"]
            card.story_related_quest = story["story_related_quest"]

            stats["updated"] += 1
            print(f"  ✅ 更新成功: {card_name} (ID: {card.id})")

        except Exception as e:
            stats["errors"].append({
                "card_name": card_name,
                "error": str(e)
            })
            print(f"  ❌ 更新失敗: {card_name} - {str(e)}")

    # Commit 所有變更
    try:
        await session.commit()
        print("\n" + "=" * 70)
        print("✅ 所有變更已 commit")
    except Exception as e:
        await session.rollback()
        print(f"\n❌ Commit 失敗: {str(e)}")
        stats["errors"].append({"stage": "commit", "error": str(e)})

    return stats


async def verify_stories(session: AsyncSession) -> dict:
    """
    驗證所有卡牌是否都有故事內容

    Returns:
        dict: 驗證統計 {
            "total_cards": 總卡牌數,
            "with_story": 有故事的卡牌數,
            "without_story": 沒有故事的卡牌列表
        }
    """
    print("\n" + "=" * 70)
    print("🔍 驗證資料庫中的故事內容...")
    print("=" * 70)

    result = await session.execute(select(WastelandCard))
    all_cards = result.scalars().all()

    with_story = []
    without_story = []

    for card in all_cards:
        if card.story_background:
            with_story.append(card.name)
            print(f"  ✅ {card.name} - {len(card.story_background)} 字")
        else:
            without_story.append(card.name)
            print(f"  ❌ {card.name} - 無故事內容")

    return {
        "total_cards": len(all_cards),
        "with_story": len(with_story),
        "without_story": without_story
    }


async def main():
    """主執行函數"""
    print("\n" + "🎴 " * 20)
    print("Wasteland Tarot Stories Seed Script")
    print("廢土塔羅牌故事 Seed 工具")
    print("🎴 " * 20 + "\n")

    async with AsyncSessionLocal() as session:
        # Seed 故事
        seed_stats = await seed_stories(session)

        # 顯示 seed 統計
        print("\n" + "=" * 70)
        print("📊 Seed 統計結果")
        print("=" * 70)
        print(f"總故事數: {seed_stats['total']}")
        print(f"成功更新: {seed_stats['updated']}")
        print(f"未找到卡牌: {len(seed_stats['not_found'])}")
        print(f"發生錯誤: {len(seed_stats['errors'])}")

        if seed_stats['not_found']:
            print("\n⚠️  未找到的卡牌:")
            for name in seed_stats['not_found']:
                print(f"  - {name}")

        if seed_stats['errors']:
            print("\n❌ 錯誤詳情:")
            for error in seed_stats['errors']:
                print(f"  - {error}")

        # 驗證故事
        verify_stats = await verify_stories(session)

        # 顯示驗證統計
        print("\n" + "=" * 70)
        print("📊 驗證統計結果")
        print("=" * 70)
        print(f"資料庫總卡牌數: {verify_stats['total_cards']}")
        print(f"包含故事的卡牌: {verify_stats['with_story']}")
        print(f"缺少故事的卡牌: {len(verify_stats['without_story'])}")

        if verify_stats['without_story']:
            print("\n⚠️  缺少故事的卡牌:")
            for name in verify_stats['without_story']:
                print(f"  - {name}")

        # 最終結果
        print("\n" + "🎴 " * 20)
        if seed_stats['updated'] == seed_stats['total'] and len(verify_stats['without_story']) == 0:
            print("🎉 所有 78 張卡牌故事已成功 seed！")
        else:
            print("⚠️  Seed 完成，但有部分問題需要處理。")
        print("🎴 " * 20 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
