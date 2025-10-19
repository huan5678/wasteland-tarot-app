'use client'

/**
 * ActivityTrackerInitializer
 *
 * 全域活躍度追蹤初始化器
 * - 自動追蹤使用者活躍時間（頁面 focus + 互動）
 * - 累積 30 分鐘後自動延長 token
 * - 只在已登入狀態下運作
 */

import { useEffect } from 'react'
import { useActivityTracker } from '@/hooks/useActivityTracker'
import { useAuthStore } from '@/lib/authStore'

export function ActivityTrackerInitializer() {
  const isAuthenticated = useAuthStore((state) => state.user !== null)
  const { isActive, activeTime, progress } = useActivityTracker()

  // 開發環境：顯示活躍度追蹤狀態（可選）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isAuthenticated) {
      const debugInfo = {
        isActive,
        activeTime: `${Math.floor(activeTime / 1000 / 60)} min ${Math.floor((activeTime / 1000) % 60)} sec`,
        progress: `${Math.floor(progress)}%`,
      }
      // 只在狀態變化時輸出，避免過多 log
      if (isActive) {
        console.debug('📊 Activity Tracker:', debugInfo)
      }
    }
  }, [isActive, activeTime, progress, isAuthenticated])

  // 這個元件不需要渲染任何 UI
  return null
}
