#!/usr/bin/env python3
"""
正確地遷移 reading_sessions 到 completed_readings

這個腳本會：
1. 找出所有 status != 'complete' 的 reading_sessions
2. 為每個 session 在 completed_readings 表中建立對應記錄
3. 更新 session 的 status 為 'complete'
"""

import os
import uuid
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

    print("正在檢查需要遷移的 reading_sessions...")

    # 獲取所有非 complete 的 sessions
    sessions_result = supabase.table('reading_sessions')\
        .select('*')\
        .neq('status', 'complete')\
        .execute()

    sessions = sessions_result.data
    print(f"\n找到 {len(sessions)} 個需要遷移的 sessions")

    if len(sessions) == 0:
        print("沒有需要遷移的 sessions")
        return

    # 顯示前 5 個 sessions 的詳細資訊
    print("\n前 5 個 sessions 的資訊：")
    for session in sessions[:5]:
        print(f"  - ID: {session['id']}")
        print(f"    Question: {session['question'][:50]}...")
        print(f"    Status: {session['status']}")
        print(f"    Created: {session['created_at']}")

    migrated_count = 0
    error_count = 0

    print(f"\n開始遷移...")

    for session in sessions:
        try:
            # 從 session_data 中提取資訊
            session_data = session.get('session_data', {})
            session_state = session_data.get('session_state', {})

            # 準備 completed_reading 的資料
            reading_data = {
                'id': str(uuid.uuid4()),  # 新的 UUID for reading
                'user_id': session['user_id'],
                'question': session['question'],
                'spread_type': session['spread_type'],
                'cards_drawn': session_state.get('cards_drawn', []),
                'interpretation': session_state.get('interpretation', ''),
                'created_at': session['created_at'],
                'updated_at': session['updated_at']
            }

            # 建立 completed_reading 記錄
            reading_result = supabase.table('completed_readings')\
                .insert(reading_data)\
                .execute()

            # 更新 session 狀態為 complete
            update_result = supabase.table('reading_sessions')\
                .update({
                    'status': 'complete',
                    'updated_at': datetime.now().isoformat()
                })\
                .eq('id', session['id'])\
                .execute()

            migrated_count += 1
            print(f"✅ 已遷移: {session['question'][:40]}...")

        except Exception as e:
            error_count += 1
            print(f"❌ 遷移失敗: {session['id']} - {str(e)}")

    print(f"\n" + "="*50)
    print(f"遷移完成！")
    print(f"  - 成功: {migrated_count} 個")
    print(f"  - 失敗: {error_count} 個")

    # 驗證結果
    print("\n驗證結果...")
    completed_readings = supabase.table('completed_readings').select('id', count='exact').execute()
    complete_sessions = supabase.table('reading_sessions')\
        .select('id', count='exact')\
        .eq('status', 'complete')\
        .execute()

    print(f"  - completed_readings 表: {completed_readings.count} 筆記錄")
    print(f"  - complete sessions: {complete_sessions.count} 個")

if __name__ == "__main__":
    main()
