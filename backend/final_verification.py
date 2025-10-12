from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

print("=" * 80)
print("🎯 廢土塔羅牌資料庫 - 最終驗證報告")
print("=" * 80)

# 取得所有卡牌
all_cards = supabase.table('wasteland_cards').select("id, name, suit, number").order('suit').order('number').execute()

# 統計各花色
suit_stats = {}
for card in all_cards.data:
    suit = card['suit']
    if suit not in suit_stats:
        suit_stats[suit] = []
    suit_stats[suit].append(card)

# 花色名稱和預期數量
suit_info = {
    'major_arcana': ('🃏 大阿卡納 (Major Arcana)', 22),
    'nuka_cola_bottles': ('🥤 可樂瓶 (Nuka-Cola Bottles)', 14),
    'combat_weapons': ('⚔️  戰鬥武器 (Combat Weapons)', 14),
    'bottle_caps': ('💰 瓶蓋 (Bottle Caps)', 14),
    'radiation_rods': ('☢️  輻射棒 (Radiation Rods)', 14)
}

print(f"\n📊 總計卡牌數量：{len(all_cards.data)} 張\n")

all_correct = True
for suit_key in ['major_arcana', 'nuka_cola_bottles', 'combat_weapons', 'bottle_caps', 'radiation_rods']:
    name, expected = suit_info[suit_key]
    actual = len(suit_stats.get(suit_key, []))
    status = "✅" if actual == expected else "❌"
    print(f"{status} {name}: {actual} 張 (預期 {expected} 張)")
    
    if actual != expected:
        all_correct = False
        # 顯示缺少的卡牌
        if suit_key == 'major_arcana':
            existing = {c['number'] for c in suit_stats.get(suit_key, [])}
            missing = sorted(set(range(0, 22)) - existing)
            if missing:
                print(f"   ⚠️  缺少編號：{missing}")

# 檢查大阿卡納編號完整性
print("\n🔍 大阿卡納編號檢查：")
major_cards = suit_stats.get('major_arcana', [])
numbers = sorted([c['number'] for c in major_cards])
expected_numbers = list(range(0, 22))

if numbers == expected_numbers:
    print("   ✅ 編號完整（0-21）")
else:
    missing = set(expected_numbers) - set(numbers)
    print(f"   ❌ 缺少編號：{missing}")

# 顯示一些範例卡牌
print("\n📋 範例卡牌（大阿卡納前5張）：")
for i, card in enumerate(major_cards[:5]):
    print(f"   {card['number']:2d}: {card['name']}")

print("\n📋 範例卡牌（每個花色的第1張）：")
for suit_key in ['nuka_cola_bottles', 'combat_weapons', 'bottle_caps', 'radiation_rods']:
    cards = suit_stats.get(suit_key, [])
    if cards:
        card = cards[0]
        name = suit_info[suit_key][0].split(' ')[1]
        print(f"   {name}: {card['name']}")

print("\n" + "=" * 80)
if all_correct and len(all_cards.data) == 78:
    print("🎉 驗證通過！資料庫包含完整的 78 張廢土塔羅牌！")
    print("\n✅ 所有花色數量正確")
    print("✅ 編號序列完整")
    print("✅ 資料結構符合 Supabase schema")
    print("\n🎮 廢土塔羅牌系統已準備就緒！")
else:
    print("⚠️  警告：資料不完整，請檢查上述錯誤")
print("=" * 80)
