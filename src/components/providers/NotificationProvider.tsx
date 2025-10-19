'use client'

/**
 * NotificationProvider
 *
 * 全域通知系統 Provider
 * - 管理忠誠度獎勵通知狀態
 * - 提供顯示/關閉通知的 Context API
 * - 整合 LoyaltyRewardNotification 元件
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import LoyaltyRewardNotification from '@/components/loyalty/LoyaltyRewardNotification'

interface NotificationState {
  show: boolean
  loyaltyDays: number
  tokenExtension: number
}

interface NotificationContextValue {
  /** 顯示忠誠度獎勵通知 */
  showLoyaltyNotification: (days: number, extension: number) => void
  /** 關閉忠誠度獎勵通知 */
  closeLoyaltyNotification: () => void
  /** 當前通知狀態 */
  notificationState: NotificationState
}

// 建立 Context，提供預設值
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

/**
 * NotificationProvider 元件
 *
 * 使用方式：
 * ```tsx
 * // 在 layout.tsx 中包裹
 * <NotificationProvider>
 *   {children}
 * </NotificationProvider>
 *
 * // 在元件中使用
 * const { showLoyaltyNotification } = useNotification()
 * showLoyaltyNotification(7, 30) // 顯示「連續 7 天，延長 30 分鐘」
 * ```
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    show: false,
    loyaltyDays: 0,
    tokenExtension: 0,
  })

  /**
   * 顯示忠誠度獎勵通知
   * @param days - 連續登入天數
   * @param extension - Token 延長時間（分鐘）
   */
  const showLoyaltyNotification = useCallback((days: number, extension: number) => {
    setNotificationState({
      show: true,
      loyaltyDays: days,
      tokenExtension: extension,
    })
  }, [])

  /**
   * 關閉忠誠度獎勵通知
   */
  const closeLoyaltyNotification = useCallback(() => {
    setNotificationState((prev) => ({
      ...prev,
      show: false,
    }))
  }, [])

  const contextValue: NotificationContextValue = {
    showLoyaltyNotification,
    closeLoyaltyNotification,
    notificationState,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* 全域通知元件 */}
      <LoyaltyRewardNotification
        show={notificationState.show}
        onClose={closeLoyaltyNotification}
        loyaltyDays={notificationState.loyaltyDays}
        tokenExtension={notificationState.tokenExtension}
      />
    </NotificationContext.Provider>
  )
}

/**
 * useNotification Hook
 *
 * 在任何元件中使用此 Hook 來控制通知
 *
 * @throws {Error} 如果在 NotificationProvider 外部使用
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showLoyaltyNotification } = useNotification()
 *
 *   const handleSuccess = () => {
 *     showLoyaltyNotification(5, 30) // 連續 5 天，延長 30 分鐘
 *   }
 *
 *   return <button onClick={handleSuccess}>觸發通知</button>
 * }
 * ```
 */
export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext)

  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }

  return context
}
