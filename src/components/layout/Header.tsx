'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { useAuthStore } from '@/lib/authStore'
import { useBingoStore } from '@/lib/stores/bingoStore'
import { PixelIcon } from '@/components/ui/icons'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface NavItem {
  href: string
  label: string
  icon: string
  ariaLabel: string
  badge?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function Header() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const startTokenExpiryMonitor = useAuthStore(s => s.startTokenExpiryMonitor)
  const stopTokenExpiryMonitor = useAuthStore(s => s.stopTokenExpiryMonitor)

  // 賓果 Store（用於紅點邏輯）
  const hasClaimed = useBingoStore(s => s.hasClaimed)
  const dailyNumber = useBingoStore(s => s.dailyNumber)

  const router = useRouter()
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 滾動控制相關 state
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)

  // 檢測使用者是否偏好減少動畫
  const prefersReducedMotion = useReducedMotion()

  // ⚠️ 重要：不要在這裡檢查 httpOnly cookies！
  // httpOnly cookies 無法被 JavaScript 讀取（document.cookie 看不到）
  // 登入狀態驗證由 authStore.initialize() 調用 API 來完成
  // 如果 API 返回 401，authStore 會自動清除狀態

  // Update time only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true)

    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString())
    }

    // Initial time set
    updateTime()

    // Update every second for real-time display
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  // 啟動 Token 過期監控（僅在已登入時）
  useEffect(() => {
    if (user) {
      // 使用者已登入，啟動監控
      startTokenExpiryMonitor()
    } else {
      // 使用者未登入，停止監控
      stopTokenExpiryMonitor()
    }

    // Cleanup: 元件卸載時停止監控
    return () => {
      stopTokenExpiryMonitor()
    }
  }, [user, startTokenExpiryMonitor, stopTokenExpiryMonitor])

  const handleLogout = () => {
    // authStore.logout() 已經會處理重導向至首頁
    // 不需要在這裡再次呼叫 router.push('/')
    logout()
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setMobileMenuOpen(false) // Close mobile menu after navigation
  }

  // 檢查是否在 Dashboard 相關頁面（這些頁面會顯示 Dashboard 自己的漢堡按鈕）
  const isDashboardPage = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/readings') ||
                          pathname.startsWith('/profile') ||
                          pathname.startsWith('/settings') ||
                          pathname.startsWith('/bingo') ||
                          pathname.startsWith('/achievements')

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
  const showBingoBadge = user && !hasClaimed && dailyNumber !== null

  // 滾動監聽邏輯
  useEffect(() => {
    const handleScroll = () => {
      // 如果手機選單開啟，不處理滾動隱藏
      if (mobileMenuOpen) return

      const currentScrollY = window.scrollY

      // 向下滾動 且 超過 threshold
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHeaderVisible(false)
      }
      // 向上滾動
      else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true)
      }

      // 在頂部時，一定顯示
      if (currentScrollY <= 10) {
        setIsHeaderVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    // 使用 passive: true 優化滾動效能
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY, mobileMenuOpen])

  // 手機選單狀態變化時，強制顯示 Header
  useEffect(() => {
    if (mobileMenuOpen) {
      setIsHeaderVisible(true)
    }
  }, [mobileMenuOpen])

  const generalNavLinks = user
    ? [
        { href: '/dashboard', label: '控制台', icon: 'home', ariaLabel: '控制台', badge: false },
        { href: '/readings', label: '占卜記錄', icon: 'scroll-text', ariaLabel: '占卜記錄', badge: false },
        { href: '/cards', label: '卡牌圖書館', icon: 'library', ariaLabel: '卡牌圖書館', badge: false },
        { href: '/bingo', label: '賓果簽到', icon: 'dices', ariaLabel: '賓果簽到', badge: showBingoBadge },
        { href: '/profile', label: '個人檔案', icon: 'user-circle', ariaLabel: '個人檔案', badge: false },
        ...(user.is_admin ? [{ href: '/admin', label: '管理後台', icon: 'shield', ariaLabel: '管理後台', badge: false }] : []),
      ]
    : [
        { href: '/auth', label: '啟動終端機', icon: 'door-open', ariaLabel: '啟動終端機', badge: false },
      ]

  const dashboardNavSections: NavSection[] = user ? [
    {
      title: '核心功能',
      items: [
        { href: '/dashboard', label: '控制台', icon: 'home', ariaLabel: '控制台' },
        { href: '/readings/new', label: '新占卜', icon: 'spade', ariaLabel: '新占卜' },
        { href: '/readings', label: '占卜記錄', icon: 'scroll-text', ariaLabel: '占卜記錄' },
      ],
    },
    {
      title: '工具',
      items: [
        { href: '/dashboard/rhythm-editor', label: '節奏編輯器', icon: 'music', ariaLabel: '節奏編輯器' },
        { href: '/cards', label: '卡牌圖書館', icon: 'library', ariaLabel: '卡牌圖書館' },
      ],
    },
    {
      title: '每日',
      items: [
        { href: '/bingo', label: '賓果簽到', icon: 'dices', ariaLabel: '賓果簽到', badge: showBingoBadge },
        { href: '/achievements', label: '成就系統', icon: 'trophy', ariaLabel: '成就系統' },
      ],
    },
    {
      title: '設定',
      items: [
        { href: '/profile', label: '個人檔案', icon: 'user-circle', ariaLabel: '個人檔案' },
        ...(user?.is_admin ? [{ href: '/admin', label: '管理後台', icon: 'shield', ariaLabel: '管理後台' }] : []),
      ],
    },
  ] : []

  const isActive = (href: string) => pathname === href

  return (
    <motion.header
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
        prefersReducedMotion
          ? { duration: 0 }  // 使用者偏好減少動畫，立即切換
          : {
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }
      }
    >
      {/* Top Terminal Bar */}
      <div className="interface-header">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-2 md:px-4">
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
            <span className="hidden sm:inline">VAULT-TEC PIP-BOY 3000 MARK IV</span>
            <span className="sm:hidden">PIP-BOY 3000</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden md:inline">狀態：線上</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
            <span className="hidden md:inline">{isClient ? currentTime : '2287.10.23 14:00:00'}</span>
            {user && (
              <>
                <span className="hidden sm:inline">|</span>
                <span className="truncate max-w-[100px] sm:max-w-none">Vault Dweller：{user.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => handleNavigation('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
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
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {generalNavLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavigation(link.href)}
                className={`
                  relative flex items-center gap-2 px-3 py-2 text-sm cursor-pointer
                  border border-pip-boy-green/30 hover:border-pip-boy-green
                  hover:bg-pip-boy-green/10 transition-all duration-200
                  ${isActive(link.href)
                    ? 'bg-pip-boy-green/10 border-pip-boy-green text-pip-boy-green'
                    : 'text-pip-boy-green/70 hover:text-pip-boy-green'
                  }
                `}
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
              </button>
            ))}

            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm
                         border border-red-500/30 hover:border-red-500
                         hover:bg-red-500/10 text-red-400 hover:text-red-500
                         transition-all duration-200"
              >
                <PixelIcon
                  name="door-open"
                  sizePreset="xs"
                  variant="error"
                  aria-label="登出"
                />
                <span>登出</span>
              </button>
            )}
          </nav>

          {/* Mobile Menu - 統一在 Header 顯示 */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden flex items-center justify-center p-2 border-2 border-pip-boy-green/30 hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-all duration-200"
                aria-label="開啟選單"
              >
                <PixelIcon name="menu" sizePreset="sm" variant="primary" decorative />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] bg-wasteland-dark border-pip-boy-green/30 p-0 flex flex-col overflow-y-auto overflow-x-hidden"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
              <SheetHeader className="border-b-2 border-pip-boy-green/30 p-4 flex-shrink-0">
                <SheetTitle className="text-pip-boy-green text-xl font-bold text-glow-green">
                  {isDashboardPage ? '控制台選單' : '導航選單'}
                </SheetTitle>
              </SheetHeader>

              {/* 可滾動選單內容 */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
              >
                <nav className="py-4">
                  {isDashboardPage ? (
                    // Dashboard 分組選單
                    <>
                      {dashboardNavSections.map((section, sectionIndex) => (
                        <div key={section.title}>
                          {/* 分隔線 */}
                          {sectionIndex > 0 && (
                            <div className="h-px bg-pip-boy-green/30 my-2 mx-2" />
                          )}

                          {/* 分類標題 */}
                          <div className="px-4 py-2 text-xs font-bold text-pip-boy-green/50 uppercase tracking-wider">
                            {section.title}
                          </div>

                          {/* 選單項目 */}
                          <div>
                            {section.items.map(item => (
                              <button
                                key={item.href}
                                onClick={() => handleNavigation(item.href)}
                                className={`
                                  relative w-full flex items-center gap-3 px-4 py-3 text-sm cursor-pointer
                                  transition-all duration-200
                                  ${isActive(item.href)
                                    ? 'bg-pip-boy-green/20 border-l-4 border-pip-boy-green text-pip-boy-green font-bold'
                                    : 'text-pip-boy-green/70 hover:bg-pip-boy-green/10 hover:text-pip-boy-green'
                                  }
                                `}
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
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    // 一般導航選單
                    <>
                      {generalNavLinks.map((link) => (
                        <button
                          key={link.href}
                          onClick={() => handleNavigation(link.href)}
                          className={`
                            relative w-full flex items-center gap-3 px-4 py-3 text-sm cursor-pointer
                            border border-pip-boy-green/30 hover:border-pip-boy-green
                            hover:bg-pip-boy-green/10 transition-all duration-200 rounded-sm mx-2 mb-2
                            ${isActive(link.href)
                              ? 'bg-pip-boy-green/10 border-pip-boy-green text-pip-boy-green'
                              : 'text-pip-boy-green/70 hover:text-pip-boy-green'
                            }
                          `}
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
                        </button>
                      ))}
                    </>
                  )}

                  {/* 登出按鈕 (始終在底部) */}
                  {user && (
                    <>
                      <div className="h-px bg-pip-boy-green/20 my-2 mx-2" />
                      <button
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm mx-2
                                 border border-red-500/30 hover:border-red-500
                                 hover:bg-red-500/10 text-red-400 hover:text-red-500
                                 transition-all duration-200 rounded-sm"
                        aria-label="登出"
                      >
                        <PixelIcon
                          name="door-open"
                          sizePreset="sm"
                          variant="error"
                          decorative
                        />
                        <span className="flex-1 text-left">登出</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent opacity-50"></div>
    </motion.header>
  )
}