# Homepage Animation System - Rollback Strategy

**Task 18.4: 建立 Rollback 策略與 Git Tags**

## Git Tags 規劃

### Phase Tags

建立以下 git tags 標記各階段完成狀態：

```bash
# Phase 1: 基礎動畫架構建立
git tag -a animation-phase-1 -m "Phase 1: GSAP/Framer Motion 基礎架構完成"

# Phase 2: Custom Animation Hooks 開發
git tag -a animation-phase-2 -m "Phase 2: useScrollAnimation, useParallax, useStagger, useReducedMotion 完成"

# Phase 3: Hero Section 動畫升級
git tag -a animation-phase-3 -m "Phase 3: Hero Section 視差效果與入場動畫完成"

# Phase 4: 中間 Sections 動畫升級
git tag -a animation-phase-4 -m "Phase 4: How It Works, Stats, Testimonials 動畫完成"

# Phase 5: Features、FAQ、CTA Sections 動畫升級
git tag -a animation-phase-5 -m "Phase 5: Features, FAQ, CTA 動畫完成"

# Phase 6: 效能優化、無障礙支援與測試
git tag -a animation-phase-6 -m "Phase 6: 效能優化、響應式、無障礙支援完成"

# Phase 7: 整合與清理 (當前)
git tag -a animation-phase-7 -m "Phase 7: 整合驗證、清理、效能測試完成"
```

### 建立 Tags 指令

```bash
# 執行所有 phase tags
git tag -a animation-phase-1 39f8129 -m "Phase 1: GSAP/Framer Motion 基礎架構完成"
git tag -a animation-phase-2 39f8129 -m "Phase 2: Custom Animation Hooks 開發完成"
git tag -a animation-phase-3 39f8129 -m "Phase 3: Hero Section 動畫升級完成"
git tag -a animation-phase-4 39f8129 -m "Phase 4: 中間 Sections 動畫升級完成"
git tag -a animation-phase-5 39f8129 -m "Phase 5: Features、FAQ、CTA Sections 完成"
git tag -a animation-phase-6 39f8129 -m "Phase 6: 效能優化、無障礙支援完成"
git tag -a animation-phase-7 HEAD -m "Phase 7: 整合與清理完成"

# 推送 tags 至遠端 (可選)
# git push origin --tags
```

## Rollback 策略

### 1. Feature Flag 控制

**位置**: `/src/lib/animations/featureFlags.ts` (新建)

```typescript
/**
 * Animation System Feature Flags
 * 用於快速切換動畫系統版本（GSAP vs CSS-only）
 */

export const ANIMATION_FEATURE_FLAGS = {
  /** 啟用 GSAP 滾動動畫 (預設: true) */
  ENABLE_GSAP_ANIMATIONS: process.env.NEXT_PUBLIC_ENABLE_GSAP !== 'false',

  /** 啟用 Framer Motion 微動畫 (預設: true) */
  ENABLE_FRAMER_MOTION: process.env.NEXT_PUBLIC_ENABLE_FRAMER_MOTION !== 'false',

  /** 啟用視差效果 (預設: true) */
  ENABLE_PARALLAX: process.env.NEXT_PUBLIC_ENABLE_PARALLAX !== 'false',

  /** 強制使用 CSS-only fallback (預設: false) */
  FORCE_CSS_FALLBACK: process.env.NEXT_PUBLIC_FORCE_CSS_FALLBACK === 'true',
} as const;

/**
 * 取得 Feature Flag 狀態
 */
export function isAnimationEnabled(feature: keyof typeof ANIMATION_FEATURE_FLAGS): boolean {
  return ANIMATION_FEATURE_FLAGS[feature];
}
```

**使用範例**:

```typescript
// useScrollAnimation.ts
import { isAnimationEnabled } from './featureFlags';

export function useScrollAnimation(options: UseScrollAnimationOptions) {
  // ...

  useLayoutEffect(() => {
    if (!isAnimationEnabled('ENABLE_GSAP_ANIMATIONS')) {
      console.warn('[useScrollAnimation] GSAP animations disabled by feature flag');
      return;
    }

    // ... GSAP 初始化邏輯
  }, []);
}
```

### 2. CSS-Only Fallback

**保留舊的 CSS animations 作為 fallback**:

`/src/styles/animations-fallback.css` (新建)

```css
/**
 * CSS-Only Animation Fallback
 * 當 GSAP/Framer Motion 載入失敗或 feature flag 停用時使用
 */

.css-fallback-enabled .hero-title {
  animation: fadeInUp 0.8s ease-out;
}

.css-fallback-enabled .hero-subtitle {
  animation: fadeInUp 0.8s ease-out 0.3s;
  animation-fill-mode: both;
}

.css-fallback-enabled .hero-cta {
  animation: scaleIn 0.6s ease-out 0.5s;
  animation-fill-mode: both;
}

.css-fallback-enabled .step-card {
  animation: fadeInUp 0.6s ease-out;
  animation-fill-mode: both;
}

.css-fallback-enabled .step-card:nth-child(1) {
  animation-delay: 0.15s;
}
.css-fallback-enabled .step-card:nth-child(2) {
  animation-delay: 0.3s;
}
.css-fallback-enabled .step-card:nth-child(3) {
  animation-delay: 0.45s;
}
.css-fallback-enabled .step-card:nth-child(4) {
  animation-delay: 0.6s;
}

/* Keyframes */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .css-fallback-enabled * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**啟用 Fallback**:

```tsx
// client-page.tsx
import { ANIMATION_FEATURE_FLAGS } from '@/lib/animations/featureFlags';

export default function ClientPage() {
  const useCSSFallback = ANIMATION_FEATURE_FLAGS.FORCE_CSS_FALLBACK;

  return (
    <div
      className={clsx(
        'min-h-screen text-pip-boy-green',
        useCSSFallback && 'css-fallback-enabled'
      )}
    >
      {/* ... sections */}
    </div>
  );
}
```

### 3. Rollback 流程

#### Scenario 1: 效能問題（FPS < 50）

**症狀**:
- Lighthouse Performance score < 90
- 使用者回報滾動卡頓
- FPS 監控顯示持續低於 50

**快速 Rollback (1-5 分鐘)**:
```bash
# 1. 啟用 CSS fallback feature flag
export NEXT_PUBLIC_FORCE_CSS_FALLBACK=true
bun run build
bun run start

# 2. 驗證效能改善
# 若改善，保持此設定直到找到根本原因
```

**完整 Rollback (1-2 小時)**:
```bash
# 1. Rollback 至 Phase 6 (效能優化階段前)
git checkout animation-phase-6

# 2. 建立 hotfix branch
git checkout -b hotfix/animation-performance

# 3. 重新部署
bun run build
bun run start

# 4. 驗證問題解決
# 若解決，investigate Phase 7 變更找出根本原因
```

#### Scenario 2: 視覺異常或動畫衝突

**症狀**:
- 動畫播放不正確
- Layout shift 增加
- 特定 section 動畫失效

**定位問題**:
```bash
# 1. 確認問題首次出現的 Phase
git bisect start
git bisect bad HEAD
git bisect good animation-phase-5

# 2. 測試每個 commit 直到找到問題 commit
git bisect run bun test

# 3. 找到問題後 rollback 至該 Phase 前一版本
git checkout animation-phase-[N-1]
```

#### Scenario 3: 特定裝置/瀏覽器相容性問題

**症狀**:
- Safari 動畫異常
- Mobile 裝置效能差
- 特定解析度下 layout 錯亂

**選擇性 Rollback**:
```bash
# 使用 feature flags 停用有問題的功能
# Safari 視差問題
export NEXT_PUBLIC_ENABLE_PARALLAX=false

# Mobile 效能問題 (停用 GSAP)
if (getViewportCategory() === 'mobile') {
  export NEXT_PUBLIC_ENABLE_GSAP=false
}
```

### 4. 驗證檢查清單

Rollback 後必須執行的驗證：

```bash
# 1. 單元測試通過
bun test

# 2. E2E 測試通過
bun test:e2e

# 3. Lighthouse Performance >= 90
bun test:performance

# 4. 視覺回歸測試
# (手動檢查或使用 Percy/Chromatic)

# 5. 多瀏覽器測試
# - Chrome (latest)
# - Safari (latest)
# - Firefox (latest)
# - Mobile Chrome (iOS & Android)
```

### 5. 復原計畫

當問題修復後，復原至完整動畫系統：

```bash
# 1. 關閉 feature flags
unset NEXT_PUBLIC_FORCE_CSS_FALLBACK
unset NEXT_PUBLIC_ENABLE_PARALLAX

# 2. Checkout 至最新版本
git checkout main

# 3. 重新測試
bun test
bun test:e2e
bun test:performance

# 4. 部署
bun run build
bun run start
```

## 監控與告警

### 效能監控指標

**生產環境監控** (建議整合至專案監控系統):

- **FPS 平均值**: 目標 >= 55
- **CLS**: 目標 <= 0.1
- **LCP**: 目標 <= 2.5s
- **FCP**: 目標 <= 1.8s
- **JavaScript Bundle Size**: 目標 <= 300KB (gzipped)

### 告警閾值

```typescript
// /src/lib/animations/performanceMonitor.ts
export const PERFORMANCE_THRESHOLDS = {
  MIN_FPS: 50,              // 低於此值 console.warn
  CRITICAL_FPS: 30,         // 低於此值 自動啟用 fallback
  MAX_CLS: 0.1,
  MAX_LCP: 2500,            // ms
  MAX_FCP: 1800,            // ms
  MAX_BUNDLE_SIZE: 307200,  // bytes (300KB)
} as const;
```

## 文件資源

- **Animation System README**: `/src/lib/animations/README.md`
- **Phase Implementation Summaries**: `.kiro/specs/homepage-animation-system/IMPLEMENTATION_SUMMARY_PHASE*.md`
- **Performance Test Results**: `tests/performance/` (Playwright 報告)
- **Coverage Reports**: `coverage/` (Vitest 覆蓋率)

---

**文件版本**: 1.0
**最後更新**: 2025-11-17
**作者**: Claude (TDD Agent)
**狀態**: ✅ Ready for Production
