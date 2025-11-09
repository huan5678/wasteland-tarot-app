#!/usr/bin/env python3
"""
Fix Duplicate Cards and Complete Missing Data
清理重複卡牌並補足缺失資料
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()  # Load from local .env file in backend directory

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 錯誤：請在 .env 檔案中設定 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_duplicates():
    """檢查重複的大阿爾克那卡牌"""
    print("🔍 檢查重複的大阿爾克那卡牌...")

    result = supabase.table('wasteland_cards').select('id, name, suit, number').eq('suit', 'MAJOR_ARCANA').order('number').execute()

    cards_by_number = {}
    duplicates = []

    for card in result.data:
        number = card['number']
        if number in cards_by_number:
            cards_by_number[number].append(card)
        else:
            cards_by_number[number] = [card]

    # 找出重複的
    for number, cards in cards_by_number.items():
        if len(cards) > 1:
            duplicates.extend(cards[1:])  # 保留第一個，其餘視為重複
            print(f"  📋 編號 {number}: {len(cards)} 張 ({cards[0]['name']})")

    return duplicates

def remove_duplicates(duplicates):
    """移除重複卡牌"""
    if not duplicates:
        print("✅ 沒有發現重複卡牌")
        return 0

    print(f"🗑️  移除 {len(duplicates)} 張重複卡牌...")
    removed_count = 0

    for card in duplicates:
        try:
            result = supabase.table('wasteland_cards').delete().eq('id', card['id']).execute()
            if result.data:
                print(f"  ✅ 已移除: {card['name']} (ID: {card['id']})")
                removed_count += 1
        except Exception as e:
            print(f"  ❌ 移除失敗: {card['name']} - {e}")

    return removed_count

def get_missing_nuka_cola():
    """檢查缺失的可樂瓶卡牌"""
    print("🔍 檢查缺失的可樂瓶卡牌...")

    result = supabase.table('wasteland_cards').select('number').eq('suit', 'NUKA_COLA_BOTTLES').execute()
    existing_numbers = {card['number'] for card in result.data}

    missing_numbers = []
    for i in range(1, 15):  # 1-14
        if i not in existing_numbers:
            missing_numbers.append(i)

    print(f"  📋 現有可樂瓶卡牌: {sorted(existing_numbers)}")
    print(f"  ⚠️  缺失可樂瓶卡牌: {missing_numbers}")

    return missing_numbers

def create_nuka_cola_cards(missing_numbers):
    """創建缺失的可樂瓶卡牌"""
    if not missing_numbers:
        print("✅ 可樂瓶卡牌已完整")
        return 0

    # 卡牌名稱對應
    card_names = {
        1: "核子可樂王牌",
        2: "核子可樂二",
        3: "核子可樂三",
        4: "核子可樂四",
        5: "核子可樂五",
        6: "核子可樂六",
        7: "核子可樂七",
        8: "核子可樂八",
        9: "核子可樂九",
        10: "核子可樂十",
        11: "核子可樂侍者",
        12: "核子可樂騎士",
        13: "核子可樂皇后",
        14: "核子可樂國王"
    }

    # 基本解釋模板
    upright_meanings = {
        1: "新的情感開始、直覺的開端、心靈的淨化、廢土中的希望",
        2: "合作、友誼、情感平衡、在艱困中找到夥伴",
        3: "慶祝、友誼、團隊合作、小型勝利的喜悅"
    }

    reversed_meanings = {
        1: "情感阻塞、錯失機會、內心混亂、希望破滅",
        2: "分離、背叛、關係破裂、孤獨感",
        3: "爭吵、三角關係、團隊分裂、慶祝過早"
    }

    print(f"🏗️  創建 {len(missing_numbers)} 張缺失的可樂瓶卡牌...")
    created_count = 0

    for number in missing_numbers:
        card_data = {
            'id': f'nuka_{number}',
            'name': card_names.get(number, f'核子可樂{number}'),
            'suit': 'NUKA_COLA_BOTTLES',
            'number': number,
            'card_number': number,
            'upright_meaning': upright_meanings.get(number, f'代表核子可樂{number}的正面能量與情感流動'),
            'reversed_meaning': reversed_meanings.get(number, f'代表核子可樂{number}的負面影響與情感阻塞'),
            'description': f'核子可樂系列的第{number}張卡牌，象徵著廢土中的情感與直覺力量',
            'image_url': f'/cards/nuka-cola-{number}.png',
            'keywords': ['情感', '直覺', '核子可樂', '廢土'],
            'fallout_reference': '核子可樂是戰前最受歡迎的汽水品牌，在廢土中成為珍貴的資源',
            'symbolism': f'核子可樂瓶代表著純淨與希望，第{number}張牌象徵著情感層面的不同階段',
            'element': '水',
            'astrological_association': '月亮 - 情感與直覺',
            'radiation_factor': 0.1,  # 低輻射，因為是飲料
            'karma_alignment': 'NEUTRAL',
            'character_voice_interpretations': {
                'PIP_BOY': f'檢測到核子可樂{number}號。建議：保持情感平衡，相信直覺。',
                'SUPER_MUTANT': f'藍色甜水{number}！小人類喜歡藍色甜水！',
                'GHOUL': f'啊，核子可樂{number}。戰前的美好回憶，現在是奢侈品。',
                'RAIDER': f'核子可樂{number}！這東西值不少瓶蓋。',
                'BROTHERHOOD_SCRIBE': f'核子可樂{number}號樣本。戰前消費文化的重要遺物。'
            },
            'pip_boy_interpretation': f'核子可樂{number}：情感指標顯示平衡狀態。建議維持當前情緒狀態。',
            'rarity_level': 'uncommon',
            'is_complete': True,
            'is_active': True
        }

        try:
            result = supabase.table('wasteland_cards').insert(card_data).execute()
            if result.data:
                print(f"  ✅ 已創建: {card_data['name']}")
                created_count += 1
        except Exception as e:
            print(f"  ❌ 創建失敗: {card_data['name']} - {e}")

    return created_count

def verify_final_count():
    """驗證最終卡牌數量"""
    print("🎯 驗證最終卡牌數量...")

    # 總數檢查
    total_result = supabase.table('wasteland_cards').select('id', count='exact').eq('is_active', True).execute()
    total_count = total_result.count

    # 各花色檢查
    suits_count = {}
    suits = ['MAJOR_ARCANA', 'RADIATION_RODS', 'COMBAT_WEAPONS', 'BOTTLE_CAPS', 'NUKA_COLA_BOTTLES']

    for suit in suits:
        result = supabase.table('wasteland_cards').select('id', count='exact').eq('suit', suit).eq('is_active', True).execute()
        suits_count[suit] = result.count

    print(f"📊 最終統計:")
    print(f"  總卡牌數: {total_count}/78")
    print(f"  大阿爾克那: {suits_count.get('MAJOR_ARCANA', 0)}/22")
    print(f"  輻射棒: {suits_count.get('RADIATION_RODS', 0)}/14")
    print(f"  戰鬥武器: {suits_count.get('COMBAT_WEAPONS', 0)}/14")
    print(f"  瓶蓋: {suits_count.get('BOTTLE_CAPS', 0)}/14")
    print(f"  可樂瓶: {suits_count.get('NUKA_COLA_BOTTLES', 0)}/14")

    # 檢查是否完整
    expected_counts = {
        'MAJOR_ARCANA': 22,
        'RADIATION_RODS': 14,
        'COMBAT_WEAPONS': 14,
        'BOTTLE_CAPS': 14,
        'NUKA_COLA_BOTTLES': 14
    }

    all_complete = True
    for suit, expected in expected_counts.items():
        actual = suits_count.get(suit, 0)
        if actual != expected:
            all_complete = False
            print(f"  ⚠️  {suit}: 缺少 {expected - actual} 張")

    if total_count == 78 and all_complete:
        print("✅ 資料庫完整！78張廢土塔羅卡牌已全部到位！")
        return True
    else:
        print(f"⚠️  資料庫尚未完整，總計 {total_count} 張卡牌")
        return False

def main():
    print("🚀 開始清理重複卡牌並補足缺失資料...")
    print("=" * 50)

    try:
        # Step 1: 移除重複卡牌
        duplicates = get_duplicates()
        removed_count = remove_duplicates(duplicates)

        print(f"\n📊 重複卡牌清理結果: 移除了 {removed_count} 張")

        # Step 2: 添加缺失的可樂瓶卡牌
        missing_nuka = get_missing_nuka_cola()
        created_count = create_nuka_cola_cards(missing_nuka)

        print(f"\n📊 可樂瓶卡牌補足結果: 創建了 {created_count} 張")

        # Step 3: 最終驗證
        print("\n" + "=" * 50)
        is_complete = verify_final_count()

        if is_complete:
            print("\n🎉 任務完成！廢土塔羅資料庫已完整建立！")
        else:
            print("\n⚠️  任務部分完成，請檢查剩餘問題")

    except Exception as e:
        print(f"❌ 執行過程中發生錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()