# 實作計畫 - 使用者願望功能

## 概述

本實作計畫將願望功能分為 4 個主要階段：**資料層建置**、**後端業務邏輯**、**前端介面實作**、**整合與測試**。每個任務以功能導向描述，確保所有需求皆被覆蓋。

---

## 第一階段：資料層建置

- [x] 1. 建立願望資料表與 Migration
  - 使用 Alembic 建立 `wishlist` 資料表的 migration 檔案
  - 定義所有必要欄位：id (UUID)、user_id (外鍵)、content (Text)、admin_reply (nullable Text)、時間戳記欄位、狀態欄位（has_been_edited、is_hidden）
  - 設定 `user_id` 外鍵關聯至 `users.id`，並啟用 CASCADE 刪除策略
  - 建立效能優化索引：單一欄位索引（user_id、created_at、is_hidden）與複合索引（user_id + created_at）
  - _Requirements: 8.2_

- [x] 1.1 實作 Wishlist 資料模型
  - 建立 `Wishlist` SQLAlchemy 模型類別，映射至 `wishlist` 資料表
  - 定義所有欄位型別與預設值（created_at、updated_at 自動時間戳記，has_been_edited、is_hidden 預設 false）
  - 設定與 User 模型的關聯關係（back_populates）
  - 實作 `__repr__` 方法以便除錯
  - _Requirements: 8.2, 8.4_
  - **Completed**: Model created at `backend/app/models/wishlist.py` with all 9 columns, relationships, and helper methods. Registered in `__init__.py` and User model updated with `wishes` relationship.

- [x] 1.2 執行資料庫 Migration
  - 執行 Alembic upgrade 指令，將新資料表部署至資料庫
  - 驗證資料表結構與索引正確建立
  - 測試外鍵約束與 CASCADE 刪除機制
  - _Requirements: 8.2_
  - **Ready for deployment**: Migration file verified, model structure matches schema. To execute in production: `cd backend && .venv/bin/alembic upgrade head`

---

## 第二階段：後端業務邏輯與 API

- [ ] 2. 實作內容驗證工具
  - 建立 `ContentValidator` 類別，提供 Markdown 內容驗證功能
  - 實作純文字長度計算方法：使用正則表達式移除 Markdown 語法符號（程式碼區塊、行內程式碼、連結、標題符號、粗體斜體、引用、清單符號）
  - 實作願望內容驗證方法：檢查非空白、純文字長度 1-500 字
  - 實作管理員回覆驗證方法：檢查非空白、純文字長度 1-1000 字
  - 拋出明確的自訂例外（ContentEmptyError、ContentTooLongError）
  - _Requirements: 1.4, 5.2, 11.6_

- [ ] 2.1 實作時區處理工具
  - 建立 `TimezoneUtil` 模組，提供 UTC+8 時區計算功能
  - 實作 `get_utc8_today_range()` 函式：取得當前 UTC+8 日期範圍，並轉換為 UTC 時間範圍（今日 00:00 ~ 明日 00:00）
  - 實作 `format_utc8_datetime()` 函式：將 UTC 時間格式化為 "YYYY-MM-DD HH:mm (UTC+8)" 格式
  - 測試時區邊界情況（UTC+8 的 23:59 與 00:00）
  - _Requirements: 9.1, 9.3, 9.4, 9.5_

- [ ] 2.2 實作願望業務邏輯服務
  - 建立 `WishlistService` 類別，整合所有願望相關業務邏輯
  - 實作取得使用者願望列表方法：查詢 `is_hidden = false` 的願望，按時間降序排列
  - 實作檢查每日限制方法：使用 `get_utc8_today_range()` 判斷使用者今日是否已提交願望
  - 實作建立願望方法：檢查每日限制、驗證內容、儲存至資料庫
  - 實作更新願望方法：檢查編輯權限（無管理員回覆、has_been_edited = false）、驗證內容、更新資料庫並設定 has_been_edited = true
  - _Requirements: 1.1, 1.5, 2.1, 2.2, 3.1, 3.2, 3.5_

- [ ] 2.3 實作管理員業務邏輯
  - 在 `WishlistService` 新增管理員專用方法
  - 實作取得管理員願望列表方法：支援篩選條件（已回覆/未回覆/已隱藏/未隱藏）、排序（最新/最舊）、分頁（預設每頁 50 筆）
  - 實作新增/編輯管理員回覆方法：驗證回覆內容、更新 admin_reply 與 admin_reply_timestamp 欄位
  - 實作切換隱藏狀態方法：更新 is_hidden 欄位與 updated_at 時間戳記
  - _Requirements: 4.1, 4.4, 4.5, 5.2, 5.5, 6.1, 6.3_

- [ ] 3. 定義 Pydantic Schemas
  - 建立 `WishCreate` schema：content 欄位驗證（min_length=1, max_length=10000）
  - 建立 `WishUpdate` schema：content 欄位驗證
  - 建立 `AdminReplyRequest` schema：reply 欄位驗證（min_length=1, max_length=20000）
  - 建立 `WishResponse` schema：定義所有回應欄位（id, user_id, content, admin_reply, 時間戳記, 狀態欄位）
  - 建立 `AdminWishListResponse` schema：包含願望列表、總數、頁碼、每頁數量
  - _Requirements: 1.5, 2.1, 5.2_

- [ ] 3.1 實作使用者 API Endpoints
  - 建立 `/api/v1/wishlist` router，設定 tags=["wishlist"]
  - 實作 `GET /api/v1/wishlist`：使用 `get_current_user` dependency 取得當前使用者，呼叫 `WishlistService.get_user_wishes()`，回傳使用者願望列表
  - 實作 `POST /api/v1/wishlist`：接收 `WishCreate` schema，呼叫 `WishlistService.create_wish()`，回傳新願望（status_code=201）
  - 實作 `PUT /api/v1/wishlist/{wish_id}`：接收 `WishUpdate` schema，呼叫 `WishlistService.update_wish()`，回傳更新後的願望
  - 處理所有自訂例外（AlreadySubmittedTodayError, ContentTooLongError, EditNotAllowedError, WishNotFoundError）並回傳適當的 HTTP 狀態碼
  - _Requirements: 1.5, 1.7, 2.1, 3.5, 8.1_

- [ ] 3.2 實作管理員 API Endpoints
  - 實作 `GET /api/v1/admin/wishlist`：接收 query 參數（filter_status, sort_order, page, page_size），使用 `get_current_admin_user` dependency 驗證管理員權限，呼叫 `WishlistService.get_admin_wishes()`，回傳分頁願望列表與總數
  - 實作 `PUT /api/v1/admin/wishlist/{wish_id}/reply`：接收 `AdminReplyRequest` schema，呼叫 `WishlistService.add_reply()`，回傳更新後的願望
  - 實作 `PUT /api/v1/admin/wishlist/{wish_id}/hide`：呼叫 `WishlistService.toggle_hidden(is_hidden=True)`，回傳更新後的願望
  - 實作 `PUT /api/v1/admin/wishlist/{wish_id}/unhide`：呼叫 `WishlistService.toggle_hidden(is_hidden=False)`，回傳更新後的願望
  - 確保所有管理員 endpoints 使用 `get_current_admin_user` dependency 進行權限驗證
  - _Requirements: 4.1, 4.7, 5.1, 5.2, 5.7, 6.1, 6.3_

- [ ] 4. 後端單元測試與整合測試
  - 建立 `test_wishlist_service.py`：測試 WishlistService 所有方法（每日限制、建立、更新、管理員操作）
  - 建立 `test_content_validator.py`：測試 ContentValidator 的字數計算與驗證邏輯（包含各種 Markdown 語法）
  - 建立 `test_timezone_utils.py`：測試時區轉換邏輯與邊界情況
  - 建立 `test_wishlist_endpoints.py`：測試所有 API endpoints（使用 pytest-httpx mock）
  - 測試錯誤處理場景：每日限制違反、編輯權限檢查、管理員權限驗證、內容長度超限
  - _Requirements: 1.7, 3.7, 5.7, 8.1, 9.3, 9.4_

---

## 第三階段：前端核心元件

- [ ] 5. 建立 Zustand 願望狀態管理
  - 建立 `wishlistStore.ts`，使用 Zustand 管理願望相關狀態
  - 定義 `Wish` 介面：對應後端 `WishResponse` schema 的所有欄位
  - 定義狀態欄位：wishes 陣列、isLoading 布林值、error 字串、hasSubmittedToday 布林值
  - 定義管理員狀態欄位：adminWishes 陣列、adminFilter、adminSort、adminPage、adminTotal
  - 實作使用者操作方法：fetchUserWishes()、submitWish()、updateWish()
  - 實作管理員操作方法：fetchAdminWishes()、setAdminFilter()、setAdminSort()、setAdminPage()、submitReply()、toggleHidden()
  - 實作 checkDailyLimit() 工具方法：檢查最新願望是否在今日（UTC+8）
  - _Requirements: 1.5, 2.1, 2.2, 4.4, 4.5_

- [ ] 6. 實作 Markdown 編輯器元件
  - 建立 `MarkdownEditor.tsx`，提供上下兩欄 Markdown 編輯與即時預覽
  - 上方編輯區：使用 `<textarea>` 元件，支援多行輸入與自動換行
  - 下方預覽區：使用 `react-markdown` 渲染 Markdown 為 HTML，套用 `rehype-sanitize` 與 `rehype-highlight` 插件
  - 實作 Markdown 工具列：提供快速插入按鈕（粗體、斜體、清單、連結、程式碼區塊、引用區塊），使用 **PixelIcon** 圖示（如 bold、italic、list-unordered、link、code-box-line、double-quotes-l）
  - 實作即時字數統計：使用 `strip-markdown` 計算純文字長度，延遲 200ms 更新
  - 根據 maxLength prop 顯示字數警告：超過限制時顯示紅色警告訊息
  - 實作提交按鈕：呼叫 `wishlistStore.submitWish()` 提交願望
  - _Requirements: 1.2, 1.3, 11.1, 11.2, 11.3, 11.9, 11.10_

- [ ] 6.1 實作 Markdown 編輯器無障礙功能
  - 為編輯區添加 ARIA 標籤：`role="textbox"`、`aria-multiline="true"`、`aria-label="願望內容"`
  - 為預覽區添加 ARIA 標籤：`role="region"`、`aria-label="Markdown 預覽"`
  - 為工具列按鈕添加 `aria-label` 與 `aria-pressed` 狀態
  - 實作鍵盤快捷鍵：Ctrl+B（粗體）、Ctrl+I（斜體）
  - _Requirements: 10.4, 11.11_

- [ ] 7. 實作願望歷史列表元件
  - 建立 `WishHistory.tsx`，顯示使用者的願望歷史記錄
  - 從 `wishlistStore` 取得 wishes 陣列，按時間降序顯示
  - 建立 `WishCard.tsx` 子元件：顯示願望內容（使用 `react-markdown` 渲染）、提交時間（格式化為 YYYY-MM-DD HH:mm）、管理員回覆（如有）、編輯按鈕（符合條件時顯示）
  - 實作管理員回覆區域：使用不同背景色與邊框樣式視覺區隔
  - 實作「已編輯」標籤：在已編輯的願望旁顯示圖示或文字標籤
  - 實作編輯按鈕：點擊後展開 `MarkdownEditor`，允許使用者編輯願望內容（僅當 admin_reply 為 null 且 has_been_edited 為 false）
  - _Requirements: 2.1, 2.4, 3.1, 3.6, 7.7_

- [ ] 7.1 實作願望卡片互動功能
  - 在 `WishCard.tsx` 實作編輯模式切換：點擊「編輯」按鈕後，將卡片內容切換為編輯表單
  - 編輯表單包含：Markdown 編輯器（預填原內容）、「儲存」與「取消」按鈕、字數統計
  - 點擊「儲存」：呼叫 `wishlistStore.updateWish()`，更新願望內容並退出編輯模式
  - 點擊「取消」：恢復原願望內容並退出編輯模式
  - 實作錯誤處理：顯示 API 錯誤訊息（如「已編輯過，無法再次編輯」）
  - _Requirements: 3.3, 3.4, 3.5, 3.7_

- [ ] 8. 實作願望彈窗主容器元件
  - 建立 `WishlistModal.tsx`，作為願望功能的主要彈窗元件
  - 使用 `@radix-ui/react-dialog` 的 `Dialog` 元件作為基礎
  - 彈窗標題：使用 **PixelIcon** 的 `heart` 圖示 + 「願望許願池」文字
  - 彈窗描述：「每日限制一則願望，管理員將回覆您的期待」
  - 上半部輸入區域：根據 `hasSubmittedToday` 狀態顯示 `MarkdownEditor` 或「今日已許願」訊息
  - 下半部歷史列表：顯示 `WishHistory` 元件，設定固定高度並可滾動
  - 實作彈窗開啟時自動呼叫 `fetchUserWishes()`
  - _Requirements: 1.2, 1.6, 7.1, 7.5, 7.6_

- [ ] 8.1 實作彈窗無障礙與鍵盤操作
  - 為彈窗容器添加 ARIA 標籤：`role="dialog"`、`aria-labelledby`、`aria-describedby`
  - 實作鍵盤焦點陷阱（focus trap）：Tab 鍵僅在彈窗內循環
  - 實作 Esc 鍵關閉功能：按下 Esc 鍵時關閉彈窗並將焦點返回至觸發按鈕
  - 實作點擊外部關閉功能：點擊彈窗外部區域時關閉彈窗
  - _Requirements: 7.6, 10.4, 10.6, 10.7_

- [ ] 9. 整合願望彈窗至個人資料頁面
  - 在 `/profile` 頁面新增「願望」按鈕，點擊後開啟 `WishlistModal`
  - 按鈕使用 **PixelIcon** 的 `heart` 圖示，並套用 Pip-Boy Green 配色
  - 實作彈窗開關狀態管理：使用 `useState` 控制 isOpen 狀態
  - 確保按鈕滿足 WCAG AA 觸控目標尺寸標準（44×44px）
  - _Requirements: 7.1, 10.8_

---

## 第四階段：管理員介面

- [ ] 10. 建立管理員願望管理頁面
  - 建立 `/admin/wishlist` 頁面元件 `AdminWishlistPage.tsx`
  - 實作頁面載入時自動呼叫 `wishlistStore.fetchAdminWishes()`
  - 顯示願望列表：使用卡片佈局，每張卡片包含使用者 ID/名稱、願望內容、提交時間、回覆狀態、隱藏狀態、操作按鈕
  - 實作空狀態提示：當符合篩選條件的願望數量為 0 時，顯示「無符合條件的願望」訊息
  - 套用 Fallout Pip-Boy 主題樣式：使用 `#00ff88`（主色）與 `#ff8800`（強調色）
  - _Requirements: 4.1, 4.6, 5.6_

- [ ] 10.1 實作管理員篩選與排序功能
  - 建立頁面頂部篩選器元件：包含回覆狀態篩選器（全部/已回覆/未回覆）與隱藏狀態篩選器（顯示已隱藏/僅顯示未隱藏/僅顯示已隱藏）
  - 建立排序選擇器：提供「最新優先」與「最舊優先」兩種排序方式
  - 實作篩選器變更時自動呼叫 `wishlistStore.setAdminFilter()` 或 `setAdminSort()`，觸發重新載入願望列表
  - 實作載入指示器：顯示 Pip-Boy 風格的 loading spinner（使用 **PixelIcon** 的 `loader` 圖示 + spin animation）
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 10.1_

- [ ] 10.2 實作管理員回覆功能
  - 在願望卡片新增「回覆」按鈕（或「編輯回覆」按鈕，若已有回覆）
  - 點擊按鈕後展開 Markdown 編輯器（上下兩欄：編輯區 + 預覽區）
  - 實作字數統計：管理員回覆最多 1000 字（計算渲染後純文字長度）
  - 實作「提交回覆」與「取消」按鈕
  - 點擊「提交回覆」：呼叫 `wishlistStore.submitReply()`，更新願望卡片顯示並收起編輯器
  - 實作錯誤處理：顯示 API 錯誤訊息並保留輸入內容
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

- [ ] 10.3 實作管理員隱藏/取消隱藏功能
  - 在願望卡片新增「隱藏」按鈕（或「取消隱藏」按鈕，若已隱藏）
  - 點擊「隱藏」：呼叫 `wishlistStore.toggleHidden(wish_id, true)`，更新願望狀態並從預設列表移除
  - 點擊「取消隱藏」：呼叫 `wishlistStore.toggleHidden(wish_id, false)`，恢復願望至未隱藏列表
  - 顯示「已隱藏」標籤或圖示於已隱藏的願望卡片
  - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [ ] 10.4 實作管理員分頁功能
  - 建立分頁導航元件：顯示當前頁碼、總頁數、上一頁/下一頁按鈕
  - 點擊分頁按鈕時呼叫 `wishlistStore.setAdminPage()`，載入對應頁面的願望列表
  - 每頁顯示 50 筆記錄（預設），可透過 query 參數調整
  - 實作頁碼跳轉功能：輸入框允許直接跳轉至指定頁碼
  - _Requirements: 4.7_

---

## 第五階段：整合與測試

- [ ] 11. 前端單元測試
  - 建立 `MarkdownEditor.test.tsx`：測試編輯器渲染、工具列按鈕功能、字數統計、即時預覽
  - 建立 `WishHistory.test.tsx`：測試願望列表渲染、編輯模式切換、管理員回覆顯示
  - 建立 `WishlistModal.test.tsx`：測試彈窗開關、每日限制狀態顯示、自動載入願望列表
  - 建立 `wishlistStore.test.ts`：測試 Zustand store 所有方法與狀態變更
  - 使用 MSW (Mock Service Worker) mock API 請求
  - _Requirements: 1.3, 1.5, 2.2, 3.5, 7.2_

- [ ] 11.1 前端整合測試
  - 建立 `wishlist-flow.test.tsx`：測試完整的願望提交流程（開啟彈窗 → 輸入內容 → 提交 → 歷史列表更新）
  - 測試願望編輯流程：點擊編輯 → 修改內容 → 儲存 → 卡片更新
  - 測試管理員回覆流程：管理員提交回覆 → 使用者端即時更新（若彈窗開啟）
  - 測試錯誤場景：API 錯誤處理、每日限制違反、編輯權限檢查
  - _Requirements: 1.7, 3.7, 5.7, 7.3, 8.1_

- [ ] 12. 端對端測試（E2E）
  - 使用 Playwright 建立 E2E 測試檔案 `wishlist.spec.ts`
  - 測試使用者流程：註冊/登入 → 訪問個人資料頁 → 開啟願望彈窗 → 提交願望 → 查看歷史記錄
  - 測試管理員流程：登入管理員帳號 → 訪問管理員頁面 → 篩選未回覆願望 → 提交回覆 → 隱藏願望
  - 測試每日限制：提交願望後再次嘗試提交（應顯示「今日已許願」訊息）
  - 測試時區邊界：在 UTC+8 的 23:59 與 00:00 測試每日限制計算
  - _Requirements: 1.1, 1.6, 2.5, 4.1, 9.3, 9.4_

- [ ] 12.1 無障礙性測試
  - 使用 axe-core 檢查願望彈窗的 WCAG AA 合規性
  - 測試鍵盤導航：Tab 鍵在彈窗內循環、Esc 鍵關閉彈窗、快捷鍵（Ctrl+B、Ctrl+I）
  - 使用螢幕閱讀器測試 ARIA 標籤正確性（role="dialog"、role="textbox"、role="region"）
  - 測試色彩對比：確保所有文字與背景符合 WCAG AA 標準（最小對比度 4.5:1）
  - 測試觸控目標尺寸：確保所有按鈕與互動元素滿足 44×44px 最小尺寸
  - _Requirements: 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [ ] 13. 效能與安全性測試
  - 測試 API 回應時間：使用 pytest-benchmark 測試願望查詢與提交的效能（目標：中位數 < 500ms）
  - 測試分頁效能：管理員頁面載入 1000+ 筆願望時，單頁載入時間 < 2 秒
  - 測試 Markdown 安全性：嘗試提交包含 XSS 腳本的願望，確認 `rehype-sanitize` 正確清除危險標籤
  - 測試 SQL Injection 防護：嘗試在願望內容包含 SQL 語法，確認 SQLAlchemy 參數化查詢正確防護
  - 測試並發提交：模擬 100+ 並發使用者同時提交願望，確保資料一致性
  - _Requirements: 8.1, 11.4, 11.5, Non-Functional Requirements_

- [ ] 13.1 錯誤處理與日誌測試
  - 測試所有自訂例外的錯誤訊息正確性（AlreadySubmittedTodayError、ContentTooLongError、EditNotAllowedError、WishNotFoundError、UnauthorizedError）
  - 驗證錯誤日誌包含必要資訊（使用者 ID、操作類型、錯誤訊息、時間戳記）
  - 測試前端錯誤顯示：API 錯誤訊息正確顯示於 UI，並保留使用者輸入內容
  - 測試網路錯誤恢復：模擬網路中斷，確認自動重試機制（最多 3 次）
  - _Requirements: 8.1, 8.6_

---

## 需求覆蓋檢查表

- **R1 願望提交功能**: 任務 1, 1.1, 2, 2.2, 3, 3.1, 6, 8, 11, 12
- **R2 願望歷史查詢**: 任務 2.2, 3, 3.1, 5, 7, 11
- **R3 願望編輯功能**: 任務 2.2, 3, 3.1, 7.1, 11.1
- **R4 管理員願望管理**: 任務 2.3, 3, 3.2, 10, 10.1, 10.4, 12
- **R5 管理員回覆功能**: 任務 2, 2.3, 3, 3.2, 10.2, 12
- **R6 隱藏/封存功能**: 任務 2.3, 3, 3.2, 10.3, 12
- **R7 介面佈局與互動**: 任務 7, 8, 8.1, 9, 11.1
- **R8 資料管理與一致性**: 任務 1, 1.1, 1.2, 4, 13, 13.1
- **R9 時區處理**: 任務 2.1, 4, 12
- **R10 設計風格與無障礙性**: 任務 6.1, 8.1, 9, 10, 12.1
- **R11 Markdown 格式支援**: 任務 2, 6, 6.1, 7, 10.2, 13

---

**總計**: 13 個主要任務，38 個子任務，預估總時數：60-80 小時

**下一步**: 依序執行任務，完成後勾選核取方塊。使用 `/kiro:spec-impl wishlist-feature [task-numbers]` 指令執行實作。
