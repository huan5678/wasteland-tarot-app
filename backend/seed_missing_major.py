from supabase import create_client
import os
import uuid
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def create_card(number, name, upright, reversed, rad, threat, humor):
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "suit": "major_arcana",
        "number": number,
        "upright_meaning": upright,
        "reversed_meaning": reversed,
        "radiation_level": rad,
        "threat_level": threat,
        "wasteland_humor": humor,
        "nuka_cola_reference": f"這張卡牌的能量就像{number}瓶Nuka-Cola",
        "fallout_easter_egg": "戰爭，戰爭從不改變",
        "special_ability": f"{name}的特殊能力",
        "good_karma_interpretation": f"善用{name}的力量",
        "neutral_karma_interpretation": f"{name}需要平衡",
        "evil_karma_interpretation": f"濫用{name}會有後果",
        "pip_boy_analysis": f"Pip-Boy分析：{name}",
        "vault_dweller_perspective": f"避難所視角：{name}",
        "wasteland_trader_wisdom": f"商人智慧：{name}",
        "super_mutant_simplicity": f"{name}！好卡牌！",
        "codsworth_analysis": f"關於{name}的分析",
        "brotherhood_significance": f"兄弟會：{name}很重要",
        "ncr_significance": f"NCR：{name}有幫助",
        "legion_significance": f"軍團：{name}展現力量",
        "raiders_significance": f"掠奪者：{name}能賺錢！",
        "vault_dweller_significance": f"避難所：{name}的意義"
    }

missing_cards = [
    (10, "命運輪盤", "命運、機會、循環、變化、運氣", "厄運、失控、惡性循環", 0.6, 4, "新維加斯賭場風格的命運輪盤"),
    (11, "正義執行者", "正義、平衡、責任、因果、公平", "不公、偏見、逃避責任", 0.2, 3, "身穿NCR護甲的正義使者"),
    (12, "倒吊掠奪者", "犧牲、暫停、新視角、啟示、放下", "拖延、抗拒改變、無意義犧牲", 0.4, 2, "被倒吊在廢土路標上思考"),
    (13, "輻射死神", "轉變、結束、重生、變化、新開始", "抗拒改變、停滯、恐懼", 0.9, 5, "身披輻射符號斗篷的神秘死神"),
    (14, "節制醫者", "平衡、節制、治療、調和、耐心", "不平衡、過度、缺乏耐心", 0.3, 2, "混合治療針和輻射解毒劑"),
    (15, "死爪惡魔", "誘惑、束縛、物質主義、恐懼、成癮", "解脫、覺醒、打破束縛", 0.8, 5, "巨大死爪守護黃金瓶蓋"),
    (16, "摧毀之塔", "災難、啟示、突然變化、毀滅、解放", "逃避災難、抗拒變化", 0.9, 5, "被核彈直擊的摩天大樓"),
    (17, "星辰指引", "希望、指引、靈感、治癒、樂觀", "絕望、迷失方向、缺乏信心", 0.3, 1, "污染天空中的明亮星星"),
    (18, "月影幻象", "幻象、恐懼、不確定、直覺、神秘", "真相揭露、克服恐懼", 0.6, 3, "輻射發光的月亮照亮廢土"),
    (19, "太陽新生", "成功、快樂、生命力、啟蒙、純真", "過度樂觀、驕傲、失敗", 0.1, 1, "在廢土上升起的燦爛太陽")
]

print(f"補充 {len(missing_cards)} 張缺失的大阿卡納...\n")

for data in missing_cards:
    card = create_card(*data)
    try:
        result = supabase.table('wasteland_cards').insert([card]).execute()
        print(f"✅ {data[0]:2d}: {data[1]}")
    except Exception as e:
        print(f"❌ {data[0]:2d}: {data[1]} - {str(e)[:60]}")

# 驗證
print("\n驗證結果...")
result = supabase.table('wasteland_cards').select("id").eq('suit', 'major_arcana').execute()
print(f"📊 大阿卡納總計：{len(result.data)} 張（預期 22 張）")

all_result = supabase.table('wasteland_cards').select("id").execute()
print(f"📊 所有卡牌總計：{len(all_result.data)} 張（預期 78 張）")
