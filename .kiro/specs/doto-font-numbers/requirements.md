# 需求文件

## 簡介

此功能目標是將前端 UI 中所有顯示數字的部分統一套用 Google Font Doto 字體。Doto 是一款專為數字設計的現代化字體，具有清晰的可讀性和獨特的視覺風格。透過統一字體應用，將提升數字資訊的視覺一致性，並強化 Wasteland Tarot 平台的設計品質。

此功能將涵蓋所有前端頁面中的數字顯示，包括但不限於統計數據、計數器、日期時間、karma 值、閱讀次數等數值型資訊。

## 專案描述（使用者輸入）
替我將前端UI所有使用到數字的部分都改成使用google font: Doto

## 需求

### 需求 1：Google Font Doto 字體整合
**使用者故事：** 身為開發者，我希望能在專案中整合 Google Font Doto 字體，以便在 UI 中使用統一的數字字體。

#### 驗收標準

1. WHEN 專案啟動時 THEN 系統 SHALL 從 Google Fonts CDN 載入 Doto 字體資源
2. WHEN Doto 字體載入成功時 THEN 系統 SHALL 使該字體可在整個應用程式中使用
3. IF Doto 字體載入失敗 THEN 系統 SHALL 降級至系統預設的等寬數字字體（如 monospace）
4. WHEN 使用 Next.js Font Optimization 時 THEN 系統 SHALL 自動優化字體載入以提升效能

### 需求 2：全域數字樣式配置
**使用者故事：** 身為開發者,我希望建立全域的數字樣式規則，以便在整個專案中一致性地套用 Doto 字體。

#### 驗收標準

1. WHEN 定義全域樣式時 THEN 系統 SHALL 建立 CSS 類別或 Tailwind 配置以套用 Doto 字體到數字元素
2. WHERE 數字內容需要特定字體時 THE 系統 SHALL 提供可重複使用的樣式類別（如 `.font-doto` 或 `font-doto`）
3. WHEN 應用數字字體樣式時 THEN 系統 SHALL 確保與現有 Fallout 主題視覺風格協調一致
4. IF 需要不同數字大小時 THEN 系統 SHALL 支援響應式字體大小配置

### 需求 3：統計儀表板數字顯示
**使用者故事：** 身為使用者，我希望在統計儀表板中看到使用 Doto 字體的數字，以便獲得更清晰的資料視覺體驗。

#### 驗收標準

1. WHEN 使用者檢視 Analytics Dashboard 時 THEN 系統 SHALL 以 Doto 字體顯示所有統計數值（如 session_count, readings_count）
2. WHEN 使用者檢視 Reading Stats Dashboard 時 THEN 系統 SHALL 以 Doto 字體顯示所有閱讀統計數字
3. WHERE StatisticsCard 組件顯示數值時 THE 系統 SHALL 套用 Doto 字體到數字內容
4. WHEN 顯示百分比趨勢數值時 THEN 系統 SHALL 以 Doto 字體呈現百分比數字

### 需求 4：閱讀記錄與歷史數字顯示
**使用者故事：** 身為使用者，我希望在閱讀記錄中看到使用 Doto 字體的數字資訊，以便快速識別閱讀次數和日期相關數值。

#### 驗收標準

1. WHEN 使用者檢視閱讀歷史列表時 THEN 系統 SHALL 以 Doto 字體顯示閱讀次數計數
2. WHERE 日期和時間資訊包含數字時 THE 系統 SHALL 套用 Doto 字體到數字部分（年、月、日、時、分）
3. WHEN 顯示閱讀 ID 或編號時 THEN 系統 SHALL 使用 Doto 字體呈現
4. IF 閱讀記錄包含評分或其他數值資訊 THEN 系統 SHALL 以 Doto 字體顯示這些數字

### 需求 5：Karma 系統與數值指標
**使用者故事：** 身為使用者，我希望在 Karma 系統和其他遊戲化指標中看到使用 Doto 字體的數字，以便更好地追蹤我的進度。

#### 驗收標準

1. WHEN 使用者檢視 Karma 數值時 THEN 系統 SHALL 以 Doto 字體顯示當前 karma 點數
2. WHEN 顯示 Faction Affinity 分數（0-100）時 THEN 系統 SHALL 使用 Doto 字體呈現數值
3. WHERE 使用者成就或里程碑包含數字時 THE 系統 SHALL 套用 Doto 字體
4. IF 顯示連續登入天數或使用統計 THEN 系統 SHALL 以 Doto 字體呈現計數

### 需求 6：卡牌相關數字顯示
**使用者故事：** 身為使用者，我希望在卡牌展示中看到使用 Doto 字體的數字資訊，以便清楚辨識卡牌編號和相關數據。

#### 驗收標準

1. WHEN 顯示卡牌編號或索引時 THEN 系統 SHALL 以 Doto 字體呈現
2. WHERE CardFrequency 組件顯示使用次數時 THE 系統 SHALL 套用 Doto 字體到計數數字
3. WHEN 展示 78 張卡牌集合中的卡牌位置時 THEN 系統 SHALL 使用 Doto 字體顯示位置數字
4. IF 卡牌詳情包含任何數值資訊 THEN 系統 SHALL 以 Doto 字體呈現

### 需求 7：表單與輸入欄位數字
**使用者故事：** 身為使用者，我希望在表單輸入和顯示中看到使用 Doto 字體的數字，以便保持整體視覺一致性。

#### 驗收標準

1. WHEN 使用者在數字輸入欄位中輸入數字時 THEN 系統 SHALL 以 Doto 字體顯示輸入內容
2. WHERE 表單驗證訊息包含數字（如最小/最大值）時 THE 系統 SHALL 套用 Doto 字體
3. IF 顯示字數限制或計數器（如 "42/100 字"）THEN 系統 SHALL 使用 Doto 字體呈現數字
4. WHEN 使用數字型態的 select 或 dropdown 時 THEN 系統 SHALL 以 Doto 字體顯示選項數字

### 需求 8：響應式與裝置相容性
**使用者故事：** 身為使用者，我希望在不同裝置和螢幕尺寸上都能正確看到 Doto 字體的數字顯示，以便獲得一致的使用體驗。

#### 驗收標準

1. WHEN 使用者在桌面裝置檢視時 THEN 系統 SHALL 以適當大小載入並顯示 Doto 字體數字
2. WHEN 使用者在行動裝置檢視時 THEN 系統 SHALL 確保 Doto 字體數字在小螢幕上仍清晰可讀
3. WHERE 不同視窗尺寸需要調整字體大小時 THE 系統 SHALL 響應式地調整 Doto 字體的大小
4. IF 使用者裝置不支援 Doto 字體 THEN 系統 SHALL 降級至可讀的備用數字字體

### 需求 9：效能與載入優化
**使用者故事：** 身為使用者，我希望 Doto 字體能快速載入且不影響頁面效能，以便獲得流暢的使用體驗。

#### 驗收標準

1. WHEN 首次載入頁面時 THEN 系統 SHALL 在 2 秒內完成 Doto 字體載入
2. WHERE 使用 Next.js Font Optimization 時 THE 系統 SHALL 預載入關鍵字體檔案
3. IF 字體載入延遲 THEN 系統 SHALL 避免顯著的 layout shift（CLS < 0.1）
4. WHEN 字體檔案被快取後 THEN 系統 SHALL 從瀏覽器快取中快速載入字體

### 需求 10：可維護性與擴展性
**使用者故事：** 身為開發者，我希望 Doto 字體的實作方式易於維護和擴展，以便未來能輕鬆調整或新增數字字體樣式。

#### 驗收標準

1. WHEN 需要調整數字字體時 THEN 系統 SHALL 透過集中式配置（如 Tailwind config 或 CSS 變數）進行修改
2. WHERE 新增元件需要使用數字字體時 THE 系統 SHALL 提供清楚的文件說明如何套用 Doto 字體
3. IF 未來需要支援其他數字字體 THEN 系統 SHALL 具備擴展機制以支援多種數字字體選項
4. WHEN 執行程式碼審查時 THEN 數字字體實作 SHALL 遵循專案的 TypeScript 與 React 最佳實踐
