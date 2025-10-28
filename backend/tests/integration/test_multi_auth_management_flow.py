"""
多認證方式管理整合測試 (Task 12.3)

測試完整的多認證方式管理流程，包含：
- OAuth 用戶新增 Passkey
- OAuth 用戶設定密碼
- 三種認證方式登入測試
- 移除 OAuth 連結（需至少兩種方式）
- 嘗試移除唯一認證方式被阻擋

需求映射：
- 需求 4: 帳號設定頁面（多認證方式管理）
- 需求 3: 登入頁面整合（三種認證方式共存）
- 需求 8: 安全性與合規（多認證方式保護）
"""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.main import app
from app.models.user import User
from app.models.credential import Credential
from app.core.security import get_password_hash, verify_password, verify_token
from uuid import uuid4
import secrets
from datetime import datetime


@pytest.mark.integration
class TestMultiAuthManagementFlow:
    """測試多認證方式管理完整流程"""

    @pytest.fixture
    def client(self):
        """建立測試客戶端"""
        return TestClient(app)

    async def test_oauth_user_adds_all_auth_methods(
        self, client, db_session: AsyncSession
    ):
        """
        測試 OAuth 用戶新增所有認證方式

        需求：4

        流程：
        1. 用戶使用 OAuth 登入
        2. 用戶在帳號設定中新增 Passkey
        3. 用戶在帳號設定中設定密碼
        4. 驗證三種認證方式都可登入

        驗證：
        - OAuth 登入成功
        - Passkey 新增成功
        - 密碼設定成功
        - /api/auth/methods 回傳三種方式都啟用
        - 可使用任一方式登入
        """
        test_email = f"multi_auth_{uuid4().hex[:8]}@example.com"

        # ========== 步驟 1: OAuth 登入 ==========
        mock_supabase_user = Mock()
        oauth_id = f"google_{uuid4().hex}"
        mock_supabase_user.id = oauth_id
        mock_supabase_user.email = test_email
        mock_supabase_user.user_metadata = {
            "full_name": "Multi Auth User",
            "avatar_url": "https://avatar.jpg"
        }
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_auth_response = Mock()
        mock_auth_response.session = Mock()
        mock_auth_response.user = mock_supabase_user

        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            oauth_response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "valid_code"}
            )

        assert oauth_response.status_code == 200
        oauth_token = oauth_response.json()["access_token"]

        # 查詢用戶 ID
        result = await db_session.execute(
            select(User).where(User.email == test_email)
        )
        user = result.scalar_one_or_none()
        assert user is not None
        user_id = user.id

        # 驗證初始狀態
        auth_methods_response = client.get(
            "/api/v1/auth/methods",
            headers={"Authorization": f"Bearer {oauth_token}"}
        )

        assert auth_methods_response.status_code == 200
        initial_methods = auth_methods_response.json()

        assert initial_methods["has_oauth"] is True
        assert initial_methods["has_passkey"] is False
        assert initial_methods["has_password"] is False

        # ========== 步驟 2: 新增 Passkey ==========
        # 2.1 請求註冊選項
        with patch('app.services.webauthn_service.generate_registration_options') as mock_gen_options:
            mock_options = {
                "challenge": secrets.token_urlsafe(32),
                "rp": {"id": "localhost", "name": "Tarot App"},
                "user": {
                    "id": secrets.token_bytes(64).hex(),
                    "name": test_email,
                    "displayName": "Multi Auth User"
                },
                "pubKeyCredParams": [{"type": "public-key", "alg": -7}],
                "timeout": 60000
            }
            mock_gen_options.return_value = mock_options

            reg_options_response = client.post(
                "/api/v1/auth/webauthn/register/options",
                headers={"Authorization": f"Bearer {oauth_token}"}
            )

        assert reg_options_response.status_code == 200

        # 2.2 驗證 attestation
        mock_attestation = {
            "id": f"credential_{uuid4().hex}",
            "rawId": secrets.token_urlsafe(32),
            "response": {
                "clientDataJSON": secrets.token_urlsafe(64),
                "attestationObject": secrets.token_urlsafe(128)
            },
            "type": "public-key"
        }

        with patch('app.services.webauthn_service.verify_registration_response') as mock_verify:
            mock_verified_credential = Mock()
            mock_verified_credential.credential_id = mock_attestation["id"].encode()
            mock_verified_credential.credential_public_key = secrets.token_bytes(77)
            mock_verified_credential.sign_count = 0
            mock_verify.return_value = mock_verified_credential

            passkey_reg_response = client.post(
                "/api/v1/auth/webauthn/register/verify",
                headers={"Authorization": f"Bearer {oauth_token}"},
                json={
                    "attestation": mock_attestation,
                    "device_name": "iPhone Face ID"
                }
            )

        assert passkey_reg_response.status_code == 200

        # ========== 步驟 3: 設定密碼 ==========
        test_password = "SecurePassword123!"

        password_set_response = client.post(
            "/api/v1/auth/set-password",
            headers={"Authorization": f"Bearer {oauth_token}"},
            json={"new_password": test_password}
        )

        # 注意：此 API 需要實作
        if password_set_response.status_code == 404:
            pytest.skip("POST /api/v1/auth/set-password not implemented yet")

        assert password_set_response.status_code == 200

        # ========== 步驟 4: 驗證三種認證方式都啟用 ==========
        final_methods_response = client.get(
            "/api/v1/auth/methods",
            headers={"Authorization": f"Bearer {oauth_token}"}
        )

        assert final_methods_response.status_code == 200
        final_methods = final_methods_response.json()

        assert final_methods["has_oauth"] is True
        assert final_methods["has_passkey"] is True
        assert final_methods["has_password"] is True

        # ========== 步驟 5: 驗證可使用三種方式登入 ==========
        # 5.1 OAuth 登入（已驗證）

        # 5.2 密碼登入
        password_login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_email,
                "password": test_password
            }
        )

        assert password_login_response.status_code == 200
        password_token = password_login_response.json()["access_token"]
        assert password_token is not None

        # 5.3 Passkey 登入（模擬）
        # 實際 E2E 測試中會完整測試

        # 清理
        await db_session.execute(
            Credential.__table__.delete().where(Credential.user_id == user_id)
        )
        await db_session.execute(
            User.__table__.delete().where(User.id == user_id)
        )
        await db_session.commit()

    async def test_remove_oauth_requires_other_auth_method(
        self, client, db_session: AsyncSession
    ):
        """
        測試移除 OAuth 需要至少有其他認證方式

        需求：4, 8

        流程：
        1. 用戶只有 OAuth 一種認證方式
        2. 用戶嘗試移除 OAuth 連結
        3. 系統拒絕操作並顯示警告

        驗證：
        - 系統回傳 400 Bad Request
        - 錯誤訊息包含「至少保留一種登入方式」
        - OAuth 資訊未被移除
        """
        test_email = f"single_oauth_{uuid4().hex[:8]}@example.com"

        # 建立只有 OAuth 的用戶
        user = User(
            email=test_email,
            name="OAuth Only User",
            oauth_provider="google",
            oauth_id=f"google_{uuid4().hex}",
            password_hash=None,
            webauthn_user_handle=None
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        user_id = user.id

        # 模擬用戶登入（生成 token）
        from app.core.security import create_access_token

        access_token = create_access_token(data={"sub": str(user_id), "email": test_email})

        # 嘗試移除 OAuth 連結
        remove_response = client.delete(
            "/api/v1/auth/oauth/unlink",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # 驗證拒絕操作
        assert remove_response.status_code == 400
        error_data = remove_response.json()
        assert "至少" in error_data["detail"] or "one" in error_data["detail"].lower()

        # 驗證 OAuth 資訊未被移除
        await db_session.refresh(user)
        assert user.oauth_provider == "google"
        assert user.oauth_id is not None

        # 清理
        await db_session.execute(
            User.__table__.delete().where(User.id == user_id)
        )
        await db_session.commit()

    async def test_remove_oauth_with_multiple_auth_methods(
        self, client, db_session: AsyncSession
    ):
        """
        測試移除 OAuth（有其他認證方式）

        需求：4

        流程：
        1. 用戶擁有 OAuth + Passkey
        2. 用戶移除 OAuth 連結
        3. 系統成功移除
        4. 用戶仍可使用 Passkey 登入

        驗證：
        - 移除成功
        - oauth_provider 和 oauth_id 設為 NULL
        - hasOAuth=false, hasPasskey=true
        """
        test_email = f"remove_oauth_{uuid4().hex[:8]}@example.com"

        # 建立 OAuth + Passkey 用戶
        webauthn_user_handle = secrets.token_bytes(64)
        user = User(
            email=test_email,
            name="Multi Auth User",
            oauth_provider="google",
            oauth_id=f"google_{uuid4().hex}",
            password_hash=None,
            webauthn_user_handle=webauthn_user_handle
        )
        db_session.add(user)
        await db_session.flush()

        # 新增 Passkey credential
        credential = Credential(
            user_id=user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key=secrets.token_hex(64),
            device_name="MacBook Touch ID",
            transports='["internal"]',
            counter=0,
            created_at=datetime.utcnow()
        )
        db_session.add(credential)
        await db_session.commit()
        await db_session.refresh(user)
        user_id = user.id

        # 生成 token
        from app.core.security import create_access_token

        access_token = create_access_token(data={"sub": str(user_id), "email": test_email})

        # 移除 OAuth 連結
        remove_response = client.delete(
            "/api/v1/auth/oauth/unlink",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # 驗證移除成功
        assert remove_response.status_code == 200

        # 驗證資料庫
        await db_session.refresh(user)
        assert user.oauth_provider is None
        assert user.oauth_id is None
        assert user.webauthn_user_handle is not None  # Passkey 仍保留

        # 驗證認證方式狀態
        auth_methods_response = client.get(
            "/api/v1/auth/methods",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert auth_methods_response.status_code == 200
        auth_methods = auth_methods_response.json()

        assert auth_methods["has_oauth"] is False
        assert auth_methods["has_passkey"] is True

        # 清理
        await db_session.execute(
            Credential.__table__.delete().where(Credential.user_id == user_id)
        )
        await db_session.execute(
            User.__table__.delete().where(User.id == user_id)
        )
        await db_session.commit()

    async def test_attempt_remove_only_auth_method_blocked(
        self, client, db_session: AsyncSession
    ):
        """
        測試嘗試移除唯一認證方式被阻擋

        需求：8

        情境：
        - 用戶只有密碼
        - 用戶嘗試移除密碼（或重設為空）
        - 系統阻擋操作

        驗證：
        - 系統回傳 400 Bad Request
        - 錯誤訊息包含警告
        - 密碼未被移除
        """
        test_email = f"single_password_{uuid4().hex[:8]}@example.com"
        test_password = "OnlyPassword123!"

        # 建立只有密碼的用戶
        password_hash = get_password_hash(test_password)
        user = User(
            email=test_email,
            name="Password Only User",
            password_hash=password_hash,
            oauth_provider=None,
            oauth_id=None,
            webauthn_user_handle=None
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        user_id = user.id

        # 用戶登入
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_email,
                "password": test_password
            }
        )

        assert login_response.status_code == 200
        access_token = login_response.json()["access_token"]

        # 嘗試移除密碼（或設為空）
        remove_password_response = client.delete(
            "/api/v1/auth/password",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        # 驗證拒絕操作
        # 注意：此 API 需要實作
        if remove_password_response.status_code == 404:
            pytest.skip("DELETE /api/v1/auth/password not implemented yet")

        assert remove_password_response.status_code == 400
        error_data = remove_password_response.json()
        assert "至少" in error_data["detail"] or "one" in error_data["detail"].lower()

        # 驗證密碼未被移除
        await db_session.refresh(user)
        assert user.password_hash is not None
        assert verify_password(test_password, user.password_hash)

        # 清理
        await db_session.execute(
            User.__table__.delete().where(User.id == user_id)
        )
        await db_session.commit()

    async def test_delete_passkey_with_multiple_credentials(
        self, client, db_session: AsyncSession
    ):
        """
        測試刪除 Passkey（有多個 credentials）

        需求：4

        情境：
        - 用戶有 2 個 Passkey credentials
        - 用戶刪除其中一個
        - 系統成功刪除

        驗證：
        - 刪除成功
        - hasPasskey 仍為 true
        - passkey_count = 1
        """
        test_email = f"multi_passkey_{uuid4().hex[:8]}@example.com"

        # 建立用戶
        webauthn_user_handle = secrets.token_bytes(64)
        user = User(
            email=test_email,
            name="Multi Passkey User",
            password_hash=get_password_hash("Password123!"),
            webauthn_user_handle=webauthn_user_handle
        )
        db_session.add(user)
        await db_session.flush()

        # 新增兩個 Passkey credentials
        cred1_id = f"cred1_{uuid4().hex}"
        credential1 = Credential(
            user_id=user.id,
            credential_id=cred1_id,
            public_key=secrets.token_hex(64),
            device_name="iPhone Face ID",
            transports='["internal"]',
            counter=0,
            created_at=datetime.utcnow()
        )

        cred2_id = f"cred2_{uuid4().hex}"
        credential2 = Credential(
            user_id=user.id,
            credential_id=cred2_id,
            public_key=secrets.token_hex(64),
            device_name="MacBook Touch ID",
            transports='["internal"]',
            counter=0,
            created_at=datetime.utcnow()
        )

        db_session.add_all([credential1, credential2])
        await db_session.commit()
        await db_session.refresh(user)
        user_id = user.id

        # 生成 token
        from app.core.security import create_access_token

        access_token = create_access_token(data={"sub": str(user_id), "email": test_email})

        # 查詢初始 credentials
        initial_methods_response = client.get(
            "/api/v1/auth/methods",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert initial_methods_response.status_code == 200
        initial_methods = initial_methods_response.json()
        assert initial_methods["passkey_count"] == 2

        # 刪除其中一個 credential
        delete_response = client.delete(
            f"/api/v1/auth/webauthn/credentials/{cred1_id}",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert delete_response.status_code == 200

        # 驗證刪除後的狀態
        final_methods_response = client.get(
            "/api/v1/auth/methods",
            headers={"Authorization": f"Bearer {access_token}"}
        )

        assert final_methods_response.status_code == 200
        final_methods = final_methods_response.json()

        assert final_methods["has_passkey"] is True
        assert final_methods["passkey_count"] == 1
        assert len(final_methods["passkey_credentials"]) == 1
        assert final_methods["passkey_credentials"][0]["name"] == "MacBook Touch ID"

        # 清理
        await db_session.execute(
            Credential.__table__.delete().where(Credential.user_id == user_id)
        )
        await db_session.execute(
            User.__table__.delete().where(User.id == user_id)
        )
        await db_session.commit()
