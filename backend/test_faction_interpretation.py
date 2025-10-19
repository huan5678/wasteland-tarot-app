"""
測試陣營過濾功能 - 檢查 Brotherhood 陣營的解讀結果
"""

faction_alignment = 'brotherhood'
card_name = '愚者'
card_orientation = 'upright'

print(f"測試用戶陣營: {faction_alignment}")
print(f"測試卡牌: {card_name} ({card_orientation})")
print("\n預期行為:")
print("1. 角色語音應選擇 Brotherhood 相關的角色")
print("2. 解讀文本應包含 Brotherhood 主題的內容")
print("\nBrotherhood 對應的角色語音選項:")
brotherhood_voices = [
    'elder_maxson',
    'paladin_danse', 
    'scribe_haylen'
]
print("- " + "\n- ".join(brotherhood_voices))
