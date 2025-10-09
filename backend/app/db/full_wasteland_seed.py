"""
完整的廢土塔羅牌 seed data
根據 docs/07-information/ 的設計文檔建立完整的 78 張牌
"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.wasteland_card import WastelandCard, WastelandSuit, KarmaAlignment, CharacterVoice, FactionAlignment


# Major Arcana (22 cards) - 根據 fallout_tarot_system.json
MAJOR_ARCANA_CARDS = [
    {
        "id": "vault_newbie",
        "name": "新手避難所居民 (The Vault Newbie)",
        "number": 0,
        "upright_meaning": "天真、新開始、無知即福、適應能力",
        "reversed_meaning": "過度天真、拒絕現實、不願適應",
        "wasteland_humor": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土",
        "radiation_level": 0.5,
        "threat_level": 1,
    },
    {
        "id": "tech_specialist",
        "name": "科技專家 (The Tech Specialist)",
        "number": 1,
        "upright_meaning": "技能、創新、廢料利用、科技掌控",
        "reversed_meaning": "技術依賴、創新停滯、工具失效",
        "wasteland_humor": "用膠帶和廢料修理高科技設備",
        "radiation_level": 1.2,
        "threat_level": 3,
    },
    {
        "id": "wasteland_oracle",
        "name": "神秘預言家 (The Wasteland Oracle)",
        "number": 2,
        "upright_meaning": "直覺、神秘知識、輻射感知、內在智慧",
        "reversed_meaning": "迷信、錯誤預測、混亂直覺",
        "wasteland_humor": "用破損的電視機占卜未來",
        "radiation_level": 2.8,
        "threat_level": 2,
    },
    {
        "id": "farm_matriarch",
        "name": "農場主母 (The Farm Matriarch)",
        "number": 3,
        "upright_meaning": "豐饒、養育、變異成長、社群建設",
        "reversed_meaning": "過度保護、資源枯竭、成長停滯",
        "wasteland_humor": "種植變異巨大蔬菜，豐收到誇張程度",
        "radiation_level": 1.5,
        "threat_level": 2,
    },
    {
        "id": "overseer",
        "name": "避難所監督 (The Overseer)",
        "number": 4,
        "upright_meaning": "權威、秩序、官僚制度、控制",
        "reversed_meaning": "獨裁、腐敗、秩序崩壞",
        "wasteland_humor": "被一群反叛居民用廁紙卷襲擊",
        "radiation_level": 0.3,
        "threat_level": 4,
    },
    {
        "id": "brotherhood_elder",
        "name": "兄弟會長老 (The Brotherhood Elder)",
        "number": 5,
        "upright_meaning": "傳統、知識保存、教條、指導",
        "reversed_meaning": "頑固、知識壟斷、教條主義",
        "wasteland_humor": "對著一本說明書虔誠祈禱",
        "radiation_level": 0.8,
        "threat_level": 5,
    },
    # ... 這裡會繼續其他 16 張大牌
]

# Nuka-Cola Bottles Suit (14 cards) - 對應聖杯
NUKA_COLA_SUIT = [
    {
        "id": "nuka_ace",
        "name": "可樂王牌 (Ace of Nuka-Cola)",
        "number": 1,
        "upright_meaning": "新的情感開始、純淨的愛、輻射治療",
        "reversed_meaning": "情感混亂、虛假承諾、可樂成癮",
        "wasteland_humor": "可樂成癮症狀讓人忘記輻射危險",
        "nuka_cola_reference": "戰前最受歡迎的飲料，現在是珍貴藥物",
        "radiation_level": 3.0,
        "threat_level": 2,
    },
    # ... 繼續 2-10 和 Court Cards
]

# Combat Weapons Suit (14 cards) - 對應寶劍
COMBAT_WEAPONS_SUIT = [
    {
        "id": "weapon_ace",
        "name": "武器王牌 (Ace of Combat Weapons)",
        "number": 1,
        "upright_meaning": "新的衝突、戰略優勢、生存工具",
        "reversed_meaning": "武器故障、策略失敗、不必要暴力",
        "wasteland_humor": "武器故障的尷尬時刻",
        "radiation_level": 1.0,
        "threat_level": 5,
    },
    # ... 繼續其他牌
]

# Bottle Caps Suit (14 cards) - 對應錢幣
BOTTLE_CAPS_SUIT = [
    {
        "id": "caps_ace",
        "name": "瓶蓋王牌 (Ace of Bottle Caps)",
        "number": 1,
        "upright_meaning": "新的商機、財富開始、交易機會",
        "reversed_meaning": "經濟損失、交易詐騙、物質主義",
        "wasteland_humor": "瓶蓋收集癖讓人把垃圾當寶藏",
        "radiation_level": 0.2,
        "threat_level": 1,
    },
    # ... 繼續其他牌
]

# Radiation Rods Suit (14 cards) - 對應權杖
RADIATION_RODS_SUIT = [
    {
        "id": "rads_ace",
        "name": "輻射王牌 (Ace of Radiation Rods)",
        "number": 1,
        "upright_meaning": "新的能量、創造力爆發、變異潛力",
        "reversed_meaning": "能量耗盡、創意枯竭、有害變異",
        "wasteland_humor": "輻射突變的意外好處",
        "radiation_level": 4.5,
        "threat_level": 4,
    },
    # ... 繼續其他牌
]


async def create_full_wasteland_deck(db: AsyncSession) -> None:
    """建立完整的 78 張廢土塔羅牌"""

    all_cards = []

    # 建立大牌 (Major Arcana) - 22 張
    for card_data in MAJOR_ARCANA_CARDS:
        card = WastelandCard(
            id=card_data["id"],
            name=card_data["name"],
            suit=WastelandSuit.MAJOR_ARCANA.value,
            number=card_data["number"],
            upright_meaning=card_data["upright_meaning"],
            reversed_meaning=card_data["reversed_meaning"],
            radiation_level=card_data["radiation_level"],
            threat_level=card_data["threat_level"],
            wasteland_humor=card_data["wasteland_humor"],
            nuka_cola_reference=card_data.get("nuka_cola_reference", "Like finding a cold Nuka-Cola in the wasteland"),
            fallout_easter_egg=f"Inspired by Fallout lore: {card_data['name']}",
            special_ability=f"Major Arcana power: {card_data['upright_meaning'][:50]}",
            upright_keywords=card_data["upright_meaning"].split("、"),
            reversed_keywords=card_data["reversed_meaning"].split("、"),
            # 不同 Karma 的解釋
            good_interpretation=f"善良解讀: {card_data['upright_meaning']}",
            neutral_interpretation=f"中性解讀: {card_data['upright_meaning']}",
            evil_interpretation=f"邪惡解讀: {card_data['reversed_meaning']}",
            # 不同角色的聲音
            pip_boy_voice=f"Pip-Boy 分析: {card_data['upright_meaning'][:30]}...",
            vault_dweller_voice=f"避難所居民觀點: {card_data['upright_meaning'][:30]}...",
            wasteland_trader_voice=f"商人智慧: {card_data['upright_meaning'][:30]}...",
            super_mutant_voice=f"超級變種人說: {card_data['name'].upper()}. GOOD CARD.",
            codsworth_voice=f"Codsworth 建議: {card_data['upright_meaning'][:30]}...",
            # 派系意義
            brotherhood_significance=f"兄弟會觀點: 科技與知識的力量體現",
            ncr_significance=f"NCR 觀點: 民主與秩序的重要性",
            legion_significance=f"軍團觀點: 力量與征服的必要性",
            raiders_significance=f"掠奪者觀點: 混亂中的機會"
        )
        all_cards.append(card)

    # 建立四個小牌花色 (Minor Arcana) - 56 張
    suits_data = [
        (WastelandSuit.NUKA_COLA_BOTTLES, NUKA_COLA_SUIT, "情感與治療的力量"),
        (WastelandSuit.COMBAT_WEAPONS, COMBAT_WEAPONS_SUIT, "衝突與策略的智慧"),
        (WastelandSuit.BOTTLE_CAPS, BOTTLE_CAPS_SUIT, "資源與交易的價值"),
        (WastelandSuit.RADIATION_RODS, RADIATION_RODS_SUIT, "能量與創新的源泉")
    ]

    for suit, suit_cards, suit_theme in suits_data:
        # 數字牌 1-10
        for number in range(1, 11):
            card_id = f"{suit.value.lower()}_{number}"
            card_name = f"{number} of {suit.value.replace('_', ' ').title()}"

            # 根據數字和花色生成意義
            base_meaning = get_number_meaning(number)
            suit_meaning = get_suit_meaning(suit)

            card = WastelandCard(
                id=card_id,
                name=card_name,
                suit=suit.value,
                number=number,
                upright_meaning=f"{base_meaning} in {suit_meaning}",
                reversed_meaning=f"Blocked {base_meaning.lower()} in {suit_meaning}",
                radiation_level=get_suit_radiation_level(suit, number),
                threat_level=get_suit_threat_level(suit, number),
                wasteland_humor=get_suit_humor(suit, number),
                nuka_cola_reference=get_nuka_reference(suit, number),
                fallout_easter_egg=f"Wasteland {suit_meaning} #{number}",
                special_ability=f"{suit_theme}: {base_meaning}",
                upright_keywords=[base_meaning.lower(), suit_meaning.lower()],
                reversed_keywords=[f"blocked_{base_meaning.lower()}", f"negative_{suit_meaning.lower()}"],
                good_interpretation=f"正面能量: {base_meaning} 帶來 {suit_meaning} 的益處",
                neutral_interpretation=f"平衡狀態: {base_meaning} 需要謹慎運用在 {suit_meaning}",
                evil_interpretation=f"負面影響: {base_meaning} 可能破壞 {suit_meaning} 的和諧",
                pip_boy_voice=f"統計顯示: {suit_meaning} 指數 {number}/10",
                vault_dweller_voice=f"避難所手冊建議: {base_meaning} 適用於 {suit_meaning}",
                wasteland_trader_voice=f"市場分析: {suit_meaning} 價值評估為 {number}/10",
                super_mutant_voice=f"{number} {suit_meaning.upper()}. {'GOOD' if number > 5 else 'BAD'}.",
                codsworth_voice=f"根據我的資料庫, {suit_meaning} {base_meaning} 成功率 {number*10}%",
                brotherhood_significance=f"技術評估: {suit_meaning} 科技等級 {number}",
                ncr_significance=f"共和國利益: {suit_meaning} 民主價值 {number}/10",
                legion_significance=f"軍團力量: {suit_meaning} 征服潛力 {number}/10",
                raiders_significance=f"掠奪機會: {suit_meaning} 混亂利用率 {number}/10"
            )
            all_cards.append(card)

        # 宮廷牌 (Court Cards) - 每花色 4 張
        court_cards = [
            ("新兵", "Recruit", 11, "初學者的熱忱"),
            ("廢土騎士", "Wasteland Knight", 12, "行動派的勇氣"),
            ("聚落領袖", "Settlement Leader", 13, "成熟的智慧"),
            ("廢土霸主", "Wasteland Overlord", 14, "完全的掌控")
        ]

        for chinese_title, english_title, number, court_meaning in court_cards:
            card_id = f"{suit.value.lower()}_{english_title.lower().replace(' ', '_')}"
            card_name = f"{chinese_title} of {suit.value.replace('_', ' ').title()} ({english_title})"

            card = WastelandCard(
                id=card_id,
                name=card_name,
                suit=suit.value,
                number=number,
                upright_meaning=f"{court_meaning} 在 {suit_meaning} 領域",
                reversed_meaning=f"{court_meaning} 的負面表現在 {suit_meaning}",
                radiation_level=get_suit_radiation_level(suit, number),
                threat_level=get_suit_threat_level(suit, number),
                wasteland_humor=get_court_humor(suit, english_title),
                nuka_cola_reference=f"{english_title} 最愛的 Nuka-Cola 口味",
                fallout_easter_egg=f"廢土 {english_title} 代表 {suit_meaning} 的精通",
                special_ability=f"宮廷牌能力: {court_meaning} + {suit_theme}",
                upright_keywords=[court_meaning.lower(), suit_meaning.lower(), "leadership"],
                reversed_keywords=[f"failed_{court_meaning.lower()}", f"corrupted_{suit_meaning.lower()}"],
                good_interpretation=f"高尚領導: {court_meaning} 善用 {suit_meaning} 造福他人",
                neutral_interpretation=f"平衡領導: {court_meaning} 務實運用 {suit_meaning}",
                evil_interpretation=f"腐敗權力: {court_meaning} 濫用 {suit_meaning} 謀取私利",
                pip_boy_voice=f"人員檔案: {english_title}, {suit_meaning} 專精等級 MAX",
                vault_dweller_voice=f"這位 {chinese_title} 在 {suit_meaning} 方面經驗豐富",
                wasteland_trader_voice=f"這種 {english_title} 在 {suit_meaning} 交易中很可靠",
                super_mutant_voice=f"{english_title.upper()} STRONG IN {suit_meaning.upper()}",
                codsworth_voice=f"Sir/Madam, 這位 {chinese_title} 在 {suit_meaning} 領域堪稱專家",
                brotherhood_significance=f"軍階系統: {english_title} 代表 {suit_meaning} 部門領導",
                ncr_significance=f"共和國官階: {english_title} 負責 {suit_meaning} 政策制定",
                legion_significance=f"軍團階級: {english_title} 指揮 {suit_meaning} 戰術執行",
                raiders_significance=f"掠奪組織: {english_title} 是 {suit_meaning} 掠奪專家"
            )
            all_cards.append(card)

    # 批量添加到資料庫
    for card in all_cards:
        db.add(card)

    await db.commit()
    print(f"Successfully created {len(all_cards)} Wasteland Tarot cards!")


def get_number_meaning(number: int) -> str:
    """根據數字返回塔羅含義"""
    meanings = {
        1: "新發現、未探索資源、第一次接觸",
        2: "合作、交易夥伴、二選一",
        3: "小社群、合作成果、初期成功",
        4: "建立據點、安全區域、穩定基礎",
        5: "資源爭奪、衝突、變化威脅",
        6: "資源分享、社群和諧、互助",
        7: "評估威脅、戰略思考、謹慎觀察",
        8: "技能精進、專精發展、熟練掌握",
        9: "接近目標、經驗豐富、最後階段",
        10: "任務完成、重擔結束、新循環開始"
    }
    return meanings.get(number, "Unknown meaning")


def get_suit_meaning(suit: WastelandSuit) -> str:
    """返回花色的核心含義"""
    meanings = {
        WastelandSuit.NUKA_COLA_BOTTLES: "情感與治療",
        WastelandSuit.COMBAT_WEAPONS: "衝突與策略",
        WastelandSuit.BOTTLE_CAPS: "資源與交易",
        WastelandSuit.RADIATION_RODS: "能量與創新"
    }
    return meanings.get(suit, "Unknown suit")


def get_suit_radiation_level(suit: WastelandSuit, number: int) -> float:
    """根據花色和數字計算輻射等級"""
    base_levels = {
        WastelandSuit.NUKA_COLA_BOTTLES: 2.5,
        WastelandSuit.COMBAT_WEAPONS: 1.0,
        WastelandSuit.BOTTLE_CAPS: 0.3,
        WastelandSuit.RADIATION_RODS: 4.0
    }
    return base_levels.get(suit, 1.0) + (number * 0.1)


def get_suit_threat_level(suit: WastelandSuit, number: int) -> int:
    """根據花色和數字計算威脅等級"""
    base_threats = {
        WastelandSuit.NUKA_COLA_BOTTLES: 2,
        WastelandSuit.COMBAT_WEAPONS: 5,
        WastelandSuit.BOTTLE_CAPS: 1,
        WastelandSuit.RADIATION_RODS: 4
    }
    return min(5, base_threats.get(suit, 3) + (number // 3))


def get_suit_humor(suit: WastelandSuit, number: int) -> str:
    """為花色和數字生成幽默元素"""
    humor_themes = {
        WastelandSuit.NUKA_COLA_BOTTLES: f"第 {number} 瓶可樂讓人產生幻覺，看到戰前的美好時光",
        WastelandSuit.COMBAT_WEAPONS: f"武器 #{number} 經常在關鍵時刻卡彈",
        WastelandSuit.BOTTLE_CAPS: f"收集了 {number*100} 個瓶蓋，感覺自己是廢土首富",
        WastelandSuit.RADIATION_RODS: f"輻射等級 {number} 讓你在黑暗中發光"
    }
    return humor_themes.get(suit, f"Wasteland humor level {number}")


def get_nuka_reference(suit: WastelandSuit, number: int) -> str:
    """為每張牌生成 Nuka-Cola 相關引用"""
    references = {
        WastelandSuit.NUKA_COLA_BOTTLES: f"第 {number} 口 Nuka-Cola 總是最甜美的",
        WastelandSuit.COMBAT_WEAPONS: f"用 {number} 個 Nuka-Cola 瓶蓋可以買把不錯的武器",
        WastelandSuit.BOTTLE_CAPS: f"{number} 個瓶蓋的價值相當於一餐熱食",
        WastelandSuit.RADIATION_RODS: f"Nuka-Cola Quantum 的輻射等級大約是 {number}"
    }
    return references.get(suit, f"Like the {number}th sip of Nuka-Cola")


def get_court_humor(suit: WastelandSuit, title: str) -> str:
    """為宮廷牌生成特殊幽默"""
    humor_map = {
        ("Recruit", WastelandSuit.NUKA_COLA_BOTTLES): "新兵把 Nuka-Cola 當作主食，結果牙齒發光",
        ("Wasteland Knight", WastelandSuit.COMBAT_WEAPONS): "騎士的動力裝甲經常因為過熱而冒煙",
        ("Settlement Leader", WastelandSuit.BOTTLE_CAPS): "領袖用瓶蓋計算預算，結果算錯了小數點",
        ("Wasteland Overlord", WastelandSuit.RADIATION_RODS): "霸主收集輻射棒當作權力象徵"
    }
    return humor_map.get((title, suit), f"{title} has funny wasteland adventures")


async def seed_full_wasteland_database(db: AsyncSession) -> bool:
    """建立完整的廢土塔羅牌資料庫"""
    try:
        await create_full_wasteland_deck(db)
        print("✅ Full Wasteland Tarot deck created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating full deck: {e}")
        await db.rollback()
        return False


if __name__ == "__main__":
    print("This script creates the full 78-card Wasteland Tarot deck")
    print("Run this through the main seed script to populate your database")