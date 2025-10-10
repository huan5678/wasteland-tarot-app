# Implementation Plan

本實作計畫遵循 className 驅動的字體整合策略,透過 Tailwind CSS v4 自訂 utility class 實現 Cubic_11 像素字體整合。

## 基礎設施與配置

- [x] 1. 驗證字體檔案與專案配置
  - 確認 `/public/fonts/Cubic_11.woff2` 檔案存在且可訪問
  - 檢查檔案大小是否符合 < 500KB 要求
  - 驗證 Next.js 15.1.7 和 Tailwind CSS v4.1.13 版本
  - 確認 globals.css 檔案位置在 `src/app/globals.css`
  - 編寫簡單的檔案存在性測試腳本
  - _Requirements: 1.4, 技術約束_

## 字體宣告與載入

- [x] 2. 在 globals.css 添加 @font-face 宣告
  - 在 `src/app/globals.css` 檔案頂部添加 @font-face 規則
  - 設定 font-family: 'Cubic 11'
  - 設定 src: url('/fonts/Cubic_11.woff2') format('woff2')
  - 設定 font-display: swap 以優化效能
  - 添加詳細的 CSS 註解說明字體來源、授權和用途
  - _Requirements: 1.1, 1.2, 1.3, 9.1_

- [x] 3. 編寫字體載入單元測試
  - 使用 stylelint 驗證 CSS 語法正確性
  - 使用 grep 檢查 @font-face 規則存在性
  - 驗證 font-family 名稱拼寫正確 ('Cubic 11')
  - 驗證 src 路徑指向正確位置
  - 驗證 font-display: swap 已設定
  - _Requirements: 1.1-1.5, 9.2_

## Tailwind CSS 主題配置

- [x] 4. 在 @theme 區塊定義 --font-cubic 變數
  - 在 `src/app/globals.css` 的 @theme 區塊添加 --font-cubic 變數
  - 設定字體堆疊: 'Cubic 11', ui-monospace, 'SFMono-Regular', 'SF Mono', Consolas, Monaco, monospace
  - 保留原有 --font-sans 變數設定為 'Noto Sans TC'
  - 添加詳細註解說明降級字體選擇理由
  - 驗證 Tailwind v4 自動生成 .font-cubic 類別
  - _Requirements: 3.1, 3.2, 5.1, 9.2_

- [x] 5. 編寫 Tailwind 配置測試
  - 建立測試檔案 `tests/unit/font-config.test.sh`
  - 測試 --font-cubic CSS 變數是否正確定義
  - 測試 .font-cubic utility class 是否生成
  - 測試字體降級堆疊順序
  - 驗證 --font-sans 變數未被修改
  - _Requirements: 3.1-3.5, 5.1_

## 元件層級字體應用

- [x] 6. 在 RootLayout 的 body 元素添加 font-cubic className
  - 開啟 `src/app/layout.tsx` 檔案
  - 在 body 元素的 className 添加 'font-cubic'
  - 保留現有的 className (bg-wasteland-dark, text-pip-boy-green 等)
  - 使用 cn() 工具函式組合多個 className
  - 添加程式碼註解說明字體整合策略
  - _Requirements: 2.1, 2.2, 4.1_

- [x] 7. 編寫 Layout 字體應用整合測試
  - 建立測試檔案 `tests/e2e/font-loading.spec.ts`
  - 使用 Playwright 測試字體載入狀態
  - 驗證 body 元素具有 font-cubic className
  - 驗證 computed style 使用 'Cubic 11' 字體
  - 測試子元素正確繼承字體
  - _Requirements: 2.1-2.5, 7.2_

## 自訂樣式類別遷移

- [x] 8. 更新數字相關樣式類別使用 inherit
  - 在 `src/app/globals.css` 搜尋 .numeric, .stat-number, .counter 類別
  - 將 font-family 改為 inherit (從 body 的 font-cubic 繼承)
  - 保留其他樣式屬性 (font-variant-numeric, letter-spacing 等)
  - 添加註解說明使用繼承策略的理由
  - 驗證所有數字類別已更新
  - _Requirements: 4.2, 4.3, 4.5_

- [x] 9. 更新 Pip-Boy 介面樣式類別使用 inherit
  - 在 `src/app/globals.css` 搜尋 .text-pip-boy, .interface-header 類別
  - 將 font-family 改為 inherit
  - 保留特殊效果屬性 (text-shadow, color 等)
  - 確保 Pip-Boy 主題視覺一致性
  - 添加註解標記 Fallout 主題樣式
  - _Requirements: 4.4, 4.5_

- [x] 10. 更新排版工具類別使用 inherit
  - 在 `src/app/globals.css` 搜尋 .heading-1 ~ .heading-6, .body-lg ~ .body-xs 類別
  - 批次替換所有 font-family 為 inherit
  - 保留 font-size, line-height, font-weight 等屬性
  - 確保所有排版類別一致使用新字體
  - 驗證沒有遺漏任何 'Noto Sans TC' 硬編碼字串
  - _Requirements: 4.2, 4.5_

- [x] 11. 移除所有頁面和元件中的硬編碼字體 className
  - 移除所有 font-mono className (100+ 個檔案)
  - 包含 /src/app 下所有頁面
  - 包含 /src/components 下所有元件
  - 驗證沒有硬編碼 font-mono 或 font-sans
  - _Requirements: 4.1-4.5_

## 跨瀏覽器與降級測試

- [ ] 12. 編寫字體降級機制測試
  - 在 `tests/integration/font-loading.spec.ts` 添加降級測試
  - 使用 Playwright route API 模擬字體載入失敗
  - 驗證降級至 monospace 字體堆疊
  - 測試 font-display: swap 行為
  - 確認文字立即可見 (無 FOIT)
  - _Requirements: 5.1-5.5, 6.2_

- [ ] 13. 編寫跨瀏覽器 E2E 測試
  - 配置 Playwright 跨瀏覽器測試矩陣
  - 測試 Chrome, Firefox, Safari, Edge 瀏覽器
  - 驗證字體在所有瀏覽器正確載入
  - 測試 mobile-chrome 和 mobile-safari 裝置
  - 驗證字體降級機制跨平台一致性
  - _Requirements: 10.1-10.5_

## 視覺回歸與無障礙性測試

- [ ] 14. 編寫視覺回歸測試
  - 建立測試檔案 `tests/visual/font-regression.spec.ts`
  - 使用 @percy/playwright 進行截圖比對
  - 測試關鍵頁面 (Homepage, Dashboard, Readings, Cards)
  - 截圖關鍵 UI 元件 (Header, Button, Card)
  - 等待字體載入完成後再截圖
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 15. 編寫無障礙性測試
  - 建立測試檔案 `tests/accessibility/font-a11y.spec.ts`
  - 使用 @axe-core/playwright 檢查 WCAG AA 對比度
  - 驗證文字內容語意保持不變
  - 測試鍵盤焦點狀態清晰可見
  - 確認螢幕閱讀器相容性
  - _Requirements: 8.1-8.5_

## 效能最佳化與監控

- [x] 16. 配置字體快取策略
  - 在 `next.config.ts` 添加字體快取 headers 配置
  - 設定 Cache-Control: public, max-age=31536000, immutable
  - 僅針對 /fonts/:path* 路由套用
  - 添加詳細註解說明快取策略理由
  - 驗證配置語法正確
  - _Requirements: 6.3, 6.4, 效能目標_

- [ ] 17. 編寫效能測試腳本 (可選)
  - 建立測試腳本 `scripts/test-font-performance.sh`
  - 使用 Lighthouse CLI 檢查字體載入效能
  - 測量 FCP, LCP, CLS 指標
  - 設定效能目標閾值檢查
  - 自動生成效能報告
  - _Requirements: 6.1-6.5_

- [x] 18. 實作字體載入監控
  - 創建 `src/components/system/FontLoadMonitor.tsx` 元件
  - 使用 document.fonts API 檢查字體載入狀態
  - 使用 Performance API 監控字體載入時間
  - 在開發環境輸出字體載入狀態至 console
  - 記錄載入失敗或超時事件
  - _Requirements: 6.5, 錯誤處理_

## 文件更新與最終驗證

- [x] 19. 更新專案文件
  - 在 `CLAUDE.md` 添加 Font Integration 章節
  - 說明如何使用 font-cubic (自動繼承，無需手動指定)
  - 記錄字體整合的設計決策
  - 提供使用方式範例和反模式警告
  - 添加技術細節和參考文件路徑
  - _Requirements: 9.1-9.5_

- [ ] 20. 執行完整測試套件
  - 執行所有單元測試 (bun test)
  - 執行所有整合測試 (bun test:playwright)
  - 執行視覺回歸測試
  - 執行無障礙性測試
  - 執行效能測試
  - 驗證所有測試通過
  - _Requirements: All requirements need E2E validation_

- [x] 21. 最終程式碼審查與清理
  - 使用 grep 確認 'Noto Sans TC' 引用僅保留於必要位置（預設字體定義）
  - 驗證所有 16 個自訂樣式類別使用 font-family: inherit
  - 移除所有頁面和元件中的硬編碼 font-mono className (100+ 檔案)
  - 檢查 CSS 註解完整性和準確性
  - 確認字體整合策略實施完整
  - _Requirements: 4.5, 9.1-9.5_

---

**實作策略說明:**
- 採用 className 驅動的字體應用策略,避免全域污染
- 在 Layout 層級 (body 元素) 應用 font-cubic,達到全域效果
- 自訂樣式類別使用 CSS 變數 var(--font-cubic),便於未來維護
- 保留原有 --font-sans 設定為 Noto Sans TC,確保向後相容
- 降級機制內建於字體堆疊,無需額外 @supports 規則
- 測試策略涵蓋單元測試、整合測試、E2E 測試、視覺回歸、無障礙性和效能測試

**任務執行順序:**
1. 基礎設施驗證 (Task 1)
2. 字體宣告與載入 (Task 2-3)
3. Tailwind 配置 (Task 4-5)
4. Layout 層級應用 (Task 6-7)
5. 樣式類別遷移 (Task 8-11)
6. 降級與跨瀏覽器測試 (Task 12-13)
7. 視覺與無障礙性測試 (Task 14-15)
8. 效能最佳化 (Task 16-18)
9. 文件與最終驗證 (Task 19-21)

**技術依賴關係:**
- Task 2 依賴 Task 1 (確認字體檔案存在)
- Task 4 依賴 Task 2 (先宣告字體再定義變數)
- Task 6 依賴 Task 4 (先定義變數再使用 className)
- Task 8-10 依賴 Task 4 (CSS 變數必須先定義)
- Task 12-18 依賴 Task 2-11 (所有實作完成後再測試)
- Task 19-21 依賴所有前置任務 (最終驗證階段)
