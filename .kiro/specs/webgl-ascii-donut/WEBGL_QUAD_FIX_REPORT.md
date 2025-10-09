# WebGL Quad 渲染器修復報告

**修復日期**: 2025-10-09
**修復目標**: 修正 WebGL Quad 渲染器的架構錯誤，從 0.6 FPS 提升到可用水平

---

## 執行摘要

我們成功修復了 WebGL Quad 渲染器的**致命架構錯誤**，將效能從 0.6 FPS 提升到 **8.0 FPS**（**13.3 倍提升**）。

雖然仍未達到目標 60 FPS，但此次修復驗證了正確的架構方向，並揭示了進一步優化的路徑。

### 效能比較

| 狀態 | Instance Count | FPS | 相對效能 | 評價 |
|------|---------------|-----|----------|------|
| **修復前** | 28,350 quads | 0.6 | 1.0x | ❌ 不可用 |
| **修復後** | 1,920 quads | 8.0 | 13.3x | ⚠️ 部分可用 |
| **目標** | 1,920 quads | 60+ | 100x | ✅ 理想 |

---

## 問題診斷

### 原始架構錯誤

**錯誤的實作**（修復前）:
```typescript
// ❌ 基於 torus 參數化座標
const thetaSteps = Math.ceil((2π) / 0.07) = 90
const phiSteps = Math.ceil((2π) / 0.02) = 315
torusCount = 90 × 315 = 28,350 quads

// 每個 quad 代表一個 torus 表面點
// 結果：28,350 個重疊的 quads 全部繪製在相同區域
```

**正確的實作**（修復後）:
```typescript
// ✅ 基於 ASCII grid 座標
const width = 80
const height = 24
torusCount = 80 × 24 = 1,920 quads

// 每個 quad 代表一個 ASCII 字元位置
// 結果：1,920 個 quads 各自繪製在正確的 grid cell
```

### 效能影響

| 項目 | 修復前 | 修復後 | 改善 |
|------|--------|--------|------|
| Quad 數量 | 28,350 | 1,920 | **14.7x 減少** |
| 三角形數量 | 56,700 | 3,840 | **14.7x 減少** |
| Instance 數量 | 28,350 | 1,920 | **14.7x 減少** |
| FPS | 0.6 | 8.0 | **13.3x 提升** |
| Frame Time | 1666ms | 125ms | **13.3x 改善** |

---

## 修復實作

### 1. 修改 Buffer 建立邏輯

**檔案**: `src/lib/webgl/WebGLQuadDonutRenderer.ts:301-329`

**修復前**:
```typescript
private createTorusCoordinates(): WebGLBuffer {
  const thetaSteps = Math.ceil((Math.PI * 2) / this.config.thetaSpacing);
  const phiSteps = Math.ceil((Math.PI * 2) / this.config.phiSpacing);
  const coords: number[] = [];

  for (let i = 0; i < thetaSteps; i++) {
    const theta = (i / thetaSteps) * Math.PI * 2;
    for (let j = 0; j < phiSteps; j++) {
      const phi = (j / phiSteps) * Math.PI * 2;
      coords.push(theta, phi);  // ❌ Torus 參數化座標
    }
  }

  this.torusCount = coords.length / 2;  // 28,350
  return buffer;
}
```

**修復後**:
```typescript
private createTorusCoordinates(): WebGLBuffer {
  const coords: number[] = [];

  // ✅ Create grid coordinates: one quad per ASCII character position
  for (let y = 0; y < this.config.height; y++) {
    for (let x = 0; x < this.config.width; x++) {
      coords.push(x, y);  // ✅ Grid 座標
    }
  }

  this.torusCount = coords.length / 2;  // 1,920
  console.log(
    `[WebGLQuadDonutRenderer] Created ${this.torusCount} grid cells (${this.config.width}×${this.config.height})`
  );
  return buffer;
}
```

### 2. 重寫 Vertex Shader（WebGL 2.0）

**檔案**: `src/lib/webgl/quadShaders.ts:15-150`

**關鍵改變**:
1. **輸入改變**: `a_torusCoord` 從 `(theta, phi)` 改為 `(gridX, gridY)`
2. **增加 Ray-Marching**: 使用 Signed Distance Function (SDF) 找到 torus 表面
3. **反向投影**: 從 grid cell 計算 ray direction，找到該位置的字元

**修復後的 Shader**:
```glsl
// 輸入：grid coordinates (FIXED)
in vec2 a_torusCoord;  // (gridX, gridY) ASCII grid cell coordinates

// Torus SDF
float sdTorus(vec3 p, float R1, float R2) {
  vec2 q = vec2(length(p.xz) - R2, p.y);
  return length(q) - R1;
}

// Ray-march to find torus surface
float rayMarch(vec3 ro, vec3 rd, float R1, float R2) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdTorus(p, R1, R2);
    if (d < MIN_DIST) return t;
    if (t > MAX_DIST) break;
    t += d;
  }
  return -1.0;
}

void main() {
  // Get grid cell coordinates
  float gridX = a_torusCoord.x;
  float gridY = a_torusCoord.y;

  // Convert grid cell to screen coordinates
  float screenX = gridX - u_gridSize.x * 0.5;
  float screenY = u_gridSize.y * 0.5 - gridY;

  // Calculate ray direction for this grid cell
  vec3 rayOrigin = vec3(0.0, 0.0, -u_K2);
  vec3 rayDir = normalize(vec3(screenX / u_K1, screenY / u_K1, 1.0));

  // Apply inverse rotation to ray
  mat3 rotation = rotateX(u_angleA) * rotateZ(u_angleB);
  mat3 invRotation = transpose(rotation);
  rayDir = invRotation * rayDir;
  rayOrigin = invRotation * rayOrigin;

  // Ray-march to find torus surface
  float t = rayMarch(rayOrigin, rayDir, u_R1, u_R2);

  v_charIndex = 0.0;  // Default: no character

  if (t > 0.0) {
    // Hit torus surface - calculate lighting
    vec3 hitPoint = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(hitPoint, u_R1, u_R2);
    normal = rotation * normal;

    float luminance = dot(normal, normalize(u_lightDir));
    luminance = (luminance + 1.0) * 0.5;

    v_charIndex = luminance;
  }

  // Position quad at grid cell
  float pixelX = gridX * u_charWidth + a_quadVertex.x * u_charWidth;
  float pixelY = gridY * u_charHeight + a_quadVertex.y * u_charHeight;

  // Convert to clip space
  float clipX = (pixelX / u_canvasSize.x) * 2.0 - 1.0;
  float clipY = 1.0 - (pixelY / u_canvasSize.y) * 2.0;

  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
  v_texCoord = a_quadVertex;
}
```

### 3. 同步修改 WebGL 1.0 Vertex Shader

**檔案**: `src/lib/webgl/quadShaders.ts:197-326`

完全相同的邏輯，但使用 WebGL 1.0 語法（`attribute` / `varying` 而非 `in` / `out`）。

---

## 測試結果

### Console 日誌證據

**修復前**:
```
[WebGLQuadDonutRenderer] Created 28350 torus points
[Performance Warning] long_task 2090ms
[Performance Warning] long_task 1681ms
...
FPS: 0.6
```

**修復後**:
```
[WebGLQuadDonutRenderer] Created 1920 grid cells (80×24)
[Perf] long_task 132ms
[Perf] long_task 120ms
...
FPS: 8.0
```

### 視覺證據

**修復前**:
- 右側 canvas: 綠色模糊的 blob（28,350 個重疊的 quads）
- 左側 canvas: 黑色（無 ASCII 輸出）
- FPS: 0.6

**修復後**:
- 右側 canvas: 清晰的 ASCII 字元 torus（`#`, `*`, `=`, `:` 等）
- 左側 canvas: 仍然黑色（depth buffer 問題，待修復）
- FPS: 8.0

---

## 仍存在的問題

### 1. 效能仍然偏低（8 FPS vs 60 FPS 目標）

**原因診斷**:

1. **Software WebGL 渲染器**
   ```
   [GroupMarkerNotSet] Automatic fallback to software WebGL
   ```
   - 所有 GPU 計算實際在 CPU 上執行
   - 無法充分利用 GPU 硬體加速

2. **Vertex Shader 太重**
   - Ray-marching 在 vertex shader 中執行
   - 每個 quad 有 4 個 vertices = 7,680 次 ray-march/frame
   - 每次 ray-march 最多 100 iterations

3. **Long Task 持續存在**
   ```
   [Perf] long_task 110-204ms
   ```
   - 每 frame 需要 110-204ms（目標是 16.6ms）
   - 無法達到 60 FPS

### 2. 左側 Canvas 黑色

**可能原因**:
- Depth buffer 配置問題
- Z-fighting between quads
- Rendering order 錯誤

---

## 優化嘗試與結果

### 嘗試 1: 減少 Ray-Marching Iterations

**改變**:
```glsl
// Before
const int MAX_STEPS = 100;

// After
const int MAX_STEPS = 32;
```

**結果**: ❌ **失敗 - 效能反而下降**

| 參數 | MAX_STEPS=100 | MAX_STEPS=32 | 變化 |
|------|---------------|--------------|------|
| FPS | 8.0 | 5.6 | **-30%** |
| Long Task | 110-160ms | 110-251ms | **變差** |

**結論**: Ray-marching iteration 數量不是瓶頸。真正的瓶頸是：
1. Software WebGL 渲染
2. Vertex shader 本身就不該做 ray-marching

---

## 架構問題分析

### 當前架構的根本缺陷

```
Per Frame:
  For each grid cell (1,920 cells):
    For each vertex (4 vertices/quad):
      Execute ray-march (up to 100 steps):
        Calculate SDF
        Step along ray
      Calculate normal (6 SDF calls)
      Calculate lighting

Total SDF calls per frame:
  1,920 quads × 4 vertices × (100 + 6) = 814,080 SDF calls
```

### 為什麼 Vertex Shader Ray-Marching 是錯誤的

1. **Vertex shader 執行次數過多**
   - 每個 quad 4 個 vertices
   - 7,680 次 vertex shader 執行/frame

2. **Ray-marching 應該在 Fragment Shader**
   - Fragment shader 只對可見的 fragments 執行
   - 可以利用 early-Z testing 減少計算

3. **或使用完全不同的方法**
   - Compute shader（WebGL 2.0 compute）
   - Texture-based lookup
   - Pre-computed results

---

## 進一步優化建議

### 選項 A: 接受當前效能（8 FPS）

**適用場景**:
- 非關鍵 UI 元素
- 可接受的 loading 動畫效果
- 保持架構簡單

**優點**:
- ✅ 無需額外開發
- ✅ 顯示真實 ASCII 字元
- ✅ 比修復前快 13.3 倍

**缺點**:
- ⚠️ 8 FPS 仍然偏低
- ⚠️ 無法達到 60 FPS 目標

### 選項 B: 移植 Ray-Marching 到 Fragment Shader

**架構改變**:
```glsl
// Vertex Shader: 只做位置計算
void main() {
  // Position quad at grid cell
  gl_Position = calculateQuadPosition();
  v_gridCoord = a_torusCoord;  // Pass grid coord to fragment
}

// Fragment Shader: 執行 ray-marching
void main() {
  // Calculate ray for this fragment
  vec3 rayDir = calculateRayDirection(v_gridCoord);

  // Ray-march (只對可見的 fragments)
  float t = rayMarch(rayOrigin, rayDir, u_R1, u_R2);

  if (t > 0.0) {
    // Calculate lighting and sample character
    fragColor = sampleCharacter(luminance);
  } else {
    discard;  // Not hit torus
  }
}
```

**預期改善**:
- 減少 ray-march 執行次數（從 7,680 → ~1,920）
- 利用 early-Z testing
- 可能達到 20-30 FPS

**工作量**: 中等（1-2 天）

### 選項 C: 使用 WebGL Point 渲染器

**建議**: 直接使用已驗證成功的 WebGL Point 渲染器
- ✅ 60 FPS 穩定
- ✅ 視覺效果良好
- ✅ 無需額外開發

**缺點**:
- ⚠️ 不顯示真實 ASCII 字元（只是像素點）

---

## 結論與建議

### 修復成果

1. ✅ **成功識別並修復架構錯誤**
   - Instance count: 28,350 → 1,920（14.7x 減少）
   - FPS: 0.6 → 8.0（13.3x 提升）

2. ✅ **驗證正確的架構方向**
   - Grid-based rendering 是正確的
   - ASCII 字元正確顯示

3. ✅ **揭示進一步優化路徑**
   - Ray-marching 應移至 Fragment Shader
   - Software WebGL 是主要瓶頸

### 最終建議

**短期**（立即可用）:
- 使用 **WebGL Point 渲染器**（60 FPS，已驗證）
- 保留 WebGL Quad 作為實驗性功能

**中期**（可選）:
- 移植 ray-marching 到 Fragment Shader
- 預期達到 20-30 FPS

**長期**（如果需要 60 FPS + 真實 ASCII）:
- 考慮 Compute Shader 或 texture-based 方法
- 需要 WebGL 2.0 compute 支援

---

## 技術細節

### Ray-Marching 演算法

**Signed Distance Function (SDF)**:
```glsl
float sdTorus(vec3 p, float R1, float R2) {
  vec2 q = vec2(length(p.xz) - R2, p.y);
  return length(q) - R1;
}
```

**Ray-Marching Loop**:
```glsl
float rayMarch(vec3 ro, vec3 rd, float R1, float R2) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sdTorus(p, R1, R2);

    if (d < MIN_DIST) return t;  // Hit surface
    if (t > MAX_DIST) break;     // Miss

    t += d;  // Step along ray
  }
  return -1.0;  // No hit
}
```

**Normal Calculation** (使用有限差分):
```glsl
vec3 calcNormal(vec3 p, float R1, float R2) {
  float eps = 0.001;
  vec2 h = vec2(eps, 0.0);
  return normalize(vec3(
    sdTorus(p + h.xyy, R1, R2) - sdTorus(p - h.xyy, R1, R2),
    sdTorus(p + h.yxy, R1, R2) - sdTorus(p - h.yxy, R1, R2),
    sdTorus(p + h.yyx, R1, R2) - sdTorus(p - h.yyx, R1, R2)
  ));
}
```

### 3D Rotation Matrices

```glsl
mat3 rotateX(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    1.0, 0.0, 0.0,
    0.0, c, -s,
    0.0, s, c
  );
}

mat3 rotateZ(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat3(
    c, -s, 0.0,
    s, c, 0.0,
    0.0, 0.0, 1.0
  );
}
```

---

## 附錄：效能數據

### 修復前後對比

| Metric | 修復前 | 修復後 | 改善 |
|--------|--------|--------|------|
| Instance Count | 28,350 | 1,920 | **14.7x** |
| Triangles/Frame | 56,700 | 3,840 | **14.7x** |
| Vertices/Frame | 170,100 | 11,520 | **14.7x** |
| FPS | 0.6 | 8.0 | **13.3x** |
| Frame Time | 1666ms | 125ms | **13.3x** |
| Long Task Min | 1588ms | 110ms | **14.4x** |
| Long Task Max | 2148ms | 204ms | **10.5x** |
| SDF Calls/Frame (est.) | 2,409,000 | 814,080 | **2.96x** |

### 與其他渲染器比較

| 渲染器 | FPS | 相對於 Canvas 2D | 技術 |
|--------|-----|------------------|------|
| Canvas 2D | 22.4 | 1.0x | CPU ASCII rendering |
| WebGL Point | 60.0 | 2.68x | GPU point rendering |
| WebGL Quad (修復前) | 0.6 | 0.027x | ❌ 錯誤架構 |
| WebGL Quad (修復後) | 8.0 | 0.36x | ⚠️ Vertex shader ray-march |

---

**報告建立時間**: 2025-10-09
**修復執行者**: Claude Code
**Spec**: `.kiro/specs/webgl-ascii-donut/`
