#!/usr/bin/env python3
"""
檢查Supabase表格結構
Check Supabase table structure
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase connection
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def check_table_structure():
    """檢查wasteland_cards表格結構"""
    try:
        # 取得一張現有卡牌看結構
        result = supabase.table('wasteland_cards').select("*").limit(1).execute()

        if result.data:
            print("現有表格結構:")
            print("=" * 50)
            sample_card = result.data[0]
            for field, value in sample_card.items():
                print(f"  {field}: {type(value).__name__} = {value}")
        else:
            print("表格是空的")

        # 嘗試插入一個測試記錄看看哪些欄位是必需的
        print("\n嘗試插入最小測試記錄...")
        test_card = {
            "id": "test_card",
            "name": "測試卡牌",
            "suit": "MAJOR_ARCANA",
            "number": 0
        }

        try:
            test_result = supabase.table('wasteland_cards').insert(test_card).execute()
            print("✅ 最小記錄插入成功")

            # 刪除測試記錄
            supabase.table('wasteland_cards').delete().eq('id', 'test_card').execute()
            print("🗑️ 測試記錄已刪除")

        except Exception as e:
            print(f"❌ 最小記錄插入失敗: {e}")

    except Exception as e:
        print(f"❌ 檢查表格結構失敗: {e}")

if __name__ == "__main__":
    check_table_structure()