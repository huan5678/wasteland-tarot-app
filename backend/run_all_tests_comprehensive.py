"""
Comprehensive Test Runner for Wasteland Tarot Backend
Run all tests with detailed reporting and coverage analysis
"""

import sys
import subprocess
from pathlib import Path


def run_command(cmd: list[str], description: str) -> int:
    """Run a command and print results"""
    print(f"\n{'='*80}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*80}\n")

    result = subprocess.run(cmd, cwd=Path(__file__).parent)

    if result.returncode == 0:
        print(f"\n✅ {description} - PASSED")
    else:
        print(f"\n❌ {description} - FAILED")

    return result.returncode


def main():
    """Run all test suites"""
    print("\n" + "="*80)
    print("WASTELAND TAROT - COMPREHENSIVE TEST SUITE")
    print("="*80)

    results = {}

    # 1. Unit Tests
    results['unit'] = run_command(
        ['pytest', 'tests/unit', '-v', '--tb=short', '-m', 'unit'],
        "Unit Tests"
    )

    # 2. API Tests
    results['api'] = run_command(
        ['pytest', 'tests/api', '-v', '--tb=short', '-m', 'api'],
        "API Endpoint Tests"
    )

    # 3. Integration Tests
    results['integration'] = run_command(
        ['pytest', 'tests/integration', '-v', '--tb=short', '-m', 'integration'],
        "Integration Tests"
    )

    # 4. Performance Tests
    results['performance'] = run_command(
        ['pytest', 'tests/performance', '-v', '--tb=short', '-m', 'performance'],
        "Performance Tests"
    )

    # 5. Edge Cases
    results['edge_cases'] = run_command(
        ['pytest', 'tests/edge_cases', '-v', '--tb=short', '-m', 'edge_cases'],
        "Edge Case Tests"
    )

    # 6. Coverage Report
    print("\n" + "="*80)
    print("Generating Coverage Report")
    print("="*80 + "\n")

    subprocess.run([
        'pytest',
        'tests/',
        '--cov=app',
        '--cov-report=term-missing',
        '--cov-report=html',
        '--cov-report=xml',
        '--tb=no',
        '-q'
    ], cwd=Path(__file__).parent)

    # Summary
    print("\n" + "="*80)
    print("TEST RESULTS SUMMARY")
    print("="*80 + "\n")

    total_suites = len(results)
    passed_suites = sum(1 for r in results.values() if r == 0)
    failed_suites = total_suites - passed_suites

    for suite_name, return_code in results.items():
        status = "✅ PASSED" if return_code == 0 else "❌ FAILED"
        print(f"{suite_name:20s} - {status}")

    print(f"\n{'='*80}")
    print(f"Total: {passed_suites}/{total_suites} test suites passed")
    print(f"{'='*80}\n")

    if failed_suites > 0:
        print("❌ Some tests failed. Check the output above for details.")
        print("💡 Coverage report: htmlcov/index.html\n")
        sys.exit(1)
    else:
        print("✅ All tests passed!")
        print("💡 Coverage report: htmlcov/index.html\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
