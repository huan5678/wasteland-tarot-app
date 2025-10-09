# Requirements Document

## Introduction

本需求文件定義將 Wasteland Tarot 應用程式中的 emoji 圖示替換為 lucide-react 圖示庫的需求。這項改進將提供更好的視覺一致性、可自訂性以及跨平台相容性。主要影響範圍為 /cards 頁面的花色圖示，以及其他使用 emoji 作為功能性 UI 元素的區域。

lucide-react 已安裝於專案中 (version 0.544.0)，可直接使用。

## Requirements

### Requirement 1

**User Story:** 作為開發者，我想要將所有花色的 emoji 圖示替換為 lucide-react 圖示，以便提供更好的視覺一致性和自訂性。

#### Acceptance Criteria

1. WHEN 花色配置需要圖示 THEN 系統 SHALL 使用 lucide-react 的圖示元件而非 emoji 字串
2. WHEN 渲染花色卡片 (SuitCard) THEN 系統 SHALL 顯示對應的 lucide-react 圖示，並包含適當的尺寸、顏色和發光效果
3. WHEN 更新花色配置 THEN 系統 SHALL 確保以下映射關係：
   - Major Arcana (大阿爾克那) 🌟 → Sparkles 圖示
   - Nuka-Cola Bottles 🥤 → Coffee 或 Wine 圖示
   - Combat Weapons ⚔️ → Swords 圖示
   - Bottle Caps 💰 → Coins 圖示
   - Radiation Rods ☢️ → Radiation 或 Zap 圖示
4. WHEN 圖示渲染於 SuitCard 元件 THEN 系統 SHALL 保持相同的尺寸 (text-5xl md:text-6xl lg:text-7xl 對應的像素尺寸)
5. WHEN 圖示渲染於 SuitCard 元件 THEN 系統 SHALL 應用 pip-boy-green 顏色和相同的 drop-shadow 效果

### Requirement 2

**User Story:** 作為開發者，我想要替換卡牌縮圖和骨架屏中的 emoji 載入圖示，以便提供一致的載入體驗。

#### Acceptance Criteria

1. WHEN CardThumbnail 元件顯示載入骨架屏 THEN 系統 SHALL 使用 lucide-react 的 Image 或 FileImage 圖示而非 🃏 emoji
2. WHEN CardThumbnailSkeleton 元件渲染 THEN 系統 SHALL 使用 lucide-react 圖示並保持相同的視覺樣式 (text-2xl, pip-boy-green 顏色, drop-shadow)
3. WHEN SuitCard 元件顯示卡牌數量指示器 THEN 系統 SHALL 使用 lucide-react 的適當圖示 (如 Layers 或 LayoutGrid) 而非 🃏 emoji

### Requirement 3

**User Story:** 作為開發者，我想要確保所有圖示具備完整的無障礙性支援，以便螢幕閱讀器使用者能夠理解圖示的意義。

#### Acceptance Criteria

1. WHEN lucide-react 圖示渲染於 UI THEN 系統 SHALL 包含 aria-label 或 aria-hidden 屬性
2. IF 圖示為裝飾性用途 THEN 系統 SHALL 設定 aria-hidden="true"
3. IF 圖示傳達重要資訊 THEN 系統 SHALL 提供描述性的 aria-label
4. WHEN 圖示與文字並存 THEN 系統 SHALL 使用 aria-hidden="true" 避免重複資訊

### Requirement 4

**User Story:** 作為開發者，我想要建立一個可重用的圖示配置系統，以便未來能夠輕鬆調整圖示映射和樣式。

#### Acceptance Criteria

1. WHEN 定義花色配置 THEN 系統 SHALL 儲存圖示元件參考而非 emoji 字串
2. WHEN 需要渲染花色圖示 THEN 系統 SHALL 從配置中取得圖示元件並應用統一的樣式
3. WHEN 建立圖示包裝元件 THEN 系統 SHALL 接受 size、color、className 等可自訂參數
4. WHEN 更新圖示配置 THEN 系統 SHALL 確保 TypeScript 型別安全，使用 LucideIcon 型別

### Requirement 5

**User Story:** 作為使用者，我想要在不同裝置和瀏覽器上看到一致的圖示樣式，以便獲得統一的視覺體驗。

#### Acceptance Criteria

1. WHEN 圖示在不同裝置上渲染 THEN 系統 SHALL 顯示相同的視覺樣式，不受作業系統 emoji 渲染差異影響
2. WHEN 圖示應用響應式尺寸 THEN 系統 SHALL 根據螢幕大小調整圖示尺寸 (行動裝置、平板、桌面)
3. WHEN 圖示在 Fallout 主題下渲染 THEN 系統 SHALL 保持 pip-boy-green 顏色和發光效果的一致性
4. WHEN 使用者與圖示互動 (hover) THEN 系統 SHALL 應用適當的過渡動畫 (transition-transform duration-300)

### Requirement 6

**User Story:** 作為開發者，我想要更新所有相關測試以驗證 lucide-react 圖示的正確渲染，以便確保功能穩定性。

#### Acceptance Criteria

1. WHEN 執行 SuitCard 元件測試 THEN 系統 SHALL 驗證 lucide-react 圖示元件是否正確渲染
2. WHEN 執行 CardThumbnail 元件測試 THEN 系統 SHALL 驗證載入骨架屏中的圖示是否為 lucide-react 元件
3. WHEN 執行端對端測試 THEN 系統 SHALL 確保圖示在實際頁面中正確顯示且無視覺回歸
4. WHEN 測試無障礙性 THEN 系統 SHALL 驗證所有圖示具備適當的 ARIA 屬性

### Requirement 7

**User Story:** 作為開發者，我想要審查並決定其他 emoji 使用情況的處理方式，以便確保專案的一致性。

#### Acceptance Criteria

1. WHEN 審查 CategoryManager、CardShare、ReadingTemplates 等元件 THEN 系統 SHALL 識別所有功能性 emoji 使用
2. IF emoji 用於裝飾性目的 THEN 系統 MAY 保留 emoji 而不替換
3. IF emoji 用於功能性 UI 元素 (如按鈕圖示、狀態指示器) THEN 系統 SHALL 考慮替換為 lucide-react 圖示
4. WHEN 決定替換範圍 THEN 系統 SHALL 優先處理 /cards 頁面相關元件，其他區域作為次要範圍

### Requirement 8 (Non-Functional)

**User Story:** 作為開發者，我想要確保替換圖示不會對效能造成負面影響，以便維持良好的使用者體驗。

#### Acceptance Criteria

1. WHEN 載入包含多個圖示的頁面 THEN 系統 SHALL 確保首次內容繪製 (FCP) 時間不增加超過 50ms
2. WHEN 渲染圖示元件 THEN 系統 SHALL 使用適當的 tree-shaking 確保只打包使用的圖示
3. WHEN 大量圖示同時渲染 THEN 系統 SHALL 確保沒有明顯的佈局偏移 (CLS) 或閃爍
4. WHEN 比較 emoji 與 lucide-react 圖示的 bundle 大小 THEN 增加的 bundle size SHALL NOT 超過 10KB (gzipped)

### Requirement 9 (Non-Functional)

**User Story:** 作為開發者，我想要確保所有圖示變更有完整的 TypeScript 型別支援，以便在開發階段捕捉錯誤。

#### Acceptance Criteria

1. WHEN 定義圖示配置 THEN 系統 SHALL 使用 lucide-react 的 LucideIcon 型別
2. WHEN 傳遞圖示元件作為 props THEN 系統 SHALL 明確定義 TypeScript 介面
3. WHEN 編譯 TypeScript THEN 系統 SHALL NOT 產生任何型別錯誤或警告
4. WHEN 使用 IDE 自動完成 THEN 系統 SHALL 提供正確的圖示元件和 props 提示

### Requirement 10 (Documentation)

**User Story:** 作為團隊成員，我想要了解如何在專案中正確使用 lucide-react 圖示，以便保持一致的開發實踐。

#### Acceptance Criteria

1. WHEN 查看圖示配置檔案 THEN 系統 SHALL 包含註解說明每個圖示的選擇理由
2. WHEN 新增新的花色或圖示 THEN 系統 SHALL 提供範例程式碼和最佳實踐
3. WHEN 開發者需要替換圖示 THEN 文件 SHALL 說明如何從 lucide-react 中選擇適當的圖示
4. WHEN 審查程式碼 THEN README 或內部文件 SHALL 記錄圖示使用準則 (尺寸、顏色、無障礙性)

## Scope Definition

### In Scope

- **/cards 頁面花色圖示**：SUIT_CONFIG 中的 5 個花色 emoji 替換為 lucide-react 圖示
- **SuitCard 元件**：花色選項卡片中的圖示和卡牌數量指示器
- **CardThumbnail 元件**：載入骨架屏中的 emoji 替換
- **CardThumbnailSkeleton 元件**：骨架屏圖示替換
- **型別定義更新**：suits.ts 中的 SuitMetadata 介面更新以支援 React 元件
- **測試更新**：相關元件的單元測試和 E2E 測試更新

### Secondary Scope (Optional)

- **其他功能性 emoji**：審查 CategoryManager、CardShare、ReadingTemplates、LoadingSpinner 等元件中的 emoji 使用
- **統一圖示系統**：建立全域的圖示使用準則和可重用的圖示包裝元件

### Out of Scope

- **純裝飾性 emoji**：文字內容中用於表達情感或裝飾的 emoji (如 FAQ 頁面)
- **使用者生成內容**：使用者輸入或分享內容中的 emoji
- **圖示動畫**：複雜的圖示動畫效果 (保持現有的簡單 hover 效果)
- **圖示庫替換**：不考慮使用其他圖示庫 (如 react-icons、heroicons)

## Technical Constraints

1. **相依套件**：lucide-react version 0.544.0 已安裝，需確保使用穩定的 API
2. **效能需求**：圖示替換不得影響頁面載入速度或執行時效能
3. **瀏覽器支援**：需支援所有現代瀏覽器 (Chrome、Firefox、Safari、Edge)
4. **TypeScript 版本**：需與專案的 TypeScript 配置相容
5. **Fallout 主題**：所有圖示必須符合 Pip-Boy 風格設計 (pip-boy-green 顏色、發光效果)
6. **響應式設計**：圖示需在不同螢幕尺寸下正確縮放

## Success Metrics

1. **視覺一致性**：所有花色圖示在不同裝置和瀏覽器上顯示一致
2. **效能指標**：Core Web Vitals (FCP、LCP、CLS) 無顯著退化
3. **程式碼品質**：TypeScript 編譯無錯誤，ESLint 無警告
4. **測試覆蓋率**：所有受影響元件的測試通過率 100%
5. **無障礙性**：WCAG 2.1 AA 標準合規 (圖示具備適當的 ARIA 屬性)

## Migration Strategy

1. **階段一**：更新 SUIT_CONFIG 中的圖示配置，將 emoji 字串替換為 lucide-react 元件參考
2. **階段二**：更新 SuitCard 元件以渲染 React 元件圖示
3. **階段三**：更新 CardThumbnail 和相關骨架屏元件
4. **階段四**：更新相關測試檔案
5. **階段五**：審查和決定其他 emoji 使用情況的處理方式
6. **階段六**：建立圖示使用文件和準則 (可選)

## Risk Assessment

1. **型別相容性風險**：將 emoji 字串改為 React 元件可能導致型別錯誤
   - **緩解措施**：逐步更新型別定義，使用 TypeScript 嚴格模式驗證
2. **視覺回歸風險**：圖示尺寸或樣式可能與原始 emoji 不一致
   - **緩解措施**：使用視覺回歸測試工具 (Playwright 截圖比對)
3. **效能影響風險**：額外的 React 元件可能增加渲染開銷
   - **緩解措施**：使用 React DevTools Profiler 測量，確保無顯著影響
4. **測試維護成本**：測試需要更新以適應新的元件結構
   - **緩解措施**：優先更新關鍵路徑測試，使用快照測試簡化維護
