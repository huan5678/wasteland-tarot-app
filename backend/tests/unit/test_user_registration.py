"""
單元測試：用戶註冊功能
測試 UserService.create_user 方法（email + password + name）
遵循 TDD 方法，確保所有需求被測試覆蓋
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_service import UserService
from app.models.user import User
from app.core.exceptions import UserAlreadyExistsError
from app.core.security import verify_password


@pytest.mark.asyncio
@pytest.mark.unit
class TestUserServiceCreateUser:
    """測試 UserService.create_user 方法"""

    async def test_create_user_success(self, db_session: AsyncSession):
        """測試成功創建用戶 - 需求 1.1"""
        service = UserService(db_session)

        user = await service.create_user(
            email="test@example.com",
            password="SecurePass123!",
            name="Test User"
        )

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.name == "Test User"
        assert user.password_hash is not None
        assert user.password_hash != "SecurePass123!"  # 確保密碼已雜湊
        assert user.oauth_provider is None  # 傳統註冊不使用 OAuth
        assert user.oauth_id is None
        assert user.is_active is True
        assert user.is_verified is False

    async def test_create_user_with_optional_fields(self, db_session: AsyncSession):
        """測試創建用戶時包含可選欄位"""
        service = UserService(db_session)

        user = await service.create_user(
            email="ranger@example.com",
            password="SecurePass123!",
            name="NCR Ranger",
            display_name="廢土遊俠",
            faction_alignment="NCR",
            vault_number=101,
            wasteland_location="New Vegas"
        )

        assert user.display_name == "廢土遊俠"
        assert user.faction_alignment == "NCR"
        assert user.vault_number == 101
        assert user.wasteland_location == "New Vegas"

    async def test_password_hashed_with_bcrypt(self, db_session: AsyncSession):
        """測試密碼使用 bcrypt 雜湊 - 需求 1.4"""
        service = UserService(db_session)

        plain_password = "TestPassword123!"
        user = await service.create_user(
            email="hash_test@example.com",
            password=plain_password,
            name="Hash Test"
        )

        # bcrypt 雜湊結果應以 $2b$ 開頭
        assert user.password_hash.startswith("$2b$")

        # 驗證密碼正確性
        assert verify_password(plain_password, user.password_hash) is True
        assert verify_password("WrongPassword", user.password_hash) is False

    async def test_create_user_duplicate_email(self, db_session: AsyncSession):
        """測試重複 email 應拋出 UserAlreadyExistsError - 需求 1.2"""
        service = UserService(db_session)

        # 創建第一個用戶
        await service.create_user(
            email="duplicate@example.com",
            password="SecurePass123!",
            name="First User"
        )

        # 嘗試使用相同 email 創建第二個用戶
        with pytest.raises(UserAlreadyExistsError) as exc_info:
            await service.create_user(
                email="duplicate@example.com",
                password="AnotherPass456!",
                name="Second User"
            )

        assert "Email 'duplicate@example.com' 已被使用" in str(exc_info.value.message)

    async def test_create_user_invalid_email_format(self, db_session: AsyncSession):
        """測試無效 email 格式應拋出 ValueError"""
        service = UserService(db_session)

        invalid_emails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user space@example.com",
            ""
        ]

        for invalid_email in invalid_emails:
            with pytest.raises(ValueError) as exc_info:
                await service.create_user(
                    email=invalid_email,
                    password="SecurePass123!",
                    name="Test User"
                )

            assert "無效的 email 格式" in str(exc_info.value)

    async def test_create_user_password_too_short(self, db_session: AsyncSession):
        """測試密碼長度不足應拋出 ValueError - 需求 1.3"""
        service = UserService(db_session)

        with pytest.raises(ValueError) as exc_info:
            await service.create_user(
                email="test@example.com",
                password="Short1",  # 僅 6 字元
                name="Test User"
            )

        assert "密碼長度必須至少 8 字元" in str(exc_info.value)

    async def test_create_user_name_empty(self, db_session: AsyncSession):
        """測試 name 為空應拋出 ValueError - 需求 1.7"""
        service = UserService(db_session)

        with pytest.raises(ValueError) as exc_info:
            await service.create_user(
                email="test@example.com",
                password="SecurePass123!",
                name=""
            )

        assert "name 長度必須在 1-50 字元之間" in str(exc_info.value)

    async def test_create_user_name_too_long(self, db_session: AsyncSession):
        """測試 name 長度超過 50 字元應拋出 ValueError - 需求 1.7"""
        service = UserService(db_session)

        long_name = "A" * 51  # 51 字元

        with pytest.raises(ValueError) as exc_info:
            await service.create_user(
                email="test@example.com",
                password="SecurePass123!",
                name=long_name
            )

        assert "name 長度必須在 1-50 字元之間" in str(exc_info.value)

    async def test_create_user_default_karma_score(self, db_session: AsyncSession):
        """測試新用戶預設 karma_score 為 50"""
        service = UserService(db_session)

        user = await service.create_user(
            email="karma_test@example.com",
            password="SecurePass123!",
            name="Karma Test"
        )

        assert user.karma_score == 50  # 預設值

    async def test_create_user_default_faction_alignment(self, db_session: AsyncSession):
        """測試新用戶預設 faction_alignment 為 VAULT_DWELLER"""
        service = UserService(db_session)

        user = await service.create_user(
            email="faction_test@example.com",
            password="SecurePass123!",
            name="Faction Test"
        )

        assert user.faction_alignment == "vault_dweller"  # 預設值

    async def test_create_user_display_name_defaults_to_name(self, db_session: AsyncSession):
        """測試 display_name 預設使用 name 的值"""
        service = UserService(db_session)

        user = await service.create_user(
            email="default_display@example.com",
            password="SecurePass123!",
            name="Test User"
        )

        assert user.display_name == "Test User"  # display_name 預設為 name
