"""
Security Module Tests - Core security functions testing
Testing JWT tokens, password hashing, and security utilities
"""

import pytest
import time
from datetime import datetime, timedelta
from typing import Dict, Any
from unittest.mock import patch, MagicMock

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_verification_token,
    create_password_reset_token,
    verify_token,
    get_current_timestamp
)
from app.core.exceptions import InvalidTokenError


@pytest.mark.unit
class TestPasswordSecurity:
    """Test password hashing and verification"""

    def test_password_hashing_basic(self):
        """Test basic password hashing functionality"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)

        # Should return a hashed password
        assert hashed is not None
        assert len(hashed) > 20  # bcrypt hashes are long
        assert hashed.startswith("$2b$")  # bcrypt format
        assert hashed != password  # Should be different from original

    def test_password_verification_correct(self):
        """Test password verification with correct password"""
        password = "CorrectPassword123!"
        hashed = get_password_hash(password)

        # Verification should succeed
        assert verify_password(password, hashed) is True

    def test_password_verification_incorrect(self):
        """Test password verification with incorrect password"""
        correct_password = "CorrectPassword123!"
        wrong_password = "WrongPassword456!"
        hashed = get_password_hash(correct_password)

        # Verification should fail
        assert verify_password(wrong_password, hashed) is False

    def test_password_hashing_consistency(self):
        """Test that same password produces different hashes (salt)"""
        password = "SamePassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different due to salt
        assert hash1 != hash2
        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_password_edge_cases(self):
        """Test password handling with edge cases"""
        # Empty password
        empty_hash = get_password_hash("")
        assert verify_password("", empty_hash) is True
        assert verify_password("not_empty", empty_hash) is False

        # Very long password
        long_password = "a" * 1000
        long_hash = get_password_hash(long_password)
        assert verify_password(long_password, long_hash) is True

        # Unicode password
        unicode_password = "密碼测试🔐"
        unicode_hash = get_password_hash(unicode_password)
        assert verify_password(unicode_password, unicode_hash) is True

    def test_password_security_requirements(self):
        """Test various password patterns for security"""
        test_passwords = [
            "simple",
            "SimplePassword",
            "SimplePassword123",
            "SimplePassword123!",
            "VeryLongPasswordWithManyCharacters123!@#",
        ]

        for password in test_passwords:
            hashed = get_password_hash(password)
            assert verify_password(password, hashed) is True
            assert verify_password(password + "wrong", hashed) is False


@pytest.mark.unit
class TestJWTTokens:
    """Test JWT token creation and verification"""

    def test_access_token_creation(self):
        """Test access token creation with basic payload"""
        payload = {"sub": "user123", "type": "access"}
        token = create_access_token(payload)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 50  # JWT tokens are reasonably long
        assert token.count(".") == 2  # JWT format: header.payload.signature

    def test_access_token_with_expiry(self):
        """Test access token creation with custom expiry"""
        payload = {"sub": "user123"}
        expires_delta = timedelta(minutes=30)
        token = create_access_token(payload, expires_delta)

        # Verify token
        verified = verify_token(token)
        assert verified is not None
        assert verified["sub"] == "user123"
        assert verified["type"] == "access"
        assert "exp" in verified

    def test_refresh_token_creation(self):
        """Test refresh token creation"""
        payload = {"sub": "user123"}
        token = create_refresh_token(payload)

        # Verify token
        verified = verify_token(token)
        assert verified is not None
        assert verified["sub"] == "user123"
        assert verified["type"] == "refresh"

    def test_verification_token_creation(self):
        """Test email verification token creation"""
        user_id = "user123"
        token = create_verification_token(user_id)

        # Verify token
        verified = verify_token(token)
        assert verified is not None
        assert verified["sub"] == user_id
        assert verified["type"] == "email_verification"

    def test_password_reset_token_creation(self):
        """Test password reset token creation"""
        email = "test@example.com"
        token = create_password_reset_token(email)

        # Verify token
        verified = verify_token(token)
        assert verified is not None
        assert verified["sub"] == email
        assert verified["type"] == "password_reset"

    def test_token_verification_success(self):
        """Test successful token verification"""
        payload = {"sub": "user123", "extra_data": "test"}
        token = create_access_token(payload)

        verified = verify_token(token)
        assert verified is not None
        assert verified["sub"] == "user123"
        assert verified["type"] == "access"
        assert "exp" in verified
        assert "iat" in verified

    def test_token_verification_invalid_token(self):
        """Test token verification with invalid token"""
        invalid_tokens = [
            "invalid.token.here",
            "not_a_token_at_all",
            "",
            None,
            "a.b",  # Too few parts
            "a.b.c.d",  # Too many parts
        ]

        for invalid_token in invalid_tokens:
            verified = verify_token(invalid_token)
            assert verified is None

    def test_token_verification_expired_token(self):
        """Test token verification with expired token"""
        payload = {"sub": "user123"}
        # Create token that expires immediately
        expires_delta = timedelta(seconds=-1)
        token = create_access_token(payload, expires_delta)

        # Small delay to ensure expiration
        time.sleep(0.1)

        verified = verify_token(token)
        assert verified is None

    def test_token_verification_tampered_token(self):
        """Test token verification with tampered token"""
        payload = {"sub": "user123"}
        token = create_access_token(payload)

        # Tamper with the token
        tampered_token = token[:-5] + "xxxxx"

        verified = verify_token(tampered_token)
        assert verified is None

    @patch('app.core.security.jwt.decode')
    def test_token_verification_jwt_error(self, mock_decode):
        """Test token verification when JWT library raises error"""
        from jose import JWTError
        mock_decode.side_effect = JWTError("JWT Error")

        token = "some.jwt.token"
        verified = verify_token(token)
        assert verified is None

    def test_token_payload_preservation(self):
        """Test that token payload is preserved correctly"""
        original_payload = {
            "sub": "user123",
            "email": "test@example.com",
            "roles": ["user", "admin"],
            "metadata": {"vault": 101}
        }

        token = create_access_token(original_payload)
        verified = verify_token(token)

        assert verified["sub"] == original_payload["sub"]
        assert verified["email"] == original_payload["email"]
        assert verified["roles"] == original_payload["roles"]
        assert verified["metadata"] == original_payload["metadata"]

    def test_different_token_types_isolation(self):
        """Test that different token types are properly isolated"""
        user_id = "user123"

        access_token = create_access_token({"sub": user_id})
        refresh_token = create_refresh_token({"sub": user_id})
        verification_token = create_verification_token(user_id)

        access_verified = verify_token(access_token)
        refresh_verified = verify_token(refresh_token)
        verification_verified = verify_token(verification_token)

        assert access_verified["type"] == "access"
        assert refresh_verified["type"] == "refresh"
        assert verification_verified["type"] == "email_verification"

        # All should have same subject but different types
        assert access_verified["sub"] == user_id
        assert refresh_verified["sub"] == user_id
        assert verification_verified["sub"] == user_id


@pytest.mark.unit
class TestSecurityUtilities:
    """Test security utility functions"""

    def test_get_current_timestamp(self):
        """Test current timestamp utility"""
        # Test that it returns an integer timestamp
        timestamp = get_current_timestamp()
        assert isinstance(timestamp, int)
        assert timestamp > 0

        # Test that it's reasonably current (within last minute)
        current_time = int(time.time())
        assert abs(timestamp - current_time) < 60

    def test_timestamp_progression(self):
        """Test that timestamps progress correctly"""
        timestamp1 = get_current_timestamp()
        time.sleep(0.01)  # Small delay
        timestamp2 = get_current_timestamp()

        assert timestamp2 >= timestamp1


@pytest.mark.unit
class TestTokenSecurityFeatures:
    """Test advanced token security features"""

    def test_token_expiry_boundaries(self):
        """Test token expiry using negative time delta (expired token)"""
        payload = {"sub": "user123"}

        # Create a token that's already expired
        past_expires = timedelta(seconds=-1)  # Already expired
        expired_token = create_access_token(payload, past_expires)

        # Should be None since it's already expired
        verified = verify_token(expired_token)
        assert verified is None

        # Test valid token with future expiry
        future_expires = timedelta(minutes=5)
        valid_token = create_access_token(payload, future_expires)
        verified_valid = verify_token(valid_token)
        assert verified_valid is not None
        assert verified_valid["sub"] == "user123"

    def test_token_iat_claim(self):
        """Test that issued-at claim is set correctly"""
        before_creation = int(time.time())
        token = create_access_token({"sub": "user123"})
        after_creation = int(time.time())

        verified = verify_token(token)
        iat = verified["iat"]

        assert before_creation <= iat <= after_creation

    def test_token_subject_validation(self):
        """Test token subject handling"""
        # Test various subject formats
        subjects = [
            "simple_user",
            "user@example.com",
            "user-123-456",
            "uuid-format-user-id",
            "123456789",
        ]

        for subject in subjects:
            token = create_access_token({"sub": subject})
            verified = verify_token(token)
            assert verified["sub"] == subject

    def test_large_payload_handling(self):
        """Test handling of large token payloads"""
        large_payload = {
            "sub": "user123",
            "large_data": "x" * 1000,  # Large string
            "array_data": list(range(100)),  # Large array
            "nested_data": {
                "level1": {
                    "level2": {
                        "level3": ["data"] * 50
                    }
                }
            }
        }

        token = create_access_token(large_payload)
        verified = verify_token(token)

        assert verified["sub"] == large_payload["sub"]
        assert verified["large_data"] == large_payload["large_data"]
        assert verified["array_data"] == large_payload["array_data"]
        assert verified["nested_data"] == large_payload["nested_data"]


@pytest.mark.unit
class TestSecurityEdgeCases:
    """Test security-related edge cases and error conditions"""

    def test_none_inputs(self):
        """Test security functions with None inputs"""
        # Password functions - these may raise exceptions, so we'll test them appropriately
        try:
            result = get_password_hash(None)
            # If it doesn't raise an exception, it should return something
            assert result is not None
        except (TypeError, AttributeError):
            # It's acceptable for this to raise an exception with None input
            pass

        # Test verify_password with None inputs - these may raise exceptions
        # Use a real bcrypt hash for testing
        real_hash = get_password_hash("test_password")
        try:
            result = verify_password(None, real_hash)
            assert result is False
        except (TypeError, AttributeError):
            # It's acceptable for this to raise an exception with None input
            pass

        try:
            result = verify_password("password", None)
            assert result is False
        except (TypeError, AttributeError):
            # It's acceptable for this to raise an exception with None input
            pass

        # Token functions
        assert verify_token(None) is None

    def test_empty_inputs(self):
        """Test security functions with empty inputs"""
        # Empty password
        empty_hash = get_password_hash("")
        assert verify_password("", empty_hash) is True

        # Empty token
        assert verify_token("") is None

    def test_malformed_jwt_structure(self):
        """Test handling of malformed JWT structures"""
        malformed_tokens = [
            "header",  # Missing parts
            "header.payload",  # Missing signature
            ".payload.signature",  # Empty header
            "header..signature",  # Empty payload
            "header.payload.",  # Empty signature
            "header.invalid_base64.signature",  # Invalid base64
        ]

        for token in malformed_tokens:
            verified = verify_token(token)
            assert verified is None

    def test_token_type_validation(self):
        """Test that token types are validated correctly"""
        # Create tokens of different types
        access_token = create_access_token({"sub": "user123"})
        refresh_token = create_refresh_token({"sub": "user123"})

        # Verify they have correct types
        access_verified = verify_token(access_token)
        refresh_verified = verify_token(refresh_token)

        assert access_verified["type"] == "access"
        assert refresh_verified["type"] == "refresh"

    @patch('app.core.security.settings')
    def test_missing_secret_key(self, mock_settings):
        """Test behavior when secret key is missing"""
        mock_settings.secret_key = None

        with pytest.raises(Exception):
            create_access_token({"sub": "user123"})

    def test_concurrent_token_operations(self):
        """Test concurrent token creation and verification"""
        import threading

        results = []
        errors = []

        def create_and_verify_token(user_id):
            try:
                token = create_access_token({"sub": f"user{user_id}"})
                verified = verify_token(token)
                results.append((user_id, verified["sub"]))
            except Exception as e:
                errors.append(e)

        # Create multiple threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=create_and_verify_token, args=(i,))
            threads.append(thread)
            thread.start()

        # Wait for all threads
        for thread in threads:
            thread.join()

        # Check results
        assert len(errors) == 0
        assert len(results) == 10
        assert all(f"user{i}" in [r[1] for r in results] for i in range(10))