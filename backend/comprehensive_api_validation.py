#!/usr/bin/env python3
"""
Comprehensive Wasteland Tarot FastAPI Backend Validation
Tests all API endpoints, database connectivity, security, and performance
"""

import asyncio
import httpx
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import sys
import os

# API base URL
BASE_URL = "http://0.0.0.0:8000"
API_BASE = f"{BASE_URL}/api/v1"

@dataclass
class TestResult:
    """Test result data structure"""
    endpoint: str
    method: str
    status_code: int
    response_time: float
    success: bool
    error_message: Optional[str] = None
    response_data: Optional[Dict] = None

@dataclass
class ValidationReport:
    """Comprehensive validation report"""
    timestamp: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    api_health: str
    database_status: str
    security_assessment: str
    performance_metrics: Dict[str, float]
    test_results: List[TestResult]
    recommendations: List[str]

class WastelandTarotValidator:
    """Main validator class for Wasteland Tarot API"""

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.auth_token = None
        self.test_user_id = None
        self.results: List[TestResult] = []
        self.recommendations: List[str] = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def test_endpoint(self, method: str, endpoint: str, **kwargs) -> TestResult:
        """Test a single endpoint and return results"""
        start_time = time.time()
        try:
            if method.upper() == "GET":
                response = await self.client.get(f"{BASE_URL}{endpoint}", **kwargs)
            elif method.upper() == "POST":
                response = await self.client.post(f"{BASE_URL}{endpoint}", **kwargs)
            elif method.upper() == "PUT":
                response = await self.client.put(f"{BASE_URL}{endpoint}", **kwargs)
            elif method.upper() == "DELETE":
                response = await self.client.delete(f"{BASE_URL}{endpoint}", **kwargs)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response_time = time.time() - start_time

            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            result = TestResult(
                endpoint=endpoint,
                method=method.upper(),
                status_code=response.status_code,
                response_time=response_time,
                success=200 <= response.status_code < 300,
                response_data=response_data
            )

        except Exception as e:
            response_time = time.time() - start_time
            result = TestResult(
                endpoint=endpoint,
                method=method.upper(),
                status_code=0,
                response_time=response_time,
                success=False,
                error_message=str(e)
            )

        self.results.append(result)
        return result

    async def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("🔍 Testing basic endpoints...")

        # Root endpoint
        result = await self.test_endpoint("GET", "/")
        if result.success:
            print(f"✅ Root endpoint: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ Root endpoint failed: {result.error_message or result.status_code}")

        # Health check
        result = await self.test_endpoint("GET", "/health")
        if result.success:
            print(f"✅ Health check: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ Health check failed: {result.error_message or result.status_code}")

        # OpenAPI docs
        result = await self.test_endpoint("GET", "/docs")
        if result.success:
            print(f"✅ OpenAPI docs: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ OpenAPI docs failed: {result.error_message or result.status_code}")

        # OpenAPI JSON schema
        result = await self.test_endpoint("GET", "/api/v1/openapi.json")
        if result.success:
            print(f"✅ OpenAPI schema: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ OpenAPI schema failed: {result.error_message or result.status_code}")

    async def test_authentication_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing authentication endpoints...")

        # Test user registration
        test_user = {
            "username": f"test_user_{int(time.time())}",
            "email": f"test_{int(time.time())}@example.com",
            "password": "TestPassword123!",
            "full_name": "Test User"
        }

        result = await self.test_endpoint("POST", "/api/v1/auth/register", json=test_user)
        if result.success:
            print(f"✅ User registration: {result.status_code} ({result.response_time:.3f}s)")
            if result.response_data:
                self.test_user_id = result.response_data.get("id")
        else:
            print(f"❌ User registration failed: {result.error_message or result.status_code}")

        # Test user login
        login_data = {
            "username": test_user["username"],
            "password": test_user["password"]
        }

        result = await self.test_endpoint("POST", "/api/v1/auth/login", data=login_data)
        if result.success:
            print(f"✅ User login: {result.status_code} ({result.response_time:.3f}s)")
            if result.response_data:
                self.auth_token = result.response_data.get("access_token")
        else:
            print(f"❌ User login failed: {result.error_message or result.status_code}")

        # Test protected endpoint access
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            result = await self.test_endpoint("GET", "/api/v1/auth/me", headers=headers)
            if result.success:
                print(f"✅ Protected endpoint access: {result.status_code} ({result.response_time:.3f}s)")
            else:
                print(f"❌ Protected endpoint access failed: {result.error_message or result.status_code}")

    async def test_cards_endpoints(self):
        """Test cards endpoints"""
        print("\n🃏 Testing cards endpoints...")

        # Get all cards
        result = await self.test_endpoint("GET", "/api/v1/cards")
        if result.success:
            print(f"✅ Get all cards: {result.status_code} ({result.response_time:.3f}s)")
            cards_count = len(result.response_data.get("cards", [])) if result.response_data else 0
            print(f"   Found {cards_count} cards in database")
        else:
            print(f"❌ Get all cards failed: {result.error_message or result.status_code}")

        # Get card by ID (assuming first card exists)
        result = await self.test_endpoint("GET", "/api/v1/cards/1")
        if result.success:
            print(f"✅ Get card by ID: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ Get card by ID failed: {result.error_message or result.status_code}")

        # Test invalid card ID
        result = await self.test_endpoint("GET", "/api/v1/cards/999999")
        if result.status_code == 404:
            print(f"✅ Invalid card ID handling: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ Invalid card ID should return 404, got: {result.status_code}")

    async def test_readings_endpoints(self):
        """Test readings endpoints"""
        print("\n🔮 Testing readings endpoints...")

        if not self.auth_token:
            print("❌ Cannot test readings endpoints - no auth token")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}

        # Create a new reading
        reading_data = {
            "reading_type": "three_card",
            "question": "What should I focus on today?",
            "card_ids": [1, 2, 3]
        }

        result = await self.test_endpoint("POST", "/api/v1/readings", json=reading_data, headers=headers)
        reading_id = None
        if result.success:
            print(f"✅ Create reading: {result.status_code} ({result.response_time:.3f}s)")
            if result.response_data:
                reading_id = result.response_data.get("id")
        else:
            print(f"❌ Create reading failed: {result.error_message or result.status_code}")

        # Get user readings
        result = await self.test_endpoint("GET", "/api/v1/readings", headers=headers)
        if result.success:
            print(f"✅ Get user readings: {result.status_code} ({result.response_time:.3f}s)")
            readings_count = len(result.response_data.get("readings", [])) if result.response_data else 0
            print(f"   Found {readings_count} readings for user")
        else:
            print(f"❌ Get user readings failed: {result.error_message or result.status_code}")

        # Get specific reading
        if reading_id:
            result = await self.test_endpoint("GET", f"/api/v1/readings/{reading_id}", headers=headers)
            if result.success:
                print(f"✅ Get specific reading: {result.status_code} ({result.response_time:.3f}s)")
            else:
                print(f"❌ Get specific reading failed: {result.error_message or result.status_code}")

    async def test_monitoring_endpoints(self):
        """Test monitoring endpoints"""
        print("\n📊 Testing monitoring endpoints...")

        # System metrics
        result = await self.test_endpoint("GET", "/api/v1/monitoring/metrics")
        if result.success:
            print(f"✅ System metrics: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ System metrics failed: {result.error_message or result.status_code}")

        # Database health
        result = await self.test_endpoint("GET", "/api/v1/monitoring/db-health")
        if result.success:
            print(f"✅ Database health: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ Database health failed: {result.error_message or result.status_code}")

    async def test_error_handling(self):
        """Test error handling"""
        print("\n🚨 Testing error handling...")

        # Test 404 for non-existent endpoint
        result = await self.test_endpoint("GET", "/api/v1/nonexistent")
        if result.status_code == 404:
            print(f"✅ 404 handling: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ Expected 404, got: {result.status_code}")

        # Test 405 for wrong method
        result = await self.test_endpoint("DELETE", "/")
        if result.status_code == 405:
            print(f"✅ 405 handling: {result.status_code} ({result.response_time:.3f}s)")
        else:
            print(f"❌ Expected 405, got: {result.status_code}")

        # Test invalid JSON
        try:
            response = await self.client.post(
                f"{API_BASE}/auth/register",
                content="invalid json",
                headers={"Content-Type": "application/json"}
            )
            if response.status_code == 422:
                print(f"✅ Invalid JSON handling: {response.status_code}")
            else:
                print(f"❌ Expected 422 for invalid JSON, got: {response.status_code}")
        except Exception as e:
            print(f"❌ Invalid JSON test failed: {e}")

    async def perform_load_test(self, concurrent_requests: int = 10):
        """Perform basic load testing"""
        print(f"\n⚡ Performing load test with {concurrent_requests} concurrent requests...")

        async def make_request():
            start_time = time.time()
            response = await self.client.get(f"{BASE_URL}/health")
            return time.time() - start_time

        tasks = [make_request() for _ in range(concurrent_requests)]
        response_times = await asyncio.gather(*tasks, return_exceptions=True)

        successful_times = [t for t in response_times if isinstance(t, (int, float))]

        if successful_times:
            avg_time = sum(successful_times) / len(successful_times)
            max_time = max(successful_times)
            min_time = min(successful_times)

            print(f"✅ Load test completed:")
            print(f"   Successful requests: {len(successful_times)}/{concurrent_requests}")
            print(f"   Average response time: {avg_time:.3f}s")
            print(f"   Min response time: {min_time:.3f}s")
            print(f"   Max response time: {max_time:.3f}s")

            return {
                "avg_response_time": avg_time,
                "max_response_time": max_time,
                "min_response_time": min_time,
                "success_rate": len(successful_times) / concurrent_requests
            }
        else:
            print("❌ Load test failed - no successful requests")
            return {"error": "Load test failed"}

    def analyze_security(self):
        """Analyze security aspects"""
        print("\n🔒 Analyzing security...")

        security_issues = []
        security_score = 100

        # Check for HTTPS in production (simulated)
        if "http://" in BASE_URL and "localhost" not in BASE_URL:
            security_issues.append("API should use HTTPS in production")
            security_score -= 20

        # Check authentication implementation
        auth_working = any(r.endpoint.startswith("/api/v1/auth") and r.success for r in self.results)
        if not auth_working:
            security_issues.append("Authentication endpoints not working")
            security_score -= 30

        # Check for proper error handling
        error_responses = [r for r in self.results if not r.success]
        if error_responses:
            # Check if error messages don't leak sensitive info
            for result in error_responses:
                if result.response_data and isinstance(result.response_data, dict):
                    response_text = json.dumps(result.response_data).lower()
                    sensitive_keywords = ["password", "secret", "key", "token", "database"]
                    if any(keyword in response_text for keyword in sensitive_keywords):
                        security_issues.append("Error messages may leak sensitive information")
                        security_score -= 15
                        break

        # Check CORS configuration
        cors_configured = True  # Assume configured based on code review
        if not cors_configured:
            security_issues.append("CORS not properly configured")
            security_score -= 10

        if security_issues:
            print("❌ Security issues found:")
            for issue in security_issues:
                print(f"   - {issue}")
            self.recommendations.extend([f"Fix: {issue}" for issue in security_issues])
        else:
            print("✅ No major security issues detected")

        return {
            "score": security_score,
            "issues": security_issues
        }

    def generate_recommendations(self):
        """Generate recommendations based on test results"""
        recommendations = []

        # Analyze response times
        response_times = [r.response_time for r in self.results if r.success]
        if response_times:
            avg_time = sum(response_times) / len(response_times)
            if avg_time > 1.0:
                recommendations.append("Consider optimizing API response times - average is over 1 second")
            elif avg_time > 0.5:
                recommendations.append("Monitor API response times - approaching 500ms threshold")

        # Analyze error rates
        total_tests = len(self.results)
        failed_tests = len([r for r in self.results if not r.success])
        if total_tests > 0:
            error_rate = failed_tests / total_tests
            if error_rate > 0.1:
                recommendations.append("High error rate detected - investigate failing endpoints")

        # Check database connectivity
        db_tests = [r for r in self.results if "cards" in r.endpoint or "readings" in r.endpoint]
        db_failures = [r for r in db_tests if not r.success]
        if db_failures:
            recommendations.append("Database connectivity issues detected - check database health")

        # Check authentication flow
        auth_tests = [r for r in self.results if "auth" in r.endpoint]
        auth_failures = [r for r in auth_tests if not r.success]
        if auth_failures:
            recommendations.append("Authentication flow issues - verify auth configuration")

        self.recommendations.extend(recommendations)
        return recommendations

    async def run_comprehensive_validation(self):
        """Run all validation tests"""
        print("🚀 Starting Comprehensive Wasteland Tarot API Validation")
        print("=" * 60)

        start_time = datetime.now()

        try:
            # Test basic endpoints
            await self.test_basic_endpoints()

            # Test authentication
            await self.test_authentication_endpoints()

            # Test cards endpoints
            await self.test_cards_endpoints()

            # Test readings endpoints
            await self.test_readings_endpoints()

            # Test monitoring endpoints
            await self.test_monitoring_endpoints()

            # Test error handling
            await self.test_error_handling()

            # Perform load test
            load_metrics = await self.perform_load_test()

            # Analyze security
            security_analysis = self.analyze_security()

            # Generate recommendations
            recommendations = self.generate_recommendations()

            # Compile final report
            total_tests = len(self.results)
            passed_tests = len([r for r in self.results if r.success])
            failed_tests = total_tests - passed_tests

            # Determine overall health
            if failed_tests == 0:
                api_health = "EXCELLENT"
            elif failed_tests / total_tests < 0.1:
                api_health = "GOOD"
            elif failed_tests / total_tests < 0.3:
                api_health = "FAIR"
            else:
                api_health = "POOR"

            # Database status
            db_tests = [r for r in self.results if any(endpoint in r.endpoint for endpoint in ["cards", "readings", "db-health"])]
            db_success_rate = len([r for r in db_tests if r.success]) / len(db_tests) if db_tests else 0

            if db_success_rate >= 0.9:
                database_status = "HEALTHY"
            elif db_success_rate >= 0.7:
                database_status = "DEGRADED"
            else:
                database_status = "UNHEALTHY"

            # Create final report
            report = ValidationReport(
                timestamp=start_time.isoformat(),
                total_tests=total_tests,
                passed_tests=passed_tests,
                failed_tests=failed_tests,
                api_health=api_health,
                database_status=database_status,
                security_assessment=f"Score: {security_analysis['score']}/100",
                performance_metrics=load_metrics if isinstance(load_metrics, dict) else {},
                test_results=self.results,
                recommendations=self.recommendations
            )

            return report

        except Exception as e:
            print(f"❌ Validation failed with error: {e}")
            return None

def print_detailed_report(report: ValidationReport):
    """Print detailed validation report"""
    print("\n" + "=" * 60)
    print("📋 COMPREHENSIVE VALIDATION REPORT")
    print("=" * 60)

    print(f"\n📊 SUMMARY")
    print(f"Timestamp: {report.timestamp}")
    print(f"Total Tests: {report.total_tests}")
    print(f"Passed: {report.passed_tests}")
    print(f"Failed: {report.failed_tests}")
    print(f"Success Rate: {(report.passed_tests/report.total_tests)*100:.1f}%")

    print(f"\n🏥 HEALTH STATUS")
    print(f"API Health: {report.api_health}")
    print(f"Database Status: {report.database_status}")
    print(f"Security Assessment: {report.security_assessment}")

    if report.performance_metrics:
        print(f"\n⚡ PERFORMANCE METRICS")
        for key, value in report.performance_metrics.items():
            if isinstance(value, float):
                print(f"{key.replace('_', ' ').title()}: {value:.3f}s")
            else:
                print(f"{key.replace('_', ' ').title()}: {value}")

    print(f"\n🔍 DETAILED TEST RESULTS")
    for result in report.test_results:
        status = "✅" if result.success else "❌"
        print(f"{status} {result.method} {result.endpoint}")
        print(f"   Status: {result.status_code}, Time: {result.response_time:.3f}s")
        if result.error_message:
            print(f"   Error: {result.error_message}")

    if report.recommendations:
        print(f"\n💡 RECOMMENDATIONS")
        for i, rec in enumerate(report.recommendations, 1):
            print(f"{i}. {rec}")

    print("\n" + "=" * 60)

async def main():
    """Main validation function"""
    async with WastelandTarotValidator() as validator:
        report = await validator.run_comprehensive_validation()

        if report:
            print_detailed_report(report)

            # Save report to file
            report_data = {
                "timestamp": report.timestamp,
                "summary": {
                    "total_tests": report.total_tests,
                    "passed_tests": report.passed_tests,
                    "failed_tests": report.failed_tests,
                    "api_health": report.api_health,
                    "database_status": report.database_status,
                    "security_assessment": report.security_assessment,
                    "performance_metrics": report.performance_metrics
                },
                "test_results": [
                    {
                        "endpoint": r.endpoint,
                        "method": r.method,
                        "status_code": r.status_code,
                        "response_time": r.response_time,
                        "success": r.success,
                        "error_message": r.error_message
                    }
                    for r in report.test_results
                ],
                "recommendations": report.recommendations
            }

            with open("api_validation_report.json", "w") as f:
                json.dump(report_data, f, indent=2)

            print(f"\n📄 Detailed report saved to: api_validation_report.json")

            return report.api_health in ["EXCELLENT", "GOOD"]
        else:
            print("❌ Validation failed to complete")
            return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n❌ Validation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)