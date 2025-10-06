#!/usr/bin/env python3
"""
簡化版 Supabase 資料初始化腳本
使用 Supabase Python 客戶端直接插入資料
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# 添加專案路徑
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from supabase import create_client, Client


def get_supabase_client() -> Client:
    """建立 Supabase 客戶端"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # 使用 service role key 有完整權限

    if not supabase_url or not supabase_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    return create_client(supabase_url, supabase_key)


def create_sample_wasteland_cards():
    """建立範例廢土塔羅牌資料"""
    return [
        {
            "id": "vault_newbie",
            "name": "新手避難所居民 (The Vault Newbie)",
            "suit": "MAJOR_ARCANA",
            "number": 0,
            "upright_meaning": "天真、新開始、無知即福、適應能力",
            "reversed_meaning": "過度天真、拒絕現實、不願適應",
            "radiation_level": 0.5,
            "threat_level": 1,
            "wasteland_humor": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土",
            "nuka_cola_reference": "像第一次嚐到 Nuka-Cola 的甜美驚喜",
            "fallout_easter_egg": "致敬 Fallout 系列的避難所居民",
            "special_ability": "新手的運氣：有時候無知反而是福",
            "upright_keywords": ["天真", "新開始", "適應能力"],
            "reversed_keywords": ["過度天真", "拒絕現實", "不願適應"],
            "good_interpretation": "善良解讀: 純真的心靈將引領正確的道路",
            "neutral_interpretation": "中性解讀: 保持開放心態面對新環境",
            "evil_interpretation": "邪惡解讀: 天真可以被利用來達成目的",
            "pip_boy_voice": "新用戶檢測：歡迎來到廢土生存系統",
            "vault_dweller_voice": "外面的世界充滿未知，但也充滿機會",
            "wasteland_trader_voice": "新面孔總是好生意的開始",
            "super_mutant_voice": "NEW HUMAN. SMALL BUT BRAVE.",
            "codsworth_voice": "Sir，廢土雖然危險，但您會適應的",
            "brotherhood_significance": "新成員需要接受技術訓練",
            "ncr_significance": "新公民是共和國未來的希望",
            "legion_significance": "新血可以強化軍團的力量",
            "raiders_significance": "新手最容易成為獵物"
        },
        {
            "id": "tech_specialist",
            "name": "科技專家 (The Tech Specialist)",
            "suit": "MAJOR_ARCANA",
            "number": 1,
            "upright_meaning": "技能、創新、廢料利用、科技掌控",
            "reversed_meaning": "技術依賴、創新停滯、工具失效",
            "radiation_level": 1.2,
            "threat_level": 3,
            "wasteland_humor": "用膠帶和廢料修理高科技設備",
            "nuka_cola_reference": "像 Nuka-Cola Quantum 一樣充滿能量",
            "fallout_easter_egg": "代表所有廢土中的科技愛好者",
            "special_ability": "技術修復：能讓壞掉的東西重新運作",
            "upright_keywords": ["技能", "創新", "科技掌控"],
            "reversed_keywords": ["技術依賴", "創新停滯", "工具失效"],
            "good_interpretation": "善良解讀: 技術應該用來幫助他人",
            "neutral_interpretation": "中性解讀: 平衡技術與人性的關係",
            "evil_interpretation": "邪惡解讀: 技術可以成為控制他人的工具",
            "pip_boy_voice": "技術分析：系統運作正常，創新模式啟動",
            "vault_dweller_voice": "這些設備雖然舊，但功能仍然強大",
            "wasteland_trader_voice": "好的技術人員值得高價僱用",
            "super_mutant_voice": "TECH HUMAN MAKE GOOD THINGS WORK.",
            "codsworth_voice": "Master，您的技術天賦令人印象深刻",
            "brotherhood_significance": "體現了兄弟會對技術保存的使命",
            "ncr_significance": "技術進步有助於共和國的發展",
            "legion_significance": "過度依賴技術會削弱戰士精神",
            "raiders_significance": "技術專家是有價值的俘虜"
        },
        {
            "id": "nuka_ace",
            "name": "可樂王牌 (Ace of Nuka-Cola)",
            "suit": "NUKA_COLA_BOTTLES",
            "number": 1,
            "upright_meaning": "新的情感開始、純淨的愛、輻射治療",
            "reversed_meaning": "情感混亂、虛假承諾、可樂成癮",
            "radiation_level": 3.0,
            "threat_level": 2,
            "wasteland_humor": "可樂成癮症狀讓人忘記輻射危險",
            "nuka_cola_reference": "戰前最受歡迎的飲料，現在是珍貴藥物",
            "fallout_easter_egg": "Nuka-Cola 是 Fallout 系列的標誌性元素",
            "special_ability": "情感治療：恢復內心的純真與希望",
            "upright_keywords": ["新情感", "純淨愛情", "治療"],
            "reversed_keywords": ["情感混亂", "虛假承諾", "成癮"],
            "good_interpretation": "善良解讀: 真誠的愛能治癒一切創傷",
            "neutral_interpretation": "中性解讀: 情感需要時間來癒合",
            "evil_interpretation": "邪惡解讀: 情感弱點可以被利用",
            "pip_boy_voice": "情感狀態分析：檢測到正面情緒波動",
            "vault_dweller_voice": "這讓我想起避難所裡的美好時光",
            "wasteland_trader_voice": "情感商品總是最好賣的",
            "super_mutant_voice": "HAPPY DRINK MAKE HUMAN FEEL GOOD.",
            "codsworth_voice": "Sir，適度的情感表達對健康有益",
            "brotherhood_significance": "情感連結有助於兄弟會的團結",
            "ncr_significance": "公民的幸福是共和國的基礎",
            "legion_significance": "情感軟弱會影響戰鬥效率",
            "raiders_significance": "情感是可以被操控的弱點"
        },
        {
            "id": "weapon_ace",
            "name": "武器王牌 (Ace of Combat Weapons)",
            "suit": "COMBAT_WEAPONS",
            "number": 1,
            "upright_meaning": "新的衝突、戰略優勢、生存工具",
            "reversed_meaning": "武器故障、策略失敗、不必要暴力",
            "radiation_level": 1.0,
            "threat_level": 5,
            "wasteland_humor": "武器故障的尷尬時刻總是在最需要的時候發生",
            "nuka_cola_reference": "像 Nuka-Cola Quantum 瓶子一樣閃閃發光的武器",
            "fallout_easter_egg": "代表廢土中無處不在的武器文化",
            "special_ability": "戰鬥準備：提高戰鬥成功率",
            "upright_keywords": ["新衝突", "戰略優勢", "生存工具"],
            "reversed_keywords": ["武器故障", "策略失敗", "不必要暴力"],
            "good_interpretation": "善良解讀: 武器應該用來保護無辜的人",
            "neutral_interpretation": "中性解讀: 武器是廢土生存的必需品",
            "evil_interpretation": "邪惡解讀: 武器是獲得權力的最快方式",
            "pip_boy_voice": "武器系統檢查：建議進行維護保養",
            "vault_dweller_voice": "外面很危險，需要保護自己",
            "wasteland_trader_voice": "好武器總是供不應求",
            "super_mutant_voice": "BIG WEAPONS FOR BIG FIGHTS.",
            "codsworth_voice": "Sir，請記得武器安全使用規則",
            "brotherhood_significance": "先進武器是兄弟會力量的象徵",
            "ncr_significance": "武器應該由訓練有素的軍人使用",
            "legion_significance": "戰士的武器反映其榮譽與技能",
            "raiders_significance": "更多武器意味著更多掠奪機會"
        },
        {
            "id": "caps_ace",
            "name": "瓶蓋王牌 (Ace of Bottle Caps)",
            "suit": "BOTTLE_CAPS",
            "number": 1,
            "upright_meaning": "新的商機、財富開始、交易機會",
            "reversed_meaning": "經濟損失、交易詐騙、物質主義",
            "radiation_level": 0.2,
            "threat_level": 1,
            "wasteland_humor": "瓶蓋收集癖讓人把垃圾當寶藏",
            "nuka_cola_reference": "每個瓶蓋都承載著戰前的記憶",
            "fallout_easter_egg": "瓶蓋是廢土世界的通用貨幣",
            "special_ability": "商業直覺：發現隱藏的交易機會",
            "upright_keywords": ["新商機", "財富開始", "交易機會"],
            "reversed_keywords": ["經濟損失", "交易詐騙", "物質主義"],
            "good_interpretation": "善良解讀: 財富應該與他人分享",
            "neutral_interpretation": "中性解讀: 金錢是生存的工具之一",
            "evil_interpretation": "邪惡解讀: 金錢可以買到任何東西",
            "pip_boy_voice": "經濟分析：檢測到投資機會",
            "vault_dweller_voice": "這些瓶蓋比戰前的錢還有用",
            "wasteland_trader_voice": "錢生錢，這是廢土的黃金法則",
            "super_mutant_voice": "SHINY CAPS MAKE TRADING EASY.",
            "codsworth_voice": "Sir，適度的儲蓄是明智的選擇",
            "brotherhood_significance": "資源是維持技術研究的基礎",
            "ncr_significance": "經濟穩定是共和國繁榮的保證",
            "legion_significance": "財富集中有助於軍團的擴張",
            "raiders_significance": "更多錢意味著更好的裝備"
        }
    ]


def populate_supabase():
    """填入 Supabase 資料庫"""
    try:
        print("🚀 開始填入 Supabase 廢土塔羅牌資料...")

        # 建立 Supabase 客戶端
        supabase = get_supabase_client()
        print("✅ Supabase 連接成功")

        # 清除現有資料 (可選)
        print("🗑️  清除現有卡牌資料...")
        try:
            supabase.table("wasteland_cards").delete().neq("id", "").execute()
            print("✅ 現有資料已清除")
        except Exception as e:
            print(f"⚠️  清除資料時發生錯誤: {e}")

        # 插入範例卡牌
        print("📚 插入廢土塔羅牌資料...")
        cards_data = create_sample_wasteland_cards()

        for card in cards_data:
            try:
                result = supabase.table("wasteland_cards").insert(card).execute()
                print(f"✅ 插入成功: {card['name']}")
            except Exception as e:
                print(f"❌ 插入失敗 {card['name']}: {e}")

        print(f"🎉 成功插入 {len(cards_data)} 張卡牌!")

        # 驗證資料
        print("\n🔍 驗證資料...")
        result = supabase.table("wasteland_cards").select("*").execute()
        print(f"📊 資料庫中共有 {len(result.data)} 張卡牌")

        # 顯示範例
        if result.data:
            print("\n🃏 範例卡牌:")
            for card in result.data[:3]:
                print(f"   • {card['name']} ({card['suit']})")

        return True

    except Exception as e:
        print(f"❌ 錯誤: {e}")
        return False


def main():
    """主函數"""
    print("🌟 Supabase 廢土塔羅牌資料庫初始化")
    print("=" * 50)

    # 檢查環境變數
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        print("❌ 缺少環境變數:")
        for var in missing_vars:
            print(f"   • {var}")
        return False

    # 執行資料填入
    success = populate_supabase()

    if success:
        print("\n🎉 資料庫初始化完成!")
        print("現在可以在 Supabase Dashboard 中查看資料")
    else:
        print("\n❌ 資料庫初始化失敗")

    return success


if __name__ == "__main__":
    main()