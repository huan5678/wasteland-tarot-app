"""
匯出所有 Codsworth 解讀到 JSON 檔案
"""
import asyncio
import sys
import json
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.supabase import get_supabase_client


async def export_codsworth_interpretations():
    """匯出所有 Codsworth 解讀到 JSON"""
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
        .select("id, card_id, interpretation_text, wasteland_cards(name, suit, number)")\
        .eq("character_id", codsworth['id'])\
        .order("wasteland_cards(number)")\
        .execute()

    interpretations = interp_response.data
    print(f"\n找到 {len(interpretations)} 個 Codsworth 解讀")

    # 3. 準備匯出資料
    export_data = []
    for interp in interpretations:
        card = interp['wasteland_cards']
        export_data.append({
            "interpretation_id": interp['id'],
            "card_id": interp['card_id'],
            "card_name": card['name'],
            "card_suit": card['suit'],
            "card_number": card['number'],
            "original_text": interp['interpretation_text'],
            "translated_text": ""  # 待填入翻譯後的文字
        })

    # 4. 寫入 JSON 檔案
    output_file = Path(__file__).parent / "codsworth_interpretations.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 成功匯出 {len(export_data)} 個解讀到 JSON 檔案")
    print(f"📁 檔案位置: {output_file}")

    # 5. 顯示統計資訊
    total_chars = sum(len(item['original_text']) for item in export_data)
    print(f"\n📊 統計資訊：")
    print(f"   - 總解讀數: {len(export_data)}")
    print(f"   - 總字元數: {total_chars:,}")
    print(f"   - 平均字元數: {total_chars // len(export_data)}")


if __name__ == "__main__":
    asyncio.run(export_codsworth_interpretations())
