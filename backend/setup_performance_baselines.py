#!/usr/bin/env python3
"""
Performance Baseline Setup Script
Establishes performance baselines for Wasteland Tarot API
"""

import asyncio
import json
import time
import statistics
from datetime import datetime
from typing import Dict, List, Any

import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.monitoring.performance import performance_monitor, run_load_test
from app.services.user_service import UserService, AuthenticationService
from app.services.wasteland_card_service import WastelandCardService
from app.services.reading_service import ReadingService
from app.db.session import get_db
from app.db.seed_data import seed_database


class BaselineEstablisher:
    """Establishes performance baselines through testing"""

    def __init__(self):
        self.results: Dict[str, List[float]] = {
            "user_creation": [],
            "user_authentication": [],
            "card_retrieval": [],
            "reading_creation": [],
            "api_response_times": [],
            "memory_usage": [],
            "concurrent_performance": []
        }

    async def run_baseline_tests(self):
        """Run comprehensive baseline tests"""
        print("🚀 Starting Performance Baseline Establishment")
        print("=" * 60)

        # Test database operations
        await self._test_database_operations()

        # Test API performance
        await self._test_api_performance()

        # Test concurrent operations
        await self._test_concurrent_performance()

        # Generate baseline recommendations
        baselines = self._calculate_baselines()

        # Save results
        await self._save_results(baselines)

        print("\n🎉 Baseline establishment complete!")
        return baselines

    async def _test_database_operations(self):
        """Test database operation performance"""
        print("\n📊 Testing Database Operations...")

        async for db in get_db():
            try:
                # Seed database if needed (skip if fails)
                try:
                    await seed_database(db)
                except Exception as e:
                    print(f"Error seeding database: {e}")
                    print("Continuing with existing data...")

                user_service = UserService(db)
                auth_service = AuthenticationService(db)
                card_service = WastelandCardService(db)
                reading_service = ReadingService(db)

                # Test user creation
                print("  Testing user creation...")
                for i in range(10):
                    start_time = time.time()

                    user_data = {
                        "username": f"baseline_user_{i}_{int(time.time())}",
                        "email": f"baseline_{i}_{int(time.time())}@example.com",
                        "password": "BaselinePassword123!"
                    }

                    user = await user_service.create_user(user_data)
                    duration = (time.time() - start_time) * 1000
                    self.results["user_creation"].append(duration)

                    # Test authentication with the same user
                    start_time = time.time()
                    await auth_service.login_user(user_data["username"], user_data["password"])
                    duration = (time.time() - start_time) * 1000
                    self.results["user_authentication"].append(duration)

                    print(f"    User {i+1}/10 created and authenticated")

                # Test card retrieval
                print("  Testing card retrieval...")
                for i in range(20):
                    start_time = time.time()
                    await card_service.get_all_cards()
                    duration = (time.time() - start_time) * 1000
                    self.results["card_retrieval"].append(duration)

                print(f"    Completed {len(self.results['card_retrieval'])} card retrievals")

                # Test reading creation
                print("  Testing reading creation...")
                test_user = await user_service.create_user({
                    "username": f"reading_test_{int(time.time())}",
                    "email": f"reading_{int(time.time())}@example.com",
                    "password": "ReadingPassword123!"
                })

                for i in range(15):
                    start_time = time.time()

                    reading_data = {
                        "user_id": test_user.id,
                        "question": f"Test question {i}",
                        "reading_type": "single_card",
                        "cards_drawn": ["the_wanderer"],
                        "interpretations": {"card": f"Test interpretation {i}"}
                    }

                    await reading_service.create_reading(reading_data)
                    duration = (time.time() - start_time) * 1000
                    self.results["reading_creation"].append(duration)

                print(f"    Completed {len(self.results['reading_creation'])} reading creations")

            finally:
                break

    async def _test_api_performance(self):
        """Test API endpoint performance"""
        print("\n🌐 Testing API Performance...")

        # Simulate API calls by testing service methods directly
        # In a real scenario, you'd make HTTP requests

        async for db in get_db():
            try:
                card_service = WastelandCardService(db)

                # Test various API operations
                operations = [
                    ("get_all_cards", lambda: card_service.get_all_cards()),
                    ("calculate_deck_statistics", lambda: card_service.calculate_deck_statistics()),
                    ("draw_cards", lambda: card_service.draw_cards_with_radiation_shuffle(3)),
                ]

                for op_name, operation in operations:
                    for i in range(10):
                        start_time = time.time()
                        await operation()
                        duration = (time.time() - start_time) * 1000
                        self.results["api_response_times"].append(duration)

                    print(f"    Completed {op_name} tests")

            finally:
                break

    async def _test_concurrent_performance(self):
        """Test concurrent operation performance"""
        print("\n🔄 Testing Concurrent Performance...")

        async def test_operation():
            async for db in get_db():
                try:
                    card_service = WastelandCardService(db)
                    await card_service.get_all_cards()
                finally:
                    break

        # Test with different concurrency levels
        for concurrent_users in [5, 10, 20]:
            print(f"  Testing with {concurrent_users} concurrent users...")

            result = await run_load_test(
                test_operation,
                concurrent_users=concurrent_users,
                duration_seconds=10
            )

            avg_response_time = result.average_response_time
            self.results["concurrent_performance"].append({
                "concurrent_users": concurrent_users,
                "avg_response_time": avg_response_time,
                "requests_per_second": result.requests_per_second,
                "success_rate": result.success_rate
            })

            print(f"    Avg response time: {avg_response_time:.2f}ms")
            print(f"    Requests/sec: {result.requests_per_second:.2f}")
            print(f"    Success rate: {result.success_rate:.2%}")

    def _calculate_baselines(self) -> Dict[str, Any]:
        """Calculate baseline values from test results"""
        print("\n📈 Calculating Baselines...")

        baselines = {}

        # Calculate statistics for each metric
        for metric_name, values in self.results.items():
            if not values:
                continue

            if metric_name == "concurrent_performance":
                # Special handling for concurrent performance
                response_times = [item["avg_response_time"] for item in values]
                baselines[metric_name] = {
                    "avg_response_time": statistics.mean(response_times),
                    "max_response_time": max(response_times),
                    "details": values
                }
            else:
                # Numeric values
                if all(isinstance(v, (int, float)) for v in values):
                    baselines[metric_name] = {
                        "count": len(values),
                        "mean": statistics.mean(values),
                        "median": statistics.median(values),
                        "min": min(values),
                        "max": max(values),
                        "std_dev": statistics.stdev(values) if len(values) > 1 else 0,
                        "p95": sorted(values)[int(len(values) * 0.95)] if len(values) > 20 else max(values),
                        "p99": sorted(values)[int(len(values) * 0.99)] if len(values) > 100 else max(values)
                    }

        # Calculate recommended baselines
        recommended_baselines = self._generate_recommendations(baselines)

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "test_results": baselines,
            "recommended_baselines": recommended_baselines,
            "system_info": self._get_system_info()
        }

    def _generate_recommendations(self, baselines: Dict[str, Any]) -> Dict[str, Dict[str, float]]:
        """Generate recommended baseline values"""
        recommendations = {}

        # API Response Time baselines
        if "api_response_times" in baselines:
            api_stats = baselines["api_response_times"]
            recommendations["api_response_time"] = {
                "target": api_stats["median"] * 1.2,  # 20% above median
                "warning": api_stats["p95"],  # 95th percentile
                "critical": api_stats["p95"] * 2  # 2x 95th percentile
            }

        # User Creation baselines
        if "user_creation" in baselines:
            user_stats = baselines["user_creation"]
            recommendations["user_creation_time"] = {
                "target": user_stats["median"] * 1.1,
                "warning": user_stats["p95"],
                "critical": user_stats["max"]
            }

        # Authentication baselines
        if "user_authentication" in baselines:
            auth_stats = baselines["user_authentication"]
            recommendations["authentication_time"] = {
                "target": auth_stats["median"] * 1.1,
                "warning": auth_stats["p95"],
                "critical": auth_stats["max"]
            }

        # Card retrieval baselines
        if "card_retrieval" in baselines:
            card_stats = baselines["card_retrieval"]
            recommendations["card_retrieval_time"] = {
                "target": card_stats["median"] * 1.1,
                "warning": card_stats["p95"],
                "critical": card_stats["max"]
            }

        # Reading creation baselines
        if "reading_creation" in baselines:
            reading_stats = baselines["reading_creation"]
            recommendations["reading_creation_time"] = {
                "target": reading_stats["median"] * 1.1,
                "warning": reading_stats["p95"],
                "critical": reading_stats["max"]
            }

        return recommendations

    def _get_system_info(self) -> Dict[str, Any]:
        """Get system information for baseline context"""
        import platform
        import os

        try:
            import psutil
            cpu_count = psutil.cpu_count()
            try:
                memory_total_gb = psutil.virtual_memory().total / 1024 / 1024 / 1024
            except:
                memory_total_gb = 0.0
        except:
            cpu_count = os.cpu_count() or 1
            memory_total_gb = 0.0

        return {
            "platform": platform.platform(),
            "python_version": platform.python_version(),
            "cpu_count": cpu_count,
            "memory_total_gb": memory_total_gb,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def _save_results(self, baselines: Dict[str, Any]):
        """Save baseline results to file"""
        filename = f"performance_baselines_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(backend_dir, filename)

        with open(filepath, 'w') as f:
            json.dump(baselines, f, indent=2, default=str)

        print(f"\n💾 Results saved to: {filepath}")

        # Also save latest baselines
        latest_filepath = os.path.join(backend_dir, "performance_baselines_latest.json")
        with open(latest_filepath, 'w') as f:
            json.dump(baselines, f, indent=2, default=str)

        print(f"💾 Latest baselines saved to: {latest_filepath}")

        # Update performance monitor baselines
        recommended = baselines.get("recommended_baselines", {})
        if recommended:
            performance_monitor.baselines.update(recommended)
            print("📊 Performance monitor baselines updated")

        # Print summary
        self._print_summary(baselines)

    def _print_summary(self, baselines: Dict[str, Any]):
        """Print baseline summary"""
        print("\n" + "="*60)
        print("📊 PERFORMANCE BASELINE SUMMARY")
        print("="*60)

        recommended = baselines.get("recommended_baselines", {})

        for metric_name, values in recommended.items():
            print(f"\n🎯 {metric_name.replace('_', ' ').title()}:")
            print(f"   Target:   {values.get('target', 'N/A'):.2f}ms")
            print(f"   Warning:  {values.get('warning', 'N/A'):.2f}ms")
            print(f"   Critical: {values.get('critical', 'N/A'):.2f}ms")

        print("\n" + "="*60)
        print("✅ Baselines established successfully!")
        print("   Use these values to configure monitoring alerts")
        print("   Regular re-baselining recommended (monthly)")
        print("="*60)


async def main():
    """Main function to establish baselines"""
    establisher = BaselineEstablisher()

    try:
        baselines = await establisher.run_baseline_tests()
        return True
    except Exception as e:
        print(f"❌ Error establishing baselines: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)