# WebAuthn / Passkey 前端模組

這個模組提供完整的 WebAuthn (Passkey) 功能，包括註冊、登入、Credential 管理等。

## 特色

- ✅ **完整的 TDD 測試覆蓋** - 25 個單元測試全部通過
- ✅ **Fallout 主題錯誤訊息** - Pip-Boy 風格的錯誤提示
- ✅ **TypeScript 型別安全** - 完整的型別定義
- ✅ **瀏覽器支援檢測** - 自動檢測 WebAuthn 和 Conditional UI 支援
- ✅ **統一錯誤處理** - 友善的錯誤訊息和 Vault-Tec 錯誤代碼
- ✅ **Base64URL 編解碼** - 符合 RFC 4648 規範
- ✅ **API Client 整合** - 完整的後端 API 通信
- ✅ **自動重試機制** - 可重試錯誤自動重試（最多 3 次）
- ✅ **Timeout 保護** - WebAuthn 操作預設 5 分鐘 timeout
- ✅ **降級 UI** - 瀏覽器不支援時的友善提示

> **錯誤處理完整指南**: 請參考 [ERROR_HANDLING.md](./ERROR_HANDLING.md)

## 目錄結構

```
src/lib/webauthn/
├── index.ts              # 主要入口，匯出所有功能
├── types.ts              # TypeScript 型別定義
├── utils.ts              # 工具函式（編解碼、型別轉換、瀏覽器檢測）
├── api.ts                # API Client（與後端通信）
├── README.md             # 本文件
└── __tests__/
    └── utils.test.ts     # 工具函式測試（25 個測試）
```

## 快速開始

### 1. 檢查瀏覽器支援

```typescript
import { isWebAuthnSupported, isConditionalUISupported } from '@/lib/webauthn';

// 檢查基本 WebAuthn 支援
if (!isWebAuthnSupported()) {
  console.log('您的瀏覽器不支援 Passkey');
  return;
}

// 檢查 Conditional UI (autofill) 支援
const supportsAutofill = await isConditionalUISupported();
if (supportsAutofill) {
  console.log('支援 Passkey 自動填充');
}
```

### 2. 新用戶註冊流程

```typescript
import {
  getRegistrationOptions,
  convertCredentialCreationOptions,
  verifyRegistration,
} from '@/lib/webauthn';

try {
  // Step 1: 從後端取得註冊選項
  const optionsJSON = await getRegistrationOptions(email, name);

  // Step 2: 轉換為瀏覽器 API 格式
  const options = convertCredentialCreationOptions(optionsJSON);

  // Step 3: 呼叫瀏覽器 WebAuthn API
  const credential = await navigator.credentials.create({
    publicKey: options,
  }) as PublicKeyCredential;

  // Step 4: 轉換回應為 JSON 格式
  const response = credential.response as AuthenticatorAttestationResponse;
  const credentialJSON = {
    id: credential.id,
    rawId: base64URLEncode(credential.rawId),
    response: {
      clientDataJSON: base64URLEncode(response.clientDataJSON),
      attestationObject: base64URLEncode(response.attestationObject),
      transports: response.getTransports?.() || [],
    },
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
  };

  // Step 5: 送回後端驗證
  const result = await verifyRegistration(email, name, credentialJSON);

  console.log('註冊成功！', result.user);
  console.log('Access Token:', result.accessToken);
} catch (error) {
  console.error('註冊失敗:', error);
}
```

### 3. 登入流程

```typescript
import {
  getAuthenticationOptions,
  convertCredentialRequestOptions,
  convertAuthenticationResponse,
  verifyAuthentication,
} from '@/lib/webauthn';

try {
  // Step 1: 從後端取得驗證選項
  const optionsJSON = await getAuthenticationOptions(email); // email 可選

  // Step 2: 轉換為瀏覽器 API 格式
  const options = convertCredentialRequestOptions(optionsJSON);

  // Step 3: 呼叫瀏覽器 WebAuthn API
  const credential = await navigator.credentials.get({
    publicKey: options,
  }) as PublicKeyCredential;

  // Step 4: 轉換回應為 JSON 格式
  const credentialJSON = convertAuthenticationResponse(credential);

  // Step 5: 送回後端驗證
  const result = await verifyAuthentication(credentialJSON);

  console.log('登入成功！', result.user);
  console.log('Access Token:', result.accessToken);
} catch (error) {
  console.error('登入失敗:', error);
}
```

### 4. Credential 管理

```typescript
import {
  getCredentials,
  updateCredentialName,
  deleteCredential,
} from '@/lib/webauthn';

// 取得所有 Credentials
const credentials = await getCredentials();
console.log('您的 Passkeys:', credentials);

// 更新 Credential 名稱
await updateCredentialName(credentialId, '我的 iPhone 15 Pro');

// 刪除 Credential
await deleteCredential(credentialId);
```

## API 參考

### 工具函式

#### `isWebAuthnSupported(): boolean`
檢查瀏覽器是否支援 WebAuthn。

#### `isConditionalUISupported(): Promise<boolean>`
檢查瀏覽器是否支援 Conditional UI (autofill)。

#### `base64URLEncode(buffer: ArrayBuffer): string`
將 ArrayBuffer 編碼為 Base64URL 字串。

#### `base64URLDecode(base64url: string): ArrayBuffer`
將 Base64URL 字串解碼為 ArrayBuffer。

#### `convertCredentialCreationOptions(options: PublicKeyCredentialCreationOptionsJSON): PublicKeyCredentialCreationOptions`
將 JSON 格式的註冊選項轉換為瀏覽器 API 格式。

#### `convertCredentialRequestOptions(options: PublicKeyCredentialRequestOptionsJSON): PublicKeyCredentialRequestOptions`
將 JSON 格式的驗證選項轉換為瀏覽器 API 格式。

#### `convertRegistrationResponse(credential: PublicKeyCredential): RegistrationResponseJSON`
將瀏覽器回傳的註冊憑證轉換為 JSON 格式。

#### `convertAuthenticationResponse(credential: PublicKeyCredential): AuthenticationResponseJSON`
將瀏覽器回傳的驗證憑證轉換為 JSON 格式。

#### `getPlatformAuthenticatorInfo(): Promise<PlatformAuthenticatorInfo>`
取得平台認證器資訊（Touch ID, Face ID, Windows Hello 等）。

#### `getFalloutErrorMessage(error: Error): string`
將標準錯誤轉換為 Fallout 風格的錯誤訊息。

### API Client

#### `getRegistrationOptions(email: string, name: string): Promise<PublicKeyCredentialCreationOptionsJSON>`
取得新用戶註冊選項。

#### `verifyRegistration(email: string, name: string, credential: RegistrationResponseJSON): Promise<RegistrationVerificationResponse>`
驗證新用戶註冊回應。

#### `getAuthenticationOptions(email?: string): Promise<PublicKeyCredentialRequestOptionsJSON>`
取得驗證選項（登入）。

#### `verifyAuthentication(credential: AuthenticationResponseJSON): Promise<AuthenticationVerificationResponse>`
驗證登入回應。

#### `getCredentials(): Promise<CredentialInfo[]>`
取得用戶所有 Credentials（需登入）。

#### `getAddCredentialOptions(): Promise<PublicKeyCredentialCreationOptionsJSON>`
取得已登入用戶新增 Credential 的註冊選項。

#### `verifyAddCredential(credential: RegistrationResponseJSON): Promise<CredentialInfo>`
驗證新增 Credential 的回應。

#### `updateCredentialName(credentialId: string, newName: string): Promise<CredentialInfo>`
更新 Credential 名稱（需登入）。

#### `deleteCredential(credentialId: string): Promise<void>`
刪除 Credential（需登入）。

## 錯誤處理

所有錯誤都包含 Fallout 主題的錯誤訊息：

```typescript
try {
  await getRegistrationOptions(email, name);
} catch (error) {
  if (error instanceof WebAuthnAPIError) {
    console.error(`Status: ${error.status}`);
    console.error(`Message: ${error.message}`);
    console.error(`Vault-Tec Code: ${error.vaultTecCode}`);
  }
}
```

### 常見錯誤訊息

| 錯誤代碼 | 訊息 |
|---------|------|
| `NotAllowedError` | [Pip-Boy 警告] 您取消了生物辨識掃描，或操作逾時 |
| `InvalidStateError` | [Pip-Boy 錯誤] 找不到可用的生物辨識資料，或此 Passkey 已存在 |
| `NotSupportedError` | [Pip-Boy 錯誤] 您的 Pip-Boy 型號不支援此類型的生物辨識 |
| `SecurityError` | [Vault-Tec 安全警報] 請確認您的連線使用避難所安全協議（HTTPS） |

## 測試

執行測試：

```bash
npm test -- src/lib/webauthn/__tests__/utils.test.ts
```

所有 25 個測試應該全部通過：

```
PASS  src/lib/webauthn/__tests__/utils.test.ts
  WebAuthn 瀏覽器支援檢測
    isWebAuthnSupported
      ✓ 應該在支援 WebAuthn 的瀏覽器中回傳 true
      ✓ 應該在不支援 WebAuthn 的瀏覽器中回傳 false
      ✓ 應該在 SSR 環境中回傳 false
    isConditionalUISupported
      ✓ 應該在支援 Conditional UI 的瀏覽器中回傳 true
      ✓ 應該在不支援 Conditional UI 的瀏覽器中回傳 false
      ✓ 應該在不支援 WebAuthn 的瀏覽器中回傳 false
      ✓ 應該在 API 拋出錯誤時回傳 false
  Base64URL 編碼/解碼
    ... (14 個測試)
  PublicKeyCredential 型別轉換
    ... (6 個測試)
  Fallout 風格錯誤訊息
    ... (2 個測試)

Tests:  25 passed, 25 total
```

## 瀏覽器相容性

| 瀏覽器 | 版本 | WebAuthn | Conditional UI |
|--------|------|----------|----------------|
| Chrome | 67+ | ✅ | ✅ (v108+) |
| Edge | 18+ | ✅ | ✅ (v108+) |
| Safari | 13+ | ✅ | ✅ (v16+) |
| Firefox | 60+ | ✅ | ❌ |

## 安全性

- ✅ 所有請求使用 `credentials: 'include'` 確保 Cookie 正確傳送
- ✅ Base64URL 編解碼符合 RFC 4648 規範
- ✅ 錯誤訊息不洩漏敏感資訊
- ✅ 支援 Challenge 單次使用驗證
- ✅ 支援 Counter 回退偵測（防止重放攻擊）

## 開發指南

### 新增功能

1. 在 `types.ts` 定義型別
2. 在 `utils.ts` 或 `api.ts` 實作功能
3. 在 `__tests__/utils.test.ts` 撰寫測試
4. 在 `index.ts` 匯出新功能
5. 更新本 README

### 遵循規範

- **TDD 流程**：紅燈 → 綠燈 → 重構
- **Fallout 主題**：所有錯誤訊息使用 Pip-Boy / Vault-Tec 術語
- **TypeScript**：嚴格的型別定義，不使用 `any`
- **JSDoc**：所有公開函式必須有完整的 JSDoc 註解

## 授權

本模組遵循專案的整體授權條款。
