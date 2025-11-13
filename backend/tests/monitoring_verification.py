"""
Monitoring Verification Script for Task 6.3
驗證所有監控與效能機制是否正常運作

Usage:
    cd backend
    python tests/monitoring_verification.py
"""

import asyncio
import httpx
import time
import sys
from typing import Dict, Any, List


class Color:
    """終端機顏色碼"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


class MonitoringVerification:
    """監控驗證類別"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = []
        self.client = None

    async def __aenter__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()

    def log_result(self, test_name: str, passed: bool, details: str = ""):
        """記錄測試結果"""
        status = f"{Color.GREEN}✓ PASS{Color.END}" if passed else f"{Color.RED}✗ FAIL{Color.END}"
        self.results.append({"name": test_name, "passed": passed, "details": details})
        print(f"{status} - {test_name}")
        if details:
            print(f"  {details}")

    async def verify_metrics_endpoint(self) -> bool:
        """驗證 /api/v1/monitoring/metrics endpoint 回應正確"""
        print(f"\n{Color.BOLD}[Test 1] 驗證 Metrics Endpoint{Color.END}")

        try:
            response = await self.client.get(f"{self.base_url}/api/v1/monitoring/metrics")

            if response.status_code != 200:
                self.log_result(
                    "Metrics endpoint 可存取性",
                    False,
                    f"Status code: {response.status_code}"
                )
                return False

            data = response.json()

            # 驗證回應結構
            required_keys = ["status", "data"]
            for key in required_keys:
                if key not in data:
                    self.log_result(
                        f"Metrics endpoint 回應結構 - 缺少 {key}",
                        False
                    )
                    return False

            # 驗證 data 結構
            data_section = data.get("data", {})
            required_data_keys = [
                "timestamp",
                "baselines",
                "recent_5min",
                "recent_1hour",
                "streaming_5min",
                "streaming_1hour",
                "current_system",
                "health_status"
            ]

            for key in required_data_keys:
                if key not in data_section:
                    self.log_result(
                        f"Metrics data 結構 - 缺少 {key}",
                        False
                    )
                    return False

            self.log_result(
                "Metrics endpoint 回應結構",
                True,
                "所有必要欄位都存在"
            )
            return True

        except Exception as e:
            self.log_result("Metrics endpoint", False, str(e))
            return False

    async def verify_streaming_metrics(self) -> bool:
        """確認 streaming metrics 顯示"""
        print(f"\n{Color.BOLD}[Test 2] 確認 Streaming Metrics{Color.END}")

        try:
            response = await self.client.get(f"{self.base_url}/api/v1/monitoring/metrics")
            data = response.json()
            streaming_5min = data.get("data", {}).get("streaming_5min", {})

            # 驗證 streaming-specific metrics
            expected_metrics = [
                "total_streaming_requests",
                "avg_first_token_latency_ms",
                "first_token_p95_ms",
                "avg_tokens_per_second",
                "total_tokens",
                "streaming_error_rate",
                "streaming_errors"
            ]

            missing_metrics = []
            for metric in expected_metrics:
                if metric not in streaming_5min:
                    missing_metrics.append(metric)

            if missing_metrics:
                self.log_result(
                    "Streaming metrics 完整性",
                    False,
                    f"缺少 metrics: {', '.join(missing_metrics)}"
                )
                return False

            # 驗證 metrics 型別
            numeric_metrics = [
                "total_streaming_requests",
                "avg_first_token_latency_ms",
                "first_token_p95_ms",
                "avg_tokens_per_second",
                "total_tokens",
                "streaming_error_rate",
                "streaming_errors"
            ]

            for metric in numeric_metrics:
                value = streaming_5min[metric]
                if not isinstance(value, (int, float)):
                    self.log_result(
                        f"Streaming metric 型別 - {metric}",
                        False,
                        f"Expected numeric, got {type(value)}"
                    )
                    return False

            self.log_result(
                "Streaming metrics 完整性與型別",
                True,
                f"所有 {len(expected_metrics)} 個 metrics 都正確顯示"
            )

            # 顯示當前 metrics 值
            print(f"\n  {Color.BLUE}當前 Streaming Metrics (最近 5 分鐘):{Color.END}")
            print(f"    - 總請求數: {streaming_5min['total_streaming_requests']}")
            print(f"    - 平均首 token 延遲: {streaming_5min['avg_first_token_latency_ms']:.2f}ms")
            print(f"    - P95 延遲: {streaming_5min['first_token_p95_ms']:.2f}ms")
            print(f"    - 平均 tokens/sec: {streaming_5min['avg_tokens_per_second']:.2f}")
            print(f"    - 錯誤率: {streaming_5min['streaming_error_rate']:.2%}")

            return True

        except Exception as e:
            self.log_result("Streaming metrics", False, str(e))
            return False

    async def verify_concurrent_users(self, concurrent_count: int = 10) -> bool:
        """測試並發使用者情境（無 connection pooling 錯誤）"""
        print(f"\n{Color.BOLD}[Test 3] 測試 {concurrent_count} 並發使用者{Color.END}")

        # Note: 實際測試需要 valid JWT token，這裡只測試 endpoint 可用性
        # 完整的並發測試應該在 load testing 環境執行

        try:
            # 建立多個並發請求到非認證端點（health check）
            tasks = []
            for i in range(concurrent_count):
                tasks.append(self.client.get(f"{self.base_url}/api/v1/monitoring/health"))

            start_time = time.time()
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            duration = time.time() - start_time

            # 檢查是否有 connection pooling 錯誤
            errors = [r for r in responses if isinstance(r, Exception)]
            success_count = len([r for r in responses if not isinstance(r, Exception) and r.status_code == 200])

            if errors:
                error_messages = [str(e) for e in errors]
                self.log_result(
                    f"{concurrent_count} 並發請求",
                    False,
                    f"{len(errors)} 個錯誤: {error_messages[:3]}"
                )
                return False

            self.log_result(
                f"{concurrent_count} 並發請求",
                True,
                f"{success_count}/{concurrent_count} 成功，耗時 {duration:.2f}s"
            )
            return True

        except Exception as e:
            self.log_result(f"{concurrent_count} 並發請求", False, str(e))
            return False

    async def verify_logging(self) -> bool:
        """驗證 logging 正常運作"""
        print(f"\n{Color.BOLD}[Test 4] 驗證 Logging 機制{Color.END}")

        try:
            # 檢查 error logging endpoint
            response = await self.client.get(f"{self.base_url}/api/v1/monitoring/errors")

            if response.status_code != 200:
                self.log_result(
                    "Error logging endpoint",
                    False,
                    f"Status code: {response.status_code}"
                )
                return False

            data = response.json()

            # 驗證回應結構
            if "status" not in data or "data" not in data:
                self.log_result(
                    "Error logging 回應結構",
                    False,
                    "缺少必要欄位"
                )
                return False

            self.log_result(
                "Error logging endpoint",
                True,
                f"已記錄 {data.get('count', 0)} 個錯誤"
            )

            # 檢查 error summary
            summary_response = await self.client.get(
                f"{self.base_url}/api/v1/monitoring/errors/summary"
            )

            if summary_response.status_code != 200:
                self.log_result(
                    "Error summary endpoint",
                    False,
                    f"Status code: {summary_response.status_code}"
                )
                return False

            self.log_result(
                "Error summary endpoint",
                True
            )
            return True

        except Exception as e:
            self.log_result("Logging 機制", False, str(e))
            return False

    async def verify_rollback_thresholds(self) -> bool:
        """確認 Rollback trigger 設定"""
        print(f"\n{Color.BOLD}[Test 5] 確認 Rollback Thresholds{Color.END}")

        try:
            response = await self.client.get(f"{self.base_url}/api/v1/monitoring/metrics")
            data = response.json()

            # 檢查 baselines 是否包含 threshold 設定
            baselines = data.get("data", {}).get("baselines", {})

            # 驗證 streaming threshold 存在
            if "streaming_first_token" not in baselines:
                self.log_result(
                    "Streaming threshold 設定",
                    False,
                    "缺少 streaming_first_token baseline"
                )
                return False

            streaming_baseline = baselines["streaming_first_token"]
            required_threshold_keys = ["target", "warning", "critical"]

            for key in required_threshold_keys:
                if key not in streaming_baseline:
                    self.log_result(
                        f"Streaming threshold - {key}",
                        False,
                        f"缺少 {key} threshold"
                    )
                    return False

            self.log_result(
                "Streaming threshold 設定",
                True,
                f"Target: {streaming_baseline['target']}ms, "
                f"Warning: {streaming_baseline['warning']}ms, "
                f"Critical: {streaming_baseline['critical']}ms"
            )

            # 檢查當前 metrics 是否超過 threshold
            streaming_5min = data.get("data", {}).get("streaming_5min", {})
            current_error_rate = streaming_5min.get("streaming_error_rate", 0)

            # Rollback triggers (from requirements):
            # - Auth error >5%
            # - TTS failure >30%  (not applicable to streaming)
            # - Timeout >10%

            threshold_status = []

            if current_error_rate > 0.10:  # >10% timeout
                threshold_status.append(
                    f"{Color.RED}Timeout 錯誤率 {current_error_rate:.2%} 超過 10% threshold{Color.END}"
                )
            else:
                threshold_status.append(
                    f"{Color.GREEN}Timeout 錯誤率 {current_error_rate:.2%} 低於 10% threshold{Color.END}"
                )

            print(f"\n  {Color.BLUE}Rollback Threshold 狀態:{Color.END}")
            for status in threshold_status:
                print(f"    {status}")

            return True

        except Exception as e:
            self.log_result("Rollback thresholds", False, str(e))
            return False

    async def run_all_tests(self):
        """執行所有驗證測試"""
        print(f"\n{Color.BOLD}{'=' * 60}{Color.END}")
        print(f"{Color.BOLD}監控驗證報告 - Task 6.3{Color.END}")
        print(f"{Color.BOLD}{'=' * 60}{Color.END}")

        tests = [
            ("Metrics Endpoint 回應", self.verify_metrics_endpoint()),
            ("Streaming Metrics 顯示", self.verify_streaming_metrics()),
            ("並發使用者測試", self.verify_concurrent_users(10)),
            ("Logging 機制", self.verify_logging()),
            ("Rollback Thresholds", self.verify_rollback_thresholds())
        ]

        for test_name, test_coro in tests:
            try:
                await test_coro
            except Exception as e:
                self.log_result(test_name, False, f"Unexpected error: {str(e)}")

        # 顯示總結
        self.print_summary()

    def print_summary(self):
        """顯示測試總結"""
        print(f"\n{Color.BOLD}{'=' * 60}{Color.END}")
        print(f"{Color.BOLD}測試總結{Color.END}")
        print(f"{Color.BOLD}{'=' * 60}{Color.END}\n")

        passed = sum(1 for r in self.results if r["passed"])
        total = len(self.results)

        print(f"總測試數: {total}")
        print(f"{Color.GREEN}通過: {passed}{Color.END}")
        print(f"{Color.RED}失敗: {total - passed}{Color.END}")

        if passed == total:
            print(f"\n{Color.GREEN}{Color.BOLD}✓ 所有監控機制運作正常！{Color.END}")
            return 0
        else:
            print(f"\n{Color.RED}{Color.BOLD}✗ 部分監控機制需要修復{Color.END}")
            print(f"\n{Color.YELLOW}失敗的測試:{Color.END}")
            for result in self.results:
                if not result["passed"]:
                    print(f"  - {result['name']}")
                    if result["details"]:
                        print(f"    {result['details']}")
            return 1


async def main():
    """主函式"""
    import argparse

    parser = argparse.ArgumentParser(
        description="監控驗證腳本 - Task 6.3"
    )
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Backend API URL (預設: http://localhost:8000)"
    )
    parser.add_argument(
        "--concurrent",
        type=int,
        default=10,
        help="並發使用者數量 (預設: 10)"
    )

    args = parser.parse_args()

    async with MonitoringVerification(base_url=args.url) as verifier:
        await verifier.run_all_tests()
        return verifier.print_summary()


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{Color.YELLOW}測試被使用者中斷{Color.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Color.RED}測試執行錯誤: {e}{Color.END}")
        sys.exit(1)
