#!/usr/bin/env python3
"""Create test user for dashboard testing"""

import requests
import json

API_BASE = "http://localhost:8000"

# Create test user
user_data = {
    "email": "test_dashboard@wasteland.com",
    "password": "Test123456!",
    "confirm_password": "Test123456!",
    "name": "Dashboard Tester",
    "vault_number": 111
}

print("Creating test user...")
response = requests.post(
    f"{API_BASE}/api/v1/auth/register",
    json=user_data,
    headers={"Content-Type": "application/json"}
)

print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

if response.status_code == 200:
    print("\n✅ Test user created successfully!")
    print(f"Email: {user_data['email']}")
    print(f"Password: {user_data['password']}")
elif "already registered" in response.text.lower() or "already exists" in response.text.lower():
    print("\n✅ Test user already exists - can proceed with login")
    print(f"Email: {user_data['email']}")
    print(f"Password: {user_data['password']}")
else:
    print("\n❌ Failed to create test user")
