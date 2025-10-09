#!/usr/bin/env python3
"""
Custom test runner that can execute pytest programmatically
"""

import sys
import os
import pytest

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

def run_tests():
    """Run pytest programmatically"""

    # Configure pytest arguments
    pytest_args = [
        "tests/unit/test_phase1_security_core.py::TestPasswordHashing::test_password_hashing",
        "-v",
        "--tb=short",
        "--no-header"
    ]

    print("🧪 Running pytest tests...")
    print(f"Command: pytest {' '.join(pytest_args)}")
    print("-" * 50)

    # Run pytest
    exit_code = pytest.main(pytest_args)

    print("-" * 50)
    if exit_code == 0:
        print("✅ Tests passed!")
    else:
        print(f"❌ Tests failed with exit code: {exit_code}")

    return exit_code

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)