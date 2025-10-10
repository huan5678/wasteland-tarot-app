# 需求文件

## 簡介

本規格旨在將 Cubic_11 像素風格字體整合至整個 Wasteland Tarot 平台，取代目前使用的 Noto Sans TC 字體。Cubic_11 字體具有復古 80 年代像素美學，完美契合專案的 Fallout Pip-Boy 介面設計語言。此整合將強化視覺一致性，提升廢土風格的沉浸式體驗。

### 商業價值
- **視覺一致性**:統一字體系統強化 Fallout 主題識別度
- **使用者體驗**:像素風格字體提升復古遊戲美學
- **品牌識別**:獨特的字體選擇增強平台視覺記憶點
- **設計系統完整性**:字體整合完成 Pip-Boy 介面設計的最後拼圖

## 需求

### 需求 1: 字體檔案宣告與載入
**使用者故事:** 作為前端開發者，我需要在全域 CSS 中正確宣告 Cubic_11 字體，以便瀏覽器能夠載入並使用該字體。

#### 驗收標準

1. WHEN 瀏覽器解析 globals.css THEN 系統 SHALL 宣告 @font-face 規則以載入 `/fonts/Cubic_11.woff2` 字體檔案
2. WHEN 宣告 @font-face 規則 THEN 系統 SHALL 設定 font-family 名稱為 'Cubic 11'
3. WHEN 設定字體載入屬性 THEN 系統 SHALL 使用 font-display: swap 以優化初次載入效能並避免文字閃爍
4. WHEN 字體檔案路徑引用 THEN 系統 SHALL 使用相對路徑 `/fonts/Cubic_11.woff2` 指向 public 目錄
5. IF 字體檔案不存在或載入失敗 THEN 系統 SHALL 降級至 monospace 系統字體堆疊

### 需求 2: 全域字體系統替換
**使用者故事:** 作為平台使用者,我希望看到整個網站使用一致的像素風格字體,以獲得完整的廢土遊戲體驗。

#### 驗收標準

1. WHEN 定義全域字體變數 THEN 系統 SHALL 在 @theme 區塊將 --font-sans 設定為 'Cubic 11' 作為主要字體,並保留 monospace 降級堆疊
2. WHEN 套用 body 元素樣式 THEN 系統 SHALL 使用 font-family: 'Cubic 11', monospace 確保全域繼承
3. WHEN 定義文字元素繼承規則 THEN 系統 SHALL 確保 h1-h6, p, span, div, a, button, input, textarea, select, label 明確繼承 Cubic 11 字體
4. WHERE 任何元件使用 .font-sans 樣式類別 THE 系統 SHALL 套用 Cubic 11 字體
5. IF 瀏覽器不支援 woff2 格式 THEN 系統 SHALL 降級至系統 monospace 字體堆疊

### 需求 3: Tailwind CSS v4 主題配置更新
**使用者故事:** 作為前端開發者,我需要更新 Tailwind CSS 主題配置,使所有工具類別和元件使用 Cubic_11 字體。

#### 驗收標準

1. WHEN 更新 @theme 配置區塊 THEN 系統 SHALL 修改 --font-sans 變數值為 'Cubic 11', monospace
2. WHEN 使用 Tailwind 字體工具類別 (如 font-sans) THEN 系統 SHALL 渲染 Cubic 11 字體
3. WHERE 現有程式碼使用 'Noto Sans TC' 字串 THE 系統 SHALL 全域搜尋並替換為 'Cubic 11'
4. WHEN 元件使用 font-family: inherit THEN 系統 SHALL 正確繼承 Cubic 11 字體設定
5. IF 某些特殊元件需要保留 monospace 字體 THEN 系統 SHALL 透過 .font-mono 類別明確覆寫

### 需求 4: 現有字體樣式類別遷移
**使用者故事:** 作為前端開發者,我需要更新所有自訂字體樣式類別,確保它們使用 Cubic_11 而非 Noto Sans TC。

#### 驗收標準

1. WHERE globals.css 中存在字體相關樣式類別 THE 系統 SHALL 更新所有 font-family 宣告為 'Cubic 11', monospace
2. WHEN 更新排版工具類別 (.heading-1 至 .heading-6, .body-lg, .body-base, .body-sm, .body-xs) THEN 系統 SHALL 確保所有類別使用 Cubic 11 字體
3. WHEN 更新數字樣式類別 (.numeric, .stat-number, .counter) THEN 系統 SHALL 替換 Noto Sans TC 為 Cubic 11
4. WHERE 特殊效果類別 (.text-pip-boy, .interface-header) 使用字體宣告 THE 系統 SHALL 更新為 Cubic 11
5. IF 發現 CSS 中硬編碼 'Noto Sans TC' 字串 THEN 系統 SHALL 全部替換為 'Cubic 11'

### 需求 5: 字體降級與瀏覽器相容性
**使用者故事:** 作為不同瀏覽器環境的使用者,我希望即使 Cubic_11 字體載入失敗,網站仍能正常顯示文字。

#### 驗收標準

1. WHEN 定義字體堆疊 THEN 系統 SHALL 使用降級順序: 'Cubic 11' → ui-monospace → SFMono-Regular → Consolas → Monaco → monospace
2. IF Cubic_11.woff2 載入失敗 THEN 系統 SHALL 自動降級至系統 monospace 字體
3. WHERE @supports 規則檢測字體支援 THE 系統 SHALL 提供 @supports not (font-family: 'Cubic 11') 降級樣式區塊
4. WHEN 瀏覽器不支援 @font-face THEN 系統 SHALL 使用 CSS 降級區塊確保基本可讀性
5. IF 字體檔案損毀或不完整 THEN 系統 SHALL 透過 font-display: swap 機制快速顯示降級字體

### 需求 6: 效能與載入最佳化
**使用者故事:** 作為重視網頁效能的使用者,我希望字體載入不會影響網頁的初次內容繪製速度。

#### 驗收標準

1. WHEN 宣告 @font-face THEN 系統 SHALL 使用 font-display: swap 策略避免 FOIT (Flash of Invisible Text)
2. IF 字體檔案尚未載入完成 THEN 系統 SHALL 先顯示降級字體,載入完成後平滑切換
3. WHEN 檢查字體檔案大小 THEN 系統 SHALL 確認 Cubic_11.woff2 檔案已壓縮為 WOFF2 格式以最小化傳輸大小
4. WHERE 字體使用 woff2 格式 THE 系統 SHALL 提供最佳的壓縮比和瀏覽器支援度
5. WHEN 測量效能指標 THEN 系統 SHALL 確保 Cubic_11 字體載入不影響 LCP (Largest Contentful Paint) 分數

### 需求 7: 視覺回歸測試與品質保證
**使用者故事:** 作為 QA 測試人員,我需要驗證字體替換後所有頁面的視覺呈現符合設計預期。

#### 驗收標準

1. WHEN 執行視覺回歸測試 THEN 系統 SHALL 比對字體替換前後的螢幕截圖差異
2. WHERE 關鍵 UI 元件 (Header, Footer, Button, Card, Modal) 存在 THE 系統 SHALL 驗證 Cubic_11 字體正確渲染
3. WHEN 測試響應式斷點 (mobile: 640px, tablet: 768px, desktop: 1024px) THEN 系統 SHALL 確認字體在所有尺寸下可讀性良好
4. IF 發現文字截斷或溢出問題 THEN 系統 SHALL 調整 line-height 或 letter-spacing 以修正排版
5. WHEN 測試不同語言內容 (繁體中文、英文、數字) THEN 系統 SHALL 驗證 Cubic_11 字體對中文字元的支援度

### 需求 8: 無障礙性與 WCAG 相容性
**使用者故事:** 作為使用螢幕閱讀器的使用者,我希望字體變更不會影響內容的可訪問性。

#### 驗收標準

1. WHEN 使用螢幕閱讀器瀏覽網頁 THEN 系統 SHALL 確保文字內容語意保持不變
2. WHERE 文字顏色與背景對比存在 THE 系統 SHALL 維持至少 4.5:1 的對比度以符合 WCAG AA 標準
3. IF Cubic_11 字體影響可讀性 THEN 系統 SHALL 調整 font-size 或 line-height 以改善對比度
4. WHEN 測試鍵盤導航 THEN 系統 SHALL 確認焦點狀態 (focus ring) 在 Cubic_11 字體下清晰可見
5. WHERE 用戶啟用高對比模式 (forced-colors: active) THE 系統 SHALL 確保字體在系統色彩模式下可讀

### 需求 9: 文件與程式碼註解更新
**使用者故事:** 作為未來維護專案的開發者,我需要清楚的文件說明字體整合的實作細節。

#### 驗收標準

1. WHEN 更新 globals.css THEN 系統 SHALL 在 @font-face 區塊上方添加詳細的註解說明字體來源、授權和用途
2. WHERE CSS 變數定義字體堆疊 THE 系統 SHALL 註解說明降級字體的選擇理由
3. WHEN 修改 Tailwind 配置 THEN 系統 SHALL 在 tailwind.config.ts 添加註解標記字體配置位置已遷移至 globals.css
4. IF 移除舊的 Noto Sans TC 字體參考 THEN 系統 SHALL 在 git commit message 中記錄變更原因
5. WHEN 完成字體整合 THEN 系統 SHALL 更新專案 README.md 或 docs/ 目錄中的字體使用指南

### 需求 10: 跨瀏覽器與跨平台測試
**使用者故事:** 作為跨平台使用者,我希望無論使用哪種瀏覽器或作業系統,網站字體都能一致呈現。

#### 驗收標準

1. WHEN 在 Chrome, Firefox, Safari, Edge 瀏覽器測試 THEN 系統 SHALL 確認 Cubic_11 字體正確載入與渲染
2. WHERE 使用 macOS, Windows, Linux, iOS, Android 平台 THE 系統 SHALL 驗證字體跨平台一致性
3. IF 特定瀏覽器不支援 woff2 格式 THEN 系統 SHALL 透過降級機制確保基本可讀性
4. WHEN 測試行動裝置 THEN 系統 SHALL 確認字體檔案大小不影響行動網路載入速度
5. WHERE 使用者網路環境較差 THE 系統 SHALL 透過 font-display: swap 優先顯示降級字體以改善體驗

## 技術約束

- **前端框架:** Next.js 15.1.7 (App Router)
- **樣式系統:** Tailwind CSS v4.1.13
- **字體格式:** WOFF2 (Web Open Font Format 2)
- **字體檔案位置:** `/public/fonts/Cubic_11.woff2`
- **瀏覽器支援:** Chrome 36+, Firefox 39+, Safari 10+, Edge 14+
- **效能目標:** LCP < 2.5s, 字體載入不阻塞首次內容繪製

## 非功能性需求

- **效能:** 字體檔案應小於 500KB,使用 woff2 壓縮格式
- **相容性:** 支援所有現代瀏覽器,降級機制確保舊版瀏覽器可讀性
- **維護性:** 字體配置集中於 globals.css,避免分散於多個檔案
- **可擴展性:** 字體系統設計支援未來新增其他字體變體或權重
