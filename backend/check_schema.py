from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# 嘗試插入一張測試卡片來看錯誤訊息
test_card = {
    "id": "test_card",
    "name": "測試卡片",
    "suit": "major_arcana",
    "number": 0,
    "upright_meaning": "測試",
    "reversed_meaning": "測試"
}

try:
    result = supabase.table('wasteland_cards').insert(test_card).execute()
    print("✅ 插入成功！")
    print("欄位：", result.data[0].keys())
    # 刪除測試卡片
    supabase.table('wasteland_cards').delete().eq('id', 'test_card').execute()
except Exception as e:
    print("❌ 錯誤：", e)
