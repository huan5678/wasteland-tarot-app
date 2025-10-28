"""
效能測試：認證相關 API 端點（簡化版）

測試目標：
- GET /api/v1/auth/methods: <500ms
- POST /api/v1/auth/oauth/callback: <3s
- POST /api/v1/auth/login?link_oauth=true: <1.5s

使用 pytest-benchmark 測量實際執行時間
"""

import pytest
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from app.models.credential import Credential
from app.core.security import get_password_hash


@pytest.mark.performance
@pytest.mark.asyncio
class TestAuthMethodsPerformance:
    """GET /api/v1/auth/methods 效能測試"""

    async def test_get_auth_methods_baseline_performance(
        self,
        benchmark,
        client,
        authenticated_user,
        async_session
    ):
        """
        測試：GET /api/v1/auth/methods 基礎效能（無 credentials）

        目標：<500ms
        場景：用戶只有密碼認證
        """
        user, headers = authenticated_user

        # Benchmark 測試（benchmark 接受同步函式）
        def run_request():
            import asyncio

            async def async_request():
                response = await client.get(
                    "/api/v1/auth/methods",
                    headers=headers
                )
                return response

            return asyncio.run(async_request())

        # 執行 benchmark
        response = benchmark(run_request)

        # 驗證回應正確
        assert response.status_code == 200
        data = response.json()
        assert "has_oauth" in data
        assert "has_passkey" in data
        assert "has_password" in data

        # 驗證效能需求
        stats = benchmark.stats
        mean_time = stats.stats.mean
        assert mean_time < 0.5, f"平均回應時間 {mean_time:.3f}s 超過 500ms 限制"

    async def test_get_auth_methods_with_passkeys_performance(
        self,
        benchmark,
        client,
        authenticated_user,
        async_session
    ):
        """
        測試：GET /api/v1/auth/methods 效能（含 5 個 Passkeys）

        目標：<500ms
        場景：用戶有密碼 + OAuth + 5 個 Passkey credentials
        """
        user, headers = authenticated_user

        # 設定 OAuth 資訊
        user.oauth_provider = "google"
        user.oauth_id = "google-perf-test-123"
        user.profile_picture_url = "https://example.com/avatar.jpg"
        user.webauthn_user_handle = b"test-user-handle"

        # 建立 5 個 Passkey credentials
        for i in range(5):
            credential = Credential(
                id=uuid4(),
                user_id=user.id,
                credential_id=f"perf-cred-{i}",
                public_key="test-public-key",
                counter=10 + i,
                transports=["internal"],
                name=f"效能測試裝置 {i + 1}",
                created_at=datetime.now(timezone.utc) - timedelta(days=i),
                last_used_at=datetime.now(timezone.utc),
                usage_count=i * 10
            )
            async_session.add(credential)

        await async_session.commit()
        await async_session.refresh(user)

        # Benchmark 測試
        def run_request():
            import asyncio

            async def async_request():
                response = await client.get(
                    "/api/v1/auth/methods",
                    headers=headers
                )
                return response

            return asyncio.run(async_request())

        response = benchmark(run_request)

        # 驗證回應內容
        assert response.status_code == 200
        data = response.json()
        assert data["has_oauth"] is True
        assert data["has_passkey"] is True
        assert data["passkey_count"] == 5
        assert len(data["passkey_credentials"]) == 5

        # 驗證效能需求
        stats = benchmark.stats
        mean_time = stats.stats.mean
        assert mean_time < 0.5, f"平均回應時間 {mean_time:.3f}s 超過 500ms 限制"


@pytest.mark.performance
@pytest.mark.asyncio
class TestOAuthCallbackPerformance:
    """POST /api/v1/auth/oauth/callback 效能測試"""

    async def test_oauth_callback_new_user_performance(
        self,
        benchmark,
        client,
        async_session
    ):
        """
        測試：POST /api/v1/auth/oauth/callback 效能（新用戶註冊）

        目標：<3s
        場景：OAuth 授權碼交換 + 新用戶建立 + Karma 初始化

        注意：此測試因為需要呼叫外部 Supabase API，實際會使用 mock
        """
        from unittest.mock import patch, AsyncMock

        # Mock Supabase OAuth 回應
        mock_user_data = {
            "id": "google-new-user-789",
            "email": f"perftest-{uuid4()}@example.com",
            "user_metadata": {
                "full_name": "Performance Test User",
                "avatar_url": "https://example.com/avatar.jpg"
            }
        }

        def run_request():
            import asyncio

            async def async_request():
                # 使用 mock 避免實際呼叫 Supabase API
                with patch("app.services.auth_method_coordinator.supabase_client") as mock_supabase:
                    # Mock auth.exchange_code_for_session
                    mock_supabase.auth.exchange_code_for_session = AsyncMock(
                        return_value={
                            "session": {
                                "access_token": "mock-token",
                                "refresh_token": "mock-refresh"
                            },
                            "user": mock_user_data
                        }
                    )

                    response = await client.post(
                        "/api/v1/auth/oauth/callback",
                        json={
                            "code": "mock-auth-code-perf-test",
                            "provider": "google"
                        }
                    )
                    return response

            return asyncio.run(async_request())

        response = benchmark(run_request)

        # 驗證效能需求（使用 mock，所以應該更快）
        stats = benchmark.stats
        mean_time = stats.stats.mean
        # 使用更寬鬆的限制，因為包含資料庫操作
        assert mean_time < 3.0, f"平均回應時間 {mean_time:.3f}s 超過 3s 限制"


@pytest.mark.performance
@pytest.mark.asyncio
class TestLoginWithLinkPerformance:
    """POST /api/v1/auth/login?link_oauth=true 效能測試"""

    async def test_login_with_link_oauth_performance(
        self,
        benchmark,
        client,
        test_user,
        async_session
    ):
        """
        測試：POST /api/v1/auth/login?link_oauth=true 效能

        目標：<1.5s
        場景：密碼驗證 + OAuth 資訊連結
        """
        # 設定測試用戶密碼
        test_password = "TestPerformance123!"
        test_user.password_hash = get_password_hash(test_password)
        await async_session.commit()

        def run_request():
            import asyncio

            async def async_request():
                response = await client.post(
                    "/api/v1/auth/login",
                    json={
                        "email": test_user.email,
                        "password": test_password,
                        "link_oauth": True,
                        "oauth_provider": "google",
                        "oauth_id": f"google-perf-{uuid4()}",
                        "profile_picture": "https://example.com/avatar.jpg"
                    }
                )
                return response

            return asyncio.run(async_request())

        response = benchmark(run_request)

        # 驗證回應正確
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

        # 驗證效能需求
        stats = benchmark.stats
        mean_time = stats.stats.mean
        assert mean_time < 1.5, f"平均回應時間 {mean_time:.3f}s 超過 1.5s 限制"


# Benchmark 配置
@pytest.fixture
def benchmark(benchmark):
    """配置 pytest-benchmark 參數"""
    # 至少執行 5 次以獲得穩定結果
    benchmark.pedantic(
        iterations=5,
        rounds=3
    )
    return benchmark
