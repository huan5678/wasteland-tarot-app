/**
 * Admin Layout - 管理後台佈局
 *
 * 功能：
 * - 權限檢查（只有 admin 可訪問）
 * - 統一的管理後台導航
 * - Fallout 主題設計
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { PixelIcon } from '@/components/ui/icons'
import Link from 'next/link'

interface AdminNavItem {
  href: string
  label: string
  icon: string
  description: string
}

const NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/admin',
    label: '總覽',
    icon: 'dashboard',
    description: '管理後台首頁'
  },
  {
    href: '/admin/characters',
    label: '角色管理',
    icon: 'user',
    description: '管理角色聲音'
  },
  {
    href: '/admin/factions',
    label: '陣營管理',
    icon: 'flag',
    description: '管理陣營資料'
  },
  {
    href: '/admin/faction-characters',
    label: '陣營關聯',
    icon: 'git-branch',
    description: '管理角色陣營關聯'
  },
  {
    href: '/admin/interpretations',
    label: '解讀管理',
    icon: 'book',
    description: '管理卡牌解讀'
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)
  const [isChecking, setIsChecking] = useState(true)

  // 權限檢查
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/auth/login?returnUrl=/admin')
        return
      }

      if (!user.isAdmin) {
        router.push('/dashboard')
        return
      }

      setIsChecking(false)
    }

    checkAdmin()
  }, [user, router])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">驗證管理員權限...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-pip-boy-green">
      {/* Header */}
      <header className="border-b-2 border-pip-boy-green/30 bg-black/95 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <PixelIcon name="shield" sizePreset="lg" variant="primary" decorative />
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-wider">
                  廢土塔羅 - 管理後台
                </h1>
                <p className="text-xs text-pip-boy-green/70 uppercase tracking-wider">
                  WASTELAND TAROT ADMIN PANEL
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-pip-boy-green/80">
                {user?.email}
              </span>
              <Link
                href="/dashboard"
                className="px-4 py-2 border-2 border-pip-boy-green/50 hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-colors"
              >
                <PixelIcon name="arrow-left" sizePreset="xs" decorative className="inline mr-2" />
                返回網站
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r-2 border-pip-boy-green/30 min-h-[calc(100vh-80px)] bg-black/50">
          <nav className="p-4">
            <div className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      block px-4 py-3 border-2 transition-all duration-200
                      ${isActive
                        ? 'border-pip-boy-green bg-pip-boy-green/20 text-pip-boy-green'
                        : 'border-pip-boy-green/30 text-pip-boy-green/70 hover:border-pip-boy-green/60 hover:bg-pip-boy-green/10'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <PixelIcon
                        name={item.icon}
                        sizePreset="sm"
                        variant={isActive ? 'primary' : 'default'}
                        decorative
                      />
                      <div className="flex-1">
                        <div className="font-bold text-sm uppercase tracking-wider">
                          {item.label}
                        </div>
                        <div className="text-xs opacity-70">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
