# Wasteland Background Components

這些組件為廢土塔羅應用程式提供符合 Fallout 主題的動態背景效果。

## 組件

### WastelandBackground

核心背景組件，提供輻射粒子動畫、網格紋理、掃描線效果等視覺元素。

#### Props

- `variant`: 背景變體
  - `'default'`: 預設背景
  - `'homepage'`: 首頁專用背景
  - `'login'`: 登入頁面背景
  - `'dashboard'`: 控制台背景

- `animationIntensity`: 動畫強度
  - `'low'`: 低強度 (20 個粒子)
  - `'medium'`: 中等強度 (50 個粒子)
  - `'high'`: 高強度 (80 個粒子)

- `className`: 額外的 CSS 類別

#### 使用範例

```tsx
import { WastelandBackground } from '@/components/layout/WastelandBackground';

// 基本使用
<WastelandBackground />

// 自定義變體
<WastelandBackground variant="login" animationIntensity="high" />
```

### DynamicBackground

智能背景組件，根據當前路由自動選擇合適的背景變體。

#### 路由映射

- `/` → homepage 變體，medium 強度
- `/auth/login` → login 變體，high 強度
- `/auth/register` → login 變體，medium 強度
- `/dashboard/*` → dashboard 變體，low 強度
- 其他路由 → default 變體，medium 強度

#### 使用範例

```tsx
import { DynamicBackground } from '@/components/layout/DynamicBackground';

// 在 layout.tsx 中使用
<DynamicBackground />
```

## 特色功能

### 性能優化

1. **記憶化粒子生成**: 使用 `useMemo` 避免不必要的重新計算
2. **動態粒子數量**: 根據動畫強度調整粒子數量
3. **GPU 加速動畫**: 使用 CSS transforms 而非 JavaScript 動畫
4. **響應式調整**: 在移動設備上減少動畫複雜度

### 無障礙支援

1. **動作減少支援**: 遵循 `prefers-reduced-motion` 媒體查詢
2. **裝飾性元素**: 背景不會干擾螢幕閱讀器
3. **適當的 z-index**: 確保內容始終在背景之上

### 響應式設計

1. **移動優化**: 小螢幕設備上減少粒子數量和網格密度
2. **性能調整**: 在低性能設備上自動降低動畫強度

## CSS 變數

背景使用以下 CSS 變數，可在 `globals.css` 中自定義：

```css
--color-pip-boy-green: #00ff41;
--color-pip-boy-green-dark: #00ff88;
--color-pip-boy-green-medium: #008855;
--color-pip-boy-green-deep: #004433;
--color-vault-dark: #0c0c0c;
--color-vault-darker: #1a1a1a;
--color-vault-medium: #2d2d2d;
--color-vault-light: #3d3d3d;
--color-radiation-orange: #ff8800;
--color-radiation-orange-light: #ffaa33;
--color-radiation-yellow: #ffff00;
```

## 測試

組件包含完整的單元測試，包括：

- 基本渲染測試
- Props 驗證
- 性能優化驗證
- 無障礙支援測試

運行測試：

```bash
npm test -- --testPathPattern="WastelandBackground"
```