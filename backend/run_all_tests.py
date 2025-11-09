#!/usr/bin/env python3
"""
Wasteland Tarot API 完整測試執行腳本
運行所有測試並生成詳細報告
"""

import os
import sys
import subprocess
import time
import json
from datetime import datetime
from pathlib import Path


def print_banner():
    """打印測試橫幅"""
    print("☢️" * 20)
    print("🃏 WASTELAND TAROT API 測試套件 🃏")
    print("☢️" * 20)
    print(f"📅 測試時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("📍 正在驗證FastAPI應用程式的完整性...")
    print()


def check_environment():
    """檢查測試環境"""
    print("🔧 檢查測試環境...")

    # 檢查Python版本
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ Python版本需要3.8或更高")
        return False

    print(f"✅ Python版本: {python_version.major}.{python_version.minor}.{python_version.micro}")

    # 檢查必要依賴
    required_packages = [
        "pytest", "httpx", "fastapi", "sqlalchemy",
        "pydantic", "uvicorn", "pytest-asyncio"
    ]

    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} (缺少)")
            missing_packages.append(package)

    if missing_packages:
        print(f"\n⚠️ 缺少依賴包: {', '.join(missing_packages)}")
        print("請執行: uv add --group dev " + " ".join(missing_packages))
        return False

    return True


def run_test_command(command, description):
    """執行測試命令"""
    print(f"\n🧪 {description}")
    print("-" * 50)

    start_time = time.time()

    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300  # 5分鐘超時
        )

        end_time = time.time()
        duration = end_time - start_time

        if result.returncode == 0:
            print(f"✅ {description} 通過 ({duration:.2f}秒)")
            if result.stdout:
                print("📋 輸出:")
                print(result.stdout)
        else:
            print(f"❌ {description} 失敗 ({duration:.2f}秒)")
            if result.stderr:
                print("🚨 錯誤:")
                print(result.stderr)
            if result.stdout:
                print("📋 輸出:")
                print(result.stdout)

        return {
            "success": result.returncode == 0,
            "duration": duration,
            "stdout": result.stdout,
            "stderr": result.stderr
        }

    except subprocess.TimeoutExpired:
        print(f"⏰ {description} 測試超時 (>5分鐘)")
        return {
            "success": False,
            "duration": 300,
            "error": "測試超時"
        }
    except Exception as e:
        print(f"💥 {description} 執行出錯: {str(e)}")
        return {
            "success": False,
            "duration": 0,
            "error": str(e)
        }


def main():
    """主函數"""
    print_banner()

    # 檢查環境
    if not check_environment():
        print("\n❌ 環境檢查失敗，無法繼續測試")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("🚀 開始執行測試套件")
    print("=" * 60)

    # 定義測試命令
    test_commands = [
        {
            "command": "python -m pytest tests/test_database_connection.py -v --tb=short",
            "description": "資料庫連接測試",
            "critical": True
        },
        {
            "command": "python -m pytest tests/test_api_endpoints_comprehensive.py -v --tb=short",
            "description": "API端點完整性測試",
            "critical": True
        },
        {
            "command": "python -m pytest tests/test_card_data_integrity.py -v --tb=short",
            "description": "78張卡片資料完整性測試",
            "critical": True
        },
        {
            "command": "python -m pytest tests/test_query_parameters.py -v --tb=short",
            "description": "查詢參數和篩選條件測試",
            "critical": True
        },
        {
            "command": "python -m pytest tests/test_error_handling.py -v --tb=short",
            "description": "錯誤處理和異常情況測試",
            "critical": True
        },
        {
            "command": "python -m pytest tests/test_swagger_ui.py -v --tb=short",
            "description": "Swagger UI功能測試",
            "critical": False
        },
        {
            "command": "python -m pytest tests/test_cors_configuration.py -v --tb=short",
            "description": "CORS配置測試",
            "critical": False
        }
    ]

    # 執行測試
    results = {}
    critical_failures = 0
    total_failures = 0

    for test in test_commands:
        result = run_test_command(test["command"], test["description"])
        results[test["description"]] = result

        if not result["success"]:
            total_failures += 1
            if test["critical"]:
                critical_failures += 1

    # 運行覆蓋率測試
    print("\n" + "=" * 60)
    print("📊 執行測試覆蓋率分析")
    print("=" * 60)

    coverage_result = run_test_command(
        "python -m pytest --cov=app --cov-report=term-missing --cov-report=html --cov-fail-under=70",
        "測試覆蓋率分析"
    )
    results["測試覆蓋率分析"] = coverage_result

    # 生成測試報告
    print("\n" + "=" * 60)
    print("📋 測試總結報告")
    print("=" * 60)

    total_tests = len(results)
    passed_tests = sum(1 for r in results.values() if r["success"])
    total_time = sum(r["duration"] for r in results.values())

    print(f"📊 總測試數: {total_tests}")
    print(f"✅ 通過測試: {passed_tests}")
    print(f"❌ 失敗測試: {total_failures}")
    print(f"⚠️ 關鍵失敗: {critical_failures}")
    print(f"📈 成功率: {(passed_tests/total_tests)*100:.1f}%")
    print(f"⏱️ 總執行時間: {total_time:.2f}秒")

    print("\n📝 詳細結果:")
    for test_name, result in results.items():
        status = "✅" if result["success"] else "❌"
        print(f"  {status} {test_name}: {result['duration']:.2f}秒")
        if not result["success"] and "error" in result:
            print(f"     錯誤: {result['error']}")

    # 保存測試報告到文件
    report_data = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": total_failures,
            "critical_failures": critical_failures,
            "success_rate": (passed_tests/total_tests)*100,
            "total_duration": total_time
        },
        "results": results
    }

    report_file = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)

    print(f"\n💾 詳細報告已保存到: {report_file}")

    # 建議和下一步
    print("\n" + "=" * 60)
    print("💡 建議和下一步")
    print("=" * 60)

    if critical_failures == 0:
        print("🎉 恭喜！所有關鍵測試都通過了！")
        if total_failures == 0:
            print("🏆 完美！所有測試都通過，API已準備好部署！")
        else:
            print("⚠️ 有一些非關鍵測試失敗，建議修復但不影響核心功能")
    else:
        print("🚨 發現關鍵問題，需要修復後才能部署:")
        for test_name, result in results.items():
            if not result["success"]:
                print(f"  - {test_name}")

    print("\n📚 測試文檔位置:")
    print("  - 測試覆蓋率報告: htmlcov/index.html")
    print("  - 詳細測試報告: " + report_file)

    print("\n🔧 常用測試命令:")
    print("  - 運行特定測試: python -m pytest tests/test_specific.py -v")
    print("  - 運行快速測試: python -m pytest -m 'not slow' -v")
    print("  - 運行性能測試: python -m pytest -m performance -v")
    print("  - 查看覆蓋率: python -m pytest --cov=app --cov-report=html")

    # 退出碼
    if critical_failures > 0:
        print("\n❌ 測試套件失敗 - 關鍵問題需要修復")
        sys.exit(1)
    elif total_failures > 0:
        print("\n⚠️ 測試套件部分通過 - 建議修復非關鍵問題")
        sys.exit(2)
    else:
        print("\n✅ 測試套件完全通過！")
        sys.exit(0)


if __name__ == "__main__":
    main()