#!/usr/bin/env python3
"""
環境變數檢查腳本 - Passkey 無密碼認證系統

檢查所有必要的環境變數是否已正確設定。
用於部署前驗證和 CI/CD pipeline。

Usage:
    python scripts/check_env.py
"""

import os
import sys
from typing import List, Tuple

# ANSI 顏色碼
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'
BOLD = '\033[1m'


def print_success(message: str):
    """Print success message in green"""
    print(f"{GREEN}✅ {message}{RESET}")


def print_warning(message: str):
    """Print warning message in yellow"""
    print(f"{YELLOW}⚠️  {message}{RESET}")


def print_error(message: str):
    """Print error message in red"""
    print(f"{RED}❌ {message}{RESET}")


def print_section(title: str):
    """Print section header"""
    print(f"\n{BOLD}{'=' * 60}{RESET}")
    print(f"{BOLD}{title}{RESET}")
    print(f"{BOLD}{'=' * 60}{RESET}")


# 必要環境變數（缺少任何一個都會失敗）
REQUIRED_VARS = [
    ("DATABASE_URL", "PostgreSQL 連線字串", "postgresql://user:password@localhost:5432/wasteland_tarot"),
    ("REDIS_URL", "Redis 連線字串", "redis://localhost:6379/0"),
    ("SECRET_KEY", "JWT 簽章密鑰", "至少 32 字元的隨機字串"),
    ("ENVIRONMENT", "執行環境", "development 或 production"),
]

# WebAuthn 專用環境變數（Passkey 功能必要）
WEBAUTHN_VARS = [
    ("WEBAUTHN_ENABLED", "WebAuthn 功能開關", "true 或 false"),
    ("WEBAUTHN_RP_NAME", "Relying Party 名稱", "Wasteland Tarot"),
    ("WEBAUTHN_RP_ID", "Relying Party ID", "wastelandtarot.com（不含 https://）"),
    ("WEBAUTHN_ORIGIN", "Origin URL", "https://wastelandtarot.com（含 https://）"),
]

# 可選環境變數（建議設定但非必要）
OPTIONAL_VARS = [
    ("BACKEND_CORS_ORIGINS", "允許的 CORS origins", "https://wastelandtarot.com,https://www.wastelandtarot.com"),
    ("SENTRY_DSN", "Sentry 錯誤監控 DSN", "https://xxx@sentry.io/xxx（可選）"),
    ("LOG_LEVEL", "日誌級別", "INFO, WARNING, ERROR, CRITICAL"),
    ("ACCESS_TOKEN_EXPIRE_MINUTES", "Access Token 有效期限（分鐘）", "30（預設）"),
    ("REFRESH_TOKEN_EXPIRE_DAYS", "Refresh Token 有效期限（天）", "7（預設）"),
    ("WEBAUTHN_CHALLENGE_TIMEOUT", "Challenge 有效期限（秒）", "300（預設 5 分鐘）"),
]


def check_required_vars() -> Tuple[List[str], List[str]]:
    """
    檢查必要環境變數

    Returns:
        (missing_vars, warnings): 缺少的變數列表和警告列表
    """
    print_section("檢查必要環境變數")

    missing = []
    warnings = []

    for var_name, description, example in REQUIRED_VARS:
        value = os.getenv(var_name)

        if not value:
            print_error(f"{var_name} 未設定")
            print(f"  說明: {description}")
            print(f"  範例: {example}\n")
            missing.append(var_name)
        else:
            print_success(f"{var_name} = {value[:50]}{'...' if len(value) > 50 else ''}")

            # 額外檢查
            if var_name == "SECRET_KEY" and len(value) < 32:
                warning_msg = f"{var_name} 長度不足 32 字元（目前 {len(value)} 字元）"
                print_warning(warning_msg)
                warnings.append(warning_msg)

            if var_name == "ENVIRONMENT" and value not in ["development", "production"]:
                warning_msg = f"{var_name} 值應為 'development' 或 'production'（目前: {value}）"
                print_warning(warning_msg)
                warnings.append(warning_msg)

    return missing, warnings


def check_webauthn_vars() -> Tuple[List[str], List[str]]:
    """
    檢查 WebAuthn 專用環境變數

    Returns:
        (missing_vars, warnings): 缺少的變數列表和警告列表
    """
    print_section("檢查 WebAuthn 專用環境變數")

    missing = []
    warnings = []

    webauthn_enabled = os.getenv("WEBAUTHN_ENABLED", "false").lower() == "true"

    if not webauthn_enabled:
        print_warning("WEBAUTHN_ENABLED 未啟用，跳過 WebAuthn 變數檢查")
        return missing, warnings

    for var_name, description, example in WEBAUTHN_VARS:
        value = os.getenv(var_name)

        if not value:
            print_error(f"{var_name} 未設定")
            print(f"  說明: {description}")
            print(f"  範例: {example}\n")
            missing.append(var_name)
        else:
            print_success(f"{var_name} = {value}")

            # 額外檢查
            if var_name == "WEBAUTHN_ORIGIN":
                if not value.startswith("https://") and os.getenv("ENVIRONMENT") == "production":
                    warning_msg = "Production 環境必須使用 HTTPS（WEBAUTHN_ORIGIN 應以 https:// 開頭）"
                    print_error(warning_msg)
                    warnings.append(warning_msg)

            if var_name == "WEBAUTHN_RP_ID":
                if value.startswith("http://") or value.startswith("https://"):
                    warning_msg = "WEBAUTHN_RP_ID 不應包含協議（http:// 或 https://），只需 domain"
                    print_warning(warning_msg)
                    warnings.append(warning_msg)

    return missing, warnings


def check_optional_vars() -> List[str]:
    """
    檢查可選環境變數

    Returns:
        warnings: 警告列表
    """
    print_section("檢查可選環境變數（建議但非必要）")

    warnings = []

    for var_name, description, example in OPTIONAL_VARS:
        value = os.getenv(var_name)

        if not value:
            print_warning(f"{var_name} 未設定（可選）")
            print(f"  說明: {description}")
            print(f"  範例: {example}\n")
        else:
            print_success(f"{var_name} = {value[:50]}{'...' if len(value) > 50 else ''}")

            # 額外檢查
            if var_name == "BACKEND_CORS_ORIGINS":
                origins = value.split(",")
                for origin in origins:
                    if not origin.startswith("http://") and not origin.startswith("https://"):
                        warning_msg = f"CORS origin 應包含協議: {origin}"
                        print_warning(warning_msg)
                        warnings.append(warning_msg)

    return warnings


def check_production_requirements():
    """檢查 Production 環境的額外需求"""
    environment = os.getenv("ENVIRONMENT")

    if environment != "production":
        return

    print_section("檢查 Production 環境額外需求")

    # HTTPS 檢查
    webauthn_origin = os.getenv("WEBAUTHN_ORIGIN", "")
    if webauthn_origin and not webauthn_origin.startswith("https://"):
        print_error("Production 環境必須使用 HTTPS")
        print("  WEBAUTHN_ORIGIN 應以 https:// 開頭\n")
        return False

    # CORS 嚴格檢查
    cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "")
    if not cors_origins or cors_origins == "*":
        print_error("Production 環境不應使用 wildcard CORS（*）")
        print("  請設定具體的 CORS origins\n")
        return False

    # Redis 檢查（Production 建議使用 Redis 而非記憶體儲存）
    redis_url = os.getenv("REDIS_URL", "")
    if not redis_url:
        print_warning("Production 環境建議使用 Redis（Rate Limiting、Challenge Store）")
        print("  目前未設定 REDIS_URL\n")

    print_success("Production 環境檢查通過")
    return True


def print_summary(missing_required: List[str], all_warnings: List[str]):
    """Print summary of checks"""
    print_section("檢查總結")

    if missing_required:
        print_error(f"缺少 {len(missing_required)} 個必要環境變數:")
        for var in missing_required:
            print(f"  - {var}")
        print()

    if all_warnings:
        print_warning(f"發現 {len(all_warnings)} 個警告:")
        for i, warning in enumerate(all_warnings, 1):
            print(f"  {i}. {warning}")
        print()

    if not missing_required and not all_warnings:
        print_success("所有環境變數檢查通過！")
        print()
        print("🎉 你的環境已準備就緒，可以部署 Passkey 系統了！")
        print()
        return True
    elif not missing_required:
        print_warning("必要環境變數已設定，但有一些警告需要注意")
        print()
        return True
    else:
        print_error("請設定缺少的環境變數後再次執行此腳本")
        print()
        return False


def main():
    """Main function"""
    print(f"\n{BOLD}Wasteland Tarot - Passkey 環境變數檢查工具{RESET}")
    print("檢查部署前環境變數配置...")

    # 檢查必要變數
    missing_required, warnings_required = check_required_vars()

    # 檢查 WebAuthn 變數
    missing_webauthn, warnings_webauthn = check_webauthn_vars()

    # 檢查可選變數
    warnings_optional = check_optional_vars()

    # Production 環境額外檢查
    if os.getenv("ENVIRONMENT") == "production":
        check_production_requirements()

    # 彙整所有結果
    all_missing = missing_required + missing_webauthn
    all_warnings = warnings_required + warnings_webauthn + warnings_optional

    # 印出總結
    success = print_summary(all_missing, all_warnings)

    # 結束程式
    if not success:
        sys.exit(1)  # 失敗
    elif all_warnings:
        sys.exit(2)  # 警告
    else:
        sys.exit(0)  # 成功


if __name__ == "__main__":
    main()
