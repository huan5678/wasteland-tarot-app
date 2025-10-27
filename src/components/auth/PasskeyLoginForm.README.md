# PasskeyLoginForm Component

Fallout 主題的 Passkey 登入表單元件，支援 Email-guided、Usernameless 和 Conditional UI 登入方式。

## 功能特色

### 1. 多種登入模式

- **Email-guided 登入**: 使用者輸入 email 後使用 Passkey 登入
- **Usernameless 登入**: 不需要 email，直接透過瀏覽器選擇 Passkey
- **Conditional UI**: 支援瀏覽器自動填入功能（autofill）

### 2. Fallout 主題設計

- Pip-Boy 綠色配色（`#00ff88`）
- Vault-Tec 風格文字和術語
- 像素風格圖示（PixelIcon）
- 廢土風格錯誤訊息

### 3. 完整的錯誤處理

- 使用者取消驗證
- 驗證逾時
- 網路錯誤
- 瀏覽器不支援 WebAuthn

### 4. 瀏覽器相容性

- 自動檢測 WebAuthn 支援
- 不支援時顯示降級 UI
- 建議使用相容的瀏覽器

## 使用方式

### 基本用法（Usernameless 登入）

```tsx
import { PasskeyLoginForm } from '@/components/auth/PasskeyLoginForm';

function LoginPage() {
  return <PasskeyLoginForm />;
}
```

### Email-guided 登入

```tsx
<PasskeyLoginForm
  showEmailField
  enableConditionalUI
/>
```

### 自訂成功回調

```tsx
<PasskeyLoginForm
  onSuccess={(result) => {
    console.log('登入成功', result.user);
    // 自訂處理邏輯
  }}
/>
```

## Props

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `showEmailField` | `boolean` | `false` | 是否顯示 email 輸入欄位（Email-guided 登入） |
| `enableConditionalUI` | `boolean` | `true` | 是否啟用 Conditional UI (autofill) |
| `onSuccess` | `(result) => void` | `undefined` | 登入成功後的回調函式 |

## 登入流程

### 1. Usernameless 登入流程

1. 使用者點擊「使用 Passkey 登入」按鈕
2. 取得驗證選項（無 email）
3. 呼叫瀏覽器 WebAuthn API（`navigator.credentials.get()`）
4. 使用者選擇 Passkey 並完成生物辨識
5. 將憑證送回後端驗證
6. 更新全域狀態（AuthStore）
7. 導向 dashboard

### 2. Email-guided 登入流程

1. 使用者輸入 email（選填）
2. 點擊「使用 Passkey 登入」按鈕
3. 取得驗證選項（包含 email）
4. 呼叫瀏覽器 WebAuthn API
5. 使用者完成生物辨識
6. 驗證憑證並登入

### 3. Conditional UI 流程

1. 頁面載入時初始化 Conditional UI
2. 使用者點擊 email 輸入框
3. 瀏覽器自動顯示可用的 Passkey
4. 使用者選擇 Passkey
5. 自動完成驗證和登入

## 錯誤處理

### 錯誤類型

| 錯誤 | 訊息 | 說明 |
|------|------|------|
| `NotAllowedError` (cancelled) | 驗證已取消 | 使用者主動取消生物辨識 |
| `NotAllowedError` (timeout) | 驗證逾時 | 超過驗證時限（通常 60 秒） |
| `NotAllowedError` (其他) | 驗證被拒絕 | 瀏覽器安全政策阻止驗證 |
| 網路錯誤 | 登入失敗 | 無法連接到後端 API |

### 降級策略

當瀏覽器不支援 WebAuthn 時：

- 顯示錯誤訊息
- 列出支援的瀏覽器版本
- 隱藏登入按鈕

## 技術細節

### 依賴套件

- `@/lib/webauthn/utils`: WebAuthn 工具函式
- `@/lib/webauthn/api`: WebAuthn API Client
- `@/lib/authStore`: 全域認證狀態管理
- `@/components/ui/icons`: PixelIcon 圖示元件
- `sonner`: Toast 通知

### 狀態管理

- `isLoading`: 驗證進行中
- `isSupported`: 瀏覽器支援 WebAuthn
- `supportsConditionalUI`: 瀏覽器支援 Conditional UI
- `conditionalUIActive`: Conditional UI 已初始化
- `formData`: 表單資料（email）
- `errors`: 表單驗證錯誤

### 安全性

- 所有 API 呼叫使用 `credentials: 'include'` 確保 cookies 傳遞
- 使用 HTTPS 確保 WebAuthn 安全性
- Challenge 由後端產生，防止重放攻擊
- 瀏覽器原生生物辨識驗證

## 樣式

### 顏色主題

- 主要顏色: Pip-Boy Green (`#00ff88`)
- 次要顏色: Amber (`#ffbf00`)
- 錯誤顏色: Red (`#ef4444`)
- 背景: Wasteland Dark (`#1a1a1a`)

### 動畫效果

- 載入動畫: 旋轉的 spinner
- 錯誤動畫: 搖晃的警告圖示
- Hover 效果: 按鈕背景顏色變化

## 無障礙

- ARIA labels 標註所有互動元素
- 鍵盤導航支援
- Screen reader 友善
- 載入狀態提示

## 測試

測試檔案位於 `src/components/auth/__tests__/PasskeyLoginForm.test.tsx`

### 測試覆蓋範圍

- 表單渲染
- Email-guided 登入流程
- Usernameless 登入流程
- Conditional UI 支援
- 錯誤處理
- 載入狀態
- 瀏覽器相容性
- 成功回調

## 範例場景

### 場景 1：新用戶首次登入

```tsx
// 在登入頁面
<PasskeyLoginForm
  showEmailField
  enableConditionalUI
  onSuccess={(result) => {
    // 導向新用戶引導頁面
    router.push('/onboarding');
  }}
/>
```

### 場景 2：快速登入（Usernameless）

```tsx
// 在首頁快速登入區塊
<PasskeyLoginForm
  onSuccess={() => {
    toast.success('歡迎回來！');
  }}
/>
```

### 場景 3：整合到現有登入表單

```tsx
// 在 LoginForm 中加入 Passkey 選項
<LoginForm hidePasskey={false} />
// 或
<div className="space-y-4">
  <PasswordLoginForm />
  <Divider />
  <PasskeyLoginForm showEmailField />
</div>
```

## 瀏覽器支援

| 瀏覽器 | 最低版本 | Conditional UI |
|--------|---------|----------------|
| Chrome | 67+ | ✅ 108+ |
| Safari | 13+ | ✅ 16+ |
| Firefox | 60+ | ❌ |
| Edge | 18+ | ✅ 108+ |

## 相關文件

- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [WebAuthn Guide](https://webauthn.guide/)
- [Passkey Implementation Guide](.kiro/specs/passkey-authentication/design.md)
- [WebAuthn API Documentation](src/lib/webauthn/README.md)

## 維護者

- 開發: Kiro Spec-Driven Development
- TDD 循環: Stage 9 - Passkey 登入 UI
- 版本: 1.0.0
