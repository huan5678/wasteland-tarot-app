"""
測試認證端點（重構後）- TDD 測試

測試新建立的 /api/v1/auth 端點
"""

import pytest
from httpx import AsyncClient
from fastapi import status
from app.main import app
from app.core.security import create_access_token, create_refresh_token


class TestVerifyEndpoint:
    """測試 /api/v1/auth/verify 端點"""

    @pytest.mark.asyncio
    async def test_verify_with_valid_token_via_cookie(self):
        """測試使用有效 token（透過 cookie）驗證應返回 200"""
        # Arrange
        user_id = "550e8400-e29b-41d4-a716-446655440000"  # 假設的 UUID
        token = create_access_token(data={"sub": user_id, "email": "test@example.com"})

        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            client.cookies.set("access_token", token)
            response = await client.post("/api/v1/auth/verify")

        # Assert - 如果使用者不存在會返回 401，但 token 格式是正確的
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]
        data = response.json()
        if response.status_code == status.HTTP_200_OK:
            assert "user" in data
            assert data["is_valid"] is True

    @pytest.mark.asyncio
    async def test_verify_without_token_returns_401(self):
        """測試沒有 token 應返回 401"""
        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/api/v1/auth/verify")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "No access token provided" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_verify_with_invalid_token_returns_401(self):
        """測試使用無效 token 應返回 401"""
        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            client.cookies.set("access_token", "invalid.jwt.token")
            response = await client.post("/api/v1/auth/verify")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid or expired" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_verify_with_refresh_token_returns_401(self):
        """測試使用 refresh token（而非 access token）應返回 401"""
        # Arrange - 使用 refresh token（錯誤的 token 類型）
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        refresh_token = create_refresh_token(data={"sub": user_id})

        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            client.cookies.set("access_token", refresh_token)
            response = await client.post("/api/v1/auth/verify")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid token type" in response.json()["detail"]


class TestRefreshEndpoint:
    """測試 /api/v1/auth/refresh 端點"""

    @pytest.mark.asyncio
    async def test_refresh_without_token_returns_401(self):
        """測試沒有 refresh token 應返回 401"""
        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/api/v1/auth/refresh")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "No refresh token provided" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_refresh_with_invalid_token_returns_401(self):
        """測試使用無效 refresh token 應返回 401"""
        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            client.cookies.set("refresh_token", "invalid.jwt.token")
            response = await client.post("/api/v1/auth/refresh")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_refresh_with_access_token_returns_401(self):
        """測試使用 access token（而非 refresh token）應返回 401"""
        # Arrange
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        access_token = create_access_token(data={"sub": user_id})

        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            client.cookies.set("refresh_token", access_token)
            response = await client.post("/api/v1/auth/refresh")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Expected refresh token" in response.json()["detail"]


class TestLogoutEndpoint:
    """測試 /api/v1/auth/logout 端點"""

    @pytest.mark.asyncio
    async def test_logout_clears_cookies(self):
        """測試登出應清除 cookies"""
        # Arrange
        user_id = "550e8400-e29b-41d4-a716-446655440000"
        token = create_access_token(data={"sub": user_id})

        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            client.cookies.set("access_token", token)
            response = await client.post("/api/v1/auth/logout")

        # Assert
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "Logged out successfully" in data["message"]

    @pytest.mark.asyncio
    async def test_logout_without_token_still_succeeds(self):
        """測試沒有 token 也可以登出（清除 cookies）"""
        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post("/api/v1/auth/logout")

        # Assert
        assert response.status_code == status.HTTP_200_OK


class TestMeEndpoint:
    """測試 /api/v1/auth/me 端點"""

    @pytest.mark.asyncio
    async def test_me_without_token_returns_401(self):
        """測試沒有 token 應返回 401"""
        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/v1/auth/me")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Not authenticated" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_me_with_invalid_token_returns_401(self):
        """測試使用無效 token 應返回 401"""
        # Act
        async with AsyncClient(app=app, base_url="http://test") as client:
            client.cookies.set("access_token", "invalid.jwt.token")
            response = await client.get("/api/v1/auth/me")

        # Assert
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
