#!/usr/bin/env python3
"""
快速測試驗證腳本
運行關鍵測試確保API基本功能正常
"""

import subprocess
import sys
import os


def run_command(command, description):
    """運行命令並顯示結果"""
    print(f"🧪 {description}...")

    try:
        result = subprocess.run(
            command.split(),
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode == 0:
            print(f"✅ {description} - 通過")
            return True
        else:
            print(f"❌ {description} - 失敗")
            if result.stderr:
                print(f"錯誤: {result.stderr[:200]}...")
            return False

    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - 超時")
        return False
    except Exception as e:
        print(f"💥 {description} - 執行錯誤: {e}")
        return False


def main():
    """快速驗證主要功能"""
    print("🃏 Wasteland Tarot API - 快速測試驗證")
    print("=" * 50)

    # 切換到backend目錄
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)

    # 關鍵測試列表
    critical_tests = [
        ("python -m pytest tests/test_database_connection.py::TestDatabaseConnection::test_database_connection -v",
         "資料庫連接"),
        ("python -m pytest tests/test_api_endpoints_comprehensive.py::TestCardsAPI::test_get_all_cards -v",
         "API基本功能"),
        ("python -m pytest tests/test_card_data_integrity.py::TestCardDataIntegrity::test_total_card_count -v",
         "卡片數據完整性"),
        ("python -m pytest tests/test_swagger_ui.py::TestSwaggerDocumentation::test_openapi_schema_accessibility -v",
         "API文檔可訪問性")
    ]

    # 運行測試
    passed = 0
    total = len(critical_tests)

    for command, description in critical_tests:
        if run_command(command, description):
            passed += 1
        print("-" * 30)

    # 結果總結
    print(f"\n📊 快速驗證結果: {passed}/{total} 通過")

    if passed == total:
        print("🎉 恭喜！所有關鍵功能都正常運作！")
        print("💡 你可以運行 'python run_all_tests.py' 來執行完整測試")
        return True
    else:
        print("⚠️ 有部分功能需要檢查")
        print("🔧 請檢查API配置和資料庫連接")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)