#!/usr/bin/env python3
"""
完整廢土塔羅牌資料庫填充 - 繁體中文版
Complete Wasteland Tarot Database Seeding - Traditional Chinese Version
包含全部78張卡牌的資料
"""

import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase connection
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def get_complete_card_data_zh_tw():
    """取得完整的78張廢土塔羅牌資料 (繁體中文)"""

    # Major Arcana (大阿爾克那) - 22張
    major_arcana = [
        {
            "id": "vault_newbie",
            "name": "新手避難所居民",
            "english_name": "The Vault Newbie",
            "suit": "MAJOR_ARCANA",
            "number": 0,
            "description": "剛走出避難所的居民，對廢土充滿天真幻想",
            "upright_meaning": "新開始、天真、無知即福、適應能力、探索精神",
            "reversed_meaning": "魯莽、缺乏準備、忽視危險、過度樂觀",
            "fallout_context": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土",
            "keywords": "天真、新開始、無知即福、適應能力"
        },
        {
            "id": "tech_specialist",
            "name": "科技專家",
            "english_name": "The Tech Specialist",
            "suit": "MAJOR_ARCANA",
            "number": 1,
            "description": "掌握先進科技的廢土科學家",
            "upright_meaning": "技能、創新、廢料利用、科技掌控、解決問題",
            "reversed_meaning": "技術依賴、過度複雜、理論脫離實際",
            "fallout_context": "用膠帶和廢料修理高科技設備",
            "keywords": "技能、創新、廢料利用、科技掌控"
        },
        {
            "id": "wasteland_oracle",
            "name": "神秘預言家",
            "english_name": "The Wasteland Oracle",
            "suit": "MAJOR_ARCANA",
            "number": 2,
            "description": "擁有預知能力的神秘廢土居民",
            "upright_meaning": "直覺、神秘知識、輻射感知、內在智慧、預見能力",
            "reversed_meaning": "迷信、虛假預言、過度依賴直覺、神秘主義",
            "fallout_context": "用破損的電視機占卜未來",
            "keywords": "直覺、神秘知識、輻射感知、內在智慧"
        },
        {
            "id": "farm_matriarch",
            "name": "農場主母",
            "english_name": "The Farm Matriarch",
            "suit": "MAJOR_ARCANA",
            "number": 3,
            "description": "在廢土中建立繁榮農場的女性領袖",
            "upright_meaning": "豐饒、養育、變異成長、社群建設、創造力",
            "reversed_meaning": "過度保護、控制慾、資源浪費、創造力枯竭",
            "fallout_context": "種植變異巨大蔬菜，豐收到誇張程度",
            "keywords": "豐饒、養育、變異成長、社群建設"
        },
        {
            "id": "overseer",
            "name": "避難所監督",
            "english_name": "The Overseer",
            "suit": "MAJOR_ARCANA",
            "number": 4,
            "description": "掌控避難所秩序的威權領袖",
            "upright_meaning": "權威、秩序、官僚制度、控制、穩定",
            "reversed_meaning": "專制、僵化、濫用權力、過度控制",
            "fallout_context": "被一群反叛居民用廁紙卷襲擊",
            "keywords": "權威、秩序、官僚制度、控制"
        },
        {
            "id": "brotherhood_elder",
            "name": "兄弟會長老",
            "english_name": "The Brotherhood Elder",
            "suit": "MAJOR_ARCANA",
            "number": 5,
            "description": "鋼鐵兄弟會的知識守護者",
            "upright_meaning": "傳統、知識保存、教條、指導、智慧傳承",
            "reversed_meaning": "固執、教條主義、知識壟斷、拒絕變化",
            "fallout_context": "對著一本說明書虔誠祈禱",
            "keywords": "傳統、知識保存、教條、指導"
        },
        {
            "id": "wasteland_lovers",
            "name": "廢土戀人",
            "english_name": "The Wasteland Lovers",
            "suit": "MAJOR_ARCANA",
            "number": 6,
            "description": "在末世中找到真愛的一對戀人",
            "upright_meaning": "愛情、關係、選擇、和諧、結合",
            "reversed_meaning": "關係問題、錯誤選擇、不和諧、分離",
            "fallout_context": "在輻射日落下相擁的浪漫場景",
            "keywords": "愛情、關係、選擇、和諧"
        },
        {
            "id": "armored_chariot",
            "name": "裝甲戰車",
            "english_name": "The Armored Chariot",
            "suit": "MAJOR_ARCANA",
            "number": 7,
            "description": "驅駛戰車征戰廢土的勇士",
            "upright_meaning": "勝利、決心、控制、進展、征服",
            "reversed_meaning": "失控、方向迷失、過度侵略、無法前進",
            "fallout_context": "改裝的戰車在廢土上疾馳",
            "keywords": "勝利、決心、控制、進展"
        },
        {
            "id": "inner_strength",
            "name": "內在力量",
            "english_name": "Inner Strength",
            "suit": "MAJOR_ARCANA",
            "number": 8,
            "description": "馴服變異野獸的溫柔力量",
            "upright_meaning": "力量、勇氣、耐心、自制、內在美德",
            "reversed_meaning": "軟弱、缺乏信心、失控、內在掙扎",
            "fallout_context": "溫柔撫摸變異熊的廢土居民",
            "keywords": "力量、勇氣、耐心、自制"
        },
        {
            "id": "wasteland_hermit",
            "name": "廢土隱者",
            "english_name": "The Wasteland Hermit",
            "suit": "MAJOR_ARCANA",
            "number": 9,
            "description": "獨自在廢土中尋求真理的智者",
            "upright_meaning": "內省、尋求、智慧、指導、獨立",
            "reversed_meaning": "孤立、逃避、頑固、拒絕幫助",
            "fallout_context": "舉著輻射燈籠照亮黑暗的廢土",
            "keywords": "內省、尋求、智慧、指導"
        },
        {
            "id": "wheel_of_fortune",
            "name": "命運輪盤",
            "english_name": "Wheel of Fortune",
            "suit": "MAJOR_ARCANA",
            "number": 10,
            "description": "決定廢土命運的巨大輪盤",
            "upright_meaning": "命運、機會、循環、變化、運氣",
            "reversed_meaning": "厄運、失控、惡性循環、運氣不佳",
            "fallout_context": "新維加斯賭場風格的命運輪盤",
            "keywords": "命運、機會、循環、變化"
        },
        {
            "id": "justice_enforcer",
            "name": "正義執行者",
            "english_name": "Justice Enforcer",
            "suit": "MAJOR_ARCANA",
            "number": 11,
            "description": "在廢土中維護正義的執法者",
            "upright_meaning": "正義、平衡、責任、因果、公平",
            "reversed_meaning": "不公、偏見、逃避責任、復仇",
            "fallout_context": "身穿NCR護甲的正義使者",
            "keywords": "正義、平衡、責任、因果"
        },
        {
            "id": "hanged_raider",
            "name": "倒吊掠奪者",
            "english_name": "The Hanged Raider",
            "suit": "MAJOR_ARCANA",
            "number": 12,
            "description": "被倒吊懺悔的前掠奪者",
            "upright_meaning": "犧牲、暫停、新視角、啟示、放下",
            "reversed_meaning": "拖延、抗拒改變、無意義的犧牲",
            "fallout_context": "被倒吊在廢土路標上思考人生",
            "keywords": "犧牲、暫停、新視角、啟示"
        },
        {
            "id": "radiation_death",
            "name": "輻射死神",
            "english_name": "Radiation Death",
            "suit": "MAJOR_ARCANA",
            "number": 13,
            "description": "帶來終結與重生的輻射使者",
            "upright_meaning": "轉變、結束、重生、變化、新開始",
            "reversed_meaning": "抗拒改變、停滯、恐懼、腐朽",
            "fallout_context": "身披輻射符號斗篷的神秘死神",
            "keywords": "轉變、結束、重生、變化"
        },
        {
            "id": "temperance_medic",
            "name": "節制醫者",
            "english_name": "Temperance Medic",
            "suit": "MAJOR_ARCANA",
            "number": 14,
            "description": "調和輻射與治療的醫者",
            "upright_meaning": "平衡、節制、治療、調和、耐心",
            "reversed_meaning": "不平衡、過度、缺乏耐心、極端",
            "fallout_context": "混合治療針和輻射解毒劑",
            "keywords": "平衡、節制、治療、調和"
        },
        {
            "id": "deathclaw_devil",
            "name": "死爪惡魔",
            "english_name": "The Deathclaw Devil",
            "suit": "MAJOR_ARCANA",
            "number": 15,
            "description": "代表誘惑與恐懼的死爪怪物",
            "upright_meaning": "誘惑、束縛、物質主義、恐懼、成癮",
            "reversed_meaning": "解脫、覺醒、打破束縛、克服恐懼",
            "fallout_context": "巨大的死爪守護著黃金瓶蓋",
            "keywords": "誘惑、束縛、物質主義、恐懼"
        },
        {
            "id": "destroyed_tower",
            "name": "摧毀之塔",
            "english_name": "The Destroyed Tower",
            "suit": "MAJOR_ARCANA",
            "number": 16,
            "description": "被核彈摧毀的高塔",
            "upright_meaning": "災難、啟示、突然變化、毀滅、解放",
            "reversed_meaning": "逃避災難、抗拒變化、延遲的破壞",
            "fallout_context": "被核彈直擊的摩天大樓",
            "keywords": "災難、啟示、突然變化、毀滅"
        },
        {
            "id": "stellar_guidance",
            "name": "星辰指引",
            "english_name": "Stellar Guidance",
            "suit": "MAJOR_ARCANA",
            "number": 17,
            "description": "在污染天空中的希望之星",
            "upright_meaning": "希望、指引、靈感、治癒、樂觀",
            "reversed_meaning": "絕望、迷失方向、缺乏信心、悲觀",
            "fallout_context": "污染天空中的明亮星星",
            "keywords": "希望、指引、靈感、治癒"
        },
        {
            "id": "lunar_illusion",
            "name": "月影幻象",
            "english_name": "Lunar Illusion",
            "suit": "MAJOR_ARCANA",
            "number": 18,
            "description": "在輻射月光下的幻象與恐懼",
            "upright_meaning": "幻象、恐懼、不確定、直覺、神秘",
            "reversed_meaning": "真相揭露、克服恐懼、清晰、現實",
            "fallout_context": "輻射發光的月亮照亮廢土",
            "keywords": "幻象、恐懼、不確定、直覺"
        },
        {
            "id": "solar_renewal",
            "name": "太陽新生",
            "english_name": "Solar Renewal",
            "suit": "MAJOR_ARCANA",
            "number": 19,
            "description": "重新照耀廢土的希望之陽",
            "upright_meaning": "成功、快樂、生命力、啟蒙、純真",
            "reversed_meaning": "過度樂觀、驕傲、失敗、負面態度",
            "fallout_context": "在廢土上升起的燦爛太陽",
            "keywords": "成功、快樂、生命力、啟蒙"
        },
        {
            "id": "judgment_day",
            "name": "審判之日",
            "english_name": "Judgment Day",
            "suit": "MAJOR_ARCANA",
            "number": 20,
            "description": "核戰後的最終審判",
            "upright_meaning": "重生、救贖、內在呼喚、寬恕、覺醒",
            "reversed_meaning": "自我懷疑、逃避責任、缺乏寬恕",
            "fallout_context": "核爆雲中響起的審判號角",
            "keywords": "重生、救贖、內在呼喚、寬恕"
        },
        {
            "id": "wasteland_world",
            "name": "廢土世界",
            "english_name": "The Wasteland World",
            "suit": "MAJOR_ARCANA",
            "number": 21,
            "description": "完整的廢土世界與其循環",
            "upright_meaning": "完成、成就、整合、循環、圓滿",
            "reversed_meaning": "不完整、缺乏成就、停滞、尋求結束",
            "fallout_context": "廢土的完整生態循環",
            "keywords": "完成、成就、整合、循環"
        }
    ]

    # Minor Arcana - Nuka-Cola Bottles (可樂瓶) - 14張
    nuka_cola_cards = []
    nuka_meanings = {
        1: {"upright": "新的情感開始、治療、希望", "reversed": "情感封閉、治療困難、絕望"},
        2: {"upright": "伙伴關係、合作、愛情", "reversed": "分離、衝突、不平衡"},
        3: {"upright": "慶祝、友誼、社群", "reversed": "過度放縱、社交問題、孤立"},
        4: {"upright": "不滿足、新機會、重新評估", "reversed": "錯失機會、冷漠、退縮"},
        5: {"upright": "失望、悲傷、專注於損失", "reversed": "復原、向前看、接受變化"},
        6: {"upright": "懷舊、回憶、童年、給予", "reversed": "沉溺過去、無法前進、拒絕幫助"},
        7: {"upright": "幻想、選擇、願望實現", "reversed": "現實檢查、錯誤選擇、幻想破滅"},
        8: {"upright": "放棄、離開、尋求更深意義", "reversed": "逃避、恐懼改變、表面滿足"},
        9: {"upright": "滿足、願望實現、情感滿足", "reversed": "自滿、物質主義、精神空虛"},
        10: {"upright": "快樂、和諧、家庭幸福", "reversed": "破裂的關係、不和諧、衝突"}
    }

    # 數字牌 1-10
    for i in range(1, 11):
        nuka_cola_cards.append({
            "id": f"nuka_{i}",
            "name": f"{['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i-1]}可樂瓶",
            "english_name": f"{['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][i-1]} of Nuka-Cola Bottles",
            "suit": "NUKA_COLA_BOTTLES",
            "number": i,
            "description": f"可樂瓶{['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i-1]} - 代表廢土中的情感與治療",
            "upright_meaning": nuka_meanings[i]["upright"],
            "reversed_meaning": nuka_meanings[i]["reversed"],
            "fallout_context": "閃閃發光的Nuka-Cola瓶子在廢土中象徵希望",
            "keywords": "情感、關係、治療、希望"
        })

    # 宮廷牌
    court_names = ["新兵", "廢土騎士", "聚落領袖", "廢土霸主"]
    court_english = ["Page", "Knight", "Queen", "King"]
    for i, (zh_name, en_name) in enumerate(zip(court_names, court_english)):
        nuka_cola_cards.append({
            "id": f"nuka_{en_name.lower()}",
            "name": f"可樂瓶{zh_name}",
            "english_name": f"{en_name} of Nuka-Cola Bottles",
            "suit": "NUKA_COLA_BOTTLES",
            "number": 11 + i,
            "description": f"可樂瓶{zh_name} - 情感領域的{zh_name}",
            "upright_meaning": f"情感成熟、{zh_name}特質、關懷他人",
            "reversed_meaning": f"情感不成熟、{zh_name}特質的負面表現",
            "fallout_context": f"掌管可樂瓶花色的{zh_name}",
            "keywords": f"情感、{zh_name}、關懷、治療"
        })

    # Combat Weapons (戰鬥武器) - 14張
    combat_cards = []
    combat_meanings = {
        1: {"upright": "新思維、智力突破、真理", "reversed": "混亂思維、偏見、殘酷"},
        2: {"upright": "困難決定、僵局、平衡", "reversed": "資訊過載、困惑、延遲決定"},
        3: {"upright": "心痛、分離、悲傷", "reversed": "復原、寬恕、樂觀"},
        4: {"upright": "休息、恢復、冥想", "reversed": "停滯、孤立、退縮"},
        5: {"upright": "衝突、失敗、不公正", "reversed": "和解、學習、移除"},
        6: {"upright": "過渡、搬家、離開困境", "reversed": "抗拒改變、困在問題中"},
        7: {"upright": "欺騙、策略、獨自行動", "reversed": "揭露真相、尋求建議、團隊合作"},
        8: {"upright": "限制、陷阱、無力感", "reversed": "自由、新觀點、解決方案"},
        9: {"upright": "焦慮、恐懼、噩夢", "reversed": "克服恐懼、復原、希望"},
        10: {"upright": "背叛、結束、失敗", "reversed": "復原、學習、重新開始"}
    }

    for i in range(1, 11):
        combat_cards.append({
            "id": f"weapon_{i}",
            "name": f"{['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i-1]}戰鬥武器",
            "english_name": f"{['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][i-1]} of Combat Weapons",
            "suit": "COMBAT_WEAPONS",
            "number": i,
            "description": f"戰鬥武器{['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i-1]} - 代表廢土中的衝突與智慧",
            "upright_meaning": combat_meanings[i]["upright"],
            "reversed_meaning": combat_meanings[i]["reversed"],
            "fallout_context": "廢土中的各種戰鬥武器代表思維與衝突",
            "keywords": "衝突、智慧、策略、決策"
        })

    for i, (zh_name, en_name) in enumerate(zip(court_names, court_english)):
        combat_cards.append({
            "id": f"weapon_{en_name.lower()}",
            "name": f"戰鬥武器{zh_name}",
            "english_name": f"{en_name} of Combat Weapons",
            "suit": "COMBAT_WEAPONS",
            "number": 11 + i,
            "description": f"戰鬥武器{zh_name} - 戰鬥領域的{zh_name}",
            "upright_meaning": f"戰略思維、{zh_name}特質、智慧領導",
            "reversed_meaning": f"侵略性、{zh_name}特質的負面表現",
            "fallout_context": f"掌管戰鬥武器花色的{zh_name}",
            "keywords": f"戰鬥、{zh_name}、策略、智慧"
        })

    # Bottle Caps (瓶蓋) - 14張
    caps_cards = []
    caps_meanings = {
        1: {"upright": "新機會、物質開始、繁榮", "reversed": "錯失機會、貪婪、物質損失"},
        2: {"upright": "平衡、適應、靈活性", "reversed": "失衡、過度承諾、財務問題"},
        3: {"upright": "團隊合作、技能分享、學習", "reversed": "缺乏合作、技能不足、品質差"},
        4: {"upright": "節儉、安全、控制", "reversed": "貪婪、不安全感、控制過度"},
        5: {"upright": "貧困、不安全、需要幫助", "reversed": "復原、精神富足、改善"},
        6: {"upright": "慈善、分享、公平", "reversed": "自私、不公平、債務"},
        7: {"upright": "評估、耐心、長遠思考", "reversed": "急躁、短視、缺乏進展"},
        8: {"upright": "技能發展、專注、勤奮", "reversed": "完美主義、缺乏專注、技能不足"},
        9: {"upright": "豐盛、獨立、智慧", "reversed": "過度工作、財務焦慮、缺乏遠見"},
        10: {"upright": "財富、遺產、家庭安全", "reversed": "財務損失、家庭問題、短期思維"}
    }

    for i in range(1, 11):
        caps_cards.append({
            "id": f"caps_{i}",
            "name": f"{['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i-1]}瓶蓋",
            "english_name": f"{['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][i-1]} of Bottle Caps",
            "suit": "BOTTLE_CAPS",
            "number": i,
            "description": f"瓶蓋{['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i-1]} - 代表廢土中的資源與財富",
            "upright_meaning": caps_meanings[i]["upright"],
            "reversed_meaning": caps_meanings[i]["reversed"],
            "fallout_context": "廢土中最重要的貨幣 - 瓶蓋",
            "keywords": "資源、財富、交易、實用"
        })

    for i, (zh_name, en_name) in enumerate(zip(court_names, court_english)):
        caps_cards.append({
            "id": f"caps_{en_name.lower()}",
            "name": f"瓶蓋{zh_name}",
            "english_name": f"{en_name} of Bottle Caps",
            "suit": "BOTTLE_CAPS",
            "number": 11 + i,
            "description": f"瓶蓋{zh_name} - 資源領域的{zh_name}",
            "upright_meaning": f"資源管理、{zh_name}特質、實用智慧",
            "reversed_meaning": f"資源浪費、{zh_name}特質的負面表現",
            "fallout_context": f"掌管瓶蓋花色的{zh_name}",
            "keywords": f"資源、{zh_name}、實用、財富"
        })

    # Radiation Rods (輻射棒) - 14張
    rods_cards = []
    rods_meanings = {
        1: {"upright": "新計畫、創造力、靈感", "reversed": "延遲、缺乏方向、創造力受阻"},
        2: {"upright": "規劃、個人力量、未來", "reversed": "缺乏規劃、恐懼、不確定"},
        3: {"upright": "進展、遠見、領導", "reversed": "缺乏遠見、延遲、障礙"},
        4: {"upright": "慶祝、和諧、里程碑", "reversed": "不穩定、缺乏和諧、延遲慶祝"},
        5: {"upright": "競爭、衝突、挑戰", "reversed": "避免衝突、內在衝突、妥協"},
        6: {"upright": "勝利、公眾認可、進展", "reversed": "挫折、延遲、缺乏認可"},
        7: {"upright": "挑戰、堅持、防禦", "reversed": "放棄、缺乏勇氣、被壓倒"},
        8: {"upright": "快速行動、進展、改變", "reversed": "延遲、挫折、草率行動"},
        9: {"upright": "堅持、準備、最後推動", "reversed": "疲憊、防禦過度、偏執"},
        10: {"upright": "責任、重擔、接近成功", "reversed": "負擔過重、授權、成功"}
    }

    for i in range(1, 11):
        rods_cards.append({
            "id": f"radiation_{i}",
            "name": f"{['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i-1]}輻射棒",
            "english_name": f"{['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][i-1]} of Radiation Rods",
            "suit": "RADIATION_RODS",
            "number": i,
            "description": f"輻射棒{['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i-1]} - 代表廢土中的能量與創造",
            "upright_meaning": rods_meanings[i]["upright"],
            "reversed_meaning": rods_meanings[i]["reversed"],
            "fallout_context": "發光的輻射棒代表創造與毀滅的力量",
            "keywords": "能量、創造、變異、行動"
        })

    for i, (zh_name, en_name) in enumerate(zip(court_names, court_english)):
        rods_cards.append({
            "id": f"radiation_{en_name.lower()}",
            "name": f"輻射棒{zh_name}",
            "english_name": f"{en_name} of Radiation Rods",
            "suit": "RADIATION_RODS",
            "number": 11 + i,
            "description": f"輻射棒{zh_name} - 能量領域的{zh_name}",
            "upright_meaning": f"創造能量、{zh_name}特質、行動力",
            "reversed_meaning": f"毀滅能量、{zh_name}特質的負面表現",
            "fallout_context": f"掌管輻射棒花色的{zh_name}",
            "keywords": f"能量、{zh_name}、創造、行動"
        })

    # 合併所有卡牌
    all_cards = major_arcana + nuka_cola_cards + combat_cards + caps_cards + rods_cards

    print(f"總共生成 {len(all_cards)} 張卡牌")
    print(f"- 大阿爾克那: {len(major_arcana)} 張")
    print(f"- 可樂瓶: {len(nuka_cola_cards)} 張")
    print(f"- 戰鬥武器: {len(combat_cards)} 張")
    print(f"- 瓶蓋: {len(caps_cards)} 張")
    print(f"- 輻射棒: {len(rods_cards)} 張")

    return all_cards

async def seed_complete_wasteland_tarot():
    """填充完整的78張廢土塔羅牌到Supabase資料庫"""
    print("🎲 開始完整廢土塔羅牌資料庫填充 (繁體中文)")
    print("=" * 80)

    try:
        # 1. 清除現有資料 (可選)
        print("\n[1/4] 檢查現有資料...")
        existing_cards = supabase.table('wasteland_cards').select("*").execute()
        print(f"  發現 {len(existing_cards.data)} 張現有卡牌")

        if existing_cards.data:
            print("  是否要清除現有資料? (y/N): ", end="")
            # 自動化處理 - 更新現有資料而不是刪除
            print("N - 將更新現有資料")

        # 2. 取得卡牌資料
        print("\n[2/4] 生成完整卡牌資料...")
        cards_data = get_complete_card_data_zh_tw()

        # 3. 批量插入/更新卡牌
        print(f"\n[3/4] 填充 {len(cards_data)} 張卡牌到資料庫...")
        success_count = 0
        update_count = 0

        for i, card in enumerate(cards_data, 1):
            try:
                # 檢查卡牌是否已存在
                existing = supabase.table('wasteland_cards').select("id").eq('id', card['id']).execute()

                if existing.data:
                    # 更新現有卡牌
                    result = supabase.table('wasteland_cards').update(card).eq('id', card['id']).execute()
                    print(f"  [{i:2d}/78] 更新: {card['name']} ({card['suit']})")
                    update_count += 1
                else:
                    # 插入新卡牌
                    result = supabase.table('wasteland_cards').insert(card).execute()
                    print(f"  [{i:2d}/78] 新增: {card['name']} ({card['suit']})")

                success_count += 1

                # 每10張卡牌顯示進度
                if i % 10 == 0:
                    print(f"    進度: {i}/78 ({i/78*100:.1f}%)")

            except Exception as e:
                print(f"  ❌ 處理卡牌失敗 {card['name']}: {e}")

        # 4. 驗證結果
        print(f"\n[4/4] 驗證資料庫內容...")
        final_cards = supabase.table('wasteland_cards').select("*").execute()

        # 按花色統計
        suits_count = {}
        for card in final_cards.data:
            suit = card['suit']
            suits_count[suit] = suits_count.get(suit, 0) + 1

        print("✅ 填充完成!")
        print("=" * 80)
        print("🎯 完整廢土塔羅牌資料庫統計:")
        print(f"   ✅ 總計: {len(final_cards.data)} 張卡牌")
        print(f"   📝 新增: {success_count - update_count} 張")
        print(f"   🔄 更新: {update_count} 張")
        print("\n📊 花色分佈:")
        for suit, count in suits_count.items():
            suit_names = {
                'MAJOR_ARCANA': '大阿爾克那',
                'NUKA_COLA_BOTTLES': '可樂瓶',
                'COMBAT_WEAPONS': '戰鬥武器',
                'BOTTLE_CAPS': '瓶蓋',
                'RADIATION_RODS': '輻射棒'
            }
            print(f"   🃏 {suit_names.get(suit, suit)}: {count} 張")

        print("\n🎮 你的完整廢土塔羅牌資料庫已準備就緒!")
        print("   🌟 全部78張卡牌皆為繁體中文")
        print("   🎨 包含完整的Fallout主題設計")
        print("   📚 每張卡牌都有詳細的含義說明")

    except Exception as e:
        print(f"❌ 填充過程發生錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed_complete_wasteland_tarot())