"""
Task 24: 後端整合測試 - Email 認證完整流程測試
測試完整的 email 註冊和登入流程
"""

import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from app.main import app
from app.models.user import User
from app.core.security import verify_password


class TestEmailRegistrationFlow:
    """測試 email 註冊流程"""

    @pytest.mark.asyncio
    async def test_register_with_valid_email_and_password(self, db_session):
        """測試使用有效 email 和密碼註冊"""
        registration_data = {
            "email": "newuser@example.com",
            "password": "SecurePassword123!",
            "username": "newuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json=registration_data
            )

        # Should succeed
        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == registration_data["email"]
        assert data["user"]["username"] == registration_data["username"]
        assert "password" not in data["user"]  # Password should not be returned

    @pytest.mark.asyncio
    async def test_register_creates_user_in_database(self, db_session):
        """測試註冊成功後使用者儲存到資料庫"""
        registration_data = {
            "email": "dbtest@example.com",
            "password": "Password123!",
            "username": "dbtest"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json=registration_data
            )

        assert response.status_code == 201

        # Verify user exists in database
        from sqlalchemy import select
        result = await db_session.execute(
            select(User).where(User.email == registration_data["email"])
        )
        user = result.scalar_one_or_none()

        assert user is not None
        assert user.email == registration_data["email"]
        assert user.username == registration_data["username"]
        assert user.password_hash is not None
        assert user.is_oauth_user is False
        assert user.oauth_provider is None

    @pytest.mark.asyncio
    async def test_register_hashes_password_with_bcrypt(self, db_session):
        """測試註冊時密碼使用 bcrypt 加密"""
        registration_data = {
            "email": "bcrypt@example.com",
            "password": "PlainPassword456!",
            "username": "bcryptuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json=registration_data
            )

        assert response.status_code == 201

        # Verify password is hashed
        from sqlalchemy import select
        result = await db_session.execute(
            select(User).where(User.email == registration_data["email"])
        )
        user = result.scalar_one_or_none()

        assert user.password_hash is not None
        assert user.password_hash.startswith("$2b$")  # Bcrypt format
        assert user.password_hash != registration_data["password"]  # Not plain text

        # Verify password can be verified
        assert verify_password(registration_data["password"], user.password_hash)

    @pytest.mark.asyncio
    async def test_register_initializes_karma(self, db_session):
        """測試註冊時初始化 Karma 系統"""
        registration_data = {
            "email": "karma@example.com",
            "password": "KarmaPass123!",
            "username": "karmauser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json=registration_data
            )

        assert response.status_code == 201

        # Verify karma initialized
        from sqlalchemy import select
        result = await db_session.execute(
            select(User).where(User.email == registration_data["email"])
        )
        user = result.scalar_one_or_none()

        assert user.karma_score == 50  # Initial karma
        assert user.faction_alignment == "neutral"

    @pytest.mark.asyncio
    async def test_register_duplicate_email_rejected(self, db_session):
        """測試重複 email 註冊被拒絕"""
        # Register first user
        first_registration = {
            "email": "duplicate@example.com",
            "password": "Password123!",
            "username": "firstuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response1 = await client.post(
                "/api/auth/register",
                json=first_registration
            )
        assert response1.status_code == 201

        # Try to register with same email
        second_registration = {
            "email": "duplicate@example.com",  # Same email
            "password": "DifferentPass456!",
            "username": "seconduser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response2 = await client.post(
                "/api/auth/register",
                json=second_registration
            )

        # Should reject
        assert response2.status_code == 409  # Conflict
        data = response2.json()
        assert "error" in data or "email" in data

    @pytest.mark.asyncio
    async def test_register_validates_email_format(self):
        """測試註冊驗證 email 格式"""
        invalid_emails = [
            "notanemail",
            "missing@domain",
            "@nodomain.com",
            "spaces in@email.com",
            "double@@at.com"
        ]

        for invalid_email in invalid_emails:
            registration_data = {
                "email": invalid_email,
                "password": "Password123!",
                "username": "testuser"
            }

            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/auth/register",
                    json=registration_data
                )

            # Should reject invalid email
            assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_register_validates_password_strength(self):
        """測試註冊驗證密碼強度"""
        weak_passwords = [
            "short",  # Too short
            "12345678",  # Only numbers
            "password",  # Too common
            "abc",  # Too short
        ]

        for weak_password in weak_passwords:
            registration_data = {
                "email": "strength@example.com",
                "password": weak_password,
                "username": "strengthuser"
            }

            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/auth/register",
                    json=registration_data
                )

            # Should reject weak password
            assert response.status_code in [400, 422]

    @pytest.mark.asyncio
    async def test_register_returns_access_token(self):
        """測試註冊成功後返回 access token"""
        registration_data = {
            "email": "token@example.com",
            "password": "TokenPass123!",
            "username": "tokenuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/register",
                json=registration_data
            )

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"


class TestEmailLoginFlow:
    """測試 email 登入流程"""

    @pytest.mark.asyncio
    async def test_login_with_valid_credentials(self, db_session):
        """測試使用有效憑證登入"""
        # First register a user
        registration_data = {
            "email": "login@example.com",
            "password": "LoginPass123!",
            "username": "loginuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

        # Then login
        login_data = {
            "email": registration_data["email"],
            "password": registration_data["password"]
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/login",
                json=login_data
            )

        # Should succeed
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == login_data["email"]

    @pytest.mark.asyncio
    async def test_login_with_wrong_password(self, db_session):
        """測試密碼錯誤時登入失敗"""
        # Register user
        registration_data = {
            "email": "wrongpass@example.com",
            "password": "CorrectPass123!",
            "username": "wrongpassuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

        # Try login with wrong password
        login_data = {
            "email": registration_data["email"],
            "password": "WrongPassword456!"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/login",
                json=login_data
            )

        # Should fail
        assert response.status_code == 401
        data = response.json()
        assert "error" in data or "detail" in data

    @pytest.mark.asyncio
    async def test_login_with_nonexistent_email(self):
        """測試不存在的 email 登入失敗"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "AnyPassword123!"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/login",
                json=login_data
            )

        # Should fail
        assert response.status_code == 401
        data = response.json()
        assert "error" in data or "detail" in data

    @pytest.mark.asyncio
    async def test_login_email_case_insensitive(self, db_session):
        """測試 email 登入不區分大小寫"""
        # Register with lowercase email
        registration_data = {
            "email": "case@example.com",
            "password": "CasePass123!",
            "username": "caseuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

        # Login with uppercase email
        login_data = {
            "email": "CASE@EXAMPLE.COM",  # Uppercase
            "password": registration_data["password"]
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/login",
                json=login_data
            )

        # Should succeed
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_login_updates_last_login_timestamp(self, db_session):
        """測試登入時更新 last_login 時間戳"""
        # Register user
        registration_data = {
            "email": "timestamp@example.com",
            "password": "TimestampPass123!",
            "username": "timestampuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

        # Get initial last_login
        from sqlalchemy import select
        result = await db_session.execute(
            select(User).where(User.email == registration_data["email"])
        )
        user = result.scalar_one()
        initial_last_login = user.last_login

        # Login
        login_data = {
            "email": registration_data["email"],
            "password": registration_data["password"]
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/login",
                json=login_data
            )

        assert response.status_code == 200

        # Verify last_login updated
        await db_session.refresh(user)
        assert user.last_login > initial_last_login

    @pytest.mark.asyncio
    async def test_oauth_user_cannot_login_with_password(self, db_session):
        """測試 OAuth 使用者無法使用密碼登入"""
        # Create OAuth user directly in database
        oauth_user = User(
            email="oauth@example.com",
            username="OAuth User",
            oauth_provider="google",
            oauth_id="google_123",
            is_oauth_user=True,
            password_hash=None  # No password
        )
        db_session.add(oauth_user)
        await db_session.commit()

        # Try to login with password
        login_data = {
            "email": "oauth@example.com",
            "password": "AnyPassword123!"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/login",
                json=login_data
            )

        # Should reject
        assert response.status_code in [400, 401, 403]
        data = response.json()
        assert "error" in data
        # Should mention OAuth or suggest using OAuth login
        assert "oauth" in str(data).lower() or "google" in str(data).lower()


class TestPasswordResetFlow:
    """測試密碼重置流程"""

    @pytest.mark.asyncio
    async def test_request_password_reset(self, db_session):
        """測試請求密碼重置"""
        # Register user
        registration_data = {
            "email": "reset@example.com",
            "password": "OldPass123!",
            "username": "resetuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

        # Request password reset
        reset_request = {
            "email": registration_data["email"]
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/auth/password-reset/request",
                json=reset_request
            )

        # Should succeed (even if email doesn't exist, for security)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_password_reset_with_token(self, db_session):
        """測試使用 token 重置密碼"""
        # This test requires implementing token generation
        # Placeholder for future implementation
        pass


class TestAuthenticationIntegration:
    """測試完整的認證整合流程"""

    @pytest.mark.asyncio
    async def test_full_registration_and_login_flow(self, db_session):
        """測試完整的註冊 → 登入流程"""
        # Step 1: Register
        registration_data = {
            "email": "fullflow@example.com",
            "password": "FullFlowPass123!",
            "username": "fullflowuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            reg_response = await client.post(
                "/api/auth/register",
                json=registration_data
            )

        assert reg_response.status_code == 201
        reg_data = reg_response.json()
        first_token = reg_data["access_token"]

        # Step 2: Login
        login_data = {
            "email": registration_data["email"],
            "password": registration_data["password"]
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            login_response = await client.post(
                "/api/auth/login",
                json=login_data
            )

        assert login_response.status_code == 200
        login_data = login_response.json()
        second_token = login_data["access_token"]

        # Both tokens should be valid (but may be different)
        assert first_token is not None
        assert second_token is not None

    @pytest.mark.asyncio
    async def test_access_protected_route_with_token(self, db_session):
        """測試使用 token 訪問受保護路由"""
        # Register and login
        registration_data = {
            "email": "protected@example.com",
            "password": "ProtectedPass123!",
            "username": "protecteduser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            reg_response = await client.post(
                "/api/auth/register",
                json=registration_data
            )

        assert reg_response.status_code == 201
        token = reg_response.json()["access_token"]

        # Access protected route
        headers = {"Authorization": f"Bearer {token}"}

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/auth/me",  # Get current user
                headers=headers
            )

        # Should succeed
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == registration_data["email"]

    @pytest.mark.asyncio
    async def test_access_protected_route_without_token(self):
        """測試未提供 token 訪問受保護路由被拒絕"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/auth/me")

        # Should be unauthorized
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_access_protected_route_with_invalid_token(self):
        """測試使用無效 token 訪問受保護路由被拒絕"""
        headers = {"Authorization": "Bearer invalid_token_12345"}

        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/api/auth/me",
                headers=headers
            )

        # Should be unauthorized
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_concurrent_logins_same_user(self, db_session):
        """測試同一使用者同時多次登入"""
        # Register user
        registration_data = {
            "email": "concurrent@example.com",
            "password": "ConcurrentPass123!",
            "username": "concurrentuser"
        }

        async with AsyncClient(app=app, base_url="http://test") as client:
            await client.post("/api/auth/register", json=registration_data)

        login_data = {
            "email": registration_data["email"],
            "password": registration_data["password"]
        }

        # Login multiple times
        tokens = []
        async with AsyncClient(app=app, base_url="http://test") as client:
            for _ in range(3):
                response = await client.post(
                    "/api/auth/login",
                    json=login_data
                )
                assert response.status_code == 200
                tokens.append(response.json()["access_token"])

        # All tokens should be valid
        assert len(tokens) == 3
        assert all(token is not None for token in tokens)
