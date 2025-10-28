"""
效能測試：認證相關 API 端點

測試目標：
- GET /api/auth/methods: <500ms
- POST /api/auth/oauth/callback: <3s
- POST /api/auth/login?link_oauth=true: <1.5s

使用 pytest-benchmark 測量實際執行時間
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from app.models.user import User
from app.models.credential import Credential
from app.core.security import get_password_hash


@pytest.mark.performance
@pytest.mark.asyncio
class TestAuthPerformance:
    """認證 API 效能測試"""

    async def test_get_auth_methods_performance_baseline(
        self,
        benchmark,
        async_session: AsyncSession,
        test_user: User
    ):
        """
        測試：GET /api/auth/methods 基礎效能（無 credentials）

        目標：<500ms
        場景：用戶只有密碼認證
        """
        from app.api.v1.endpoints.auth import router as auth_router
        from fastapi import FastAPI
        from app.core.deps import get_db

        # 建立測試 app
        app = FastAPI()
        app.include_router(auth_router, prefix="/api/v1/auth")
        app.dependency_overrides[get_db] = lambda: async_session

        # 建立測試 client
        async with AsyncClient(app=app, base_url="http://test") as client:
            # 建立 JWT token
            from app.services.auth_helpers import create_access_token
            token = create_access_token(data={"sub": str(test_user.id)})

            # Benchmark 測試
            def run_test():
                # 注意：benchmark 只支援同步函式，所以需要使用 asyncio.run
                import asyncio

                async def async_test():
                    response = await client.get(
                        "/api/v1/auth/methods",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    return response

                return asyncio.run(async_test())

            result = benchmark(run_test)
            assert result.status_code == 200

            # 驗證效能需求
            stats = benchmark.stats
            assert stats.mean < 0.5, f"平均回應時間 {stats.mean}s 超過 500ms 限制"

    async def test_get_auth_methods_performance_with_passkeys(
        self,
        benchmark,
        async_session: AsyncSession,
        test_user: User
    ):
        """
        測試：GET /api/auth/methods 效能（含 5 個 Passkeys）

        目標：<500ms
        場景：用戶有密碼 + OAuth + 5 個 Passkey credentials
        """
        # 設定 OAuth 資訊
        test_user.oauth_provider = "google"
        test_user.oauth_id = "google-test-123"
        test_user.profile_picture_url = "https://example.com/avatar.jpg"

        # 建立 5 個 Passkey credentials
        for i in range(5):
            credential = Credential(
                id=uuid4(),
                user_id=test_user.id,
                credential_id=f"cred-{i}",
                public_key="test-public-key",
                counter=10 + i,
                transports=["internal"],
                name=f"測試裝置 {i + 1}",
                created_at=datetime.now(timezone.utc) - timedelta(days=i),
                last_used_at=datetime.now(timezone.utc),
                usage_count=i * 10
            )
            async_session.add(credential)

        await async_session.commit()
        await async_session.refresh(test_user)

        # 執行效能測試
        from app.api.v1.endpoints.auth import router as auth_router
        from fastapi import FastAPI
        from app.core.deps import get_db

        app = FastAPI()
        app.include_router(auth_router, prefix="/api/v1/auth")
        app.dependency_overrides[get_db] = lambda: async_session

        async with AsyncClient(app=app, base_url="http://test") as client:
            from app.services.auth_helpers import create_access_token
            token = create_access_token(data={"sub": str(test_user.id)})

            def run_test():
                import asyncio

                async def async_test():
                    response = await client.get(
                        "/api/v1/auth/methods",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    return response

                return asyncio.run(async_test())

            result = benchmark(run_test)
            assert result.status_code == 200

            # 驗證回應內容
            data = result.json()
            assert data["has_passkey"] is True
            assert data["passkey_count"] == 5
            assert len(data["passkey_credentials"]) == 5

            # 驗證效能需求
            stats = benchmark.stats
            assert stats.mean < 0.5, f"平均回應時間 {stats.mean}s 超過 500ms 限制"

    async def test_oauth_callback_performance(
        self,
        benchmark,
        async_session: AsyncSession
    ):
        """
        測試：POST /api/auth/oauth/callback 效能（新用戶註冊）

        目標：<3s
        場景：OAuth 授權碼交換 + 新用戶建立 + Karma 初始化
        """
        # Mock Supabase OAuth 回應
        from unittest.mock import AsyncMock, patch

        mock_session = {
            "access_token": "mock-token",
            "refresh_token": "mock-refresh",
            "user": {
                "id": "google-user-123",
                "email": "newuser@example.com",
                "user_metadata": {
                    "full_name": "New User",
                    "avatar_url": "https://example.com/avatar.jpg"
                }
            }
        }

        from app.api.v1.endpoints.oauth import router as oauth_router
        from fastapi import FastAPI
        from app.core.deps import get_db

        app = FastAPI()
        app.include_router(oauth_router, prefix="/api/v1/auth")
        app.dependency_overrides[get_db] = lambda: async_session

        async with AsyncClient(app=app, base_url="http://test") as client:
            def run_test():
                import asyncio

                async def async_test():
                    with patch("app.services.auth_method_coordinator.AuthMethodCoordinatorService.handle_oauth_registration") as mock_handle:
                        # Mock OAuth 處理
                        mock_handle.return_value = {
                            "success": True,
                            "user": {
                                "id": str(uuid4()),
                                "email": "newuser@example.com",
                                "name": "New User"
                            },
                            "tokens": {
                                "access_token": "test-token",
                                "refresh_token": "test-refresh"
                            }
                        }

                        response = await client.post(
                            "/api/v1/auth/oauth/callback",
                            json={
                                "code": "mock-auth-code",
                                "provider": "google"
                            }
                        )
                        return response

                return asyncio.run(async_test())

            result = benchmark(run_test)

            # 驗證效能需求（考慮到外部 API 呼叫）
            stats = benchmark.stats
            assert stats.mean < 3.0, f"平均回應時間 {stats.mean}s 超過 3s 限制"

    async def test_login_with_link_oauth_performance(
        self,
        benchmark,
        async_session: AsyncSession,
        test_user: User
    ):
        """
        測試：POST /api/auth/login?link_oauth=true 效能

        目標：<1.5s
        場景：密碼驗證 + OAuth 資訊連結
        """
        # 確保 test_user 有密碼
        test_user.password_hash = get_password_hash("TestPassword123!")
        await async_session.commit()

        from app.api.v1.endpoints.auth import router as auth_router
        from fastapi import FastAPI
        from app.core.deps import get_db

        app = FastAPI()
        app.include_router(auth_router, prefix="/api/v1/auth")
        app.dependency_overrides[get_db] = lambda: async_session

        async with AsyncClient(app=app, base_url="http://test") as client:
            def run_test():
                import asyncio

                async def async_test():
                    response = await client.post(
                        "/api/v1/auth/login",
                        json={
                            "email": test_user.email,
                            "password": "TestPassword123!",
                            "link_oauth": True,
                            "oauth_provider": "google",
                            "oauth_id": "google-test-789",
                            "profile_picture": "https://example.com/avatar.jpg"
                        }
                    )
                    return response

                return asyncio.run(async_test())

            result = benchmark(run_test)
            assert result.status_code == 200

            # 驗證 OAuth 連結成功
            data = result.json()
            assert "access_token" in data

            # 驗證效能需求
            stats = benchmark.stats
            assert stats.mean < 1.5, f"平均回應時間 {stats.mean}s 超過 1.5s 限制"

    async def test_passkey_login_and_link_performance(
        self,
        benchmark,
        async_session: AsyncSession,
        test_user: User
    ):
        """
        測試：POST /api/auth/passkey/login-and-link 效能

        目標：<1.5s
        場景：Passkey 驗證 + OAuth 資訊連結
        """
        # 建立 Passkey credential
        credential = Credential(
            id=uuid4(),
            user_id=test_user.id,
            credential_id="test-cred-123",
            public_key="test-public-key",
            counter=1,
            transports=["internal"],
            name="測試裝置",
            created_at=datetime.now(timezone.utc),
            last_used_at=None,
            usage_count=0
        )
        async_session.add(credential)
        test_user.webauthn_user_handle = b"test-user-handle"
        await async_session.commit()

        from app.api.v1.endpoints.auth import router as auth_router
        from fastapi import FastAPI
        from app.core.deps import get_db
        from unittest.mock import patch

        app = FastAPI()
        app.include_router(auth_router, prefix="/api/v1/auth")
        app.dependency_overrides[get_db] = lambda: async_session

        async with AsyncClient(app=app, base_url="http://test") as client:
            def run_test():
                import asyncio

                async def async_test():
                    with patch("app.services.webauthn_service.WebAuthnService.verify_authentication_response") as mock_verify:
                        # Mock WebAuthn 驗證
                        mock_verify.return_value = {
                            "verified": True,
                            "credential_id": "test-cred-123",
                            "new_counter": 2
                        }

                        response = await client.post(
                            "/api/v1/auth/passkey/login-and-link",
                            json={
                                "assertion_response": {
                                    "id": "test-cred-123",
                                    "rawId": "test-raw-id",
                                    "response": {
                                        "authenticatorData": "mock-data",
                                        "clientDataJSON": "mock-json",
                                        "signature": "mock-signature"
                                    },
                                    "type": "public-key"
                                },
                                "link_oauth": True,
                                "oauth_provider": "google",
                                "oauth_id": "google-test-456"
                            }
                        )
                        return response

                return asyncio.run(async_test())

            result = benchmark(run_test)

            # 驗證效能需求
            stats = benchmark.stats
            assert stats.mean < 1.5, f"平均回應時間 {stats.mean}s 超過 1.5s 限制"


# 效能測試配置
@pytest.fixture
def benchmark(benchmark):
    """配置 benchmark 參數"""
    # 至少執行 5 次以獲得穩定結果
    benchmark.min_rounds = 5
    # 最少執行 0.1 秒
    benchmark.min_time = 0.1
    # 最多執行 2 秒（避免測試時間過長）
    benchmark.max_time = 2.0
    return benchmark
