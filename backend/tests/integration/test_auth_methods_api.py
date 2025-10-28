"""
Account Integration API Endpoints Integration Tests

Task 4.5: 建立帳號整合相關 API 端點
需求 8.5: 相同 Email 跨認證方式整合引導（帳號衝突解決）

測試兩個 API 端點：
1. POST /api/auth/login?link_oauth=true - 密碼登入並連結 OAuth
2. POST /api/auth/passkey/login-and-link - Passkey 登入並連結 OAuth

效能需求：<1.5 秒回應時間
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
from datetime import datetime, timezone
import json
import time

from app.models.user import User
from app.models.credential import Credential
from app.core.security import get_password_hash


@pytest.mark.integration
@pytest.mark.asyncio
class TestPasswordLoginAndLinkOAuthAPI:
    """
    測試 POST /api/auth/login?link_oauth=true 端點

    需求 8.5: 密碼登入並連結 OAuth 的完整流程
    """

    async def test_should_successfully_login_and_link_oauth_with_correct_password(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        測試使用正確密碼登入並成功連結 OAuth

        驗收標準：
        - 回應狀態碼 200
        - 回應包含 success=true
        - 回應包含 user 和 tokens
        - user 資料已包含 OAuth 資訊
        - JWT tokens 已設定為 httpOnly cookies
        - JWT payload 包含 has_oauth=true 標記
        """
        # Arrange: 建立已有密碼的用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"
        user_password = "SecurePassword123!"

        existing_user = User(
            email=user_email,
            name="Test User",
            password_hash=get_password_hash(user_password),
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        # OAuth 資料（模擬從 OAuth callback 傳來的）
        oauth_data = {
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
            "profile_picture_url": "https://example.com/profile.jpg"
        }

        # Act: 呼叫 API 端點
        start_time = time.time()
        response = await async_client.post(
            "/api/v1/auth/login",
            params={"link_oauth": "true"},  # 關鍵參數
            json={
                "email": user_email,
                "password": user_password,
                "oauth_data": oauth_data  # 附帶 OAuth 資料
            }
        )
        elapsed_time = time.time() - start_time

        # Assert: 驗證回應
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        # 效能需求：<1.5 秒
        assert elapsed_time < 1.5, f"Response time {elapsed_time}s exceeded 1.5s requirement"

        data = response.json()
        assert data["message"] == "登入成功"

        # 驗證 user 資料已包含 OAuth 資訊
        user_data = data["user"]
        assert user_data["email"] == user_email
        assert user_data["is_oauth_user"] is True
        assert user_data.get("oauth_provider") == "google"  # 新增：應該回傳 oauth_provider

        # 驗證 cookies 已設定（httpOnly）
        cookies = response.cookies
        assert "access_token" in cookies
        assert "refresh_token" in cookies

    async def test_should_fail_with_incorrect_password(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        測試使用錯誤密碼登入失敗

        驗收標準：
        - 回應狀態碼 401
        - 回應包含錯誤訊息
        - OAuth 資訊不應寫入資料庫
        """
        # Arrange: 建立用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"
        user_password = "CorrectPassword123!"

        existing_user = User(
            email=user_email,
            name="Test User",
            password_hash=get_password_hash(user_password),
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        oauth_data = {
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
            "profile_picture_url": "https://example.com/profile.jpg"
        }

        # Act: 使用錯誤密碼
        response = await async_client.post(
            "/api/v1/auth/login",
            params={"link_oauth": "true"},
            json={
                "email": user_email,
                "password": "WrongPassword123!",  # 錯誤密碼
                "oauth_data": oauth_data
            }
        )

        # Assert
        assert response.status_code == 401

        # 驗證資料庫中的 OAuth 資訊沒有被寫入
        await db_session.refresh(existing_user)
        assert existing_user.oauth_provider is None
        assert existing_user.oauth_id is None

    async def test_should_lock_account_after_5_failed_attempts(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        測試連續 5 次密碼錯誤後鎖定帳號

        驗收標準：
        - 第 5 次失敗後回應 401
        - 錯誤訊息提示帳號已鎖定
        - 提示鎖定時間為 15 分鐘
        """
        # Arrange: 建立用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"
        user_password = "CorrectPassword123!"

        existing_user = User(
            email=user_email,
            name="Test User",
            password_hash=get_password_hash(user_password),
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        oauth_data = {
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
        }

        # Act: 連續 5 次錯誤密碼
        for i in range(5):
            response = await async_client.post(
                "/api/v1/auth/login",
                params={"link_oauth": "true"},
                json={
                    "email": user_email,
                    "password": "WrongPassword123!",
                    "oauth_data": oauth_data
                }
            )

            if i < 4:
                assert response.status_code == 401
            else:
                # 第 5 次失敗後應該提示鎖定
                assert response.status_code == 401
                error_detail = response.json()["detail"]
                assert "鎖定" in error_detail or "locked" in error_detail.lower()

    async def test_should_reject_email_mismatch(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        測試 OAuth email 與帳號 email 不一致時拒絕連結

        驗收標準：
        - 回應狀態碼 400
        - 錯誤訊息提示 email 不符
        - OAuth 資訊不應寫入資料庫
        """
        # Arrange: 建立用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"
        different_oauth_email = f"different_{uuid4().hex[:8]}@example.com"
        user_password = "SecurePassword123!"

        existing_user = User(
            email=user_email,
            name="Test User",
            password_hash=get_password_hash(user_password),
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        # OAuth 資料包含不同的 email
        oauth_data = {
            "email": different_oauth_email,  # 不同的 email
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
        }

        # Act
        response = await async_client.post(
            "/api/v1/auth/login",
            params={"link_oauth": "true"},
            json={
                "email": user_email,
                "password": user_password,
                "oauth_data": oauth_data
            }
        )

        # Assert
        assert response.status_code == 400
        error_detail = response.json()["detail"]
        assert "不符" in error_detail or "mismatch" in error_detail.lower()
        assert different_oauth_email in error_detail
        assert user_email in error_detail

    async def test_should_include_auth_method_flags_in_jwt_payload(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        測試 JWT tokens 包含正確的認證方式標記

        驗收標準：
        - JWT payload 包含 auth_method='password'
        - JWT payload 包含 has_oauth=true
        - JWT payload 包含 has_password=true
        - JWT payload 包含 has_passkey=false
        """
        from app.core.security import verify_token

        # Arrange: 建立用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"
        user_password = "SecurePassword123!"

        existing_user = User(
            email=user_email,
            name="Test User",
            password_hash=get_password_hash(user_password),
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        oauth_data = {
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
        }

        # Act
        response = await async_client.post(
            "/api/v1/auth/login",
            params={"link_oauth": "true"},
            json={
                "email": user_email,
                "password": user_password,
                "oauth_data": oauth_data
            }
        )

        # Assert: 驗證回應成功
        assert response.status_code == 200

        # 從 cookies 提取 access_token
        access_token = response.cookies.get("access_token")
        assert access_token is not None, "access_token cookie should be set"

        # 驗證 JWT payload
        payload = verify_token(access_token)
        assert payload is not None
        assert payload.get("auth_method") == "password"
        assert payload.get("has_oauth") is True
        assert payload.get("has_password") is True
        assert payload.get("has_passkey") is False


@pytest.mark.integration
@pytest.mark.asyncio
class TestPasskeyLoginAndLinkOAuthAPI:
    """
    測試 POST /api/auth/passkey/login-and-link 端點

    需求 8.5: Passkey 登入並連結 OAuth 的完整流程
    """

    async def test_should_successfully_login_with_passkey_and_link_oauth(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        測試使用 Passkey 成功登入並連結 OAuth

        驗收標準：
        - 回應狀態碼 200
        - 回應包含 success=true
        - 回應包含 user 和 tokens
        - user 資料已包含 OAuth 資訊
        - JWT tokens 已設定為 httpOnly cookies
        - JWT payload 包含 has_oauth=true, has_passkey=true
        """
        # Arrange: 建立已有 Passkey 的用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"

        existing_user = User(
            email=user_email,
            name="Test User",
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        # 建立 Passkey credential
        credential = Credential(
            user_id=existing_user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key="mock_public_key",
            counter=0,
            transports=json.dumps(["internal"]),
            device_name="Test Device",
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(credential)
        await db_session.commit()
        await db_session.refresh(credential)

        # OAuth 資料
        oauth_data = {
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
            "profile_picture_url": "https://example.com/profile.jpg"
        }

        # Mock WebAuthn assertion response（模擬生物辨識驗證）
        mock_assertion_response = {
            "id": credential.credential_id,
            "rawId": credential.credential_id,
            "response": {
                "authenticatorData": "mock_authenticator_data",
                "clientDataJSON": "mock_client_data_json",
                "signature": "mock_signature"
            },
            "type": "public-key"
        }

        # Act: 呼叫 API 端點
        start_time = time.time()
        response = await async_client.post(
            "/api/v1/auth/passkey/login-and-link",
            json={
                "assertion_response": mock_assertion_response,
                "oauth_data": oauth_data
            }
        )
        elapsed_time = time.time() - start_time

        # Assert: 驗證回應
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        # 效能需求：<1.5 秒
        assert elapsed_time < 1.5, f"Response time {elapsed_time}s exceeded 1.5s requirement"

        data = response.json()
        assert data.get("success") is True

        # 驗證 user 資料已包含 OAuth 資訊
        user_data = data["user"]
        assert user_data["email"] == user_email
        assert user_data.get("oauth_provider") == "google"

        # 驗證 cookies 已設定
        cookies = response.cookies
        assert "access_token" in cookies
        assert "refresh_token" in cookies

    async def test_should_fail_when_passkey_verification_fails(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        測試 Passkey 驗證失敗時拒絕登入

        驗收標準：
        - 回應狀態碼 401
        - OAuth 資訊不應寫入資料庫
        """
        # Arrange: 建立用戶（無 Passkey）
        user_email = f"user_{uuid4().hex[:8]}@example.com"

        existing_user = User(
            email=user_email,
            name="Test User",
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        oauth_data = {
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
        }

        # Mock invalid assertion response
        invalid_assertion_response = {
            "id": "invalid_credential_id",
            "rawId": "invalid_credential_id",
            "response": {
                "authenticatorData": "invalid",
                "clientDataJSON": "invalid",
                "signature": "invalid"
            },
            "type": "public-key"
        }

        # Act
        response = await async_client.post(
            "/api/v1/auth/passkey/login-and-link",
            json={
                "assertion_response": invalid_assertion_response,
                "oauth_data": oauth_data
            }
        )

        # Assert
        assert response.status_code == 401

        # 驗證資料庫中的 OAuth 資訊沒有被寫入
        await db_session.refresh(existing_user)
        assert existing_user.oauth_provider is None
        assert existing_user.oauth_id is None

    async def test_should_reject_email_mismatch_for_passkey_login(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        測試 OAuth email 與 Passkey 用戶 email 不一致時拒絕連結

        驗收標準：
        - 回應狀態碼 400
        - 錯誤訊息提示 email 不符
        """
        # Arrange: 建立已有 Passkey 的用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"
        different_oauth_email = f"different_{uuid4().hex[:8]}@example.com"

        existing_user = User(
            email=user_email,
            name="Test User",
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        credential = Credential(
            user_id=existing_user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key="mock_public_key",
            counter=0,
            transports=json.dumps(["internal"]),
            device_name="Test Device",
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(credential)
        await db_session.commit()

        # OAuth 資料包含不同的 email
        oauth_data = {
            "email": different_oauth_email,
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
        }

        mock_assertion_response = {
            "id": credential.credential_id,
            "rawId": credential.credential_id,
            "response": {
                "authenticatorData": "mock_authenticator_data",
                "clientDataJSON": "mock_client_data_json",
                "signature": "mock_signature"
            },
            "type": "public-key"
        }

        # Act
        response = await async_client.post(
            "/api/v1/auth/passkey/login-and-link",
            json={
                "assertion_response": mock_assertion_response,
                "oauth_data": oauth_data
            }
        )

        # Assert
        assert response.status_code == 400
        error_detail = response.json()["detail"]
        assert "不符" in error_detail or "mismatch" in error_detail.lower()

    async def test_should_include_correct_auth_method_flags_in_jwt(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """
        測試 JWT tokens 包含正確的認證方式標記（Passkey + OAuth）

        驗收標準：
        - JWT payload 包含 auth_method='passkey'
        - JWT payload 包含 has_oauth=true
        - JWT payload 包含 has_passkey=true
        - JWT payload 包含 has_password=false（如果用戶沒有密碼）
        """
        from app.core.security import verify_token

        # Arrange: 建立已有 Passkey 的用戶（無密碼）
        user_email = f"user_{uuid4().hex[:8]}@example.com"

        existing_user = User(
            email=user_email,
            name="Test User",
            password_hash=None,  # 無密碼
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        credential = Credential(
            user_id=existing_user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key="mock_public_key",
            counter=0,
            transports=json.dumps(["internal"]),
            device_name="Test Device",
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(credential)
        await db_session.commit()

        oauth_data = {
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
        }

        mock_assertion_response = {
            "id": credential.credential_id,
            "rawId": credential.credential_id,
            "response": {
                "authenticatorData": "mock_authenticator_data",
                "clientDataJSON": "mock_client_data_json",
                "signature": "mock_signature"
            },
            "type": "public-key"
        }

        # Act
        response = await async_client.post(
            "/api/v1/auth/passkey/login-and-link",
            json={
                "assertion_response": mock_assertion_response,
                "oauth_data": oauth_data
            }
        )

        # Assert: 驗證回應成功
        assert response.status_code == 200

        # 從 cookies 提取 access_token
        access_token = response.cookies.get("access_token")
        assert access_token is not None, "access_token cookie should be set"

        # 驗證 JWT payload
        payload = verify_token(access_token)
        assert payload is not None
        assert payload.get("auth_method") == "passkey"
        assert payload.get("has_oauth") is True
        assert payload.get("has_passkey") is True
        assert payload.get("has_password") is False


@pytest.mark.integration
@pytest.mark.asyncio
class TestAuthMethodsAPIPerformance:
    """
    測試 API 端點的效能需求

    需求：所有端點回應時間 <1.5 秒
    """

    async def test_password_login_and_link_performance(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """測試密碼登入並連結 OAuth 的效能"""
        # Arrange
        user_email = f"user_{uuid4().hex[:8]}@example.com"
        user_password = "SecurePassword123!"

        existing_user = User(
            email=user_email,
            name="Test User",
            password_hash=get_password_hash(user_password),
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()

        oauth_data = {
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
        }

        # Act: 測量效能
        start_time = time.time()
        response = await async_client.post(
            "/api/v1/auth/login",
            params={"link_oauth": "true"},
            json={
                "email": user_email,
                "password": user_password,
                "oauth_data": oauth_data
            }
        )
        elapsed_time = time.time() - start_time

        # Assert: 效能需求 <1.5 秒
        assert response.status_code == 200
        assert elapsed_time < 1.5, f"Response time {elapsed_time}s exceeded 1.5s requirement"

    async def test_passkey_login_and_link_performance(
        self, async_client: AsyncClient, db_session: AsyncSession
    ):
        """測試 Passkey 登入並連結 OAuth 的效能"""
        # Arrange
        user_email = f"user_{uuid4().hex[:8]}@example.com"

        existing_user = User(
            email=user_email,
            name="Test User",
            karma_score=50,
            is_active=True,
            is_verified=True,
            failed_login_attempts=0
        )
        db_session.add(existing_user)
        await db_session.commit()
        await db_session.refresh(existing_user)

        credential = Credential(
            user_id=existing_user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key="mock_public_key",
            counter=0,
            transports=json.dumps(["internal"]),
            device_name="Test Device",
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(credential)
        await db_session.commit()

        oauth_data = {
            "oauth_provider": "google",
            "oauth_id": f"google_id_{uuid4().hex[:8]}",
        }

        mock_assertion_response = {
            "id": credential.credential_id,
            "rawId": credential.credential_id,
            "response": {
                "authenticatorData": "mock_authenticator_data",
                "clientDataJSON": "mock_client_data_json",
                "signature": "mock_signature"
            },
            "type": "public-key"
        }

        # Act: 測量效能
        start_time = time.time()
        response = await async_client.post(
            "/api/v1/auth/passkey/login-and-link",
            json={
                "assertion_response": mock_assertion_response,
                "oauth_data": oauth_data
            }
        )
        elapsed_time = time.time() - start_time

        # Assert: 效能需求 <1.5 秒
        assert response.status_code == 200
        assert elapsed_time < 1.5, f"Response time {elapsed_time}s exceeded 1.5s requirement"


@pytest.mark.integration
@pytest.mark.asyncio
class TestSetPasswordAPI:
    """
    測試設定密碼 API

    需求 11: POST /api/v1/auth/set-password
    允許已登入的 OAuth 用戶設定密碼作為備用認證方式
    """

    async def test_set_password_success(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試成功設定密碼"""
        from app.core.security import create_access_token, verify_password

        # Arrange: 建立 OAuth only 用戶
        user_email = f"oauth_user_{uuid4().hex[:8]}@example.com"

        oauth_user = User(
            email=user_email,
            name="OAuth Test User",
            oauth_provider="google",
            oauth_id=f"google_id_{uuid4().hex[:8]}",
            profile_picture_url="https://example.com/profile.jpg",
            password_hash=None,  # OAuth 用戶無密碼
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(oauth_user)
        await db_session.commit()
        await db_session.refresh(oauth_user)

        # 生成 JWT token
        access_token = create_access_token(data={"sub": str(oauth_user.id)})

        # Act: 發送請求設定密碼
        response = await async_client.post(
            "/api/v1/auth/set-password",
            json={"password": "SecurePassword123"},
            cookies={"access_token": access_token}
        )

        # Assert: 驗證回應
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        data = response.json()
        assert data["success"] is True
        assert data["message"] == "密碼設定成功"
        assert data["has_password"] is True

        # 驗證資料庫更新
        await db_session.refresh(oauth_user)
        assert oauth_user.password_hash is not None
        assert verify_password("SecurePassword123", oauth_user.password_hash)

    async def test_set_password_too_short(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試密碼太短（少於 8 字元）"""
        from app.core.security import create_access_token

        # Arrange: 建立 OAuth only 用戶
        user_email = f"oauth_user_{uuid4().hex[:8]}@example.com"

        oauth_user = User(
            email=user_email,
            name="OAuth Test User",
            oauth_provider="google",
            oauth_id=f"google_id_{uuid4().hex[:8]}",
            password_hash=None,
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(oauth_user)
        await db_session.commit()
        await db_session.refresh(oauth_user)

        access_token = create_access_token(data={"sub": str(oauth_user.id)})

        # Act: 發送請求設定太短的密碼
        response = await async_client.post(
            "/api/v1/auth/set-password",
            json={"password": "short"},
            cookies={"access_token": access_token}
        )

        # Assert: 應該回傳 422 (Pydantic validation error)
        assert response.status_code == 422

    async def test_set_password_already_set(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試已設定密碼的用戶無法重複設定"""
        from app.core.security import create_access_token, get_password_hash

        # Arrange: 建立已有密碼的用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"

        user_with_password = User(
            email=user_email,
            name="User With Password",
            oauth_provider="google",
            oauth_id=f"google_id_{uuid4().hex[:8]}",
            password_hash=get_password_hash("ExistingPassword123"),
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(user_with_password)
        await db_session.commit()
        await db_session.refresh(user_with_password)

        access_token = create_access_token(data={"sub": str(user_with_password.id)})

        # Act: 嘗試重複設定密碼
        response = await async_client.post(
            "/api/v1/auth/set-password",
            json={"password": "NewPassword123"},
            cookies={"access_token": access_token}
        )

        # Assert: 應該回傳 409 Conflict
        assert response.status_code == 409
        data = response.json()
        assert "密碼已設定" in data["detail"]

    async def test_set_password_unauthorized(
        self,
        async_client: AsyncClient
    ):
        """測試未登入無法設定密碼"""
        # Act: 發送請求但不提供 JWT token
        response = await async_client.post(
            "/api/v1/auth/set-password",
            json={"password": "SecurePassword123"}
        )

        # Assert: 應該回傳 401 Unauthorized
        assert response.status_code == 401

    async def test_set_password_bcrypt_cost_factor(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試 bcrypt cost factor ≥ 12"""
        from app.core.security import create_access_token

        # Arrange: 建立 OAuth only 用戶
        user_email = f"oauth_user_{uuid4().hex[:8]}@example.com"

        oauth_user = User(
            email=user_email,
            name="OAuth Test User",
            oauth_provider="google",
            oauth_id=f"google_id_{uuid4().hex[:8]}",
            password_hash=None,
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(oauth_user)
        await db_session.commit()
        await db_session.refresh(oauth_user)

        access_token = create_access_token(data={"sub": str(oauth_user.id)})

        # Act: 設定密碼
        response = await async_client.post(
            "/api/v1/auth/set-password",
            json={"password": "SecurePassword123"},
            cookies={"access_token": access_token}
        )

        assert response.status_code == 200

        # Assert: 驗證 bcrypt cost factor
        await db_session.refresh(oauth_user)
        password_hash = oauth_user.password_hash

        # bcrypt hash 格式: $2b$<cost>$<salt><hash>
        # 例如: $2b$12$...
        assert password_hash.startswith("$2b$")
        cost_factor = int(password_hash.split("$")[2])
        assert cost_factor >= 12, f"bcrypt cost factor {cost_factor} < 12"


@pytest.mark.integration
@pytest.mark.asyncio
class TestUnlinkOAuthAPI:
    """
    測試移除 OAuth 連結 API

    需求 12: POST /api/v1/auth/oauth/unlink
    允許用戶移除 Google OAuth 連結（需至少保留一種認證方式）
    """

    async def test_unlink_oauth_success_with_password(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試成功移除 OAuth（有密碼作為備用）"""
        from app.core.security import create_access_token, get_password_hash

        # Arrange: 建立有 OAuth + 密碼的用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"

        user_with_both = User(
            email=user_email,
            name="User With Both",
            oauth_provider="google",
            oauth_id=f"google_id_{uuid4().hex[:8]}",
            profile_picture_url="https://example.com/profile.jpg",
            password_hash=get_password_hash("SecurePassword123"),
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(user_with_both)
        await db_session.commit()
        await db_session.refresh(user_with_both)

        # 確認用戶有 OAuth
        assert user_with_both.oauth_provider is not None

        access_token = create_access_token(data={"sub": str(user_with_both.id)})

        # Act: 移除 OAuth 連結
        response = await async_client.post(
            "/api/v1/auth/oauth/unlink",
            cookies={"access_token": access_token}
        )

        # Assert: 驗證回應
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["message"] == "OAuth 連結已成功移除"
        assert data["has_oauth"] is False

        # 驗證資料庫更新
        await db_session.refresh(user_with_both)
        assert user_with_both.oauth_provider is None
        assert user_with_both.oauth_id is None
        assert user_with_both.profile_picture_url is None

    async def test_unlink_oauth_success_with_passkey(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試成功移除 OAuth（有 Passkey 作為備用）"""
        from app.core.security import create_access_token

        # Arrange: 建立有 OAuth 的用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"

        oauth_user = User(
            email=user_email,
            name="OAuth User",
            oauth_provider="google",
            oauth_id=f"google_id_{uuid4().hex[:8]}",
            password_hash=None,
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(oauth_user)
        await db_session.commit()
        await db_session.refresh(oauth_user)

        # 建立一個 Passkey credential
        credential = Credential(
            user_id=oauth_user.id,
            credential_id=b"test_credential_id",
            public_key=b"test_public_key",
            counter=0,
            device_name="Test Device",
            transports=json.dumps(["internal"]),
            created_at=datetime.now(timezone.utc)
        )
        db_session.add(credential)
        await db_session.commit()

        access_token = create_access_token(data={"sub": str(oauth_user.id)})

        # Act: 移除 OAuth 連結
        response = await async_client.post(
            "/api/v1/auth/oauth/unlink",
            cookies={"access_token": access_token}
        )

        # Assert: 驗證回應
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    async def test_unlink_oauth_conflict_only_method(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試無法移除唯一的認證方式"""
        from app.core.security import create_access_token

        # Arrange: 建立只有 OAuth 的用戶
        user_email = f"oauth_only_user_{uuid4().hex[:8]}@example.com"

        oauth_only_user = User(
            email=user_email,
            name="OAuth Only User",
            oauth_provider="google",
            oauth_id=f"google_id_{uuid4().hex[:8]}",
            password_hash=None,  # 沒有密碼
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(oauth_only_user)
        await db_session.commit()
        await db_session.refresh(oauth_only_user)

        access_token = create_access_token(data={"sub": str(oauth_only_user.id)})

        # Act: 嘗試移除唯一的 OAuth
        response = await async_client.post(
            "/api/v1/auth/oauth/unlink",
            cookies={"access_token": access_token}
        )

        # Assert: 應該回傳 409 Conflict
        assert response.status_code == 409
        data = response.json()
        assert "無法移除唯一的認證方式" in data["detail"]

    async def test_unlink_oauth_not_found(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """測試未連結 OAuth 的用戶無法移除"""
        from app.core.security import create_access_token, get_password_hash

        # Arrange: 建立沒有 OAuth 的用戶（只有密碼）
        user_email = f"password_user_{uuid4().hex[:8]}@example.com"

        password_user = User(
            email=user_email,
            name="Password User",
            oauth_provider=None,  # 沒有 OAuth
            password_hash=get_password_hash("SecurePassword123"),
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(password_user)
        await db_session.commit()
        await db_session.refresh(password_user)

        access_token = create_access_token(data={"sub": str(password_user.id)})

        # Act: 嘗試移除不存在的 OAuth
        response = await async_client.post(
            "/api/v1/auth/oauth/unlink",
            cookies={"access_token": access_token}
        )

        # Assert: 應該回傳 404 Not Found
        assert response.status_code == 404
        data = response.json()
        assert "未連結 OAuth 帳號" in data["detail"]

    async def test_unlink_oauth_unauthorized(
        self,
        async_client: AsyncClient
    ):
        """測試未登入無法移除 OAuth"""
        # Act: 發送請求但不提供 JWT token
        response = await async_client.post(
            "/api/v1/auth/oauth/unlink"
        )

        # Assert: 應該回傳 401 Unauthorized
        assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.asyncio
class TestAuthMethodsManagementIntegration:
    """
    測試認證方式管理的整合流程

    驗證完整的用戶旅程：OAuth → 設定密碼 → 移除 OAuth
    """

    async def test_oauth_user_upgrade_to_multi_factor(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試 OAuth 用戶升級為多因素認證

        流程：
        1. OAuth 用戶登入
        2. 查詢認證方式狀態（只有 OAuth）
        3. 設定密碼（備用認證方式）
        4. 查詢認證方式狀態（OAuth + 密碼）
        5. 移除 OAuth（保留密碼）
        6. 最終狀態確認（只有密碼）
        """
        from app.core.security import create_access_token

        # Arrange: 建立 OAuth only 用戶
        user_email = f"oauth_user_{uuid4().hex[:8]}@example.com"

        oauth_user = User(
            email=user_email,
            name="OAuth Test User",
            oauth_provider="google",
            oauth_id=f"google_id_{uuid4().hex[:8]}",
            profile_picture_url="https://example.com/profile.jpg",
            password_hash=None,
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(oauth_user)
        await db_session.commit()
        await db_session.refresh(oauth_user)

        access_token = create_access_token(data={"sub": str(oauth_user.id)})

        # Step 1: 查詢認證方式狀態
        response = await async_client.get(
            "/api/v1/auth/methods",
            cookies={"access_token": access_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_oauth"] is True
        assert data["has_password"] is False
        assert data["has_passkey"] is False

        # Step 2: 設定密碼
        response = await async_client.post(
            "/api/v1/auth/set-password",
            json={"password": "SecurePassword123"},
            cookies={"access_token": access_token}
        )
        assert response.status_code == 200

        # Step 3: 確認有兩種認證方式
        response = await async_client.get(
            "/api/v1/auth/methods",
            cookies={"access_token": access_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_oauth"] is True
        assert data["has_password"] is True

        # Step 4: 移除 OAuth
        response = await async_client.post(
            "/api/v1/auth/oauth/unlink",
            cookies={"access_token": access_token}
        )
        assert response.status_code == 200

        # Step 5: 最終狀態確認
        response = await async_client.get(
            "/api/v1/auth/methods",
            cookies={"access_token": access_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["has_oauth"] is False
        assert data["has_password"] is True

    async def test_cannot_remove_last_auth_method(
        self,
        async_client: AsyncClient,
        db_session: AsyncSession
    ):
        """
        測試無法移除最後一種認證方式

        流程：
        1. OAuth only 用戶
        2. 嘗試移除 OAuth
        3. 失敗：409 Conflict
        """
        from app.core.security import create_access_token

        # Arrange: 建立 OAuth only 用戶
        user_email = f"oauth_only_user_{uuid4().hex[:8]}@example.com"

        oauth_only_user = User(
            email=user_email,
            name="OAuth Only User",
            oauth_provider="google",
            oauth_id=f"google_id_{uuid4().hex[:8]}",
            password_hash=None,
            karma_score=50,
            is_active=True,
            is_verified=True
        )
        db_session.add(oauth_only_user)
        await db_session.commit()
        await db_session.refresh(oauth_only_user)

        access_token = create_access_token(data={"sub": str(oauth_only_user.id)})

        # Act: 嘗試移除唯一的 OAuth
        response = await async_client.post(
            "/api/v1/auth/oauth/unlink",
            cookies={"access_token": access_token}
        )

        # Assert: 應該失敗
        assert response.status_code == 409
        data = response.json()
        assert "無法移除唯一的認證方式" in data["detail"]
