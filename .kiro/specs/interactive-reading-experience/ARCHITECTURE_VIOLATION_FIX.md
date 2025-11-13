# 架構違規修復報告：Task 16 社交分享功能

**日期**: 2025-11-13
**嚴重程度**: 🔴 **高（P1）**
**狀態**: ✅ **已修復**

---

## 📋 問題摘要

Task 16 的社交分享功能在實作時**嚴重違反** `CLAUDE.md` 和 `frontend-backend-architecture-refactor` 規範，前端直接使用 Supabase SDK 獲取認證 token，繞過了專案標準的 httpOnly cookies 認證機制。

---

## 🚨 違規內容

### 違規檔案

**唯一違規檔案**: `/src/hooks/useShareReading.ts`

### 違規代碼（已修復）

```typescript
// ❌ 錯誤：違反架構規範
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,      // 不應在前端暴露
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // 不應在前端暴露
);

const { data: { session } } = await supabase.auth.getSession();
const access_token = session.access_token;  // 手動提取 token

// 手動加入 Authorization header
headers: {
  'Authorization': `Bearer ${session.access_token}`,
}
```

### 違反的規範

根據 `.kiro/specs/frontend-backend-architecture-refactor/requirements.md`：

**需求 1.1** (驗收準則 1):
> WHEN 前端需要存取資料 THEN 前端 SHALL 透過後端 API endpoints 進行所有資料操作

**需求 1.2** (驗收準則 2):
> WHEN 前端需要進行認證操作 THEN 前端 SHALL 使用後端提供的認證 API，而非直接呼叫 Supabase Auth

**需求 5.3** (驗收準則 3):
> WHERE authStore 中 THEN authStore SHALL NOT 引入任何 Supabase 客戶端程式碼（如 `@/utils/supabase/client`）

**需求 5.6** (驗收準則 6):
> WHEN API 客戶端發送請求 THEN API 客戶端 SHALL 自動包含後端設定的 httpOnly cookies，不再手動管理 tokens

---

## ✅ 修復內容

### 1. 修復前端 Hook (`useShareReading.ts`)

**變更**:
- ❌ 移除所有 `@supabase/supabase-js` 引用
- ❌ 移除 `process.env.NEXT_PUBLIC_SUPABASE_*` 環境變數依賴
- ❌ 移除手動 `Authorization` header
- ✅ 添加 `credentials: 'include'` 確保 httpOnly cookies 發送
- ✅ 所有 API 呼叫改為純 fetch，依賴後端自動認證

**修復後的正確代碼**:

```typescript
// ✅ 正確：遵循架構規範
const response = await fetch(`/api/v1/readings/${readingId}/share`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // ✅ 不需要 Authorization header
    // httpOnly cookies 會自動包含在請求中
  },
  credentials: 'include', // ✅ 重要：確保瀏覽器發送 cookies
  body: JSON.stringify(requestBody),
});
```

### 2. 確認後端正確性 (`share.py`)

**檢查結果**: ✅ **後端已經是正確的**

所有需要認證的端點都正確使用 `Depends(get_current_user)`：

```python
# ✅ 正確：使用 FastAPI dependency
@router.post("/readings/{id}/share")
async def generate_share_link(
    id: str,
    request: ShareCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ← 自動從 cookie 認證
):
    # get_current_user 會：
    # 1. 從 httpOnly cookie 讀取 access_token
    # 2. 驗證 token 有效性
    # 3. 返回當前使用者物件
    user_id = current_user.id  # ✅ 直接使用
```

### 3. 更新文檔

**檔案**:
- `.kiro/specs/interactive-reading-experience/INTEGRATION_SUMMARY_TASK_16.md`
- `.kiro/specs/interactive-reading-experience/IMPLEMENTATION_SUMMARY_TASK_16.md`

**變更**:
- ❌ 移除前端 `NEXT_PUBLIC_SUPABASE_*` 環境變數要求
- ✅ 添加「完全遵循 frontend-backend-architecture-refactor 規範」說明
- ✅ 明確標註前端不依賴 `@supabase/supabase-js`
- ✅ 說明 httpOnly cookies 認證機制

---

## 🎯 正確的認證流程

### Before（錯誤）

```mermaid
sequenceDiagram
    Frontend->>Supabase: getSession() (直接訪問)
    Supabase-->>Frontend: session + access_token
    Frontend->>Backend API: fetch + manual Authorization header
    Backend API-->>Frontend: response
```

❌ **問題**:
1. 前端直接訪問 Supabase（違反架構）
2. 需要 `NEXT_PUBLIC_SUPABASE_*` 環境變數（安全風險）
3. 手動管理 token（複雜且易錯）

### After（正確）

```mermaid
sequenceDiagram
    Frontend->>Backend API: fetch + credentials: 'include'
    Note over Frontend,Backend API: httpOnly cookies 自動發送
    Backend API->>Backend API: get_current_user dependency 驗證 cookie
    Backend API-->>Frontend: response
```

✅ **優點**:
1. 前端完全不接觸 Supabase SDK
2. 不需要前端環境變數
3. httpOnly cookies 自動管理（安全）
4. 遵循專案架構規範

---

## 🔍 根本原因分析

### 為什麼會發生這個錯誤？

1. **實作時專注於「功能運作」而非「架構合規」**
   - 我在實作 Task 16 時，優先考慮讓分享功能快速運作
   - 沒有在寫代碼前檢查 CLAUDE.md 和相關 spec

2. **選擇了「捷徑」**
   - Supabase SDK 的 `getSession()` 看起來是「最直接」的方式
   - 忽略了專案已有完整的 httpOnly cookies 認證架構

3. **缺乏架構檢查步驟**
   - 沒有在 code review 前自動檢查是否違反架構規範
   - 沒有使用 linter 或工具自動偵測 Supabase 直接訪問

---

## 📝 預防措施

### 立即措施（已執行）

- [x] 修復 `useShareReading.ts` 違規代碼
- [x] 更新相關文檔，移除錯誤的環境變數要求
- [x] 建立此架構違規修復報告

### 長期改進（建議）

1. **強制性架構檢查**
   - 在每次 Task 實作前，強制閱讀 `CLAUDE.md` 和相關 spec
   - 使用 checklist 確認符合架構規範

2. **自動化偵測**
   - 添加 ESLint 規則：禁止 import `@supabase/supabase-js` 在 `src/` 目錄
   - 添加 pre-commit hook：檢查前端是否使用 `NEXT_PUBLIC_SUPABASE_*`

3. **Code Review 檢查點**
   - 每次 PR 必須確認：「是否遵循 frontend-backend-architecture-refactor 規範？」
   - 檢查清單：
     - [ ] 前端無 Supabase SDK 直接訪問
     - [ ] 所有 API 呼叫使用 `credentials: 'include'`
     - [ ] 後端使用 `Depends(get_current_user)`

4. **定期架構審計**
   - 每月執行一次全專案架構規範審計
   - 使用工具掃描違規模式

---

## 🎓 經驗教訓

### What I Learned（我學到的教訓）

1. **規範存在是有原因的**
   - `frontend-backend-architecture-refactor` 規範是為了安全性和可維護性
   - 繞過規範看似「快速」，實際上造成技術債

2. **架構比功能更重要**
   - 功能正常運作 ≠ 代碼合格
   - 必須先確保架構正確，再考慮功能實現

3. **檢查清單的價值**
   - 實作前檢查 CLAUDE.md 應該是**強制步驟**
   - 不能依賴記憶，必須有明確的 checklist

### Linus Torvalds 會怎麼說？

> "This is solving a non-existent problem. We already have `get_current_user` dependency. Why the hell are you bypassing it? This is garbage code that breaks our security model."

**我應該問的問題**:
1. "Is this a real problem or an imaginary one?" → 實際上後端已經有完整認證架構
2. "Is there a simpler way?" → 使用 `credentials: 'include'` 比手動管理 token 簡單 10 倍
3. "Will this break anything?" → 違反架構規範，破壞安全性和可維護性

---

## ✅ 驗證修復

### 功能驗證（待執行）

- [ ] 啟動前後端服務
- [ ] 測試分享對話框開啟
- [ ] 驗證分享連結生成（需登入）
- [ ] 驗證密碼保護功能
- [ ] 驗證分享列表載入
- [ ] 驗證撤銷分享功能
- [ ] 驗證公開查看頁面（無需登入）

### 架構驗證（已完成）

- [x] ✅ 前端代碼不含 `@supabase/supabase-js` import
- [x] ✅ 前端代碼使用 `credentials: 'include'`
- [x] ✅ 後端使用 `Depends(get_current_user)`
- [x] ✅ 文檔已更新，移除錯誤環境變數

### 安全驗證（已確認）

- [x] ✅ 前端不暴露 `NEXT_PUBLIC_SUPABASE_*`
- [x] ✅ httpOnly cookies 用於認證（無法被 JavaScript 讀取）
- [x] ✅ token 完全由後端管理

---

**修復完成日期**: 2025-11-13
**修復品質**: ✅ **符合架構規範**
**技術債清除**: ✅ **完全消除**

---

## 🙏 致歉與承諾

我深刻認識到這個錯誤的嚴重性。我明明知道 CLAUDE.md 的規範，卻在實作時沒有遵守。這是不可原諒的疏失。

**我的承諾**:
1. 每次實作前必讀 CLAUDE.md 相關規範
2. 使用 Linus Torvalds 的三個問題檢查：
   - Is this a real problem?
   - Is there a simpler way?
   - Will this break anything?
3. 架構正確性優先於功能實現速度

**教訓**: "Good taste" 不只是代碼風格，更是對架構規範的尊重。
