#!/usr/bin/env python3
"""
完整 78 張廢土塔羅牌資料庫填充腳本（繁體中文）
Complete 78 Wasteland Tarot Cards Database Seeding Script (Traditional Chinese)

根據 fallout_tarot_system.json 和現有 seed 資料，建立完整的 78 張卡牌
包含：
- 22 張大阿卡納 (Major Arcana)
- 56 張小阿卡納 (Minor Arcana)
  - 14 張可樂瓶 (Nuka-Cola Bottles) - 對應聖杯
  - 14 張戰鬥武器 (Combat Weapons) - 對應寶劍
  - 14 張瓶蓋 (Bottle Caps) - 對應錢幣
  - 14 張輻射棒 (Radiation Rods) - 對應權杖
"""

import asyncio
import os
import sys
import uuid
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

# 載入環境變數
load_dotenv()

# Supabase 連線
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ 錯誤：未設定 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數")
    print("請確認 .env 檔案包含正確的 Supabase 憑證")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)


def generate_major_arcana() -> List[Dict[str, Any]]:
    """生成 22 張大阿卡納（根據 fallout_tarot_system.json）"""

    major_arcana_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "新手避難所居民 (The Vault Newbie)",
            "suit": "major_arcana",
            "number": 0,
            "upright_meaning": "天真、新開始、無知即福、適應能力、探索精神、踏出舒適圈的勇氣",
            "reversed_meaning": "魯莽、缺乏準備、忽視危險、過度樂觀、拒絕現實、不願適應變化",
            "radiation_level": 0.10,
            "threat_level": 1,
            "wasteland_humor": "戴著派對帽用Pip-Boy自拍，背景是輻射廢土，完全不知道危險",
            "nuka_cola_reference": "像第一次嘗試Nuka-Cola一樣，充滿驚喜和天真的期待",
            "fallout_easter_egg": "Vault-Tec: 為更美好的明天做準備！但今天還是很可怕",
            "special_ability": "新手運氣：有時無知真的是福，意外避開危險",
            "upright_keywords": ["天真", "新開始", "無知即福", "適應能力", "探索精神"],
            "reversed_keywords": ["魯莽", "缺乏準備", "忽視危險", "過度樂觀", "拒絕現實"],
            "good_interpretation": "勇敢踏出避難所的第一步，帶著希望探索新世界",
            "neutral_interpretation": "新的開始需要準備，但也不要過度恐懼未知",
            "evil_interpretation": "天真會害死你，廢土不會對無知者仁慈",
            "pip_boy_analysis": "初始化完成。警告：輻射偵測異常。建議：保持樂觀態度，學習基本生存技能。",
            "vault_dweller_voice": "第一次離開避難所總是令人興奮又恐懼。記住監督的話：保持希望。",
            "wasteland_trader_voice": "新來的？我見過很多像你這樣的。有些成功了，有些...沒有。",
            "super_mutant_voice": "小人類剛開始大冒險！超級變種人記得自己第一次！",
            "codsworth_voice": "先生/女士，外面的世界與您想像的截然不同。建議攜帶足夠的 Rad-Away。",
            "brotherhood_significance": "每個騎士都曾是初學者。技術知識始於學習的謙卑。",
            "ncr_significance": "民主需要新血。每個公民都有機會為共和國做出貢獻。",
            "legion_significance": "即使最偉大的軍團成員也需要從新兵開始證明自己。",
            "raiders_significance": "哈！新鮮肉！要麼快速學會，要麼成為廢土的一部分。"
        },
        {
            "id": "major_01_tech_specialist",
            "name": "科技專家 (The Tech Specialist)",
            "suit": "major_arcana",
            "number": 1,
            "upright_meaning": "技能、創新、廢料利用、科技掌控、解決問題、實用主義",
            "reversed_meaning": "技術依賴、過度複雜、理論脫離實際、創新停滯、工具失效",
            "radiation_level": 0.30,
            "threat_level": 2,
            "wasteland_humor": "用膠帶和廢料修理高科技設備，居然真的能用",
            "nuka_cola_reference": "用Nuka-Cola瓶蓋改裝成精密電路零件",
            "fallout_easter_egg": "戰爭從不改變，但科技可以修理任何東西",
            "special_ability": "萬能修理：用最簡陋的材料修復高科技設備",
            "upright_keywords": ["技能", "創新", "廢料利用", "科技掌控", "解決問題"],
            "reversed_keywords": ["技術依賴", "過度複雜", "理論脫離", "創新停滯", "工具失效"],
            "good_interpretation": "用技能幫助他人，科技應該讓生活更美好",
            "neutral_interpretation": "掌握技術是生存的關鍵，但不要過度依賴",
            "evil_interpretation": "壟斷技術知識，讓他人依賴你的服務",
            "pip_boy_analysis": "技能檢測：修理 100/100。能量武器 85/100。科學 95/100。建議：繼續升級。",
            "vault_dweller_voice": "Vault-Tec 的訓練程序真的很有用。這些技能在廢土上價值連城。",
            "wasteland_trader_voice": "會修東西的人在這裡就是國王。你的技能比瓶蓋更有價值。",
            "super_mutant_voice": "聰明人類修理東西！超級變種人需要修理的槍很多！",
            "codsworth_voice": "先生/女士的工程技能令人欽佩。Pre-War 科技在您手中重獲新生。",
            "brotherhood_significance": "知識就是力量。科技掌握是兄弟會存在的核心意義。",
            "ncr_significance": "技術專家是重建文明的基石。工程師比士兵更重要。",
            "legion_significance": "即使軍團也需要能修理武器的人。技能超越意識形態。",
            "raiders_significance": "會修槍的人是團隊的寶貝。別讓他跑了！"
        },
        {
            "id": "major_02_wasteland_oracle",
            "name": "神秘預言家 (The Wasteland Oracle)",
            "suit": "major_arcana",
            "number": 2,
            "upright_meaning": "直覺、神秘知識、輻射感知、內在智慧、預見能力",
            "reversed_meaning": "迷信、虛假預言、過度依賴直覺、被幻象迷惑",
            "radiation_level": 0.70,
            "threat_level": 3,
            "wasteland_humor": "用破損的電視機占卜未來，居然還挺準",
            "nuka_cola_reference": "Nuka-Cola Quantum 的藍光幫助她看見未來的景象",
            "fallout_easter_egg": "有些事情Pip-Boy偵測不到，但心靈可以",
            "special_ability": "輻射預知：感知即將發生的危險",
            "upright_keywords": ["直覺", "神秘知識", "輻射感知", "內在智慧", "預見能力"],
            "reversed_keywords": ["迷信", "虛假預言", "過度依賴直覺", "幻象迷惑", "錯誤預測"],
            "good_interpretation": "用預知能力幫助他人避開危險，指引正確道路",
            "neutral_interpretation": "直覺是有用的工具，但也要結合理性判斷",
            "evil_interpretation": "用虛假預言操控他人，從恐懼中獲利",
            "pip_boy_analysis": "感知檢測：異常高。精神狀態：不穩定但功能正常。建議：信任第六感。",
            "vault_dweller_voice": "有些事情Pip-Boy偵測不到，但心靈可以。學會傾聽內心聲音。",
            "wasteland_trader_voice": "她看到的東西別人看不到。我從不質疑她的預言，太準了。",
            "super_mutant_voice": "智慧女人知道未來！超級變種人聽智慧女人的話！",
            "codsworth_voice": "雖然科學無法解釋，但先生/女士的直覺準確率令人印象深刻。",
            "brotherhood_significance": "古老的智慧有時比現代科技更可靠。保持開放心態。",
            "ncr_significance": "情報收集的重要性。有時直覺比報告更準確。",
            "legion_significance": "占卜師在戰前羅馬也很重要。智慧超越時代。",
            "raiders_significance": "老太婆的預言救過我們很多次。最好聽她的。"
        },
        {
            "id": "major_03_farm_matriarch",
            "name": "農場主母 (The Farm Matriarch)",
            "suit": "major_arcana",
            "number": 3,
            "upright_meaning": "豐饒、養育、變異成長、社群建設、創造力",
            "reversed_meaning": "過度保護、控制慾、資源浪費、成長停滯",
            "radiation_level": 0.20,
            "threat_level": 1,
            "wasteland_humor": "種植變異巨大蔬菜，豐收到誇張程度",
            "nuka_cola_reference": "用稀釋的Nuka-Cola當作肥料，植物長得特別快",
            "fallout_easter_egg": "G.E.C.K. 的真正力量：讓廢土重新綻放生機",
            "special_ability": "變異成長：讓植物在輻射環境中繁榮生長",
            "upright_keywords": ["豐饒", "養育", "變異成長", "社群建設", "創造力"],
            "reversed_keywords": ["過度保護", "控制慾", "資源浪費", "成長停滯", "資源枯竭"],
            "good_interpretation": "用豐饒餵養社群，創造生命和希望",
            "neutral_interpretation": "養育需要平衡，不要過度保護或控制",
            "evil_interpretation": "用食物控制他人，壟斷生存資源",
            "pip_boy_analysis": "農業技能：最大值。變異植物知識：專家級。建議：學習種植技巧。",
            "vault_dweller_voice": "她教會我們即使在廢土也能創造生命。希望還是存在的。",
            "wasteland_trader_voice": "新鮮食物在這個世界是奢侈品。她讓奇蹟發生。",
            "super_mutant_voice": "媽媽人類種很多食物！好媽媽餵飽大家！",
            "codsworth_voice": "先生/女士的園藝技術堪比 Pre-War 的專業農夫。令人欽佩。",
            "brotherhood_significance": "農業技術對重建至關重要。生命比武器更珍貴。",
            "ncr_significance": "農業復興是共和國繁榮的基礎。她們是真正的英雄。",
            "legion_significance": "羅馬的力量建立在豐饒的土地上。農業是帝國基礎。",
            "raiders_significance": "不要搶農場！我們需要她們活著為我們種食物。"
        },
        {
            "id": "major_04_overseer",
            "name": "避難所監督 (The Overseer)",
            "suit": "major_arcana",
            "number": 4,
            "upright_meaning": "權威、秩序、官僚制度、控制、穩定",
            "reversed_meaning": "專制、僵化、濫用權力、過度控制、秩序崩壞",
            "radiation_level": 0.00,
            "threat_level": 4,
            "wasteland_humor": "被一群反叛居民用廁紙卷襲擊",
            "nuka_cola_reference": "控制Nuka-Cola配給以維持秩序",
            "fallout_easter_egg": "Vault-Tec 實驗：權力如何影響人類行為",
            "special_ability": "鐵腕統治：建立秩序，但可能失去民心",
            "upright_keywords": ["權威", "秩序", "官僚制度", "控制", "穩定"],
            "reversed_keywords": ["專制", "僵化", "濫用權力", "過度控制", "秩序崩壞"],
            "good_interpretation": "用權威保護社群，建立公平的秩序",
            "neutral_interpretation": "權力是工具，關鍵在於如何使用",
            "evil_interpretation": "用獨裁統治壓迫人民，維持自己的特權",
            "pip_boy_analysis": "領導能力：優秀。受歡迎度：下降中。建議：重新評估管理方式。",
            "vault_dweller_voice": "有些監督是好的，有些...不是。權力容易腐蝕人心。",
            "wasteland_trader_voice": "權力結構在廢土很重要。但要確保是為了人民，不是為了自己。",
            "super_mutant_voice": "大頭目指揮小人類！有時好，有時壞！",
            "codsworth_voice": "領導能力需要責任感。先生/女士，權力伴隨著義務。",
            "brotherhood_significance": "軍階制度的重要性。但權力必須服務於更高目標。",
            "ncr_significance": "民主監督防止獨裁。人民有權選擇領導者。",
            "legion_significance": "強有力的領導是軍團核心。但力量必須有智慧。",
            "raiders_significance": "老大就是老大！不聽話就死定了！"
        },
        {
            "id": "major_05_brotherhood_elder",
            "name": "兄弟會長老 (The Brotherhood Elder)",
            "suit": "major_arcana",
            "number": 5,
            "upright_meaning": "傳統、知識保存、教條、指導、智慧傳承",
            "reversed_meaning": "固執、教條主義、知識壟斷、與時代脫節",
            "radiation_level": 0.10,
            "threat_level": 3,
            "wasteland_humor": "對著一本說明書虔誠祈禱",
            "nuka_cola_reference": "將Nuka-Cola配方視為神聖知識保存",
            "fallout_easter_egg": "Ad Victoriam！知識就是力量",
            "special_ability": "知識守護：保存Pre-War科技知識",
            "upright_keywords": ["傳統", "知識保存", "教條", "指導", "智慧傳承"],
            "reversed_keywords": ["固執", "教條主義", "知識壟斷", "與時代脫節", "頑固守舊"],
            "good_interpretation": "保存知識供後代使用，傳承智慧",
            "neutral_interpretation": "傳統有其價值，但也要適應變化",
            "evil_interpretation": "壟斷知識，用教條控制他人思想",
            "pip_boy_analysis": "知識數據庫：豐富。適應性：有限。建議：平衡傳統與創新。",
            "vault_dweller_voice": "他們保護的知識很重要，但有時候方法太...極端了。",
            "wasteland_trader_voice": "兄弟會有很多寶貝，但他們不喜歡分享。小心交易。",
            "super_mutant_voice": "鐵甲人類保護舊書！書很重要，但人類更重要！",
            "codsworth_voice": "保存 Pre-War 知識是崇高的使命。但知識應該服務於人類。",
            "brotherhood_significance": "Ad Victoriam！我們是文明火種的守護者。",
            "ncr_significance": "技術應該為所有人服務，不只是少數人。",
            "legion_significance": "古羅馬也有其傳統。但傳統必須適應現實。",
            "raiders_significance": "這些科技狂有好東西，但太難搶了。"
        },
        {
            "id": "major_06_wasteland_lovers",
            "name": "廢土戀人 (The Wasteland Lovers)",
            "suit": "major_arcana",
            "number": 6,
            "upright_meaning": "愛情、關係、選擇、和諧、結合",
            "reversed_meaning": "關係問題、錯誤選擇、不和諧、分離",
            "radiation_level": 0.30,
            "threat_level": 2,
            "wasteland_humor": "在輻射日落下相擁的浪漫場景",
            "nuka_cola_reference": "分享最後一瓶Nuka-Cola的親密時刻",
            "fallout_easter_egg": "即使在廢土，愛情依然存在",
            "special_ability": "心靈連結：在最黑暗的時刻互相支持",
            "upright_keywords": ["愛情", "關係", "選擇", "和諧", "結合"],
            "reversed_keywords": ["關係問題", "錯誤選擇", "不和諧", "分離", "背叛"],
            "good_interpretation": "真愛能克服一切困難，即使在廢土",
            "neutral_interpretation": "關係需要雙方努力維護",
            "evil_interpretation": "用情感操控他人，為己謀利",
            "pip_boy_analysis": "關係狀態：穩定。信任度：高。建議：珍惜彼此。",
            "vault_dweller_voice": "Vault 裡的愛情故事總是最美的。希望在廢土也能延續。",
            "wasteland_trader_voice": "兩個人一起生存比一個人容易。找到對的人很重要。",
            "super_mutant_voice": "愛情讓小人類強大！超級變種人理解愛！",
            "codsworth_voice": "真愛是 Pre-War 時代最美好的傳承。",
            "brotherhood_significance": "兄弟會的兄弟姊妹情誼建立在信任之上。",
            "ncr_significance": "民主社會需要團結和愛。",
            "legion_significance": "軍團的榮譽建立在忠誠之上。",
            "raiders_significance": "即使掠奪者也需要夥伴。"
        },
        {
            "id": "major_07_armored_chariot",
            "name": "裝甲戰車 (The Armored Chariot)",
            "suit": "major_arcana",
            "number": 7,
            "upright_meaning": "勝利、決心、控制、進展、征服",
            "reversed_meaning": "失控、方向迷失、過度侵略、能量耗盡",
            "radiation_level": 0.40,
            "threat_level": 5,
            "wasteland_humor": "改裝戰車在廢土上疾馳",
            "nuka_cola_reference": "用Nuka-Cola Quantum當作高效燃料",
            "fallout_easter_egg": "戰爭，戰爭從不改變，但戰車一直在進步",
            "special_ability": "鋼鐵意志：突破一切障礙前進",
            "upright_keywords": ["勝利", "決心", "控制", "進展", "征服"],
            "reversed_keywords": ["失控", "方向迷失", "過度侵略", "能量耗盡", "失敗"],
            "good_interpretation": "堅定意志達成正義目標",
            "neutral_interpretation": "前進需要方向，不要盲目衝刺",
            "evil_interpretation": "用暴力征服一切，不擇手段",
            "pip_boy_analysis": "動力系統：最佳。方向：正確。建議：保持動力。",
            "vault_dweller_voice": "有時候我們需要勇往直前的勇氣。",
            "wasteland_trader_voice": "好的戰車價值千金。控制它就控制了未來。",
            "super_mutant_voice": "大車車跑很快！超級變種人喜歡快！",
            "codsworth_voice": "先生/女士，請小心駕駛。安全第一。",
            "brotherhood_significance": "動力裝甲是兄弟會的象徵。力量與技術的結合。",
            "ncr_significance": "軍事力量保衛民主。",
            "legion_significance": "征服是軍團的本質。",
            "raiders_significance": "搶好車！跑得快搶得多！"
        },
        {
            "id": "major_08_inner_strength",
            "name": "內在力量 (Inner Strength)",
            "suit": "major_arcana",
            "number": 8,
            "upright_meaning": "力量、勇氣、耐心、自制、內在美德",
            "reversed_meaning": "軟弱、缺乏信心、失控、恐懼",
            "radiation_level": 0.20,
            "threat_level": 2,
            "wasteland_humor": "溫柔撫摸變異熊的廢土居民",
            "nuka_cola_reference": "用溫和的方式馴服狂暴的動物",
            "fallout_easter_egg": "真正的力量來自內心，不是肌肉",
            "special_ability": "心靈平靜：在混亂中保持冷靜",
            "upright_keywords": ["力量", "勇氣", "耐心", "自制", "內在美德"],
            "reversed_keywords": ["軟弱", "缺乏信心", "失控", "恐懼", "崩潰"],
            "good_interpretation": "用溫和的力量化解衝突",
            "neutral_interpretation": "真正的力量是自我掌控",
            "evil_interpretation": "用心理操控支配弱者",
            "pip_boy_analysis": "精神狀態：穩定。壓力抵抗：高。建議：保持平靜。",
            "vault_dweller_voice": "Vault-Tec心理訓練真的有用。內心強大比身體強壯更重要。",
            "wasteland_trader_voice": "能控制自己的人才能控制交易。",
            "super_mutant_voice": "小人類內心很強！超級變種人尊敬！",
            "codsworth_voice": "先生/女士的自制力令人敬佩。",
            "brotherhood_significance": "紀律是力量的基礎。",
            "ncr_significance": "民主需要每個公民的自我約束。",
            "legion_significance": "自律是軍團戰士的核心。",
            "raiders_significance": "控制不住自己的人會被淘汰。"
        },
        {
            "id": "major_09_wasteland_hermit",
            "name": "廢土隱者 (The Wasteland Hermit)",
            "suit": "major_arcana",
            "number": 9,
            "upright_meaning": "內省、尋求、智慧、指導、獨立",
            "reversed_meaning": "孤立、逃避、頑固、拒絕幫助",
            "radiation_level": 0.50,
            "threat_level": 2,
            "wasteland_humor": "舉著輻射燈籠照亮黑暗",
            "nuka_cola_reference": "獨自收集稀有的Nuka-Cola品種",
            "fallout_easter_egg": "孤獨讓人看清真相",
            "special_ability": "獨行智慧：從孤獨中獲得啟發",
            "upright_keywords": ["內省", "尋求", "智慧", "指導", "獨立"],
            "reversed_keywords": ["孤立", "逃避", "頑固", "拒絕幫助", "封閉"],
            "good_interpretation": "用獨處時間尋找真理，然後分享智慧",
            "neutral_interpretation": "獨處有其價值，但不要完全孤立",
            "evil_interpretation": "用孤僻逃避責任，拒絕貢獻社會",
            "pip_boy_analysis": "社交值：低。智慧值：高。建議：平衡獨處與交流。",
            "vault_dweller_voice": "有時候我們需要遠離人群思考。",
            "wasteland_trader_voice": "老隱士總是知道別人不知道的事。",
            "super_mutant_voice": "孤獨人類很聰明！但也很孤單。",
            "codsworth_voice": "先生/女士，適度的獨處有益身心。",
            "brotherhood_significance": "書記員需要安靜研究知識。",
            "ncr_significance": "個人自由是民主的一部分。",
            "legion_significance": "即使在軍團，智者也需要獨處思考。",
            "raiders_significance": "孤獨的人容易下手...但要小心陷阱。"
        },
        {
            "id": "major_10_wheel_of_fortune",
            "name": "命運輪盤 (The Wheel of Fortune)",
            "suit": "major_arcana",
            "number": 10,
            "upright_meaning": "命運、機會、循環、變化、運氣",
            "reversed_meaning": "厄運、失控、惡性循環、壞運氣",
            "radiation_level": 0.60,
            "threat_level": 4,
            "wasteland_humor": "新維加斯賭場風格的命運輪盤",
            "nuka_cola_reference": "用Nuka-Cola瓶蓋賭博改變命運",
            "fallout_easter_egg": "The house always wins... or does it?",
            "special_ability": "運氣波動：結果無法預測",
            "upright_keywords": ["命運", "機會", "循環", "變化", "運氣"],
            "reversed_keywords": ["厄運", "失控", "惡性循環", "壞運氣", "困境"],
            "good_interpretation": "把握機會，幸運會眷顧準備好的人",
            "neutral_interpretation": "命運有其規律，但也能被影響",
            "evil_interpretation": "操控機會，欺騙他人改變結果",
            "pip_boy_analysis": "運氣檢測：波動中。建議：做好準備迎接變化。",
            "vault_dweller_voice": "Vault-Tec教我們：運氣只是準備遇見機會。",
            "wasteland_trader_voice": "賭博有風險，但有時候值得一試。",
            "super_mutant_voice": "輪盤轉！有時贏，有時輸！",
            "codsworth_voice": "先生/女士，請謹慎對待賭博。",
            "brotherhood_significance": "即使有最好的技術，運氣仍然重要。",
            "ncr_significance": "民主就是給每個人平等的機會。",
            "legion_significance": "命運眷顧強者。",
            "raiders_significance": "賭贏了大肆慶祝！賭輸了搶回來！"
        },
        {
            "id": "major_11_justice_enforcer",
            "name": "正義執行者 (The Justice Enforcer)",
            "suit": "major_arcana",
            "number": 11,
            "upright_meaning": "正義、平衡、責任、因果、公平",
            "reversed_meaning": "不公、偏見、逃避責任、失衡",
            "radiation_level": 0.20,
            "threat_level": 3,
            "wasteland_humor": "身穿NCR護甲的正義使者",
            "nuka_cola_reference": "公平分配Nuka-Cola給所有人",
            "fallout_easter_egg": "廢土法律：一命抵一命",
            "special_ability": "公正裁決：按照法律行事",
            "upright_keywords": ["正義", "平衡", "責任", "因果", "公平"],
            "reversed_keywords": ["不公", "偏見", "逃避責任", "失衡", "腐敗"],
            "good_interpretation": "維護公平正義，讓所有人得到應得的",
            "neutral_interpretation": "正義需要平衡，不是復仇",
            "evil_interpretation": "扭曲法律為己謀利",
            "pip_boy_analysis": "道德指標：高。公正度：優秀。建議：保持客觀。",
            "vault_dweller_voice": "Vault-Tec規則：公平對待所有居民。",
            "wasteland_trader_voice": "公平交易建立長期關係。",
            "super_mutant_voice": "公平對待所有人！好規則！",
            "codsworth_voice": "先生/女士，法律是文明的基礎。",
            "brotherhood_significance": "法典保護知識和秩序。",
            "ncr_significance": "民主法治是共和國的核心。",
            "legion_significance": "軍團法律嚴格但公正。",
            "raiders_significance": "什麼法律？拳頭大就是正義！"
        },
        {
            "id": "major_12_hanged_raider",
            "name": "倒吊掠奪者 (The Hanged Raider)",
            "suit": "major_arcana",
            "number": 12,
            "upright_meaning": "犧牲、暫停、新視角、啟示、放下",
            "reversed_meaning": "拖延、抗拒改變、無意義犧牲、執著",
            "radiation_level": 0.40,
            "threat_level": 2,
            "wasteland_humor": "被倒吊在廢土路標上思考人生",
            "nuka_cola_reference": "倒著喝Nuka-Cola看到不同世界",
            "fallout_easter_egg": "有時候需要換個角度看世界",
            "special_ability": "逆向思考：從不同角度解決問題",
            "upright_keywords": ["犧牲", "暫停", "新視角", "啟示", "放下"],
            "reversed_keywords": ["拖延", "抗拒改變", "無意義犧牲", "執著", "停滯"],
            "good_interpretation": "為更大目標犧牲小我",
            "neutral_interpretation": "暫停是為了更好地前進",
            "evil_interpretation": "讓他人無意義犧牲為己謀利",
            "pip_boy_analysis": "狀態：暫停。建議：重新評估策略。",
            "vault_dweller_voice": "有時候需要停下來思考。",
            "wasteland_trader_voice": "暫時的損失可能帶來長期收益。",
            "super_mutant_voice": "倒著看世界很有趣！",
            "codsworth_voice": "先生/女士，換個角度思考或許有新發現。",
            "brotherhood_significance": "知識需要時間沉澱。",
            "ncr_significance": "民主決策需要時間討論。",
            "legion_significance": "戰略撤退不是失敗。",
            "raiders_significance": "被抓到就慘了...想辦法逃脫！"
        },
        {
            "id": "major_13_radiation_death",
            "name": "輻射死神 (Radiation Death)",
            "suit": "major_arcana",
            "number": 13,
            "upright_meaning": "轉變、結束、重生、變化、新開始",
            "reversed_meaning": "抗拒改變、停滯、恐懼、執著過去",
            "radiation_level": 0.90,
            "threat_level": 6,
            "wasteland_humor": "身披輻射符號斗篷的神秘死神",
            "nuka_cola_reference": "Nuka-Cola Quantum的藍光標記死亡與重生",
            "fallout_easter_egg": "結束不是終點，而是新的開始",
            "special_ability": "鳳凰重生：從毀滅中誕生新生",
            "upright_keywords": ["轉變", "結束", "重生", "變化", "新開始"],
            "reversed_keywords": ["抗拒改變", "停滯", "恐懼", "執著過去", "拒絕放手"],
            "good_interpretation": "接受改變，擁抱新生",
            "neutral_interpretation": "結束是新開始的前提",
            "evil_interpretation": "破壞一切，拒絕重建",
            "pip_boy_analysis": "生命週期：轉換中。建議：接受變化。",
            "vault_dweller_voice": "戰爭結束了一切，但也開啟了新世界。",
            "wasteland_trader_voice": "舊貨賣完了，新貨才能進來。",
            "super_mutant_voice": "死亡是改變！改變是好的！",
            "codsworth_voice": "先生/女士，Pre-War時代結束了，但我們仍在這裡。",
            "brotherhood_significance": "舊技術淘汰，新技術誕生。",
            "ncr_significance": "舊秩序崩潰，新民主誕生。",
            "legion_significance": "羅馬從廢墟中重生。",
            "raiders_significance": "殺掉舊老大，我就是新老大！"
        },
        {
            "id": "major_14_temperance_medic",
            "name": "節制醫者 (The Temperance Medic)",
            "suit": "major_arcana",
            "number": 14,
            "upright_meaning": "平衡、節制、治療、調和、耐心",
            "reversed_meaning": "不平衡、過度、缺乏耐心、極端",
            "radiation_level": 0.30,
            "threat_level": 2,
            "wasteland_humor": "混合治療針和輻射解毒劑",
            "nuka_cola_reference": "調配完美比例的Nuka-Cola藥劑",
            "fallout_easter_egg": "治療的藝術需要平衡",
            "special_ability": "完美調和：混合各種藥劑達到最佳效果",
            "upright_keywords": ["平衡", "節制", "治療", "調和", "耐心"],
            "reversed_keywords": ["不平衡", "過度", "缺乏耐心", "極端", "失調"],
            "good_interpretation": "用平衡的方式治療身心",
            "neutral_interpretation": "中庸之道往往最有效",
            "evil_interpretation": "用藥物控制他人",
            "pip_boy_analysis": "健康狀態：平衡。建議：保持適度。",
            "vault_dweller_voice": "Vault-Tec醫療訓練：一切都要適量。",
            "wasteland_trader_voice": "好藥劑師知道如何調配。",
            "super_mutant_voice": "醫生人類幫助大家！好人類！",
            "codsworth_voice": "先生/女士，適度是健康的關鍵。",
            "brotherhood_significance": "醫療技術需要精確平衡。",
            "ncr_significance": "公共衛生需要資源平衡分配。",
            "legion_significance": "軍團醫者知道如何維持戰士健康。",
            "raiders_significance": "藥物能賣很多瓶蓋！"
        },
        {
            "id": "major_15_deathclaw_devil",
            "name": "死爪惡魔 (The Deathclaw Devil)",
            "suit": "major_arcana",
            "number": 15,
            "upright_meaning": "誘惑、束縛、物質主義、恐懼、成癮",
            "reversed_meaning": "解脫、覺醒、打破束縛、克服成癮",
            "radiation_level": 0.80,
            "threat_level": 8,
            "wasteland_humor": "巨大死爪守護黃金瓶蓋",
            "nuka_cola_reference": "對Nuka-Cola的病態成癮",
            "fallout_easter_egg": "恐懼是最大的敵人",
            "special_ability": "恐懼威懾：讓敵人陷入恐慌",
            "upright_keywords": ["誘惑", "束縛", "物質主義", "恐懼", "成癮"],
            "reversed_keywords": ["解脫", "覺醒", "打破束縛", "克服成癮", "自由"],
            "good_interpretation": "認識並克服自己的弱點",
            "neutral_interpretation": "誘惑是人性，關鍵是如何應對",
            "evil_interpretation": "用成癮和恐懼控制他人",
            "pip_boy_analysis": "成癮檢測：警告。建議：尋求幫助。",
            "vault_dweller_voice": "Vault-Tec警告：避免上癮物質。",
            "wasteland_trader_voice": "成癮的人容易被利用...我是說幫助。",
            "super_mutant_voice": "大怪物很可怕！但可以打敗！",
            "codsworth_voice": "先生/女士，請遠離危險成癮物。",
            "brotherhood_significance": "科技成癮也是一種束縛。",
            "ncr_significance": "自由包括免於恐懼的自由。",
            "legion_significance": "軍團禁止一切削弱意志的物質。",
            "raiders_significance": "化學品很好賺！讓他們上癮！"
        },
        {
            "id": "major_16_destroyed_tower",
            "name": "摧毀之塔 (The Destroyed Tower)",
            "suit": "major_arcana",
            "number": 16,
            "upright_meaning": "災難、啟示、突然變化、毀滅、解放",
            "reversed_meaning": "逃避災難、抗拒變化、延遲崩潰",
            "radiation_level": 0.90,
            "threat_level": 7,
            "wasteland_humor": "被核彈直擊的摩天大樓",
            "nuka_cola_reference": "Nuka-Cola工廠爆炸的那一刻",
            "fallout_easter_egg": "戰爭...戰爭從不改變",
            "special_ability": "創造性破壞：從廢墟中重建",
            "upright_keywords": ["災難", "啟示", "突然變化", "毀滅", "解放"],
            "reversed_keywords": ["逃避災難", "抗拒變化", "延遲崩潰", "否認", "固執"],
            "good_interpretation": "從災難中學習，重建更好的未來",
            "neutral_interpretation": "破壞是重建的前提",
            "evil_interpretation": "製造災難從混亂中獲利",
            "pip_boy_analysis": "危機警報：最高。建議：立即撤離。",
            "vault_dweller_voice": "這就是為什麼我們需要避難所。",
            "wasteland_trader_voice": "災難後總有商機...我是說重建機會。",
            "super_mutant_voice": "大爆炸！一切都變了！",
            "codsworth_voice": "先生/女士，我親眼見證了那天。",
            "brotherhood_significance": "從Pre-War的毀滅中汲取教訓。",
            "ncr_significance": "舊秩序崩潰，新民主誕生。",
            "legion_significance": "從廢墟中重建羅馬。",
            "raiders_significance": "混亂是我們的機會！"
        },
        {
            "id": "major_17_star_guidance",
            "name": "星辰指引 (The Star Guidance)",
            "suit": "major_arcana",
            "number": 17,
            "upright_meaning": "希望、指引、靈感、治癒、樂觀",
            "reversed_meaning": "絕望、迷失方向、缺乏信心、幻滅",
            "radiation_level": 0.30,
            "threat_level": 1,
            "wasteland_humor": "污染天空中的明亮星星",
            "nuka_cola_reference": "Nuka-Cola Quantum的藍光像星星一樣指引方向",
            "fallout_easter_egg": "即使在最黑暗的夜晚，星星仍然閃耀",
            "special_ability": "希望之光：在絕望中找到方向",
            "upright_keywords": ["希望", "指引", "靈感", "治癒", "樂觀"],
            "reversed_keywords": ["絕望", "迷失方向", "缺乏信心", "幻滅", "失望"],
            "good_interpretation": "成為他人的希望之光",
            "neutral_interpretation": "希望需要行動支持",
            "evil_interpretation": "用虛假希望欺騙他人",
            "pip_boy_analysis": "士氣：高。希望指數：優秀。建議：保持樂觀。",
            "vault_dweller_voice": "Vault-Tec承諾：更美好的明天。",
            "wasteland_trader_voice": "有希望就有未來，有未來就有商機。",
            "super_mutant_voice": "星星很漂亮！讓人類開心！",
            "codsworth_voice": "先生/女士，希望是人類最寶貴的資產。",
            "brotherhood_significance": "知識是人類的希望之光。",
            "ncr_significance": "民主是廢土的希望。",
            "legion_significance": "羅馬重生是人類的希望。",
            "raiders_significance": "希望？我們只相信瓶蓋！"
        },
        {
            "id": "major_18_moon_illusion",
            "name": "月影幻象 (The Moon Illusion)",
            "suit": "major_arcana",
            "number": 18,
            "upright_meaning": "幻象、恐懼、不確定、直覺、神秘",
            "reversed_meaning": "真相揭露、克服恐懼、清晰、理性",
            "radiation_level": 0.60,
            "threat_level": 3,
            "wasteland_humor": "輻射發光的月亮照亮廢土",
            "nuka_cola_reference": "月光下的Nuka-Cola看起來特別詭異",
            "fallout_easter_egg": "月光下的輻射格外美麗也格外危險",
            "special_ability": "幻象洞察：看穿虛假表象",
            "upright_keywords": ["幻象", "恐懼", "不確定", "直覺", "神秘"],
            "reversed_keywords": ["真相揭露", "克服恐懼", "清晰", "理性", "現實"],
            "good_interpretation": "用直覺看穿幻象，找到真相",
            "neutral_interpretation": "不是所有看到的都是真實的",
            "evil_interpretation": "製造幻象迷惑他人",
            "pip_boy_analysis": "感知：混亂。建議：保持警覺。",
            "vault_dweller_voice": "Vault-Tec訓練：相信數據，不是幻覺。",
            "wasteland_trader_voice": "夜晚交易要小心，很多騙局。",
            "super_mutant_voice": "月亮讓小人類害怕！超級變種人不怕！",
            "codsworth_voice": "先生/女士，夜晚請保持理性判斷。",
            "brotherhood_significance": "科學揭露真相，驅散迷信。",
            "ncr_significance": "民主需要透明，不是幻象。",
            "legion_significance": "軍團不相信幻覺，只相信力量。",
            "raiders_significance": "夜晚是偷襲的好時機！"
        },
        {
            "id": "major_19_sun_rebirth",
            "name": "太陽新生 (The Sun Rebirth)",
            "suit": "major_arcana",
            "number": 19,
            "upright_meaning": "成功、快樂、生命力、啟蒙、純真",
            "reversed_meaning": "過度樂觀、驕傲、失敗、能量耗盡",
            "radiation_level": 0.10,
            "threat_level": 1,
            "wasteland_humor": "在廢土上升起的燦爛太陽",
            "nuka_cola_reference": "陽光下的Nuka-Cola閃閃發光",
            "fallout_easter_egg": "太陽仍然升起，生命仍在繼續",
            "special_ability": "生命能量：恢復活力和希望",
            "upright_keywords": ["成功", "快樂", "生命力", "啟蒙", "純真"],
            "reversed_keywords": ["過度樂觀", "驕傲", "失敗", "能量耗盡", "幻滅"],
            "good_interpretation": "分享快樂和成功，照亮他人",
            "neutral_interpretation": "成功後保持謙虛",
            "evil_interpretation": "用成功壓制他人，驕傲自大",
            "pip_boy_analysis": "能量：最大。士氣：優秀。建議：保持這種狀態。",
            "vault_dweller_voice": "Vault-Tec：每天都是新的開始！",
            "wasteland_trader_voice": "陽光普照，生意興隆！",
            "super_mutant_voice": "太陽好溫暖！讓所有人開心！",
            "codsworth_voice": "先生/女士，美好的一天！",
            "brotherhood_significance": "知識之光照亮人類未來。",
            "ncr_significance": "民主的陽光普照大地。",
            "legion_significance": "羅馬的榮耀如太陽般燦爛。",
            "raiders_significance": "大白天不好搶劫...等晚上。"
        },
        {
            "id": "major_20_judgement_day",
            "name": "審判之日 (Judgement Day)",
            "suit": "major_arcana",
            "number": 20,
            "upright_meaning": "重生、救贖、內在呼喚、寬恕、覺醒",
            "reversed_meaning": "自我懷疑、逃避責任、否認、內疚",
            "radiation_level": 0.70,
            "threat_level": 5,
            "wasteland_humor": "核爆雲中響起的審判號角",
            "nuka_cola_reference": "最後審判時刻的Nuka-Cola是最珍貴的",
            "fallout_easter_egg": "戰前的罪惡，戰後的救贖",
            "special_ability": "最終審判：評估所有行為",
            "upright_keywords": ["重生", "救贖", "內在呼喚", "寬恕", "覺醒"],
            "reversed_keywords": ["自我懷疑", "逃避責任", "否認", "內疚", "拒絕改變"],
            "good_interpretation": "接受過去，重獲新生",
            "neutral_interpretation": "每個人都值得第二次機會",
            "evil_interpretation": "審判他人，拒絕寬恕",
            "pip_boy_analysis": "道德評估：進行中。建議：反省過去。",
            "vault_dweller_voice": "Vault-Tec：每個人都值得救贖。",
            "wasteland_trader_voice": "過去的債要還，未來才會好。",
            "super_mutant_voice": "審判日來了！所有人要負責！",
            "codsworth_voice": "先生/女士，過去的錯誤可以彌補。",
            "brotherhood_significance": "知識的責任需要承擔。",
            "ncr_significance": "民主審判基於法律，不是復仇。",
            "legion_significance": "軍團審判嚴格但公正。",
            "raiders_significance": "誰來審判我們？我們就是法律！"
        },
        {
            "id": "major_21_wasteland_world",
            "name": "廢土世界 (The Wasteland World)",
            "suit": "major_arcana",
            "number": 21,
            "upright_meaning": "完成、成就、整合、循環、圓滿",
            "reversed_meaning": "不完整、缺乏成就、停滯、失敗",
            "radiation_level": 0.40,
            "threat_level": 3,
            "wasteland_humor": "廢土的完整生態循環",
            "nuka_cola_reference": "收集了所有版本的Nuka-Cola，完成終極收藏",
            "fallout_easter_egg": "一個循環結束，新的循環開始",
            "special_ability": "完美循環：結束即是開始",
            "upright_keywords": ["完成", "成就", "整合", "循環", "圓滿"],
            "reversed_keywords": ["不完整", "缺乏成就", "停滯", "失敗", "未完成"],
            "good_interpretation": "完成使命，幫助世界重建",
            "neutral_interpretation": "每個結束都是新的開始",
            "evil_interpretation": "破壞循環，阻止重建",
            "pip_boy_analysis": "任務完成度：100%。成就解鎖！",
            "vault_dweller_voice": "Vault-Tec：任務完成，世界重生！",
            "wasteland_trader_voice": "完整的庫存，完美的生意循環！",
            "super_mutant_voice": "世界完整了！所有人都贏了！",
            "codsworth_voice": "先生/女士，您完成了不可能的任務。",
            "brotherhood_significance": "知識循環：學習、保存、傳承。",
            "ncr_significance": "民主完整：立法、執法、司法。",
            "legion_significance": "羅馬重建完成，帝國重生。",
            "raiders_significance": "搶完一個地方，再去下一個！循環繼續！"
        }
    ]

    return major_arcana_data


def generate_minor_arcana() -> List[Dict[str, Any]]:
    """生成 56 張小阿卡納（4個花色，每個花色14張）"""

    minor_arcana = []

    # 定義四個花色
    suits = {
        "nuka_cola_bottles": {
            "name_zh": "可樂瓶",
            "name_en": "Nuka-Cola Bottles",
            "element": "水",
            "theme": "情感、關係、輻射治療、社群連結",
            "base_radiation": 0.25
        },
        "combat_weapons": {
            "name_zh": "戰鬥武器",
            "name_en": "Combat Weapons",
            "element": "風",
            "theme": "衝突、策略、決策、生存智慧",
            "base_radiation": 0.15
        },
        "bottle_caps": {
            "name_zh": "瓶蓋",
            "name_en": "Bottle Caps",
            "element": "土",
            "theme": "資源、交易、生存物資、實用主義",
            "base_radiation": 0.05
        },
        "radiation_rods": {
            "name_zh": "輻射棒",
            "name_en": "Radiation Rods",
            "element": "火",
            "theme": "能量、創造力、變異、行動力",
            "base_radiation": 0.45
        }
    }

    # 數字牌名稱
    number_names = {
        1: "王牌 (Ace)",
        2: "二 (Two)",
        3: "三 (Three)",
        4: "四 (Four)",
        5: "五 (Five)",
        6: "六 (Six)",
        7: "七 (Seven)",
        8: "八 (Eight)",
        9: "九 (Nine)",
        10: "十 (Ten)"
    }

    # 宮廷牌
    court_cards = {
        11: ("新兵", "Page"),
        12: ("廢土騎士", "Knight"),
        13: ("聚落領袖", "Queen"),
        14: ("廢土霸主", "King")
    }

    # 為每個花色生成卡片
    for suit_key, suit_info in suits.items():
        # 生成數字牌 (1-10)
        for num in range(1, 11):
            card_id = f"{suit_key}_{num:02d}"
            card_name = f"{suit_info['name_zh']}{number_names[num]}"

            card = {
                "id": card_id,
                "name": card_name,
                "suit": suit_key,
                "number": num,
                "upright_meaning": f"{suit_info['theme']} - {number_names[num]}的正面能量和積極表現",
                "reversed_meaning": f"{suit_info['theme']} - {number_names[num]}的負面能量和消極表現",
                "radiation_level": round(suit_info['base_radiation'] + (num * 0.05), 2),
                "threat_level": max(1, min(5, num // 2)),
                "wasteland_humor": f"{card_name}在廢土中代表{suit_info['theme']}的第{num}階段",
                "nuka_cola_reference": f"這張牌的能量就像喝下第{num}瓶Nuka-Cola",
                "fallout_easter_egg": f"{suit_info['name_zh']}花色體現了廢土生存的{suit_info['element']}元素",
                "special_ability": f"{card_name}的特殊能力：{suit_info['theme']}增強",
                "upright_keywords": [f"{suit_info['theme']}"],
                "reversed_keywords": [f"{suit_info['theme']}阻礙"],
                "good_interpretation": f"善用{card_name}的能量帶來正面改變",
                "neutral_interpretation": f"{card_name}提醒保持平衡",
                "evil_interpretation": f"濫用{card_name}會帶來負面後果",
                "pip_boy_analysis": f"Pip-Boy分析：{card_name}顯示{suit_info['theme']}指數為{num*10}%",
                "vault_dweller_voice": f"根據避難所手冊，{card_name}很重要",
                "wasteland_trader_voice": f"在廢土市場，{card_name}值{num*10}個瓶蓋",
                "super_mutant_voice": f"{card_name}！{suit_info['name_zh']}好！",
                "codsworth_voice": f"關於{card_name}，這是個有趣的觀察",
                "brotherhood_significance": f"兄弟會檔案：{card_name}具有戰略意義",
                "ncr_significance": f"NCR情報：{card_name}對共和國有幫助",
                "legion_significance": f"軍團記錄：{card_name}展現力量",
                "raiders_significance": f"掠奪者筆記：{card_name}能賺錢！"
            }
            minor_arcana.append(card)

        # 生成宮廷牌 (11-14)
        for num, (court_zh, court_en) in court_cards.items():
            card_id = f"{suit_key}_{num:02d}"
            card_name = f"{suit_info['name_zh']}{court_zh}"

            card = {
                "id": card_id,
                "name": card_name,
                "suit": suit_key,
                "number": num,
                "upright_meaning": f"{suit_info['theme']} - {court_zh}的領導能力、專業知識和成熟經驗",
                "reversed_meaning": f"{suit_info['theme']} - {court_zh}特質的負面表現、能力濫用或不成熟",
                "radiation_level": round(suit_info['base_radiation'] + 0.3, 2),
                "threat_level": 3,
                "wasteland_humor": f"{card_name}是{suit_info['name_zh']}花色的守護者",
                "nuka_cola_reference": f"{court_zh}最愛收藏特殊版本的Nuka-Cola",
                "fallout_easter_egg": f"{court_zh}體現了廢土生存的{suit_info['element']}元素精華",
                "special_ability": f"{court_zh}特殊技能：{suit_info['theme']}大師級掌控",
                "upright_keywords": [f"{court_zh}", f"{suit_info['theme']}專精"],
                "reversed_keywords": [f"{court_zh}失職", f"{suit_info['theme']}失控"],
                "good_interpretation": f"{court_zh}用專業知識幫助他人",
                "neutral_interpretation": f"{court_zh}的能力需要智慧使用",
                "evil_interpretation": f"{court_zh}濫用權力謀取私利",
                "pip_boy_analysis": f"Pip-Boy人員檔案：{card_name}，專精等級MAX",
                "vault_dweller_voice": f"這位{court_zh}值得學習",
                "wasteland_trader_voice": f"{court_zh}是{suit_info['name_zh']}交易的專家",
                "super_mutant_voice": f"{court_zh.upper()}很強！超級變種人尊敬！",
                "codsworth_voice": f"{court_zh}先生/女士，您的專業令人欽佩",
                "brotherhood_significance": f"{court_zh}代表兄弟會的{suit_info['theme']}理念",
                "ncr_significance": f"{court_zh}是共和國{suit_info['theme']}領域的支柱",
                "legion_significance": f"{court_zh}體現軍團的{suit_info['theme']}精神",
                "raiders_significance": f"{court_zh}這種人...很危險或很有用"
            }
            minor_arcana.append(card)

    return minor_arcana


async def seed_all_cards():
    """填充完整的 78 張卡牌到 Supabase"""
    print("=" * 80)
    print("🎲 完整 78 張廢土塔羅牌資料庫填充")
    print("=" * 80)

    try:
        # 1. 生成所有卡片
        print("\n[步驟 1/4] 生成完整 78 張卡牌資料...")
        major_arcana = generate_major_arcana()
        minor_arcana = generate_minor_arcana()
        all_cards = major_arcana + minor_arcana

        print(f"✅ 大阿卡納：{len(major_arcana)} 張")
        print(f"✅ 小阿卡納：{len(minor_arcana)} 張")
        print(f"✅ 總計：{len(all_cards)} 張")

        # 2. 檢查現有資料
        print("\n[步驟 2/4] 檢查現有卡牌資料...")
        try:
            existing_result = supabase.table('wasteland_cards').select("id, name").execute()
            existing_ids = {card['id'] for card in existing_result.data}
            print(f"📊 資料庫現有卡牌：{len(existing_ids)} 張")
        except Exception as e:
            print(f"⚠️  無法讀取現有資料（可能是空表格）：{e}")
            existing_ids = set()

        # 3. 過濾並插入
        new_cards = [card for card in all_cards if card['id'] not in existing_ids]
        print(f"📝 需要新增的卡牌：{len(new_cards)} 張")

        if len(new_cards) == 0:
            print("\n✅ 所有卡牌已存在，無需新增！")
            return

        # 4. 批次插入
        print("\n[步驟 3/4] 批次插入卡牌資料...")
        batch_size = 10
        success_count = 0
        failed_count = 0

        for i in range(0, len(new_cards), batch_size):
            batch = new_cards[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(new_cards) + batch_size - 1) // batch_size

            try:
                result = supabase.table('wasteland_cards').insert(batch).execute()
                batch_success = len(result.data)
                success_count += batch_success
                print(f"   批次 {batch_num}/{total_batches}: ✅ 成功插入 {batch_success} 張卡牌")
            except Exception as e:
                failed_count += len(batch)
                print(f"   批次 {batch_num}/{total_batches}: ❌ 插入失敗 - {str(e)[:100]}")

        # 5. 驗證結果
        print("\n[步驟 4/4] 驗證最終結果...")
        final_result = supabase.table('wasteland_cards').select("id, name, suit").execute()
        final_cards = final_result.data

        # 統計各花色
        suit_counts = {}
        for card in final_cards:
            suit = card['suit']
            suit_counts[suit] = suit_counts.get(suit, 0) + 1

        # 顯示結果
        print("\n" + "=" * 80)
        print("✅ 填充完成！")
        print("=" * 80)
        print(f"📊 本次作業統計：")
        print(f"   ➕ 成功新增：{success_count} 張")
        print(f"   ❌ 失敗：{failed_count} 張")
        print(f"   📈 資料庫總計：{len(final_cards)} 張")

        print("\n📋 花色分佈統計：")
        suit_names = {
            'major_arcana': '🃏 大阿卡納 (Major Arcana)',
            'nuka_cola_bottles': '🥤 可樂瓶 (Nuka-Cola Bottles)',
            'combat_weapons': '⚔️  戰鬥武器 (Combat Weapons)',
            'bottle_caps': '💰 瓶蓋 (Bottle Caps)',
            'radiation_rods': '☢️  輻射棒 (Radiation Rods)'
        }

        expected_counts = {
            'major_arcana': 22,
            'nuka_cola_bottles': 14,
            'combat_weapons': 14,
            'bottle_caps': 14,
            'radiation_rods': 14
        }

        all_correct = True
        for suit, expected in expected_counts.items():
            actual = suit_counts.get(suit, 0)
            status = "✅" if actual == expected else "⚠️"
            display_name = suit_names.get(suit, suit)
            print(f"   {status} {display_name}: {actual} 張 (預期 {expected} 張)")
            if actual != expected:
                all_correct = False

        if all_correct and len(final_cards) == 78:
            print("\n🎉 完美！資料庫包含完整的 78 張廢土塔羅牌！")
            print("   🌟 所有花色數量正確")
            print("   🎨 融合 Fallout 主題與塔羅牌傳統")
            print("   📚 每張卡牌都有詳細的廢土風格解讀")
            print("   🎮 準備就緒，可以開始占卜了！")
        else:
            print("\n⚠️  警告：資料可能不完整，請檢查")

        print("=" * 80)

    except Exception as e:
        print(f"\n❌ 填充過程發生錯誤：{e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    print("\n🎮 廢土塔羅牌資料庫填充工具")
    print("基於 Fallout 主題的完整 78 張塔羅牌系統\n")

    # 執行 seed
    asyncio.run(seed_all_cards())
