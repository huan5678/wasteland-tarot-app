#!/usr/bin/env python3
"""
完整 78 張廢土塔羅牌資料庫填充腳本（修正版）
根據實際 Supabase schema 調整欄位名稱
"""

import os
import sys
import uuid
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ 錯誤：未設定 SUPABASE 環境變數")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)


def create_major_arcana_card(number: int, name: str, upright: str, reversed: str, 
                              radiation: float, threat: int, humor: str) -> Dict[str, Any]:
    """創建大阿卡納卡片資料"""
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "suit": "major_arcana",
        "number": number,
        "upright_meaning": upright,
        "reversed_meaning": reversed,
        "radiation_level": radiation,
        "threat_level": threat,
        "wasteland_humor": humor,
        "nuka_cola_reference": f"這張卡牌的能量就像{number}瓶Nuka-Cola",
        "fallout_easter_egg": "戰爭，戰爭從不改變",
        "special_ability": f"{name}的特殊能力",
        "good_karma_interpretation": f"善用{name}的力量",
        "neutral_karma_interpretation": f"{name}需要平衡",
        "evil_karma_interpretation": f"濫用{name}會有後果",
        "pip_boy_analysis": f"Pip-Boy分析：{name}",
        "vault_dweller_perspective": f"避難所視角：{name}",
        "wasteland_trader_wisdom": f"商人智慧：{name}",
        "super_mutant_simplicity": f"{name}！好卡牌！",
        "codsworth_analysis": f"關於{name}的分析",
        "brotherhood_significance": f"兄弟會：{name}很重要",
        "ncr_significance": f"NCR：{name}有幫助",
        "legion_significance": f"軍團：{name}展現力量",
        "raiders_significance": f"掠奪者：{name}能賺錢！",
        "vault_dweller_significance": f"避難所：{name}的意義"
    }


def create_minor_arcana_card(suit: str, number: int, suit_zh: str) -> Dict[str, Any]:
    """創建小阿卡納卡片資料"""
    
    # 卡牌名稱
    number_names = {
        1: "王牌", 2: "二", 3: "三", 4: "四", 5: "五",
        6: "六", 7: "七", 8: "八", 9: "九", 10: "十",
        11: "新兵", 12: "廢土騎士", 13: "聚落領袖", 14: "廢土霸主"
    }
    
    card_name = f"{suit_zh}{number_names[number]}"
    
    return {
        "id": str(uuid.uuid4()),
        "name": card_name,
        "suit": suit,
        "number": number,
        "upright_meaning": f"{card_name}的正面能量和積極表現",
        "reversed_meaning": f"{card_name}的負面能量和消極表現",
        "radiation_level": round(0.2 + (number * 0.05), 2),
        "threat_level": max(1, min(5, number // 3)),
        "wasteland_humor": f"{card_name}在廢土中的故事",
        "nuka_cola_reference": f"這張牌的能量就像{number}瓶Nuka-Cola",
        "fallout_easter_egg": f"{suit_zh}花色的廢土智慧",
        "special_ability": f"{card_name}的特殊能力",
        "good_karma_interpretation": f"善用{card_name}",
        "neutral_karma_interpretation": f"{card_name}需要平衡",
        "evil_karma_interpretation": f"濫用{card_name}會有後果",
        "pip_boy_analysis": f"Pip-Boy：{card_name}指數{number*10}%",
        "vault_dweller_perspective": f"避難所視角：{card_name}",
        "wasteland_trader_wisdom": f"值{number*10}個瓶蓋",
        "super_mutant_simplicity": f"{card_name}！好！",
        "codsworth_analysis": f"關於{card_name}",
        "brotherhood_significance": f"兄弟會：{card_name}",
        "ncr_significance": f"NCR：{card_name}",
        "legion_significance": f"軍團：{card_name}",
        "raiders_significance": f"掠奪者：{card_name}！",
        "vault_dweller_significance": f"避難所：{card_name}"
    }


def main():
    print("=" * 80)
    print("🎲 廢土塔羅牌資料庫填充（修正版）")
    print("=" * 80)
    
    all_cards = []
    
    # 1. 生成 22 張大阿卡納
    print("\n[1/3] 生成大阿卡納...")
    major_data = [
        (0, "新手避難所居民", "天真、新開始、無知即福", "魯莽、缺乏準備", 0.1, 1, "戴著派對帽用Pip-Boy自拍"),
        (1, "科技專家", "技能、創新、廢料利用", "技術依賴、過度複雜", 0.3, 2, "用膠帶修理高科技設備"),
        (2, "神秘預言家", "直覺、神秘知識、輻射感知", "迷信、虛假預言", 0.7, 3, "用破損電視機占卜未來"),
        (3, "農場主母", "豐饒、養育、變異成長", "過度保護、控制慾", 0.2, 1, "種植變異巨大蔬菜"),
        (4, "避難所監督", "權威、秩序、官僚制度", "專制、僵化、濫用權力", 0.0, 4, "被廁紙卷襲擊"),
        (5, "兄弟會長老", "傳統、知識保存、教條", "固執、教條主義", 0.1, 3, "對著手冊虔誠祈禱"),
        (6, "廢土戀人", "愛情、關係、選擇", "關係問題、錯誤選擇", 0.3, 2, "輻射日落下相擁"),
        (7, "裝甲戰車", "勝利、決心、控制", "失控、方向迷失", 0.4, 5, "改裝戰車疾馳"),
        (8, "內在力量", "力量、勇氣、耐心", "軟弱、缺乏信心", 0.2, 2, "溫柔撫摸變異熊"),
        (9, "廢土隱者", "內省、尋求、智慧", "孤立、逃避、頑固", 0.5, 2, "舉著輻射燈籠"),
        (10, "命運輪盤", "命運、機會、循環", "厄運、失控", 0.6, 4, "新維加斯風格輪盤"),
        (11, "正義執行者", "正義、平衡、責任", "不公、偏見", 0.2, 3, "身穿NCR護甲"),
        (12, "倒吊掠奪者", "犧牲、暫停、新視角", "拖延、抗拒改變", 0.4, 2, "倒吊在路標上"),
        (13, "輻射死神", "轉變、結束、重生", "抗拒改變、停滯", 0.9, 6, "身披輻射斗篷"),
        (14, "節制醫者", "平衡、節制、治療", "不平衡、過度", 0.3, 2, "混合治療針"),
        (15, "死爪惡魔", "誘惑、束縛、物質主義", "解脫、覺醒", 0.8, 8, "巨大死爪守護瓶蓋"),
        (16, "摧毀之塔", "災難、啟示、突然變化", "逃避災難", 0.9, 7, "核彈直擊大樓"),
        (17, "星辰指引", "希望、指引、靈感", "絕望、迷失方向", 0.3, 1, "污染天空中的星星"),
        (18, "月影幻象", "幻象、恐懼、不確定", "真相揭露", 0.6, 3, "輻射發光的月亮"),
        (19, "太陽新生", "成功、快樂、生命力", "過度樂觀、驕傲", 0.1, 1, "廢土上的燦爛太陽"),
        (20, "審判之日", "重生、救贖、內在呼喚", "自我懷疑", 0.7, 5, "核爆雲中的號角"),
        (21, "廢土世界", "完成、成就、整合", "不完整、缺乏成就", 0.4, 3, "廢土生態循環"),
    ]
    
    for data in major_data:
        all_cards.append(create_major_arcana_card(*data))
    print(f"✅ 完成 {len(major_data)} 張大阿卡納")
    
    # 2. 生成 56 張小阿卡納
    print("\n[2/3] 生成小阿卡納...")
    suits = {
        "nuka_cola_bottles": "可樂瓶",
        "combat_weapons": "戰鬥武器",
        "bottle_caps": "瓶蓋",
        "radiation_rods": "輻射棒"
    }
    
    for suit_key, suit_zh in suits.items():
        for number in range(1, 15):  # 1-14
            all_cards.append(create_minor_arcana_card(suit_key, number, suit_zh))
    print(f"✅ 完成 56 張小阿卡納")
    
    # 3. 批次插入
    print(f"\n[3/3] 插入 {len(all_cards)} 張卡牌到資料庫...")
    success = 0
    failed = 0
    batch_size = 10
    
    for i in range(0, len(all_cards), batch_size):
        batch = all_cards[i:i+batch_size]
        try:
            result = supabase.table('wasteland_cards').insert(batch).execute()
            success += len(result.data)
            print(f"   批次 {i//batch_size + 1}: ✅ {len(result.data)} 張")
        except Exception as e:
            failed += len(batch)
            print(f"   批次 {i//batch_size + 1}: ❌ {str(e)[:80]}")
    
    # 4. 驗證
    print("\n[驗證] 檢查資料庫...")
    final = supabase.table('wasteland_cards').select("id, name, suit").execute()
    
    suit_counts = {}
    for card in final.data:
        suit = card['suit']
        suit_counts[suit] = suit_counts.get(suit, 0) + 1
    
    print("\n" + "=" * 80)
    print("✅ 填充完成！")
    print("=" * 80)
    print(f"📊 成功：{success} 張 | 失敗：{failed} 張 | 總計：{len(final.data)} 張\n")
    print("📋 花色分佈：")
    print(f"   🃏 大阿卡納：{suit_counts.get('major_arcana', 0)} 張 (預期 22)")
    print(f"   🥤 可樂瓶：{suit_counts.get('nuka_cola_bottles', 0)} 張 (預期 14)")
    print(f"   ⚔️  戰鬥武器：{suit_counts.get('combat_weapons', 0)} 張 (預期 14)")
    print(f"   💰 瓶蓋：{suit_counts.get('bottle_caps', 0)} 張 (預期 14)")
    print(f"   ☢️  輻射棒：{suit_counts.get('radiation_rods', 0)} 張 (預期 14)")
    
    if len(final.data) == 78:
        print("\n🎉 完美！完整的 78 張廢土塔羅牌已準備就緒！")
    print("=" * 80)


if __name__ == "__main__":
    main()
