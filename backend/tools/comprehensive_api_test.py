#!/usr/bin/env python3
"""
Comprehensive Backend API Testing Suite
========================================

Tests all aspects of the refactored backend API including:
- Schema verification
- API endpoints
- Error handling
- Performance
- Data integrity
"""

import asyncio
import httpx
import json
import time
from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict


class ComprehensiveAPITester:
    """Complete API testing suite"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.results = defaultdict(list)
        self.metrics = defaultdict(dict)

    def log(self, category: str, test: str, status: str, details: str = ""):
        """Log test result"""
        self.results[category].append({
            "test": test,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

        icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{icon} [{category}] {test}: {status}")
        if details:
            print(f"   → {details}")

    async def test_health_check(self):
        """Test health check endpoint"""
        category = "Health Check"

        try:
            start = time.time()
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health")
                elapsed = (time.time() - start) * 1000

            if response.status_code == 200:
                data = response.json()
                self.log(category, "Health endpoint", "PASS",
                        f"Response time: {elapsed:.2f}ms")

                # Check components
                components = data.get("components", {})
                for name, status in components.items():
                    if "🟢" in status:
                        self.log(category, f"Component: {name}", "PASS", status)
                    else:
                        self.log(category, f"Component: {name}", "WARN", status)

                self.metrics["performance"]["health_check_ms"] = elapsed
            else:
                self.log(category, "Health endpoint", "FAIL",
                        f"Status: {response.status_code}")

        except Exception as e:
            self.log(category, "Health endpoint", "FAIL", str(e))

    async def test_cards_api(self):
        """Test Cards API endpoints"""
        category = "Cards API"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Test 1: Get all cards
                start = time.time()
                response = await client.get(f"{self.base_url}/api/v1/cards/")
                elapsed = (time.time() - start) * 1000

                if response.status_code == 200:
                    data = response.json()
                    total_cards = data.get("total_count", 0)
                    cards = data.get("cards", [])

                    self.log(category, "GET /api/v1/cards/", "PASS",
                            f"{total_cards} cards, {elapsed:.2f}ms")

                    if total_cards == 78:
                        self.log(category, "Card count verification", "PASS",
                                "78 cards as expected")
                    else:
                        self.log(category, "Card count verification", "FAIL",
                                f"Expected 78, got {total_cards}")

                    self.metrics["performance"]["cards_list_ms"] = elapsed
                    self.metrics["data"]["total_cards"] = total_cards

                    # Test 2: Check first card structure
                    if cards:
                        first_card = cards[0]
                        required_fields = [
                            "id", "name", "suit", "number",
                            "good_karma_interpretation",
                            "neutral_karma_interpretation",
                            "evil_karma_interpretation",
                            "character_voices",
                            "faction_meanings",
                            "visuals",
                            "stats"
                        ]

                        missing = [f for f in required_fields if f not in first_card]
                        if not missing:
                            self.log(category, "Card structure verification", "PASS",
                                    "All required fields present")
                        else:
                            self.log(category, "Card structure verification", "FAIL",
                                    f"Missing fields: {missing}")

                        # Check nested structures
                        if "metadata" in first_card:
                            metadata = first_card["metadata"]
                            if "vault_number" in metadata:
                                self.log(category, "New field: vault_number", "PASS",
                                        f"Value: {metadata['vault_number']}")

                        if "character_voices" in first_card:
                            voices = first_card["character_voices"]
                            voice_fields = [
                                "pip_boy_analysis",
                                "vault_dweller_perspective",
                                "wasteland_trader_wisdom",
                                "super_mutant_simplicity",
                                "codsworth_analysis"
                            ]
                            missing_voices = [f for f in voice_fields if f not in voices]
                            if not missing_voices:
                                self.log(category, "Character voices fields", "PASS",
                                        "All 5 voice fields present")
                            else:
                                self.log(category, "Character voices fields", "FAIL",
                                        f"Missing: {missing_voices}")
                else:
                    self.log(category, "GET /api/v1/cards/", "FAIL",
                            f"Status: {response.status_code}")

                # Test 3: Get single card
                start = time.time()
                response = await client.get(f"{self.base_url}/api/v1/cards/random")
                elapsed = (time.time() - start) * 1000

                if response.status_code == 200:
                    self.log(category, "GET /api/v1/cards/random", "PASS",
                            f"{elapsed:.2f}ms")
                    self.metrics["performance"]["card_random_ms"] = elapsed
                else:
                    self.log(category, "GET /api/v1/cards/random", "FAIL",
                            f"Status: {response.status_code}")

                # Test 4: Pagination
                response = await client.get(
                    f"{self.base_url}/api/v1/cards/?page=1&page_size=10"
                )
                if response.status_code == 200:
                    data = response.json()
                    if len(data.get("cards", [])) == 10:
                        self.log(category, "Pagination", "PASS",
                                "Page size working correctly")
                    else:
                        self.log(category, "Pagination", "FAIL",
                                f"Expected 10 cards, got {len(data.get('cards', []))}")

                # Test 5: Filtering
                response = await client.get(
                    f"{self.base_url}/api/v1/cards/?suit=major_arcana"
                )
                if response.status_code == 200:
                    data = response.json()
                    total = data.get("total_count", 0)
                    self.log(category, "Filter by suit", "PASS",
                            f"Found {total} major arcana cards")

        except Exception as e:
            self.log(category, "Cards API", "FAIL", str(e))

    async def test_other_endpoints(self):
        """Test other API endpoints"""
        category = "Other APIs"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Test readings endpoint
                response = await client.get(f"{self.base_url}/api/v1/readings/")
                if response.status_code in [200, 401]:  # May require auth
                    self.log(category, "GET /api/v1/readings/", "PASS",
                            f"Status: {response.status_code}")
                elif response.status_code == 307:
                    self.log(category, "GET /api/v1/readings/", "FAIL",
                            "307 Redirect error (should be fixed)")
                else:
                    self.log(category, "GET /api/v1/readings/", "WARN",
                            f"Status: {response.status_code}")

                # Test spreads endpoint
                response = await client.get(f"{self.base_url}/api/v1/spreads/")
                if response.status_code in [200, 401]:
                    self.log(category, "GET /api/v1/spreads/", "PASS",
                            f"Status: {response.status_code}")
                elif response.status_code == 307:
                    self.log(category, "GET /api/v1/spreads/", "FAIL",
                            "307 Redirect error (should be fixed)")
                else:
                    self.log(category, "GET /api/v1/spreads/", "WARN",
                            f"Status: {response.status_code}")

                # Test bingo endpoint
                response = await client.get(
                    f"{self.base_url}/api/v1/bingo/card?user_id=test-user"
                )
                if response.status_code in [200, 404, 401]:
                    self.log(category, "GET /api/v1/bingo/card", "PASS",
                            f"Status: {response.status_code}")
                else:
                    self.log(category, "GET /api/v1/bingo/card", "WARN",
                            f"Status: {response.status_code}")

        except Exception as e:
            self.log(category, "Other APIs", "FAIL", str(e))

    async def test_error_handling(self):
        """Test error handling improvements"""
        category = "Error Handling"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Test 1: Invalid card ID
                response = await client.get(
                    f"{self.base_url}/api/v1/cards/invalid-uuid-123"
                )
                if response.status_code in [400, 404, 422]:
                    data = response.json()
                    if "error" in data or "detail" in data:
                        self.log(category, "Invalid card ID error", "PASS",
                                "Returns proper error response")
                    else:
                        self.log(category, "Invalid card ID error", "WARN",
                                "Error response missing details")
                else:
                    self.log(category, "Invalid card ID error", "FAIL",
                            f"Unexpected status: {response.status_code}")

                # Test 2: Invalid pagination
                response = await client.get(
                    f"{self.base_url}/api/v1/cards/?page=-1"
                )
                if response.status_code == 422:
                    self.log(category, "Invalid pagination error", "PASS",
                            "Validates pagination parameters")
                else:
                    self.log(category, "Invalid pagination error", "WARN",
                            f"Status: {response.status_code}")

        except Exception as e:
            self.log(category, "Error handling tests", "FAIL", str(e))

    async def test_performance(self):
        """Test API performance"""
        category = "Performance"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Test concurrent requests
                tasks = []
                for _ in range(10):
                    tasks.append(client.get(f"{self.base_url}/api/v1/cards/random"))

                start = time.time()
                responses = await asyncio.gather(*tasks, return_exceptions=True)
                elapsed = (time.time() - start) * 1000

                successful = sum(1 for r in responses
                               if not isinstance(r, Exception) and r.status_code == 200)

                if successful == 10:
                    self.log(category, "Concurrent requests (10)", "PASS",
                            f"All succeeded in {elapsed:.2f}ms")
                    self.metrics["performance"]["concurrent_10_ms"] = elapsed
                else:
                    self.log(category, "Concurrent requests (10)", "WARN",
                            f"{successful}/10 succeeded in {elapsed:.2f}ms")

        except Exception as e:
            self.log(category, "Performance tests", "FAIL", str(e))

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)

        total_tests = 0
        total_pass = 0
        total_fail = 0
        total_warn = 0

        for category, tests in self.results.items():
            print(f"\n{category}:")
            print("-" * 40)

            pass_count = sum(1 for t in tests if t["status"] == "PASS")
            fail_count = sum(1 for t in tests if t["status"] == "FAIL")
            warn_count = sum(1 for t in tests if t["status"] == "WARN")

            total_tests += len(tests)
            total_pass += pass_count
            total_fail += fail_count
            total_warn += warn_count

            print(f"  ✅ Passed: {pass_count}")
            print(f"  ❌ Failed: {fail_count}")
            print(f"  ⚠️  Warnings: {warn_count}")

        print("\n" + "="*80)
        print("OVERALL RESULTS")
        print("="*80)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {total_pass} ({total_pass/total_tests*100:.1f}%)")
        print(f"❌ Failed: {total_fail} ({total_fail/total_tests*100:.1f}%)")
        print(f"⚠️  Warnings: {total_warn} ({total_warn/total_tests*100:.1f}%)")

        if self.metrics.get("performance"):
            print("\n" + "="*80)
            print("PERFORMANCE METRICS")
            print("="*80)
            for metric, value in self.metrics["performance"].items():
                print(f"  {metric}: {value:.2f}ms")

        if self.metrics.get("data"):
            print("\n" + "="*80)
            print("DATA METRICS")
            print("="*80)
            for metric, value in self.metrics["data"].items():
                print(f"  {metric}: {value}")

        print("\n" + "="*80)

        # Save results to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"test_results_{timestamp}.json"
        with open(filename, "w") as f:
            json.dump({
                "results": dict(self.results),
                "metrics": dict(self.metrics),
                "summary": {
                    "total": total_tests,
                    "passed": total_pass,
                    "failed": total_fail,
                    "warnings": total_warn,
                    "pass_rate": f"{total_pass/total_tests*100:.1f}%"
                }
            }, f, indent=2)

        print(f"📄 Detailed results saved to: {filename}\n")

    async def run_all_tests(self):
        """Run all tests"""
        print("="*80)
        print("COMPREHENSIVE BACKEND API TEST SUITE")
        print("="*80)
        print(f"Testing: {self.base_url}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")

        await self.test_health_check()
        print()

        await self.test_cards_api()
        print()

        await self.test_other_endpoints()
        print()

        await self.test_error_handling()
        print()

        await self.test_performance()
        print()

        self.print_summary()


async def main():
    """Main entry point"""
    tester = ComprehensiveAPITester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
