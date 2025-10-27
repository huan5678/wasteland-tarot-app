"""
WebAuthn Counter Validation Tests
Tests for credential counter validation to prevent replay attacks and cloning.

Counter validation is a critical security mechanism in WebAuthn:
1. Prevents replay attacks by ensuring each authentication is unique
2. Detects credential cloning by monitoring counter progression
3. Enforces monotonic counter increase requirement
"""

import pytest
import logging
from uuid import uuid4
from datetime import datetime

from app.models.credential import Credential
from app.core.exceptions import CounterError


# ==========================================
# Fixtures
# ==========================================

@pytest.fixture
async def test_user(db_session):
    """
    Create a single test user for all counter validation tests
    """
    from app.models.user import User

    user = User(
        id=uuid4(),
        email=f"test_counter_{uuid4().hex[:8]}@wasteland.vault",
        name=f"TestUser_{uuid4().hex[:6]}",
        password_hash="$2b$12$hashed_password_placeholder",
        karma_score=50
    )
    db_session.add(user)
    await db_session.flush()

    return user


@pytest.fixture
def credential_factory(db_session, test_user):
    """
    Factory fixture for creating Credential instances
    """
    async def _create_credential(counter: int = 0):
        # Create credential for the shared test user
        credential = Credential(
            id=uuid4(),
            user_id=test_user.id,
            credential_id=f"cred_{uuid4().hex}",
            public_key="mock_public_key_base64",
            counter=counter,
            transports=["internal"],
            device_name="Test Device",
            backup_eligible=True,
            backup_state=False
        )
        db_session.add(credential)
        await db_session.flush()

        return credential

    return _create_credential


# ==========================================
# Test Cases: Normal Counter Increment
# ==========================================

@pytest.mark.asyncio
async def test_counter_increment_success(credential_factory, db_session):
    """
    測試 counter 正常遞增時驗證通過

    Given: 一個 counter = 10 的 credential
    When: 更新 counter 為 11（遞增）
    Then: counter 應成功更新為 11
    """
    # Arrange
    credential = await credential_factory(counter=10)

    # Act
    result = credential.increment_counter(11)
    await db_session.commit()

    # Assert
    assert result is True, "increment_counter should return True on success"
    assert credential.counter == 11, f"Counter should be 11, got {credential.counter}"


@pytest.mark.asyncio
async def test_counter_large_jump_allowed(credential_factory, db_session):
    """
    測試 counter 大幅跳躍（但仍遞增）是允許的

    Given: 一個 counter = 10 的 credential
    When: counter 跳到 1000（可能用戶在其他地方使用了很多次）
    Then: counter 應成功更新為 1000
    """
    # Arrange
    credential = await credential_factory(counter=10)

    # Act
    result = credential.increment_counter(1000)
    await db_session.commit()

    # Assert
    assert result is True
    assert credential.counter == 1000, f"Counter should be 1000, got {credential.counter}"


@pytest.mark.asyncio
async def test_counter_from_zero(credential_factory, db_session):
    """
    測試從 counter=0 開始遞增

    Given: 一個新建立的 credential，counter = 0
    When: 第一次使用，counter 更新為 1
    Then: counter 應成功更新為 1
    """
    # Arrange
    credential = await credential_factory(counter=0)

    # Act
    result = credential.increment_counter(1)
    await db_session.commit()

    # Assert
    assert result is True
    assert credential.counter == 1, f"Counter should be 1, got {credential.counter}"


# ==========================================
# Test Cases: Counter Regression (Security Threat)
# ==========================================

@pytest.mark.asyncio
async def test_counter_regression_raises_error(credential_factory, db_session):
    """
    測試 counter 減少時拋出 CounterError 異常

    Given: 一個 counter = 10 的 credential
    When: 嘗試將 counter 設為 9（減少）
    Then: 應拋出 CounterError 異常，且 counter 不應改變
    """
    # Arrange
    credential = await credential_factory(counter=10)
    original_counter = credential.counter

    # Act & Assert
    with pytest.raises(CounterError) as exc_info:
        credential.increment_counter(9)

    # Verify Fallout-themed error message
    error_message = str(exc_info.value.message)
    assert any(keyword in error_message for keyword in ["時間扭曲", "Counter", "複製", "安全鎖"]), \
        f"Error message should contain Fallout-themed keywords: {error_message}"

    # Verify counter unchanged
    assert credential.counter == original_counter, \
        f"Counter should remain {original_counter}, got {credential.counter}"


@pytest.mark.asyncio
async def test_counter_unchanged_raises_error(credential_factory, db_session):
    """
    測試 counter 不變時拋出 CounterError 異常

    Given: 一個 counter = 10 的 credential
    When: 嘗試將 counter 設為 10（不變）
    Then: 應拋出 CounterError 異常（可能的重放攻擊）
    """
    # Arrange
    credential = await credential_factory(counter=10)
    original_counter = credential.counter

    # Act & Assert
    with pytest.raises(CounterError) as exc_info:
        credential.increment_counter(10)

    # Verify error message mentions counter anomaly
    error_message = str(exc_info.value.message)
    assert any(keyword in error_message for keyword in ["未遞增", "複製", "時間扭曲", "Counter"]), \
        f"Error message should mention counter anomaly: {error_message}"

    # Verify counter unchanged
    assert credential.counter == original_counter


# ==========================================
# Test Cases: Security Alert Logging
# ==========================================

@pytest.mark.asyncio
async def test_counter_anomaly_logs_security_alert(credential_factory, db_session, caplog):
    """
    測試 counter 異常時記錄安全警報

    Given: 一個 counter = 10 的 credential
    When: 嘗試 counter 回歸（9）
    Then: 應記錄 WARNING 或 ERROR 級別的安全警報
    """
    # Arrange
    caplog.set_level(logging.WARNING)
    credential = await credential_factory(counter=10)

    # Act
    with pytest.raises(CounterError):
        credential.increment_counter(9)

    # Assert: Check security alert was logged
    security_logs = [record for record in caplog.records
                     if record.levelname in ["WARNING", "ERROR"]]

    assert len(security_logs) > 0, "Should log at least one security alert"

    # Verify log content
    log_messages = [record.message for record in security_logs]
    assert any("Counter regression" in msg or "counter" in msg.lower()
               for msg in log_messages), \
        f"Log should mention counter regression. Got: {log_messages}"


@pytest.mark.asyncio
async def test_counter_anomaly_includes_credential_details(credential_factory, db_session, caplog):
    """
    測試 counter 異常日誌包含 credential 詳細資訊

    Given: 一個 credential
    When: 發生 counter 異常
    Then: 日誌應包含 credential ID、預期值、實際值等資訊
    """
    # Arrange
    caplog.set_level(logging.WARNING)
    credential = await credential_factory(counter=10)
    credential_id = str(credential.id)

    # Act
    with pytest.raises(CounterError):
        credential.increment_counter(9)

    # Assert: Check log includes credential details
    security_logs = [record for record in caplog.records
                     if record.levelname in ["WARNING", "ERROR"]]

    assert len(security_logs) > 0

    log_messages = " ".join([record.message for record in security_logs])

    # Should include credential ID
    assert credential_id in log_messages or "credential" in log_messages.lower(), \
        "Log should include credential identifier"

    # Should include counter values
    assert "10" in log_messages and "9" in log_messages, \
        "Log should include expected and actual counter values"


# ==========================================
# Test Cases: Database Rollback
# ==========================================

@pytest.mark.asyncio
async def test_counter_error_triggers_rollback(credential_factory, db_session):
    """
    測試 counter 錯誤時資料庫操作會 rollback

    Given: 一個 counter = 10 的 credential
    When: 嘗試無效的 counter 更新並觸發錯誤
    Then: 資料庫應 rollback，counter 不應改變
    """
    # Arrange
    credential = await credential_factory(counter=10)
    original_counter = credential.counter
    credential_id = credential.id

    # Act
    try:
        credential.increment_counter(9)
        await db_session.commit()
        pytest.fail("Should have raised CounterError")
    except CounterError:
        await db_session.rollback()

    # Assert: Re-query credential to verify rollback
    await db_session.refresh(credential)
    assert credential.counter == original_counter, \
        f"Counter should remain {original_counter} after rollback, got {credential.counter}"


# ==========================================
# Test Cases: Update Last Used Timestamp
# ==========================================

@pytest.mark.asyncio
async def test_update_last_used_timestamp(credential_factory, db_session):
    """
    測試 update_last_used() 方法正確更新時間戳

    Given: 一個 credential，last_used_at = None
    When: 呼叫 update_last_used()
    Then: last_used_at 應更新為當前時間
    """
    # Arrange
    credential = await credential_factory(counter=0)
    assert credential.last_used_at is None, "last_used_at should initially be None"

    # Act
    credential.update_last_used()
    await db_session.commit()

    # Assert
    assert credential.last_used_at is not None, "last_used_at should be updated"
    assert isinstance(credential.last_used_at, datetime), \
        f"last_used_at should be datetime, got {type(credential.last_used_at)}"

    # Should be recent (within last 5 seconds)
    time_diff = (datetime.utcnow() - credential.last_used_at).total_seconds()
    assert time_diff < 5, f"last_used_at should be recent, time_diff: {time_diff}s"


@pytest.mark.asyncio
async def test_counter_and_timestamp_update_together(credential_factory, db_session):
    """
    測試 counter 和 last_used_at 可以同時更新（模擬登入流程）

    Given: 一個 credential
    When: 更新 counter 並呼叫 update_last_used()
    Then: 兩者都應成功更新
    """
    # Arrange
    credential = await credential_factory(counter=5)

    # Act
    credential.increment_counter(6)
    credential.update_last_used()
    await db_session.commit()

    # Assert
    assert credential.counter == 6
    assert credential.last_used_at is not None

    time_diff = (datetime.utcnow() - credential.last_used_at).total_seconds()
    assert time_diff < 5


# ==========================================
# Parametrized Tests
# ==========================================

@pytest.mark.asyncio
@pytest.mark.parametrize("name,old_counter,new_counter,should_succeed", [
    ("increment_by_1", 10, 11, True),
    ("increment_by_100", 10, 110, True),
    ("same_counter", 10, 10, False),
    ("decrement", 10, 9, False),
    ("zero_to_one", 0, 1, True),
    ("large_jump", 10, 10000, True),
])
async def test_counter_validation_scenarios(
    name, old_counter, new_counter, should_succeed,
    credential_factory, db_session
):
    """
    參數化測試：各種 counter 驗證場景

    Tests multiple counter validation scenarios with different combinations
    of old and new counter values.
    """
    # Arrange
    credential = await credential_factory(counter=old_counter)

    # Act & Assert
    if should_succeed:
        # Should succeed
        result = credential.increment_counter(new_counter)
        await db_session.commit()

        assert result is True, f"[{name}] Should succeed"
        assert credential.counter == new_counter, \
            f"[{name}] Counter should be {new_counter}, got {credential.counter}"
    else:
        # Should fail with CounterError
        with pytest.raises(CounterError):
            credential.increment_counter(new_counter)

        # Counter should remain unchanged
        assert credential.counter == old_counter, \
            f"[{name}] Counter should remain {old_counter}, got {credential.counter}"
