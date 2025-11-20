# Homepage Animation System - Cleanup Report

**Task 18.2: 清理舊程式碼與依賴**

## 清理摘要

### 1. CSS Animations 保留情況

**保留的 CSS Animations**:
- `animate-pulse`: 保留用於 Hero Section terminal status indicator
- `animate-scanline`: 保留用於 Fallout 主題視覺效果（CTA 按鈕 hover）

**理由**: 這些動畫是輕量級且與 GSAP/Framer Motion 不衝突，作為視覺點綴效果保留。

### 2. @react-spring 依賴分析

**目前使用情況**:
```
src/components/mobile/ContextMenu.tsx
src/components/mobile/MobileNavigation.tsx
src/components/mobile/PullToRefresh.tsx
src/components/mobile/SwipeActions.tsx
src/components/mobile/MobileBottomNav.tsx
src/components/mobile/MobileReadingInterface.tsx
src/components/mobile/MobileSpreadSelector.tsx
src/components/mobile/MobileTarotCard.tsx
src/hooks/useAdvancedGestures.ts
```

**決策**: **保留 @react-spring**
- **理由 1**: 所有使用均在 mobile-specific components
- **理由 2**: @react-spring 專為手勢互動優化（與 @use-gesture/react 整合）
- **理由 3**: 首頁動畫系統（GSAP + Framer Motion）不涉及 mobile components
- **理由 4**: 移除 @react-spring 需要重構 9 個檔案，風險高且非必要

**結論**: @react-spring 與首頁動畫系統無衝突，保留用於 mobile components。

### 3. 動畫風格統一

**統一標準**:
- **首頁滾動動畫**: GSAP + ScrollTrigger
- **首頁微動畫**: Framer Motion (motion/react)
- **Mobile互動**: @react-spring/web + @use-gesture/react
- **視覺點綴**: CSS animations (Tailwind classes)

**命名慣例**:
- GSAP hooks: `use[Feature]Animation` (e.g., `useScrollAnimation`)
- Framer Motion variants: `[feature][Action]Variants` (e.g., `breathingGlowVariants`)
- Config modules: `[library]Config.ts` (e.g., `gsapConfig.ts`)

### 4. 移除的程式碼

**無舊程式碼需要移除**:
- client-page.tsx 已完全使用新的動畫系統
- 所有 section components 均已升級至 GSAP/Framer Motion
- 無遺留的 CSS transitions 或舊動畫邏輯

### 5. Dependencies 狀態

**當前動畫相關依賴**:
```json
{
  "gsap": "^3.13.0",              // 新增（首頁滾動動畫）
  "motion": "^12.23.22",          // 既有（首頁微動畫）
  "@react-spring/web": "^9.7.5",  // 保留（mobile互動）
  "@use-gesture/react": "^10.3.1" // 保留（手勢處理）
}
```

**Bundle Size 影響**:
- GSAP Core + ScrollTrigger: ~70KB (gzipped)
- Framer Motion: ~30KB (已計入)
- @react-spring: ~25KB (已計入)
- **總計**: 動畫系統增加 ~70KB bundle size

## 建議事項

1. **無需移除 @react-spring**: mobile components 使用合理
2. **保留輕量 CSS animations**: 視覺點綴不影響效能
3. **統一文件化**: 已完成動畫系統 README
4. **Code splitting**: 考慮僅在首頁載入 GSAP (dynamic import)

## 驗證檢查點

- [x] 首頁無 @react-spring imports
- [x] 所有 sections 使用統一動畫系統
- [x] CSS animations 僅用於視覺點綴
- [x] Dependencies 狀態文件化
- [x] 命名慣例統一

---

**完成日期**: 2025-11-17
**執行者**: Claude (TDD Agent)
**狀態**: ✅ 完成 (無須移除舊程式碼)
