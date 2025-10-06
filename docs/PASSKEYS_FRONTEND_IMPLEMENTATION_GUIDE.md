# Passkeys 前端實作指南

**版本**: 1.0
**日期**: 2025-10-03
**狀態**: 實作指南

---

## 📋 目錄

1. [概述](#概述)
2. [Task 39: WebAuthn 工具函式](#task-39-webauthn-工具函式)
3. [Task 40: usePasskey Hook](#task-40-usepasskey-hook)
4. [Task 41: LoginForm 整合](#task-41-loginform-整合)
5. [Task 42: RegisterForm 整合](#task-42-registerform-整合)
6. [Task 43: Passkey 管理頁面](#task-43-passkey-管理頁面)
7. [Task 44: Conditional UI](#task-44-conditional-ui)
8. [Task 45: 錯誤處理](#task-45-錯誤處理)
9. [Task 46: 測試](#task-46-測試)
10. [Task 47: 文件](#task-47-文件)

---

## 概述

### 已完成（後端）

✅ **Tasks 31-38**: Passkeys 後端完整實作
- 資料庫 schema（credentials 表）
- WebAuthn 服務層（註冊、認證、管理）
- API 端點（9 個端點）
- 新使用者無密碼註冊

### 待實作（前端）

⏳ **Tasks 39-47**: Passkeys 前端整合
- WebAuthn 瀏覽器 API 封裝
- React Hooks
- UI 元件整合
- 錯誤處理
- 測試

---

## Task 39: WebAuthn 工具函式

### 檔案位置
`src/lib/webauthn.ts`

### 實作內容

#### 1. 瀏覽器支援檢測

```typescript
/**
 * 檢查瀏覽器是否支援 WebAuthn
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

/**
 * 檢查是否支援 Conditional UI（Autofill）
 */
export async function isConditionalUISupported(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;

  try {
    const available = await PublicKeyCredential.isConditionalMediationAvailable();
    return available;
  } catch {
    return false;
  }
}
```

#### 2. Base64URL 編解碼

```typescript
/**
 * Base64URL 編碼（ArrayBuffer → string）
 */
export function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL 解碼（string → ArrayBuffer）
 */
export function base64URLDecode(base64url: string): ArrayBuffer {
  // 補充 padding
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
```

#### 3. Registration Flow

```typescript
/**
 * WebAuthn 註冊選項（從後端接收）
 */
export interface RegistrationOptionsFromServer {
  options: PublicKeyCredentialCreationOptions;
  challenge: string;
}

/**
 * 開始 Passkey 註冊流程
 */
export async function startRegistration(
  options: RegistrationOptionsFromServer
): Promise<RegistrationCredential> {
  if (!isWebAuthnSupported()) {
    throw new Error('您的瀏覽器不支援 Passkey');
  }

  try {
    // 轉換 Base64URL 編碼的資料
    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      ...options.options,
      challenge: base64URLDecode(options.options.challenge as unknown as string),
      user: {
        ...options.options.user,
        id: base64URLDecode(options.options.user.id as unknown as string),
      },
      excludeCredentials: options.options.excludeCredentials?.map((cred) => ({
        ...cred,
        id: base64URLDecode(cred.id as unknown as string),
      })),
    };

    // 呼叫瀏覽器 WebAuthn API
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    });

    if (!credential) {
      throw new Error('Passkey 建立失敗');
    }

    // 轉換回應為可傳送的格式
    const attestationResponse = credential.response as AuthenticatorAttestationResponse;

    return {
      id: credential.id,
      rawId: base64URLEncode(credential.rawId),
      response: {
        clientDataJSON: base64URLEncode(attestationResponse.clientDataJSON),
        attestationObject: base64URLEncode(attestationResponse.attestationObject),
      },
      type: credential.type,
    };
  } catch (error: any) {
    // 處理使用者取消
    if (error.name === 'NotAllowedError') {
      throw new Error('Passkey 註冊已取消');
    }
    // 處理已存在的憑證
    if (error.name === 'InvalidStateError') {
      throw new Error('此 Passkey 已經註冊過了');
    }
    throw error;
  }
}

/**
 * 註冊憑證回應格式
 */
export interface RegistrationCredential {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
  type: string;
}
```

#### 4. Authentication Flow

```typescript
/**
 * WebAuthn 認證選項（從後端接收）
 */
export interface AuthenticationOptionsFromServer {
  options: PublicKeyCredentialRequestOptions;
  challenge: string;
}

/**
 * 開始 Passkey 認證流程
 */
export async function startAuthentication(
  options: AuthenticationOptionsFromServer,
  conditionalUI: boolean = false
): Promise<AuthenticationCredential> {
  if (!isWebAuthnSupported()) {
    throw new Error('您的瀏覽器不支援 Passkey');
  }

  try {
    // 轉換 Base64URL 編碼的資料
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      ...options.options,
      challenge: base64URLDecode(options.options.challenge as unknown as string),
      allowCredentials: options.options.allowCredentials?.map((cred) => ({
        ...cred,
        id: base64URLDecode(cred.id as unknown as string),
      })),
    };

    // 呼叫瀏覽器 WebAuthn API
    const credential = await navigator.credentials.get({
      publicKey: publicKeyOptions,
      mediation: conditionalUI ? 'conditional' : 'optional',
    } as CredentialRequestOptions);

    if (!credential) {
      throw new Error('Passkey 認證失敗');
    }

    // 轉換回應為可傳送的格式
    const assertionResponse = credential.response as AuthenticatorAssertionResponse;

    return {
      id: credential.id,
      rawId: base64URLEncode(credential.rawId),
      response: {
        clientDataJSON: base64URLEncode(assertionResponse.clientDataJSON),
        authenticatorData: base64URLEncode(assertionResponse.authenticatorData),
        signature: base64URLEncode(assertionResponse.signature),
        userHandle: assertionResponse.userHandle
          ? base64URLEncode(assertionResponse.userHandle)
          : undefined,
      },
      type: credential.type,
    };
  } catch (error: any) {
    // 處理使用者取消
    if (error.name === 'NotAllowedError') {
      throw new Error('Passkey 認證已取消');
    }
    throw error;
  }
}

/**
 * 認證憑證回應格式
 */
export interface AuthenticationCredential {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
  type: string;
}
```

---

## Task 40: usePasskey Hook

### 檔案位置
`src/hooks/usePasskey.ts`

### 實作內容

```typescript
import { useState, useCallback } from 'react';
import {
  isWebAuthnSupported,
  startRegistration,
  startAuthentication,
  type RegistrationCredential,
  type AuthenticationCredential,
} from '@/lib/webauthn';
import { useAuthStore } from '@/lib/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Passkey 操作 Hook
 */
export function usePasskey() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  /**
   * 1. 新使用者 Passkey 註冊（無密碼）
   */
  const registerNewUserWithPasskey = useCallback(
    async (email: string, name: string, deviceName?: string) => {
      if (!isWebAuthnSupported()) {
        setError('您的瀏覽器不支援 Passkey');
        return { success: false };
      }

      setLoading(true);
      setError(null);

      try {
        // Step 1: 取得註冊選項
        const optionsRes = await fetch(`${API_URL}/api/webauthn/register-new/options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, name }),
        });

        if (!optionsRes.ok) {
          const errorData = await optionsRes.json();
          throw new Error(errorData.detail || 'Email 可能已被註冊');
        }

        const { options } = await optionsRes.json();

        // Step 2: 建立 Passkey
        const credential = await startRegistration({ options });

        // Step 3: 驗證並建立帳號
        const verifyRes = await fetch(`${API_URL}/api/webauthn/register-new/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email,
            name,
            credential_id: credential.rawId,
            client_data_json: credential.response.clientDataJSON,
            attestation_object: credential.response.attestationObject,
            device_name: deviceName,
          }),
        });

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json();
          throw new Error(errorData.detail || 'Passkey 註冊失敗');
        }

        const data = await verifyRes.json();

        // 更新全域狀態
        setUser(data.user);

        setLoading(false);
        return { success: true, user: data.user };
      } catch (err: any) {
        const errorMessage = err.message || 'Passkey 註冊失敗';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [setUser]
  );

  /**
   * 2. Passkey 登入
   */
  const authenticateWithPasskey = useCallback(
    async (email?: string) => {
      if (!isWebAuthnSupported()) {
        setError('您的瀏覽器不支援 Passkey');
        return { success: false };
      }

      setLoading(true);
      setError(null);

      try {
        // Step 1: 取得認證選項
        const optionsRes = await fetch(`${API_URL}/api/webauthn/authenticate/options`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email }),
        });

        if (!optionsRes.ok) {
          const errorData = await optionsRes.json();
          throw new Error(errorData.detail || '無法取得認證選項');
        }

        const { options } = await optionsRes.json();

        // Step 2: 認證 Passkey
        const credential = await startAuthentication({ options });

        // Step 3: 驗證並登入
        const verifyRes = await fetch(`${API_URL}/api/webauthn/authenticate/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            credential_id: credential.rawId,
            client_data_json: credential.response.clientDataJSON,
            authenticator_data: credential.response.authenticatorData,
            signature: credential.response.signature,
          }),
        });

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json();
          throw new Error(errorData.detail || 'Passkey 認證失敗');
        }

        const data = await verifyRes.json();

        // 更新全域狀態
        setUser(data.user);

        setLoading(false);
        return { success: true, user: data.user };
      } catch (err: any) {
        const errorMessage = err.message || 'Passkey 登入失敗';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }
    },
    [setUser]
  );

  /**
   * 3. 已登入使用者新增 Passkey
   */
  const registerPasskey = useCallback(async (deviceName?: string) => {
    if (!isWebAuthnSupported()) {
      setError('您的瀏覽器不支援 Passkey');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: 取得註冊選項
      const optionsRes = await fetch(`${API_URL}/api/webauthn/register/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ device_name: deviceName }),
      });

      if (!optionsRes.ok) {
        throw new Error('無法取得註冊選項');
      }

      const { options } = await optionsRes.json();

      // Step 2: 建立 Passkey
      const credential = await startRegistration({ options });

      // Step 3: 驗證並儲存
      const verifyRes = await fetch(`${API_URL}/api/webauthn/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          credential_id: credential.rawId,
          client_data_json: credential.response.clientDataJSON,
          attestation_object: credential.response.attestationObject,
          device_name: deviceName,
        }),
      });

      if (!verifyRes.ok) {
        throw new Error('Passkey 註冊失敗');
      }

      const data = await verifyRes.json();

      setLoading(false);
      return { success: true, credential: data.credential };
    } catch (err: any) {
      const errorMessage = err.message || 'Passkey 新增失敗';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * 4. 列出使用者的 Passkeys
   */
  const listCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/webauthn/credentials`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('無法取得 Passkeys 清單');
      }

      const data = await res.json();

      setLoading(false);
      return { success: true, credentials: data.credentials };
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * 5. 更新 Passkey 名稱
   */
  const updateCredentialName = useCallback(
    async (credentialId: string, newName: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_URL}/api/webauthn/credentials/${credentialId}/name`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ device_name: newName }),
          }
        );

        if (!res.ok) {
          throw new Error('無法更新 Passkey 名稱');
        }

        const data = await res.json();

        setLoading(false);
        return { success: true, credential: data.credential };
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        return { success: false, error: err.message };
      }
    },
    []
  );

  /**
   * 6. 刪除 Passkey
   */
  const deleteCredential = useCallback(async (credentialId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/webauthn/credentials/${credentialId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || '無法刪除 Passkey');
      }

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    // 狀態
    loading,
    error,
    isSupported: isWebAuthnSupported(),

    // 方法
    registerNewUserWithPasskey,
    authenticateWithPasskey,
    registerPasskey,
    listCredentials,
    updateCredentialName,
    deleteCredential,
  };
}
```

---

## Task 41: LoginForm 整合

### 修改檔案
`src/components/auth/LoginForm.tsx` 或 `src/app/auth/login/page.tsx`

### 實作步驟

1. **Import usePasskey Hook**:
```typescript
import { usePasskey } from '@/hooks/usePasskey';
```

2. **新增狀態**:
```typescript
const {
  authenticateWithPasskey,
  loading: passkeyLoading,
  error: passkeyError,
  isSupported,
} = usePasskey();

const [showPasskeyOption, setShowPasskeyOption] = useState(false);
```

3. **新增 Passkey 登入處理函式**:
```typescript
const handlePasskeyLogin = async () => {
  const result = await authenticateWithPasskey(email); // email 可選
  if (result.success) {
    router.push('/dashboard');
  }
};
```

4. **UI 更新**（在 Email/Password 登入按鈕下方）:
```tsx
{/* 分隔線 */}
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-600"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-gray-800 text-gray-400">或</span>
  </div>
</div>

{/* Passkey 登入按鈕 */}
{isSupported && (
  <button
    type="button"
    onClick={handlePasskeyLogin}
    disabled={passkeyLoading}
    className="w-full flex justify-center items-center gap-3 py-3 px-4
               bg-gradient-to-r from-blue-600 to-blue-700
               hover:from-blue-700 hover:to-blue-800
               text-white font-medium rounded-lg
               transition-all duration-200
               disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <svg className="w-5 h-5" /* Passkey icon */ />
    {passkeyLoading ? '認證中...' : '使用 Passkey 登入'}
  </button>
)}

{/* Passkey 錯誤訊息 */}
{passkeyError && (
  <div className="mt-4 p-3 bg-red-900/20 border border-red-600 rounded-lg">
    <p className="text-sm text-red-400">{passkeyError}</p>
  </div>
)}
```

---

## Task 42: RegisterForm 整合

### 修改檔案
`src/app/auth/register/page.tsx`

### 實作步驟

類似 Task 41，新增：
1. Import `usePasskey`
2. 新增 `registerNewUserWithPasskey` 函式
3. 新增「使用 Passkey 註冊」按鈕

```tsx
const handlePasskeyRegister = async () => {
  if (!email || !name) {
    setError('請輸入 Email 和姓名');
    return;
  }

  const result = await registerNewUserWithPasskey(email, name);
  if (result.success) {
    router.push('/dashboard');
  }
};
```

---

## Task 43: Passkey 管理頁面

### 建立檔案
`src/app/settings/passkeys/page.tsx`

### 實作內容

```typescript
'use client';

import { useEffect, useState } from 'react';
import { usePasskey } from '@/hooks/usePasskey';

export default function PasskeysManagementPage() {
  const {
    listCredentials,
    registerPasskey,
    updateCredentialName,
    deleteCredential,
    loading,
    error,
    isSupported,
  } = usePasskey();

  const [credentials, setCredentials] = useState([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    const result = await listCredentials();
    if (result.success) {
      setCredentials(result.credentials);
    }
  };

  const handleAddPasskey = async () => {
    const result = await registerPasskey('新裝置');
    if (result.success) {
      loadCredentials();
    }
  };

  const handleUpdateName = async (id: string) => {
    const result = await updateCredentialName(id, newName);
    if (result.success) {
      setEditingId(null);
      loadCredentials();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此 Passkey 嗎？')) return;

    const result = await deleteCredential(id);
    if (result.success) {
      loadCredentials();
    }
  };

  if (!isSupported) {
    return <div>您的瀏覽器不支援 Passkey</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Passkey 管理</h1>

      {/* 新增 Passkey 按鈕 */}
      <button onClick={handleAddPasskey} disabled={loading}>
        新增 Passkey
      </button>

      {/* Passkeys 列表 */}
      <div className="mt-6 space-y-4">
        {credentials.map((cred) => (
          <div key={cred.id} className="border p-4 rounded-lg">
            {/* 顯示裝置名稱、建立日期、最後使用等 */}
            {/* 編輯和刪除按鈕 */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 實作優先順序建議

1. ✅ **Task 39**: WebAuthn 工具（基礎，必須先完成）
2. ✅ **Task 40**: usePasskey Hook（封裝邏輯）
3. **Task 41**: LoginForm 整合（Passkey 登入）
4. **Task 43**: Passkey 管理頁面（新增/刪除 Passkey）
5. **Task 42**: RegisterForm 整合（新使用者註冊）
6. **Task 44**: Conditional UI（進階功能）
7. **Task 45**: 錯誤處理（使用者體驗）
8. **Task 46**: 測試（品質保證）
9. **Task 47**: 文件（維護性）

---

## 注意事項

### 瀏覽器支援

- ✅ Chrome 67+ (Desktop/Android)
- ✅ Edge 18+
- ✅ Safari 14+ (macOS/iOS)
- ✅ Firefox 60+ (需手動啟用)

### 開發環境

- ⚠️ WebAuthn 需要 HTTPS 或 localhost
- ⚠️ RP_ID 必須與 domain 一致

### Feature Flag

確保後端 `.env` 設定：
```bash
WEBAUTHN_ENABLED=true  # 啟用 Passkeys
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
```

---

**實作完成後請更新 `TASKS_38_47_PROGRESS.md`**
