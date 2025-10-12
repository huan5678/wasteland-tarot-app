from supabase import create_client
import os
import uuid
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# 測試批次2的資料（應該是第4號卡片，threat_level=1）
# 根據schema，threat_level CHECK約束是 >= 1 AND <= 5
# 但我們的第4號卡片 threat_level=1 應該沒問題
# 可能是 radiation_level 或其他欄位

# 嘗試單獨插入第4號卡片看看
test_card = {
    "id": str(uuid.uuid4()),
    "name": "避難所監督測試",
    "suit": "major_arcana",
    "number": 4,
    "upright_meaning": "權威、秩序、官僚制度",
    "reversed_meaning": "專制、僵化、濫用權力",
    "radiation_level": 0.0,  # 這個可能是問題！
    "threat_level": 4
}

try:
    result = supabase.table('wasteland_cards').insert(test_card).execute()
    print("✅ 插入成功")
    supabase.table('wasteland_cards').delete().eq('id', test_card['id']).execute()
except Exception as e:
    print(f"❌ 錯誤：{e}")

# 測試 radiation_level = 0.01
test_card2 = {
    "id": str(uuid.uuid4()),
    "name": "避難所監督測試2",
    "suit": "major_arcana",
    "number": 4,
    "upright_meaning": "權威、秩序、官僚制度",
    "reversed_meaning": "專制、僵化、濫用權力",
    "radiation_level": 0.01,
    "threat_level": 4
}

try:
    result = supabase.table('wasteland_cards').insert(test_card2).execute()
    print("✅ 插入成功 (radiation_level=0.01)")
    supabase.table('wasteland_cards').delete().eq('id', test_card2['id']).execute()
except Exception as e:
    print(f"❌ 錯誤：{e}")
