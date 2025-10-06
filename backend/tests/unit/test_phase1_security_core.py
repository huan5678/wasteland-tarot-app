"""
Phase 1 Security Core Tests
測試密碼雜湊和基本安全功能
"""

import pytest
from app.core.security import get_password_hash, verify_password


class TestPasswordHashing:
    """測試密碼雜湊功能"""

    def test_password_hashing(self):
        """測試密碼可以被正確雜湊和驗證"""
        password = "test_password_123"
        hashed = get_password_hash(password)

        # 驗證雜湊值不等於原始密碼
        assert hashed != password

        # 驗證正確的密碼
        assert verify_password(password, hashed) is True

        # 驗證錯誤的密碼
        assert verify_password("wrong_password", hashed) is False

    def test_different_passwords_different_hashes(self):
        """測試不同密碼產生不同雜湊值"""
        password1 = "password1"
        password2 = "password2"

        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)

        assert hash1 != hash2

    def test_same_password_different_hashes(self):
        """測試相同密碼每次產生不同雜湊值（salt）"""
        password = "test_password"

        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # 由於 salt，雜湊值應該不同
        assert hash1 != hash2

        # 但兩個雜湊值都應該能驗證原始密碼
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True
