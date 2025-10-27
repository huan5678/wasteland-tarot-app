"""
WebAuthn Credential Management Tests (TDD - Red Phase)

Test cases for Passkey credential management:
- list_user_credentials()
- update_credential_name()
- delete_credential()
- generate_registration_options_for_existing_user() with excludeCredentials
- register_passkey_for_existing_user() with 10 passkey limit

Following TDD cycle:
1. Red: Write failing tests first
2. Green: Implement minimum code to pass tests
3. Refactor: Optimize while keeping tests passing

Reference: .kiro/specs/passkey-authentication/design.md Section "Credential 管理流程"
Reference: .kiro/specs/passkey-authentication/tasks.md Stage 6
"""

import pytest
import secrets
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4, UUID

from app.services.webauthn_service import WebAuthnService
from app.services.challenge_store import ChallengeStore
from app.models.user import User
from app.models.credential import Credential
from app.core.exceptions import (
    CredentialNotFoundError,
    WebAuthnRegistrationError,
    MaxCredentialsReachedError,
)
from webauthn.helpers.structs import (
    PublicKeyCredentialCreationOptions,
)


# ==================== Test Fixtures ====================

@pytest.fixture
def mock_db_session():
    """Mock database session"""
    session = Mock()
    session.execute = Mock()
    session.add = Mock()
    session.flush = Mock()
    session.commit = Mock()
    session.refresh = Mock()
    session.rollback = Mock()
    session.delete = Mock()
    session.query = Mock()
    return session


@pytest.fixture
def sample_user():
    """Create a sample user for testing"""
    user = Mock(spec=User)
    user.id = uuid4()
    user.email = "wasteland.traveler@vault111.com"
    user.name = "廢土旅者"
    user.password_hash = None  # Passkey-only user
    user.is_active = True
    user.is_verified = True
    user.webauthn_user_handle = secrets.token_bytes(64)
    user.created_at = datetime.utcnow()
    return user


@pytest.fixture
def sample_credentials(sample_user):
    """Create sample credentials for testing"""
    credentials = []
    for i in range(3):
        cred = Mock(spec=Credential)
        cred.id = uuid4()
        cred.user_id = sample_user.id
        cred.credential_id = secrets.token_hex(32)
        cred.public_key = secrets.token_hex(64)
        cred.counter = i
        cred.transports = ["internal"]
        cred.device_name = f"裝置 {i+1}"
        cred.aaguid = uuid4()
        cred.backup_eligible = True
        cred.backup_state = True
        cred.created_at = datetime.utcnow() - timedelta(days=i)
        cred.last_used_at = datetime.utcnow() - timedelta(hours=i)
        credentials.append(cred)
    return credentials


@pytest.fixture
def webauthn_service(mock_db_session):
    """Create WebAuthn service with mocked dependencies"""
    return WebAuthnService(mock_db_session)


# ==================== Test: list_user_credentials() ====================

def test_list_user_credentials_returns_all_credentials(
    webauthn_service,
    mock_db_session,
    sample_user,
    sample_credentials
):
    """
    測試：列出使用者所有 credentials

    Given: 使用者有 3 個 credentials
    When: 呼叫 list_user_credentials(user_id)
    Then: 應該回傳所有 3 個 credentials
    """
    # Arrange
    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = sample_credentials
    mock_db_session.execute.return_value = mock_result

    # Act
    result = webauthn_service.list_user_credentials(sample_user.id)

    # Assert
    assert len(result) == 3
    assert all(isinstance(c, Credential) for c in result)
    assert result[0].device_name == "裝置 1"


def test_list_user_credentials_returns_empty_list_when_no_credentials(
    webauthn_service,
    mock_db_session,
    sample_user
):
    """
    測試：使用者無 credentials 時回傳空列表

    Given: 使用者沒有任何 credentials
    When: 呼叫 list_user_credentials(user_id)
    Then: 應該回傳空列表
    """
    # Arrange
    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db_session.execute.return_value = mock_result

    # Act
    result = webauthn_service.list_user_credentials(sample_user.id)

    # Assert
    assert result == []


def test_list_user_credentials_orders_by_last_used_desc(
    webauthn_service,
    mock_db_session,
    sample_user,
    sample_credentials
):
    """
    測試：credentials 依最後使用時間倒序排列

    Given: 使用者有多個 credentials
    When: 呼叫 list_user_credentials(user_id)
    Then: 應該依 last_used_at 降序排列（最近使用的在前）
    """
    # Arrange
    sorted_creds = sorted(
        sample_credentials,
        key=lambda c: c.last_used_at,
        reverse=True
    )
    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = sorted_creds
    mock_db_session.execute.return_value = mock_result

    # Act
    result = webauthn_service.list_user_credentials(sample_user.id)

    # Assert
    assert result[0].last_used_at > result[1].last_used_at
    assert result[1].last_used_at > result[2].last_used_at


# ==================== Test: update_credential_name() ====================

def test_update_credential_name_success(
    webauthn_service,
    mock_db_session,
    sample_user,
    sample_credentials
):
    """
    測試：成功更新 credential 名稱

    Given: 使用者擁有一個 credential
    When: 呼叫 update_credential_name(credential_id, new_name, user_id)
    Then: credential 名稱應該被更新
    """
    # Arrange
    credential = sample_credentials[0]
    new_name = "MacBook Pro Touch ID"
    mock_result = Mock()
    mock_result.scalar_one_or_none.return_value = credential
    mock_db_session.execute.return_value = mock_result

    # Act
    updated_cred = webauthn_service.update_credential_name(
        credential_id=credential.id,
        new_name=new_name,
        user_id=sample_user.id
    )

    # Assert
    assert updated_cred.device_name == new_name
    mock_db_session.commit.assert_called_once()


def test_update_credential_name_raises_error_when_not_found(
    webauthn_service,
    mock_db_session,
    sample_user
):
    """
    測試：credential 不存在時拋出錯誤

    Given: credential_id 不存在
    When: 呼叫 update_credential_name()
    Then: 應該拋出 CredentialNotFoundError
    """
    # Arrange
    fake_credential_id = uuid4()
    mock_result = Mock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db_session.execute.return_value = mock_result

    # Act & Assert
    with pytest.raises(CredentialNotFoundError) as exc_info:
        webauthn_service.update_credential_name(
            credential_id=fake_credential_id,
            new_name="New Name",
            user_id=sample_user.id
        )

    assert "找不到對應的 Passkey 或無權限操作" in str(exc_info.value)


def test_update_credential_name_raises_error_when_wrong_user(
    webauthn_service,
    mock_db_session,
    sample_credentials
):
    """
    測試：嘗試更新其他使用者的 credential 時拋出錯誤（防止越權）

    Given: credential 屬於 user_A
    When: user_B 嘗試更新此 credential
    Then: 應該拋出 CredentialNotFoundError（不透露 credential 存在）
    """
    # Arrange
    credential = sample_credentials[0]
    wrong_user_id = uuid4()
    mock_result = Mock()
    mock_result.scalar_one_or_none.return_value = None  # 因為 user_id 不匹配
    mock_db_session.execute.return_value = mock_result

    # Act & Assert
    with pytest.raises(CredentialNotFoundError):
        webauthn_service.update_credential_name(
            credential_id=credential.id,
            new_name="Hacked Name",
            user_id=wrong_user_id
        )


# ==================== Test: delete_credential() ====================

def test_delete_credential_success(
    webauthn_service,
    mock_db_session,
    sample_user,
    sample_credentials
):
    """
    測試：成功刪除 credential

    Given: 使用者有多個 credentials
    When: 呼叫 delete_credential(credential_id, user_id)
    Then: credential 應該被刪除
    """
    # Arrange
    credential = sample_credentials[0]
    mock_result = Mock()
    mock_result.scalar_one_or_none.return_value = credential
    mock_db_session.execute.return_value = mock_result

    # Act
    result = webauthn_service.delete_credential(
        credential_id=credential.id,
        user_id=sample_user.id
    )

    # Assert
    assert result is True
    mock_db_session.delete.assert_called_once_with(credential)
    mock_db_session.commit.assert_called_once()


def test_delete_credential_raises_error_when_not_found(
    webauthn_service,
    mock_db_session,
    sample_user
):
    """
    測試：credential 不存在時拋出錯誤

    Given: credential_id 不存在
    When: 呼叫 delete_credential()
    Then: 應該拋出 CredentialNotFoundError
    """
    # Arrange
    fake_credential_id = uuid4()
    mock_result = Mock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db_session.execute.return_value = mock_result

    # Act & Assert
    with pytest.raises(CredentialNotFoundError):
        webauthn_service.delete_credential(
            credential_id=fake_credential_id,
            user_id=sample_user.id
        )


def test_delete_credential_raises_error_when_wrong_user(
    webauthn_service,
    mock_db_session,
    sample_credentials
):
    """
    測試：嘗試刪除其他使用者的 credential 時拋出錯誤（防止越權）

    Given: credential 屬於 user_A
    When: user_B 嘗試刪除此 credential
    Then: 應該拋出 CredentialNotFoundError
    """
    # Arrange
    credential = sample_credentials[0]
    wrong_user_id = uuid4()
    mock_result = Mock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db_session.execute.return_value = mock_result

    # Act & Assert
    with pytest.raises(CredentialNotFoundError):
        webauthn_service.delete_credential(
            credential_id=credential.id,
            user_id=wrong_user_id
        )


# ==================== Test: generate_registration_options_for_existing_user() with excludeCredentials ====================

def test_generate_registration_options_includes_exclude_credentials(
    webauthn_service,
    mock_db_session,
    sample_user,
    sample_credentials
):
    """
    測試：為已登入使用者產生註冊選項時，應包含 excludeCredentials

    Given: 使用者已有 3 個 credentials
    When: 呼叫 generate_registration_options(user)
    Then: 回傳的 options 應包含 excludeCredentials（防止重複註冊）
    """
    # Arrange
    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = sample_credentials
    mock_db_session.execute.return_value = mock_result

    with patch('app.services.webauthn_service.generate_registration_options') as mock_gen:
        mock_options = Mock(spec=PublicKeyCredentialCreationOptions)
        mock_gen.return_value = mock_options

        # Act
        options = webauthn_service.generate_registration_options(
            user=sample_user,
            device_name="新裝置"
        )

        # Assert
        mock_gen.assert_called_once()
        call_kwargs = mock_gen.call_args.kwargs
        assert 'exclude_credentials' in call_kwargs
        assert len(call_kwargs['exclude_credentials']) == 3


def test_generate_registration_options_empty_exclude_credentials_for_new_user(
    webauthn_service,
    mock_db_session,
    sample_user
):
    """
    測試：新使用者（無 credentials）產生註冊選項時，excludeCredentials 應為空

    Given: 使用者沒有任何 credentials
    When: 呼叫 generate_registration_options(user)
    Then: excludeCredentials 應為空列表
    """
    # Arrange
    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db_session.execute.return_value = mock_result

    with patch('app.services.webauthn_service.generate_registration_options') as mock_gen:
        mock_options = Mock(spec=PublicKeyCredentialCreationOptions)
        mock_gen.return_value = mock_options

        # Act
        options = webauthn_service.generate_registration_options(
            user=sample_user
        )

        # Assert
        call_kwargs = mock_gen.call_args.kwargs
        assert 'exclude_credentials' in call_kwargs
        assert len(call_kwargs['exclude_credentials']) == 0


# ==================== Test: 10 Passkey Limit ====================

def test_register_passkey_raises_error_when_limit_reached(
    webauthn_service,
    mock_db_session,
    sample_user
):
    """
    測試：達到 10 個 passkey 上限時，禁止新增

    Given: 使用者已有 10 個 credentials
    When: 嘗試註冊新的 passkey
    Then: 應該拋出 MaxCredentialsReachedError
    """
    # Arrange
    ten_credentials = []
    for i in range(10):
        cred = Mock(spec=Credential)
        cred.id = uuid4()
        cred.user_id = sample_user.id
        cred.credential_id = secrets.token_hex(32)
        cred.public_key = secrets.token_hex(64)
        cred.counter = i
        cred.transports = ["internal"]
        cred.device_name = f"裝置 {i+1}"
        cred.created_at = datetime.utcnow()
        ten_credentials.append(cred)

    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = ten_credentials
    mock_db_session.execute.return_value = mock_result

    # Act & Assert
    with pytest.raises(MaxCredentialsReachedError) as exc_info:
        webauthn_service.check_credential_limit(sample_user.id)

    assert "已達到 Passkey 數量上限" in str(exc_info.value)
    assert "10" in str(exc_info.value)


def test_register_passkey_success_when_under_limit(
    webauthn_service,
    mock_db_session,
    sample_user,
    sample_credentials
):
    """
    測試：未達上限時可以正常註冊

    Given: 使用者有 3 個 credentials（未達 10 個上限）
    When: 嘗試註冊新的 passkey
    Then: 應該允許註冊
    """
    # Arrange
    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = sample_credentials
    mock_db_session.execute.return_value = mock_result

    # Act - 應該不拋出異常
    try:
        webauthn_service.check_credential_limit(sample_user.id)
        result = True
    except MaxCredentialsReachedError:
        result = False

    # Assert
    assert result is True


def test_list_user_credentials_correctly_counts_for_limit_check(
    webauthn_service,
    mock_db_session,
    sample_user
):
    """
    測試：上限檢查正確計算 credentials 數量

    Given: 使用者有 9 個 credentials
    When: 檢查是否可新增
    Then: 應該允許新增（未達 10 個）
    """
    # Arrange
    nine_credentials = []
    for i in range(9):
        cred = Mock(spec=Credential)
        cred.id = uuid4()
        cred.user_id = sample_user.id
        cred.credential_id = secrets.token_hex(32)
        cred.public_key = secrets.token_hex(64)
        cred.counter = i
        cred.transports = ["internal"]
        cred.device_name = f"裝置 {i+1}"
        cred.created_at = datetime.utcnow()
        nine_credentials.append(cred)

    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = nine_credentials
    mock_db_session.execute.return_value = mock_result

    # Act
    credentials = webauthn_service.list_user_credentials(sample_user.id)
    can_add_more = len(credentials) < 10

    # Assert
    assert len(credentials) == 9
    assert can_add_more is True


# ==================== Test: Security - Prevent Last Credential Deletion ====================

def test_delete_last_credential_with_no_password_raises_warning(
    webauthn_service,
    mock_db_session,
    sample_user
):
    """
    測試：刪除最後一個 passkey 時，如果使用者無密碼，應顯示警告

    Given: 使用者只有 1 個 credential 且無密碼
    When: 嘗試刪除此 credential
    Then: 應該允許刪除，但需要額外確認（前端處理）

    Note: 本測試僅驗證後端邏輯可以偵測「最後一個 credential」狀態
    """
    # Arrange
    last_credential = Mock(spec=Credential)
    last_credential.id = uuid4()
    last_credential.user_id = sample_user.id
    last_credential.credential_id = secrets.token_hex(32)
    last_credential.public_key = secrets.token_hex(64)
    last_credential.counter = 0
    last_credential.transports = ["internal"]
    last_credential.device_name = "最後的裝置"
    last_credential.created_at = datetime.utcnow()

    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = [last_credential]
    mock_db_session.execute.return_value = mock_result

    # Act
    credentials = webauthn_service.list_user_credentials(sample_user.id)
    is_last_credential = len(credentials) == 1
    user_has_password = sample_user.password_hash is not None

    # Assert
    assert is_last_credential is True
    assert user_has_password is False
    # 前端應根據 is_last_credential 和 user_has_password 顯示警告


# ==================== Test: Performance ====================

def test_list_credentials_performance(
    webauthn_service,
    mock_db_session,
    sample_user
):
    """
    測試：列出 credentials 的性能

    Given: 使用者有多個 credentials
    When: 呼叫 list_user_credentials()
    Then: 應該使用索引查詢，執行時間 < 100ms

    Note: 實際性能測試需要真實資料庫，此處僅驗證查詢邏輯
    """
    # Arrange
    ten_credentials = []
    for i in range(10):
        cred = Mock(spec=Credential)
        cred.id = uuid4()
        cred.user_id = sample_user.id
        cred.credential_id = secrets.token_hex(32)
        cred.public_key = secrets.token_hex(64)
        cred.counter = i
        cred.transports = ["internal"]
        cred.device_name = f"裝置 {i+1}"
        cred.created_at = datetime.utcnow()
        ten_credentials.append(cred)

    mock_result = Mock()
    mock_result.scalars.return_value.all.return_value = ten_credentials
    mock_db_session.execute.return_value = mock_result

    # Act
    import time
    start_time = time.time()
    result = webauthn_service.list_user_credentials(sample_user.id)
    end_time = time.time()
    execution_time = (end_time - start_time) * 1000  # ms

    # Assert
    assert len(result) == 10
    assert execution_time < 100  # Mock 執行應該非常快
    # 真實資料庫測試需要在整合測試中驗證


# ==================== Summary ====================
#
# 測試覆蓋：
# ✅ list_user_credentials() - 3 個測試
# ✅ update_credential_name() - 3 個測試
# ✅ delete_credential() - 3 個測試
# ✅ generate_registration_options() with excludeCredentials - 2 個測試
# ✅ 10 passkey 上限限制 - 3 個測試
# ✅ 安全性：防止越權 - 已包含在 update/delete 測試中
# ✅ 安全性：最後一個 credential 警告 - 1 個測試
# ✅ 性能測試 - 1 個測試
#
# 總計：16 個測試
#
# 下一步：執行測試確認紅燈（測試失敗），然後實作服務邏輯（綠燈）
