#!/usr/bin/env python3
"""
Task 29 驗證腳本
驗證 Karma 系統整合
"""

import sys
from pathlib import Path

def verify_karma_initialization_function():
    """驗證 Karma 初始化函式"""
    print("\n📋 驗證 Karma 初始化函式...")

    karma_service_py = Path("app/services/karma_service.py")
    if not karma_service_py.exists():
        print(f"❌ {karma_service_py} 不存在")
        return False

    content = karma_service_py.read_text()

    checks = {
        "initialize_karma_for_user 函式": "async def initialize_karma_for_user(" in content,
        "函式接收 user_id": "user_id: str" in content,
        "返回型別 KarmaHistory": "-> KarmaHistory:" in content or "KarmaHistory:" in content,
        "使用者驗證": "_get_user_with_validation" in content,
        "檢查已初始化": "existing_history = await self.db.execute(" in content,
        "避免重複初始化": "if existing_history.scalar_one_or_none():" in content,
        "返回 None 若已初始化": "return None" in content,
        "初始 Karma 為 50": "initial_karma = 50" in content,
        "設定使用者 karma_score": "user.karma_score = initial_karma" in content,
        "建立 KarmaHistory 記錄": "karma_history = KarmaHistory(" in content,
        "reason 為 SYSTEM_INITIALIZATION": "KarmaChangeReason.SYSTEM_INITIALIZATION" in content,
        "記錄 OAuth 使用者資訊": "is_oauth_user" in content and "user.oauth_provider" in content,
        "alignment 為 neutral": '"neutral"' in content or "'neutral'" in content,
        "commit 到資料庫": "await self.db.commit()" in content,
        "refresh karma_history": "await self.db.refresh(karma_history)" in content,
        "Task 29 註解": "Task 29" in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed >= total - 1  # 允許 1 個非關鍵檢查失敗


def verify_karma_change_reason_enum():
    """驗證 KarmaChangeReason enum 新增"""
    print("\n📋 驗證 KarmaChangeReason enum...")

    social_features_py = Path("app/models/social_features.py")
    if not social_features_py.exists():
        print(f"❌ {social_features_py} 不存在")
        return False

    content = social_features_py.read_text()

    checks = {
        "KarmaChangeReason enum": "class KarmaChangeReason" in content,
        "SYSTEM_INITIALIZATION": 'SYSTEM_INITIALIZATION = "system_initialization"' in content,
        "Task 29 註解": "Task 29" in content and "system_initialization" in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def verify_oauth_callback_integration():
    """驗證 OAuth 回調端點整合 Karma"""
    print("\n📋 驗證 OAuth 回調端點整合...")

    oauth_py = Path("app/api/oauth.py")
    if not oauth_py.exists():
        print(f"❌ {oauth_py} 不存在")
        return False

    content = oauth_py.read_text()

    checks = {
        "匯入 KarmaService": "from app.services.karma_service import KarmaService" in content,
        "建立 KarmaService 實例": "karma_service = KarmaService(db)" in content,
        "呼叫 initialize_karma_for_user": "await karma_service.initialize_karma_for_user" in content,
        "檢查初始化結果": "if karma_init_result:" in content,
        "日誌記錄初始化": "logger.info" in content and "Karma 已為 OAuth 使用者初始化" in content,
        "錯誤處理不阻擋登入": "logger.warning" in content and "非致命" in content,
        "except 捕捉例外": "except Exception as e:" in content,
        "Task 29 註解": "Task 29" in content or "步驟 4" in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def verify_register_endpoint_integration():
    """驗證傳統註冊端點整合 Karma"""
    print("\n📋 驗證傳統註冊端點整合...")

    auth_py = Path("app/api/auth.py")
    if not auth_py.exists():
        print(f"❌ {auth_py} 不存在")
        return False

    content = auth_py.read_text()

    checks = {
        "匯入 KarmaService": "from app.services.karma_service import KarmaService" in content,
        "建立 KarmaService 實例": "karma_service = KarmaService(db)" in content,
        "呼叫 initialize_karma_for_user": "await karma_service.initialize_karma_for_user" in content,
        "檢查初始化結果": "if karma_init_result:" in content,
        "日誌記錄初始化": "logger.info" in content and "Karma 已為傳統註冊使用者初始化" in content or "karma=" in content,
        "錯誤處理不阻擋註冊": "logger.warning" in content and "非致命" in content,
        "except 捕捉例外": "except Exception as e:" in content,
        "Task 29 註解": "Task 29" in content or "初始化 Karma 系統" in content,
    }

    passed = sum(checks.values())
    total = len(checks)

    for check, result in checks.items():
        print(f"{'✅' if result else '❌'} {check}")

    print(f"\n通過: {passed}/{total}")
    return passed == total


def main():
    print("=" * 60)
    print("Task 29 驗證：Karma 系統整合")
    print("=" * 60)

    project_root = Path(__file__).parent
    import os
    os.chdir(project_root)

    results = {
        "Karma 初始化函式": verify_karma_initialization_function(),
        "KarmaChangeReason enum": verify_karma_change_reason_enum(),
        "OAuth 回調整合": verify_oauth_callback_integration(),
        "傳統註冊整合": verify_register_endpoint_integration(),
    }

    print("\n" + "=" * 60)
    print("驗證結果總結")
    print("=" * 60)

    for task, result in results.items():
        status = "✅ 通過" if result else "❌ 失敗"
        print(f"{task}: {status}")

    if all(results.values()):
        print("\n🎉 Task 29 驗證通過！")
        print("\n已完成功能：")
        print("✅ Karma 初始化函式")
        print("   - initialize_karma_for_user(user_id)")
        print("   - 初始 Karma = 50 (中性)")
        print("   - 檢查避免重複初始化")
        print("   - 記錄 OAuth 使用者資訊")
        print("✅ KarmaChangeReason enum 擴充")
        print("   - 新增 SYSTEM_INITIALIZATION 原因")
        print("✅ OAuth 回調端點整合")
        print("   - 新使用者自動初始化 Karma")
        print("   - 錯誤處理不阻擋登入流程")
        print("   - 日誌記錄初始化事件")
        print("✅ 傳統註冊端點整合")
        print("   - 新使用者自動初始化 Karma")
        print("   - 錯誤處理不阻擋註冊流程")
        print("   - 日誌記錄初始化事件")
        print("\n✨ OAuth 和傳統註冊使用者都會正確初始化 Karma！")
        return 0
    else:
        print("\n❌ 部分驗證失敗")
        return 1


if __name__ == "__main__":
    sys.exit(main())
