# Requirements Document

## Introduction

個人塔羅日記系統是 Wasteland Tarot 平台的核心功能擴展，讓使用者能在完成占卜後記錄心得、反思與心情，透過長期的日記累積提供個人化的占卜體驗回顧，增強使用者參與度與平台粘性。

### 業務價值
- **提升留存率**：透過日記功能鼓勵使用者持續回訪並記錄占卜體驗（目標：20-25% 留存率提升）
- **深化參與度**：日記撰寫促進使用者對占卜結果的深度思考，提高每次占卜的價值感
- **數據洞察**：使用者的心情標籤與日記內容提供寶貴的使用者行為數據
- **社群基礎**：為未來的日記分享、社群功能奠定基礎

### 目標使用者
- **深度占卜用戶**：需要記錄並回顧占卜體驗的使用者
- **自我探索用戶**：透過塔羅占卜進行自我反思的使用者
- **長期追蹤用戶**：想要追蹤占卜準確度與心境變化的使用者

### 設計原則
1. **簡單優先**：MVP 使用最簡單的實作方式（textarea + preview）
2. **漸進增強**：功能分 Phase 1/2/3 逐步推出
3. **獨立性**：不影響現有占卜流程
4. **隱私保護**：日記預設私密，使用者完全控制
5. **數據綁定**：日記必須綁定占卜記錄（`reading_id NOT NULL`）

---

## Requirements

### Requirement 1: 日記撰寫與編輯
**Objective:** 作為平台使用者，我希望能在完成占卜後立即撰寫日記，記錄我的心得與當下心情

#### Acceptance Criteria

1. WHEN 使用者完成一次占卜時 THEN 系統 SHALL 在占卜結果頁面提供「撰寫日記」按鈕

2. WHERE 使用者點擊「撰寫日記」 THE 系統 SHALL 開啟日記編輯介面，包含：
   - Markdown 文字輸入區（`<textarea>`）
   - 即時 Markdown 預覽區
   - 心情標籤選擇器（多選，最多 5 個）
   - 隱私設定開關（預設：私密）
   - 儲存與取消按鈕

3. WHEN 使用者輸入 Markdown 文字時 THEN 系統 SHALL 在預覽區即時渲染 Markdown 語法（支援：標題、粗體、斜體、列表、連結）

4. IF 日記內容超過 10,000 字 THEN 系統 SHALL 顯示警告訊息並阻止儲存

5. WHERE 心情標籤選擇器 THE 系統 SHALL 提供至少 8 個預設心情標籤：
   - happy（開心）
   - anxious（焦慮）
   - confused（困惑）
   - hopeful（充滿希望）
   - peaceful（平靜）
   - excited（興奮）
   - worried（擔憂）
   - reflective（反思）

6. WHEN 使用者點擊「儲存」 THEN 系統 SHALL 驗證必填欄位並呼叫 `POST /api/readings/{reading_id}/journal` API

7. IF API 回傳成功 THEN 系統 SHALL 顯示成功訊息並導向日記詳情頁

8. WHERE 使用者已為該占卜撰寫過日記 THE 系統 SHALL 顯示「編輯日記」而非「撰寫日記」

9. WHEN 使用者編輯已存在的日記時 THEN 系統 SHALL 預填現有內容並呼叫 `PUT /api/journal/{journal_id}` API 更新

---

### Requirement 2: 日記列表與瀏覽
**Objective:** 作為平台使用者，我希望能查看我所有的日記列表，並快速找到特定日記

#### Acceptance Criteria

1. WHEN 使用者訪問 `/journal` 頁面 THEN 系統 SHALL 呼叫 `GET /api/journal` API 並顯示日記列表

2. WHERE 日記列表 THE 系統 SHALL 顯示每篇日記的以下資訊：
   - 關聯的占卜類型與問題
   - 日記撰寫日期
   - 心情標籤（最多顯示 3 個，其餘用「+N」表示）
   - 日記內容前 100 字（純文字，移除 Markdown 語法）
   - 隱私狀態圖示

3. WHEN 日記數量超過 20 篇 THEN 系統 SHALL 實作分頁功能，每頁顯示 20 篇

4. WHERE 日記列表排序 THE 系統 SHALL 預設按「撰寫時間由新到舊」排序

5. IF 使用者尚未撰寫任何日記 THEN 系統 SHALL 顯示空狀態提示：「還沒有日記記錄，完成占卜後開始撰寫你的第一篇日記吧！」

6. WHEN 使用者點擊日記卡片時 THEN 系統 SHALL 導向該日記的詳情頁 `/journal/{journal_id}`

---

### Requirement 3: 日記詳情檢視
**Objective:** 作為平台使用者，我希望能查看完整的日記內容，並回顧當時的占卜結果

#### Acceptance Criteria

1. WHEN 使用者訪問 `/journal/{journal_id}` 頁面 THEN 系統 SHALL 呼叫 `GET /api/journal/{journal_id}` API

2. WHERE 日記詳情頁 THE 系統 SHALL 顯示：
   - 關聯占卜的完整資訊（占卜類型、問題、抽到的牌）
   - 日記完整內容（渲染 Markdown）
   - 所有心情標籤
   - 撰寫時間與最後更新時間
   - 編輯與刪除按鈕（僅日記擁有者可見）

3. IF 使用者點擊「編輯」 THEN 系統 SHALL 開啟編輯模式，載入日記編輯介面

4. IF 使用者點擊「刪除」 THEN 系統 SHALL 顯示確認對話框：「確定要刪除這篇日記嗎？此操作無法復原。」

5. WHEN 使用者確認刪除時 THEN 系統 SHALL 呼叫 `DELETE /api/journal/{journal_id}` API 並在成功後導向 `/journal` 列表頁

6. WHERE API 回傳 404 錯誤 THE 系統 SHALL 顯示「日記不存在」錯誤頁面

7. WHERE API 回傳 403 錯誤 THE 系統 SHALL 顯示「無權限訪問此日記」錯誤頁面

---

### Requirement 4: 簡易搜尋功能（Phase 1 - 客戶端搜尋）
**Objective:** 作為平台使用者，我希望能快速搜尋包含特定關鍵字或心情標籤的日記

#### Acceptance Criteria

1. WHEN 使用者在 `/journal` 頁面輸入搜尋關鍵字時 THEN 系統 SHALL 在客戶端對日記列表進行即時過濾

2. WHERE 搜尋邏輯 THE 系統 SHALL 搜尋以下欄位：
   - 日記內容（Markdown 原始文字）
   - 關聯占卜的問題
   - 心情標籤

3. WHERE 搜尋匹配 THE 系統 SHALL 使用不區分大小寫的部分匹配（contains）

4. WHEN 搜尋結果為空時 THEN 系統 SHALL 顯示「找不到符合的日記」提示

5. WHERE 效能考量 THE 系統 SHALL 僅搜尋當前已載入的日記（不跨分頁搜尋）

6. IF 使用者選擇心情標籤篩選器 THEN 系統 SHALL 僅顯示包含該標籤的日記

---

### Requirement 5: 後端 API 設計
**Objective:** 作為後端開發者，我希望提供完整的 RESTful API 支援日記功能

#### Acceptance Criteria

1. THE 系統 SHALL 實作以下 API endpoints：

   **POST /api/readings/{reading_id}/journal**
   - 請求：`{ content: string, mood_tags: string[], is_private: boolean }`
   - 回應：`{ id: UUID, reading_id: UUID, user_id: UUID, content: string, mood_tags: string[], is_private: boolean, created_at: datetime, updated_at: datetime }`
   - 驗證：content 長度 ≤ 10000 字，mood_tags 最多 5 個
   - 授權：僅限已登入使用者，且 reading_id 必須屬於該使用者

   **GET /api/journal**
   - 查詢參數：`page` (預設 1), `limit` (預設 20, 最大 50)
   - 回應：`{ journals: Journal[], total: number, page: number, limit: number }`
   - 排序：created_at DESC
   - 授權：僅回傳當前使用者的日記

   **GET /api/journal/{journal_id}**
   - 回應：`Journal` 物件（包含關聯的 reading 資訊）
   - 授權：僅日記擁有者可訪問（403 Forbidden 否則）

   **PUT /api/journal/{journal_id}**
   - 請求：`{ content?: string, mood_tags?: string[], is_private?: boolean }`
   - 回應：更新後的 `Journal` 物件
   - 授權：僅日記擁有者可編輯

   **DELETE /api/journal/{journal_id}**
   - 回應：`{ message: "Journal deleted successfully" }`
   - 授權：僅日記擁有者可刪除

2. WHERE 錯誤處理 THE 系統 SHALL 回傳適當的 HTTP 狀態碼：
   - 400 Bad Request：內容驗證失敗
   - 401 Unauthorized：未登入
   - 403 Forbidden：無權限
   - 404 Not Found：日記或占卜不存在
   - 500 Internal Server Error：伺服器錯誤

3. WHERE 效能優化 THE 系統 SHALL 在資料庫查詢時使用適當的索引（user_id, reading_id, created_at）

---

### Requirement 6: 資料模型
**Objective:** 作為資料庫架構師，我希望定義清晰的資料結構支援日記功能

#### Acceptance Criteria

1. THE 系統 SHALL 建立 `reading_journals` 資料表，包含以下欄位：
   - `id`: UUID, PRIMARY KEY
   - `reading_id`: UUID, FOREIGN KEY -> `completed_readings.id`, NOT NULL
   - `user_id`: UUID, FOREIGN KEY -> `users.id`, NOT NULL
   - `content`: TEXT, NOT NULL（儲存 Markdown 文字）
   - `mood_tags`: TEXT[] 或 JSONB（儲存心情標籤陣列）
   - `is_private`: BOOLEAN, DEFAULT TRUE
   - `created_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()
   - `updated_at`: TIMESTAMP WITH TIME ZONE, DEFAULT NOW()

2. WHERE 資料約束 THE 系統 SHALL 建立以下約束：
   - UNIQUE constraint on (reading_id, user_id)（每個占卜每個使用者只能有一篇日記）
   - CHECK constraint: LENGTH(content) <= 10000
   - CHECK constraint: ARRAY_LENGTH(mood_tags) <= 5

3. WHERE 索引優化 THE 系統 SHALL 建立以下索引：
   - INDEX on user_id（查詢使用者所有日記）
   - INDEX on reading_id（查詢特定占卜的日記）
   - INDEX on (user_id, created_at DESC)（支援排序分頁）

4. WHERE 外鍵關聯 THE 系統 SHALL 設定 ON DELETE CASCADE，當占卜或使用者被刪除時自動刪除關聯日記

---

## Phase 2 & 3 功能預告（非本次實作範圍）

### Phase 2: 進階編輯與匯出
- 整合進階 Markdown 編輯器（如 react-markdown-editor）
- Markdown 格式匯出功能（下載所有日記為單一 .md 檔案）
- 日記統計儀表板（總日記數、最常用心情標籤、撰寫習慣分析）

### Phase 3: 高階功能
- PDF 匯出功能（包含占卜結果與日記內容）
- 後端全文搜尋索引（PostgreSQL Full-Text Search）
- 自訂心情標籤
- 日記分享功能（生成唯讀連結）

---

## Non-Functional Requirements

### 效能需求
- 日記列表載入時間 < 1 秒（20 篇日記）
- 日記儲存回應時間 < 500ms
- 客戶端搜尋回應時間 < 100ms

### 安全需求
- 所有 API 必須驗證使用者身份（JWT Token）
- 日記僅擁有者可訪問、編輯、刪除
- 防止 SQL Injection（使用 ORM Parameterized Queries）
- 防止 XSS（Markdown 渲染時過濾危險 HTML）

### 相容性需求
- 支援桌面與行動裝置響應式設計
- Markdown 編輯器支援 Chrome, Firefox, Safari 最新版本

### 可維護性需求
- API 文件整合至 Swagger UI
- 單元測試覆蓋率 > 80%（後端 API）
- 前端元件使用 TypeScript 嚴格模式

---

## Success Metrics

- **功能完整性**：Phase 1 所有 Requirement 通過驗收測試
- **效能指標**：日記列表載入時間 < 1 秒
- **使用者體驗**：占卜完成後 30% 使用者撰寫日記（目標指標）
- **技術品質**：後端 API 測試覆蓋率 > 80%

---

## Dependencies & Risks

### 依賴項目
- `CompletedReading` 資料模型必須已存在
- 使用者認證系統（JWT Token）
- Markdown 渲染庫（react-markdown）

### 風險評估
- **風險 1**：Markdown XSS 攻擊 → **緩解**：使用 `react-markdown` + `remark-gfm`，預設過濾危險 HTML
- **風險 2**：資料庫查詢效能問題 → **緩解**：建立適當索引，限制分頁大小
- **風險 3**：使用者上傳過長內容 → **緩解**：前後端雙重驗證 10000 字限制

---

## Appendix

### 預設心情標籤定義
| 標籤代碼 | 中文名稱 | 英文名稱 | 圖示建議 |
|---------|---------|---------|---------|
| happy | 開心 | Happy | 😊 |
| anxious | 焦慮 | Anxious | 😰 |
| confused | 困惑 | Confused | 😕 |
| hopeful | 充滿希望 | Hopeful | 🌟 |
| peaceful | 平靜 | Peaceful | 😌 |
| excited | 興奮 | Excited | 🎉 |
| worried | 擔憂 | Worried | 😟 |
| reflective | 反思 | Reflective | 🤔 |

### API 請求範例
```json
// POST /api/readings/{reading_id}/journal
{
  "content": "# 今日占卜心得\n\n今天抽到了「愚者」牌，讓我想起了...",
  "mood_tags": ["reflective", "hopeful"],
  "is_private": true
}
```

### 資料庫 Migration 範例
```sql
CREATE TABLE reading_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reading_id UUID NOT NULL REFERENCES completed_readings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 10000),
    mood_tags TEXT[] CHECK (ARRAY_LENGTH(mood_tags, 1) <= 5),
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (reading_id, user_id)
);

CREATE INDEX idx_reading_journals_user_id ON reading_journals(user_id);
CREATE INDEX idx_reading_journals_reading_id ON reading_journals(reading_id);
CREATE INDEX idx_reading_journals_user_created ON reading_journals(user_id, created_at DESC);
```
