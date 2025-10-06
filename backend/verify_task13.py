#!/usr/bin/env python3
"""
Task 13 驗證腳本 - 更新認證 Store
驗證 authStore 是否正確支援 OAuth 功能
"""

import os
import sys
from pathlib import Path

def check_file_contains(filepath: str, search_terms: list[str]) -> bool:
    """檢查檔案是否包含特定內容"""
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
    print("Task 13: 更新認證 Store - 驗證")
    print("=" * 60)
    print()

    project_root = Path(__file__).parent.parent
    os.chdir(project_root)

    all_checks_passed = True

    # 1. 檢查 User 類型定義更新
    print("📋 檢查 User 類型定義...")
    user_type_checks = check_file_contains(
        "src/lib/api.ts",
        [
            "name: string",
            "isOAuthUser?: boolean",
            "oauthProvider?: string | null",
            "profilePicture?: string | null",
        ]
    )
    if not user_type_checks:
        all_checks_passed = False
    print()

    # 2. 檢查 AuthState 介面更新
    print("📋 檢查 AuthState 介面...")
    auth_state_checks = check_file_contains(
        "src/lib/authStore.ts",
        [
            "isOAuthUser: boolean",
            "oauthProvider: string | null",
            "profilePicture: string | null",
            "setOAuthUser: (user: User, token: string) => void",
        ]
    )
    if not auth_state_checks:
        all_checks_passed = False
    print()

    # 3. 檢查 login 函式改用 email
    print("📋 檢查 login 函式...")
    login_checks = check_file_contains(
        "src/lib/authStore.ts",
        [
            "login: (email: string, password: string) => Promise<void>",
            "const isOAuth =",
            "isOAuthUser: isOAuth",
        ]
    )
    if not login_checks:
        all_checks_passed = False
    print()

    # 4. 檢查 setOAuthUser 實作
    print("📋 檢查 setOAuthUser action...")
    oauth_action_checks = check_file_contains(
        "src/lib/authStore.ts",
        [
            "setOAuthUser: (user: User, token: string) => {",
            "isOAuthUser: true",
            "oauthProvider: user.oauthProvider",
            "profilePicture: user.profilePicture",
            "'app:oauth-login'",
        ]
    )
    if not oauth_action_checks:
        all_checks_passed = False
    print()

    # 5. 檢查 logout 清除 OAuth state
    print("📋 檢查 logout 清除 OAuth 狀態...")
    logout_checks = check_file_contains(
        "src/lib/authStore.ts",
        [
            "isOAuthUser: false",
            "oauthProvider: null",
            "profilePicture: null",
        ]
    )
    if not logout_checks:
        all_checks_passed = False
    print()

    # 6. 檢查 persist 配置包含 OAuth 欄位
    print("📋 檢查 persist 配置...")
    persist_checks = check_file_contains(
        "src/lib/authStore.ts",
        [
            "partialize: (state) => ({",
            "isOAuthUser: state.isOAuthUser",
            "oauthProvider: state.oauthProvider",
            "profilePicture: state.profilePicture",
        ]
    )
    if not persist_checks:
        all_checks_passed = False
    print()

    # 總結
    print("=" * 60)
    if all_checks_passed:
        print("✅ Task 13 所有驗證通過！")
        print()
        print("已完成項目：")
        print("- ✅ 更新 User 類型定義包含 OAuth 欄位")
        print("- ✅ 新增 isOAuthUser, oauthProvider, profilePicture state")
        print("- ✅ 實作 setOAuthUser() action")
        print("- ✅ 更新 login() 支援 OAuth 會話")
        print("- ✅ 更新 logout() 清除 OAuth 狀態")
        print("- ✅ 更新 persist 配置儲存 OAuth 欄位")
        print()
        print("🎯 可以繼續 Task 14: 實作會話管理工具")
        return 0
    else:
        print("❌ Task 13 驗證失敗，請檢查上述錯誤")
        return 1

if __name__ == "__main__":
    sys.exit(main())
