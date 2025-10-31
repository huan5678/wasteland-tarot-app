'use client'

import React from 'react'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 認證檢查已由 middleware.ts 處理，這裡不需要重複檢查
  // Middleware 已保證 /dashboard 路由只有已登入使用者能訪問

  return (
    <div className="flex h-full">
      {/* Sidebar - 左側欄 (桌面版) */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {/* Main Content - 右側內容區域 (填滿剩餘空間) */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
