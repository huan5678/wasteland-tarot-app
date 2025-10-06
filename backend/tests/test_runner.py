"""
測試套件運行器和驗證工具
提供便捷的測試執行和結果驗證功能
"""

import pytest
import sys
import os
import subprocess
import time
from typing import Dict, List, Optional
from pathlib import Path


class TestRunner:
    """測試運行器類"""

    def __init__(self, backend_path: str = None):
        self.backend_path = backend_path or os.path.dirname(os.path.dirname(__file__))
        self.test_results: Dict = {}

    def run_database_tests(self) -> bool:
        """運行資料庫相關測試"""
        print("🗄️ 運行資料庫連接測試...")
        result = pytest.main([
            "-v",
            "--tb=short",
            "-m", "database",
            f"{self.backend_path}/tests/test_database_connection.py"
        ])
        return result == 0

    def run_api_tests(self) -> bool:
        """運行API端點測試"""
        print("🚀 運行API端點測試...")
        result = pytest.main([
            "-v",
            "--tb=short",
            "-m", "integration",
            f"{self.backend_path}/tests/test_api_endpoints_comprehensive.py"
        ])
        return result == 0

    def run_card_integrity_tests(self) -> bool:
        """運行卡片資料完整性測試"""
        print("🃏 運行78張卡片資料完整性測試...")
        result = pytest.main([
            "-v",
            "--tb=short",
            f"{self.backend_path}/tests/test_card_data_integrity.py"
        ])
        return result == 0

    def run_query_parameter_tests(self) -> bool:
        """運行查詢參數測試"""
        print("🔍 運行查詢參數和篩選條件測試...")
        result = pytest.main([
            "-v",
            "--tb=short",
            f"{self.backend_path}/tests/test_query_parameters.py"
        ])
        return result == 0

    def run_error_handling_tests(self) -> bool:
        """運行錯誤處理測試"""
        print("❌ 運行錯誤處理和異常情況測試...")
        result = pytest.main([
            "-v",
            "--tb=short",
            f"{self.backend_path}/tests/test_error_handling.py"
        ])
        return result == 0

    def run_swagger_tests(self) -> bool:
        """運行Swagger UI測試"""
        print("📚 運行Swagger UI功能測試...")
        result = pytest.main([
            "-v",
            "--tb=short",
            f"{self.backend_path}/tests/test_swagger_ui.py"
        ])
        return result == 0

    def run_cors_tests(self) -> bool:
        """運行CORS配置測試"""
        print("🔗 運行CORS配置測試...")
        result = pytest.main([
            "-v",
            "--tb=short",
            f"{self.backend_path}/tests/test_cors_configuration.py"
        ])
        return result == 0

    def run_all_tests(self) -> Dict[str, bool]:
        """運行所有測試套件"""
        print("🧪 開始運行完整測試套件...")
        print("=" * 60)

        test_suite = {
            "database": self.run_database_tests,
            "api_endpoints": self.run_api_tests,
            "card_integrity": self.run_card_integrity_tests,
            "query_parameters": self.run_query_parameter_tests,
            "error_handling": self.run_error_handling_tests,
            "swagger_ui": self.run_swagger_tests,
            "cors_configuration": self.run_cors_tests
        }

        results = {}
        failed_tests = []

        for test_name, test_func in test_suite.items():
            try:
                start_time = time.time()
                success = test_func()
                end_time = time.time()

                results[test_name] = {
                    "success": success,
                    "duration": end_time - start_time
                }

                if success:
                    print(f"✅ {test_name} 測試通過 ({end_time - start_time:.2f}秒)")
                else:
                    print(f"❌ {test_name} 測試失敗")
                    failed_tests.append(test_name)

            except Exception as e:
                print(f"💥 {test_name} 測試執行出錯: {str(e)}")
                results[test_name] = {
                    "success": False,
                    "error": str(e)
                }
                failed_tests.append(test_name)

            print("-" * 40)

        # 總結報告
        self.print_summary_report(results, failed_tests)
        return results

    def run_quick_tests(self) -> bool:
        """運行快速測試（排除慢速測試）"""
        print("⚡ 運行快速測試套件...")
        result = pytest.main([
            "-v",
            "--tb=short",
            "-m", "not slow",
            f"{self.backend_path}/tests/"
        ])
        return result == 0

    def run_performance_tests(self) -> bool:
        """運行性能測試"""
        print("🚀 運行性能測試...")
        result = pytest.main([
            "-v",
            "--tb=short",
            "-m", "performance",
            f"{self.backend_path}/tests/"
        ])
        return result == 0

    def check_test_coverage(self) -> bool:
        """檢查測試覆蓋率"""
        print("📊 檢查測試覆蓋率...")
        try:
            result = subprocess.run([
                "pytest",
                "--cov=app",
                "--cov-report=term-missing",
                "--cov-report=html",
                f"{self.backend_path}/tests/"
            ], capture_output=True, text=True, cwd=self.backend_path)

            if result.returncode == 0:
                print("✅ 測試覆蓋率檢查完成")
                print(result.stdout)
                return True
            else:
                print("❌ 測試覆蓋率檢查失敗")
                print(result.stderr)
                return False
        except Exception as e:
            print(f"💥 測試覆蓋率檢查出錯: {str(e)}")
            return False

    def print_summary_report(self, results: Dict, failed_tests: List[str]):
        """打印總結報告"""
        print("=" * 60)
        print("📋 測試總結報告")
        print("=" * 60)

        total_tests = len(results)
        passed_tests = sum(1 for r in results.values() if r.get("success", False))
        failed_test_count = len(failed_tests)

        print(f"總測試套件數: {total_tests}")
        print(f"通過測試數: {passed_tests}")
        print(f"失敗測試數: {failed_test_count}")
        print(f"成功率: {(passed_tests/total_tests)*100:.1f}%")

        if failed_tests:
            print("\n❌ 失敗的測試套件:")
            for test in failed_tests:
                print(f"  - {test}")

        print("\n⏱️ 測試執行時間:")
        for test_name, result in results.items():
            if "duration" in result:
                status = "✅" if result["success"] else "❌"
                print(f"  {status} {test_name}: {result['duration']:.2f}秒")

        total_time = sum(r.get("duration", 0) for r in results.values())
        print(f"\n總執行時間: {total_time:.2f}秒")

        if failed_test_count == 0:
            print("\n🎉 恭喜！所有測試都通過了！")
        else:
            print(f"\n⚠️ 有 {failed_test_count} 個測試套件需要修復")

    def validate_test_environment(self) -> bool:
        """驗證測試環境設置"""
        print("🔧 驗證測試環境...")

        checks = []

        # 檢查必要的依賴
        try:
            import pytest
            import httpx
            import sqlalchemy
            import fastapi
            checks.append(("pytest 和相關依賴", True))
        except ImportError as e:
            checks.append(("pytest 和相關依賴", False, f"缺少依賴: {e}"))

        # 檢查測試文件存在
        test_files = [
            "test_database_connection.py",
            "test_api_endpoints_comprehensive.py",
            "test_card_data_integrity.py",
            "test_query_parameters.py",
            "test_error_handling.py",
            "test_swagger_ui.py",
            "test_cors_configuration.py"
        ]

        tests_dir = Path(self.backend_path) / "tests"
        for test_file in test_files:
            file_path = tests_dir / test_file
            checks.append((f"測試文件 {test_file}", file_path.exists()))

        # 檢查配置文件
        config_files = ["pyproject.toml", "pytest.ini"]
        for config_file in config_files:
            file_path = Path(self.backend_path) / config_file
            if file_path.exists():
                checks.append((f"配置文件 {config_file}", True))

        # 打印檢查結果
        all_passed = True
        for check in checks:
            name = check[0]
            status = check[1]
            error = check[2] if len(check) > 2 else None

            if status:
                print(f"✅ {name}")
            else:
                print(f"❌ {name}")
                if error:
                    print(f"   錯誤: {error}")
                all_passed = False

        return all_passed


def main():
    """主函數 - 提供命令行接口"""
    import argparse

    parser = argparse.ArgumentParser(description="Wasteland Tarot API 測試運行器")
    parser.add_argument("--all", action="store_true", help="運行所有測試")
    parser.add_argument("--quick", action="store_true", help="運行快速測試")
    parser.add_argument("--performance", action="store_true", help="運行性能測試")
    parser.add_argument("--coverage", action="store_true", help="檢查測試覆蓋率")
    parser.add_argument("--validate", action="store_true", help="驗證測試環境")
    parser.add_argument("--database", action="store_true", help="只運行資料庫測試")
    parser.add_argument("--api", action="store_true", help="只運行API測試")
    parser.add_argument("--cards", action="store_true", help="只運行卡片完整性測試")
    parser.add_argument("--queries", action="store_true", help="只運行查詢參數測試")
    parser.add_argument("--errors", action="store_true", help="只運行錯誤處理測試")
    parser.add_argument("--swagger", action="store_true", help="只運行Swagger測試")
    parser.add_argument("--cors", action="store_true", help="只運行CORS測試")

    args = parser.parse_args()

    runner = TestRunner()

    # 如果沒有指定任何參數，運行所有測試
    if not any(vars(args).values()):
        args.all = True

    if args.validate:
        if runner.validate_test_environment():
            print("✅ 測試環境驗證通過")
        else:
            print("❌ 測試環境驗證失敗")
            sys.exit(1)

    if args.all:
        results = runner.run_all_tests()
        failed_count = sum(1 for r in results.values() if not r.get("success", False))
        sys.exit(failed_count)

    elif args.quick:
        success = runner.run_quick_tests()
        sys.exit(0 if success else 1)

    elif args.performance:
        success = runner.run_performance_tests()
        sys.exit(0 if success else 1)

    elif args.coverage:
        success = runner.check_test_coverage()
        sys.exit(0 if success else 1)

    else:
        # 運行特定測試
        success = True
        if args.database:
            success &= runner.run_database_tests()
        if args.api:
            success &= runner.run_api_tests()
        if args.cards:
            success &= runner.run_card_integrity_tests()
        if args.queries:
            success &= runner.run_query_parameter_tests()
        if args.errors:
            success &= runner.run_error_handling_tests()
        if args.swagger:
            success &= runner.run_swagger_tests()
        if args.cors:
            success &= runner.run_cors_tests()

        sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()