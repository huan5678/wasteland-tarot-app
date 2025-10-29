# 實作計畫 - 塔羅日記系統

## 概述

本實作計畫遵循 **測試驅動開發（TDD）** 原則，每個功能模組都先撰寫測試，再實作功能，最後進行重構。任務按照依賴順序組織：資料庫層 → 後端 API → 前端元件 → 整合測試。

---

## Phase 1: 資料庫基礎建設

- [x] 1. 建立資料庫 schema 與 migration
- [x] 1.1 建立 ReadingJournal 資料表的 Alembic migration
  - 定義資料表結構（id, reading_id, user_id, content, mood_tags, is_private, created_at, updated_at）
  - 設定外鍵約束（reading_id → completed_readings, user_id → users）
  - 新增 UNIQUE 約束（reading_id, user_id）
  - 新增 CHECK 約束（content 長度 ≤ 10000 字、mood_tags 數量 ≤ 5）
  - 設定 ON DELETE CASCADE 行為
  - _Requirements: 6.1, 6.2_

- [x] 1.2 建立資料表索引以優化查詢效能
  - 建立 user_id 索引（查詢使用者所有日記）
  - 建立 reading_id 索引（查詢特定占卜的日記）
  - 建立複合索引（user_id, created_at DESC）支援分頁排序
  - _Requirements: 6.3_

- [x] 1.3 執行 migration 並驗證資料表結構
  - 執行 `alembic upgrade head`
  - 驗證資料表、約束、索引正確建立
  - 測試 migration rollback（`alembic downgrade -1`）
  - _Requirements: 6.1, 6.2, 6.3_

---

## Phase 2: 後端資料模型與驗證層（TDD）

- [x] 2. 實作 SQLAlchemy 資料模型
- [x] 2.1 撰寫 ReadingJournal 模型的單元測試
  - 測試模型欄位定義與型別
  - 測試外鍵關聯（reading, user）
  - 測試 UNIQUE 約束驗證（重複 reading_id + user_id 應失敗）
  - 測試 CHECK 約束驗證（超長內容、過多標籤應失敗）
  - _Requirements: 6.1, 6.2_

- [x] 2.2 實作 ReadingJournal SQLAlchemy 模型
  - 定義資料表映射與欄位型別
  - 設定 relationship（與 CompletedReading, User 的關聯）
  - 實作約束條件（UNIQUE, CHECK）
  - 確保所有單元測試通過
  - _Requirements: 6.1, 6.2_

- [x] 3. 實作 Pydantic Schema 驗證層
- [x] 3.1 撰寫 Pydantic Schema 的驗證測試
  - 測試 JournalCreate schema（content 長度、mood_tags 驗證）
  - 測試 JournalUpdate schema（部分更新驗證）
  - 測試 JournalResponse schema（序列化正確性）
  - 測試心情標籤白名單驗證（僅允許 8 個預設標籤）
  - _Requirements: 5.1, 1.4, 1.5_

- [x] 3.2 實作 Pydantic Schema 定義
  - 定義 JournalCreate（content, mood_tags, is_private）
  - 定義 JournalUpdate（支援部分欄位更新）
  - 定義 JournalResponse（包含關聯的 reading 資訊）
  - 定義 JournalListResponse（分頁回應）
  - 實作 mood_tags 自訂驗證器（validator）
  - 確保所有驗證測試通過
  - _Requirements: 5.1, 1.4, 1.5_

---

## Phase 3: 後端業務邏輯層（TDD）

- [x] 4. 實作 JournalService 業務邏輯
- [x] 4.1 撰寫建立日記功能的測試
  - 測試成功建立日記（正常流程）
  - 測試重複建立失敗（UNIQUE 約束）
  - 測試 reading_id 不存在時失敗（404）
  - 測試 reading 不屬於該使用者時失敗（403）
  - 測試內容超過 10000 字時失敗（400）
  - 測試心情標籤超過 5 個時失敗（400）
  - _Requirements: 1.6, 5.1_

- [x] 4.2 實作建立日記功能
  - 實作 `create_journal()` 方法
  - 驗證 reading 所有權
  - 驗證內容長度與標籤數量
  - 處理重複建立錯誤
  - 確保所有測試通過
  - _Requirements: 1.6, 5.1_

- [x] 4.3 撰寫查詢日記功能的測試
  - 測試查詢使用者所有日記（分頁）
  - 測試查詢特定日記（包含關聯的 reading）
  - 測試查詢不存在的日記（404）
  - 測試查詢他人日記（403）
  - 測試空列表回應（無日記時）
  - _Requirements: 2.1, 3.1, 5.1_

- [x] 4.4 實作查詢日記功能
  - 實作 `list_journals()` 方法（支援分頁）
  - 實作 `get_journal()` 方法（包含 joinedload）
  - 實作所有權驗證邏輯
  - 確保所有測試通過
  - _Requirements: 2.1, 3.1, 5.1_

- [x] 4.5 撰寫更新與刪除日記功能的測試
  - 測試成功更新日記（部分欄位）
  - 測試更新他人日記失敗（403）
  - 測試成功刪除日記
  - 測試刪除他人日記失敗（403）
  - 測試刪除不存在的日記（404）
  - _Requirements: 1.9, 3.4, 3.5, 5.1_

- [x] 4.6 實作更新與刪除日記功能
  - 實作 `update_journal()` 方法（支援部分更新）
  - 實作 `delete_journal()` 方法
  - 實作所有權驗證邏輯
  - 確保所有測試通過
  - _Requirements: 1.9, 3.4, 3.5, 5.1_

---

## Phase 4: 後端 API 路由層（TDD）

- [x] 5. 實作 FastAPI 路由端點
- [x] 5.1 撰寫建立日記 API 的整合測試
  - 測試 POST `/api/v1/readings/{reading_id}/journal` 成功回應（201）
  - 測試未認證請求失敗（401）
  - 測試無效資料失敗（400）
  - 測試重複建立失敗（409）
  - 測試 reading 不屬於使用者失敗（403）
  - _Requirements: 1.6, 1.7, 5.1_

- [x] 5.2 實作建立日記 API 端點
  - 實作 POST `/api/v1/readings/{reading_id}/journal`
  - 整合 JWT 認證（get_current_user dependency）
  - 整合 JournalService.create_journal()
  - 處理錯誤回應（400/401/403/404/409）
  - 確保所有整合測試通過
  - _Requirements: 1.6, 1.7, 5.1_

- [x] 5.3 撰寫查詢日記 API 的整合測試
  - 測試 GET `/api/v1/journal` 成功回應（200，分頁）
  - 測試 GET `/api/v1/journal/{journal_id}` 成功回應（200）
  - 測試查詢他人日記失敗（403）
  - 測試查詢不存在日記失敗（404）
  - 測試未認證請求失敗（401）
  - _Requirements: 2.1, 3.1, 5.1_

- [x] 5.4 實作查詢日記 API 端點
  - 實作 GET `/api/v1/journal`（分頁支援）
  - 實作 GET `/api/v1/journal/{journal_id}`
  - 整合 JournalService 查詢方法
  - 處理錯誤回應（401/403/404）
  - 確保所有整合測試通過
  - _Requirements: 2.1, 3.1, 5.1_

- [x] 5.5 撰寫更新與刪除日記 API 的整合測試
  - 測試 PUT `/api/v1/journal/{journal_id}` 成功回應（200）
  - 測試 DELETE `/api/v1/journal/{journal_id}` 成功回應（200）
  - 測試更新/刪除他人日記失敗（403）
  - 測試無效更新資料失敗（400）
  - _Requirements: 1.9, 3.4, 3.5, 5.1_

- [x] 5.6 實作更新與刪除日記 API 端點
  - 實作 PUT `/api/v1/journal/{journal_id}`
  - 實作 DELETE `/api/v1/journal/{journal_id}`
  - 整合 JournalService 更新/刪除方法
  - 處理錯誤回應（400/401/403/404）
  - 確保所有整合測試通過
  - _Requirements: 1.9, 3.4, 3.5, 5.1_

---

## Phase 5: 前端狀態管理（TDD）

- [x] 6. 實作 Zustand 日記狀態管理
- [x] 6.1 撰寫 journalStore 的單元測試
  - 測試初始狀態（空日記列表）
  - 測試 fetchJournals 方法（API 呼叫與狀態更新）
  - 測試分頁狀態管理（setPage）
  - 測試搜尋狀態管理（setSearchKeyword, toggleMoodTag）
  - 測試刪除日記後重新載入列表
  - _Requirements: 2.1, 4.1_

- [x] 6.2 實作 journalStore Zustand store
  - 定義狀態介面（journals, total, page, searchKeyword 等）
  - 實作 fetchJournals 方法（呼叫 API）
  - 實作分頁與搜尋狀態管理方法
  - 實作 deleteJournal 方法
  - 確保所有單元測試通過
  - _Requirements: 2.1, 4.1_

---

## Phase 6: 前端核心元件（TDD）

- [ ] 7. 實作 JournalEditor 元件
- [ ] 7.1 撰寫 JournalEditor 元件測試
  - 測試 Markdown 輸入與即時預覽切換
  - 測試字數統計顯示（0/10,000）
  - 測試心情標籤選擇（最多 5 個）
  - 測試超過 10,000 字時顯示警告
  - 測試儲存按鈕觸發 onSave 回調
  - 測試取消按鈕觸發 onCancel 回調
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 7.2 實作 JournalEditor 元件
  - 實作 textarea 與 Markdown 預覽區
  - 實作編輯/預覽模式切換
  - 實作字數統計功能
  - 實作心情標籤選擇器（8 個預設標籤）
  - 實作隱私設定開關
  - 整合 react-markdown 渲染器
  - 確保所有元件測試通過
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 8. 實作 JournalCard 元件
- [ ] 8.1 撰寫 JournalCard 元件測試
  - 測試顯示占卜資訊（類型、問題）
  - 測試顯示日記撰寫日期
  - 測試顯示前 100 字預覽（移除 Markdown 語法）
  - 測試顯示心情標籤（最多 3 個 + 剩餘數量）
  - 測試私密標記圖示
  - 測試點擊卡片觸發 onClick 回調
  - _Requirements: 2.2_

- [ ] 8.2 實作 JournalCard 元件
  - 實作日記預覽卡片佈局
  - 實作 Markdown 純文字提取邏輯
  - 實作心情標籤顯示（最多 3 個）
  - 實作私密標記圖示
  - 整合 PixelIcon 圖示元件
  - 確保所有元件測試通過
  - _Requirements: 2.2_

- [ ] 9. 實作 JournalList 元件
- [ ] 9.1 撰寫 JournalList 元件測試
  - 測試顯示日記列表（渲染 JournalCard）
  - 測試空狀態顯示（無日記時）
  - 測試分頁控制項
  - 測試客戶端搜尋功能（關鍵字過濾）
  - 測試心情標籤篩選功能
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 9.2 實作 JournalList 元件
  - 實作日記列表渲染邏輯
  - 實作空狀態提示
  - 實作分頁控制項
  - 實作客戶端搜尋過濾邏輯
  - 實作心情標籤篩選邏輯
  - 整合 journalStore
  - 確保所有元件測試通過
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 10. 實作 JournalDetail 元件
- [ ] 10.1 撰寫 JournalDetail 元件測試
  - 測試顯示完整日記內容（Markdown 渲染）
  - 測試顯示關聯占卜資訊（類型、問題、牌卡）
  - 測試顯示所有心情標籤
  - 測試顯示撰寫與更新時間
  - 測試編輯按鈕切換編輯模式
  - 測試刪除按鈕顯示確認對話框
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 10.2 實作 JournalDetail 元件
  - 實作日記詳情佈局
  - 實作 Markdown 內容渲染（react-markdown + remark-gfm）
  - 實作關聯占卜資訊顯示
  - 實作編輯模式切換
  - 實作刪除確認對話框
  - 整合 journalStore
  - 確保所有元件測試通過
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

---

## Phase 7: 前端頁面整合

- [ ] 11. 建立日記列表頁面（/journal）
- [ ] 11.1 建立日記列表頁面路由與佈局
  - 建立 `src/app/journal/page.tsx`
  - 整合 JournalList 元件
  - 整合搜尋列元件
  - 實作頁面載入狀態
  - 實作錯誤處理與顯示
  - _Requirements: 2.1_

- [ ] 11.2 撰寫日記列表頁面的 E2E 測試
  - 測試頁面載入並顯示日記列表
  - 測試分頁導航功能
  - 測試搜尋功能（關鍵字與標籤）
  - 測試點擊日記卡片導向詳情頁
  - _Requirements: 2.1, 2.6, 4.1_

- [ ] 12. 建立日記詳情頁面（/journal/[id]）
- [ ] 12.1 建立日記詳情頁面路由與佈局
  - 建立 `src/app/journal/[id]/page.tsx`
  - 整合 JournalDetail 元件
  - 整合 JournalEditor 元件（編輯模式）
  - 實作頁面載入狀態
  - 處理 404 與 403 錯誤
  - _Requirements: 3.1_

- [ ] 12.2 撰寫日記詳情頁面的 E2E 測試
  - 測試頁面載入並顯示完整日記
  - 測試編輯按鈕切換編輯模式
  - 測試更新日記成功
  - 測試刪除日記後導向列表頁
  - 測試訪問不存在日記顯示 404
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 13. 整合日記撰寫入口到占卜結果頁
- [ ] 13.1 在占卜結果頁新增「撰寫日記」按鈕
  - 找到現有占卜結果頁面檔案
  - 新增「撰寫日記」按鈕（條件顯示）
  - 實作按鈕點擊邏輯（開啟編輯器或導向編輯頁）
  - 實作「編輯日記」按鈕（若日記已存在）
  - _Requirements: 1.1, 1.8_

- [ ] 13.2 撰寫占卜結果頁整合的 E2E 測試
  - 測試完成占卜後顯示「撰寫日記」按鈕
  - 測試點擊按鈕開啟日記編輯介面
  - 測試儲存日記後顯示「編輯日記」按鈕
  - _Requirements: 1.1, 1.7, 1.8_

---

## Phase 8: 前端依賴與安全性

- [ ] 14. 安裝前端依賴套件
- [ ] 14.1 安裝 Markdown 渲染相關套件
  - 安裝 `react-markdown`（Markdown 渲染器）
  - 安裝 `remark-gfm`（GitHub Flavored Markdown 支援）
  - 驗證套件版本相容性
  - _Requirements: 1.3, 3.2_

- [ ] 14.2 驗證 Markdown 渲染安全性
  - 測試 XSS 防護（`<script>` 標籤應被移除）
  - 測試危險 HTML 過濾（`<iframe>`, `onerror` 等）
  - 測試支援的 Markdown 語法（標題、列表、粗體等）
  - _Requirements: 1.3, 安全需求_

---

## Phase 9: 整合測試與錯誤處理

- [ ] 15. 實作完整的錯誤處理與邊界案例
- [ ] 15.1 後端錯誤處理完整性測試
  - 測試所有 API 的錯誤回應格式一致性
  - 測試資料庫連線失敗情況
  - 測試外鍵約束違反錯誤處理
  - 測試並發更新衝突處理
  - _Requirements: 5.2_

- [ ] 15.2 前端錯誤處理完整性測試
  - 測試 API 呼叫失敗顯示錯誤訊息
  - 測試網路斷線情況處理
  - 測試 401 錯誤導向登入頁
  - 測試 403/404 錯誤顯示友善訊息
  - _Requirements: 3.6, 3.7_

- [ ] 16. 實作完整的 E2E 使用者流程測試
- [ ] 16.1 撰寫完整日記生命週期的 E2E 測試
  - 測試「占卜 → 撰寫日記 → 查看列表 → 編輯 → 刪除」完整流程
  - 測試多篇日記管理流程
  - 測試搜尋與篩選流程
  - 測試分頁導航流程
  - _Requirements: 所有需求_

---

## Phase 10: 效能優化與文件

- [ ] 17. 效能優化與驗證
- [ ] 17.1 後端效能優化
  - 驗證資料庫索引效能（EXPLAIN ANALYZE）
  - 驗證 API 回應時間（目標 < 500ms）
  - 實作查詢結果快取（如需要）
  - 優化 N+1 查詢問題（joinedload）
  - _Requirements: 效能需求_

- [ ] 17.2 前端效能優化
  - 實作搜尋輸入 debounce（300ms）
  - 驗證日記列表載入時間（目標 < 1s）
  - 優化 Markdown 渲染效能
  - 實作載入狀態指示器
  - _Requirements: 效能需求_

- [ ] 18. 更新 API 文件與 Swagger UI
- [ ] 18.1 更新 Swagger UI 文件
  - 新增所有日記 API endpoints 的文件
  - 新增 request/response schema 範例
  - 新增錯誤回應範例
  - 驗證 Swagger UI 可正確呼叫 API
  - _Requirements: 5.1_

---

## 需求覆蓋檢查

### Requirement 1: 日記撰寫與編輯
- ✅ 1.1: 任務 13.1
- ✅ 1.2: 任務 7.2
- ✅ 1.3: 任務 7.2, 14.1
- ✅ 1.4: 任務 7.1, 7.2
- ✅ 1.5: 任務 7.1, 7.2
- ✅ 1.6: 任務 4.1, 4.2, 5.1, 5.2, 7.1
- ✅ 1.7: 任務 5.1, 13.2
- ✅ 1.8: 任務 13.1, 13.2
- ✅ 1.9: 任務 4.5, 4.6, 5.5, 5.6

### Requirement 2: 日記列表與瀏覽
- ✅ 2.1: 任務 4.3, 4.4, 5.3, 5.4, 9.1, 9.2, 11.1, 11.2
- ✅ 2.2: 任務 8.1, 8.2, 9.1, 9.2
- ✅ 2.3: 任務 9.1, 9.2
- ✅ 2.4: 任務 4.4（實作於 backend）
- ✅ 2.5: 任務 9.1, 9.2
- ✅ 2.6: 任務 11.2

### Requirement 3: 日記詳情檢視
- ✅ 3.1: 任務 4.3, 4.4, 5.3, 5.4, 10.1, 10.2, 12.1, 12.2
- ✅ 3.2: 任務 10.1, 10.2
- ✅ 3.3: 任務 10.1, 12.2
- ✅ 3.4: 任務 4.5, 4.6, 5.5, 10.1, 12.2
- ✅ 3.5: 任務 4.5, 4.6, 5.5, 12.2
- ✅ 3.6: 任務 12.1, 15.2
- ✅ 3.7: 任務 12.1, 15.2

### Requirement 4: 簡易搜尋功能
- ✅ 4.1: 任務 6.1, 6.2, 9.1, 9.2, 11.2
- ✅ 4.2: 任務 9.1, 9.2
- ✅ 4.3: 任務 9.1, 9.2
- ✅ 4.4: 任務 9.1, 9.2
- ✅ 4.5: 任務 9.1, 9.2（客戶端實作）
- ✅ 4.6: 任務 9.1, 9.2

### Requirement 5: 後端 API 設計
- ✅ 5.1: 任務 3.1, 3.2, 4.1-4.6, 5.1-5.6
- ✅ 5.2: 任務 5.1-5.6, 15.1
- ✅ 5.3: 任務 17.1（效能優化）

### Requirement 6: 資料模型
- ✅ 6.1: 任務 1.1, 2.1, 2.2
- ✅ 6.2: 任務 1.1, 2.1, 2.2
- ✅ 6.3: 任務 1.2, 17.1
- ✅ 6.4: 任務 1.1（ON DELETE CASCADE）

### 非功能性需求
- ✅ 效能需求: 任務 17.1, 17.2
- ✅ 安全需求: 任務 5.1-5.6（JWT 認證）, 14.2（XSS 防護）
- ✅ 相容性需求: 任務 7.2, 9.2, 10.2（響應式設計）
- ✅ 可維護性需求: 任務 18.1（API 文件）, 所有測試任務（測試覆蓋率）

---

## TDD 實作指引

### 測試優先開發流程
每個功能模組都遵循以下 TDD 循環：

1. **Red（紅燈）**: 先撰寫失敗的測試
   - 定義預期行為
   - 撰寫測試案例
   - 執行測試（應該失敗）

2. **Green（綠燈）**: 撰寫最小實作讓測試通過
   - 實作功能邏輯
   - 執行測試（應該通過）
   - 不過度設計

3. **Refactor（重構）**: 優化程式碼品質
   - 消除重複程式碼
   - 改善可讀性
   - 確保測試仍然通過

### 測試覆蓋率目標
- **後端**: 單元測試覆蓋率 > 80%
- **前端**: 元件測試覆蓋關鍵互動邏輯
- **整合**: E2E 測試覆蓋核心使用者流程

### 測試工具
- **後端**: pytest, pytest-asyncio
- **前端**: Jest, React Testing Library
- **E2E**: Playwright

---

## 實作順序說明

本計畫按照以下依賴順序組織：

1. **資料庫層**（Phase 1）: 建立資料儲存基礎
2. **後端模型層**（Phase 2）: 資料模型與驗證
3. **後端業務層**（Phase 3）: 核心業務邏輯
4. **後端 API 層**（Phase 4）: RESTful 端點
5. **前端狀態層**（Phase 5）: 狀態管理
6. **前端元件層**（Phase 6）: UI 元件
7. **前端頁面層**（Phase 7）: 頁面整合
8. **依賴與安全**（Phase 8）: 外部套件
9. **整合測試**（Phase 9）: 完整流程驗證
10. **優化與文件**（Phase 10）: 效能與文件

每個階段的任務都可以獨立測試與驗證，確保系統穩定增長。
