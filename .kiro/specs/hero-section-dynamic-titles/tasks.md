# Implementation Plan

## 專案概述

本實作計畫為首頁 Hero Section 動態標題系統新增完整的 CRT 螢幕視覺特效（Requirement 7），包含 RGB 像素網格疊加與靜態色彩分離效果。這些純 CSS 特效將與現有的打字機動畫、閃爍游標和動態 glitch 效果整合，創造完整的 Pip-Boy 終端機復古美學體驗。

**實作策略**: 純 CSS 擴充現有 `DynamicHeroTitle.module.css`，無需修改 React 元件邏輯。

---

## 任務清單

- [ ] 1. 建立 CSS 變數架構以支援 CRT 視覺參數
- [ ] 1.1 定義 CRT 視覺效果的 CSS 變數系統
  - 在 `DynamicHeroTitle.module.css` 的 `:root` 或元件層級定義所有 CRT 相關變數
  - 定義 `--crt-grid-size: 3px` 控制 RGB 網格解析度
  - 定義 `--crt-red-offset: 2px` 與 `--crt-blue-offset: -2px` 控制色彩分離偏移
  - 定義 `--crt-shadow-opacity: 0.9` 控制靜態陰影透明度
  - 定義 `--crt-grid-opacity-vertical: 0.2` 與 `--crt-grid-opacity-horizontal: 0.7` 控制網格層透明度
  - 確保所有變數使用 kebab-case 命名並遵循 `--crt-{category}-{property}` 模式
  - _Requirements: 7.26_

- [ ] 1.2 為 CSS 變數提供 Fallback 預設值以支援舊版瀏覽器
  - 在每個使用 CSS 變數的屬性前提供 hardcoded fallback 值
  - 範例: `background-size: 3px 3px;` 後再加上 `background-size: var(--crt-grid-size) var(--crt-grid-size);`
  - 確保即使 CSS Variables 不支援，視覺效果仍能正常降級
  - _Requirements: 7.22_

- [ ] 2. 實作 RGB 像素網格疊加效果
- [ ] 2.1 建立標題容器的網格疊加層基礎結構
  - 在 `DynamicHeroTitle.module.css` 新增 `.hero-title-container` 樣式類別
  - 設定 `position: relative` 以承載 `::after` pseudo-element
  - 確保容器有明確的邊界範圍（top/right/bottom/left）
  - _Requirements: 7.1, 7.5_

- [ ] 2.2 使用 ::after pseudo-element 創建 RGB 網格
  - 在 `.hero-title-container::after` 定義 pseudo-element
  - 設定 `content: ''` 與 `position: absolute` 填滿整個容器（`top: 0; right: 0; bottom: 0; left: 0`）
  - 設定 `pointer-events: none` 避免干擾文字選取與互動
  - 設定 `z-index: 1` 確保疊加層在文字下方（文字應為 z-index: 2）
  - _Requirements: 7.1, 7.6_

- [ ] 2.3 實作雙 linear-gradient 組合生成 RGB 子像素網格
  - 在 `background-image` 屬性定義兩個 `linear-gradient`
  - 第一層（垂直掃描線）: `linear-gradient(to top, rgba(255,255,255,0.2) 33.33%, rgba(255,255,255,0.4) 33.33%, rgba(255,255,255,0.4) 66.67%, rgba(255,255,255,0.6) 66.67%)`
  - 第二層（水平 RGB）: `linear-gradient(to right, rgba(255,0,0,0.7) 33.33%, rgba(0,255,0,0.7) 33.33%, rgba(0,255,0,0.7) 66.67%, rgba(0,0,255,0.7) 66.67%)`
  - 使用 CSS 變數替換 hardcoded 透明度數值（`var(--crt-grid-opacity-vertical)` 等）
  - _Requirements: 7.2_

- [ ] 2.4 配置網格尺寸與重複模式
  - 設定 `background-size: var(--crt-grid-size) var(--crt-grid-size)` (3px × 3px)
  - 設定 `background-repeat: repeat` 確保網格鋪滿整個容器
  - _Requirements: 7.3_

- [ ] 2.5 套用混合模式實現網格與文字融合
  - 設定 `mix-blend-mode: multiply` 讓網格與底層內容自然融合
  - 驗證在深色背景 + Pip-Boy 綠色文字的組合下效果正確
  - _Requirements: 7.4_

- [ ] 3. 實作靜態色彩分離效果（基礎層）
- [ ] 3.1 為主標題新增靜態色彩分離樣式
  - 在 `DynamicHeroTitle.module.css` 新增 `.hero-title-text` 樣式類別
  - 定義雙層 `text-shadow` 陰影效果：
    - 紅色陰影: `var(--crt-red-offset) 0 0 rgba(255, 0, 0, var(--crt-shadow-opacity))`
    - 藍色陰影: `var(--crt-blue-offset) 0 0 rgba(0, 0, 255, var(--crt-shadow-opacity))`
  - 設定 `position: relative` 與 `z-index: 2` 確保文字在網格之上
  - _Requirements: 7.9, 7.10_

- [ ] 3.2 為副標題與描述段落新增較弱的色彩分離效果
  - 新增 `.hero-subtitle-text` 與 `.hero-description-text` 樣式類別
  - 套用與主標題相同的 `text-shadow` 結構，但透明度降至 `calc(var(--crt-shadow-opacity) * 0.5)`
  - 確保視覺層次分明：主標題效果強烈，副標題/描述較為 subtle
  - _Requirements: 7.11_

- [ ] 3.3 確保靜態與動態色彩分離效果的層次協作
  - 驗證靜態 `text-shadow` 作為基礎層持續可見
  - 確認當 `.hero-title-glitching` 動態 glitch 類別觸發時，CSS specificity 正確覆蓋靜態效果
  - 確認 glitch 動畫結束後，靜態效果自動恢復
  - _Requirements: 7.13, 7.14, 7.15_

- [ ] 4. 整合 CRT 效果與現有視覺系統
- [ ] 4.1 確保 CRT 效果與 Requirement 6 的 Retro 游標共存
  - 驗證 `.typing-cursor-inline` 游標樣式不受 RGB 網格干擾
  - 確認游標閃爍動畫在 CRT 效果上方正常運作
  - 測試游標 z-index 層次正確（應高於網格與文字）
  - _Requirements: 7.18, 整合驗證_

- [ ] 4.2 驗證 CRT 效果與動態 Glitch 效果的視覺協作
  - 測試靜態色彩分離（基礎層）與動態 glitch（增強層）同時作用的視覺效果
  - 確認 glitch 觸發時（8-15秒隨機間隔）視覺過渡平滑無衝突
  - 驗證 glitch 的 `transform: skewX()` 傾斜效果與 RGB 網格無視覺干擾
  - _Requirements: 7.13, 7.21_

- [ ] 4.3 確保輪播切換時 CRT 效果持續可見
  - 測試文案輪播切換動畫（淡入淡出）不中斷 RGB 網格顯示
  - 驗證新標題載入時靜態色彩分離自動套用
  - 確認 CRT 效果在整個輪播生命週期中保持一致
  - _Requirements: 7.20_

- [ ] 4.4 驗證 CRT 效果與現有掃描線效果（scanline effect）的視覺和諧
  - 測試 Requirement 4 中提到的既有掃描線效果與新的 RGB 網格同時顯示的視覺效果
  - 確認兩者不產生視覺衝突或疊加過度（可能需要調整透明度或移除舊掃描線）
  - 如有衝突，決定保留哪個效果或如何調和
  - _Requirements: 7.25_

- [ ] 5. 實作無障礙支援與優雅降級
- [ ] 5.1 實作 prefers-reduced-motion 降低效果強度
  - 新增 `@media (prefers-reduced-motion: reduce)` 媒體查詢規則
  - 在媒體查詢內將 `--crt-grid-opacity-vertical` 降至 `0.1`（原本 0.2 的 50%）
  - 在媒體查詢內將 `--crt-grid-opacity-horizontal` 降至 `0.35`（原本 0.7 的 50%）
  - 保留靜態色彩分離效果，但停用動態 glitch（`.hero-title-glitching { animation: none !important; }`）
  - _Requirements: 7.8, 7.16_

- [ ] 5.2 實作 mix-blend-mode 不支援時的降級策略
  - 新增 `@supports not (mix-blend-mode: multiply)` 功能查詢規則
  - 在規則內設定 `.hero-title-container::after { display: none; }` 隱藏 RGB 網格
  - 確保即使網格隱藏，靜態色彩分離仍可見（優雅降級至純色彩分離效果）
  - _Requirements: 7.22_

- [ ] 5.3 驗證文字對比度符合 WCAG AA 標準
  - 使用對比度檢查工具驗證 Pip-Boy 綠色文字 + RGB 網格 + 色彩分離組合後對比度 ≥ 4.5:1
  - 若對比度不足，調整 `--crt-grid-opacity-*` 或 `--crt-shadow-opacity` 數值
  - 特別注意副標題與描述段落的可讀性（色彩分離透明度較低）
  - _Requirements: 7.7_

- [ ] 6. 跨瀏覽器相容性測試與修正
- [ ] 6.1 Chrome/Edge 瀏覽器 CRT 效果驗證
  - 在 Chrome/Edge 環境測試 RGB 網格正確渲染
  - 驗證 `mix-blend-mode: multiply` 正確融合網格與文字
  - 驗證靜態與動態色彩分離效果正確作用
  - 截圖記錄作為 baseline 比對標準
  - _Requirements: 7.24, 跨瀏覽器測試_

- [ ] 6.2 Firefox 瀏覽器相容性驗證
  - 測試 Firefox 對 `linear-gradient` 雙層組合的渲染正確性
  - 驗證 `mix-blend-mode: multiply` 效果與 Chrome 一致
  - 檢查是否有 vendor prefix 需求（通常現代瀏覽器已不需要）
  - _Requirements: 跨瀏覽器測試_

- [ ] 6.3 Safari 瀏覽器特殊處理與測試
  - 測試 Safari (macOS & iOS) 對 `mix-blend-mode` 的渲染是否有已知異常
  - 驗證 `text-shadow` 與 `background-image` 組合不產生視覺 artifacts
  - 如發現渲染問題，新增 Safari 專用 CSS hack 或調整參數
  - _Requirements: 7.24_

- [ ] 6.4 行動裝置高 DPI 螢幕測試
  - 在 Retina 螢幕（2x/3x）測試 `3px` 網格是否清晰可見（不模糊或過於細碎）
  - 驗證在 iPhone、iPad、Android 高解析度裝置上視覺效果一致
  - 如需要，調整 `--crt-grid-size` 使用 `min()` 函式適應不同 DPI
  - _Requirements: 7.21_

- [ ] 7. 效能驗證與最佳化
- [ ] 7.1 使用 Chrome DevTools 驗證 CRT 效果的渲染效能
  - 開啟 Performance 面板記錄頁面載入與動畫執行過程
  - 驗證 FPS 維持在 ≥60（打字動畫 + CRT 效果 + glitch 同時執行）
  - 檢查 `text-shadow` 與 `background-image` 是否觸發過多 repaint 或 reflow
  - 驗證無 "Forced Synchronous Layout" 警告
  - _Requirements: 效能驗證_

- [ ] 7.2 測試 First Contentful Paint 不受影響
  - 使用 Lighthouse 測量 FCP 指標
  - 確認 CRT 效果（純 CSS）不增加首屏渲染時間（目標 <1.5s）
  - 驗證 CSS Module 大小增加量 <2KB（符合預期）
  - _Requirements: 效能目標_

- [ ] 7.3 驗證分頁切換時資源管理正確
  - 測試頁面切換至背景分頁時，動態 glitch 計時器正確暫停（由 `usePageVisibility` 管理）
  - 確認靜態 CRT 效果（RGB 網格 + 色彩分離）持續顯示（CSS 不受分頁影響）
  - 驗證回到前景分頁時所有效果正確恢復
  - _Requirements: 整合驗證_

- [ ] 8. JSX 結構修改與樣式類別套用
- [ ] 8.1 在 DynamicHeroTitle 元件 JSX 套用 CRT 樣式類別
  - 在主標題容器元素新增 `className={styles['hero-title-container']}`
  - 在主標題 h1 元素新增 `className={styles['hero-title-text']}`
  - 在副標題 p 元素新增 `className={styles['hero-subtitle-text']}`
  - 在描述段落 p 元素新增 `className={styles['hero-description-text']}`
  - 確保與現有 Tailwind classes 共存（使用空格分隔多個 class）
  - _Requirements: CSS 類別套用_

- [ ] 8.2 驗證 CSS Module 類別正確載入與作用
  - 在瀏覽器 DevTools 檢查元素，確認 scoped class names 正確套用（如 `.hero-title-container_abc123`）
  - 驗證 `::after` pseudo-element 存在於 DOM（在 Elements 面板檢查）
  - 確認 computed styles 顯示 CSS 變數已正確解析（如 `--crt-grid-size: 3px`）
  - _Requirements: 整合驗證_

- [ ] 9. 端到端測試與視覺回歸驗證
- [ ] 9.1 撰寫 Playwright E2E 測試驗證 CRT 效果渲染
  - 建立測試檔案 `tests/e2e/hero-crt-effects.spec.ts`
  - 測試案例 1: 驗證主標題有 `text-shadow` 包含 `rgb(255, 0, 0)` 與 `rgb(0, 0, 255)`
  - 測試案例 2: 驗證 `::after` pseudo-element 的 `backgroundImage` 包含兩個 `linear-gradient`
  - 測試案例 3: 驗證 `mixBlendMode` 為 `multiply`
  - _Requirements: E2E 測試_

- [ ] 9.2 建立視覺回歸測試 baseline 截圖
  - 使用 Playwright 的 `toHaveScreenshot()` API 對 Hero Section 截圖
  - 建立 baseline 截圖檔案（如 `hero-crt-effect-chrome.png`）
  - 設定 `maxDiffPixels` 容差值（建議 100-200）以允許微小渲染差異
  - _Requirements: 視覺回歸測試_

- [ ] 9.3 測試 prefers-reduced-motion 模式的視覺降級
  - 使用 Playwright 模擬 `prefers-reduced-motion: reduce` 偏好設定
  - 驗證 RGB 網格透明度降低（檢查 computed style 的 opacity 或 background-image alpha 值）
  - 驗證動態 glitch 動畫停用（`.hero-title-glitching` 的 `animation` 屬性為 `none`）
  - 驗證靜態色彩分離仍可見
  - _Requirements: 無障礙測試_

- [ ] 10. 文件更新與程式碼清理
- [ ] 10.1 更新 DynamicHeroTitle.module.css 註釋文件
  - 在 CSS 檔案頂部新增 JSDoc-style 註釋說明 CRT 效果架構
  - 為每個 CSS 變數新增 inline 註釋說明用途與可調範圍
  - 為 `.hero-title-container::after` 新增區塊註釋說明 RGB 網格實作原理
  - 標註哪些樣式與 Requirement 7 對應
  - _Requirements: 程式碼文件化_

- [ ] 10.2 驗證無遺留的 console.log 或 debug 程式碼
  - 搜尋所有修改過的檔案確認無 `console.log`、`debugger` 或註釋掉的測試碼
  - 確保所有 CSS 變數名稱一致（無拼寫錯誤或不一致命名）
  - 驗證 CSS 檔案格式化正確（縮排、空行、順序）
  - _Requirements: 程式碼品質_

- [ ] 10.3 更新 spec.json 標記任務完成
  - 將 `spec.json` 的 `approvals.tasks.approved` 設為 `true`
  - 更新 `phase` 為 `"implementation-complete"`
  - 更新 `updated_at` 時間戳記為當前 ISO8601 時間
  - _Requirements: 專案管理_

---

## 實作順序建議

建議按照以下順序執行任務以降低返工風險：

1. **階段 1: CSS 基礎建設**（任務 1）→ 建立變數系統，確保未來調校彈性
2. **階段 2: RGB 網格實作**（任務 2）→ 核心視覺效果，獨立於色彩分離
3. **階段 3: 靜態色彩分離**（任務 3）→ 基礎層效果，與動態 glitch 協作
4. **階段 4: 系統整合驗證**（任務 4）→ 確保所有視覺效果和諧共存
5. **階段 5: 無障礙與降級**（任務 5）→ WCAG 合規與舊版瀏覽器支援
6. **階段 6: 跨瀏覽器測試**（任務 6）→ 真實環境驗證
7. **階段 7: 效能基準測試**（任務 7）→ 確保不影響使用者體驗
8. **階段 8: JSX 套用與驗證**（任務 8）→ 最終整合
9. **階段 9: E2E 與視覺測試**（任務 9）→ 自動化回歸驗證
10. **階段 10: 收尾與文件**（任務 10）→ 專案完成檢查

---

**預估總時程**: 約 12-16 小時（假設單人開發，包含測試與調校時間）

**關鍵里程碑**:
- ✅ RGB 網格首次渲染成功（任務 2 完成）
- ✅ 靜態與動態色彩分離協作無衝突（任務 3 & 4 完成）
- ✅ 所有瀏覽器視覺效果一致（任務 6 完成）
- ✅ WCAG AA 無障礙標準驗證通過（任務 5.3 完成）
- ✅ E2E 測試 100% 通過（任務 9 完成）
