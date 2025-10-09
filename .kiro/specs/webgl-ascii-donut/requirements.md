# WebGL ASCII Donut Loading - 需求文件

## 專案描述（輸入）

基於現有的 Canvas 2D ASCII Donut Loading 實作，開發 WebGL 優化版本以解決手機端效能問題。目前實作在桌面達到 24 FPS 目標，但在手機僅有 1.3 FPS，需要利用 GPU 加速提升效能。

### 現有實作分析

**效能現況**：
- 桌面：24 FPS（達標）
- 手機：1.3 FPS（嚴重不足）
- 已實作自動降級機制（FPS < 15 切換靜態模式）

**核心技術**：
- 3D 數學計算：環面參數方程式、旋轉矩陣、透視投影
- Canvas 2D 渲染：使用 `<pre>` 元素更新 textContent
- 效能優化：三角函數快取、幀跳過機制、FPS 監控

**架構檔案**：
1. `src/lib/donutRenderer.ts` - 3D 渲染引擎（240 行）
2. `src/lib/donutConfig.ts` - 配置管理（115 行）
3. `src/components/loading/AsciiDonutLoading.tsx` - React 組件（222 行）

### 技術挑戰

1. **ASCII 字元在 GPU 上的渲染**：WebGL 本質上渲染像素，而非字元
2. **等寬字體美感保持**：需要在 Fragment Shader 中實現字元映射
3. **API 相容性維持**：必須與現有 Canvas 2D 版本 API 相容
4. **降級策略設計**：WebGL → Canvas 2D → Static 三級降級

## 簡介

為了解決手機端 ASCII Donut Loading 動畫的效能瓶頸（1.3 FPS），我們需要開發一個 WebGL 優化版本，利用 GPU 平行計算能力來執行 3D 數學運算和 ASCII 字元映射。這個優化版本將保持與現有 Canvas 2D 版本完全相容的 API，並實作完整的降級機制，確保在不支援 WebGL 的環境中仍能正常運作。

## 業務目標

### 主要目標
- **效能提升**：手機端 FPS 從 1.3 提升到 30+，桌面從 24 提升到 60
- **使用者體驗**：消除手機端動畫卡頓，提供流暢的載入體驗
- **技術創新**：展示在 GPU 上實現 ASCII 藝術渲染的技術實力

### 次要目標
- **電池友善**：利用 GPU 硬體加速降低 CPU 負擔，延長行動裝置電池壽命
- **可維護性**：保持程式碼清晰，便於未來擴展其他 WebGL 動畫效果
- **向後相容**：100% 保持與現有 API 的相容性

## 需求

### 需求 1：WebGL 技術可行性驗證
**目標**：作為技術架構師，我需要驗證 WebGL 是否適合 ASCII 藝術渲染，以便確定技術方向

#### 驗收標準
1. WHEN 分析 WebGL 渲染流程 THEN 系統 SHALL 確認 Fragment Shader 可以實現 ASCII 字元映射邏輯
2. WHEN 評估 GPU 計算能力 THEN 系統 SHALL 確認 Vertex Shader 可以處理環面參數方程式和旋轉矩陣
3. WHEN 比較 Canvas 2D vs WebGL THEN 系統 SHALL 提供效能差異預估（至少 10x 手機端提升）
4. WHEN 考量技術風險 THEN 系統 SHALL 識別潛在問題（例如：字元紋理產生、深度測試、瀏覽器支援度）
5. WHERE 需要降級支援 THE 系統 SHALL 設計 WebGL 偵測機制，不支援時回退到 Canvas 2D

### 需求 2：GPU 加速 3D 數學計算
**目標**：作為效能工程師，我需要將 3D 數學計算移至 GPU，以便釋放 CPU 資源並提升效能

#### 驗收標準
1. WHEN 計算環面表面點 THEN Vertex Shader SHALL 使用 GPU 並行計算所有頂點的 3D 座標
2. WHEN 應用旋轉矩陣 THEN Vertex Shader SHALL 在 GPU 上執行矩陣乘法運算
3. WHEN 執行透視投影 THEN Vertex Shader SHALL 將 3D 座標轉換為螢幕空間座標
4. WHERE 需要深度測試 THE WebGL SHALL 使用內建 depth buffer（取代 CPU 的 z-buffer）
5. WHEN 比較 CPU vs GPU 計算 THEN GPU 版本 SHALL 在手機上達到至少 10x 的效能提升

### 需求 3：Fragment Shader ASCII 字元映射
**目標**：作為圖形工程師，我需要在 Fragment Shader 中實現 ASCII 字元映射，以便在 GPU 上生成 ASCII 藝術

#### 驗收標準
1. WHEN 計算表面亮度 THEN Fragment Shader SHALL 使用法向量與光源的點積計算 Lambertian 反射
2. WHEN 映射亮度到字元 THEN Fragment Shader SHALL 將亮度值映射到 ASCII 字元集 ".,-~:;=!*#$@"
3. WHEN 渲染 ASCII 字元 THEN Fragment Shader SHALL 使用字元紋理圖集（texture atlas）渲染對應字元
4. WHERE 保持等寬字體美感 THE Fragment Shader SHALL 確保所有字元在螢幕上佔據相同寬度和高度
5. WHEN 顯示最終結果 THEN WebGL 輸出 SHALL 視覺上與 Canvas 2D 版本一致（字元、顏色、間距）

### 需求 4：API 相容性與漸進式遷移
**目標**：作為開發者，我需要保持與現有 Canvas 2D 版本的 API 相容性，以便無縫替換而不破壞現有功能

#### 驗收標準
1. WHEN 呼叫 WebGL 版本 THEN 組件 SHALL 接受與 Canvas 2D 版本相同的 props（message, forceFallback, config）
2. WHEN 傳入配置參數 THEN WebGL 版本 SHALL 支援所有 DonutRendererConfig 參數（width, height, R1, R2, K1, K2, thetaSpacing, phiSpacing, luminanceChars）
3. WHERE 實作渲染器介面 THE WebGLDonutRenderer SHALL 實作與 DonutRenderer 相同的 render() 和 dispose() 方法
4. WHEN 切換渲染器 THEN 系統 SHALL 提供 Feature Flag 機制（環境變數或 prop）選擇使用 Canvas 2D 或 WebGL
5. WHERE 保持向後相容 THE 系統 SHALL 確保移除 WebGL 版本時，Canvas 2D 版本仍可正常運作

### 需求 5：三級降級策略（WebGL → Canvas 2D → Static）
**目標**：作為使用者，我希望在任何裝置上都能看到載入動畫（即使效能受限），以便獲得一致的體驗

#### 驗收標準
1. WHEN 偵測瀏覽器環境 THEN 系統 SHALL 檢查 WebGL 支援度（canvas.getContext('webgl') 或 'webgl2'）
2. IF WebGL 不支援 THEN 系統 SHALL 自動降級到 Canvas 2D 版本
3. WHEN WebGL 版本效能不足（FPS < 20） THEN 系統 SHALL 降級到 Canvas 2D 版本
4. WHEN Canvas 2D 版本效能不足（FPS < 15） THEN 系統 SHALL 降級到靜態 ASCII 圖案
5. WHERE 使用者偏好 THE 系統 SHALL 在 prefers-reduced-motion 時跳過 WebGL 和 Canvas 2D，直接顯示靜態圖案
6. WHEN 降級發生 THEN 系統 SHALL 記錄降級原因（console.warn）以便偵錯

### 需求 6：效能目標與監控
**目標**：作為產品經理，我需要明確的效能指標，以便驗證 WebGL 優化的成效

#### 驗收標準
1. WHEN 在桌面執行 THEN WebGL 版本 SHALL 達到 60 FPS（現有 Canvas 2D：24 FPS）
2. WHEN 在手機執行 THEN WebGL 版本 SHALL 達到 30+ FPS（現有 Canvas 2D：1.3 FPS）
3. WHERE 記憶體限制 THE WebGL 版本 SHALL 使用 < 10 MB 記憶體（包含紋理和 buffer）
4. WHEN 監控 GPU 負擔 THEN 系統 SHALL 確保 GPU 使用率 < 40%（避免影響其他渲染）
5. WHERE 效能偵測 THE 系統 SHALL 提供即時 FPS 顯示（開發模式）
6. WHEN 記錄效能指標 THEN 系統 SHALL 支援 Performance API 監控（初始化時間、幀率、GPU 記憶體）

### 需求 7：字元紋理圖集產生
**目標**：作為圖形工程師，我需要生成 ASCII 字元的紋理圖集，以便 Fragment Shader 能夠渲染字元

#### 驗收標準
1. WHEN 初始化 WebGL 渲染器 THEN 系統 SHALL 動態生成包含所有 ASCII 字元的紋理圖集
2. WHEN 生成字元紋理 THEN 系統 SHALL 使用等寬字體（font-mono）和 Pip-Boy 綠色（--color-pip-boy-green）
3. WHERE 紋理佈局 THE 字元圖集 SHALL 以網格方式排列（例如：12 個字元 × 1 行）
4. WHEN 在 Shader 中使用 THEN Fragment Shader SHALL 根據亮度值計算正確的紋理座標（UV mapping）
5. WHERE 紋理品質 THE 紋理圖集 SHALL 使用適當的解析度（每個字元至少 16x16 像素）以確保清晰度
6. WHEN 釋放資源 THEN 系統 SHALL 在 dispose() 時刪除 WebGL 紋理（gl.deleteTexture()）

### 需求 8：Shader 程式設計與編譯
**目標**：作為 WebGL 工程師，我需要撰寫和編譯 Vertex/Fragment Shaders，以便實現 GPU 加速渲染

#### 驗收標準
1. WHEN 撰寫 Vertex Shader THEN Shader SHALL 包含環面參數方程式、旋轉矩陣和透視投影邏輯
2. WHEN 撰寫 Fragment Shader THEN Shader SHALL 包含光照計算和 ASCII 字元紋理映射邏輯
3. WHERE Shader 編譯 THE 系統 SHALL 檢查編譯錯誤並提供清晰的錯誤訊息
4. WHEN Shader 連結 THEN 系統 SHALL 驗證 program 連結成功並取得 uniform/attribute 位置
5. WHERE 除錯支援 THE 系統 SHALL 提供 Shader 原始碼輸出（開發模式）以便除錯
6. WHEN Shader 執行失敗 THEN 系統 SHALL 降級到 Canvas 2D 版本

### 需求 9：WebGL Context 管理與資源清理
**目標**：作為系統工程師，我需要正確管理 WebGL context 和資源，以便避免記憶體洩漏

#### 驗收標準
1. WHEN 初始化 WebGL THEN 系統 SHALL 建立 WebGL context（優先使用 webgl2，回退到 webgl）
2. WHEN 建立 buffers THEN 系統 SHALL 建立 vertex buffer（頂點座標）和 index buffer（索引）
3. WHERE 資源管理 THE 系統 SHALL 追蹤所有建立的 WebGL 資源（buffers, textures, programs）
4. WHEN 組件卸載 THEN 系統 SHALL 呼叫 dispose() 刪除所有 WebGL 資源
5. WHERE context 遺失 THE 系統 SHALL 監聽 webglcontextlost 事件並降級到 Canvas 2D
6. WHEN context 恢復 THEN 系統 SHALL 監聽 webglcontextrestored 事件並嘗試重新初始化 WebGL

### 需求 10：開發體驗與偵錯工具
**目標**：作為開發者，我需要良好的偵錯工具，以便快速定位和解決問題

#### 驗收標準
1. WHEN 在開發模式 THEN 系統 SHALL 顯示詳細的效能指標（FPS, GPU 記憶體, 渲染器類型）
2. WHERE Shader 錯誤 THE 系統 SHALL 輸出清晰的錯誤訊息（包含行號和錯誤類型）
3. WHEN 使用 Feature Flag THEN 系統 SHALL 支援 ?renderer=webgl|canvas|static URL 參數強制使用特定渲染器
4. WHERE 視覺化偵錯 THE 系統 MAY 提供線框模式（wireframe mode）顯示環面幾何結構
5. WHEN 監控降級 THEN 系統 SHALL 記錄降級事件（timestamp, reason, 渲染器切換）
6. WHERE 測試支援 THE 系統 SHALL 允許在測試環境中 mock WebGL context

## 非功能需求

### 效能需求
- **桌面目標 FPS**：60 FPS（現有：24 FPS，提升 2.5x）
- **手機目標 FPS**：30+ FPS（現有：1.3 FPS，提升 20x+）
- **初始化時間**：< 150ms（包含紋理生成）
- **記憶體使用**：< 10 MB（包含 WebGL buffers 和紋理）
- **GPU 使用率**：< 40%（避免影響其他渲染）
- **CPU 使用率**：< 10%（主要計算已移至 GPU）

### 瀏覽器支援
- **WebGL 1.0**：Chrome 9+, Firefox 4+, Safari 5.1+, Edge 12+
- **WebGL 2.0**：Chrome 56+, Firefox 51+, Safari 15+（優先使用）
- **回退支援**：所有瀏覽器（透過 Canvas 2D 降級）
- **行動瀏覽器**：iOS Safari 8+, Chrome Mobile 25+

### 相容性需求
- **API 相容性**：100% 與 Canvas 2D 版本相容
- **降級相容性**：WebGL → Canvas 2D → Static 無縫切換
- **配置相容性**：支援所有現有 DonutRendererConfig 參數

### 無障礙需求
- 保持與 Canvas 2D 版本相同的 ARIA 標籤
- 支援 prefers-reduced-motion（跳過 WebGL，直接靜態模式）
- 確保 WebGL canvas 有適當的 aria-label

### 安全考量
- **Shader 注入防護**：不接受外部 Shader 程式碼
- **資源限制**：限制紋理大小（最大 2048x2048）避免記憶體耗盡
- **Context 隔離**：確保 WebGL context 不影響其他頁面元素

### 技術債務考量
- 程式碼應模組化，便於未來擴展其他 WebGL 動畫效果
- Shader 程式碼應可重用（例如：獨立的光照計算函數）
- 保持與現有架構的一致性（TypeScript, React hooks, 配置管理）

## 成功標準

### 量化指標
1. **手機 FPS 提升 20x**：從 1.3 FPS 提升到 30+ FPS
2. **桌面 FPS 提升 2.5x**：從 24 FPS 提升到 60 FPS
3. **零破壞性變更**：100% API 相容性，現有程式碼無需修改
4. **95%+ 瀏覽器支援**：透過降級機制支援幾乎所有瀏覽器

### 質化指標
1. **使用者體驗**：手機端動畫流暢，無明顯卡頓
2. **開發體驗**：清晰的錯誤訊息，良好的偵錯工具
3. **可維護性**：程式碼清晰，文件完整，易於擴展

## 風險與緩解

### 技術風險
1. **WebGL 字元渲染複雜度高**
   - 緩解：先開發 PoC 驗證可行性
2. **跨瀏覽器 WebGL 相容性問題**
   - 緩解：完整的降級策略，Canvas 2D 作為後備
3. **Shader 偵錯困難**
   - 緩解：提供詳細錯誤訊息和開發模式偵錯工具

### 業務風險
1. **開發時程延誤**
   - 緩解：分階段實作（PoC → 核心功能 → 優化 → 整合）
2. **效能提升未達預期**
   - 緩解：保留 Canvas 2D 版本，可隨時回退

### 使用者風險
1. **舊裝置不支援 WebGL**
   - 緩解：三級降級策略確保所有裝置可用
