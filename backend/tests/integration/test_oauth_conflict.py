"""
OAuth Account Conflict Integration Tests (Task 3.3)

測試 OAuth 授權回調端點的帳號衝突處理，包含：
- 偵測 email 衝突
- 回傳 409 Conflict
- 回傳衝突資訊（existing_auth_methods, suggested_action）

需求映射：
- 需求 8.5: 相同 Email 跨認證方式整合引導（帳號衝突解決）
"""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.models.user import User
from app.models.credential import Credential
from uuid import uuid4
import secrets
from datetime import datetime


@pytest.mark.integration
class TestOAuthConflict:
    """測試 OAuth 回調端點的帳號衝突處理"""

    @pytest.fixture
    def client(self):
        """建立測試客戶端"""
        return TestClient(app)

    def test_oauth_callback_conflict_with_password_user(self, client, db_session: AsyncSession):
        """
        測試 OAuth 回調偵測密碼用戶衝突
        需求：8.5

        情境：
        1. 用戶使用 email/密碼註冊
        2. 用戶嘗試使用 Google OAuth 登入（相同 email）
        3. 系統回傳 409 Conflict 和衝突資訊

        預期：
        - HTTP 409 Conflict
        - conflict_info 包含 existing_auth_methods=["password"]
        - suggested_action="login_first"
        """
        # 步驟 1: 建立現有密碼用戶
        test_email = f"password_user_{uuid4().hex[:8]}@example.com"

        # 注意：這裡需要同步操作，因為 TestClient 使用同步
        # 使用 run_sync 在測試中執行異步代碼
        import asyncio

        async def create_password_user():
            existing_user = User(
                email=test_email,
                name="Password User",
                password_hash="$2b$12$hashed_password",
                oauth_provider=None,
                oauth_id=None
            )
            db_session.add(existing_user)
            await db_session.commit()
            return existing_user

        # 在測試中運行異步函數
        loop = asyncio.get_event_loop()
        existing_user = loop.run_until_complete(create_password_user())

        # 步驟 2: Mock Supabase OAuth 回應（相同 email）
        mock_supabase_user = Mock()
        mock_supabase_user.id = f"google_{uuid4().hex}"
        mock_supabase_user.email = test_email
        mock_supabase_user.user_metadata = {
            "full_name": "Same User via Google",
            "avatar_url": "https://google-pic.jpg"
        }
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_auth_response = Mock()
        mock_auth_response.session = Mock()
        mock_auth_response.user = mock_supabase_user

        # 步驟 3: 嘗試 OAuth 登入
        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "valid_auth_code"}
            )

            # 步驟 4: 驗證衝突回應
            assert response.status_code == 409, f"Expected 409, got {response.status_code}: {response.json()}"
            data = response.json()

            # 驗證錯誤結構
            assert "detail" in data
            detail = data["detail"]

            assert detail["error"] == "account_conflict"
            assert "email 已註冊" in detail["message"]

            # 驗證衝突資訊
            conflict_info = detail["conflict_info"]
            assert conflict_info["conflict_type"] == "existing_account"
            assert conflict_info["email"] == test_email
            assert "password" in conflict_info["existing_auth_methods"]
            assert conflict_info["suggested_action"] == "login_first"

        # 清理
        async def cleanup():
            await db_session.execute(
                User.__table__.delete().where(User.email == test_email)
            )
            await db_session.commit()

        loop.run_until_complete(cleanup())

    def test_oauth_callback_conflict_with_passkey_user(self, client, db_session: AsyncSession):
        """
        測試 OAuth 回調偵測 Passkey 用戶衝突
        需求：8.5

        情境：
        1. 用戶使用 Passkey 註冊
        2. 用戶嘗試使用 Google OAuth 登入（相同 email）
        3. 系統回傳 409 Conflict 和衝突資訊

        預期：
        - HTTP 409 Conflict
        - conflict_info 包含 existing_auth_methods=["passkey"]
        - suggested_action="login_first"
        """
        # 步驟 1: 建立現有 Passkey 用戶
        test_email = f"passkey_user_{uuid4().hex[:8]}@example.com"

        import asyncio

        async def create_passkey_user():
            existing_user = User(
                email=test_email,
                name="Passkey User",
                password_hash=None,
                oauth_provider=None,
                oauth_id=None,
                webauthn_user_handle=secrets.token_bytes(64)
            )
            db_session.add(existing_user)
            await db_session.flush()

            # 新增 Passkey credential
            credential = Credential(
                user_id=existing_user.id,
                credential_id=f"cred_{uuid4().hex}",
                public_key=secrets.token_hex(64),
                device_name="MacBook Touch ID",
                transports='["internal"]',
                counter=0,
                created_at=datetime.utcnow()
            )
            db_session.add(credential)
            await db_session.commit()
            return existing_user

        loop = asyncio.get_event_loop()
        existing_user = loop.run_until_complete(create_passkey_user())

        # 步驟 2: Mock Supabase OAuth 回應
        mock_supabase_user = Mock()
        mock_supabase_user.id = f"google_{uuid4().hex}"
        mock_supabase_user.email = test_email
        mock_supabase_user.user_metadata = {"full_name": "Same User"}
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_auth_response = Mock()
        mock_auth_response.session = Mock()
        mock_auth_response.user = mock_supabase_user

        # 步驟 3: 嘗試 OAuth 登入
        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "valid_auth_code"}
            )

            # 步驟 4: 驗證衝突回應
            assert response.status_code == 409
            data = response.json()
            conflict_info = data["detail"]["conflict_info"]

            assert conflict_info["conflict_type"] == "existing_account"
            assert "passkey" in conflict_info["existing_auth_methods"]
            assert conflict_info["suggested_action"] == "login_first"

        # 清理
        async def cleanup():
            await db_session.execute(
                Credential.__table__.delete().where(Credential.user_id == existing_user.id)
            )
            await db_session.execute(
                User.__table__.delete().where(User.email == test_email)
            )
            await db_session.commit()

        loop.run_until_complete(cleanup())

    def test_oauth_callback_conflict_with_multiple_auth_methods(
        self, client, db_session: AsyncSession
    ):
        """
        測試 OAuth 回調偵測多認證方式用戶衝突
        需求：8.5

        情境：
        1. 用戶擁有密碼 + Passkey
        2. 用戶嘗試使用 Google OAuth 登入
        3. 系統回傳 409 Conflict，衝突資訊包含兩種認證方式

        預期：
        - existing_auth_methods=["password", "passkey"]
        """
        test_email = f"multi_auth_{uuid4().hex[:8]}@example.com"

        import asyncio

        async def create_multi_auth_user():
            existing_user = User(
                email=test_email,
                name="Multi Auth User",
                password_hash="$2b$12$hashed_password",
                oauth_provider=None,
                oauth_id=None,
                webauthn_user_handle=secrets.token_bytes(64)
            )
            db_session.add(existing_user)
            await db_session.flush()

            credential = Credential(
                user_id=existing_user.id,
                credential_id=f"cred_{uuid4().hex}",
                public_key=secrets.token_hex(64),
                device_name="iPhone Face ID",
                transports='["internal"]',
                counter=0,
                created_at=datetime.utcnow()
            )
            db_session.add(credential)
            await db_session.commit()
            return existing_user

        loop = asyncio.get_event_loop()
        existing_user = loop.run_until_complete(create_multi_auth_user())

        # Mock OAuth 回應
        mock_supabase_user = Mock()
        mock_supabase_user.id = f"google_{uuid4().hex}"
        mock_supabase_user.email = test_email
        mock_supabase_user.user_metadata = {"full_name": "User"}
        mock_supabase_user.app_metadata = {"provider": "google"}

        mock_auth_response = Mock()
        mock_auth_response.session = Mock()
        mock_auth_response.user = mock_supabase_user

        with patch('app.api.oauth.get_supabase_client') as mock_get_client:
            mock_client = Mock()
            mock_client.auth.exchange_code_for_session.return_value = mock_auth_response
            mock_get_client.return_value = mock_client

            response = client.post(
                "/api/v1/auth/oauth/callback",
                json={"code": "valid_auth_code"}
            )

            # 驗證
            assert response.status_code == 409
            data = response.json()
            conflict_info = data["detail"]["conflict_info"]

            # 驗證包含兩種認證方式
            assert "password" in conflict_info["existing_auth_methods"]
            assert "passkey" in conflict_info["existing_auth_methods"]
            assert len(conflict_info["existing_auth_methods"]) == 2

        # 清理
        async def cleanup():
            await db_session.execute(
                Credential.__table__.delete().where(Credential.user_id == existing_user.id)
            )
            await db_session.execute(
                User.__table__.delete().where(User.email == test_email)
            )
            await db_session.commit()

        loop.run_until_complete(cleanup())
