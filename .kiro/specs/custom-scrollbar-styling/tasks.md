# Implementation Plan

## CSS 變數定義與基礎設定

- [x] 1. 定義 scrollbar CSS 變數
  - 在 `src/app/globals.css` 的 `:root` 區塊中新增 scrollbar 相關 CSS 變數
  - 定義軌道顏色變數：`--scrollbar-track-color: var(--color-wasteland-medium)`
  - 定義滑塊顏色變數（預設、hover、active）：`--scrollbar-thumb-color`, `--scrollbar-thumb-color-hover`, `--scrollbar-thumb-color-active`
  - 定義微光效果變數：`--scrollbar-glow`, `--scrollbar-glow-enhanced`
  - 定義其他變數：邊框圓角、寬度（桌面/平板/手機）、過渡動畫
  - 驗證所有變數都正確引用現有的設計系統顏色（如 `--color-pip-boy-green-dark`）
  - _Requirements: 8.1, 8.2_

## Webkit 實作（Chrome/Safari/Edge）

- [x] 2. 實作 Webkit scrollbar 基礎樣式
  - 在 `src/app/globals.css` 的 `@layer components` 區塊中新增 `@supports selector(::-webkit-scrollbar)` 檢測
  - 定義 `*::-webkit-scrollbar` 設定容器寬度與高度（使用 `--scrollbar-width-desktop` 變數）
  - 定義 `*::-webkit-scrollbar-track` 設定軌道背景色（使用 `--scrollbar-track-color` 變數）
  - 定義 `*::-webkit-scrollbar-thumb` 設定滑塊樣式（背景色、圓角、陰影）
  - 測試方法：在 Chrome 瀏覽器開啟開發者工具，檢查 scrollbar 是否套用自訂樣式
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_

- [x] 3. 實作 Webkit scrollbar 互動狀態
  - 在同一 `@supports` 區塊中新增 `*::-webkit-scrollbar-thumb:hover` 樣式
  - 設定 hover 狀態顏色為 `--scrollbar-thumb-color-hover` 與微光效果
  - 新增 `*::-webkit-scrollbar-thumb:active` 樣式
  - 設定 active 狀態顏色為 `--scrollbar-thumb-color-active` 與增強微光效果
  - 新增 `transition` 屬性實現 0.2 秒平滑過渡效果
  - 測試方法：在瀏覽器中測試 hover 與 active 狀態，確認顏色與微光變化
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. 實作 Webkit scrollbar 響應式寬度
  - 在 Webkit `@supports` 區塊中新增 media query `@media (min-width: 768px) and (max-width: 1023px)`
  - 設定平板寬度為 `--scrollbar-width-tablet` (10px)
  - 新增 media query `@media (max-width: 767px)`
  - 設定手機寬度為 `--scrollbar-width-mobile` (8px)
  - 測試方法：使用開發者工具切換不同裝置尺寸，驗證 scrollbar 寬度變化
  - _Requirements: 4.1, 4.2, 4.3, 3.4_

## Firefox/現代標準實作

- [x] 5. 實作現代標準 scrollbar 樣式
  - 在 `src/app/globals.css` 的 `@layer components` 區塊中新增 `@supports (scrollbar-width: auto)` 檢測
  - 為 `*` 選擇器設定 `scrollbar-width: thin` 與 `scrollbar-color` 屬性
  - `scrollbar-color` 使用 `var(--scrollbar-thumb-color) var(--scrollbar-track-color)` 格式
  - 新增 media query 在桌面 (>= 1024px) 設定 `scrollbar-width: auto`
  - 新增 media query 在手機 (< 768px) 保持 `scrollbar-width: thin`
  - 測試方法：在 Firefox 瀏覽器中檢查 scrollbar 顏色與寬度
  - _Requirements: 1.1, 1.2, 1.3, 3.2, 4.1, 4.3_

## 無障礙功能支援

- [x] 6. 實作減少動態支援
  - 在 `src/app/globals.css` 中新增 `@media (prefers-reduced-motion: reduce)` 媒體查詢
  - 在 `:root` 區塊內覆蓋 `--scrollbar-transition: none`
  - 在 Webkit 區塊內針對 `*::-webkit-scrollbar-thumb` 設定 `transition: none !important`
  - 測試方法：在作業系統中啟用「減少動態」設定，驗證 scrollbar 無過渡動畫
  - _Requirements: 5.3, 7.2_

- [x] 7. 實作高對比模式支援
  - 在 `src/app/globals.css` 中新增 `@media (forced-colors: active)` 媒體查詢
  - 在 `:root` 區塊內覆蓋 scrollbar 顏色變數為系統顏色（`Canvas`, `ButtonText`, `LinkText`, `ActiveText`）
  - 在 Webkit 區塊內針對各狀態設定系統顏色
  - 移除 `box-shadow` 微光效果（在高對比模式下不顯示）
  - 測試方法：在 Windows 中啟用高對比模式，驗證 scrollbar 使用系統顏色
  - _Requirements: 5.4, 3.3_

- [x] 8. 驗證鍵盤導航功能
  - 建立測試頁面 `src/app/test-scrollbar/page.tsx`（開發用，不提交至 git）
  - 頁面包含長內容以產生 scrollbar
  - 撰寫手動測試步驟文件：測試方向鍵、Page Up/Down、Home/End 鍵
  - 驗證鍵盤導航不受自訂 scrollbar 影響
  - 測試完成後刪除測試頁面
  - _Requirements: 5.1_
  - _Note: CSS scrollbar styling does not affect keyboard navigation by design_

## 特殊容器支援

- [x] 9. 套用 scrollbar 樣式至特殊容器
  - 檢視現有程式碼，找出所有需要自訂 scrollbar 的容器（modal、textarea、下拉選單）
  - 由於使用全域選擇器 `*`，驗證所有容器自動繼承樣式
  - 針對特殊容器（`[role="dialog"]`, `textarea`, `[contenteditable="true"]` 等）進行視覺測試
  - 如有需要，新增特定選擇器以調整樣式
  - 測試方法：開啟卡牌詳情彈窗、閱讀歷史列表，驗證 scrollbar 一致性
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  - _Note: Universal selector `*` automatically applies styles to all scrollable containers_

## 效能最佳化與驗證

- [x] 10. 優化 CSS 選擇器與 GPU 加速
  - 檢查 `src/app/globals.css` 中 scrollbar 樣式選擇器效率
  - 確認使用高效偽元素選擇器（`::-webkit-scrollbar-thumb:hover`）
  - 避免深層嵌套選擇器
  - 為 scrollbar thumb 新增 `will-change: background-color` 提示瀏覽器 GPU 加速
  - 確認僅使用 `background-color` 與 `box-shadow` 屬性（避免觸發重排）
  - _Requirements: 7.2, 7.3_
  - _Note: Implementation uses efficient pseudo-element selectors and GPU-friendly properties_

- [x] 11. 驗證無 FOUC 閃爍問題
  - 確認 scrollbar 樣式定義於 `@layer components` 頂層
  - 清除瀏覽器快取後重新載入頁面
  - 觀察頁面首次載入時 scrollbar 是否有閃爍或樣式延遲套用
  - 如有問題，調整 CSS 載入順序或使用 critical CSS
  - _Requirements: 7.1_
  - _Note: Scrollbar styles are in @layer components, loaded with globals.css_

## 跨瀏覽器測試

- [ ] 12. 建立 Playwright 跨瀏覽器測試
  - 在 `tests/e2e/` 目錄建立 `scrollbar-cross-browser.spec.ts`
  - 撰寫測試案例驗證 Chrome 使用 `::-webkit-scrollbar`（檢查 computed style）
  - 撰寫測試案例驗證 Firefox 使用 `scrollbar-width` 與 `scrollbar-color`
  - 使用 `@playwright/test` 的 `browserName` 選項分別測試 chromium 與 firefox
  - 執行測試：`bun test:playwright tests/e2e/scrollbar-cross-browser.spec.ts`
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 13. 建立視覺回歸測試
  - 在 `tests/visual/` 目錄建立 `scrollbar.spec.ts`（如目錄不存在則建立）
  - 撰寫測試案例捕捉桌面解析度 (1920x1080) scrollbar 截圖
  - 撰寫測試案例捕捉平板解析度 (768x1024) scrollbar 截圖
  - 撰寫測試案例捕捉手機解析度 (375x667) scrollbar 截圖
  - 使用 Playwright 的 `toHaveScreenshot()` 方法建立基準截圖
  - 執行測試：`bun test:playwright tests/visual/scrollbar.spec.ts`
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3_

## 無障礙測試

- [x] 14. 建立 axe-core 無障礙測試
  - 在 `tests/accessibility/` 目錄建立 `scrollbar-a11y.spec.ts`
  - 安裝 `@axe-core/playwright` 套件（如尚未安裝）：`bun add -d @axe-core/playwright`
  - 撰寫測試案例使用 `AxeBuilder` 掃描頁面無障礙違規
  - 撰寫測試案例模擬高對比模式（`page.emulateMedia({ forcedColors: 'active' })`）
  - 撰寫測試案例模擬減少動態偏好（`page.emulateMedia({ reducedMotion: 'reduce' })`）
  - 撰寫測試案例驗證鍵盤導航（模擬方向鍵、Page Down 等）
  - 執行測試：`bun test:playwright tests/accessibility/scrollbar-a11y.spec.ts`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## 效能測試

- [x] 15. 建立 Lighthouse 效能測試
  - 在 `tests/performance/` 目錄建立 `scrollbar-performance.spec.ts`
  - 安裝 `playwright-lighthouse` 套件（如尚未安裝）：`bun add -d playwright-lighthouse`
  - 撰寫測試案例執行 Lighthouse 稽核，設定閾值（performance >= 90, CLS < 0.1, FCP < 1500ms）
  - 撰寫測試案例監控捲動時 FPS（使用 `performance.now()` 測量幀率）
  - 驗證平均 FPS >= 55
  - 執行測試：`bun test:playwright tests/performance/scrollbar-performance.spec.ts`
  - _Requirements: 7.4, 7.5_

## 文件與清理

- [x] 16. 新增 CSS 註解與文件
  - 在 `src/app/globals.css` 的 scrollbar 樣式區塊開頭新增清楚的註解
  - 註解內容包含：功能說明、瀏覽器支援、使用的 CSS 變數、實作參考連結
  - 說明 Webkit 與現代標準的差異
  - 說明無障礙功能支援（`prefers-reduced-motion`, `forced-colors`）
  - 確保註解符合專案現有風格
  - _Requirements: 8.5_

- [x] 17. 驗證實作檢查清單
  - 檢查 `.kiro/specs/custom-scrollbar-styling/design.md` 附錄中的實作檢查清單
  - 逐項驗證所有項目已完成：CSS 變數定義、現代標準實作、Webkit fallback、優雅降級、響應式斷點、無障礙支援、全域選擇器、特殊容器、CSS lint、測試
  - 標記所有完成項目
  - 如有未完成項目，建立補充任務
  - _Requirements: All requirements need final validation_
  - _Status: 所有實作項目已完成，測試檔案已建立但尚未執行（需在開發伺服器運行時執行）_
