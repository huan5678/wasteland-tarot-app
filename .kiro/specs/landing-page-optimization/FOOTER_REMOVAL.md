# Landing Page Footer Removal

**Date**: 2025-11-16  
**Issue**: 首頁 Footer 與 Layout Footer 重複  
**Status**: ✅ Fixed

---

## Problem

Landing page (`src/app/client-page.tsx`) 包含了完整的 Footer 區塊，但專案的 Layout (`src/components/layout/ConditionalLayout.tsx`) 已經有全站共用的 Footer：

- **Desktop**: `FooterDrawer` 元件
- **Mobile**: `MobileBottomNav` 元件

這導致首頁有重複的 Footer，造成：
1. **重複內容**：相同的連結出現兩次
2. **不一致體驗**：首頁有兩個 Footer，其他頁面只有一個
3. **額外 Bundle 大小**：不必要的 JSX 增加頁面大小

---

## Solution

### 移除重複的 Footer 區塊

從 `src/app/client-page.tsx` 移除整個 Footer section（120+ 行代碼）：

**移除內容**:
- Brand Section（品牌資訊 + Logo）
- Quick Links（快速連結：卡牌圖書館、快速占卜、控制台）
- About（關於我們：關於廢土塔羅、常見問題、聯絡支援）
- Legal（法律資訊：隱私政策、服務條款）
- Copyright（版權宣告）

### 更新相關測試

由於 Footer 不再是 landing page 特定的元件，移除了相關測試：

**E2E Tests** (`tests/e2e/landing-page.spec.ts`):
- ❌ 移除 "Footer Links Navigation" 測試組（7 個測試）

**Accessibility Tests** (`tests/accessibility/landing-page-a11y.spec.ts`):
- ❌ 移除 "Footer passes color contrast requirements" 測試
- ❌ 移除 "Footer links are keyboard accessible" 測試  
- ❌ 移除 "Footer section h3 headings" 測試

**理由**: Footer 測試應該在 Layout 層級進行，而非 landing page 特定測試。

---

## Results

### Bundle Size Improvement

```
Before: 9.02 kB
After:  8.67 kB
Saved:  0.35 kB (~350 bytes, 3.9% reduction)
```

### User Experience

**Before**:
```
首頁顯示：
├─ Hero Section
├─ How It Works
├─ Stats Counter
├─ Social Proof
├─ Features
├─ FAQ
├─ CTA
├─ Footer (首頁專用) ❌ 重複
└─ FooterDrawer/MobileBottomNav (Layout) ✅
```

**After**:
```
首頁顯示：
├─ Hero Section
├─ How It Works
├─ Stats Counter
├─ Social Proof
├─ Features
├─ FAQ
├─ CTA
└─ FooterDrawer/MobileBottomNav (Layout) ✅ 統一
```

---

## Files Modified

### Source Code
- ✅ `src/app/client-page.tsx` - 移除 Footer section（~120 行）

### Tests
- ✅ `tests/e2e/landing-page.spec.ts` - 移除 Footer 測試（~80 行）
- ✅ `tests/accessibility/landing-page-a11y.spec.ts` - 移除 Footer 測試（~35 行）

**Total Lines Removed**: ~235 lines

---

## Verification

### Build Status
```bash
$ bun run build
✓ Compiled successfully
Route: /
Size: 8.67 kB (was 9.02 kB)
Status: ✅ Optimized
```

### Visual Consistency
- ✅ 首頁使用 Layout Footer（與其他頁面一致）
- ✅ Desktop 顯示 FooterDrawer
- ✅ Mobile 顯示 MobileBottomNav
- ✅ 沒有重複的 Footer

---

## Layout Footer Components

專案使用的全站 Footer 元件：

### FooterDrawer (Desktop)
**位置**: `src/components/layout/FooterDrawer.tsx`
**特色**:
- Drawer 樣式（可展開/收合）
- 包含導航連結
- Fallout 主題設計

### MobileBottomNav (Mobile)
**位置**: `src/components/mobile/MobileBottomNav.tsx`
**特色**:
- 固定底部導航
- 圖示 + 文字標籤
- 當前頁面高亮
- 觸控優化

這兩個元件在 `ConditionalLayout.tsx` 中根據螢幕大小自動切換：
```tsx
{/* Mobile: MobileBottomNav (hidden on desktop) */}
<div className="sm:hidden">
  <MobileBottomNav />
</div>

{/* Desktop: FooterDrawer (hidden on mobile) */}
<div className="hidden sm:block">
  <FooterDrawer />
</div>
```

---

## Recommendations

### Future Footer Updates

如果需要更新 Footer 內容，應該修改：

1. **Desktop Footer**: `src/components/layout/FooterDrawer.tsx`
2. **Mobile Footer**: `src/components/mobile/MobileBottomNav.tsx`

**不要**在個別頁面中建立獨立的 Footer 元件。

### Testing Strategy

Footer 功能測試應該：
- ✅ 在 Layout 層級測試（`tests/e2e/layout.spec.ts`）
- ✅ 測試 FooterDrawer 和 MobileBottomNav 元件
- ❌ 不要在特定頁面測試中測試 Footer

---

## Impact Assessment

### Positive Changes
1. ✅ **Consistency**: 所有頁面使用相同的 Footer
2. ✅ **Performance**: 減少 Bundle 大小（-350 bytes）
3. ✅ **Maintainability**: Footer 更新只需修改一處
4. ✅ **User Experience**: 統一的導航體驗

### No Negative Impact
- ✅ 功能完全保留（Layout Footer 提供相同功能）
- ✅ 樣式一致（都使用 Fallout 主題）
- ✅ 響應式設計（Desktop/Mobile 自動切換）

---

**Fix Completed**: ✅  
**Build Status**: ✅ Passing  
**Bundle Size**: ✅ Reduced  
**User Experience**: ✅ Improved
