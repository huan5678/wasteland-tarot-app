# WebGL ASCII Donut 渲染器測試報告

**測試日期**: 2025-10-09
**測試環境**: Desktop Chrome (WSL2)
**測試目的**: 驗證三種 ASCII Donut 渲染器的效能和正確性

---

## 執行摘要

我們測試了三種不同的 ASCII Donut 渲染器實作：
1. **Canvas 2D** - CPU-based 傳統渲染
2. **WebGL Point** - GPU-accelerated point rendering (Phase 1 PoC)
3. **WebGL Quad** - GPU-accelerated quad rendering with instancing

### 測試結果總覽

| 渲染器 | 實測 FPS | 相對效能 | 狀態 | 推薦度 |
|--------|----------|----------|------|--------|
| Canvas 2D | 22.4 | 1.0x (基準) | ✅ 正常 | ⭐⭐⭐ |
| WebGL Point | 60.0 | 2.68x | ✅ 優秀 | ⭐⭐⭐⭐⭐ |
| WebGL Quad | 0.6 | 0.027x | ❌ 失敗 | ⚠️ 不推薦 |

### 關鍵發現

1. **✅ WebGL Point 成功** - 達到 60 FPS，證明 GPU 加速可行
2. **❌ WebGL Quad 架構錯誤** - 渲染了 28,350 個 quads 而非 1,920 個
3. **✅ Canvas 2D 穩定** - 22.4 FPS 接近理論值 24 FPS

---

## 詳細測試結果

### 1. Canvas 2D 渲染器

**測試頁面**: `/test-donut`
**實作檔案**: `src/lib/donutRenderer.ts`

#### 測試結果

- **FPS**: 22.4
- **視覺效果**: ✅ ASCII donut 正常旋轉
- **顏色**: ✅ Pip-Boy green (#00ff00)
- **動畫流暢度**: ✅ 流暢
- **錯誤**: 無

#### 效能分析

```
目標 FPS: 24
實測 FPS: 22.4
達成率: 93.3%
```

**效能瓶頸**:
- CPU 計算 torus 表面法線
- Canvas 2D `fillText()` 呼叫次數：80 × 24 = 1,920 次/frame
- 記憶體分配：每 frame 建立新的 string array

**結論**: 效能符合預期，適合作為 fallback 選項。

---

### 2. WebGL Point 渲染器 (Phase 1 PoC)

**測試頁面**: `/test-webgl-donut`
**實作檔案**: `src/app/test-webgl-donut/page.tsx`, `src/lib/webgl/shaders.ts`

#### 測試結果

- **FPS**: 60.0
- **視覺效果**: ✅ 3D 綠色 torus 正常旋轉
- **渲染方式**: `gl.POINTS` (每個 pixel 一個 point)
- **WebGL 版本**: WebGL 2.0
- **錯誤**: 無（修復後）

#### 發現的問題與修復

**問題**: 初始測試時 canvas 完全黑色

**根本原因**: 未傳遞 `u_canvasSize` uniform 給 shader，導致 clip space 計算錯誤

**修復方法**:
```typescript
// 添加 uniform 宣告
const u_canvasSize = getUniformLocation(gl, program, 'u_canvasSize');

// 設定 canvas size
gl.uniform2f(u_canvasSize, canvas.width, canvas.height);
```

**修復後**: 3D torus 正確顯示，60 FPS 穩定

#### 效能分析

```
目標 FPS: 60
實測 FPS: 60.0
達成率: 100%
相對於 Canvas 2D: 2.68x 提升
```

**優點**:
- ✅ GPU 並行計算 torus geometry
- ✅ Vertex shader 處理 3D 投影
- ✅ 單一 `gl.drawArrays()` 呼叫
- ✅ 無 CPU-GPU 同步（無 `readPixels`）

**缺點**:
- ⚠️ 不顯示真實 ASCII 字元（只是綠色像素點）
- ⚠️ 字元細節不可見

**結論**: 效能優秀，視覺效果良好，適合 Loading 動畫使用。

---

### 3. WebGL Quad 渲染器 (Phase 2)

**測試頁面**: `/test-quad-donut`
**實作檔案**: `src/lib/webgl/WebGLQuadDonutRenderer.ts`, `src/lib/webgl/quadShaders.ts`

#### 測試結果

- **FPS**: 0.6 ⚠️
- **視覺效果**: ⚠️ 部分可見（右側 canvas），左側 canvas 黑色
- **渲染方式**: `gl.drawElementsInstanced()` (28,350 instances)
- **WebGL 版本**: WebGL 2.0 (instanced rendering)
- **Long task 警告**: ✅ 持續出現（1600-2100ms/frame）

#### 致命問題：架構設計錯誤

**問題描述**:
渲染器使用 **torus 參數化座標**作為 instanced rendering 的 instance 數量，而非 **ASCII grid 座標**。

**錯誤的實作**:
```typescript
// createTorusCoordinates()
const thetaSteps = Math.ceil((2π) / 0.07) = 90
const phiSteps = Math.ceil((2π) / 0.02) = 315
torusCount = 90 × 315 = 28,350 quads
```

**每 frame 渲染**:
- 28,350 個 quads
- 56,700 個三角形（每個 quad 2 個三角形）
- 170,100 個頂點（每個三角形 3 個頂點）

**正確的實作應該是**:
```typescript
// 應該基於 ASCII grid
const gridWidth = 80
const gridHeight = 24
gridCount = 80 × 24 = 1,920 quads
```

#### 效能分析

```
實測 FPS: 0.6
Long task: 1600-2100ms/frame
目標 frame time: 16.67ms (60 FPS)
實際 frame time: 1666ms
效能差距: 100x 慢於目標
```

**根本原因**:
- ❌ 渲染了 **14.7 倍**過多的 quads (28,350 vs 1,920)
- ❌ 所有 quads 重疊繪製在相同區域
- ❌ Depth test 造成大量 overdraw
- ❌ Fragment shader 被執行了數百萬次

**Console 日誌證據**:
```
[WebGLQuadDonutRenderer] Created 28350 torus points
[Performance Warning] long_task 2090ms
[Performance Warning] long_task 1681ms
[Performance Warning] long_task 1950ms
...
```

#### 架構問題診斷

**當前架構** (錯誤):
```
For each torus parametric point (theta, phi):
  渲染一個 quad at that 3D position
  Vertex shader 計算 3D → 2D projection
  Fragment shader 從 texture atlas 取得字元
```

**正確架構應該是**:
```
For each ASCII grid cell (x, y):
  渲染一個 quad at that grid position
  Vertex shader 計算該 grid cell 應該顯示什麼字元
  Fragment shader 從 texture atlas 繪製該字元
```

**關鍵差異**:
- 當前：28,350 個 quads 嘗試覆蓋 1,920 個 grid cells
- 正確：1,920 個 quads 對應 1,920 個 grid cells

#### 結論

WebGL Quad 渲染器的實作有**嚴重的架構設計錯誤**，需要完全重寫。當前版本不可用於生產環境。

---

## 效能比較圖表

### FPS 比較

```
Canvas 2D  ████████████████████████  22.4 FPS
WebGL Point██████████████████████████████████████████████████████████████  60.0 FPS
WebGL Quad ▌ 0.6 FPS
```

### 相對效能 (Canvas 2D = 1.0x)

```
Canvas 2D  ████████████████████  1.0x
WebGL Point███████████████████████████████████████████████████  2.68x
WebGL Quad ▌ 0.027x
```

---

## 技術細節

### Canvas 2D 渲染流程

1. CPU 計算 torus geometry (28,350 points)
2. CPU 計算 surface normals
3. CPU 計算 luminance values
4. CPU Z-buffer algorithm (選擇最近的 point)
5. CPU 轉換 luminance → ASCII character
6. Canvas 2D `fillText()` × 1,920 次

**瓶頸**: CPU 計算 + Canvas 2D API

---

### WebGL Point 渲染流程

1. GPU Vertex Shader 計算 torus geometry
2. GPU Vertex Shader 計算 3D rotation
3. GPU Vertex Shader 計算 surface lighting
4. GPU Vertex Shader 計算 clip space coordinates
5. GPU Fragment Shader 輸出綠色像素

**瓶頸**: 無明顯瓶頸（GPU 有大量餘裕）

---

### WebGL Quad 渲染流程 (錯誤的)

1. GPU Vertex Shader × 28,350 instances
2. GPU Vertex Shader 計算 torus geometry per instance
3. GPU Vertex Shader 計算 quad position per instance
4. GPU Rasterization (56,700 triangles)
5. GPU Fragment Shader × millions of fragments
6. GPU Depth test (大量 overdraw)

**瓶頸**:
- ❌ Instance count 過多 (28,350 vs 1,920)
- ❌ Overdraw 嚴重 (所有 quads 重疊)
- ❌ Fragment shader 執行次數過多

---

## 建議與下一步

### 選項 A: 採用 WebGL Point 渲染器 ⭐⭐⭐⭐⭐

**優點**:
- ✅ 已驗證成功（60 FPS）
- ✅ 無需額外開發
- ✅ 視覺效果良好（3D 綠色 torus）
- ✅ 適合 Loading 動畫場景

**缺點**:
- ⚠️ 不顯示真實 ASCII 字元

**適用場景**:
- Loading 動畫（視覺效果為主）
- 背景裝飾動畫
- Demo 展示

**工作量**: 無（已完成）

**推薦指數**: ⭐⭐⭐⭐⭐

---

### 選項 B: 修復 WebGL Quad 架構 ⭐⭐⭐

**需要的改動**:

1. **重寫 torus coordinates buffer**
   ```typescript
   // 改為 grid-based
   const gridCoords: number[] = [];
   for (let y = 0; y < height; y++) {
     for (let x = 0; x < width; x++) {
       gridCoords.push(x, y);
     }
   }
   // gridCount = 80 × 24 = 1,920
   ```

2. **重寫 Vertex Shader**
   ```glsl
   // 輸入：grid coordinates (x, y)
   in vec2 a_gridCoord;

   void main() {
     // 1. 計算此 grid cell 的 3D ray
     // 2. Ray-march 找到 torus 表面
     // 3. 計算 surface normal 和 luminance
     // 4. 根據 luminance 選擇 character
     // 5. 定位 quad 到 grid position
   }
   ```

3. **優化 Fragment Shader**
   - 減少 texture 查找
   - 優化 character selection logic

**預期效能**: 60+ FPS (1,920 quads << 28,350 quads)

**工作量**: 中等（2-3 天）

**推薦指數**: ⭐⭐⭐

---

### 選項 C: 保持 Canvas 2D ⭐⭐

**優點**:
- ✅ 最保守的選擇
- ✅ 22.4 FPS 已經足夠流暢
- ✅ 顯示真實 ASCII 字元
- ✅ 無相容性問題

**缺點**:
- ⚠️ 效能較低（22.4 FPS vs 60 FPS）
- ⚠️ 行動裝置效能可能不佳

**工作量**: 無

**推薦指數**: ⭐⭐

---

## 最終建議

基於測試結果，我們建議：

### 短期方案（立即可用）

**採用 WebGL Point 渲染器**
- 使用 Phase 1 PoC 實作
- 60 FPS 優秀效能
- 視覺效果適合 Loading 動畫
- 無需額外開發

### 中期方案（可選）

**修復 WebGL Quad 架構**
- 如果需要真實 ASCII 字元顯示
- 預估 2-3 天開發時間
- 可達到 60+ FPS

### Fallback 方案

**保留 Canvas 2D**
- 作為不支援 WebGL 環境的 fallback
- 使用 `RendererFactory` 自動選擇
- 確保相容性

---

## 測試環境

**Hardware**:
- CPU: (WSL2 環境)
- GPU: Software WebGL renderer
- RAM: 42 MB allocated

**Software**:
- OS: Linux (WSL2)
- Browser: Chrome/Chromium
- WebGL Version: WebGL 2.0
- Canvas Size: 800×600 px
- Grid Size: 80×24 characters

**Note**: Software WebGL 可能影響絕對效能數值，但相對比較仍然有效。

---

## 附錄：截圖證據

### Canvas 2D 測試

- ✅ ASCII donut 正確顯示
- ✅ 22.4 FPS 穩定
- ✅ 綠色 Pip-Boy 主題

### WebGL Point 測試

- ✅ 3D green torus 正確顯示
- ✅ 60 FPS 穩定
- ✅ 無 console 錯誤

### WebGL Quad 測試

- ⚠️ 右側 canvas 顯示 torus（正常）
- ❌ 左側 canvas 黑色（異常）
- ❌ 0.6 FPS（異常）
- ❌ 大量 long task 警告

---

## 結論

經過完整測試，我們得出以下結論：

1. **WebGL Point 渲染器是目前最佳選擇** - 60 FPS 穩定，視覺效果優秀
2. **WebGL Quad 渲染器需要完全重寫** - 當前架構有嚴重設計錯誤
3. **Canvas 2D 可作為可靠的 fallback** - 22.4 FPS 足夠流暢

建議立即整合 WebGL Point 渲染器到 `AsciiDonutLoading` 元件，使用 `RendererFactory` 實現自動 fallback。

---

**報告建立時間**: 2025-10-09
**測試執行者**: Claude Code
**Spec**: `.kiro/specs/webgl-ascii-donut/`
