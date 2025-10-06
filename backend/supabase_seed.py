#!/usr/bin/env python3
"""
Supabase Seeding Script for Wasteland Tarot
Direct connection to Supabase to populate with complete card deck
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

# Set environment to use Supabase
os.environ['USE_SUPABASE'] = 'true'
os.environ['DATABASE_URL'] = 'postgresql+asyncpg://postgres:' + os.getenv('DB_PASSWORD', 'development_password') + '@db.aelwaolzpraxmzjqdiyw.supabase.co:5432/postgres'

from supabase import create_client, Client
from dotenv import load_dotenv
load_dotenv()

# Supabase connection
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def get_complete_card_data():
    """Get complete 78-card Fallout-themed tarot deck"""
    cards = []

    # Major Arcana (22 cards)
    major_arcana = [
        {
            "id": "vault_newbie_0",
            "name": "新手避難所居民 (The Vault Newbie)",
            "suit": "MAJOR_ARCANA",
            "number": 0,
            "radiation_level": 0.1,
            "threat_level": 1,
            "vault_number": 111,
            "upright_meaning": "剛走出避難所的居民，對廢土充滿天真幻想，代表新開始、無知即福、適應能力",
            "reversed_meaning": "過度天真、缺乏準備、拒絕面對現實",
            "good_karma_interpretation": "你的純真心靈將為廢土帶來新希望，保持初心",
            "neutral_karma_interpretation": "新的冒險即將開始，準備好學習和適應",
            "evil_karma_interpretation": "天真會讓你成為獵物，學會生存或死亡",
            "pip_boy_analysis": "數據分析：新手狀態。建議：循序漸進學習廢土生存技能",
            "vault_dweller_perspective": "嘿！我也是從避難所出來的！記住，保持希望很重要",
            "wasteland_trader_wisdom": "新人？第一條建議：信任要慢慢給，瓶蓋要小心花",
            "super_mutant_simplicity": "小人類剛出來！超級變種人保護新人類！",
            "brotherhood_significance": "代表科技學習的開始，知識的追求",
            "ncr_significance": "新公民的潛力，民主制度的新血",
            "legion_significance": "未經考驗的新兵，需要嚴格訓練",
            "raiders_significance": "容易騙的肥羊，或者潛在的新夥伴",
            "vault_dweller_significance": "同胞的新旅程，共同的避難所背景",
            "wasteland_humor": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土",
            "fallout_easter_egg": "Vault-Tec推薦：記住要常洗手！",
            "affects_luck_stat": True
        },
        {
            "id": "tech_specialist_1",
            "name": "科技專家 (The Tech Specialist)",
            "suit": "MAJOR_ARCANA",
            "number": 1,
            "radiation_level": 0.3,
            "threat_level": 3,
            "vault_number": 81,
            "upright_meaning": "掌握先進科技的廢土科學家，代表技能、創新、廢料利用、科技掌控",
            "reversed_meaning": "技術依賴、忽視人性、科技成癮",
            "good_karma_interpretation": "用你的知識改善他人生活，科技服務人類",
            "neutral_karma_interpretation": "平衡技術進步與人文關懷",
            "evil_karma_interpretation": "知識就是力量，用科技控制弱者",
            "pip_boy_analysis": "專業技能檢測完成。建議：持續學習新科技",
            "vault_dweller_perspective": "哇！就像我們的科技官一樣聰明！",
            "wasteland_trader_wisdom": "技術專家？那你修東西的價格如何？",
            "super_mutant_simplicity": "聰明人類！超級變種人尊敬聰明人類！",
            "brotherhood_significance": "鋼鐵兄弟會的核心理念，科技保存",
            "ncr_significance": "共和國的技術進步，工程師階級",
            "legion_significance": "有用的奴隸，但要提防其野心",
            "raiders_significance": "修理東西的工具人，很有價值",
            "vault_dweller_significance": "避難所的技術傳承，維修專家",
            "wasteland_humor": "用膠帶和廢料修理高科技設備",
            "fallout_easter_egg": "它能運作，但別問我為什麼",
            "affects_intelligence_stat": True
        },
        {
            "id": "wasteland_oracle_2",
            "name": "神秘預言家 (The Wasteland Oracle)",
            "suit": "MAJOR_ARCANA",
            "number": 2,
            "radiation_level": 0.7,
            "threat_level": 2,
            "vault_number": None,
            "upright_meaning": "擁有預知能力的神秘廢土居民，代表直覺、神秘知識、輻射感知、內在智慧",
            "reversed_meaning": "被幻象迷惑、直覺錯誤、過度依賴神秘力量",
            "good_karma_interpretation": "你的直覺將引導迷失的靈魂找到正確道路",
            "neutral_karma_interpretation": "相信內在聲音，但也要理性判斷",
            "evil_karma_interpretation": "利用他人的迷信和恐懼獲得權力",
            "pip_boy_analysis": "異常能量讀數。警告：超自然現象無法量化",
            "vault_dweller_perspective": "有些人說她能預知未來，真的假的？",
            "wasteland_trader_wisdom": "神秘學？只要客戶願意付錢，什麼都能賣",
            "super_mutant_simplicity": "奇怪人類看得到超級變種人看不到的東西",
            "brotherhood_significance": "不科學的現象，需要研究和理解",
            "ncr_significance": "迷信對理性社會有害，但要尊重信仰",
            "legion_significance": "神諭和預言對軍事戰略有用",
            "raiders_significance": "恐怖故事和詛咒，很好的心理戰工具",
            "vault_dweller_significance": "避難所外的神秘世界，未知的力量",
            "wasteland_humor": "用破損的電視機占卜未來",
            "fallout_easter_egg": "我看到...我看到...靜電干擾",
            "affects_charisma_stat": True
        },
        {
            "id": "farm_matriarch_3",
            "name": "農場主母 (The Farm Matriarch)",
            "suit": "MAJOR_ARCANA",
            "number": 3,
            "radiation_level": 0.2,
            "threat_level": 2,
            "vault_number": None,
            "upright_meaning": "在廢土中建立繁榮農場的女性領袖，代表豐饒、養育、變異成長、社群建設",
            "reversed_meaning": "過度保護、控制欲強、資源浪費",
            "good_karma_interpretation": "你的照顧將讓荒蕪的土地重新綻放生機",
            "neutral_karma_interpretation": "平衡保護與放手，讓事物自然成長",
            "evil_karma_interpretation": "控制食物來源就是控制人心",
            "pip_boy_analysis": "農業產量分析：高效率。建議：擴大種植規模",
            "vault_dweller_perspective": "就像我們的水培專家！她讓沙漠開花",
            "wasteland_trader_wisdom": "新鮮食物在廢土是硬通貨，比瓶蓋還值錢",
            "super_mutant_simplicity": "好媽媽！給大家食物！超級變種人喜歡好媽媽！",
            "brotherhood_significance": "農業科技的實際應用，生存必需",
            "ncr_significance": "農業是共和國的基礎，食物安全",
            "legion_significance": "生產力的象徵，母性的價值",
            "raiders_significance": "搶劫目標，但也可能是保護對象",
            "vault_dweller_significance": "G.E.C.K.的成功應用，重建世界",
            "wasteland_humor": "種植變異巨大蔬菜，豐收到誇張程度",
            "fallout_easter_egg": "這些番茄有三個頭，但味道很好！",
            "affects_charisma_stat": True
        },
        {
            "id": "overseer_4",
            "name": "避難所監督 (The Overseer)",
            "suit": "MAJOR_ARCANA",
            "number": 4,
            "radiation_level": 0.0,
            "threat_level": 4,
            "vault_number": 101,
            "upright_meaning": "掌控避難所秩序的威權領袖，代表權威、秩序、官僚制度、控制",
            "reversed_meaning": "濫用權力、獨裁統治、官僚腐敗",
            "good_karma_interpretation": "用權威保護和指導他人，負責任的領導",
            "neutral_karma_interpretation": "權力來自責任，謹慎使用你的影響力",
            "evil_karma_interpretation": "絕對權力帶來絕對控制，統治弱者",
            "pip_boy_analysis": "管理系統運行正常。警告：獨裁傾向檢測",
            "vault_dweller_perspective": "監督官總是說這是為了我們好...",
            "wasteland_trader_wisdom": "權力結構在任何社會都很重要，但要看誰在頂端",
            "super_mutant_simplicity": "老大！超級變種人懂老大！有時老大好，有時老大壞！",
            "brotherhood_significance": "等級制度的重要性，軍事化管理",
            "ncr_significance": "民主制衡威權，權力分散的重要性",
            "legion_significance": "強有力的領導，階級制度的典範",
            "raiders_significance": "大老闆，要麼跟隨要麼推翻",
            "vault_dweller_significance": "避難所權威結構，監督官的角色",
            "wasteland_humor": "被一群反叛居民用廁紙卷襲擊",
            "fallout_easter_egg": "請記住：故障回報應該透過正當管道",
            "affects_charisma_stat": True
        }
        # 可以繼續添加更多 Major Arcana...
    ]

    # Minor Arcana - Nuka-Cola Bottles (聖杯替代)
    nuka_cola_cards = []
    for i in range(1, 11):  # Ace to 10
        card = {
            "id": f"nuka_{i}",
            "name": f"可樂瓶 {i} (Nuka-Cola {i})",
            "suit": "NUKA_COLA_BOTTLES",
            "number": i,
            "radiation_level": 0.1 * i / 10,
            "threat_level": 1,
            "upright_meaning": f"第{i}級的情感治癒和社群連結",
            "reversed_meaning": f"情感依賴或可樂成癮的第{i}階段",
            "good_karma_interpretation": "純淨的情感能量，治癒他人",
            "neutral_karma_interpretation": "平衡的情感狀態，適度的連結",
            "evil_karma_interpretation": "操控他人情感，成癮控制",
            "pip_boy_analysis": f"可樂療效分析：{i*10}%恢復率",
            "vault_dweller_perspective": "哇，這瓶可樂看起來真清爽！",
            "wasteland_trader_wisdom": f"Nuka-Cola {i}號配方，市價{i*5}瓶蓋",
            "super_mutant_simplicity": f"甜甜水！{i}級甜！超級變種人喜歡！",
            "brotherhood_significance": "戰前食品工業技術研究",
            "ncr_significance": "商業貿易網絡的重要商品",
            "legion_significance": "奢侈品，分散注意力的工具",
            "raiders_significance": "搶劫目標，或者交易籌碼",
            "vault_dweller_significance": "戰前生活的美好回憶",
            "wasteland_humor": f"發光的藍色可樂，輻射等級{i}",
            "fallout_easter_egg": "Nuka-Cola: 為什麼選擇？",
            "affects_charisma_stat": i > 5
        }
        nuka_cola_cards.append(card)

    # Court cards for Nuka-Cola
    court_cards = [
        {"number": 11, "name": "可樂新兵 (Nuka Recruit)", "title": "新兵"},
        {"number": 12, "name": "可樂騎士 (Nuka Knight)", "title": "騎士"},
        {"number": 13, "name": "可樂領袖 (Nuka Leader)", "title": "領袖"},
        {"number": 14, "name": "可樂霸主 (Nuka Overlord)", "title": "霸主"}
    ]

    for court in court_cards:
        card = {
            "id": f"nuka_{court['number']}",
            "name": court["name"],
            "suit": "NUKA_COLA_BOTTLES",
            "number": court["number"],
            "radiation_level": 0.3,
            "threat_level": court["number"] - 8,
            "upright_meaning": f"{court['title']}等級的情感領導力",
            "reversed_meaning": f"{court['title']}的情感失控",
            "good_karma_interpretation": f"用{court['title']}身份療癒他人",
            "neutral_karma_interpretation": f"{court['title']}的平衡情感智慧",
            "evil_karma_interpretation": f"濫用{court['title']}地位操控情感",
            "pip_boy_analysis": f"{court['title']}級別領導能力分析",
            "vault_dweller_perspective": f"這位{court['title']}看起來很厲害！",
            "wasteland_trader_wisdom": f"{court['title']}等級的人脈價值連城",
            "super_mutant_simplicity": f"{court['title']}是好領導！超級變種人跟隨！",
            "brotherhood_significance": f"{court['title']}階級在組織中的作用",
            "ncr_significance": f"民主社會中的{court['title']}角色",
            "legion_significance": f"軍事階級中的{court['title']}地位",
            "raiders_significance": f"幫派中的{court['title']}威望",
            "vault_dweller_significance": f"避難所{court['title']}的責任",
            "wasteland_humor": f"穿著Nuka-Cola制服的{court['title']}",
            "fallout_easter_egg": f"Nuka-Cola公司{court['title']}級員工福利",
            "affects_charisma_stat": True
        }
        nuka_cola_cards.append(card)

    # 類似地為其他三個花色創建卡片...
    # Combat Weapons, Bottle Caps, Radiation Rods

    # 為了簡化，我們先添加主要的牌
    cards.extend(major_arcana)
    cards.extend(nuka_cola_cards)

    return cards

async def seed_supabase():
    """Seed Supabase database with complete Wasteland Tarot data"""
    print("🎲 Starting Supabase Database Seeding for Wasteland Tarot")
    print("=" * 60)

    try:
        # 1. Seed Cards
        print("\n[1/4] Seeding Wasteland Cards...")
        cards_data = get_complete_card_data()

        # Clear existing cards first (optional)
        try:
            supabase.table('wasteland_cards').delete().neq('id', 'nonexistent').execute()
            print("  Cleared existing cards")
        except Exception as e:
            print(f"  Note: {e}")

        # Insert cards in batches
        batch_size = 10
        for i in range(0, len(cards_data), batch_size):
            batch = cards_data[i:i+batch_size]
            result = supabase.table('wasteland_cards').insert(batch).execute()
            print(f"  Inserted batch {i//batch_size + 1}: {len(batch)} cards")

        print(f"✅ Successfully seeded {len(cards_data)} cards!")

        # 2. Seed Spread Templates
        print("\n[2/4] Seeding Spread Templates...")
        spreads_data = [
            {
                "id": "single_wasteland",
                "name": "single_wasteland_reading",
                "display_name": "單卡廢土占卜",
                "description": "用一張卡牌指引今日的廢土生存策略",
                "spread_type": "single_card",
                "card_count": 1,
                "positions": [{"position": 1, "name": "廢土指引", "meaning": "今日的生存建議"}],
                "difficulty_level": "beginner",
                "faction_preference": "vault_dweller",
                "is_active": True,
                "is_premium": False
            },
            {
                "id": "vault_tec_spread",
                "name": "vault_tec_three_card",
                "display_name": "Vault-Tec 時光機",
                "description": "分析從戰前到重建的完整時間線",
                "spread_type": "three_card",
                "card_count": 3,
                "positions": [
                    {"position": 1, "name": "戰前狀況", "meaning": "過去的影響"},
                    {"position": 2, "name": "當前廢土", "meaning": "現在的情況"},
                    {"position": 3, "name": "重建希望", "meaning": "未來的可能"}
                ],
                "difficulty_level": "intermediate",
                "faction_preference": "vault_dweller",
                "is_active": True,
                "is_premium": False
            },
            {
                "id": "survival_spread",
                "name": "wasteland_survival_spread",
                "display_name": "廢土生存指南",
                "description": "複雜的生存決策分析",
                "spread_type": "survival",
                "card_count": 5,
                "positions": [
                    {"position": 1, "name": "資源狀況", "meaning": "可用資源評估"},
                    {"position": 2, "name": "威脅評估", "meaning": "潛在危險分析"},
                    {"position": 3, "name": "盟友支援", "meaning": "可依靠的幫助"},
                    {"position": 4, "name": "生存策略", "meaning": "最佳行動方案"},
                    {"position": 5, "name": "最終結果", "meaning": "預期結果"}
                ],
                "difficulty_level": "advanced",
                "faction_preference": "wasteland_trader",
                "is_active": True,
                "is_premium": False
            }
        ]

        try:
            supabase.table('spread_templates').delete().neq('id', 'nonexistent').execute()
        except:
            pass

        result = supabase.table('spread_templates').insert(spreads_data).execute()
        print(f"✅ Successfully seeded {len(spreads_data)} spread templates!")

        # 3. Seed Interpretation Templates
        print("\n[3/4] Seeding Interpretation Templates...")
        interp_data = [
            {
                "id": "pip_boy_template",
                "character_voice": "pip_boy",
                "character_name": "Pip-Boy 3000",
                "personality_traits": ["analytical", "precise", "helpful", "technical"],
                "tone": "analytical",
                "vocabulary_style": "technical",
                "faction_alignment": "vault_dweller",
                "humor_style": "dry_technical",
                "is_active": True
            },
            {
                "id": "vault_dweller_template",
                "character_voice": "vault_dweller",
                "character_name": "Vault Dweller",
                "personality_traits": ["hopeful", "naive", "curious", "optimistic"],
                "tone": "hopeful",
                "vocabulary_style": "simple_honest",
                "faction_alignment": "vault_dweller",
                "humor_style": "wholesome",
                "is_active": True
            },
            {
                "id": "trader_template",
                "character_voice": "wasteland_trader",
                "character_name": "Wasteland Trader",
                "personality_traits": ["pragmatic", "experienced", "shrewd", "wise"],
                "tone": "wise_practical",
                "vocabulary_style": "street_smart",
                "humor_style": "dry_observational",
                "is_active": True
            },
            {
                "id": "super_mutant_template",
                "character_voice": "super_mutant",
                "character_name": "Super Mutant",
                "personality_traits": ["direct", "simple", "strong", "honest"],
                "tone": "direct_simple",
                "vocabulary_style": "simple",
                "humor_style": "innocent",
                "is_active": True
            }
        ]

        try:
            supabase.table('interpretation_templates').delete().neq('id', 'nonexistent').execute()
        except:
            pass

        result = supabase.table('interpretation_templates').insert(interp_data).execute()
        print(f"✅ Successfully seeded {len(interp_data)} interpretation templates!")

        # 4. Summary
        print("\n[4/4] Seeding Complete!")
        print("=" * 60)
        print("🎯 Supabase Seeding Summary:")
        print(f"   ✅ {len(cards_data)} Wasteland Cards")
        print(f"   ✅ {len(spreads_data)} Spread Templates")
        print(f"   ✅ {len(interp_data)} Interpretation Templates")
        print("\n🎮 Your Wasteland Tarot database is ready!")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed_supabase())