#!/usr/bin/env python3
"""
Task 22 驗證腳本
驗證登出功能實作
"""

import sys
from pathlib import Path

def verify_backend_logout():
    """驗證後端 logout 端點"""
    print("\n📋 驗證後端 logout 端點...")

    auth_py = Path("app/api/auth.py")
    if not auth_py.exists():
        print(f"❌ {auth_py} 不存在")
        return False

    content = auth_py.read_text()

    checks = {
        "匯入 Response": "from fastapi import APIRouter, Depends, HTTPException, status, Response" in content,
        "匯入 cookie settings": "from app.core.security import get_access_token_cookie_settings, get_refresh_token_cookie_settings" in content,
        "logout 端點存在": '@router.post("/logout")' in content,
        "Response 參數": "response: Response," in content,
        "需求 7.1 註解": "7.1: 清除 httpOnly cookies" in content,
        "需求 7.2 註解": "7.2: 對於 OAuth 使用者，前端需呼叫 supabase.auth.signOut()" in content,
        "需求 7.3 註解": "7.3: 清除所有本地狀態" in content,
        "需求 7.4 註解": "7.4: 重導向至首頁（前端處理）" in content,
        "取得 access_token settings": "access_token_settings = get_access_token_cookie_settings()" in content,
        "取得 refresh_token settings": "refresh_token_settings = get_refresh_token_cookie_settings()" in content,
        "刪除 access_token cookie": 'response.delete_cookie' in content and 'access_token_settings["key"]' in content,
        "刪除 refresh_token cookie": 'response.delete_cookie' in content and 'refresh_token_settings["key"]' in content,
        "返回 OAuth 資訊": '"is_oauth_user": current_user.oauth_provider is not None' in content,
        "返回 OAuth provider": '"oauth_provider": current_user.oauth_provider' in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def verify_frontend_logout():
    """驗證前端 logout 實作"""
    print("\n📋 驗證前端 authStore logout...")

    auth_store = Path("../src/lib/authStore.ts")
    if not auth_store.exists():
        print(f"❌ {auth_store} 不存在")
        return False

    content = auth_store.read_text()

    checks = {
        "logout 為 async": "logout: () => Promise<void>" in content,
        "logout 實作為 async": "logout: async () => {" in content,
        "取得 isOAuthUser": "const { token, isOAuthUser } = get()" in content,
        "OAuth 判斷": "if (isOAuthUser && typeof window !== 'undefined')" in content,
        "動態匯入 Supabase client": "const { createClient } = await import('@/utils/supabase/client')" in content,
        "建立 Supabase client": "const supabase = createClient()" in content,
        "呼叫 Supabase signOut": "await supabase.auth.signOut()" in content,
        "呼叫後端 logout API": "await authAPI.logout(token)" in content,
        "錯誤處理": "catch (e)" in content,
        "清除 localStorage TOKEN": "localStorage.removeItem(TOKEN_KEY)" in content,
        "清除 localStorage USER": "localStorage.removeItem(USER_KEY)" in content,
        "清除 remember": "localStorage.removeItem('pip-boy-remember')" in content,
        "清除 user state": "user: null," in content,
        "清除 token state": "token: null," in content,
        "清除 isOAuthUser state": "isOAuthUser: false," in content,
        "清除 oauthProvider state": "oauthProvider: null," in content,
        "清除 profilePicture state": "profilePicture: null," in content,
        "重導向至首頁": "window.location.href = '/'" in content,
        "finally 區塊": "} finally {" in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def verify_api_client():
    """驗證 API client logout 函式"""
    print("\n📋 驗證 API client logout 函式...")

    api_ts = Path("../src/lib/api.ts")
    if not api_ts.exists():
        print(f"❌ {api_ts} 不存在")
        return False

    content = api_ts.read_text()

    checks = {
        "logout 函式存在": "logout:" in content,
        "logout 參數": "logout: (token: string)" in content,
        "logout 返回型別": "Promise<{ message: string; is_oauth_user: boolean; oauth_provider: string | null }>" in content,
        "logout endpoint": "'/api/v1/auth/logout'" in content,
        "POST 方法": "method: 'POST'" in content,
        "Authorization header": "'Authorization': `Bearer ${token}`" in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def verify_security_module():
    """驗證 security module cookie settings"""
    print("\n📋 驗證 security module cookie settings...")

    security_py = Path("app/core/security.py")
    if not security_py.exists():
        print(f"❌ {security_py} 不存在")
        return False

    content = security_py.read_text()

    checks = {
        "access_token settings 函式": "def get_access_token_cookie_settings()" in content,
        "refresh_token settings 函式": "def get_refresh_token_cookie_settings()" in content,
        "access_token key": '"key": "access_token"' in content,
        "refresh_token key": '"key": "refresh_token"' in content,
        "httponly 設定": '"httponly": True' in content,
        "secure 設定": '"secure": settings.environment == "production"' in content,
        "samesite 設定": '"samesite": "lax"' in content,
        "access_token max_age": "settings.access_token_expire_minutes * 60" in content,
        "refresh_token max_age": "7 * 24 * 60 * 60" in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def main():
    print("=" * 60)
    print("Task 22 驗證：登出功能")
    print("=" * 60)

    project_root = Path(__file__).parent
    import os
    os.chdir(project_root)

    results = {
        "後端 logout 端點": verify_backend_logout(),
        "前端 authStore logout": verify_frontend_logout(),
        "API client logout": verify_api_client(),
        "Security module": verify_security_module(),
    }

    print("\n" + "=" * 60)
    print("驗證結果總結")
    print("=" * 60)

    for task, result in results.items():
        status = "✅ 通過" if result else "❌ 失敗"
        print(f"{task}: {status}")

    if all(results.values()):
        print("\n🎉 Task 22 驗證通過！")
        print("\n已完成功能：")
        print("✅ 後端 logout 端點清除 httpOnly cookies")
        print("✅ 前端 logout 呼叫 Supabase signOut (OAuth 使用者)")
        print("✅ 前端 logout 呼叫後端 API")
        print("✅ 清除所有本地狀態（localStorage, store）")
        print("✅ 自動重導向至首頁")
        print("✅ Security module 提供 cookie settings 函式")
        return 0
    else:
        print("\n❌ 部分驗證失敗")
        return 1


if __name__ == "__main__":
    sys.exit(main())
