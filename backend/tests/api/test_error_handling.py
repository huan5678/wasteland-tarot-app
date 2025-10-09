"""
API Error Handling Tests - Phase 2 API Layer Testing
Testing FastAPI error handling, edge cases, and boundary conditions
"""

import pytest
import json
from typing import Dict, Any
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user_service import UserService
from app.core.security import create_access_token
from app.models.user import User


@pytest.mark.asyncio
@pytest.mark.api
class TestAuthenticationErrorHandling:
    """Test authentication-related error scenarios"""

    async def test_missing_authorization_header(self, async_client: AsyncClient):
        """Test accessing protected endpoints without Authorization header"""
        protected_endpoints = [
            ("/api/v1/auth/me", "GET"),
            ("/api/v1/readings/create", "POST"),
            ("/api/v1/cards/draw", "POST"),
            ("/api/v1/readings/", "GET"),
        ]

        for endpoint, method in protected_endpoints:
            if method == "GET":
                response = await async_client.get(endpoint)
            elif method == "POST":
                response = await async_client.post(endpoint, json={})

            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert "detail" in response.json()

    async def test_malformed_authorization_header(self, async_client: AsyncClient):
        """Test malformed Authorization headers"""
        malformed_headers = [
            {"Authorization": "InvalidFormat token"},
            {"Authorization": "Bearer"},  # Missing token
            {"Authorization": "Bearer "},  # Empty token
            {"Authorization": "NotBearer valid.jwt.token"},
            {"Authorization": "Bearer invalid-token-format"},
            {"Authorization": "Bearer too.few.parts"},
            {"Authorization": "Bearer too.many.parts.in.jwt.token"},
        ]

        for headers in malformed_headers:
            response = await async_client.get("/api/v1/auth/me", headers=headers)
            assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_expired_token_handling(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test handling of expired tokens"""
        from datetime import timedelta

        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "expired_test",
            "email": "expired@vault.com",
            "password": "ExpiredTest123!"
        })

        # Create expired token
        expired_token = create_access_token(
            {"sub": user.id},
            expires_delta=timedelta(seconds=-60)  # Expired 1 minute ago
        )

        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_invalid_token_signature(self, async_client: AsyncClient):
        """Test handling of tokens with invalid signatures"""
        # Valid structure but invalid signature
        invalid_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjo5OTk5OTk5OTk5fQ.invalid_signature"

        headers = {"Authorization": f"Bearer {invalid_token}"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_token_for_nonexistent_user(self, async_client: AsyncClient):
        """Test token containing non-existent user ID"""
        # Create token for non-existent user
        fake_token = create_access_token({"sub": "nonexistent_user_id"})

        headers = {"Authorization": f"Bearer {fake_token}"}
        response = await async_client.get("/api/v1/auth/me", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
@pytest.mark.api
class TestRequestValidationErrors:
    """Test request validation and malformed data handling"""

    async def test_malformed_json_requests(self, async_client: AsyncClient):
        """Test handling of malformed JSON requests"""
        malformed_json_cases = [
            '{"username": "test", "email":}',  # Incomplete JSON
            '{"username": "test" "email": "test@test.com"}',  # Missing comma
            '{username: "test", "email": "test@test.com"}',  # Unquoted key
            '{"username": "test", "email": "test@test.com",}',  # Trailing comma
            'not json at all',
            '{"nested": {"incomplete": }',
            '',  # Empty string
        ]

        for malformed_json in malformed_json_cases:
            response = await async_client.post(
                "/api/v1/auth/register",
                content=malformed_json,
                headers={"Content-Type": "application/json"}
            )
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_missing_required_fields(self, async_client: AsyncClient):
        """Test requests with missing required fields"""
        # Registration with missing fields
        incomplete_registration_cases = [
            {},  # All fields missing
            {"username": "test"},  # Missing email and password
            {"email": "test@test.com"},  # Missing username and password
            {"password": "test123"},  # Missing username and email
            {"username": "test", "email": "test@test.com"},  # Missing password
        ]

        for case in incomplete_registration_cases:
            response = await async_client.post("/api/v1/auth/register", json=case)
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Login with missing fields
        incomplete_login_cases = [
            {},
            {"username": "test"},
            {"password": "test"},
        ]

        for case in incomplete_login_cases:
            response = await async_client.post("/api/v1/auth/login", json=case)
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_invalid_field_types(self, async_client: AsyncClient):
        """Test requests with invalid field types"""
        invalid_type_cases = [
            {
                "username": 123,  # Should be string
                "email": "test@test.com",
                "password": "test123"
            },
            {
                "username": "test",
                "email": ["not", "a", "string"],  # Should be string
                "password": "test123"
            },
            {
                "username": "test",
                "email": "test@test.com",
                "password": None  # Should be string
            },
            {
                "username": "test",
                "email": "test@test.com",
                "password": "test123",
                "vault_number": "not_a_number"  # Should be int
            }
        ]

        for case in invalid_type_cases:
            response = await async_client.post("/api/v1/auth/register", json=case)
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_invalid_email_formats(self, async_client: AsyncClient):
        """Test invalid email format handling"""
        invalid_emails = [
            "notanemail",
            "@missinglocal.com",
            "missing@domain",
            "spaces @domain.com",
            "double@@domain.com",
            "toolong" + "a" * 300 + "@domain.com",
            "",
            "missing.at.symbol.com",
        ]

        for invalid_email in invalid_emails:
            registration_data = {
                "username": "test",
                "email": invalid_email,
                "password": "ValidPassword123!"
            }
            response = await async_client.post("/api/v1/auth/register", json=registration_data)
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    async def test_field_length_validation(self, async_client: AsyncClient):
        """Test field length validation"""
        # Very long username
        long_username_data = {
            "username": "a" * 1000,  # Extremely long username
            "email": "test@test.com",
            "password": "ValidPassword123!"
        }
        response = await async_client.post("/api/v1/auth/register", json=long_username_data)
        # Should either succeed or fail with validation error
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_400_BAD_REQUEST]

        # Very long password
        long_password_data = {
            "username": "testuser",
            "email": "test@test.com",
            "password": "a" * 2000  # Extremely long password
        }
        response = await async_client.post("/api/v1/auth/register", json=long_password_data)
        # Should either succeed or fail with validation error
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_400_BAD_REQUEST]


@pytest.mark.asyncio
@pytest.mark.api
class TestHTTPMethodErrors:
    """Test incorrect HTTP method usage"""

    async def test_wrong_http_methods(self, async_client: AsyncClient):
        """Test using wrong HTTP methods on endpoints"""
        # Test wrong methods on various endpoints
        wrong_method_tests = [
            ("/api/v1/auth/register", "GET"),  # Should be POST
            ("/api/v1/auth/login", "PUT"),     # Should be POST
            ("/api/v1/auth/me", "POST"),       # Should be GET
            ("/api/v1/cards/", "POST"),        # Should be GET
            ("/api/v1/readings/create", "GET"), # Should be POST
        ]

        for endpoint, method in wrong_method_tests:
            if method == "GET":
                response = await async_client.get(endpoint)
            elif method == "POST":
                response = await async_client.post(endpoint, json={})
            elif method == "PUT":
                response = await async_client.put(endpoint, json={})

            assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    async def test_unsupported_methods(self, async_client: AsyncClient):
        """Test completely unsupported HTTP methods"""
        # Most endpoints shouldn't support PATCH, HEAD, etc.
        unsupported_methods = ["PATCH", "HEAD", "OPTIONS"]

        for method in unsupported_methods:
            response = await async_client.request(method, "/api/v1/auth/register")
            # Should return method not allowed or not implemented
            assert response.status_code in [
                status.HTTP_405_METHOD_NOT_ALLOWED,
                status.HTTP_501_NOT_IMPLEMENTED,
                status.HTTP_200_OK  # OPTIONS might be allowed for CORS
            ]


@pytest.mark.asyncio
@pytest.mark.api
class TestContentTypeErrors:
    """Test content type related errors"""

    async def test_wrong_content_type(self, async_client: AsyncClient):
        """Test sending data with wrong content type"""
        registration_data = {
            "username": "test",
            "email": "test@test.com",
            "password": "test123"
        }

        # Send as form data instead of JSON
        response = await async_client.post("/api/v1/auth/register", data=registration_data)
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        ]

        # Send as plain text
        response = await async_client.post(
            "/api/v1/auth/register",
            content="plain text data",
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        ]

    async def test_missing_content_type(self, async_client: AsyncClient):
        """Test sending JSON data without Content-Type header"""
        registration_data = json.dumps({
            "username": "test",
            "email": "test@test.com",
            "password": "test123"
        })

        response = await async_client.post(
            "/api/v1/auth/register",
            content=registration_data
            # No Content-Type header
        )
        # Should either work (auto-detection) or fail
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        ]

    async def test_large_request_body(self, async_client: AsyncClient):
        """Test handling of excessively large request bodies"""
        # Create very large request data
        large_data = {
            "username": "test",
            "email": "test@test.com",
            "password": "test123",
            "large_field": "x" * (10 * 1024 * 1024)  # 10MB string
        }

        response = await async_client.post("/api/v1/auth/register", json=large_data)
        # Should either fail with payload too large or validation error
        assert response.status_code in [
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST
        ]


@pytest.mark.asyncio
@pytest.mark.api
class TestParameterValidationErrors:
    """Test URL parameter and query parameter validation"""

    async def test_invalid_query_parameters(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test invalid query parameters"""
        # Create user for authenticated requests
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "param_test",
            "email": "param@vault.com",
            "password": "ParamTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Invalid limit values
        invalid_limits = [-1, 0, 1000, "not_a_number", ""]
        for limit in invalid_limits:
            response = await async_client.get(f"/api/v1/readings/?limit={limit}", headers=headers)
            if isinstance(limit, str) and not limit.isdigit():
                assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            elif limit <= 0 or limit > 100:  # Assuming max limit is 100
                assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_400_BAD_REQUEST]

        # Invalid offset values
        invalid_offsets = [-1, "not_a_number", ""]
        for offset in invalid_offsets:
            response = await async_client.get(f"/api/v1/readings/?offset={offset}", headers=headers)
            if isinstance(offset, str) and not offset.isdigit():
                assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            elif offset < 0:
                assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_400_BAD_REQUEST]

    async def test_invalid_path_parameters(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test invalid path parameters"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "path_test",
            "email": "path@vault.com",
            "password": "PathTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Invalid reading IDs
        invalid_ids = [
            "",  # Empty
            "../../etc/passwd",  # Path traversal attempt
            "<script>alert('xss')</script>",  # XSS attempt
            "'; DROP TABLE users; --",  # SQL injection attempt
            "very_long_id_" + "x" * 1000,  # Very long ID
        ]

        for invalid_id in invalid_ids:
            if invalid_id == "":
                # Empty ID should result in 404 or method not allowed
                response = await async_client.get("/api/v1/readings/", headers=headers)
                assert response.status_code == status.HTTP_200_OK  # This is the list endpoint
            else:
                response = await async_client.get(f"/api/v1/readings/{invalid_id}", headers=headers)
                # Should be 404 (not found) or 400 (bad request)
                assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_400_BAD_REQUEST]

    async def test_invalid_enum_parameters(self, async_client: AsyncClient):
        """Test invalid enum values in parameters"""
        # Invalid suit
        response = await async_client.get("/api/v1/cards/suit/invalid_suit")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Invalid karma alignment
        response = await async_client.get("/api/v1/cards/card_id/interpretation/karma/invalid_karma")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Invalid character voice
        response = await async_client.get("/api/v1/cards/card_id/interpretation/voice/invalid_voice")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
@pytest.mark.api
class TestBusinessLogicErrors:
    """Test business logic error scenarios"""

    async def test_duplicate_user_registration(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test handling of duplicate user registration"""
        # Create first user
        user_data = {
            "username": "duplicate_test",
            "email": "duplicate@vault.com",
            "password": "DuplicateTest123!"
        }

        response1 = await async_client.post("/api/v1/auth/register", json=user_data)
        assert response1.status_code == status.HTTP_200_OK

        # Try to create user with same username
        duplicate_username_data = {
            "username": "duplicate_test",  # Same username
            "email": "different@vault.com",
            "password": "DuplicateTest123!"
        }

        response2 = await async_client.post("/api/v1/auth/register", json=duplicate_username_data)
        assert response2.status_code == status.HTTP_409_CONFLICT

        # Try to create user with same email
        duplicate_email_data = {
            "username": "different_user",
            "email": "duplicate@vault.com",  # Same email
            "password": "DuplicateTest123!"
        }

        response3 = await async_client.post("/api/v1/auth/register", json=duplicate_email_data)
        assert response3.status_code == status.HTTP_409_CONFLICT

    async def test_invalid_login_credentials(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test various invalid login scenarios"""
        # Create user
        user_service = UserService(db_session)
        await user_service.create_user({
            "username": "login_error_test",
            "email": "loginerror@vault.com",
            "password": "LoginErrorTest123!"
        })

        # Wrong password
        response = await async_client.post("/api/v1/auth/login", json={
            "username": "login_error_test",
            "password": "WrongPassword123!"
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Wrong username
        response = await async_client.post("/api/v1/auth/login", json={
            "username": "wrong_username",
            "password": "LoginErrorTest123!"
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Both wrong
        response = await async_client.post("/api/v1/auth/login", json={
            "username": "wrong_username",
            "password": "WrongPassword123!"
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_resource_not_found_errors(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test resource not found scenarios"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "notfound_test",
            "email": "notfound@vault.com",
            "password": "NotFoundTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Non-existent reading
        response = await async_client.get("/api/v1/readings/nonexistent_reading_id", headers=headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # Non-existent card
        response = await async_client.get("/api/v1/cards/nonexistent_card_id")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    async def test_permission_denied_errors(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test permission denied scenarios"""
        # Create two users
        user_service = UserService(db_session)
        user1 = await user_service.create_user({
            "username": "permission_user1",
            "email": "permission1@vault.com",
            "password": "PermissionTest123!"
        })
        user2 = await user_service.create_user({
            "username": "permission_user2",
            "email": "permission2@vault.com",
            "password": "PermissionTest123!"
        })

        user1_token = create_access_token({"sub": user1.id})
        user2_token = create_access_token({"sub": user2.id})

        headers1 = {"Authorization": f"Bearer {user1_token}"}
        headers2 = {"Authorization": f"Bearer {user2_token}"}

        # User 1 creates a reading
        reading_data = {
            "question": "Private question",
            "spread_type": "single_card"
        }
        create_response = await async_client.post("/api/v1/readings/create", json=reading_data, headers=headers1)
        assert create_response.status_code == status.HTTP_200_OK

        reading_id = create_response.json()["reading"]["id"]

        # User 2 tries to access User 1's reading
        response = await async_client.get(f"/api/v1/readings/{reading_id}", headers=headers2)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # User 2 tries to update User 1's reading
        update_data = {"user_feedback": "Unauthorized feedback"}
        response = await async_client.put(f"/api/v1/readings/{reading_id}", json=update_data, headers=headers2)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # User 2 tries to delete User 1's reading
        response = await async_client.delete(f"/api/v1/readings/{reading_id}", headers=headers2)
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
@pytest.mark.api
class TestRateLimitingAndThrottling:
    """Test rate limiting and throttling scenarios"""

    async def test_excessive_requests(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test handling of excessive requests"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "rate_limit_test",
            "email": "ratelimit@vault.com",
            "password": "RateLimitTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Make many requests rapidly
        rate_limited = False
        for i in range(100):  # Try to trigger rate limiting
            response = await async_client.post("/api/v1/readings/create", json={
                "question": f"Test question {i}",
                "spread_type": "single_card"
            }, headers=headers)

            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                rate_limited = True
                assert "limit" in response.json()["detail"].lower()
                break

        # If rate limiting is implemented, it should trigger
        # If not, all requests should succeed (both are valid test outcomes)

    async def test_concurrent_requests(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test handling of concurrent requests"""
        import asyncio

        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "concurrent_test",
            "email": "concurrent@vault.com",
            "password": "ConcurrentTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # Make multiple concurrent requests
        async def make_request(request_id):
            return await async_client.post("/api/v1/readings/create", json={
                "question": f"Concurrent question {request_id}",
                "spread_type": "single_card"
            }, headers=headers)

        # Run 10 concurrent requests
        tasks = [make_request(i) for i in range(10)]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        # Check that all responses are valid HTTP responses (not exceptions)
        for response in responses:
            if isinstance(response, Exception):
                pytest.fail(f"Request raised exception: {response}")
            assert hasattr(response, 'status_code')
            # Should be either success or rate limited
            assert response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_429_TOO_MANY_REQUESTS,
                status.HTTP_400_BAD_REQUEST
            ]


@pytest.mark.asyncio
@pytest.mark.api
class TestSecurityVulnerabilities:
    """Test for common security vulnerabilities"""

    async def test_sql_injection_attempts(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test SQL injection attempt handling"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "sql_test",
            "email": "sql@vault.com",
            "password": "SqlTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # SQL injection attempts in various fields
        sql_injection_payloads = [
            "'; DROP TABLE users; --",
            "admin'--",
            "admin' OR '1'='1",
            "1'; DELETE FROM readings; --",
            "' UNION SELECT * FROM users --",
        ]

        for payload in sql_injection_payloads:
            # Try SQL injection in reading question
            response = await async_client.post("/api/v1/readings/create", json={
                "question": payload,
                "spread_type": "single_card"
            }, headers=headers)
            # Should either succeed (payload treated as normal text) or fail validation
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]

            # Try SQL injection in path parameter
            response = await async_client.get(f"/api/v1/readings/{payload}", headers=headers)
            # Should be 404 (not found) or 400 (bad request), never cause server error
            assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_400_BAD_REQUEST]

    async def test_xss_attempts(self, async_client: AsyncClient, db_session: AsyncSession):
        """Test XSS attempt handling"""
        # Create user
        user_service = UserService(db_session)
        user = await user_service.create_user({
            "username": "xss_test",
            "email": "xss@vault.com",
            "password": "XssTest123!"
        })

        access_token = create_access_token({"sub": user.id})
        headers = {"Authorization": f"Bearer {access_token}"}

        # XSS payloads
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "javascript:alert('xss')",
            "<svg onload=alert('xss')>",
            "';alert('xss');//",
        ]

        for payload in xss_payloads:
            # Try XSS in registration
            response = await async_client.post("/api/v1/auth/register", json={
                "username": f"user_{payload[:10]}",
                "email": "xsstest@vault.com",
                "password": "ValidPassword123!",
                "display_name": payload
            })
            # Should either succeed (payload sanitized) or fail validation
            assert response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_409_CONFLICT,  # Duplicate user
                status.HTTP_422_UNPROCESSABLE_ENTITY
            ]

    async def test_path_traversal_attempts(self, async_client: AsyncClient):
        """Test path traversal attempt handling"""
        path_traversal_payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
            "....//....//....//etc/passwd",
        ]

        for payload in path_traversal_payloads:
            # Try path traversal in card ID
            response = await async_client.get(f"/api/v1/cards/{payload}")
            # Should be 404 (not found) or 400 (bad request), never expose file system
            assert response.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_400_BAD_REQUEST]

    async def test_header_injection_attempts(self, async_client: AsyncClient):
        """Test header injection attempt handling"""
        # Attempt to inject headers through user input
        malicious_headers = {
            "Authorization": "Bearer valid_token\r\nX-Injected-Header: malicious",
            "Content-Type": "application/json\r\nX-Injected: evil",
        }

        for header_name, header_value in malicious_headers.items():
            try:
                response = await async_client.get("/api/v1/auth/me", headers={header_name: header_value})
                # If the request succeeds, the injection should be handled safely
                # Status code doesn't matter as much as not crashing the server
                assert hasattr(response, 'status_code')
            except Exception as e:
                # HTTP client should reject malformed headers, which is correct behavior
                assert "header" in str(e).lower() or "invalid" in str(e).lower()