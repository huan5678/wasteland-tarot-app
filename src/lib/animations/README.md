# Homepage Animation System

統一的 GSAP + Framer Motion 動畫系統，為 Wasteland Tarot 首頁提供流暢、專業且具沉浸感的滾動動畫體驗。

## 目錄

- [架構概覽](#架構概覽)
- [快速開始](#快速開始)
- [配置檔案](#配置檔案)
- [Custom Hooks API](#custom-hooks-api)
- [程式碼範例](#程式碼範例)
- [效能最佳化](#效能最佳化)
- [進階功能](#進階功能)
- [常見問題](#常見問題)

---

## 架構概覽

### 設計原則：GSAP vs Framer Motion

本動畫系統採用**分層責任分離**策略，整合兩大專業動畫庫：

| 動畫庫 | 職責範圍 | 適用場景 |
|--------|---------|---------|
| **GSAP + ScrollTrigger** | 滾動觸發動畫、視差效果、複雜時序控制 | Hero Section 入場動畫、Stats 數字滾動、How It Works 錯開動畫 |
| **Framer Motion** | 使用者互動動畫、layout animations、micro-interactions | Button hover、FAQ 展開/收合、CTA 呼吸發光 |

**核心原則**：
- GSAP 控制滾動相關動畫（scroll-triggered）
- Framer Motion 控制互動相關動畫（user-triggered）
- 不混用兩者於同一元素，避免動畫衝突

### 檔案結構

```
src/lib/animations/
├── gsapConfig.ts           # GSAP 中央配置
├── motionVariants.ts       # Framer Motion variants 定義
├── animationUtils.ts       # 共用工具函式
├── useReducedMotion.ts     # 無障礙支援 hook
├── useScrollAnimation.ts   # GSAP 滾動動畫 hook
├── useParallax.ts          # 視差效果 hook
├── useStagger.ts           # 錯開入場動畫 hook
├── useCounterAnimation.ts  # 數字滾動動畫 hook
├── __tests__/              # 單元測試
└── README.md               # 本檔案
```

---

## 快速開始

### 基礎範例：滾動觸發動畫

```tsx
'use client';

import { useRef } from 'react';
import { useScrollAnimation } from '@/lib/animations/useScrollAnimation';

export function MySection() {
  const ref = useRef<HTMLDivElement>(null);

  useScrollAnimation({
    triggerRef: ref,
    animations: [
      {
        target: '.title',
        from: { opacity: 0, y: -40 },
        to: { opacity: 1, y: 0, duration: 0.8 }
      },
      {
        target: '.subtitle',
        to: { opacity: 1, duration: 0.6 },
        position: '+=0.3' // 0.3s 後執行
      }
    ]
  });

  return (
    <section ref={ref}>
      <h1 className="title">Hero Title</h1>
      <p className="subtitle">Subtitle text</p>
    </section>
  );
}
```

### 基礎範例：Hover 動畫

```tsx
'use client';

import { motion } from 'motion/react';
import { featureCardHoverVariants } from '@/lib/animations/motionVariants';

export function FeatureCard() {
  return (
    <motion.div
      variants={featureCardHoverVariants}
      initial="rest"
      whileHover="hover"
      className="feature-card"
    >
      Card content
    </motion.div>
  );
}
```

---

## 配置檔案

### `gsapConfig.ts` - GSAP 中央配置

所有 GSAP 動畫參數集中管理，確保全站一致性：

```typescript
export const gsapConfig = {
  durations: {
    fast: 0.2,      // 快速動畫（按鈕 hover）
    normal: 0.6,    // 標準動畫（入場、退場）
    slow: 1.0,      // 慢速動畫（視差）
    counter: {      // 數字滾動
      small: 1.2,   // < 100
      medium: 1.5,  // 100-10,000
      large: 2.0,   // > 10,000
    },
  },
  easings: {
    in: 'power2.in',
    out: 'power2.out',
    inOut: 'power2.inOut',
    elastic: 'elastic.out(1, 0.5)',
    linear: 'none',
  },
  staggers: {
    fast: 0.075,    // Mobile
    normal: 0.15,   // Desktop
    slow: 0.25,     // 大量元素
  },
  scrollTrigger: {
    start: 'top 80%',
    end: 'bottom 20%',
    toggleActions: 'play none none none',
    markers: process.env.NODE_ENV === 'development',
  },
  parallax: {
    backgroundSpeed: 0.5,  // 50% 滾動速度
    foregroundSpeed: 1.0,  // 正常速度
  },
  breakpoints: {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)',
  },
  performance: {
    force3D: true,  // 強制 GPU 加速
    autoKill: true, // 自動清理已完成的 tween
    minFPS: 50,     // 效能監控閾值
  },
  colors: {
    pipBoyGreen: '#00ff88',
    radiationOrange: '#ff8800',
  },
} as const;
```

**修改配置**：
- 修改 `gsapConfig.ts` 即可全域生效
- 支援環境變數覆寫（如 `NEXT_PUBLIC_GSAP_DEBUG=true` 啟用 markers）

### `motionVariants.ts` - Framer Motion Variants

可重用的動畫 variants 定義：

```typescript
/** 淡入動畫（通用） */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

/** 向上滑入動畫（卡片入場） */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

/** CTA 呼吸發光動畫（infinite loop） */
export const breathingGlowVariants: Variants = {
  initial: {
    boxShadow: '0 0 10px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.2)',
  },
  animate: {
    boxShadow: [
      '0 0 10px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.2)',
      '0 0 20px rgba(0, 255, 136, 0.6), 0 0 40px rgba(0, 255, 136, 0.4)',
      '0 0 10px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.2)',
    ],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

/** 減少動畫模式（prefers-reduced-motion） */
export const reducedMotionTransition: Transition = {
  duration: 0,
};
```

---

## Custom Hooks API

### `useReducedMotion()`

偵測使用者的 `prefers-reduced-motion` 設定，提供無障礙支援。

```typescript
function useReducedMotion(): boolean
```

**Returns**: `true` 表示使用者啟用減少動畫模式

**範例**：
```tsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
>
  Content
</motion.div>
```

---

### `useScrollAnimation(options)`

統一管理 GSAP ScrollTrigger 滾動動畫。

**Options**:
```typescript
interface UseScrollAnimationOptions {
  triggerRef: RefObject<HTMLElement>;      // ScrollTrigger 觸發元素
  targetRef?: RefObject<HTMLElement>;      // 動畫目標元素（可選）
  scrollTriggerConfig?: ScrollTriggerConfig;  // ScrollTrigger 配置
  animations: AnimationConfig[];           // 動畫配置陣列
  enabled?: boolean;                       // 是否啟用（預設 true）
}

interface AnimationConfig {
  target: string | HTMLElement;  // CSS selector 或 element ref
  from?: gsap.TweenVars;        // 起始狀態（可選）
  to: gsap.TweenVars;           // 結束狀態
  position?: string | number;   // Timeline 位置標記
}
```

**Returns**:
```typescript
interface UseScrollAnimationReturn {
  scrollTrigger: ScrollTrigger | null;  // ScrollTrigger 實例
  timeline: gsap.core.Timeline | null;  // Timeline 實例
  isReady: boolean;                     // 動畫是否已初始化
  refresh: () => void;                  // 手動重新整理 ScrollTrigger
}
```

**範例**：見 [快速開始](#快速開始)

---

### `useParallax(options)`

建立 Hero Section 視差效果。

**Options**:
```typescript
interface UseParallaxOptions {
  backgroundRef: RefObject<HTMLElement>;  // 背景層 ref（移動速度較慢）
  foregroundRef?: RefObject<HTMLElement>; // 前景層 ref（可選）
  backgroundSpeed?: number;               // 背景層速率（預設 0.5）
  foregroundSpeed?: number;               // 前景層速率（預設 1.0）
  disableOnMobile?: boolean;              // Mobile 停用（預設 true）
}
```

**範例**:
```tsx
const backgroundRef = useRef<HTMLDivElement>(null);
const foregroundRef = useRef<HTMLDivElement>(null);

useParallax({
  backgroundRef,
  foregroundRef,
  backgroundSpeed: 0.5,  // 背景移動速度為正常滾動的 50%
  disableOnMobile: true,
});

return (
  <section>
    <div ref={backgroundRef} className="absolute inset-0 -z-10">
      {/* 背景層 */}
    </div>
    <div ref={foregroundRef} className="relative z-10">
      {/* 前景內容 */}
    </div>
  </section>
);
```

---

### `useStagger(options)`

建立錯開入場動畫（fade in + translate up）。

**Options**:
```typescript
interface UseStaggerOptions {
  containerRef: RefObject<HTMLElement>;  // 容器元素 ref
  childrenSelector?: string;             // 子元素選擇器（預設 "> *"）
  stagger?: number;                      // Stagger delay（預設 0.15s）
  from?: gsap.TweenVars;                // 起始狀態（預設 { opacity: 0, y: 40 }）
  to?: gsap.TweenVars;                  // 結束狀態（預設 { opacity: 1, y: 0 }）
  duration?: number;                     // 動畫持續時間（預設 0.6s）
  scrollTriggerStart?: string;           // ScrollTrigger start 位置
}
```

**範例**:
```tsx
const containerRef = useRef<HTMLDivElement>(null);

useStagger({
  containerRef,
  childrenSelector: '.step-card',
  stagger: 0.15,  // Desktop: 0.15s, Mobile: 自動減半至 0.075s
});

return (
  <div ref={containerRef}>
    <div className="step-card">Step 1</div>
    <div className="step-card">Step 2</div>
    <div className="step-card">Step 3</div>
  </div>
);
```

---

### `useCounterAnimation(options)`

實作數字滾動動畫（Stats Section 專用）。

**Options**:
```typescript
interface UseCounterAnimationOptions {
  triggerRef: RefObject<HTMLElement>;     // ScrollTrigger 觸發元素
  targetValue: number;                    // 目標數值
  duration?: number;                      // 持續時間（可選，會自動計算）
  formatOptions?: NumberFormatOptions;    // 數字格式化選項
  scrollTriggerConfig?: CounterScrollTriggerConfig;
  enabled?: boolean;
}

interface NumberFormatOptions {
  useGrouping?: boolean;              // 千位分隔（預設 true）
  minimumFractionDigits?: number;     // 最小小數位數（預設 0）
  maximumFractionDigits?: number;     // 最大小數位數（預設 0）
  locale?: string;                    // Locale（預設 'zh-TW'）
}
```

**Returns**:
```typescript
interface UseCounterAnimationReturn {
  currentValue: number;        // 當前數值（原始數字）
  formattedValue: string;      // 格式化後的數值（含千位分隔符）
  scrollTrigger: ScrollTrigger | null;
  tween: gsap.core.Tween | null;
  isComplete: boolean;         // 動畫是否已完成
}
```

**範例**:
```tsx
const ref = useRef<HTMLDivElement>(null);
const { formattedValue } = useCounterAnimation({
  triggerRef: ref,
  targetValue: 1234,
  formatOptions: { useGrouping: true },
});

return <div ref={ref}>{formattedValue}</div>;
```

**自動 duration 計算**：
- 小數字 (< 100): 1.2s
- 中數字 (100-10,000): 1.5s
- 大數字 (> 10,000): 2s

---

## 程式碼範例

### 範例 1：新增滾動觸發動畫

**需求**：為新的 section 新增淡入 + 向上平移動畫

```tsx
'use client';

import { useRef } from 'react';
import { useScrollAnimation } from '@/lib/animations/useScrollAnimation';

export function NewSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useScrollAnimation({
    triggerRef: sectionRef,
    animations: [
      {
        target: sectionRef.current!,  // 或使用 CSS selector: '.new-section'
        from: { opacity: 0, y: 60 },
        to: {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        },
      },
    ],
    scrollTriggerConfig: {
      start: 'top 70%',  // 自訂觸發位置
    },
  });

  return (
    <section ref={sectionRef} className="new-section">
      <h2>New Section Title</h2>
      <p>Content goes here...</p>
    </section>
  );
}
```

---

### 範例 2：建立自訂 Framer Motion Variant

**需求**：建立新的卡片翻轉動畫

```typescript
// 在 motionVariants.ts 新增：
export const cardFlipVariants: Variants = {
  front: {
    rotateY: 0,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
};
```

```tsx
// 在元件中使用：
'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { cardFlipVariants } from '@/lib/animations/motionVariants';

export function FlippableCard() {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      variants={cardFlipVariants}
      initial="front"
      animate={isFlipped ? 'back' : 'front'}
      onClick={() => setIsFlipped(!isFlipped)}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card content */}
    </motion.div>
  );
}
```

---

### 範例 3：實作 Reduced-Motion 支援

**需求**：為自訂動畫新增無障礙支援

```tsx
'use client';

import { useRef } from 'react';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';
import { useScrollAnimation } from '@/lib/animations/useScrollAnimation';

export function AccessibleSection() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useScrollAnimation({
    triggerRef: ref,
    animations: [
      {
        target: '.content',
        from: { opacity: 0, y: 40 },
        to: {
          opacity: 1,
          y: 0,
          duration: prefersReducedMotion ? 0 : 0.6,  // ✅ Reduced motion 時 duration = 0
        },
      },
    ],
    enabled: !prefersReducedMotion,  // ✅ 或完全停用動畫
  });

  return (
    <section ref={ref}>
      <div className="content">Accessible content</div>
    </section>
  );
}
```

**注意**：
- `useScrollAnimation` 已內建 `useReducedMotion` 整合，會自動將 `duration` 設為 0
- 若需完全停用動畫，使用 `enabled: !prefersReducedMotion`

---

## 效能最佳化

### 60fps 保證策略

#### 1. GPU 加速屬性

**只使用 GPU-accelerated 屬性**：
- ✅ **允許**: `transform` (translate, scale, rotate), `opacity`
- ❌ **禁止**: `width`, `height`, `top`, `left`, `margin`, `padding`

```typescript
// ✅ 正確：使用 transform
to: { x: 100, opacity: 1 }

// ❌ 錯誤：觸發 layout
to: { left: '100px', width: '200px' }
```

#### 2. 強制 GPU 渲染

```typescript
// gsapConfig.ts 已預設啟用
performance: {
  force3D: true,  // 強制所有動畫使用 3D transforms
  autoKill: true, // 自動清理已完成的 tween
}
```

#### 3. Lazy Initialization

僅在 section 進入 viewport 時建立 ScrollTrigger：

```tsx
// useScrollAnimation 已內建 lazy initialization
// ScrollTrigger 僅在元素即將進入 viewport 時建立
```

#### 4. Passive Event Listeners

```typescript
// ScrollTrigger 預設使用 passive listeners
// 不阻塞 main thread
```

#### 5. React Memoization

```tsx
import { useMemo, useCallback } from 'react';

const animations = useMemo(() => [
  { target: '.title', to: { opacity: 1 } }
], []);  // ✅ Cache animation configs

const handleClick = useCallback(() => {
  // Event handler
}, []);  // ✅ Cache event handlers
```

#### 6. 防止 Cumulative Layout Shift (CLS)

為動畫元素保留固定空間：

```tsx
// ✅ 正確：保留空間
<section className="min-h-[600px]">
  <div className="step-card min-h-[280px]">
    {/* Content */}
  </div>
</section>

// ❌ 錯誤：動畫時觸發 layout shift
<section>
  <div className="step-card">
    {/* Content */}
  </div>
</section>
```

### 效能監控

開發模式啟用 FPS 監控：

```typescript
import { FPSMonitor } from '@/lib/animations/animationUtils';

// 開發模式啟動監控
if (process.env.NODE_ENV === 'development') {
  const monitor = new FPSMonitor();
  monitor.start();

  setInterval(() => {
    const fps = monitor.getFPS();
    if (fps < 50) {
      console.warn(`⚠️ FPS below target: ${fps}`);
    }
  }, 1000);
}
```

---

## 進階功能

### 進階 GSAP 功能

#### Timeline Nesting（時序巢狀）

```tsx
const masterTimeline = gsap.timeline();
const subTimeline1 = gsap.timeline();
const subTimeline2 = gsap.timeline();

subTimeline1
  .to('.title', { opacity: 1 })
  .to('.subtitle', { opacity: 1 });

subTimeline2
  .to('.card-1', { scale: 1 })
  .to('.card-2', { scale: 1 });

masterTimeline
  .add(subTimeline1)
  .add(subTimeline2, '+=0.5');  // 0.5s 後執行 subTimeline2
```

#### Custom Ease Functions

```typescript
// 使用 GSAP CustomEase plugin（需另外安裝）
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

CustomEase.create('wasteland-bounce', '0.68, -0.55, 0.27, 1.55');

// 使用自訂 ease
gsap.to('.element', {
  x: 100,
  ease: 'wasteland-bounce',
});
```

#### ScrollTrigger Pin（元素固定）

```tsx
useScrollAnimation({
  triggerRef: sectionRef,
  animations: [...],
  scrollTriggerConfig: {
    pin: true,  // 固定元素
    pinSpacing: false,  // 不保留空間
  },
});
```

#### ScrollTrigger Scrub（同步滾動）

```tsx
// 視差效果使用 scrub
useParallax({
  backgroundRef,
  backgroundSpeed: 0.5,  // scrub: true 已內建
});

// 或手動設定 scrub
scrollTriggerConfig: {
  scrub: 1,  // 1 秒平滑過渡
}
```

---

## 常見問題

### Q1: 如何停用某個 section 的動畫？

使用 `enabled` 參數：

```tsx
useScrollAnimation({
  triggerRef: ref,
  animations: [...],
  enabled: false,  // 停用動畫
});
```

### Q2: 動畫在 mobile 裝置上太慢怎麼辦？

Mobile 裝置會自動減少 stagger delay（50%）。若需完全停用視差：

```tsx
useParallax({
  backgroundRef,
  disableOnMobile: true,  // ✅ Mobile 停用
});
```

### Q3: 如何調整滾動觸發位置？

使用 `scrollTriggerConfig.start`：

```tsx
scrollTriggerConfig: {
  start: 'top 60%',  // 元素頂部到達 viewport 60% 位置時觸發
  end: 'bottom 40%',
}
```

### Q4: GSAP 載入失敗怎麼辦？

系統已內建 graceful degradation：

```tsx
// 自動檢測 GSAP 可用性
if (!isGSAPAvailable()) {
  console.warn('GSAP not available, falling back to CSS animations');
  // 自動降級至 CSS transitions
}
```

### Q5: 如何在開發模式查看 ScrollTrigger markers？

```typescript
// gsapConfig.ts 已預設啟用
scrollTrigger: {
  markers: process.env.NODE_ENV === 'development',  // ✅ 開發模式顯示 markers
}
```

### Q6: 動畫完成後如何執行 callback？

```tsx
animations: [
  {
    target: '.element',
    to: {
      opacity: 1,
      onComplete: () => {
        console.log('Animation complete!');
      },
    },
  },
]
```

### Q7: 如何重新整理 ScrollTrigger（窗口 resize）？

```tsx
const { refresh } = useScrollAnimation({ ... });

// Window resize 時手動重新整理
useEffect(() => {
  const handleResize = () => refresh();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [refresh]);
```

### Q8: 為什麼我的動畫沒有觸發？

檢查以下項目：

1. ✅ `triggerRef.current` 是否為 null？
2. ✅ `animations` 陣列是否為空？
3. ✅ `enabled` 是否為 `false`？
4. ✅ GSAP 是否正確載入？（檢查 console warnings）
5. ✅ ScrollTrigger start 位置是否正確？

### Q9: 如何整合 TypeScript 型別檢查？

所有 hooks 皆提供完整 TypeScript 型別定義：

```tsx
import type { UseScrollAnimationOptions } from '@/lib/animations/useScrollAnimation';

const options: UseScrollAnimationOptions = {
  triggerRef,
  animations: [/* ... */],
};
```

---

## 相關資源

### 官方文件
- [GSAP Documentation](https://gsap.com/docs/v3/)
- [ScrollTrigger Documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

### 內部文件
- [Requirements Document](/.kiro/specs/homepage-animation-system/requirements.md)
- [Design Document](/.kiro/specs/homepage-animation-system/design.md)
- [Tasks Document](/.kiro/specs/homepage-animation-system/tasks.md)

### 測試
- Unit Tests: `src/lib/animations/__tests__/`
- E2E Tests: `tests/e2e/`

---

**版本**: 1.0
**最後更新**: 2025-11-17
**維護者**: Wasteland Tarot Development Team
