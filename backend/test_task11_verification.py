#!/usr/bin/env python3
"""
Task 11 驗證腳本

驗證註冊端點重構是否正確：
- UserRegistrationRequest 使用 email + password + confirm_password + name
- Pydantic 驗證：email 格式、密碼強度、name 長度、密碼確認
- register_user 端點呼叫 user_service.create_user(email, password, name)
- 自動登入並返回 JWT tokens
"""

import sys
import re
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

def test_registration_request_schema():
    """測試 UserRegistrationRequest schema"""
    from app.api.auth import UserRegistrationRequest
    from pydantic import ValidationError

    print("\n=== 測試 UserRegistrationRequest Schema ===")

    # Test 1: 有效的註冊請求
    try:
        valid_request = UserRegistrationRequest(
            email="test@example.com",
            password="ValidPassword123",
            confirm_password="ValidPassword123",
            name="Test User"
        )
        assert valid_request.email == "test@example.com"
        assert valid_request.password == "ValidPassword123"
        assert valid_request.name == "Test User"
        print("✅ 有效註冊請求驗證通過")
    except Exception as e:
        print(f"❌ 有效註冊請求驗證失敗: {e}")
        return False

    # Test 2: 無效 email 格式
    try:
        UserRegistrationRequest(
            email="invalid-email",
            password="Password123",
            confirm_password="Password123",
            name="Test"
        )
        print("❌ 無效 email 未被拒絕")
        return False
    except ValidationError:
        print("✅ 無效 email 正確拒絕")

    # Test 3: 密碼太短（< 8 字元）
    try:
        UserRegistrationRequest(
            email="test@example.com",
            password="Short1",
            confirm_password="Short1",
            name="Test"
        )
        print("❌ 短密碼未被拒絕")
        return False
    except ValidationError as e:
        if "至少 8 字元" in str(e):
            print("✅ 短密碼正確拒絕")
        else:
            print(f"❌ 錯誤訊息不正確: {e}")
            return False

    # Test 4: 密碼不相符
    try:
        UserRegistrationRequest(
            email="test@example.com",
            password="Password123",
            confirm_password="DifferentPassword456",
            name="Test"
        )
        print("❌ 密碼不相符未被拒絕")
        return False
    except ValidationError as e:
        if "不相符" in str(e):
            print("✅ 密碼不相符正確拒絕")
        else:
            print(f"❌ 錯誤訊息不正確: {e}")
            return False

    # Test 5: Name 為空
    try:
        UserRegistrationRequest(
            email="test@example.com",
            password="Password123",
            confirm_password="Password123",
            name=""
        )
        print("❌ 空 name 未被拒絕")
        return False
    except ValidationError as e:
        if "不能為空" in str(e):
            print("✅ 空 name 正確拒絕")
        else:
            print(f"❌ 錯誤訊息不正確: {e}")
            return False

    # Test 6: Name 太長（> 50 字元）
    try:
        UserRegistrationRequest(
            email="test@example.com",
            password="Password123",
            confirm_password="Password123",
            name="A" * 51
        )
        print("❌ 過長 name 未被拒絕")
        return False
    except ValidationError as e:
        if "1-50 字元" in str(e):
            print("✅ 過長 name 正確拒絕")
        else:
            print(f"❌ 錯誤訊息不正確: {e}")
            return False

    # Test 7: 檢查欄位定義
    schema = UserRegistrationRequest.model_json_schema()
    properties = schema.get("properties", {})

    required_fields = ["email", "password", "confirm_password", "name"]
    for field in required_fields:
        if field not in properties:
            print(f"❌ 缺少必要欄位: {field}")
            return False

    # 確認沒有 username 欄位
    if "username" in properties:
        print("❌ 不應該有 username 欄位")
        return False

    print("✅ UserRegistrationRequest schema 完整")

    return True


def test_register_endpoint_implementation():
    """測試 register_user 端點實作"""
    from app.api.auth import register_user
    import inspect

    print("\n=== 測試 register_user 端點實作 ===")

    # 讀取端點函式源碼
    source = inspect.getsource(register_user)

    # 檢查是否使用 UserService.create_user
    if "user_service.create_user" not in source:
        print("❌ 未呼叫 user_service.create_user")
        return False
    print("✅ 有呼叫 user_service.create_user")

    # 檢查是否傳遞 email 參數
    if "email=user_data.email" not in source:
        print("❌ 未傳遞 email 參數")
        return False
    print("✅ 有傳遞 email 參數")

    # 檢查是否傳遞 password 參數
    if "password=user_data.password" not in source:
        print("❌ 未傳遞 password 參數")
        return False
    print("✅ 有傳遞 password 參數")

    # 檢查是否傳遞 name 參數
    if "name=user_data.name" not in source:
        print("❌ 未傳遞 name 參數")
        return False
    print("✅ 有傳遞 name 參數")

    # 檢查是否自動登入
    if "auth_service.login_user" not in source:
        print("❌ 未實作自動登入")
        return False
    print("✅ 有實作自動登入")

    # 檢查是否返回 JWT tokens
    if "access_token" not in source or "refresh_token" not in source:
        print("❌ 未返回 JWT tokens")
        return False
    print("✅ 有返回 JWT tokens")

    # 檢查是否處理 UserAlreadyExistsError
    if "UserAlreadyExistsError" not in source:
        print("❌ 未處理 UserAlreadyExistsError")
        return False
    print("✅ 有處理 UserAlreadyExistsError")

    # 檢查是否使用 409 Conflict
    if "HTTP_409_CONFLICT" not in source and "409" not in source:
        print("⚠️  未使用 409 Conflict 狀態碼")
    else:
        print("✅ 使用 409 Conflict 狀態碼")

    return True


def test_user_service_integration():
    """測試 UserService.create_user 整合"""
    from app.services.user_service import UserService
    import inspect

    print("\n=== 測試 UserService.create_user 整合 ===")

    # 檢查 create_user 方法簽名
    sig = inspect.signature(UserService.create_user)
    params = list(sig.parameters.keys())

    if "email" not in params:
        print("❌ create_user 缺少 email 參數")
        return False
    print("✅ create_user 有 email 參數")

    if "password" not in params:
        print("❌ create_user 缺少 password 參數")
        return False
    print("✅ create_user 有 password 參數")

    if "name" not in params:
        print("❌ create_user 缺少 name 參數")
        return False
    print("✅ create_user 有 name 參數")

    # 檢查是否已移除 username 參數
    if "username" in params:
        print("❌ create_user 仍有 username 參數")
        return False
    print("✅ create_user 已移除 username 參數")

    # 讀取 create_user 源碼檢查驗證邏輯
    source = inspect.getsource(UserService.create_user)

    # 檢查 email 格式驗證
    if "email" in source and ("@" in source or "email_pattern" in source):
        print("✅ 有 email 格式驗證")
    else:
        print("⚠️  可能缺少 email 格式驗證")

    # 檢查 name 長度驗證
    if "name" in source and ("1-50" in source or "len(name)" in source):
        print("✅ 有 name 長度驗證")
    else:
        print("⚠️  可能缺少 name 長度驗證")

    # 檢查密碼強度驗證
    if "password" in source and ("8" in source or "len(password)" in source):
        print("✅ 有密碼強度驗證")
    else:
        print("⚠️  可能缺少密碼強度驗證")

    return True


def main():
    """執行所有驗證測試"""
    print("=" * 60)
    print("Task 11 驗證測試")
    print("=" * 60)

    results = []

    # 測試 1: Schema 驗證
    results.append(("UserRegistrationRequest Schema", test_registration_request_schema()))

    # 測試 2: 端點實作
    results.append(("register_user 端點實作", test_register_endpoint_implementation()))

    # 測試 3: UserService 整合
    results.append(("UserService 整合", test_user_service_integration()))

    # 總結
    print("\n" + "=" * 60)
    print("驗證結果總結")
    print("=" * 60)

    for name, result in results:
        status = "✅ 通過" if result else "❌ 失敗"
        print(f"{status} - {name}")

    all_passed = all(result for _, result in results)

    if all_passed:
        print("\n🎉 Task 11 所有驗證測試通過！")
        return 0
    else:
        print("\n⚠️  部分驗證測試失敗，請檢查上述錯誤")
        return 1


if __name__ == "__main__":
    sys.exit(main())
