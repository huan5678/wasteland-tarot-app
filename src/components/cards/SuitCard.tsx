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
import { SuitIcon } from '@/components/icons/SuitIcon'
import { PixelIcon } from '@/components/ui/icons/PixelIcon'
import { SuitType, SUIT_CONFIG, type SuitMetadata, convertApiToRouteSuit } from '@/types/suits'

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

  // 將 API 枚舉值轉換為簡短路由名稱（SEO 友善）
  const routeSuit = convertApiToRouteSuit(suit)

  // 處理鍵盤事件(Enter 或 Space 觸發點擊)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.currentTarget.click()
    }
  }

  return (
    <Link
      href={`/cards/${routeSuit}`}
      className={cn(
        'flex flex-col items-center gap-4 p-6',
        'border-2 border-pip-boy-green/30 bg-pip-boy-green/5',
        'hover:border-pip-boy-green hover:bg-pip-boy-green/10',
        'transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-pip-boy-green focus-visible:ring-offset-2 focus-visible:ring-offset-black',
        'group',
        className
      )}
      aria-label={`瀏覽 ${metadata.name_zh_tw} (${metadata.name_en}),共 ${metadata.card_count} 張卡牌`}
      onKeyDown={handleKeyDown}
    >
      {/* 花色圖示 */}
      <div className="flex items-center justify-center">
        <div className="transition-transform duration-300 group-hover:scale-110">
          <SuitIcon
            iconName={metadata.iconName}
            size="lg"
            ariaHidden
          />
        </div>
      </div>

      {/* 花色名稱 */}
      <div className="text-center space-y-1">
        {/* 中文名稱(主標題) */}
        <h3 className="text-lg md:text-xl font-bold uppercase tracking-wider text-pip-boy-green">
          {metadata.name_zh_tw}
        </h3>

        {/* 英文名稱(副標題) */}
        <p className="text-xs md:text-sm text-pip-boy-green/70 uppercase tracking-wide">
          {metadata.name_en}
        </p>
      </div>

      {/* 描述 */}
      <p className="text-xs text-pip-boy-green/60 text-center">
        {metadata.description}
      </p>

      {/* 卡牌數量指示器 */}
      <div className="flex items-center justify-center gap-2 pt-3 border-t border-pip-boy-green/30 w-full">
        <PixelIcon
          name="stack-line"
          size={16}
          className="text-pip-boy-green"
          decorative
        />
        <span className="text-xs md:text-sm font-semibold text-pip-boy-green">
          {metadata.card_count} 張卡牌
        </span>
      </div>
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
        // 響應式網格佈局 - 階段式 gap
        'grid gap-4 md:gap-5 lg:gap-6',
        // 行動裝置: 1 欄
        'grid-cols-1',
        // 小平板: 2 欄 (640px+)
        'sm:grid-cols-2',
        // 平板: 3 欄 (768px+) - 充分利用空間
        'md:grid-cols-3',
        // 桌面: 3 欄 (1024px+) - 5 個花色,3x2 佈局
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
