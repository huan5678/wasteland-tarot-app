# Requirements Document

## Introduction

本項目旨在升級廢土塔羅平台的首頁動畫系統，整合 GSAP（GreenSock Animation Platform）和 Framer Motion 兩大專業動畫庫，打造統一、高效且具沉浸感的滾動動畫體驗。系統將以 GSAP Timeline 和 ScrollTrigger 作為核心滾動動畫控制架構，搭配 Framer Motion 實作微動畫與互動效果，同時確保效能優化（60fps）、響應式設計和無障礙支援（prefers-reduced-motion）。

專案涵蓋七大首頁區塊的動畫升級：
1. **Hero Section** - 視差效果與入場動畫
2. **How It Works** - 錯開入場動畫
3. **Stats** - 數字滾動動畫
4. **Testimonials** - 浮入動畫
5. **Features** - 圖示特效
6. **FAQ** - 展開/收合動畫
7. **CTA** - 呼吸發光效果

所有動畫必須完整整合於 Next.js 15 + React 19 環境，並遵循 Wasteland Tarot 的 Fallout 風格設計原則（Pip-Boy 介面、80s 像素藝術、終端效果）。

---

## Requirements

### Requirement 1: GSAP 核心動畫架構整合

**User Story**: As a 前端開發者, I want to integrate GSAP Timeline and ScrollTrigger as the core animation control architecture, so that 我可以統一管理所有滾動動畫並確保最佳效能表現。

#### Acceptance Criteria

1. WHEN the application initializes, the Homepage Animation System SHALL install GSAP library (>=3.12.0) and ScrollTrigger plugin via Bun package manager
2. WHEN the homepage component mounts, the Homepage Animation System SHALL initialize a global GSAP Timeline instance for coordinating all section animations
3. WHEN the user scrolls the page, the ScrollTrigger plugin SHALL monitor viewport position and trigger corresponding animations at defined breakpoints
4. WHERE GSAP is integrated with Next.js 15 App Router, the Homepage Animation System SHALL use `"use client"` directive and wrap GSAP initialization in `useEffect` hook to ensure client-side-only execution
5. The GSAP Timeline SHALL support sequential, parallel, and staggered animation patterns across different homepage sections
6. IF GSAP or ScrollTrigger fails to load, the Homepage Animation System SHALL gracefully degrade to CSS-only animations without breaking the UI
7. The Homepage Animation System SHALL expose a centralized animation config object (`gsapConfig.ts`) containing all timeline parameters, easing functions, and duration settings

---

### Requirement 2: Framer Motion 微動畫整合

**User Story**: As a 前端開發者, I want to integrate Framer Motion for micro-interactions and component-level animations, so that 我可以實作流暢的互動效果並與 GSAP 架構無縫協作。

#### Acceptance Criteria

1. WHEN the application initializes, the Homepage Animation System SHALL install Framer Motion library (motion package >=12.23.22) via Bun package manager
2. WHERE Framer Motion is used for component-level animations, the Homepage Animation System SHALL utilize `motion` components for hover effects, tap animations, and layout animations
3. WHEN GSAP Timeline controls scroll-based animations, Framer Motion SHALL handle independent micro-interactions such as button hover states, card flips, and icon rotations
4. The Homepage Animation System SHALL NOT create animation conflicts by ensuring GSAP controls scroll-triggered animations and Framer Motion controls user-interaction-triggered animations
5. WHERE Framer Motion variants are defined, the Homepage Animation System SHALL create reusable animation variants in `motionVariants.ts` file for consistent styling
6. The Homepage Animation System SHALL use Framer Motion's `useInView` hook for viewport detection when scroll-triggered animations do not require precise GSAP control

---

### Requirement 3: Hero Section 視差效果與入場動畫

**User Story**: As a 網站訪客, I want to see an immersive parallax effect and entrance animation in the Hero Section, so that 我能立即感受到 Wasteland Tarot 的科技感與神秘氛圍。

#### Acceptance Criteria

1. WHEN the Hero Section enters the viewport, the Hero Section SHALL trigger a GSAP Timeline that animates the following elements in sequence:
   - Title text fades in with upward translation (0.8s, ease-out)
   - Subtitle fades in 0.3s after title (0.6s, ease-out)
   - CTA button scales in 0.5s after subtitle (0.4s, elastic ease)
2. WHILE the user scrolls, the Hero Section SHALL apply parallax effect using GSAP ScrollTrigger where:
   - Background layer moves at 0.5x scroll speed
   - Foreground content moves at 1x scroll speed (normal)
   - Creating depth perception effect
3. WHERE the device supports `prefers-reduced-motion`, the Hero Section SHALL disable parallax effects and reduce animation durations to instant (0s)
4. The Hero Section SHALL maintain 60fps performance during parallax scrolling on desktop and mobile devices
5. The Hero Section SHALL use Framer Motion for CTA button hover effect (scale: 1.05, glow intensity increase)

---

### Requirement 4: How It Works 錯開入場動畫

**User Story**: As a 網站訪客, I want to see step cards appear with staggered timing, so that 我能清楚理解操作流程且視覺上更具吸引力。

#### Acceptance Criteria

1. WHEN the How It Works section enters the viewport (50% visible), the How It Works Section SHALL trigger a GSAP stagger animation where:
   - Each step card animates sequentially with 0.15s delay between each card
   - Each card fades in (opacity: 0 → 1) and translates up (y: 40px → 0px) over 0.6s
   - Easing function: power2.out
2. WHEN the user scrolls past the How It Works section, the How It Works Section SHALL NOT reverse the animation (play once only)
3. WHERE step cards contain icons, the How It Works Section SHALL use Framer Motion to animate icon rotation (0deg → 360deg) upon card entrance
4. The How It Works Section SHALL ensure animations are synchronized with card content rendering to prevent layout shift (CLS = 0)
5. WHERE `prefers-reduced-motion` is enabled, the How It Works Section SHALL instantly display all cards without stagger or transition effects

---

### Requirement 5: Stats 數字滾動動畫

**User Story**: As a 網站訪客, I want to see statistics numbers count up dynamically, so that 我能直觀感受到平台的活躍度與價值。

#### Acceptance Criteria

1. WHEN the Stats section enters the viewport (60% visible), the Stats Section SHALL trigger GSAP animation to count up each numeric stat from 0 to target value
2. The Stats Section SHALL use GSAP's `onUpdate` callback to update React state and re-render numbers in real-time during animation
3. WHEN counting up numbers, the Stats Section SHALL format numbers with appropriate separators:
   - Thousands separator (comma for numbers ≥ 1,000)
   - Decimal precision based on config (e.g., 4.8 stars, 1,234 users)
4. The Stats Section SHALL complete all number animations within 2 seconds with easeOut timing
5. WHERE different stats have different magnitudes, the Stats Section SHALL use customized animation durations to ensure visual coherence:
   - Small numbers (< 100): 1.2s
   - Medium numbers (100-10,000): 1.5s
   - Large numbers (> 10,000): 2s
6. WHERE `prefers-reduced-motion` is enabled, the Stats Section SHALL instantly display final numbers without counting animation
7. The Stats Section SHALL use Framer Motion for background pulse effect on stat cards during number counting

---

### Requirement 6: Testimonials 浮入動畫

**User Story**: As a 網站訪客, I want to see testimonial cards float into view, so that 我能專注閱讀用戶評價且視覺體驗更生動。

#### Acceptance Criteria

1. WHEN the Testimonials section enters the viewport (40% visible), the Testimonials Section SHALL trigger GSAP Timeline that animates testimonial cards with the following sequence:
   - Cards fade in (opacity: 0 → 1) over 0.8s
   - Cards translate from bottom (y: 60px → 0px) simultaneously
   - Easing: power3.out
2. WHERE multiple testimonial cards exist, the Testimonials Section SHALL apply stagger effect with 0.2s delay between each card
3. WHEN a testimonial card is hovered, the Testimonials Section SHALL use Framer Motion to apply hover effect:
   - Scale: 1.02
   - Shadow intensity increase (Fallout-themed glow)
   - Transition duration: 0.3s
4. The Testimonials Section SHALL ensure avatar images are loaded before triggering animations to prevent content flashing
5. WHERE `prefers-reduced-motion` is enabled, the Testimonials Section SHALL display cards instantly without float-in animation

---

### Requirement 7: Features 圖示特效

**User Story**: As a 網站訪客, I want to see feature icons animate when I interact with them, so that 我能更清楚理解每個功能的重要性。

#### Acceptance Criteria

1. WHEN the Features section enters the viewport (50% visible), the Features Section SHALL trigger GSAP stagger animation where feature cards fade in and scale from 0.9 to 1 over 0.5s with 0.1s stagger delay
2. WHEN the user hovers over a feature card, the Features Section SHALL use Framer Motion to trigger icon animation:
   - Icon rotates 360 degrees over 0.6s (easeInOut)
   - Icon color transitions to highlight color (Pip-Boy Green #00ff88)
3. WHERE PixelIcon component is used (as per project standards), the Features Section SHALL apply Framer Motion's `whileHover` prop to icon container element
4. The Features Section SHALL ensure icon animations do not conflict with GSAP scroll-triggered animations by separating trigger contexts
5. WHERE `prefers-reduced-motion` is enabled, the Features Section SHALL disable icon rotation and only apply color transition on hover
6. The Features Section SHALL maintain icon animation performance at 60fps by using GPU-accelerated transforms

---

### Requirement 8: FAQ 展開動畫

**User Story**: As a 網站訪客, I want to see FAQ items expand and collapse smoothly, so that 我能輕鬆閱讀所需資訊且介面保持整潔。

#### Acceptance Criteria

1. WHEN the user clicks on a FAQ item, the FAQ Section SHALL use Framer Motion's `AnimatePresence` and `motion.div` to animate content expansion/collapse
2. WHEN expanding, the FAQ Section SHALL:
   - Animate height from 0 to auto over 0.3s (easeOut)
   - Fade in content (opacity: 0 → 1) over 0.2s with 0.1s delay
   - Rotate arrow icon from 0deg to 180deg over 0.3s
3. WHEN collapsing, the FAQ Section SHALL:
   - Animate height from auto to 0 over 0.3s (easeIn)
   - Fade out content (opacity: 1 → 0) over 0.15s
   - Rotate arrow icon from 180deg to 0deg over 0.3s
4. The FAQ Section SHALL ensure only one FAQ item is expanded at a time (accordion behavior)
5. WHERE `prefers-reduced-motion` is enabled, the FAQ Section SHALL instantly toggle content visibility without height or opacity animations
6. The FAQ Section SHALL prevent layout shift by reserving space for expanded content or using overflow clipping during animation

---

### Requirement 9: CTA 呼吸發光動畫

**User Story**: As a 網站訪客, I want to see the CTA button glow and pulse, so that 我能被引導進行下一步動作。

#### Acceptance Criteria

1. The CTA Section SHALL use Framer Motion to create an infinite breathing animation on the CTA button where:
   - Box shadow intensity pulses from normal to high over 2s (easeInOut)
   - Animation loops infinitely
   - Glow color: Pip-Boy Green (#00ff88) or Radiation Orange (#ff8800)
2. WHEN the user hovers over the CTA button, the CTA Section SHALL pause the breathing animation and apply stronger glow effect using Framer Motion's `whileHover` state
3. WHEN the user clicks the CTA button, the CTA Section SHALL trigger Framer Motion's `whileTap` animation (scale: 0.95) before navigation
4. WHERE `prefers-reduced-motion` is enabled, the CTA Section SHALL disable breathing animation and apply static glow effect
5. The CTA Section SHALL ensure glow animation does not cause performance degradation by using CSS box-shadow (GPU-accelerated) instead of SVG filters

---

### Requirement 10: 響應式設計支援

**User Story**: As a 網站訪客使用手機或平板, I want all animations to work smoothly on my device, so that 我能獲得一致且流暢的使用體驗。

#### Acceptance Criteria

1. WHEN the viewport width is less than 768px (mobile), the Homepage Animation System SHALL reduce animation complexity by:
   - Disabling parallax effects in Hero Section
   - Reducing stagger delays by 50% (e.g., 0.15s → 0.075s)
   - Simplifying complex multi-step animations to single-step transitions
2. WHEN the device has limited GPU capabilities (detected via performance heuristics), the Homepage Animation System SHALL automatically downgrade animations to CSS-only transitions
3. The Homepage Animation System SHALL use GSAP's `matchMedia` utility to define responsive animation breakpoints:
   - Mobile: `(max-width: 767px)`
   - Tablet: `(min-width: 768px) and (max-width: 1023px)`
   - Desktop: `(min-width: 1024px)`
4. WHERE touch devices are detected, the Homepage Animation System SHALL replace hover animations with tap-triggered animations using Framer Motion's `whileTap` prop
5. The Homepage Animation System SHALL ensure all animations maintain 60fps on devices with 120Hz displays by using GSAP's `ticker` for frame-rate optimization

---

### Requirement 11: 無障礙支援 (prefers-reduced-motion)

**User Story**: As a 對動畫敏感的使用者, I want animations to be minimized or disabled when I enable reduced motion settings, so that 我能舒適地瀏覽網站而不會感到不適。

#### Acceptance Criteria

1. WHEN the user's OS or browser has `prefers-reduced-motion: reduce` enabled, the Homepage Animation System SHALL detect this setting via CSS media query or JavaScript
2. WHERE `prefers-reduced-motion: reduce` is detected, the Homepage Animation System SHALL:
   - Disable all scroll-triggered GSAP animations
   - Disable all parallax effects
   - Disable infinite loop animations (e.g., CTA breathing glow)
   - Replace animated transitions with instant state changes (duration: 0s)
3. The Homepage Animation System SHALL still allow essential interactive feedback (e.g., button tap scale) with reduced duration (<= 0.1s) for usability
4. The Homepage Animation System SHALL apply reduced-motion styles globally using a CSS class or data attribute on the root element
5. WHERE reduced motion is enabled, the Homepage Animation System SHALL log a console message confirming accessibility mode is active (development mode only)

---

### Requirement 12: 效能優化與 60fps 保證

**User Story**: As a 網站訪客, I want all animations to run smoothly without lag, so that 我能享受流暢的視覺體驗而不會感到挫折。

#### Acceptance Criteria

1. The Homepage Animation System SHALL maintain 60fps (16.67ms per frame) during all animation playback by:
   - Using GPU-accelerated CSS properties only (transform, opacity)
   - Avoiding layout-triggering properties (width, height, top, left, margin, padding)
   - Implementing GSAP's `force3D: true` to force hardware acceleration
2. WHEN the page loads, the Homepage Animation System SHALL preload all animation dependencies (GSAP, ScrollTrigger, Framer Motion) during initial bundle load to prevent animation jank
3. The Homepage Animation System SHALL use React's `useMemo` and `useCallback` to memoize animation configurations and prevent unnecessary re-renders
4. WHEN ScrollTrigger detects scroll events, the Homepage Animation System SHALL use passive event listeners to avoid blocking the main thread
5. WHERE complex animations cause frame drops (detected via GSAP's built-in lag monitoring), the Homepage Animation System SHALL automatically simplify animations or reduce stagger counts
6. The Homepage Animation System SHALL implement lazy initialization where GSAP Timelines are created only when the corresponding section enters the viewport (via Intersection Observer)
7. The Homepage Animation System SHALL prevent cumulative layout shift (CLS) by reserving space for animated elements with CSS min-height or aspect-ratio properties

---

### Requirement 13: React 整合與狀態管理

**User Story**: As a 前端開發者, I want animations to integrate seamlessly with React component lifecycle, so that 我能避免記憶體洩漏和狀態衝突。

#### Acceptance Criteria

1. WHEN a component with GSAP animations mounts, the Homepage Animation System SHALL initialize animations within `useEffect` hook and return a cleanup function to kill Timelines and ScrollTriggers on unmount
2. WHEN a component re-renders, the Homepage Animation System SHALL NOT recreate GSAP Timelines unless dependencies change (managed via `useEffect` dependency array)
3. WHERE animations update React state (e.g., number counting in Stats section), the Homepage Animation System SHALL use `useRef` to store GSAP instances and prevent stale closures
4. The Homepage Animation System SHALL use `useLayoutEffect` instead of `useEffect` when animation measurements depend on DOM layout (e.g., element dimensions)
5. WHERE animations are triggered by user actions, the Homepage Animation System SHALL use Framer Motion's declarative API (`variants`, `animate` prop) instead of imperative GSAP calls for simpler state synchronization
6. The Homepage Animation System SHALL expose custom React hooks (`useScrollAnimation`, `useParallax`, `useStagger`) to encapsulate GSAP logic and promote reusability
7. IF GSAP plugins fail to register (e.g., due to SSR issues in Next.js), the Homepage Animation System SHALL gracefully handle errors and log warnings without crashing the application

---

### Requirement 14: 動畫配置檔案管理

**User Story**: As a 前端開發者, I want all animation parameters centralized in configuration files, so that 我能快速調整動畫效果而不需修改業務邏輯程式碼。

#### Acceptance Criteria

1. The Homepage Animation System SHALL create a `gsapConfig.ts` file in `/src/lib/animations/` directory containing:
   - Default durations for each animation type (entrance, exit, hover, scroll)
   - Easing functions (e.g., `power2.out`, `elastic.out`)
   - Stagger delays
   - ScrollTrigger breakpoints
2. The Homepage Animation System SHALL create a `motionVariants.ts` file in `/src/lib/animations/` directory containing:
   - Framer Motion animation variants for common patterns (fadeIn, slideUp, scaleIn)
   - Transition configurations
3. WHERE animation configs are modified, the Homepage Animation System SHALL apply changes globally without requiring component-level code changes
4. The animation config files SHALL export TypeScript types/interfaces to ensure type safety when consuming configs
5. The Homepage Animation System SHALL support environment-based config overrides (e.g., faster animations in development mode for testing)

---

### Requirement 15: Fallout 風格主題一致性

**User Story**: As a Wasteland Tarot 產品經理, I want all animations to align with Fallout aesthetic, so that 我能維持品牌視覺識別的一致性。

#### Acceptance Criteria

1. The Homepage Animation System SHALL use Pip-Boy Green (#00ff88) and Radiation Orange (#ff8800) as primary glow colors in animations
2. WHERE scanline or terminal effects are applied, the Homepage Animation System SHALL use CSS overlays or GSAP-controlled opacity masks to create retro screen effects
3. The Homepage Animation System SHALL apply pixelated or dithered transitions (where appropriate) to maintain 80s pixel art style consistency
4. WHERE motion blur or smooth gradients are used, the Homepage Animation System SHALL ensure they do not conflict with the intentionally retro aesthetic
5. The CTA button breathing glow SHALL use a Geiger counter pulse rhythm (slow-fast-slow pattern) to align with Fallout radiation theme

---

### Requirement 16: 開發者體驗與文件

**User Story**: As a 前端開發者新加入專案, I want comprehensive documentation and code examples, so that 我能快速理解動畫系統並進行擴展。

#### Acceptance Criteria

1. The Homepage Animation System SHALL provide a `README.md` file in `/src/lib/animations/` directory documenting:
   - Architecture overview (GSAP vs Framer Motion usage)
   - Configuration file locations
   - Custom hooks API reference
   - Performance best practices
2. The Homepage Animation System SHALL include TypeScript JSDoc comments for all exported functions and hooks
3. The Homepage Animation System SHALL provide code examples in README for common use cases:
   - Adding a new scroll-triggered animation
   - Creating a custom Framer Motion variant
   - Implementing reduced-motion support
4. WHERE animations use advanced GSAP features (e.g., timeline nesting, custom ease), the code SHALL include inline comments explaining the rationale
5. The Homepage Animation System SHALL provide a Storybook or isolated demo page showcasing all animation patterns for visual QA

---

### Requirement 17: 測試與品質保證

**User Story**: As a QA 工程師, I want automated tests to verify animation behavior, so that 我能確保動畫在程式碼變更後仍正常運作。

#### Acceptance Criteria

1. The Homepage Animation System SHALL include Jest unit tests for custom animation hooks that verify:
   - Cleanup functions are called on unmount
   - Animations respect `prefers-reduced-motion` setting
   - Config parameters are correctly applied
2. The Homepage Animation System SHALL include Playwright E2E tests that verify:
   - Animations trigger at correct scroll positions
   - 60fps performance is maintained (via Lighthouse CI)
   - Animations complete without errors on different viewports
3. WHERE visual regression testing is implemented, the Homepage Animation System SHALL capture screenshots of animation states (start, mid, end) for comparison
4. The Homepage Animation System SHALL use Playwright's `waitForSelector` and `waitForTimeout` utilities to synchronize test execution with animation completion
5. The test suite SHALL run in CI/CD pipeline and fail builds if performance budgets are exceeded (e.g., CLS > 0.1, FCP > 2s)
