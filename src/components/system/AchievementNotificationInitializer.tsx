'use client'

import { useEffect } from 'react'
import { useAchievementStore } from '@/lib/stores/achievementStore'
import { AchievementUnlockNotification } from '@/components/achievements'

/**
 * 成就通知初始化器
 *
 * 功能:
 * - 監聽 achievementStore 中的新解鎖成就
 * - 自動顯示成就解鎖通知
 * - 提供全域成就通知 UI
 *
 * 用法:
 * 在 layout.tsx 中引入，放在 NotificationProvider 內部
 */
export function AchievementNotificationInitializer() {
  const {
    newlyUnlockedAchievements,
    markAsRead,
    clearNewlyUnlocked,
  } = useAchievementStore()

  // 當有新解鎖的成就時，記錄 log（開發環境）
  useEffect(() => {
    if (newlyUnlockedAchievements.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('[Achievement] 新解鎖成就:', newlyUnlockedAchievements)
    }
  }, [newlyUnlockedAchievements])

  return (
    <AchievementUnlockNotification
      achievements={newlyUnlockedAchievements}
      onDismiss={markAsRead}
      onDismissAll={clearNewlyUnlocked}
      autoDismissDelay={6000} // 6 秒自動消失
    />
  )
}

export default AchievementNotificationInitializer
