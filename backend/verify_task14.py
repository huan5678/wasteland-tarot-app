#!/usr/bin/env python3
"""
Task 14 驗證腳本 - 實作會話管理工具
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath: str) -> bool:
    path = Path(filepath)
    if path.exists():
        print(f"✅ {filepath} 存在")
        return True
    else:
        print(f"❌ {filepath} 不存在")
        return False

def check_file_contains(filepath: str, search_terms: list[str]) -> bool:
    path = Path(filepath)
    if not path.exists():
        print(f"❌ {filepath} 不存在")
        return False

    content = path.read_text(encoding='utf-8')
    all_found = True

    for term in search_terms:
        if term in content:
            print(f"✅ {filepath} 包含 '{term}'")
        else:
            print(f"❌ {filepath} 缺少 '{term}'")
            all_found = False

    return all_found

def main():
    print("=" * 60)
    print("Task 14: 實作會話管理工具 - 驗證")
    print("=" * 60)
    print()

    project_root = Path(__file__).parent.parent
    os.chdir(project_root)

    all_checks_passed = True

    # 1. 檢查檔案存在
    print("📋 檢查檔案...")
    if not check_file_exists("src/lib/sessionManager.ts"):
        all_checks_passed = False
    if not check_file_exists("src/lib/__tests__/sessionManager.test.ts"):
        all_checks_passed = False
    print()

    # 2. 檢查 refreshSession 實作
    print("📋 檢查 refreshSession 實作...")
    refresh_checks = check_file_contains(
        "src/lib/sessionManager.ts",
        [
            "export async function refreshSession()",
            "supabase.auth.refreshSession()",
            "useAuthStore.getState().logout()",
            "window.location.href = '/auth/login'",
            "setOAuthUser",
        ]
    )
    if not refresh_checks:
        all_checks_passed = False
    print()

    # 3. 檢查 validateSession 實作
    print("📋 檢查 validateSession 實作...")
    validate_checks = check_file_contains(
        "src/lib/sessionManager.ts",
        [
            "export async function validateSession()",
            "supabase.auth.getSession()",
            "const fiveMinutes = 5 * 60 * 1000",
            "needsRefresh",
            "SessionStatus",
        ]
    )
    if not validate_checks:
        all_checks_passed = False
    print()

    # 4. 檢查 setupAutoRefresh 實作
    print("📋 檢查 setupAutoRefresh 實作...")
    auto_refresh_checks = check_file_contains(
        "src/lib/sessionManager.ts",
        [
            "export function setupAutoRefresh()",
            "let refreshTimer",
            "setTimeout",
            "clearTimeout",
            "return () =>",
        ]
    )
    if not auto_refresh_checks:
        all_checks_passed = False
    print()

    # 5. 檢查 setupAuthListener 實作
    print("📋 檢查 setupAuthListener 實作...")
    listener_checks = check_file_contains(
        "src/lib/sessionManager.ts",
        [
            "export function setupAuthListener()",
            "supabase.auth.onAuthStateChange",
            "SIGNED_IN",
            "SIGNED_OUT",
            "TOKEN_REFRESHED",
            "subscription.unsubscribe()",
        ]
    )
    if not listener_checks:
        all_checks_passed = False
    print()

    # 6. 檢查 initializeSessionManager
    print("📋 檢查 initializeSessionManager...")
    init_checks = check_file_contains(
        "src/lib/sessionManager.ts",
        [
            "export function initializeSessionManager()",
            "setupAutoRefresh()",
            "setupAuthListener()",
        ]
    )
    if not init_checks:
        all_checks_passed = False
    print()

    # 總結
    print("=" * 60)
    if all_checks_passed:
        print("✅ Task 14 所有驗證通過！")
        print()
        print("已完成項目：")
        print("- ✅ 實作 refreshSession() 函式")
        print("- ✅ 實作 validateSession() 函式")
        print("- ✅ 實作 setupAutoRefresh() 函式")
        print("- ✅ 實作 setupAuthListener() 函式")
        print("- ✅ 實作 initializeSessionManager() 函式")
        print("- ✅ 編寫測試檔案")
        print()
        print("🎯 可以繼續 Task 15: 更新 LoginForm 元件")
        return 0
    else:
        print("❌ Task 14 驗證失敗，請檢查上述錯誤")
        return 1

if __name__ == "__main__":
    sys.exit(main())
