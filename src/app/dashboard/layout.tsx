'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBingoBadge, setShowBingoBadge] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // 檢查賓果紅點提示
  useEffect(() => {
    setIsClient(true)
    if (user) {
      const lastClaimDate = localStorage.getItem('bingo-last-claim-date')
      const today = new Date().toDateString()
      setShowBingoBadge(lastClaimDate !== today)
    }
  }, [user])

  // 認證檢查已由 middleware.ts 處理，這裡不需要重複檢查
  // 如果 middleware 沒有重導向，表示使用者已通過驗證

  const handleNavigation = (href: string) => {
    router.push(href)
    setMobileMenuOpen(false) // 關閉手機選單
  }

  // 選單結構（與 DashboardSidebar 相同）
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
        ...(user?.is_admin ? [{ href: '/admin', label: '管理後台', icon: 'shield', ariaLabel: '管理後台' }] : []),
      ],
    },
  ]

  const isActive = (href: string) => pathname === href

  // Middleware 已保證 /dashboard 路由只有已登入使用者能訪問
  // 如果 user 資料還在載入中，先渲染 layout，讓 ZustandAuthInitializer 完成初始化
  // 不在這裡阻擋渲染，避免卡在 loading 畫面

  return (
    <div className="flex min-h-screen bg-wasteland-dark">
      {/* 桌面版 Sidebar（固定） */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {/* 手機版漢堡按鈕 + Sheet Sidebar */}
      <div className="md:hidden fixed top-20 left-4 z-40">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="flex items-center justify-center p-3 border-2 border-pip-boy-green/30 bg-wasteland-darker hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-all duration-200"
              aria-label="開啟導航選單"
            >
              <PixelIcon name="menu" sizePreset="md" variant="primary" decorative />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] bg-wasteland-darker border-pip-boy-green/30 p-0"
          >
            <SheetHeader className="border-b-2 border-pip-boy-green/30 p-4">
              <SheetTitle className="text-pip-boy-green text-xl font-bold text-glow-green">
                導航選單
              </SheetTitle>
            </SheetHeader>

            {/* 手機版選單內容 */}
            <nav className="py-4">
              {navSections.map((section, sectionIndex) => (
                <div key={section.title}>
                  {/* 分隔線（第一個區塊除外） */}
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
                          relative w-full flex items-center gap-3 px-4 py-3 text-sm
                          transition-all duration-200 cursor-pointer
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
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* 主內容區域 */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
