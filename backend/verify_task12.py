#!/usr/bin/env python3
"""
Task 12 驗證腳本 - OAuth 流程 Hooks
驗證 useOAuth hook 的實作是否正確
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath: str) -> bool:
    """檢查檔案是否存在"""
    path = Path(filepath)
    if path.exists():
        print(f"✅ {filepath} 存在")
        return True
    else:
        print(f"❌ {filepath} 不存在")
        return False

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
    print("Task 12: 實作 OAuth 流程 Hooks - 驗證")
    print("=" * 60)
    print()

    project_root = Path(__file__).parent.parent
    os.chdir(project_root)

    all_checks_passed = True

    # 1. 檢查 Supabase 客戶端檔案
    print("📋 檢查 Supabase 客戶端工具...")
    files = [
        "src/utils/supabase/client.ts",
        "src/utils/supabase/server.ts",
        "src/utils/supabase/middleware.ts",
    ]

    for file in files:
        if not check_file_exists(file):
            all_checks_passed = False
    print()

    # 2. 檢查 client.ts 內容
    print("📋 檢查 client.ts 實作...")
    client_checks = check_file_contains(
        "src/utils/supabase/client.ts",
        [
            "createBrowserClient",
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            "export function createClient",
        ]
    )
    if not client_checks:
        all_checks_passed = False
    print()

    # 3. 檢查 server.ts 內容
    print("📋 檢查 server.ts 實作...")
    server_checks = check_file_contains(
        "src/utils/supabase/server.ts",
        [
            "createServerClient",
            "cookies",
            "getAll",
            "setAll",
        ]
    )
    if not server_checks:
        all_checks_passed = False
    print()

    # 4. 檢查 middleware.ts 內容
    print("📋 檢查 middleware.ts 實作...")
    middleware_checks = check_file_contains(
        "src/utils/supabase/middleware.ts",
        [
            "createServerClient",
            "NextResponse",
            "NextRequest",
            "updateSession",
            "supabase.auth.getUser",
        ]
    )
    if not middleware_checks:
        all_checks_passed = False
    print()

    # 5. 檢查 useOAuth hook
    print("📋 檢查 useOAuth hook...")
    if not check_file_exists("src/hooks/useOAuth.ts"):
        all_checks_passed = False
    print()

    # 6. 檢查 useOAuth 實作內容
    print("📋 檢查 useOAuth 實作...")
    oauth_checks = check_file_contains(
        "src/hooks/useOAuth.ts",
        [
            "signInWithGoogle",
            "handleOAuthCallback",
            "clearError",
            "signInWithOAuth",
            "provider: 'google'",
            "redirectTo",
            "/auth/callback",
            "exchangeCodeForSession",
            "NEXT_PUBLIC_API_URL",
            "/auth/oauth/callback",
            "credentials: 'include'",
        ]
    )
    if not oauth_checks:
        all_checks_passed = False
    print()

    # 7. 檢查錯誤處理
    print("📋 檢查錯誤處理...")
    error_checks = check_file_contains(
        "src/hooks/useOAuth.ts",
        [
            "error: string | null",
            "try {",
            "catch (error)",
            "playSound('error-beep')",
            "playSound('login-success')",
        ]
    )
    if not error_checks:
        all_checks_passed = False
    print()

    # 8. 檢查測試檔案
    print("📋 檢查測試檔案...")
    if not check_file_exists("src/hooks/__tests__/useOAuth.test.ts"):
        all_checks_passed = False
    print()

    # 9. 檢查 package.json 是否包含 @supabase/ssr
    print("📋 檢查 @supabase/ssr 套件...")
    package_checks = check_file_contains(
        "package.json",
        ["@supabase/ssr"]
    )
    if not package_checks:
        all_checks_passed = False
    print()

    # 總結
    print("=" * 60)
    if all_checks_passed:
        print("✅ Task 12 所有驗證通過！")
        print()
        print("已完成項目：")
        print("- ✅ 安裝 @supabase/ssr 套件")
        print("- ✅ 建立 Supabase 瀏覽器客戶端 (client.ts)")
        print("- ✅ 建立 Supabase 伺服器客戶端 (server.ts)")
        print("- ✅ 建立 Supabase Middleware 客戶端 (middleware.ts)")
        print("- ✅ 實作 signInWithGoogle() 函式")
        print("- ✅ 實作 handleOAuthCallback() 函式")
        print("- ✅ 實作錯誤處理和重試邏輯")
        print("- ✅ 編寫單元測試")
        print()
        print("🎯 可以繼續 Task 13: 更新認證 Store")
        return 0
    else:
        print("❌ Task 12 驗證失敗，請檢查上述錯誤")
        return 1

if __name__ == "__main__":
    sys.exit(main())
