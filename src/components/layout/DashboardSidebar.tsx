'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { PixelIcon } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const SIDEBAR_COLLAPSED_KEY = 'dashboard-sidebar-collapsed'

interface NavItem {
  href: string
  label: string
  icon: string
  ariaLabel: string
  badge?: boolean
  adminOnly?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showBingoBadge, setShowBingoBadge] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // 初始化：從 localStorage 讀取狀態
  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  // 檢查賓果紅點提示
  useEffect(() => {
    if (isClient && user) {
      const lastClaimDate = localStorage.getItem('bingo-last-claim-date')
      const today = new Date().toDateString()
      setShowBingoBadge(lastClaimDate !== today)
    }
  }, [isClient, user])

  // 切換收合狀態
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState))
  }

  // 導航處理
  const handleNavigation = (href: string) => {
    router.push(href)
  }

  // 選單結構（功能分類）
  const navSections: NavSection[] = [
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
      ],
    },
    {
      title: '設定',
      items: [
        { href: '/profile', label: '個人檔案', icon: 'user-circle', ariaLabel: '個人檔案' },
        ...(user?.is_admin ? [{ href: '/admin', label: '管理後台', icon: 'shield', ariaLabel: '管理後台', adminOnly: true }] : []),
      ],
    },
  ]

  const isActive = (href: string) => pathname === href

  // 選單項目渲染（展開狀態）
  const renderExpandedItem = (item: NavItem) => (
    <button
      key={item.href}
      onClick={() => handleNavigation(item.href)}
      className={`
        relative w-full flex items-center gap-3 py-3 text-sm
        transition-all duration-200 cursor-pointer
        ${isActive(item.href)
          ? 'bg-pip-boy-green/20 border-l-4 border-pip-boy-green text-pip-boy-green font-bold pl-3 pr-4'
          : 'text-pip-boy-green/70 hover:bg-pip-boy-green/10 hover:text-pip-boy-green pl-4 pr-4'
        }
      `}
      aria-label={item.ariaLabel}
      aria-current={isActive(item.href) ? 'page' : undefined}
    >
      <div className="relative">
        <PixelIcon
          name={item.icon}
          sizePreset="sm"
          variant="primary"
          decorative
        />
        {item.badge && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"
            aria-label="有新內容"
          />
        )}
      </div>
      <span className="flex-1 text-left">{item.label}</span>
    </button>
  )

  // 選單項目渲染（收合狀態）
  const renderCollapsedItem = (item: NavItem) => (
    <TooltipProvider key={item.href} delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => handleNavigation(item.href)}
            className={`
              relative flex items-center justify-center w-full py-3
              transition-all duration-200 cursor-pointer
              ${isActive(item.href)
                ? 'bg-pip-boy-green/20 border-l-4 border-pip-boy-green text-pip-boy-green'
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
            {item.badge && (
              <span
                className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"
                aria-label="有新內容"
              />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <aside
      className={`
        h-screen sticky top-0
        bg-wasteland-darker border-r-2 border-pip-boy-green
        flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
      aria-label="主要導航"
    >
      {/* Sidebar Header */}
      <div className={`
        border-b-2 border-pip-boy-green/30 p-4
        ${isCollapsed ? 'px-2' : ''}
      `}>
        {isCollapsed ? (
          <div className="flex justify-center">
            <PixelIcon
              name="home"
              sizePreset="md"
              variant="primary"
              decorative
            />
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-pip-boy-green text-glow-green">
              控制台
            </h2>
            <p className="text-xs text-pip-boy-green/60">
              Dashboard
            </p>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title}>
            {/* 分隔線（第一個區塊除外） */}
            {sectionIndex > 0 && (
              <div className="h-px bg-pip-boy-green/30 my-2 mx-2" />
            )}

            {/* 分類標題（展開時） */}
            {!isCollapsed && (
              <div className="px-4 py-2 text-xs font-bold text-pip-boy-green/50 uppercase tracking-wider">
                {section.title}
              </div>
            )}

            {/* 選單項目 */}
            <div className={isCollapsed ? 'space-y-1' : ''}>
              {section.items.map(item =>
                isCollapsed ? renderCollapsedItem(item) : renderExpandedItem(item)
              )}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle Button */}
      <div className="border-t-2 border-pip-boy-green/30 p-2">
        {isCollapsed ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleCollapse}
                  className="w-full flex items-center justify-center py-3 text-pip-boy-green/70 hover:bg-pip-boy-green/10 hover:text-pip-boy-green transition-all duration-200"
                  aria-label="展開側邊欄"
                >
                  <PixelIcon
                    name="chevron-right"
                    sizePreset="sm"
                    variant="primary"
                    decorative
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>展開</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center gap-3 px-4 py-3 text-pip-boy-green/70 hover:bg-pip-boy-green/10 hover:text-pip-boy-green transition-all duration-200"
            aria-label="收合側邊欄"
          >
            <PixelIcon
              name="chevron-left"
              sizePreset="sm"
              variant="primary"
              decorative
            />
            <span className="text-sm">收合</span>
          </button>
        )}
      </div>
    </aside>
  )
}
