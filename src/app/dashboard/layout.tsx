'use client'

import React, { useState, useEffect } from 'react'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

const SIDEBAR_COLLAPSED_KEY = 'dashboard-sidebar-collapsed'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 認證檢查已由 middleware.ts 處理，這裡不需要重複檢查
  // Middleware 已保證 /dashboard 路由只有已登入使用者能訪問

  // 同步 sidebar 的收合狀態（與 DashboardSidebar 同步）
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // 從 localStorage 讀取初始狀態
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }

    // 監聽 storage 事件以同步多個 tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIDEBAR_COLLAPSED_KEY && e.newValue !== null) {
        setIsCollapsed(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // 使用自定義事件在同一個 tab 內同步
    const handleCustomEvent = ((e: CustomEvent) => {
      setIsCollapsed(e.detail.collapsed)
    }) as EventListener

    window.addEventListener('sidebar-collapsed-change', handleCustomEvent)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebar-collapsed-change', handleCustomEvent)
    }
  }, [])

  return (
    <div className="h-full">
      {/* Sidebar - 左側欄 (桌面版，fixed 定位) */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {/* Main Content - 右側內容區域，根據 sidebar 狀態調整左側間距 */}
      <div
        className={`min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:ml-16' : 'md:ml-60'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
