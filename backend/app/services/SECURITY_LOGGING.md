# Security Event Logging 使用指南

## 概述

SecurityEventLogger 提供結構化的安全事件日誌記錄功能，專為 WebAuthn/Passkey 操作設計。

## 快速開始

```python
from app.services.security_logger import get_security_logger, SecurityEventType

# 取得 logger 實例（單例模式）
security_logger = get_security_logger()

# 記錄 Passkey 註冊成功
security_logger.log_event(
    event_type=SecurityEventType.PASSKEY_REGISTRATION,
    user_id=str(user.id),
    user_email=user.email,
    success=True,
    credential_id=credential.credential_id,
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent"),
    metadata={
        "is_first_passkey": True,
        "karma_awarded": 50,
        "authenticator_type": "platform"
    }
)
```

## 日誌事件類型

### 1. Passkey 註冊
```python
SecurityEventType.PASSKEY_REGISTRATION
```
- **用途**: 記錄 Passkey 註冊事件
- **日誌級別**: INFO (成功) / WARNING (失敗)
- **必要欄位**: user_id, user_email, credential_id, success

### 2. Passkey 登入
```python
SecurityEventType.PASSKEY_LOGIN
```
- **用途**: 記錄 Passkey 登入事件
- **日誌級別**: INFO (成功) / WARNING (失敗)
- **必要欄位**: user_id, user_email, credential_id, success

### 3. Credential 管理
```python
SecurityEventType.CREDENTIAL_ADDED     # 新增 Credential
SecurityEventType.CREDENTIAL_UPDATED   # 更新 Credential
SecurityEventType.CREDENTIAL_DELETED   # 刪除 Credential
```
- **日誌級別**: INFO (成功) / WARNING (失敗)

### 4. 安全警報
```python
SecurityEventType.COUNTER_ERROR          # Counter 回歸錯誤（重放攻擊）
SecurityEventType.AUTHENTICATION_FAILED  # 驗證失敗
SecurityEventType.CHALLENGE_EXPIRED      # Challenge 過期
```
- **日誌級別**: CRITICAL (Counter Error) / WARNING (其他)

## 日誌格式

所有日誌使用 **結構化 JSON 格式**：

```json
{
  "timestamp": "2025-10-27T12:00:00Z",
  "event_type": "passkey_registration",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "ip_address": "192.168.1.1",
  "user_agent": "Chrome/120.0.0.0",
  "success": true,
  "credential_id": "credential-id-tr",
  "metadata": {
    "is_first_passkey": true,
    "karma_awarded": 50,
    "authenticator_type": "platform"
  }
}
```

## 安全特性

### 1. 敏感資訊過濾
- **Credential ID 截斷**: 只記錄前 16 個字元
- **Metadata 過濾**: 自動移除 `private_key`, `password`, `api_key`, `token`, `secret` 等欄位

```python
# 這些欄位會被自動過濾
metadata = {
    "private_key": "WILL-BE-FILTERED",
    "password": "WILL-BE-FILTERED",
    "authenticator_type": "platform"  # ✅ 保留
}
```

### 2. Email 遮罩（可選）
```python
security_logger.log_event(
    event_type=SecurityEventType.AUTHENTICATION_FAILED,
    user_email="testuser@example.com",
    success=False,
    mask_email=True  # 啟用 email 遮罩
)
# 結果: "t***r@example.com"
```

### 3. 日誌級別映射
- **INFO**: 成功的操作（註冊、登入、管理）
- **WARNING**: 失敗的操作（驗證失敗、Challenge 過期）
- **CRITICAL**: 安全警報（Counter 錯誤、可能的重放攻擊）

## 整合範例

### 在 API 端點中使用

```python
# app/api/webauthn.py
from app.services.security_logger import get_security_logger, SecurityEventType

security_logger = get_security_logger()

@router.post("/register-new/verify")
async def verify_new_user_registration(request: Request, ...):
    try:
        user, credential = service.register_new_user_with_passkey(...)

        # 記錄成功事件
        security_logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_id=str(user.id),
            user_email=user.email,
            success=True,
            credential_id=credential.credential_id,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={
                "is_first_passkey": True,
                "karma_awarded": 50
            }
        )

        return {...}

    except Exception as e:
        # 記錄失敗事件
        security_logger.log_event(
            event_type=SecurityEventType.PASSKEY_REGISTRATION,
            user_email=body.email,
            success=False,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            error=str(e),
            exception=e
        )
        raise
```

### 記錄 Counter 錯誤（安全警報）

```python
# Counter 回歸偵測到，記錄 CRITICAL 級別日誌
security_logger.log_event(
    event_type=SecurityEventType.COUNTER_ERROR,
    user_id=str(user.id),
    user_email=user.email,
    success=False,
    credential_id=credential.credential_id,
    error="Counter regression detected",
    metadata={
        "expected_counter": 100,
        "received_counter": 50,
        "alert_level": "HIGH"
    }
)
```

## 日誌查詢

### 使用現有日誌系統

所有日誌整合到 `app/core/logging_config.py`：

```python
# 日誌檔案位置
logs/app.log         # 一般日誌（INFO+）
logs/error.log       # 錯誤日誌（ERROR+）
logs/performance.log # 效能日誌
```

### 查詢範例

```bash
# 查詢所有 Passkey 註冊事件
grep "passkey_registration" logs/app.log

# 查詢失敗的登入嘗試
grep "passkey_login.*success.*false" logs/app.log

# 查詢 Counter 錯誤（安全警報）
grep "counter_error" logs/error.log

# 查詢特定使用者的所有事件
grep "user-123" logs/app.log | jq 'select(.event_type)'
```

## 統計分析（簡化版）

基於日誌的統計查詢：

```bash
# Passkey 註冊數量
grep "passkey_registration.*success.*true" logs/app.log | wc -l

# Passkey 登入數量
grep "passkey_login.*success.*true" logs/app.log | wc -l

# 失敗的驗證嘗試
grep "authentication_failed" logs/app.log | wc -l

# Counter 錯誤數量（安全警報）
grep "counter_error" logs/error.log | wc -l
```

## 測試

測試檔案位置: `tests/unit/services/test_security_logger.py`

```bash
# 執行測試
pytest tests/unit/services/test_security_logger.py -v

# 測試覆蓋率: 94%
# 21 個測試全部通過
```

## 最佳實踐

1. **總是記錄安全事件**: 所有 WebAuthn 操作都應該記錄
2. **記錄失敗事件**: 失敗比成功更重要，有助於偵測攻擊
3. **包含 Context**: IP、User Agent、Metadata 有助於事後分析
4. **保護隱私**: 使用 `mask_email=True` 遮罩敏感資訊
5. **異步處理**: 日誌記錄不應阻塞主流程

## 監控與告警

### 建議的告警規則

1. **Counter Error**: 立即告警（可能的重放攻擊）
2. **連續失敗**: 5 分鐘內同一 IP 超過 10 次失敗
3. **異常註冊**: 短時間內大量新用戶註冊
4. **Challenge 過期率**: 過期率超過 30% 表示 UX 問題

### 整合 Sentry（可選）

```python
# app/services/security_logger.py
import sentry_sdk

# 在 Counter Error 時通知 Sentry
if event_type == SecurityEventType.COUNTER_ERROR:
    sentry_sdk.capture_message(
        "Counter Regression Detected",
        level="critical",
        extra=log_data
    )
```

## 相關文件

- **測試**: `tests/unit/services/test_security_logger.py`
- **實作**: `app/services/security_logger.py`
- **整合**: `app/api/webauthn.py`
- **日誌配置**: `app/core/logging_config.py`
- **Task**: `.kiro/specs/passkey-authentication/tasks.md` (Stage 14)

## License

© 2025 Wasteland Tarot. All rights reserved.
