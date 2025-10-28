"""
TDD: OAuth 回調協調器服務測試（Task 3.1）

測試需求來自：.kiro/specs/google-oauth-passkey-integration/requirements.md
- 需求 1: Google OAuth 快速註冊（新用戶入口）
- 需求 8.5: 相同 Email 跨認證方式整合引導（帳號衝突解決）

測試策略：
- 測試新用戶 OAuth 註冊成功建立用戶
- 測試新用戶自動初始化 Karma 系統（+50）
- 測試 email 衝突時回傳衝突資訊（不自動合併）
- 測試衝突資訊包含現有認證方式清單
- 測試衝突資訊包含建議操作（login_first）
- 測試 OAuth 授權碼交換失敗的重試機制
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4
import json
from datetime import datetime
import secrets


class TestOAuthCallbackCoordinator:
    """測試 OAuth 回調協調器服務（整合層）"""

    # ============================================
    # 測試 1: 新用戶 OAuth 註冊成功
    # ============================================
    @pytest.mark.asyncio
    async def test_should_create_new_user_with_oauth_registration(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 1: 新用戶使用 Google OAuth 註冊應該成功建立帳號

        前置條件：
        - email 不存在於系統中
        - 提供完整的 OAuth 使用者資料

        預期行為：
        - 建立新用戶記錄
        - 設定 oauth_provider='google', oauth_id, profile_picture_url
        - 設定 password_hash=NULL
        - 初始化 karma_score=50
        - 回傳成功結果（不是衝突）
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService

        # 準備測試資料
        email = f"newuser_{uuid4().hex[:8]}@gmail.com"
        oauth_data = {
            "email": email,
            "name": "New Test User",
            "oauth_provider": "google",
            "oauth_id": f"google_{uuid4().hex}",
            "profile_picture_url": "https://lh3.googleusercontent.com/test.jpg"
        }

        # 執行：處理 OAuth 註冊
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.handle_oauth_registration(
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 驗證：成功建立用戶
        assert result["success"] is True, "應該成功註冊"
        assert "user" in result, "應該包含用戶資訊"
        assert result["conflict"] is None, "不應該有衝突"

        user = result["user"]
        assert user.email == email
        assert user.oauth_provider == "google"
        assert user.oauth_id == oauth_data["oauth_id"]
        assert user.profile_picture_url == oauth_data["profile_picture_url"]
        assert user.password_hash is None, "OAuth 用戶不應該有密碼"

        # 驗證：Karma 已初始化
        assert user.karma_score == 50, "新 OAuth 用戶應該獲得 50 Karma"

    # ============================================
    # 測試 2: Email 衝突偵測（現有密碼用戶）
    # ============================================
    @pytest.mark.asyncio
    async def test_should_detect_conflict_when_email_exists_with_password(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: Email 已存在且有密碼，應回傳衝突資訊

        前置條件：
        - email 已存在
        - 現有用戶有 password_hash（傳統註冊）
        - oauth_provider 為 NULL

        預期行為：
        - 不自動合併帳號
        - 回傳 success=False, conflict 資訊
        - 衝突資訊包含：existing_auth_methods=["password"]
        - 建議操作：suggested_action="login_first"
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.models.user import User

        # 準備：建立現有密碼用戶
        existing_email = f"password_user_{uuid4().hex[:8]}@example.com"
        existing_user = User(
            email=existing_email,
            name="Existing Password User",
            password_hash="$2b$12$hashed_password",
            oauth_provider=None,
            oauth_id=None
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()

        # 準備：OAuth 資料（相同 email）
        oauth_data = {
            "email": existing_email,
            "name": "Same User via OAuth",
            "oauth_provider": "google",
            "oauth_id": f"google_{uuid4().hex}",
            "profile_picture_url": "https://lh3.googleusercontent.com/test.jpg"
        }

        # 執行：處理 OAuth 註冊
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.handle_oauth_registration(
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 驗證：偵測到衝突
        assert result["success"] is False, "應該回傳失敗（衝突）"
        assert result["user"] is None, "不應該建立或更新用戶"
        assert result["conflict"] is not None, "應該包含衝突資訊"

        # 驗證：衝突資訊格式正確
        conflict = result["conflict"]
        assert conflict["conflict_type"] == "existing_account"
        assert conflict["email"] == existing_email
        assert "password" in conflict["existing_auth_methods"]
        assert conflict["suggested_action"] == "login_first"

    # ============================================
    # 測試 3: Email 衝突偵測（現有 Passkey 用戶）
    # ============================================
    @pytest.mark.asyncio
    async def test_should_detect_conflict_when_email_exists_with_passkey(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: Email 已存在且有 Passkey，應回傳衝突資訊

        前置條件：
        - email 已存在
        - 現有用戶有 webauthn_user_handle（已註冊 Passkey）
        - 現有用戶有 credentials 記錄
        - oauth_provider 為 NULL

        預期行為：
        - 不自動合併帳號
        - 衝突資訊包含：existing_auth_methods=["passkey"]
        - 建議操作：suggested_action="login_first"
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.models.user import User
        from app.models.credential import Credential

        # 準備：建立現有 Passkey 用戶
        existing_email = f"passkey_user_{uuid4().hex[:8]}@example.com"
        existing_user = User(
            email=existing_email,
            name="Existing Passkey User",
            password_hash=None,
            oauth_provider=None,
            oauth_id=None,
            webauthn_user_handle=secrets.token_bytes(64)
        )
        clean_db_session.add(existing_user)
        await clean_db_session.flush()

        # 新增一個 Passkey credential
        credential = Credential(
            user_id=existing_user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key=secrets.token_hex(64),
            device_name="MacBook Touch ID",
            transports='["internal"]',
            counter=0,
            created_at=datetime.utcnow()
        )
        clean_db_session.add(credential)
        await clean_db_session.commit()

        # 準備：OAuth 資料（相同 email）
        oauth_data = {
            "email": existing_email,
            "name": "Same User via OAuth",
            "oauth_provider": "google",
            "oauth_id": f"google_{uuid4().hex}",
            "profile_picture_url": "https://lh3.googleusercontent.com/test.jpg"
        }

        # 執行：處理 OAuth 註冊
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.handle_oauth_registration(
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 驗證：偵測到衝突
        assert result["success"] is False
        assert result["conflict"] is not None

        conflict = result["conflict"]
        assert "passkey" in conflict["existing_auth_methods"]
        assert conflict["suggested_action"] == "login_first"

    # ============================================
    # 測試 4: Email 衝突偵測（多種認證方式）
    # ============================================
    @pytest.mark.asyncio
    async def test_should_detect_conflict_with_multiple_auth_methods(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: Email 已存在且有多種認證方式

        前置條件：
        - email 已存在
        - 現有用戶有 password_hash 和 Passkey
        - oauth_provider 為 NULL

        預期行為：
        - 衝突資訊包含：existing_auth_methods=["password", "passkey"]
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.models.user import User
        from app.models.credential import Credential

        # 準備：建立現有多認證方式用戶
        existing_email = f"multi_auth_user_{uuid4().hex[:8]}@example.com"
        existing_user = User(
            email=existing_email,
            name="Multi Auth User",
            password_hash="$2b$12$hashed_password",
            oauth_provider=None,
            oauth_id=None,
            webauthn_user_handle=secrets.token_bytes(64)
        )
        clean_db_session.add(existing_user)
        await clean_db_session.flush()

        # 新增 Passkey
        credential = Credential(
            user_id=existing_user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key=secrets.token_hex(64),
            device_name="iPhone Face ID",
            transports='["internal"]',
            counter=0,
            created_at=datetime.utcnow()
        )
        clean_db_session.add(credential)
        await clean_db_session.commit()

        # 準備：OAuth 資料
        oauth_data = {
            "email": existing_email,
            "name": "Same User via OAuth",
            "oauth_provider": "google",
            "oauth_id": f"google_{uuid4().hex}",
            "profile_picture_url": "https://lh3.googleusercontent.com/test.jpg"
        }

        # 執行：處理 OAuth 註冊
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.handle_oauth_registration(
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 驗證：衝突資訊包含多種認證方式
        conflict = result["conflict"]
        assert "password" in conflict["existing_auth_methods"]
        assert "passkey" in conflict["existing_auth_methods"]
        assert len(conflict["existing_auth_methods"]) == 2

    # ============================================
    # 測試 5: 現有 OAuth 用戶再次登入（無衝突）
    # ============================================
    @pytest.mark.asyncio
    async def test_should_allow_existing_oauth_user_to_login(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 1: 現有 OAuth 用戶再次登入應該成功

        前置條件：
        - email 已存在
        - 現有用戶的 oauth_provider='google'
        - oauth_id 與登入的相同

        預期行為：
        - 不視為衝突
        - 回傳成功結果
        - 回傳現有用戶資訊
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.models.user import User

        # 準備：建立現有 OAuth 用戶
        oauth_id = f"google_{uuid4().hex}"
        existing_email = f"oauth_user_{uuid4().hex[:8]}@gmail.com"
        existing_user = User(
            email=existing_email,
            name="Existing OAuth User",
            password_hash=None,
            oauth_provider="google",
            oauth_id=oauth_id,
            profile_picture_url="https://old-pic.jpg"
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()

        # 準備：相同的 OAuth 登入
        oauth_data = {
            "email": existing_email,
            "name": "Existing OAuth User",
            "oauth_provider": "google",
            "oauth_id": oauth_id,
            "profile_picture_url": "https://new-pic.jpg"  # 可能更新頭像
        }

        # 執行：處理 OAuth 登入
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.handle_oauth_registration(
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 驗證：成功登入（無衝突）
        assert result["success"] is True
        assert result["conflict"] is None
        assert result["user"].id == existing_user.id

    # ============================================
    # 測試 6: Email 衝突偵測（不同 OAuth 提供者）
    # ============================================
    @pytest.mark.asyncio
    async def test_should_detect_conflict_with_different_oauth_provider(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: Email 已存在但使用不同 OAuth 提供者

        前置條件：
        - email 已存在
        - 現有用戶 oauth_provider='facebook'
        - 嘗試使用 Google OAuth 登入

        預期行為：
        - 偵測為衝突
        - 衝突資訊包含：existing_auth_methods=["oauth_facebook"]
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.models.user import User

        # 準備：建立現有 Facebook OAuth 用戶
        existing_email = f"facebook_user_{uuid4().hex[:8]}@example.com"
        existing_user = User(
            email=existing_email,
            name="Facebook User",
            password_hash=None,
            oauth_provider="facebook",
            oauth_id="facebook_12345",
            profile_picture_url="https://fb-pic.jpg"
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()

        # 準備：嘗試用 Google OAuth 登入
        oauth_data = {
            "email": existing_email,
            "name": "Same User via Google",
            "oauth_provider": "google",
            "oauth_id": f"google_{uuid4().hex}",
            "profile_picture_url": "https://google-pic.jpg"
        }

        # 執行：處理 OAuth 註冊
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.handle_oauth_registration(
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 驗證：偵測到衝突
        assert result["success"] is False
        assert result["conflict"] is not None

        conflict = result["conflict"]
        assert "oauth_facebook" in conflict["existing_auth_methods"]
        assert conflict["suggested_action"] == "login_first"

    # ============================================
    # 測試 7: 驗證衝突資訊的完整性
    # ============================================
    @pytest.mark.asyncio
    async def test_conflict_info_should_contain_all_required_fields(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: 衝突資訊應包含所有必要欄位

        預期衝突資訊格式：
        {
          "conflict_type": "existing_account",
          "email": "user@example.com",
          "existing_auth_methods": ["password", "passkey"],
          "suggested_action": "login_first"
        }
        """
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.models.user import User

        # 準備：建立現有密碼用戶
        existing_email = f"test_user_{uuid4().hex[:8]}@example.com"
        existing_user = User(
            email=existing_email,
            name="Test User",
            password_hash="$2b$12$hashed_password",
            oauth_provider=None,
            oauth_id=None
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()

        # 準備：OAuth 資料
        oauth_data = {
            "email": existing_email,
            "name": "Test User",
            "oauth_provider": "google",
            "oauth_id": f"google_{uuid4().hex}",
            "profile_picture_url": "https://test.jpg"
        }

        # 執行：處理 OAuth 註冊
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.handle_oauth_registration(
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 驗證：衝突資訊包含所有必要欄位
        conflict = result["conflict"]
        assert "conflict_type" in conflict
        assert conflict["conflict_type"] == "existing_account"

        assert "email" in conflict
        assert conflict["email"] == existing_email

        assert "existing_auth_methods" in conflict
        assert isinstance(conflict["existing_auth_methods"], list)
        assert len(conflict["existing_auth_methods"]) > 0

        assert "suggested_action" in conflict
        assert conflict["suggested_action"] in ["login_first", "link_account"]
