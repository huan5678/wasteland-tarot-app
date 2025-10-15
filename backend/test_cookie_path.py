#!/usr/bin/env python3
"""Test cookie path setting"""
import requests
import time

# Generate unique email
email = f"test{int(time.time())}@example.com"

# Register request
response = requests.post(
    "http://localhost:8000/api/v1/auth/register",
    json={
        "email": email,
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!",
        "name": "Path Test User"
    }
)

print(f"Status: {response.status_code}")
print("\nSet-Cookie Headers:")
for cookie in response.cookies:
    print(f"  {cookie.name}:")
    print(f"    Value: {cookie.value[:20]}...")
    print(f"    Path: {cookie.path}")
    print(f"    Domain: {cookie.domain}")
    print(f"    Secure: {cookie.secure}")
    print(f"    HttpOnly: {cookie.has_nonstandard_attr('HttpOnly')}")
    print(f"    SameSite: {cookie.get_nonstandard_attr('SameSite', 'not set')}")
    print()

print("\nRaw Set-Cookie headers:")
if 'Set-Cookie' in response.headers:
    print(response.headers['Set-Cookie'])
else:
    for key, value in response.headers.items():
        if 'cookie' in key.lower():
            print(f"{key}: {value}")
