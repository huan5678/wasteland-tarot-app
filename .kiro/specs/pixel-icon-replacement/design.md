# Pixel 風格圖示系統替換 - 技術設計文件 (HackerNoon 版)

**版本**: 2.0
**日期**: 2025-10-11
**狀態**: 待審核
**目標**: 從 pixelarticons (486 個圖示) 遷移至 @hackernoon/pixel-icon-library (1440+ 個圖示)

---

## 1. 設計概述

### 1.1 遷移目標

將 Wasteland Tarot 平台的圖示系統從 `pixelarticons` 套件升級至 `@hackernoon/pixel-icon-library`，提供更豐富的圖示選擇、多尺寸支援和 Light/Dark 模式變體。

### 1.2 核心價值

| 功能 | pixelarticons (舊) | HackerNoon (新) | 提升 |
|------|-------------------|----------------|------|
| **圖示數量** | 486 個 | 1440+ 個 (400+ × 4 變體) | +954 個 |
| **尺寸選項** | 24px (單一) | 12px, 16px, 24px, 48px | 4 種尺寸 |
| **主題變體** | 無 | Light/Dark 模式 | 雙模式 |
| **格式支援** | SVG 僅 | SVG + PNG | 雙格式 |
| **授權** | MIT | CC BY 4.0 (圖示) + MIT (程式碼) | 商業友善 |

### 1.3 向後相容性保證

✅ **完全向後相容**：現有 `<PixelIcon>` API 保持不變
✅ **Phase 6 功能保留**：`animation`、`variant`、`sizePreset`、`decorative` 全部保留
✅ **平滑遷移**：可逐步替換，不需一次性改寫所有程式碼

---

## 2. 套件架構分析

### 2.1 HackerNoon Pixel Icon Library 套件結構

```
node_modules/@hackernoon/pixel-icon-library/
├── icons/
│   ├── svg/                    # SVG 格式圖示
│   │   ├── light/              # Light 模式變體
│   │   │   ├── 12px/
│   │   │   ├── 16px/
│   │   │   ├── 24px/
│   │   │   └── 48px/
│   │   └── dark/               # Dark 模式變體
│   │       ├── 12px/
│   │       ├── 16px/
│   │       ├── 24px/
│   │       └── 48px/
│   └── png/                    # PNG 格式圖示（結構同上）
│       ├── light/
│       └── dark/
├── fonts/                      # Icon Font 檔案（可選）
│   ├── iconfont.woff2
│   ├── iconfont.woff
│   └── iconfont.ttf
├── iconfont.css                # Icon Font CSS（可選）
└── package.json
```

**註**：實際套件結構需要在安裝後確認，此為基於 HackerNoon 文件的預估結構。

### 2.2 整合策略選擇

我們評估了三種整合策略：

| 策略 | 優點 | 缺點 | 決定 |
|------|------|------|------|
| **Icon Font** | 單次載入、CSS 控制簡單 | 無法 tree-shake、無障礙性較差 | ❌ 不採用 |
| **Static Import** | 最佳效能、完全 tree-shake | 需要提前知道所有圖示名稱 | ❌ 不可行 |
| **Dynamic Import** | 按需載入、支援快取、API 彈性高 | 略微複雜的實作 | ✅ **採用** |

**最終選擇**：**Dynamic Import with Registry Pattern**

**理由**：
- ✅ 支援動態圖示名稱（符合現有 `<PixelIcon name={iconName}>` 用法）
- ✅ 內建快取機制，避免重複載入
- ✅ 完整 tree-shaking，只打包使用到的圖示
- ✅ 支援 SSR/SSG，與 Next.js 15 完美整合
- ✅ 可預載關鍵圖示，優化 FCP

---

## 3. 系統架構設計

### 3.1 整體架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                     應用層 (App Layer)                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Header    │  │  Dashboard │  │  Readings  │  │  Settings │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │
│        │                │                │                │       │
└────────┼────────────────┼────────────────┼────────────────┼───────┘
         │                │                │                │
         └────────────────┴────────────────┴────────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────────────┐
│                     元件層 (Component Layer)                        │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │         <PixelIcon name="home" mode="light" />              │  │
│  │  統一的圖示元件介面（新增 mode, format, originalSize props）  │  │
│  └──────────────┬──────────────────────────────────────────────┘  │
│                 │                                                  │
│  ┌──────────────▼──────────────────────────────────────────────┐  │
│  │        HackerNoonIconRegistry (快取 + 載入邏輯)             │  │
│  └──────────────┬──────────────────────────────────────────────┘  │
│                 │                                                  │
│  ┌──────────────▼──────────────────────────────────────────────┐  │
│  │        Icon Mapping System                                  │  │
│  │  pixelarticons name → HackerNoon name                       │  │
│  │  (維護 486 個圖示的映射表)                                    │  │
│  └──────────────┬──────────────────────────────────────────────┘  │
└─────────────────┼─────────────────────────────────────────────────┘
                  │
┌─────────────────▼─────────────────────────────────────────────────┐
│                     資料層 (Data Layer)                            │
│  ┌──────────────────────────┐  ┌───────────────────────────────┐ │
│  │  @hackernoon/            │  │  Icon Metadata Registry       │ │
│  │  pixel-icon-library      │  │  (1440+ 圖示的名稱和路徑)      │ │
│  │  /icons/svg/light/24px/  │  │  (JSON 設定檔)                │ │
│  └──────────────────────────┘  └───────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### 3.2 目錄結構設計

```
src/
├── components/
│   └── ui/
│       ├── icons/
│       │   ├── PixelIcon.tsx              # 主要圖示元件（更新）
│       │   ├── iconMapping.ts             # pixelarticons → HackerNoon 映射表
│       │   ├── iconUtils.ts               # Phase 6 工具函式（保留）
│       │   └── __tests__/
│       │       └── PixelIcon.test.tsx     # 元件測試
│       └── ...
│
├── lib/
│   ├── iconRegistry.ts                    # 圖示註冊邏輯（重構為 HackerNoon）
│   └── hackernoonIconRegistry.ts          # 🆕 HackerNoon 專用快取和載入邏輯
│
└── types/
    └── icons.ts                           # TypeScript 型別定義（擴充）

node_modules/
└── @hackernoon/
    └── pixel-icon-library/                # HackerNoon npm 套件
        ├── icons/
        │   ├── svg/
        │   └── png/
        └── package.json
```

**新增檔案**：
- `src/lib/hackernoonIconRegistry.ts` - HackerNoon 圖示快取和載入邏輯
- `src/components/ui/icons/iconMapping.ts` - pixelarticons → HackerNoon 名稱映射表（完整 486 個圖示）

**修改檔案**：
- `src/components/ui/icons/PixelIcon.tsx` - 新增 `mode`, `format`, `originalSize` props
- `src/types/icons.ts` - 擴充 `PixelIconProps` 介面
- `src/lib/iconRegistry.ts` - 重構為委派給 `HackerNoonIconRegistry`

---

## 4. 核心元件設計

### 4.1 PixelIcon 元件 API（更新版）

```typescript
// src/types/icons.ts

/**
 * Phase 6: Visual Polish - Animation types
 */
export type AnimationType =
  | 'pulse'    // 脈衝
  | 'spin'     // 旋轉
  | 'bounce'   // 彈跳
  | 'ping'     // Ping 效果
  | 'fade'     // 淡入淡出
  | 'wiggle'   // 搖晃
  | 'float';   // 懸浮

/**
 * Phase 6: Visual Polish - Color variants
 */
export type VariantType =
  | 'default'   // 繼承顏色
  | 'primary'   // Pip-Boy Green
  | 'secondary' // Radiation Orange
  | 'success'   // Bright Green
  | 'warning'   // Warning Yellow
  | 'error'     // Deep Red
  | 'info'      // Vault Blue
  | 'muted';    // Gray

/**
 * Phase 6: Visual Polish - Size presets
 */
export type SizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * HackerNoon-specific: Light/Dark mode
 */
export type IconMode = 'light' | 'dark';

/**
 * HackerNoon-specific: Icon format
 */
export type IconFormat = 'svg' | 'png';

/**
 * HackerNoon-specific: Original icon sizes
 */
export type OriginalIconSize = 12 | 16 | 24 | 48;

/**
 * PixelIcon 元件的 props（向後相容 + 新功能）
 */
export interface PixelIconProps {
  // ========== 向後相容的 Props（Phase 1-6）==========
  /**
   * 圖示名稱（自動映射 pixelarticons → HackerNoon）
   */
  name: string;

  /**
   * 圖示尺寸（像素）
   * @default 24
   */
  size?: number;

  /**
   * 自訂 CSS 類別
   */
  className?: string;

  /**
   * 無障礙標籤（互動式圖示必須提供）
   */
  'aria-label'?: string;

  /**
   * 是否為裝飾性圖示（不需要無障礙標籤）
   * @default false
   */
  decorative?: boolean;

  /**
   * 自訂內聯樣式
   */
  style?: React.CSSProperties;

  /**
   * 點擊事件處理器
   */
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;

  /**
   * 滑鼠懸停事件處理器
   */
  onMouseEnter?: (event: React.MouseEvent<HTMLSpanElement>) => void;

  /**
   * 滑鼠離開事件處理器
   */
  onMouseLeave?: (event: React.MouseEvent<HTMLSpanElement>) => void;

  // ========== Phase 6: Visual Polish Props ==========
  /**
   * 動畫效果（Phase 6）
   */
  animation?: AnimationType;

  /**
   * 顏色變體（Phase 6）
   */
  variant?: VariantType;

  /**
   * 尺寸預設（Phase 6，優先級高於 size）
   */
  sizePreset?: SizePreset;

  // ========== HackerNoon 新增 Props ==========
  /**
   * 🆕 Light/Dark 模式
   * @default 'light'
   */
  mode?: IconMode;

  /**
   * 🆕 圖示格式
   * @default 'svg'
   */
  format?: IconFormat;

  /**
   * 🆕 HackerNoon 原始尺寸（用於效能優化）
   * 如果指定，會優先使用對應尺寸的圖示檔案，避免縮放
   * @default 24
   */
  originalSize?: OriginalIconSize;
}
```

### 4.2 HackerNoonIconRegistry 類別設計

```typescript
// src/lib/hackernoonIconRegistry.ts

/**
 * HackerNoon Pixel Icon Library 的圖示快取和載入管理器
 */
export class HackerNoonIconRegistry {
  /**
   * 圖示快取（Memory Cache）
   * Key 格式："{name}-{mode}-{format}-{size}"
   */
  private cache = new Map<string, string>();

  /**
   * 預載入的圖示名稱清單（關鍵圖示）
   */
  private preloadedIcons = new Set<string>();

  /**
   * 載入圖示
   *
   * @param name - HackerNoon 圖示名稱
   * @param mode - Light/Dark 模式
   * @param format - SVG/PNG 格式
   * @param size - 原始圖示尺寸
   * @returns SVG/PNG 內容字串
   */
  async getIcon(
    name: string,
    mode: IconMode = 'light',
    format: IconFormat = 'svg',
    size: OriginalIconSize = 24
  ): Promise<string> {
    const cacheKey = this.getCacheKey(name, mode, format, size);

    // 檢查快取
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 載入圖示
    const iconPath = this.getIconPath(name, mode, format, size);

    try {
      const response = await fetch(iconPath);

      if (!response.ok) {
        throw new Error(`Failed to load icon: ${name} (${iconPath})`);
      }

      const content = format === 'svg'
        ? await response.text()
        : await this.convertToDataURL(response);

      // 儲存到快取
      this.cache.set(cacheKey, content);

      return content;
    } catch (error) {
      console.error(`Icon load error: ${name}`, error);
      throw error;
    }
  }

  /**
   * 預載入關鍵圖示（在應用啟動時呼叫）
   */
  async preloadCriticalIcons(names: string[]): Promise<void> {
    const promises = names.map(async (name) => {
      try {
        await this.getIcon(name, 'light', 'svg', 24);
        this.preloadedIcons.add(name);
      } catch (error) {
        console.warn(`Failed to preload icon: ${name}`);
      }
    });

    await Promise.all(promises);
    console.log(`✅ Preloaded ${this.preloadedIcons.size} critical icons`);
  }

  /**
   * 建構圖示路徑
   */
  private getIconPath(
    name: string,
    mode: IconMode,
    format: IconFormat,
    size: OriginalIconSize
  ): string {
    // 路徑格式：node_modules/@hackernoon/pixel-icon-library/icons/{format}/{mode}/{size}px/{name}.{format}
    return `/node_modules/@hackernoon/pixel-icon-library/icons/${format}/${mode}/${size}px/${name}.${format}`;
  }

  /**
   * 建構快取鍵
   */
  private getCacheKey(
    name: string,
    mode: IconMode,
    format: IconFormat,
    size: OriginalIconSize
  ): string {
    return `${name}-${mode}-${format}-${size}`;
  }

  /**
   * 將 PNG Response 轉換為 Data URL（用於 <img> src）
   */
  private async convertToDataURL(response: Response): Promise<string> {
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.cache.clear();
    this.preloadedIcons.clear();
    console.log('🧹 Icon cache cleared');
  }

  /**
   * 取得快取統計資訊
   */
  getCacheStats(): { size: number; preloaded: number } {
    return {
      size: this.cache.size,
      preloaded: this.preloadedIcons.size,
    };
  }
}

/**
 * 全域單例實例
 */
export const hackernoonIconRegistry = new HackerNoonIconRegistry();
```

### 4.3 圖示映射系統

```typescript
// src/components/ui/icons/iconMapping.ts

/**
 * pixelarticons 圖示名稱 → HackerNoon 圖示名稱的映射表
 *
 * 目的：保持向後相容，使用者可以繼續使用舊的圖示名稱
 *
 * 建立策略：
 * 1. 分析專案中所有使用的 pixelarticons 圖示（估計 60-85 個）
 * 2. 在 HackerNoon 圖示庫中找到對應或最接近的圖示
 * 3. 建立 1:1 映射表
 * 4. 對於找不到的圖示，使用最相似的替代圖示
 */
export const pixelartToHackernoonMap: Record<string, string> = {
  // ========== Navigation ==========
  'home': 'house',                    // 首頁
  'menu': 'hamburger-menu',           // 選單
  'close': 'x',                       // 關閉
  'chevron-left': 'chevron-left',     // 左箭頭
  'chevron-right': 'chevron-right',   // 右箭頭
  'chevron-up': 'chevron-up',         // 上箭頭
  'chevron-down': 'chevron-down',     // 下箭頭
  'arrow-left': 'arrow-left',         // 左箭頭（長）
  'arrow-right': 'arrow-right',       // 右箭頭（長）
  'arrow-up': 'arrow-up',             // 上箭頭（長）
  'arrow-down': 'arrow-down',         // 下箭頭（長）

  // ========== User & Auth ==========
  'user': 'user-circle',              // 使用者
  'login': 'sign-in',                 // 登入
  'logout': 'sign-out',               // 登出
  'settings': 'gear',                 // 設定
  'profile': 'id-card',               // 個人檔案

  // ========== Actions ==========
  'search': 'magnifying-glass',       // 搜尋
  'plus': 'plus',                     // 新增
  'minus': 'minus',                   // 減少
  'edit': 'pencil',                   // 編輯
  'trash': 'trash-can',               // 刪除
  'download': 'download',             // 下載
  'upload': 'upload',                 // 上傳
  'share': 'share',                   // 分享
  'copy': 'copy',                     // 複製
  'cut': 'scissors',                  // 剪下
  'paste': 'clipboard',               // 貼上
  'reload': 'refresh',                // 重新載入
  'sync': 'sync',                     // 同步

  // ========== Status & Feedback ==========
  'check': 'check-mark',              // 勾選
  'check-circle': 'check-circle',     // 勾選圈
  'x-circle': 'x-circle',             // 錯誤圈
  'alert-circle': 'exclamation-circle', // 警告圈
  'info': 'info-circle',              // 資訊
  'help': 'question-mark',            // 幫助
  'alert-triangle': 'warning',        // 警告三角形

  // ========== Media & Content ==========
  'image': 'image',                   // 圖片
  'file': 'document',                 // 檔案
  'folder': 'folder',                 // 資料夾
  'music': 'music-note',              // 音樂
  'play': 'play-button',              // 播放
  'pause': 'pause-button',            // 暫停
  'stop': 'stop-button',              // 停止
  'volume': 'volume-high',            // 音量
  'volume-mute': 'volume-off',        // 靜音
  'shuffle': 'shuffle',               // 隨機播放
  'repeat': 'repeat',                 // 重複播放

  // ========== Social ==========
  'heart': 'heart',                   // 喜愛
  'star': 'star',                     // 星星
  'message': 'chat-bubble',           // 訊息
  'mail': 'envelope',                 // 郵件
  'bell': 'bell',                     // 通知

  // ========== System ==========
  'wifi': 'wifi',                     // Wi-Fi
  'wifi-off': 'wifi-off',             // Wi-Fi 關閉
  'battery': 'battery-full',          // 電池
  'power': 'power',                   // 電源
  'lock': 'lock',                     // 鎖定
  'unlock': 'unlock',                 // 解鎖
  'eye': 'eye',                       // 可見
  'eye-off': 'eye-slash',             // 隱藏
  'calendar': 'calendar',             // 日曆
  'clock': 'clock',                   // 時鐘

  // ========== Tarot-specific ==========
  'cards': 'playing-cards',           // 卡牌
  'shuffle-cards': 'shuffle',         // 洗牌
  'draw-card': 'hand',                // 抽牌
  'reading': 'book-open',             // 解讀

  // 更多映射將在實作階段補充...
};

/**
 * 將 pixelarticons 圖示名稱轉換為 HackerNoon 圖示名稱
 *
 * @param pixelartName - pixelarticons 圖示名稱
 * @returns HackerNoon 圖示名稱
 */
export function mapIconName(pixelartName: string): string {
  const mapped = pixelartToHackernoonMap[pixelartName];

  if (!mapped) {
    console.warn(
      `Icon "${pixelartName}" not found in mapping table. ` +
      `Using original name as fallback. ` +
      `Please add mapping to iconMapping.ts`
    );
    return pixelartName; // 嘗試使用原名稱（可能在 HackerNoon 中同名存在）
  }

  return mapped;
}

/**
 * 取得圖示路徑（包含映射邏輯）
 *
 * @param name - 圖示名稱（pixelarticons 或 HackerNoon 皆可）
 * @param mode - Light/Dark 模式
 * @param format - SVG/PNG 格式
 * @param size - 原始圖示尺寸
 * @returns 圖示路徑
 */
export function getIconPath(
  name: string,
  mode: IconMode = 'light',
  format: IconFormat = 'svg',
  size: OriginalIconSize = 24
): string {
  const hackernoonName = mapIconName(name);
  return `/node_modules/@hackernoon/pixel-icon-library/icons/${format}/${mode}/${size}px/${hackernoonName}.${format}`;
}

/**
 * 取得 fallback 圖示名稱
 */
export function getFallbackIcon(): string {
  return 'question-mark'; // HackerNoon 的問號圖示
}

/**
 * 檢查圖示是否已映射
 */
export function isMapped(pixelartName: string): boolean {
  return pixelartName in pixelartToHackernoonMap;
}

/**
 * 取得所有已映射的圖示名稱
 */
export function getAllMappedIcons(): string[] {
  return Object.keys(pixelartToHackernoonMap);
}

/**
 * 搜尋相似的圖示名稱（用於映射表缺失時的建議）
 */
export function findSimilarIcons(pixelartName: string): string[] {
  const allHackernoonNames = Object.values(pixelartToHackernoonMap);
  const lowerQuery = pixelartName.toLowerCase();

  return allHackernoonNames
    .filter(name =>
      name.toLowerCase().includes(lowerQuery) ||
      lowerQuery.includes(name.toLowerCase())
    )
    .slice(0, 5); // 返回前 5 個最接近的圖示
}
```

### 4.4 PixelIcon 元件實作（更新版）

```typescript
// src/components/ui/icons/PixelIcon.tsx

'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { PixelIconProps, IconMode, IconFormat, OriginalIconSize } from '@/types/icons';
import { mapIconName, getFallbackIcon } from './iconMapping';
import { hackernoonIconRegistry } from '@/lib/hackernoonIconRegistry';
import { getIconSize, composeIconClasses } from './iconUtils';

/**
 * Pixel 風格圖示元件（HackerNoon 版）
 *
 * 基於 @hackernoon/pixel-icon-library 套件的 React 包裝器
 * 支援動態載入、快取、fallback 機制和完整的無障礙功能
 *
 * @component
 *
 * @example
 * ```tsx
 * // 基本使用（向後相容）
 * <PixelIcon name="home" />
 *
 * // 使用 HackerNoon 新功能
 * <PixelIcon name="home" mode="dark" format="svg" originalSize={24} />
 *
 * // 使用 Phase 6 功能
 * <PixelIcon
 *   name="loader"
 *   animation="spin"
 *   variant="primary"
 *   sizePreset="md"
 *   decorative
 * />
 *
 * // 組合所有功能
 * <PixelIcon
 *   name="check"
 *   mode="light"
 *   format="svg"
 *   originalSize={24}
 *   animation="bounce"
 *   variant="success"
 *   sizePreset="lg"
 *   aria-label="成功"
 * />
 * ```
 */
export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size,
  sizePreset,
  animation,
  variant,
  mode = 'light',           // 🆕 HackerNoon: Light/Dark 模式
  format = 'svg',           // 🆕 HackerNoon: SVG/PNG 格式
  originalSize = 24,        // 🆕 HackerNoon: 原始圖示尺寸
  className = '',
  'aria-label': ariaLabel,
  decorative = false,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [iconContent, setIconContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  /**
   * 載入圖示的核心邏輯（支援 HackerNoon）
   */
  const loadIcon = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // 映射 pixelarticons 名稱 → HackerNoon 名稱
      const hackernoonName = mapIconName(name);

      // 從 HackerNoon Registry 載入圖示
      const content = await hackernoonIconRegistry.getIcon(
        hackernoonName,
        mode,
        format,
        originalSize
      );

      setIconContent(content);
      setIsLoading(false);
    } catch (error) {
      console.warn(`Icon "${name}" not found, using fallback`, error);

      // 載入失敗時使用 fallback 圖示
      try {
        const fallbackName = getFallbackIcon();
        const fallbackContent = await hackernoonIconRegistry.getIcon(
          fallbackName,
          mode,
          format,
          originalSize
        );

        setIconContent(fallbackContent);
        setHasError(true);
        setIsLoading(false);
      } catch (fallbackError) {
        console.error('Failed to load fallback icon', fallbackError);
        setIsLoading(false);
        setHasError(true);
        setIconContent(null);
      }
    }
  }, [name, mode, format, originalSize]);

  /**
   * 當圖示名稱或配置改變時重新載入
   */
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isMounted) {
        await loadIcon();
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [loadIcon]);

  /**
   * 無障礙屬性
   */
  const a11yProps = useMemo(() => {
    if (decorative) {
      return { 'aria-hidden': true as const };
    }

    return {
      'aria-label': ariaLabel || name,
      role: 'img' as const,
    };
  }, [decorative, ariaLabel, name]);

  /**
   * 計算最終尺寸（優先使用 sizePreset）
   */
  const finalSize = useMemo(() => getIconSize(size, sizePreset), [size, sizePreset]);

  /**
   * 組合後的樣式
   */
  const containerStyle = useMemo(
    () => ({
      width: finalSize,
      height: finalSize,
      minWidth: finalSize,
      minHeight: finalSize,
      ...style,
    }),
    [finalSize, style]
  );

  /**
   * 組合後的 CSS 類別（包含 Phase 6 動畫和變體）
   */
  const containerClassName = useMemo(() => {
    const baseClasses = 'inline-flex items-center justify-center';
    return composeIconClasses(baseClasses, animation, variant, className, onClick);
  }, [animation, variant, className, onClick]);

  /**
   * 如果載入中，顯示佔位符
   */
  if (isLoading || !iconContent) {
    return (
      <span
        className={`inline-block animate-pulse bg-pip-boy-green/20 rounded ${className}`}
        style={containerStyle}
        {...a11yProps}
      />
    );
  }

  /**
   * 如果有錯誤且沒有內容，顯示錯誤佔位符
   */
  if (hasError && !iconContent) {
    return (
      <span
        className={`inline-block bg-red-500/20 rounded ${className}`}
        style={containerStyle}
        title={`Icon "${name}" failed to load`}
        {...a11yProps}
      >
        <span className="text-red-500 text-xs">?</span>
      </span>
    );
  }

  /**
   * 渲染圖示
   * - SVG：使用 dangerouslySetInnerHTML 嵌入
   * - PNG：使用 <img> 標籤（Data URL）
   */
  if (format === 'png') {
    return (
      <span
        className={containerClassName}
        style={containerStyle}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...a11yProps}
      >
        <img
          src={iconContent}
          alt={ariaLabel || name}
          style={{ width: '100%', height: '100%' }}
        />
      </span>
    );
  }

  // SVG 渲染（預設）
  return (
    <span
      className={containerClassName}
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...a11yProps}
      dangerouslySetInnerHTML={{ __html: iconContent }}
    />
  );
};

PixelIcon.displayName = 'PixelIcon';

export default PixelIcon;
```

---

## 5. 遷移策略

### 5.1 遷移階段規劃（6 階段）

#### **Phase 1: 準備階段（1-2 天）**

**目標**：安裝套件、探索結構、建立映射表骨架

**任務**：
1. ✅ 安裝 `@hackernoon/pixel-icon-library`
   ```bash
   bun add @hackernoon/pixel-icon-library
   ```

2. ✅ 探索套件結構
   ```bash
   ls -la node_modules/@hackernoon/pixel-icon-library/
   tree node_modules/@hackernoon/pixel-icon-library/icons/
   ```

3. ✅ 掃描專案中所有使用的 pixelarticons 圖示
   ```bash
   grep -r "PixelIcon.*name=" src/ --include="*.tsx" --include="*.ts" | grep -o 'name="[^"]*"' | sort -u
   ```

4. ✅ 建立初始映射表檔案 `src/components/ui/icons/iconMapping.ts`
   - 列出所有掃描到的 pixelarticons 圖示名稱
   - 為每個圖示預留映射欄位（待手動填入）

5. ✅ 建立 TypeScript 型別定義
   - 更新 `src/types/icons.ts`
   - 新增 `IconMode`, `IconFormat`, `OriginalIconSize` 型別
   - 擴充 `PixelIconProps` 介面

**驗收標準**：
- [ ] 套件成功安裝且可 import
- [ ] 映射表骨架建立完成（含所有專案使用的圖示）
- [ ] TypeScript 編譯無錯誤

---

#### **Phase 2: 核心元件改造（2-3 天）**

**目標**：更新核心元件以支援 HackerNoon

**任務**：
1. ✅ 建立 `HackerNoonIconRegistry` 類別
   - 實作 `getIcon()` 方法（支援 mode, format, size）
   - 實作快取機制
   - 實作預載入方法

2. ✅ 更新 `iconMapping.ts`
   - 實作 `mapIconName()` 函式
   - 實作 `getIconPath()` 函式（含 mode, format, size 參數）
   - 實作 `findSimilarIcons()` 函式（映射建議）

3. ✅ 更新 `PixelIcon.tsx` 元件
   - 新增 `mode`, `format`, `originalSize` props
   - 更新圖示載入邏輯（使用 `HackerNoonIconRegistry`）
   - 保持向後相容（舊 props 仍可用）
   - 保留 Phase 6 功能（animation, variant, sizePreset）

4. ✅ 更新 `iconUtils.ts`
   - 確保 Phase 6 工具函式正常運作
   - 新增 HackerNoon 相關的工具函式（如需要）

**驗收標準**：
- [ ] `HackerNoonIconRegistry` 可正常載入圖示
- [ ] `PixelIcon` 元件可使用新 props（`mode`, `format`, `originalSize`）
- [ ] 向後相容性測試通過（舊程式碼不需修改即可運作）
- [ ] Phase 6 功能正常（animation, variant, sizePreset）

---

#### **Phase 3: 映射表完成（3-5 天）**

**目標**：完成所有圖示的映射，確保 100% 覆蓋率

**任務**：
1. ✅ 逐一映射圖示（估計 60-85 個圖示）
   - 使用 `/icon-showcase` 頁面（需先建立）或 HackerNoon 官網查找對應圖示
   - 手動填入 `pixelartToHackernoonMap` 映射表

2. ✅ 視覺驗證
   - 建立臨時頁面 `/test/icon-comparison`
   - 對比替換前後的視覺效果
   - 調整映射以確保視覺一致性

3. ✅ 產生遷移報告
   - 列出所有映射成功的圖示
   - 列出需要手動處理的圖示（找不到完美對應）
   - 列出建議的替代圖示

4. ✅ 建立 `/icon-showcase` 頁面（開發者工具）
   - 顯示所有 HackerNoon 圖示（1440+ 個）
   - 支援搜尋和篩選
   - 顯示圖示名稱、尺寸、模式變體

**驗收標準**：
- [ ] 所有專案使用的圖示都有對應的 HackerNoon 映射
- [ ] 視覺效果經過設計師審核通過
- [ ] 遷移報告產生完成

---

#### **Phase 4: 全域替換（1-2 天）**

**目標**：使用新的圖示系統，無需修改現有程式碼

**任務**：
1. ✅ 測試向後相容性
   - 執行全站測試，確認所有頁面的圖示正常顯示
   - 確認 Phase 6 功能正常運作

2. ✅ 更新文件
   - 更新 `src/components/ui/icons/README.md`
   - 建立 `MIGRATION_GUIDE.md`（HackerNoon 版）
   - 更新 `CLAUDE.md`（移除 pixelarticons 相關說明）

3. ✅ 清理舊程式碼（可選）
   - 移除 `pixelarticons` 依賴（如果不再需要）
   - 移除舊的 `iconRegistry.ts`（如果已完全替換）

**驗收標準**：
- [ ] 所有頁面的圖示顯示正常
- [ ] 無 console 錯誤或警告
- [ ] 文件更新完成

---

#### **Phase 5: 測試與優化（2-3 天）**

**目標**：全面測試、效能優化、無障礙性驗證

**任務**：
1. ✅ 功能測試
   - 所有圖示正確顯示
   - Phase 6 功能正常運作（animation, variant, sizePreset）
   - Fallback 機制正常（載入失敗時顯示 fallback 圖示）
   - Light/Dark 模式切換正常

2. ✅ 效能測試
   - Bundle 大小檢查（目標 ≤ 70KB gzipped for icon system）
   - FCP 測試（目標 < 1.5s）
   - 圖示載入速度（目標 < 150ms）
   - 快取機制驗證

3. ✅ 無障礙性測試
   - axe-core 檢測通過（無違規）
   - 鍵盤導航正常
   - 螢幕閱讀器相容（NVDA, JAWS, VoiceOver）
   - 對比度測試通過（WCAG 2.1 AA）

4. ✅ 視覺回歸測試
   - Playwright 截圖比對（所有主要頁面）
   - 確認無非預期的視覺變化

**驗收標準**：
- [ ] 所有測試通過
- [ ] 效能指標達標
- [ ] 無障礙性 100% 合規

---

#### **Phase 6: 部署與清理（1 天）**

**目標**：移除舊套件、清理程式碼、部署上線

**任務**：
1. ✅ 確認遷移完成
   - 檢查是否有任何 `pixelarticons` 殘留
   - 確認所有頁面都使用 HackerNoon 圖示

2. ✅ 移除舊套件
   ```bash
   bun remove pixelarticons
   ```

3. ✅ 清理程式碼
   - 移除過渡期的雙圖示庫支援程式碼（如有）
   - 移除舊的映射表（如有）
   - 移除臨時測試頁面（如 `/test/icon-comparison`）

4. ✅ 部署上線
   - 執行 production build
   - 驗證 production 環境運作正常
   - 監控錯誤日誌

**驗收標準**：
- [ ] 無 `pixelarticons` 殘留
- [ ] Production build 成功
- [ ] 線上環境運作正常

---

### 5.2 映射完成度追蹤

**目標**：486 個 pixelarticons 圖示 → 100% 映射到 HackerNoon

| 分類 | 圖示數量 | 映射完成 | 狀態 |
|------|---------|---------|------|
| Navigation | ~50 | 0/50 | ⏳ 待開始 |
| User & Auth | ~20 | 0/20 | ⏳ 待開始 |
| Actions | ~80 | 0/80 | ⏳ 待開始 |
| Status & Feedback | ~30 | 0/30 | ⏳ 待開始 |
| Media & Content | ~60 | 0/60 | ⏳ 待開始 |
| Social | ~20 | 0/20 | ⏳ 待開始 |
| System | ~40 | 0/40 | ⏳ 待開始 |
| Tarot-specific | ~20 | 0/20 | ⏳ 待開始 |
| Others | ~166 | 0/166 | ⏳ 待開始 |
| **總計** | **486** | **0/486** | **0%** |

**映射策略**：
1. **第一優先**：專案實際使用的圖示（估計 60-85 個）
2. **第二優先**：常用的通用圖示（Navigation, Actions, Status）
3. **第三優先**：其餘圖示（按分類依序完成）

---

## 6. 效能優化策略

### 6.1 Bundle 大小優化

**目標**：圖示系統 Bundle ≤ 70KB gzipped

**策略**：

1. **Dynamic Import**（已採用）
   - 圖示按需載入，不會打包所有 1440+ 圖示
   - 只打包實際使用的圖示

2. **Tree-shaking**
   ```typescript
   // next.config.ts
   const nextConfig = {
     webpack: (config) => {
       // 只打包使用到的圖示
       config.optimization.usedExports = true;
       config.optimization.sideEffects = false;

       return config;
     },
   };
   ```

3. **關鍵圖示預載入**
   - 只預載入首頁關鍵圖示（< 10 個）
   - 其餘圖示按需載入

4. **格式選擇優化**
   - 預設使用 SVG（檔案更小）
   - 只有在需要時才使用 PNG

### 6.2 圖示預載入策略

```typescript
// src/app/layout.tsx

'use client';

import { useEffect } from 'react';
import { hackernoonIconRegistry } from '@/lib/hackernoonIconRegistry';

/**
 * 關鍵圖示清單（首頁必須的圖示）
 */
const CRITICAL_ICONS = [
  'house',           // home → house
  'hamburger-menu',  // menu → hamburger-menu
  'user-circle',     // user → user-circle
  'magnifying-glass', // search → magnifying-glass
  'gear',            // settings → gear
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 預載入關鍵圖示
    hackernoonIconRegistry.preloadCriticalIcons(CRITICAL_ICONS);
  }, []);

  return (
    <html lang="zh-TW">
      <head>
        {/* HackerNoon 圖示預載入提示 */}
        <link
          rel="preconnect"
          href="/node_modules/@hackernoon/pixel-icon-library"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 6.3 快取策略

**快取層級**：

1. **Memory Cache**（已實作於 `HackerNoonIconRegistry`）
   - 儲存已載入的圖示內容
   - 避免重複 fetch

2. **Browser Cache**（HTTP Headers）
   ```typescript
   // next.config.ts
   const nextConfig = {
     async headers() {
       return [
         {
           source: '/node_modules/@hackernoon/pixel-icon-library/icons/:path*',
           headers: [
             {
               key: 'Cache-Control',
               value: 'public, max-age=31536000, immutable', // 1 年
             },
           ],
         },
       ];
     },
   };
   ```

3. **Service Worker Cache**（未來優化）
   - 使用 Service Worker 快取所有已使用的圖示
   - 離線支援

### 6.4 尺寸選擇優化

**原則**：使用最接近的原始尺寸，避免縮放

```typescript
/**
 * 根據顯示尺寸選擇最佳的原始圖示尺寸
 */
function getBestOriginalSize(displaySize: number): OriginalIconSize {
  if (displaySize <= 12) return 12;
  if (displaySize <= 16) return 16;
  if (displaySize <= 24) return 24;
  return 48; // 48px 是最大的原始尺寸
}

// 使用範例
<PixelIcon
  name="home"
  size={32}
  originalSize={getBestOriginalSize(32)} // 自動選擇 48px
/>
```

---

## 7. 測試策略

### 7.1 單元測試

```typescript
// src/components/ui/icons/__tests__/PixelIcon.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { PixelIcon } from '../PixelIcon';
import { hackernoonIconRegistry } from '@/lib/hackernoonIconRegistry';

// Mock HackerNoonIconRegistry
jest.mock('@/lib/hackernoonIconRegistry', () => ({
  hackernoonIconRegistry: {
    getIcon: jest.fn(),
  },
}));

describe('PixelIcon (HackerNoon)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render icon with HackerNoon registry', async () => {
    const mockSvg = '<svg>...</svg>';
    (hackernoonIconRegistry.getIcon as jest.Mock).mockResolvedValue(mockSvg);

    render(<PixelIcon name="home" aria-label="首頁" />);

    await waitFor(() => {
      expect(screen.getByLabelText('首頁')).toBeInTheDocument();
    });

    expect(hackernoonIconRegistry.getIcon).toHaveBeenCalledWith(
      'house',      // pixelarticons 'home' → HackerNoon 'house'
      'light',      // 預設 light 模式
      'svg',        // 預設 svg 格式
      24            // 預設 24px 尺寸
    );
  });

  it('should support mode prop', async () => {
    const mockSvg = '<svg>...</svg>';
    (hackernoonIconRegistry.getIcon as jest.Mock).mockResolvedValue(mockSvg);

    render(<PixelIcon name="home" mode="dark" aria-label="首頁" />);

    await waitFor(() => {
      expect(hackernoonIconRegistry.getIcon).toHaveBeenCalledWith(
        'house',
        'dark',       // 使用 dark 模式
        'svg',
        24
      );
    });
  });

  it('should support format prop', async () => {
    const mockPng = 'data:image/png;base64,...';
    (hackernoonIconRegistry.getIcon as jest.Mock).mockResolvedValue(mockPng);

    render(<PixelIcon name="home" format="png" aria-label="首頁" />);

    await waitFor(() => {
      expect(hackernoonIconRegistry.getIcon).toHaveBeenCalledWith(
        'house',
        'light',
        'png',        // 使用 PNG 格式
        24
      );
    });
  });

  it('should preserve Phase 6 animation', async () => {
    const mockSvg = '<svg>...</svg>';
    (hackernoonIconRegistry.getIcon as jest.Mock).mockResolvedValue(mockSvg);

    render(
      <PixelIcon
        name="loader"
        animation="spin"
        variant="primary"
        sizePreset="md"
        aria-label="載入中"
      />
    );

    await waitFor(() => {
      const icon = screen.getByLabelText('載入中');
      expect(icon).toHaveClass('animate-spin'); // Phase 6 animation
      expect(icon).toHaveClass('text-pip-boy-green'); // Phase 6 variant
    });
  });

  it('should use fallback icon when icon not found', async () => {
    const mockFallbackSvg = '<svg>fallback</svg>';
    (hackernoonIconRegistry.getIcon as jest.Mock)
      .mockRejectedValueOnce(new Error('Icon not found'))
      .mockResolvedValueOnce(mockFallbackSvg);

    render(<PixelIcon name="non-existent" aria-label="不存在" />);

    await waitFor(() => {
      expect(hackernoonIconRegistry.getIcon).toHaveBeenCalledWith(
        'question-mark', // fallback 圖示
        'light',
        'svg',
        24
      );
    });
  });
});
```

### 7.2 映射表測試

```typescript
// src/components/ui/icons/__tests__/iconMapping.test.ts

import { mapIconName, isMapped, getAllMappedIcons } from '../iconMapping';

describe('iconMapping', () => {
  it('should map pixelarticons name to HackerNoon name', () => {
    expect(mapIconName('home')).toBe('house');
    expect(mapIconName('user')).toBe('user-circle');
    expect(mapIconName('menu')).toBe('hamburger-menu');
  });

  it('should return original name if not mapped', () => {
    const originalName = 'some-unknown-icon';
    expect(mapIconName(originalName)).toBe(originalName);
  });

  it('should check if icon is mapped', () => {
    expect(isMapped('home')).toBe(true);
    expect(isMapped('unknown')).toBe(false);
  });

  it('should return all mapped icons', () => {
    const allMapped = getAllMappedIcons();
    expect(allMapped).toContain('home');
    expect(allMapped).toContain('user');
    expect(allMapped.length).toBeGreaterThan(0);
  });
});
```

### 7.3 E2E 測試（Playwright）

```typescript
// tests/e2e/hackernoon-icons.spec.ts

import { test, expect } from '@playwright/test';

test.describe('HackerNoon Icons Integration', () => {
  test('all icons on homepage should render', async ({ page }) => {
    await page.goto('/');

    // 等待所有圖示載入
    await page.waitForLoadState('networkidle');

    // 檢查是否有任何載入失敗的圖示（顯示錯誤 placeholder）
    const errorIcons = await page.locator('[title*="failed to load"]').count();
    expect(errorIcons).toBe(0);
  });

  test('icon mode switching works', async ({ page }) => {
    await page.goto('/test/icon-showcase');

    // 切換到 Dark 模式
    await page.click('[data-testid="dark-mode-toggle"]');

    // 檢查圖示是否更新為 Dark 模式
    const darkIcons = await page.locator('[data-icon-mode="dark"]').count();
    expect(darkIcons).toBeGreaterThan(0);
  });

  test('Phase 6 animations work correctly', async ({ page }) => {
    await page.goto('/');

    // 檢查 spinner 動畫
    const spinner = page.locator('[data-animation="spin"]').first();
    await expect(spinner).toHaveClass(/animate-spin/);
  });
});
```

### 7.4 視覺回歸測試

```typescript
// tests/visual/hackernoon-icons-visual.spec.ts

import { test, expect } from '@playwright/test';

test('icon showcase page visual regression', async ({ page }) => {
  await page.goto('/icon-showcase');

  // 等待所有圖示載入
  await page.waitForLoadState('networkidle');

  // 截圖比對
  await expect(page).toHaveScreenshot('hackernoon-icon-showcase.png', {
    fullPage: true,
    maxDiffPixels: 100, // 允許最多 100 個像素差異
  });
});
```

---

## 8. 圖示預覽頁面設計

### 8.1 `/icon-showcase` 頁面（開發者工具）

```typescript
// src/app/icon-showcase/page.tsx

'use client';

import { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons/PixelIcon';
import { getAllMappedIcons } from '@/components/ui/icons/iconMapping';
import type { IconMode, IconFormat, OriginalIconSize } from '@/types/icons';

export default function IconShowcasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<IconMode>('light');
  const [selectedFormat, setSelectedFormat] = useState<IconFormat>('svg');
  const [selectedSize, setSelectedSize] = useState<OriginalIconSize>(24);

  const allIcons = getAllMappedIcons();
  const filteredIcons = allIcons.filter(name =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-pip-boy-green">
        HackerNoon Pixel Icon Showcase
      </h1>

      {/* 控制面板 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 搜尋 */}
        <input
          type="text"
          placeholder="搜尋圖示..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-pip-boy-green bg-black text-pip-boy-green rounded"
        />

        {/* 模式選擇 */}
        <select
          value={selectedMode}
          onChange={(e) => setSelectedMode(e.target.value as IconMode)}
          className="px-4 py-2 border border-pip-boy-green bg-black text-pip-boy-green rounded"
        >
          <option value="light">Light 模式</option>
          <option value="dark">Dark 模式</option>
        </select>

        {/* 格式選擇 */}
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as IconFormat)}
          className="px-4 py-2 border border-pip-boy-green bg-black text-pip-boy-green rounded"
        >
          <option value="svg">SVG</option>
          <option value="png">PNG</option>
        </select>

        {/* 尺寸選擇 */}
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(Number(e.target.value) as OriginalIconSize)}
          className="px-4 py-2 border border-pip-boy-green bg-black text-pip-boy-green rounded"
        >
          <option value={12}>12px</option>
          <option value={16}>16px</option>
          <option value={24}>24px</option>
          <option value={48}>48px</option>
        </select>
      </div>

      {/* 圖示網格 */}
      <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4">
        {filteredIcons.map((name) => (
          <div
            key={name}
            className="flex flex-col items-center p-4 border border-pip-boy-green/30 rounded hover:bg-pip-boy-green/10 transition-colors"
          >
            <PixelIcon
              name={name}
              mode={selectedMode}
              format={selectedFormat}
              originalSize={selectedSize}
              size={48}
              aria-label={name}
            />
            <span className="mt-2 text-xs text-center text-pip-boy-green truncate w-full">
              {name}
            </span>
          </div>
        ))}
      </div>

      {/* 統計資訊 */}
      <div className="mt-8 p-4 bg-pip-boy-green/10 border border-pip-boy-green rounded">
        <p className="text-pip-boy-green">
          顯示 {filteredIcons.length} / {allIcons.length} 個圖示
        </p>
        <p className="text-pip-boy-green text-sm mt-2">
          模式: {selectedMode} | 格式: {selectedFormat} | 尺寸: {selectedSize}px
        </p>
      </div>
    </div>
  );
}
```

---

## 9. 風險評估與緩解措施

### 9.1 風險矩陣

| 風險 | 影響 | 可能性 | 嚴重程度 | 緩解措施 |
|------|------|--------|---------|---------|
| **圖示覆蓋率不足** | 高 | 中 | 🔴 高 | 實作 fallback 機制、建立缺失圖示清單、使用相似替代圖示 |
| **效能影響** | 中 | 低 | 🟡 中 | Dynamic import、快取機制、預載入關鍵圖示、tree-shaking |
| **視覺不協調** | 中 | 低 | 🟡 中 | 設計階段全面審查、視覺回歸測試、/icon-showcase 預覽 |
| **無障礙性問題** | 高 | 低 | 🟡 中 | 強制 aria-label、自動化 axe-core 測試、螢幕閱讀器測試 |
| **套件維護中斷** | 高 | 低 | 🟡 中 | MIT/CC BY 4.0 授權允許 fork、建立本地備份、自建 CDN |
| **向後相容性破壞** | 高 | 極低 | 🟢 低 | 保持舊 API、映射機制、充分測試 |

### 9.2 回滾計畫

如果發現重大問題，可快速回滾至 `pixelarticons`：

**Step 1: 版本控制**
```bash
# 在開始遷移前，建立分支
git checkout -b feature/hackernoon-icons
```

**Step 2: 回滾步驟**
```bash
# 1. 切回主分支
git checkout main

# 2. 重新安裝 pixelarticons
bun add pixelarticons

# 3. 恢復元件變更
git restore src/components/ui/icons/
git restore src/lib/iconRegistry.ts
git restore src/types/icons.ts

# 4. 重新執行測試
bun test

# 5. 重新部署
bun run build && bun run start
```

**預估回滾時間**：< 30 分鐘

---

## 10. 文件與維護

### 10.1 開發者使用指南

建立 `src/components/ui/icons/README.md`：

```markdown
# PixelIcon 使用指南（HackerNoon 版）

## 基本使用

\`\`\`tsx
import { PixelIcon } from '@/components/ui/icons';

<PixelIcon name="home" aria-label="首頁" />
\`\`\`

## Props

### 向後相容的 Props
- `name`: 圖示名稱（必填，支援 pixelarticons 名稱，自動映射）
- `size`: 圖示尺寸，預設 24px
- `className`: 自訂 CSS 類別
- `aria-label`: 無障礙標籤（互動式圖示必填）
- `decorative`: 是否為裝飾性圖示

### Phase 6 Props
- `animation`: 動畫效果（pulse, spin, bounce, ping, fade, wiggle, float）
- `variant`: 顏色變體（default, primary, secondary, success, warning, error, info, muted）
- `sizePreset`: 尺寸預設（xs, sm, md, lg, xl, xxl）

### HackerNoon 新增 Props
- `mode`: Light/Dark 模式（預設 light）
- `format`: SVG/PNG 格式（預設 svg）
- `originalSize`: HackerNoon 原始尺寸（12, 16, 24, 48，預設 24）

## 使用範例

### 基本使用（向後相容）
\`\`\`tsx
<PixelIcon name="home" />
\`\`\`

### 使用 HackerNoon 功能
\`\`\`tsx
<PixelIcon
  name="home"
  mode="dark"
  format="svg"
  originalSize={24}
/>
\`\`\`

### 使用 Phase 6 功能
\`\`\`tsx
<PixelIcon
  name="loader"
  animation="spin"
  variant="primary"
  sizePreset="md"
  decorative
/>
\`\`\`

### 組合所有功能
\`\`\`tsx
<PixelIcon
  name="check"
  mode="light"
  animation="bounce"
  variant="success"
  sizePreset="lg"
  aria-label="成功"
/>
\`\`\`

## 圖示預覽

訪問 [/icon-showcase](/icon-showcase) 查看所有可用圖示

## 映射表

所有 pixelarticons 圖示名稱會自動映射到 HackerNoon 圖示。
參考 `src/components/ui/icons/iconMapping.ts` 查看完整映射表。
\`\`\`

### 10.2 遷移指南

參考 `.kiro/specs/pixel-icon-replacement/MIGRATION_GUIDE.md`（已存在）

---

## 11. 後續優化方向

### 11.1 短期優化（1-2 週內）
- [ ] 實作圖示動態主題切換（自動跟隨系統 Light/Dark 模式）
- [ ] 優化圖示快取策略（加入 LRU eviction）
- [ ] 完善圖示元資料和搜尋功能

### 11.2 中期優化（1-2 個月內）
- [ ] 建立自訂圖示上傳功能（讓使用者上傳自己的 pixel 圖示）
- [ ] 整合圖示使用分析（追蹤哪些圖示最常使用）
- [ ] 實作 Service Worker 離線圖示快取

### 11.3 長期優化（3+ 個月）
- [ ] 開發自訂圖示編輯器（線上 pixel art 編輯工具）
- [ ] 貢獻缺失圖示回 HackerNoon 專案
- [ ] 建立自建圖示 CDN 服務

---

## 12. 相依套件清單

### 12.1 生產依賴

```json
{
  "dependencies": {
    "@hackernoon/pixel-icon-library": "^1.0.6"
  }
}
```

**註**：`pixelarticons` 將在遷移完成後移除

### 12.2 開發依賴

無新增開發依賴（使用現有的 TypeScript, Jest, Playwright）

---

## 13. 實作檢查清單

### Phase 1: 準備階段
- [ ] 安裝 `@hackernoon/pixel-icon-library`
- [ ] 探索套件結構
- [ ] 掃描專案中所有使用的 pixelarticons 圖示
- [ ] 建立初始映射表檔案
- [ ] 建立 TypeScript 型別定義

### Phase 2: 核心元件改造
- [ ] 建立 `HackerNoonIconRegistry` 類別
- [ ] 更新 `iconMapping.ts`
- [ ] 更新 `PixelIcon.tsx` 元件
- [ ] 更新 `iconUtils.ts`

### Phase 3: 映射表完成
- [ ] 逐一映射圖示（60-85 個優先，486 個完整）
- [ ] 視覺驗證（建立 `/test/icon-comparison` 頁面）
- [ ] 產生遷移報告
- [ ] 建立 `/icon-showcase` 頁面

### Phase 4: 全域替換
- [ ] 測試向後相容性
- [ ] 更新文件（README.md, MIGRATION_GUIDE.md, CLAUDE.md）
- [ ] 清理舊程式碼（可選）

### Phase 5: 測試與優化
- [ ] 功能測試（所有圖示、Phase 6 功能、Fallback）
- [ ] 效能測試（Bundle 大小、FCP、載入速度）
- [ ] 無障礙性測試（axe-core、鍵盤、螢幕閱讀器）
- [ ] 視覺回歸測試（Playwright 截圖比對）

### Phase 6: 部署與清理
- [ ] 確認遷移完成（無 pixelarticons 殘留）
- [ ] 移除舊套件 `bun remove pixelarticons`
- [ ] 清理程式碼（移除過渡期程式碼）
- [ ] 部署上線（production build + 驗證）

---

## 14. 附錄

### 14.1 HackerNoon 圖示名稱範例

以下是 HackerNoon 套件中一些常見的圖示名稱（需在安裝後確認）：

**Navigation**:
- `house`, `hamburger-menu`, `x`, `chevron-left`, `chevron-right`, `arrow-left`, `arrow-right`

**User & Auth**:
- `user-circle`, `sign-in`, `sign-out`, `gear`, `id-card`

**Actions**:
- `magnifying-glass`, `plus`, `minus`, `pencil`, `trash-can`, `download`, `upload`, `share`, `copy`

**Status**:
- `check-mark`, `check-circle`, `x-circle`, `exclamation-circle`, `info-circle`, `question-mark`, `warning`

**Media**:
- `image`, `document`, `folder`, `music-note`, `play-button`, `pause-button`, `volume-high`, `volume-off`

**Social**:
- `heart`, `star`, `chat-bubble`, `envelope`, `bell`

**完整清單**：安裝套件後查看 `node_modules/@hackernoon/pixel-icon-library/icons/svg/light/24px/`

### 14.2 參考資源

- [HackerNoon Pixel Icon Library GitHub](https://github.com/hackernoon/pixel-icon-library)
- [HackerNoon 官方網站](https://pixeliconlibrary.com)
- [pixelarticons 官方網站](https://pixelarticons.com)（舊套件，僅供參考）
- [專案 Icon Showcase 頁面](/icon-showcase)（實作後可用）

---

**文件版本**：2.0
**最後更新**：2025-10-11
**審核狀態**：⏳ 待審核
**負責人**：Claude Code
**預估工時**：10-16 天

---

## 變更記錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|---------|------|
| 1.0 | 2025-10-11 | 初版（pixelarticons 版本，已過時） | Claude Code |
| 2.0 | 2025-10-11 | 完全重寫為 HackerNoon 版本 | Claude Code |
