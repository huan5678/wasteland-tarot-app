"""
Achievement Seeds - 初始成就定義資料
根據 requirements.md Appendix A 定義的 15 個初始成就
"""

from datetime import datetime
from uuid import uuid4
from typing import List, Dict, Any

# 15 個初始成就定義
INITIAL_ACHIEVEMENTS: List[Dict[str, Any]] = [
    # ===== READING 類別 (4 個) =====
    {
        "code": "FIRST_READING",
        "name_zh_tw": "廢土新手",
        "description_zh_tw": "完成你的第一次占卜",
        "category": "READING",
        "rarity": "COMMON",
        "icon_name": "book",
        "icon_image_url": "/assets/achievements/first_reading.png",
        "criteria": {
            "type": "READING_COUNT",
            "target": 1
        },
        "rewards": {
            "karma_points": 50,
            "title": "廢土占卜師"
        },
        "is_hidden": False,
        "display_order": 1
    },
    {
        "code": "READING_APPRENTICE",
        "name_zh_tw": "占卜學徒",
        "description_zh_tw": "完成 10 次占卜",
        "category": "READING",
        "rarity": "COMMON",
        "icon_name": "book-open",
        "icon_image_url": "/assets/achievements/reading_apprentice.png",
        "criteria": {
            "type": "READING_COUNT",
            "target": 10
        },
        "rewards": {
            "karma_points": 100
        },
        "is_hidden": False,
        "display_order": 2
    },
    {
        "code": "CELTIC_CROSS_INITIATE",
        "name_zh_tw": "凱爾特十字初體驗",
        "description_zh_tw": "使用凱爾特十字排列完成一次占卜",
        "category": "READING",
        "rarity": "RARE",
        "icon_name": "grid",
        "icon_image_url": "/assets/achievements/celtic_cross_initiate.png",
        "criteria": {
            "type": "READING_COUNT",
            "target": 1,
            "filters": {
                "spread_type": "CELTIC_CROSS"
            }
        },
        "rewards": {
            "karma_points": 150,
            "title": "凱爾特探索者"
        },
        "is_hidden": False,
        "display_order": 3
    },
    {
        "code": "MAJOR_ARCANA_COLLECTOR",
        "name_zh_tw": "大阿卡納收藏家",
        "description_zh_tw": "在占卜中抽到所有 22 張大阿卡納卡牌",
        "category": "READING",
        "rarity": "EPIC",
        "icon_name": "collection",
        "icon_image_url": "/assets/achievements/major_arcana_collector.png",
        "criteria": {
            "type": "CARD_VIEW",
            "target": 22,
            "filters": {
                "card_suit": "major_arcana"
            }
        },
        "rewards": {
            "karma_points": 300,
            "title": "大阿卡納大師"
        },
        "is_hidden": False,
        "display_order": 4
    },

    # ===== SOCIAL 類別 (3 個) =====
    {
        "code": "FIRST_SHARE",
        "name_zh_tw": "初次分享",
        "description_zh_tw": "分享你的第一次占卜結果",
        "category": "SOCIAL",
        "rarity": "COMMON",
        "icon_name": "share",
        "icon_image_url": "/assets/achievements/first_share.png",
        "criteria": {
            "type": "SOCIAL_SHARE",
            "target": 1
        },
        "rewards": {
            "karma_points": 30
        },
        "is_hidden": False,
        "display_order": 5
    },
    {
        "code": "SOCIAL_BUTTERFLY",
        "name_zh_tw": "社交達人",
        "description_zh_tw": "分享 20 次占卜結果",
        "category": "SOCIAL",
        "rarity": "RARE",
        "icon_name": "users",
        "icon_image_url": "/assets/achievements/social_butterfly.png",
        "criteria": {
            "type": "SOCIAL_SHARE",
            "target": 20
        },
        "rewards": {
            "karma_points": 200,
            "title": "廢土交際花"
        },
        "is_hidden": False,
        "display_order": 6
    },
    {
        "code": "FRIEND_COLLECTOR",
        "name_zh_tw": "好友收集者",
        "description_zh_tw": "添加 5 位好友",
        "category": "SOCIAL",
        "rarity": "COMMON",
        "icon_name": "user-plus",
        "icon_image_url": "/assets/achievements/friend_collector.png",
        "criteria": {
            "type": "FRIEND_COUNT",
            "target": 5
        },
        "rewards": {
            "karma_points": 80
        },
        "is_hidden": False,
        "display_order": 7
    },

    # ===== BINGO 類別 (3 個) =====
    {
        "code": "BINGO_FIRST_TRY",
        "name_zh_tw": "Bingo 初體驗",
        "description_zh_tw": "完成第一次 Bingo 連線",
        "category": "BINGO",
        "rarity": "COMMON",
        "icon_name": "grid",
        "icon_image_url": "/assets/achievements/bingo_first_try.png",
        "criteria": {
            "type": "BINGO_LINE",
            "target": 1
        },
        "rewards": {
            "karma_points": 50
        },
        "is_hidden": False,
        "display_order": 8
    },
    {
        "code": "BINGO_MASTER",
        "name_zh_tw": "Bingo 大師",
        "description_zh_tw": "完成 10 次 Bingo 連線",
        "category": "BINGO",
        "rarity": "RARE",
        "icon_name": "trophy",
        "icon_image_url": "/assets/achievements/bingo_master.png",
        "criteria": {
            "type": "BINGO_LINE",
            "target": 10
        },
        "rewards": {
            "karma_points": 250,
            "title": "Bingo 傳奇"
        },
        "is_hidden": False,
        "display_order": 9
    },
    {
        "code": "DAILY_DEVOTEE",
        "name_zh_tw": "每日虔誠者",
        "description_zh_tw": "連續簽到 7 天",
        "category": "BINGO",
        "rarity": "RARE",
        "icon_name": "calendar-check",
        "icon_image_url": "/assets/achievements/daily_devotee.png",
        "criteria": {
            "type": "CONSECUTIVE_LOGIN",
            "target": 7
        },
        "rewards": {
            "karma_points": 150,
            "title": "廢土守望者"
        },
        "is_hidden": False,
        "display_order": 10
    },

    # ===== KARMA 類別 (2 個) =====
    {
        "code": "WASTELAND_SAINT",
        "name_zh_tw": "廢土聖人",
        "description_zh_tw": "Karma 分數達到 90",
        "category": "KARMA",
        "rarity": "EPIC",
        "icon_name": "heart",
        "icon_image_url": "/assets/achievements/wasteland_saint.png",
        "criteria": {
            "type": "KARMA_THRESHOLD",
            "target": 90
        },
        "rewards": {
            "karma_points": 500,
            "title": "廢土聖人"
        },
        "is_hidden": False,
        "display_order": 11
    },
    {
        "code": "BALANCED_SOUL",
        "name_zh_tw": "平衡行者",
        "description_zh_tw": "維持 Karma 在 45-55 之間進行 20 次占卜",
        "category": "KARMA",
        "rarity": "RARE",
        "icon_name": "balance",
        "icon_image_url": "/assets/achievements/balanced_soul.png",
        "criteria": {
            "type": "READING_COUNT",
            "target": 20,
            "filters": {
                "karma_range": {"min": 45, "max": 55}
            }
        },
        "rewards": {
            "karma_points": 200,
            "title": "中立行者"
        },
        "is_hidden": False,
        "display_order": 12
    },

    # ===== EXPLORATION 類別 (3 個) =====
    {
        "code": "CARD_EXPLORER",
        "name_zh_tw": "卡牌收藏家",
        "description_zh_tw": "收藏 30 張不同的卡牌",
        "category": "EXPLORATION",
        "rarity": "RARE",
        "icon_name": "cards",
        "icon_image_url": "/assets/achievements/card_explorer.png",
        "criteria": {
            "type": "CARD_VIEW",
            "target": 30
        },
        "rewards": {
            "karma_points": 180
        },
        "is_hidden": False,
        "display_order": 13
    },
    {
        "code": "MUSIC_LOVER",
        "name_zh_tw": "音樂愛好者",
        "description_zh_tw": "建立你的第一個播放清單",
        "category": "EXPLORATION",
        "rarity": "COMMON",
        "icon_name": "music",
        "icon_image_url": "/assets/achievements/music_lover.png",
        "criteria": {
            "type": "PLAYLIST_CREATE",
            "target": 1
        },
        "rewards": {
            "karma_points": 40
        },
        "is_hidden": False,
        "display_order": 14
    },
    {
        "code": "MIDNIGHT_DIVINER",
        "name_zh_tw": "午夜占卜師",
        "description_zh_tw": "在午夜時段（00:00-06:00）完成 5 次占卜",
        "category": "EXPLORATION",
        "rarity": "EPIC",
        "icon_name": "moon",
        "icon_image_url": "/assets/achievements/midnight_diviner.png",
        "criteria": {
            "type": "TIME_BASED",
            "target": 5,
            "filters": {
                "time_range": "midnight"
            }
        },
        "rewards": {
            "karma_points": 250,
            "title": "午夜行者"
        },
        "is_hidden": True,  # 隱藏成就
        "display_order": 15
    }
]


async def seed_achievements(db_session):
    """
    種子腳本：插入初始成就定義到資料庫

    Args:
        db_session: SQLAlchemy async session
    """
    from app.models.achievement import Achievement
    from sqlalchemy import select

    seeded_count = 0
    updated_count = 0

    for achievement_data in INITIAL_ACHIEVEMENTS:
        # 檢查成就是否已存在
        query = select(Achievement).where(Achievement.code == achievement_data["code"])
        result = await db_session.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            # 更新現有成就（保留 ID 和時間戳記）
            for key, value in achievement_data.items():
                setattr(existing, key, value)
            updated_count += 1
        else:
            # 建立新成就
            achievement = Achievement(
                id=uuid4(),
                **achievement_data
            )
            db_session.add(achievement)
            seeded_count += 1

    await db_session.commit()

    return {
        "seeded": seeded_count,
        "updated": updated_count,
        "total": len(INITIAL_ACHIEVEMENTS)
    }


async def rollback_achievement_seeds(db_session):
    """
    回滾腳本：刪除所有初始成就

    Args:
        db_session: SQLAlchemy async session
    """
    from app.models.achievement import Achievement
    from sqlalchemy import delete

    # 只刪除初始成就（根據 code）
    codes = [a["code"] for a in INITIAL_ACHIEVEMENTS]

    stmt = delete(Achievement).where(Achievement.code.in_(codes))
    result = await db_session.execute(stmt)
    await db_session.commit()

    return {
        "deleted": result.rowcount
    }
