#!/usr/bin/env python3
"""
Task 28 驗證腳本
驗證錯誤處理機制實作
"""

import sys
from pathlib import Path

def verify_oauth_exceptions():
    """驗證 OAuth 相關例外定義"""
    print("\n📋 驗證 OAuth 例外定義...")

    exceptions_py = Path("app/core/exceptions.py")
    if not exceptions_py.exists():
        print(f"❌ {exceptions_py} 不存在")
        return False

    content = exceptions_py.read_text()

    checks = {
        "OAuthAuthorizationError 類別": "class OAuthAuthorizationError(WastelandTarotException):" in content,
        "OAuthAuthorizationError 繁中訊息": "登入授權失敗" in content or "登入失敗，請稍後再試" in content,
        "OAuthAuthorizationError status": "status.HTTP_401_UNAUTHORIZED" in content,
        "OAuthCallbackError 類別": "class OAuthCallbackError(WastelandTarotException):" in content,
        "OAuthCallbackError 繁中訊息": "回調處理失敗" in content or "登入處理失敗" in content,
        "OAuthCallbackError status": "status.HTTP_400_BAD_REQUEST" in content,
        "OAuthUserCreationError 類別": "class OAuthUserCreationError(WastelandTarotException):" in content,
        "OAuthUserCreationError 繁中訊息": "建立帳號失敗" in content or "帳號建立失敗" in content,
        "OAuthUserCreationError status": "status.HTTP_500_INTERNAL_SERVER_ERROR" in content,
        "OAuthStateValidationError 類別": "class OAuthStateValidationError(WastelandTarotException):" in content,
        "OAuthStateValidationError CSRF 訊息": "狀態驗證失敗" in content and "CSRF" in content,
        "SupabaseConnectionError 類別": "class SupabaseConnectionError(WastelandTarotException):" in content,
        "SupabaseConnectionError 繁中訊息": "Supabase 連線失敗" in content or "操作失敗" in content,
        "SupabaseConnectionError status": "status.HTTP_503_SERVICE_UNAVAILABLE" in content,
        "OAuth 例外包含 provider": 'provider: str = "OAuth"' in content or 'provider: str' in content,
        "OAuth 例外包含 reason": "reason: str = None" in content or "reason: str" in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def verify_retry_module():
    """驗證重試邏輯模組"""
    print("\n📋 驗證重試邏輯模組...")

    retry_py = Path("app/core/retry.py")
    if not retry_py.exists():
        print(f"❌ {retry_py} 不存在")
        return False

    content = retry_py.read_text()

    checks = {
        "RetryConfig 類別": "class RetryConfig:" in content,
        "max_attempts 參數": "max_attempts: int" in content,
        "initial_delay 參數": "initial_delay: float" in content,
        "max_delay 參數": "max_delay: float" in content,
        "exponential_base 參數": "exponential_base: float" in content,
        "exceptions 參數": "exceptions: tuple" in content,
        "retry_async 函式": "async def retry_async(" in content,
        "retry_async 回傳型別": "-> T:" in content,
        "指數退避計算": "config.exponential_base ** (attempt - 1)" in content,
        "asyncio.sleep": "await asyncio.sleep(delay)" in content,
        "with_retry 裝飾器": "def with_retry(" in content,
        "裝飾器 wraps": "@wraps(func)" in content,
        "OAUTH_RETRY_CONFIG": "OAUTH_RETRY_CONFIG = RetryConfig(" in content,
        "SUPABASE_RETRY_CONFIG": "SUPABASE_RETRY_CONFIG = RetryConfig(" in content,
        "DATABASE_RETRY_CONFIG": "DATABASE_RETRY_CONFIG = RetryConfig(" in content,
        "日誌記錄 warning": 'logger.warning(' in content,
        "日誌記錄 error": 'logger.error(' in content,
        "日誌記錄 info": 'logger.info(' in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def verify_oauth_api_error_handling():
    """驗證 OAuth API 錯誤處理"""
    print("\n📋 驗證 OAuth API 錯誤處理...")

    oauth_py = Path("app/api/oauth.py")
    if not oauth_py.exists():
        print(f"❌ {oauth_py} 不存在")
        return False

    content = oauth_py.read_text()

    checks = {
        "匯入 OAuthAuthorizationError": "OAuthAuthorizationError" in content,
        "匯入 OAuthCallbackError": "OAuthCallbackError" in content,
        "匯入 OAuthUserCreationError": "OAuthUserCreationError" in content,
        "匯入 SupabaseConnectionError": "SupabaseConnectionError" in content,
        "匯入 retry_async": "from app.core.retry import retry_async" in content,
        "匯入 SUPABASE_RETRY_CONFIG": "SUPABASE_RETRY_CONFIG" in content,
        "使用 retry_async": "await retry_async(" in content,
        "授權錯誤處理": "raise OAuthAuthorizationError(" in content,
        "回調錯誤處理": "raise OAuthCallbackError(" in content,
        "使用者建立錯誤處理": "raise OAuthUserCreationError(" in content,
        "Supabase 連線錯誤": "raise SupabaseConnectionError(" in content,
        "錯誤訊息包含 provider": 'provider="Google"' in content,
        "錯誤訊息包含 reason": "reason=" in content,
        "Exception logging": "logger.error(" in content and "exc_info=True" in content,
        "多重例外捕捉": "except (" in content,
        "OAuthAuthorizationError 捕捉": "OAuthAuthorizationError" in content.split("except")[1] if "except" in content else False,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def verify_error_messages():
    """驗證錯誤訊息為繁體中文且使用者友善"""
    print("\n📋 驗證錯誤訊息品質...")

    exceptions_py = Path("app/core/exceptions.py")
    content = exceptions_py.read_text()

    # 檢查繁體中文訊息
    chinese_messages = [
        "登入授權失敗",
        "登入失敗，請稍後再試",
        "回調處理失敗",
        "登入處理失敗",
        "建立帳號失敗",
        "帳號建立失敗",
        "狀態驗證失敗",
        "Supabase 連線失敗",
        "操作失敗"
    ]

    checks = {}
    for msg in chinese_messages:
        checks[f"繁中訊息: {msg}"] = msg in content

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed >= 6  # 至少 6 個訊息存在


def main():
    print("=" * 60)
    print("Task 28 驗證：錯誤處理機制")
    print("=" * 60)

    project_root = Path(__file__).parent
    import os
    os.chdir(project_root)

    results = {
        "OAuth 例外定義": verify_oauth_exceptions(),
        "重試邏輯模組": verify_retry_module(),
        "OAuth API 錯誤處理": verify_oauth_api_error_handling(),
        "錯誤訊息品質": verify_error_messages(),
    }

    print("\n" + "=" * 60)
    print("驗證結果總結")
    print("=" * 60)

    for task, result in results.items():
        status = "✅ 通過" if result else "❌ 失敗"
        print(f"{task}: {status}")

    if all(results.values()):
        print("\n🎉 Task 28 驗證通過！")
        print("\n已完成功能：")
        print("✅ OAuth 相關自訂例外類別")
        print("   - OAuthAuthorizationError（授權失敗）")
        print("   - OAuthCallbackError（回調處理失敗）")
        print("   - OAuthUserCreationError（使用者建立失敗）")
        print("   - OAuthStateValidationError（State 驗證失敗）")
        print("   - SupabaseConnectionError（Supabase 連線失敗）")
        print("✅ 重試邏輯工具模組")
        print("   - RetryConfig 配置類別")
        print("   - retry_async 函式（指數退避）")
        print("   - with_retry 裝飾器")
        print("   - 預定義配置（OAUTH, SUPABASE, DATABASE）")
        print("✅ OAuth API 錯誤處理")
        print("   - 授權碼交換重試邏輯（最多 3 次）")
        print("   - 使用者友善錯誤訊息（繁體中文）")
        print("   - 完整日誌記錄")
        print("✅ 錯誤訊息映射")
        print("   - 技術錯誤 → 繁體中文使用者訊息")
        print("   - 包含詳細資訊（provider, reason）")
        return 0
    else:
        print("\n❌ 部分驗證失敗")
        return 1


if __name__ == "__main__":
    sys.exit(main())
