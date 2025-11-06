# Requirements Document

## Introduction

本規格文件定義 Next.js 15 應用程式的全站模組載入優化計畫。目前全站載入 3142 個模組，首次編譯時間達 13.8 秒，對開發體驗與生產環境性能均造成顯著影響。

優化範圍涵蓋前端模組載入策略（tree-shaking、動態載入、code splitting）、後端 API 優化（快取、並行請求）、以及性能監控與使用者體驗改善。目標是通過分階段優化，逐步降低模組載入數量至 ~1800 個，並改善首次編譯與 HMR 重載速度。

## Requirements

### Requirement 1: Radix UI Tree-Shaking 優化

**Objective:** 作為開發者，我希望 Radix UI 套件採用按需載入策略，減少不必要的模組打包，從而降低 bundle size 並改善編譯速度。

#### Acceptance Criteria

1. WHEN 專案編譯時 THEN 模組載入系統 SHALL 僅載入實際使用的 Radix UI 元件
2. IF Radix UI 元件透過 barrel export (index.ts) 匯入 THEN 模組載入系統 SHALL 警告並建議改用直接路徑匯入
3. WHEN 開發者匯入 Radix UI 元件時 THEN 模組載入系統 SHALL 使用直接路徑匯入（例如 `@radix-ui/react-label` 而非 `@radix-ui/react`）
4. WHEN Radix UI 優化完成後 THEN 模組載入系統 SHALL 將相關模組數量從 5.0M 降低至按需載入（目標減少 30-40% 模組）
5. WHERE 在生產環境建置中 THE 模組載入系統 SHALL 確保 Radix UI 相關 bundle 經過 tree-shaking 優化

### Requirement 2: 重量級元件動態載入

**Objective:** 作為開發者，我希望非首屏關鍵路徑的重量級元件採用動態載入，延遲載入時機以減少初始 bundle size，從而改善頁面載入速度。

#### Acceptance Criteria

1. WHEN 使用者訪問頁面時 THEN 應用程式 SHALL 僅載入首屏渲染所需的關鍵元件
2. IF 元件為非首屏關鍵路徑（例如 MusicPlayerDrawer、CardDetailModal、ReadingDetailModal）THEN 應用程式 SHALL 使用 Next.js `dynamic()` 進行動態載入
3. WHEN 動態載入元件時 THEN 應用程式 SHALL 顯示適當的 loading fallback UI
4. WHERE 元件為使用者互動觸發（點擊、滑動等）THE 應用程式 SHALL 在互動發生時才載入該元件
5. WHEN 動態載入完成後 THEN 應用程式 SHALL 快取已載入元件避免重複載入
6. IF 動態載入失敗 THEN 應用程式 SHALL 顯示錯誤訊息並提供重試機制
7. WHEN 重量級元件動態載入優化完成後 THEN 模組載入系統 SHALL 減少首屏載入模組數量約 10-15%

### Requirement 3: 系統初始化元件條件式載入

**Objective:** 作為開發者，我希望系統初始化元件（7個）採用條件式載入邏輯，僅在特定路由或條件下載入，從而大幅降低非必要頁面的模組載入數量。

#### Acceptance Criteria

1. WHEN 應用程式啟動時 THEN 應用程式 SHALL 分析當前路由決定需要載入的初始化元件
2. IF 當前路由不需要特定初始化元件（例如公開頁面不需要 auth store 初始化）THEN 應用程式 SHALL 跳過該元件載入
3. WHERE 在受保護路由中 THE 應用程式 SHALL 載入認證相關初始化元件（authStore、ZustandAuthProvider）
4. WHERE 在需要音效的頁面中 THE 應用程式 SHALL 載入音效系統初始化元件
5. WHERE 在需要性能監控的頁面中 THE 應用程式 SHALL 載入 MetricsInitializer 元件
6. WHEN 條件式載入邏輯實作完成後 THEN 模組載入系統 SHALL 針對簡單頁面（如靜態資訊頁）減少模組載入數量約 30-40%
7. IF 初始化元件條件式載入失敗 THEN 應用程式 SHALL 回退至全部載入並記錄錯誤

### Requirement 4: Barrel Export 模式檢視與重構

**Objective:** 作為開發者，我希望識別並重構 barrel export (index.ts) 模式造成的過度載入問題，採用直接匯入路徑以改善 tree-shaking 效果。

#### Acceptance Criteria

1. WHEN 分析程式碼時 THEN 模組載入系統 SHALL 識別所有 barrel export 模式（index.ts 檔案）
2. IF barrel export 導致超過 100 個檔案匯入 THEN 模組載入系統 SHALL 標記為高優先級重構目標
3. WHEN 重構 barrel export 時 THEN 開發者 SHALL 改用直接匯入路徑（例如 `@/components/ui/button` 而非 `@/components/ui`）
4. WHERE 在元件匯入中 THE 應用程式 SHALL 避免使用 `export * from` 語法
5. WHEN barrel export 重構完成後 THEN 模組載入系統 SHALL 減少連鎖載入的模組數量
6. IF 直接匯入路徑過長（超過 5 層）THEN 模組載入系統 SHOULD 提供 TypeScript path alias 簡化路徑

### Requirement 5: 頁面特定 Layout 優化

**Objective:** 作為開發者，我希望不同頁面類型使用專屬的 layout 配置，避免所有頁面載入全域 layout 的所有依賴，從而針對性優化各頁面的模組載入。

#### Acceptance Criteria

1. WHEN 頁面渲染時 THEN 應用程式 SHALL 根據頁面類型載入對應的 layout
2. IF 頁面為公開頁面（首頁、關於我們、登入頁）THEN 應用程式 SHALL 使用簡化版 layout（不含 Dashboard 元件）
3. IF 頁面為受保護頁面（Dashboard、個人資料、牌卡閱讀）THEN 應用程式 SHALL 使用完整版 layout（含 Header、Footer、Navigation）
4. WHERE 在靜態資訊頁面中 THE 應用程式 SHALL 使用最小化 layout（僅含基本樣式與導航）
5. WHEN 頁面特定 layout 實作完成後 THEN 模組載入系統 SHALL 針對公開頁面減少模組載入數量約 20-30%
6. IF layout 切換失敗 THEN 應用程式 SHALL 回退至全域 layout 並記錄錯誤

### Requirement 6: Webpack/Next.js 建置優化

**Objective:** 作為開發者，我希望透過 webpack 與 Next.js 建置配置優化，啟用 cache、splitChunks、懶加載等機制，從而改善編譯速度與 bundle 產出品質。

#### Acceptance Criteria

1. WHEN Next.js 編譯時 THEN 建置系統 SHALL 啟用 webpack filesystem cache
2. IF 專案使用外部套件（node_modules）THEN 建置系統 SHALL 配置 splitChunks 將套件分離為獨立 chunk
3. WHEN 生產環境建置時 THEN 建置系統 SHALL 啟用 tree-shaking、minification、code splitting
4. WHERE 在開發環境中 THE 建置系統 SHALL 使用 Fast Refresh 與 incremental compilation
5. WHEN webpack cache 啟用後 THEN 建置系統 SHALL 將二次編譯時間降低 50% 以上
6. IF 建置配置變更 THEN 建置系統 SHALL 清除舊有 cache 避免不一致問題
7. WHEN splitChunks 配置完成後 THEN 建置系統 SHALL 確保共用套件（React、Radix UI 等）打包為獨立 chunk

### Requirement 7: 開發環境性能優化

**Objective:** 作為開發者，我希望開發環境具備快速的 HMR（Hot Module Replacement）與編譯速度，減少等待時間以提升開發效率。

#### Acceptance Criteria

1. WHEN 檔案變更時 THEN 開發伺服器 SHALL 在 500ms 內完成 HMR 更新
2. IF authStore 或其他 Zustand store 變更 THEN 開發伺服器 SHALL 避免完整頁面重載（僅更新變更模組）
3. WHEN 首次啟動開發伺服器時 THEN 開發伺服器 SHALL 在 10 秒內完成初始編譯（從當前 13.8 秒優化）
4. WHERE 在開發環境中 THE 開發伺服器 SHALL 使用 webpack cache 加速二次啟動
5. WHEN 模組載入優化完成後 THEN 開發伺服器 SHALL 將平均 HMR 時間降低至 300ms 以下
6. IF HMR 更新失敗 THEN 開發伺服器 SHALL 顯示錯誤訊息並提供完整重載選項

### Requirement 8: 生產環境 Bundle 優化

**Objective:** 作為開發者，我希望生產環境 bundle 經過最佳化，達成最小 bundle size、最佳 code splitting、以及高效快取策略，從而提升終端使用者的載入速度。

#### Acceptance Criteria

1. WHEN 生產建置時 THEN 建置系統 SHALL 產生經過 minification 與 compression 的 bundle
2. IF bundle size 超過 244KB (gzip) THEN 建置系統 SHALL 警告並提供優化建議
3. WHEN code splitting 執行時 THEN 建置系統 SHALL 將頁面特定程式碼分離為獨立 chunk
4. WHERE 在路由層級 THE 建置系統 SHALL 為每個路由產生獨立 bundle
5. WHEN bundle 優化完成後 THEN 建置系統 SHALL 確保首頁 bundle size 不超過 150KB (gzip)
6. IF 套件更新導致 bundle size 增加超過 10% THEN 建置系統 SHALL 發出警告
7. WHEN 靜態資源產生時 THEN 建置系統 SHALL 為 JavaScript、CSS 檔案產生 content hash 以支援長期快取

### Requirement 9: 性能監控與指標追蹤

**Objective:** 作為開發者，我希望建立完整的性能監控機制，追蹤模組載入數量、編譯時間、bundle size、以及執行時性能指標，從而量化優化效果並持續改善。

#### Acceptance Criteria

1. WHEN 建置完成時 THEN 性能監控系統 SHALL 記錄總模組載入數量
2. WHEN 建置完成時 THEN 性能監控系統 SHALL 記錄編譯時間（初次與二次）
3. WHEN 建置完成時 THEN 性能監控系統 SHALL 記錄各 bundle 的檔案大小（原始、gzip、brotli）
4. WHERE 在開發環境中 THE 性能監控系統 SHALL 記錄 HMR 更新時間
5. WHERE 在生產環境中 THE 性能監控系統 SHALL 追蹤頁面載入時間（FCP、LCP、TTI）
6. WHEN 性能指標收集完成後 THEN 性能監控系統 SHALL 產生性能報告（JSON 或 HTML 格式）
7. IF 性能指標劣化（模組數量增加、編譯時間變長）THEN 性能監控系統 SHALL 發出警告

### Requirement 10: 使用者體驗最佳化

**Objective:** 作為終端使用者，我希望在模組載入與優化過程中獲得良好的使用者體驗，包含適當的載入狀態、錯誤處理、以及無感知的效能提升。

#### Acceptance Criteria

1. WHEN 動態模組載入時 THEN 應用程式 SHALL 顯示 loading skeleton 或 spinner
2. IF 動態模組載入超過 3 秒 THEN 應用程式 SHALL 顯示進度提示
3. WHEN 動態模組載入失敗時 THEN 應用程式 SHALL 顯示友善錯誤訊息並提供重試按鈕
4. WHERE 在慢速網路環境下 THE 應用程式 SHALL 優先載入關鍵路徑模組
5. WHEN 頁面切換時 THEN 應用程式 SHALL 使用 loading 狀態避免白屏
6. IF 使用者在模組載入期間操作 THEN 應用程式 SHALL 緩存操作並在載入完成後執行
7. WHEN 模組載入優化完成後 THEN 應用程式 SHALL 確保使用者感知不到功能差異（僅感受速度提升）

### Requirement 11: 後端 API 並行請求優化

**Objective:** 作為開發者，我希望前端能夠並行發送多個 API 請求，避免序列化請求造成的延遲，從而縮短整體資料載入時間。

#### Acceptance Criteria

1. WHEN 頁面需要多個 API 資料時 THEN 前端 SHALL 使用 `Promise.all()` 或 `Promise.allSettled()` 並行請求
2. IF 任一 API 請求失敗 THEN 前端 SHALL 處理部分失敗情境（不阻塞其他請求結果）
3. WHEN 並行請求執行時 THEN 前端 SHALL 顯示統一的 loading 狀態
4. WHERE 在 Dashboard 頁面中 THE 前端 SHALL 並行載入使用者資料、閱讀歷史、牌卡資訊
5. WHEN 並行請求優化完成後 THEN 前端 SHALL 將 Dashboard 載入時間降低 30-50%
6. IF 所有並行請求均失敗 THEN 前端 SHALL 顯示整體錯誤訊息並提供重新載入選項

### Requirement 12: 後端 API 快取策略

**Objective:** 作為開發者，我希望後端 API 實作適當的快取機制，減少重複運算與資料庫查詢，從而降低 API 回應時間並減輕伺服器負載。

#### Acceptance Criteria

1. WHEN API 請求靜態資料（牌卡資訊、展開排列）時 THEN 後端 SHALL 使用記憶體快取（Redis）
2. IF 快取資料存在且未過期 THEN 後端 SHALL 直接回傳快取資料（不查詢資料庫）
3. WHEN 快取資料過期或不存在時 THEN 後端 SHALL 查詢資料庫並更新快取
4. WHERE 在讀取操作中 THE 後端 SHALL 設定適當的 Cache-Control headers（例如 `max-age=3600`）
5. WHEN 資料更新（新增、修改、刪除）時 THEN 後端 SHALL 清除相關快取
6. IF Redis 連線失敗 THEN 後端 SHALL 回退至直接資料庫查詢（不中斷服務）
7. WHEN 快取策略實作完成後 THEN 後端 SHALL 將靜態資料 API 回應時間降低至 50ms 以下

### Requirement 13: 階段性目標追蹤

**Objective:** 作為專案管理者，我希望明確追蹤各階段優化目標的達成情況，確保優化進度可視化且可量化。

#### Acceptance Criteria

1. WHEN Phase 1 完成時 THEN 模組載入系統 SHALL 將模組數量從 3142 降低至約 2900（Radix UI + 動態載入）
2. WHEN Phase 2 完成時 THEN 模組載入系統 SHALL 將模組數量從約 2900 降低至約 2200（初始化元件條件載入）
3. WHEN Phase 3 完成時 THEN 模組載入系統 SHALL 將模組數量從約 2200 降低至約 1800（頁面特定 layout）
4. WHEN Phase 4 完成時 THEN 模組載入系統 SHALL 建立條件式載入架構以持續優化
5. WHERE 在每個 Phase 結束時 THE 專案管理者 SHALL 產生性能報告比較優化前後差異
6. IF 任一 Phase 未達成目標 THEN 專案管理者 SHALL 分析原因並調整後續階段策略

### Requirement 14: 向後相容性與穩定性

**Objective:** 作為開發者，我希望模組載入優化不影響現有功能運作，確保所有頁面與功能在優化後仍正常工作。

#### Acceptance Criteria

1. WHEN 優化實施時 THEN 應用程式 SHALL 確保所有現有功能正常運作
2. IF 優化導致功能異常 THEN 開發者 SHALL 回退變更並重新評估優化策略
3. WHEN 動態載入實作時 THEN 應用程式 SHALL 在所有支援的瀏覽器中正常載入模組
4. WHERE 在測試環境中 THE 應用程式 SHALL 通過所有現有 E2E 測試與單元測試
5. WHEN 優化完成後 THEN 應用程式 SHALL 維持 99.9% 的功能覆蓋率
6. IF 使用者回報載入問題 THEN 開發者 SHALL 提供降級機制（回退至完整載入）

### Requirement 15: 文件與知識傳承

**Objective:** 作為開發團隊成員，我希望優化過程與最佳實踐被完整記錄，方便未來維護與新成員學習。

#### Acceptance Criteria

1. WHEN 優化策略實施時 THEN 開發者 SHALL 記錄優化方法、原因、以及效果
2. WHEN 新的 barrel export 重構完成時 THEN 開發者 SHALL 更新 import 指南文件
3. WHEN 動態載入模式建立時 THEN 開發者 SHALL 提供程式碼範例與使用指南
4. WHERE 在 CLAUDE.md 或專案文件中 THE 開發者 SHALL 更新模組載入最佳實踐
5. WHEN 優化完成後 THEN 開發者 SHALL 產生優化前後對比報告（模組數量、編譯時間、bundle size）
6. IF 未來新增功能 THEN 開發者 SHALL 參考優化指南避免引入過度載入問題
