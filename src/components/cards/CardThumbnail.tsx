/**
 * CardThumbnail Component
 * 卡牌縮圖元件
 *
 * 特色:
 * - 顯示卡牌圖片、名稱與花色
 * - 支援延遲載入
 * - 錯誤處理與 fallback 圖片
 * - 懸停效果
 * - 完整的無障礙性支援
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { PipBoyCard } from '@/components/ui/pipboy'
import type { TarotCard } from '@/types/api'
import { getCardImageUrl, getCardImageAlt, getFallbackImageUrl } from '@/lib/utils/cardImages'
import { getSuitDisplayName } from '@/types/suits'
import { use3DTilt } from '@/hooks/tilt/use3DTilt'
import { TiltVisualEffects } from '@/components/tilt/TiltVisualEffects'

export interface CardThumbnailProps {
  /**
   * 卡牌資料
   */
  card: TarotCard

  /**
   * 自定義類別
   */
  className?: string

  /**
   * 是否優先載入(用於首屏卡牌)
   */
  priority?: boolean

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
 * CardThumbnail 元件
 *
 * @example
 * ```tsx
 * <CardThumbnail card={card} />
 * ```
 */
export function CardThumbnail({
  card,
  className,
  priority = false,
  enable3DTilt = true,
  tiltMaxAngle = 15,
  tiltTransitionDuration = 400,
  enableGyroscope = true,
  enableGloss = true
}: CardThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // 3D 傾斜效果（縮圖使用 small 尺寸，自動減少角度至 60%）
  const {
    tiltRef,
    tiltHandlers,
    tiltStyle,
    tiltState
  } = use3DTilt({
    enable3DTilt,
    tiltMaxAngle,
    tiltTransitionDuration,
    enableGyroscope,
    enableGloss,
    size: 'small', // 縮圖使用 small 尺寸
    loading: !imageLoaded
  })

  // 取得圖片路徑
  const imageUrl = imageError ? getFallbackImageUrl() : getCardImageUrl(card)
  const imageAlt = getCardImageAlt(card)

  // 取得花色顯示名稱
  const suitName = getSuitDisplayName(card.suit)

  // 處理圖片載入錯誤
  const handleImageError = () => {
    console.warn(`[CardThumbnail] Image load failed for card: ${card.id}`)
    setImageError(true)
  }

  // 處理圖片載入成功
  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  // 處理鍵盤事件
  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.currentTarget.click()
    }
  }

  return (
    <Link
      ref={tiltRef}
      href={`/cards/${card.suit}/${card.id}`}
      className={cn(
        'block group focus:outline-none focus-visible:ring-2 focus-visible:ring-pip-boy-green focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm',
        className
      )}
      aria-label={`查看卡牌詳細資訊: ${card.name} - ${suitName}`}
      onKeyDown={handleKeyDown}
      onMouseEnter={tiltHandlers.onMouseEnter}
      onMouseMove={tiltHandlers.onMouseMove}
      onMouseLeave={tiltHandlers.onMouseLeave}
      style={tiltStyle}
    >
      <PipBoyCard
        interactive
        padding="none"
        className="h-full overflow-hidden transition-all duration-300 relative"
      >
        {/* 3D Tilt Visual Effects */}
        {tiltState.isTilted && (
          <TiltVisualEffects
            tiltState={tiltState}
            enableGloss={enableGloss}
          />
        )}
        {/* 卡牌圖片容器 */}
        <div className="relative aspect-[2/3] bg-black overflow-hidden">
          {/* 載入中骨架屏 */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-pip-boy-green/10 animate-pulse">
              <div
                className="text-2xl text-pip-boy-green/50"
                style={{
                  filter: 'drop-shadow(0 0 5px rgba(51, 255, 51, 0.3))',
                }}
              >
                🃏
              </div>
            </div>
          )}

          {/* 卡牌圖片 */}
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              'object-cover transition-all duration-300',
              'group-hover:scale-110',
              !imageLoaded && 'opacity-0'
            )}
            loading={priority ? undefined : 'lazy'}
            priority={priority}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />

          {/* 黑色半透明覆蓋層 (hover 時淡化) */}
          <div
            className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-all duration-300 pointer-events-none"
            aria-hidden="true"
          />

          {/* 圖片發光效果(懸停時) */}
          <div
            className="absolute inset-0 bg-pip-boy-green/0 group-hover:bg-pip-boy-green/10 transition-colors duration-300 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* 卡牌資訊 */}
        <div className="p-3 space-y-2">
          {/* 卡牌名稱 */}
          <h4 className="text-sm md:text-base font-mono font-semibold text-pip-boy-green uppercase tracking-wide line-clamp-2 group-hover:text-pip-boy-green-bright transition-colors">
            {card.name}
          </h4>

          {/* 花色與編號 */}
          <div className="flex items-center justify-between text-xs font-mono text-pip-boy-green/70">
            <span>{suitName}</span>
            {card.number !== null && card.number !== undefined && (
              <span className="font-semibold">#{String(card.number).padStart(2, '0')}</span>
            )}
          </div>
        </div>

        {/* 懸停邊框效果 */}
        <div
          className="absolute inset-0 border-2 border-transparent group-hover:border-pip-boy-green/50 pointer-events-none transition-colors duration-300"
          aria-hidden="true"
        />
      </PipBoyCard>
    </Link>
  )
}

/**
 * CardThumbnailGrid - 卡牌縮圖網格容器
 *
 * 用於組織多個 CardThumbnail 元件的佈局
 */
export interface CardThumbnailGridProps {
  children: React.ReactNode
  className?: string
}

export function CardThumbnailGrid({ children, className }: CardThumbnailGridProps) {
  return (
    <div
      className={cn(
        // 響應式網格佈局
        'grid gap-4 md:gap-6',
        // 行動裝置: 2 欄
        'grid-cols-2',
        // 平板: 3 欄
        'sm:grid-cols-3',
        // 桌面: 4 欄
        'lg:grid-cols-4',
        className
      )}
      role="list"
    >
      {children}
    </div>
  )
}

/**
 * CardThumbnailSkeleton - 卡牌縮圖載入骨架屏
 *
 * 用於載入狀態的佔位符
 */
export function CardThumbnailSkeleton() {
  return (
    <PipBoyCard padding="none" className="h-full overflow-hidden">
      <div className="animate-pulse">
        {/* 圖片骨架 */}
        <div className="aspect-[2/3] bg-pip-boy-green/10 flex items-center justify-center">
          <div className="text-2xl text-pip-boy-green/30">🃏</div>
        </div>

        {/* 資訊骨架 */}
        <div className="p-3 space-y-2">
          {/* 名稱骨架 */}
          <div className="h-4 bg-pip-boy-green/20 rounded w-3/4" />

          {/* 花色與編號骨架 */}
          <div className="flex items-center justify-between">
            <div className="h-3 bg-pip-boy-green/20 rounded w-1/3" />
            <div className="h-3 bg-pip-boy-green/20 rounded w-1/4" />
          </div>
        </div>
      </div>
    </PipBoyCard>
  )
}

/**
 * CardThumbnailList - 卡牌縮圖清單(列表佈局)
 *
 * 緊湊的列表佈局,適用於搜尋結果或側邊欄
 */
export interface CardThumbnailListProps {
  card: TarotCard
  className?: string
}

export function CardThumbnailList({ card, className }: CardThumbnailListProps) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = imageError ? getFallbackImageUrl() : getCardImageUrl(card)
  const imageAlt = getCardImageAlt(card)
  const suitName = getSuitDisplayName(card.suit)

  return (
    <Link
      href={`/cards/${card.suit}/${card.id}`}
      className={cn(
        'flex items-center gap-3 p-2',
        'border-2 border-pip-boy-green/30 bg-black/80',
        'hover:border-pip-boy-green hover:bg-pip-boy-green/10',
        'transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-pip-boy-green',
        className
      )}
      aria-label={`查看卡牌: ${card.name}`}
      role="listitem"
    >
      {/* 縮圖 */}
      <div className="relative w-12 h-16 flex-shrink-0 bg-black overflow-hidden">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="48px"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>

      {/* 資訊 */}
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-mono font-semibold text-pip-boy-green truncate">{card.name}</h5>
        <p className="text-xs font-mono text-pip-boy-green/60">
          {suitName} {card.number ? `#${String(card.number).padStart(2, '0')}` : ''}
        </p>
      </div>
    </Link>
  )
}
