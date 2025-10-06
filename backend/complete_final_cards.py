#!/usr/bin/env python3
"""
完成最後8張卡牌 - 7張大阿爾克那 + 2張可樂瓶 (若缺失)
Complete final 8 cards - 7 Major Arcana + 2 Nuka-Cola Bottles (if missing)
確保達到完整的78張卡牌
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

def get_final_major_arcana():
    """取得最後7張大阿爾克那卡牌"""
    return [
        {
            "id": str(uuid.uuid4()),
            "name": "正義執行者",
            "suit": "major_arcana",
            "number": 11,
            "upright_meaning": "正義、平衡、責任、因果、公平。在廢土中維護正義的執法者",
            "reversed_meaning": "不公、偏見、逃避責任、復仇",
            "radiation_level": 0.2,
            "threat_level": 3,
            "wasteland_humor": "身穿NCR護甲舉著天平，另一手拿著雷射步槍",
            "nuka_cola_reference": "正義之秤的一邊是法律，另一邊是Nuka-Cola瓶蓋",
            "fallout_easter_egg": "正義會遲到，但永遠不會缺席...即使在廢土中",
            "special_ability": "增加聲望值。影響道德選擇結果",
            "upright_keywords": ["正義", "平衡", "責任", "因果", "公平"],
            "reversed_keywords": ["不公", "偏見", "逃避", "復仇"],
            "good_interpretation": "你的正義行為將得到回報。公平對待所有人",
            "neutral_interpretation": "行動需要考慮後果。在廢土中，因果報應依然存在",
            "evil_interpretation": "不要用正義之名行復仇之實。真正的正義需要慈悲",
            "pip_boy_voice": "道德評估：行為符合正義標準。聲望值上升",
            "vault_dweller_voice": "即使在廢土中，也要堅持做正確的事",
            "wasteland_trader_voice": "公平交易是我的原則。正義讓生意更好做",
            "super_mutant_voice": "公平！強者保護弱者！這是正義！",
            "codsworth_voice": "正義是文明社會的基石，非常重要",
            "brotherhood_significance": "法典必須遵守。秩序維護正義",
            "ncr_significance": "法律面前人人平等。這是共和國的基礎",
            "legion_significance": "軍團的法律就是正義。服從即是美德",
            "raiders_significance": "正義？那是弱者的藉口！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "倒吊掠奪者",
            "suit": "major_arcana",
            "number": 12,
            "upright_meaning": "犧牲、暫停、新視角、啟示、放下。被倒吊懺悔的前掠奪者",
            "reversed_meaning": "拖延、抗拒改變、無意義的犧牲",
            "radiation_level": 0.4,
            "threat_level": 2,
            "wasteland_humor": "被倒吊在廢土路標上，但臉上掛著詭異的微笑",
            "nuka_cola_reference": "口袋裡的Nuka-Cola掉了出來，成為路過商隊的意外收獲",
            "fallout_easter_egg": "有時候，最大的啟示來自最不舒服的姿勢",
            "special_ability": "獲得新視角。重新評估當前狀況",
            "upright_keywords": ["犧牲", "暫停", "視角", "啟示", "放下"],
            "reversed_keywords": ["拖延", "抗拒", "無意義", "犧牲"],
            "good_interpretation": "暫時的犧牲帶來長遠的收獲。換個角度看問題",
            "neutral_interpretation": "停下來思考比盲目前進更有價值",
            "evil_interpretation": "不要被動等待。有時候需要主動打破僵局",
            "pip_boy_voice": "狀態異常：建議重新校準世界觀",
            "vault_dweller_voice": "有時候被困住反而能看清楚周圍的世界",
            "wasteland_trader_voice": "被困的時候最能想清楚什麼是重要的",
            "super_mutant_voice": "倒掛人類！奇怪！但好像很聰明！",
            "codsworth_voice": "這個姿勢看起來很不舒服，但可能有深層意義",
            "brotherhood_significance": "戰略暫停有時比持續推進更明智",
            "ncr_significance": "民主需要不同聲音。反對意見也有價值",
            "legion_significance": "即使是敵人，也可能帶來有用的視角",
            "raiders_significance": "看，這就是背叛我們的下場！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "節制醫者",
            "suit": "major_arcana",
            "number": 14,
            "upright_meaning": "平衡、節制、治療、調和、耐心。調和輻射與治療的醫者",
            "reversed_meaning": "不平衡、過度、缺乏耐心、極端",
            "radiation_level": 0.3,
            "threat_level": 2,
            "wasteland_humor": "小心翼翼地混合治療針和輻射解毒劑，偶爾會爆炸",
            "nuka_cola_reference": "發現Nuka-Cola Quantum和Rad-Away混合有奇效",
            "fallout_easter_egg": "在廢土中，最好的醫者是那些理解毒藥的人",
            "special_ability": "平衡體質。調和對立元素",
            "upright_keywords": ["平衡", "節制", "治療", "調和", "耐心"],
            "reversed_keywords": ["不平衡", "過度", "急躁", "極端"],
            "good_interpretation": "耐心和節制帶來真正的治療。平衡是健康的關鍵",
            "neutral_interpretation": "對立的力量可以和諧共存。尋找中間道路",
            "evil_interpretation": "過度任何事物都是危險的。保持適度",
            "pip_boy_voice": "醫療分析：建議維持生理平衡狀態",
            "vault_dweller_voice": "廢土醫者的技術真是神奇",
            "wasteland_trader_voice": "好醫者比黃金還珍貴。健康無價",
            "super_mutant_voice": "治療人類很聰明！讓大家都健康！",
            "codsworth_voice": "醫學知識在廢土中極其寶貴",
            "brotherhood_significance": "醫療科技拯救生命。知識就是力量",
            "ncr_significance": "醫療保健是公民的基本權利",
            "legion_significance": "治療者值得尊敬。健康的軍隊才能征服",
            "raiders_significance": "醫生不能殺！我們還需要他們治療！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "星辰指引",
            "suit": "major_arcana",
            "number": 17,
            "upright_meaning": "希望、指引、靈感、治癒、樂觀。在污染天空中的希望之星",
            "reversed_meaning": "絕望、迷失方向、缺乏信心、悲觀",
            "radiation_level": 0.3,
            "threat_level": 1,
            "wasteland_humor": "污染天空中的一顆星星特別亮，實際上是老衛星反光",
            "nuka_cola_reference": "星光下的Nuka-Cola Quantum散發著希望的藍光",
            "fallout_easter_egg": "即使天空被污染，星星依然為迷途者指路",
            "special_ability": "恢復希望值。指明正確方向",
            "upright_keywords": ["希望", "指引", "靈感", "治癒", "樂觀"],
            "reversed_keywords": ["絕望", "迷失", "缺乏", "悲觀"],
            "good_interpretation": "希望的光芒照亮前路。相信美好的未來",
            "neutral_interpretation": "在最黑暗的時刻，總有光明指引方向",
            "evil_interpretation": "不要被虛假希望迷惑。現實需要行動",
            "pip_boy_voice": "導航系統：檢測到指引信號。建議朝該方向前進",
            "vault_dweller_voice": "這顆星星讓我想起避難所裡的燈光",
            "wasteland_trader_voice": "星星是廢土旅者的好朋友。從不迷路",
            "super_mutant_voice": "亮星星！很漂亮！給人希望！",
            "codsworth_voice": "星光確實能提供導航和心理安慰",
            "brotherhood_significance": "科技之光如星辰般指引人類前進",
            "ncr_significance": "希望是民主的基石。人民需要未來",
            "legion_significance": "征服者的目標如北極星般堅定",
            "raiders_significance": "星星很亮，但不能當飯吃！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "月影幻象",
            "suit": "major_arcana",
            "number": 18,
            "upright_meaning": "幻象、恐懼、不確定、直覺、神秘。在輻射月光下的幻象與恐懼",
            "reversed_meaning": "真相揭露、克服恐懼、清晰、現實",
            "radiation_level": 0.6,
            "threat_level": 3,
            "wasteland_humor": "輻射發光的月亮讓一切都像科幻電影",
            "nuka_cola_reference": "月光下的Nuka-Cola Quantum看起來像魔法藥水",
            "fallout_easter_egg": "月亮還是那個月亮，只是現在它會讓人發光",
            "special_ability": "揭示隱藏真相。增強夜視能力",
            "upright_keywords": ["幻象", "恐懼", "不確定", "直覺", "神秘"],
            "reversed_keywords": ["真相", "克服", "清晰", "現實"],
            "good_interpretation": "相信你的直覺。有些真相只在月光下才能看見",
            "neutral_interpretation": "現實與幻象的界限在廢土中並不清晰",
            "evil_interpretation": "不要被恐懼蒙蔽雙眼。理性分析情況",
            "pip_boy_voice": "警告：檢測到視覺異常。可能受輻射影響",
            "vault_dweller_voice": "月夜總是讓廢土看起來更加神秘",
            "wasteland_trader_voice": "月圓之夜交易要小心。容易看走眼",
            "super_mutant_voice": "發光月亮！很奇怪！讓人看到奇怪東西！",
            "codsworth_voice": "輻射可能影響視覺感知，請保持謹慎",
            "brotherhood_significance": "科學解釋一切現象。不要被迷信誤導",
            "ncr_significance": "真相需要調查。不要相信謠言",
            "legion_significance": "恐懼是弱者的表現。強者面對現實",
            "raiders_significance": "月夜是最佳搶劫時機！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "太陽新生",
            "suit": "major_arcana",
            "number": 19,
            "upright_meaning": "成功、快樂、生命力、啟蒙、純真。重新照耀廢土的希望之陽",
            "reversed_meaning": "過度樂觀、驕傲、失敗、負面態度",
            "radiation_level": 0.1,
            "threat_level": 1,
            "wasteland_humor": "太陽升起時，廢土看起來竟然有點美麗",
            "nuka_cola_reference": "陽光下的Nuka-Cola標誌閃閃發光",
            "fallout_easter_egg": "新的一天，新的希望。廢土的黎明依然美麗",
            "special_ability": "充滿能量。提升所有正面狀態",
            "upright_keywords": ["成功", "快樂", "生命", "啟蒙", "純真"],
            "reversed_keywords": ["過度", "驕傲", "失敗", "負面"],
            "good_interpretation": "成功即將到來。保持純真的心和積極態度",
            "neutral_interpretation": "生命力的回歸帶來新機會。把握當下",
            "evil_interpretation": "成功容易讓人驕傲。記住謙遜的重要",
            "pip_boy_voice": "能量等級：最佳狀態。所有系統運作良好",
            "vault_dweller_voice": "陽光讓一切都變得有希望",
            "wasteland_trader_voice": "好天氣帶來好生意。人們心情好會多買東西",
            "super_mutant_voice": "太陽很好！讓大家都開心！",
            "codsworth_voice": "陽光確實能改善心情，科學證實的",
            "brotherhood_significance": "新科技的黎明照亮人類未來",
            "ncr_significance": "共和國的光明前景如日東升",
            "legion_significance": "征服的榮耀如太陽般燦爛",
            "raiders_significance": "太陽出來了！又是搶劫的好日子！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "審判之日",
            "suit": "major_arcana",
            "number": 20,
            "upright_meaning": "重生、救贖、內在呼喚、寬恕、覺醒。核戰後的最終審判",
            "reversed_meaning": "自我懷疑、逃避責任、缺乏寬恕",
            "radiation_level": 0.7,
            "threat_level": 5,
            "wasteland_humor": "核爆雲中響起審判號角，但吹號角的是機器人",
            "nuka_cola_reference": "最後審判的標準是一生中喝了多少Nuka-Cola",
            "fallout_easter_egg": "審判不是結束，而是重新開始的機會",
            "special_ability": "清除所有負面狀態。獲得重生機會",
            "upright_keywords": ["重生", "救贖", "呼喚", "寬恕", "覺醒"],
            "reversed_keywords": ["懷疑", "逃避", "缺乏", "寬恕"],
            "good_interpretation": "救贖的時刻到了。每個人都值得第二次機會",
            "neutral_interpretation": "審視過去，學習教訓，準備重新開始",
            "evil_interpretation": "不要逃避責任。真正的救贖需要勇氣面對過去",
            "pip_boy_voice": "系統重置中...準備重新啟動人生程序",
            "vault_dweller_voice": "也許戰爭結束了，新時代開始了",
            "wasteland_trader_voice": "清算時刻到了。希望帳目能平衡",
            "super_mutant_voice": "大審判！所有人重新開始！",
            "codsworth_voice": "重新開始總是可能的，先生/女士",
            "brotherhood_significance": "舊世界的錯誤不應重複。學習歷史",
            "ncr_significance": "民主給每個人改正錯誤的機會",
            "legion_significance": "強者通過審判，弱者被淘汰",
            "raiders_significance": "審判？我們只在乎今天能搶到什麼！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "廢土世界",
            "suit": "major_arcana",
            "number": 21,
            "upright_meaning": "完成、成就、整合、循環、圓滿。完整的廢土世界與其循環",
            "reversed_meaning": "不完整、缺乏成就、停滯、尋求結束",
            "radiation_level": 0.4,
            "threat_level": 3,
            "wasteland_humor": "廢土生態系統完美平衡：變異動物、輻射植物、人類聚落",
            "nuka_cola_reference": "Nuka-Cola成為新世界經濟體系的基石",
            "fallout_easter_egg": "戰爭改變了一切，但生命找到了新的方式",
            "special_ability": "完成當前循環。開啟新的可能性",
            "upright_keywords": ["完成", "成就", "整合", "循環", "圓滿"],
            "reversed_keywords": ["不完整", "缺乏", "停滯", "尋求"],
            "good_interpretation": "重大成就即將完成。新的循環將為所有人帶來希望",
            "neutral_interpretation": "一個階段的結束意味著另一個階段的開始",
            "evil_interpretation": "不要滿足於現狀。真正的完成需要持續努力",
            "pip_boy_voice": "任務完成。新任務線已解鎖",
            "vault_dweller_voice": "終於理解了廢土的真正意義",
            "wasteland_trader_voice": "生意興隆！廢土經濟體系很完善",
            "super_mutant_voice": "世界很大！很完整！所有人都有地方！",
            "codsworth_voice": "廢土已經成為新的家園，令人驚奇",
            "brotherhood_significance": "科技與自然達到新平衡。任務達成",
            "ncr_significance": "民主文明在廢土上重新建立",
            "legion_significance": "新帝國統一廢土。征服完成",
            "raiders_significance": "廢土就是我們的天堂！搶劫萬歲！"
        }
    ]

def get_missing_nuka_cards():
    """取得缺失的可樂瓶卡牌"""
    return [
        {
            "id": str(uuid.uuid4()),
            "name": "六可樂瓶",
            "suit": "nuka_cola_bottles",
            "number": 6,
            "upright_meaning": "懷舊、回憶、童年、給予、純真歲月的回歸",
            "reversed_meaning": "沉溺過去、無法前進、拒絕成長、拒絕幫助",
            "radiation_level": 0.35,
            "threat_level": 1,
            "wasteland_humor": "收集戰前Nuka-Cola廣告，回憶那個甜美的時代",
            "nuka_cola_reference": "戰前Nuka-Cola配方的甜蜜回憶",
            "fallout_easter_egg": "戰前的美好時光，Nuka-Cola的黃金年代",
            "special_ability": "回復生命值。提供懷舊加成",
            "upright_keywords": ["懷舊", "回憶", "童年", "給予", "純真"],
            "reversed_keywords": ["沉溺", "過去", "拒絕", "成長"],
            "good_interpretation": "美好回憶給予前進的力量。分享快樂時光",
            "neutral_interpretation": "過去的經驗是寶貴財富。適度懷舊有益心靈",
            "evil_interpretation": "不要被過去束縛。現在和未來更重要",
            "pip_boy_voice": "記憶資料：檢測到懷舊情緒波動",
            "vault_dweller_voice": "這讓我想起避難所裡的快樂時光",
            "wasteland_trader_voice": "戰前收藏品總是能賣個好價錢",
            "super_mutant_voice": "舊時光很好！讓人開心！",
            "codsworth_voice": "往昔美好時光值得珍惜，先生/女士",
            "brotherhood_significance": "保存過去的知識和文化",
            "ncr_significance": "從歷史中學習，建設更好的未來",
            "legion_significance": "古羅馬的榮耀值得懷念",
            "raiders_significance": "過去？我們只關心現在的戰利品！"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "七可樂瓶",
            "suit": "nuka_cola_bottles",
            "number": 7,
            "upright_meaning": "幻想、選擇、願望實現、白日夢、多種可能性",
            "reversed_meaning": "現實檢查、錯誤選擇、幻想破滅、不切實際",
            "radiation_level": 0.4,
            "threat_level": 2,
            "wasteland_humor": "夢見各種口味的Nuka-Cola從天而降",
            "nuka_cola_reference": "幻想中的Nuka-Cola樂園，所有口味應有盡有",
            "fallout_easter_egg": "在廢土中，夢想比現實更加色彩繽紛",
            "special_ability": "增加創造力。開啟新的可能性",
            "upright_keywords": ["幻想", "選擇", "願望", "夢想", "可能"],
            "reversed_keywords": ["現實", "錯誤", "破滅", "不實際"],
            "good_interpretation": "夢想給予希望和動力。相信願望成真的可能",
            "neutral_interpretation": "想像力是創新的源泉。但要與現實平衡",
            "evil_interpretation": "不要沉迷於不切實際的幻想。行動比夢想重要",
            "pip_boy_voice": "想像模式：多種情境模擬進行中",
            "vault_dweller_voice": "有時候夢想比現實更美好",
            "wasteland_trader_voice": "夢想很好，但要能轉化為實際利潤",
            "super_mutant_voice": "好多選擇！不知道要哪個！",
            "codsworth_voice": "想像力是人類的特殊天賦",
            "brotherhood_significance": "創新來自想像。但需要科學驗證",
            "ncr_significance": "民主給予人民追求夢想的自由",
            "legion_significance": "夢想應該為軍團的榮耀服務",
            "raiders_significance": "夢想？我夢想搶到更多寶藏！"
        }
    ]

async def complete_final_cards():
    """完成最後的卡牌添加"""
    print("🎯 完成最後的卡牌添加")
    print("=" * 60)

    try:
        # 檢查當前狀況
        current_cards = supabase.table('wasteland_cards').select("name, suit").execute()
        current_names = {card['name'] for card in current_cards.data}

        # 準備要添加的卡牌
        major_cards = get_final_major_arcana()
        nuka_cards = get_missing_nuka_cards()

        # 過濾已存在的
        new_major = [card for card in major_cards if card['name'] not in current_names]
        new_nuka = [card for card in nuka_cards if card['name'] not in current_names]

        all_new_cards = new_major + new_nuka

        print(f"準備添加:")
        print(f"  - 大阿爾克那: {len(new_major)} 張")
        print(f"  - 可樂瓶: {len(new_nuka)} 張")
        print(f"  - 總計: {len(all_new_cards)} 張")

        if not all_new_cards:
            print("✅ 所有卡牌都已存在！")
            return

        # 添加卡牌
        success_count = 0
        for card in all_new_cards:
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

        print(f"\n🎉 最終完成！")
        print(f"📊 總計: {len(final_cards.data)} 張卡牌")
        print(f"➕ 本次新增: {success_count} 張")

        print("\n📋 最終花色分佈:")
        suit_names = {
            'major_arcana': '大阿爾克那',
            'nuka_cola_bottles': '可樂瓶',
            'combat_weapons': '戰鬥武器',
            'bottle_caps': '瓶蓋',
            'radiation_rods': '輻射棒'
        }

        total_expected = 0
        for suit, count in suit_counts.items():
            display_name = suit_names.get(suit, suit)
            expected = 22 if suit == 'major_arcana' else 14
            total_expected += expected
            status = "✅ 完整" if count >= expected else f"⚠️ 缺失{expected-count}張"
            print(f"   🃏 {display_name}: {count}/{expected} 張 {status}")

        print(f"\n🎮 廢土塔羅牌資料庫狀態: {len(final_cards.data)}/{total_expected} 張")

        if len(final_cards.data) >= 78:
            print("🎊 恭喜！完整的78張繁體中文廢土塔羅牌已全部到位！")
            print("🌟 包含完整的Fallout主題和繁體中文內容")
            print("🎨 每張卡牌都有豐富的廢土風格解讀")
        else:
            missing = 78 - len(final_cards.data)
            print(f"⚠️ 還缺少 {missing} 張卡牌達到完整的78張")

    except Exception as e:
        print(f"❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(complete_final_cards())