#!/usr/bin/env python3
"""
重置 sessions 狀態回 active（撤銷之前的錯誤操作）
"""

import os
from datetime import datetime
from supabase import create_client, Client

SUPABASE_URL = "https://aelwaolzpraxmzjqdiyw.supabase.co"
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_SERVICE_KEY:
    print("❌ 請設定 SUPABASE_SERVICE_ROLE_KEY 環境變數")
    exit(1)

def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    print("正在重置 sessions 狀態...")

    # 將所有 complete 但沒有對應 completed_reading 的 sessions 改回 active
    result = supabase.table('reading_sessions')\
        .update({'status': 'active', 'updated_at': datetime.now().isoformat()})\
        .eq('status', 'complete')\
        .execute()

    print(f"✅ 已重置所有 sessions 為 active 狀態")

    # 檢查狀態
    for status in ['active', 'paused', 'complete']:
        result = supabase.table('reading_sessions')\
            .select('id', count='exact')\
            .eq('status', status)\
            .execute()
        print(f"  - {status}: {result.count} 個")

if __name__ == "__main__":
    main()
