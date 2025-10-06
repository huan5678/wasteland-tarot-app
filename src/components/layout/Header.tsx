'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import {
  BarChart3,
  Spade,
  Library,
  UserCircle,
  Lock,
  FileText,
  Star,
  DoorOpen,
  Dices
} from 'lucide-react'

export function Header() {
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const router = useRouter()
  const pathname = usePathname()
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const [showBingoBadge, setShowBingoBadge] = useState(false)

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
        { href: '/dashboard', label: '控制台', icon: BarChart3, badge: false },
        { href: '/readings', label: '占卜記錄', icon: Spade, badge: false },
        { href: '/cards', label: '卡牌圖書館', icon: Library, badge: false },
        { href: '/bingo', label: '賓果簽到', icon: Dices, badge: showBingoBadge },
        { href: '/profile', label: '個人檔案', icon: UserCircle, badge: false },
      ]
    : [
        { href: '/auth/login', label: '登入', icon: Lock, badge: false },
        { href: '/auth/register', label: '註冊', icon: FileText, badge: false },
      ]

  const isActive = (href: string) => pathname === href

  return (
    <header className="border-b-2 border-pip-boy-green" style={{backgroundColor: 'var(--color-wasteland-dark)'}}>
      {/* Top Terminal Bar */}
      <div className="interface-header">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>VAULT-TEC PIP-BOY 3000 MARK IV</span>
            <span>|</span>
            <span>狀態：線上</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{isClient ? currentTime : '2287.10.23 14:00:00'}</span>
            {user && (
              <>
                <span>|</span>
                <span>Vault Dweller：{user.username}</span>
                <span>|</span>
                <span>Vault：{user.vaultNumber || '111'}</span>
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
            <div className="w-12 h-12 border-2 border-pip-boy-green rounded-full flex items-center justify-center bg-pip-boy-green-deep glow-green">
              <Star className="w-6 h-6 text-pip-boy-green" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-pip-boy text-glow-green">廢土塔羅</h1>
              <p className="text-xs text-muted-wasteland">Pip-Boy 占卜終端機</p>
            </div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavigation(link.href)}
                className={`
                  relative flex items-center gap-2 px-3 py-2 text-sm font-mono cursor-pointer
                  border border-border-muted hover:border-border-primary
                  hover:bg-bg-secondary transition-all duration-200
                  ${isActive(link.href)
                    ? 'bg-bg-secondary border-border-primary text-text-primary glow-green'
                    : 'text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                <link.icon className="w-4 h-4" />
                <span>{link.label}</span>
                {/* 未領取提示紅點 */}
                {link.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}

            {/* Logout Button */}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-mono
                         border border-error-border hover:border-error
                         hover:bg-error-bg text-error hover:text-error
                         transition-all duration-200 hover:glow-red"
              >
                <DoorOpen className="w-4 h-4" />
                <span>登出</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent opacity-50"></div>
    </header>
  )
}