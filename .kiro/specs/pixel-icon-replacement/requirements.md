# Pixel 風格圖示系統替換 - 需求文件

## 1. 功能概述

將 Wasteland Tarot 平台現有的 `pixelarticons` 圖示系統更換為 **HackerNoon Pixel Icon Library** (`@hackernoon/pixel-icon-library`)，以提供更豐富的圖示選擇（1440+ 圖示 vs 486 圖示）、更好的視覺品質和更靈活的使用方式，進一步強化 Fallout 主題的復古像素美學。

## 2. 商業目標

- **圖示豐富度**：從 486 個圖示升級到 1440+ 個圖示，提供更全面的圖示覆蓋
- **視覺品質提升**：HackerNoon Pixel Icon Library 提供多尺寸支援（12px, 16px, 24px, 48px）和 Light/Dark 模式變體
- **品牌強化**：透過更專業、更精緻的像素風格圖示系統強化 Wasteland Tarot 的獨特品牌形象
- **靈活性**：支援 SVG 和 PNG 格式，提供更多整合選項
- **授權優勢**：圖示使用 CC BY 4.0 授權，其他檔案使用 MIT License，適合商業使用

## 3. 使用者故事

### 3.1 核心使用者故事

**作為** Fallout 粉絲的使用者
**我想要** 看到整個網站使用像素風格的圖示
**以便** 獲得更完整、更沉浸的復古遊戲體驗

**作為** 前端開發者
**我想要** 一個簡單易用的圖示元件系統
**以便** 快速在各個頁面中使用一致風格的圖示

**作為** 設計師
**我想要** 所有圖示都遵循 24x24 像素的統一規格
**以便** 維持視覺的協調性和專業度

## 4. 功能需求 (EARS 格式)

### 4.1 圖示套件整合

**WHEN** 開始實作前
**IF** 需要整合 @hackernoon/pixel-icon-library
**THEN** 系統必須：
- 安裝 NPM 套件：`bun add @hackernoon/pixel-icon-library`
- 評估套件內容結構（SVG 檔案、PNG 檔案、字體檔案）
- 選擇最適合 Next.js 15 + React 19 的整合方式
- 確認 TypeScript 型別支援或建立自訂型別定義
- 測試在 Server Components 和 Client Components 中的相容性
- 評估 bundle 大小影響（套件版本 1.0.6）

### 4.2 圖示包裝元件

**WHEN** 使用者訪問任何頁面
**IF** 頁面包含圖示元件
**THEN** 系統必須：
- 重構現有的 `<PixelIcon>` 包裝元件以使用 HackerNoon 圖示庫
- 支援 `name` prop 用於指定圖示名稱（使用 HackerNoon 的命名規範）
- 支援 `size` prop（對應 12px, 16px, 24px, 48px，或自訂尺寸）
- 支援 `mode` prop（'light' | 'dark'）以選擇圖示變體
- 支援 `format` prop（'svg' | 'png'）以選擇圖示格式
- 支援 `className` prop 用於自訂樣式
- 支援 `aria-label` prop 用於無障礙標籤
- 提供 TypeScript 型別定義和自動完成支援
- 保留 Phase 6 功能（animation, variant, sizePreset, decorative）

### 4.3 圖示映射與回退機制

**WHEN** 元件需要顯示圖示
**IF** 對應的 HackerNoon 圖示不存在
**THEN** 系統必須：
- 建立圖示映射表（pixelarticons → @hackernoon/pixel-icon-library）
- 當找不到對應的圖示時，顯示一個通用的 fallback 圖示
- 在開發模式下，在 console 中輸出警告訊息，包含原圖示名稱和建議的替代圖示
- 記錄映射失敗的圖示名稱，產生遷移報告
- 提供圖示名稱搜尋功能，協助開發者找到最接近的替代圖示

### 4.4 批次替換與遷移

**WHEN** 執行圖示系統遷移
**IF** 網站中存在 `pixelarticons` 圖示使用
**THEN** 系統必須：
- 建立完整的 pixelarticons 使用清單（透過 Grep 搜尋）
- 產生圖示映射表（包含 486 個 pixelarticons → 對應的 HackerNoon 圖示）
- 按優先級分階段替換（核心元件 → 頁面元件 → 測試頁面）
- 保留原有的 props 介面向後相容（size, className, aria-label, animation, variant 等）
- 確保替換前後視覺效果一致或優化
- 更新 `iconMapping.ts` 和 `iconRegistry.ts` 以使用新的圖示來源

### 4.5 效能優化

**WHEN** 使用者載入任何包含圖示的頁面
**IF** 頁面包含多個圖示元件
**THEN** 系統必須：
- 評估 HackerNoon 圖示庫的整合方式（SVG import vs Icon Font vs Dynamic import）
- 使用最優化的載入策略（優先使用 SVG，僅在必要時使用 PNG）
- 實作圖示快取機制（iconRegistry 延續使用）
- 支援關鍵圖示預載（如導航列、常用按鈕）
- 支援非關鍵圖示延遲載入
- 確保圖示載入不影響 FCP（First Contentful Paint）< 1.5s
- 評估 bundle 大小影響，目標維持在 70KB (gzipped) 以下
- 測試多尺寸和多模式圖示對效能的影響

### 4.6 無障礙支援

**WHEN** 螢幕閱讀器使用者訪問頁面
**IF** 頁面包含互動式圖示（按鈕、連結等）
**THEN** 系統必須：
- 為所有互動式圖示提供明確的 `aria-label`
- 裝飾性圖示使用 `aria-hidden="true"`
- 支援鍵盤導航（focus 狀態清晰可見）
- 通過 WCAG 2.1 AA 標準

### 4.7 開發者體驗

**WHEN** 開發者需要使用圖示
**IF** 開發環境已設定
**THEN** 系統必須：
- 提供 TypeScript 型別定義和自動完成（1440+ 圖示名稱）
- 更新圖示預覽頁面 `/icon-showcase`，展示所有 HackerNoon 圖示
- 支援圖示搜尋和分類篩選功能
- 提供遷移指南（pixelarticons → @hackernoon/pixel-icon-library）
- 提供圖示比對工具，協助開發者找到最接近的替代圖示
- 產生遷移報告，列出所有需要手動處理的圖示
- 提供詳細的使用文件（README.md 和 USAGE.md）

## 5. 非功能需求

### 5.1 效能需求
- 圖示初次載入時間 < 150ms（考慮到更大的圖示庫）
- 圖示渲染不阻塞主執行緒
- 支援 SSR（Server-Side Rendering）和 SSG（Static Site Generation）
- 圖示快取有效期至少 24 小時（瀏覽器快取）
- 支援漸進式載入（首屏優先）

### 5.2 相容性需求
- 支援所有 Next.js 15 App Router 頁面
- 支援 React 19 Server Components 和 Client Components
- 支援 Tailwind CSS v4 樣式系統
- 相容現有的 motion 動畫系統
- 支援 Light 和 Dark 模式
- 支援多尺寸響應式設計（12px, 16px, 24px, 48px）

### 5.3 維護性需求
- HackerNoon Pixel Icon Library 版本 1.0.6（MIT License）
- 提供清晰的版本更新策略
- 支援未來新增自訂圖示（與 HackerNoon 圖示共存）
- 保留向後相容的 API 介面

### 5.4 設計需求
- 基準尺寸 24x24px，支援 12px, 16px, 48px 變體
- 圖示顏色支援 Tailwind CSS 的 `text-*` 類別
- 支援 `currentColor` 以繼承父元素顏色
- 與 Cubic 11 字體和 Pip-Boy 配色協調
- Light 模式圖示適用於 Pip-Boy 綠色背景
- Dark 模式圖示適用於深色主題（未來支援）

## 6. 技術約束

- **前端框架**：Next.js 15 + React 19
- **套件管理器**：Bun（不使用 npm 或 yarn）
- **TypeScript**：必須提供完整型別定義
- **樣式系統**：Tailwind CSS v4
- **現有圖示庫**：pixelarticons 1.8.1（需替換為 @hackernoon/pixel-icon-library 1.0.6）
- **圖示套件**：@hackernoon/pixel-icon-library（1440+ 圖示，CC BY 4.0 + MIT License）

## 7. 圖示使用範圍

### 7.1 需要替換的主要頁面/元件
- Header 導航列（選單、用戶、設定圖示）
- Footer 頁尾（社群連結、版權資訊）
- 認證頁面（登入、註冊圖示）
- 儀表板（統計、通知、快捷操作圖示）
- 卡牌瀏覽（篩選、排序、檢視模式圖示）
- 解讀頁面（占卜類型、角色語音、分享圖示）
- 音樂播放器（播放、暫停、上下曲、音量圖示）
- 互動元件（關閉、展開、更多選項圖示）

### 7.2 圖示數量統計
- **現有使用**：約 60-85 個不同的 pixelarticons 圖示
- **新圖示庫**：1440+ 個 HackerNoon 圖示（400+ 獨特設計 × 4 變體）
- **覆蓋率目標**：100% 現有圖示都能找到對應或更好的替代
- **擴展空間**：大幅提升圖示選擇，支援未來功能擴展

## 8. 驗收標準

### 8.1 功能完整性
- [ ] 成功安裝 @hackernoon/pixel-icon-library 1.0.6
- [ ] 所有現有的 pixelarticons 圖示都已映射到 HackerNoon 圖示
- [ ] `<PixelIcon>` 元件重構完成，支援新的 props（name, size, mode, format等）
- [ ] 圖示映射表（pixelarticons → HackerNoon）完整且經過測試
- [ ] Fallback 機制正常運作（找不到圖示時顯示預設圖示）
- [ ] TypeScript 型別定義完整（1440+ 圖示名稱自動完成）

### 8.2 視覺一致性
- [ ] 所有圖示統一使用 24x24px 基準尺寸（支援 12px, 16px, 48px 變體）
- [ ] 圖示風格與 Fallout 主題協調（像素藝術風格）
- [ ] 顏色繼承和自訂樣式正常運作（currentColor 支援）
- [ ] Light/Dark 模式圖示正確顯示
- [ ] 響應式設計在所有裝置上正常顯示
- [ ] 視覺效果與 pixelarticons 版本相同或更好

### 8.3 效能指標
- [ ] 圖示 bundle 大小 ≤ 70KB (gzipped)（考慮到更大的圖示庫）
- [ ] Lighthouse 效能分數維持或提升
- [ ] FCP < 1.5s（不因圖示載入而延遲）
- [ ] 圖示快取機制有效運作
- [ ] 首屏圖示載入時間 < 150ms

### 8.4 無障礙性
- [ ] 所有互動式圖示都有 aria-label
- [ ] 裝飾性圖示使用 aria-hidden
- [ ] 通過 axe-core 無障礙檢測
- [ ] 鍵盤導航正常運作

### 8.5 開發者體驗
- [ ] TypeScript 自動完成正常運作（1440+ 圖示名稱）
- [ ] 更新圖示預覽頁面 `/icon-showcase`（展示 HackerNoon 圖示）
- [ ] 提供遷移指南（pixelarticons → HackerNoon）
- [ ] 提供圖示比對工具和遷移報告
- [ ] 元件 API 簡單直觀且向後相容
- [ ] 提供完整的使用文件（README.md, USAGE.md, MIGRATION.md）

## 9. 排除範圍

- 不建立全新的自訂圖示（僅使用 HackerNoon 圖示庫提供的圖示）
- 不移除 Phase 6 已實作的動畫效果（保留並確保相容）
- 不更改現有圖示的語義（僅替換視覺來源）
- 不支援多種圖示風格切換（僅 HackerNoon pixel 風格）
- 不在此階段實作 Dark 模式圖示完整支援（保留 Light 模式優先）

## 10. 風險與依賴

### 10.1 風險
- **學習曲線**：HackerNoon 圖示命名規範可能與 pixelarticons 不同，需要時間熟悉
- **圖示映射挑戰**：486 個 pixelarticons 可能無法 1:1 完美映射到 HackerNoon 圖示
- **套件整合複雜度**：HackerNoon 圖示庫可能需要額外的整合工作（字體檔案、SVG 處理等）
- **Bundle 大小增加**：1440+ 圖示可能導致 bundle 大小顯著增加
- **維護狀態**：套件版本 1.0.6，需評估維護活躍度

### 10.2 依賴
- 依賴 @hackernoon/pixel-icon-library 1.0.6 套件
- 依賴 React 19 和 Next.js 15 的相容性
- 依賴 Tailwind CSS v4 的樣式系統
- 依賴 Bun 套件管理器
- 依賴現有的 iconRegistry 和 iconMapping 架構

### 10.3 緩解措施
- **套件評估**：先安裝並測試 @hackernoon/pixel-icon-library，確認套件結構和整合方式
- **映射策略**：建立完整的映射表，對於無法映射的圖示提供手動選擇最佳替代
- **效能優化**：使用 dynamic import 和 tree-shaking，僅載入實際使用的圖示
- **fallback 機制**：確保找不到圖示時有優雅的降級方案
- **文件完整性**：提供詳細的遷移指南和圖示對照表

## 11. 後續優化方向

- 完整支援 Light/Dark 模式圖示自動切換
- 建立自訂圖示設計規範（與 HackerNoon 風格一致）
- 整合圖示使用分析（追蹤最常用的圖示，優化預載清單）
- 實作圖示 CDN 快取策略（提升全球使用者載入速度）
- 探索 Icon Font 與 SVG 的混合使用策略（平衡效能與靈活性）

## 12. 套件評估摘要

### HackerNoon Pixel Icon Library 評估

**優勢**：
- ✅ 1440+ 圖示（400+ 獨特設計 × 4 變體）遠超 pixelarticons 的 486 個
- ✅ 多尺寸支援：12px, 16px, 24px, 48px
- ✅ Light/Dark 模式變體內建
- ✅ SVG 和 PNG 雙格式支援
- ✅ CC BY 4.0 + MIT License，適合商業使用
- ✅ 設計風格符合 Fallout 復古像素美學

**挑戰**：
- ⚠️ 套件文件相對簡略，需自行探索整合方式
- ⚠️ TypeScript 型別可能需要自行建立
- ⚠️ Bundle 大小需仔細優化

---

**文件版本**：2.0
**最後更新**：2025-10-11
**狀態**：已更新為 HackerNoon Pixel Icon Library，待審核
