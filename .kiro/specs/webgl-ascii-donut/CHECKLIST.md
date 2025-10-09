# WebGL ASCII Donut Loading - 開發檢查清單

## Phase 1: 概念驗證（PoC）（2-3 天）

### 任務 1.1: 建立 WebGL 基礎結構（4 小時）
- [ ] 建立 `src/lib/webgl/` 目錄
- [ ] 建立 `src/lib/webgl/webglUtils.ts`
- [ ] 實作 `createWebGLContext()` 函數（支援 WebGL 2.0 和 WebGL 1.0）
- [ ] 實作基本的 shader 編譯函數
- [ ] 測試：成功建立 WebGL context
- [ ] 測試：錯誤處理正確（返回 null 並記錄錯誤）

### 任務 1.2: 實作字元紋理圖集生成（4 小時）
- [ ] 建立 `src/lib/webgl/textureAtlas.ts`
- [ ] 實作 `generateCharacterAtlas()` 函數
- [ ] 使用 Canvas 2D API 繪製 ASCII 字元（".,-~:;=!*#$@"）
- [ ] 實作 `uploadTextureToGPU()` 函數
- [ ] 測試：紋理尺寸正確（charWidth * charCount x charHeight）
- [ ] 測試：字元顏色為 Pip-Boy 綠色
- [ ] 測試：紋理成功上傳到 GPU

### 任務 1.3: 撰寫簡單的 Shader（PoC）（4 小時）
- [ ] 建立 `src/lib/webgl/shaders.ts`
- [ ] 撰寫簡單的 Vertex Shader（固定位置）
- [ ] 撰寫簡單的 Fragment Shader（紋理映射）
- [ ] 實作 `compileShader()` 函數
- [ ] 實作 `linkProgram()` 函數
- [ ] 測試：Vertex Shader 編譯成功
- [ ] 測試：Fragment Shader 編譯成功
- [ ] 測試：Program 連結成功

### 任務 1.4: PoC Demo - 渲染單一字元（4 小時）
- [ ] 建立 `src/lib/webgl/poc.ts`（臨時檔案）
- [ ] 整合 context 建立、紋理生成、shader 編譯
- [ ] 渲染單一 point primitive 顯示字元 "@"
- [ ] 驗證視覺效果
- [ ] 測試：成功在 WebGL canvas 顯示字元 "@"
- [ ] 測試：字元顏色為 Pip-Boy 綠色
- [ ] 測試：字元清晰可辨識（無模糊或失真）

**Phase 1 驗收標準**：
- [ ] PoC 成功渲染字元 "@"
- [ ] 視覺效果良好（清晰、顏色正確）
- [ ] 決定是否繼續 Phase 2（若失敗，重新評估技術方案）

---

## Phase 2: 核心實作（4-5 天）

### 任務 2.1: 實作完整的 Vertex Shader（6 小時）
- [ ] 撰寫 WebGL 2.0 版本的 Vertex Shader（GLSL ES 3.00）
- [ ] 撰寫 WebGL 1.0 版本的 Vertex Shader（GLSL ES 1.00）
- [ ] 實作環面參數方程式（torus parametric equations）
- [ ] 實作雙軸旋轉矩陣（X 軸和 Z 軸）
- [ ] 實作透視投影
- [ ] 實作光照計算（Lambertian reflectance）
- [ ] 測試：Vertex Shader 正確計算 3D 座標
- [ ] 測試：旋轉矩陣正確應用（視覺驗證）
- [ ] 測試：透視投影正確（視覺驗證）
- [ ] 測試：光照計算正確（視覺驗證）

### 任務 2.2: 實作完整的 Fragment Shader（4 小時）
- [ ] 撰寫 WebGL 2.0 版本的 Fragment Shader（GLSL ES 3.00）
- [ ] 撰寫 WebGL 1.0 版本的 Fragment Shader（GLSL ES 1.00）
- [ ] 實作亮度到字元索引的映射
- [ ] 實作紋理座標計算（UV mapping）
- [ ] 實作紋理採樣
- [ ] 測試：正確根據亮度選擇字元
- [ ] 測試：紋理座標計算正確
- [ ] 測試：字元渲染清晰（無模糊或錯位）

### 任務 2.3: 實作 WebGLDonutRenderer 類別（8 小時）
- [ ] 建立 `src/lib/webgl/WebGLDonutRenderer.ts`
- [ ] 實作 constructor（初始化 WebGL, buffers, texture, shaders）
- [ ] 實作 `render(angleA, angleB)` 方法
- [ ] 實作 `dispose()` 方法
- [ ] 實作 `getType()` 方法
- [ ] 實作 WebGL context lost 事件處理
- [ ] 實作 WebGL context restored 事件處理
- [ ] 測試：成功初始化所有 WebGL 資源
- [ ] 測試：render() 方法正確更新 uniforms 並渲染
- [ ] 測試：dispose() 方法正確清理所有 WebGL 資源
- [ ] 測試：context lost 事件觸發降級

### 任務 2.4: 單元測試 - WebGL 模組（6 小時）
- [ ] 建立 `src/lib/webgl/__tests__/textureAtlas.test.ts`
- [ ] 建立 `src/lib/webgl/__tests__/shaders.test.ts`
- [ ] 建立 `src/lib/webgl/__tests__/WebGLDonutRenderer.test.ts`
- [ ] 撰寫紋理生成測試
- [ ] 撰寫 shader 編譯測試
- [ ] 撰寫渲染器整合測試
- [ ] 測試：所有單元測試通過
- [ ] 測試：測試覆蓋率 > 80%

**Phase 2 驗收標準**：
- [ ] 所有單元測試通過
- [ ] Vertex/Fragment Shader 正確運作
- [ ] WebGLDonutRenderer 成功渲染完整的 donut

---

## Phase 3: 整合與降級策略（2-3 天）

### 任務 3.1: 定義統一渲染器介面（3 小時）
- [ ] 建立 `src/lib/webgl/types.ts`
- [ ] 定義 `IDonutRenderer` 介面
- [ ] 定義 `RendererType` 枚舉
- [ ] 更新 `DonutRenderer` 實作 `IDonutRenderer`
- [ ] 更新 `WebGLDonutRenderer` 實作 `IDonutRenderer`
- [ ] 測試：IDonutRenderer 介面定義清晰
- [ ] 測試：Canvas 2D 和 WebGL 渲染器都實作此介面
- [ ] 測試：TypeScript 編譯無錯誤

### 任務 3.2: 實作渲染器工廠（4 小時）
- [ ] 建立 `src/lib/rendererFactory.ts`
- [ ] 實作 `createDonutRenderer()` 函數
- [ ] 實作 WebGL 支援度偵測
- [ ] 實作降級邏輯（WebGL 2.0 → WebGL 1.0 → Canvas 2D → Static）
- [ ] 實作 prefers-reduced-motion 偵測
- [ ] 實作 `monitorPerformanceAndDegrade()` 函數
- [ ] 測試：自動偵測並選擇最佳渲染器
- [ ] 測試：支援手動指定渲染器類型（測試用）
- [ ] 測試：prefers-reduced-motion 直接回退到 Static

### 任務 3.3: 修改 AsciiDonutLoading 組件（6 小時）
- [ ] 修改 `src/components/loading/AsciiDonutLoading.tsx`
- [ ] 使用 `createDonutRenderer()` 建立渲染器
- [ ] 實作 FPS 監控觸發降級
- [ ] 實作 WebGL canvas 渲染（與 Canvas 2D 的 `<pre>` 元素不同）
- [ ] 支援 URL 參數強制使用特定渲染器（?renderer=webgl|canvas|static）
- [ ] 開發模式顯示當前渲染器類型和 FPS
- [ ] 測試：成功使用 WebGL 渲染器（當支援時）
- [ ] 測試：自動降級邏輯正常運作
- [ ] 測試：URL 參數正常運作

### 任務 3.4: 單元測試 - RendererFactory（4 小時）
- [ ] 建立 `src/lib/__tests__/rendererFactory.test.ts`
- [ ] 測試自動渲染器選擇
- [ ] 測試降級邏輯
- [ ] 測試 prefers-reduced-motion
- [ ] 測試：所有測試通過
- [ ] 測試：覆蓋所有降級情境

**Phase 3 驗收標準**：
- [ ] 渲染器工廠正常運作
- [ ] 降級邏輯完整實作
- [ ] 整合測試通過

---

## Phase 4: 效能優化與測試（2-3 天）

### 任務 4.1: 效能測試 - 桌面（3 小時）
- [ ] 在 Chrome DevTools 中錄製 Performance Profile
- [ ] 測量 FPS
- [ ] 分析 GPU 使用率
- [ ] 分析記憶體使用
- [ ] 撰寫效能測試報告
- [ ] 測試：桌面 FPS ≥ 60
- [ ] 測試：GPU 使用率 < 40%
- [ ] 測試：記憶體使用 < 10 MB

### 任務 4.2: 效能測試 - 手機（4 小時）
- [ ] 在實際手機上測試（至少 3 台不同機型）
- [ ] 測量 FPS
- [ ] 測試降級策略是否正常運作
- [ ] 撰寫手機效能測試報告
- [ ] 測試：手機 FPS ≥ 30（中階手機）
- [ ] 測試：手機 FPS ≥ 20（低階手機，觸發降級）
- [ ] 測試：降級策略正常運作

### 任務 4.3: E2E 測試 - 視覺回歸（5 小時）
- [ ] 建立 `tests/e2e/webgl-ascii-donut.spec.ts`
- [ ] 撰寫截圖比對測試
- [ ] 撰寫 FPS 監控測試
- [ ] 撰寫降級測試
- [ ] 測試：視覺回歸測試通過（至少 3 個不同角度的截圖）
- [ ] 測試：FPS 測試通過
- [ ] 測試：降級測試通過

### 任務 4.4: 跨瀏覽器測試（3 小時）
- [ ] 在 Chrome 測試
- [ ] 在 Firefox 測試
- [ ] 在 Safari 測試
- [ ] 記錄任何相容性問題
- [ ] 撰寫跨瀏覽器測試報告
- [ ] 測試：Chrome 正常運作
- [ ] 測試：Firefox 正常運作
- [ ] 測試：Safari 正常運作
- [ ] 測試：所有瀏覽器效能達標或正確降級

### 任務 4.5: Shader 優化（4 小時，若需要）
- [ ] 分析 Shader 效能瓶頸
- [ ] 使用向量運算取代標量運算
- [ ] 減少不必要的計算
- [ ] 重新測試效能
- [ ] 測試：效能提升至少 10%
- [ ] 測試：視覺效果不變

**Phase 4 驗收標準**：
- [ ] 桌面達到 60 FPS
- [ ] 手機達到 30+ FPS
- [ ] 所有 E2E 測試通過
- [ ] 跨瀏覽器測試通過

---

## Phase 5: 文件與發布（1 天）

### 任務 5.1: 撰寫技術文件（4 小時）
- [ ] 更新 README.md
- [ ] 撰寫 WebGL 實作說明（docs/webgl-implementation.md）
- [ ] 撰寫效能優化指南（docs/performance-guide.md）
- [ ] 撰寫除錯指南
- [ ] 測試：文件清晰易懂
- [ ] 測試：包含程式碼範例
- [ ] 測試：包含效能數據

### 任務 5.2: Code Review 準備（2 小時）
- [ ] 清理臨時檔案（poc.ts）
- [ ] 確保所有測試通過
- [ ] 執行 lint 和格式化
- [ ] 撰寫詳細的 PR 描述
- [ ] 測試：所有測試通過
- [ ] 測試：Lint 無錯誤
- [ ] 測試：PR 描述清晰

### 任務 5.3: 建立 Feature Flag 機制（2 小時）
- [ ] 新增環境變數 `NEXT_PUBLIC_DEFAULT_RENDERER`
- [ ] 更新 RendererFactory 讀取環境變數
- [ ] 更新 `.env.example`
- [ ] 更新文件說明如何使用 Feature Flag
- [ ] 測試：環境變數正常運作
- [ ] 測試：可強制使用特定渲染器

### 任務 5.4: 發布與監控（4 小時）
- [ ] 合併 PR
- [ ] 部署到 staging 環境
- [ ] 驗證 staging 環境
- [ ] 部署到 production 環境
- [ ] 監控效能指標和錯誤率
- [ ] 測試：Production 部署成功
- [ ] 測試：無重大錯誤
- [ ] 測試：效能指標達標

**Phase 5 驗收標準**：
- [ ] 技術文件完整
- [ ] Code Review 通過
- [ ] PR 合併到 main
- [ ] Production 上線成功

---

## 最終驗收

### 功能驗收
- [ ] WebGL 版本成功渲染 ASCII donut
- [ ] 視覺效果與 Canvas 2D 版本一致
- [ ] 三級降級策略正常運作（WebGL → Canvas 2D → Static）
- [ ] API 100% 與現有版本相容

### 效能驗收
- [ ] 桌面 FPS ≥ 60（提升 2.5x）
- [ ] 手機 FPS ≥ 30（提升 20x+）
- [ ] 記憶體使用 < 10 MB
- [ ] GPU 使用率 < 40%

### 品質驗收
- [ ] 所有單元測試通過
- [ ] 所有 E2E 測試通過
- [ ] 跨瀏覽器測試通過
- [ ] Code Review 通過

### 文件驗收
- [ ] 技術文件完整
- [ ] 效能數據記錄
- [ ] 除錯指南清晰
- [ ] README.md 更新

---

## 時程追蹤

| 階段 | 預估時間 | 實際時間 | 狀態 |
|------|---------|---------|------|
| Phase 1: PoC | 2-3 天 | ___ | ⬜ Not Started |
| Phase 2: 核心實作 | 4-5 天 | ___ | ⬜ Not Started |
| Phase 3: 整合 | 2-3 天 | ___ | ⬜ Not Started |
| Phase 4: 優化測試 | 2-3 天 | ___ | ⬜ Not Started |
| Phase 5: 發布 | 1 天 | ___ | ⬜ Not Started |
| **總計** | **11-15 天** | ___ | ⬜ Not Started |

---

## 問題與阻礙追蹤

| 日期 | 問題描述 | 影響 | 解決方案 | 狀態 |
|------|---------|------|---------|------|
| ___ | ___ | ___ | ___ | ___ |

---

## 決策記錄

| 日期 | 決策內容 | 理由 | 影響 |
|------|---------|------|------|
| ___ | ___ | ___ | ___ |

---

**檢查清單狀態**：⬜ 未開始
**最後更新**：2025-10-09
