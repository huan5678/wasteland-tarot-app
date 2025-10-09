# 需求文件

## 簡介

此功能目標是將前端 UI 中所有英文內容統一套用 Google Font Doto 字體作為主要英文字體。Doto 是一款具有點陣風格的可變字體（基於 6x10 像素網格），其復古電子螢幕美學與 Wasteland Tarot 平台的 Fallout Pip-Boy 主題完美契合。透過統一字體應用，將強化平台的視覺一致性和品牌識別度。

此功能將涵蓋所有前端頁面中的英文顯示，包括但不限於數字、英文標籤、按鈕文字、導航選單、標題、表單輸入等。中文內容將保持使用專案現有的中文字體設定（Noto Sans TC）。

## 專案描述（使用者輸入）
替我將前端 UI 所有使用到的英文內容都改成使用 Google Font Doto 作為主要英文字體

## 需求

### 需求 1：Google Font Doto 字體整合
**使用者故事：** 身為開發者，我希望能在專案中整合 Google Font Doto 字體，以便在 UI 中使用統一的英文字體。

#### 驗收標準

1. WHEN 專案啟動時 THEN 系統 SHALL 從 Google Fonts CDN 載入 Doto 字體資源（包含完整英文字符集）
2. WHEN Doto 字體載入成功時 THEN 系統 SHALL 使該字體可在整個應用程式中作為主要英文字體使用
3. IF Doto 字體載入失敗 THEN 系統 SHALL 降級至系統預設的等寬英文字體（如 monospace, Courier New）
4. WHEN 使用 Next.js Font Optimization 時 THEN 系統 SHALL 自動優化字體載入以提升效能
5. WHEN 顯示中英文混合內容時 THEN 系統 SHALL 確保英文使用 Doto、中文使用 Noto Sans TC（或現有中文字體）

### 需求 2：全域英文字體樣式配置
**使用者故事：** 身為開發者，我希望建立全域的英文字體樣式規則，以便在整個專案中一致性地套用 Doto 字體到所有英文內容。

#### 驗收標準

1. WHEN 定義全域樣式時 THEN 系統 SHALL 設定 Doto 為預設英文字體（透過 Tailwind 或 CSS 全域配置）
2. WHERE 特定元素需要明確套用 Doto 字體時 THE 系統 SHALL 提供可重複使用的樣式類別（如 `.font-doto` 或 `font-doto`）
3. WHEN 應用英文字體樣式時 THEN 系統 SHALL 確保與現有 Fallout 主題視覺風格協調一致
4. IF 需要不同文字大小時 THEN 系統 SHALL 支援響應式字體大小配置
5. WHEN 設定字體堆疊時 THEN 系統 SHALL 將 Doto 置於英文字體堆疊的最優先順位（如 'Doto', 'Noto Sans TC', sans-serif）

### 需求 3：統計儀表板英文內容顯示
**使用者故事：** 身為使用者，我希望在統計儀表板中看到使用 Doto 字體的所有英文內容（包括數字、標籤、單位），以便獲得一致的視覺體驗。

#### 驗收標準

1. WHEN 使用者檢視 Analytics Dashboard 時 THEN 系統 SHALL 以 Doto 字體顯示所有英文內容（統計數值、標籤如 "Total Readings"、單位如 "次"）
2. WHEN 使用者檢視 Reading Stats Dashboard 時 THEN 系統 SHALL 以 Doto 字體顯示所有英文文字和數字
3. WHERE StatisticsCard 組件顯示內容時 THE 系統 SHALL 套用 Doto 字體到所有英文字符
4. WHEN 顯示百分比趨勢數值與描述時 THEN 系統 SHALL 以 Doto 字體呈現英文部分（如 "+15%", "increase"）

### 需求 4：閱讀記錄與歷史英文內容顯示
**使用者故事：** 身為使用者，我希望在閱讀記錄中看到使用 Doto 字體的所有英文內容，以便獲得一致的復古電子風格體驗。

#### 驗收標準

1. WHEN 使用者檢視閱讀歷史列表時 THEN 系統 SHALL 以 Doto 字體顯示所有英文內容（閱讀次數、英文標籤、日期數字）
2. WHERE 日期和時間資訊顯示時 THE 系統 SHALL 套用 Doto 字體到英文與數字部分（如 "2025-01-15", "14:30", "Jan"）
3. WHEN 顯示閱讀 ID 或編號時 THEN 系統 SHALL 使用 Doto 字體呈現
4. IF 閱讀記錄包含評分、標籤或其他英文資訊 THEN 系統 SHALL 以 Doto 字體顯示

### 需求 5：Karma 系統與遊戲化指標英文內容
**使用者故事：** 身為使用者，我希望在 Karma 系統和其他遊戲化指標中看到使用 Doto 字體的所有英文內容，以便更好地追蹤我的進度並享受復古遊戲風格。

#### 驗收標準

1. WHEN 使用者檢視 Karma 數值與描述時 THEN 系統 SHALL 以 Doto 字體顯示英文部分（karma 點數、"Good", "Evil" 等標籤）
2. WHEN 顯示 Faction Affinity 資訊時 THEN 系統 SHALL 使用 Doto 字體呈現派系名稱（如 "Brotherhood of Steel", "NCR"）和分數（0-100）
3. WHERE 使用者成就或里程碑資訊顯示時 THE 系統 SHALL 套用 Doto 字體到所有英文描述與數字
4. IF 顯示連續登入天數或使用統計 THEN 系統 SHALL 以 Doto 字體呈現英文標籤（如 "Day Streak", "Level"）和計數

### 需求 6：卡牌相關英文內容顯示
**使用者故事：** 身為使用者，我希望在卡牌展示中看到使用 Doto 字體的所有英文內容，以便清楚辨識卡牌資訊並享受一致的視覺體驗。

#### 驗收標準

1. WHEN 顯示卡牌編號、英文名稱或索引時 THEN 系統 SHALL 以 Doto 字體呈現
2. WHERE CardFrequency 組件顯示資訊時 THE 系統 SHALL 套用 Doto 字體到所有英文內容（使用次數、標籤如 "Frequency", "Times"）
3. WHEN 展示 78 張卡牌集合時 THEN 系統 SHALL 使用 Doto 字體顯示卡牌位置數字與英文花色名稱（如 "Nuka-Cola Bottles", "Combat Weapons"）
4. IF 卡牌詳情包含英文描述或數值資訊 THEN 系統 SHALL 以 Doto 字體呈現

### 需求 7：表單與輸入欄位英文內容
**使用者故事：** 身為使用者，我希望在表單輸入和顯示中看到使用 Doto 字體的所有英文內容，以便保持整體視覺一致性。

#### 驗收標準

1. WHEN 使用者在輸入欄位中輸入英文內容時 THEN 系統 SHALL 以 Doto 字體顯示輸入內容（英文字母、數字、符號）
2. WHERE 表單標籤、占位符、驗證訊息包含英文時 THE 系統 SHALL 套用 Doto 字體（如 "Email", "Password", "Min: 8 characters"）
3. IF 顯示字數限制或計數器 THEN 系統 SHALL 使用 Doto 字體呈現英文與數字（如 "42/100 characters"）
4. WHEN 使用 select 或 dropdown 時 THEN 系統 SHALL 以 Doto 字體顯示英文選項內容
5. WHERE 按鈕文字為英文時 THE 系統 SHALL 套用 Doto 字體（如 "Submit", "Cancel", "Save"）

### 需求 8：響應式與裝置相容性
**使用者故事：** 身為使用者，我希望在不同裝置和螢幕尺寸上都能正確看到 Doto 字體的英文內容顯示，以便獲得一致的使用體驗。

#### 驗收標準

1. WHEN 使用者在桌面裝置檢視時 THEN 系統 SHALL 以適當大小載入並顯示 Doto 字體英文內容
2. WHEN 使用者在行動裝置檢視時 THEN 系統 SHALL 確保 Doto 字體在小螢幕上仍清晰可讀（特別是小字號時）
3. WHERE 不同視窗尺寸需要調整字體大小時 THE 系統 SHALL 響應式地調整 Doto 字體的大小
4. IF 使用者裝置不支援 Doto 字體 THEN 系統 SHALL 降級至可讀的備用英文字體（如 monospace, Courier New）
5. WHEN 顯示長串英文文字時 THEN 系統 SHALL 確保適當的行高（line-height）和字母間距（letter-spacing）以維持可讀性

### 需求 9：效能與載入優化
**使用者故事：** 身為使用者，我希望 Doto 字體能快速載入且不影響頁面效能，以便獲得流暢的使用體驗。

#### 驗收標準

1. WHEN 首次載入頁面時 THEN 系統 SHALL 在 2 秒內完成 Doto 字體載入（完整英文字符集）
2. WHERE 使用 Next.js Font Optimization 時 THE 系統 SHALL 預載入關鍵字體檔案並進行子集化優化
3. IF 字體載入延遲 THEN 系統 SHALL 避免顯著的 layout shift（CLS < 0.1）透過 font-display: swap 和 adjustFontFallback
4. WHEN 字體檔案被快取後 THEN 系統 SHALL 從瀏覽器快取中快速載入字體
5. WHERE 頁面包含大量英文內容時 THE 系統 SHALL 確保字體檔案大小經過優化（woff2 格式，目標 < 100KB）

### 需求 10：可維護性與擴展性
**使用者故事：** 身為開發者，我希望 Doto 字體的實作方式易於維護和擴展，以便未來能輕鬆調整或新增字體樣式。

#### 驗收標準

1. WHEN 需要調整主要英文字體時 THEN 系統 SHALL 透過集中式配置（如 Tailwind config 或 CSS 變數）進行修改
2. WHERE 新增元件需要使用特定字體時 THE 系統 SHALL 提供清楚的文件說明如何套用 Doto 字體或覆寫為其他字體
3. IF 未來需要支援其他英文字體主題 THEN 系統 SHALL 具備擴展機制以支援多種字體選項（如 theme-based 字體切換）
4. WHEN 執行程式碼審查時 THEN 字體實作 SHALL 遵循專案的 TypeScript 與 React 最佳實踐
5. WHERE 特定區域需要保留原本字體時 THE 系統 SHALL 提供覆寫機制（如 `.font-sans` 或 `.font-mono` 類別）
