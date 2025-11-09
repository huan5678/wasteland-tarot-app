/**
 * MobileBottomNav - Native App-Style Bottom Navigation
 * Spec: mobile-native-app-layout
 * Phase 1: Bottom Navigation Integration
 * Phase 2: Haptic Feedback & Gesture Support
 * Phase 4: Platform-Specific Optimizations (iOS/Android)
 *
 * iOS/Android compliant bottom tab bar with safe area support,
 * haptic feedback, swipe gesture navigation, and platform-specific styling
 *
 * iOS: Frosted glass backdrop, translucent background
 * Android: Material Design 3 elevation, solid background, ripple effects
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { PixelIcon } from '@/components/ui/icons';
import type { IconName } from '@/components/ui/icons';
import { usePlatform, useAndroidDeviceInfo, useHasDynamicIsland } from '@/hooks/usePlatform';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useRippleEffect, RippleVariants } from '@/hooks/useRippleEffect';
import { useAuthStore } from '@/lib/authStore';
import type { User } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';
import { CompactMusicPlayer } from '@/components/music-player/CompactMusicPlayer';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';

interface NavigationItem {
  id: string;
  label: string;
  iconName: IconName;
  href?: string;
  action?: 'more';
  badge?: number;
}

interface MobileBottomNavProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
  user?: User | null; // Optional user prop (priority over useAuthStore)
}

/**
 * Get main navigation items based on user authentication status
 * Guest users: Home | Cards | Login | More (4 items)
 * Logged-in users: Home | Bingo | New Reading | Profile | More (5 items)
 */
function getNavigationItems(user: User | null): NavigationItem[] {
  if (!user) {
    // Guest users (4 items)
    return [
      { id: 'home', label: '首頁', iconName: 'tent-fill', href: '/' },
      { id: 'cards', label: '卡牌', iconName: 'stack', href: '/cards' },
      { id: 'login', label: '登入', iconName: 'user', href: '/auth' },
      { id: 'more', label: '更多', iconName: 'menu', action: 'more' },
    ];
  }

  // Logged-in users (5 items - New Reading is center item)
  return [
    { id: 'home', label: '首頁', iconName: 'tent-fill', href: '/' },
    { id: 'bingo', label: '賓果', iconName: 'grid', href: '/bingo' },
    { id: 'reading-new', label: '新占卜', iconName: 'magic', href: '/readings/new', badge: undefined },
    { id: 'profile', label: '個人', iconName: 'user', href: '/profile' },
    { id: 'more', label: '更多', iconName: 'menu', action: 'more' },
  ];
}

/**
 * Get More Sheet items based on user authentication status
 * Guest users: About, FAQ, Privacy, Terms, Contact
 * Logged-in users: Profile, Achievements, Cards, About, FAQ, Privacy, Terms, Contact, Logout
 */
function getMoreItems(user: User | null): NavigationItem[] {
  const commonItems: NavigationItem[] = [
    { id: 'about', label: '關於我們', iconName: 'info', href: '/about' },
    { id: 'faq', label: '常見問題', iconName: 'question', href: '/faq' },
    { id: 'privacy', label: '隱私政策', iconName: 'shield', href: '/privacy' },
    { id: 'terms', label: '服務條款', iconName: 'file-text', href: '/terms' },
    { id: 'contact', label: '聯絡我們', iconName: 'mail', href: '/contact' },
  ];

  if (!user) {
    // Guest users - only common items
    return commonItems;
  }

  // Logged-in users - additional items + logout
  return [
    { id: 'dashboard', label: '控制台', iconName: 'home', href: '/dashboard' },
    { id: 'profile', label: '個人資料', iconName: 'user', href: '/profile' },
    { id: 'achievements', label: '成就系統', iconName: 'trophy', href: '/achievements' },
    { id: 'cards', label: '卡牌圖鑑', iconName: 'stack', href: '/cards' },
    ...commonItems,
    { id: 'logout', label: '登出', iconName: 'logout', action: 'logout' },
  ];
}

export function MobileBottomNav({
  currentPath = '/',
  onNavigate,
  className = '',
  user: userProp
}: MobileBottomNavProps) {
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  // Get user from prop or authStore (prop has priority)
  const storeUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const user = userProp !== undefined ? userProp : storeUser;
  const router = useRouter();

  // Set year only on client side
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => getNavigationItems(user), [user]);
  const moreItems = useMemo(() => getMoreItems(user), [user]);

  const platform = usePlatform();
  const safeArea = useSafeArea();
  const { triggerHaptic } = useHapticFeedback();
  const androidInfo = useAndroidDeviceInfo();
  const hasDynamicIsland = useHasDynamicIsland();

  // Music player integration
  const { openDrawer } = useMusicPlayer();

  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  // Ripple effect for Android buttons
  const { rippleRef: rippleRef1, ...rippleHandlers1 } = useRippleEffect(RippleVariants.pipBoy);
  const { rippleRef: rippleRef2, ...rippleHandlers2 } = useRippleEffect(RippleVariants.pipBoy);
  const { rippleRef: rippleRef3, ...rippleHandlers3 } = useRippleEffect(RippleVariants.pipBoy);
  const { rippleRef: rippleRef4, ...rippleHandlers4 } = useRippleEffect(RippleVariants.pipBoy);
  const { rippleRef: rippleRef5, ...rippleHandlers5 } = useRippleEffect(RippleVariants.pipBoy);

  const rippleRefs = [rippleRef1, rippleRef2, rippleRef3, rippleRef4, rippleRef5];
  const rippleHandlers = [rippleHandlers1, rippleHandlers2, rippleHandlers3, rippleHandlers4, rippleHandlers5];

  // Find current tab index
  const currentIndex = navigationItems.findIndex(item => 
    item.href === currentPath || 
    (item.href !== '/' && currentPath.startsWith(item.href))
  );

  // Auto-hide navigation on scroll (optional, currently disabled)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Only hide on significant downward scroll
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Disabled for now - keep navigation always visible
    // window.addEventListener('scroll', handleScroll, { passive: true });
    // return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Animation spring for hide/show
  const navSpring = useSpring({
    transform: isVisible ? 'translateY(0%)' : 'translateY(100%)',
    opacity: isVisible ? 1 : 0,
    config: { tension: 300, friction: 30 }
  });

  const handleNavigation = async (item: NavigationItem) => {
    // Trigger haptic feedback
    triggerHaptic('light');

    // Handle action-based items
    if (item.action === 'more') {
      setMoreSheetOpen(true);
      return;
    }

    if (item.action === 'logout') {
      try {
        await logout();
        setMoreSheetOpen(false);
        router.push('/');
      } catch (error) {
        console.error('Logout failed:', error);
      }
      return;
    }

    // Handle href-based navigation
    if (item.href && onNavigate) {
      setMoreSheetOpen(false); // Close sheet when navigating
      onNavigate(item.href);

      // If already on the page, scroll to top
      if (currentPath === item.href) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Gesture handling for swipe navigation
  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
      // Only handle horizontal swipes
      if (Math.abs(mx) < 50) return;
      
      const swipeThreshold = 50;
      const velocityThreshold = 0.5;
      
      // Swipe left (next tab)
      if (dx < 0 && (Math.abs(mx) > swipeThreshold || Math.abs(vx) > velocityThreshold)) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < navigationItems.length && navigationItems[nextIndex].href) {
          cancel();
          triggerHaptic('light');
          handleNavigation(navigationItems[nextIndex]);
        }
      }
      // Swipe right (previous tab)
      else if (dx > 0 && (Math.abs(mx) > swipeThreshold || Math.abs(vx) > velocityThreshold)) {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0 && navigationItems[prevIndex].href) {
          cancel();
          triggerHaptic('light');
          handleNavigation(navigationItems[prevIndex]);
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true }
    }
  );

  // Calculate bottom navigation padding based on platform
  // Let flex handle height automatically to avoid resize issues
  const bottomNavPadding = isAndroid && androidInfo.hasGestureNav
    ? `${safeArea.bottom + androidInfo.gestureNavHeight}px`
    : `${safeArea.bottom}px`;

  return (
    <>
      <animated.nav
        {...bind()}
        style={navSpring}
        role="navigation"
        aria-label="主要導航"
        aria-roledescription="導航列，5 個分頁"
      className={cn(
        'mobile-bottom-nav w-full z-30',
        'flex flex-col', // Stack music player and navigation vertically
        // Platform-specific styling (defined in globals.css)
        isIOS && 'ios',
        isAndroid && 'android',
        // Fallback styles for unsupported platforms
        !isIOS && !isAndroid && 'bg-black/95 border-t border-pip-boy-green/30 shadow-lg',
        className
      )}
      style={{
        paddingBottom: bottomNavPadding,
        // Remove fixed height - let flex calculate automatically
        // This prevents resize/hydration issues
      }}
    >
      {/* Compact Music Player (40px) */}
      <CompactMusicPlayer onExpand={openDrawer} />

      {/* Main Navigation Items (64px) */}
      <div className="flex items-center justify-around h-16 px-2">
        {navigationItems.map((item, index) => {
          const isActive = item.href && (
            currentPath === item.href ||
            (item.href !== '/' && currentPath.startsWith(item.href))
          );

          // Merge ripple ref with button ref
          const mergedRef = (el: HTMLButtonElement | null) => {
            if (rippleRefs[index]) {
              rippleRefs[index].current = el;
            }
          };

          return (
            <button
              key={item.id}
              ref={mergedRef}
              onClick={() => handleNavigation(item)}
              {...(isAndroid ? rippleHandlers[index] : {})}
              role="tab"
              aria-label={`${item.label}，${index + 1} / ${navigationItems.length}`}
              aria-selected={!!isActive}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1',
                'min-w-[44px] min-h-[44px] px-3 py-2',
                'transition-all duration-200 ease-out',
                'active:scale-95',
                'relative overflow-hidden', // Required for ripple effect
                isActive ? 'text-pip-boy-green' : 'text-pip-boy-green/60',
                'hover:text-pip-boy-green'
              )}
            >
              <div className="relative">
                <PixelIcon 
                  name={item.iconName} 
                  size={24} 
                  decorative 
                  className={cn(
                    'transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium tracking-wide',
                isActive && 'font-bold'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pip-boy-green rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      </animated.nav>

      {/* More Sheet - Bottom slide-in menu */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] bg-wasteland-dark border-t-2 border-pip-boy-green/30 p-0"
        >
          <SheetHeader className="border-b-2 border-pip-boy-green/30 p-4">
            <SheetTitle className="text-pip-boy-green text-xl font-bold">
              {user ? '更多選項' : '選單'}
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable content */}
          <div className="overflow-y-auto h-[calc(80vh-4rem)] p-4">
            {/* Navigation Items */}
            <nav className="space-y-1 mb-6">
              {moreItems.map((item, index) => {
                const isLogout = item.action === 'logout';
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3',
                      'rounded-lg transition-colors duration-200',
                      'min-h-[44px]', // WCAG AAA touch target
                      isLogout
                        ? 'text-radiation-orange hover:bg-radiation-orange/10 border border-radiation-orange/30'
                        : 'text-pip-boy-green hover:bg-pip-boy-green/10'
                    )}
                    aria-label={item.label}
                  >
                    <PixelIcon
                      name={item.iconName}
                      sizePreset="sm"
                      variant={isLogout ? 'secondary' : 'primary'}
                      decorative
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-pip-boy-green to-transparent opacity-30 my-6"></div>

            {/* Footer Content - Mobile Only */}
            <div className="space-y-6 pb-4">
              {/* Brand Section */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src="/logo.svg"
                    alt="廢土塔羅 Logo"
                    className="w-8 h-8"
                    style={{
                      filter: 'brightness(0) saturate(100%) invert(85%) sepia(55%) saturate(1000%) hue-rotate(60deg) brightness(100%) contrast(105%) drop-shadow(0 0 4px rgba(0, 255, 65, 0.6))'
                    }}
                  />
                  <div>
                    <h3 className="text-base font-bold text-pip-boy-green text-glow-green">廢土塔羅</h3>
                    <p className="text-xs text-pip-boy-green/60">Pip-Boy 占卜</p>
                  </div>
                </div>
                <p className="text-xs text-pip-boy-green/70 leading-relaxed">
                  透過古老的塔羅智慧，發現你在末世後廢土中的命運，由 Vault-Tec 驅動。
                </p>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="text-xs font-bold text-pip-boy-green mb-2 uppercase tracking-wide">社群連結</h4>
                <div className="space-y-1">
                  {[
                    { href: 'https://github.com', label: 'GitHub', icon: 'github' as IconName },
                    { href: 'https://twitter.com', label: 'Twitter', icon: 'external-link' as IconName },
                    { href: 'https://discord.com', label: 'Discord', icon: 'message' as IconName }
                  ].map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-pip-boy-green/70 hover:text-pip-boy-green transition-colors py-1"
                    >
                      <PixelIcon name={link.icon} size={16} decorative />
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Emergency Info */}
              <div className="p-3 border border-pip-boy-green/30 bg-pip-boy-green/5 rounded">
                <p className="text-xs text-pip-boy-green/60">
                  <strong className="text-pip-boy-green/80">技術支援：</strong><br />
                  Vault-Tec 熱線：1-800-VAULT-TEC<br />
                  緊急終端機：B-117-A
                </p>
              </div>

              {/* Copyright & System Status */}
              <div className="text-center space-y-2">
                <div className="text-xs text-pip-boy-green/50">
                  © {currentYear || '----'} Vault-Tec Corporation<br />
                  保留所有權利
                </div>
                <div className="flex items-center justify-center gap-3 text-xs text-pip-boy-green/50">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-pip-boy-green rounded-full animate-pulse"></div>
                    <span>系統線上</span>
                  </div>
                  <span>|</span>
                  <div>v3.1.4</div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
