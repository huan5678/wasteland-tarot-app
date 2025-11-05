# Requirements Document

## Project Description (Input)
重構mobile的時候網站layout使其看起來更像原生mobile app

## Requirements

### 功能概述
將 Wasteland Tarot 的行動版網站介面重構為原生 App 般的體驗，包含全螢幕沉浸式佈局、底部導航列、手勢互動、以及符合 iOS/Android 設計規範的視覺呈現。保持 Pip-Boy 廢土美學的同時，提升行動裝置的操作流暢度與直覺性。

### EARS Acceptance Criteria

#### 1. 全螢幕沉浸式佈局

**AC-1.1: 全螢幕視口配置**
- WHEN user accesses the app on mobile devices THEN Mobile Layout System SHALL utilize 100vh viewport height with safe area insets
- WHERE device supports safe area insets THE Mobile Layout System SHALL apply CSS `env(safe-area-inset-*)` for notch/home indicator compatibility
- IF device is iOS THE Mobile Layout System SHALL prevent elastic scrolling bounce on body element

**AC-1.2: 狀態列整合**
- WHEN app is loaded on mobile THEN Mobile Layout System SHALL set theme-color meta tag to `#00ff88` (Pip-Boy green)
- WHERE device supports PWA THE Mobile Layout System SHALL configure manifest.json with `display: "standalone"` mode
- IF PWA is installed THEN Mobile Layout System SHALL hide browser chrome and enable fullscreen mode

**AC-1.3: Header 重構為 App Bar**
- WHEN user is on mobile viewport (<768px) THEN Header Component SHALL transform into fixed top App Bar with 56px height
- WHERE user scrolls down >100px THE App Bar SHALL auto-hide with slide-up animation (300ms)
- WHEN user scrolls up THEN App Bar SHALL reappear with slide-down animation (300ms)
- IF user is on critical pages (checkout, payment) THE App Bar SHALL remain visible regardless of scroll

#### 2. 原生風格底部導航列

**AC-2.1: 底部導航基礎結構**
- WHEN user is on mobile viewport THEN Mobile Navigation Component SHALL render as fixed bottom tab bar with 64px height
- WHERE device has home indicator THE bottom navigation SHALL add 16px padding-bottom for safe area
- IF device is Android THE bottom navigation SHALL use Material Design 3 elevation (shadow-lg)
- IF device is iOS THE bottom navigation SHALL use backdrop blur with 80% opacity

**AC-2.2: 導航項目配置**
- WHEN bottom navigation renders THEN Navigation Component SHALL display exactly 5 primary tabs:
  - Home (首頁) with home icon
  - Cards (卡牌) with cards icon  
  - Readings (占卜) with book-open icon
  - Achievements (成就) with trophy icon
  - Profile (個人) with user icon
- WHERE user taps a navigation item THEN Navigation Component SHALL highlight active state with Pip-Boy green (#00ff88)
- IF tab has notification badge THEN Navigation Component SHALL display badge count in top-right corner

**AC-2.3: 導航動畫**
- WHEN user switches tabs THEN Navigation Component SHALL animate active indicator with spring physics (tension: 300, friction: 30)
- WHERE tab icon is tapped THE icon SHALL scale to 1.1x for 150ms then return to 1.0x
- IF tab is already active AND user taps again THEN current page SHALL scroll to top with smooth behavior

**AC-2.4: 手勢互動**
- WHEN user is on touch device THEN Navigation Component SHALL support horizontal swipe between adjacent tabs
- WHERE user swipes left (>50px velocity) THE Navigation Component SHALL navigate to next tab
- WHERE user swipes right (>50px velocity) THE Navigation Component SHALL navigate to previous tab
- IF swipe distance <50px THEN Navigation Component SHALL animate back to original position

#### 3. 頁面佈局調整

**AC-3.1: 內容區域配置**
- WHEN page renders on mobile THEN Page Layout SHALL apply padding-bottom: 80px to prevent content overlap with bottom navigation
- WHERE page has floating action buttons THE buttons SHALL position above bottom navigation (bottom: 80px)
- IF page is scrollable THEN scroll container SHALL end 80px from bottom viewport

**AC-3.2: 卡片與列表優化**
- WHEN displaying card grid on mobile THEN Card Grid Component SHALL switch to single column layout
- WHERE list items are tappable THE touch target SHALL be minimum 44px height (WCAG 2.1 AA)
- IF content card has actions THEN actions SHALL be thumb-reachable (bottom 1/3 of screen)

**AC-3.3: 表單與輸入**
- WHEN form input is focused on mobile THEN Form Component SHALL scroll input to center of viewport
- WHERE keyboard appears THE Page Layout SHALL adjust content viewport to visible area
- IF iOS keyboard has toolbar THEN input field SHALL add extra 44px bottom margin

#### 4. 動畫與過場效果

**AC-4.1: 頁面切換動畫**
- WHEN user navigates between pages THEN Router SHALL apply slide transition (300ms ease-out)
- WHERE navigation is forward THE new page SHALL slide in from right
- WHERE navigation is backward THE new page SHALL slide in from left
- IF navigation is tab switch THEN pages SHALL cross-fade (200ms)

**AC-4.2: 模態對話框**
- WHEN modal opens on mobile THEN Modal Component SHALL slide up from bottom (400ms spring animation)
- WHERE modal background is tapped THE modal SHALL slide down and close
- IF modal has backdrop THEN backdrop SHALL fade in/out synchronized with slide animation
- WHERE device supports haptics THEN modal open/close SHALL trigger medium impact feedback

**AC-4.3: 下拉刷新**
- WHEN user pulls down from top on scrollable content THEN Page SHALL display pull-to-refresh indicator
- WHERE pull distance >80px AND user releases THEN Page SHALL trigger refresh action
- IF refresh is triggered THEN loading spinner SHALL animate until refresh completes (max 5s)

#### 5. 原生風格互動

**AC-5.1: 觸控反饋**
- WHEN user taps interactive element THEN UI Component SHALL provide visual feedback within 100ms
- WHERE device supports haptic feedback THE tap SHALL trigger light impact haptic
- IF button is primary action THEN tap SHALL trigger medium impact haptic
- IF action is destructive (delete, logout) THEN tap SHALL trigger heavy impact haptic

**AC-5.2: 長按選單**
- WHEN user long-presses (500ms) on card/list item THEN Context Menu SHALL appear above finger position
- WHERE context menu opens THE background SHALL darken (overlay: rgba(0,0,0,0.6))
- IF user taps outside menu THEN menu SHALL dismiss with fade-out animation (200ms)

**AC-5.3: 滑動操作**
- WHEN user swipes left on list item (readings history) THEN Swipe Actions SHALL reveal delete button
- WHERE swipe is >70% item width THE action SHALL auto-execute on release
- IF swipe is <70% width THEN item SHALL spring back to original position

#### 6. 效能與響應式

**AC-6.1: 載入效能**
- WHEN app loads on mobile THEN First Contentful Paint SHALL occur within 1.5s on 3G connection
- WHERE page transitions occur THE new page SHALL be interactive within 300ms
- IF route change takes >500ms THEN Loading Skeleton SHALL display

**AC-6.2: 動畫流暢度**
- WHEN animations play THEN frame rate SHALL maintain 60fps on devices released after 2020
- WHERE device performance is limited (<iPhone 11 equivalent) THE animations SHALL gracefully degrade to simpler transitions
- IF device prefers reduced motion THEN all animations SHALL be replaced with instant transitions

**AC-6.3: 離線體驗**
- WHEN device loses connection THEN App Shell SHALL remain functional with cached assets
- WHERE user is offline THE bottom navigation SHALL display "離線模式" banner
- IF user attempts network action while offline THEN App SHALL queue action and retry when online

#### 7. 平台特定優化

**AC-7.1: iOS 適配**
- WHEN app runs on iOS THEN UI Components SHALL use SF Symbols-style icons where appropriate
- WHERE device has Dynamic Island THE App Bar SHALL avoid overlap with safe area top inset
- IF device supports Face ID THEN login flow SHALL integrate biometric authentication

**AC-7.2: Android 適配**  
- WHEN app runs on Android THEN UI Components SHALL follow Material Design 3 elevation system
- WHERE device has gesture navigation THE bottom navigation SHALL add 16px bottom padding
- IF device supports fingerprint THEN login flow SHALL integrate biometric authentication

**AC-7.3: PWA 整合**
- WHEN app is installed as PWA THEN manifest.json SHALL configure:
  - display: "standalone"
  - orientation: "portrait"
  - theme_color: "#00ff88"
  - background_color: "#0a0f0a"
- WHERE PWA is launched THE splash screen SHALL display Vault-Tec logo with Pip-Boy green background
- IF PWA needs update THEN Service Worker SHALL prompt user with "新版本可用" notification

#### 8. 無障礙支援

**AC-8.1: 觸控目標**
- WHEN rendering interactive elements THEN all touch targets SHALL be minimum 44x44px (WCAG 2.1 Level AAA)
- WHERE elements are adjacent THE spacing SHALL be minimum 8px
- IF element is critical action THEN touch target SHALL be 48x48px minimum

**AC-8.2: 螢幕閱讀器**
- WHEN screen reader is active THEN bottom navigation SHALL announce "導航列，5 個分頁"
- WHERE navigation item is focused THE screen reader SHALL announce "分頁，[name]，5 之 [number]"
- IF tab is active THEN screen reader SHALL append "已選取"

**AC-8.3: 鍵盤導航**
- WHEN user connects keyboard to mobile THEN Tab key SHALL cycle through bottom navigation items
- WHERE navigation item is focused THE Enter key SHALL activate tab
- IF modal is open THEN Escape key SHALL close modal

### 非功能需求

#### NFR-1: 相容性
- 支援 iOS 15+ (Safari 15+)
- 支援 Android 10+ (Chrome 90+)
- 支援 PWA 安裝 (Chrome, Safari, Edge)

#### NFR-2: 效能目標
- Lighthouse Mobile Score ≥ 90
- First Contentful Paint (FCP) ≤ 1.5s
- Largest Contentful Paint (LCP) ≤ 2.5s
- Cumulative Layout Shift (CLS) ≤ 0.1

#### NFR-3: 設計一致性
- 保持 Pip-Boy 綠色主題 (#00ff88)
- 保留 Cubic 11 像素字體
- 維持終端機掃描線效果
- 整合廢土音效反饋

### 排除範圍 (Out of Scope)
- 桌面版佈局不變 (本次僅重構行動版)
- 不修改現有業務邏輯
- 不更改後端 API
- 不重構音訊引擎
- 不修改 3D 背景效果 (僅在行動版停用以提升效能)

