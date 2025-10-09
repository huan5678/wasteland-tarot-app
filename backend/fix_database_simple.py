#!/usr/bin/env python3
"""
Simple Database Fix - Add Missing Cards Based on Real Schema
基於真實資料庫結構的簡單修復腳本
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 錯誤：請在 .env 檔案中設定 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_current_status():
    """檢查目前資料庫狀況"""
    print("🔍 檢查目前資料庫狀況...")

    # 總數檢查
    total_result = supabase.table('wasteland_cards').select('id', count='exact').execute()
    total_count = total_result.count

    # 各花色檢查
    suits = {
        'major_arcana': '大阿爾克那',
        'radiation_rods': '輻射棒',
        'combat_weapons': '戰鬥武器',
        'bottle_caps': '瓶蓋',
        'nuka_cola_bottles': '核子可樂'
    }

    print(f"📊 目前資料庫狀況:")
    print(f"  總卡牌數: {total_count}/78")

    for suit_key, suit_name in suits.items():
        result = supabase.table('wasteland_cards').select('number', count='exact').eq('suit', suit_key).execute()
        count = result.count
        numbers = sorted([card['number'] for card in result.data]) if result.data else []
        print(f"  {suit_name}: {count} 張 - {numbers}")

    return total_count

def create_missing_nuka_cola_cards():
    """創建缺失的核子可樂卡牌"""
    print("🏗️  創建核子可樂卡牌...")

    # 檢查現有的核子可樂卡牌
    result = supabase.table('wasteland_cards').select('number').eq('suit', 'nuka_cola_bottles').execute()
    existing_numbers = {card['number'] for card in result.data} if result.data else set()

    missing_numbers = []
    for i in range(1, 15):  # 1-14
        if i not in existing_numbers:
            missing_numbers.append(i)

    if not missing_numbers:
        print("✅ 核子可樂卡牌已完整")
        return 0

    print(f"  需要創建: {missing_numbers}")

    # 卡牌名稱和含義
    card_data = {
        1: {
            'name': '核子可樂王牌',
            'upright': '新的情感開始、直覺的開端、心靈的淨化、廢土中的希望',
            'reversed': '情感阻塞、錯失機會、內心混亂、希望破滅'
        },
        2: {
            'name': '核子可樂二',
            'upright': '合作、友誼、情感平衡、在艱困中找到夥伴',
            'reversed': '分離、背叛、關係破裂、孤獨感'
        },
        3: {
            'name': '核子可樂三',
            'upright': '慶祝、友誼、團隊合作、小型勝利的喜悅',
            'reversed': '爭吵、三角關係、團隊分裂、慶祝過早'
        }
    }

    created_count = 0

    for number in missing_numbers:
        # 基本資料，只包含實際存在的欄位
        if number <= 3:
            card_info = card_data[number]
        else:
            card_info = {
                'name': f'核子可樂{number}',
                'upright': f'代表核子可樂{number}的正面能量與情感流動',
                'reversed': f'代表核子可樂{number}的負面影響與情感阻塞'
            }

        new_card = {
            'id': f'nuka_{number}',
            'name': card_info['name'],
            'suit': 'nuka_cola_bottles',
            'number': number,
            'upright_meaning': card_info['upright'],
            'reversed_meaning': card_info['reversed'],
            'radiation_level': 0.2,  # 低輻射
            'threat_level': 1,
            'wasteland_humor': f'喝{card_info["name"]}時總是發出滿足的"啊～"聲',
            'nuka_cola_reference': '戰前最受歡迎的汽水品牌，現在是廢土珍寶',
            'fallout_easter_egg': f'{card_info["name"]}：戰後世界的甜蜜回憶',
            'special_ability': f'恢復1點生命值，{card_info["name"]}的治癒力量',
            'upright_keywords': ['情感', '直覺', '治癒', '希望'],
            'reversed_keywords': ['阻塞', '失望', '孤獨', '混亂'],
            'good_interpretation': f'{card_info["upright"]}，讓善意指引你的決定',
            'neutral_interpretation': f'{card_info["upright"]}，保持平衡的心態',
            'evil_interpretation': f'小心{card_info["reversed"]}可能帶來的後果',
            'pip_boy_voice': f'檢測到{card_info["name"]}。建議：保持情感平衡',
            'vault_dweller_voice': f'{card_info["name"]}提醒我們戰前的美好時光',
            'wasteland_trader_voice': f'{card_info["name"]}？這可是稀有貨品！',
            'super_mutant_voice': f'藍色甜水{number}！小人類喜歡藍色甜水！',
            'codsworth_voice': f'{card_info["name"]}，先生/女士您的最愛！',
            'brotherhood_significance': f'{card_info["name"]}：戰前工業奇蹟的象徵',
            'ncr_significance': f'{card_info["name"]}代表重建文明的甜美希望',
            'legion_significance': f'即使軍團戰士也渴望{card_info["name"]}的甘甜',
            'raiders_significance': f'{card_info["name"]}？值好幾個瓶蓋！'
        }

        try:
            result = supabase.table('wasteland_cards').insert(new_card).execute()
            if result.data:
                print(f"  ✅ 已創建: {card_info['name']}")
                created_count += 1
        except Exception as e:
            print(f"  ❌ 創建失敗: {card_info['name']} - {e}")

    return created_count

def verify_final_count():
    """驗證最終卡牌數量"""
    print("🎯 驗證最終卡牌數量...")

    total_result = supabase.table('wasteland_cards').select('id', count='exact').execute()
    total_count = total_result.count

    suits_expected = {
        'major_arcana': 22,
        'radiation_rods': 14,
        'combat_weapons': 14,
        'bottle_caps': 14,
        'nuka_cola_bottles': 14
    }

    suits_actual = {}
    for suit in suits_expected.keys():
        result = supabase.table('wasteland_cards').select('id', count='exact').eq('suit', suit).execute()
        suits_actual[suit] = result.count

    print(f"📊 最終統計:")
    print(f"  總卡牌數: {total_count}/78")

    suit_names = {
        'major_arcana': '大阿爾克那',
        'radiation_rods': '輻射棒',
        'combat_weapons': '戰鬥武器',
        'bottle_caps': '瓶蓋',
        'nuka_cola_bottles': '核子可樂'
    }

    all_complete = True
    for suit, expected in suits_expected.items():
        actual = suits_actual.get(suit, 0)
        status = "✅" if actual == expected else "⚠️"
        print(f"  {status} {suit_names[suit]}: {actual}/{expected}")
        if actual != expected:
            all_complete = False

    if total_count == 78 and all_complete:
        print("🎉 資料庫完整！78張廢土塔羅卡牌已全部到位！")
        return True
    else:
        print(f"⚠️  資料庫尚未完整")
        return False

def main():
    print("🚀 簡單資料庫修復開始...")
    print("=" * 50)

    try:
        # Step 1: 檢查現狀
        current_count = check_current_status()

        # Step 2: 添加缺失的核子可樂卡牌
        print("\n" + "-" * 30)
        created_count = create_missing_nuka_cola_cards()
        print(f"📊 創建了 {created_count} 張核子可樂卡牌")

        # Step 3: 最終驗證
        print("\n" + "=" * 50)
        is_complete = verify_final_count()

        if is_complete:
            print("\n🎉 任務完成！廢土塔羅資料庫已完整建立！")
        else:
            print("\n⚠️  任務部分完成，可能需要進一步調整")

    except Exception as e:
        print(f"❌ 執行過程中發生錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()