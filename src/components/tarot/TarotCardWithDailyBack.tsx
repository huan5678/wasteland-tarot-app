/**
 * TarotCardWithDailyBack Component
 * 自動使用每日隨機卡背的 TarotCard 包裝元件
 *
 * 功能：
 * - 自動從 DailyCardBackProvider 取得每日卡背
 * - 支援手動覆寫 cardBackUrl
 * - 完全兼容原始 TarotCard 的所有 props
 */

'use client'

import React from 'react'
import { TarotCard } from './TarotCard'
import { useDailyCardBackContext } from '@/components/providers/DailyCardBackProvider'

/**
 * TarotCard 的所有 props（從原始元件複製）
 */
interface TarotCard {
  id: number
  name: string
  suit: string
  number?: number
  meaning_upright: string
  meaning_reversed: string
  image_url: string
  keywords: string[]
}

interface TarotCardWithDailyBackProps {
  card: TarotCard
  isRevealed: boolean
  position: 'upright' | 'reversed'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  showKeywords?: boolean
  onClick?: (card: TarotCard) => void
  flipStyle?: 'default' | 'kokonut'
  isSelectable?: boolean
  isSelected?: boolean
  animationDelay?: number
  showGlow?: boolean
  enableHaptic?: boolean
  cardIndex?: number
  totalCards?: number
  showProgress?: boolean
  onLongPress?: (card: TarotCard) => void
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', card: TarotCard) => void
  /**
   * 手動指定卡背 URL（覆寫每日隨機卡背）
   */
  cardBackUrl?: string
  /**
   * 啟用 3D 傾斜效果（預設：true）
   */
  enable3DTilt?: boolean
  /**
   * 3D 傾斜最大角度（預設：15）
   */
  tiltMaxAngle?: number
  /**
   * 3D 傾斜過渡動畫時間，單位 ms（預設：400）
   */
  tiltTransitionDuration?: number
  /**
   * 啟用陀螺儀傾斜（行動裝置）（預設：true）
   */
  enableGyroscope?: boolean
  /**
   * 啟用光澤效果（預設：true）
   */
  enableGloss?: boolean
}

/**
 * TarotCardWithDailyBack Component
 *
 * 自動使用每日隨機卡背的 TarotCard 元件
 *
 * @example
 * ```tsx
 * // 使用每日隨機卡背
 * <TarotCardWithDailyBack
 *   card={card}
 *   isRevealed={false}
 *   position="upright"
 * />
 *
 * // 手動覆寫卡背
 * <TarotCardWithDailyBack
 *   card={card}
 *   isRevealed={false}
 *   position="upright"
 *   cardBackUrl="/custom-back.png"
 * />
 * ```
 */
export function TarotCardWithDailyBack({
  cardBackUrl,
  ...props
}: TarotCardWithDailyBackProps) {
  // 從 Context 取得每日隨機卡背
  const { cardBackPath, isLoading } = useDailyCardBackContext()

  // 如果手動指定 cardBackUrl，則使用指定的；否則使用每日隨機卡背
  const finalCardBackUrl = cardBackUrl || cardBackPath

  // 如果卡背還在載入，可以顯示預設卡背或等待
  // 這裡選擇使用一個預設的 fallback 卡背
  const displayCardBackUrl = isLoading
    ? '/assets/cards/card-backs/01.png'
    : finalCardBackUrl

  return (
    <TarotCard
      {...props}
      cardBackUrl={displayCardBackUrl}
    />
  )
}

/**
 * 預設匯出
 */
export default TarotCardWithDailyBack
