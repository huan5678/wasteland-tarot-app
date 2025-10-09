#!/usr/bin/env python3
"""
修正版完整廢土塔羅牌資料庫填充 - 繁體中文版
Corrected Complete Wasteland Tarot Database Seeding - Traditional Chinese Version
根據實際Supabase表格結構進行調整
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

def get_complete_cards_matching_schema():
    """取得符合實際表格結構的完整卡牌資料"""

    # Major Arcana (大阿爾克那) - 22張
    major_arcana = [
        {
            "id": str(uuid.uuid4()),
            "name": "新手避難所居民",
            "suit": "major_arcana",
            "number": 0,
            "upright_meaning": "新開始、天真、無知即福、適應能力、探索精神。代表剛走出避難所對廢土充滿好奇心的新手",
            "reversed_meaning": "魯莽、缺乏準備、忽視危險、過度樂觀。警告未做好準備就踏入危險廢土",
            "radiation_level": 0.1,
            "threat_level": 1,
            "wasteland_humor": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土，完全沒意識到危險",
            "nuka_cola_reference": "第一次喝到Nuka-Cola Quantum就興奮得手舞足蹈",
            "fallout_easter_egg": "戰爭...戰爭從不改變。但冒險？總是從踏出避難所的第一步開始",
            "special_ability": "增加運氣值1點直到下次占卜。提供新手運氣加成",
            "upright_keywords": ["新開始", "天真", "探索", "適應", "希望"],
            "reversed_keywords": ["魯莽", "幼稚", "缺乏準備", "危險冒險"],
            "good_interpretation": "你的善良意圖將引導你在廢土中展開新冒險。相信你的Pip-Boy，勇敢踏出通往命運的第一步",
            "neutral_interpretation": "是時候走出避難所了。地表世界的新機遇等待著願意擁抱未知危險的人",
            "evil_interpretation": "小心衝動決定可能在無情廢土中帶來意外後果。考慮你的行動對無辜倖存者的代價",
            "pip_boy_voice": "記錄顯示：新任務啟動。建議檢查裝備並為前方旅程做準備。輻射水平：微量",
            "vault_dweller_voice": "走出避難所的第一天總是充滿未知，但那正是真正冒險開始的地方",
            "wasteland_trader_voice": "年輕的旅行者，每個人都必須踏出第一步。我見過許多像你這樣開始旅程的人 - 有些回來時已成傳奇",
            "super_mutant_voice": "小人類開始大冒險！強者生存，弱者變屍鬼食物！",
            "codsworth_voice": "新冒險總是令人興奮，不是嗎先生/女士？不過請小心輻射",
            "brotherhood_significance": "每個騎士都曾是新兵。科技的力量始於學習和探索的勇氣",
            "ncr_significance": "民主需要公民參與。每個人都能為新加州共和國重建文明做出貢獻",
            "legion_significance": "即使在凱撒軍團，每個戰士都必須從頭開始證明自己的價值。在試煉中變強",
            "raiders_significance": "新肉？好，又多了一個炮灰！但也許這個有潛力..."
        },
        {
            "id": str(uuid.uuid4()),
            "name": "科技專家",
            "suit": "major_arcana",
            "number": 1,
            "upright_meaning": "技能、創新、廢料利用、科技掌控、解決問題。代表掌握先進科技的廢土科學家",
            "reversed_meaning": "技術依賴、過度複雜、理論脫離實際、科技成癮",
            "radiation_level": 0.3,
            "threat_level": 2,
            "wasteland_humor": "用膠帶和廢料修理高科技設備，效果出奇地好",
            "nuka_cola_reference": "發明了用Nuka-Cola瓶製作的小型核融合電池",
            "fallout_easter_egg": "科學！讓我們看看這個能量武器能產生多少傷害",
            "special_ability": "增加科學技能10點。允許修理損壞物品",
            "upright_keywords": ["技能", "創新", "修理", "科技", "解決"],
            "reversed_keywords": ["依賴", "複雜", "理論", "成癮"],
            "good_interpretation": "你的技能將幫助重建廢土。用知識為所有人創造更好的明天",
            "neutral_interpretation": "技術是工具，關鍵在於如何使用。在廢土中，實用勝過完美",
            "evil_interpretation": "強大的技術需要謹慎使用。不要讓權力腐蝕你的道德判斷",
            "pip_boy_voice": "技術分析：創新解決方案可用。建議資源回收和設備升級",
            "vault_dweller_voice": "在避難所學到的知識在外面的世界原來這麼有用",
            "wasteland_trader_voice": "技術熟練的人在廢土中總是受歡迎。你的技能就是你的財富",
            "super_mutant_voice": "聰明小人類會修東西！有用！",
            "codsworth_voice": "您的技術才能令人印象深刻。避難所科技確實先進",
            "brotherhood_significance": "知識保存者。科技是人類未來的關鍵",
            "ncr_significance": "技術創新推動社會進步。工程師是共和國的支柱",
            "legion_significance": "工藝技能值得尊重，即使軍團更重視戰鬥能力",
            "raiders_significance": "會修武器？你現在是我們的朋友了！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "神秘預言家",
            "suit": "major_arcana",
            "number": 2,
            "upright_meaning": "直覺、神秘知識、輻射感知、內在智慧、預見能力。擁有預知能力的神秘廢土居民",
            "reversed_meaning": "迷信、虛假預言、過度依賴直覺、神秘主義陷阱",
            "radiation_level": 0.7,
            "threat_level": 3,
            "wasteland_humor": "用破損的電視機占卜未來，卻意外準確",
            "nuka_cola_reference": "聲稱Nuka-Cola Quantum的藍光能增強預知能力",
            "fallout_easter_egg": "我能看到...一個異鄉人...從13號避難所來的...",
            "special_ability": "增加感知力5點。揭示隱藏資訊",
            "upright_keywords": ["直覺", "智慧", "預知", "神秘", "感知"],
            "reversed_keywords": ["迷信", "虛假", "依賴", "陷阱"],
            "good_interpretation": "你的直覺將引導你找到正確的道路。相信內心的聲音",
            "neutral_interpretation": "有些知識無法用科學解釋。保持開放的心態",
            "evil_interpretation": "不要被虛假的預言誤導。真正的智慧來自經驗",
            "pip_boy_voice": "偵測到異常讀數。建議相信直覺判斷",
            "vault_dweller_voice": "有時候心靈感應比Pip-Boy更準確",
            "wasteland_trader_voice": "聽說她能預測商隊路線上的危險。值得付錢諮詢",
            "super_mutant_voice": "奇怪人類看得見未來！不懂但很厲害！",
            "codsworth_voice": "我的感應器無法解釋這種現象，但結果確實準確",
            "brotherhood_significance": "無法科學證實，但戰略價值不可否認",
            "ncr_significance": "情報收集的非傳統方法。有時有效",
            "legion_significance": "預言者在軍團中有特殊地位。凱撒重視預兆",
            "raiders_significance": "只要能找到寶藏，我們不介意聽神秘廢話"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "農場主母",
            "suit": "major_arcana",
            "number": 3,
            "upright_meaning": "豐饒、養育、變異成長、社群建設、創造力。在廢土中建立繁榮農場的女性領袖",
            "reversed_meaning": "過度保護、控制慾、資源浪費、創造力枯竭",
            "radiation_level": 0.2,
            "threat_level": 1,
            "wasteland_humor": "種植變異巨大蔬菜，豐收到誇張程度，一顆番茄夠全家吃一週",
            "nuka_cola_reference": "用Nuka-Cola作為植物肥料，效果意外地好",
            "fallout_easter_egg": "這些變異水果看起來很奇怪，但吃起來比戰前的還甜",
            "special_ability": "增加生存技能15點。提供食物資源",
            "upright_keywords": ["豐收", "養育", "成長", "社群", "創造"],
            "reversed_keywords": ["保護過度", "控制", "浪費", "枯竭"],
            "good_interpretation": "你的關懷將滋養整個社群。像照顾植物一樣耐心培育關係",
            "neutral_interpretation": "創造需要時間和耐心。在廢土中培育新生命是珍貴的才能",
            "evil_interpretation": "不要讓保護慾變成控制慾。給他人成長的空間",
            "pip_boy_voice": "農業分析：土壤肥沃度良好。建議擴大種植規模",
            "vault_dweller_voice": "沒想到輻射土壤也能種出這麼美味的作物",
            "wasteland_trader_voice": "新鮮食物在廢土中比黃金還珍貴。農場主人總是富有",
            "super_mutant_voice": "大菜菜！好吃！農夫人類很聰明！",
            "codsworth_voice": "您的園藝技巧令人印象深刻。這些蔬菜品質極佳",
            "brotherhood_significance": "農業科技對重建至關重要。食物安全是優先考量",
            "ncr_significance": "農業是共和國經濟的基礎。農民是社會的支柱",
            "legion_significance": "豐收女神得到尊敬。軍團需要穩定的食物供應",
            "raiders_significance": "不要搶農民！他們活著比死了更有價值！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "避難所監督",
            "suit": "major_arcana",
            "number": 4,
            "upright_meaning": "權威、秩序、官僚制度、控制、穩定。掌控避難所秩序的威權領袖",
            "reversed_meaning": "專制、僵化、濫用權力、過度控制",
            "radiation_level": 0.0,
            "threat_level": 4,
            "wasteland_humor": "被一群反叛居民用廁紙卷襲擊，威嚴盡失",
            "nuka_cola_reference": "禁止在避難所內飲用Nuka-Cola，聲稱會影響紀律",
            "fallout_easter_egg": "實驗必須繼續...為了避難所科技的未來",
            "special_ability": "增加魅力5點。影響群眾決策",
            "upright_keywords": ["權威", "秩序", "控制", "穩定", "領導"],
            "reversed_keywords": ["專制", "僵化", "濫權", "壓迫"],
            "good_interpretation": "秩序是重建的基礎。用權威保護而非壓迫人民",
            "neutral_interpretation": "領導需要平衡自由與安全。在廢土中，組織是生存關鍵",
            "evil_interpretation": "絕對權力帶來絕對腐敗。記住你服務的是人民，不是相反",
            "pip_boy_voice": "管理系統運作正常。建議定期檢查居民滿意度",
            "vault_dweller_voice": "監督有時很嚴格，但他確實讓避難所運作順暢",
            "wasteland_trader_voice": "有組織的地方才有穩定的貿易。監督雖然嚴厲但公平",
            "super_mutant_voice": "大老闆人類！說什麼都聽！",
            "codsworth_voice": "良好的管理是社會運作的關鍵。您的領導風格很有效率",
            "brotherhood_significance": "等級制度和紀律是兄弟會力量的來源",
            "ncr_significance": "民主選舉的領導人比世襲統治者更值得尊敬",
            "legion_significance": "權威必須通過實力證明。弱勢領導者不配統治",
            "raiders_significance": "老大就是老大！誰不服就用拳頭說話！"
        }
    ]

    # 為了示範，我只先創建前5張大阿爾克那卡牌
    # 可以繼續添加其餘卡牌...

    return major_arcana

async def seed_corrected_cards():
    """使用正確格式填充卡牌"""
    print("🎲 開始修正版廢土塔羅牌填充 (繁體中文)")
    print("=" * 80)

    try:
        # 1. 清除測試卡牌
        print("\n[1/3] 清理測試資料...")
        try:
            supabase.table('wasteland_cards').delete().eq('id', 'test_card').execute()
            print("  測試卡牌已清除")
        except:
            print("  無測試卡牌需清除")

        # 2. 取得卡牌資料
        print("\n[2/3] 生成繁體中文卡牌資料...")
        cards_data = get_complete_cards_matching_schema()
        print(f"  生成了 {len(cards_data)} 張大阿爾克那卡牌")

        # 3. 插入卡牌
        print(f"\n[3/3] 填充卡牌到Supabase...")
        success_count = 0

        for i, card in enumerate(cards_data, 1):
            try:
                result = supabase.table('wasteland_cards').insert(card).execute()
                print(f"  [{i}/5] ✅ {card['name']} - 已新增")
                success_count += 1
            except Exception as e:
                print(f"  [{i}/5] ❌ {card['name']} - 失敗: {e}")

        # 4. 驗證結果
        print(f"\n✅ 填充完成!")
        final_cards = supabase.table('wasteland_cards').select("id, name, suit").execute()
        print(f"   總計: {len(final_cards.data)} 張卡牌")
        print(f"   新增: {success_count} 張")

        print("\n📋 現有卡牌清單:")
        for card in final_cards.data:
            print(f"   🃏 {card['name']} ({card['suit']})")

        print("\n🎮 繁體中文廢土塔羅牌前5張已準備就緒!")

    except Exception as e:
        print(f"❌ 填充過程發生錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed_corrected_cards())