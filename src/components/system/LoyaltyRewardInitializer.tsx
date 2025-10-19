'use client'

/**
 * LoyaltyRewardInitializer
 *
 * 忠誠度獎勵系統初始化器
 * - 監聽使用者登入狀態
 * - 每日首次訪問時檢查忠誠度資格
 * - 符合條件時觸發獎勵通知
 */

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { useNotification } from '@/components/providers/NotificationProvider'

const LAST_CHECK_KEY = 'loyalty-reward-last-check'
const NOTIFICATION_SHOWN_KEY = 'loyalty-notification-shown'

/**
 * 檢查是否為今天首次訪問
 * @returns true 如果是今天首次訪問，false 如果今天已檢查過
 */
function shouldCheckLoyalty(): boolean {
  if (typeof window === 'undefined') return false

  const today = new Date().toDateString()
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY)

  // 如果上次檢查不是今天，則需要重新檢查
  return lastCheck !== today
}

/**
 * 記錄今天已檢查忠誠度
 */
function markLoyaltyChecked(): void {
  if (typeof window === 'undefined') return
  const today = new Date().toDateString()
  localStorage.setItem(LAST_CHECK_KEY, today)
}

/**
 * 檢查今天是否已顯示過通知
 * @param currentStreak - 當前連續登入天數
 * @returns true 如果今天已顯示過，false 如果尚未顯示
 */
function isNotificationShownToday(currentStreak: number): boolean {
  if (typeof window === 'undefined') return false

  try {
    const stored = localStorage.getItem(NOTIFICATION_SHOWN_KEY)
    if (!stored) return false

    const data = JSON.parse(stored)
    const today = new Date().toDateString()

    // 檢查是否為今天且連續天數相同
    return data.date === today && data.streak === currentStreak
  } catch {
    return false
  }
}

/**
 * 記錄今天已顯示通知
 * @param currentStreak - 當前連續登入天數
 */
function markNotificationShown(currentStreak: number): void {
  if (typeof window === 'undefined') return

  const today = new Date().toDateString()
  const data = {
    date: today,
    streak: currentStreak,
  }
  localStorage.setItem(NOTIFICATION_SHOWN_KEY, JSON.stringify(data))
}

export function LoyaltyRewardInitializer() {
  const user = useAuthStore((state) => state.user)
  const checkLoyaltyStatus = useAuthStore((state) => state.checkLoyaltyStatus)
  const extendTokenByLoyalty = useAuthStore((state) => state.extendTokenByLoyalty)
  const { showLoyaltyNotification } = useNotification()

  // 使用 ref 防止重複檢查
  const hasChecked = useRef(false)

  useEffect(() => {
    // 只在已登入且尚未檢查過的情況下執行
    if (!user || hasChecked.current) {
      return
    }

    // 檢查是否為今天首次訪問
    if (!shouldCheckLoyalty()) {
      hasChecked.current = true
      return
    }

    const checkAndNotify = async () => {
      try {
        // 查詢忠誠度狀態
        const loyaltyStatus = await checkLoyaltyStatus()

        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 忠誠度狀態:', loyaltyStatus)
        }

        // 如果符合資格且可延長
        if (loyaltyStatus.extension_available && loyaltyStatus.is_eligible) {
          // 檢查今天是否已顯示過通知
          if (isNotificationShownToday(loyaltyStatus.current_streak)) {
            if (process.env.NODE_ENV === 'development') {
              console.log('ℹ️  今天已顯示過忠誠度通知，跳過')
            }
            return
          }

          // 執行 token 延長
          await extendTokenByLoyalty()

          // 計算延長時間（根據連續天數）
          const extensionMinutes = calculateExtension(loyaltyStatus.current_streak)

          // 顯示獎勵通知
          showLoyaltyNotification(loyaltyStatus.current_streak, extensionMinutes)

          // 記錄今天已顯示通知
          markNotificationShown(loyaltyStatus.current_streak)

          if (process.env.NODE_ENV === 'development') {
            console.log(`🎉 忠誠度獎勵通知已觸發：${loyaltyStatus.current_streak} 天，延長 ${extensionMinutes} 分鐘`)
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️  不符合忠誠度延長條件')
          }
        }

        // 記錄今天已檢查
        markLoyaltyChecked()
      } catch (error) {
        console.error('❌ 忠誠度檢查失敗:', error)
        // 即使失敗也記錄已檢查，避免重複請求
        markLoyaltyChecked()
      } finally {
        hasChecked.current = true
      }
    }

    // 延遲 1 秒後執行，避免與其他初始化邏輯衝突
    const timer = setTimeout(checkAndNotify, 1000)

    return () => clearTimeout(timer)
  }, [user, checkLoyaltyStatus, extendTokenByLoyalty, showLoyaltyNotification])

  // 這個元件不需要渲染任何 UI
  return null
}

/**
 * 根據連續登入天數計算 token 延長時間
 * @param streak - 連續登入天數
 * @returns 延長時間（分鐘）
 */
function calculateExtension(streak: number): number {
  // 基礎獎勵：30 分鐘
  const baseMinutes = 30

  // 里程碑獎勵
  if (streak >= 30) return baseMinutes + 60  // 30+ 天: +90 分鐘
  if (streak >= 14) return baseMinutes + 45  // 14+ 天: +75 分鐘
  if (streak >= 7) return baseMinutes + 30   // 7+ 天: +60 分鐘
  if (streak >= 3) return baseMinutes + 15   // 3+ 天: +45 分鐘

  return baseMinutes  // 1-2 天: +30 分鐘
}
