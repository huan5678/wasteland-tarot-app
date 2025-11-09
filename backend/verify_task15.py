#!/usr/bin/env python3
"""
Task 15 驗證腳本 - 更新 LoginForm 元件
"""

import os
import sys
from pathlib import Path

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
    print("Task 15: 更新 LoginForm 元件 - 驗證")
    print("=" * 60)
    print()

    project_root = Path(__file__).parent.parent
    os.chdir(project_root)

    all_checks_passed = True

    # 1. 檢查 import useOAuth
    print("📋 檢查 import...")
    import_checks = check_file_contains(
        "src/components/auth/LoginForm.tsx",
        [
            "import { useOAuth } from '@/hooks/useOAuth'",
        ]
    )
    if not import_checks:
        all_checks_passed = False
    print()

    # 2. 檢查 email 欄位取代 username
    print("📋 檢查 email 欄位...")
    email_checks = check_file_contains(
        "src/components/auth/LoginForm.tsx",
        [
            "email: string",
            "id=\"email\"",
            "type=\"email\"",
            "Email 信箱",
            "formData.email",
        ]
    )
    if not email_checks:
        all_checks_passed = False
    print()

    # 3. 檢查 email 驗證
    print("📋 檢查 email 驗證...")
    validation_checks = check_file_contains(
        "src/components/auth/LoginForm.tsx",
        [
            "if (!formData.email)",
            "/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/",
            "無效的 Email 格式",
        ]
    )
    if not validation_checks:
        all_checks_passed = False
    print()

    # 4. 檢查 login 使用 email
    print("📋 檢查 login 函式使用 email...")
    login_checks = check_file_contains(
        "src/components/auth/LoginForm.tsx",
        [
            "await login(formData.email, formData.password)",
        ]
    )
    if not login_checks:
        all_checks_passed = False
    print()

    # 5. 檢查 OAuth 錯誤處理
    print("📋 檢查 OAuth 錯誤處理...")
    oauth_error_checks = check_file_contains(
        "src/components/auth/LoginForm.tsx",
        [
            "OAuth",
            "Google",
            "此帳號使用 Google 登入",
        ]
    )
    if not oauth_error_checks:
        all_checks_passed = False
    print()

    # 6. 檢查 Google 登入按鈕
    print("📋 檢查 Google 登入按鈕...")
    google_button_checks = check_file_contains(
        "src/components/auth/LoginForm.tsx",
        [
            "handleGoogleLogin",
            "signInWithGoogle",
            "使用 Google 登入",
            "onClick={handleGoogleLogin}",
        ]
    )
    if not google_button_checks:
        all_checks_passed = False
    print()

    # 7. 檢查分隔線
    print("📋 檢查分隔線...")
    divider_checks = check_file_contains(
        "src/components/auth/LoginForm.tsx",
        [
            "或",
            "Divider",
        ]
    )
    if not divider_checks:
        all_checks_passed = False
    print()

    # 8. 檢查載入狀態
    print("📋 檢查載入狀態...")
    loading_checks = check_file_contains(
        "src/components/auth/LoginForm.tsx",
        [
            "oauthLoading",
            "連接 Google...",
        ]
    )
    if not loading_checks:
        all_checks_passed = False
    print()

    # 總結
    print("=" * 60)
    if all_checks_passed:
        print("✅ Task 15 所有驗證通過！")
        print()
        print("已完成項目：")
        print("- ✅ 匯入 useOAuth hook")
        print("- ✅ 將 username 欄位改為 email")
        print("- ✅ 新增 email 格式驗證")
        print("- ✅ 更新表單提交使用 email")
        print("- ✅ 處理 OAuth 使用者錯誤訊息")
        print("- ✅ 新增「使用 Google 登入」按鈕")
        print("- ✅ 新增分隔線 UI")
        print("- ✅ 顯示載入狀態")
        print()
        print("🎯 可以繼續 Task 16: 更新 RegisterForm 元件")
        return 0
    else:
        print("❌ Task 15 驗證失敗，請檢查上述錯誤")
        return 1

if __name__ == "__main__":
    sys.exit(main())
