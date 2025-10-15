#!/usr/bin/env python3
"""
Test session permission fix
Tests the session update endpoint to verify permission checking works correctly
"""

import requests
import json
import time

# API configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test_dashboard@wasteland.com"
TEST_PASSWORD = "Test123456!"

def print_section(title: str):
    """Print a section header"""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}\n")

def login() -> tuple[requests.Session, str]:
    """Login and return session with cookies and user ID"""
    print_section("Step 1: Login")

    # Create a session to persist cookies
    session = requests.Session()

    response = session.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
    )

    print(f"Status: {response.status_code}")

    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return None, None

    data = response.json()
    user_id = data.get("user", {}).get("id")

    # Check if we have the access_token cookie
    cookies = session.cookies.get_dict()
    has_token = "access_token" in cookies

    print(f"✅ Login successful")
    print(f"   User ID: {user_id}")
    print(f"   Has access_token cookie: {has_token}")
    print(f"   Cookies: {list(cookies.keys())}")

    return session, user_id

def create_session(session: requests.Session) -> str:
    """Create a test session and return session ID"""
    print_section("Step 2: Create Session")

    response = session.post(
        f"{BASE_URL}/sessions",
        headers={
            "Content-Type": "application/json"
        },
        json={
            "spread_type": "single_wasteland",
            "question": "Test session permission fix",
            "session_state": {
                "cards_drawn": ["card_1"],
                "current_position": 0
            },
            "spread_config": {},
            "status": "active"
        }
    )

    print(f"Status: {response.status_code}")

    if response.status_code != 201:
        print(f"❌ Session creation failed: {response.text}")
        return None

    data = response.json()
    session_id = data.get("id")
    session_user_id = data.get("user_id")

    print(f"✅ Session created successfully")
    print(f"   Session ID: {session_id}")
    print(f"   User ID: {session_user_id}")

    return session_id

def update_session(session: requests.Session, session_id: str) -> bool:
    """Update the session and check if it succeeds"""
    print_section("Step 3: Update Session (Permission Check)")

    response = session.patch(
        f"{BASE_URL}/sessions/{session_id}",
        headers={
            "Content-Type": "application/json"
        },
        json={
            "session_state": {
                "cards_drawn": ["card_1", "card_2"],
                "current_position": 1
            },
            "status": "active"
        }
    )

    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Session updated successfully")
        print(f"   Session ID: {data.get('id')}")
        print(f"   User ID: {data.get('user_id')}")
        print(f"   Status: {data.get('status')}")
        print(f"   Current Position: {data.get('session_state', {}).get('current_position')}")
        return True
    elif response.status_code == 403:
        print(f"❌ Permission denied (403)")
        print(f"   Error: {response.json().get('detail')}")
        return False
    else:
        print(f"❌ Update failed with status {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def cleanup_session(session: requests.Session, session_id: str):
    """Delete the test session"""
    print_section("Step 4: Cleanup")

    response = session.delete(
        f"{BASE_URL}/sessions/{session_id}"
    )

    if response.status_code == 204:
        print(f"✅ Session deleted successfully")
    else:
        print(f"⚠️  Failed to delete session: {response.status_code}")

def main():
    """Run the test"""
    print("\n" + "=" * 60)
    print("  SESSION PERMISSION FIX TEST")
    print("=" * 60)

    # Step 1: Login
    session, user_id = login()
    if not session:
        print("\n❌ Test failed: Could not login")
        return False

    # Step 2: Create session
    session_id = create_session(session)
    if not session_id:
        print("\n❌ Test failed: Could not create session")
        return False

    # Wait a bit for session to be saved
    time.sleep(0.5)

    # Step 3: Update session (this should succeed now)
    success = update_session(session, session_id)

    # Step 4: Cleanup
    cleanup_session(session, session_id)

    # Final result
    print_section("Test Result")
    if success:
        print("✅ TEST PASSED: Session permission check works correctly!")
        print("   The session was successfully updated by the owner.")
        return True
    else:
        print("❌ TEST FAILED: Session permission check still has issues!")
        print("   The session update was rejected even though the user owns it.")
        return False

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
