"""
Character and Faction Seed Data
角色與陣營種子資料 - 填充 characters 和 factions 表
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.character_voice import Character, Faction
import logging

logger = logging.getLogger(__name__)


# 角色種子資料（基於 CharacterVoice enum）
CHARACTER_SEEDS = [
    {
        "key": "pip_boy",
        "name": "Pip-Boy 3000",
        "description": "Pip-Boy 3000 個人電腦助手 - 精確的數據分析與系統化思維",
        "personality": "理性、精確、系統化",
        "voice_style": "數據分析官風格，使用技術術語和統計資訊",
        "theme_color": "#00ff88",
        "icon_name": "cpu",
        "sort_order": 1,
    },
    {
        "key": "vault_dweller",
        "name": "避難所居民",
        "description": "天真的避難所探險家 - 充滿好奇心與希望",
        "personality": "樂觀、好奇、天真",
        "voice_style": "天真探險家風格，充滿驚奇和好奇",
        "theme_color": "#4488ff",
        "icon_name": "user",
        "sort_order": 2,
    },
    {
        "key": "wasteland_trader",
        "name": "廢土商人",
        "description": "精明的廢土商人 - 實用主義和生存技巧",
        "personality": "精明、務實、靈活",
        "voice_style": "商人風格，強調交易與利益",
        "theme_color": "#ff9900",
        "icon_name": "shopping-bag",
        "sort_order": 3,
    },
    {
        "key": "codsworth",
        "name": "Codsworth",
        "description": "英倫風管家機器人 - 優雅的服務態度",
        "personality": "禮貌、優雅、傳統",
        "voice_style": "英倫管家風格，使用正式禮貌用語",
        "theme_color": "#888888",
        "icon_name": "bot",
        "sort_order": 4,
    },
    {
        "key": "super_mutant",
        "name": "超級變種人",
        "description": "強大的廢土戰士 - 粗獷直接的力量",
        "personality": "粗獷、直接、強大",
        "voice_style": "粗獷戰士風格，使用簡短有力的語句",
        "theme_color": "#44ff44",
        "icon_name": "zap",
        "sort_order": 5,
    },
    {
        "key": "ghoul",
        "name": "屍鬼",
        "description": "老練的廢土倖存者 - 豐富的歷史經驗",
        "personality": "老練、謹慎、智慧",
        "voice_style": "老練倖存者風格，分享歷史與經驗",
        "theme_color": "#cc99ff",
        "icon_name": "skull",
        "sort_order": 6,
    },
    {
        "key": "raider",
        "name": "掠奪者",
        "description": "狂野的匪徒 - 無政府主義的自由",
        "personality": "狂野、自由、暴力",
        "voice_style": "狂野匪徒風格，使用粗俗俚語",
        "theme_color": "#ff3333",
        "icon_name": "fire",
        "sort_order": 7,
    },
    {
        "key": "brotherhood_scribe",
        "name": "鋼鐵兄弟會書記官",
        "description": "科技守護者的學者 - 知識與技術的追求",
        "personality": "學術、嚴謹、守序",
        "voice_style": "學者風格，強調知識和技術",
        "theme_color": "#0099ff",
        "icon_name": "book",
        "sort_order": 8,
    },
    {
        "key": "brotherhood_paladin",
        "name": "鋼鐵兄弟會聖騎士",
        "description": "科技騎士 - 榮譽與力量的結合",
        "personality": "榮譽、勇敢、守序",
        "voice_style": "騎士風格，強調榮譽和責任",
        "theme_color": "#0066cc",
        "icon_name": "shield",
        "sort_order": 9,
    },
    {
        "key": "ncr_ranger",
        "name": "NCR 巡林客",
        "description": "新加州共和國的精英戰士 - 正義與秩序",
        "personality": "正義、專業、堅定",
        "voice_style": "軍人風格，強調秩序和正義",
        "theme_color": "#cc9966",
        "icon_name": "target",
        "sort_order": 10,
    },
    {
        "key": "legion_centurion",
        "name": "凱薩軍團百夫長",
        "description": "軍團的鐵腕統治者 - 紀律與力量",
        "personality": "紀律、殘酷、忠誠",
        "voice_style": "軍事風格，強調紀律和服從",
        "theme_color": "#dd0000",
        "icon_name": "sword",
        "sort_order": 11,
    },
    {
        "key": "minuteman",
        "name": "義勇軍",
        "description": "人民的守護者 - 保護與希望",
        "personality": "正直、勇敢、人道",
        "voice_style": "民兵風格，強調保護和互助",
        "theme_color": "#3366cc",
        "icon_name": "flag",
        "sort_order": 12,
    },
    {
        "key": "railroad_agent",
        "name": "鐵路組織探員",
        "description": "自由鬥士 - 解放與隱匿",
        "personality": "神秘、自由、正義",
        "voice_style": "間諜風格，強調自由和解放",
        "theme_color": "#ff6600",
        "icon_name": "eye-off",
        "sort_order": 13,
    },
    {
        "key": "institute_scientist",
        "name": "學院科學家",
        "description": "科學至上主義者 - 進步與控制",
        "personality": "理性、冷酷、科學",
        "voice_style": "科學家風格，強調進步和效率",
        "theme_color": "#ffffff",
        "icon_name": "flask",
        "sort_order": 14,
    },
]


# 陣營種子資料（基於 FactionAlignment enum + 額外的 vault-tec）
FACTION_SEEDS = [
    {
        "key": "vault-tec",
        "name": "Vault-Tec 科技公司",
        "description": "戰前科技巨頭 - 企業控制與社會實驗",
        "alignment": "lawful_neutral",
        "icon_name": "building",
        "theme_color": "#0088ff",
        "sort_order": 1,
    },
    {
        "key": "vault_dweller",
        "name": "避難所居民",
        "description": "避難所的倖存者 - 重建文明的希望",
        "alignment": "neutral_good",
        "icon_name": "home",
        "theme_color": "#4488ff",
        "sort_order": 2,
    },
    {
        "key": "brotherhood",
        "name": "鋼鐵兄弟會",
        "description": "科技守護者 - 保護人類免受科技濫用",
        "alignment": "lawful_neutral",
        "icon_name": "shield",
        "theme_color": "#0099ff",
        "sort_order": 3,
    },
    {
        "key": "ncr",
        "name": "NCR 新加州共和國",
        "description": "民主秩序的重建者 - 法治與擴張",
        "alignment": "lawful_good",
        "icon_name": "flag",
        "theme_color": "#cc9966",
        "sort_order": 4,
    },
    {
        "key": "legion",
        "name": "凱薩軍團",
        "description": "鐵腕統治者 - 紀律與征服",
        "alignment": "lawful_evil",
        "icon_name": "sword",
        "theme_color": "#dd0000",
        "sort_order": 5,
    },
    {
        "key": "raiders",
        "name": "掠奪者",
        "description": "無政府混亂 - 暴力與自由",
        "alignment": "chaotic_evil",
        "icon_name": "fire",
        "theme_color": "#ff3333",
        "sort_order": 6,
    },
    {
        "key": "minutemen",
        "name": "義勇軍",
        "description": "人民守護者 - 保護無辜與互助",
        "alignment": "neutral_good",
        "icon_name": "users",
        "theme_color": "#3366cc",
        "sort_order": 7,
    },
    {
        "key": "railroad",
        "name": "鐵路組織",
        "description": "自由鬥士 - 解放合成人",
        "alignment": "chaotic_good",
        "icon_name": "train",
        "theme_color": "#ff6600",
        "sort_order": 8,
    },
    {
        "key": "institute",
        "name": "學院",
        "description": "科學至上 - 進步與控制",
        "alignment": "lawful_neutral",
        "icon_name": "flask",
        "theme_color": "#ffffff",
        "sort_order": 9,
    },
    {
        "key": "independent",
        "name": "獨立派",
        "description": "自由意志 - 拒絕陣營約束",
        "alignment": "true_neutral",
        "icon_name": "compass",
        "theme_color": "#888888",
        "sort_order": 10,
    },
    {
        "key": "enclave",
        "name": "Enclave 避世者",
        "description": "舊世界精英 - 美國政府殘黨",
        "alignment": "lawful_evil",
        "icon_name": "crown",
        "theme_color": "#000000",
        "sort_order": 11,
    },
    {
        "key": "children_of_atom",
        "name": "原子之子",
        "description": "輻射信仰 - 崇拜原子分裂",
        "alignment": "chaotic_neutral",
        "icon_name": "zap",
        "theme_color": "#44ff44",
        "sort_order": 12,
    },
    {
        "key": "brotherhood_of_steel",
        "name": "鋼鐵兄弟會",
        "description": "科技守護者 - 完整組織名稱",
        "alignment": "lawful_neutral",
        "icon_name": "shield",
        "theme_color": "#0099ff",
        "sort_order": 13,
    },
    {
        "key": "caesars_legion",
        "name": "凱薩軍團",
        "description": "鐵腕統治 - 完整組織名稱",
        "alignment": "lawful_evil",
        "icon_name": "sword",
        "theme_color": "#dd0000",
        "sort_order": 14,
    },
]


async def seed_characters(db: AsyncSession) -> int:
    """
    Seed characters table

    Returns:
        Number of characters created
    """
    created_count = 0

    for char_data in CHARACTER_SEEDS:
        # Check if character already exists
        stmt = select(Character).where(Character.key == char_data["key"])
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            logger.info(f"Character '{char_data['key']}' already exists, skipping")
            continue

        # Create new character
        character = Character(**char_data)
        db.add(character)
        created_count += 1
        logger.info(f"Created character: {char_data['name']} ({char_data['key']})")

    await db.commit()
    return created_count


async def seed_factions(db: AsyncSession) -> int:
    """
    Seed factions table

    Returns:
        Number of factions created
    """
    created_count = 0

    for faction_data in FACTION_SEEDS:
        # Check if faction already exists
        stmt = select(Faction).where(Faction.key == faction_data["key"])
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            logger.info(f"Faction '{faction_data['key']}' already exists, skipping")
            continue

        # Create new faction
        faction = Faction(**faction_data)
        db.add(faction)
        created_count += 1
        logger.info(f"Created faction: {faction_data['name']} ({faction_data['key']})")

    await db.commit()
    return created_count


async def seed_character_faction_data(db: AsyncSession):
    """
    Main seed function - seeds both characters and factions
    """
    logger.info("=" * 60)
    logger.info("Starting Character & Faction Seed")
    logger.info("=" * 60)

    # Seed characters
    logger.info("\n[1/2] Seeding Characters...")
    char_count = await seed_characters(db)
    logger.info(f"✅ Created {char_count} characters")

    # Seed factions
    logger.info("\n[2/2] Seeding Factions...")
    faction_count = await seed_factions(db)
    logger.info(f"✅ Created {faction_count} factions")

    logger.info("\n" + "=" * 60)
    logger.info(f"Seed Complete! Created {char_count} characters and {faction_count} factions")
    logger.info("=" * 60)
