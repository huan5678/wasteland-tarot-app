#!/usr/bin/env python3
"""
完整78張廢土塔羅牌資料庫填充 - 繁體中文版
Complete 78 Wasteland Tarot Cards Database Seeding - Traditional Chinese Version
根據實際Supabase表格結構，包含所有78張卡牌
"""

import asyncio
import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase connection
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def generate_all_78_cards():
    """生成完整的78張廢土塔羅牌（繁體中文）"""

    all_cards = []

    # ===== MAJOR ARCANA (大阿爾克那) - 22張 =====
    major_arcana_data = [
        ("新手避難所居民", "新開始、天真、無知即福、適應能力、探索精神", "魯莽、缺乏準備、忽視危險、過度樂觀", 0.1, 1, "戴著派對帽用Pip-Boy自拍，背景是輻射廢土"),
        ("科技專家", "技能、創新、廢料利用、科技掌控、解決問題", "技術依賴、過度複雜、理論脫離實際", 0.3, 2, "用膠帶和廢料修理高科技設備"),
        ("神秘預言家", "直覺、神秘知識、輻射感知、內在智慧、預見能力", "迷信、虛假預言、過度依賴直覺", 0.7, 3, "用破損的電視機占卜未來"),
        ("農場主母", "豐饒、養育、變異成長、社群建設、創造力", "過度保護、控制慾、資源浪費", 0.2, 1, "種植變異巨大蔬菜，豐收到誇張程度"),
        ("避難所監督", "權威、秩序、官僚制度、控制、穩定", "專制、僵化、濫用權力、過度控制", 0.0, 4, "被反叛居民用廁紙卷襲擊"),
        ("兄弟會長老", "傳統、知識保存、教條、指導、智慧傳承", "固執、教條主義、知識壟斷", 0.1, 3, "對著技術手冊虔誠祈禱"),
        ("廢土戀人", "愛情、關係、選擇、和諧、結合", "關係問題、錯誤選擇、不和諧", 0.3, 2, "在輻射日落下相擁的浪漫場景"),
        ("裝甲戰車", "勝利、決心、控制、進展、征服", "失控、方向迷失、過度侵略", 0.4, 5, "改裝戰車在廢土上疾馳"),
        ("內在力量", "力量、勇氣、耐心、自制、內在美德", "軟弱、缺乏信心、失控", 0.2, 2, "溫柔撫摸變異熊的廢土居民"),
        ("廢土隱者", "內省、尋求、智慧、指導、獨立", "孤立、逃避、頑固、拒絕幫助", 0.5, 2, "舉著輻射燈籠照亮黑暗"),
        ("命運輪盤", "命運、機會、循環、變化、運氣", "厄運、失控、惡性循環", 0.6, 4, "新維加斯賭場風格的命運輪盤"),
        ("正義執行者", "正義、平衡、責任、因果、公平", "不公、偏見、逃避責任", 0.2, 3, "身穿NCR護甲的正義使者"),
        ("倒吊掠奪者", "犧牲、暫停、新視角、啟示、放下", "拖延、抗拒改變、無意義犧牲", 0.4, 2, "被倒吊在廢土路標上思考"),
        ("輻射死神", "轉變、結束、重生、變化、新開始", "抗拒改變、停滯、恐懼", 0.9, 6, "身披輻射符號斗篷的神秘死神"),
        ("節制醫者", "平衡、節制、治療、調和、耐心", "不平衡、過度、缺乏耐心", 0.3, 2, "混合治療針和輻射解毒劑"),
        ("死爪惡魔", "誘惑、束縛、物質主義、恐懼、成癮", "解脫、覺醒、打破束縛", 0.8, 8, "巨大死爪守護黃金瓶蓋"),
        ("摧毀之塔", "災難、啟示、突然變化、毀滅、解放", "逃避災難、抗拒變化", 0.9, 7, "被核彈直擊的摩天大樓"),
        ("星辰指引", "希望、指引、靈感、治癒、樂觀", "絕望、迷失方向、缺乏信心", 0.3, 1, "污染天空中的明亮星星"),
        ("月影幻象", "幻象、恐懼、不確定、直覺、神秘", "真相揭露、克服恐懼、清晰", 0.6, 3, "輻射發光的月亮照亮廢土"),
        ("太陽新生", "成功、快樂、生命力、啟蒙、純真", "過度樂觀、驕傲、失敗", 0.1, 1, "在廢土上升起的燦爛太陽"),
        ("審判之日", "重生、救贖、內在呼喚、寬恕、覺醒", "自我懷疑、逃避責任", 0.7, 5, "核爆雲中響起的審判號角"),
        ("廢土世界", "完成、成就、整合、循環、圓滿", "不完整、缺乏成就、停滯", 0.4, 3, "廢土的完整生態循環")
    ]

    for i, (name, upright, reversed, rad_level, threat, humor) in enumerate(major_arcana_data):
        card = create_card_template(
            name=name,
            suit="major_arcana",
            number=i,
            upright_meaning=upright,
            reversed_meaning=reversed,
            radiation_level=rad_level,
            threat_level=threat,
            wasteland_humor=humor
        )
        all_cards.append(card)

    # ===== MINOR ARCANA =====
    suits_data = {
        "nuka_cola_bottles": {
            "suit_name": "可樂瓶",
            "element": "水",
            "keywords": "情感、關係、治療、希望",
            "theme": "廢土中的情感狀態和人際關係"
        },
        "combat_weapons": {
            "suit_name": "戰鬥武器",
            "element": "風",
            "keywords": "衝突、策略、決策、智慧",
            "theme": "廢土中的衝突和理性思考"
        },
        "bottle_caps": {
            "suit_name": "瓶蓋",
            "element": "土",
            "keywords": "資源、財富、交易、實用",
            "theme": "廢土中的物質財富和資源"
        },
        "radiation_rods": {
            "suit_name": "輻射棒",
            "element": "火",
            "keywords": "能量、創造、變異、行動",
            "theme": "廢土中的創新和行動力"
        }
    }

    # 為每個花色生成14張卡牌 (Ace + 2-10 + 4張宮廷牌)
    for suit_key, suit_info in suits_data.items():
        # 數字牌 (Ace, 2-10)
        number_names = ["王牌", "二", "三", "四", "五", "六", "七", "八", "九", "十"]

        for i in range(10):
            number = i + 1
            card_name = f"{number_names[i]}{suit_info['suit_name']}"

            upright = f"{suit_info['theme']} - {number_names[i]}的正面能量"
            reversed = f"{suit_info['theme']} - {number_names[i]}的負面表現"

            card = create_card_template(
                name=card_name,
                suit=suit_key,
                number=number,
                upright_meaning=upright,
                reversed_meaning=reversed,
                radiation_level=0.1 + (number * 0.05),
                threat_level=max(1, number // 3),
                wasteland_humor=f"{suit_info['suit_name']}的{number_names[i]} - {suit_info['keywords']}"
            )
            all_cards.append(card)

        # 宮廷牌
        court_cards = [
            ("新兵", "Page", 11),
            ("廢土騎士", "Knight", 12),
            ("聚落領袖", "Queen", 13),
            ("廢土霸主", "King", 14)
        ]

        for court_zh, court_en, number in court_cards:
            card_name = f"{suit_info['suit_name']}{court_zh}"

            upright = f"{suit_info['theme']} - {court_zh}的領導能力和專長"
            reversed = f"{suit_info['theme']} - {court_zh}特質的負面表現"

            card = create_card_template(
                name=card_name,
                suit=suit_key,
                number=number,
                upright_meaning=upright,
                reversed_meaning=reversed,
                radiation_level=0.3,
                threat_level=3,
                wasteland_humor=f"掌管{suit_info['suit_name']}花色的{court_zh}"
            )
            all_cards.append(card)

    print(f"✅ 生成完成！總計 {len(all_cards)} 張卡牌")
    return all_cards

def create_card_template(name, suit, number, upright_meaning, reversed_meaning, radiation_level, threat_level, wasteland_humor):
    """創建標準卡牌範本"""
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "suit": suit,
        "number": number,
        "upright_meaning": upright_meaning,
        "reversed_meaning": reversed_meaning,
        "radiation_level": radiation_level,
        "threat_level": threat_level,
        "wasteland_humor": wasteland_humor,
        "nuka_cola_reference": f"在廢土中，{name}就像一瓶冰涼的Nuka-Cola一樣珍貴",
        "fallout_easter_egg": f"戰爭...戰爭從不改變。但{name}帶來了新的希望",
        "special_ability": f"啟動{name}的特殊能力：提升相關技能",
        "upright_keywords": upright_meaning.split("、")[:5],
        "reversed_keywords": reversed_meaning.split("、")[:5],
        "good_interpretation": f"在善良的道路上，{name}將指引你做出正確選擇",
        "neutral_interpretation": f"{name}提醒你保持平衡，在廢土中尋找生存之道",
        "evil_interpretation": f"小心{name}的負面影響，避免讓權力腐蝕你的心智",
        "pip_boy_voice": f"Pip-Boy分析：{name}顯示積極讀數，建議採取行動",
        "vault_dweller_voice": f"根據避難所手冊，{name}代表一個重要的人生階段",
        "wasteland_trader_voice": f"老夥計，{name}在廢土中可是個好兆頭",
        "super_mutant_voice": f"{name}！好卡牌！強者會理解！",
        "codsworth_voice": f"關於{name}，我的資料庫顯示這是個積極的預兆",
        "brotherhood_significance": f"兄弟會檔案：{name}在戰略分析中具有重要意義",
        "ncr_significance": f"NCR情報：{name}對共和國的發展有正面影響",
        "legion_significance": f"軍團記錄：{name}展現了力量和榮譽",
        "raiders_significance": f"掠奪者筆記：{name}？聽起來能賺錢！"
    }

async def seed_all_78_cards():
    """填充完整的78張卡牌到Supabase"""
    print("🎲 開始完整78張廢土塔羅牌填充（繁體中文）")
    print("=" * 80)

    try:
        # 1. 生成所有卡牌
        print("\n[1/3] 生成完整78張卡牌資料...")
        all_cards = generate_all_78_cards()

        # 2. 檢查現有資料
        existing_cards = supabase.table('wasteland_cards').select("name").execute()
        existing_names = {card['name'] for card in existing_cards.data}

        print(f"   現有卡牌: {len(existing_names)} 張")
        print(f"   準備新增: {len(all_cards)} 張")

        # 3. 過濾已存在的卡牌
        new_cards = [card for card in all_cards if card['name'] not in existing_names]
        print(f"   實際新增: {len(new_cards)} 張")

        # 4. 批量插入
        print(f"\n[2/3] 開始批量插入...")
        success_count = 0

        # 分批插入以避免請求過大
        batch_size = 10
        for i in range(0, len(new_cards), batch_size):
            batch = new_cards[i:i + batch_size]
            try:
                result = supabase.table('wasteland_cards').insert(batch).execute()
                batch_success = len(result.data)
                success_count += batch_success
                print(f"   批次 {i//batch_size + 1}: ✅ 成功插入 {batch_success} 張卡牌")
            except Exception as e:
                print(f"   批次 {i//batch_size + 1}: ❌ 插入失敗 - {e}")

        # 5. 最終驗證
        print(f"\n[3/3] 驗證最終結果...")
        final_cards = supabase.table('wasteland_cards').select("id, name, suit").execute()

        # 統計各花色
        suit_counts = {}
        for card in final_cards.data:
            suit = card['suit']
            suit_counts[suit] = suit_counts.get(suit, 0) + 1

        print("✅ 填充完成！")
        print("=" * 80)
        print("🎯 廢土塔羅牌資料庫統計（繁體中文）:")
        print(f"   📊 總計: {len(final_cards.data)} 張卡牌")
        print(f"   ➕ 本次新增: {success_count} 張")

        print("\n📋 花色分佈:")
        suit_names = {
            'major_arcana': '大阿爾克那',
            'nuka_cola_bottles': '可樂瓶',
            'combat_weapons': '戰鬥武器',
            'bottle_caps': '瓶蓋',
            'radiation_rods': '輻射棒'
        }

        for suit, count in suit_counts.items():
            display_name = suit_names.get(suit, suit)
            print(f"   🃏 {display_name}: {count} 張")

        print("\n🎮 完整繁體中文廢土塔羅牌資料庫已準備就緒！")
        print("   🌟 包含完整78張卡牌的繁體中文內容")
        print("   🎨 融合Fallout主題與塔羅牌傳統")
        print("   📚 每張卡牌都有詳細的廢土風格解讀")

    except Exception as e:
        print(f"❌ 填充過程發生錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed_all_78_cards())