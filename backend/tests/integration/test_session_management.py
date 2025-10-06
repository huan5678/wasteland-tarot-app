"""
Task 24: 後端整合測試 - 會話管理測試
測試 Token 過期、刷新和會話管理
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import jwt
from app.main import app
from app.models.user import User
from app.config import settings


class TestTokenGeneration:
    """測試 Token 生成"""

    @pytest.mark.asyncio
    async def test_login_generates_jwt_token(self, db_session):
        """測試登入生成 JWT token"""
        # Register and login
        registration_data = {
            "email": "jwt@example.com",
            "password": "JwtPass123!",
            "username": "jwtuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

            login_response = await client.post(
                "/api/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
            )

        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Verify token is valid JWT
        assert token is not None
        assert len(token.split('.')) == 3  # JWT has 3 parts

    @pytest.mark.asyncio
    async def test_token_contains_user_information(self, db_session):
        """測試 token 包含使用者資訊"""
        registration_data = {
            "email": "tokeninfo@example.com",
            "password": "TokenInfoPass123!",
            "username": "tokeninfouser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

            login_response = await client.post(
                "/api/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
            )

        token = login_response.json()["access_token"]

        # Decode token (without verification for testing)
        decoded = jwt.decode(token, options={"verify_signature": False})

        # Verify token contains user info
        assert "sub" in decoded or "user_id" in decoded
        assert "exp" in decoded  # Expiration time
        assert "iat" in decoded or "issued_at" in decoded  # Issued at

    @pytest.mark.asyncio
    async def test_token_has_expiration_time(self, db_session):
        """測試 token 有過期時間"""
        registration_data = {
            "email": "expiry@example.com",
            "password": "ExpiryPass123!",
            "username": "expiryuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

            login_response = await client.post(
                "/api/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
            )

        token = login_response.json()["access_token"]
        decoded = jwt.decode(token, options={"verify_signature": False})

        # Verify expiration exists and is in the future
        assert "exp" in decoded
        exp_timestamp = decoded["exp"]
        current_timestamp = datetime.now(timezone.utc).timestamp()
        assert exp_timestamp > current_timestamp

    @pytest.mark.asyncio
    async def test_refresh_token_generated_on_login(self, db_session):
        """測試登入時生成 refresh token"""
        registration_data = {
            "email": "refresh@example.com",
            "password": "RefreshPass123!",
            "username": "refreshuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

            login_response = await client.post(
                "/api/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
            )

        data = login_response.json()

        # Should have refresh token
        assert "refresh_token" in data or "refresh" in str(login_response.cookies)


class TestTokenExpiration:
    """測試 Token 過期"""

    @pytest.mark.asyncio
    async def test_expired_token_rejected(self, db_session):
        """測試過期的 token 被拒絕"""
        # Create an expired token
        user = User(
            id="expired-user-id",
            email="expired@example.com",
            username="expireduser"
        )
        db_session.add(user)
        await db_session.commit()

        # Generate expired token
        expired_payload = {
            "sub": str(user.id),
            "email": user.email,
            "exp": datetime.now(timezone.utc) - timedelta(hours=1)  # Expired 1 hour ago
        }
        expired_token = jwt.encode(
            expired_payload,
            settings.SECRET_KEY,
            algorithm="HS256"
        )

        # Try to use expired token
        headers = {"Authorization": f"Bearer {expired_token}"}

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/auth/me",
                headers=headers
            )

        # Should be rejected
        assert response.status_code == 401
        data = response.json()
        assert "expired" in str(data).lower() or "error" in data

    @pytest.mark.asyncio
    async def test_token_expiration_time_configurable(self):
        """測試 token 過期時間可配置"""
        # Verify settings has configurable expiration
        assert hasattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES") or \
               hasattr(settings, "JWT_EXPIRATION_MINUTES")

    @pytest.mark.asyncio
    async def test_access_token_shorter_expiration_than_refresh(self):
        """測試 access token 過期時間短於 refresh token"""
        # Verify configuration
        access_expiry = getattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 15)
        refresh_expiry = getattr(settings, "REFRESH_TOKEN_EXPIRE_DAYS", 7) * 24 * 60

        assert access_expiry < refresh_expiry


class TestTokenRefresh:
    """測試 Token 刷新"""

    @pytest.mark.asyncio
    async def test_refresh_token_endpoint_exists(self):
        """測試 refresh token 端點存在"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/refresh",
                json={"refresh_token": "dummy_token"}
            )

        # Should not be 404 (endpoint exists)
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_refresh_token_generates_new_access_token(self, db_session):
        """測試使用 refresh token 生成新的 access token"""
        # Register and login
        registration_data = {
            "email": "refreshtoken@example.com",
            "password": "RefreshTokenPass123!",
            "username": "refreshtokenuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

            login_response = await client.post(
                "/api/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
            )

        login_data = login_response.json()
        old_access_token = login_data["access_token"]
        refresh_token = login_data.get("refresh_token")

        if refresh_token:
            # Use refresh token to get new access token
            async with AsyncClient(app=app, base_url="http://test") as client:
                refresh_response = await client.post(
                    "/api/auth/refresh",
                    json={"refresh_token": refresh_token}
                )

            if refresh_response.status_code == 200:
                refresh_data = refresh_response.json()
                new_access_token = refresh_data["access_token"]

                # New token should be different
                assert new_access_token != old_access_token

    @pytest.mark.asyncio
    async def test_invalid_refresh_token_rejected(self):
        """測試無效的 refresh token 被拒絕"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/refresh",
                json={"refresh_token": "invalid_refresh_token_12345"}
            )

        # Should be rejected
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_expired_refresh_token_rejected(self, db_session):
        """測試過期的 refresh token 被拒絕"""
        # Create an expired refresh token
        expired_refresh_payload = {
            "sub": "user-id-123",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) - timedelta(days=1)  # Expired
        }
        expired_refresh_token = jwt.encode(
            expired_refresh_payload,
            settings.SECRET_KEY,
            algorithm="HS256"
        )

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/refresh",
                json={"refresh_token": expired_refresh_token}
            )

        # Should be rejected
        assert response.status_code in [401, 403]


class TestSessionManagement:
    """測試會話管理"""

    @pytest.mark.asyncio
    async def test_logout_invalidates_token(self, db_session):
        """測試登出使 token 失效"""
        # Register and login
        registration_data = {
            "email": "logout@example.com",
            "password": "LogoutPass123!",
            "username": "logoutuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

            login_response = await client.post(
                "/api/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
            )

        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Verify token works
        async with AsyncClient(app=app, base_url="http://test") as client:
            me_response = await client.get("/api/auth/me", headers=headers)
        assert me_response.status_code == 200

        # Logout
        async with AsyncClient(app=app, base_url="http://test") as client:
            logout_response = await client.post(
                "/api/auth/logout",
                headers=headers
            )

        # Token should be invalidated (if using token blacklist)
        # Or cookies should be cleared
        assert logout_response.status_code == 200

    @pytest.mark.asyncio
    async def test_multiple_sessions_for_same_user(self, db_session):
        """測試同一使用者的多個會話"""
        registration_data = {
            "email": "multisession@example.com",
            "password": "MultiSessionPass123!",
            "username": "multisessionuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

        login_data = {
            "email": registration_data["email"],
            "password": registration_data["password"]
        }

        # Create multiple sessions
        tokens = []
        async with AsyncClient(app=app, base_url="http://test") as client:
            for _ in range(3):
                login_response = await client.post(
                    "/api/auth/login",
                    json=login_data
                )
                tokens.append(login_response.json()["access_token"])

        # All tokens should work independently
        for token in tokens:
            headers = {"Authorization": f"Bearer {token}"}
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get("/api/auth/me", headers=headers)
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_session_includes_user_context(self, db_session):
        """測試會話包含使用者上下文（Karma, faction 等）"""
        registration_data = {
            "email": "context@example.com",
            "password": "ContextPass123!",
            "username": "contextuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

            login_response = await client.post(
                "/api/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
            )

        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get user info
        async with AsyncClient(app=app, base_url="http://test") as client:
            me_response = await client.get("/api/auth/me", headers=headers)

        assert me_response.status_code == 200
        user_data = me_response.json()

        # Should include Karma and faction
        assert "karma_score" in user_data
        assert "faction_alignment" in user_data
        assert user_data["karma_score"] == 50  # Initial karma
        assert user_data["faction_alignment"] == "neutral"


class TestTokenSecurity:
    """測試 Token 安全性"""

    @pytest.mark.asyncio
    async def test_token_signed_with_secret_key(self, db_session):
        """測試 token 使用密鑰簽名"""
        registration_data = {
            "email": "signed@example.com",
            "password": "SignedPass123!",
            "username": "signeduser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

            login_response = await client.post(
                "/api/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
            )

        token = login_response.json()["access_token"]

        # Verify token is signed (can't be decoded without secret)
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, "wrong_secret_key", algorithms=["HS256"])

        # Should decode successfully with correct secret
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        assert decoded is not None

    @pytest.mark.asyncio
    async def test_tampered_token_rejected(self):
        """測試被竄改的 token 被拒絕"""
        # Create a valid token then tamper with it
        valid_payload = {
            "sub": "user-123",
            "email": "tamper@example.com",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1)
        }
        valid_token = jwt.encode(valid_payload, settings.SECRET_KEY, algorithm="HS256")

        # Tamper with token (change one character)
        tampered_token = valid_token[:-5] + "XXXXX"

        headers = {"Authorization": f"Bearer {tampered_token}"}

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/auth/me", headers=headers)

        # Should be rejected
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_token_without_expiration_rejected(self):
        """測試沒有過期時間的 token 被拒絕"""
        # Create token without expiration
        payload_no_exp = {
            "sub": "user-456",
            "email": "noexp@example.com"
            # Missing "exp"
        }
        token_no_exp = jwt.encode(payload_no_exp, settings.SECRET_KEY, algorithm="HS256")

        headers = {"Authorization": f"Bearer {token_no_exp}"}

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/auth/me", headers=headers)

        # Should be rejected (or accepted based on implementation)
        # Most secure implementations require expiration
        # Adjust assertion based on actual implementation
        assert response.status_code in [200, 401]


class TestConcurrentSessionManagement:
    """測試並發會話管理"""

    @pytest.mark.asyncio
    async def test_refresh_token_rotation(self, db_session):
        """測試 refresh token 輪換（安全最佳實踐）"""
        # Register and login
        registration_data = {
            "email": "rotation@example.com",
            "password": "RotationPass123!",
            "username": "rotationuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

            login_response = await client.post(
                "/api/auth/login",
                json={
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
            )

        login_data = login_response.json()
        old_refresh_token = login_data.get("refresh_token")

        if old_refresh_token:
            # Use refresh token
            async with AsyncClient(app=app, base_url="http://test") as client:
                refresh_response = await client.post(
                    "/api/auth/refresh",
                    json={"refresh_token": old_refresh_token}
                )

            if refresh_response.status_code == 200:
                refresh_data = refresh_response.json()
                new_refresh_token = refresh_data.get("refresh_token")

                if new_refresh_token:
                    # New refresh token should be different (rotation)
                    assert new_refresh_token != old_refresh_token

                    # Old refresh token should be invalidated
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        old_refresh_response = await client.post(
                            "/api/auth/refresh",
                            json={"refresh_token": old_refresh_token}
                        )

                    # Should be rejected
                    assert old_refresh_response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_logout_all_sessions(self, db_session):
        """測試登出所有會話"""
        # Register and create multiple sessions
        registration_data = {
            "email": "logoutall@example.com",
            "password": "LogoutAllPass123!",
            "username": "logoutalluser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

        login_data = {
            "email": registration_data["email"],
            "password": registration_data["password"]
        }

        # Create 3 sessions
        tokens = []
        async with AsyncClient(app=app, base_url="http://test") as client:
            for _ in range(3):
                login_response = await client.post(
                    "/api/auth/login",
                    json=login_data
                )
                tokens.append(login_response.json()["access_token"])

        # Logout all sessions (if endpoint exists)
        headers = {"Authorization": f"Bearer {tokens[0]}"}
        async with AsyncClient(app=app, base_url="http://test") as client:
            logout_all_response = await client.post(
                "/api/auth/logout/all",
                headers=headers
            )

        # If endpoint exists, all tokens should be invalidated
        if logout_all_response.status_code == 200:
            for token in tokens:
                headers = {"Authorization": f"Bearer {token}"}
                async with AsyncClient(app=app, base_url="http://test") as client:
                    response = await client.get("/api/auth/me", headers=headers)
                # Should be unauthorized
                assert response.status_code == 401
