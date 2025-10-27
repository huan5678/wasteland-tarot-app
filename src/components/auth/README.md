# Passkey 認證元件

此目錄包含 Passkey (WebAuthn) 無密碼認證的 UI 元件。

## 元件列表

### PasskeyRegistrationForm

新用戶使用 Passkey 註冊的表單元件。

**功能**：
- Email 和名稱輸入（使用 react-hook-form + Zod 驗證）
- WebAuthn 註冊流程整合
- 錯誤處理與使用者回饋（Fallout 主題）
- 載入狀態與禁用表單
- 不支援 WebAuthn 時的降級 UI

**Props**:
```typescript
interface PasskeyRegistrationFormProps {
  onSuccess?: (response: RegistrationResponse) => void;
  onError?: (error: Error) => void;
}
```

**使用範例**:
```tsx
import { PasskeyRegistrationForm } from '@/components/auth/PasskeyRegistrationForm';

function RegisterPage() {
  return (
    <PasskeyRegistrationForm
      onSuccess={(response) => {
        console.log('註冊成功', response.user);
      }}
      onError={(error) => {
        console.error('註冊失敗', error);
      }}
    />
  );
}
```

---

### AddPasskeyButton

已登入用戶新增 Passkey 的按鈕元件。

**功能**：
- 檢查 credential 數量上限（10 個）
- 呼叫 getAddCredentialOptions() API
- 整合 excludeCredentials 防止重複註冊
- 錯誤處理與使用者回饋（Fallout 主題）
- 載入狀態
- 不支援 WebAuthn 時自動隱藏

**Props**:
```typescript
interface AddPasskeyButtonProps {
  credentialCount?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  className?: string;
  buttonText?: string;
  showUnsupportedMessage?: boolean;
}
```

**使用範例**:
```tsx
import { AddPasskeyButton } from '@/components/auth/AddPasskeyButton';

function SettingsPage({ credentials }) {
  const refetch = () => {
    // 重新載入 credentials 列表
  };

  return (
    <div>
      <h2>Passkeys 管理</h2>
      <CredentialList credentials={credentials} />
      <AddPasskeyButton
        credentialCount={credentials.length}
        onSuccess={refetch}
        disabled={credentials.length >= 10}
      />
    </div>
  );
}
```

---

## Fallout 主題設計指引

所有元件遵循 Fallout/Pip-Boy 主題：

### 顏色
- 主要顏色：Pip-Boy Green (`#00ff88`)
- 錯誤顏色：Radiation Red (`#ef4444`)
- 警告顏色：Vault Yellow (`#ffdd00`)
- 成功顏色：Bright Green (`#00ff41`)

### 圖示
- 使用 `PixelIcon` 元件（基於 RemixIcon）
- **禁止使用 lucide-react**
- 常用圖示：
  - `fingerprint` - 生物辨識
  - `shield-check` - 安全保證
  - `alert-triangle` - 警告
  - `loader` - 載入中（加上 `animation="spin"`）

### 訊息風格
- 使用 Fallout 術語：
  - "避難所" (Vault)
  - "Pip-Boy"
  - "廢土" (Wasteland)
  - "Vault-Tec"
  - "生物辨識掃描器"
  - "輻射干擾"

### 錯誤訊息範例
```typescript
// ✅ Good (Fallout 風格)
"[Pip-Boy 錯誤] 生物辨識註冊失敗，請確認 Pip-Boy 功能正常"
"[Vault-Tec 警告] 此 email 已在避難所註冊"

// ❌ Bad (一般風格)
"Registration failed"
"Email already exists"
```

---

## 測試

每個元件都有對應的測試檔案：

- `__tests__/PasskeyRegistrationForm.test.tsx` - 註冊表單測試
- `__tests__/AddPasskeyButton.test.tsx` - 新增 Passkey 按鈕測試

執行測試：
```bash
bun test src/components/auth/__tests__/
```

---

## WebAuthn 流程

### 註冊流程 (PasskeyRegistrationForm)

1. 用戶輸入 email 和 name
2. 呼叫 `getRegistrationOptions(email, name)`
3. 瀏覽器觸發 `navigator.credentials.create()`
4. 用戶完成生物辨識（Touch ID / Face ID）
5. 呼叫 `verifyRegistration(email, name, credential)`
6. 成功後儲存 tokens 並導向 dashboard

### 新增 Credential 流程 (AddPasskeyButton)

1. 用戶點擊「新增 Passkey」按鈕
2. 呼叫 `getAddCredentialOptions()` (包含 excludeCredentials)
3. 瀏覽器觸發 `navigator.credentials.create()`
4. 用戶完成生物辨識
5. 呼叫 `verifyAddCredential(credential)`
6. 成功後觸發 onSuccess 回調

---

## 相依性

### 必要套件
- `react-hook-form` - 表單管理
- `zod` - 表單驗證
- `@hookform/resolvers` - Zod 整合
- `sonner` - Toast 通知
- `@simplewebauthn/types` - TypeScript 型別定義

### 內部模組
- `@/lib/webauthn` - WebAuthn 工具函式和 API client
- `@/components/ui` - UI 元件庫
- `next/navigation` - Next.js 路由

---

## 瀏覽器支援

WebAuthn 支援情況：
- ✅ Chrome 67+
- ✅ Firefox 60+
- ✅ Safari 13+ (macOS 10.15+, iOS 14+)
- ✅ Edge 18+
- ❌ IE 11 (不支援)

Conditional UI (Autofill) 支援：
- ✅ Chrome 108+
- ✅ Safari 16+
- ❌ Firefox (尚未支援)

---

## 安全性

### 資料保護
- 生物辨識資料僅儲存於用戶裝置，不傳送至伺服器
- 使用 FIDO2/WebAuthn 標準加密
- Challenge 單次使用，5 分鐘 TTL
- Counter 驗證防止重放攻擊

### 最佳實踐
- 總是使用 HTTPS (生產環境)
- 驗證 origin 和 RP ID
- 實作 excludeCredentials 防止重複註冊
- 限制最多 10 個 credentials per user

---

## 常見問題

### Q: 為什麼不能在 localhost HTTP 上測試 WebAuthn？
**A**: WebAuthn 需要安全連線（HTTPS 或 localhost）。localhost 是例外，可以使用 HTTP。

### Q: 如何處理用戶取消生物辨識？
**A**: 捕捉 `NotAllowedError` 並顯示友善訊息，允許用戶重試。

### Q: 如何支援安全金鑰（USB / NFC）？
**A**: WebAuthn 自動支援所有 FIDO2 認證器，包括 YubiKey 等安全金鑰。

### Q: Conditional UI 在哪些瀏覽器可用？
**A**: Chrome 108+, Safari 16+。Firefox 尚未支援。元件會自動降級至標準按鈕。

---

## 相關文件

- [WebAuthn API 規範](https://w3c.github.io/webauthn/)
- [FIDO2 標準](https://fidoalliance.org/fido2/)
- [WebAuthn 工具函式文件](../../lib/webauthn/README.md)
- [Passkey 認證系統設計文件](../../../.kiro/specs/passkey-authentication/design.md)

---

**最後更新**: 2025-10-27
**維護者**: Kiro TDD Team
