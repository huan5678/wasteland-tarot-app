#!/usr/bin/env python3
"""
Script to fix user creation in test files to use unique user data
"""

import re

def fix_user_creation_in_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Pattern to match user creation blocks
    pattern = r'user = await user_service\.create_user\(\{\s*"username": "[^"]*",\s*"email": "[^"]*",\s*"password": "[^"]*"[^}]*\}\)'

    replacement = 'user_data = generate_unique_user_data()\n        user = await user_service.create_user(user_data)'

    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

    with open(file_path, 'w') as f:
        f.write(new_content)

if __name__ == "__main__":
    fix_user_creation_in_file("/Users/sean/Documents/React/tarot-card-nextjs-app/backend/tests/api/test_readings_endpoints.py")
    print("Fixed user creation in test file")