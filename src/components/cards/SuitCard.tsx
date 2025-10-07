/**
 * SuitCard Component
 * 花色選項卡片元件
 *
 * 特色:
 * - 顯示花色圖示、名稱與卡牌數量
 * - Pip-Boy 風格設計
 * - 懸停效果
 * - 完整的無障礙性支援
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PipBoyCard } from '@/components/ui/pipboy'
import { SuitType, SUIT_CONFIG, type SuitMetadata } from '@/types/suits'

export interface SuitCardProps {
  /**
   * 花色類型
   */
  suit: SuitType

  /**
   * 自定義類別
   */
  className?: string
}

/**
 * SuitCard 元件
 *
 * @example
 * ```tsx
 * <SuitCard suit={SuitType.MAJOR_ARCANA} />
 * ```
 */
export function SuitCard({ suit, className }: SuitCardProps) {
  // 從配置中取得花色元資料
  const metadata: SuitMetadata = SUIT_CONFIG[suit]

  // 處理鍵盤事件(Enter 或 Space 觸發點擊)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.currentTarget.click()
    }
  }

  return (
    <Link
      href={`/cards/${suit}`}
      className={cn(
        'block focus:outline-none focus-visible:ring-2 focus-visible:ring-pip-boy-green focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm',
        className
      )}
      aria-label={`瀏覽 ${metadata.name_zh_tw} (${metadata.name_en}),共 ${metadata.card_count} 張卡牌`}
      onKeyDown={handleKeyDown}
    >
      <PipBoyCard
        interactive
        glowEffect
        padding="md"
        className="h-full transition-all duration-300"
      >
        {/* 花色圖示 */}
        <div className="flex items-center justify-center mb-4">
          <div
            className="text-5xl md:text-6xl lg:text-7xl transition-transform duration-300 group-hover:scale-110"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(51, 255, 51, 0.4))',
            }}
            aria-hidden="true"
          >
            {metadata.icon || '🃏'}
          </div>
        </div>

        {/* 花色名稱 */}
        <div className="text-center space-y-2">
          {/* 中文名稱(主標題) */}
          <h3 className="text-xl md:text-2xl font-bold font-mono uppercase tracking-wider text-pip-boy-green">
            {metadata.name_zh_tw}
          </h3>

          {/* 英文名稱(副標題) */}
          <p className="text-sm md:text-base font-mono text-pip-boy-green/70 uppercase tracking-wide">
            {metadata.name_en}
          </p>
        </div>

        {/* 描述 */}
        <p className="text-xs md:text-sm font-mono text-pip-boy-green/60 text-center mt-3 mb-4 px-2">
          {metadata.description}
        </p>

        {/* 卡牌數量指示器 */}
        <div className="flex items-center justify-center gap-2 mt-auto pt-4 border-t border-pip-boy-green/30">
          <div
            className="text-pip-boy-green text-sm"
            aria-hidden="true"
            style={{
              filter: 'drop-shadow(0 0 5px rgba(51, 255, 51, 0.3))',
            }}
          >
            🃏
          </div>
          <span className="text-sm md:text-base font-mono font-semibold text-pip-boy-green">
            {metadata.card_count} 張卡牌
          </span>
        </div>

        {/* 懸停提示(視覺上) */}
        <div
          className="absolute inset-0 border-2 border-transparent hover:border-pip-boy-green/50 rounded-sm pointer-events-none transition-colors duration-300"
          aria-hidden="true"
        />
      </PipBoyCard>
    </Link>
  )
}

/**
 * SuitCardGrid - 花色卡片網格容器
 *
 * 用於組織多個 SuitCard 元件的佈局
 */
export interface SuitCardGridProps {
  children: React.ReactNode
  className?: string
}

export function SuitCardGrid({ children, className }: SuitCardGridProps) {
  return (
    <div
      className={cn(
        // 響應式網格佈局
        'grid gap-4 md:gap-6 lg:gap-8',
        // 行動裝置: 1 欄
        'grid-cols-1',
        // 平板: 2 欄
        'sm:grid-cols-2',
        // 桌面: 3 欄(5 個花色,3x2 佈局)
        'lg:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * SuitCardSkeleton - 花色卡片載入骨架屏
 *
 * 用於載入狀態的佔位符
 */
export function SuitCardSkeleton() {
  return (
    <PipBoyCard padding="md" className="h-full">
      <div className="animate-pulse space-y-4">
        {/* 圖示骨架 */}
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 md:h-20 md:w-20 bg-pip-boy-green/20 rounded-full" />
        </div>

        {/* 標題骨架 */}
        <div className="space-y-2">
          <div className="h-6 bg-pip-boy-green/20 rounded mx-auto w-3/4" />
          <div className="h-4 bg-pip-boy-green/20 rounded mx-auto w-1/2" />
        </div>

        {/* 描述骨架 */}
        <div className="space-y-2 mt-3">
          <div className="h-3 bg-pip-boy-green/20 rounded mx-auto w-full" />
          <div className="h-3 bg-pip-boy-green/20 rounded mx-auto w-5/6" />
        </div>

        {/* 數量骨架 */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-pip-boy-green/30">
          <div className="h-4 w-24 bg-pip-boy-green/20 rounded" />
        </div>
      </div>
    </PipBoyCard>
  )
}
