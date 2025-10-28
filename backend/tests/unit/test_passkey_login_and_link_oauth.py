"""
Task 4.3: Passkey 登入並連結 OAuth 的單元測試（RED 階段）

需求來源：
- 需求 8.5: 相同 Email 跨認證方式整合引導（帳號衝突解決）
- 設計文件: .kiro/specs/google-oauth-passkey-integration/design.md
  - Section: AccountConflictResolver（前後端整合）

測試目標：
建立 Passkey 登入並連結 OAuth 的完整測試覆蓋，確保：
1. Passkey 驗證成功後可連結 OAuth
2. OAuth 資訊正確寫入資料庫
3. JWT tokens 包含正確的認證方式標記
4. Email 不一致時拒絕連結
5. Passkey 驗證失敗時不連結 OAuth

TDD 流程：
- RED 階段：編寫測試，預期失敗（方法尚未實作）
- GREEN 階段：實作最小程式碼使測試通過（Task 4.4）
- REFACTOR 階段：優化程式碼（如需要）
"""

import pytest
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone
import json


class TestPasskeyLoginAndLinkOAuth:
    """測試 Passkey 登入並連結 OAuth 的功能"""

    @pytest.mark.asyncio
    async def test_should_login_with_passkey_and_link_oauth_success(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: 使用 Passkey 登入並成功連結 OAuth

        預期行為：
        - 使用 Passkey 驗證成功
        - OAuth 資訊（oauth_provider, oauth_id, profile_picture_url）寫入資料庫
        - JWT tokens 包含 has_oauth=true 和 has_passkey=true 標記
        - 回傳完整的使用者資訊
        """
        from app.models.user import User
        from app.models.credential import Credential
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        import base64

        # 建立現有 Passkey 用戶
        existing_email = f"passkey_user_{uuid4().hex[:8]}@example.com"
        webauthn_user_handle = base64.b64encode(existing_email.encode()).decode()

        existing_user = User(
            email=existing_email,
            name="Existing Passkey User",
            password_hash=None,  # Passkey 用戶無密碼
            oauth_provider=None,
            oauth_id=None,
            webauthn_user_handle=webauthn_user_handle.encode()
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()
        await clean_db_session.refresh(existing_user)

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
        clean_db_session.add(credential)
        await clean_db_session.commit()

        # 準備 OAuth 資料
        oauth_data = {
            "email": existing_email,  # 相同 email
            "name": "Same User via OAuth",
            "oauth_provider": "google",
            "oauth_id": f"google_{uuid4().hex}",
            "profile_picture_url": "https://lh3.googleusercontent.com/test.jpg"
        }

        # Mock WebAuthn 驗證（假設驗證成功）
        mock_assertion_response = {
            "id": credential.credential_id,
            "rawId": credential.credential_id,
            "response": {
                "authenticatorData": "mock_auth_data",
                "clientDataJSON": "mock_client_data",
                "signature": "mock_signature"
            },
            "type": "public-key"
        }

        # 執行 Passkey 登入並連結 OAuth
        coordinator = AuthMethodCoordinatorService()

        # 使用 patch 模擬 WebAuthn 驗證成功
        with patch('app.services.webauthn_service.WebAuthnService') as MockWebAuthnService:
            mock_webauthn_instance = MockWebAuthnService.return_value
            mock_webauthn_instance.verify_authentication_assertion = AsyncMock(return_value={
                "success": True,
                "credential": credential,
                "user": existing_user
            })

            result = await coordinator.login_with_passkey_and_link_oauth(
                assertion_response=mock_assertion_response,
                oauth_data=oauth_data,
                db=clean_db_session
            )

        # 驗證登入成功
        assert result["success"] is True, "登入應該成功"
        assert "user" in result, "應該包含使用者資訊"
        assert "tokens" in result, "應該包含 JWT tokens"

        # 驗證使用者資訊
        user = result["user"]
        assert user.oauth_provider == "google", "OAuth provider 應該更新"
        assert user.oauth_id == oauth_data["oauth_id"], "OAuth ID 應該更新"
        assert user.profile_picture_url == oauth_data["profile_picture_url"], "頭像 URL 應該更新"
        assert user.webauthn_user_handle is not None, "WebAuthn user handle 應該保留"

        # 驗證 JWT tokens 包含 has_oauth=true 和 has_passkey=true 標記
        from app.core.security import verify_token
        tokens = result["tokens"]
        access_token_payload = verify_token(tokens["access_token"])
        assert access_token_payload is not None, "Access token 應該有效"
        assert access_token_payload.get("has_oauth") is True, "JWT payload 應該包含 has_oauth=true"
        assert access_token_payload.get("has_passkey") is True, "JWT payload 應該包含 has_passkey=true"
        assert access_token_payload.get("auth_method") == "passkey", "登入方式應該是 passkey"

    @pytest.mark.asyncio
    async def test_should_write_oauth_info_to_database_after_passkey_login(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: 驗證 OAuth 資訊確實寫入資料庫

        預期行為：
        - 使用 Passkey 登入成功後
        - 資料庫中的 oauth_provider, oauth_id, profile_picture_url 欄位已更新
        """
        from app.models.user import User
        from app.models.credential import Credential
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        import base64

        # 建立用戶
        user_email = f"passkey_{uuid4().hex[:8]}@example.com"
        webauthn_user_handle = base64.b64encode(user_email.encode()).decode()

        user = User(
            email=user_email,
            name="DB Test User",
            webauthn_user_handle=webauthn_user_handle.encode()
        )
        clean_db_session.add(user)
        await clean_db_session.commit()
        await clean_db_session.refresh(user)

        # 建立 credential
        credential = Credential(
            user_id=user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key="mock_key",
            counter=0,
            transports=json.dumps(["internal"]),
            device_name="DB Test Device",
            created_at=datetime.now(timezone.utc)
        )
        clean_db_session.add(credential)
        await clean_db_session.commit()

        # OAuth 資料
        oauth_data = {
            "email": user_email,
            "oauth_provider": "google",
            "oauth_id": "google_db_test",
            "profile_picture_url": "https://example.com/pic.jpg"
        }

        mock_assertion = {
            "id": credential.credential_id,
            "response": {}
        }

        # 執行
        coordinator = AuthMethodCoordinatorService()
        with patch('app.services.webauthn_service.WebAuthnService') as MockWebAuthn:
            mock_webauthn = MockWebAuthn.return_value
            mock_webauthn.verify_authentication_assertion = AsyncMock(return_value={
                "success": True,
                "credential": credential,
                "user": user
            })

            await coordinator.login_with_passkey_and_link_oauth(
                assertion_response=mock_assertion,
                oauth_data=oauth_data,
                db=clean_db_session
            )

        # 重新從資料庫讀取驗證
        await clean_db_session.refresh(user)
        assert user.oauth_provider == "google", "OAuth provider 應該在資料庫中更新"
        assert user.oauth_id == "google_db_test", "OAuth ID 應該在資料庫中更新"
        assert user.profile_picture_url == "https://example.com/pic.jpg", "頭像 URL 應該在資料庫中更新"

    @pytest.mark.asyncio
    async def test_should_reject_email_mismatch_for_passkey_login(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8: Email 與當前 OAuth email 不一致時應該拒絕連結

        預期行為：
        - 偵測到 email 不一致
        - 回傳錯誤訊息
        - 不更新 OAuth 資訊
        """
        from app.models.user import User
        from app.models.credential import Credential
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.core.exceptions import EmailMismatchError
        import base64

        # 建立用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"
        oauth_email = f"different_{uuid4().hex[:8]}@example.com"  # 不同 email
        webauthn_user_handle = base64.b64encode(user_email.encode()).decode()

        user = User(
            email=user_email,
            name="Email Mismatch Test",
            webauthn_user_handle=webauthn_user_handle.encode()
        )
        clean_db_session.add(user)
        await clean_db_session.commit()
        await clean_db_session.refresh(user)

        credential = Credential(
            user_id=user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key="mock_key",
            counter=0,
            transports=json.dumps(["internal"]),
            device_name="Mismatch Test",
            created_at=datetime.now(timezone.utc)
        )
        clean_db_session.add(credential)
        await clean_db_session.commit()

        # OAuth 資料使用不同 email
        oauth_data = {
            "email": oauth_email,  # 不同 email
            "oauth_provider": "google",
            "oauth_id": "google_mismatch",
            "profile_picture_url": None
        }

        mock_assertion = {
            "id": credential.credential_id,
            "response": {}
        }

        # 嘗試連結（應該失敗）
        coordinator = AuthMethodCoordinatorService()

        with patch('app.services.webauthn_service.WebAuthnService') as MockWebAuthn:
            mock_webauthn = MockWebAuthn.return_value
            mock_webauthn.verify_authentication_assertion = AsyncMock(return_value={
                "success": True,
                "credential": credential,
                "user": user
            })

            with pytest.raises(EmailMismatchError) as exc_info:
                await coordinator.login_with_passkey_and_link_oauth(
                    assertion_response=mock_assertion,
                    oauth_data=oauth_data,
                    db=clean_db_session
                )

        # 驗證錯誤訊息
        error_message = str(exc_info.value)
        assert "不符" in error_message or "mismatch" in error_message.lower(), "應該指出不一致"
        assert oauth_email in error_message, "錯誤訊息應該包含 OAuth email"
        assert user_email in error_message, "錯誤訊息應該包含用戶 email"

        # 驗證 OAuth 資訊未更新
        await clean_db_session.refresh(user)
        assert user.oauth_provider is None, "OAuth provider 不應該更新"

    @pytest.mark.asyncio
    async def test_should_fail_when_passkey_verification_fails(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8: Passkey 驗證失敗時應該拒絕連結 OAuth

        預期行為：
        - Passkey 驗證失敗
        - 回傳錯誤
        - 不更新 OAuth 資訊
        """
        from app.models.user import User
        from app.models.credential import Credential
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.core.exceptions import InvalidCredentialsError
        import base64

        # 建立用戶
        user_email = f"fail_{uuid4().hex[:8]}@example.com"
        webauthn_user_handle = base64.b64encode(user_email.encode()).decode()

        user = User(
            email=user_email,
            name="Fail Test User",
            webauthn_user_handle=webauthn_user_handle.encode()
        )
        clean_db_session.add(user)
        await clean_db_session.commit()
        await clean_db_session.refresh(user)

        credential = Credential(
            user_id=user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key="mock_key",
            counter=0,
            transports=json.dumps(["internal"]),
            device_name="Fail Test",
            created_at=datetime.now(timezone.utc)
        )
        clean_db_session.add(credential)
        await clean_db_session.commit()

        oauth_data = {
            "email": user_email,
            "oauth_provider": "google",
            "oauth_id": "google_fail",
            "profile_picture_url": None
        }

        mock_assertion = {
            "id": credential.credential_id,
            "response": {}
        }

        coordinator = AuthMethodCoordinatorService()

        # Mock WebAuthn 驗證失敗
        with patch('app.services.webauthn_service.WebAuthnService') as MockWebAuthn:
            mock_webauthn = MockWebAuthn.return_value
            mock_webauthn.verify_authentication_assertion = AsyncMock(return_value={
                "success": False,
                "error": "驗證失敗"
            })

            with pytest.raises(InvalidCredentialsError):
                await coordinator.login_with_passkey_and_link_oauth(
                    assertion_response=mock_assertion,
                    oauth_data=oauth_data,
                    db=clean_db_session
                )

        # 驗證 OAuth 資訊未更新
        await clean_db_session.refresh(user)
        assert user.oauth_provider is None, "OAuth provider 不應該更新"

    @pytest.mark.asyncio
    async def test_should_include_auth_method_flags_in_jwt(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 5: JWT token payload 應包含完整的認證方式標記

        預期行為：
        - JWT token 包含 auth_method="passkey"
        - JWT token 包含 has_passkey=true
        - JWT token 包含 has_oauth=true（連結後）
        """
        from app.models.user import User
        from app.models.credential import Credential
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.core.security import verify_token
        import base64

        # 建立用戶
        user_email = f"jwt_{uuid4().hex[:8]}@example.com"
        webauthn_user_handle = base64.b64encode(user_email.encode()).decode()

        user = User(
            email=user_email,
            name="JWT Test User",
            webauthn_user_handle=webauthn_user_handle.encode()
        )
        clean_db_session.add(user)
        await clean_db_session.commit()
        await clean_db_session.refresh(user)

        credential = Credential(
            user_id=user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key="mock_key",
            counter=0,
            transports=json.dumps(["internal"]),
            device_name="JWT Test",
            created_at=datetime.now(timezone.utc)
        )
        clean_db_session.add(credential)
        await clean_db_session.commit()

        oauth_data = {
            "email": user_email,
            "oauth_provider": "google",
            "oauth_id": "google_jwt_test",
            "profile_picture_url": None
        }

        mock_assertion = {
            "id": credential.credential_id,
            "response": {}
        }

        coordinator = AuthMethodCoordinatorService()

        with patch('app.services.webauthn_service.WebAuthnService') as MockWebAuthn:
            mock_webauthn = MockWebAuthn.return_value
            mock_webauthn.verify_authentication_assertion = AsyncMock(return_value={
                "success": True,
                "credential": credential,
                "user": user
            })

            result = await coordinator.login_with_passkey_and_link_oauth(
                assertion_response=mock_assertion,
                oauth_data=oauth_data,
                db=clean_db_session
            )

        # 驗證 JWT payload
        tokens = result["tokens"]
        access_payload = verify_token(tokens["access_token"])

        assert access_payload["auth_method"] == "passkey", "認證方式應該是 passkey"
        assert access_payload["has_passkey"] is True, "應該標記有 Passkey"
        assert access_payload["has_oauth"] is True, "應該標記有 OAuth"
        assert access_payload["sub"] == str(user.id), "sub 應該是用戶 ID"
        assert access_payload["email"] == user_email, "email 應該正確"
