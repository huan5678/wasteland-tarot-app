#!/usr/bin/env python3
"""
Supabase 連線測試腳本

測試項目：
1. 檢查環境變數配置
2. 測試 Supabase 客戶端連線
3. 驗證資料表是否存在
4. 檢查系統預設 Pattern 資料

Usage:
    python backend/scripts/test_supabase_connection.py
"""

import sys
from pathlib import Path

# 添加專案根目錄到 Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.supabase import (
    verify_supabase_connection,
    test_supabase_migrations,
    get_supabase_client
)
from app.config import settings


def print_section(title: str):
    """列印區塊標題"""
    print(f"\n{'=' * 80}")
    print(f"  {title}")
    print('=' * 80)


def print_success(message: str):
    """列印成功訊息"""
    print(f"✓ {message}")


def print_warning(message: str):
    """列印警告訊息"""
    print(f"⚠ {message}")


def print_error(message: str):
    """列印錯誤訊息"""
    print(f"✗ {message}")


def test_environment_variables():
    """測試環境變數配置"""
    print_section("1. 環境變數檢查")

    env_vars = {
        'SUPABASE_URL': settings.supabase_url,
        'SUPABASE_KEY': settings.supabase_key[:20] + '...' if len(settings.supabase_key) > 20 else settings.supabase_key,
        'SUPABASE_SERVICE_ROLE_KEY': settings.supabase_service_role_key[:20] + '...' if len(settings.supabase_service_role_key) > 20 else settings.supabase_service_role_key,
    }

    all_configured = True
    for var_name, var_value in env_vars.items():
        if var_value and 'your_' not in var_value.lower():
            print_success(f"{var_name}: {var_value}")
        else:
            print_error(f"{var_name}: 未配置或使用預設值")
            all_configured = False

    return all_configured


def test_client_connection():
    """測試客戶端連線"""
    print_section("2. Supabase 客戶端連線測試")

    try:
        client = get_supabase_client()
        if client and hasattr(client, 'auth'):
            print_success("Supabase 客戶端初始化成功")
            print_success(f"Supabase URL: {settings.supabase_url}")
            return True
        else:
            print_error("Supabase 客戶端初始化失敗")
            return False
    except Exception as e:
        print_error(f"連線失敗: {str(e)}")
        return False


def test_tables():
    """測試資料表存在性"""
    print_section("3. 資料表檢查")

    result = verify_supabase_connection()

    if result['client_initialized']:
        print_success("客戶端已初始化")
    else:
        print_error("客戶端初始化失敗")

    print("\n資料表狀態：")
    for table_name, exists in result['tables_exist'].items():
        if exists:
            print_success(f"表 '{table_name}' 存在")
        else:
            print_error(f"表 '{table_name}' 不存在")

    if result['success']:
        print_success("\n所有核心資料表檢查通過")
        return True
    else:
        print_error(f"\n資料表檢查失敗: {result['error']}")
        return False


def test_migrations():
    """測試 migrations 執行狀態"""
    print_section("4. Migrations 執行檢查")

    result = test_supabase_migrations()

    print(f"\n系統預設 Pattern 數量: {result['system_presets_count']} / 5")

    if result['system_presets_count'] == 5:
        print_success("系統預設 Pattern 資料正確")
    elif result['system_presets_count'] == 0:
        print_warning("系統預設 Pattern 未插入，請執行 migration: 20250113000004_seed_system_presets.sql")
    else:
        print_warning(f"系統預設 Pattern 數量異常（預期 5 個，實際 {result['system_presets_count']} 個）")

    if result['migrations_applied']:
        print_success("\nMigrations 已正確執行")
        return True
    else:
        if result['error']:
            print_error(f"\nMigrations 檢查失敗: {result['error']}")
        else:
            print_warning("\nMigrations 可能未完全執行")
        return False


def test_system_presets_details():
    """測試系統預設 Pattern 詳細資訊"""
    print_section("5. 系統預設 Pattern 詳細資訊")

    try:
        client = get_supabase_client()
        response = client.table('user_rhythm_presets').select('id, name, description, is_system_preset, is_public').eq('is_system_preset', True).execute()

        if response.data:
            print(f"\n找到 {len(response.data)} 個系統預設 Pattern：\n")
            for idx, preset in enumerate(response.data, 1):
                print(f"  {idx}. {preset['name']}")
                print(f"     描述: {preset['description']}")
                print(f"     ID: {preset['id']}")
                print(f"     公開: {'是' if preset['is_public'] else '否'}")
                print()

            expected_presets = {'Techno', 'House', 'Trap', 'Breakbeat', 'Minimal'}
            actual_presets = {preset['name'] for preset in response.data}

            if expected_presets == actual_presets:
                print_success("所有預期的系統預設 Pattern 都存在")
                return True
            else:
                missing = expected_presets - actual_presets
                extra = actual_presets - expected_presets
                if missing:
                    print_warning(f"缺少的 Pattern: {', '.join(missing)}")
                if extra:
                    print_warning(f"額外的 Pattern: {', '.join(extra)}")
                return False
        else:
            print_warning("未找到任何系統預設 Pattern")
            return False

    except Exception as e:
        print_error(f"查詢系統預設 Pattern 失敗: {str(e)}")
        return False


def main():
    """主測試流程"""
    print("\n" + "=" * 80)
    print("  Supabase 連線與 Migrations 測試")
    print("  Feature: playlist-music-player (v4.0)")
    print("=" * 80)

    # 執行所有測試
    results = {
        '環境變數': test_environment_variables(),
        '客戶端連線': test_client_connection(),
        '資料表': test_tables(),
        'Migrations': test_migrations(),
        '系統預設資料': test_system_presets_details(),
    }

    # 總結報告
    print_section("測試總結")

    print("\n測試結果：")
    all_passed = True
    for test_name, passed in results.items():
        status = "✓ 通過" if passed else "✗ 失敗"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "=" * 80)
    if all_passed:
        print("✓ 所有測試通過！Supabase 連線和 Migrations 配置正確。")
        print("=" * 80)
        return 0
    else:
        print("✗ 部分測試失敗，請檢查上方錯誤訊息並修正配置。")
        print("=" * 80)
        return 1


if __name__ == "__main__":
    sys.exit(main())
