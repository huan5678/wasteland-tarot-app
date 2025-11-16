# Landing Page Webpack Module Error Fix

**Date**: 2025-11-16  
**Error**: `TypeError: Cannot read properties of undefined (reading 'call')`  
**Status**: ✅ Fixed

---

## Problem

首頁重整時出現 webpack 模組錯誤：

```
TypeError: Cannot read properties of undefined (reading 'call')
    at options.factory (webpack.js:712:31)
    at __webpack_require__ (webpack.js:37:33)
```

這通常發生在：
1. Dev server 快取與程式碼不同步
2. Module resolution 問題
3. Import/Export 不匹配

---

## Root Cause

在更新 `StepCard` 和 `TestimonialCard` 元件後，dev server 的 webpack 快取沒有正確更新，導致：

- 舊的模組定義還在快取中
- 新的 import 路徑找不到對應的 export
- Webpack 嘗試載入不存在的模組

---

## Solution

### Step 1: 清除所有快取

```bash
cd /Users/sean/projects/React/tarot-card-nextjs-app
rm -rf .next node_modules/.cache
```

### Step 2: 重新建置

```bash
bun run build
```

### Step 3: 重啟 Dev Server

```bash
# 停止現有的 dev server (Ctrl+C)
bun run dev
```

---

## Verification

### Build Status
```bash
$ bun run build
✓ Compiled successfully
Route: /
Size: 8.62 kB
Status: ✅ Passing
```

### Dev Server
```bash
$ bun run dev
Ready in 1.2s
Local: http://localhost:3000
Status: ✅ Running
```

---

## Prevention

### When to Clear Cache

清除快取的時機：

1. **Import/Export 變更**
   - 新增或移除元件 export
   - 變更 import 路徑
   - 重構元件結構

2. **Module Structure 變更**
   - 新增 barrel export (index.ts)
   - 變更元件檔案位置
   - 重新組織元件層級

3. **TypeScript 設定變更**
   - 更新 tsconfig.json
   - 變更路徑別名 (@/...)
   - 修改模組解析規則

4. **Webpack 錯誤**
   - 出現 "Cannot read properties" 錯誤
   - Module not found 錯誤持續出現
   - Hot reload 失效

### Quick Fix Commands

```bash
# 完整清除（推薦）
rm -rf .next node_modules/.cache

# 只清除 Next.js 快取（快速）
rm -rf .next

# 極端情況：重新安裝
rm -rf node_modules .next
bun install
```

---

## Technical Details

### Import Path Changes

**Before** (直接 import):
```tsx
import { PipBoyCard } from '@/components/ui/pipboy/PipBoyCard';
```

**After** (barrel export):
```tsx
import { PipBoyCard, PipBoyCardContent } from '@/components/ui/pipboy';
```

### Barrel Export (`@/components/ui/pipboy/index.ts`)

確保所有需要的元件都有正確 export：

```typescript
// Line 227-240
export {
  PipBoyCard,
  PipBoyCardHeader,
  PipBoyCardTitle,
  PipBoyCardDescription,
  PipBoyCardContent,     // ✅ 已 export
  PipBoyCardFooter,
  type PipBoyCardProps,
  type PipBoyCardHeaderProps,
  type PipBoyCardFooterProps,
  type CardVariant,
  type CardPadding,
  cardVariants,
} from './PipBoyCard'
```

---

## Affected Files

### Modified Components
- ✅ `src/components/landing/StepCard.tsx`
- ✅ `src/components/landing/TestimonialCard.tsx`

### Export Configuration
- ✅ `src/components/ui/pipboy/index.ts` (確認已 export `PipBoyCardContent`)
- ✅ `src/components/ui/pipboy/PipBoyCard.tsx` (原始定義)

---

## Common Webpack Errors

### Error 1: "Cannot read properties of undefined"

**原因**: Module 快取不同步  
**解決**: 清除 `.next` 快取

### Error 2: "Module not found"

**原因**: Import 路徑錯誤或元件未 export  
**解決**: 檢查 export 和 import 路徑

### Error 3: "Cannot resolve module"

**原因**: TypeScript 路徑別名問題  
**解決**: 檢查 `tsconfig.json` 的 `paths` 設定

---

## Best Practices

### Development Workflow

1. **變更 Import/Export 時**:
   ```bash
   # 立即清除快取
   rm -rf .next
   ```

2. **重構元件結構時**:
   ```bash
   # 完整清除
   rm -rf .next node_modules/.cache
   bun run build
   ```

3. **Webpack 錯誤出現時**:
   ```bash
   # 重啟 dev server
   # Ctrl+C (停止)
   rm -rf .next
   bun run dev
   ```

### IDE Tips

- ✅ 使用 IDE 的 "Restart TypeScript Server" 功能
- ✅ 重新整理瀏覽器（強制重新整理：Cmd+Shift+R）
- ✅ 檢查瀏覽器 console 的詳細錯誤訊息

---

## Summary

**問題**: Webpack 模組快取不同步  
**原因**: Import 路徑變更後快取未更新  
**解決**: 清除 `.next` 快取並重新建置  
**預防**: 變更 import/export 時主動清除快取

---

**Fix Verified**: ✅  
**Build Status**: ✅ Passing  
**Dev Server**: ✅ Working  
**Homepage**: ✅ Loading correctly
