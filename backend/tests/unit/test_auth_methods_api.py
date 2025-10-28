"""
TDD: GET /api/v1/auth/methods 端點測試

測試需求來自：.kiro/specs/google-oauth-passkey-integration/requirements.md
- 需求 5: 認證方式狀態同步（前後端一致性）
- 需求：查詢用戶的所有認證方式狀態

測試策略：
- 整合測試，使用真實的 FastAPI 應用和資料庫
- 測試 JWT 認證、回應格式、錯誤處理
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import datetime, timedelta
import secrets

from app.main import app
from app.core.security import create_access_token


class TestAuthMethodsAPI:
    """測試 GET /api/v1/auth/methods 端點"""

    @pytest.mark.asyncio
    async def test_should_return_401_without_token(self, async_client: AsyncClient):
        """
        需求 5: 未認證請求應回傳 401

        前置條件：
        - 未提供 access_token

        預期行為：
        - 回傳 401 Unauthorized
        """
        response = await async_client.get("/api/v1/auth/methods")
        assert response.status_code == 401
        assert "Not authenticated" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_should_return_auth_methods_for_authenticated_user(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        需求 5: 已認證用戶應成功查詢認證方式

        前置條件：
        - 用戶已註冊且擁有多種認證方式
        - 提供有效的 access_token

        預期行為：
        - 回傳 200 OK
        - 回應包含 has_oauth, has_passkey, has_password
        - 回應包含 passkey_credentials 清單
        """
        from app.models.user import User
        from app.models.credential import Credential

        # 建立測試用戶（擁有所有認證方式）
        test_user = User(
            email=f"test_{uuid4().hex[:8]}@test.com",
            name="Test User",
            password_hash="$2b$12$hashed_password",
            oauth_provider="google",
            oauth_id=f"google_{uuid4().hex}",
            profile_picture_url="https://example.com/photo.jpg",
            webauthn_user_handle=secrets.token_bytes(64),
        )
        db_session.add(test_user)
        await db_session.flush()

        # 新增一個 Passkey
        credential = Credential(
            user_id=test_user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key=secrets.token_hex(64),
            device_name="Test Device",
            transports=["internal"],
            counter=0,
        )
        db_session.add(credential)
        await db_session.commit()

        # 產生 access token
        access_token = create_access_token(
            data={"sub": str(test_user.id), "email": test_user.email, "type": "access"},
            expires_delta=timedelta(minutes=30)
        )

        # 執行：查詢認證方式
        response = await async_client.get(
            "/api/v1/auth/methods",
            cookies={"access_token": access_token}
        )

        # 驗證：回應格式正確
        assert response.status_code == 200
        data = response.json()

        # 驗證：所有認證方式資訊都存在
        assert data["has_oauth"] is True
        assert data["oauth_provider"] == "google"
        assert data["profile_picture"] == "https://example.com/photo.jpg"

        assert data["has_passkey"] is True
        assert data["passkey_count"] == 1
        assert len(data["passkey_credentials"]) == 1

        assert data["has_password"] is True

        # 驗證：credential 資訊格式正確
        cred_info = data["passkey_credentials"][0]
        assert "id" in cred_info
        assert cred_info["device_name"] == "Test Device"
        assert "created_at" in cred_info
        assert "device_type" in cred_info

    @pytest.mark.asyncio
    async def test_should_return_404_for_non_existent_user(
        self, async_client: AsyncClient
    ):
        """
        需求 5: 不存在的用戶應回傳 404

        前置條件：
        - 提供有效的 JWT token，但用戶不存在於資料庫

        預期行為：
        - 回傳 404 Not Found
        """
        # 產生不存在的用戶 ID 的 token
        non_existent_user_id = str(uuid4())
        access_token = create_access_token(
            data={"sub": non_existent_user_id, "email": "nonexistent@test.com", "type": "access"},
            expires_delta=timedelta(minutes=30)
        )

        # 執行：查詢認證方式
        response = await async_client.get(
            "/api/v1/auth/methods",
            cookies={"access_token": access_token}
        )

        # 驗證：回傳 404
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_should_handle_user_with_only_password(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        需求 5: 只有密碼的用戶應正確回傳狀態

        前置條件：
        - 用戶只有 password_hash，無 OAuth 和 Passkey

        預期行為：
        - has_oauth=False
        - has_passkey=False, passkey_count=0
        - has_password=True
        """
        from app.models.user import User

        # 建立只有密碼的用戶
        test_user = User(
            email=f"password_only_{uuid4().hex[:8]}@test.com",
            name="Password Only User",
            password_hash="$2b$12$hashed_password",
        )
        db_session.add(test_user)
        await db_session.commit()

        # 產生 access token
        access_token = create_access_token(
            data={"sub": str(test_user.id), "email": test_user.email, "type": "access"},
            expires_delta=timedelta(minutes=30)
        )

        # 執行：查詢認證方式
        response = await async_client.get(
            "/api/v1/auth/methods",
            cookies={"access_token": access_token}
        )

        # 驗證：只有密碼
        assert response.status_code == 200
        data = response.json()

        assert data["has_oauth"] is False
        assert data["has_passkey"] is False
        assert data["passkey_count"] == 0
        assert data["has_password"] is True
