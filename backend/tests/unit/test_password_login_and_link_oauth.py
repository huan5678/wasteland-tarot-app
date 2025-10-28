"""
Task 4.1: 密碼登入並連結 OAuth 的單元測試 (RED 階段)

測試場景：
1. 使用正確密碼登入並成功連結 OAuth
2. OAuth 資訊寫入資料庫
3. JWT tokens 包含 has_oauth=true 標記
4. 使用錯誤密碼登入失敗
5. 連續失敗 5 次後鎖定 15 分鐘
6. Email 與當前 OAuth email 不一致時拒絕連結

需求參考：
- requirements.md: 需求 8, 8.5
- design.md: AccountConflictResolver

TDD RED 階段：測試應該失敗，因為功能尚未實作
"""

import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

# Test fixtures and utilities
pytestmark = pytest.mark.asyncio


class TestPasswordLoginAndLinkOAuth:
    """測試密碼登入並連結 OAuth 的功能"""

    @pytest.mark.asyncio
    async def test_should_login_with_correct_password_and_link_oauth_success(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: 使用正確密碼登入並成功連結 OAuth

        預期行為：
        - 使用正確密碼登入成功
        - OAuth 資訊（oauth_provider, oauth_id, profile_picture_url）寫入資料庫
        - JWT tokens 包含 has_oauth=true 標記
        - 回傳完整的使用者資訊
        """
        from app.models.user import User
        from app.core.security import get_password_hash
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService

        # 建立現有密碼用戶
        existing_email = f"password_user_{uuid4().hex[:8]}@example.com"
        password = "SecurePassword123"
        password_hash = get_password_hash(password)

        existing_user = User(
            email=existing_email,
            name="Existing Password User",
            password_hash=password_hash,
            oauth_provider=None,
            oauth_id=None,
            profile_picture_url=None
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()
        await clean_db_session.refresh(existing_user)

        # 準備 OAuth 資料
        oauth_data = {
            "email": existing_email,  # 相同 email
            "name": "Same User via OAuth",
            "oauth_provider": "google",
            "oauth_id": f"google_{uuid4().hex}",
            "profile_picture_url": "https://lh3.googleusercontent.com/test.jpg"
        }

        # 執行登入並連結 OAuth
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.login_with_password_and_link_oauth(
            email=existing_email,
            password=password,
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
        assert user.password_hash is not None, "密碼 hash 應該保留"

        # 驗證 JWT tokens 包含 has_oauth=true 標記
        from app.core.security import verify_token
        tokens = result["tokens"]
        access_token_payload = verify_token(tokens["access_token"])
        assert access_token_payload is not None, "Access token 應該有效"
        assert access_token_payload.get("has_oauth") is True, "JWT payload 應該包含 has_oauth=true"
        assert access_token_payload.get("auth_method") == "password", "登入方式應該是 password"

    @pytest.mark.asyncio
    async def test_should_write_oauth_info_to_database(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: OAuth 資訊應該寫入資料庫

        預期行為：
        - 資料庫中的 oauth_provider, oauth_id, profile_picture_url 欄位更新
        - 密碼 hash 保持不變
        """
        from app.models.user import User
        from app.core.security import get_password_hash
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from sqlalchemy import select

        # 建立現有用戶
        existing_email = f"db_test_{uuid4().hex[:8]}@example.com"
        password = "TestPassword456"
        password_hash = get_password_hash(password)

        existing_user = User(
            email=existing_email,
            name="DB Test User",
            password_hash=password_hash,
            oauth_provider=None,
            oauth_id=None
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()
        user_id = existing_user.id

        # OAuth 資料
        oauth_data = {
            "email": existing_email,
            "name": "Same User",
            "oauth_provider": "google",
            "oauth_id": "google_12345",
            "profile_picture_url": "https://example.com/pic.jpg"
        }

        # 執行連結
        coordinator = AuthMethodCoordinatorService()
        await coordinator.login_with_password_and_link_oauth(
            email=existing_email,
            password=password,
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 從資料庫重新查詢用戶
        result = await clean_db_session.execute(
            select(User).where(User.id == user_id)
        )
        updated_user = result.scalar_one()

        # 驗證資料庫中的 OAuth 資訊
        assert updated_user.oauth_provider == "google", "資料庫應該更新 oauth_provider"
        assert updated_user.oauth_id == "google_12345", "資料庫應該更新 oauth_id"
        assert updated_user.profile_picture_url == "https://example.com/pic.jpg", "資料庫應該更新 profile_picture_url"
        assert updated_user.password_hash == password_hash, "密碼 hash 應該保持不變"

    @pytest.mark.asyncio
    async def test_should_fail_with_incorrect_password(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8: 使用錯誤密碼應該登入失敗

        預期行為：
        - 驗證失敗，回傳錯誤
        - 不更新 OAuth 資訊
        - failed_login_attempts 計數器遞增
        """
        from app.models.user import User
        from app.core.security import get_password_hash
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.core.exceptions import InvalidCredentialsError

        # 建立用戶
        existing_email = f"wrong_pwd_{uuid4().hex[:8]}@example.com"
        correct_password = "CorrectPassword789"
        wrong_password = "WrongPassword000"

        existing_user = User(
            email=existing_email,
            name="Wrong Password User",
            password_hash=get_password_hash(correct_password),
            failed_login_attempts=0
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()

        # OAuth 資料
        oauth_data = {
            "email": existing_email,
            "oauth_provider": "google",
            "oauth_id": "google_should_not_link",
            "profile_picture_url": "https://example.com/pic.jpg"
        }

        # 嘗試使用錯誤密碼登入
        coordinator = AuthMethodCoordinatorService()

        with pytest.raises(InvalidCredentialsError):
            await coordinator.login_with_password_and_link_oauth(
                email=existing_email,
                password=wrong_password,
                oauth_data=oauth_data,
                db=clean_db_session
            )

        # 驗證 OAuth 資訊未更新
        await clean_db_session.refresh(existing_user)
        assert existing_user.oauth_provider is None, "OAuth provider 不應該更新"
        assert existing_user.oauth_id is None, "OAuth ID 不應該更新"

        # 驗證失敗次數遞增
        assert existing_user.failed_login_attempts == 1, "失敗次數應該遞增"

    @pytest.mark.asyncio
    async def test_should_lock_account_after_5_failed_attempts(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 8.5: 連續失敗 5 次後應該鎖定帳號 15 分鐘

        預期行為：
        - 前 4 次失敗回傳 InvalidCredentialsError
        - 第 5 次失敗後設定 account_locked_until（15 分鐘後）
        - 第 6 次嘗試回傳 AccountLockedError
        """
        from app.models.user import User
        from app.core.security import get_password_hash
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.core.exceptions import InvalidCredentialsError, AccountLockedError

        # 建立用戶
        existing_email = f"lock_test_{uuid4().hex[:8]}@example.com"
        correct_password = "CorrectPassword"
        wrong_password = "WrongPassword"

        existing_user = User(
            email=existing_email,
            name="Lock Test User",
            password_hash=get_password_hash(correct_password),
            failed_login_attempts=0,
            account_locked_until=None
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()

        oauth_data = {
            "email": existing_email,
            "oauth_provider": "google",
            "oauth_id": "google_test",
            "profile_picture_url": None
        }

        coordinator = AuthMethodCoordinatorService()

        # 嘗試 5 次錯誤密碼
        for i in range(1, 6):
            with pytest.raises(InvalidCredentialsError):
                await coordinator.login_with_password_and_link_oauth(
                    email=existing_email,
                    password=wrong_password,
                    oauth_data=oauth_data,
                    db=clean_db_session
                )

            await clean_db_session.refresh(existing_user)
            assert existing_user.failed_login_attempts == i, f"失敗次數應該是 {i}"

        # 驗證帳號已鎖定
        await clean_db_session.refresh(existing_user)
        assert existing_user.account_locked_until is not None, "應該設定鎖定時間"

        # 計算鎖定時間（應該是 15 分鐘後）
        now = datetime.utcnow()
        expected_unlock = now + timedelta(minutes=15)
        time_diff = abs((existing_user.account_locked_until - expected_unlock).total_seconds())
        assert time_diff < 5, "鎖定時間應該是 15 分鐘"

        # 第 6 次嘗試應該回傳 AccountLockedError
        with pytest.raises(AccountLockedError):
            await coordinator.login_with_password_and_link_oauth(
                email=existing_email,
                password=correct_password,  # 即使密碼正確也應該被鎖定
                oauth_data=oauth_data,
                db=clean_db_session
            )

    @pytest.mark.asyncio
    async def test_should_reject_email_mismatch(
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
        from app.core.security import get_password_hash
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService
        from app.core.exceptions import EmailMismatchError

        # 建立用戶
        user_email = f"user_{uuid4().hex[:8]}@example.com"
        oauth_email = f"different_{uuid4().hex[:8]}@example.com"  # 不同的 email
        password = "TestPassword"

        existing_user = User(
            email=user_email,
            name="Email Test User",
            password_hash=get_password_hash(password)
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()

        # OAuth 資料使用不同的 email
        oauth_data = {
            "email": oauth_email,  # 不同 email
            "oauth_provider": "google",
            "oauth_id": "google_mismatch",
            "profile_picture_url": None
        }

        # 嘗試連結（應該失敗）
        coordinator = AuthMethodCoordinatorService()

        with pytest.raises(EmailMismatchError) as exc_info:
            await coordinator.login_with_password_and_link_oauth(
                email=user_email,
                password=password,
                oauth_data=oauth_data,
                db=clean_db_session
            )

        # 驗證錯誤訊息包含具體資訊
        error_message = str(exc_info.value)
        assert "不符" in error_message or "mismatch" in error_message.lower(), "應該指出不一致"
        # 錯誤訊息格式："Google 帳號 (xxx) 與您的帳號 (yyy) 不符"
        assert oauth_email in error_message, "錯誤訊息應該包含 OAuth email"
        assert user_email in error_message, "錯誤訊息應該包含用戶 email"

        # 驗證 OAuth 資訊未更新
        await clean_db_session.refresh(existing_user)
        assert existing_user.oauth_provider is None, "OAuth provider 不應該更新"

    @pytest.mark.asyncio
    async def test_should_include_auth_method_in_jwt_payload(
        self, clean_db_session: AsyncSession
    ):
        """
        需求 5: JWT tokens 應該包含認證方式標記

        預期行為：
        - JWT payload 包含 auth_method='password'
        - JWT payload 包含 has_oauth=true
        - JWT payload 包含 has_password=true
        """
        from app.models.user import User
        from app.core.security import get_password_hash, verify_token
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService

        # 建立用戶
        existing_email = f"jwt_test_{uuid4().hex[:8]}@example.com"
        password = "JwtTestPassword"

        existing_user = User(
            email=existing_email,
            name="JWT Test User",
            password_hash=get_password_hash(password)
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()

        # OAuth 資料
        oauth_data = {
            "email": existing_email,
            "oauth_provider": "google",
            "oauth_id": "google_jwt_test",
            "profile_picture_url": None
        }

        # 執行連結
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.login_with_password_and_link_oauth(
            email=existing_email,
            password=password,
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 解析 JWT tokens
        tokens = result["tokens"]
        access_token_payload = verify_token(tokens["access_token"])
        refresh_token_payload = verify_token(tokens["refresh_token"])

        # 驗證 access token payload
        assert access_token_payload is not None, "Access token 應該有效"
        assert access_token_payload.get("auth_method") == "password", "認證方式應該是 password"
        assert access_token_payload.get("has_oauth") is True, "has_oauth 應該是 true"
        assert access_token_payload.get("has_password") is True, "has_password 應該是 true"
        assert access_token_payload.get("has_passkey") is False, "has_passkey 應該是 false（未設定）"

        # 驗證 refresh token payload
        assert refresh_token_payload is not None, "Refresh token 應該有效"
        assert refresh_token_payload.get("type") == "refresh", "Token 類型應該是 refresh"

    @pytest.mark.asyncio
    async def test_should_reset_failed_attempts_on_successful_login(
        self, clean_db_session: AsyncSession
    ):
        """
        安全性需求：成功登入後應該重置失敗計數器

        預期行為：
        - 用戶有 3 次失敗記錄
        - 成功登入後 failed_login_attempts 重置為 0
        - last_failed_login 清空
        """
        from app.models.user import User
        from app.core.security import get_password_hash
        from app.services.auth_method_coordinator import AuthMethodCoordinatorService

        # 建立有失敗記錄的用戶
        existing_email = f"reset_test_{uuid4().hex[:8]}@example.com"
        password = "ResetTestPassword"

        existing_user = User(
            email=existing_email,
            name="Reset Test User",
            password_hash=get_password_hash(password),
            failed_login_attempts=3,  # 已有 3 次失敗
            last_failed_login=datetime.utcnow()
        )
        clean_db_session.add(existing_user)
        await clean_db_session.commit()

        # OAuth 資料
        oauth_data = {
            "email": existing_email,
            "oauth_provider": "google",
            "oauth_id": "google_reset_test",
            "profile_picture_url": None
        }

        # 成功登入
        coordinator = AuthMethodCoordinatorService()
        result = await coordinator.login_with_password_and_link_oauth(
            email=existing_email,
            password=password,
            oauth_data=oauth_data,
            db=clean_db_session
        )

        # 驗證失敗計數器重置
        await clean_db_session.refresh(existing_user)
        assert existing_user.failed_login_attempts == 0, "失敗次數應該重置為 0"
        assert existing_user.last_failed_login is None, "最後失敗時間應該清空"
        assert result["success"] is True, "登入應該成功"
