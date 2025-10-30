'use client'

import React from 'react'
import { useAuthStore } from '@/lib/authStore'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAuthStore(s => s.user)

  // 認證檢查已由 middleware.ts 處理，這裡不需要重複檢查
  // 如果 middleware 沒有重導向，表示使用者已通過驗證
  // Middleware 已保證 /dashboard 路由只有已登入使用者能訪問
  // 如果 user 資料還在載入中，先渲染 layout，讓 ZustandAuthInitializer 完成初始化
  // 不在這裡阻擋渲染，避免卡在 loading 畫面

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* 桌面版 Sidebar（固定） */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {/* 主內容區域 */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
