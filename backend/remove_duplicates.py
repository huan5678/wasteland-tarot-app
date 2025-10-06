#!/usr/bin/env python3
"""
Remove Duplicate Major Arcana Cards
移除重複的大阿爾克那卡牌
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

def remove_duplicate_major_arcana():
    """移除重複的大阿爾克那卡牌"""
    print("🔍 檢查大阿爾克那重複卡牌...")

    # 獲取所有大阿爾克那卡牌，按編號排序
    result = supabase.table('wasteland_cards').select('id, name, number, created_at').eq('suit', 'major_arcana').order('number').order('created_at').execute()

    if not result.data:
        print("❌ 未找到大阿爾克那卡牌")
        return

    cards_by_number = {}
    for card in result.data:
        number = card['number']
        if number not in cards_by_number:
            cards_by_number[number] = []
        cards_by_number[number].append(card)

    # 找出重複項並決定要刪除哪些
    duplicates_to_remove = []
    print("📋 重複卡牌分析:")

    for number, cards in cards_by_number.items():
        if len(cards) > 1:
            print(f"  編號 {number}: {len(cards)} 張卡牌")
            # 保留最早創建的，刪除其餘的
            cards.sort(key=lambda x: x['created_at'])
            keep = cards[0]
            remove_list = cards[1:]

            print(f"    保留: {keep['name']} (ID: {keep['id'][:8]}...)")
            for card in remove_list:
                print(f"    刪除: {card['name']} (ID: {card['id'][:8]}...)")
                duplicates_to_remove.append(card)

    if not duplicates_to_remove:
        print("✅ 沒有發現重複的大阿爾克那卡牌")
        return 0

    print(f"\n🗑️  準備刪除 {len(duplicates_to_remove)} 張重複卡牌...")

    removed_count = 0
    for card in duplicates_to_remove:
        try:
            result = supabase.table('wasteland_cards').delete().eq('id', card['id']).execute()
            if result.data:
                print(f"  ✅ 已刪除: {card['name']} (編號{card['number']})")
                removed_count += 1
            else:
                print(f"  ⚠️  刪除結果為空: {card['name']}")
                removed_count += 1  # 假設刪除成功
        except Exception as e:
            print(f"  ❌ 刪除失敗: {card['name']} - {e}")

    return removed_count

def verify_major_arcana():
    """驗證大阿爾克那卡牌"""
    print("🎯 驗證大阿爾克那完整性...")

    result = supabase.table('wasteland_cards').select('number', count='exact').eq('suit', 'major_arcana').execute()
    total_count = result.count

    if result.data:
        numbers = sorted([card['number'] for card in result.data])
        print(f"  大阿爾克那總數: {total_count}/22")
        print(f"  編號分布: {numbers}")

        expected_numbers = list(range(0, 22))  # 0-21
        missing = [n for n in expected_numbers if n not in numbers]
        duplicates = [n for n in set(numbers) if numbers.count(n) > 1]

        if missing:
            print(f"  ⚠️  缺失編號: {missing}")
        if duplicates:
            print(f"  ⚠️  重複編號: {duplicates}")

        if total_count == 22 and not missing and not duplicates:
            print("  ✅ 大阿爾克那完整且無重複")
            return True
        else:
            print("  ⚠️  大阿爾克那仍有問題")
            return False
    else:
        print("  ❌ 無法獲取大阿爾克那資料")
        return False

def main():
    print("🚀 開始移除重複的大阿爾克那卡牌...")
    print("=" * 50)

    try:
        # 移除重複卡牌
        removed_count = remove_duplicate_major_arcana()
        print(f"\n📊 已移除 {removed_count} 張重複卡牌")

        # 驗證結果
        print("\n" + "-" * 30)
        is_complete = verify_major_arcana()

        # 檢查總數
        print("\n" + "-" * 30)
        total_result = supabase.table('wasteland_cards').select('id', count='exact').execute()
        total_count = total_result.count
        print(f"🎯 資料庫總卡牌數: {total_count}/78")

        if total_count == 78 and is_complete:
            print("\n🎉 完成！資料庫現在有完整的78張卡牌！")
        else:
            print(f"\n⚠️  仍需調整，目前有 {total_count} 張卡牌")

    except Exception as e:
        print(f"❌ 發生錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()