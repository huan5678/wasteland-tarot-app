#!/usr/bin/env python3
"""
Simple test runner to verify basic functionality
"""

import sys
import os
import asyncio

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

async def test_basic_imports():
    """Test that we can import basic modules"""
    try:
        from app.core.security import get_password_hash, verify_password
        print("✅ Security module imported successfully")

        # Test password hashing
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed)
        print("✅ Password hashing works correctly")

        from app.models.user import User
        print("✅ User model imported successfully")

        from app.models.wasteland_card import WastelandCard
        print("✅ WastelandCard model imported successfully")

        from app.services.user_service import UserService
        print("✅ UserService imported successfully")

        return True

    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False

async def test_basic_functionality():
    """Test basic functionality without database"""
    try:
        from app.core.security import create_access_token, verify_token

        # Test JWT token creation and verification
        payload = {"sub": "test_user_id"}
        token = create_access_token(payload)
        decoded = verify_token(token)

        assert decoded is not None
        assert decoded["sub"] == "test_user_id"
        print("✅ JWT token creation and verification works")

        from app.models.wasteland_card import KarmaAlignment, CharacterVoice
        assert KarmaAlignment.GOOD == "good"
        assert CharacterVoice.PIP_BOY == "pip_boy"
        print("✅ Enum models work correctly")

        return True

    except Exception as e:
        print(f"❌ Basic functionality test failed: {e}")
        return False

async def main():
    """Run all basic tests"""
    print("🧪 Running basic functionality tests...")

    # Test imports
    import_success = await test_basic_imports()
    if not import_success:
        print("❌ Import tests failed")
        return False

    # Test basic functionality
    func_success = await test_basic_functionality()
    if not func_success:
        print("❌ Functionality tests failed")
        return False

    print("🎉 All basic tests passed!")
    return True

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)