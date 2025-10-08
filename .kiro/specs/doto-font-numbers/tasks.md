# 實作計畫

## 核心字體配置

- [x] 1. 更新字體配置模組
  - 修改 `src/lib/fonts.ts` 更新 Doto 字體配置以支援完整 Latin 字符集
  - 更新 `fallback` 陣列加入 `'Noto Sans TC'` 作為中文字體回退
  - 新增 `adjustFontFallback: true` 配置以減少 CLS
  - 更新文件註解說明 Doto 作為主要英文字體的用途（不僅是數字）
  - 確認 `subsets: ['latin']` 和 `weight` 陣列完整性
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - **完成**: 已更新 `src/lib/fonts.ts`，加入完整文件註解和 adjustFontFallback 配置

- [x] 2. 配置全域字體堆疊
  - 修改 `src/app/globals.css` 在 `@theme` 區塊定義 `--font-doto` 字體堆疊
  - 設定字體堆疊為 `'Doto', 'Noto Sans TC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  - 在 `@layer base` 區塊的 `body` 選擇器設定 `font-family: var(--font-doto)`
  - 確保所有文字元素（h1-h6, p, span, div, a, button, input, textarea, select, label）繼承 body 的字體
  - _Requirements: 2.1, 2.2, 2.5_
  - **完成**: 已在 `@theme` 定義 `--font-doto`，並在 `@layer base` 設定全域字體

- [x] 3. 注入字體變數到根佈局
  - 修改 `src/app/layout.tsx` 確認 `${doto.variable}` 已注入到 `<html>` 標籤的 className
  - 更新 `<body>` className 從 `font-mono` 改為使用全域字體（透過 CSS 設定）
  - 驗證 `lang="zh-TW"` 屬性存在於 `<html>` 標籤
  - 確保 antialiased 類別保持套用以提升字體渲染品質
  - _Requirements: 2.1, 2.5_
  - **完成**: 已移除 `font-mono` 類別，改用 globals.css 全域字體設定

## 樣式系統擴展

- [x] 4. 建立可重複使用的字體工具類別
  - 在 `src/app/globals.css` 新增字體覆寫類別
  - 建立 `.font-doto` 類別明確套用 Doto 字體
  - 建立 `.font-sans` 類別用於需要無襯線字體的場景
  - 建立 `.font-mono` 類別用於需要等寬字體的代碼或特殊內容
  - 更新文件註解說明各類別的使用場景
  - _Requirements: 2.2, 10.5_
  - **完成**: 已建立 `.font-doto`, `.font-sans`, `.font-mono` 覆寫類別

- [x] 5. 更新現有 typography 類別
  - 檢查 `src/app/globals.css` 中現有的 `.numeric`、`.stat-number`、`.counter` 類別
  - 確保這些類別與新的全域字體設定相容
  - 如果這些類別不再需要（因為全域已套用 Doto），考慮保留但標記為 deprecated 以維持向後相容
  - 更新文件說明這些類別的新用途或遷移路徑
  - _Requirements: 10.1, 10.5_
  - **完成**: 已更新所有 typography 類別（.heading-*, .body-*, .text-pip-boy, .interface-header）使用 Doto 字體

## 測試基礎建設

- [ ] 6. 建立字體單元測試
  - 建立 `src/lib/__tests__/fonts.test.ts` 測試檔案
  - 測試 doto 字體物件存在且包含正確的配置
  - 測試 `variable` 屬性為 `--font-doto`
  - 測試 `display` 屬性為 `swap`
  - 測試 `subsets` 包含 `latin`
  - 測試 `fallback` 陣列包含預期的字體
  - _Requirements: All requirements need foundational testing_

- [ ] 7. 建立整合測試
  - 建立 `tests/integration/font-integration.test.tsx` 測試檔案
  - 測試根佈局正確注入 Doto CSS 變數
  - 測試 body 元素的計算樣式包含 Doto 字體
  - 測試中英文混合內容渲染時的字體應用（Mock DOM 測試）
  - 測試字體降級機制（模擬 Doto 不可用的情境）
  - _Requirements: 1.3, 1.5, 8.4_

## E2E 字體驗證

- [ ] 8. 建立英文內容顯示 E2E 測試
  - 建立 `tests/e2e/font-english-display.spec.ts` Playwright 測試檔案
  - 測試首頁英文內容使用 Doto 字體（檢查 computed style）
  - 測試儀表板中數字、標籤、按鈕的字體為 Doto
  - 測試卡牌頁面英文花色名稱使用 Doto
  - 測試表單輸入、占位符、標籤使用 Doto
  - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 7.1, 7.2_

- [ ] 9. 建立中文字體回退 E2E 測試
  - 建立 `tests/e2e/font-chinese-fallback.spec.ts` Playwright 測試檔案
  - 測試中文內容使用 Noto Sans TC 或系統中文字體（不使用 Doto）
  - 測試中英文混合段落中，中文和英文使用不同字體
  - 驗證字體回退機制：英文 → Doto，中文 → Noto Sans TC
  - _Requirements: 1.5, 2.5_

- [ ] 10. 建立響應式字體 E2E 測試
  - 建立 `tests/e2e/font-responsive.spec.ts` Playwright 測試檔案
  - 測試桌面裝置（>= 1024px）Doto 字體清晰可讀
  - 測試平板裝置（768-1023px）Doto 字體大小適當
  - 測試手機裝置（< 768px）Doto 字體在小螢幕上清晰可讀
  - 測試不同視窗尺寸下字體大小響應式調整
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

## 效能測試與優化

- [ ] 11. 建立字體載入效能測試
  - 建立 `tests/performance/font-loading.spec.ts` Playwright 效能測試
  - 測試首次頁面載入時 Doto 字體載入時間 < 2 秒
  - 測試字體載入來源為同域（非 Google CDN）
  - 測試後續頁面載入字體從瀏覽器快取載入
  - 測試 Network 標籤中 Doto 字體請求數量（應為 1 次或 0 次快取命中）
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 12. 建立 CLS 效能測試
  - 在 `tests/performance/font-loading.spec.ts` 新增 CLS 測量測試
  - 測試首頁 Cumulative Layout Shift < 0.1
  - 測試儀表板頁面 CLS < 0.1
  - 測試字體載入期間無明顯文字閃爍（FOIT）或佈局偏移
  - 驗證 `font-display: swap` 和 `adjustFontFallback` 配置生效
  - _Requirements: 9.3_

- [ ] 13. 建立字體檔案大小驗證測試
  - 在 `tests/performance/font-loading.spec.ts` 新增字體檔案大小測試
  - 擷取 Doto woff2 字體檔案的 response body
  - 驗證字體檔案大小 < 100KB
  - 確認僅載入 Latin 字符集（subsets 生效）
  - _Requirements: 9.5_

## 視覺回歸測試

- [ ] 14. 建立視覺回歸測試基準
  - 建立 `tests/visual/font-visual-regression.spec.ts` Playwright 視覺測試檔案
  - 等待字體完全載入（`await page.evaluate(() => document.fonts.ready)`）
  - 建立首頁的基準截圖（`homepage-with-doto-font.png`）
  - 建立儀表板的基準截圖（`dashboard-with-mixed-text.png`）
  - 建立卡牌頁面的基準截圖（`cards-page-with-english-suits.png`）
  - _Requirements: All requirements need visual validation_

- [ ] 15. 建立組件級視覺測試
  - 在 `tests/visual/font-visual-regression.spec.ts` 新增組件級截圖測試
  - 測試 StatisticsCard 組件的字體顯示
  - 測試 ReadingHistory 組件的混合文字顯示
  - 測試 CardFrequency 組件的英文標籤顯示
  - 測試表單組件（Input, Button, Select, Label）的字體顯示
  - _Requirements: 3.1, 3.3, 4.1, 6.2, 7.1, 7.2_

## 功能驗證與修正

- [ ] 16. 驗證統計儀表板字體顯示
  - 手動測試或建立自動化測試驗證 Analytics Dashboard 所有英文內容使用 Doto
  - 檢查統計數值（數字）使用 Doto 字體
  - 檢查英文標籤（如 "Total Readings"）使用 Doto 字體
  - 檢查百分比趨勢和描述（如 "+15%", "increase"）使用 Doto 字體
  - 如有問題，檢查組件是否有覆寫字體的樣式並移除
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 17. 驗證閱讀記錄字體顯示
  - 測試閱讀歷史列表中英文標籤和數字使用 Doto
  - 測試日期和時間數字（如 "2025-01-15", "14:30"）使用 Doto
  - 測試閱讀 ID 或編號使用 Doto
  - 測試評分、標籤等英文資訊使用 Doto
  - 如有問題，檢查 ReadingHistory 組件及其子組件的樣式設定
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 18. 驗證 Karma 系統字體顯示
  - 測試 Karma 數值和標籤（如 "Good", "Evil"）使用 Doto
  - 測試 Faction Affinity 派系名稱（如 "Brotherhood of Steel"）使用 Doto
  - 測試分數（0-100）使用 Doto
  - 測試使用者成就、里程碑的英文描述使用 Doto
  - 測試連續登入天數（如 "Day Streak", "Level"）標籤使用 Doto
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 19. 驗證卡牌相關字體顯示
  - 測試卡牌編號和英文名稱使用 Doto
  - 測試 CardFrequency 組件的英文標籤（如 "Frequency", "Times"）使用 Doto
  - 測試 78 張卡牌的花色名稱（如 "Nuka-Cola Bottles", "Combat Weapons"）使用 Doto
  - 測試卡牌詳情中的英文描述或數值使用 Doto
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 20. 驗證表單與輸入字體顯示
  - 測試輸入欄位中的英文內容使用 Doto（輸入時和顯示時）
  - 測試表單標籤、占位符、驗證訊息的英文部分使用 Doto
  - 測試字數計數器（如 "42/100 characters"）使用 Doto
  - 測試 select 和 dropdown 的英文選項使用 Doto
  - 測試按鈕文字（如 "Submit", "Cancel", "Save"）使用 Doto
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

## 文件與維護

- [ ] 21. 建立使用指南文件
  - 建立 `.kiro/specs/doto-font-numbers/USAGE.md` 使用指南
  - 記錄如何使用全域 Doto 字體（預設行為）
  - 記錄如何使用字體覆寫類別（`.font-sans`, `.font-mono`）
  - 記錄中英文混合顯示的原理和注意事項
  - 提供常見問題與解決方案（FAQ）
  - _Requirements: 10.2_

- [ ] 22. 建立開發者指南
  - 建立 `.kiro/specs/doto-font-numbers/DEV_GUIDE.md` 開發者文件
  - 記錄字體配置的技術細節（Next.js Font Optimization, Tailwind v4 @theme）
  - 記錄如何調整或更換主要英文字體
  - 記錄如何新增其他字體變體或主題
  - 記錄效能最佳化建議和監控方法
  - _Requirements: 10.1, 10.3_

- [ ] 23. 更新 spec.json 狀態
  - 修改 `.kiro/specs/doto-font-numbers/spec.json`
  - 設定 `phase` 為 `"implementation-completed"`
  - 設定 `approvals.tasks.approved` 為 `true`
  - 設定 `approvals.implementation.completed` 為 `true`
  - 更新 `updated_at` 時間戳
  - 記錄實作完成的檔案清單和測試覆蓋率
  - _Requirements: All requirements need completion tracking_

## 整合與部署準備

- [ ] 24. 執行完整測試套件
  - 執行所有單元測試：`bun test`
  - 執行所有 E2E 測試：`bun test:playwright`
  - 執行效能測試套件
  - 執行視覺回歸測試套件
  - 確保所有測試通過（0 failures）
  - _Requirements: All requirements need E2E validation_

- [ ] 25. 驗證多瀏覽器相容性
  - 在 Chrome/Edge（Chromium）驗證字體顯示
  - 在 Firefox 驗證字體顯示
  - 在 Safari（如可用）驗證字體顯示
  - 確認所有瀏覽器的字體回退機制正常運作
  - 記錄任何瀏覽器特定問題和解決方案
  - _Requirements: 8.4_

- [ ] 26. 效能基準驗證
  - 執行 Lighthouse 效能測試
  - 確認 First Contentful Paint (FCP) < 1.5 秒
  - 確認 Largest Contentful Paint (LCP) < 2.5 秒
  - 確認 Cumulative Layout Shift (CLS) < 0.1
  - 確認 Time to Interactive (TTI) < 3.5 秒
  - 記錄基準數據並與目標對比
  - _Requirements: 9.1, 9.3_

- [ ] 27. 建立回滾計畫
  - 記錄實作前的字體配置狀態
  - 建立回滾檢查清單（檔案列表和變更摘要）
  - 測試回滾程序（使用 git revert 或備份還原）
  - 確保回滾後應用程式功能正常
  - 記錄回滾步驟到 DEV_GUIDE.md
  - _Requirements: 10.1, 10.5_
