"""
Comprehensive Backend API Testing Suite
Tests all major API endpoints against production Supabase environment
"""

import httpx
import asyncio
import json
import time
from typing import Dict, Any, List
from datetime import datetime
import pytest


# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = "/api/v1"


class APITestReport:
    """Generate detailed test report"""

    def __init__(self):
        self.results: List[Dict[str, Any]] = []
        self.start_time = time.time()

    def add_result(self, category: str, endpoint: str, method: str,
                   status: str, response_time: float, details: Dict[str, Any]):
        """Add test result"""
        self.results.append({
            "category": category,
            "endpoint": endpoint,
            "method": method,
            "status": status,
            "response_time_ms": round(response_time * 1000, 2),
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def generate_report(self) -> str:
        """Generate formatted test report"""
        total_time = time.time() - self.start_time
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")

        report = [
            "\n" + "=" * 80,
            "🧪 WASTELAND TAROT API COMPREHENSIVE TEST REPORT",
            "=" * 80,
            f"\n📊 總測試數: {len(self.results)}",
            f"✅ 通過: {passed}",
            f"❌ 失敗: {failed}",
            f"⏱️  總耗時: {total_time:.2f}s",
            f"📅 測試時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "\n" + "-" * 80,
        ]

        # Group by category
        categories = {}
        for result in self.results:
            cat = result["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(result)

        # Print results by category
        for category, results in categories.items():
            report.append(f"\n📂 {category}")
            report.append("-" * 80)

            for result in results:
                status_icon = "✅" if result["status"] == "PASS" else "❌"
                report.append(
                    f"{status_icon} [{result['method']}] {result['endpoint']} "
                    f"({result['response_time_ms']}ms)"
                )

                if result["status"] == "FAIL":
                    report.append(f"   ⚠️  錯誤: {result['details'].get('error', 'Unknown')}")
                else:
                    # Show key success metrics
                    if "response_data" in result["details"]:
                        data = result["details"]["response_data"]
                        if isinstance(data, dict):
                            if "status" in data:
                                report.append(f"   📊 狀態: {data['status']}")
                            if "count" in data:
                                report.append(f"   🔢 數量: {data['count']}")
                        elif isinstance(data, list):
                            report.append(f"   🔢 返回項目數: {len(data)}")

        report.append("\n" + "=" * 80)
        return "\n".join(report)


class APITester:
    """Comprehensive API testing utility"""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.report = APITestReport()
        self.client: httpx.AsyncClient = None
        self.auth_token: str = None
        self.test_user_id: str = None

    async def __aenter__(self):
        """Async context manager entry"""
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.client:
            await self.client.aclose()

    async def test_endpoint(self, category: str, endpoint: str, method: str = "GET",
                           expected_status: int = 200, json_data: Dict = None,
                           headers: Dict = None, validate_response: callable = None):
        """Test a single endpoint"""
        start_time = time.time()

        try:
            # Make request
            if method == "GET":
                response = await self.client.get(endpoint, headers=headers)
            elif method == "POST":
                response = await self.client.post(endpoint, json=json_data, headers=headers)
            elif method == "PUT":
                response = await self.client.put(endpoint, json=json_data, headers=headers)
            elif method == "DELETE":
                response = await self.client.delete(endpoint, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response_time = time.time() - start_time

            # Validate status code
            if response.status_code != expected_status:
                self.report.add_result(
                    category, endpoint, method, "FAIL", response_time,
                    {
                        "error": f"Expected status {expected_status}, got {response.status_code}",
                        "response_text": response.text[:500]
                    }
                )
                return False

            # Parse response
            try:
                response_data = response.json()
            except:
                response_data = response.text

            # Custom validation
            if validate_response:
                try:
                    validate_response(response_data)
                except AssertionError as e:
                    self.report.add_result(
                        category, endpoint, method, "FAIL", response_time,
                        {"error": str(e), "response_data": response_data}
                    )
                    return False

            # Success
            self.report.add_result(
                category, endpoint, method, "PASS", response_time,
                {"response_data": response_data, "status_code": response.status_code}
            )
            return True

        except Exception as e:
            response_time = time.time() - start_time
            self.report.add_result(
                category, endpoint, method, "FAIL", response_time,
                {"error": str(e)}
            )
            return False

    async def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("\n🚀 開始 API 綜合測試...\n")

        # 1. Health Check Tests
        await self.test_health_endpoints()

        # 2. Cards API Tests
        await self.test_cards_endpoints()

        # 3. Spreads API Tests
        await self.test_spreads_endpoints()

        # 4. Voices API Tests
        await self.test_voices_endpoints()

        # 5. Auth API Tests (if credentials available)
        await self.test_auth_endpoints()

        # 6. Readings API Tests
        await self.test_readings_endpoints()

        # 7. Bingo API Tests
        await self.test_bingo_endpoints()

        # 8. Social API Tests
        await self.test_social_endpoints()

        # 9. Analytics API Tests
        await self.test_analytics_endpoints()

        # 10. Performance Tests
        await self.test_performance()

        # Generate and print report
        print(self.report.generate_report())

    async def test_health_endpoints(self):
        """Test health check endpoints"""
        print("📊 測試 Health Check API...")

        # Root endpoint
        await self.test_endpoint(
            "Health Check",
            "/",
            validate_response=lambda r: (
                assert_field_exists(r, "message"),
                assert_field_exists(r, "version"),
                assert_field_exists(r, "status")
            )
        )

        # Health endpoint
        await self.test_endpoint(
            "Health Check",
            "/health",
            validate_response=lambda r: (
                assert_field_exists(r, "status"),
                assert_field_exists(r, "components"),
                assert_in(r["status"], ["🟢 Healthy", "Healthy"]),
                assert_field_exists(r["components"], "database"),
                assert_field_exists(r["components"], "supabase"),
                assert_field_exists(r["components"], "card_deck")
            )
        )

    async def test_cards_endpoints(self):
        """Test cards API endpoints"""
        print("🃏 測試 Cards API...")

        # Get all cards
        await self.test_endpoint(
            "Cards API",
            f"{API_V1}/cards",
            validate_response=lambda r: (
                assert_is_list(r),
                assert_min_length(r, 78, "Expected 78 tarot cards"),
                assert_card_structure(r[0] if r else {})
            )
        )

        # Get random card
        await self.test_endpoint(
            "Cards API",
            f"{API_V1}/cards/random",
            validate_response=lambda r: assert_card_structure(r)
        )

        # Get card by ID (test with The Fool - typically ID 1)
        await self.test_endpoint(
            "Cards API",
            f"{API_V1}/cards/1",
            validate_response=lambda r: (
                assert_card_structure(r),
                assert_field_exists(r, "id")
            )
        )

    async def test_spreads_endpoints(self):
        """Test spreads API endpoints"""
        print("🗂️  測試 Spreads API...")

        # Get all spreads
        await self.test_endpoint(
            "Spreads API",
            f"{API_V1}/spreads",
            validate_response=lambda r: (
                assert_is_list(r),
                assert_min_length(r, 1, "Expected at least 1 spread")
            )
        )

    async def test_voices_endpoints(self):
        """Test character voices API endpoints"""
        print("🎭 測試 Character Voices API...")

        # Get all voices
        await self.test_endpoint(
            "Character Voices API",
            f"{API_V1}/voices",
            validate_response=lambda r: (
                assert_is_list(r),
                assert_min_length(r, 1, "Expected at least 1 voice")
            )
        )

    async def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("🔐 測試 Auth API...")

        # Note: These tests would need valid credentials
        # For now, test error handling

        # Test login with invalid credentials
        await self.test_endpoint(
            "Auth API",
            f"{API_V1}/auth/login",
            method="POST",
            json_data={"email": "test@invalid.com", "password": "invalid"},
            expected_status=401  # Expecting unauthorized
        )

    async def test_readings_endpoints(self):
        """Test readings API endpoints"""
        print("📖 測試 Readings API...")

        # Note: Most readings endpoints require authentication
        # Test without auth to verify proper error handling

        await self.test_endpoint(
            "Readings API",
            f"{API_V1}/readings",
            expected_status=401  # Expecting unauthorized without token
        )

    async def test_bingo_endpoints(self):
        """Test bingo game endpoints"""
        print("🎲 測試 Bingo API...")

        # Note: Bingo endpoints require authentication
        # Test without auth

        await self.test_endpoint(
            "Bingo API",
            f"{API_V1}/bingo/card",
            expected_status=401  # Expecting unauthorized
        )

    async def test_social_endpoints(self):
        """Test social features endpoints"""
        print("👥 測試 Social API...")

        # Get public readings (if available)
        await self.test_endpoint(
            "Social API",
            f"{API_V1}/social/readings/public",
            expected_status=200
        )

    async def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        print("📈 測試 Analytics API...")

        # Get popular cards
        await self.test_endpoint(
            "Analytics API",
            f"{API_V1}/analytics/cards/popular",
            expected_status=200
        )

    async def test_performance(self):
        """Test API performance"""
        print("⚡ 測試 API 效能...")

        # Test concurrent requests
        start_time = time.time()
        tasks = [
            self.client.get(f"{API_V1}/cards")
            for _ in range(10)
        ]
        responses = await asyncio.gather(*tasks)
        total_time = time.time() - start_time

        all_success = all(r.status_code == 200 for r in responses)

        self.report.add_result(
            "Performance",
            f"{API_V1}/cards",
            "CONCURRENT",
            "PASS" if all_success else "FAIL",
            total_time / 10,  # Average per request
            {
                "concurrent_requests": 10,
                "total_time": round(total_time, 2),
                "avg_response_time": round(total_time / 10, 2),
                "all_success": all_success
            }
        )


# Validation helper functions
def assert_field_exists(data: Dict, field: str):
    """Assert field exists in response"""
    assert field in data, f"Missing required field: {field}"

def assert_is_list(data):
    """Assert data is a list"""
    assert isinstance(data, list), "Expected list response"

def assert_min_length(data: list, min_length: int, msg: str = ""):
    """Assert minimum list length"""
    assert len(data) >= min_length, msg or f"Expected at least {min_length} items"

def assert_in(value, options: list):
    """Assert value in options"""
    assert value in options, f"Expected one of {options}, got {value}"

def assert_card_structure(card: Dict):
    """Validate card structure"""
    required_fields = ["id", "name", "arcana", "suit"]
    for field in required_fields:
        assert_field_exists(card, field)


async def main():
    """Main test execution"""
    async with APITester(BASE_URL) as tester:
        await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
