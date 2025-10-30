# Cookie State Sync Test Guide

## 測試目的

驗證手動刪除 `access_token` cookie 後，Header 狀態能否正確同步。

## 實作方案

### 方案 A：Header Cookie 檢查

**位置**: `src/components/layout/Header.tsx`

**功能**: 在每次渲染時檢查 cookie 狀態，若發現 user 存在但 cookie 不存在，自動登出

**日誌輸出**:
```javascript
[Header] ⚠️ User in store but no cookie - Logging out
```

### 方案 B：LoginForm Initialize

**位置**: `src/components/auth/LoginForm.tsx`

**功能**: 在登入頁載入時呼叫 `initialize()` 檢查狀態同步

**日誌輸出**:
```javascript
[LoginForm] 🔄 Initializing auth store to check state sync
[AuthStore] ⚠️ Cookie missing but localStorage has user - Clearing state
```

## 測試步驟

### 1. 準備測試環境

```bash
# 啟動開發伺服器
bun run dev
```

### 2. 正常登入

1. 開啟 http://localhost:3000/auth/login
2. 使用 Google 或 Email/密碼登入
3. 確認 Header 顯示登入狀態（顯示使用者名稱）
4. 開啟 DevTools Console，確認沒有錯誤

### 3. 測試 Header Cookie 檢查（方案 A）

1. **保持在任何已登入的頁面**（如 /dashboard）
2. 開啟 DevTools Console
3. **手動刪除 cookie**:
   ```javascript
   document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
   ```
4. **重新整理頁面**或**與頁面互動**（例如點擊按鈕）
5. **預期行為**:
   - Console 輸出: `[Header] ⚠️ User in store but no cookie - Logging out`
   - Console 輸出: `[AuthStore] 🚪 LOGOUT TRIGGERED`
   - Header 狀態立即更新為未登入狀態
   - 若在需要認證的頁面，會被 middleware 重導向至登入頁

### 4. 測試 LoginForm Initialize（方案 B）

1. **正常登入**
2. 開啟 DevTools Console
3. **手動刪除 cookie**:
   ```javascript
   document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
   ```
4. **直接訪問登入頁**: http://localhost:3000/auth/login
5. **預期行為**:
   - Console 輸出: `[LoginForm] 🔄 Initializing auth store to check state sync`
   - Console 輸出: `[AuthStore] ⚠️ Cookie missing but localStorage has user - Clearing state`
   - Console 輸出: `[AuthStore] 🚪 LOGOUT TRIGGERED`
   - Header 狀態立即更新為未登入狀態

## 預期日誌輸出

### 方案 A（Header 檢查）

```javascript
[Header] ⚠️ User in store but no cookie - Logging out
{
  timestamp: "2025-10-30T12:34:56.789Z",
  user: "user@example.com"
}
[AuthStore] 🚪 LOGOUT TRIGGERED
[AuthStore] 🧹 Clearing all user data
```

### 方案 B（LoginForm Initialize）

```javascript
[LoginForm] 🔄 Initializing auth store to check state sync
[AuthStore] 🔄 INITIALIZE STARTED
[AuthStore] ⚠️ Cookie missing but localStorage has user - Clearing state
[AuthStore] 🚪 LOGOUT TRIGGERED
[AuthStore] 🧹 Clearing all user data
```

## 錯誤情況處理

### 如果沒有日誌輸出

1. **檢查 Console Filter**: 確保 Console 顯示所有日誌類型（Verbose、Info、Warning、Error）
2. **檢查 authStore**: 確認 `src/lib/authStore.ts` 有正確的 console.log/console.warn 語句
3. **檢查是否有 console.log 被移除**: 搜尋專案中的 `console.log` 確認沒有被刪除

### 如果 Header 狀態未更新

1. **檢查 user 狀態**: 在 Console 執行 `localStorage.getItem('pip-boy-user')`
2. **檢查 cookie**: 在 Console 執行 `document.cookie`
3. **確認 logout() 被呼叫**: 在 authStore 的 logout() 方法加入 `debugger` 中斷點

## 成功標準

✅ **方案 A 成功**:
- Header 檢測到 cookie 不存在
- 自動呼叫 logout()
- Header 狀態立即更新
- Console 有完整日誌

✅ **方案 B 成功**:
- LoginForm 呼叫 initialize()
- authStore 檢測到狀態不同步
- 自動清理並登出
- Header 狀態立即更新
- Console 有完整日誌

✅ **整體成功**:
- 無論從哪個入口點（Header 或 LoginForm），狀態都能正確同步
- 使用者不會看到錯誤的登入狀態
- Console 有清晰的日誌追蹤

## 已知限制

1. **方案 A**: 只在 Header 元件被渲染時觸發檢查
2. **方案 B**: 只在訪問登入頁時觸發檢查
3. **兩者結合**: 確保在任何情況下都能同步狀態

## 回報格式

測試完成後，請回報：

```markdown
## 測試結果

**測試環境**: [瀏覽器名稱與版本]
**測試日期**: [日期]

### 方案 A（Header 檢查）
- [ ] 日誌正確輸出
- [ ] Header 狀態正確更新
- [ ] 登出流程正常

### 方案 B（LoginForm Initialize）
- [ ] 日誌正確輸出
- [ ] 狀態正確同步
- [ ] 登出流程正常

### 整合測試
- [ ] 兩種方案都能正常工作
- [ ] 無重複登出
- [ ] 無狀態衝突

### 遇到的問題
[描述任何遇到的問題]

### 建議改進
[可選：提出任何改進建議]
```

---

**修改檔案**:
- `src/components/layout/Header.tsx` - 加入 cookie 檢查邏輯
- `src/components/auth/LoginForm.tsx` - 加入 initialize() 呼叫

**相關檔案**:
- `src/lib/authStore.ts` - 認證狀態管理
- `src/middleware.ts` - 認證中介層
