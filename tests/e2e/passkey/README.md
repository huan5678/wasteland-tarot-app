# Passkey E2E 測試指南

## 概述

本目錄包含 Passkey 無密碼認證系統的端對端（E2E）測試，使用 Playwright 測試框架和 Virtual Authenticator 模擬 WebAuthn 裝置。

## 測試檔案

### 核心測試

1. **`passkey-registration.spec.ts`** - Passkey 註冊流程
   - 新用戶使用 Passkey 註冊
   - 已登入用戶新增 Passkey
   - 10 個 Passkey 上限
   - 註冊失敗情境（email 衝突、用戶取消、網路錯誤）
   - **測試數量**: 11 個測試

2. **`passkey-login.spec.ts`** - Passkey 登入流程
   - Email-guided 登入
   - Usernameless 登入
   - Conditional UI (autofill)
   - 登入失敗情境（credential 不存在、驗證失敗、timeout）
   - **測試數量**: 11 個測試

3. **`passkey-management.spec.ts`** - Credential 管理
   - 列出所有 Passkeys
   - 編輯 Passkey 名稱
   - 刪除 Passkey
   - 空狀態與錯誤處理
   - **測試數量**: 10 個測試

### 輔助工具

- **`helpers/webauthn.ts`** - WebAuthn 測試輔助工具
  - Virtual Authenticator 設定與清理
  - WebAuthn 支援檢測
  - 測試資料庫管理

## 前置需求

### 1. 環境設定

確保以下服務正在運行：

```bash
# 前端伺服器（Next.js）
bun dev
# 運行在 http://localhost:3000

# 後端伺服器（FastAPI）
cd backend
uv run python -m app.main
# 運行在 http://localhost:8000
```

### 2. 瀏覽器支援

| 瀏覽器 | Virtual Authenticator | 測試支援 |
|--------|----------------------|----------|
| Chromium | ✅ 完整支援 | ✅ 所有測試 |
| Firefox | ✅ 完整支援 | ✅ 所有測試 |
| Safari (WebKit) | ❌ 不支援 | ⚠️  降級 UI 測試 |

**注意**:
- Safari (WebKit) 不支援 Virtual Authenticator，相關測試會自動跳過
- Conditional UI 測試僅在 Chromium 上執行（Firefox 目前不支援）

### 3. 測試資料庫

建議使用獨立的測試資料庫，避免污染開發資料庫：

```bash
# 設定測試環境變數
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
export REDIS_URL="redis://localhost:6379/1"
```

## 執行測試

### 執行所有 Passkey 測試

```bash
# 所有 Passkey 測試
npx playwright test tests/e2e/passkey*.spec.ts

# 只在 Chromium 上執行
npx playwright test tests/e2e/passkey*.spec.ts --project=chromium

# 只在 Firefox 上執行
npx playwright test tests/e2e/passkey*.spec.ts --project=firefox
```

### 執行特定測試檔案

```bash
# 註冊測試
npx playwright test tests/e2e/passkey-registration.spec.ts

# 登入測試
npx playwright test tests/e2e/passkey-login.spec.ts

# 管理測試
npx playwright test tests/e2e/passkey-management.spec.ts
```

### UI 模式（推薦用於開發）

```bash
# 啟動 Playwright UI
npx playwright test tests/e2e/passkey*.spec.ts --ui
```

UI 模式提供：
- 視覺化測試執行
- 即時重新執行
- 時間軸查看器
- DOM 快照

### Debug 模式

```bash
# 啟動 debug 模式
npx playwright test tests/e2e/passkey-registration.spec.ts --debug
```

### 產生測試報告

```bash
# 執行測試並產生 HTML 報告
npx playwright test tests/e2e/passkey*.spec.ts --reporter=html

# 查看報告
npx playwright show-report
```

## Virtual Authenticator 原理

### 什麼是 Virtual Authenticator？

Virtual Authenticator 是 Chrome DevTools Protocol (CDP) 提供的功能，允許在測試環境中模擬 WebAuthn 裝置（如指紋辨識器、YubiKey 等），無需實體硬體。

### 運作方式

```typescript
// 設定 Virtual Authenticator
await setupVirtualAuthenticator(page, {
  protocol: 'ctap2',           // 使用 CTAP2 協議
  transport: 'internal',        // 模擬內建認證器
  hasResidentKey: true,         // 支援 Resident Key
  hasUserVerification: true,    // 支援用戶驗證
  isUserVerified: true,         // 自動驗證用戶
});

// 測試執行時，Virtual Authenticator 會自動處理：
// - navigator.credentials.create() - 註冊
// - navigator.credentials.get() - 登入
```

### 限制

1. **瀏覽器限制**:
   - ✅ Chromium: 完整支援
   - ✅ Firefox: 完整支援
   - ❌ Safari/WebKit: 不支援

2. **測試限制**:
   - 無法測試實體裝置特定行為（如 TouchID 動畫）
   - 無法測試跨裝置同步
   - Conditional UI 在 Firefox 上不可用

## 測試策略

### TDD 循環

所有測試遵循 **紅燈 → 綠燈 → 重構** 循環：

1. **紅燈（Red）**: 撰寫測試，確認失敗
2. **綠燈（Green）**: 實作功能，讓測試通過
3. **重構（Refactor）**: 優化代碼，保持測試通過

### 測試覆蓋範圍

| 功能 | 覆蓋率 | 測試數量 |
|------|--------|----------|
| 註冊流程 | 100% | 11 |
| 登入流程 | 100% | 11 |
| 管理功能 | 100% | 10 |
| 錯誤處理 | 100% | 已整合 |
| **總計** | **100%** | **32** |

### Mock API 策略

測試使用 Playwright 的 `page.route()` 攔截 API 請求：

```typescript
await page.route('**/api/v1/webauthn/register-new/options', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: { /* mock data */ },
    }),
  });
});
```

**優點**:
- 無需實際後端運行（可選）
- 可模擬各種錯誤情境
- 測試執行速度快
- 可重複性高

**注意**:
- 建議定期與實際後端整合測試
- Mock 資料應與實際 API 回應一致

## 故障排除

### 測試失敗：Virtual Authenticator 未設定

**錯誤訊息**:
```
Error: Virtual Authenticator not found
```

**解決方法**:
1. 確認使用 Chromium 或 Firefox 執行
2. 檢查 `setupVirtualAuthenticator()` 是否在 `beforeEach` 中正確呼叫
3. 確認沒有在 Safari/WebKit 上執行

### 測試逾時

**錯誤訊息**:
```
Timeout 30000ms exceeded
```

**解決方法**:
1. 檢查前後端伺服器是否運行
2. 增加 timeout 設定：
   ```typescript
   await page.waitForURL('/dashboard', { timeout: 10000 });
   ```
3. 檢查網路連線

### API Mock 不生效

**症狀**: 測試呼叫實際 API 而非 Mock

**解決方法**:
1. 確認 `page.route()` 在操作前設定
2. 檢查路由模式是否正確匹配：
   ```typescript
   // 正確：使用萬用字元
   await page.route('**/api/v1/webauthn/**', ...)

   // 錯誤：缺少萬用字元
   await page.route('/api/v1/webauthn/**', ...)
   ```

### 測試在 CI 環境失敗

**常見原因**:
1. 瀏覽器版本不一致
2. 環境變數未設定
3. 資料庫連線問題

**解決方法**:
```yaml
# .github/workflows/test.yml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium firefox

- name: Run E2E Tests
  run: npx playwright test tests/e2e/passkey*.spec.ts
  env:
    CI: true
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## 最佳實踐

### 1. 測試隔離

每個測試應該是獨立的，不依賴其他測試的狀態：

```typescript
test.beforeEach(async ({ page }) => {
  // 每個測試前設定 Virtual Authenticator
  await setupVirtualAuthenticator(page);
});

test.afterEach(async ({ page }) => {
  // 每個測試後清理
  await removeVirtualAuthenticator(page);
});
```

### 2. 使用 data-testid

為關鍵元素添加 `data-testid` 屬性：

```tsx
// 元件中
<div data-testid="passkey-card">
  {/* credential 資訊 */}
</div>

// 測試中
const cards = page.locator('[data-testid="passkey-card"]');
await expect(cards).toHaveCount(3);
```

### 3. Fallout 主題驗證

確保 Fallout 風格文案正確顯示：

```typescript
// 驗證使用 Pip-Boy 術語
await expect(page.getByText(/Pip-Boy|避難所|生物辨識/i)).toBeVisible();
```

### 4. 錯誤訊息驗證

測試應驗證使用者友善的錯誤訊息：

```typescript
// ✅ 好的做法：驗證錯誤訊息內容
await expect(
  page.getByText(/此 email 已在避難所註冊/i)
).toBeVisible();

// ❌ 不好的做法：只檢查有錯誤
await expect(page.locator('[role="alert"]')).toBeVisible();
```

## 持續整合

### GitHub Actions 配置範例

```yaml
name: Passkey E2E Tests

on:
  pull_request:
    paths:
      - 'src/components/auth/**'
      - 'src/lib/webauthn/**'
      - 'tests/e2e/passkey*.spec.ts'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium firefox

      - name: Run Passkey E2E Tests
        run: npx playwright test tests/e2e/passkey*.spec.ts

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 相關文件

- [Playwright 官方文件](https://playwright.dev/)
- [WebAuthn 規範](https://www.w3.org/TR/webauthn-2/)
- [Virtual Authenticator API](https://chromedevtools.github.io/devtools-protocol/tot/WebAuthn/)
- [Passkey 設計文件](/.kiro/specs/passkey-authentication/design.md)
- [Passkey 需求文件](/.kiro/specs/passkey-authentication/requirements.md)

## 貢獻指南

新增測試時：

1. 遵循現有的測試結構和命名慣例
2. 確保測試獨立且可重複執行
3. 添加清楚的測試描述和註解
4. 驗證 Fallout 主題一致性
5. 更新本 README（如有需要）

## 授權

與專案主體相同
