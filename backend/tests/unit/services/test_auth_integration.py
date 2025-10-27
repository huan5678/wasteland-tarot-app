"""
Tests for Passkey Authentication Integration with Existing Auth System

Testing Strategy:
- JWT token contains auth_method field
- User model tracks last_login_method
- get_current_user supports passkey authentication
- Helper functions (user_has_passkey, user_has_password, user_has_oauth)
- Karma rewards integration for passkey events

TDD Stage: GREEN (實作功能，通過測試)
"""

import pytest
from datetime import datetime
from uuid import uuid4
from unittest.mock import Mock, AsyncMock, patch

from app.core.security import create_access_token, verify_token
from app.models.user import User
from app.models.credential import Credential
from app.services.auth_helpers import (
    user_has_passkey,
    user_has_password,
    user_has_oauth,
    award_first_passkey_registration_karma,
    award_first_passkey_login_karma,
    award_add_passkey_karma,
)


@pytest.fixture
async def test_user(db_session):
    """建立測試用戶"""
    user = User(
        email="testuser@example.com",
        name="Test User",
        password_hash="hashed_password",
        karma_score=50
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


class TestJWTAuthMethodField:
    """Test JWT token包含 auth_method 欄位"""

    def test_create_access_token_with_passkey_auth_method(self):
        """測試：建立 JWT token 時包含 auth_method='passkey'"""
        user_id = str(uuid4())
        token_data = {
            "sub": user_id,
            "auth_method": "passkey"
        }

        token = create_access_token(token_data)
        payload = verify_token(token)

        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["auth_method"] == "passkey"
        assert payload["type"] == "access"

    def test_create_access_token_with_password_auth_method(self):
        """測試：建立 JWT token 時包含 auth_method='password'"""
        user_id = str(uuid4())
        token_data = {
            "sub": user_id,
            "auth_method": "password"
        }

        token = create_access_token(token_data)
        payload = verify_token(token)

        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["auth_method"] == "password"

    def test_create_access_token_with_oauth_auth_method(self):
        """測試：建立 JWT token 時包含 auth_method='oauth_google'"""
        user_id = str(uuid4())
        token_data = {
            "sub": user_id,
            "auth_method": "oauth_google"
        }

        token = create_access_token(token_data)
        payload = verify_token(token)

        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["auth_method"] == "oauth_google"

    def test_verify_token_returns_auth_method(self):
        """測試：verify_token() 回傳的 payload 包含 auth_method"""
        user_id = str(uuid4())
        token_data = {
            "sub": user_id,
            "auth_method": "passkey"
        }

        token = create_access_token(token_data)
        payload = verify_token(token)

        assert "auth_method" in payload
        assert payload["auth_method"] == "passkey"


class TestUserLastLoginMethod:
    """測試 User model 的 last_login_method 欄位"""

    @pytest.mark.asyncio
    async def test_user_model_has_last_login_method_field(self, db_session):
        """測試：User model 包含 last_login_method 欄位"""
        user = User(
            email="test@example.com",
            name="Test User",
            password_hash="hashed_password",
            last_login_method="passkey"
        )

        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert hasattr(user, "last_login_method")
        assert user.last_login_method == "passkey"

    @pytest.mark.asyncio
    async def test_update_last_login_method_to_passkey(self, db_session):
        """測試：更新 last_login_method 為 'passkey'"""
        user = User(
            email="test@example.com",
            name="Test User",
            password_hash="hashed_password",
            last_login_method="password"
        )

        db_session.add(user)
        await db_session.commit()

        user.last_login_method = "passkey"
        await db_session.commit()
        await db_session.refresh(user)

        assert user.last_login_method == "passkey"

    @pytest.mark.asyncio
    async def test_last_login_method_nullable(self, db_session):
        """測試：last_login_method 可為 NULL（新用戶）"""
        user = User(
            email="newuser@example.com",
            name="New User",
            password_hash="hashed_password"
        )

        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        assert user.last_login_method is None


class TestGetCurrentUserPasskeySupport:
    """測試 get_current_user dependency 支援 passkey 認證"""

    @pytest.mark.asyncio
    async def test_get_current_user_with_passkey_token(self, db_session, test_user):
        """測試：get_current_user 接受 passkey 認證的 token"""
        from app.core.dependencies import get_current_user
        from fastapi import Request, Cookie
        from unittest.mock import Mock

        # 建立 passkey token
        token_data = {
            "sub": str(test_user.id),
            "auth_method": "passkey"
        }
        token = create_access_token(token_data)

        # Mock request 和 cookie
        request = Mock(spec=Request)

        # 呼叫 get_current_user（使用 passkey token）
        user = await get_current_user(
            request=request,
            access_token=token,
            credentials=None,
            db=db_session
        )

        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email

    @pytest.mark.asyncio
    async def test_get_current_user_with_password_token(self, db_session, test_user):
        """測試：get_current_user 接受 password 認證的 token"""
        from app.core.dependencies import get_current_user
        from fastapi import Request
        from unittest.mock import Mock

        # 建立 password token
        token_data = {
            "sub": str(test_user.id),
            "auth_method": "password"
        }
        token = create_access_token(token_data)

        # Mock request
        request = Mock(spec=Request)

        # 呼叫 get_current_user（使用 password token）
        user = await get_current_user(
            request=request,
            access_token=token,
            credentials=None,
            db=db_session
        )

        assert user is not None
        assert user.id == test_user.id

    @pytest.mark.asyncio
    async def test_get_current_user_with_oauth_token(self, db_session, test_user):
        """測試：get_current_user 接受 OAuth 認證的 token"""
        from app.core.dependencies import get_current_user
        from fastapi import Request
        from unittest.mock import Mock

        # 建立 OAuth token
        token_data = {
            "sub": str(test_user.id),
            "auth_method": "oauth_google"
        }
        token = create_access_token(token_data)

        # Mock request
        request = Mock(spec=Request)

        # 呼叫 get_current_user（使用 OAuth token）
        user = await get_current_user(
            request=request,
            access_token=token,
            credentials=None,
            db=db_session
        )

        assert user is not None
        assert user.id == test_user.id


class TestAuthHelperFunctions:
    """測試認證輔助函式"""

    @pytest.mark.asyncio
    async def test_user_has_passkey_returns_true(self, db_session, test_user):
        """測試：user_has_passkey() 當用戶有 passkey 時回傳 True"""
        # 建立 credential
        credential = Credential(
            user_id=test_user.id,
            credential_id=b"test_credential_id",
            public_key=b"test_public_key",
            sign_count=0,
            aaguid=b"test_aaguid",
            name="Test Passkey"
        )
        db_session.add(credential)
        await db_session.commit()

        result = await user_has_passkey(test_user.id, db_session)
        assert result is True

    @pytest.mark.asyncio
    async def test_user_has_passkey_returns_false(self, db_session, test_user):
        """測試：user_has_passkey() 當用戶無 passkey 時回傳 False"""
        result = await user_has_passkey(test_user.id, db_session)
        assert result is False

    @pytest.mark.asyncio
    async def test_user_has_password_returns_true(self, db_session):
        """測試：user_has_password() 當用戶有密碼時回傳 True"""
        user = User(
            email="password@example.com",
            name="Password User",
            password_hash="hashed_password"
        )
        db_session.add(user)
        await db_session.commit()

        result = await user_has_password(user.id, db_session)
        assert result is True

    @pytest.mark.asyncio
    async def test_user_has_password_returns_false(self, db_session):
        """測試：user_has_password() 當用戶無密碼時回傳 False（OAuth only）"""
        user = User(
            email="oauth@example.com",
            name="OAuth User",
            password_hash=None,
            oauth_provider="google",
            oauth_id="google_123"
        )
        db_session.add(user)
        await db_session.commit()

        result = await user_has_password(user.id, db_session)
        assert result is False

    @pytest.mark.asyncio
    async def test_user_has_oauth_returns_true(self, db_session):
        """測試：user_has_oauth() 當用戶有 OAuth 時回傳 True"""
        user = User(
            email="oauth@example.com",
            name="OAuth User",
            password_hash=None,
            oauth_provider="google",
            oauth_id="google_123"
        )
        db_session.add(user)
        await db_session.commit()

        result = await user_has_oauth(user.id, db_session)
        assert result is True

    @pytest.mark.asyncio
    async def test_user_has_oauth_returns_false(self, db_session):
        """測試：user_has_oauth() 當用戶無 OAuth 時回傳 False"""
        user = User(
            email="password@example.com",
            name="Password User",
            password_hash="hashed_password"
        )
        db_session.add(user)
        await db_session.commit()

        result = await user_has_oauth(user.id, db_session)
        assert result is False


class TestKarmaRewardsIntegration:
    """測試 Karma 獎勵機制整合"""

    @pytest.mark.asyncio
    async def test_award_first_passkey_registration_karma(self, db_session, test_user):
        """測試：首次 Passkey 註冊獎勵 50 Karma"""
        from app.services.karma_service import KarmaService

        karma_service = KarmaService(db_session)

        # 初始化 karma
        await karma_service.initialize_karma_for_user(str(test_user.id))
        initial_karma = test_user.karma_score

        # 呼叫獎勵函式
        await award_first_passkey_registration_karma(test_user.id, db_session)

        # 重新載入用戶
        await db_session.refresh(test_user)

        # 驗證 karma 增加 50
        assert test_user.karma_score == initial_karma + 50

    @pytest.mark.asyncio
    async def test_award_first_passkey_login_karma(self, db_session, test_user):
        """測試：首次 Passkey 登入獎勵 20 Karma"""
        from app.services.karma_service import KarmaService

        karma_service = KarmaService(db_session)

        # 初始化 karma
        await karma_service.initialize_karma_for_user(str(test_user.id))
        initial_karma = test_user.karma_score

        # 呼叫獎勵函式
        await award_first_passkey_login_karma(test_user.id, db_session)

        # 重新載入用戶
        await db_session.refresh(test_user)

        # 驗證 karma 增加 20
        assert test_user.karma_score == initial_karma + 20

    @pytest.mark.asyncio
    async def test_award_add_passkey_karma(self, db_session, test_user):
        """測試：新增額外 Passkey 獎勵 10 Karma"""
        from app.services.karma_service import KarmaService

        karma_service = KarmaService(db_session)

        # 初始化 karma
        await karma_service.initialize_karma_for_user(str(test_user.id))
        initial_karma = test_user.karma_score

        # 呼叫獎勵函式
        await award_add_passkey_karma(test_user.id, db_session)

        # 重新載入用戶
        await db_session.refresh(test_user)

        # 驗證 karma 增加 10
        assert test_user.karma_score == initial_karma + 10

    @pytest.mark.asyncio
    async def test_first_passkey_registration_only_once(self, db_session, test_user):
        """測試：首次 Passkey 註冊獎勵只能領取一次"""
        from app.services.karma_service import KarmaService

        karma_service = KarmaService(db_session)

        # 初始化 karma
        await karma_service.initialize_karma_for_user(str(test_user.id))
        initial_karma = test_user.karma_score

        # 第一次呼叫（應該獲得 50 karma）
        await award_first_passkey_registration_karma(test_user.id, db_session)
        await db_session.refresh(test_user)
        karma_after_first = test_user.karma_score

        assert karma_after_first == initial_karma + 50

        # 第二次呼叫（應該不獲得 karma）
        await award_first_passkey_registration_karma(test_user.id, db_session)
        await db_session.refresh(test_user)

        # Karma 沒有再次增加
        assert test_user.karma_score == karma_after_first

    @pytest.mark.asyncio
    async def test_karma_rewards_create_history_records(self, db_session, test_user):
        """測試：Karma 獎勵會建立歷史記錄"""
        from app.services.karma_service import KarmaService
        from app.models.social_features import KarmaHistory
        from sqlalchemy import select

        karma_service = KarmaService(db_session)

        # 初始化 karma
        await karma_service.initialize_karma_for_user(str(test_user.id))

        # 呼叫獎勵函式
        await award_first_passkey_registration_karma(test_user.id, db_session)

        # 查詢 karma 歷史記錄
        result = await db_session.execute(
            select(KarmaHistory)
            .where(KarmaHistory.user_id == test_user.id)
            .where(KarmaHistory.reason == "passkey_first_registration")
        )
        history = result.scalar_one_or_none()

        assert history is not None
        assert history.karma_change == 50
        assert history.reason_description == "首次註冊 Passkey"
