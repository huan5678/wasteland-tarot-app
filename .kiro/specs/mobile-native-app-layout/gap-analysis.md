# Gap Analysis: Mobile Native App Layout

**Feature**: mobile-native-app-layout  
**Date**: 2025-11-05  
**Status**: Analysis Complete

---

## Executive Summary

本專案已具備 **70%** 的移動端原生化基礎，包含：
- ✅ 完整的手勢/觸控互動系統 (`useAdvancedGestures`, `useTouchInteractions`)
- ✅ 響應式 hook 完善 (`useMediaQuery`, `useIsMobile`, `useBreakpoint`)
- ✅ PWA 基礎配置完成 (manifest.json, theme-color, viewport)
- ✅ 動畫庫齊全 (motion, @react-spring/web, @use-gesture)
- ✅ 底部導航原型存在 (`MobileNavigation.tsx`)

**主要缺口**：
- ❌ 全螢幕沉浸式佈局未實作 (safe area insets)
- ❌ 底部導航未整合到主佈局 (僅存在於 `/mobile-demo`)
- ❌ Header 未轉換為 App Bar 行為
- ❌ 頁面切換無原生滑動動畫
- ❌ 無 Pull-to-Refresh 功能
- ❌ iOS/Android 平台差異化未實作

---

## 1. 現有基礎設施 (Existing Infrastructure)

### 1.1 響應式系統 ✅ **完善**

**檔案**: `src/hooks/useMediaQuery.ts`

```typescript
// 已實作的 hooks
export function useIsMobile(): boolean // < 768px
export function useIsDesktop(): boolean // >= 768px
export function useIsTablet(): boolean // 768-1023px
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop'
export function usePrefersReducedMotion(): boolean
```

**優點**:
- SSR 安全 (防止 hydration mismatch)
- 完整的斷點檢測
- 無障礙支援 (prefers-reduced-motion)

**Gap**: 無需修改，直接使用

---

### 1.2 手勢與觸控系統 ✅ **完善**

**檔案**: 
- `src/hooks/useAdvancedGestures.ts` (300+ lines)
- `src/hooks/useTouchInteractions.ts`

**已實作功能**:
```typescript
interface AdvancedGestureHandlers {
  onTap, onDoubleTap, onLongPress ✅
  onSwipe (left/right/up/down) ✅
  onPinch (scale) ✅
  onDrag, onPan ✅
}

// 觸覺反饋已支援
triggerHaptic('light' | 'medium' | 'heavy' | 'success' | 'error') ✅
```

**優點**:
- 使用 `@use-gesture/react` (業界標準)
- 完整的觸覺回饋支援
- iOS/Android vibration API 整合

**Gap**: 
- ✅ 觸覺反饋強度對應到 iOS/Android 規範 (需測試)
- ⚠️ 長按選單 UI 元件未實作 (需建立 `ContextMenu` 元件)

---

### 1.3 動畫系統 ✅ **完善**

**已安裝套件**:
```json
"motion": "^12.23.22"           // Framer Motion 3.0
"@react-spring/web": "^10.0.3"  // 物理動畫
"@use-gesture/react": "^10.3.1" // 手勢綁定
```

**現有動畫實作**:
- `MobileNavigation.tsx`: 底部導航滑入/滑出 ✅
- `Header.tsx`: Header 滾動隱藏 ✅
- `useAdvancedGestures`: Spring 動畫 ✅

**Gap**:
- ❌ 頁面切換滑動動畫 (需整合到 Next.js router)
- ❌ Modal 底部滑出動畫 (需改寫現有 Modal)
- ❌ Pull-to-Refresh UI 與動畫

---

### 1.4 PWA 配置 ✅ **基礎完成**

**現有配置**:

`public/manifest.json`:
```json
{
  "display": "standalone" ✅
  "orientation": "portrait-primary" ✅
  "theme_color": "#00ff88" ✅
  "background_color": "#0a0e0a" ✅
}
```

`src/app/layout.tsx`:
```typescript
export const viewport = {
  themeColor: "#00ff88" ✅
}
```

**Gap**:
- ❌ Service Worker 未實作 (離線支援)
- ❌ 無 App Shell 快取策略
- ❌ 無「新版本可用」通知機制
- ⚠️ Splash screen 需自訂圖標 (目前用 SVG)

---

### 1.5 底部導航原型 ⚠️ **部分實作**

**檔案**: `src/components/mobile/MobileNavigation.tsx`

**已實作功能**:
```typescript
// 5 個導航項目 ✅
const navigationItems = [
  { id: 'home', label: '主頁', href: '/' },
  { id: 'cards', label: '卡牌', href: '/cards' },
  { id: 'bingo', label: '賓果', href: '/bingo' }, // ⚠️ 需求為 'achievements'
  { id: 'readings', label: '占卜', href: '/readings' },
  { id: 'profile', label: '個人', href: '/profile' }
]

// 滾動自動隱藏 ✅
// 動畫 (react-spring) ✅
// iOS/Android 偵測 ✅
```

**Gap**:
- ❌ **未整合到主佈局** (僅用於 `/mobile-demo` 路由)
- ❌ 導航項目不符需求 (`bingo` → `achievements`)
- ❌ 橫向滑動切換分頁未實作
- ❌ Badge 通知數量未整合
- ⚠️ 需移除 Quick Actions 浮動按鈕 (不符 iOS/Android 規範)

**建議**:
1. 將 `MobileNavigation` 整合到 `src/app/layout.tsx`
2. 修正導航項目對應需求
3. 實作 swipe 切換頁面 (使用 `useAdvancedGestures`)

---

### 1.6 Header 元件 ⚠️ **需重構**

**檔案**: `src/components/layout/Header.tsx`

**現有功能**:
```typescript
// 滾動隱藏 ✅
const [isHeaderVisible, setIsHeaderVisible] = useState(true)
useEffect(() => {
  // scroll listener logic
})

// 動畫 (motion) ✅
<motion.header
  animate={{ y: isHeaderVisible ? 0 : -100 }}
/>
```

**Gap**:
- ❌ 高度未固定為 56px (iOS App Bar 標準)
- ❌ 未使用 backdrop blur (iOS 風格)
- ❌ 關鍵頁面 (checkout, payment) 未強制顯示
- ⚠️ 滾動邏輯與 `MobileNavigation` 重複

**建議**:
1. 抽取滾動邏輯為 `useScrollDirection` hook
2. 行動版時應用 `backdrop-filter: blur(10px)` + `opacity: 0.95`
3. 根據 `pathname` 判斷是否可隱藏

---

## 2. 架構整合點 (Integration Points)

### 2.1 主佈局整合 ❌ **待實作**

**目標**: 將底部導航整合到所有行動版頁面

**當前狀況**:
```typescript
// src/app/layout.tsx
<ConditionalLayout>
  <Header />           // ✅ 已存在
  {children}
  <Footer />           // ✅ 已存在
  {/* ❌ MobileNavigation 不在此 */}
</ConditionalLayout>
```

**實作策略**:

**Option A: 條件式渲染** (推薦)
```typescript
// src/components/layout/ConditionalLayout.tsx
export function ConditionalLayout({ children }) {
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const showMobileNav = isMobile && !pathname.startsWith('/admin')

  return (
    <>
      <Header />
      <main className={cn(
        "flex-1",
        showMobileNav && "pb-[80px]" // 避免被底部導航遮擋
      )}>
        {children}
      </main>
      <Footer />
      {showMobileNav && <MobileNavigation />}
    </>
  )
}
```

**Option B: 使用 Slot Pattern**
```typescript
// src/app/layout.tsx (Next.js 15 Parallel Routes)
<ConditionalLayout
  mobileNav={<MobileNavigation />}
  desktopNav={<Header />}
>
  {children}
</ConditionalLayout>
```

**需修改的檔案**:
1. `src/components/layout/ConditionalLayout.tsx` (整合邏輯)
2. `src/components/mobile/MobileNavigation.tsx` (路由修正)
3. `src/app/globals.css` (全域樣式調整)

---

### 2.2 路由動畫整合 ❌ **待實作**

**目標**: 頁面切換時套用原生滑動動畫

**挑戰**: Next.js App Router 的路由動畫較複雜

**實作策略**:

**Option A: View Transitions API** (推薦，Chrome 111+)
```typescript
// src/components/layout/PageTransition.tsx
'use client'

export function PageTransition({ children }) {
  const pathname = usePathname()
  
  useEffect(() => {
    if (!document.startViewTransition) return
    
    document.startViewTransition(() => {
      // React 會自動更新 DOM
    })
  }, [pathname])
  
  return children
}

// globals.css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 300ms;
}
```

**Option B: AnimatePresence (motion)**
```typescript
// src/components/layout/PageTransition.tsx
import { AnimatePresence, motion } from 'motion/react'

export function PageTransition({ children }) {
  const pathname = usePathname()
  
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

**需新增的檔案**:
- `src/components/layout/PageTransition.tsx`
- `src/hooks/useRouterTransition.ts`

---

### 2.3 Safe Area 整合 ❌ **待實作**

**目標**: 支援 iPhone X+ 的 notch 與 home indicator

**當前狀況**: 無 safe area 處理

**實作策略**:

**Step 1: Tailwind 擴充**
```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      }
    }
  }
}
```

**Step 2: 元件應用**
```typescript
// Header
<header className="pt-safe-top">

// MobileNavigation
<nav className="pb-safe-bottom">

// 頁面內容
<main className="pb-[calc(80px+env(safe-area-inset-bottom))]">
```

**Step 3: Viewport Meta**
```html
<!-- src/app/layout.tsx -->
<meta name="viewport" content="viewport-fit=cover" />
```

**需修改的檔案**:
1. `tailwind.config.ts`
2. `src/app/layout.tsx` (viewport meta)
3. `src/components/layout/Header.tsx`
4. `src/components/mobile/MobileNavigation.tsx`
5. All page layouts

---

## 3. 新增元件需求 (New Components)

### 3.1 ContextMenu 元件 ❌ **待實作**

**需求**: AC-5.2 長按選單

**設計**:
```typescript
// src/components/mobile/ContextMenu.tsx
interface ContextMenuItem {
  label: string
  icon?: IconName
  variant?: 'default' | 'destructive'
  onClick: () => void
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  position: { x: number, y: number }
  onClose: () => void
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  // 實作重點:
  // 1. Portal 渲染 (避免 z-index 衝突)
  // 2. 背景遮罩 (rgba(0,0,0,0.6))
  // 3. 點擊外部關閉
  // 4. 動畫: scale(0.8) → scale(1), opacity 0 → 1
}
```

**整合點**:
```typescript
// 使用範例 (卡牌列表)
const { bind } = useAdvancedGestures({
  onLongPress: (event) => {
    const { clientX, clientY } = event
    openContextMenu([
      { label: '分享', icon: 'share', onClick: handleShare },
      { label: '刪除', icon: 'trash', variant: 'destructive', onClick: handleDelete }
    ], { x: clientX, y: clientY })
  }
})
```

---

### 3.2 PullToRefresh 元件 ❌ **待實作**

**需求**: AC-4.3 下拉刷新

**設計**:
```typescript
// src/components/mobile/PullToRefresh.tsx
interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  threshold?: number // default: 80
  maxPullDistance?: number // default: 120
  children: React.ReactNode
}

export function PullToRefresh({
  onRefresh,
  threshold = 80,
  children
}: PullToRefreshProps) {
  // 實作重點:
  // 1. 監聽 touchstart/touchmove/touchend
  // 2. 只在 scrollTop === 0 時啟用
  // 3. 拉動距離 → loading spinner rotation
  // 4. 達到 threshold → 觸發 onRefresh
  // 5. loading 期間鎖定滾動
}
```

**視覺設計**:
- **0-80px**: Pip-Boy logo 旋轉 (0° → 360°)
- **80px+**: Loading 狀態，顯示「重新載入中...」
- **完成**: Success animation (綠色勾勾 + 觸覺反饋)

---

### 3.3 SwipeActions 元件 ❌ **待實作**

**需求**: AC-5.3 滑動操作

**設計**:
```typescript
// src/components/mobile/SwipeActions.tsx
interface SwipeAction {
  label: string
  icon: IconName
  color: string // 'red-500', 'blue-500'
  onClick: () => void
}

interface SwipeActionsProps {
  leftActions?: SwipeAction[]
  rightActions?: SwipeAction[]
  autoExecuteThreshold?: number // default: 0.7
  children: React.ReactNode
}

export function SwipeActions({
  rightActions = [],
  autoExecuteThreshold = 0.7,
  children
}: SwipeActionsProps) {
  // 實作重點:
  // 1. 使用 useAdvancedGestures({ onDrag })
  // 2. 右滑顯示左側 actions (一般為 archive)
  // 3. 左滑顯示右側 actions (一般為 delete)
  // 4. 滑動 > 70% 時自動執行第一個 action
  // 5. 否則彈回原位 (spring animation)
}
```

**使用範例**:
```typescript
// 占卜歷史列表
<SwipeActions
  rightActions={[
    { label: '刪除', icon: 'trash', color: 'red-500', onClick: handleDelete }
  ]}
>
  <ReadingHistoryItem {...reading} />
</SwipeActions>
```

---

### 3.4 AppShell 元件 ⚠️ **需整合**

**需求**: AC-6.3 離線體驗

**設計**:
```typescript
// src/components/pwa/AppShell.tsx
export function AppShell({ children }) {
  const isOnline = useOnlineStatus()
  const [showUpdateNotification, setShowUpdateNotification] = useState(false)
  
  useEffect(() => {
    // 監聽 Service Worker 更新
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'UPDATE_AVAILABLE') {
          setShowUpdateNotification(true)
        }
      })
    }
  }, [])
  
  return (
    <>
      {!isOnline && <OfflineBanner />}
      {showUpdateNotification && <UpdateNotification />}
      {children}
    </>
  )
}
```

**需新增的檔案**:
- `public/sw.js` (Service Worker)
- `src/components/pwa/AppShell.tsx`
- `src/hooks/useOnlineStatus.ts`
- `src/components/pwa/OfflineBanner.tsx`
- `src/components/pwa/UpdateNotification.tsx`

---

## 4. 平台差異化實作 (Platform Adaptations)

### 4.1 iOS 適配 ⚠️ **部分支援**

**現有基礎**:
```typescript
// useAdvancedGestures.ts
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
```

**需新增**:

#### 4.1.1 SF Symbols 風格圖標
```typescript
// src/components/ui/icons/PlatformIcon.tsx
export function PlatformIcon({ name, ...props }) {
  const isIOS = useDeviceOS() === 'ios'
  
  return isIOS ? (
    <SFSymbolIcon name={name} {...props} /> // 使用 SF Symbols
  ) : (
    <PixelIcon name={name} {...props} />    // 使用 Remix Icon
  )
}
```

#### 4.1.2 Dynamic Island 避讓
```typescript
// tailwind.config.ts
spacing: {
  'ios-status-bar': '44px', // 一般 iOS
  'ios-dynamic-island': '59px', // iPhone 14 Pro+
}

// Header.tsx
<header className={cn(
  "pt-safe-top",
  isIOSDynamicIsland && "min-h-[59px]"
)}>
```

#### 4.1.3 Haptic Feedback 映射
```typescript
// iOS HIG: https://developer.apple.com/design/human-interface-guidelines/haptics
const iosHapticMap = {
  light: 'selection',      // UIImpactFeedbackGenerator.Style.light
  medium: 'impact',        // UIImpactFeedbackGenerator.Style.medium
  heavy: 'notification',   // UINotificationFeedbackGenerator
  success: 'success',
  error: 'error'
}
```

---

### 4.2 Android 適配 ⚠️ **部分支援**

**需新增**:

#### 4.2.1 Material Design 3 Elevation
```typescript
// tailwind.config.ts
boxShadow: {
  'md-1': '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)',
  'md-2': '0 1px 2px rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15)',
  'md-3': '0 4px 8px 3px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.3)',
}

// MobileNavigation.tsx (Android)
className={cn(
  "fixed bottom-0",
  isAndroid && "shadow-md-2" // Material elevation
)}
```

#### 4.2.2 Gesture Navigation Bar
```typescript
// Android 10+ 手勢導航列高度: 16px
<nav className={cn(
  "pb-safe-bottom",
  isAndroid && "pb-[16px]"
)}>
```

#### 4.2.3 Ripple Effect
```typescript
// src/components/mobile/RippleButton.tsx
export function RippleButton({ children, onClick, ...props }) {
  const isAndroid = useDeviceOS() === 'android'
  
  return isAndroid ? (
    <Button
      onClick={onClick}
      className="relative overflow-hidden"
      {...props}
    >
      {children}
      <RippleEffect /> {/* Material ripple animation */}
    </Button>
  ) : (
    <Button onClick={onClick} {...props}>
      {children}
    </Button>
  )
}
```

---

## 5. 效能優化需求 (Performance Optimizations)

### 5.1 動畫效能 ⚠️ **需測試**

**當前狀況**: 使用 `motion` + `@react-spring/web`

**優化策略**:

#### 5.1.1 使用 CSS Transform (GPU 加速)
```css
/* globals.css */
.mobile-nav-slide {
  transform: translateY(var(--translate-y));
  will-change: transform; /* 提示瀏覽器優化 */
}

/* 避免使用 */
.bad-animation {
  top: 0px; /* ❌ 觸發 layout reflow */
}
```

#### 5.1.2 降級策略
```typescript
// src/hooks/useOptimizedAnimation.ts
export function useOptimizedAnimation() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const deviceTier = useDeviceTier() // 'high' | 'medium' | 'low'
  
  return {
    shouldAnimate: !prefersReducedMotion && deviceTier !== 'low',
    animationDuration: deviceTier === 'high' ? 300 : 200,
    useSpring: deviceTier === 'high', // 低階裝置用 CSS transition
  }
}
```

#### 5.1.3 Debounce 滾動事件
```typescript
// src/hooks/useScrollDirection.ts
import { useThrottle } from '@/hooks/useThrottle'

export function useScrollDirection() {
  const [direction, setDirection] = useState<'up' | 'down'>('up')
  
  const handleScroll = useThrottle(() => {
    // scroll logic
  }, 100) // 100ms debounce
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return direction
}
```

---

### 5.2 載入效能 ⚠️ **需優化**

**目標**: FCP ≤ 1.5s, LCP ≤ 2.5s

**當前問題**:
- 3D 背景在行動版拖慢 FCP
- 字體載入阻塞渲染

**優化策略**:

#### 5.2.1 行動版停用 3D 背景
```typescript
// src/components/layout/DynamicBackground.tsx
export function DynamicBackground() {
  const isMobile = useIsMobile()
  
  if (isMobile) {
    return <StaticBackground /> // 純 CSS 漸層
  }
  
  return <Canvas3D /> // Three.js 背景
}
```

#### 5.2.2 字體最佳化
```typescript
// src/app/layout.tsx
import localFont from 'next/font/local'

const cubic11 = localFont({
  src: './fonts/cubic-11.woff2',
  display: 'swap', // ✅ FOIT → FOUT
  preload: true,
  fallback: ['monospace', 'sans-serif']
})
```

#### 5.2.3 Route-based Code Splitting
```typescript
// src/app/layout.tsx
const MobileNavigation = dynamic(
  () => import('@/components/mobile/MobileNavigation'),
  { ssr: false } // 只在 client 載入
)
```

---

### 5.3 Service Worker 快取 ❌ **待實作**

**需求**: AC-6.3 離線體驗

**實作策略**:

**Step 1: Workbox 整合**
```bash
npm install workbox-webpack-plugin
```

**Step 2: 快取策略**
```javascript
// public/sw.js
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'

// App Shell (HTML, CSS, JS)
precacheAndRoute(self.__WB_MANIFEST)

// 圖片快取 (7 天)
registerRoute(
  /\.(png|jpg|jpeg|svg|webp)$/,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60
      })
    ]
  })
)

// API 請求 (先顯示快取，背景更新)
registerRoute(
  /\/api\//,
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60 // 5 分鐘
      })
    ]
  })
)
```

**Step 3: 註冊 Service Worker**
```typescript
// src/app/layout.tsx
useEffect(() => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    navigator.serviceWorker.register('/sw.js')
  }
}, [])
```

---

## 6. 無障礙缺口 (Accessibility Gaps)

### 6.1 觸控目標 ⚠️ **需驗證**

**需求**: WCAG 2.1 Level AAA (44x44px)

**檢查項目**:
```typescript
// 需確保所有互動元素 >= 44px
const interactiveElements = [
  'button',           // ✅ 預設 48px (Shadcn UI)
  'a',                // ⚠️ 需檢查
  'MobileNavigation', // ⚠️ 需檢查
  'CardGrid',         // ⚠️ 需檢查
]
```

**實作檢查**:
```css
/* globals.css */
@media (max-width: 767px) {
  /* 全域觸控目標最小尺寸 */
  button, a[href], [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

### 6.2 螢幕閱讀器 ⚠️ **需補充**

**需求**: AC-8.2 導航列 ARIA 標籤

**需新增**:
```typescript
// MobileNavigation.tsx
<nav
  role="navigation"
  aria-label="主要導航"
  aria-roledescription="導航列，5 個分頁"
>
  {items.map((item, index) => (
    <a
      key={item.id}
      href={item.href}
      role="tab"
      aria-label={`分頁，${item.label}，5 之 ${index + 1}`}
      aria-selected={item.isActive}
      aria-current={item.isActive ? 'page' : undefined}
    >
      <PixelIcon name={item.iconName} aria-hidden="true" />
      <span>{item.label}</span>
    </a>
  ))}
</nav>
```

---

### 6.3 鍵盤導航 ⚠️ **需補充**

**需求**: AC-8.3 支援外接鍵盤

**需新增**:
```typescript
// src/hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation(items: NavItem[]) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Tab':
          setFocusedIndex(prev => (prev + 1) % items.length)
          break
        case 'Enter':
          items[focusedIndex].onClick()
          break
        case 'Escape':
          // 關閉 modal
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedIndex, items])
  
  return { focusedIndex, setFocusedIndex }
}
```

---

## 7. 實作優先級 (Implementation Priority)

### Phase 1: 核心基礎 (Week 1-2) 🚀 **高優先級**

1. **Safe Area 整合** (2 days)
   - [ ] Tailwind config 擴充
   - [ ] Viewport meta 設定
   - [ ] Header/Footer/Navigation 套用

2. **底部導航整合** (3 days)
   - [ ] 修正導航項目 (bingo → achievements)
   - [ ] 整合到主佈局 (`ConditionalLayout`)
   - [ ] 頁面內容 padding 調整

3. **Header → App Bar 轉換** (2 days)
   - [ ] 固定高度 56px
   - [ ] Backdrop blur 效果
   - [ ] 關鍵頁面強制顯示邏輯

4. **頁面切換動畫** (3 days)
   - [ ] View Transitions API 整合
   - [ ] Fallback to AnimatePresence
   - [ ] 測試路由切換流暢度

---

### Phase 2: 進階互動 (Week 3-4) 🔥 **中優先級**

5. **ContextMenu 元件** (2 days)
   - [ ] 長按觸發邏輯
   - [ ] Portal 渲染
   - [ ] 動畫與觸覺反饋

6. **PullToRefresh 元件** (3 days)
   - [ ] Touch event 監聽
   - [ ] Loading spinner 動畫
   - [ ] 整合到列表頁面

7. **SwipeActions 元件** (2 days)
   - [ ] 左滑刪除
   - [ ] 自動執行邏輯
   - [ ] Spring 彈回動畫

8. **平台差異化** (3 days)
   - [ ] iOS: SF Symbols, Dynamic Island
   - [ ] Android: Material elevation, Ripple
   - [ ] Haptic feedback 映射

---

### Phase 3: PWA 與效能 (Week 5-6) ⚡ **中低優先級**

9. **Service Worker** (4 days)
   - [ ] Workbox 整合
   - [ ] App Shell 快取
   - [ ] 更新通知機制

10. **效能優化** (3 days)
    - [ ] 行動版停用 3D 背景
    - [ ] 字體 FOUT 策略
    - [ ] Code splitting

11. **離線體驗** (2 days)
    - [ ] OfflineBanner 元件
    - [ ] 請求佇列 (queue retry)
    - [ ] 離線狀態指示

---

### Phase 4: 無障礙與測試 (Week 7) ✅ **低優先級**

12. **無障礙改善** (2 days)
    - [ ] ARIA 標籤補充
    - [ ] 鍵盤導航測試
    - [ ] 觸控目標驗證 (44x44px)

13. **測試與修正** (3 days)
    - [ ] iOS Safari 測試 (15, 16, 17)
    - [ ] Android Chrome 測試 (10, 11, 12+)
    - [ ] Lighthouse Mobile 測試 (target: 90+)

---

## 8. 風險與挑戰 (Risks & Challenges)

### 8.1 技術風險 ⚠️

| 風險 | 影響 | 緩解策略 |
|------|------|----------|
| View Transitions API 瀏覽器支援有限 (Chrome 111+) | 中 | Fallback to AnimatePresence |
| Next.js App Router 動畫整合複雜 | 高 | 使用 layout group 隔離動畫 |
| Service Worker 快取策略可能導致內容過期 | 中 | 實作 `stale-while-revalidate` |
| iOS Safari 的 100vh 問題 (URL bar) | 高 | 使用 `-webkit-fill-available` |

---

### 8.2 設計挑戰 🎨

| 挑戰 | 影響 | 解決方案 |
|------|------|----------|
| Pip-Boy 美學與 iOS/Android 規範衝突 | 中 | 保留主色調，調整 UI patterns |
| Cubic 11 字體在小尺寸下可讀性 | 低 | 關鍵內容使用 14px+ |
| 終端機效果在行動版效能影響 | 高 | 行動版簡化掃描線效果 |

---

### 8.3 整合風險 🔌

| 風險 | 影響 | 緩解策略 |
|------|------|----------|
| 現有頁面未考慮底部導航遮擋 | 高 | 全域 CSS 調整 + 逐頁檢查 |
| 動畫衝突 (Header scroll hide vs. Navigation) | 中 | 統一使用 `useScrollDirection` hook |
| 第三方套件可能不支援手勢衝突 | 低 | 使用 `stopPropagation` 隔離 |

---

## 9. 建議實作路徑 (Recommended Implementation Path)

### 路徑 A: 增量式重構 (推薦) ✅

**優點**: 低風險、可持續交付、易測試

```
Week 1-2: 核心基礎
  ├─ Safe Area 整合
  ├─ 底部導航整合
  └─ Header → App Bar

Week 3-4: 進階互動
  ├─ ContextMenu
  ├─ PullToRefresh
  └─ SwipeActions

Week 5-6: PWA 與效能
  ├─ Service Worker
  ├─ 效能優化
  └─ 離線體驗

Week 7: 無障礙與測試
  ├─ ARIA 補充
  └─ 跨裝置測試
```

---

### 路徑 B: 平行開發 (高風險) ⚠️

**優點**: 快速完成  
**缺點**: 整合複雜、測試困難

```
Team A (2 devs):
  - Safe Area + 底部導航
  - Header → App Bar

Team B (2 devs):
  - ContextMenu + PullToRefresh
  - SwipeActions

Team C (1 dev):
  - Service Worker
  - 效能優化

Week 5: 整合測試 (全員)
```

---

## 10. 成功指標 (Success Metrics)

### 10.1 效能指標 📊

| 指標 | 目標 | 當前 | Gap |
|------|------|------|-----|
| Lighthouse Mobile Score | ≥90 | 未測 | TBD |
| First Contentful Paint | ≤1.5s | 未測 | TBD |
| Largest Contentful Paint | ≤2.5s | 未測 | TBD |
| Cumulative Layout Shift | ≤0.1 | 未測 | TBD |

---

### 10.2 功能完成度 ✅

| 類別 | 完成項目 | 總項目 | 百分比 |
|------|----------|--------|--------|
| 全螢幕沉浸式佈局 | 0/4 | 4 | 0% |
| 原生風格底部導航 | 2/8 | 8 | 25% |
| 頁面佈局調整 | 0/3 | 3 | 0% |
| 動畫與過場效果 | 1/7 | 7 | 14% |
| 原生風格互動 | 3/5 | 5 | 60% |
| 效能與響應式 | 0/3 | 3 | 0% |
| 平台特定優化 | 1/6 | 6 | 17% |
| 無障礙支援 | 0/3 | 3 | 0% |
| **總計** | **7/39** | **39** | **18%** |

---

### 10.3 使用者體驗指標 🎯

| 指標 | 測量方式 | 目標 |
|------|----------|------|
| 頁面切換流暢度 | 使用者問卷 (1-5 分) | ≥4.0 |
| 導航易用性 | A/B 測試 (完成率) | ≥85% |
| 手勢回饋滿意度 | 問卷調查 | ≥80% |
| 離線體驗可用性 | 功能測試通過率 | 100% |

---

## 11. 結論與建議 (Conclusion & Recommendations)

### 11.1 當前狀態總結

**優勢** ✅:
- 完善的手勢與觸控系統 (70% 完成)
- 響應式架構成熟
- 動畫庫齊全
- PWA 基礎配置完成

**主要缺口** ❌:
- 底部導航未整合到主佈局
- 缺少 Safe Area 處理
- 無頁面切換動畫
- Service Worker 未實作

---

### 11.2 建議行動方案

**立即行動 (本週)**:
1. ✅ 完成 Gap Analysis 審核
2. 🚀 啟動 Phase 1 開發 (Safe Area + 底部導航)
3. 📋 建立測試裝置清單 (至少 3 台 iOS + 3 台 Android)

**短期目標 (2 週內)**:
- 完成 Phase 1 (核心基礎)
- 在真機測試滾動與導航
- Lighthouse Mobile 首次測試

**中期目標 (6 週內)**:
- 完成所有 Phase 1-3
- 通過跨裝置測試
- 達成效能指標

---

### 11.3 需要的資源

**開發資源**:
- 2 名前端工程師 (6 週)
- 1 名 UI/UX 設計師 (2 週，平台適配指導)

**測試裝置**:
- iPhone 13/14/15 (iOS 15-17)
- Samsung Galaxy S21+ (Android 11+)
- Google Pixel 6 (Android 12+)

**工具與服務**:
- BrowserStack (跨裝置測試)
- Lighthouse CI (自動化效能測試)
- Sentry (錯誤追蹤)

---

## 附錄 A: 檔案清單 (File Checklist)

### 需修改的檔案 📝

- [ ] `src/components/layout/ConditionalLayout.tsx` (整合底部導航)
- [ ] `src/components/layout/Header.tsx` (App Bar 轉換)
- [ ] `src/components/mobile/MobileNavigation.tsx` (修正導航項目)
- [ ] `src/app/layout.tsx` (viewport meta)
- [ ] `tailwind.config.ts` (safe area spacing)
- [ ] `src/app/globals.css` (全域樣式調整)

### 需新增的檔案 ✨

- [ ] `src/components/mobile/ContextMenu.tsx`
- [ ] `src/components/mobile/PullToRefresh.tsx`
- [ ] `src/components/mobile/SwipeActions.tsx`
- [ ] `src/components/layout/PageTransition.tsx`
- [ ] `src/components/pwa/AppShell.tsx`
- [ ] `src/components/pwa/OfflineBanner.tsx`
- [ ] `src/components/pwa/UpdateNotification.tsx`
- [ ] `src/hooks/useScrollDirection.ts`
- [ ] `src/hooks/useOnlineStatus.ts`
- [ ] `src/hooks/useDeviceOS.ts`
- [ ] `src/hooks/useOptimizedAnimation.ts`
- [ ] `public/sw.js` (Service Worker)

---

## 附錄 B: 參考資源 (References)

### 設計規範
- [iOS Human Interface Guidelines - Navigation](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Material Design 3 - Navigation](https://m3.material.io/components/navigation-bar/overview)
- [WCAG 2.1 - Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

### 技術文件
- [View Transitions API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Next.js App Router Animations](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#animations)

### 效能優化
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)

---

**文件版本**: 1.0  
**最後更新**: 2025-11-05  
**下一步**: 審核本分析 → 核准 Requirements → 開始 Phase 1 開發
