#!/usr/bin/env python3
"""
Supabase Migrations 執行腳本
Feature: playlist-music-player (v4.0)

使用 Supabase Python SDK 直接執行 SQL migrations
"""

import os
import sys
from pathlib import Path
from supabase import create_client, Client

# 顏色定義
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_header(text: str):
    print(f"\n{'=' * 80}")
    print(f"  {text}")
    print(f"{'=' * 80}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✓{Colors.NC} {text}")

def print_error(text: str):
    print(f"{Colors.RED}✗{Colors.NC} {text}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠{Colors.NC} {text}")

def execute_sql_file(client: Client, file_path: Path, migration_name: str):
    """執行單一 SQL migration 檔案"""
    print(f"\n執行 Migration: {migration_name}")
    print(f"檔案: {file_path}")

    try:
        # 讀取 SQL 檔案內容
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        print(f"  SQL 內容長度: {len(sql_content)} 字元")

        # 使用 Supabase PostgREST 的 rpc 功能執行 SQL
        # 注意：這需要在 Supabase 中建立一個 exec_sql 函式
        # 或者我們可以分批執行 SQL 語句

        # 將 SQL 分割成多個語句（以 ';' 分隔）
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]

        print(f"  總共 {len(statements)} 個 SQL 語句")

        executed_count = 0
        for i, stmt in enumerate(statements, 1):
            # 跳過註解和空語句
            if stmt.startswith('--') or stmt.startswith('/*') or not stmt:
                continue

            try:
                # 使用 supabase-py 的 postgrest 執行 SQL
                # 注意：這可能需要特殊權限
                response = client.postgrest.rpc('exec_sql', {'query': stmt}).execute()
                executed_count += 1
            except Exception as stmt_error:
                # 某些語句可能會失敗（例如表已存在），這是正常的
                error_msg = str(stmt_error)
                if 'already exists' in error_msg.lower():
                    print(f"    語句 {i}: 已存在，跳過")
                else:
                    print_warning(f"    語句 {i} 執行失敗: {error_msg[:100]}")

        print_success(f"Migration 執行完成！成功執行 {executed_count} 個語句")
        return True

    except Exception as e:
        print_error(f"Migration 執行失敗: {str(e)}")
        return False

def main():
    print_header("Supabase Migrations 執行腳本")
    print("Feature: playlist-music-player (v4.0)\n")

    # 檢查環境變數
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not supabase_key:
        print_error("缺少環境變數")
        print("請設定以下環境變數：")
        print("  export SUPABASE_URL='https://your-project.supabase.co'")
        print("  export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'")
        sys.exit(1)

    print_success(f"環境變數檢查通過")
    print(f"  SUPABASE_URL: {supabase_url}\n")

    # 建立 Supabase 客戶端
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print_success("Supabase 客戶端初始化成功\n")
    except Exception as e:
        print_error(f"Supabase 客戶端初始化失敗: {e}")
        sys.exit(1)

    # Migration 檔案列表（依序執行）
    project_root = Path(__file__).parent.parent.parent
    migrations_dir = project_root / 'backend' / 'supabase' / 'migrations'

    migrations = [
        ('20250113000000_create_user_rhythm_presets.sql', 'user_rhythm_presets 表'),
        ('20250113000002_create_playlist_patterns.sql', 'playlist_patterns 表'),
        ('20250113000003_create_rls_policies.sql', 'RLS Policies'),
        ('20250113000004_seed_system_presets.sql', '系統預設 Pattern'),
    ]

    print_header("開始執行 Migrations")

    success_count = 0
    for filename, description in migrations:
        file_path = migrations_dir / filename

        if not file_path.exists():
            print_error(f"檔案不存在: {filename}")
            continue

        if execute_sql_file(supabase, file_path, f"{description} ({filename})"):
            success_count += 1

    print_header("執行結果")
    print(f"成功: {success_count} / {len(migrations)}")

    if success_count == len(migrations):
        print_success("所有 Migrations 執行完成！\n")

        # 執行驗證測試
        print("\n執行驗證測試...")
        os.system('python backend/scripts/test_supabase_connection.py')
    else:
        print_warning(f"部分 Migrations 執行失敗，請檢查錯誤訊息\n")
        sys.exit(1)

if __name__ == '__main__':
    main()
