# 🔍 認證監控日誌實作摘要

## 修改的檔案清單

### 核心認證邏輯
- ✅ `/src/lib/authStore.ts` - 核心認證 Store
  - Token 狀態檢查日誌
  - 初始化流程日誌
  - 登出觸發日誌（含呼叫堆疊追蹤）
  - Token 監控器日誌

### API 錯誤處理
- ✅ `/src/lib/api.ts` - API 請求層
  - 401 錯誤處理日誌
  - Token 刷新日誌
  - 重導向日誌

### Store 層
- ✅ `/src/lib/stores/bingoStore.ts` - Bingo 遊戲 Store
  - 401 錯誤重導向日誌
- ✅ `/src/lib/stores/achievementStore.ts` - 成就系統 Store
  - 401 錯誤重導向日誌
- ✅ `/src/lib/sessionManager.ts` - Session 管理（已棄用）
  - Session 刷新失敗日誌

### 頁面組件
- ✅ `/src/app/bingo/page.tsx` - Bingo 頁面
  - 認證檢查重導向日誌
- ✅ `/src/app/dashboard/page.tsx` - Dashboard 頁面
  - 認證檢查重導向日誌
- ✅ `/src/app/achievements/page.tsx` - 成就頁面
  - 認證檢查重導向日誌

---

## 日誌類別速查表

| Emoji | 日誌類型 | 檔案位置 |
|-------|---------|---------|
| 🚪 | 登出觸發 | authStore.ts |
| ⏰ | Token 狀態檢查 | authStore.ts |
| ✅ | 初始化成功 | authStore.ts |
| ⚠️ | Token 過期警告 | authStore.ts |
| 🔒 | 清除認證狀態 | authStore.ts |
| 🔄 | 監控器啟動 | authStore.ts |
| 🚫 | 401 錯誤 | api.ts, stores/*.ts |
| 🔀 | 路由導向 | api.ts, pages/*.tsx |
| ❌ | 失敗/錯誤 | api.ts, sessionManager.ts |

---

## 快速使用方式

### 1. 開啟 DevTools Console
```
F12 或 Cmd+Option+I (Mac)
→ Console 標籤
→ 勾選 "Preserve log"
```

### 2. 篩選日誌
```
Filter: [AuthStore]  // 只看 authStore 日誌
Filter: [API]        // 只看 API 日誌
Filter: 🚪           // 只看登出日誌
```

### 3. 追蹤登出原因
當登出發生時，搜尋 `🚪 LOGOUT TRIGGERED`，檢查 `caller` 欄位：

```javascript
[AuthStore] 🚪 LOGOUT TRIGGERED
{
  caller: [
    "at logout (authStore.ts:365)",
    "at startTokenExpiryMonitor (authStore.ts:558)"
  ]
}
```
→ 由 Token 監控器觸發

---

## 常見登出情境

### 情境 A: Token 過期自動登出
```
[AuthStore] ⏰ Token Status Check { isValid: false }
→ [AuthStore] ⚠️ TOKEN EXPIRED
→ [AuthStore] 🚪 LOGOUT TRIGGERED
```
**原因**: Token 真的過期
**解決**: 檢查 Token 有效期配置

### 情境 B: API 401 錯誤
```
[API] 🚫 401 Unauthorized { endpoint: "/api/v1/bingo/status" }
→ [API] ❌ Token refresh failed
→ [API] 🔀 Redirecting to login
```
**原因**: API 返回 401，刷新失敗
**解決**: 檢查後端 Token 驗證

### 情境 C: 頁面路由檢查
```
[Dashboard] 🔀 Auth check redirect
{
  reason: "User not authenticated"
}
```
**原因**: 頁面檢測到 user 為 null
**解決**: 追蹤為何 user 被清空

---

## 完整文件

詳細使用指南請參考：`/docs/AUTH_MONITORING_GUIDE.md`

內容包括：
- 📋 所有日誌格式說明
- 🎯 完整追蹤流程
- 🔧 常見問題排查
- 📊 日誌分析範例
- 🚨 緊急排查清單

---

**文件版本**: 1.0
**最後更新**: 2025-10-30
