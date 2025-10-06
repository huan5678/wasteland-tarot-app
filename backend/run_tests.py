#!/usr/bin/env python3
# run_tests.py - Comprehensive test runner for Wasteland Tarot API

"""
Wasteland Tarot API Test Runner

This script provides various testing modes for the Fallout-themed tarot API:
- Unit tests for individual components
- Integration tests for API endpoints
- Performance tests for load and scalability
- Full test suite with coverage reporting

Usage:
    python run_tests.py --mode unit
    python run_tests.py --mode integration
    python run_tests.py --mode performance
    python run_tests.py --mode full
    python run_tests.py --mode ci
"""

import argparse
import asyncio
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any


class WastelandTestRunner:
    """Test runner for Wasteland Tarot API test suite."""

    def __init__(self):
        self.project_root = Path(__file__).parent
        self.test_dir = self.project_root / "tests"

    def run_command(self, command: List[str], description: str) -> bool:
        """Run a command and return success status."""
        print(f"\n🔧 {description}")
        print(f"Running: {' '.join(command)}")

        try:
            result = subprocess.run(
                command,
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )

            if result.returncode == 0:
                print(f"✅ {description} - PASSED")
                if result.stdout:
                    print(result.stdout)
                return True
            else:
                print(f"❌ {description} - FAILED")
                if result.stderr:
                    print("STDERR:", result.stderr)
                if result.stdout:
                    print("STDOUT:", result.stdout)
                return False

        except subprocess.TimeoutExpired:
            print(f"⏰ {description} - TIMEOUT")
            return False
        except Exception as e:
            print(f"💥 {description} - ERROR: {e}")
            return False

    def run_unit_tests(self) -> bool:
        """Run unit tests for individual components."""
        print("\n🧪 Running Wasteland Tarot Unit Tests")
        print("=" * 50)

        command = [
            "pytest",
            str(self.test_dir / "unit"),
            "-v",
            "--tb=short",
            "--cov=app",
            "--cov-report=term-missing",
            "-m", "unit or not integration and not performance"
        ]

        return self.run_command(command, "Unit Tests (Cards, Karma, Voices)")

    def run_integration_tests(self) -> bool:
        """Run integration tests for API endpoints."""
        print("\n🔗 Running Wasteland Tarot Integration Tests")
        print("=" * 50)

        command = [
            "pytest",
            str(self.test_dir / "integration"),
            "-v",
            "--tb=short",
            "-m", "integration"
        ]

        return self.run_command(command, "Integration Tests (API Endpoints)")

    def run_performance_tests(self) -> bool:
        """Run performance and load tests."""
        print("\n⚡ Running Wasteland Tarot Performance Tests")
        print("=" * 50)

        command = [
            "pytest",
            str(self.test_dir / "performance"),
            "-v",
            "--tb=short",
            "-m", "performance",
            "--durations=20"
        ]

        return self.run_command(command, "Performance Tests (Load & Scalability)")

    def run_fallout_theme_tests(self) -> bool:
        """Run tests specific to Fallout theming."""
        print("\n🏚️ Running Fallout Theme Validation Tests")
        print("=" * 50)

        command = [
            "pytest",
            "-v",
            "--tb=short",
            "-m", "fallout_theme",
            "-k", "fallout or vault or pip_boy or karma or faction"
        ]

        return self.run_command(command, "Fallout Theme Tests (Lore & Atmosphere)")

    def run_karma_system_tests(self) -> bool:
        """Run karma system specific tests."""
        print("\n⚖️ Running Karma System Tests")
        print("=" * 50)

        command = [
            "pytest",
            "-v",
            "--tb=short",
            "-m", "karma_system",
            "-k", "karma"
        ]

        return self.run_command(command, "Karma System Tests (Good/Neutral/Evil)")

    def run_character_voice_tests(self) -> bool:
        """Run character voice interpretation tests."""
        print("\n🎭 Running Character Voice Tests")
        print("=" * 50)

        command = [
            "pytest",
            "-v",
            "--tb=short",
            "-m", "character_voices",
            "-k", "voice or interpretation"
        ]

        return self.run_command(command, "Character Voice Tests (4 Interpretation Styles)")

    def run_security_tests(self) -> bool:
        """Run security and authentication tests."""
        print("\n🔒 Running Security Tests")
        print("=" * 50)

        command = [
            "pytest",
            "-v",
            "--tb=short",
            "-m", "authentication",
            "-k", "auth or security or rate_limit"
        ]

        return self.run_command(command, "Security Tests (Auth & Rate Limiting)")

    def run_full_test_suite(self) -> bool:
        """Run the complete test suite with coverage."""
        print("\n🏆 Running Full Wasteland Tarot Test Suite")
        print("=" * 60)

        command = [
            "pytest",
            "-v",
            "--tb=short",
            "--cov=app",
            "--cov-report=term-missing",
            "--cov-report=html:htmlcov",
            "--cov-report=xml",
            "--cov-fail-under=80",
            "--durations=20"
        ]

        return self.run_command(command, "Full Test Suite with Coverage")

    def run_ci_tests(self) -> bool:
        """Run tests suitable for CI/CD pipeline."""
        print("\n🚀 Running CI/CD Test Suite")
        print("=" * 50)

        # Run tests in parallel for CI
        command = [
            "pytest",
            "-v",
            "--tb=short",
            "--cov=app",
            "--cov-report=xml",
            "--cov-fail-under=75",  # Slightly lower threshold for CI
            "-n", "auto",  # Parallel execution
            "--maxfail=5"  # Stop after 5 failures
        ]

        return self.run_command(command, "CI/CD Test Suite (Parallel)")

    def run_quick_smoke_tests(self) -> bool:
        """Run quick smoke tests for basic functionality."""
        print("\n💨 Running Quick Smoke Tests")
        print("=" * 50)

        command = [
            "pytest",
            "-v",
            "--tb=short",
            "-m", "not slow and not performance",
            "--maxfail=3",
            "-x"  # Stop on first failure
        ]

        return self.run_command(command, "Quick Smoke Tests (Fast Validation)")

    def generate_test_report(self) -> bool:
        """Generate comprehensive test report."""
        print("\n📊 Generating Test Report")
        print("=" * 50)

        command = [
            "pytest",
            "--html=reports/wasteland_tarot_test_report.html",
            "--self-contained-html",
            "--json-report",
            "--json-report-file=reports/test_results.json"
        ]

        # Create reports directory
        reports_dir = self.project_root / "reports"
        reports_dir.mkdir(exist_ok=True)

        return self.run_command(command, "Test Report Generation")

    def validate_test_environment(self) -> bool:
        """Validate test environment setup."""
        print("\n🔍 Validating Test Environment")
        print("=" * 50)

        # Check Python version
        if sys.version_info < (3, 11):
            print("❌ Python 3.11+ required")
            return False

        # Check required test files exist
        required_files = [
            self.test_dir / "conftest.py",
            self.test_dir / "unit" / "__init__.py",
            self.test_dir / "integration" / "__init__.py",
            self.test_dir / "performance" / "__init__.py"
        ]

        for file_path in required_files:
            if not file_path.exists():
                print(f"❌ Missing required test file: {file_path}")
                return False

        print("✅ Test environment validation passed")
        return True

    def run_test_mode(self, mode: str) -> bool:
        """Run tests based on specified mode."""
        if not self.validate_test_environment():
            return False

        mode_handlers = {
            "unit": self.run_unit_tests,
            "integration": self.run_integration_tests,
            "performance": self.run_performance_tests,
            "fallout": self.run_fallout_theme_tests,
            "karma": self.run_karma_system_tests,
            "voices": self.run_character_voice_tests,
            "security": self.run_security_tests,
            "full": self.run_full_test_suite,
            "ci": self.run_ci_tests,
            "smoke": self.run_quick_smoke_tests,
            "report": self.generate_test_report
        }

        if mode not in mode_handlers:
            print(f"❌ Unknown test mode: {mode}")
            print(f"Available modes: {', '.join(mode_handlers.keys())}")
            return False

        return mode_handlers[mode]()

    def run_comprehensive_suite(self) -> Dict[str, bool]:
        """Run comprehensive test suite with all categories."""
        print("\n🎯 Running Comprehensive Wasteland Tarot Test Suite")
        print("=" * 60)

        test_categories = [
            ("unit", "Unit Tests"),
            ("integration", "Integration Tests"),
            ("fallout", "Fallout Theme Tests"),
            ("karma", "Karma System Tests"),
            ("voices", "Character Voice Tests"),
            ("security", "Security Tests"),
            ("performance", "Performance Tests")
        ]

        results = {}

        for mode, description in test_categories:
            print(f"\n📝 Starting {description}")
            results[mode] = self.run_test_mode(mode)

        # Generate final report
        print(f"\n📊 Generating Final Report")
        results["report"] = self.generate_test_report()

        return results

    def print_final_summary(self, results: Dict[str, bool]):
        """Print final test summary."""
        print("\n" + "=" * 60)
        print("🏁 WASTELAND TAROT API TEST SUMMARY")
        print("=" * 60)

        total_tests = len(results)
        passed_tests = sum(results.values())
        failed_tests = total_tests - passed_tests

        print(f"📊 Total Test Categories: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")

        print("\n📝 Category Results:")
        for category, passed in results.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"  {category.upper():<15} {status}")

        if failed_tests == 0:
            print("\n🎉 ALL TESTS PASSED! The Wasteland Tarot API is ready for deployment!")
        else:
            print(f"\n⚠️  {failed_tests} test categories failed. Please review and fix issues.")

        print("\n🔗 Reports generated in: ./reports/")
        print("📋 Coverage report: ./htmlcov/index.html")


def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(
        description="Wasteland Tarot API Test Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Test Modes:
  unit         - Unit tests for individual components
  integration  - Integration tests for API endpoints
  performance  - Performance and load tests
  fallout      - Fallout theme validation tests
  karma        - Karma system specific tests
  voices       - Character voice interpretation tests
  security     - Security and authentication tests
  full         - Complete test suite with coverage
  ci           - CI/CD optimized test suite
  smoke        - Quick smoke tests
  report       - Generate test reports only
  comprehensive- All test categories with reports

Examples:
  python run_tests.py --mode unit
  python run_tests.py --mode comprehensive
  python run_tests.py --mode ci --verbose
        """
    )

    parser.add_argument(
        "--mode",
        default="smoke",
        help="Test mode to run (default: smoke)"
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )

    args = parser.parse_args()

    # Set up test runner
    runner = WastelandTestRunner()

    if args.verbose:
        os.environ["PYTEST_VERBOSE"] = "1"

    # Run tests based on mode
    if args.mode == "comprehensive":
        results = runner.run_comprehensive_suite()
        runner.print_final_summary(results)

        # Exit with error code if any tests failed
        if not all(results.values()):
            sys.exit(1)
    else:
        success = runner.run_test_mode(args.mode)
        if not success:
            print(f"\n❌ {args.mode.upper()} tests failed!")
            sys.exit(1)
        else:
            print(f"\n✅ {args.mode.upper()} tests passed!")


if __name__ == "__main__":
    main()