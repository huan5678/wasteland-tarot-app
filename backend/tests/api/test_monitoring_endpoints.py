"""
Monitoring API Endpoints Tests
Tests for health checks, metrics, and system monitoring
"""

import pytest
from fastapi import status
from httpx import AsyncClient
from typing import Dict, Any


@pytest.mark.asyncio
@pytest.mark.api
class TestMonitoringEndpoints:
    """Test monitoring and health check endpoints"""

    async def test_health_check(self, async_client: AsyncClient):
        """Test basic health check endpoint"""
        response = await async_client.get("/api/v1/monitoring/health")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "status" in data
        assert data["status"] in ["healthy", "degraded", "unhealthy"]
        assert "timestamp" in data

    async def test_health_check_detailed(self, async_client: AsyncClient):
        """Test detailed health check with component status"""
        response = await async_client.get(
            "/api/v1/monitoring/health",
            params={"detailed": True}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "status" in data
        assert "components" in data
        assert "database" in data["components"]
        assert "cache" in data["components"]

    async def test_readiness_check(self, async_client: AsyncClient):
        """Test readiness probe for k8s/container environments"""
        response = await async_client.get("/api/v1/monitoring/ready")

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]
        data = response.json()

        assert "ready" in data
        assert isinstance(data["ready"], bool)

    async def test_liveness_check(self, async_client: AsyncClient):
        """Test liveness probe"""
        response = await async_client.get("/api/v1/monitoring/live")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "alive" in data
        assert data["alive"] is True

    async def test_get_metrics(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test getting performance metrics"""
        token = test_user_with_token["token"]

        response = await async_client.get(
            "/api/v1/monitoring/metrics",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "status" in data
        assert "data" in data

        # Check metrics structure
        metrics = data["data"]
        assert "api_calls" in metrics or "total_requests" in metrics

    async def test_get_error_summary(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test getting error summary"""
        token = test_user_with_token["token"]

        response = await async_client.get(
            "/api/v1/monitoring/errors/summary",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "status" in data
        assert "data" in data

    async def test_metrics_unauthorized(self, async_client: AsyncClient):
        """Test that metrics require authentication"""
        response = await async_client.get("/api/v1/monitoring/metrics")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    async def test_prometheus_metrics(self, async_client: AsyncClient):
        """Test Prometheus-format metrics endpoint"""
        response = await async_client.get("/metrics")

        # Should return plain text metrics
        assert response.status_code == status.HTTP_200_OK
        assert "text/plain" in response.headers.get("content-type", "")


@pytest.mark.asyncio
@pytest.mark.api
@pytest.mark.performance
class TestPerformanceMonitoring:
    """Test performance monitoring functionality"""

    async def test_response_time_tracking(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test that response times are tracked"""
        token = test_user_with_token["token"]

        # Make a request
        await async_client.get(
            "/api/v1/cards",
            headers={"Authorization": f"Bearer {token}"}
        )

        # Check metrics
        response = await async_client.get(
            "/api/v1/monitoring/metrics",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK

    async def test_error_rate_tracking(
        self,
        async_client: AsyncClient,
        test_user_with_token: Dict[str, Any]
    ):
        """Test that errors are tracked"""
        token = test_user_with_token["token"]

        # Make an invalid request to trigger error
        await async_client.get(
            "/api/v1/readings/nonexistent-id",
            headers={"Authorization": f"Bearer {token}"}
        )

        # Check error summary
        response = await async_client.get(
            "/api/v1/monitoring/errors/summary",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
@pytest.mark.api
class TestSystemInfo:
    """Test system information endpoints"""

    async def test_get_version_info(self, async_client: AsyncClient):
        """Test getting API version information"""
        response = await async_client.get("/api/v1/version")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "version" in data
        assert "build" in data or "commit" in data

    async def test_get_status_info(self, async_client: AsyncClient):
        """Test getting system status"""
        response = await async_client.get("/api/v1/status")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "status" in data
        assert "uptime" in data or "started_at" in data
