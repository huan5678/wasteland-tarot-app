#!/usr/bin/env python3
"""
Add Missing Major Arcana Cards (8 and 9)
添加缺失的大阿爾克那卡牌
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

def add_missing_major_arcana():
    """添加缺失的大阿爾克那卡牌（編號 8 和 9）"""
    print("🏗️  創建缺失的大阿爾克那卡牌...")

    # 定義缺失卡牌的資料
    cards_to_add = [
        {
            'number': 8,
            'name': '鋼鐵兄弟會正義',
            'upright_meaning': '正義、平衡、真相、因果報應、鋼鐵兄弟會的道德準則',
            'reversed_meaning': '不公、偏見、逃避責任、濫用權力、教條主義',
            'description': '身穿動力裝甲的鋼鐵兄弟會騎士，一手持雷射步槍，一手持平衡天秤，代表科技與正義的平衡'
        },
        {
            'number': 9,
            'name': '廢土隱者',
            'upright_meaning': '內省、尋求真理、智慧、孤獨的旅程、廢土生存經驗',
            'reversed_meaning': '孤立、拒絕幫助、固執、與世隔絕、錯失指導機會',
            'description': '一個穿著破舊斗篷的老廢土居民，手持照明燈，在夜晚的廢墟中獨自行走，象徵智慧與指引'
        }
    ]

    created_count = 0

    for card_info in cards_to_add:
        # 檢查是否已存在
        existing = supabase.table('wasteland_cards').select('id').eq('suit', 'major_arcana').eq('number', card_info['number']).execute()

        if existing.data:
            print(f"  ⚠️  編號 {card_info['number']} 已存在，跳過")
            continue

        new_card = {
            'id': f'major_{card_info["number"]}',
            'name': card_info['name'],
            'suit': 'major_arcana',
            'number': card_info['number'],
            'upright_meaning': card_info['upright_meaning'],
            'reversed_meaning': card_info['reversed_meaning'],
            'radiation_level': 0.3,  # 中等輻射
            'threat_level': 3 if card_info['number'] == 8 else 2,  # 正義較高威脅，隱者較低
            'wasteland_humor': f'{card_info["name"]}說：「在廢土中，正義和智慧一樣珍貴」' if card_info['number'] == 8 else '老隱者總是在最需要時出現，像廢土中的智慧燈塔',
            'nuka_cola_reference': '即使鋼鐵兄弟會騎士也需要Nuka-Cola來保持清醒執行正義' if card_info['number'] == 8 else '隱者的背包裡總有一瓶冰涼的Nuka-Cola，用來招待迷途的旅行者',
            'fallout_easter_egg': '戰爭...戰爭從不改變。但正義？正義需要勇敢的人去捍衛' if card_info['number'] == 8 else '在廢土的黑暗中，智慧是唯一不會熄滅的光',
            'special_ability': '下次判斷檢定+2獎勵，正義之光指引真相' if card_info['number'] == 8 else '獲得一條有價值的線索或建議，隱者的智慧指引',
            'upright_keywords': ['正義', '平衡', '真相', '責任', '科技'] if card_info['number'] == 8 else ['智慧', '內省', '指導', '孤獨', '真理'],
            'reversed_keywords': ['不公', '偏見', '濫用權力', '教條'] if card_info['number'] == 8 else ['孤立', '固執', '拒絕幫助', '與世隔絕'],
            'good_interpretation': '正義將照亮你的道路。用你的力量保護弱者，維護廢土中的秩序' if card_info['number'] == 8 else '尋求內在智慧。你的經驗可以指引他人走出迷途',
            'neutral_interpretation': '平衡各方利益。在科技與人性間找到正確的道路' if card_info['number'] == 8 else '有時退一步思考是必要的。從過去的經驗中學習',
            'evil_interpretation': '小心權力腐蝕。確保你的正義不會變成他人的壓迫' if card_info['number'] == 8 else '避免過度孤立。你的智慧若不分享，就失去了意義',
            'pip_boy_voice': f'檢測到{card_info["name"]}。建議：{"保持道德標準，執行正義判斷" if card_info["number"] == 8 else "進行內省，尋求更深層的理解"}',
            'vault_dweller_voice': f'{"鋼鐵兄弟會代表著科技與正義的結合，但我們必須確保不失去人性" if card_info["number"] == 8 else "有時獨處能幫助我們理解這個複雜的世界"}',
            'wasteland_trader_voice': f'{"兄弟會的正義？有時對商人來說代價昂貴，但維持秩序對所有人都好" if card_info["number"] == 8 else "老隱者總是有最好的情報和建議。值得付出代價"}',
            'super_mutant_voice': f'{"穿鐵皮的小人類說要正義！強者保護弱者！" if card_info["number"] == 8 else "孤獨的老小人類很聰明！會說有用的話！"}',
            'codsworth_voice': f'{"正義是文明社會的基石，先生/女士" if card_info["number"] == 8 else "獨處有時是必要的，先生/女士。智慧需要時間醞釀"}',
            'brotherhood_significance': '體現兄弟會核心價值：科技、秩序、正義的統一' if card_info['number'] == 8 else '即使在組織中，個人的內省和智慧也是珍貴的',
            'ncr_significance': 'NCR追求的民主正義，需要制衡權力濫用' if card_info['number'] == 8 else '共和國需要有智慧的長者來指導年輕一代',
            'legion_significance': '凱撒軍團式的絕對正義可能變成專制' if card_info['number'] == 8 else '即使在軍團中，智慧的顧問也是必要的',
            'raiders_significance': '掠奪者眼中，正義就是力量的展現' if card_info['number'] == 8 else '老掠奪者的智慧：知道什麼時候該戰鬥，什麼時候該逃跑'
        }

        try:
            result = supabase.table('wasteland_cards').insert(new_card).execute()
            if result.data:
                print(f"  ✅ 已創建: {card_info['name']} (編號 {card_info['number']})")
                created_count += 1
        except Exception as e:
            print(f"  ❌ 創建失敗: {card_info['name']} - {e}")

    return created_count

def verify_completion():
    """驗證資料庫完整性"""
    print("🎯 最終驗證...")

    # 檢查大阿爾克那
    major_result = supabase.table('wasteland_cards').select('number', count='exact').eq('suit', 'major_arcana').execute()
    major_count = major_result.count
    major_numbers = sorted([card['number'] for card in major_result.data]) if major_result.data else []

    # 檢查總數
    total_result = supabase.table('wasteland_cards').select('id', count='exact').execute()
    total_count = total_result.count

    print(f"📊 最終統計:")
    print(f"  大阿爾克那: {major_count}/22 - {major_numbers}")
    print(f"  總卡牌數: {total_count}/78")

    # 檢查各花色
    suits = ['radiation_rods', 'combat_weapons', 'bottle_caps', 'nuka_cola_bottles']
    all_complete = major_count == 22

    for suit in suits:
        result = supabase.table('wasteland_cards').select('id', count='exact').eq('suit', suit).execute()
        count = result.count
        status = "✅" if count == 14 else "⚠️"
        print(f"  {status} {suit}: {count}/14")
        if count != 14:
            all_complete = False

    if total_count == 78 and all_complete:
        print("🎉 完美！資料庫有完整的78張廢土塔羅卡牌！")
        return True
    else:
        print("⚠️ 仍有問題需要解決")
        return False

def main():
    print("🚀 添加最後的大阿爾克那卡牌...")
    print("=" * 50)

    try:
        # 添加缺失的卡牌
        created_count = add_missing_major_arcana()
        print(f"\n📊 創建了 {created_count} 張大阿爾克那卡牌")

        # 最終驗證
        print("\n" + "=" * 50)
        is_complete = verify_completion()

        if is_complete:
            print("\n🎉🎉🎉 任務完成！78張廢土塔羅卡牌全部到位！🎉🎉🎉")
        else:
            print("\n⚠️ 還需要進一步調整")

    except Exception as e:
        print(f"❌ 發生錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()