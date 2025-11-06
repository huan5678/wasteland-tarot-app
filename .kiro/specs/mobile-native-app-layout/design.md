# Design Specification: Mobile Native App Layout

**Feature**: mobile-native-app-layout  
**Status**: Design Phase  
**Date**: 2025-11-06  
**Author**: Development Team

---

## 目錄

1. [設計概述](#1-設計概述)
2. [架構設計](#2-架構設計)
3. [元件規格](#3-元件規格)
4. [佈局系統](#4-佈局系統)
5. [導航系統](#5-導航系統)
6. [動畫規格](#6-動畫規格)
7. [平台適配](#7-平台適配)
8. [互動設計](#8-互動設計)
9. [效能優化](#9-效能優化)
10. [實作計畫](#10-實作計畫)

---

## 1. 設計概述

### 1.1 設計目標

將 Wasteland Tarot 的行動版網站體驗提升至原生 App 水準，在保持 Pip-Boy 廢土美學的前提下，實現：

- **沉浸式全螢幕**: 移除瀏覽器 UI，100vh 佈局 + Safe Area 支援
- **原生導航**: 固定底部 Tab Bar，支援手勢切換與動畫過場
- **流暢互動**: 60fps 動畫，觸覺反饋，下拉刷新
- **平台一致性**: iOS/Android 設計規範差異化處理

### 1.2 設計原則

#### Principle 1: Progressive Enhancement
```
Mobile-First → Touch-Optimized → Native-Like → PWA
```
- 基礎功能在所有裝置運作 (HTML + CSS)
- 觸控裝置增強互動 (Gestures + Haptics)
- 支援 PWA 裝置進入沉浸式模式
- 不破壞桌面版體驗

#### Principle 2: Performance Budget
```
FCP ≤ 1.5s | LCP ≤ 2.5s | CLS ≤ 0.1 | 60fps animations
```
- 所有動畫使用 GPU 加速 (transform + opacity)
- 避免 layout thrashing (批次 DOM 操作)
- 圖片 lazy load + WebP format
- Code splitting by route

#### Principle 3: Accessibility First
```
WCAG 2.1 AA → AAA touch targets → Screen reader optimized
```
- 最小觸控目標 44x44px (AAA: 48x48px)
- 完整鍵盤導航支援
- 螢幕閱讀器語意化標記
- 尊重 `prefers-reduced-motion`

---

## 2. 架構設計

### 2.1 元件層級結構

```
RootLayout (app/layout.tsx)
├── MobileLayoutProvider (New)
│   ├── useIsMobile()
│   ├── usePlatform() → 'ios' | 'android' | 'web'
│   ├── useSafeArea() → { top, right, bottom, left }
│   └── useAppShellState() → { bottomNavHeight, headerHeight }
│
├── AppShell (New Component)
│   ├── Header → MobileAppBar (transforms on mobile)
│   │   ├── Logo
│   │   ├── SearchButton
│   │   └── NotificationBell
│   │
│   ├── Main Content
│   │   ├── PageTransitionWrapper (New)
│   │   │   └── {children} (current page)
│   │   │
│   │   └── PullToRefresh (New)
│   │       └── refresh callback
│   │
│   └── MobileBottomNav (Moved from /mobile-demo)
│       ├── Tab: Home
│       ├── Tab: Cards
│       ├── Tab: Readings (FAB style)
│       ├── Tab: Achievements
│       └── Tab: Profile
│
└── Modals/Overlays (Portal)
    ├── BottomSheet (New)
    ├── ContextMenu (New)
    └── Toast (Existing)
```

### 2.2 檔案組織

```
src/
├── components/
│   ├── layout/
│   │   ├── mobile/                          # New Directory
│   │   │   ├── MobileAppBar.tsx             # Header → AppBar
│   │   │   ├── MobileBottomNav.tsx          # Move from /mobile
│   │   │   ├── MobileSafeArea.tsx           # Safe area wrapper
│   │   │   ├── PageTransition.tsx           # Route animations
│   │   │   └── PullToRefresh.tsx            # Pull-to-refresh
│   │   │
│   │   ├── AppShell.tsx                     # New: Main shell
│   │   └── ResponsiveLayout.tsx             # Existing: Keep
│   │
│   └── ui/
│       ├── bottom-sheet.tsx                 # New: Modal variant
│       ├── context-menu.tsx                 # New: Long-press menu
│       └── floating-action-button.tsx       # New: FAB component
│
├── hooks/
│   ├── useMobileLayout.ts                   # New: Layout state
│   ├── usePlatform.ts                       # New: iOS/Android detect
│   ├── useSafeArea.ts                       # New: Safe area hook
│   └── usePageTransition.ts                 # New: Route animation
│
├── providers/
│   └── MobileLayoutProvider.tsx             # New: Context provider
│
└── styles/
    └── mobile-native.css                    # New: Mobile styles
```

---

## 3. 元件規格

### 3.1 MobileAppBar (Header 行動版變體)

#### 設計規格
```typescript
interface MobileAppBarProps {
  title?: string;                    // 頁面標題
  showBackButton?: boolean;          // 顯示返回按鈕
  onBackClick?: () => void;          // 返回回調
  actions?: AppBarAction[];          // 右側操作按鈕
  transparent?: boolean;             // 透明模式
  hideOnScroll?: boolean;            // 滾動隱藏
  scrollThreshold?: number;          // 隱藏閾值 (預設 100px)
}

interface AppBarAction {
  icon: IconName;
  label: string;
  onClick: () => void;
  badge?: number;
}
```

#### 視覺規格
```css
/* iOS Style */
.mobile-app-bar-ios {
  height: 56px;
  background: rgba(10, 15, 10, 0.8); /* Wasteland darker + 80% opacity */
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 255, 136, 0.1);
  
  /* Safe area */
  padding-top: env(safe-area-inset-top);
}

/* Android Style */
.mobile-app-bar-android {
  height: 56px;
  background: #0a0f0a; /* Solid color */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* Material elevation */
  border-bottom: 1px solid rgba(0, 255, 136, 0.2);
}
```

#### 動畫行為
```typescript
// 滾動隱藏邏輯
const useAppBarVisibility = (threshold = 100) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 向下滾動 > threshold → 隱藏
      if (currentScrollY > lastScrollY && currentScrollY > threshold) {
        setIsVisible(false);
      }
      // 向上滾動 → 顯示
      else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, threshold]);
  
  return isVisible;
};

// 動畫配置
const appBarSpring = useSpring({
  transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
  config: { tension: 300, friction: 30 }
});
```

---

### 3.2 MobileBottomNav (底部導航)

#### 設計規格
```typescript
interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface NavTab {
  id: string;
  label: string;
  icon: IconName;
  href: string;
  badge?: number;                    // 通知徽章
  isFAB?: boolean;                   // 主要操作 (凸起按鈕)
}

const BOTTOM_NAV_TABS: NavTab[] = [
  { id: 'home', label: '首頁', icon: 'home', href: '/' },
  { id: 'cards', label: '卡牌', icon: 'cards', href: '/cards' },
  { 
    id: 'readings', 
    label: '占卜', 
    icon: 'book-open', 
    href: '/readings', 
    isFAB: true  // ⭐ Floating Action Button
  },
  { id: 'achievements', label: '成就', icon: 'trophy', href: '/achievements' },
  { id: 'profile', label: '個人', icon: 'user', href: '/profile' }
];
```

#### 視覺規格
```css
/* Base styles */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  z-index: 1000;
  
  /* Safe area */
  padding-bottom: env(safe-area-inset-bottom);
  
  /* Prevent content overlap */
  --bottom-nav-total-height: calc(64px + env(safe-area-inset-bottom));
}

/* iOS Style */
.bottom-nav-ios {
  background: rgba(10, 15, 10, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 0.5px solid rgba(0, 255, 136, 0.2);
}

/* Android Style */
.bottom-nav-android {
  background: #0a0f0a;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 255, 136, 0.1);
}

/* Tab item */
.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 0;
  min-width: 44px; /* WCAG AAA touch target */
  min-height: 44px;
  color: rgba(0, 255, 136, 0.6);
  transition: color 200ms ease;
}

.nav-tab.active {
  color: #00ff88; /* Pip-Boy green */
}

.nav-tab-icon {
  width: 24px;
  height: 24px;
}

.nav-tab-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* FAB (Floating Action Button) */
.nav-tab-fab {
  position: relative;
  top: -16px; /* 凸起效果 */
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
  box-shadow: 
    0 4px 8px rgba(0, 255, 136, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.4);
  
  /* Border ring */
  border: 3px solid #0a0f0a;
}

.nav-tab-fab:active {
  transform: scale(0.95);
  box-shadow: 
    0 2px 4px rgba(0, 255, 136, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.3);
}
```

#### 手勢互動
```typescript
// 橫向滑動切換 Tab
const { swipeLeft, swipeRight } = useAdvancedGestures({
  onSwipeLeft: () => {
    const currentIndex = tabs.findIndex(t => t.href === currentPath);
    const nextTab = tabs[currentIndex + 1];
    if (nextTab) onNavigate(nextTab.href);
  },
  onSwipeRight: () => {
    const currentIndex = tabs.findIndex(t => t.href === currentPath);
    const prevTab = tabs[currentIndex - 1];
    if (prevTab) onNavigate(prevTab.href);
  },
  swipeThreshold: 50, // 滑動距離
  velocityThreshold: 0.5 // 滑動速度
});

// 雙擊回頂部
const handleTabClick = (tab: NavTab) => {
  if (currentPath === tab.href) {
    // 已在該 Tab，滾動到頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerHaptic('light');
  } else {
    // 切換 Tab
    onNavigate(tab.href);
    triggerHaptic('medium');
  }
};
```

---

### 3.3 PageTransition (頁面切換動畫)

#### 設計規格
```typescript
interface PageTransitionProps {
  children: React.ReactNode;
  direction: 'forward' | 'backward' | 'none';
  duration?: number; // 預設 300ms
}

type TransitionType = 
  | 'slide'       // 左右滑動 (預設)
  | 'fade'        // 淡入淡出 (Tab 切換)
  | 'slideUp'     // 向上滑入 (Modal)
  | 'none';       // 無動畫 (prefers-reduced-motion)
```

#### 動畫實作
```typescript
// 使用 Framer Motion
const pageVariants = {
  // Forward navigation (新頁面從右滑入)
  slideInRight: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-30%', opacity: 0 }
  },
  
  // Backward navigation (新頁面從左滑入)
  slideInLeft: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '30%', opacity: 0 }
  },
  
  // Tab switch (交叉淡化)
  crossFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  
  // Modal (底部滑出)
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  }
};

const transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8
};

// Component
export function PageTransition({ children, direction, duration = 300 }: PageTransitionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const variant = prefersReducedMotion ? 'none' : 
                  direction === 'forward' ? 'slideInRight' :
                  direction === 'backward' ? 'slideInLeft' : 'crossFade';
  
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ ...transition, duration: duration / 1000 }}
    >
      {children}
    </motion.div>
  );
}
```

---

### 3.4 PullToRefresh (下拉刷新)

#### 設計規格
```typescript
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;          // 觸發距離 (預設 80px)
  disabled?: boolean;          // 停用刷新
  indicatorColor?: string;     // 指示器顏色
}
```

#### 視覺規格
```css
.pull-to-refresh-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 255, 136, 0.1);
  backdrop-filter: blur(10px);
  transform: translateY(-100%);
  transition: transform 300ms ease-out;
  z-index: 999;
}

.pull-to-refresh-indicator.visible {
  transform: translateY(0);
}

.refresh-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 255, 136, 0.3);
  border-top-color: #00ff88;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### 互動邏輯
```typescript
export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  
  const handleTouchStart = (e: TouchEvent) => {
    // 只在頁面頂部啟用
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (startY === 0 || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    // 阻尼效果 (越拉越費力)
    const dampedDistance = distance * (1 - distance / 300);
    setPullDistance(dampedDistance);
  };
  
  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('medium');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // 回彈動畫
      setPullDistance(0);
    }
    setStartY(0);
  };
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <RefreshIndicator 
        distance={pullDistance} 
        threshold={threshold} 
        isRefreshing={isRefreshing} 
      />
      {children}
    </div>
  );
}
```

---

## 4. 佈局系統

### 4.1 Safe Area 處理

#### CSS Variables 設定
```css
:root {
  /* iOS Safe Area Insets */
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  
  /* Layout Heights */
  --app-bar-height: 56px;
  --bottom-nav-height: 64px;
  
  /* Total Heights (including safe areas) */
  --app-bar-total-height: calc(var(--app-bar-height) + var(--safe-area-top));
  --bottom-nav-total-height: calc(var(--bottom-nav-height) + var(--safe-area-bottom));
  
  /* Content Area */
  --content-available-height: calc(
    100vh - var(--app-bar-total-height) - var(--bottom-nav-total-height)
  );
}
```

#### React Hook
```typescript
interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const computedStyle = getComputedStyle(document.documentElement);
    
    const getInsetValue = (property: string): number => {
      const value = computedStyle.getPropertyValue(property);
      return parseFloat(value) || 0;
    };
    
    setInsets({
      top: getInsetValue('--safe-area-top'),
      right: getInsetValue('--safe-area-right'),
      bottom: getInsetValue('--safe-area-bottom'),
      left: getInsetValue('--safe-area-left')
    });
  }, []);
  
  return insets;
}
```

---

### 4.2 內容區域佈局

```typescript
// MobileSafeArea Wrapper Component
export function MobileSafeArea({ children, className }: MobileSafeAreaProps) {
  const { isMobile } = useMobileLayout();
  const safeArea = useSafeArea();
  
  if (!isMobile) return <>{children}</>;
  
  return (
    <div
      className={cn('mobile-safe-area', className)}
      style={{
        paddingTop: `calc(var(--app-bar-total-height))`,
        paddingBottom: `calc(var(--bottom-nav-total-height))`,
        minHeight: `var(--content-available-height)`,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch' // iOS smooth scroll
      }}
    >
      {children}
    </div>
  );
}
```

---

### 4.3 全螢幕沉浸式設定

#### HTML Meta Tags
```html
<!-- app/layout.tsx -->
<head>
  {/* Viewport */}
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  
  {/* PWA */}
  <meta name="theme-color" content="#00ff88" media="(prefers-color-scheme: dark)" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  
  {/* Disable iOS elastic bounce */}
  <meta name="apple-mobile-web-app-no-elastic-bounce" content="yes" />
</head>
```

#### Body Styles
```css
/* src/styles/mobile-native.css */
@media (max-width: 767px) {
  html, body {
    width: 100%;
    height: 100vh; /* Fallback */
    height: 100dvh; /* Dynamic viewport height */
    overflow: hidden; /* 防止 body 滾動 */
  }
  
  body {
    /* Prevent iOS bounce */
    position: fixed;
    overscroll-behavior: none;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Only allow content area to scroll */
  #__next {
    height: 100dvh;
    overflow: hidden;
  }
  
  .mobile-safe-area {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior-y: contain; /* 阻止滾動傳播 */
  }
}
```

---

## 5. 導航系統

### 5.1 路由狀態管理

```typescript
// hooks/useNavigationState.ts
interface NavigationState {
  currentRoute: string;
  previousRoute: string | null;
  direction: 'forward' | 'backward' | 'none';
  isTabSwitch: boolean;
}

export function useNavigationState(): NavigationState {
  const pathname = usePathname();
  const [state, setState] = useState<NavigationState>({
    currentRoute: pathname,
    previousRoute: null,
    direction: 'none',
    isTabSwitch: false
  });
  
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const isTab = BOTTOM_NAV_TABS.some(tab => tab.href === url);
      const prevIsTab = BOTTOM_NAV_TABS.some(tab => tab.href === state.currentRoute);
      
      setState(prev => ({
        currentRoute: url,
        previousRoute: prev.currentRoute,
        direction: detectDirection(prev.currentRoute, url),
        isTabSwitch: isTab && prevIsTab
      }));
    };
    
    // Next.js 14 router events
    const unsubscribe = subscribeToRouteChange(handleRouteChange);
    return unsubscribe;
  }, [state.currentRoute]);
  
  return state;
}

function detectDirection(from: string, to: string): 'forward' | 'backward' | 'none' {
  // 使用 history.state 判斷
  const historyState = window.history.state;
  if (historyState?.options?.scroll === false) return 'backward';
  
  // 或使用路徑深度
  const fromDepth = from.split('/').length;
  const toDepth = to.split('/').length;
  
  if (toDepth > fromDepth) return 'forward';
  if (toDepth < fromDepth) return 'backward';
  return 'none';
}
```

---

### 5.2 Tab 狀態持久化

```typescript
// 記住每個 Tab 的滾動位置
const useTabScrollRestoration = () => {
  const { currentRoute } = useNavigationState();
  const scrollPositions = useRef<Record<string, number>>({});
  
  // 保存滾動位置
  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositions.current[currentRoute] = window.scrollY;
    };
    
    window.addEventListener('scroll', saveScrollPosition, { passive: true });
    return () => window.removeEventListener('scroll', saveScrollPosition);
  }, [currentRoute]);
  
  // 恢復滾動位置
  useEffect(() => {
    const savedPosition = scrollPositions.current[currentRoute];
    if (savedPosition !== undefined) {
      // 延遲恢復，等待頁面渲染
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });
    }
  }, [currentRoute]);
};
```

---

## 6. 動畫規格

### 6.1 動畫類型與參數

| 動畫類型 | 使用場景 | Duration | Easing | Transform |
|---------|---------|----------|--------|-----------|
| **Slide** | 頁面切換 | 300ms | spring(300, 30) | translateX |
| **Fade** | Tab 切換 | 200ms | ease-out | opacity |
| **Slide Up** | Modal 開啟 | 400ms | spring(400, 25) | translateY |
| **Scale** | 按鈕點擊 | 150ms | ease-out | scale |
| **Bounce** | 下拉刷新 | 500ms | spring(200, 15) | translateY + scale |

### 6.2 Spring 物理參數

```typescript
// Animation configs
export const ANIMATION_CONFIGS = {
  // 快速反應 (Tab 切換)
  snappy: {
    tension: 400,
    friction: 25,
    mass: 0.5
  },
  
  // 一般動畫 (頁面切換)
  default: {
    tension: 300,
    friction: 30,
    mass: 0.8
  },
  
  // 柔和動畫 (Modal)
  gentle: {
    tension: 200,
    friction: 25,
    mass: 1.0
  },
  
  // 彈性動畫 (Pull to refresh)
  bouncy: {
    tension: 200,
    friction: 15,
    mass: 1.2
  }
};
```

### 6.3 Reduced Motion 支援

```typescript
// 尊重使用者偏好
export function useAnimationConfig() {
  const prefersReducedMotion = usePrefersReducedMotion();
  
  return {
    duration: prefersReducedMotion ? 0 : undefined,
    config: prefersReducedMotion ? { duration: 0 } : ANIMATION_CONFIGS.default
  };
}

// 使用範例
const { config } = useAnimationConfig();

const spring = useSpring({
  opacity: isVisible ? 1 : 0,
  config: config // 自動適配 reduced motion
});
```

---

## 7. 平台適配

### 7.1 平台檢測

```typescript
// hooks/usePlatform.ts
export type Platform = 'ios' | 'android' | 'web';

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('web');
  
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('web');
    }
  }, []);
  
  return platform;
}

// 使用範例
const platform = usePlatform();
const isIOS = platform === 'ios';
const isAndroid = platform === 'android';
```

---

### 7.2 iOS 特定優化

#### 觸覺反饋強度對應
```typescript
// iOS Haptic Feedback API
const IOS_HAPTIC_MAP = {
  light: 'impactOccurred' with intensity 0.3,
  medium: 'impactOccurred' with intensity 0.6,
  heavy: 'impactOccurred' with intensity 1.0,
  success: 'notificationOccurred' with type 'success',
  error: 'notificationOccurred' with type 'error'
};

export function triggerIOSHaptic(type: HapticType) {
  if (!('haptics' in navigator)) return;
  
  const generator = new (window as any).UIImpactFeedbackGenerator();
  generator.prepare();
  
  switch (type) {
    case 'light':
      generator.impactOccurred('light');
      break;
    case 'medium':
      generator.impactOccurred('medium');
      break;
    case 'heavy':
      generator.impactOccurred('heavy');
      break;
  }
}
```

#### Safe Area 增強
```css
/* iOS Dynamic Island 適配 */
@supports (padding-top: max(0px)) {
  .mobile-app-bar-ios {
    padding-top: max(env(safe-area-inset-top), 20px);
  }
}

/* iOS Home Indicator */
.mobile-bottom-nav-ios {
  padding-bottom: max(env(safe-area-inset-bottom), 8px);
}
```

---

### 7.3 Android 特定優化

#### Material Design 3 Elevation
```css
/* Android elevation system */
.mobile-app-bar-android {
  /* Level 2 elevation */
  box-shadow: 
    0 2px 4px -1px rgba(0, 0, 0, 0.2),
    0 4px 5px 0 rgba(0, 0, 0, 0.14),
    0 1px 10px 0 rgba(0, 0, 0, 0.12);
}

.mobile-bottom-nav-android {
  /* Level 3 elevation */
  box-shadow: 
    0 3px 5px -1px rgba(0, 0, 0, 0.2),
    0 6px 10px 0 rgba(0, 0, 0, 0.14),
    0 1px 18px 0 rgba(0, 0, 0, 0.12);
}

/* FAB elevation */
.nav-tab-fab-android {
  box-shadow: 
    0 4px 8px rgba(0, 255, 136, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.4);
}

.nav-tab-fab-android:active {
  /* Pressed state - lower elevation */
  box-shadow: 
    0 2px 4px rgba(0, 255, 136, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.3);
}
```

#### Gesture Navigation 適配
```typescript
// Android gesture navigation bar height: ~48px
const useAndroidGestureBar = () => {
  const platform = usePlatform();
  const [hasGestureNav, setHasGestureNav] = useState(false);
  
  useEffect(() => {
    if (platform !== 'android') return;
    
    // 檢測是否有 gesture navigation
    // Android 10+ 預設啟用
    const androidVersion = parseInt(
      navigator.userAgent.match(/Android (\d+)/)?.[1] || '0'
    );
    
    setHasGestureNav(androidVersion >= 10);
  }, [platform]);
  
  return hasGestureNav ? 48 : 0;
};
```

---

## 8. 互動設計

### 8.1 長按選單 (Context Menu)

#### 設計規格
```typescript
interface ContextMenuItem {
  id: string;
  label: string;
  icon?: IconName;
  variant?: 'default' | 'destructive';
  onClick: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  triggerRef: React.RefObject<HTMLElement>;
  onClose: () => void;
}
```

#### 互動流程
```
1. 使用者長按 (500ms) → 觸發 haptic 'medium'
2. 選單從觸摸點彈出 (scale + fade animation)
3. 背景變暗 (rgba(0,0,0,0.6))
4. 點擊選單外 → 關閉選單
5. 執行操作 → 觸發對應 haptic → 關閉選單
```

#### 視覺設計
```css
.context-menu {
  position: fixed;
  min-width: 200px;
  background: rgba(10, 15, 10, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  padding: 8px 0;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 255, 136, 0.2);
  
  /* 動畫 */
  transform-origin: top center;
  animation: contextMenuIn 200ms ease-out;
}

@keyframes contextMenuIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #00ff88;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 150ms;
}

.context-menu-item:active {
  background-color: rgba(0, 255, 136, 0.1);
}

.context-menu-item.destructive {
  color: #ff4444;
}
```

---

### 8.2 滑動操作 (Swipe Actions)

#### 設計規格
```typescript
interface SwipeActionsProps {
  children: React.ReactNode;
  actions: {
    left?: SwipeAction[];  // 右滑顯示
    right?: SwipeAction[];  // 左滑顯示
  };
}

interface SwipeAction {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  onExecute: () => void | Promise<void>;
}
```

#### 互動邏輯
```typescript
// Example: 刪除 Reading
<SwipeActions
  actions={{
    right: [
      {
        id: 'delete',
        label: '刪除',
        icon: 'trash',
        color: '#ff4444',
        onExecute: async () => {
          await deleteReading(id);
          triggerHaptic('heavy');
        }
      }
    ]
  }}
>
  <ReadingCard {...reading} />
</SwipeActions>

// 滑動邏輯
const handleSwipe = useCallback(({ delta, velocity, direction }) => {
  const threshold = 0.7; // 70% 寬度自動執行
  const swipeDistance = Math.abs(delta[0]);
  const itemWidth = elementRef.current.offsetWidth;
  
  if (swipeDistance > itemWidth * threshold) {
    // 自動執行操作
    executeAction();
  } else {
    // 回彈
    springBack();
  }
}, []);
```

---

### 8.3 觸覺反饋策略

| 互動類型 | Haptic 強度 | 使用場景 |
|---------|------------|---------|
| **Light** | 輕微 | Tab 切換, 滾動到邊界 |
| **Medium** | 中等 | 按鈕點擊, 長按觸發, 下拉刷新 |
| **Heavy** | 強烈 | 刪除確認, 重要操作 |
| **Success** | 成功 | 操作成功, 保存完成 |
| **Error** | 錯誤 | 操作失敗, 驗證錯誤 |

```typescript
// Centralized haptic manager
export const HapticManager = {
  // 導航
  onTabSwitch: () => triggerHaptic('light'),
  onPageBack: () => triggerHaptic('light'),
  
  // 操作
  onButtonClick: () => triggerHaptic('medium'),
  onToggle: () => triggerHaptic('light'),
  onLongPress: () => triggerHaptic('medium'),
  
  // 反饋
  onSuccess: () => triggerHaptic('success'),
  onError: () => triggerHaptic('error'),
  onDelete: () => triggerHaptic('heavy'),
  
  // 特殊
  onPullToRefresh: () => triggerHaptic('medium'),
  onSwipeAction: () => triggerHaptic('heavy')
};
```

---

## 9. 效能優化

### 9.1 動畫效能

#### GPU 加速
```css
/* 強制 GPU 加速 */
.gpu-accelerated {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 頁面切換 */
.page-transition {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

/* 底部導航 */
.mobile-bottom-nav {
  will-change: transform;
  transform: translateZ(0);
}
```

#### 動畫幀率監控
```typescript
// 檢測掉幀
export function useFrameRate() {
  const [fps, setFps] = useState(60);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      rafId = requestAnimationFrame(measureFPS);
    };
    
    const rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  return fps;
}

// 根據 FPS 降級動畫
const useDynamicAnimationQuality = () => {
  const fps = useFrameRate();
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  
  useEffect(() => {
    if (fps < 30) setQuality('low');
    else if (fps < 50) setQuality('medium');
    else setQuality('high');
  }, [fps]);
  
  return quality;
};
```

---

### 9.2 圖片優化

```typescript
// 使用 Next.js Image 優化
import Image from 'next/image';

<Image
  src="/images/cards/fool.jpg"
  alt="愚者"
  width={300}
  height={500}
  loading="lazy"
  placeholder="blur"
  blurDataURL={blurDataURL} // 自動生成
  quality={80} // 行動版降低品質
  sizes="(max-width: 768px) 100vw, 300px"
/>

// 響應式圖片
const CardImage = ({ card }) => {
  const { isMobile } = useMobileLayout();
  
  return (
    <Image
      src={card.imageUrl}
      alt={card.name}
      width={isMobile ? 200 : 300}
      quality={isMobile ? 75 : 90}
      priority={card.isAboveFold}
    />
  );
};
```

---

### 9.3 程式碼分割

```typescript
// Route-based code splitting
const Dashboard = dynamic(() => import('./dashboard/page'), {
  loading: () => <DashboardSkeleton />,
  ssr: true
});

const ReadingDetail = dynamic(() => import('./readings/[id]/page'), {
  loading: () => <ReadingSkeleton />,
  ssr: false // 詳情頁不需 SSR
});

// Component-level splitting
const HeavyModal = dynamic(() => import('@/components/HeavyModal'), {
  loading: () => <Spinner />,
  ssr: false // Modal 不需 SSR
});

// 條件載入
const MobileOnlyFeature = dynamic(
  () => import('@/components/MobileOnlyFeature'),
  {
    ssr: false,
    loading: () => null
  }
);

function App() {
  const { isMobile } = useMobileLayout();
  
  return (
    <>
      {isMobile && <MobileOnlyFeature />}
    </>
  );
}
```

---

### 9.4 快取策略

```typescript
// Service Worker 快取策略
const CACHE_NAME = 'wasteland-tarot-v1';

const CACHE_STRATEGIES = {
  // App Shell (Cache First)
  appShell: [
    '/',
    '/manifest.json',
    '/icons/*.png',
    '/fonts/cubic-11.woff2'
  ],
  
  // Static Assets (Cache First, fallback Network)
  static: [
    '/images/cards/*.jpg',
    '/images/backgrounds/*.jpg'
  ],
  
  // API (Network First, fallback Cache)
  api: [
    '/api/v1/readings',
    '/api/v1/cards'
  ],
  
  // Never Cache
  dynamic: [
    '/api/v1/user/*',
    '/api/v1/auth/*'
  ]
};

// 實作 Cache First 策略
self.addEventListener('fetch', (event) => {
  const { url } = event.request;
  
  if (shouldCacheFirst(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

---

## 10. 實作計畫

### Phase 1: 基礎架構 (Week 1)

#### Milestone 1.1: 佈局系統
- [ ] 建立 `MobileLayoutProvider` context
- [ ] 實作 `useSafeArea` hook
- [ ] 建立 `MobileSafeArea` wrapper component
- [ ] 設定 CSS variables for safe area
- [ ] 測試 iOS/Android safe area insets

**Acceptance**:
- [ ] Safe area 在 iPhone 14 Pro (Dynamic Island) 正確顯示
- [ ] Safe area 在 Pixel 7 (gesture nav) 正確顯示
- [ ] 內容不被 notch/home indicator 遮擋

#### Milestone 1.2: AppShell 架構
- [ ] 建立 `AppShell` 主元件
- [ ] 重構 `Header` → `MobileAppBar`
- [ ] 移動 `MobileBottomNav` 到 layout 層級
- [ ] 實作滾動隱藏邏輯
- [ ] 整合到 `app/layout.tsx`

**Acceptance**:
- [ ] Header 在行動版自動轉換為 AppBar
- [ ] AppBar 滾動超過 100px 後隱藏
- [ ] 底部導航固定在底部
- [ ] 內容區域正確計算可用高度

---

### Phase 2: 導航系統 (Week 2)

#### Milestone 2.1: 底部導航
- [ ] 完善 `MobileBottomNav` 樣式 (iOS/Android 差異)
- [ ] 實作 FAB 凸起效果
- [ ] 加入通知徽章功能
- [ ] 整合觸覺反饋
- [ ] 實作手勢滑動切換

**Acceptance**:
- [ ] 5 個 Tab 正確顯示與切換
- [ ] 主操作 (占卜) 以 FAB 形式呈現
- [ ] iOS 使用毛玻璃效果，Android 使用 elevation
- [ ] 點擊 Tab 有觸覺回饋
- [ ] 左右滑動可切換相鄰 Tab

#### Milestone 2.2: 頁面切換動畫
- [ ] 建立 `PageTransition` component
- [ ] 實作 `useNavigationState` hook
- [ ] 整合 Framer Motion 頁面過場
- [ ] 實作滾動位置記憶
- [ ] 支援 reduced motion

**Acceptance**:
- [ ] 前進導航從右滑入
- [ ] 後退導航從左滑入
- [ ] Tab 切換淡入淡出
- [ ] 切換 Tab 後滾動位置保持
- [ ] `prefers-reduced-motion` 時無動畫

---

### Phase 3: 進階互動 (Week 3)

#### Milestone 3.1: Pull-to-Refresh
- [ ] 建立 `PullToRefresh` component
- [ ] 實作下拉檢測與阻尼效果
- [ ] 設計刷新指示器 UI
- [ ] 整合到 Dashboard/Readings 列表
- [ ] 測試不同裝置觸控靈敏度

**Acceptance**:
- [ ] 在頁面頂部下拉觸發刷新
- [ ] 拉動有視覺回饋與阻尼效果
- [ ] 達到閾值 (80px) 後釋放執行刷新
- [ ] 刷新時顯示 Loading 動畫
- [ ] 刷新完成後自動回彈

#### Milestone 3.2: Context Menu & Swipe Actions
- [ ] 建立 `ContextMenu` component
- [ ] 實作長按觸發邏輯 (500ms)
- [ ] 建立 `SwipeActions` component
- [ ] 實作左右滑動顯示操作按鈕
- [ ] 整合到 Reading 列表項目

**Acceptance**:
- [ ] 長按卡片/列表項目彈出選單
- [ ] 選單定位在觸摸點上方
- [ ] 點擊選單外關閉
- [ ] Reading 項目左滑顯示刪除按鈕
- [ ] 滑動超過 70% 自動執行操作

---

### Phase 4: 平台優化 (Week 4)

#### Milestone 4.1: iOS 適配
- [ ] 實作 iOS 觸覺反饋 API
- [ ] 優化 Dynamic Island 適配
- [ ] 測試 Face ID 整合 (登入)
- [ ] 調整 iOS 特有動畫曲線
- [ ] 測試 Safari 兼容性

**Acceptance**:
- [ ] 觸覺強度符合 iOS Human Interface Guidelines
- [ ] Dynamic Island 不遮擋內容
- [ ] Face ID 登入流暢運作
- [ ] 動畫在 iOS 上流暢 (60fps)

#### Milestone 4.2: Android 適配
- [ ] 實作 Material Design 3 elevation
- [ ] 適配 Android gesture navigation
- [ ] 測試指紋辨識整合
- [ ] 調整 Android 動畫時長
- [ ] 測試 Chrome/Samsung Browser

**Acceptance**:
- [ ] 元件陰影符合 MD3 規範
- [ ] 底部導航不與手勢列衝突
- [ ] 指紋登入流暢運作
- [ ] 動畫在 Android 上流暢 (60fps)

---

### Phase 5: 測試與優化 (Week 5)

#### Milestone 5.1: 效能優化
- [ ] 實作動畫幀率監控
- [ ] 優化圖片載入策略
- [ ] 實作程式碼分割
- [ ] 配置 Service Worker 快取
- [ ] Lighthouse 效能測試

**Acceptance**:
- [ ] Lighthouse Mobile Score ≥ 90
- [ ] FCP ≤ 1.5s (3G 連線)
- [ ] LCP ≤ 2.5s
- [ ] CLS ≤ 0.1
- [ ] 所有動畫保持 60fps (iPhone 11+)

#### Milestone 5.2: 無障礙測試
- [ ] 觸控目標尺寸檢查 (最小 44px)
- [ ] 螢幕閱讀器導航測試
- [ ] 鍵盤導航測試
- [ ] 對比度檢查
- [ ] WCAG 2.1 Level AA 驗證

**Acceptance**:
- [ ] 所有互動元素 ≥ 44x44px
- [ ] VoiceOver/TalkBack 正確朗讀
- [ ] Tab 鍵可導航所有元素
- [ ] 文字對比度 ≥ 4.5:1
- [ ] 通過 axe DevTools 檢查

---

### Phase 6: PWA 整合 (Week 6)

#### Milestone 6.1: PWA 配置
- [ ] 完善 `manifest.json`
- [ ] 設定 splash screen
- [ ] 實作 Service Worker
- [ ] 測試離線功能
- [ ] 實作更新提示

**Acceptance**:
- [ ] PWA 可安裝到主畫面
- [ ] 啟動時顯示 Vault-Tec splash screen
- [ ] 離線時 App Shell 可用
- [ ] 有新版本時顯示更新提示
- [ ] 通過 PWA Lighthouse 檢查

---

## 附錄

### A. 測試裝置清單

**iOS**:
- iPhone 14 Pro (Dynamic Island)
- iPhone 13 (Notch)
- iPhone SE 3rd Gen (Home Button)
- iPad Air 5th Gen (Tablet)

**Android**:
- Google Pixel 7 (Gesture Nav)
- Samsung Galaxy S23 (One UI)
- OnePlus 11 (OxygenOS)

**Browsers**:
- Safari 16+
- Chrome 115+
- Firefox 115+
- Samsung Internet 22+

---

### B. 設計資源

**參考**:
- [iOS Human Interface Guidelines - Navigation](https://developer.apple.com/design/human-interface-guidelines/navigation)
- [Material Design 3 - Navigation](https://m3.material.io/components/navigation-bar)
- [Web.dev - Mobile UX](https://web.dev/mobile-ux/)
- [Safe Area Insets Guide](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)

**工具**:
- Figma (設計稿)
- Chrome DevTools (模擬器)
- BrowserStack (真機測試)
- Lighthouse CI (效能監控)

---

### C. 決策記錄

#### DR-001: 為何使用固定底部導航而非 Drawer?
**決策**: 採用固定底部 Tab Bar  
**理由**:
- 符合 iOS/Android 主流 App 設計模式
- 拇指操作區域更易觸及
- 一鍵切換，無需額外手勢
- Wasteland Tarot 主要 5 個功能區適合 Tab 呈現

#### DR-002: 為何使用 Framer Motion 而非 React Spring?
**決策**: 頁面切換用 Framer Motion，細節動畫用 React Spring  
**理由**:
- Framer Motion 與 React Router 整合更佳 (AnimatePresence)
- React Spring 物理動畫更適合觸控互動 (手勢跟隨)
- 兩者並用發揮各自優勢

#### DR-003: 是否支援橫屏模式?
**決策**: Phase 1-6 僅支援直屏，橫屏留待未來版本  
**理由**:
- 塔羅牌直屏體驗更佳 (卡牌垂直排列)
- 簡化初期實作複雜度
- 大部分使用者以直屏使用占卜 App

---

**文件版本**: 1.0  
**最後更新**: 2025-11-06  
**下一步**: `/kiro:validate-gap mobile-native-app-layout -y`
