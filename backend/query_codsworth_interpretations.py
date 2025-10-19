"""
查詢 card_interpretations 表格中所有 Codsworth 的解讀
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.supabase import get_supabase_client


async def query_codsworth_interpretations():
    """查詢所有 Codsworth 的卡片解讀"""
    supabase = get_supabase_client()

    # 1. 查詢 Codsworth 角色的 ID
    char_response = supabase.table("characters")\
        .select("id, key, name")\
        .eq("key", "codsworth")\
        .execute()

    if not char_response.data:
        print("❌ 找不到 Codsworth 角色")
        return

    codsworth = char_response.data[0]
    print(f"✅ 找到 Codsworth 角色: {codsworth['name']} (ID: {codsworth['id']})")

    # 2. 查詢所有 Codsworth 的解讀
    interp_response = supabase.table("card_interpretations")\
        .select("*, wasteland_cards(name, suit, number)")\
        .eq("character_id", codsworth['id'])\
        .order("wasteland_cards(number)")\
        .execute()

    interpretations = interp_response.data
    print(f"\n找到 {len(interpretations)} 個 Codsworth 解讀")
    print("=" * 100)

    # 3. 顯示前 5 個完整解讀
    print("\n前 5 個完整解讀：")
    print("=" * 100)

    for i, interp in enumerate(interpretations[:5], 1):
        card = interp['wasteland_cards']
        print(f"\n{i}. {card['name']} ({card['suit']}, #{card['number']})")
        print(f"   解讀內容: {interp['interpretation_text']}")
        print("-" * 100)

    # 4. 檢查中英混合問題
    print("\n檢查中英混合問題：")
    print("=" * 100)

    mixed_lang = []
    for interp in interpretations:
        text = interp['interpretation_text'] or ""
        # 檢查是否包含常見英文單詞
        common_words = ['the', 'and', 'or', 'in', 'of', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'is', 'are', 'was', 'were']
        has_english = any(f" {word} " in text.lower() for word in common_words)

        if has_english:
            card = interp['wasteland_cards']
            mixed_lang.append({
                'card': card,
                'text': text
            })

    print(f"\n發現 {len(mixed_lang)} 個可能有中英混合問題的解讀")

    if mixed_lang:
        print("\n示例（前 3 個）：")
        for i, item in enumerate(mixed_lang[:3], 1):
            card = item['card']
            print(f"\n{i}. {card['name']} ({card['suit']})")
            print(f"   {item['text'][:300]}...")


if __name__ == "__main__":
    asyncio.run(query_codsworth_interpretations())
