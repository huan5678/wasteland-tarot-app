# Requirements Document

## Introduction

本功能為首頁 Hero Section 新增動態標題系統，透過多組圍繞「玄學的盡頭是科學」主題的創意文案，結合打字機動畫效果與自動輪播機制，提升使用者初次造訪時的沉浸感與趣味性。所有文案將維持 Fallout 廢土美學與黑色幽默風格，透過 JSON 資料檔案管理，確保內容易於維護與擴充。

### Business Value
- **提升使用者參與度**：動態內容增加頁面趣味性，降低跳出率
- **強化品牌識別**：透過一致的主題變化強化「科學與玄學結合」的核心概念
- **改善使用者體驗**：打字動畫營造 Terminal 終端機氛圍，符合 Fallout 世界觀
- **內容擴充性**：JSON 資料結構便於未來新增更多創意文案

## Requirements

### Requirement 1: 動態文案資料管理

**User Story:** 作為系統管理員，我希望能夠輕鬆管理和更新 Hero Section 的文案內容，以便快速調整行銷訊息而不需要修改程式碼。

#### Acceptance Criteria

1. WHEN 系統初始化時 THEN 系統 SHALL 建立 `src/data/heroTitles.json` 檔案用於儲存所有文案資料

2. WHERE 在 heroTitles.json 檔案中 THE 系統 SHALL 包含至少 5 組完整的文案配置

3. IF 單一文案配置 THEN 系統 SHALL 包含以下必要欄位：
   - `id`: 唯一識別碼（字串）
   - `title`: 主標題文字（字串）
   - `subtitle`: 副標題文字（字串）
   - `description`: 描述段落（字串）
   - `enabled`: 啟用狀態（布林值，預設 true）

4. WHERE 所有主標題內容 THE 每個標題 SHALL 圍繞「玄學的盡頭是科學」核心主題進行創意發想

5. IF 文案內容 THEN 系統 SHALL 維持 Fallout 廢土風格與黑色幽默語調

6. WHEN 文案資料包含 trademark 符號 THEN 系統 SHALL 正確保留特殊字符（如 ™、©、®）

7. IF JSON 檔案格式錯誤或無法載入 THEN 系統 SHALL 提供友善的錯誤訊息並使用預設文案作為備援

### Requirement 2: 打字機動畫效果整合

**User Story:** 作為網站訪客，我希望看到標題以打字機特效逐字顯示，讓我感受到 Pip-Boy 終端機的真實感與科技氛圍。

#### Acceptance Criteria

1. WHEN 頁面 Hero Section 載入完成 THEN 系統 SHALL 整合 reactbits.dev 的 text-type 動畫元件

2. WHEN 文案開始顯示 THEN 系統 SHALL 對主標題（title）套用打字機動畫效果

3. WHERE 打字動畫執行中 THE 系統 SHALL 以可配置的速度逐字顯示標題文字

4. IF 打字動畫速度未設定 THEN 系統 SHALL 使用預設速度 50 毫秒/字元

5. WHEN 主標題打字動畫完成 THEN 系統 SHALL 立即顯示副標題（subtitle）文字

6. WHEN 副標題顯示完成 THEN 系統 SHALL 以淡入效果（fade-in）顯示描述段落（description）

7. IF 使用者偏好設定要求減少動畫（prefers-reduced-motion） THEN 系統 SHALL 停用打字動畫並直接顯示完整文字

8. WHILE 打字動畫執行中 THE 系統 SHALL 在游標位置顯示閃爍的綠色方塊（|）模擬終端機游標

9. WHEN 單組文案的所有動畫完成 THEN 系統 SHALL 觸發 `onAnimationComplete` 回調事件

### Requirement 3: 自動輪播與切換機制

**User Story:** 作為網站訪客，我希望系統能自動輪播不同的創意標題，讓我在停留頁面時持續獲得新鮮感，同時也能手動控制切換。

#### Acceptance Criteria

1. WHEN 單組文案動畫完成 AND 啟用自動輪播 THEN 系統 SHALL 在 8 秒後自動切換至下一組文案

2. IF 當前顯示的是最後一組文案 THEN 系統 SHALL 循環回到第一組文案繼續播放

3. WHEN 自動切換至下一組文案 THEN 系統 SHALL 先淡出當前文案（300ms）再淡入新文案（300ms）

4. WHERE 在 Hero Section 標題區塊下方 THE 系統 SHALL 顯示輪播指示器（dots indicator）

5. WHEN 顯示輪播指示器 THEN 系統 SHALL 為每組啟用的文案顯示一個圓點，並高亮標示當前活躍的文案

6. IF 使用者點擊指示器圓點 THEN 系統 SHALL 立即切換至對應的文案組並重置自動輪播計時器

7. WHERE 使用者與頁面互動（滑鼠移動、觸控） THE 系統 SHALL 暫停自動輪播計時

8. WHEN 使用者停止互動超過 5 秒 THEN 系統 SHALL 恢復自動輪播計時

9. IF 只有一組啟用的文案 THEN 系統 SHALL 隱藏輪播指示器並停用自動輪播功能

10. WHEN 頁面切換至背景分頁（tab hidden） THEN 系統 SHALL 暫停所有動畫與輪播計時以節省資源

11. WHEN 頁面恢復至前景分頁 THEN 系統 SHALL 繼續當前文案的動畫與輪播邏輯

### Requirement 4: Hero Section 視覺整合

**User Story:** 作為產品設計師，我希望動態標題系統完美融入現有的 Hero Section 設計，維持 Pip-Boy 終端機美學與 Fallout 世界觀的一致性。

#### Acceptance Criteria

1. WHERE 在現有 Hero Section 結構中 THE 系統 SHALL 保留 Terminal Header（VAULT-TEC PIP-BOY 3000 MARK IV）不變

2. WHEN 替換標題內容 THEN 系統 SHALL 維持現有的標題區塊結構（h1、p、p）

3. IF 主標題文字 THEN 系統 SHALL 使用現有樣式類別：
   - `text-5xl md:text-7xl font-bold mb-6 font-mono tracking-tight text-pip-boy-green`

4. IF 副標題文字 THEN 系統 SHALL 使用現有樣式類別：
   - `text-xl md:text-2xl mb-8 text-pip-boy-green/80`

5. IF 描述段落文字 THEN 系統 SHALL 使用現有樣式類別：
   - `text-sm font-mono text-pip-boy-green/60 max-w-2xl mx-auto leading-relaxed`

6. WHERE 在標題區塊內 THE 系統 SHALL 維持所有既有的 Pip-Boy 綠色色調（pip-boy-green 及其變體）

7. WHEN 動態標題元件渲染 THEN 系統 SHALL 保留現有的掃描線效果（scanline effect）

8. IF 輪播指示器顯示 THEN 系統 SHALL 使用 Pip-Boy 綠色主題並採用終端機風格設計（方形或矩形而非圓形）

9. WHERE 在標題區塊與按鈕區塊之間 THE 系統 SHALL 維持現有的間距（mb-12 與 mb-16）

10. WHEN 文案切換動畫執行 THEN 系統 SHALL 確保不影響下方「進入 Vault」與「快速占卜」按鈕的功能與位置

### Requirement 5: 響應式設計與無障礙支援

**User Story:** 作為使用各種裝置與輔助技術的使用者，我希望動態標題系統在所有裝置上都能正常運作，並提供良好的無障礙體驗。

#### Acceptance Criteria

1. WHEN 在桌面裝置檢視（≥768px） THEN 系統 SHALL 顯示完整的主標題尺寸（text-7xl）

2. WHEN 在行動裝置檢視（<768px） THEN 系統 SHALL 顯示較小的主標題尺寸（text-5xl）

3. IF 螢幕閱讀器啟用 THEN 系統 SHALL 為輪播指示器提供 `aria-label` 描述（如「第 1 組文案，共 5 組」）

4. WHERE 當前活躍的文案 THE 系統 SHALL 在對應的指示器圓點上設定 `aria-current="true"`

5. WHEN 打字動畫執行中 THEN 系統 SHALL 在標題容器上設定 `aria-live="polite"` 讓螢幕閱讀器能讀取完整內容

6. IF 使用者透過鍵盤導航（Tab） THEN 系統 SHALL 確保輪播指示器圓點可被聚焦（focusable）

7. WHEN 指示器圓點獲得鍵盤焦點 THEN 系統 SHALL 顯示清晰的焦點環（focus ring）符合 WCAG AA 對比標準

8. IF 使用者按下 Enter 或 Space 鍵 AND 焦點在指示器圓點上 THEN 系統 SHALL 切換至對應的文案組

9. WHERE 在行動裝置上 THE 系統 SHALL 支援左右滑動手勢（swipe）切換文案（可選功能）

10. WHEN 網路連線緩慢或 JSON 檔案載入失敗 THEN 系統 SHALL 顯示預設文案（現有的「玄學的盡頭是科學™」）確保使用者體驗不中斷

11. IF 打字動畫執行時間過長（>5 秒） THEN 系統 SHALL 提供「跳過動畫」按鈕（可選）讓使用者快速查看完整內容

### Requirement 6: 效能與資源管理

**User Story:** 作為效能工程師，我希望動態標題系統在執行動畫與輪播時不會影響整體頁面效能或造成不必要的資源消耗。

#### Acceptance Criteria

1. WHEN 元件初次渲染 THEN 系統 SHALL 只載入並解析 heroTitles.json 一次，並將資料快取至記憶體

2. IF 打字動畫使用 JavaScript 計時器 THEN 系統 SHALL 使用 `requestAnimationFrame` 而非 `setInterval` 以優化效能

3. WHEN 頁面切換至背景分頁 THEN 系統 SHALL 清除所有進行中的計時器（timers）與動畫迴圈

4. WHERE 在元件卸載時（unmount） THE 系統 SHALL 清理所有事件監聽器與計時器避免記憶體洩漏

5. IF 文案切換動畫 THEN 系統 SHALL 使用 CSS transitions 或 CSS animations 而非 JavaScript 動畫以提升流暢度

6. WHEN 動畫執行中 THEN 系統 SHALL 確保不觸發 layout reflow 或強制同步佈局計算

7. IF JSON 檔案大小超過 50KB THEN 系統 SHALL 考慮使用 dynamic import 或 code splitting 延遲載入

8. WHERE 在開發模式中 THE 系統 SHALL 提供 console 警告當文案資料格式不符合預期結構

## Technical Constraints

### Frontend Technologies
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Runtime**: Bun
- **Styling**: Tailwind CSS v4
- **Animation Library**: reactbits.dev text-type component

### Data Storage
- **Format**: JSON
- **Location**: `src/data/heroTitles.json`
- **Encoding**: UTF-8 with BOM for Traditional Chinese support

### Performance Targets
- **Initial Load Impact**: <100ms additional load time
- **Animation Frame Rate**: ≥60 FPS
- **JSON File Size**: <20KB
- **Accessibility**: WCAG 2.1 AA compliance

## Success Criteria

專案成功的衡量標準：

1. ✅ 至少建立 5 組圍繞「玄學與科學」主題的創意文案
2. ✅ 打字動畫流暢執行於所有主流瀏覽器（Chrome, Firefox, Safari, Edge）
3. ✅ 自動輪播功能正常運作且不影響頁面效能
4. ✅ 通過 WCAG 2.1 AA 無障礙標準檢測
5. ✅ 響應式設計在桌面、平板、手機上均正常顯示
6. ✅ 元件載入時間不影響 Core Web Vitals（LCP <2.5s, CLS <0.1）

## Out of Scope

以下項目不在此規格範圍內：

- ❌ 管理後台介面（Admin UI）用於編輯文案
- ❌ A/B Testing 功能比較不同文案的轉換率
- ❌ 多語系支援（目前僅支援繁體中文）
- ❌ 使用者自訂文案或投票功能
- ❌ 語音播報功能（TTS）
- ❌ 動畫效果的使用者偏好設定介面