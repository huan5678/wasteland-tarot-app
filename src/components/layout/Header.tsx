'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { PixelIcon } from '@/components/ui/icons'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function Header() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const router = useRouter()
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [showBingoBadge, setShowBingoBadge] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setMobileMenuOpen(false) // Close mobile menu after navigation
  }

  // 檢查今日是否已領取賓果號碼 (僅在客戶端執行)
  useEffect(() => {
    if (isClient && user) {
      // 從 localStorage 讀取上次領取時間
      const lastClaimDate = localStorage.getItem('bingo-last-claim-date')
      const today = new Date().toDateString()
      setShowBingoBadge(lastClaimDate !== today)
    }
  }, [isClient, user])

  const navLinks = user
    ? [
        { href: '/dashboard', label: '控制台', icon: 'bar-chart-3', ariaLabel: '控制台', badge: false },
        { href: '/readings', label: '占卜記錄', icon: 'spade', ariaLabel: '占卜記錄', badge: false },
        { href: '/cards', label: '卡牌圖書館', icon: 'library', ariaLabel: '卡牌圖書館', badge: false },
        { href: '/bingo', label: '賓果簽到', icon: 'dices', ariaLabel: '賓果簽到', badge: showBingoBadge },
        { href: '/profile', label: '個人檔案', icon: 'user-circle', ariaLabel: '個人檔案', badge: false },
      ]
    : [
        { href: '/auth', label: '啟動終端機', icon: 'door-open', ariaLabel: '啟動終端機', badge: false },
      ]

  const isActive = (href: string) => pathname === href

  return (
    <header className="border-b-2 border-pip-boy-green" style={{backgroundColor: 'var(--color-wasteland-dark)'}}>
      {/* Top Terminal Bar */}
      <div className="interface-header">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-2">
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
                <span className="truncate max-w-[100px] sm:max-w-none">Vault Dweller：{user.username}</span>
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
              className="w-12 h-12"
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
            {navLinks.map((link) => (
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

          {/* Mobile Menu */}
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
              className="w-[280px] bg-wasteland-dark border-pip-boy-green/30"
            >
              <SheetHeader>
                <SheetTitle className="text-pip-boy-green text-xl font-bold text-glow-green">
                  導航選單
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-2 mt-6">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNavigation(link.href)}
                    className={`
                      relative flex items-center gap-3 px-4 py-3 text-sm cursor-pointer
                      border border-pip-boy-green/30 hover:border-pip-boy-green
                      hover:bg-pip-boy-green/10 transition-all duration-200 rounded-sm
                      ${isActive(link.href)
                        ? 'bg-pip-boy-green/10 border-pip-boy-green text-pip-boy-green'
                        : 'text-pip-boy-green/70 hover:text-pip-boy-green'
                      }
                    `}
                  >
                    <PixelIcon
                      name={link.icon}
                      sizePreset="sm"
                      variant="primary"
                      aria-label={link.ariaLabel}
                    />
                    <span className="flex-1 text-left">{link.label}</span>
                    {link.badge && (
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </button>
                ))}

                {user && (
                  <>
                    <div className="h-px bg-pip-boy-green/20 my-2" />
                    <button
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm
                               border border-red-500/30 hover:border-red-500
                               hover:bg-red-500/10 text-red-400 hover:text-red-500
                               transition-all duration-200 rounded-sm"
                    >
                      <PixelIcon
                        name="door-open"
                        sizePreset="sm"
                        variant="error"
                        aria-label="登出"
                      />
                      <span className="flex-1 text-left">登出</span>
                    </button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent opacity-50"></div>
    </header>
  )
}