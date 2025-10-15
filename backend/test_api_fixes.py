"""
Test script to verify the fixes for GET /api/v1/readings/ and GET /api/v1/sessions

This script tests that both endpoints properly return empty arrays for new users
instead of 500 errors.
"""

import httpx
import asyncio
from typing import Optional


BASE_URL = "http://localhost:8000"


async def test_get_readings(token: Optional[str] = None):
    """Test GET /api/v1/readings/ endpoint"""
    print("\n🧪 Testing GET /api/v1/readings/")
    print("=" * 60)

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{BASE_URL}/api/v1/readings/",
                headers=headers,
                timeout=10.0
            )

            print(f"Status Code: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS: Returned 200")
                print(f"Total Count: {data.get('total_count', 0)}")
                print(f"Readings: {len(data.get('readings', []))}")
                print(f"Response Structure: {list(data.keys())}")
                return True
            else:
                print(f"❌ FAILED: Status {response.status_code}")
                print(f"Error: {response.text}")
                return False

        except Exception as e:
            print(f"❌ FAILED: Exception occurred")
            print(f"Error: {str(e)}")
            return False


async def test_get_sessions(token: Optional[str] = None):
    """Test GET /api/v1/sessions endpoint"""
    print("\n🧪 Testing GET /api/v1/sessions?limit=10")
    print("=" * 60)

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{BASE_URL}/api/v1/sessions",
                params={"limit": 10},
                headers=headers,
                timeout=10.0
            )

            print(f"Status Code: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS: Returned 200")
                print(f"Total: {data.get('total', 0)}")
                print(f"Sessions: {len(data.get('sessions', []))}")
                print(f"Response Structure: {list(data.keys())}")
                return True
            else:
                print(f"❌ FAILED: Status {response.status_code}")
                print(f"Error: {response.text}")
                return False

        except Exception as e:
            print(f"❌ FAILED: Exception occurred")
            print(f"Error: {str(e)}")
            return False


async def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("🚀 Testing Dashboard API Endpoints")
    print("=" * 60)
    print("\nNote: These tests assume:")
    print("1. Backend server is running on http://localhost:8000")
    print("2. Testing with a new user (no existing readings/sessions)")
    print("3. Authentication is disabled or using demo user")

    # Run tests
    readings_ok = await test_get_readings()
    sessions_ok = await test_get_sessions()

    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary")
    print("=" * 60)
    print(f"GET /api/v1/readings/: {'✅ PASS' if readings_ok else '❌ FAIL'}")
    print(f"GET /api/v1/sessions:   {'✅ PASS' if sessions_ok else '❌ FAIL'}")

    if readings_ok and sessions_ok:
        print("\n🎉 All tests passed! The fixes are working correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
