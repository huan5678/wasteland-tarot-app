# Implementation Plan

## 基礎架構與資料層

- [x] 1. 建立 TypeScript 型別定義與 JSON 資料結構
  - 在 `src/types/hero.ts` 建立 `HeroTitle`、`HeroTitlesCollection` interfaces
  - 定義 `FALLBACK_TITLE` 常數作為降級預設文案
  - 建立 `src/data/heroTitles.json` 並填入 5 組文案（根據 design.md 範例）
  - 確保 JSON 包含 version、defaultConfig、titles 三個根欄位
  - 撰寫簡單的型別驗證測試確保 JSON 符合 interface 定義
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. 實作資料載入與驗證邏輯
  - 在 `src/lib/heroTitlesLoader.ts` 建立 `loadHeroTitles()` 函式
  - 實作 `validateHeroTitles(data: unknown)` 函式進行 runtime validation
  - 處理 JSON 解析錯誤、網路錯誤、驗證錯誤三種錯誤情境
  - 實作錯誤時返回 `FALLBACK_TITLE` 的降級邏輯
  - 開發模式下加入 console.warn 提示無效資料
  - 撰寫 `heroTitlesLoader.test.ts` 測試各種錯誤情境與降級行為
  - _Requirements: 1.6, 1.7, 5.10_

## 核心動畫 Hooks

- [x] 3. 實作 usePageVisibility Hook
  - 在 `src/hooks/usePageVisibility.ts` 建立 hook
  - 監聽 `visibilitychange` 事件並返回 `isVisible: boolean`
  - 處理事件監聽器的正確清理（useEffect cleanup）
  - 撰寫 `usePageVisibility.test.ts` 測試分頁切換行為
  - Mock `document.visibilityState` 驗證狀態變更
  - _Requirements: 3.10, 3.11, 6.3, 6.4_

- [x] 4. 實作 useTypewriter Hook（打字模式與刪除模式已合併實作）
  - 在 `src/hooks/useTypewriter.ts` 建立基礎 hook 結構
  - 實作 typing 模式的 `requestAnimationFrame` 動畫迴圈
  - 使用 `useRef` 追蹤 `charIndexRef`、`animationFrameIdRef`、`lastTimestampRef`
  - 實作 `startTyping()` 方法開始打字動畫
  - 實作 `onTypingComplete` 回調機制
  - 撰寫 `useTypewriter.test.ts` 測試打字動畫邏輯
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.2_

- [x] 5. 擴充 useTypewriter Hook（刪除模式）
  - 在現有 hook 中加入 deleting 模式邏輯
  - 實作 `startDeleting()` 方法開始刪除動畫
  - 調整動畫迴圈支援雙向操作（增加/減少 charIndex）
  - 根據 `animationMode` 使用不同速度（typingSpeed vs deletingSpeed）
  - 實作 `onDeletingComplete` 回調機制
  - 擴充測試涵蓋刪除模式與 typing/deleting 切換
  - _Requirements: 2.1, 2.2, 2.3, 3.3, 6.2_

- [x] 6. 完善 useTypewriter Hook 功能
  - 實作 `pause()`、`resume()`、`reset()` 方法
  - 整合 `prefers-reduced-motion` 媒體查詢偵測
  - 當 prefersReducedMotion 為 true 時跳過動畫直接顯示完整文字
  - 實作 `progress` 計算（0-1 之間）
  - 確保 `cancelAnimationFrame` 正確清理資源
  - 擴充測試涵蓋無障礙模式與資源清理
  - _Requirements: 2.5, 2.6, 2.7, 2.9, 6.3, 6.4_

- [x] 7. 實作 useCarousel Hook（基礎輪播）
  - 在 `src/hooks/useCarousel.ts` 建立 hook
  - 實作 `currentIndex` 狀態管理與循環邏輯
  - 實作 `goToIndex()`、`next()`、`previous()` 方法
  - 實作自動播放計時器（使用 setTimeout）
  - 實作 `pause()` 與 `resume()` 控制自動播放
  - 撰寫 `useCarousel.test.ts` 測試輪播邏輯
  - _Requirements: 3.1, 3.2, 3.6_

- [x] 8. 整合 useCarousel 與 usePageVisibility
  - 在 useCarousel 中整合 usePageVisibility hook
  - 當 `isVisible === false` 時自動暫停計時器
  - 當頁面恢復可見時自動恢復計時器
  - 確保計時器正確清理（cleanup function）
  - 擴充測試驗證分頁切換時的暫停/恢復行為
  - _Requirements: 3.10, 3.11, 6.3_

- [x] 9. 實作互動暫停邏輯
  - 在 useCarousel 中監聽 `mousemove` 與 `touchstart` 事件
  - 實作互動時暫停自動播放，5 秒無互動後恢復
  - 使用 debounce 邏輯避免過度觸發
  - 確保事件監聽器正確清理
  - 擴充測試驗證互動暫停與恢復時序
  - _Requirements: 3.7, 3.8, 6.4_

## UI 元件實作

- [x] 10. 實作 CarouselIndicator 元件（基礎 UI）
  - 在 `src/components/hero/CarouselIndicator.tsx` 建立元件
  - 實作 props interface（totalCount, currentIndex, onDotClick, visible）
  - 渲染指定數量的指示器圓點（方形，符合 Terminal 風格）
  - 套用 Pip-Boy 綠色主題（pip-boy-green CSS 變數）
  - 處理 `visible === false` 時不渲染元件
  - 撰寫 `CarouselIndicator.test.tsx` 測試基礎渲染邏輯
  - _Requirements: 3.4, 3.5, 4.8_

- [x] 11. 加入 CarouselIndicator 無障礙支援
  - 在容器加入 `role="tablist"` 與 `aria-label`
  - 每個圓點加入 `role="tab"`、`aria-label`、`tabIndex={0}`
  - 當前活躍圓點加入 `aria-current="true"`
  - 實作 `onKeyDown` 處理 Enter 與 Space 鍵切換
  - 套用符合 WCAG AA 標準的 focus ring 樣式
  - 擴充測試驗證 ARIA 屬性與鍵盤導航
  - _Requirements: 5.3, 5.4, 5.6, 5.7, 5.8_

- [x] 12. 實作 DynamicHeroTitle 元件（資料載入）
  - 在 `src/components/hero/DynamicHeroTitle.tsx` 建立元件
  - 定義 props interface（defaultIndex, autoPlay, autoPlayInterval, typingSpeed, testMode）
  - 使用 `loadHeroTitles()` 載入文案資料
  - 實作 loading、error、loaded 三種狀態管理
  - 錯誤時使用 FALLBACK_TITLE 作為降級
  - 撰寫 `DynamicHeroTitle.test.tsx` 測試資料載入流程
  - _Requirements: 1.1, 1.7, 5.10, 6.1_

- [x] 13. 整合 useTypewriter 至 DynamicHeroTitle
  - 在 DynamicHeroTitle 中整合 useTypewriter hook
  - 將當前文案的 title 傳入 hook
  - 渲染 `displayText` 至 h1 標籤
  - 套用正確的 Tailwind 樣式（text-5xl md:text-7xl font-bold mb-6 font-mono text-pip-boy-green）
  - 實作終端機游標效果（閃爍的綠色方塊）
  - 擴充測試驗證打字動畫渲染
  - _Requirements: 2.1, 2.2, 2.3, 2.8, 4.2, 4.3_

- [x] 14. 渲染副標題與描述段落
  - 在打字動畫完成後立即顯示 subtitle
  - 套用正確樣式（text-xl md:text-2xl mb-8 text-pip-boy-green/80）
  - 使用淡入效果（CSS transition）顯示 description
  - 套用正確樣式（text-sm font-mono text-pip-boy-green/60 max-w-2xl mx-auto leading-relaxed）
  - 確保文字正確保留特殊字符（™、©、®）
  - 擴充測試驗證三階段渲染（title → subtitle → description）
  - _Requirements: 2.5, 2.6, 4.4, 4.5, 1.6_

- [x] 15. 整合 useCarousel 至 DynamicHeroTitle
  - 在 DynamicHeroTitle 中整合 useCarousel hook
  - 根據 `currentIndex` 取得對應文案資料
  - 實作動畫生命週期：打字完成 → 停留 8 秒 → 開始刪除
  - 刪除完成後透過 useCarousel 切換至下一組索引
  - 切換後重新開始打字動畫
  - 擴充測試驗證完整動畫週期
  - _Requirements: 3.1, 3.2, 3.3, 3.6_

- [x] 16. 渲染 CarouselIndicator 並處理互動
  - 在 DynamicHeroTitle 中渲染 CarouselIndicator 元件
  - 傳入正確的 props（totalCount, currentIndex, onDotClick）
  - 實作 onDotClick 邏輯：中斷當前動畫 → 快速刪除 → 切換索引 → 打字新文案
  - 確保單一文案時隱藏指示器
  - 驗證指示器位置與間距（標題下方，mb-12）
  - 擴充測試驗證手動切換流程
  - _Requirements: 3.4, 3.5, 3.6, 3.9, 4.9_

- [x] 17. 實作無障礙屬性
  - 在標題容器加入 `aria-live="polite"`
  - 確保響應式設計（text-5xl on mobile, text-7xl on desktop）
  - 整合 `prefers-reduced-motion` 偵測
  - 驗證鍵盤導航流程（Tab 至指示器，Enter/Space 切換）
  - 確保所有互動元素有清晰的焦點環
  - 擴充測試驗證無障礙功能
  - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7, 5.8_

## 視覺整合與錯誤處理

- [x] 18. 整合至首頁 Hero Section
  - 修改 `src/app/page.tsx`，引入 DynamicHeroTitle 元件
  - 保留 Terminal Header（VAULT-TEC PIP-BOY 3000 MARK IV）
  - 用 DynamicHeroTitle 替換現有靜態標題區塊（h1, p, p）
  - 確保保留掃描線效果（scanline）
  - 確保不影響下方按鈕區塊（進入 Vault、快速占卜）
  - 驗證整體間距與佈局（mb-12, mb-16）
  - _Requirements: 4.1, 4.2, 4.6, 4.7, 4.9, 4.10_

- [x] 19. 實作 Error Boundary
  - 建立 `src/components/hero/DynamicHeroTitleErrorBoundary.tsx`
  - 實作 `getDerivedStateFromError` 與 `componentDidCatch`
  - 錯誤時渲染降級 UI（靜態預設文案）
  - 開發模式下 console.error 記錄錯誤詳情
  - 用 Error Boundary 包裹 DynamicHeroTitle
  - 撰寫測試驗證錯誤捕獲與降級 UI
  - _Requirements: 1.7, 5.10_

- [x] 20. 建立 index 匯出檔案
  - 在 `src/components/hero/index.ts` 匯出所有元件
  - 匯出 DynamicHeroTitle、CarouselIndicator、DynamicHeroTitleErrorBoundary
  - 確保 TypeScript 型別正確匯出
  - 更新 `src/app/page.tsx` 使用統一匯入路徑
  - _Requirements: All requirements need proper module organization_

## 測試與品質保證

- [ ] 21. 整合測試：完整動畫週期
  - 在 `src/components/hero/__tests__/DynamicHeroTitle.integration.test.tsx` 建立測試
  - 測試場景：載入 → 打字 → 停留 → 刪除 → 切換 → 重新打字
  - 使用 `jest.useFakeTimers()` 控制時間流逝
  - 驗證 displayText 在各階段的正確值
  - 驗證 animationMode 狀態轉換
  - 驗證 CarouselIndicator 當前索引更新
  - _Requirements: 2.1-2.9, 3.1-3.11_

- [ ] 22. 整合測試：錯誤處理與降級
  - 測試 JSON 載入失敗場景
  - Mock `fetch` 返回錯誤，驗證顯示 FALLBACK_TITLE
  - 測試 JSON 解析錯誤場景
  - 測試驗證錯誤場景（缺少必要欄位）
  - 驗證 console.error 正確呼叫
  - _Requirements: 1.7, 5.10_

- [ ] 23. 整合測試：使用者互動
  - 測試點擊指示器切換文案流程
  - 測試鍵盤導航（Tab → Enter/Space）
  - 測試滑鼠移動暫停自動播放
  - 測試分頁切換時暫停/恢復動畫
  - 驗證所有互動的狀態正確性
  - _Requirements: 3.4-3.11, 5.6-5.8_

- [ ] 24. 無障礙測試：axe-core 自動化檢測
  - 在 `src/components/hero/__tests__/DynamicHeroTitle.a11y.test.tsx` 建立測試
  - 整合 `@axe-core/react` 進行自動化檢測
  - 驗證無 accessibility violations
  - 驗證所有 ARIA 屬性正確設定
  - 驗證 focus ring 對比度符合 WCAG AA
  - 目標：0 violations
  - _Requirements: 5.1-5.8_

- [ ] 25. 效能測試：動畫幀率與記憶體
  - 建立 `src/components/hero/__tests__/DynamicHeroTitle.performance.test.tsx`
  - 使用 React DevTools Profiler API 測量 re-render 次數
  - 驗證單個動畫週期 re-render <10 次
  - 模擬長時間運行（10 個動畫週期），檢測記憶體洩漏
  - 驗證 `cancelAnimationFrame` 與事件監聽器正確清理
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_

- [ ] 26. Snapshot 測試：視覺一致性
  - 建立 snapshot 測試驗證渲染結構穩定
  - 測試各種狀態：loading、typing、deleting、idle
  - 測試不同文案索引的渲染結果
  - 測試錯誤狀態的降級 UI
  - 確保樣式類別正確套用（Tailwind classes）
  - _Requirements: 4.1-4.10_

## 文檔與 Code Review

- [ ] 27. 程式碼審查與重構
  - 審查所有元件與 hooks 的 TypeScript 型別註解
  - 確保所有函式有清晰的 JSDoc 註解（複雜邏輯）
  - 重構重複程式碼，提取共用邏輯
  - 確保命名一致性（變數、函式、元件）
  - 執行 ESLint 並修正所有警告
  - _Requirements: All requirements benefit from code quality_

- [ ] 28. 最終整合驗證
  - 在瀏覽器中手動測試完整功能
  - 驗證所有 5 組文案正確顯示與切換
  - 驗證打字/刪除動畫流暢度（60 FPS）
  - 驗證響應式設計（桌面、平板、手機）
  - 驗證鍵盤導航與螢幕閱讀器相容性
  - 執行 Lighthouse 測試，確保 Performance ≥90, Accessibility = 100
  - _Requirements: All requirements need final validation_