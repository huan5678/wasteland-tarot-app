"""
Task 8 Tests - 驗證使用者服務支援新的 User 模型 schema (email + name)

測試涵蓋：
- 使用 email + password + name 建立使用者
- Email 格式驗證
- Email 唯一性檢查
- Name 長度驗證
- 密碼強度驗證（至少 8 字元）
- Bcrypt 密碼雜湊（成本因子 12）
- OAuth 欄位為 NULL
"""

import pytest
import re
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_service import UserService
from app.core.security import verify_password
from app.core.exceptions import UserAlreadyExistsError


@pytest.mark.unit
class TestUserServiceTask8:
    """測試 Task 8: 更新使用者服務以支援新的 User 模型 schema"""

    @pytest.fixture
    def user_service(self, db_session: AsyncSession):
        """建立 UserService 實例"""
        return UserService(db_session)

    async def test_create_user_with_email_name_password(self, user_service: UserService):
        """
        測試使用 email + password + name 建立使用者
        需求：5.1, 5.4
        """
        # 建立使用者
        user = await user_service.create_user(
            email="test@wasteland.com",
            password="SecurePass123",
            name="Vault Dweller"
        )

        # 驗證使用者欄位
        assert user.email == "test@wasteland.com"
        assert user.name == "Vault Dweller"
        assert user.password_hash is not None
        assert user.oauth_provider is None
        assert user.oauth_id is None
        assert user.is_active is True
        assert user.is_verified is False

    async def test_email_format_validation(self, user_service: UserService):
        """
        測試 email 格式驗證
        需求：5.3
        """
        invalid_emails = [
            "notanemail",
            "@example.com",
            "user@",
            "user@.com",
            "user name@example.com",
            ""
        ]

        for invalid_email in invalid_emails:
            with pytest.raises(ValueError, match="無效的 email 格式"):
                await user_service.create_user(
                    email=invalid_email,
                    password="ValidPass123",
                    name="Test User"
                )

    async def test_email_uniqueness_check(self, user_service: UserService):
        """
        測試 email 唯一性檢查
        需求：5.4
        """
        # 建立第一個使用者
        await user_service.create_user(
            email="duplicate@test.com",
            password="Pass123456",
            name="User One"
        )

        # 嘗試使用相同 email 建立第二個使用者
        with pytest.raises(UserAlreadyExistsError, match="Email 'duplicate@test.com' 已被使用"):
            await user_service.create_user(
                email="duplicate@test.com",
                password="DifferentPass123",
                name="User Two"
            )

    async def test_name_length_validation(self, user_service: UserService):
        """
        測試 name 長度驗證（1-50 字元）
        需求：5.1
        """
        # 空字串
        with pytest.raises(ValueError, match="name 長度必須在 1-50 字元之間"):
            await user_service.create_user(
                email="test1@test.com",
                password="ValidPass123",
                name=""
            )

        # 超過 50 字元
        long_name = "a" * 51
        with pytest.raises(ValueError, match="name 長度必須在 1-50 字元之間"):
            await user_service.create_user(
                email="test2@test.com",
                password="ValidPass123",
                name=long_name
            )

        # 有效的 1 字元 name
        user1 = await user_service.create_user(
            email="test3@test.com",
            password="ValidPass123",
            name="A"
        )
        assert user1.name == "A"

        # 有效的 50 字元 name
        valid_name = "a" * 50
        user2 = await user_service.create_user(
            email="test4@test.com",
            password="ValidPass123",
            name=valid_name
        )
        assert user2.name == valid_name

    async def test_password_strength_validation(self, user_service: UserService):
        """
        測試密碼強度驗證（至少 8 字元）
        需求：5.1
        """
        # 密碼少於 8 字元
        with pytest.raises(ValueError, match="密碼長度必須至少 8 字元"):
            await user_service.create_user(
                email="weakpass@test.com",
                password="Pass123",  # 7 字元
                name="Test User"
            )

        # 正好 8 字元（有效）
        user = await user_service.create_user(
            email="validpass@test.com",
            password="Pass1234",  # 8 字元
            name="Test User"
        )
        assert user is not None

    async def test_bcrypt_password_hashing(self, user_service: UserService):
        """
        測試使用 bcrypt 雜湊密碼（成本因子 12）
        需求：13.5
        """
        password = "MySecurePassword123"

        user = await user_service.create_user(
            email="bcrypt@test.com",
            password=password,
            name="Bcrypt User"
        )

        # 驗證密碼已被雜湊（不等於原始密碼）
        assert user.password_hash != password

        # 驗證密碼雜湊以 $2b$ 開頭（bcrypt 格式）
        assert user.password_hash.startswith("$2b$")

        # 驗證可以使用 bcrypt 驗證密碼
        assert verify_password(password, user.password_hash) is True

        # 驗證錯誤密碼無法通過驗證
        assert verify_password("WrongPassword", user.password_hash) is False

        # 驗證成本因子為 12（bcrypt hash 的第 3-4 個字元）
        # 格式：$2b$12$...
        cost_factor = user.password_hash.split("$")[2]
        assert cost_factor == "12"

    async def test_oauth_fields_are_null_for_traditional_users(self, user_service: UserService):
        """
        測試傳統註冊使用者的 OAuth 欄位為 NULL
        需求：5.4
        """
        user = await user_service.create_user(
            email="traditional@test.com",
            password="TraditionalPass123",
            name="Traditional User"
        )

        # OAuth 欄位應為 NULL
        assert user.oauth_provider is None
        assert user.oauth_id is None

        # password_hash 應有值
        assert user.password_hash is not None

    async def test_create_user_with_optional_fields(self, user_service: UserService):
        """
        測試建立使用者時支援選填欄位
        需求：5.1
        """
        user = await user_service.create_user(
            email="optional@test.com",
            password="OptionalPass123",
            name="Optional User",
            display_name="The Chosen One",
            faction_alignment="VAULT_DWELLER",
            karma_score=75,
            vault_number=101,
            wasteland_location="Capital Wasteland"
        )

        assert user.display_name == "The Chosen One"
        assert user.faction_alignment == "VAULT_DWELLER"
        assert user.karma_score == 75
        assert user.vault_number == 101
        assert user.wasteland_location == "Capital Wasteland"

    async def test_get_user_by_email(self, user_service: UserService):
        """
        測試使用 email 查詢使用者
        需求：5.4
        """
        # 建立使用者
        created_user = await user_service.create_user(
            email="findme@test.com",
            password="FindMePass123",
            name="Findable User"
        )

        # 使用 email 查詢
        found_user = await user_service.get_user_by_email("findme@test.com")

        assert found_user is not None
        assert found_user.id == created_user.id
        assert found_user.email == "findme@test.com"
        assert found_user.name == "Findable User"

    async def test_default_profile_and_preferences_created(self, user_service: UserService):
        """
        測試建立使用者時自動建立預設 profile 和 preferences
        """
        user = await user_service.create_user(
            email="profile@test.com",
            password="ProfilePass123",
            name="Profile User"
        )

        # 重新載入使用者以取得關聯資料
        user_with_relations = await user_service.get_user_by_id(user.id)

        # 驗證 profile 已建立
        assert user_with_relations.profile is not None
        assert user_with_relations.profile.user_id == user.id

        # 驗證 preferences 已建立
        assert user_with_relations.preferences is not None
        assert user_with_relations.preferences.user_id == user.id
