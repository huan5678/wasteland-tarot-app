#!/usr/bin/env python3
"""
Test script for Wasteland Tarot API endpoints
Tests basic functionality with Supabase backend
"""

import asyncio
import httpx
import json
from supabase import create_client

# Configuration
API_BASE_URL = "http://localhost:8000"
SUPABASE_URL = "https://aelwaolzpraxmzjqdiyw.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlbHdhb2x6cHJheG16anFkaXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYzNTIwNywiZXhwIjoyMDc0MjExMjA3fQ.RvRptRqlpJJjTVek5wT_uiVCTUatF9dtnBYvJ8Txra0"

async def test_supabase_direct():
    """Test direct Supabase access"""
    print("🔍 Testing direct Supabase access...")

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        result = supabase.table('wasteland_cards').select('name', 'suit').limit(3).execute()

        if result.data:
            print(f"✅ Direct Supabase access successful. Found {len(result.data)} cards:")
            for card in result.data:
                print(f"   - {card['name']} ({card['suit']})")
            return True
        else:
            print("❌ No data returned from Supabase")
            return False

    except Exception as e:
        print(f"❌ Direct Supabase access failed: {e}")
        return False

async def test_api_endpoint(endpoint: str, expected_status: int = 200):
    """Test a specific API endpoint"""
    url = f"{API_BASE_URL}{endpoint}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)

            if response.status_code == expected_status:
                print(f"✅ {endpoint} -> {response.status_code}")

                if response.headers.get("content-type", "").startswith("application/json"):
                    data = response.json()
                    if isinstance(data, list):
                        print(f"   📊 Returned {len(data)} items")
                    elif isinstance(data, dict):
                        print(f"   📄 Returned object with keys: {list(data.keys())}")

                return True
            else:
                print(f"❌ {endpoint} -> {response.status_code} (expected {expected_status})")
                print(f"   Response: {response.text[:200]}...")
                return False

    except httpx.ConnectError:
        print(f"❌ {endpoint} -> Connection failed (server not running?)")
        return False
    except Exception as e:
        print(f"❌ {endpoint} -> Error: {e}")
        return False

async def test_api_server():
    """Test if API server is running and endpoints work"""
    print("\n🚀 Testing API server endpoints...")

    endpoints_to_test = [
        "/",
        "/health",
        "/api/v1/cards/",
        "/api/v1/cards/major-arcana/",
        "/api/v1/cards/stats/deck"
    ]

    results = []
    for endpoint in endpoints_to_test:
        result = await test_api_endpoint(endpoint)
        results.append(result)

    successful = sum(results)
    total = len(results)

    print(f"\n📊 API Test Results: {successful}/{total} endpoints working")
    return successful == total

async def check_server_is_running():
    """Check if the FastAPI server is running"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{API_BASE_URL}/health", timeout=5.0)
            return response.status_code == 200
    except:
        return False

def start_server_instructions():
    """Print instructions for starting the server"""
    print("\n🔧 To start the FastAPI server, run:")
    print("cd /Users/sean/Documents/React/tarot-card-nextjs-app/backend")
    print("uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("\nThen run this test script again to verify the endpoints.")

async def main():
    """Main test function"""
    print("🎴 Wasteland Tarot API - Endpoint Testing")
    print("=" * 50)

    # Test direct Supabase access first
    supabase_ok = await test_supabase_direct()

    if not supabase_ok:
        print("\n❌ Direct Supabase access failed. Cannot proceed with API tests.")
        return

    # Check if server is running
    print("\n🔍 Checking if API server is running...")
    server_running = await check_server_is_running()

    if not server_running:
        print("❌ API server is not running.")
        start_server_instructions()
        return

    print("✅ API server is running!")

    # Test API endpoints
    api_ok = await test_api_server()

    # Summary
    print("\n📋 Test Summary:")
    print(f"   Direct Supabase Access: {'✅ Working' if supabase_ok else '❌ Failed'}")
    print(f"   API Server Status: {'✅ Running' if server_running else '❌ Not Running'}")
    print(f"   API Endpoints: {'✅ Working' if api_ok else '❌ Some Failed'}")

    if supabase_ok and server_running and api_ok:
        print("\n🎉 All tests passed! Wasteland Tarot API is fully operational!")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    asyncio.run(main())