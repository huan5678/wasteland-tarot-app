from supabase import create_client
import os
import uuid
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# 嘗試插入一張簡單的測試卡片
test_card = {
    "id": str(uuid.uuid4()),
    "name": "測試卡片",
    "suit": "major_arcana",
    "number": 0,
    "upright_meaning": "測試正位",
    "reversed_meaning": "測試逆位"
}

try:
    result = supabase.table('wasteland_cards').insert(test_card).execute()
    print("✅ 基本插入成功！")
    print("可用欄位：", list(result.data[0].keys()))
    
    # 刪除測試卡片
    supabase.table('wasteland_cards').delete().eq('id', test_card['id']).execute()
    print("✅ 測試卡片已刪除")
except Exception as e:
    print("❌ 錯誤：", e)
