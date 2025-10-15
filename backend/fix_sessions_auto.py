#!/usr/bin/env python3
"""
自動修正所有舊的 reading_sessions，將它們標記為 complete
"""

import os
from datetime import datetime
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = "https://aelwaolzpraxmzjqdiyw.supabase.co"
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_SERVICE_KEY:
    print("❌ 請設定 SUPABASE_SERVICE_ROLE_KEY 環境變數")
    exit(1)

def main():
    # Create Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    print("正在檢查 reading_sessions...")

    # 先查看目前的狀態分佈
    result = supabase.table('reading_sessions').select('status', count='exact').execute()
    print(f"\n更新前：總共有 {result.count} 個 sessions")

    # 查看每個狀態的數量
    for status in ['active', 'paused', 'complete']:
        result = supabase.table('reading_sessions')\
            .select('id', count='exact')\
            .eq('status', status)\
            .execute()
        print(f"  - {status}: {result.count} 個")

    # 自動更新所有非 complete 的 sessions
    print("\n開始自動更新...")

    # Update active sessions
    active_result = supabase.table('reading_sessions')\
        .update({'status': 'complete', 'updated_at': datetime.now().isoformat()})\
        .eq('status', 'active')\
        .execute()

    # Update paused sessions
    paused_result = supabase.table('reading_sessions')\
        .update({'status': 'complete', 'updated_at': datetime.now().isoformat()})\
        .eq('status', 'paused')\
        .execute()

    print(f"\n✅ 更新完成！")

    # 再次查看狀態
    print("\n更新後的狀態分佈：")
    for status in ['active', 'paused', 'complete']:
        result = supabase.table('reading_sessions')\
            .select('id', count='exact')\
            .eq('status', status)\
            .execute()
        print(f"  - {status}: {result.count} 個")

    print("\n現在重新載入 dashboard 頁面，應該不會再看到未完成的占卜了！")

if __name__ == "__main__":
    main()
