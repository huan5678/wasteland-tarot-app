/**
 * DailyCardBackProvider
 * 提供每日隨機卡背的 Context Provider
 *
 * 功能：
 * - 全域管理每日隨機卡背
 * - 自動在換日時更新卡背
 * - 提供卡背路徑給所有子元件
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useDailyCardBack } from '@/hooks/useDailyCardBack'
import { getCardBackFilenames, CARD_BACK_BASE_PATH } from '@/config/cardBackConfig'

/**
 * Context 值介面
 */
interface DailyCardBackContextValue {
  /** 當前卡背圖片路徑 */
  cardBackPath: string
  /** 是否正在載入 */
  isLoading: boolean
  /** 手動重新隨機選擇卡背 */
  refreshCardBack: () => void
}

/**
 * Context
 */
const DailyCardBackContext = createContext<DailyCardBackContextValue | undefined>(undefined)

/**
 * Provider Props
 */
interface DailyCardBackProviderProps {
  children: ReactNode
}

/**
 * Provider 元件
 *
 * @example
 * ```tsx
 * // 在 app/layout.tsx 中使用
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <DailyCardBackProvider>
 *           {children}
 *         </DailyCardBackProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function DailyCardBackProvider({ children }: DailyCardBackProviderProps) {
  const dailyCardBack = useDailyCardBack(
    getCardBackFilenames(),
    CARD_BACK_BASE_PATH
  )

  return (
    <DailyCardBackContext.Provider value={dailyCardBack}>
      {children}
    </DailyCardBackContext.Provider>
  )
}

/**
 * Hook 用於取得每日隨機卡背
 *
 * @throws 如果在 DailyCardBackProvider 外部使用
 *
 * @example
 * ```tsx
 * function MyCard() {
 *   const { cardBackPath, isLoading } = useDailyCardBackContext()
 *
 *   if (isLoading) return <div>Loading...</div>
 *
 *   return <TarotCard cardBackUrl={cardBackPath} />
 * }
 * ```
 */
export function useDailyCardBackContext(): DailyCardBackContextValue {
  const context = useContext(DailyCardBackContext)

  if (context === undefined) {
    throw new Error(
      'useDailyCardBackContext must be used within a DailyCardBackProvider'
    )
  }

  return context
}
