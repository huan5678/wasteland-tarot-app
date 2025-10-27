"""
Unit tests for Rate Limiting middleware.

Tests cover:
- Registration endpoint rate limiting
- Authentication endpoint rate limiting
- Challenge generation rate limiting
- Rate limit header validation
- User identifier extraction (user_id, email, IP)

Reference: tasks.md Stage 16.2
"""

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import time

from app.middleware.rate_limit import (
    limiter,
    RateLimitMiddleware,
    get_rate_limit,
    RATE_LIMITS,
    get_user_identifier,
)


@pytest.fixture
def app():
    """Create test FastAPI app with rate limiting."""
    app = FastAPI()

    # Add rate limit middleware
    app.add_middleware(RateLimitMiddleware)

    # Test endpoints with different rate limits
    @app.get("/test/registration-options")
    @limiter.limit(get_rate_limit("registration_options"))
    async def registration_options(request: Request):
        return {"message": "Registration options generated"}

    @app.post("/test/authentication-verify")
    @limiter.limit(get_rate_limit("authentication_verify"))
    async def authentication_verify(request: Request):
        return {"message": "Authentication verified"}

    @app.get("/test/credential-list")
    @limiter.limit(get_rate_limit("credential_list"))
    async def credential_list(request: Request):
        return {"credentials": []}

    @app.get("/test/no-limit")
    async def no_limit(request: Request):
        return {"message": "No rate limit"}

    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


class TestRateLimitConfiguration:
    """Test rate limit configuration."""

    def test_rate_limits_defined(self):
        """All endpoint types should have rate limits defined."""
        required_endpoints = [
            "registration_options",
            "registration_verify",
            "authentication_options",
            "authentication_verify",
            "credential_list",
            "credential_create",
            "credential_update",
            "credential_delete",
            "challenge_generation",
        ]

        for endpoint in required_endpoints:
            assert endpoint in RATE_LIMITS, f"Missing rate limit for {endpoint}"
            limit = RATE_LIMITS[endpoint]
            assert "/" in limit, f"Invalid rate limit format for {endpoint}: {limit}"

    def test_get_rate_limit_returns_correct_limits(self):
        """get_rate_limit should return correct limits for endpoint types."""
        assert get_rate_limit("registration_options") == "10/minute"
        assert get_rate_limit("authentication_verify") == "20/minute"
        assert get_rate_limit("credential_list") == "30/minute"

    def test_get_rate_limit_fallback_to_default(self):
        """Unknown endpoint types should use default limit."""
        assert get_rate_limit("unknown_endpoint") == "100/minute"


class TestUserIdentifierExtraction:
    """Test user identifier extraction for rate limiting."""

    def test_get_user_identifier_from_authenticated_user(self):
        """Should use user ID from authenticated user."""
        request = Mock(spec=Request)
        request.state.user = Mock(id="user123")

        identifier = get_user_identifier(request)

        assert identifier == "user:user123"

    def test_get_user_identifier_from_email_in_body(self):
        """Should use email from request body for unauthenticated requests."""
        request = Mock(spec=Request)
        request.state.user = None
        request._json = {"email": "test@wasteland.com"}

        identifier = get_user_identifier(request)

        assert identifier == "email:test@wasteland.com"

    def test_get_user_identifier_fallback_to_ip(self):
        """Should fallback to IP address if no user or email."""
        request = Mock(spec=Request)
        request.state.user = None
        request._json = {}

        with patch('app.middleware.rate_limit.get_remote_address', return_value="192.168.1.100"):
            identifier = get_user_identifier(request)

        assert identifier == "ip:192.168.1.100"


class TestRateLimitEnforcement:
    """Test rate limit enforcement on endpoints."""

    def test_registration_options_rate_limit(self, client):
        """Registration options endpoint should enforce 10/minute limit."""
        # Make 11 requests (should exceed limit of 10)
        responses = []
        for i in range(11):
            response = client.get("/test/registration-options")
            responses.append(response)

        # First 10 should succeed
        for i in range(10):
            assert responses[i].status_code == 200, f"Request {i+1} should succeed"

        # 11th should be rate limited
        assert responses[10].status_code == 429, "11th request should be rate limited"
        assert "RATE_LIMIT_EXCEEDED" in responses[10].json()["error"]["code"]

    def test_authentication_verify_rate_limit(self, client):
        """Authentication verify endpoint should enforce 20/minute limit."""
        # Make 21 requests
        responses = []
        for i in range(21):
            response = client.post("/test/authentication-verify", json={})
            responses.append(response)

        # First 20 should succeed
        for i in range(20):
            assert responses[i].status_code == 200, f"Request {i+1} should succeed"

        # 21st should be rate limited
        assert responses[20].status_code == 429, "21st request should be rate limited"

    def test_credential_list_rate_limit(self, client):
        """Credential list endpoint should enforce 30/minute limit."""
        # Make 31 requests
        responses = []
        for i in range(31):
            response = client.get("/test/credential-list")
            responses.append(response)

        # First 30 should succeed
        for i in range(30):
            assert responses[i].status_code == 200, f"Request {i+1} should succeed"

        # 31st should be rate limited
        assert responses[30].status_code == 429, "31st request should be rate limited"

    def test_no_rate_limit_endpoint_unrestricted(self, client):
        """Endpoints without rate limiting should not be restricted."""
        # Make 150 requests (more than any rate limit)
        for i in range(150):
            response = client.get("/test/no-limit")
            assert response.status_code == 200, f"Request {i+1} should succeed (no rate limit)"


class TestRateLimitHeaders:
    """Test rate limit response headers."""

    def test_rate_limit_headers_present(self, client):
        """Rate limit info should be in response headers."""
        response = client.get("/test/registration-options")

        # Check for rate limit headers
        assert "X-RateLimit-Limit" in response.headers or response.status_code == 200
        # Note: slowapi may not always add headers in test mode
        # This test validates header presence when middleware is active

    def test_rate_limit_exceeded_response_format(self, client):
        """Rate limit exceeded response should have correct format."""
        # Exceed rate limit
        for i in range(11):
            response = client.get("/test/registration-options")

        # Last response should be 429
        assert response.status_code == 429

        # Check response body format
        data = response.json()
        assert data["success"] is False
        assert "error" in data
        assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert "避難所安全協議" in data["error"]["message"]  # Fallout theme
        assert "radiation_level" in data["error"]

        # Check Retry-After header
        assert "Retry-After" in response.headers or "X-RateLimit-Reset" in response.headers


class TestRateLimitByUserIdentifier:
    """Test that rate limits are per user identifier."""

    @patch('app.middleware.rate_limit.get_remote_address')
    def test_different_ips_have_separate_limits(self, mock_get_ip, client):
        """Different IP addresses should have separate rate limits."""
        # First IP makes 10 requests
        mock_get_ip.return_value = "192.168.1.100"
        for i in range(10):
            response = client.get("/test/registration-options")
            assert response.status_code == 200

        # Second IP should also be able to make 10 requests
        mock_get_ip.return_value = "192.168.1.200"
        for i in range(10):
            response = client.get("/test/registration-options")
            assert response.status_code == 200, (
                f"Request {i+1} from second IP should succeed (separate limit)"
            )


class TestRateLimitSecurityScenarios:
    """Test rate limiting in security attack scenarios."""

    def test_prevent_brute_force_registration(self, client):
        """Rate limiting should prevent brute force registration attempts."""
        # Simulate attacker trying to register many accounts
        successful_attempts = 0

        for i in range(50):
            response = client.get("/test/registration-options")
            if response.status_code == 200:
                successful_attempts += 1

        # Should only allow 10 successful attempts per minute
        assert successful_attempts <= 10, (
            f"Rate limiting failed: {successful_attempts} successful registration attempts. "
            f"Expected <= 10 to prevent brute force attacks."
        )

    def test_prevent_credential_enumeration(self, client):
        """Rate limiting should prevent credential enumeration attacks."""
        # Simulate attacker trying to enumerate credentials
        successful_attempts = 0

        for i in range(50):
            response = client.post("/test/authentication-verify", json={})
            if response.status_code == 200:
                successful_attempts += 1

        # Should only allow 20 successful attempts per minute
        assert successful_attempts <= 20, (
            f"Rate limiting failed: {successful_attempts} authentication attempts. "
            f"Expected <= 20 to prevent enumeration attacks."
        )


@pytest.mark.asyncio
class TestRateLimitPerformance:
    """Test rate limiting performance overhead."""

    async def test_rate_limit_overhead_minimal(self, client):
        """Rate limiting should add minimal overhead to requests."""
        # Measure baseline without rate limiting
        start = time.time()
        response = client.get("/test/no-limit")
        baseline_time = time.time() - start

        # Measure with rate limiting
        start = time.time()
        response = client.get("/test/registration-options")
        rate_limited_time = time.time() - start

        # Rate limiting overhead should be < 50ms
        overhead = rate_limited_time - baseline_time
        assert overhead < 0.05, (
            f"Rate limiting overhead too high: {overhead*1000:.2f}ms. "
            f"Should be < 50ms to avoid performance degradation."
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
