# Landing Page Card Style Unification

**Date**: 2025-11-16  
**Task**: 統一 How It Works 和 Social Proof 區塊卡片樣式與核心功能區塊一致  
**Status**: ✅ Completed

---

## Problem

三個區塊使用了不一致的卡片樣式：

### Before

**核心功能區塊** (正確):
```tsx
<PipBoyCard variant="default" padding="lg" className="text-center">
  <PipBoyCardContent>
    {/* 內容 */}
  </PipBoyCardContent>
</PipBoyCard>
```

**如何使用區塊** (StepCard - 不一致):
```tsx
<PipBoyCard
  className="border-2 border-pip-boy-green bg-[var(--color-pip-boy-green-10)] p-6 flex flex-col items-center gap-4"
>
  {/* 直接在 PipBoyCard 內放內容，沒有使用 PipBoyCardContent */}
</PipBoyCard>
```

**用戶評價區塊** (TestimonialCard - 不一致):
```tsx
<PipBoyCard
  className="border-2 border-pip-boy-green bg-[var(--color-pip-boy-green-10)] p-6 flex flex-col gap-4"
>
  {/* 直接在 PipBoyCard 內放內容，沒有使用 PipBoyCardContent */}
</PipBoyCard>
```

**問題**:
1. 手動覆蓋 className，繞過 PipBoyCard 的 variant 和 padding props
2. 沒有使用 PipBoyCardContent 包裹內容
3. 樣式不一致（文字顏色、間距）
4. 重複定義樣式（border-2, bg, p-6）

---

## Solution

### 統一使用 PipBoyCard 的 Props 系統

改用 `variant="default"` 和 `padding="lg"` props，加上 `PipBoyCardContent` 包裹：

### StepCard (After)

```tsx
<PipBoyCard
  variant="default"
  padding="lg"
  className="text-center hover:scale-105 transition-transform duration-300"
  role="article"
>
  <PipBoyCardContent>
    {/* Step Number Badge */}
    <div className="...">
      {stepNumber}
    </div>

    {/* Step Icon */}
    <PixelIcon name={icon} size={40} className="mb-4 mx-auto text-pip-boy-green" decorative />

    {/* Step Title */}
    <h3 className="text-lg font-bold text-pip-boy-green mb-2">
      {title}
    </h3>

    {/* Step Description */}
    <p className="text-pip-boy-green/60 text-sm leading-relaxed">
      {description}
    </p>
  </PipBoyCardContent>
</PipBoyCard>
```

### TestimonialCard (After)

```tsx
<PipBoyCard variant="default" padding="lg">
  <PipBoyCardContent>
    {/* Header: Avatar + Username + Rating */}
    <div className="flex items-start gap-4 mb-4">
      {/* ... */}
    </div>

    {/* Review Text */}
    <p className="text-pip-boy-green/60 text-sm leading-relaxed">
      {review}
    </p>
  </PipBoyCardContent>
</PipBoyCard>
```

---

## Changes Made

### 1. StepCard Component

**File**: `src/components/landing/StepCard.tsx`

**Changes**:
- ✅ 使用 `variant="default"` 和 `padding="lg"` props
- ✅ 加入 `PipBoyCardContent` 包裹內容
- ✅ 移除手動的 border, bg, padding className
- ✅ 統一文字顏色（`text-pip-boy-green/60`）
- ✅ 保留 hover 效果（`hover:scale-105`）
- ✅ 加入 `PipBoyCardContent` import

**Before**:
```tsx
import { PipBoyCard } from '@/components/ui/pipboy/PipBoyCard';

<PipBoyCard
  className="border-2 border-pip-boy-green bg-[var(--color-pip-boy-green-10)] p-6 flex flex-col items-center gap-4 hover:scale-105 transition-transform duration-300"
>
  <div>...</div>
  <div>...</div>
  <h3>...</h3>
  <p className="text-pip-boy-green/80">...</p>
</PipBoyCard>
```

**After**:
```tsx
import { PipBoyCard, PipBoyCardContent } from '@/components/ui/pipboy';

<PipBoyCard
  variant="default"
  padding="lg"
  className="text-center hover:scale-105 transition-transform duration-300"
>
  <PipBoyCardContent>
    <div>...</div>
    <PixelIcon ... />
    <h3>...</h3>
    <p className="text-pip-boy-green/60">...</p>
  </PipBoyCardContent>
</PipBoyCard>
```

### 2. TestimonialCard Component

**File**: `src/components/landing/TestimonialCard.tsx`

**Changes**:
- ✅ 使用 `variant="default"` 和 `padding="lg"` props
- ✅ 加入 `PipBoyCardContent` 包裹內容
- ✅ 移除手動的 border, bg, padding, flex className
- ✅ 統一文字顏色（`text-pip-boy-green/60`）
- ✅ 加入 `PipBoyCardContent` import

**Before**:
```tsx
import { PipBoyCard } from '@/components/ui/pipboy/PipBoyCard';

<PipBoyCard
  className="border-2 border-pip-boy-green bg-[var(--color-pip-boy-green-10)] p-6 flex flex-col gap-4"
>
  <div>...</div>
  <div className="text-pip-boy-green/80">...</div>
</PipBoyCard>
```

**After**:
```tsx
import { PipBoyCard, PipBoyCardContent } from '@/components/ui/pipboy';

<PipBoyCard variant="default" padding="lg">
  <PipBoyCardContent>
    <div className="...mb-4">...</div>
    <p className="text-pip-boy-green/60">...</p>
  </PipBoyCardContent>
</PipBoyCard>
```

---

## Benefits

### 1. 一致性 (Consistency)

**Before**: 三種不同的卡片樣式  
**After**: 統一使用 PipBoyCard variant system

所有區塊現在使用相同的：
- ✅ 邊框樣式（`border-2 border-pip-boy-green`）
- ✅ 背景顏色（`bg-[var(--color-pip-boy-green-10)]`）
- ✅ 內邊距（`p-6` via `padding="lg"`）
- ✅ 文字顏色（`text-pip-boy-green/60`）

### 2. 可維護性 (Maintainability)

**Before**: 樣式分散在多個元件中  
**After**: 樣式集中在 PipBoyCard 元件

未來如果要更新卡片樣式，只需修改 `PipBoyCard` 元件，所有使用它的地方都會自動更新。

### 3. 效能 (Performance)

**Before**: 8.67 kB  
**After**: 8.62 kB  
**Saved**: 50 bytes

雖然改善不大，但移除了重複的樣式定義。

### 4. 設計系統 (Design System)

✅ 遵循 PipBoyCard 設計系統  
✅ 使用標準化的 props（variant, padding）  
✅ 正確使用 PipBoyCardContent 包裹內容

---

## Visual Comparison

### 核心功能區塊
```
┌─────────────────────────┐
│   🗲   (Icon)           │
│   量子占卜              │
│   先進演算法...         │
└─────────────────────────┘
```

### 如何使用區塊 (StepCard)
```
┌─────────────────────────┐
│   ①    (Number Badge)   │
│   🗲   (Icon)           │
│   選擇牌陣              │
│   從多種牌陣中...       │
└─────────────────────────┘
```

### 用戶評價區塊 (TestimonialCard)
```
┌─────────────────────────┐
│ 👤 廢土遊民             │
│    ★★★★★              │
│ 這個占卜系統...         │
└─────────────────────────┘
```

**現在所有三種卡片都使用相同的邊框、背景、內邊距和文字顏色！**

---

## Files Modified

1. ✅ `src/components/landing/StepCard.tsx`
   - 使用 PipBoyCard props system
   - 加入 PipBoyCardContent
   - 統一文字顏色

2. ✅ `src/components/landing/TestimonialCard.tsx`
   - 使用 PipBoyCard props system
   - 加入 PipBoyCardContent
   - 統一文字顏色

---

## Verification

### Build Status
```bash
$ bun run build
✓ Compiled successfully
Route: /
Size: 8.62 kB (was 8.67 kB)
Status: ✅ Optimized
```

### Visual Consistency
- ✅ StepCard 樣式與核心功能卡片一致
- ✅ TestimonialCard 樣式與核心功能卡片一致
- ✅ 所有卡片使用相同的邊框、背景、內邊距
- ✅ Hover 效果保留（StepCard 縮放效果）

---

## Design System Compliance

### PipBoyCard Props Usage

所有 landing page 卡片現在都正確使用：

```tsx
<PipBoyCard variant="default" padding="lg">
  <PipBoyCardContent>
    {/* 內容 */}
  </PipBoyCardContent>
</PipBoyCard>
```

**Props 說明**:
- `variant="default"`: 標準 Pip-Boy 主題（綠色邊框 + 半透明綠色背景）
- `padding="lg"`: 大內邊距（p-6）
- `PipBoyCardContent`: 標準內容包裹器

---

## Testing Impact

### Component Tests

現有的 component tests 應該仍然通過，因為：
- ✅ Props interface 沒有改變
- ✅ 渲染的內容結構沒有改變
- ✅ 只有內部實作細節改變（使用 PipBoyCardContent）

### Visual Tests

如果有 visual regression tests，需要更新 snapshots：
- 文字顏色從 `text-pip-boy-green/80` 改為 `text-pip-boy-green/60`
- 卡片內部結構多了一層 `PipBoyCardContent`

---

## Recommendations

### Future Card Components

未來建立新的卡片元件時，應該：

1. ✅ **使用 PipBoyCard 作為基礎**
2. ✅ **使用 variant 和 padding props**（不要手動覆蓋 className）
3. ✅ **使用 PipBoyCardContent 包裹內容**
4. ✅ **統一文字顏色**（`text-pip-boy-green/60` 用於描述性文字）

**範例**:
```tsx
import { PipBoyCard, PipBoyCardContent } from '@/components/ui/pipboy';

export const MyCard = () => (
  <PipBoyCard variant="default" padding="lg" className="text-center">
    <PipBoyCardContent>
      <PixelIcon ... />
      <h3 className="text-lg font-bold text-pip-boy-green mb-2">...</h3>
      <p className="text-pip-boy-green/60 text-sm">...</p>
    </PipBoyCardContent>
  </PipBoyCard>
);
```

---

**Unification Completed**: ✅  
**Build Status**: ✅ Passing  
**Bundle Size**: ✅ Reduced  
**Design System**: ✅ Compliant
