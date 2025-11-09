'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { useAuthStore } from '@/lib/authStore';
import { useBingoStore } from '@/lib/stores/bingoStore';
import { PixelIcon } from '@/components/ui/icons';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { UserMenu } from './UserMenu';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  ariaLabel: string;
  badge?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const startTokenExpiryMonitor = useAuthStore((s) => s.startTokenExpiryMonitor);
  const stopTokenExpiryMonitor = useAuthStore((s) => s.stopTokenExpiryMonitor);

  // 賓果 Store（用於紅點邏輯）
  const hasClaimed = useBingoStore((s) => s.hasClaimed);
  const dailyNumber = useBingoStore((s) => s.dailyNumber);

  const router = useRouter();
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 滾動控制相關 state
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  // 檢測使用者是否偏好減少動畫
  const prefersReducedMotion = useReducedMotion();

  // Header ref 用於測量高度
  const headerRef = React.useRef<HTMLElement>(null);

  // ⚠️ 重要：不要在這裡檢查 httpOnly cookies！
  // httpOnly cookies 無法被 JavaScript 讀取（document.cookie 看不到）
  // 登入狀態驗證由 authStore.initialize() 調用 API 來完成
  // 如果 API 返回 401，authStore 會自動清除狀態

  // Update time only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString());
    };

    // Initial time set
    updateTime();

    // Update every second for real-time display
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // 啟動 Token 過期監控（僅在已登入時）
  useEffect(() => {
    if (user) {
      // 使用者已登入，啟動監控
      startTokenExpiryMonitor();
    } else {
      // 使用者未登入，停止監控
      stopTokenExpiryMonitor();
    }

    // Cleanup: 元件卸載時停止監控
    return () => {
      stopTokenExpiryMonitor();
    };
  }, [user, startTokenExpiryMonitor, stopTokenExpiryMonitor]);

  const handleLogout = () => {
    // authStore.logout() 已經會處理重導向至首頁
    // 不需要在這裡再次呼叫 router.push('/')
    logout();
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };

  // 檢查是否在 Dashboard 相關頁面（這些頁面會顯示 Dashboard 自己的漢堡按鈕）
  const isDashboardPage = pathname.startsWith('/dashboard') ||
  pathname.startsWith('/readings') ||
  pathname.startsWith('/profile') ||
  pathname.startsWith('/settings') ||
  pathname.startsWith('/bingo') ||
  pathname.startsWith('/achievements');

  /**
   * 賓果簽到紅點邏輯（修復 2025-10-30）
   *
   * 顯示條件：
   * 1. 使用者已登入
   * 2. 今日尚未領取號碼（hasClaimed === false）
   * 3. 有可領取的號碼（dailyNumber !== null，即日期 <= 25 日）
   *
   * 隱藏條件：
   * - 已領取當天號碼
   * - 超過 25 日（沒有號碼可領取）
   */
  const showBingoBadge = user && !hasClaimed && dailyNumber !== null;

  // 滾動監聽邏輯 - 監聽 main 元素的滾動（來自 DynamicMainContent 的廣播）
  useEffect(() => {
    const handleScroll = (event: CustomEvent) => {
      // 如果手機選單開啟，不處理滾動隱藏
      if (mobileMenuOpen) return;

      const currentScrollY = event.detail.scrollY;

      // 向下滾動 且 超過 threshold
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHeaderVisible(false);
      }
      // 向上滾動
      else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }

      // 在頂部時，一定顯示
      if (currentScrollY <= 10) {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // 監聽 DynamicMainContent 廣播的滾動事件
    window.addEventListener('main-scroll', handleScroll as EventListener);

    return () => {
      window.removeEventListener('main-scroll', handleScroll as EventListener);
    };
  }, [lastScrollY, mobileMenuOpen]);

  // 手機選單狀態變化時，強制顯示 Header
  useEffect(() => {
    if (mobileMenuOpen) {
      setIsHeaderVisible(true);
    }
  }, [mobileMenuOpen]);

  // 通知 Sidebar Header 的顯示/隱藏狀態（包含高度）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 計算實際應該使用的高度
      const effectiveHeight = isHeaderVisible && headerRef.current ?
      headerRef.current.offsetHeight :
      0;

      window.dispatchEvent(
        new CustomEvent('header-height-change', {
          detail: { height: effectiveHeight }
        })
      );
    }
  }, [isHeaderVisible]);

  // 使用 ResizeObserver 監聽 Header 高度變化（僅在可見時）
  useEffect(() => {
    if (!headerRef.current || !isHeaderVisible) return;

    const broadcastHeaderHeight = () => {
      if (headerRef.current && isHeaderVisible) {
        const height = headerRef.current.offsetHeight;
        window.dispatchEvent(
          new CustomEvent('header-height-change', {
            detail: { height }
          })
        );
      }
    };

    // 初始廣播
    broadcastHeaderHeight();

    // 監聽大小變化（響應式、動態內容等）
    const resizeObserver = new ResizeObserver(() => {
      broadcastHeaderHeight();
    });

    resizeObserver.observe(headerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isClient, isHeaderVisible]); // 依賴 isHeaderVisible

  const generalNavLinks = user ?
  [
  { href: '/dashboard', label: '控制台', icon: 'home', ariaLabel: '控制台', badge: false },
  { href: '/readings', label: '占卜記錄', icon: 'scroll-text', ariaLabel: '占卜記錄', badge: false },
  { href: '/cards', label: '卡牌圖書館', icon: 'library', ariaLabel: '卡牌圖書館', badge: false },
  { href: '/bingo', label: '賓果簽到', icon: 'dices', ariaLabel: '賓果簽到', badge: showBingoBadge }] :

  [
  { href: '/auth', label: '啟動終端機', icon: 'door-open', ariaLabel: '啟動終端機', badge: false }];


  const dashboardNavSections: NavSection[] = user ? [
  {
    title: '核心功能',
    items: [
    { href: '/dashboard', label: '控制台', icon: 'home', ariaLabel: '控制台' },
    { href: '/readings/new', label: '新占卜', icon: 'spade', ariaLabel: '新占卜' },
    { href: '/readings', label: '占卜記錄', icon: 'scroll-text', ariaLabel: '占卜記錄' }]

  },
  {
    title: '工具',
    items: [
    { href: '/dashboard/rhythm-editor', label: '節奏編輯器', icon: 'music', ariaLabel: '節奏編輯器' },
    { href: '/cards', label: '卡牌圖書館', icon: 'library', ariaLabel: '卡牌圖書館' }]

  },
  {
    title: '每日',
    items: [
    { href: '/bingo', label: '賓果簽到', icon: 'dices', ariaLabel: '賓果簽到', badge: showBingoBadge || undefined },
    { href: '/achievements', label: '成就系統', icon: 'trophy', ariaLabel: '成就系統' }]

  },
  {
    title: '設定',
    items: [
    { href: '/profile', label: '個人檔案', icon: 'user-circle', ariaLabel: '個人檔案' },
    ...(user?.is_admin ? [{ href: '/admin', label: '管理後台', icon: 'shield', ariaLabel: '管理後台' }] : [])]

  }] :
  [];

  const isActive = (href: string) => pathname === href;

  return (
    <motion.header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 border-b-2 border-pip-boy-green"
      style={{
        backgroundColor: 'var(--color-wasteland-dark)',
        willChange: 'transform'
      }}
      initial={{ y: 0 }}
      animate={{
        y: isHeaderVisible ? 0 : '-100%'
      }}
      transition={
      prefersReducedMotion ?
      { duration: 0 } // 使用者偏好減少動畫，立即切換
      : {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
      }>

      {/* Top Terminal Bar - Hidden on mobile (sm:block) */}
      <div className="interface-header hidden sm:block">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-2 md:px-4">
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
            <span>VAULT-TEC PIP-BOY 3000 MARK IV</span>
            <span>|</span>
            <span className="hidden md:inline">狀態：線上</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
            <span className="hidden md:inline">{isClient ? currentTime : '2287.10.23 14:00:00'}</span>
            {user &&
            <>
                <span>|</span>
                <span className="truncate max-w-[100px] sm:max-w-none">Vault Dweller：{user.name}</span>
              </>
            }
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => handleNavigation('/')}
            className="flex items-center gap-3 transition-opacity cursor-pointer hover:opacity-80"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleNavigation('/');
              }
            }}
          >
            <img
              src="/logo.svg"
              alt="廢土塔羅 Logo"
              className="w-12 h-12 md:w-14 md:h-14"
              style={{
                filter: 'brightness(0) saturate(100%) invert(85%) sepia(55%) saturate(1000%) hue-rotate(60deg) brightness(100%) contrast(105%) drop-shadow(0 0 4px rgba(0, 255, 65, 0.6))'
              }}
            />
            <div>
              <h1 className="text-xl font-bold text-pip-boy-green text-glow-green">廢土塔羅</h1>
              <p className="text-xs text-pip-boy-green/60">Pip-Boy 占卜終端機</p>
            </div>
          </div>

          {/* Desktop Navigation - Only visible on large+ screens (≥ 1024px) */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* 導航連結 */}
            {generalNavLinks.map((link) => (
            <Button
              key={link.href}
              size="default"
              variant="outline"
              onClick={() => handleNavigation(link.href)}
              className="relative flex items-center gap-2"
            >
              <PixelIcon
                name={link.icon}
                sizePreset="xs"
                variant="primary"
                aria-label={link.ariaLabel}
              />
              <span>{link.label}</span>
              {link.badge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </Button>
            ))}

            {/* 已登入：顯示 UserMenu */}
            {user &&
            <UserMenu
              user={{
                name: user.name,
                avatarUrl: user.avatar_url,
                profilePicture: user.profilePicture
              }}
              onLogout={handleLogout} />

            }
          </nav>

          {/* Hamburger Menu - Show on sm to lg screens (640px - 1024px) */}
          {/* On small screens (<640px), navigation handled by MobileBottomNav */}
          {/* On large screens (≥1024px), navigation handled by Desktop Navigation above */}
          <div className="hidden sm:block lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline"
                className="flex items-center justify-center p-2 transition-all duration-200"
                aria-label="開啟選單">

                  <PixelIcon name="menu" sizePreset="sm" variant="primary" decorative />
                </Button>
              </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] bg-wasteland-dark border-pip-boy-green/30 p-0 flex flex-col overflow-y-auto overflow-x-hidden"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>

              <SheetHeader className="border-b-2 border-pip-boy-green/30 p-4 flex-shrink-0">
                <SheetTitle className="text-pip-boy-green text-xl font-bold text-glow-green">
                  {isDashboardPage ? '控制台選單' : '導航選單'}
                </SheetTitle>
              </SheetHeader>

              {/* 可滾動選單內容 */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>

                <nav className="py-4">
                  {isDashboardPage ?
                  // Dashboard 分組選單
                  <>
                      {dashboardNavSections.map((section, sectionIndex) =>
                    <div key={section.title}>
                          {/* 分隔線 */}
                          {sectionIndex > 0 &&
                      <div className="h-px bg-pip-boy-green/30 my-2 mx-2" />
                      }

                          {/* 分類標題 */}
                          <div className="px-4 py-2 text-xs font-bold text-pip-boy-green/50 uppercase tracking-wider">
                            {section.title}
                          </div>

                          {/* 選單項目 */}
                          <div>
                            {section.items.map((item) => (
                        <Button
                          key={item.href}
                          size="default"
                          variant="ghost"
                          onClick={() => handleNavigation(item.href)}
                          className="w-full justify-start gap-3 px-4 py-3 mx-2 hover:bg-pip-boy-green/10"



                          aria-label={item.ariaLabel}
                          aria-current={isActive(item.href) ? 'page' : undefined}
                        >
                          <PixelIcon
                            name={item.icon}
                            sizePreset="sm"
                            variant="primary"
                            decorative
                          />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-label="有新內容" />
                          )}
                        </Button>
                        ))}
                          </div>
                        </div>
                    )}
                    </> :

                  // 一般導航選單
                  <>
                      {generalNavLinks.map((link) => (
                    <Button
                      key={link.href}
                      size="default"
                      variant="ghost"
                      onClick={() => handleNavigation(link.href)}
                      className="w-full justify-start gap-3 px-4 py-3 mx-2 hover:bg-pip-boy-green/10"




                      aria-label={link.ariaLabel}
                      aria-current={isActive(link.href) ? 'page' : undefined}
                    >
                      <PixelIcon
                        name={link.icon}
                        sizePreset="sm"
                        variant="primary"
                        decorative
                      />
                      <span className="flex-1 text-left">{link.label}</span>
                      {link.badge && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-label="有新內容" />
                      )}
                    </Button>
                    ))}
                    </>
                  }

                  {/* 登出按鈕 (始終在底部) */}
                  {user &&
                  <>
                      <div className="h-px bg-pip-boy-green/20 my-2 mx-2" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 mx-2 border transition-all duration-200"
                        aria-label="登出"
                      >
                        <PixelIcon
                          name="door-open"
                          sizePreset="sm"
                          variant="error"
                          decorative
                        />
                        <span className="flex-1 text-left">登出</span>
                      </Button>
                    </>
                  }
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          </div>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent opacity-50"></div>
    </motion.header>);

}