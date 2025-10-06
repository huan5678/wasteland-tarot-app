#!/usr/bin/env python3
"""
Quick test to check basic functionality
"""

import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

def test_imports():
    """Test that all imports work"""
    try:
        print("Testing imports...")
        from app.core.security import get_password_hash, verify_password
        print("✅ Security imports work")

        from app.models.user import User
        print("✅ User model imports work")

        from app.services.user_service import UserService
        print("✅ UserService imports work")

        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_password_simple():
    """Test password hashing with a very simple case"""
    try:
        from app.core.security import get_password_hash, verify_password

        password = "test123"
        hashed = get_password_hash(password)

        # Test same password
        result1 = verify_password(password, hashed)
        print(f"Same password result: {result1}")

        # Test different password
        result2 = verify_password("different", hashed)
        print(f"Different password result: {result2}")

        # Both should work correctly
        if result1 is True and result2 is False:
            print("✅ Password hashing works correctly")
            return True
        else:
            print(f"❌ Password hashing failed: same={result1}, different={result2}")
            return False

    except Exception as e:
        print(f"❌ Password test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🔍 Quick functionality test")
    print("=" * 40)

    if not test_imports():
        return False

    if not test_password_simple():
        return False

    print("=" * 40)
    print("✅ All quick tests passed!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)