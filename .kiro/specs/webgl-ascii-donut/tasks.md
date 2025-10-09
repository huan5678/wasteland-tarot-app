# WebGL ASCII Donut Loading - 任務分解

## 概述

本文件將 WebGL ASCII Donut Loading 的開發工作分解為可執行的任務，按照依賴順序排列，確保漸進式實作和最小化風險。

## 開發階段總覽

| 階段 | 時程 | 目標 | 關鍵產出 |
|------|------|------|---------|
| Phase 1: PoC | 2-3 天 | 驗證 WebGL 字元渲染可行性 | 簡單 WebGL 字元渲染 demo |
| Phase 2: 核心實作 | 4-5 天 | 實作完整 WebGL 渲染器 | WebGLDonutRenderer 類別 |
| Phase 3: 整合 | 2-3 天 | 整合到現有系統 | RendererFactory, 降級策略 |
| Phase 4: 優化測試 | 2-3 天 | 效能優化和測試 | 效能達標, E2E 測試通過 |
| Phase 5: 發布 | 1 天 | 文件和發布 | 技術文件, PR 合併 |

**總時程**：11-15 天

---

## Phase 1: 概念驗證（PoC）

### 任務 1.1: 建立 WebGL 基礎結構

**目標**：建立 WebGL context 和基本的 shader pipeline

**依賴**：無

**步驟**：
1. 建立 `src/lib/webgl/` 目錄結構
2. 建立 `src/lib/webgl/webglUtils.ts`
3. 實作 `createWebGLContext()` 函數
4. 實作基本的 shader 編譯函數

**產出**：
- `src/lib/webgl/webglUtils.ts`

**驗收標準**：
- [x] 成功建立 WebGL 2.0 context（回退到 WebGL 1.0）
- [x] 編譯簡單的 vertex/fragment shader 成功
- [x] 錯誤處理正確（返回 null 並記錄錯誤）

**程式碼範例**：
```typescript
// src/lib/webgl/webglUtils.ts
export function createWebGLContext(
  canvas: HTMLCanvasElement
): WebGLRenderingContext | WebGL2RenderingContext | null {
  try {
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      console.log('[WebGL] Using WebGL 2.0');
      return gl2;
    }

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      console.log('[WebGL] Using WebGL 1.0');
      return gl as WebGLRenderingContext;
    }

    console.warn('[WebGL] WebGL not supported');
    return null;
  } catch (e) {
    console.error('[WebGL] Exception during context creation:', e);
    return null;
  }
}
```

**預估時間**：4 小時

---

### 任務 1.2: 實作字元紋理圖集生成

**目標**：動態生成包含所有 ASCII 字元的紋理圖集

**依賴**：無

**步驟**：
1. 建立 `src/lib/webgl/textureAtlas.ts`
2. 實作 `generateCharacterAtlas()` 函數
3. 使用 Canvas 2D API 繪製字元
4. 實作 `uploadTextureToGPU()` 函數

**產出**：
- `src/lib/webgl/textureAtlas.ts`

**驗收標準**：
- [x] 生成包含 12 個字元的紋理圖集（".,-~:;=!*#$@"）
- [x] 字元使用等寬字體和 Pip-Boy 綠色
- [x] 紋理尺寸正確（charWidth * charCount x charHeight）
- [x] 紋理成功上傳到 GPU

**程式碼範例**：
```typescript
// src/lib/webgl/textureAtlas.ts
export interface CharacterAtlasOptions {
  characters: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  charWidth: number;
  charHeight: number;
}

export function generateCharacterAtlas(
  options: CharacterAtlasOptions
): HTMLCanvasElement {
  const { characters, fontSize, fontFamily, color, charWidth, charHeight } = options;

  const canvas = document.createElement('canvas');
  canvas.width = charWidth * characters.length;
  canvas.height = charHeight;

  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';

  for (let i = 0; i < characters.length; i++) {
    const x = i * charWidth + charWidth / 2;
    ctx.fillText(characters[i], x, 0);
  }

  return canvas;
}

export function uploadTextureToGPU(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  atlasCanvas: HTMLCanvasElement
): WebGLTexture | null {
  const texture = gl.createTexture();
  if (!texture) return null;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);

  // 設定紋理參數（不需要 mipmap）
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
}
```

**預估時間**：4 小時

---

### 任務 1.3: 撰寫簡單的 Shader（PoC）

**目標**：撰寫最簡單的 Vertex/Fragment Shader 來渲染單一字元

**依賴**：任務 1.1

**步驟**：
1. 建立 `src/lib/webgl/shaders.ts`
2. 撰寫簡單的 Vertex Shader（固定位置）
3. 撰寫簡單的 Fragment Shader（紋理映射）
4. 實作 shader 編譯和連結函數

**產出**：
- `src/lib/webgl/shaders.ts`

**驗收標準**：
- [x] Vertex Shader 編譯成功
- [x] Fragment Shader 編譯成功
- [x] Program 連結成功
- [x] 可以設定 uniform 變數

**程式碼範例**：
```typescript
// src/lib/webgl/shaders.ts (PoC 簡化版)
export const pocVertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = 32.0;
}
`;

export const pocFragmentShaderSource = `
precision mediump float;
uniform sampler2D u_charAtlas;
uniform float u_charIndex;
uniform float u_charCount;

void main() {
  float charU = (u_charIndex + gl_PointCoord.x) / u_charCount;
  float charV = gl_PointCoord.y;
  gl_FragColor = texture2D(u_charAtlas, vec2(charU, charV));
}
`;

export function compileShader(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    console.error(`[WebGL] Shader compilation failed:\n${info}\nSource:\n${source}`);
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function linkProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    console.error(`[WebGL] Program linking failed:\n${info}`);
    gl.deleteProgram(program);
    return null;
  }

  return program;
}
```

**預估時間**：4 小時

---

### 任務 1.4: PoC Demo - 渲染單一字元

**目標**：整合以上元件，成功渲染單一 ASCII 字元到 WebGL canvas

**依賴**：任務 1.1, 1.2, 1.3

**步驟**：
1. 建立 `src/lib/webgl/poc.ts`（臨時 PoC 檔案）
2. 整合 context 建立、紋理生成、shader 編譯
3. 渲染單一 point primitive 顯示字元 "@"
4. 驗證視覺效果

**產出**：
- `src/lib/webgl/poc.ts`（臨時檔案，後續會移除）

**驗收標準**：
- [x] 成功在 WebGL canvas 顯示字元 "@"
- [x] 字元顏色為 Pip-Boy 綠色
- [x] 字元清晰可辨識（無模糊或失真）

**程式碼範例**：
```typescript
// src/lib/webgl/poc.ts
import { createWebGLContext } from './webglUtils';
import { generateCharacterAtlas, uploadTextureToGPU } from './textureAtlas';
import { pocVertexShaderSource, pocFragmentShaderSource, compileShader, linkProgram } from './shaders';

export function runPoC(canvas: HTMLCanvasElement) {
  // Step 1: Create WebGL context
  const gl = createWebGLContext(canvas);
  if (!gl) {
    console.error('WebGL not supported');
    return;
  }

  // Step 2: Generate character atlas
  const atlasCanvas = generateCharacterAtlas({
    characters: '.,-~:;=!*#$@',
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#00ff00',
    charWidth: 8,
    charHeight: 16
  });

  const texture = uploadTextureToGPU(gl, atlasCanvas);
  if (!texture) {
    console.error('Failed to create texture');
    return;
  }

  // Step 3: Compile shaders
  const vs = compileShader(gl, gl.VERTEX_SHADER, pocVertexShaderSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, pocFragmentShaderSource);
  if (!vs || !fs) {
    console.error('Failed to compile shaders');
    return;
  }

  const program = linkProgram(gl, vs, fs);
  if (!program) {
    console.error('Failed to link program');
    return;
  }

  // Step 4: Setup buffers and uniforms
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0]), gl.STATIC_DRAW);

  const positionLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const charAtlasLoc = gl.getUniformLocation(program, 'u_charAtlas');
  const charIndexLoc = gl.getUniformLocation(program, 'u_charIndex');
  const charCountLoc = gl.getUniformLocation(program, 'u_charCount');

  gl.uniform1i(charAtlasLoc, 0);
  gl.uniform1f(charIndexLoc, 11); // '@' is the last character
  gl.uniform1f(charCountLoc, 12);

  // Step 5: Render
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, 1);

  console.log('[PoC] Successfully rendered "@" character');
}
```

**預估時間**：4 小時

---

## Phase 2: 核心實作

### 任務 2.1: 實作完整的 Vertex Shader

**目標**：實作包含環面幾何、旋轉矩陣、透視投影的完整 Vertex Shader

**依賴**：任務 1.3

**步驟**：
1. 撰寫 WebGL 2.0 版本的 Vertex Shader（GLSL ES 3.00）
2. 撰寫 WebGL 1.0 版本的 Vertex Shader（GLSL ES 1.00）
3. 實作環面參數方程式
4. 實作雙軸旋轉矩陣（X 軸和 Z 軸）
5. 實作透視投影
6. 實作光照計算（傳遞亮度給 Fragment Shader）

**產出**：
- 更新 `src/lib/webgl/shaders.ts`

**驗收標準**：
- [x] Vertex Shader 正確計算環面表面點的 3D 座標
- [x] 旋轉矩陣正確應用（視覺驗證：donut 旋轉）
- [x] 透視投影正確（視覺驗證：遠處點較小）
- [x] 光照計算正確（視覺驗證：亮度梯度）

**程式碼範例**：
```glsl
// Vertex Shader (GLSL ES 3.00)
#version 300 es

in float a_theta;
in float a_phi;

uniform float u_angleA;
uniform float u_angleB;
uniform float u_R1;
uniform float u_R2;
uniform float u_K1;
uniform float u_K2;
uniform float u_width;
uniform float u_height;

out float v_luminance;

void main() {
  // Torus parametric equations
  float cosTheta = cos(a_theta);
  float sinTheta = sin(a_theta);
  float cosPhi = cos(a_phi);
  float sinPhi = sin(a_phi);

  float circleX = u_R2 + u_R1 * cosTheta;
  float circleY = u_R1 * sinTheta;

  // Rotation matrices
  float sinA = sin(u_angleA);
  float cosA = cos(u_angleA);
  float sinB = sin(u_angleB);
  float cosB = cos(u_angleB);

  float x = circleX * (cosB * cosPhi + sinA * sinB * sinPhi) - circleY * cosA * sinB;
  float y = circleX * (sinB * cosPhi - sinA * cosB * sinPhi) + circleY * cosA * cosB;
  float z = u_K2 + cosA * circleX * sinPhi + circleY * sinA;

  // Perspective projection
  float ooz = 1.0 / z;
  float screenX = (u_width / 2.0) + u_K1 * ooz * x;
  float screenY = (u_height / 2.0) - u_K1 * ooz * y;

  // Convert to NDC
  float ndcX = (screenX / u_width) * 2.0 - 1.0;
  float ndcY = (screenY / u_height) * 2.0 - 1.0;

  gl_Position = vec4(ndcX, ndcY, ooz, 1.0);
  gl_PointSize = 16.0;

  // Lighting (Lambertian)
  float nx = cosTheta * (cosB * cosPhi + sinA * sinB * sinPhi) - sinTheta * cosA * sinB;
  float ny = cosTheta * (sinB * cosPhi - sinA * cosB * sinPhi) + sinTheta * cosA * cosB;
  float nz = cosA * cosTheta * sinPhi + sinTheta * sinA;

  vec3 normal = normalize(vec3(nx, ny, nz));
  vec3 lightDir = normalize(vec3(0.0, 0.7071, -0.7071));

  float luminance = dot(normal, lightDir);
  v_luminance = (luminance + 1.0) / 2.0;
}
```

**預估時間**：6 小時

---

### 任務 2.2: 實作完整的 Fragment Shader

**目標**：實作包含亮度映射和字元紋理選擇的 Fragment Shader

**依賴**：任務 1.3

**步驟**：
1. 撰寫 WebGL 2.0 版本的 Fragment Shader（GLSL ES 3.00）
2. 撰寫 WebGL 1.0 版本的 Fragment Shader（GLSL ES 1.00）
3. 實作亮度到字元索引的映射
4. 實作紋理座標計算（UV mapping）
5. 實作紋理採樣

**產出**：
- 更新 `src/lib/webgl/shaders.ts`

**驗收標準**：
- [x] 正確根據亮度選擇字元
- [x] 紋理座標計算正確
- [x] 字元渲染清晰（無模糊或錯位）

**程式碼範例**：
```glsl
// Fragment Shader (GLSL ES 3.00)
#version 300 es
precision highp float;

in float v_luminance;

uniform sampler2D u_charAtlas;
uniform float u_charCount;

out vec4 fragColor;

void main() {
  // Map luminance to character index
  float charIndex = floor(v_luminance * (u_charCount - 1.0));

  // Calculate texture coordinates
  float charU = (charIndex + gl_PointCoord.x) / u_charCount;
  float charV = gl_PointCoord.y;

  // Sample texture
  vec4 charColor = texture(u_charAtlas, vec2(charU, charV));

  fragColor = charColor;
}
```

**預估時間**：4 小時

---

### 任務 2.3: 實作 WebGLDonutRenderer 類別

**目標**：實作完整的 WebGL 渲染器類別

**依賴**：任務 2.1, 2.2, 1.2

**步驟**：
1. 建立 `src/lib/webgl/WebGLDonutRenderer.ts`
2. 實作 constructor（初始化 WebGL, buffers, texture, shaders）
3. 實作 `render(angleA, angleB)` 方法
4. 實作 `dispose()` 方法
5. 實作 `getType()` 方法
6. 實作 WebGL context lost/restored 事件處理

**產出**：
- `src/lib/webgl/WebGLDonutRenderer.ts`

**驗收標準**：
- [x] 成功初始化所有 WebGL 資源
- [x] `render()` 方法正確更新 uniforms 並渲染
- [x] `dispose()` 方法正確清理所有 WebGL 資源
- [x] Context lost 事件觸發降級

**程式碼範例**：
```typescript
// src/lib/webgl/WebGLDonutRenderer.ts
import { DonutRendererConfig } from '../donutConfig';
import { createWebGLContext } from './webglUtils';
import { generateCharacterAtlas, uploadTextureToGPU } from './textureAtlas';
import { vertexShaderSource, fragmentShaderSource, compileShader, linkProgram } from './shaders';

export class WebGLDonutRenderer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private program: WebGLProgram;
  private buffers: {
    vertex: WebGLBuffer;
  };
  private texture: WebGLTexture;
  private uniforms: Record<string, WebGLUniformLocation>;
  private vertexCount: number;
  private config: DonutRendererConfig;
  private onContextLost?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    config: DonutRendererConfig,
    onContextLost?: () => void
  ) {
    this.config = config;
    this.onContextLost = onContextLost;

    // Create WebGL context
    const gl = createWebGLContext(canvas);
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    // Listen for context lost/restored
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);

    // Generate character atlas texture
    const atlasCanvas = generateCharacterAtlas({
      characters: config.luminanceChars,
      fontSize: 14,
      fontFamily: 'monospace',
      color: '#00ff00', // Pip-Boy green
      charWidth: 8,
      charHeight: 16
    });

    const texture = uploadTextureToGPU(gl, atlasCanvas);
    if (!texture) throw new Error('Failed to create texture');
    this.texture = texture;

    // Compile shaders
    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    const vs = compileShader(
      gl,
      gl.VERTEX_SHADER,
      isWebGL2 ? vertexShaderSource.webgl2 : vertexShaderSource.webgl1
    );
    const fs = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      isWebGL2 ? fragmentShaderSource.webgl2 : fragmentShaderSource.webgl1
    );

    if (!vs || !fs) throw new Error('Failed to compile shaders');

    const program = linkProgram(gl, vs, fs);
    if (!program) throw new Error('Failed to link program');
    this.program = program;

    // Create vertex buffer
    const vertexData = this.generateVertexData();
    this.vertexCount = vertexData.length / 2;

    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) throw new Error('Failed to create vertex buffer');

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
    this.buffers = { vertex: vertexBuffer };

    // Get uniform locations
    gl.useProgram(program);
    this.uniforms = this.getUniformLocations();

    // Setup attributes
    const thetaLoc = gl.getAttribLocation(program, 'a_theta');
    const phiLoc = gl.getAttribLocation(program, 'a_phi');

    gl.enableVertexAttribArray(thetaLoc);
    gl.vertexAttribPointer(thetaLoc, 1, gl.FLOAT, false, 8, 0);

    gl.enableVertexAttribArray(phiLoc);
    gl.vertexAttribPointer(phiLoc, 1, gl.FLOAT, false, 8, 4);

    // Enable depth test
    gl.enable(gl.DEPTH_TEST);

    // Enable point size in vertex shader (WebGL 1.0 only)
    if (!isWebGL2 && gl instanceof WebGLRenderingContext) {
      gl.enable(gl.PROGRAM_POINT_SIZE || 0x8642);
    }
  }

  render(angleA: number, angleB: number): void {
    const { gl, program, uniforms, vertexCount, config } = this;

    gl.useProgram(program);

    // Clear
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Update uniforms
    gl.uniform1f(uniforms.u_angleA, angleA);
    gl.uniform1f(uniforms.u_angleB, angleB);
    gl.uniform1f(uniforms.u_R1, config.R1);
    gl.uniform1f(uniforms.u_R2, config.R2);
    gl.uniform1f(uniforms.u_K1, config.K1);
    gl.uniform1f(uniforms.u_K2, config.K2);
    gl.uniform1f(uniforms.u_width, config.width);
    gl.uniform1f(uniforms.u_height, config.height);
    gl.uniform1i(uniforms.u_charAtlas, 0);
    gl.uniform1f(uniforms.u_charCount, config.luminanceChars.length);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // Draw
    gl.drawArrays(gl.POINTS, 0, vertexCount);
  }

  dispose(): void {
    const { gl, program, buffers, texture } = this;

    gl.deleteBuffer(buffers.vertex);
    gl.deleteTexture(texture);
    gl.deleteProgram(program);
  }

  getType(): 'webgl' | 'webgl2' {
    return this.gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl';
  }

  private generateVertexData(): number[] {
    const { thetaSpacing, phiSpacing } = this.config;
    const vertices: number[] = [];

    for (let theta = 0; theta < Math.PI * 2; theta += thetaSpacing) {
      for (let phi = 0; phi < Math.PI * 2; phi += phiSpacing) {
        vertices.push(theta, phi);
      }
    }

    return vertices;
  }

  private getUniformLocations(): Record<string, WebGLUniformLocation> {
    const { gl, program } = this;
    const names = [
      'u_angleA', 'u_angleB', 'u_R1', 'u_R2', 'u_K1', 'u_K2',
      'u_width', 'u_height', 'u_charAtlas', 'u_charCount'
    ];

    const locations: Record<string, WebGLUniformLocation> = {};
    for (const name of names) {
      const loc = gl.getUniformLocation(program, name);
      if (!loc) throw new Error(`Failed to get uniform location: ${name}`);
      locations[name] = loc;
    }

    return locations;
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    console.warn('[WebGL] Context lost');
    if (this.onContextLost) {
      this.onContextLost();
    }
  };

  private handleContextRestored = () => {
    console.log('[WebGL] Context restored, re-initialization required');
  };
}
```

**預估時間**：8 小時

---

### 任務 2.4: 單元測試 - WebGL 模組

**目標**：為 WebGL 模組撰寫單元測試

**依賴**：任務 2.3

**步驟**：
1. 建立 `src/lib/webgl/__tests__/textureAtlas.test.ts`
2. 建立 `src/lib/webgl/__tests__/shaders.test.ts`
3. 建立 `src/lib/webgl/__tests__/WebGLDonutRenderer.test.ts`
4. 撰寫紋理生成測試
5. 撰寫 shader 編譯測試
6. 撰寫渲染器整合測試

**產出**：
- `src/lib/webgl/__tests__/textureAtlas.test.ts`
- `src/lib/webgl/__tests__/shaders.test.ts`
- `src/lib/webgl/__tests__/WebGLDonutRenderer.test.ts`

**驗收標準**：
- [x] 所有單元測試通過
- [x] 測試覆蓋率 > 80%

**預估時間**：6 小時

---

## Phase 3: 整合與降級策略

### 任務 3.1: 定義統一渲染器介面

**目標**：定義 IDonutRenderer 介面，確保 Canvas 2D 和 WebGL 渲染器可互換

**依賴**：任務 2.3

**步驟**：
1. 建立 `src/lib/webgl/types.ts`
2. 定義 `IDonutRenderer` 介面
3. 定義 `RendererType` 枚舉
4. 更新 `DonutRenderer` 實作 `IDonutRenderer`
5. 更新 `WebGLDonutRenderer` 實作 `IDonutRenderer`

**產出**：
- `src/lib/webgl/types.ts`
- 更新 `src/lib/donutRenderer.ts`
- 更新 `src/lib/webgl/WebGLDonutRenderer.ts`

**驗收標準**：
- [x] `IDonutRenderer` 介面定義清晰
- [x] Canvas 2D 和 WebGL 渲染器都實作此介面
- [x] TypeScript 編譯無錯誤

**程式碼範例**：
```typescript
// src/lib/webgl/types.ts
export interface IDonutRenderer {
  render(angleA: number, angleB: number): string | void;
  dispose(): void;
  getType(): 'canvas-2d' | 'webgl' | 'webgl2' | 'static';
}

export enum RendererType {
  WEBGL2 = 'webgl2',
  WEBGL = 'webgl',
  CANVAS_2D = 'canvas-2d',
  STATIC = 'static'
}
```

**預估時間**：3 小時

---

### 任務 3.2: 實作渲染器工廠（RendererFactory）

**目標**：實作自動選擇最佳渲染器的工廠函數

**依賴**：任務 3.1

**步驟**：
1. 建立 `src/lib/rendererFactory.ts`
2. 實作 `createDonutRenderer()` 函數
3. 實作 WebGL 支援度偵測
4. 實作降級邏輯（WebGL 2.0 → WebGL 1.0 → Canvas 2D → Static）
5. 實作 prefers-reduced-motion 偵測

**產出**：
- `src/lib/rendererFactory.ts`

**驗收標準**：
- [x] 自動偵測並選擇最佳渲染器
- [x] 支援手動指定渲染器類型（測試用）
- [x] prefers-reduced-motion 直接回退到 Static

**程式碼範例**：
```typescript
// src/lib/rendererFactory.ts
import { DonutRenderer } from './donutRenderer';
import { WebGLDonutRenderer } from './webgl/WebGLDonutRenderer';
import { IDonutRenderer, RendererType } from './webgl/types';
import { DonutRendererConfig } from './donutConfig';

const STATIC_DONUT = `[Static ASCII Donut]`;

class StaticRenderer implements IDonutRenderer {
  render(): string {
    return STATIC_DONUT;
  }
  dispose(): void {}
  getType(): 'static' {
    return 'static';
  }
}

export function createDonutRenderer(
  canvas: HTMLCanvasElement,
  config: DonutRendererConfig,
  preferredType?: RendererType
): {
  renderer: IDonutRenderer;
  type: RendererType;
} | null {
  // Check prefers-reduced-motion
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return {
        renderer: new StaticRenderer(),
        type: RendererType.STATIC
      };
    }
  }

  // Try WebGL 2.0
  if (!preferredType || preferredType === RendererType.WEBGL2) {
    try {
      const renderer = new WebGLDonutRenderer(canvas, config);
      if (renderer.getType() === 'webgl2') {
        return { renderer, type: RendererType.WEBGL2 };
      }
    } catch (e) {
      console.warn('[RendererFactory] WebGL 2.0 initialization failed:', e);
    }
  }

  // Try WebGL 1.0
  if (!preferredType || preferredType === RendererType.WEBGL) {
    try {
      const renderer = new WebGLDonutRenderer(canvas, config);
      if (renderer.getType() === 'webgl') {
        return { renderer, type: RendererType.WEBGL };
      }
    } catch (e) {
      console.warn('[RendererFactory] WebGL 1.0 initialization failed:', e);
    }
  }

  // Fallback to Canvas 2D
  if (!preferredType || preferredType === RendererType.CANVAS_2D) {
    return {
      renderer: new DonutRenderer(config),
      type: RendererType.CANVAS_2D
    };
  }

  // Final fallback to Static
  return {
    renderer: new StaticRenderer(),
    type: RendererType.STATIC
  };
}

export function monitorPerformanceAndDegrade(
  currentType: RendererType,
  fps: number
): RendererType | null {
  if (currentType === RendererType.WEBGL2 || currentType === RendererType.WEBGL) {
    if (fps < 20) {
      console.warn(`[RendererFactory] WebGL FPS < 20 (${fps.toFixed(1)}), degrading to Canvas 2D`);
      return RendererType.CANVAS_2D;
    }
  }

  if (currentType === RendererType.CANVAS_2D) {
    if (fps < 15) {
      console.warn(`[RendererFactory] Canvas 2D FPS < 15 (${fps.toFixed(1)}), degrading to Static`);
      return RendererType.STATIC;
    }
  }

  return null;
}
```

**預估時間**：4 小時

---

### 任務 3.3: 修改 AsciiDonutLoading 組件支援多渲染器

**目標**：修改現有組件以支援 WebGL 和 Canvas 2D 渲染器切換

**依賴**：任務 3.2

**步驟**：
1. 修改 `src/components/loading/AsciiDonutLoading.tsx`
2. 使用 `createDonutRenderer()` 建立渲染器
3. 實作 FPS 監控觸發降級
4. 實作 WebGL canvas 渲染（與 Canvas 2D 的 `<pre>` 元素不同）
5. 支援 URL 參數強制使用特定渲染器（測試用）

**產出**：
- 更新 `src/components/loading/AsciiDonutLoading.tsx`

**驗收標準**：
- [x] 成功使用 WebGL 渲染器（當支援時）
- [x] 自動降級邏輯正常運作
- [x] URL 參數 `?renderer=webgl|canvas|static` 正常運作
- [x] 開發模式顯示當前渲染器類型

**程式碼範例**：
```typescript
// src/components/loading/AsciiDonutLoading.tsx (部分修改)
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createDonutRenderer, monitorPerformanceAndDegrade } from '@/lib/rendererFactory';
import { RendererType, IDonutRenderer } from '@/lib/webgl/types';
import { DEFAULT_DONUT_CONFIG, mergeDonutConfig, DonutRendererConfig } from '@/lib/donutConfig';

export interface AsciiDonutLoadingProps {
  message?: string;
  forceFallback?: boolean;
  config?: Partial<DonutRendererConfig>;
}

export function AsciiDonutLoading({
  message = 'INITIALIZING VAULT RESIDENT STATUS...',
  forceFallback = false,
  config,
}: AsciiDonutLoadingProps) {
  const [rendererType, setRendererType] = useState<RendererType>(RendererType.WEBGL2);
  const [currentFPS, setCurrentFPS] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const rendererRef = useRef<IDonutRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const angleARef = useRef(0);
  const angleBRef = useRef(0);

  // Performance tracking
  const frameCountRef = useRef(0);
  const lastFPSCheckRef = useRef(performance.now());
  const lastFrameTimeRef = useRef(0);

  // Get preferred renderer from URL (for testing)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const forcedRenderer = urlParams.get('renderer') as RendererType | null;

    if (forcedRenderer) {
      setRendererType(forcedRenderer);
    }
  }, []);

  // Initialize renderer
  useEffect(() => {
    if (forceFallback) {
      setRendererType(RendererType.STATIC);
      return;
    }

    const finalConfig = config
      ? mergeDonutConfig({ ...DEFAULT_DONUT_CONFIG, ...config })
      : DEFAULT_DONUT_CONFIG;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const result = createDonutRenderer(canvas, finalConfig, rendererType);
    if (!result) {
      console.error('[AsciiDonutLoading] Failed to create renderer');
      return;
    }

    rendererRef.current = result.renderer;
    setRendererType(result.type);

    // Start animation
    const targetFPS = 24;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (!rendererRef.current) return;

      const deltaTime = currentTime - lastFrameTimeRef.current;

      if (deltaTime >= frameInterval) {
        lastFrameTimeRef.current = currentTime - (deltaTime % frameInterval);

        // Render
        const output = rendererRef.current.render(angleARef.current, angleBRef.current);

        // Update display (Canvas 2D uses <pre>, WebGL renders to canvas)
        if (typeof output === 'string' && preRef.current) {
          preRef.current.textContent = output;
        }

        // Update angles
        angleARef.current += 0.04;
        angleBRef.current += 0.02;

        // FPS tracking
        frameCountRef.current++;
        if (frameCountRef.current % 60 === 0) {
          const now = performance.now();
          const fps = 60000 / (now - lastFPSCheckRef.current);
          lastFPSCheckRef.current = now;
          setCurrentFPS(fps);

          // Check for degradation
          const degradeTo = monitorPerformanceAndDegrade(result.type, fps);
          if (degradeTo) {
            setRendererType(degradeTo);
            rendererRef.current.dispose();
            rendererRef.current = null;
            return; // Stop current animation, useEffect will restart with new renderer
          }
        }
      }

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animationIdRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [rendererType, forceFallback, config]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black" role="status" aria-live="polite">
      {/* WebGL Canvas (hidden for Canvas 2D) */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className={`font-mono ${rendererType === RendererType.WEBGL || rendererType === RendererType.WEBGL2 ? 'block' : 'hidden'}`}
        aria-label="Loading animation"
      />

      {/* Canvas 2D <pre> (hidden for WebGL) */}
      <pre
        ref={preRef}
        className={`font-mono text-pip-boy-green whitespace-pre text-xs sm:text-sm leading-tight ${rendererType === RendererType.CANVAS_2D || rendererType === RendererType.STATIC ? 'block' : 'hidden'}`}
        aria-label="Loading animation"
      />

      {/* Loading Message */}
      <p className="font-mono text-pip-boy-green/80 text-sm mt-4">{message}</p>

      {/* Dev Info */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="font-mono text-pip-boy-green/50 text-xs mt-2">
          <p>Renderer: {rendererType}</p>
          {currentFPS > 0 && <p>FPS: {currentFPS.toFixed(1)}</p>}
        </div>
      )}
    </div>
  );
}
```

**預估時間**：6 小時

---

### 任務 3.4: 單元測試 - RendererFactory

**目標**：為 RendererFactory 撰寫單元測試

**依賴**：任務 3.2

**步驟**：
1. 建立 `src/lib/__tests__/rendererFactory.test.ts`
2. 測試自動渲染器選擇
3. 測試降級邏輯
4. 測試 prefers-reduced-motion

**產出**：
- `src/lib/__tests__/rendererFactory.test.ts`

**驗收標準**：
- [x] 所有測試通過
- [x] 覆蓋所有降級情境

**預估時間**：4 小時

---

## Phase 4: 效能優化與測試

### 任務 4.1: 效能測試 - 桌面

**目標**：驗證桌面環境達到 60 FPS 目標

**依賴**：任務 3.3

**步驟**：
1. 在 Chrome DevTools 中錄製 Performance Profile
2. 測量 FPS
3. 分析 GPU 使用率
4. 分析記憶體使用

**產出**：
- 效能測試報告（Markdown）

**驗收標準**：
- [x] 桌面 FPS ≥ 60
- [x] GPU 使用率 < 40%
- [x] 記憶體使用 < 10 MB

**預估時間**：3 小時

---

### 任務 4.2: 效能測試 - 手機

**目標**：驗證手機環境達到 30+ FPS 目標

**依賴**：任務 3.3

**步驟**：
1. 在實際手機上測試（至少 3 台不同機型）
2. 測量 FPS
3. 測試降級策略是否正常運作

**產出**：
- 手機效能測試報告

**驗收標準**：
- [x] 手機 FPS ≥ 30（中階手機）
- [x] 手機 FPS ≥ 20（低階手機，觸發降級）
- [x] 降級策略正常運作

**預估時間**：4 小時

---

### 任務 4.3: E2E 測試 - 視覺回歸

**目標**：使用 Playwright 進行視覺回歸測試

**依賴**：任務 3.3

**步驟**：
1. 建立 `tests/e2e/webgl-ascii-donut.spec.ts`
2. 撰寫截圖比對測試
3. 撰寫 FPS 監控測試
4. 撰寫降級測試

**產出**：
- `tests/e2e/webgl-ascii-donut.spec.ts`

**驗收標準**：
- [x] 視覺回歸測試通過（至少 3 個不同角度的截圖）
- [x] FPS 測試通過
- [x] 降級測試通過

**預估時間**：5 小時

---

### 任務 4.4: 跨瀏覽器測試

**目標**：驗證在 Chrome, Firefox, Safari 上正常運作

**依賴**：任務 3.3

**步驟**：
1. 在 Chrome 測試
2. 在 Firefox 測試
3. 在 Safari 測試
4. 記錄任何相容性問題

**產出**：
- 跨瀏覽器測試報告

**驗收標準**：
- [x] Chrome 正常運作
- [x] Firefox 正常運作
- [x] Safari 正常運作
- [x] 所有瀏覽器效能達標或正確降級

**預估時間**：3 小時

---

### 任務 4.5: Shader 優化（若效能不達標）

**目標**：優化 Shader 程式碼以提升效能

**依賴**：任務 4.1, 4.2

**步驟**：
1. 分析 Shader 效能瓶頸
2. 使用向量運算取代標量運算
3. 減少不必要的計算
4. 重新測試效能

**產出**：
- 優化後的 Shader 程式碼

**驗收標準**：
- [x] 效能提升至少 10%
- [x] 視覺效果不變

**預估時間**：4 小時（若需要）

---

## Phase 5: 文件與發布

### 任務 5.1: 撰寫技術文件

**目標**：撰寫完整的技術文件

**依賴**：任務 4.4

**步驟**：
1. 更新 README.md
2. 撰寫 WebGL 實作說明
3. 撰寫效能優化指南
4. 撰寫除錯指南

**產出**：
- 更新的 README.md
- `docs/webgl-implementation.md`
- `docs/performance-guide.md`

**驗收標準**：
- [x] 文件清晰易懂
- [x] 包含程式碼範例
- [x] 包含效能數據

**預估時間**：4 小時

---

### 任務 5.2: Code Review 準備

**目標**：準備 PR 並進行 Code Review

**依賴**：任務 5.1

**步驟**：
1. 清理臨時檔案（poc.ts）
2. 確保所有測試通過
3. 執行 lint 和格式化
4. 撰寫詳細的 PR 描述

**產出**：
- 準備好的 PR

**驗收標準**：
- [x] 所有測試通過
- [x] Lint 無錯誤
- [x] PR 描述清晰

**預估時間**：2 小時

---

### 任務 5.3: 建立 Feature Flag 機制

**目標**：實作環境變數控制預設渲染器

**依賴**：任務 3.2

**步驟**：
1. 新增環境變數 `NEXT_PUBLIC_DEFAULT_RENDERER`
2. 更新 RendererFactory 讀取環境變數
3. 更新文件說明如何使用 Feature Flag

**產出**：
- 更新 `.env.example`
- 更新文件

**驗收標準**：
- [x] 環境變數正常運作
- [x] 可強制使用特定渲染器

**預估時間**：2 小時

---

### 任務 5.4: 發布與監控

**目標**：合併 PR 並監控生產環境

**依賴**：任務 5.2

**步驟**：
1. 合併 PR
2. 部署到 staging 環境
3. 驗證 staging 環境
4. 部署到 production 環境
5. 監控效能指標和錯誤率

**產出**：
- 生產環境部署
- 監控儀表板

**驗收標準**：
- [x] Production 部署成功
- [x] 無重大錯誤
- [x] 效能指標達標

**預估時間**：4 小時

---

## 風險與緩解

### 高風險任務

| 任務 | 風險 | 緩解措施 |
|------|------|---------|
| 任務 1.4 (PoC) | WebGL 字元渲染可能視覺效果不理想 | 若失敗，重新評估技術方案 |
| 任務 2.1 (Vertex Shader) | Shader 邏輯複雜，可能有數學錯誤 | 與 Canvas 2D 版本逐步比對驗證 |
| 任務 4.2 (手機效能) | 手機效能可能仍不達標 | 確保降級策略完善，保留 Canvas 2D 版本 |

### 時程風險

| 階段 | 預估時間 | 緩衝時間 | 總時間 |
|------|---------|---------|--------|
| Phase 1 | 16 小時 | 4 小時 | 2-3 天 |
| Phase 2 | 24 小時 | 8 小時 | 4-5 天 |
| Phase 3 | 17 小時 | 7 小時 | 2-3 天 |
| Phase 4 | 19 小時 | 5 小時 | 2-3 天 |
| Phase 5 | 12 小時 | 4 小時 | 1 天 |

**總計**：11-15 天

## 驗收標準總結

### 功能驗收

- [x] WebGL 版本成功渲染 ASCII donut
- [x] 視覺效果與 Canvas 2D 版本一致
- [x] 三級降級策略正常運作（WebGL → Canvas 2D → Static）
- [x] API 100% 與現有版本相容

### 效能驗收

- [x] 桌面 FPS ≥ 60（提升 2.5x）
- [x] 手機 FPS ≥ 30（提升 20x+）
- [x] 記憶體使用 < 10 MB
- [x] GPU 使用率 < 40%

### 品質驗收

- [x] 所有單元測試通過
- [x] 所有 E2E 測試通過
- [x] 跨瀏覽器測試通過
- [x] Code Review 通過

### 文件驗收

- [x] 技術文件完整
- [x] 效能數據記錄
- [x] 除錯指南清晰

## 附錄

### 開發環境設定

```bash
# 安裝依賴（無需新增，使用現有）
bun install

# 執行開發伺服器
bun run dev

# 執行測試
bun test

# 執行 E2E 測試
bun run test:e2e

# 強制使用 WebGL 渲染器（測試用）
# 訪問 http://localhost:3000/?renderer=webgl
```

### 效能監控工具

- Chrome DevTools Performance Tab
- React DevTools Profiler
- WebGL Inspector（Chrome Extension）
- Stats.js（FPS 監控）

### 參考資源

- [WebGL Fundamentals](https://webglfundamentals.org/)
- [MDN: WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [ASCII Art in WebGL](https://github.com/mattdesl/ascii-art-in-webgl)
- 現有規格：`.kiro/specs/ascii-donut-loading/`
