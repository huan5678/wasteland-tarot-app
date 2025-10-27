# WebAuthn 錯誤處理使用指南

## 目錄

- [概述](#概述)
- [後端錯誤處理](#後端錯誤處理)
- [前端錯誤處理](#前端錯誤處理)
- [整合範例](#整合範例)
- [Fallout 風格錯誤代碼](#fallout-風格錯誤代碼)

## 概述

本專案實作了完整的 WebAuthn 錯誤處理機制，整合 Fallout 主題錯誤訊息，提供統一的錯誤回應格式和使用者友善的降級 UI。

### 核心特性

- **統一錯誤格式**: 所有 API 錯誤都回傳一致的 JSON 格式
- **Fallout 主題訊息**: 錯誤訊息使用 Pip-Boy、避難所、廢土等主題詞彙
- **自動重試機制**: 可重試的錯誤會自動重試（最多 3 次）
- **Timeout 保護**: WebAuthn 操作預設 5 分鐘 timeout
- **降級 UI**: 瀏覽器不支援時顯示友善的降級介面
- **安全日誌**: Counter 錯誤記錄為 CRITICAL 級別安全警報

---

## 後端錯誤處理

### 統一錯誤回應格式

所有 API 錯誤都回傳以下格式：

```json
{
  "success": false,
  "error": {
    "code": "WEBAUTHN_REGISTRATION_ERROR",
    "message": "[Pip-Boy 錯誤] 生物辨識註冊失敗，請確認 Pip-Boy 功能正常",
    "details": {},
    "timestamp": "2025-10-27T12:00:00Z"
  }
}
```

### 錯誤處理器註冊

在 `main.py` 中註冊錯誤處理器：

```python
from fastapi import FastAPI
from app.middleware.error_handler import register_error_handlers

app = FastAPI()

# 註冊統一錯誤處理器
register_error_handlers(app)
```

### 自訂異常類別

使用 `WastelandTarotException` 基礎類別建立自訂異常：

```python
from app.core.exceptions import WastelandTarotException

class CustomError(WastelandTarotException):
    def __init__(self):
        super().__init__(
            status_code=400,
            message="[Pip-Boy 警告] 自訂錯誤訊息",
            error_code="CUSTOM_ERROR",
            details={"field": "value"}
        )
```

### 錯誤日誌級別

- **CRITICAL**: `CounterError`（安全警報）
- **ERROR**: 500 伺服器錯誤
- **WARNING**: 401/403 認證/授權失敗
- **INFO**: 其他客戶端錯誤（4xx）

---

## 前端錯誤處理

### 基本使用

```typescript
import { handleWebAuthnError, withTimeout } from '@/lib/webauthn/errorHandler';
import { toast } from 'sonner';

try {
  // 使用 timeout 保護（5 分鐘）
  const credential = await withTimeout(
    navigator.credentials.create(options),
    300000
  );
} catch (error) {
  // 轉換為 Fallout 風格錯誤
  const falloutError = handleWebAuthnError(error);

  // 顯示錯誤訊息
  toast.error(falloutError.message);

  // 顯示操作建議
  if (falloutError.action) {
    console.log('建議操作:', falloutError.action);
  }

  // 判斷是否可重試
  if (falloutError.isRetryable) {
    console.log('此錯誤可重試');
  }
}
```

### 自動重試機制

```typescript
import { withRetry } from '@/lib/webauthn/errorHandler';

// 自動重試最多 3 次，每次間隔 1 秒
const credential = await withRetry(
  () => navigator.credentials.create(options),
  3,  // 最大重試次數
  1000  // 重試間隔（毫秒）
);
```

### 瀏覽器相容性檢查

```typescript
import { isWebAuthnSupported } from '@/lib/webauthn/utils';
import { BrowserCompatibilityWarning } from '@/components/auth/BrowserCompatibilityWarning';

function PasskeyRegistrationForm() {
  if (!isWebAuthnSupported()) {
    return (
      <BrowserCompatibilityWarning
        title="[Pip-Boy 警告] 你的瀏覽器不支援生物辨識"
        message="請升級瀏覽器至：Chrome 67+, Safari 13+, Firefox 60+, Edge 18+"
        fallbackAction={() => router.push('/login/password')}
        fallbackLabel="使用傳統密碼登入"
      />
    );
  }

  // 正常的註冊表單
  return <PasskeyForm />;
}
```

### Conditional UI 不支援提示

```typescript
import { isConditionalUISupported } from '@/lib/webauthn/utils';
import { ConditionalUIUnsupportedWarning } from '@/components/auth/BrowserCompatibilityWarning';

function PasskeyLoginForm() {
  return (
    <>
      {!isConditionalUISupported() && <ConditionalUIUnsupportedWarning />}
      {/* 登入表單 */}
    </>
  );
}
```

---

## 整合範例

### 完整的註冊流程

```typescript
import { useState } from 'react';
import { toast } from 'sonner';
import {
  handleWebAuthnError,
  withTimeout,
  withRetry,
} from '@/lib/webauthn/errorHandler';
import {
  isWebAuthnSupported,
  convertCredentialCreationOptions,
  convertRegistrationResponse,
} from '@/lib/webauthn/utils';
import {
  getRegistrationOptions,
  verifyRegistration,
} from '@/lib/webauthn/api';
import { BrowserCompatibilityWarning } from '@/components/auth/BrowserCompatibilityWarning';

function PasskeyRegistrationForm() {
  const [isLoading, setIsLoading] = useState(false);

  // 1. 檢查瀏覽器支援
  if (!isWebAuthnSupported()) {
    return (
      <BrowserCompatibilityWarning
        title="[Pip-Boy 警告] 你的瀏覽器不支援生物辨識"
        message="請升級瀏覽器至最新版本以使用 Passkey 功能"
        fallbackAction={() => router.push('/register/password')}
        fallbackLabel="使用傳統密碼註冊"
      />
    );
  }

  const handleRegister = async (email: string, name: string) => {
    setIsLoading(true);

    try {
      // 2. 取得註冊選項（帶重試機制）
      const optionsJSON = await withRetry(
        () => getRegistrationOptions(email, name),
        3,
        1000
      );

      // 3. 轉換為 PublicKeyCredentialCreationOptions
      const options = convertCredentialCreationOptions(optionsJSON);

      // 4. 觸發生物辨識（帶 timeout 保護）
      const credential = await withTimeout(
        navigator.credentials.create({ publicKey: options }),
        300000  // 5 分鐘
      );

      if (!credential) {
        throw new Error('No credential returned');
      }

      // 5. 轉換回應格式
      const credentialJSON = convertRegistrationResponse(credential);

      // 6. 驗證註冊（帶重試機制）
      const result = await withRetry(
        () => verifyRegistration(email, name, credentialJSON),
        3,
        1000
      );

      // 7. 成功
      toast.success('[Pip-Boy 訊息] 生物辨識註冊成功！歡迎加入避難所');
      router.push('/dashboard');

    } catch (error) {
      // 8. 錯誤處理
      const falloutError = handleWebAuthnError(error);

      toast.error(falloutError.message, {
        description: falloutError.action,
        duration: 5000,
      });

      console.error('註冊失敗:', falloutError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleRegister(
        formData.get('email') as string,
        formData.get('name') as string
      );
    }}>
      {/* 表單 UI */}
    </form>
  );
}
```

### 完整的登入流程

```typescript
function PasskeyLoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  if (!isWebAuthnSupported()) {
    return (
      <BrowserCompatibilityWarning
        title="[Pip-Boy 警告] 你的瀏覽器不支援生物辨識"
        message="請升級瀏覽器至最新版本以使用 Passkey 功能"
        fallbackAction={() => router.push('/login/password')}
        fallbackLabel="使用傳統密碼登入"
      />
    );
  }

  const handleLogin = async (email?: string) => {
    setIsLoading(true);

    try {
      // 1. 取得驗證選項
      const optionsJSON = await withRetry(
        () => getAuthenticationOptions(email),
        3,
        1000
      );

      // 2. 轉換為 PublicKeyCredentialRequestOptions
      const options = convertCredentialRequestOptions(optionsJSON);

      // 3. 觸發生物辨識
      const credential = await withTimeout(
        navigator.credentials.get({
          publicKey: options,
          mediation: 'conditional',  // 支援 Conditional UI
        }),
        300000
      );

      if (!credential) {
        throw new Error('No credential returned');
      }

      // 4. 轉換回應格式
      const credentialJSON = convertAuthenticationResponse(credential);

      // 5. 驗證登入
      const result = await withRetry(
        () => verifyAuthentication(credentialJSON),
        3,
        1000
      );

      // 6. 成功
      toast.success('[Pip-Boy 訊息] 生物辨識驗證成功！歡迎回到避難所');
      router.push('/dashboard');

    } catch (error) {
      const falloutError = handleWebAuthnError(error);

      toast.error(falloutError.message, {
        description: falloutError.action,
        duration: 5000,
      });

      console.error('登入失敗:', falloutError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isConditionalUISupported() && <ConditionalUIUnsupportedWarning />}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleLogin(formData.get('email') as string);
      }}>
        {/* 表單 UI */}
      </form>
    </>
  );
}
```

---

## Fallout 風格錯誤代碼

### 後端錯誤代碼

| 錯誤代碼 | HTTP 狀態 | 說明 |
|---------|----------|------|
| `WEBAUTHN_REGISTRATION_ERROR` | 400 | 生物辨識註冊失敗 |
| `WEBAUTHN_AUTHENTICATION_ERROR` | 401 | 生物辨識驗證失敗 |
| `CREDENTIAL_NOT_FOUND` | 404 | 找不到生物辨識記錄 |
| `INVALID_CHALLENGE` | 400 | 安全驗證碼已過期 |
| `COUNTER_ERROR` | 403 | 偵測到時間扭曲（可能的重放攻擊）|
| `USER_ALREADY_EXISTS` | 409 | 避難所居民已註冊 |
| `MAX_CREDENTIALS_REACHED` | 422 | 已達 Passkey 數量上限 |

### 前端錯誤代碼

| 錯誤代碼 | 原始錯誤 | 可重試 | 說明 |
|---------|---------|--------|------|
| `VAULT_RESIDENT_CANCELLED` | NotAllowedError | ✅ | 避難所居民取消了操作 |
| `WASTELAND_TIMEOUT` | TimeoutError | ✅ | 生物辨識驗證逾時 |
| `SECURITY_PROTOCOL_VIOLATION` | SecurityError | ❌ | 需要 HTTPS 加密連線 |
| `RADIATION_INTERFERENCE` | NetworkError | ✅ | 網路連線中斷 |
| `OBSOLETE_PIPBOY` | NotSupportedError | ❌ | Pip-Boy 韌體過舊 |
| `PIPBOY_MALFUNCTION` | InvalidStateError | ❌ | Pip-Boy 狀態錯誤 |
| `UNKNOWN_ANOMALY` | (其他) | ✅ | 未知的廢土異常 |

---

## 最佳實踐

1. **總是使用 `withTimeout`**: 防止 WebAuthn 操作無限期等待
2. **只重試可重試的錯誤**: 檢查 `isRetryable` 屬性
3. **顯示使用者友善的錯誤訊息**: 使用 `toast` 或 `Dialog` 顯示 Fallout 風格訊息
4. **提供降級選項**: 瀏覽器不支援時，提供密碼登入等替代方案
5. **記錄詳細錯誤**: 使用 `console.error` 記錄完整錯誤資訊以便除錯
6. **敏感資訊保護**: 後端自動清理敏感欄位（password, api_key 等）

---

## 參考文件

- [WebAuthn API 文件](../README.md)
- [錯誤處理工具 API](./errorHandler.ts)
- [瀏覽器相容性元件](../../components/auth/BrowserCompatibilityWarning.tsx)
- [後端錯誤處理器](../../../backend/app/middleware/error_handler.py)
- [自訂異常類別](../../../backend/app/core/exceptions.py)
