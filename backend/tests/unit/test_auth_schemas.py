"""
單元測試：認證 Pydantic 模型驗證
測試 UserRegistrationRequest 和 UserLoginRequest 的欄位驗證
"""

import pytest
from pydantic import ValidationError
from app.api.auth import UserRegistrationRequest, UserLoginRequest


class TestUserRegistrationRequest:
    """測試 UserRegistrationRequest Pydantic 模型"""

    def test_valid_registration_data(self):
        """測試有效的註冊資料"""
        data = {
            "email": "vault_dweller@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
            "name": "Vault Dweller"
        }

        request = UserRegistrationRequest(**data)

        assert request.email == "vault_dweller@example.com"
        assert request.password == "SecurePass123!"
        assert request.name == "Vault Dweller"
        assert request.display_name is None
        assert request.faction_alignment is None
        assert request.vault_number is None

    def test_valid_registration_with_optional_fields(self):
        """測試包含可選欄位的有效註冊資料"""
        data = {
            "email": "ncr_ranger@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
            "name": "NCR Ranger",
            "display_name": "廢土遊俠",
            "faction_alignment": "NCR",
            "vault_number": 101,
            "wasteland_location": "New Vegas"
        }

        request = UserRegistrationRequest(**data)

        assert request.display_name == "廢土遊俠"
        assert request.faction_alignment == "NCR"
        assert request.vault_number == 101
        assert request.wasteland_location == "New Vegas"

    def test_password_too_short(self):
        """測試密碼長度不足（少於 8 字元）- 需求 1.3"""
        data = {
            "email": "test@example.com",
            "password": "Short1",  # 僅 6 字元
            "confirm_password": "Short1",
            "name": "Test User"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserRegistrationRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("password",) and "至少 8 字元" in err["msg"] for err in errors)

    def test_passwords_do_not_match(self):
        """測試密碼和確認密碼不符 - 需求 1.1"""
        data = {
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "DifferentPass456!",
            "name": "Test User"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserRegistrationRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("confirm_password",) and "不相符" in err["msg"] for err in errors)

    def test_invalid_email_format(self):
        """測試無效的 email 格式"""
        data = {
            "email": "invalid-email",  # 缺少 @ 和 domain
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
            "name": "Test User"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserRegistrationRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("email",) for err in errors)

    def test_name_empty(self):
        """測試 name 為空 - 需求 1.7"""
        data = {
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
            "name": ""
        }

        with pytest.raises(ValidationError) as exc_info:
            UserRegistrationRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("name",) and "不能為空" in err["msg"] for err in errors)

    def test_name_too_long(self):
        """測試 name 長度超過 50 字元 - 需求 1.7"""
        data = {
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
            "name": "A" * 51  # 51 字元
        }

        with pytest.raises(ValidationError) as exc_info:
            UserRegistrationRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("name",) and "1-50 字元" in err["msg"] for err in errors)

    def test_name_with_whitespace_trimmed(self):
        """測試 name 前後空白會被去除"""
        data = {
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
            "name": "  Vault Dweller  "
        }

        request = UserRegistrationRequest(**data)
        assert request.name == "Vault Dweller"  # 前後空白已去除

    def test_missing_required_field_email(self):
        """測試缺少必要欄位 email - 需求 1.7"""
        data = {
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
            "name": "Test User"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserRegistrationRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("email",) and err["type"] == "missing" for err in errors)

    def test_missing_required_field_password(self):
        """測試缺少必要欄位 password - 需求 1.7"""
        data = {
            "email": "test@example.com",
            "confirm_password": "SecurePass123!",
            "name": "Test User"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserRegistrationRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("password",) and err["type"] == "missing" for err in errors)

    def test_missing_required_field_name(self):
        """測試缺少必要欄位 name - 需求 1.7"""
        data = {
            "email": "test@example.com",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserRegistrationRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("name",) and err["type"] == "missing" for err in errors)


class TestUserLoginRequest:
    """測試 UserLoginRequest Pydantic 模型"""

    def test_valid_login_data(self):
        """測試有效的登入資料"""
        data = {
            "email": "user@example.com",
            "password": "SecurePass123!"
        }

        request = UserLoginRequest(**data)

        assert request.email == "user@example.com"
        assert request.password == "SecurePass123!"

    def test_invalid_email_format(self):
        """測試無效的 email 格式"""
        data = {
            "email": "invalid-email",
            "password": "SecurePass123!"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserLoginRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("email",) for err in errors)

    def test_password_empty(self):
        """測試密碼為空"""
        data = {
            "email": "user@example.com",
            "password": ""
        }

        with pytest.raises(ValidationError) as exc_info:
            UserLoginRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("password",) and "不能為空" in err["msg"] for err in errors)

    def test_password_whitespace_only(self):
        """測試密碼僅包含空白"""
        data = {
            "email": "user@example.com",
            "password": "   "
        }

        with pytest.raises(ValidationError) as exc_info:
            UserLoginRequest(**data)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("password",) and "不能為空" in err["msg"] for err in errors)
