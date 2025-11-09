#!/usr/bin/env python3
"""
修復剩餘卡牌 - 調整threat_level以符合資料庫約束
Fix remaining cards - adjust threat_level to match database constraints
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

def get_missing_major_arcana():
    """取得缺失的大阿爾克那卡牌（調整threat_level為1-5範圍）"""
    missing_cards = [
        {
            "id": str(uuid.uuid4()),
            "name": "兄弟會長老",
            "suit": "major_arcana",
            "number": 5,
            "upright_meaning": "傳統、知識保存、教條、指導、智慧傳承。鋼鐵兄弟會的知識守護者",
            "reversed_meaning": "固執、教條主義、知識壟斷、拒絕變化",
            "radiation_level": 0.1,
            "threat_level": 3,
            "wasteland_humor": "對著技術手冊虔誠祈禱，把說明書當成聖經",
            "nuka_cola_reference": "禁止在圖書館飲用Nuka-Cola，怕弄髒珍貴的技術資料",
            "fallout_easter_egg": "知識就是力量。保護過去，指引未來",
            "special_ability": "增加科學和修理技能各5點。提供技術知識",
            "upright_keywords": ["傳統", "知識", "指導", "智慧", "保存"],
            "reversed_keywords": ["固執", "教條", "壟斷", "拒絕"],
            "good_interpretation": "傳統智慧將指引你的道路。學習前人經驗，避免重蹈覆轍",
            "neutral_interpretation": "平衡創新與傳統。在廢土中，過去的知識是寶貴資源",
            "evil_interpretation": "不要讓教條束縛思維。真理需要質疑和驗證",
            "pip_boy_voice": "資料庫搜尋：找到相關技術文件。建議學習傳統方法",
            "vault_dweller_voice": "長老們的智慧在避難所裡一代代傳承下來",
            "wasteland_trader_voice": "兄弟會的知識值錢，但他們不輕易分享",
            "super_mutant_voice": "老人類很聰明！知道很多東西！",
            "codsworth_voice": "知識傳承是文明延續的基礎，非常重要",
            "brotherhood_significance": "我們是知識的守護者，文明的燈塔",
            "ncr_significance": "尊重傳統，但不能阻礙民主進步",
            "legion_significance": "古老智慧值得尊敬，但力量決定一切",
            "raiders_significance": "老頭們藏了不少好東西，值得一搶"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "廢土戀人",
            "suit": "major_arcana",
            "number": 6,
            "upright_meaning": "愛情、關係、選擇、和諧、結合。在末世中找到真愛的一對戀人",
            "reversed_meaning": "關係問題、錯誤選擇、不和諧、分離",
            "radiation_level": 0.3,
            "threat_level": 2,
            "wasteland_humor": "在輻射日落下相擁，背景是兩個人形變異怪",
            "nuka_cola_reference": "分享一瓶Nuka-Cola Quantum，浪漫到發光",
            "fallout_easter_egg": "愛情...愛情從不改變，即使在核冬天也是如此",
            "special_ability": "增加魅力3點。改善人際關係",
            "upright_keywords": ["愛情", "選擇", "和諧", "結合", "關係"],
            "reversed_keywords": ["問題", "錯誤", "不和", "分離"],
            "good_interpretation": "真愛能克服一切困難。在廢土中找到靈魂伴侶是最大的幸運",
            "neutral_interpretation": "重要的選擇即將到來。考慮你的心意和長遠計畫",
            "evil_interpretation": "不要讓感情蒙蔽理智。在危險的廢土中，生存比愛情更重要",
            "pip_boy_voice": "檢測到心率上升。建議評估人際關係狀況",
            "vault_dweller_voice": "即使在避難所外，愛情仍然是最強大的力量",
            "wasteland_trader_voice": "愛情不能當飯吃，但能讓人活下去的理由",
            "super_mutant_voice": "愛情？不懂！但看起來讓人類很開心！",
            "codsworth_voice": "愛情是人類最美好的情感，值得珍惜",
            "brotherhood_significance": "個人情感不應影響任務執行",
            "ncr_significance": "自由選擇伴侶是共和國公民的基本權利",
            "legion_significance": "婚姻應為軍團服務，個人喜好次之",
            "raiders_significance": "愛情？那東西能賣錢嗎？"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "裝甲戰車",
            "suit": "major_arcana",
            "number": 7,
            "upright_meaning": "勝利、決心、控制、進展、征服。驅駛戰車征戰廢土的勇士",
            "reversed_meaning": "失控、方向迷失、過度侵略、無法前進",
            "radiation_level": 0.4,
            "threat_level": 5,
            "wasteland_humor": "改裝的戰車用膠帶和鐵絲網拼湊，但照樣威風八面",
            "nuka_cola_reference": "戰車的油箱裡居然摻了Nuka-Cola Quantum提升性能",
            "fallout_easter_egg": "在廢土上疾馳，留下輻射塵埃和希望的軌跡",
            "special_ability": "增加駕駛技能10點。提供載具控制能力",
            "upright_keywords": ["勝利", "決心", "控制", "進展", "征服"],
            "reversed_keywords": ["失控", "迷失", "侵略", "停滯"],
            "good_interpretation": "你有力量克服一切障礙。保持方向，勇往直前",
            "neutral_interpretation": "控制是成功的關鍵。在廢土中，主動出擊比被動等待更好",
            "evil_interpretation": "小心權力讓你失去方向。征服者往往成為孤獨的統治者",
            "pip_boy_voice": "載具狀態良好。建議維持當前航向，準備戰鬥",
            "vault_dweller_voice": "這台戰車比避難所的模擬器真實多了",
            "wasteland_trader_voice": "好戰車！在廢土上這就是移動的堡壘",
            "super_mutant_voice": "大車車很強！碾壓敵人！",
            "codsworth_voice": "這載具的改裝相當有創意，雖然不太符合安全規範",
            "brotherhood_significance": "科技優勢確保勝利。裝甲就是力量",
            "ncr_significance": "軍事力量保護共和國的邊界和公民",
            "legion_significance": "戰車象徵征服者的榮耀和力量",
            "raiders_significance": "這車看起來很值錢！搶了它！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "命運輪盤",
            "suit": "major_arcana",
            "number": 10,
            "upright_meaning": "命運、機會、循環、變化、運氣。決定廢土命運的巨大輪盤",
            "reversed_meaning": "厄運、失控、惡性循環、運氣不佳",
            "radiation_level": 0.6,
            "threat_level": 4,
            "wasteland_humor": "新維加斯賭場風格的命運輪盤，指針永遠指向'好運'",
            "nuka_cola_reference": "輪盤上的獎品是一箱Nuka-Cola Quantum",
            "fallout_easter_egg": "賭場總是贏家...除非你有Lady Luck的眷顧",
            "special_ability": "增加運氣5點。影響隨機事件結果",
            "upright_keywords": ["命運", "機會", "循環", "變化", "運氣"],
            "reversed_keywords": ["厄運", "失控", "循環", "不佳"],
            "good_interpretation": "好運即將降臨。命運之輪轉向你有利的一面",
            "neutral_interpretation": "變化是唯一不變的真理。在廢土中學會適應",
            "evil_interpretation": "不要完全依賴運氣。真正的力量來自準備和行動",
            "pip_boy_voice": "機率分析：多種結果可能。建議做好應變準備",
            "vault_dweller_voice": "有時候運氣比技能更重要",
            "wasteland_trader_voice": "賭博有風險，但在廢土中，風險就是機會",
            "super_mutant_voice": "輪盤轉轉轉！不知道會怎樣！",
            "codsworth_voice": "機率論表明，運氣終會平均分配",
            "brotherhood_significance": "依靠科技，不是運氣。但機會要把握",
            "ncr_significance": "共和國的命運掌握在人民手中，不是賭桌上",
            "legion_significance": "命運眷顧勇者。強者創造自己的運氣",
            "raiders_significance": "賭博？我們更喜歡直接搶！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "輻射死神",
            "suit": "major_arcana",
            "number": 13,
            "upright_meaning": "轉變、結束、重生、變化、新開始。帶來終結與重生的輻射使者",
            "reversed_meaning": "抗拒改變、停滯、恐懼、腐朽",
            "radiation_level": 0.9,
            "threat_level": 5,  # 調整為最大值5
            "wasteland_humor": "身披輻射符號斗篷的神秘死神，手持蓋革計數器代替鐮刀",
            "nuka_cola_reference": "他的斗篷口袋裡藏著一瓶Rad-Away",
            "fallout_easter_egg": "死亡...死亡從不改變。但重生總是可能的",
            "special_ability": "清除負面狀態。啟動重生機制",
            "upright_keywords": ["轉變", "結束", "重生", "變化", "開始"],
            "reversed_keywords": ["抗拒", "停滯", "恐懼", "腐朽"],
            "good_interpretation": "舊的結束意味著新的開始。接受變化，迎接重生",
            "neutral_interpretation": "死亡是生命的一部分。在廢土中，結束往往是解脫",
            "evil_interpretation": "不要成為變化的受害者。主動選擇你的轉變",
            "pip_boy_voice": "檢測到高輻射讀數。建議準備輻射防護",
            "vault_dweller_voice": "死神看起來很可怕，但他帶來的是新希望",
            "wasteland_trader_voice": "死神總是準時。但聰明人會提前準備",
            "super_mutant_voice": "死神來了！不怕！變異讓我們更強！",
            "codsworth_voice": "死亡是自然循環的一部分，先生/女士",
            "brotherhood_significance": "舊科技淘汰，新科技誕生。進化不息",
            "ncr_significance": "舊制度的終結為民主讓路",
            "legion_significance": "弱者淘汰，強者重生。這是自然法則",
            "raiders_significance": "死神？只要不來找我們就好！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "死爪惡魔",
            "suit": "major_arcana",
            "number": 15,
            "upright_meaning": "誘惑、束縛、物質主義、恐懼、成癮。代表誘惑與恐懼的死爪怪物",
            "reversed_meaning": "解脫、覺醒、打破束縛、克服恐懼",
            "radiation_level": 0.8,
            "threat_level": 5,  # 調整為最大值5
            "wasteland_humor": "巨大的死爪坐在一堆瓶蓋上，像龍守護寶藏一樣",
            "nuka_cola_reference": "死爪對Nuka-Cola Quantum上癮，這是唯一能讓它安靜的東西",
            "fallout_easter_egg": "有些怪物是戰前實驗的產物...有些是內心恐懼的投射",
            "special_ability": "揭示隱藏的恐懼。增加對誘惑的抵抗力",
            "upright_keywords": ["誘惑", "束縛", "物質", "恐懼", "成癮"],
            "reversed_keywords": ["解脫", "覺醒", "打破", "克服"],
            "good_interpretation": "認識到束縛你的是什麼。真正的自由來自克服恐懼",
            "neutral_interpretation": "物質慾望和精神需求需要平衡。不要被任何一方綁架",
            "evil_interpretation": "利用他人的弱點很容易，但最終會反噬自己",
            "pip_boy_voice": "警告：檢測到高威脅生物。建議保持距離",
            "vault_dweller_voice": "死爪很可怕，但真正的怪物可能在我們心中",
            "wasteland_trader_voice": "貪婪是商人的職業病，但要知道適可而止",
            "super_mutant_voice": "大怪物很強！但我們不怕！",
            "codsworth_voice": "這生物確實令人畏懼，但恐懼可以克服",
            "brotherhood_significance": "戰前實驗的後果。科技需要謹慎使用",
            "ncr_significance": "自由意味著有選擇的權利，包括拒絕誘惑",
            "legion_significance": "強者不會被恐懼束縛。戰勝內心的惡魔",
            "raiders_significance": "死爪？那是我們的寵物！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "摧毀之塔",
            "suit": "major_arcana",
            "number": 16,
            "upright_meaning": "災難、啟示、突然變化、毀滅、解放。被核彈摧毀的高塔",
            "reversed_meaning": "逃避災難、抗拒變化、延遲的破壞",
            "radiation_level": 0.9,
            "threat_level": 5,  # 調整為最大值5
            "wasteland_humor": "摩天大樓被核彈直擊，但招牌還掛著'歡迎光臨'",
            "nuka_cola_reference": "塔頂的Nuka-Cola廣告在爆炸中奇蹟般保存",
            "fallout_easter_egg": "原子之火照亮了新世界的黎明",
            "special_ability": "清除舊有結構。為重建做準備",
            "upright_keywords": ["災難", "啟示", "變化", "毀滅", "解放"],
            "reversed_keywords": ["逃避", "抗拒", "延遲", "破壞"],
            "good_interpretation": "毀滅是重建的前提。從廢墟中誕生新希望",
            "neutral_interpretation": "突然的變化雖然痛苦，但往往帶來必要的清理",
            "evil_interpretation": "不要成為破壞的推手。建設比毀滅更需要勇氣",
            "pip_boy_voice": "檢測到結構性破壞。建議重新評估安全路線",
            "vault_dweller_voice": "戰爭的破壞力讓人震驚，但生命總會找到出路",
            "wasteland_trader_voice": "災難也是商機。有人需要重建，就有人賺錢",
            "super_mutant_voice": "大爆炸！很壯觀！但我們還活著！",
            "codsworth_voice": "毀滅雖然可怕，但重建的可能性仍然存在",
            "brotherhood_significance": "核武器的可怕力量。科技必須受到控制",
            "ncr_significance": "從戰爭廢墟中重建民主文明",
            "legion_significance": "舊世界的毀滅為新帝國讓路",
            "raiders_significance": "廢墟裡有很多好東西等著我們！"
        }
    ]
    return missing_cards

async def add_missing_cards():
    """添加剩餘的大阿爾克那卡牌"""
    print("🔧 修復剩餘的大阿爾克那卡牌")
    print("=" * 60)

    try:
        missing_cards = get_missing_major_arcana()
        print(f"準備添加 {len(missing_cards)} 張卡牌...")

        success_count = 0
        for card in missing_cards:
            try:
                result = supabase.table('wasteland_cards').insert(card).execute()
                print(f"✅ {card['name']} - 成功添加")
                success_count += 1
            except Exception as e:
                print(f"❌ {card['name']} - 失敗: {e}")

        # 最終統計
        final_cards = supabase.table('wasteland_cards').select("id, name, suit").execute()
        suit_counts = {}
        for card in final_cards.data:
            suit = card['suit']
            suit_counts[suit] = suit_counts.get(suit, 0) + 1

        print(f"\n✅ 添加完成！成功: {success_count}/{len(missing_cards)}")
        print(f"📊 目前總計: {len(final_cards.data)} 張卡牌")

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
            expected = 22 if suit == 'major_arcana' else 14
            status = "✅" if count >= expected else f"⚠️ ({expected-count}張缺失)"
            print(f"   🃏 {display_name}: {count} 張 {status}")

    except Exception as e:
        print(f"❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(add_missing_cards())