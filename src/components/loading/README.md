# Loading Components

ASCII 動畫 loading 元件系統，支援多種動畫類型和進度條顯示。

## 架構

```
AsciiLoading (統一介面)
├── AsciiDonutAnimation (純動畫)
├── AsciiNukaColaAnimation (純動畫)
└── LoadingProgressBar (進度條)
```

### 元件層級

#### 1. **AsciiLoading** - 統一 Loading 元件 ✨ 推薦使用

完整的 loading 畫面，包含動畫、進度條和訊息。

**使用範例：**

```tsx
import { AsciiLoading } from '@/components/loading/AsciiLoading'

// Nuka-Cola 瓶子動畫 (預設)
<AsciiLoading
  type="bottle"
  message="LOADING NUKA-COLA..."
  progress={50}
/>

// 甜甜圈動畫
<AsciiLoading
  type="donut"
  message="LOADING VAULT DATA..."
  progress={75}
/>

// 無進度條
<AsciiLoading
  type="bottle"
  message="INITIALIZING..."
/>
```

**Props：**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'donut' \| 'bottle'` | `'bottle'` | 動畫類型 |
| `message` | `string` | `'LOADING...'` | 載入訊息 |
| `progress` | `number` | `0` | 進度 (0-100)，0 時不顯示進度條 |
| `forceFallback` | `boolean` | `false` | 強制使用靜態模式 |
| `useWebGL` | `boolean` | `true` | 使用 WebGL 加速 |

---

#### 2. **LoadingProgressBar** - 獨立進度條元件

Pip-Boy 風格的進度條，可單獨使用。

**使用範例：**

```tsx
import { LoadingProgressBar } from '@/components/loading/LoadingProgressBar'

<LoadingProgressBar progress={65} />
```

**Props：**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | `number` | required | 進度 (0-100) |
| `className` | `string` | `''` | 自訂 CSS class |

---

#### 3. **AsciiDonutAnimation** - 純甜甜圈動畫

僅包含動畫，無容器、訊息或進度條。適合需要自訂布局的場景。

**使用範例：**

```tsx
import { AsciiDonutAnimation } from '@/components/loading/AsciiDonutAnimation'

<div className="my-custom-container">
  <AsciiDonutAnimation useWebGL={true} />
  <p>Custom message here</p>
</div>
```

---

#### 4. **AsciiNukaColaAnimation** - 純 Nuka-Cola 瓶子動畫

僅包含動畫，無容器、訊息或進度條。適合需要自訂布局的場景。

**使用範例：**

```tsx
import { AsciiNukaColaAnimation } from '@/components/loading/AsciiNukaColaAnimation'

<div className="my-custom-container">
  <AsciiNukaColaAnimation useWebGL={true} />
  <p>Custom message here</p>
</div>
```

---

#### 5. **AsciiDonutLoading** - 完整甜甜圈 Loading (舊版)

⚠️ **保留用於向後兼容**，新專案推薦使用 `AsciiLoading`。

包含動畫、進度條、訊息和容器的完整 loading 畫面。

---

#### 6. **AsciiNukaColaLoading** - 完整 Nuka-Cola Loading (舊版)

⚠️ **保留用於向後兼容**，新專案推薦使用 `AsciiLoading`。

包含動畫、訊息和容器的完整 loading 畫面（原本不支援進度條）。

---

## 效能特性

### 自動降級策略

1. **WebGL 模式** (預設，60 FPS)
   - GPU 加速渲染
   - 偵測到效能問題 (< 20 FPS) 自動降級到 CPU 模式

2. **CPU 模式** (24 FPS)
   - 純 JavaScript 渲染
   - 偵測到效能問題 (< 15 FPS) 自動降級到靜態模式

3. **靜態模式**
   - 預渲染的 ASCII art
   - 無動畫，最低效能需求

### 無障礙支援

- 遵守 `prefers-reduced-motion` 媒體查詢
- ARIA 屬性（`role="status"`, `aria-live="polite"`）
- 頁面可見性 API 支援（切換分頁時暫停動畫）

---

## 實際應用範例

### 首頁初始化 Loading

```tsx
// src/components/providers/ZustandAuthProvider.tsx
import { AsciiLoading } from '@/components/loading/AsciiLoading'

if (isHomePage) {
  return (
    <AsciiLoading
      type="bottle"
      message="INITIALIZING VAULT RESIDENT STATUS..."
      progress={progress}
    />
  )
}
```

### 資料載入 Loading

```tsx
const [loading, setLoading] = useState(true)
const [progress, setProgress] = useState(0)

if (loading) {
  return (
    <AsciiLoading
      type="donut"
      message="LOADING VAULT DATA..."
      progress={progress}
    />
  )
}
```

### 自訂布局

```tsx
<div className="custom-loading-layout">
  <h1>Vault-Tec Terminal</h1>
  <AsciiNukaColaAnimation />
  <LoadingProgressBar progress={80} />
  <p>Loading wasteland data...</p>
</div>
```

---

## 遷移指南

### 從 AsciiDonutLoading 遷移

**舊寫法：**
```tsx
<AsciiDonutLoading
  message="Loading..."
  progress={50}
/>
```

**新寫法：**
```tsx
<AsciiLoading
  type="donut"
  message="Loading..."
  progress={50}
/>
```

### 從 AsciiNukaColaLoading 遷移

**舊寫法：**
```tsx
<AsciiNukaColaLoading
  message="Loading..."
/>
```

**新寫法：**
```tsx
<AsciiLoading
  type="bottle"
  message="Loading..."
  progress={0}  // 可選，預設 0 不顯示進度條
/>
```

---

## 技術實作細節

### WebGL 渲染

- **Donut**: 使用 `WebGLQuadDonutRendererV2` + `DonutRotationController`
- **Bottle**: 使用 `WebGLQuadNukaColaRenderer` + ray-marching SDF

### CPU 渲染

- **Donut**: 使用 `DonutRenderer` (parametric torus equations)
- **Bottle**: 使用 `NukaColaRenderer` (bottle geometry with sections)

### 動畫控制

- `requestAnimationFrame` 驅動動畫循環
- FPS 追蹤和自動降級
- 頁面可見性 API 整合（避免背景執行）

---

## 檔案結構

```
src/components/loading/
├── AsciiLoading.tsx              # 統一介面 (推薦)
├── LoadingProgressBar.tsx        # 進度條元件
├── AsciiDonutAnimation.tsx       # 純甜甜圈動畫
├── AsciiNukaColaAnimation.tsx    # 純 Nuka-Cola 動畫
├── AsciiDonutLoading.tsx         # 完整甜甜圈 (舊版)
├── AsciiNukaColaLoading.tsx      # 完整 Nuka-Cola (舊版)
└── README.md                     # 本文件
```

---

## 開發建議

1. **預設使用 `AsciiLoading`**：提供統一介面和最佳實踐
2. **需要自訂布局時使用純動畫元件**：`AsciiDonutAnimation` / `AsciiNukaColaAnimation`
3. **進度條可選**：`progress={0}` 或不傳 `progress` prop 時不顯示進度條
4. **效能測試**：在低階裝置測試自動降級功能
5. **無障礙測試**：確保 `prefers-reduced-motion` 正常運作

---

## Credits

- **Donut Algorithm**: Based on [a1k0n's donut.c](https://www.a1k0n.net/2011/07/20/donut-math.html)
- **Bottle Design**: Nuka-Cola bottle from Fallout series
- **Implementation**: Wasteland Tarot Team
