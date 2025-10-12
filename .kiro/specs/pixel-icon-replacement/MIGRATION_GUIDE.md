# 遷移指南：pixelarticons → @hackernoon/pixel-icon-library

> 本文件說明如何從 pixelarticons (486 個圖示) 遷移到 @hackernoon/pixel-icon-library (1440+ 圖示)

## 📋 目錄

1. [遷移概述](#遷移概述)
2. [套件差異比較](#套件差異比較)
3. [安裝與設定](#安裝與設定)
4. [API 變更](#api-變更)
5. [圖示映射策略](#圖示映射策略)
6. [逐步遷移計畫](#逐步遷移計畫)
7. [驗證與測試](#驗證與測試)

---

## 遷移概述

### 為什麼要遷移？

| 項目 | pixelarticons | @hackernoon/pixel-icon-library | 差異 |
|------|---------------|-------------------------------|------|
| **圖示數量** | 486 個 | 1440+ 個（400+ 設計 × 4 變體） | +954 個圖示 |
| **尺寸支援** | 24px (單一尺寸) | 12px, 16px, 24px, 48px | 4 種尺寸 |
| **模式變體** | 無 | Light/Dark 模式 | 雙模式支援 |
| **格式** | SVG | SVG + PNG | 雙格式 |
| **授權** | MIT | CC BY 4.0 (圖示) + MIT (其他) | 商業友善 |

### 遷移目標

- ✅ 保持現有 `<PixelIcon>` API 向後相容
- ✅ 100% 圖示覆蓋率（找到所有 pixelarticons 的對應圖示）
- ✅ 保留 Phase 6 功能（animation, variant, sizePreset, decorative）
- ✅ 提升視覺品質和選擇多樣性
- ✅ 維持或改善效能指標

---

## 套件差異比較

### pixelarticons 使用方式

```typescript
// 目前的實作（需要改變）
import { iconRegistry } from '@/lib/iconRegistry';

// 圖示載入透過 fetch
const svgContent = await iconRegistry.getIcon('home');

// 圖示路徑
const iconPath = '/icons/pixelarticons/home.svg';
```

### @hackernoon/pixel-icon-library 使用方式

```typescript
// 方式 1: Icon Font（推薦用於大量圖示）
<link rel="stylesheet" href="path/to/iconfont.css">
<i class="hn hn-icon-name"></i>

// 方式 2: SVG Import（推薦用於 React）
import homeIcon from '@hackernoon/pixel-icon-library/icons/svg/home.svg';
<img src={homeIcon} alt="Home" />

// 方式 3: Dynamic Import（最佳效能）
const icon = await import(`@hackernoon/pixel-icon-library/icons/svg/${name}.svg`);
```

---

## 安裝與設定

### 1. 安裝套件

```bash
# 移除舊套件
bun remove pixelarticons

# 安裝新套件
bun add @hackernoon/pixel-icon-library
```

### 2. 探索套件結構

安裝後，檢查套件內容：

```bash
# 查看套件結構
ls -la node_modules/@hackernoon/pixel-icon-library/

# 預期結構：
# - /icons/svg/           # SVG 圖示檔案
# - /icons/png/           # PNG 圖示檔案
# - /fonts/               # Icon Font 檔案
# - /iconfont.css         # Icon Font CSS
# - package.json
```

### 3. TypeScript 型別定義

建立自訂型別定義（如果套件未提供）：

```typescript
// types/hackernoon-icons.d.ts
declare module '@hackernoon/pixel-icon-library/icons/svg/*.svg' {
  const content: string;
  export default content;
}

declare module '@hackernoon/pixel-icon-library' {
  export interface HackerNoonIcon {
    name: string;
    path: string;
    size: 12 | 16 | 24 | 48;
    mode: 'light' | 'dark';
  }
}
```

---

## API 變更

### PixelIcon 元件 Props

#### 保持不變的 Props（向後相容）

```typescript
interface PixelIconPropsBackwardCompatible {
  name: string;                    // ✅ 保持不變
  size?: number;                   // ✅ 保持不變
  className?: string;              // ✅ 保持不變
  'aria-label'?: string;           // ✅ 保持不變
  decorative?: boolean;            // ✅ 保持不變（Phase 6）
  animation?: AnimationType;       // ✅ 保持不變（Phase 6）
  variant?: VariantType;           // ✅ 保持不變（Phase 6）
  sizePreset?: SizePreset;         // ✅ 保持不變（Phase 6）
  onClick?: () => void;            // ✅ 保持不變
  style?: React.CSSProperties;     // ✅ 保持不變
}
```

#### 新增的 Props（HackerNoon 特有）

```typescript
interface PixelIconPropsNew {
  mode?: 'light' | 'dark';         // 🆕 選擇 Light/Dark 圖示變體
  format?: 'svg' | 'png';          // 🆕 選擇圖示格式
  originalSize?: 12 | 16 | 24 | 48; // 🆕 HackerNoon 原始尺寸（優化用）
}
```

### 使用範例

```typescript
// 基本使用（向後相容）
<PixelIcon name="home" />

// 使用新功能
<PixelIcon
  name="home"
  mode="light"
  format="svg"
  originalSize={24}
/>

// 保留 Phase 6 功能
<PixelIcon
  name="loader"
  animation="spin"
  variant="primary"
  sizePreset="md"
  decorative
/>

// 組合所有功能
<PixelIcon
  name="check"
  mode="light"
  format="svg"
  animation="bounce"
  variant="success"
  sizePreset="lg"
  aria-label="成功"
/>
```

---

## 圖示映射策略

### 1. 建立映射表

需要建立完整的映射表：`pixelarticons` → `@hackernoon/pixel-icon-library`

```typescript
// src/lib/iconMigrationMap.ts
export const pixelartToHackernoonMap: Record<string, string> = {
  // 導航
  'home': 'house',
  'user': 'user-circle',
  'settings': 'gear',

  // 動作
  'close': 'x',
  'check': 'check-mark',
  'trash': 'trash-can',

  // 音樂播放器
  'play': 'play-button',
  'pause': 'pause-button',
  'volume': 'volume-high',

  // ... 繼續映射其他圖示
};
```

### 2. 映射方法

```typescript
/**
 * 將 pixelarticons 圖示名稱轉換為 HackerNoon 圖示名稱
 */
export function mapIconName(pixelartName: string): string {
  const mapped = pixelartToHackernoonMap[pixelartName];

  if (!mapped) {
    console.warn(`Icon "${pixelartName}" not found in mapping table, using fallback`);
    return 'question-mark'; // fallback 圖示
  }

  return mapped;
}
```

### 3. 找不到對應圖示時的處理

```typescript
/**
 * 搜尋最接近的替代圖示
 */
export function findSimilarIcon(pixelartName: string): string[] {
  // 實作模糊搜尋邏輯
  const hackernoonIcons = getAllHackernoonIcons();

  return hackernoonIcons
    .filter(icon => icon.includes(pixelartName) || pixelartName.includes(icon))
    .slice(0, 5); // 返回前 5 個最接近的圖示
}
```

---

## 逐步遷移計畫

### Phase 1: 準備階段（1-2 天）

1. **安裝套件並探索**
   ```bash
   bun add @hackernoon/pixel-icon-library
   ```

2. **建立映射表骨架**
   - 掃描專案中所有使用的 pixelarticons 圖示
   - 建立初始映射表檔案

3. **設定 TypeScript 型別**
   - 建立型別定義檔案
   - 更新 `PixelIconProps` 介面

### Phase 2: 核心元件改造（2-3 天）

1. **更新 `iconRegistry.ts`**
   - 修改圖示載入邏輯以支援 HackerNoon 圖示
   - 實作雙圖示庫支援（過渡期間）

2. **更新 `iconMapping.ts`**
   - 整合映射表
   - 實作 `mapIconName()` 函式

3. **更新 `PixelIcon.tsx` 元件**
   - 新增 `mode` 和 `format` props
   - 更新圖示載入邏輯
   - 保持向後相容

### Phase 3: 映射表完成（3-5 天）

1. **逐一映射圖示**
   - 使用 `/icon-showcase` 頁面查找對應圖示
   - 完成所有 60-85 個圖示的映射

2. **視覺驗證**
   - 對比替換前後的視覺效果
   - 調整映射以確保視覺一致性

3. **產生遷移報告**
   - 列出所有映射成功的圖示
   - 列出需要手動處理的圖示

### Phase 4: 全域替換（1-2 天）

1. **批次替換**
   - 使用 `iconMigrationMap` 自動替換
   - 保持現有 API 不變

2. **更新文件**
   - 更新 README.md
   - 更新 USAGE.md
   - 建立 MIGRATION.md

### Phase 5: 測試與優化（2-3 天）

1. **功能測試**
   - 所有圖示正確顯示
   - Phase 6 功能正常運作
   - Fallback 機制正常

2. **效能測試**
   - Bundle 大小檢查（目標 ≤ 70KB gzipped）
   - FCP 測試（目標 < 1.5s）
   - 圖示載入速度（目標 < 150ms）

3. **無障礙測試**
   - axe-core 檢測通過
   - 鍵盤導航正常
   - 螢幕閱讀器相容

### Phase 6: 移除舊套件（1 天）

1. **確認遷移完成**
   - 所有頁面都使用新圖示
   - 無任何 pixelarticons 殘留

2. **移除舊套件**
   ```bash
   bun remove pixelarticons
   ```

3. **清理程式碼**
   - 移除過渡期的雙圖示庫支援程式碼
   - 移除舊的映射表

---

## 驗證與測試

### 自動化檢查腳本

```typescript
// scripts/verify-icon-migration.ts
import { Glob } from 'bun';

// 檢查是否還有 pixelarticons 的殘留使用
const glob = new Glob('**/*.{ts,tsx}');

for await (const file of glob.scan('.')) {
  const content = await Bun.file(file).text();

  if (content.includes('pixelarticons')) {
    console.warn(`Found pixelarticons reference in: ${file}`);
  }
}

console.log('✅ Migration verification complete');
```

### 視覺回歸測試

使用 Playwright 進行視覺回歸測試：

```typescript
// tests/visual/icon-migration.spec.ts
import { test, expect } from '@playwright/test';

test('Icon showcase page displays HackerNoon icons', async ({ page }) => {
  await page.goto('/icon-showcase');

  // 檢查是否有 HackerNoon 圖示
  const icons = await page.locator('[data-icon-source="hackernoon"]').count();
  expect(icons).toBeGreaterThan(0);

  // 視覺快照比對
  await expect(page).toHaveScreenshot('icon-showcase-hackernoon.png');
});
```

### 效能基準測試

```typescript
// tests/performance/icon-bundle-size.test.ts
import { expect, test } from 'bun:test';
import { readFileSync } from 'fs';

test('Icon bundle size is within limit', () => {
  const bundleStats = readFileSync('.next/analyze/bundle-stats.json', 'utf-8');
  const stats = JSON.parse(bundleStats);

  const iconBundleSize = stats.icons.gzipped;

  expect(iconBundleSize).toBeLessThanOrEqual(70 * 1024); // 70KB
});
```

---

## 常見問題 (FAQ)

### Q1: 找不到對應的 HackerNoon 圖示怎麼辦？

**A**: 使用 `/icon-showcase` 頁面的搜尋功能，或查看映射報告中的建議替代圖示。如果實在找不到，使用最接近的語義圖示。

### Q2: 是否需要同時支援兩個圖示庫？

**A**: 過渡期間建議保留雙支援，完成遷移後再移除 pixelarticons。

### Q3: Phase 6 的動畫效果會受影響嗎？

**A**: 不會，所有 Phase 6 功能都會保留，因為動畫是在 React 層級實作的，與底層圖示來源無關。

### Q4: Light/Dark 模式圖示何時啟用？

**A**: 初期先使用 Light 模式圖示，Dark 模式支援將在後續優化階段實作。

### Q5: 效能會受到影響嗎？

**A**: 透過 dynamic import 和 tree-shaking，bundle 大小目標控制在 70KB 以下，實際效能應該維持或略微提升。

---

## 參考資源

- [HackerNoon Pixel Icon Library GitHub](https://github.com/hackernoon/pixel-icon-library)
- [HackerNoon 官方網站](https://pixeliconlibrary.com)
- [pixelarticons 官方網站](https://pixelarticons.com)
- [專案 Icon Showcase 頁面](/icon-showcase)

---

**最後更新**: 2025-10-11
**狀態**: 遷移準備中
