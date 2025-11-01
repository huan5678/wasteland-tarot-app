# Requirements Document

## Introduction

使用者願望功能（User Wishlist Feature）是 Wasteland Tarot 平台的使用者反饋與社群互動機制，部署於 `/profile` 頁面的彈窗介面。使用者可透過此功能每日提交一則願望、查看歷史許願記錄及管理員回覆，而管理員則可集中管理所有使用者願望、提供回覆並進行封存操作。

### 業務價值
- **提升使用者參與度**：透過願望功能建立使用者與平台的雙向溝通管道，增強使用者歸屬感
- **收集產品需求**：願望內容可作為產品改進方向的重要參考資料
- **增強社群黏性**：管理員回覆機制展現平台對使用者意見的重視，提升品牌好感度
- **數據洞察**：願望內容與趨勢分析可協助優化產品策略與功能優先級

### 目標使用者
- **一般使用者**：透過願望功能表達對平台的期待與建議
- **平台管理員**：集中管理使用者反饋，提供個人化回覆並追蹤處理狀態

---

## Requirements

### Requirement 1: 願望提交功能
**Objective:** 作為平台使用者，我希望能每日提交一則願望，以便向平台表達我的想法與期待

#### Acceptance Criteria

1. WHEN 使用者訪問 `/profile` 頁面並開啟願望彈窗時 THEN 願望系統 SHALL 檢查該使用者當日（UTC+8 時區）是否已提交願望

2. IF 使用者當日尚未提交願望 THEN 願望系統 SHALL 顯示願望輸入表單，包含：
   - Markdown 編輯器（上下兩欄佈局：上方編輯區、下方即時預覽區）
   - Markdown 工具列（快速插入語法按鈕）
   - 提交按鈕
   - 字數統計顯示（最多 500 字，計算**渲染後純文字長度**）

3. WHEN 使用者在編輯器輸入 Markdown 文字時 THEN 願望系統 SHALL 執行以下操作：
   - 即時更新下方預覽區的渲染結果
   - 即時更新字數統計（計算渲染後純文字長度）
   - 在超過 500 字時顯示警告訊息

4. WHEN 使用者點擊提交按鈕時 AND 願望內容為空白 THEN 願望系統 SHALL 顯示錯誤訊息「願望內容不可為空」並阻止提交

5. WHEN 使用者點擊提交按鈕時 AND 願望內容有效（1-500 字） THEN 願望系統 SHALL 執行以下操作：
   - 儲存願望至資料庫（包含使用者 ID、內容、UTC+8 時間戳記）
   - 即時更新彈窗下方的願望歷史列表（無需重新載入彈窗）
   - 將輸入區域切換為「今日已許願」狀態訊息
   - 回傳成功通知給使用者

6. IF 使用者當日已提交願望 THEN 願望系統 SHALL 在彈窗上方顯示「今日已許願」訊息，並隱藏輸入表單與提交按鈕

7. WHEN 使用者提交願望時 AND 後端 API 回傳錯誤 THEN 願望系統 SHALL 顯示錯誤訊息並保留使用者輸入的內容，允許重新提交

---

### Requirement 2: 願望歷史查詢功能
**Objective:** 作為平台使用者，我希望能查看我的歷史許願記錄及管理員回覆，以便追蹤我的願望狀態

#### Acceptance Criteria

1. WHERE 願望彈窗的下半部分 THE 願望系統 SHALL 顯示該使用者的歷史願望列表，包含以下資訊：
   - 願望內容（**Markdown 渲染後的 HTML**）
   - 提交時間（格式：YYYY-MM-DD HH:mm，UTC+8 時區）
   - 管理員回覆內容（如有回覆，**Markdown 渲染後的 HTML**）
   - 管理員回覆時間（如有回覆）
   - 編輯按鈕（符合編輯條件時顯示）

2. WHEN 使用者首次開啟願望彈窗時 THEN 願望系統 SHALL 從後端 API 取得該使用者所有未隱藏的願望記錄，並按提交時間降序排列（最新的在最上方）

3. IF 使用者尚未提交任何願望 THEN 願望系統 SHALL 在歷史列表區域顯示「尚無許願記錄」提示訊息

4. WHERE 願望已有管理員回覆 THE 願望系統 SHALL 在該願望卡片中以視覺區隔方式顯示回覆內容（例如使用不同背景色或邊框）

5. WHEN 使用者在彈窗開啟期間提交新願望時 THEN 願望系統 SHALL 自動將新願望插入歷史列表最上方，無需關閉或重新載入彈窗

6. WHILE 願望歷史列表載入中 THE 願望系統 SHALL 顯示載入指示器（Pip-Boy 風格）

---

### Requirement 3: 願望編輯功能
**Objective:** 作為平台使用者，我希望能在管理員回覆前編輯我的願望，以便修正錯誤或補充內容

#### Acceptance Criteria

1. WHEN 使用者查看願望歷史列表時 AND 該願望尚未收到管理員回覆 AND 該願望尚未被編輯過 THEN 願望系統 SHALL 在該願望卡片顯示「編輯」按鈕

2. IF 願望已收到管理員回覆 OR 願望已被編輯過（`has_been_edited = true`） THEN 願望系統 SHALL 隱藏「編輯」按鈕，使該願望進入鎖定狀態

3. WHEN 使用者點擊「編輯」按鈕時 THEN 願望系統 SHALL 將該願望卡片切換為編輯模式：
   - 顯示 Markdown 編輯器（上下兩欄：編輯區 + 預覽區），預填原願望 Markdown 內容
   - 顯示「儲存」與「取消」按鈕
   - 顯示字數統計（最多 500 字，計算渲染後純文字長度）

4. WHEN 使用者點擊「取消」按鈕時 THEN 願望系統 SHALL 恢復原願望內容並退出編輯模式

5. WHEN 使用者點擊「儲存」按鈕時 AND 編輯後內容有效（1-500 字） THEN 願望系統 SHALL 執行以下操作：
   - 更新資料庫中的願望內容
   - 設定 `has_been_edited = true`
   - 更新 `updated_at` 時間戳記
   - 即時更新該願望卡片顯示內容
   - 移除「編輯」按鈕（已編輯過）
   - 顯示編輯成功通知

6. WHERE 願望卡片顯示 THE 願望系統 SHALL 在已編輯過的願望旁標示「已編輯」標籤或圖示

7. IF 使用者嘗試編輯已回覆的願望 THEN 願望系統 SHALL 顯示錯誤訊息「此願望已收到回覆，無法再次編輯」

---

### Requirement 4: 管理員願望管理功能
**Objective:** 作為平台管理員，我希望能查看所有使用者的願望並進行篩選與排序，以便有效管理使用者反饋

#### Acceptance Criteria

1. WHEN 管理員訪問願望管理頁面時 THEN 願望系統 SHALL 顯示所有使用者的願望列表，包含以下資訊：
   - 使用者 ID 或使用者名稱
   - 願望內容
   - 提交時間
   - 回覆狀態（已回覆/未回覆）
   - 隱藏狀態（是否已封存）
   - 操作按鈕（回覆/編輯回覆/隱藏/取消隱藏）

2. WHERE 管理員頁面頂部 THE 願望系統 SHALL 提供篩選器，包含以下選項：
   - 回覆狀態：「全部」、「已回覆」、「未回覆」
   - 隱藏狀態：「顯示已隱藏」、「僅顯示未隱藏」、「僅顯示已隱藏」

3. WHERE 管理員頁面頂部 THE 願望系統 SHALL 提供排序選項：
   - 時間排序：「最新優先」、「最舊優先」

4. WHEN 管理員選擇篩選條件時 THEN 願望系統 SHALL 即時更新願望列表，僅顯示符合條件的願望

5. WHEN 管理員選擇排序方式時 THEN 願望系統 SHALL 重新排列願望列表順序

6. IF 符合篩選條件的願望數量為 0 THEN 願望系統 SHALL 顯示「無符合條件的願望」提示訊息

7. WHEN 願望列表包含超過 50 筆記錄時 THEN 願望系統 SHALL 使用分頁或無限滾動方式載入，每頁顯示 50 筆

---

### Requirement 5: 管理員回覆功能
**Objective:** 作為平台管理員，我希望能回覆使用者願望並支援多次編輯回覆內容，以便提供清楚且完整的回應

#### Acceptance Criteria

1. WHEN 管理員點擊願望卡片的「回覆」按鈕時 THEN 願望系統 SHALL 展開該願望的回覆表單，包含：
   - Markdown 編輯器（上下兩欄：編輯區 + 預覽區）
   - 「提交回覆」與「取消」按鈕
   - 字數統計（最多 1000 字，計算渲染後純文字長度）

2. WHEN 管理員輸入回覆內容並點擊「提交回覆」按鈕時 AND 回覆內容有效（1-1000 字） THEN 願望系統 SHALL 執行以下操作：
   - 儲存回覆內容至資料庫（`admin_reply` 欄位）
   - 記錄回覆時間戳記（`admin_reply_timestamp`）
   - 更新願望狀態為「已回覆」
   - 收起回覆表單並顯示回覆內容
   - 即時通知使用者（如果使用者當前在線）

3. IF 願望已有回覆內容 THEN 願望系統 SHALL 將「回覆」按鈕改為「編輯回覆」按鈕

4. WHEN 管理員點擊「編輯回覆」按鈕時 THEN 願望系統 SHALL 展開回覆編輯表單，預填現有回覆內容

5. WHEN 管理員儲存編輯後的回覆時 THEN 願望系統 SHALL 更新資料庫中的回覆內容與時間戳記，並即時更新顯示

6. WHERE 願望卡片顯示管理員回覆 THE 願望系統 SHALL 以視覺區隔方式（如不同背景色、邊框）突顯回覆內容

7. WHEN 管理員提交或編輯回覆時 AND 後端 API 回傳錯誤 THEN 願望系統 SHALL 顯示錯誤訊息並保留輸入內容，允許重新提交

---

### Requirement 6: 隱藏/封存功能
**Objective:** 作為平台管理員，我希望能隱藏或封存特定願望，以便管理不適當或已處理的願望記錄

#### Acceptance Criteria

1. WHEN 管理員點擊願望卡片的「隱藏」按鈕時 THEN 願望系統 SHALL 執行以下操作：
   - 設定該願望的 `is_hidden` 欄位為 `true`
   - 更新 `updated_at` 時間戳記
   - 從預設列表中移除該願望（若當前篩選為「未隱藏」）
   - 顯示「已隱藏」成功通知

2. IF 願望已被隱藏 THEN 願望系統 SHALL 將「隱藏」按鈕改為「取消隱藏」按鈕

3. WHEN 管理員點擊「取消隱藏」按鈕時 THEN 願望系統 SHALL 將 `is_hidden` 設為 `false` 並恢復該願望至未隱藏列表

4. WHERE 使用者端願望歷史列表 THE 願望系統 SHALL 僅顯示 `is_hidden = false` 的願望記錄

5. WHERE 管理員端願望管理頁面 THE 願望系統 SHALL 在篩選器選擇「顯示已隱藏」或「僅顯示已隱藏」時，顯示被隱藏的願望

6. WHEN 願望被隱藏時 THEN 願望系統 SHALL 在管理員頁面的該願望卡片顯示「已隱藏」標籤或圖示

7. IF 使用者嘗試編輯已被隱藏的願望 THEN 願望系統 SHALL 阻止編輯並顯示「此願望已被封存，無法編輯」錯誤訊息

---

### Requirement 7: 介面佈局與互動
**Objective:** 作為平台使用者，我希望願望彈窗介面清晰易用且即時更新，以獲得流暢的使用體驗

#### Acceptance Criteria

1. WHERE 願望彈窗佈局 THE 願望系統 SHALL 分為上下兩個獨立區域：
   - 上半部：願望輸入區域（或「今日已許願」狀態訊息）
   - 下半部：歷史願望列表（可滾動）

2. WHEN 使用者提交新願望時 THEN 願望系統 SHALL 執行以下 UI 更新，且無需關閉或重新載入彈窗：
   - 輸入區域切換為「今日已許願」訊息
   - 新願望即時插入歷史列表最上方
   - 顯示提交成功通知

3. WHEN 使用者編輯願望時 THEN 願望系統 SHALL 即時更新該願望卡片內容，無需重新載入整個列表

4. WHEN 管理員回覆願望時 THEN 願望系統 SHALL 即時更新使用者端的對應願望卡片（如果使用者當前開啟彈窗）

5. WHERE 願望彈窗顯示 THE 願望系統 SHALL 使用固定高度的彈窗，上半部輸入區域固定高度，下半部歷史列表可滾動

6. WHEN 使用者點擊願望彈窗外部區域或按下 Esc 鍵時 THEN 願望系統 SHALL 關閉彈窗

7. WHERE 願望卡片設計 THE 願望系統 SHALL 清楚區隔「使用者內容」與「管理員回覆」，例如使用不同背景色或邊框樣式

8. WHEN 願望列表為空時 THEN 願望系統 SHALL 在下半部顯示「尚無許願記錄」的空狀態提示

---

### Requirement 8: 資料管理與一致性
**Objective:** 作為系統開發者，我希望願望系統在異常情況下能保持資料一致性並提供清晰的錯誤處理

#### Acceptance Criteria

1. WHEN 使用者提交或編輯願望時 AND 後端 API 回傳錯誤 THEN 願望系統 SHALL 執行以下操作：
   - 保留使用者輸入內容
   - 顯示錯誤訊息
   - 允許重新提交
   - 記錄錯誤日誌

2. WHERE 資料庫儲存願望記錄 THE 願望系統 SHALL 包含以下欄位：
   - `id`：唯一識別碼（UUID）
   - `user_id`：使用者 ID（外鍵）
   - `content`：願望內容（文字，最多 500 字）
   - `created_at`：提交時間（UTC+8 時間戳記）
   - `updated_at`：更新時間（UTC+8 時間戳記）
   - `has_been_edited`：是否已編輯（布林值）
   - `admin_reply`：管理員回覆內容（文字，可為 null，最多 1000 字）
   - `admin_reply_timestamp`：管理員回覆時間（時間戳記，可為 null）
   - `is_hidden`：隱藏/封存狀態（布林值）

3. WHEN 使用者編輯願望時 THEN 願望系統 SHALL 同時更新 `content`、`has_been_edited` 和 `updated_at` 三個欄位，確保資料一致性

4. IF 管理員刪除使用者帳號時 THEN 願望系統 SHALL 依照 cascade 規則處理該使用者的所有願望記錄（軟刪除或永久刪除，依業務需求決定）

5. WHERE 效能優化考量 THE 願望系統 SHALL 在管理員頁面使用分頁查詢，單次最多載入 50 筆記錄

6. WHEN 多個管理員同時編輯同一願望的回覆時 THEN 願望系統 SHALL 使用樂觀鎖定機制（optimistic locking）或最後寫入優先策略，避免衝突

---

### Requirement 9: 時區處理
**Objective:** 作為系統開發者，我希望願望系統正確處理 UTC+8 時區，確保「每日一願」的計算準確無誤

#### Acceptance Criteria

1. WHEN 系統判斷使用者是否可提交願望時 THEN 願望系統 SHALL 使用 UTC+8 時區的當前日期作為判斷依據

2. WHERE 資料庫儲存時間戳記 THE 願望系統 SHALL 統一儲存 UTC 時間，並在前端展示時轉換為 UTC+8 時區

3. WHEN 使用者在 UTC+8 時區的 23:59 提交願望時 THEN 願望系統 SHALL 正確記錄為當日願望，並在 00:00 後允許提交新願望

4. WHEN 使用者在 UTC+8 時區的 00:00-00:59 提交願望時 THEN 願望系統 SHALL 正確識別為新一日的願望

5. WHERE 前端顯示時間 THE 願望系統 SHALL 格式化時間為「YYYY-MM-DD HH:mm」格式，並標註時區（如「2025-11-01 14:30 (UTC+8)」）

6. IF 伺服器時區與 UTC+8 不同 THEN 願望系統 SHALL 在後端邏輯中正確轉換時區，確保「每日一願」判斷準確

---

### Requirement 10: 設計風格與無障礙性
**Objective:** 作為視障使用者或一般使用者，我希望願望系統的 UI 遵循 Fallout 主題並符合無障礙標準，以確保所有人都能使用

#### Acceptance Criteria

1. WHERE 願望彈窗 UI 設計 THE 願望系統 SHALL 使用 Fallout Pip-Boy 配色方案：
   - 主色：Pip-Boy Green (#00ff88)
   - 強調色：Radiation Orange (#ff8800)
   - 背景：深灰/黑色系
   - 邊框：CRT 螢幕風格

2. WHEN 願望系統渲染文字時 THEN 系統 SHALL 使用 Cubic 11 像素字體以符合 Fallout 復古風格

3. WHERE 願望系統使用圖示 THE 系統 SHALL 使用 PixelIcon 元件（基於 RemixIcon），避免使用已移除的 lucide-react

4. WHEN 視障使用者使用螢幕閱讀器時 THEN 願望彈窗 SHALL 包含適當的 ARIA 標籤：
   - `role="dialog"`：彈窗容器
   - `aria-labelledby`：彈窗標題
   - `aria-describedby`：彈窗描述
   - `aria-live="polite"`：提交成功通知區域

5. WHERE 願望歷史列表 THE 系統 SHALL 為每個願望卡片提供 `role="article"` 與 `aria-label`（包含願望摘要與狀態）

6. WHEN 彈窗開啟時 THEN 系統 SHALL 實施鍵盤焦點陷阱（focus trap），確保 Tab 鍵僅在彈窗內循環

7. WHEN 使用者按下 Esc 鍵時 THEN 系統 SHALL 關閉彈窗並將焦點返回至觸發彈窗的按鈕

8. WHERE 輸入框與按鈕 THE 系統 SHALL 確保所有互動元素滿足 WCAG AA 標準的最小觸控目標尺寸（44×44px）

9. WHEN 顯示錯誤訊息時 THEN 系統 SHALL 使用 `role="alert"` 與適當的顏色對比（符合 WCAG AA）

---

### Requirement 11: Markdown 格式支援
**Objective:** 作為使用者或管理員，我希望能使用 Markdown 格式編寫願望和回覆，以便更清楚地表達結構化內容

#### Acceptance Criteria

1. WHERE 願望輸入表單或管理員回覆表單 THE 願望系統 SHALL 提供 Markdown 編輯器，包含以下元件：
   - 上方編輯區：多行文字輸入框（接受 Markdown 語法）
   - 下方預覽區：即時渲染的 HTML 預覽
   - Markdown 工具列：快速插入語法的按鈕（粗體、斜體、清單、連結等）

2. WHEN 使用者或管理員在編輯區輸入 Markdown 文字時 THEN 願望系統 SHALL 即時渲染預覽區的 HTML 內容，延遲時間 < 200ms

3. WHERE Markdown 語法支援範圍 THE 願望系統 SHALL 支援以下基礎語法：
   - **標題**：`#`（H1）、`##`（H2）、`###`（H3）
   - **粗體**：`**text**` 或 `__text__`
   - **斜體**：`*text*` 或 `_text_`
   - **無序清單**：`-`、`*`、`+`
   - **有序清單**：`1.`、`2.`
   - **連結**：`[text](url)`
   - **引用區塊**：`>`
   - **行內程式碼**：`` `code` ``
   - **程式碼區塊**：` ```language ` （支援語法高亮）

4. WHERE Markdown 安全性限制 THE 願望系統 SHALL 禁止以下語法與功能：
   - 圖片嵌入（`![alt](url)`）
   - 原始 HTML 標籤（防止 XSS 攻擊）
   - 表格語法（複雜度過高）
   - JavaScript 連結（`javascript:` 協定）

5. WHEN 使用者或管理員嘗試使用禁止的語法時 THEN 願望系統 SHALL 在預覽區忽略該語法（顯示為純文字），並在工具列旁顯示提示訊息「不支援此語法」

6. WHERE 字數統計邏輯 THE 願望系統 SHALL 計算**渲染後的純文字長度**，而非原始 Markdown 長度：
   - 範例：`**粗體**` 計為 2 字（「粗體」），而非 6 字
   - 範例：`[連結](https://example.com)` 計為 2 字（「連結」），而非完整 URL 長度

7. WHEN 願望或回覆內容儲存至資料庫時 THEN 願望系統 SHALL 儲存原始 Markdown 文字至 `content` 或 `admin_reply` 欄位

8. WHEN 願望或回覆內容顯示於歷史列表時 THEN 願望系統 SHALL 使用 `react-markdown` 函式庫渲染 Markdown 為 HTML，並套用以下設定：
   - 啟用 `rehype-sanitize` 插件（清除潛在危險的 HTML）
   - 啟用 `rehype-highlight` 插件（程式碼語法高亮）
   - 套用 Fallout Pip-Boy 主題樣式（綠色系配色）

9. WHERE Markdown 編輯器 UI 設計 THE 願望系統 SHALL 遵循以下設計規範：
   - 編輯區與預覽區等高，並排或上下佈局（依彈窗寬度自適應）
   - 使用 Cubic 11 像素字體顯示編輯區內容
   - 預覽區背景色稍深於編輯區，以視覺區隔
   - Markdown 工具列使用 PixelIcon 圖示（如 `bold`、`italic`、`list`）

10. WHEN 使用者點擊 Markdown 工具列按鈕時 THEN 願望系統 SHALL 執行以下操作：
    - 在游標位置插入對應的 Markdown 語法
    - 如有選取文字，則包裹選取文字（例如選取「文字」後點擊粗體 → `**文字**`）
    - 自動聚焦至編輯區並將游標移至適當位置

11. WHERE 無障礙性考量 THE Markdown 編輯器 SHALL 包含以下 ARIA 標籤：
    - `role="textbox"` 與 `aria-multiline="true"`：編輯區
    - `role="region"` 與 `aria-label="Markdown 預覽"`：預覽區
    - `aria-label` 與 `aria-pressed`：工具列按鈕（標示選取狀態）

12. WHEN 管理員回覆使用 Markdown 格式時 THEN 使用者端的願望卡片 SHALL 正確渲染管理員回覆的 Markdown 內容，並套用相同的安全性過濾

---

## Non-Functional Requirements

### 效能需求
- API 回應時間中位數 < 500ms（願望查詢與提交）
- 彈窗開啟載入時間 < 1 秒
- 支援 100+ 並發使用者同時提交願望
- 管理員頁面載入 1000+ 筆願望記錄時，單頁載入時間 < 2 秒

### 可用性需求
- 系統正常運行時間 > 99.5%
- 願望資料備份頻率：每日一次
- API 錯誤自動重試次數：3 次

### 安全性需求
- 願望提交與編輯需驗證 JWT token
- 管理員功能需驗證管理員角色權限
- 防止 XSS 攻擊：所有使用者輸入需進行 HTML 轉義
- 防止 SQL Injection：使用參數化查詢

### 可維護性需求
- 願望內容與回覆長度限制可透過配置檔調整（無需修改程式碼）
- 所有願望相關操作記錄於 Analytics 供後續分析
- 錯誤日誌包含使用者 ID、操作類型、錯誤訊息與時間戳記

### 國際化需求
- 願望系統 UI 文字支援繁體中文（zh-TW）
- 資料結構預留多語言欄位（未來擴展）

---

## Success Metrics

### 使用者參與指標
- **願望提交率**：60%+ 註冊使用者在首月提交至少 1 則願望
- **每月活躍提交率**：30%+ 活躍使用者每月提交至少 1 則願望
- **願望回覆率**：管理員在 48 小時內回覆 80%+ 的新願望

### 使用者滿意度指標
- **回覆滿意度**：收到回覆的使用者中，70%+ 對回覆內容表示滿意（透過後續問卷）
- **功能使用率**：80%+ 使用者在提交願望後至少訪問一次歷史列表

### 技術指標
- **API 回應時間**：P95 < 1 秒
- **資料準確性**：99.9%+（無重複提交或遺失記錄）
- **系統可用性**：99.5%+ uptime

### 產品洞察指標
- **願望分類統計**：透過 NLP 分析願望內容，識別前 5 大主題類別
- **願望趨勢**：每月願望數量成長率

---

## Appendix A: 資料模型概要

### Wishlist（願望記錄）
```
- id: UUID (PK)
- user_id: UUID (FK to User)
- content: String (1-500 字，儲存原始 Markdown 文字)
- created_at: Timestamp (UTC)
- updated_at: Timestamp (UTC)
- has_been_edited: Boolean (預設 false)
- admin_reply: String (nullable, 1-1000 字，儲存原始 Markdown 文字)
- admin_reply_timestamp: Timestamp (nullable, UTC)
- is_hidden: Boolean (預設 false)
```

**說明：**
- `content` 和 `admin_reply` 欄位儲存原始 Markdown 文字
- 前端渲染時使用 `react-markdown` 轉換為 HTML
- 字數限制計算渲染後的純文字長度（不含 Markdown 語法符號）

### API Endpoints 概要

**使用者端**
- `GET /api/wishlist` - 取得當前使用者的願望列表（未隱藏）
- `POST /api/wishlist` - 提交新願望
- `PUT /api/wishlist/:id` - 編輯願望（需符合編輯條件）

**管理員端**
- `GET /api/admin/wishlist` - 取得所有願望列表（支援篩選與排序）
- `PUT /api/admin/wishlist/:id/reply` - 新增或編輯回覆
- `PUT /api/admin/wishlist/:id/hide` - 隱藏願望
- `PUT /api/admin/wishlist/:id/unhide` - 取消隱藏願望

---

## Appendix B: UI 互動流程圖

### 使用者提交願望流程
```
1. 開啟 /profile 頁面
2. 點擊「願望」按鈕 → 彈窗開啟
3. 檢查當日是否已提交
   - 已提交 → 顯示「今日已許願」
   - 未提交 → 顯示輸入表單
4. 輸入願望內容
5. 點擊「提交」→ API 請求
6. 成功 → 輸入區切換為「今日已許願」+ 願望插入歷史列表
7. 失敗 → 顯示錯誤訊息 + 保留輸入內容
```

### 管理員回覆流程
```
1. 訪問管理員願望管理頁面
2. 選擇篩選條件（例如：未回覆）
3. 點擊願望卡片的「回覆」按鈕
4. 輸入回覆內容
5. 點擊「提交回覆」→ API 請求
6. 成功 → 回覆內容顯示 + 狀態更新為「已回覆」
7. 失敗 → 顯示錯誤訊息 + 保留輸入內容
```

---

## Appendix C: Markdown 技術堆疊

### 前端函式庫

**Markdown 渲染器**
- **套件**：`react-markdown` (^9.0.0)
- **用途**：將 Markdown 文字轉換為 React 元件（HTML）
- **特性**：
  - 安全性高（預設不渲染原始 HTML）
  - 可擴展（透過 remark/rehype 插件）
  - 輕量且效能佳

**安全性插件**
- **套件**：`rehype-sanitize` (^6.0.0)
- **用途**：清除潛在危險的 HTML 標籤與屬性
- **配置**：
  - 禁止 `<script>`、`<iframe>`、`<object>` 等標籤
  - 禁止 `javascript:` 協定連結
  - 禁止 `on*` 事件屬性（如 `onclick`）

**程式碼高亮插件**
- **套件**：`rehype-highlight` (^7.0.0)
- **用途**：為程式碼區塊提供語法高亮
- **主題**：自訂 Fallout Pip-Boy 配色（綠色系）

**Markdown 編輯器（可選）**
- **選項 1（推薦）**：自訂 Textarea + Preview（最輕量）
  - 使用原生 `<textarea>` + `react-markdown` 預覽
  - 完全自訂 UI 以符合 Fallout 風格

- **選項 2**：`react-simplemde-editor`
  - 功能完整的 Markdown 編輯器
  - 需要自訂 CSS 以符合 Pip-Boy 主題

### 字數計算工具

**套件**：`strip-markdown` (^6.0.0) 或自訂函式
- **用途**：移除 Markdown 語法符號，取得純文字
- **範例**：
  ```javascript
  import stripMarkdown from 'strip-markdown'
  import { remark } from 'remark'

  function getPlainTextLength(markdown: string): number {
    const processed = remark()
      .use(stripMarkdown)
      .processSync(markdown)
    return processed.toString().trim().length
  }
  ```

### Markdown 工具列圖示

**套件**：PixelIcon（基於 RemixIcon）
- `bold-fill` - 粗體按鈕
- `italic-fill` - 斜體按鈕
- `list-unordered` - 無序清單
- `list-ordered` - 有序清單
- `link` - 插入連結
- `code-box-line` - 程式碼區塊
- `double-quotes-l` - 引用區塊

### 安全性策略

**XSS 防護**
1. 使用 `rehype-sanitize` 清除危險標籤
2. 禁止 `dangerouslySetInnerHTML`（`react-markdown` 不使用此屬性）
3. 後端額外驗證：檢查 Markdown 是否包含禁止語法

**URL 白名單（連結）**
- 僅允許 `http://` 和 `https://` 協定
- 禁止 `javascript:`、`data:`、`file://` 等協定

---

*本需求文件將在 Design 階段轉化為技術設計與實作計畫*
