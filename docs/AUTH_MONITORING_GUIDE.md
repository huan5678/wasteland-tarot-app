# 🔍 認證系統監控日誌使用指南

## 概述

本專案已在關鍵的認證流程和登出觸發點加入詳細的 console.log 監控，幫助追蹤「不定時登出」問題的真正原因。

所有監控日誌都遵循統一的格式：
- **Emoji 前綴**：方便快速識別（🚪=登出, 🗑️=清除, ⏰=檢查, ⚠️=警告, ✅=成功, 🔀=路由導向）
- **Timestamp**：精確的 ISO 8601 時間戳記
- **Context**：相關的上下文資訊（user, endpoint, reason 等）
- **Caller tracking**：部分日誌包含呼叫堆疊，追蹤觸發來源

---

## 📋 日誌類別索引

### 1. 核心認證邏輯 (authStore.ts)

#### 🔄 Token 狀態檢查
```
[AuthStore] ⏰ Token Status Check
```
**觸發時機**：
- Token 即將過期（5 分鐘內）
- Token 已過期

**包含資訊**：
- `timestamp`: 檢查時間
- `isValid`: Token 是否有效
- `expiresAt`: Token 過期時間
- `currentTime`: 當前時間
- `remainingSeconds`: 剩餘秒數
- `remainingMinutes`: 剩餘分鐘數

**如何使用**：
- 如果看到 `isValid: false`，表示 Token 已過期
- 檢查 `remainingMinutes` 來判斷是否提前過期
- 比對 `expiresAt` 和 `currentTime` 確認時間計算是否正確

---

#### ✅ 初始化成功
```
[AuthStore] ✅ Initialize: Backend validation successful
```
**觸發時機**：`initialize()` 成功驗證後端 `/api/v1/auth/me`

**包含資訊**：
- `timestamp`: 初始化時間
- `userId`: 用戶 ID
- `email`: 用戶郵箱
- `hasTokenExpires`: 是否有 Token 過期時間
- `tokenExpiresAt`: Token 過期時間（ISO 格式）

**如何使用**：
- 確認初始化流程正常執行
- 檢查 Token 過期時間是否合理（通常 1-24 小時）

---

#### ⚠️ 使用 localStorage Fallback
```
[AuthStore] ⚠️ Initialize: Using localStorage fallback
```
**觸發時機**：後端驗證失敗，但 localStorage 狀態仍有效

**包含資訊**：
- `timestamp`: 觸發時間
- `hasValidAuthState`: localStorage 狀態是否有效
- `user`: 用戶郵箱
- `reason`: 觸發原因

**如何使用**：
- 這是正常的降級機制（應對暫時性網路問題）
- 如果頻繁出現，可能是後端連線不穩定
- 檢查後續是否有 401 錯誤導致登出

---

#### 🔒 清除認證狀態
```
[AuthStore] 🔒 Initialize: Clearing auth state
```
**觸發時機**：Token 過期或無效，清除登入狀態

**包含資訊**：
- `timestamp`: 清除時間
- `reason`: 清除原因
- `hasValidAuthState`: localStorage 狀態是否有效
- `hasUser`: 是否有用戶資料

**如何使用**：
- 這是預期的登出行為
- 檢查 `reason` 來確認是否因 Token 過期
- 如果頻繁清除，檢查 Token 有效期配置

---

#### 🚪 登出觸發
```
[AuthStore] 🚪 LOGOUT TRIGGERED
```
**觸發時機**：任何呼叫 `logout()` 的地方

**包含資訊**：
- `timestamp`: 登出時間
- `caller`: 呼叫堆疊（追蹤觸發來源）
- `currentUser`: 當前用戶郵箱
- `isInitialized`: 是否已初始化
- `authMethod`: 認證方式（passkey/password/oauth）

**如何使用**：
- **最重要的日誌！** 追蹤意外登出的來源
- 檢查 `caller` 堆疊來確認是哪個函式觸發登出
- 比對時間戳記與用戶反映的登出時間

**範例堆疊分析**：
```javascript
caller: [
  "at logout (authStore.ts:365)",
  "at startTokenExpiryMonitor (authStore.ts:558)",
  "at Timeout._onTimeout (authStore.ts:546)"
]
```
表示由 Token 監控器觸發的自動登出。

---

#### ⚠️ Token 過期自動登出
```
[AuthStore] ⚠️ TOKEN EXPIRED - Auto logout triggered by monitor
```
**觸發時機**：Token 監控器檢測到過期

**包含資訊**：
- `timestamp`: 觸發時間
- `user`: 用戶郵箱
- `authMethod`: 認證方式

**如何使用**：
- 檢查是否真的過期（比對 Token Status Check 日誌）
- 確認監控器頻率是否過高（目前 10 分鐘）

---

#### 🔄 Token 監控器啟動
```
[AuthStore] 🔄 Token expiry monitor started
```
**觸發時機**：啟動 Token 過期監控

**包含資訊**：
- `timestamp`: 啟動時間
- `checkInterval`: 檢查間隔（"10 minutes"）

**如何使用**：
- 確認監控器正常啟動
- 檢查是否重複啟動（可能導致記憶體洩漏）

---

### 2. API 錯誤處理 (api.ts)

#### 🚫 401 Unauthorized
```
[API] 🚫 401 Unauthorized - Attempting token refresh
```
**觸發時機**：API 請求返回 401，嘗試刷新 Token

**包含資訊**：
- `timestamp`: 觸發時間
- `endpoint`: API 端點
- `method`: HTTP 方法（GET/POST/...）

**如何使用**：
- 追蹤哪個 API 請求觸發 401
- 檢查是否特定端點頻繁 401

---

#### ✅ Token 刷新成功
```
[API] ✅ Token refresh succeeded, retrying request
```
**觸發時機**：Token 刷新成功，重試原始請求

**包含資訊**：
- `timestamp`: 刷新時間
- `endpoint`: 重試的端點

**如何使用**：
- 確認 Token 刷新機制正常運作
- 如果頻繁刷新，檢查 Token 有效期配置

---

#### ⚠️ 刷新後重試失敗
```
[API] ⚠️ Retry after token refresh failed
```
**觸發時機**：Token 刷新後重試請求仍失敗

**包含資訊**：
- `timestamp`: 失敗時間
- `endpoint`: 失敗的端點
- `status`: HTTP 狀態碼

**如何使用**：
- 可能是 Token 真的過期
- 檢查後端 Token 驗證邏輯

---

#### ❌ Token 刷新失敗
```
[API] ❌ Token refresh failed - Clearing auth state
```
**觸發時機**：Token 刷新失敗，清除認證狀態

**包含資訊**：
- `timestamp`: 失敗時間
- `endpoint`: 原始請求端點
- `currentPath`: 當前頁面路徑

**如何使用**：
- **重要！** 表示即將登出
- 檢查是否特定端點導致刷新失敗
- 確認後端 `/api/v1/auth/refresh` 端點狀態

---

#### 🔀 重導向至登入頁
```
[API] 🔀 Redirecting to login (protected route)
```
**觸發時機**：Token 刷新失敗，重導向至登入頁（僅受保護路由）

**包含資訊**：
- `timestamp`: 重導向時間
- `from`: 當前路徑
- `to`: 目標路徑（含 returnUrl）

**如何使用**：
- 追蹤登出後的跳轉行為
- 確認 returnUrl 是否正確保留

---

#### ℹ️ 跳過重導向（公開路由）
```
[API] ℹ️ Skipping redirect (public route)
```
**觸發時機**：Token 失效，但當前在公開路由（/, /cards, /readings/quick）

**包含資訊**：
- `timestamp`: 觸發時間
- `currentPath`: 當前路徑

**如何使用**：
- 確認公開路由不會被強制登出
- 檢查 `publicPaths` 配置是否正確

---

### 3. Store 401 錯誤 (bingoStore.ts, achievementStore.ts)

#### 🚫 401 錯誤重導向
```
[BingoStore] 🚫 401 Error - Redirecting to login
[AchievementStore] 🚫 401 Error - Redirecting to login
```
**觸發時機**：Store 自定義 API 請求返回 401

**包含資訊**：
- `timestamp`: 觸發時間
- `endpoint`: API 端點
- `reason`: 原因（"auth_required" / "session_expired"）
- `currentPath`: 當前頁面路徑

**如何使用**：
- 追蹤特定功能（Bingo/成就系統）的 401 錯誤
- 檢查是否因 Token 過期導致

---

### 4. Session 管理 (sessionManager.ts - 已棄用)

#### 🚫 Session 刷新失敗
```
[SessionManager] 🚫 Session refresh failed - Logging out
```
**觸發時機**：Supabase Session 刷新失敗

**包含資訊**：
- `timestamp`: 失敗時間
- `error`: 錯誤訊息
- `hasSession`: 是否有 Session

**如何使用**：
- 這個檔案已棄用（違反前後端分離）
- 如果看到此日誌，應該停用 SessionManager

---

#### 🚫 Session 刷新異常
```
[SessionManager] 🚫 Exception during session refresh - Logging out
```
**觸發時機**：Session 刷新過程拋出異常

**包含資訊**：
- `timestamp`: 異常時間
- `error`: 異常訊息

**如何使用**：
- 檢查是否有未預期的異常
- 建議移除 SessionManager 使用

---

### 5. 頁面路由導向 (page.tsx)

#### 🔀 認證檢查重導向
```
[BingoPage] 🔀 Auth check redirect
[Dashboard] 🔀 Auth check redirect
[AchievementsPage] 🔀 Auth check redirect
```
**觸發時機**：頁面初始化時檢測到未登入

**包含資訊**：
- `timestamp`: 觸發時間
- `from`: 來源路徑
- `to`: 目標路徑（/auth/login）
- `reason`: 原因（"User not authenticated"）
- `isInitialized`: 是否已初始化

**如何使用**：
- 追蹤頁面級別的登入檢查
- 確認是否因 `isInitialized` 錯誤導致誤判

---

## 🎯 追蹤「不定時登出」的完整流程

### Step 1: 開啟 Chrome DevTools Console
1. 按 `F12` 或 `Cmd+Option+I`（Mac）
2. 切換到 **Console** 標籤
3. 勾選 **Preserve log**（保留日誌，防止頁面重新整理後清空）
4. 可選：使用 Filter 輸入 `[AuthStore]` 或 `[API]` 來篩選日誌

### Step 2: 正常使用網站
- 登入後正常瀏覽各個頁面
- 執行需要認證的操作（Bingo、成就系統等）
- 等待「不定時登出」發生

### Step 3: 分析登出日誌
當登出發生時，按以下順序檢查：

#### 3.1 尋找 `🚪 LOGOUT TRIGGERED`
```javascript
[AuthStore] 🚪 LOGOUT TRIGGERED
{
  timestamp: "2025-10-30T12:34:56.789Z",
  caller: [
    "at logout (authStore.ts:365)",
    "at handleApiError (api.ts:190)",
    "at apiRequest (api.ts:240)"
  ],
  currentUser: "user@example.com"
}
```
- **最重要！** 確認是誰呼叫 `logout()`
- 檢查 `caller` 堆疊追蹤觸發來源

#### 3.2 往回追蹤觸發原因
**情境 A：Token 監控器觸發**
```javascript
[AuthStore] ⚠️ TOKEN EXPIRED - Auto logout triggered by monitor
→ [AuthStore] 🚪 LOGOUT TRIGGERED
```
**原因**：Token 真的過期
**解決方案**：檢查 Token 有效期配置

---

**情境 B：API 401 錯誤觸發**
```javascript
[API] 🚫 401 Unauthorized - Attempting token refresh
→ [API] ❌ Token refresh failed - Clearing auth state
→ [API] 🔀 Redirecting to login (protected route)
```
**原因**：API 請求 401，刷新 Token 失敗
**解決方案**：
1. 檢查哪個 API 端點導致 401
2. 檢查後端 `/api/v1/auth/refresh` 端點
3. 檢查後端 Token 驗證邏輯

---

**情境 C：Store 401 錯誤觸發**
```javascript
[BingoStore] 🚫 401 Error - Redirecting to login
```
**原因**：Bingo/成就系統 API 返回 401
**解決方案**：檢查 Store 的 `fetchWithAuth` 邏輯

---

**情境 D：Cookie 過期導致跳轉（狀態不同步）**
```javascript
[Middleware] 🔍 Token Check { hasAccessToken: false }
[Middleware] 🔀 Redirect to login (no valid cookie)
// 但是沒有 [AuthStore] 的登出日誌
```
**原因**：
- access_token cookie 已過期（30 分鐘）
- Middleware 檢查不到 cookie 直接跳轉
- localStorage 的 user 狀態還在
- 造成 Header 顯示登入但無法訪問受保護路由

**解決**：
- 前端：authStore.initialize() 檢查 cookie 存在
- 或後端：延長 cookie 過期時間

---

**情境 E：頁面路由檢查觸發**
```javascript
[Dashboard] 🔀 Auth check redirect
{
  from: "/dashboard",
  to: "/auth/login",
  reason: "User not authenticated",
  isInitialized: true
}
```
**原因**：頁面檢測到 `user` 為 null
**解決方案**：往前追蹤為何 `user` 被清空

#### 3.3 檢查 Token 狀態
搜尋 `⏰ Token Status Check` 來確認 Token 是否提前過期：
```javascript
[AuthStore] ⏰ Token Status Check
{
  isValid: false,
  remainingMinutes: -5  // 負數表示已過期
}
```

#### 3.4 檢查初始化日誌
搜尋 `✅ Initialize` 或 `🔒 Initialize` 確認登入狀態初始化過程：
```javascript
[AuthStore] ✅ Initialize: Backend validation successful
{
  tokenExpiresAt: "2025-10-30T13:00:00.000Z"  // 檢查過期時間是否合理
}
```

---

## 🧪 測試驗證：Cookie 過期狀態不同步

### 測試場景：模擬 Cookie 過期（30 分鐘）

**步驟 1：登入網站**
1. 訪問登入頁面並登入
2. 確認登入成功（Header 顯示用戶資訊）
3. 開啟 Chrome DevTools Console
4. 勾選 **Preserve log**

**步驟 2A：自然等待（推薦用於真實測試）**
1. 閒置網站 30 分鐘
2. 點擊任何受保護路由（如 Dashboard）
3. 觀察 Console 日誌

**步驟 2B：手動刪除 Cookie（快速測試）**
1. 開啟 Chrome DevTools > Application 標籤
2. 左側選單展開 **Cookies** > 選擇你的網域
3. 找到 `access_token` 並刪除
4. 點擊任何受保護路由（如 Dashboard）
5. 觀察 Console 日誌

### 預期日誌（修復前）
```javascript
// 用戶點擊 Dashboard
[Middleware] 🔍 Token Check { hasAccessToken: false }
[Middleware] 🔀 Redirect to login (no valid cookie)
// ❌ 沒有 [AuthStore] 的任何日誌
// ❌ Header 還顯示已登入（localStorage 狀態還在）
```

### 預期日誌（修復後）
```javascript
// 用戶點擊 Dashboard
[Middleware] 🔍 Token Check { hasAccessToken: false }
[Middleware] 🔀 Redirect to login (no valid cookie)

// 頁面重新載入後觸發 authStore.initialize()
[AuthStore] ⚠️ Cookie missing but localStorage has user - Clearing state
{
  timestamp: "2025-10-30T14:30:00.000Z",
  user: "user@example.com",
  reason: "Cookie expired but localStorage not cleared",
  hasValidAuthState: true,  // localStorage 認為還有效
  hasCookie: false          // 但 cookie 已被刪除
}
[AuthStore] 🚪 LOGOUT TRIGGERED
[AuthStore] ✅ Logout completed
// ✅ Header 正確顯示登出狀態
```

### 驗證重點
1. **狀態同步**：localStorage 和 cookie 是否一致
2. **日誌完整性**：是否看到完整的清除狀態日誌
3. **UI 正確性**：Header 是否正確顯示登出狀態
4. **無閃爍**：不會出現「先顯示登入再跳轉登出」的閃爍

---

## 🔧 常見問題排查

### Q1: Token 頻繁過期（< 1 小時）
**檢查項目**：
1. 後端 JWT 過期時間配置
2. `saveAuthState()` 是否正確儲存 `expiresAt`
3. 前端時間是否正確（檢查系統時區）

**搜尋日誌**：
```
[AuthStore] ⏰ Token Status Check
```
比對 `expiresAt` 和 `currentTime`

---

### Q2: API 請求頻繁 401
**檢查項目**：
1. 哪個 API 端點導致 401
2. 後端 Token 驗證中間件
3. httpOnly Cookie 是否正確設定

**搜尋日誌**：
```
[API] 🚫 401 Unauthorized
```
統計 `endpoint` 出現次數

---

### Q3: Token 刷新失敗
**檢查項目**：
1. 後端 `/api/v1/auth/refresh` 端點狀態
2. 刷新 Token 是否過期
3. httpOnly Cookie 是否正確傳送

**搜尋日誌**：
```
[API] ❌ Token refresh failed
```
檢查前面是否有 `⚠️ Retry after token refresh failed`

---

### Q4: 誤判未登入（isInitialized 問題）
**檢查項目**：
1. `initialize()` 是否正常執行
2. localStorage 是否被意外清空
3. Zustand persist 中間件是否正常

**搜尋日誌**：
```
[AuthStore] 🔒 Initialize: Clearing auth state
```
檢查 `reason` 和 `hasValidAuthState`

---

## 📊 日誌分析範例

### 範例 1: 正常登入與登出
```javascript
// 登入
[AuthStore] ✅ Initialize: Backend validation successful
[AuthStore] 🔄 Token expiry monitor started

// ... 使用網站 ...

// 主動登出
[AuthStore] 🚪 LOGOUT TRIGGERED
{
  caller: ["at handleLogoutClick (Header.tsx:45)"]  // 使用者點擊登出按鈕
}
[AuthStore] ✅ Logout completed
```
**結論**：正常的主動登出

---

### 範例 2: Token 過期自動登出
```javascript
// 10 分鐘後監控器檢查
[AuthStore] ⏰ Token Status Check
{
  isValid: false,
  remainingMinutes: -2  // 過期 2 分鐘
}

[AuthStore] ⚠️ TOKEN EXPIRED - Auto logout triggered by monitor
[AuthStore] 🚪 LOGOUT TRIGGERED
{
  caller: [
    "at logout (authStore.ts:365)",
    "at startTokenExpiryMonitor (authStore.ts:558)"
  ]
}
```
**結論**：Token 真的過期，自動登出

---

### 範例 3: API 401 導致登出
```javascript
// API 請求失敗
[API] 🚫 401 Unauthorized - Attempting token refresh
{
  endpoint: "/api/v1/bingo/status"
}

[API] ❌ Token refresh failed - Clearing auth state
[API] 🔀 Redirecting to login (protected route)
{
  from: "/bingo",
  to: "/auth/login?returnUrl=%2Fbingo"
}
```
**結論**：Bingo API 返回 401，刷新 Token 失敗

---

## 🚨 緊急排查清單

當使用者回報「不定時登出」時，請使用者提供以下資訊：

1. ✅ 完整的 Console 日誌（Preserve log 勾選）
2. ✅ 登出發生的時間點
3. ✅ 登出前正在執行的操作
4. ✅ 登入後到登出的時間間隔
5. ✅ 瀏覽器版本和作業系統
6. ✅ 是否有跨裝置同時登入

---

## 🔐 安全注意事項

**監控日誌中不會記錄以下敏感資訊**：
- ❌ Token 本身（access_token / refresh_token）
- ❌ 密碼
- ❌ 完整的用戶資料

**只會記錄**：
- ✅ Token 過期時間（timestamp）
- ✅ 用戶郵箱（用於識別）
- ✅ API 端點路徑
- ✅ HTTP 狀態碼

**生產環境建議**：
- 使用環境變數控制日誌等級
- 敏感操作使用 `console.debug()` 而非 `console.log()`
- 定期清理舊日誌

---

## 📝 日誌格式規範

所有監控日誌遵循以下格式：
```typescript
console.log('[Component] 🔄 Action', {
  timestamp: new Date().toISOString(),
  // ... 其他上下文資訊
})
```

**Emoji 對照表**：
- 🚪 登出 (Logout)
- 🗑️ 清除 (Clear)
- ⏰ 檢查 (Check)
- ⚠️ 警告 (Warning)
- ❌ 錯誤 (Error)
- ✅ 成功 (Success)
- 🔀 路由導向 (Redirect)
- 🔄 監控啟動 (Monitor Started)
- 🚫 未授權 (Unauthorized)
- 📡 API 呼叫 (API Call)
- 🔒 狀態清除 (State Cleared)
- ℹ️ 資訊 (Info)

---

## 🛠️ 延伸功能建議

如需更深入的監控，可以考慮：

1. **整合 Sentry**：自動捕獲錯誤和堆疊追蹤
2. **整合 LogRocket**：錄製使用者操作和 Console 日誌
3. **自訂日誌上傳**：將日誌發送至後端分析
4. **Performance API**：追蹤 Token 刷新耗時

---

**文件版本**: 1.0
**最後更新**: 2025-10-30
**維護者**: Frontend Team
