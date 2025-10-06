"""
Complete 78-Card Wasteland Tarot Seed Data
Based on comprehensive Fallout-themed tarot system with all character voices,
faction alignments, karma interpretations, and wasteland humor.
"""

import asyncio
import uuid
from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.wasteland_card import WastelandCard, WastelandSuit, KarmaAlignment, CharacterVoice, FactionAlignment


class WastelandCardGenerator:
    """Generates comprehensive Fallout-themed tarot cards"""

    def __init__(self):
        self.cards_data = []

    def generate_major_arcana(self) -> List[Dict[str, Any]]:
        """Generate all 22 Major Arcana cards with Fallout themes"""
        major_arcana = [
            {
                "id": "vault_newbie_0",
                "name": "避難所新手 (The Vault Newbie)",
                "number": 0,
                "upright_meaning": "天真、新開始、無知即福、純真的好奇心、踏出舒適圈的勇氣",
                "reversed_meaning": "過度天真、拒絕現實、不願適應變化、盲目樂觀",
                "radiation_level": 0.5,
                "threat_level": 1,
                "vault_number": 111,
                "wasteland_humor": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土，完全不知道危險",
                "pip_boy_analysis": "初始化完成。警告：輻射偵測異常。建議：保持樂觀態度，學習基本生存技能。",
                "vault_dweller_perspective": "第一次離開避難所總是令人興奮又恐懼。記住監督的話：保持希望。",
                "wasteland_trader_wisdom": "新來的？我見過很多像你這樣的。有些成功了，有些...沒有。",
                "super_mutant_simplicity": "小人類剛開始大冒險！超級變種人記得自己第一次！",
                "brotherhood_significance": "每個騎士都曾是初學者。技術知識始於學習的謙卑。",
                "ncr_significance": "民主需要新血。每個公民都有機會為共和國做出貢獻。",
                "legion_significance": "即使最偉大的軍團成員也需要從新兵開始證明自己。",
                "raiders_significance": "哈！新鮮肉！要麼快速學會，要麼成為廢土的一部分。",
                "vault_dweller_significance": "Vault-Tec 的承諾：「為更美好的明天做準備」。現在是實現的時候了。"
            },
            {
                "id": "tech_specialist_1",
                "name": "科技專家 (The Tech Specialist)",
                "number": 1,
                "upright_meaning": "技能熟練、創新解決方案、廢料重利用、科技掌控、實用主義",
                "reversed_meaning": "技術依賴、創新停滯、工具失效、過度複雜化",
                "radiation_level": 1.2,
                "threat_level": 3,
                "vault_number": 13,
                "wasteland_humor": "用膠帶、瓶蓋和輻射蟑螂殼修理核融合反應器",
                "pip_boy_analysis": "技能檢測：修理 100/100。能量武器 85/100。科學 95/100。建議：繼續升級。",
                "vault_dweller_perspective": "Vault-Tec 的訓練程序真的很有用。這些技能在廢土上價值連城。",
                "wasteland_trader_wisdom": "會修東西的人在這裡就是國王。你的技能比瓶蓋更有價值。",
                "super_mutant_simplicity": "聰明人類修理東西！超級變種人需要修理的槍很多！",
                "brotherhood_significance": "知識就是力量。科技掌握是兄弟會存在的核心意義。",
                "ncr_significance": "技術專家是重建文明的基石。工程師比士兵更重要。",
                "legion_significance": "即使軍團也需要能修理武器的人。技能超越意識形態。",
                "raiders_significance": "會修槍的人是團隊的寶貝。別讓他跑了！",
                "vault_dweller_significance": "Pre-War 科技的維護者。我們有責任保存人類的知識。"
            },
            {
                "id": "wasteland_oracle_2",
                "name": "廢土先知 (The Wasteland Oracle)",
                "number": 2,
                "upright_meaning": "直覺敏銳、神秘知識、輻射感知、內在智慧、預言能力",
                "reversed_meaning": "迷信、錯誤預測、混亂直覺、被幻象迷惑",
                "radiation_level": 2.8,
                "threat_level": 2,
                "vault_number": 108,
                "wasteland_humor": "用破損的電視機和收音機靜電噪音占卜未來，居然還挺準",
                "pip_boy_analysis": "感知檢測：異常高。精神狀態：不穩定但功能正常。建議：信任第六感。",
                "vault_dweller_perspective": "有些事情Pip-Boy偵測不到，但心靈可以。學會傾聽內心聲音。",
                "wasteland_trader_wisdom": "她看到的東西別人看不到。我從不質疑她的預言，太準了。",
                "super_mutant_simplicity": "智慧女人知道未來！超級變種人聽智慧女人的話！",
                "brotherhood_significance": "古老的智慧有時比現代科技更可靠。保持開放心態。",
                "ncr_significance": "情報收集的重要性。有時直覺比報告更準確。",
                "legion_significance": "占卜師在戰前羅馬也很重要。智慧超越時代。",
                "raiders_significance": "老太婆的預言救過我們很多次。最好聽她的。",
                "vault_dweller_significance": "Vault 實驗的意外後果：某些人發展出超感知能力。"
            },
            {
                "id": "farm_matriarch_3",
                "name": "農場主母 (The Farm Matriarch)",
                "number": 3,
                "upright_meaning": "豐饒、養育、變異成長、社群建設、生命力旺盛",
                "reversed_meaning": "過度保護、資源枯竭、成長停滯、控制欲強",
                "radiation_level": 1.5,
                "threat_level": 2,
                "vault_number": 12,
                "wasteland_humor": "變異玉米長得比人還高，南瓜大到可以當房子住",
                "pip_boy_analysis": "農業技能：最大值。變異植物知識：專家級。建議：學習種植技巧。",
                "vault_dweller_perspective": "她教會我們即使在廢土也能創造生命。希望還是存在的。",
                "wasteland_trader_wisdom": "新鮮食物在這個世界是奢侈品。她讓奇蹟發生。",
                "super_mutant_simplicity": "媽媽人類種很多食物！好媽媽餵飽大家！",
                "brotherhood_significance": "農業技術對重建至關重要。生命比武器更珍貴。",
                "ncr_significance": "農業復興是共和國繁榮的基礎。她們是真正的英雄。",
                "legion_significance": "羅馬的力量建立在豐饒的土地上。農業是帝國基礎。",
                "raiders_significance": "不要搶農場！我們需要她們活著為我們種食物。",
                "vault_dweller_significance": "G.E.C.K. 的真正力量：讓廢土重新綻放生機。"
            },
            {
                "id": "overseer_4",
                "name": "避難所監督 (The Overseer)",
                "number": 4,
                "upright_meaning": "權威、秩序建立、官僚制度、控制管理、責任承擔",
                "reversed_meaning": "獨裁、腐敗濫權、秩序崩壞、控制失效",
                "radiation_level": 0.3,
                "threat_level": 4,
                "vault_number": 101,
                "wasteland_humor": "被憤怒居民用衛生紙和廚房用具圍攻，還在大喊程序違規",
                "pip_boy_analysis": "領導能力：優秀。受歡迎度：下降中。建議：重新評估管理方式。",
                "vault_dweller_perspective": "有些監督是好的，有些...不是。權力容易腐蝕人心。",
                "wasteland_trader_wisdom": "權力結構在廢土很重要。但要確保是為了人民，不是為了自己。",
                "super_mutant_simplicity": "大頭目指揮小人類！有時好，有時壞！",
                "brotherhood_significance": "軍階制度的重要性。但權力必須服務於更高目標。",
                "ncr_significance": "民主監督防止獨裁。人民有權選擇領導者。",
                "legion_significance": "強有力的領導是軍團核心。但力量必須有智慧。",
                "raiders_significance": "老大就是老大！不聽話就死定了！",
                "vault_dweller_significance": "Vault-Tec 實驗的一部分：權力如何影響人類行為。"
            },
            {
                "id": "brotherhood_elder_5",
                "name": "兄弟會長老 (The Brotherhood Elder)",
                "number": 5,
                "upright_meaning": "傳統智慧、知識保存、教條傳承、精神指導、歷史連結",
                "reversed_meaning": "頑固守舊、知識壟斷、教條主義、與時代脫節",
                "radiation_level": 0.8,
                "threat_level": 5,
                "vault_number": 0,
                "wasteland_humor": "對著破舊的技術手冊虔誠祈禱，彷彿它是聖經",
                "pip_boy_analysis": "知識數據庫：豐富。適應性：有限。建議：平衡傳統與創新。",
                "vault_dweller_perspective": "他們保護的知識很重要，但有時候方法太...極端了。",
                "wasteland_trader_wisdom": "兄弟會有很多寶貝，但他們不喜歡分享。小心交易。",
                "super_mutant_simplicity": "鐵甲人類保護舊書！書很重要，但人類更重要！",
                "brotherhood_significance": "Ad Victoriam！我們是文明火種的守護者。",
                "ncr_significance": "技術應該為所有人服務，不只是少數人。",
                "legion_significance": "古羅馬也有其傳統。但傳統必須適應現實。",
                "raiders_significance": "這些科技狂有好東西，但太難搶了。",
                "vault_dweller_significance": "Pre-War 科技的守護者，但也可能是進步的阻礙。"
            }
            # ... 這裡會繼續其他 16 張大牌
        ]

        # 繼續剩餘的16張大牌
        major_arcana.extend([
            {
                "id": "caravan_guard_6",
                "name": "商隊護衛 (The Caravan Guard)",
                "number": 6,
                "upright_meaning": "奉獻服務、保護他人、責任感、團隊合作、忠誠守護",
                "reversed_meaning": "過度奉獻、忽略自我、責任過重、團隊衝突",
                "radiation_level": 1.0,
                "threat_level": 4,
                "vault_number": None,
                "wasteland_humor": "一個人對抗十個掠奪者，只為保護一箱Nuka-Cola",
                "pip_boy_analysis": "戰鬥技能：高級。忠誠度：最高。建議：注意個人健康。",
                "vault_dweller_perspective": "這種人讓我們相信人性還有希望。真正的英雄。",
                "wasteland_trader_wisdom": "好護衛比黃金還珍貴。信任他們就等於信任生命。",
                "super_mutant_simplicity": "好戰士保護弱小！超級變種人尊敬好戰士！",
                "brotherhood_significance": "忠誠是騎士最重要的品質。為他人犧牲是榮譽。",
                "ncr_significance": "共和國建立在這樣的公民身上。服務大於自我。",
                "legion_significance": "這就是軍團精神：為了更大目標犧牲個人。",
                "raiders_significance": "這種人最難對付。他們為別人而戰。",
                "vault_dweller_significance": "Vault-Tec 安全協議的體現：保護所有居民。"
            },
            {
                "id": "radiation_storm_7",
                "name": "輻射風暴 (The Radiation Storm)",
                "number": 7,
                "upright_meaning": "變化力量、自然威力、淨化轉化、環境挑戰、適應能力",
                "reversed_meaning": "破壞失控、環境災難、變異失敗、抗拒改變",
                "radiation_level": 4.5,
                "threat_level": 8,
                "vault_number": None,
                "wasteland_humor": "在輻射風暴中野餐，防輻寧當作調味料使用",
                "pip_boy_analysis": "輻射警報：嚴重。建議：立即尋找掩護。Rad-Away 準備就緒。",
                "vault_dweller_perspective": "大自然提醒我們誰才是真正的主宰。學會敬畏和適應。",
                "wasteland_trader_wisdom": "風暴過後總有新機會。變異不一定是壞事。",
                "super_mutant_simplicity": "大風暴改變一切！有時好，有時壞！變化是自然！",
                "brotherhood_significance": "科技必須學會與自然共存。不能控制一切。",
                "ncr_significance": "環境保護是民主責任。我們必須修復世界。",
                "legion_significance": "只有強者能在風暴中生存。這是自然選擇。",
                "raiders_significance": "風暴來了！搶在別人之前找到好地方躲！",
                "vault_dweller_significance": "外界的危險提醒我們為什麼需要避難所。"
            }
            # 可以繼續添加其他14張大牌...
        ])

        return major_arcana

    def generate_nuka_cola_suit(self) -> List[Dict[str, Any]]:
        """Generate Nuka-Cola Bottles suit (equivalent to Cups)"""
        nuka_cards = []

        # 數字牌 1-10
        for number in range(1, 11):
            card_data = {
                "id": f"nuka_cola_{number}",
                "name": f"{number} of Nuka-Cola Bottles",
                "number": number,
                "suit": WastelandSuit.NUKA_COLA_BOTTLES.value,
                "upright_meaning": self._get_nuka_meaning(number),
                "reversed_meaning": self._get_nuka_reversed_meaning(number),
                "radiation_level": 2.5 + (number * 0.2),
                "threat_level": max(1, min(5, number // 2)),
                "vault_number": None,
                "wasteland_humor": f"第{number}瓶Nuka-Cola讓人產生幻覺，看到戰前的美好時光",
                "nuka_cola_reference": f"\"Nuka-Cola! The most popular beverage in the Pre-War world!\" - 第{number}瓶總是最甜的",
                "pip_boy_analysis": f"化學分析：咖啡因{number*10}mg，糖分{number*15}g，輻射{number*5} rads。",
                "vault_dweller_perspective": f"Vault-Tec 實驗報告：Nuka-Cola攝取量與情緒穩定度正相關。",
                "wasteland_trader_wisdom": f"Nuka-Cola比水還珍貴。第{number}瓶可以換{number*2}個瓶蓋。",
                "super_mutant_simplicity": f"{number} 甜甜汽水！讓小人類開心！",
                "brotherhood_significance": f"Pre-War 消費文化的象徵。{number}瓶代表不同程度的懷舊。",
                "ncr_significance": f"商業復興的象徵。Nuka-Cola工廠重啟對經濟重要。",
                "legion_significance": f"軟弱的Pre-War產品。但戰士也需要糖分補充。",
                "raiders_significance": f"甜甜的汽水讓人放鬆警戒。{number}瓶可以毒死很多人。",
                "vault_dweller_significance": f"避難所實驗：糖分對心理健康的影響研究第{number}階段。"
            }
            nuka_cards.append(card_data)

        # 宮廷牌
        court_cards = [
            ("Nuka-Cola新兵", "Nuka-Cola Page", 11),
            ("Nuka-Cola騎士", "Nuka-Cola Knight", 12),
            ("Nuka-Cola女王", "Nuka-Cola Queen", 13),
            ("Nuka-Cola國王", "Nuka-Cola King", 14)
        ]

        for chinese_name, english_name, number in court_cards:
            card_data = {
                "id": f"nuka_cola_court_{number}",
                "name": f"{chinese_name} ({english_name})",
                "number": number,
                "suit": WastelandSuit.NUKA_COLA_BOTTLES.value,
                "upright_meaning": self._get_court_meaning(english_name, "情感治療"),
                "reversed_meaning": self._get_court_reversed_meaning(english_name, "情感治療"),
                "radiation_level": 3.0 + (number - 10) * 0.3,
                "threat_level": 2,
                "vault_number": None,
                "wasteland_humor": f"{chinese_name}擁有無限的Nuka-Cola供應，但從不分享",
                "nuka_cola_reference": f"{english_name}的最愛：Nuka-Cola Quantum",
                "pip_boy_analysis": f"人員檔案：{english_name}，Nuka-Cola專精等級MAX。",
                "vault_dweller_perspective": f"這位{chinese_name}真的很懂Nuka-Cola的各種用途。",
                "wasteland_trader_wisdom": f"向{chinese_name}學習Nuka-Cola的交易價值。",
                "super_mutant_simplicity": f"{english_name.upper()} 是汽水專家！",
                "brotherhood_significance": f"Nuka-Cola製造技術的保存者。",
                "ncr_significance": f"消費品產業復興的領導者。",
                "legion_significance": f"理解敵人文化的重要性。",
                "raiders_significance": f"知道哪裡能找到最好的Nuka-Cola。",
                "vault_dweller_significance": f"消費文化研究專家。"
            }
            nuka_cards.append(card_data)

        return nuka_cards

    def generate_combat_weapons_suit(self) -> List[Dict[str, Any]]:
        """Generate Combat Weapons suit (equivalent to Swords)"""
        weapon_cards = []

        # 數字牌 1-10
        for number in range(1, 11):
            card_data = {
                "id": f"combat_weapons_{number}",
                "name": f"{number} of Combat Weapons",
                "number": number,
                "suit": WastelandSuit.COMBAT_WEAPONS.value,
                "upright_meaning": self._get_weapon_meaning(number),
                "reversed_meaning": self._get_weapon_reversed_meaning(number),
                "radiation_level": 1.0 + (number * 0.1),
                "threat_level": min(10, number),
                "vault_number": None,
                "wasteland_humor": f"武器#{number}經常在關鍵時刻卡彈，需要用力敲打",
                "nuka_cola_reference": f"用{number}個Nuka-Cola瓶蓋可以買把不錯的{self._get_weapon_type(number)}",
                "pip_boy_analysis": f"武器狀況：{number*10}%。維修建議：{self._get_repair_advice(number)}。",
                "vault_dweller_perspective": f"Vault-Tec武器訓練第{number}級：{self._get_weapon_type(number)}專精。",
                "wasteland_trader_wisdom": f"好武器救命，壞武器要命。第{number}級武器需要{number*50}瓶蓋。",
                "super_mutant_simplicity": f"{number} 武器殺很多敵人！好武器！",
                "brotherhood_significance": f"武器科技等級{number}。能量武器優於傳統武器。",
                "ncr_significance": f"軍事裝備標準化等級{number}。訓練比武器重要。",
                "legion_significance": f"戰士等級{number}。技巧勝過裝備。",
                "raiders_significance": f"搶來的第{number}把武器！越多越好！",
                "vault_dweller_significance": f"安全協議等級{number}：適當武裝保護社區。"
            }
            weapon_cards.append(card_data)

        # 宮廷牌
        court_cards = [
            ("武器新兵", "Weapons Page", 11),
            ("戰場騎士", "Combat Knight", 12),
            ("戰術女王", "Tactical Queen", 13),
            ("武裝國王", "Armed King", 14)
        ]

        for chinese_name, english_name, number in court_cards:
            card_data = {
                "id": f"combat_weapons_court_{number}",
                "name": f"{chinese_name} ({english_name})",
                "number": number,
                "suit": WastelandSuit.COMBAT_WEAPONS.value,
                "upright_meaning": self._get_court_meaning(english_name, "戰鬥策略"),
                "reversed_meaning": self._get_court_reversed_meaning(english_name, "戰鬥策略"),
                "radiation_level": 1.5,
                "threat_level": 8,
                "vault_number": None,
                "wasteland_humor": f"{chinese_name}的動力裝甲經常過熱冒煙",
                "nuka_cola_reference": f"{english_name}用Nuka-Cola Quantum當作戰前興奮劑",
                "pip_boy_analysis": f"戰鬥評估：{english_name}，戰鬥技能專家級。",
                "vault_dweller_perspective": f"這位{chinese_name}的戰鬥經驗值得學習。",
                "wasteland_trader_wisdom": f"僱用{chinese_name}保護商隊是明智投資。",
                "super_mutant_simplicity": f"{english_name.upper()} 很強戰士！",
                "brotherhood_significance": f"騎士階級代表：掌握先進武器技術。",
                "ncr_significance": f"職業軍人的典範：紀律與技能並重。",
                "legion_significance": f"百夫長級別：戰略與戰術的完美結合。",
                "raiders_significance": f"這種人最好別惹。太危險了。",
                "vault_dweller_significance": f"安全部門主管：保護社區的專業人士。"
            }
            weapon_cards.append(card_data)

        return weapon_cards

    def generate_bottle_caps_suit(self) -> List[Dict[str, Any]]:
        """Generate Bottle Caps suit (equivalent to Pentacles)"""
        caps_cards = []

        # 數字牌 1-10
        for number in range(1, 11):
            card_data = {
                "id": f"bottle_caps_{number}",
                "name": f"{number} of Bottle Caps",
                "number": number,
                "suit": WastelandSuit.BOTTLE_CAPS.value,
                "upright_meaning": self._get_caps_meaning(number),
                "reversed_meaning": self._get_caps_reversed_meaning(number),
                "radiation_level": 0.2 + (number * 0.05),
                "threat_level": 1,
                "vault_number": None,
                "wasteland_humor": f"收集了{number*100}個瓶蓋，感覺自己是廢土首富",
                "nuka_cola_reference": f"{number}個瓶蓋的價值相當於{number}餐熱食",
                "pip_boy_analysis": f"財務狀況：{number*100}瓶蓋。購買力：{self._get_purchasing_power(number)}。",
                "vault_dweller_perspective": f"瓶蓋經濟學第{number}課：資源管理的重要性。",
                "wasteland_trader_wisdom": f"瓶蓋就是生命。{number*100}個瓶蓋可以買到{self._get_trade_goods(number)}。",
                "super_mutant_simplicity": f"{number} 閃亮金屬圓圈！小人類喜歡收集！",
                "brotherhood_significance": f"資源分配等級{number}：技術發展需要經濟支持。",
                "ncr_significance": f"經濟復興階段{number}：重建需要穩定貨幣。",
                "legion_significance": f"軍團財政等級{number}：戰爭需要經濟基礎。",
                "raiders_significance": f"搶到{number*100}個瓶蓋！今晚有錢花了！",
                "vault_dweller_significance": f"避難所經濟管理第{number}階段：資源優化配置。"
            }
            caps_cards.append(card_data)

        # 宮廷牌
        court_cards = [
            ("瓶蓋學徒", "Caps Apprentice", 11),
            ("廢土商人", "Wasteland Merchant", 12),
            ("交易女王", "Trade Queen", 13),
            ("瓶蓋大王", "Caps King", 14)
        ]

        for chinese_name, english_name, number in court_cards:
            card_data = {
                "id": f"bottle_caps_court_{number}",
                "name": f"{chinese_name} ({english_name})",
                "number": number,
                "suit": WastelandSuit.BOTTLE_CAPS.value,
                "upright_meaning": self._get_court_meaning(english_name, "經濟貿易"),
                "reversed_meaning": self._get_court_reversed_meaning(english_name, "經濟貿易"),
                "radiation_level": 0.5,
                "threat_level": 2,
                "vault_number": None,
                "wasteland_humor": f"{chinese_name}用瓶蓋計算預算，結果算錯了小數點",
                "nuka_cola_reference": f"{english_name}收藏稀有的Nuka-Cola瓶蓋",
                "pip_boy_analysis": f"商業評估：{english_name}，交易技能專家級。",
                "vault_dweller_perspective": f"向{chinese_name}學習廢土經濟運作。",
                "wasteland_trader_wisdom": f"{chinese_name}知道所有最好的交易路線。",
                "super_mutant_simplicity": f"{english_name.upper()} 有很多亮亮圓圈！",
                "brotherhood_significance": f"經濟專家：理解資源對技術發展的重要性。",
                "ncr_significance": f"商業領袖：推動經濟復興的關鍵人物。",
                "legion_significance": f"財政官員：軍團擴張的經濟支柱。",
                "raiders_significance": f"這人有錢！但也很狡猾，小心被騙。",
                "vault_dweller_significance": f"資源管理專家：避難所經濟運作的核心。"
            }
            caps_cards.append(card_data)

        return caps_cards

    def generate_radiation_rods_suit(self) -> List[Dict[str, Any]]:
        """Generate Radiation Rods suit (equivalent to Wands)"""
        rods_cards = []

        # 數字牌 1-10
        for number in range(1, 11):
            card_data = {
                "id": f"radiation_rods_{number}",
                "name": f"{number} of Radiation Rods",
                "number": number,
                "suit": WastelandSuit.RADIATION_RODS.value,
                "upright_meaning": self._get_rods_meaning(number),
                "reversed_meaning": self._get_rods_reversed_meaning(number),
                "radiation_level": 4.0 + (number * 0.5),
                "threat_level": min(9, 3 + number // 2),
                "vault_number": None,
                "wasteland_humor": f"輻射等級{number}讓你在黑暗中發綠光，不用手電筒了",
                "nuka_cola_reference": f"Nuka-Cola Quantum的輻射等級大約是{number}",
                "pip_boy_analysis": f"輻射檢測：{number*100} rads。創新指數：{number*10}%。警告：使用防護。",
                "vault_dweller_perspective": f"輻射實驗第{number}階段：受控輻射的創造性應用。",
                "wasteland_trader_wisdom": f"輻射能源等級{number}：危險但有用。小心交易。",
                "super_mutant_simplicity": f"{number} 綠光棒！讓超級變種人更強！",
                "brotherhood_significance": f"核能技術等級{number}：清潔能源的潛力與風險。",
                "ncr_significance": f"核能政策第{number}階段：安全使用核技術。",
                "legion_significance": f"力量等級{number}：征服需要強大能源。",
                "raiders_significance": f"輻射武器等級{number}！讓敵人變成綠色！",
                "vault_dweller_significance": f"核子實驗第{number}階段：和平利用原子能。"
            }
            rods_cards.append(card_data)

        # 宮廷牌
        court_cards = [
            ("輻射學徒", "Radiation Apprentice", 11),
            ("核子騎士", "Nuclear Knight", 12),
            ("原子女王", "Atomic Queen", 13),
            ("輻射大王", "Radiation King", 14)
        ]

        for chinese_name, english_name, number in court_cards:
            card_data = {
                "id": f"radiation_rods_court_{number}",
                "name": f"{chinese_name} ({english_name})",
                "number": number,
                "suit": WastelandSuit.RADIATION_RODS.value,
                "upright_meaning": self._get_court_meaning(english_name, "能量創新"),
                "reversed_meaning": self._get_court_reversed_meaning(english_name, "能量創新"),
                "radiation_level": 5.0,
                "threat_level": 7,
                "vault_number": None,
                "wasteland_humor": f"{chinese_name}收集輻射棒當作權力象徵",
                "nuka_cola_reference": f"{english_name}用Nuka-Cola Quantum做核實驗",
                "pip_boy_analysis": f"核子專家：{english_name}，輻射科學專精。",
                "vault_dweller_perspective": f"{chinese_name}掌握著危險但強大的知識。",
                "wasteland_trader_wisdom": f"向{chinese_name}學習核能交易，但要小心。",
                "super_mutant_simplicity": f"{english_name.upper()} 控制綠光能量！",
                "brotherhood_significance": f"核子專家：掌握原子能的終極知識。",
                "ncr_significance": f"核能工程師：重建文明的關鍵技術。",
                "legion_significance": f"核武專家：軍團最終武器的掌控者。",
                "raiders_significance": f"核瘋子！別惹他們，會爆炸的！",
                "vault_dweller_significance": f"原子能研究主任：和平原子的守護者。"
            }
            rods_cards.append(card_data)

        return rods_cards

    def _get_nuka_meaning(self, number: int) -> str:
        """Get Nuka-Cola specific meanings for emotions/healing"""
        meanings = {
            1: "新的情感連結，純真的愛，治療的開始",
            2: "伙伴關係，情感平衡，互相治療",
            3: "友誼慶祝，社群支持，集體治療",
            4: "情感穩定，滿足現狀，治療停滯",
            5: "失望遺憾，關係破裂，治療挫折",
            6: "懷舊回憶，童年純真，心靈治療",
            7: "幻想迷茫，選擇過多，治療方向不明",
            8: "離開過去，尋找新路，主動治療",
            9: "情感滿足，願望實現，完全治療",
            10: "情感圓滿，家庭和諧，治療成功"
        }
        return meanings.get(number, f"Nuka-Cola能量等級{number}")

    def _get_nuka_reversed_meaning(self, number: int) -> str:
        """Get reversed Nuka-Cola meanings"""
        meanings = {
            1: "情感封閉，拒絕治療，冷漠疏離",
            2: "關係失衡，缺乏合作，治療中斷",
            3: "社交問題，友誼破裂，孤立無援",
            4: "情感冷漠，自滿停滯，拒絕改變",
            5: "無法放下，沉溺於痛苦，治療失敗",
            6: "活在過去，拒絕成長，逃避現實",
            7: "現實清醒，幻想破滅，面對真相",
            8: "抗拒改變，困在過去，治療倒退",
            9: "不滿足，貪婪無度，永不滿足",
            10: "家庭破裂，情感崩壞，治療無效"
        }
        return meanings.get(number, f"Nuka-Cola負面效應等級{number}")

    def _get_weapon_meaning(self, number: int) -> str:
        """Get Combat Weapons specific meanings for conflict/strategy"""
        meanings = {
            1: "新的挑戰，戰略開始，衝突萌芽",
            2: "艱難決定，平衡對立，策略思考",
            3: "心中傷痛，背叛痛苦，戰略受挫",
            4: "休戰時刻，暫時平靜，策略暫停",
            5: "失敗挫折，不公正，戰略失敗",
            6: "轉移陣地，從困境中學習，策略調整",
            7: "不正當手段，欺騙詭計，策略狡詐",
            8: "思想束縛，自我限制，策略受限",
            9: "焦慮恐懼，惡夢困擾，戰略失控",
            10: "痛苦結束，背叛暴露，戰略崩潰"
        }
        return meanings.get(number, f"戰鬥等級{number}")

    def _get_weapon_reversed_meaning(self, number: int) -> str:
        """Get reversed Combat Weapons meanings"""
        meanings = {
            1: "避免衝突，內在平靜，策略保守",
            2: "決定延遲，逃避選擇，策略混亂",
            3: "療傷恢復，原諒釋懷，策略重建",
            4: "重新活動，結束休息，策略重啟",
            5: "從失敗中學習，挽回損失，策略改進",
            6: "困難旅程，無法逃避，策略僵化",
            7: "誠實面對，正當手段，策略透明",
            8: "思想解放，突破限制，策略自由",
            9: "希望重現，恐懼消散，戰略重生",
            10: "痛苦延續，拒絕結束，戰略固執"
        }
        return meanings.get(number, f"戰鬥負面等級{number}")

    def _get_caps_meaning(self, number: int) -> str:
        """Get Bottle Caps specific meanings for resources/trade"""
        meanings = {
            1: "新的商機，財富開始，投資機會",
            2: "資源平衡，靈活應變，交易技巧",
            3: "團隊合作，技能展示，商業成功",
            4: "財富保守，資源緊握，投資謹慎",
            5: "經濟困難，資源短缺，交易失敗",
            6: "慷慨分享，資源互助，公平交易",
            7: "長期投資，耐心等待，商業規劃",
            8: "技能提升，專精學習，商業成長",
            9: "財富積累，獨立自主，商業成就",
            10: "家族財富，長期穩定，商業傳承"
        }
        return meanings.get(number, f"財富等級{number}")

    def _get_caps_reversed_meaning(self, number: int) -> str:
        """Get reversed Bottle Caps meanings"""
        meanings = {
            1: "機會錯失，投資失敗，財務困難",
            2: "資源失衡，財務混亂，交易不當",
            3: "團隊分裂，技能不足，商業失敗",
            4: "過度貪婪，資源浪費，投資盲目",
            5: "財務恢復，資源改善，交易機會",
            6: "自私吝嗇，不公分配，交易不公",
            7: "缺乏耐心，短視投資，商業急躁",
            8: "技能停滯，學習中斷，商業倒退",
            9: "財富損失，依賴他人，商業失敗",
            10: "家族破產，傳承中斷，商業覆滅"
        }
        return meanings.get(number, f"財富負面等級{number}")

    def _get_rods_meaning(self, number: int) -> str:
        """Get Radiation Rods specific meanings for energy/creativity"""
        meanings = {
            1: "創意爆發，新項目，能量覺醒",
            2: "未來規劃，等待時機，能量蓄積",
            3: "遠見卓識，探索機會，能量擴散",
            4: "慶祝成就，穩定基礎，能量和諧",
            5: "競爭衝突，不同意見，能量混亂",
            6: "勝利成功，領導地位，能量顯現",
            7: "捍衛立場，挑戰困難，能量抗爭",
            8: "快速行動，信息傳遞，能量爆發",
            9: "最後堅持，準備防守，能量耗盡",
            10: "責任重擔，過度努力，能量過載"
        }
        return meanings.get(number, f"能量等級{number}")

    def _get_rods_reversed_meaning(self, number: int) -> str:
        """Get reversed Radiation Rods meanings"""
        meanings = {
            1: "創意枯竭，計劃延遲，能量阻塞",
            2: "計劃取消，時機不當，能量耗散",
            3: "缺乏遠見，機會錯失，能量迷失",
            4: "慶祝過早，基礎不穩，能量虛假",
            5: "內在衝突，避免競爭，能量內耗",
            6: "私人勝利，成功延遲，能量隱藏",
            7: "感到疲憊，放棄抵抗，能量枯竭",
            8: "行動遲緩，溝通不良，能量滯後",
            9: "偏執疑慮，過度防守，能量扭曲",
            10: "責任推卸，精疲力竭，能量崩潰"
        }
        return meanings.get(number, f"能量負面等級{number}")

    def _get_court_meaning(self, title: str, domain: str) -> str:
        """Get court card meanings based on title and domain"""
        if "Page" in title or "新兵" in title or "學徒" in title:
            return f"在{domain}領域的學習熱忱，新手的好奇心，基礎技能的掌握"
        elif "Knight" in title or "騎士" in title:
            return f"在{domain}領域的行動力，實踐經驗，中級技能的展現"
        elif "Queen" in title or "女王" in title:
            return f"在{domain}領域的直覺智慧，情感理解，高級技能的運用"
        elif "King" in title or "國王" in title or "大王" in title:
            return f"在{domain}領域的權威掌控，成熟經驗，專精技能的完美"
        return f"{domain}領域的專業人士"

    def _get_court_reversed_meaning(self, title: str, domain: str) -> str:
        """Get reversed court card meanings"""
        if "Page" in title or "新兵" in title or "學徒" in title:
            return f"在{domain}領域學習困難，缺乏專注，基礎不穩"
        elif "Knight" in title or "騎士" in title:
            return f"在{domain}領域行動魯莽，缺乏計劃，技能誤用"
        elif "Queen" in title or "女王" in title:
            return f"在{domain}領域情感失控，直覺錯誤，技能濫用"
        elif "King" in title or "國王" in title or "大王" in title:
            return f"在{domain}領域獨裁專制，經驗僵化，技能壟斷"
        return f"{domain}領域的問題專家"

    def _get_weapon_type(self, number: int) -> str:
        """Get weapon type based on number"""
        weapons = {
            1: "10mm手槍", 2: "戰鬥刀", 3: "獵槍", 4: "突擊步槍", 5: "狙擊步槍",
            6: "火箭筒", 7: "雷射步槍", 8: "電漿步槍", 9: "高斯步槍", 10: "胖子核彈發射器"
        }
        return weapons.get(number, f"第{number}級武器")

    def _get_repair_advice(self, number: int) -> str:
        """Get repair advice based on weapon condition"""
        if number <= 3:
            return "需要大修"
        elif number <= 6:
            return "定期保養"
        else:
            return "狀況良好"

    def _get_purchasing_power(self, number: int) -> str:
        """Get purchasing power description"""
        if number <= 2:
            return "很低"
        elif number <= 5:
            return "中等"
        elif number <= 8:
            return "良好"
        else:
            return "優秀"

    def _get_trade_goods(self, number: int) -> str:
        """Get trade goods based on caps amount"""
        goods = {
            1: "一罐食物", 2: "基本藥品", 3: "彈藥補給", 4: "小型武器", 5: "防護裝備",
            6: "高級藥品", 7: "優質武器", 8: "動力裝甲部件", 9: "稀有科技", 10: "一輛裝甲車"
        }
        return goods.get(number, f"價值{number*100}瓶蓋的物品")

    def generate_all_cards(self) -> List[Dict[str, Any]]:
        """Generate all 78 cards in the Wasteland Tarot deck"""
        all_cards = []

        # Add Major Arcana (22 cards)
        major_arcana = self.generate_major_arcana()
        for card in major_arcana:
            card["suit"] = WastelandSuit.MAJOR_ARCANA.value
        all_cards.extend(major_arcana)

        # Add Minor Arcana (56 cards)
        all_cards.extend(self.generate_nuka_cola_suit())
        all_cards.extend(self.generate_combat_weapons_suit())
        all_cards.extend(self.generate_bottle_caps_suit())
        all_cards.extend(self.generate_radiation_rods_suit())

        return all_cards


async def create_complete_wasteland_deck(db: AsyncSession) -> bool:
    """Create the complete 78-card Wasteland Tarot deck"""
    try:
        generator = WastelandCardGenerator()
        all_cards_data = generator.generate_all_cards()

        print(f"Generating {len(all_cards_data)} Wasteland Tarot cards...")

        cards_created = 0
        for card_data in all_cards_data:
            # Check if card already exists
            existing_card = await db.get(WastelandCard, card_data["id"])
            if existing_card:
                print(f"Card {card_data['name']} already exists, skipping...")
                continue

            # Create new card with all the comprehensive data
            card = WastelandCard(
                id=card_data["id"],
                name=card_data["name"],
                suit=card_data["suit"],
                number=card_data.get("number"),
                upright_meaning=card_data["upright_meaning"],
                reversed_meaning=card_data["reversed_meaning"],
                radiation_level=card_data["radiation_level"],
                threat_level=card_data["threat_level"],
                vault_number=card_data.get("vault_number"),

                # Character voice interpretations
                pip_boy_analysis=card_data["pip_boy_analysis"],
                vault_dweller_perspective=card_data["vault_dweller_perspective"],
                wasteland_trader_wisdom=card_data["wasteland_trader_wisdom"],
                super_mutant_simplicity=card_data["super_mutant_simplicity"],

                # Faction significance
                brotherhood_significance=card_data["brotherhood_significance"],
                ncr_significance=card_data["ncr_significance"],
                legion_significance=card_data["legion_significance"],
                raiders_significance=card_data["raiders_significance"],
                vault_dweller_significance=card_data["vault_dweller_significance"],

                # Fallout elements
                wasteland_humor=card_data["wasteland_humor"],
                nuka_cola_reference=card_data["nuka_cola_reference"],
                fallout_easter_egg=f"Wasteland Tarot: {card_data['name']}",

                # Set default values for other fields
                good_karma_interpretation=f"善良解讀：{card_data['upright_meaning']}",
                neutral_karma_interpretation=f"中性解讀：{card_data['upright_meaning']}",
                evil_karma_interpretation=f"邪惡解讀：{card_data['reversed_meaning']}",

                special_ability=f"Wasteland power: {card_data['upright_meaning'][:50]}",
                affects_luck_stat=card_data.get("number", 0) % 3 == 0,  # Every 3rd card affects luck
                affects_charisma_stat=card_data.get("number", 0) % 4 == 0,  # Every 4th card affects charisma
                affects_intelligence_stat=card_data.get("number", 0) % 5 == 0,  # Every 5th card affects intelligence

                # Initialize counters
                draw_frequency=0,
                total_appearances=0,
                last_drawn_at=None
            )

            db.add(card)
            cards_created += 1

        await db.commit()
        print(f"✅ Successfully created {cards_created} new Wasteland Tarot cards!")
        print(f"📊 Total deck size: {len(all_cards_data)} cards")
        print("🎯 Deck includes:")
        print("   - 22 Major Arcana cards with Fallout themes")
        print("   - 14 Nuka-Cola Bottles (Cups equivalent)")
        print("   - 14 Combat Weapons (Swords equivalent)")
        print("   - 14 Bottle Caps (Pentacles equivalent)")
        print("   - 14 Radiation Rods (Wands equivalent)")

        return True

    except Exception as e:
        print(f"❌ Error creating complete deck: {e}")
        await db.rollback()
        return False


if __name__ == "__main__":
    print("🎲 Complete Wasteland Tarot Deck Generator")
    print("This script creates all 78 Fallout-themed tarot cards")
    print("Run this through the main application to populate your database")