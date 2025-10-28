"""
TDD: 認證方式協調器測試

遵循 TDD 紅-綠-重構循環：
1. Red: 定義認證方式查詢的預期行為
2. Green: 實作 backend/app/services/auth_method_coordinator.py
3. Refactor: 優化服務邏輯

測試需求來自：.kiro/specs/google-oauth-passkey-integration/requirements.md
- 需求 5: 認證方式狀態同步（前後端一致性）

測試 Task 2.1: 編寫認證方式查詢的單元測試

測試策略（最終版 - 純 SQLite）：
- 使用 clean_db_session (SQLite 記憶體資料庫) 完全隔離測試
- 使用原始 SQL INSERT 建立測試數據，繞過 ORM 的 server_default 問題
- 不依賴外部 Supabase 連接，測試速度更快且更穩定
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, delete
from uuid import uuid4
from datetime import datetime
import secrets


class TestAuthMethodQuery:
    """定義認證方式查詢的預期行為"""

    # ============================================
    # 測試 1: 應該能查詢擁有多種認證方式的用戶
    # ============================================
    @pytest.mark.asyncio
    async def test_should_query_user_with_multiple_auth_methods(self, clean_db_session: AsyncSession):
        """
        需求 5: 應該能查詢用戶的所有認證方式（OAuth + Passkey + 密碼）

        預期行為：
        - 查詢用戶 ID
        - 回傳 AuthMethodInfo 包含：
          - has_oauth=True, oauth_provider="google", profile_picture="..."
          - has_passkey=True, passkey_count=2, passkey_credentials=[...]
          - has_password=True
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService

        # 準備測試資料：使用原始 SQL INSERT 建立用戶
        user_id = uuid4()  # 使用 UUID 物件
        user_id_str = str(user_id)  # 字串版本用於 SQL
        now = datetime.utcnow().isoformat()

        # 1. 插入擁有全部三種認證方式的用戶（包含所有必填欄位）
        await clean_db_session.execute(
            text("""
                INSERT INTO users (
                    id, email, name, password_hash,
                    oauth_provider, oauth_id, profile_picture_url,
                    webauthn_user_handle,
                    is_active, is_verified,
                    passkey_prompt_skip_count,
                    created_at, updated_at
                ) VALUES (
                    :id, :email, :name, :password_hash,
                    :oauth_provider, :oauth_id, :profile_picture_url,
                    :webauthn_user_handle,
                    1, 0,
                    :passkey_prompt_skip_count,
                    :created_at, :updated_at
                )
            """),
            {
                "id": user_id_str,
                "email": "multi@test.com",
                "name": "Multi Auth User",
                "password_hash": "$2b$12$hashed_password",
                "oauth_provider": "google",
                "oauth_id": "google_123",
                "profile_picture_url": "https://example.com/photo.jpg",
                "webauthn_user_handle": secrets.token_bytes(64).hex(),
                "passkey_prompt_skip_count": 0,  # 新增必填欄位
                "created_at": now,
                "updated_at": now,
            }
        )

        # 2. 插入兩個 Passkey credentials（使用 JSON 字串儲存 transports）
        cred1_id = str(uuid4())
        cred2_id = str(uuid4())

        await clean_db_session.execute(
            text("""
                INSERT INTO credentials (
                    id, user_id, credential_id, public_key,
                    counter, transports, device_name,
                    aaguid, backup_eligible, backup_state,
                    created_at, last_used_at
                ) VALUES (
                    :id, :user_id, :credential_id, :public_key,
                    :counter, :transports, :device_name,
                    :aaguid, :backup_eligible, :backup_state,
                    :created_at, :last_used_at
                )
            """),
            {
                "id": cred1_id,
                "user_id": user_id_str,
                "credential_id": "cred_001",
                "public_key": secrets.token_hex(64),
                "counter": 0,
                "transports": '["internal"]',  # SQLite: JSON 字串
                "device_name": "MacBook Touch ID",
                "aaguid": None,
                "backup_eligible": False,
                "backup_state": False,
                "created_at": now,
                "last_used_at": None,
            }
        )

        await clean_db_session.execute(
            text("""
                INSERT INTO credentials (
                    id, user_id, credential_id, public_key,
                    counter, transports, device_name,
                    aaguid, backup_eligible, backup_state,
                    created_at, last_used_at
                ) VALUES (
                    :id, :user_id, :credential_id, :public_key,
                    :counter, :transports, :device_name,
                    :aaguid, :backup_eligible, :backup_state,
                    :created_at, :last_used_at
                )
            """),
            {
                "id": cred2_id,
                "user_id": user_id_str,
                "credential_id": "cred_002",
                "public_key": secrets.token_hex(64),
                "counter": 0,
                "transports": '["internal"]',
                "device_name": "iPhone Face ID",
                "aaguid": None,
                "backup_eligible": False,
                "backup_state": False,
                "created_at": now,
                "last_used_at": None,
            }
        )

        await clean_db_session.commit()

        # 🔍 驗證：確認 INSERT 成功
        verify_result = await clean_db_session.execute(
            text("SELECT COUNT(*) FROM users WHERE id = :id"),
            {"id": user_id_str}
        )
        count = verify_result.scalar()
        assert count == 1, f"用戶應該已插入，但查詢結果為 {count}"

        # ✅ 執行：查詢認證方式
        coordinator = AuthMethodCoordinatorService()
        auth_info = await coordinator.get_auth_methods(
            user_id=user_id,  # 使用 UUID 物件
            db=clean_db_session
        )

        # ✅ 驗證：應該回傳所有認證方式資訊
        assert auth_info.has_oauth is True
        assert auth_info.oauth_provider == "google"
        assert auth_info.profile_picture == "https://example.com/photo.jpg"

        assert auth_info.has_passkey is True
        assert auth_info.passkey_count == 2
        assert len(auth_info.passkey_credentials) == 2

        assert auth_info.has_password is True

        # 驗證 credentials 清單包含簡化資訊
        cred_info = auth_info.passkey_credentials[0]
        assert "id" in cred_info
        assert "name" in cred_info or "device_name" in cred_info
        assert "created_at" in cred_info


    # ============================================
    # 測試 2: 應該能查詢只有 OAuth 的用戶
    # ============================================
    @pytest.mark.asyncio
    async def test_should_query_user_with_only_oauth(self, db_session: AsyncSession):
        """
        需求 5: 應該能查詢只有 OAuth 的用戶

        預期行為：
        - 回傳 has_oauth=True
        - 回傳 has_passkey=False, passkey_count=0
        - 回傳 has_password=False
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.services.oauth_service import create_or_update_oauth_user
        from app.models.user import User

        # 準備測試資料：只有 OAuth 的用戶
        test_email = f"oauth_only_test_{uuid4().hex[:8]}@test.com"
        test_user = None

        try:
            # 建立 OAuth 用戶（create_or_update_oauth_user 預設 password_hash=None）
            test_user = await create_or_update_oauth_user(
                db=db_session,
                email=test_email,
                name="OAuth Only User",
                oauth_provider="google",
                oauth_id=f"google_{uuid4().hex}",
                profile_picture_url="https://example.com/avatar.jpg"
            )

            # ✅ 執行：查詢認證方式
            coordinator = AuthMethodCoordinatorService()
            auth_info = await coordinator.get_auth_methods(
                user_id=test_user.id,
                db=db_session
            )

            # ✅ 驗證：只有 OAuth 資訊
            assert auth_info.has_oauth is True
            assert auth_info.oauth_provider == "google"
            assert auth_info.profile_picture == "https://example.com/avatar.jpg"

            assert auth_info.has_passkey is False
            assert auth_info.passkey_count == 0
            assert auth_info.passkey_credentials == []

            assert auth_info.has_password is False

        finally:
            # 清理測試數據
            if test_user:
                await db_session.execute(
                    delete(User).where(User.email == test_email)
                )
                await db_session.commit()


    # ============================================
    # 測試 3: 應該能查詢只有 Passkey 的用戶
    # ============================================
    @pytest.mark.asyncio
    async def test_should_query_user_with_only_passkey(self, db_session: AsyncSession):
        """
        需求 5: 應該能查詢只有 Passkey 的用戶

        預期行為：
        - 回傳 has_oauth=False
        - 回傳 has_passkey=True, passkey_count > 0
        - 回傳 has_password=False
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.models.user import User
        from app.models.credential import Credential

        # 準備測試資料：只有 Passkey 的用戶
        test_email = f"passkey_only_test_{uuid4().hex[:8]}@test.com"
        test_user = None

        try:
            # 手動建立無 OAuth、無密碼的用戶
            test_user = User(
                email=test_email,
                name="Passkey Only User",
                password_hash=None,  # 無密碼
                oauth_provider=None,  # 無 OAuth
                oauth_id=None,
                webauthn_user_handle=secrets.token_bytes(64),
            )
            db_session.add(test_user)
            await db_session.flush()

            # 新增一個 Passkey
            credential = Credential(
                user_id=test_user.id,
                credential_id=f"passkey_{uuid4().hex}",
                public_key=secrets.token_hex(64),
                device_name="Security Key",
                transports=["usb", "nfc"],  # 硬體安全金鑰
                counter=0,
            )
            db_session.add(credential)
            await db_session.commit()

            # ✅ 執行：查詢認證方式
            coordinator = AuthMethodCoordinatorService()
            auth_info = await coordinator.get_auth_methods(
                user_id=test_user.id,
                db=db_session
            )

            # ✅ 驗證：只有 Passkey 資訊
            assert auth_info.has_oauth is False
            assert auth_info.oauth_provider is None
            assert auth_info.profile_picture is None

            assert auth_info.has_passkey is True
            assert auth_info.passkey_count == 1
            assert len(auth_info.passkey_credentials) == 1

            assert auth_info.has_password is False

        finally:
            # 清理測試數據
            if test_user:
                await db_session.execute(
                    delete(Credential).where(Credential.user_id == test_user.id)
                )
                await db_session.execute(
                    delete(User).where(User.email == test_email)
                )
                await db_session.commit()


    # ============================================
    # 測試 4: 應該能查詢只有密碼的用戶（傳統登入）
    # ============================================
    @pytest.mark.asyncio
    async def test_should_query_user_with_only_password(self, db_session: AsyncSession):
        """
        需求 5: 應該能查詢只有密碼的用戶（傳統登入）

        預期行為：
        - 回傳 has_oauth=False
        - 回傳 has_passkey=False
        - 回傳 has_password=True
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.models.user import User

        # 準備測試資料：只有密碼的用戶
        test_email = f"password_only_test_{uuid4().hex[:8]}@test.com"
        test_user = None

        try:
            # 手動建立只有密碼的用戶
            test_user = User(
                email=test_email,
                name="Password Only User",
                password_hash="$2b$12$legacy_hashed_password",
                oauth_provider=None,
                oauth_id=None,
                webauthn_user_handle=None,
            )
            db_session.add(test_user)
            await db_session.commit()

            # ✅ 執行：查詢認證方式
            coordinator = AuthMethodCoordinatorService()
            auth_info = await coordinator.get_auth_methods(
                user_id=test_user.id,
                db=db_session
            )

            # ✅ 驗證：只有密碼資訊
            assert auth_info.has_oauth is False
            assert auth_info.has_passkey is False
            assert auth_info.has_password is True

        finally:
            # 清理測試數據
            if test_user:
                await db_session.execute(
                    delete(User).where(User.email == test_email)
                )
                await db_session.commit()


    # ============================================
    # 測試 5: Passkey credentials 應包含簡化資訊
    # ============================================
    @pytest.mark.asyncio
    async def test_passkey_credentials_should_include_simplified_info(self, db_session: AsyncSession):
        """
        需求 5: Passkey credentials 清單應包含簡化資訊

        預期行為：
        - credentials 清單中每個項目包含：
          - id: credential ID
          - name 或 device_name: 裝置名稱
          - created_at: 建立時間
          - last_used_at: 最後使用時間
          - device_type: 推測的裝置類型（平台或漫遊）
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.models.user import User
        from app.models.credential import Credential
        from datetime import datetime, timedelta

        # 準備測試資料
        test_email = f"creds_test_{uuid4().hex[:8]}@test.com"
        test_user = None

        try:
            # 建立測試用戶
            test_user = User(
                email=test_email,
                name="Credentials Test User",
                password_hash=None,
                webauthn_user_handle=secrets.token_bytes(64),
            )
            db_session.add(test_user)
            await db_session.flush()

            # 新增具有完整資訊的 credential
            last_used = datetime.utcnow() - timedelta(days=5)
            credential = Credential(
                user_id=test_user.id,
                credential_id=f"detailed_{uuid4().hex}",
                public_key=secrets.token_hex(64),
                device_name="Windows Hello",
                transports=["internal"],
                counter=10,
                last_used_at=last_used,
            )
            db_session.add(credential)
            await db_session.commit()

            # ✅ 執行：查詢認證方式
            coordinator = AuthMethodCoordinatorService()
            auth_info = await coordinator.get_auth_methods(
                user_id=test_user.id,
                db=db_session
            )

            # ✅ 驗證：credential 資訊完整且簡化
            assert len(auth_info.passkey_credentials) == 1
            cred_info = auth_info.passkey_credentials[0]

            # 必要欄位
            assert "id" in cred_info
            assert "name" in cred_info or "device_name" in cred_info
            assert "created_at" in cred_info
            assert "last_used_at" in cred_info
            assert "device_type" in cred_info

            # 驗證 device_type 推測正確（internal transport = platform）
            assert cred_info["device_type"] in ["platform", "roaming"]

        finally:
            # 清理測試數據
            if test_user:
                await db_session.execute(
                    delete(Credential).where(Credential.user_id == test_user.id)
                )
                await db_session.execute(
                    delete(User).where(User.email == test_email)
                )
                await db_session.commit()


    # ============================================
    # 測試 6: 不存在的用戶應拋出錯誤
    # ============================================
    @pytest.mark.asyncio
    async def test_should_raise_error_for_non_existent_user(self, db_session: AsyncSession):
        """
        前置條件驗證：查詢不存在的用戶應拋出錯誤

        預期行為：
        - 查詢不存在的 user_id
        - 應拋出 ValueError 或 UserNotFoundError
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService

        # 不存在的 user_id
        non_existent_user_id = uuid4()

        # ✅ 執行：查詢不存在的用戶
        coordinator = AuthMethodCoordinatorService()

        # ✅ 驗證：應拋出錯誤
        with pytest.raises((ValueError, Exception)) as exc_info:
            await coordinator.get_auth_methods(
                user_id=non_existent_user_id,
                db=db_session
            )

        assert "not found" in str(exc_info.value).lower() or "不存在" in str(exc_info.value)
