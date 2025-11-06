/**
 * CardThumbnail Component (Unified)
 * 卡牌縮圖元件 - 統一靜態與翻牌模式
 *
 * 特色:
 * - 支援靜態 Link 模式（瀏覽頁面）
 * - 支援翻牌動畫模式（抽牌情境）
 * - 3D 傾斜效果
 * - 完整的無障礙性支援
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { PipBoyCard } from '@/components/ui/pipboy'
import { PixelIcon } from '@/components/ui/icons/PixelIcon'
import type { TarotCard } from '@/types/api'
import { getCardImageUrl, getCardImageAlt, getFallbackImageUrl } from '@/lib/utils/cardImages'
import { getSuitDisplayName, convertApiToRouteSuit, SuitType } from '@/types/suits'
import { use3DTilt } from '@/hooks/tilt/use3DTilt'
import { TiltVisualEffects } from '@/components/tilt/TiltVisualEffects'
import { CardBackPixelEffect } from '@/components/cards/CardBackPixelEffect'
import { useAudioEffect } from '@/hooks/audio/useAudioEffect'

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
   * 卡片尺寸
   */
  size?: 'small' | 'medium' | 'large'

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

  // ========== 翻牌模式專用 props ==========
  /**
   * 啟用翻牌模式（預設：false）
   * 當為 true 時，卡片可以從卡背翻到卡面
   */
  flippable?: boolean

  /**
   * 是否已翻開（需要 flippable=true）
   */
  isRevealed?: boolean

  /**
   * 卡牌正逆位（需要 flippable=true）
   */
  position?: 'upright' | 'reversed'

  /**
   * 卡背圖片 URL（需要 flippable=true）
   */
  cardBackUrl?: string

  /**
   * 翻牌動畫完成的回調（需要 flippable=true）
   */
  onFlipComplete?: () => void

  /**
   * 位置標籤（如：「過去」、「現在」、「未來」）（需要 flippable=true）
   */
  positionLabel?: string

  /**
   * 動畫延遲（ms）
   */
  animationDelay?: number

  // ========== 互動 ==========
  /**
   * 點擊回調
   * - 靜態模式：不使用（由 Link 處理）
   * - 翻牌模式：點擊已翻開的卡片時觸發
   */
  onClick?: (card: TarotCard) => void
}

const sizeClasses = {
  small: 'w-32 h-48',   // 128×192px (2:3)
  medium: 'w-40 h-60',  // 160×240px (2:3)
  large: 'w-48 h-72'    // 192×288px (2:3)
}

/**
 * CardThumbnail 元件（統一版本）
 *
 * @example
 * 靜態模式（瀏覽頁面）
 * ```tsx
 * <CardThumbnail card={card} />
 * ```
 *
 * @example
 * 翻牌模式（抽牌情境）
 * ```tsx
 * <CardThumbnail
 *   card={card}
 *   flippable
 *   isRevealed={false}
 *   position="upright"
 *   cardBackUrl="/assets/cards/card-backs/01.png"
 *   onClick={(card) => setSelectedCard(card)}
 * />
 * ```
 */
export function CardThumbnail({
  card,
  className,
  priority = false,
  size = 'medium',
  enable3DTilt = true,
  tiltMaxAngle = 15,
  tiltTransitionDuration = 400,
  enableGyroscope = true,
  enableGloss = true,
  flippable = false,
  isRevealed = true,
  position = 'upright',
  cardBackUrl = '/assets/cards/card-backs/01.png',
  onFlipComplete,
  positionLabel,
  animationDelay = 0,
  onClick
}: CardThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [previousRevealed, setPreviousRevealed] = useState(isRevealed)
  const { playSound } = useAudioEffect()

  // 3D 傾斜效果
  const {
    tiltRef,
    tiltHandlers,
    tiltStyle,
    tiltState
  } = use3DTilt({
    enable3DTilt: enable3DTilt && !isFlipping,
    tiltMaxAngle,
    tiltTransitionDuration,
    enableGyroscope,
    enableGloss,
    size: flippable ? size : 'small', // 靜態模式使用 small（縮圖）
    loading: !imageLoaded
  })

  // 處理翻牌動畫（僅 flippable 模式）
  useEffect(() => {
    if (!flippable) return

    if (previousRevealed !== isRevealed) {
      setIsFlipping(true)
      playSound('card-flip')

      const timer = setTimeout(() => {
        setIsFlipping(false)
        setPreviousRevealed(isRevealed)
        onFlipComplete?.()
      }, 700) // 翻牌動畫時長

      return () => clearTimeout(timer)
    }
  }, [flippable, isRevealed, previousRevealed, playSound, onFlipComplete])

  // 取得圖片路徑
  const imageUrl = imageError ? getFallbackImageUrl() : getCardImageUrl(card)
  const imageAlt = getCardImageAlt(card)

  // 取得花色顯示名稱
  const suitName = getSuitDisplayName(card.suit)

  // 將 API 枚舉值轉換為簡短路由名稱（SEO 友善）
  const routeSuit = convertApiToRouteSuit(card.suit as SuitType)

  // 處理圖片載入錯誤
  const handleImageError = useCallback(() => {
    console.warn(`[CardThumbnail] Image load failed for card: ${card.id}`)
    setImageError(true)
  }, [card.id])

  // 處理圖片載入成功
  const handleImageLoadingComplete = useCallback(() => {
    setTimeout(() => {
      setImageLoaded(true)
    }, 100)
  }, [])

  // 處理點擊事件
  const handleClick = useCallback(() => {
    if (flippable && isRevealed && onClick) {
      onClick(card)
    }
  }, [flippable, isRevealed, onClick, card])

  // 處理鍵盤事件（靜態模式）
  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.currentTarget.click()
    }
  }

  // ========== 渲染：翻牌模式 ==========
  if (flippable) {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        {/* 翻牌容器 */}
        <div
          ref={tiltRef}
          className={cn(
            sizeClasses[size],
            'relative cursor-pointer [perspective:1200px]',
            isFlipping && 'pointer-events-none'
          )}
          onClick={handleClick}
          onMouseEnter={tiltHandlers.onMouseEnter}
          onMouseMove={tiltHandlers.onMouseMove}
          onMouseLeave={tiltHandlers.onMouseLeave}
          style={{
            ...tiltStyle,
            animationDelay: `${animationDelay}ms`
          }}
        >
          {/* 3D Tilt Visual Effects */}
          {tiltState.isTilted && (
            <TiltVisualEffects
              tiltState={tiltState}
              enableGloss={enableGloss}
            />
          )}

          {/* 翻牌內層 - 3D 旋轉容器 */}
          <div
            className={cn(
              'relative w-full h-full [transform-style:preserve-3d]',
              'transition-transform duration-700 ease-out',
              isRevealed ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
            )}
          >
            {/* 卡背 */}
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
              <PipBoyCard
                padding="none"
                className="h-full overflow-hidden relative"
              >
                {/* 卡背圖片 */}
                <div className="relative w-full h-full bg-black">
                  <img
                    src={cardBackUrl}
                    alt="Wasteland Tarot Card Back"
                    className="w-full h-full object-cover"
                  />
                  {/* Pixel hover effect */}
                  <CardBackPixelEffect
                    isHovered={tiltState.isTilted}
                    gap={size === 'small' ? 10 : size === 'medium' ? 8 : 6}
                    speed={35}
                  />
                </div>

                {/* 卡背提示文字 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-pip-boy-green">
                    <PixelIcon
                      name="sparkles"
                      size={size === 'small' ? 24 : size === 'medium' ? 32 : 40}
                      className="mb-2 mx-auto"
                      decorative
                    />
                    <div className={cn(
                      'font-bold',
                      size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'
                    )}>
                      點擊翻牌
                    </div>
                  </div>
                </div>
              </PipBoyCard>
            </div>

            {/* 卡面 - 需要先旋轉 180 度，這樣外層翻轉時才會正面朝前 */}
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <PipBoyCard
                isClickable={!!onClick}
                padding="none"
                className="h-full overflow-hidden transition-all duration-300 relative"
              >
                {/* 卡牌圖片容器 - 逆位時旋轉 180 度 */}
                <div className={cn(
                  "relative aspect-[2/3] bg-black overflow-hidden",
                  position === 'reversed' && 'rotate-180'
                )}>
                  {/* 載入中骨架屏 */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-pip-boy-green/10 animate-pulse">
                      <PixelIcon
                        name="image"
                        size={32}
                        className="text-pip-boy-green/50"
                        decorative
                      />
                    </div>
                  )}

                  {/* 載入中旋轉圖示（中央） */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <PixelIcon
                        name="loader"
                        animation="spin"
                        variant="primary"
                        sizePreset="lg"
                        decorative
                      />
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
                      onClick && 'group-hover:scale-110',
                      !imageLoaded && 'opacity-0'
                    )}
                    loading={priority ? undefined : 'lazy'}
                    priority={priority}
                    onError={handleImageError}
                    onLoadingComplete={handleImageLoadingComplete}
                  />

                  {/* 黑色半透明覆蓋層 (hover 時淡化) */}
                  {onClick && (
                    <div
                      className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-all duration-300 pointer-events-none"
                      aria-hidden="true"
                    />
                  )}

                  {/* 圖片發光效果(懸停時) */}
                  {onClick && (
                    <div
                      className="absolute inset-0 bg-pip-boy-green/0 group-hover:bg-pip-boy-green/10 transition-colors duration-300 pointer-events-none"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* 卡牌資訊 */}
                <div className="p-3 space-y-2">
                  {/* 卡牌名稱 */}
                  <h4 className={cn(
                    'font-semibold text-pip-boy-green uppercase tracking-wide line-clamp-2',
                    onClick && 'group-hover:text-pip-boy-green-bright transition-colors',
                    size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'
                  )}>
                    {card.name}
                  </h4>

                  {/* 花色與編號 */}
                  <div className="flex items-center justify-between text-xs text-pip-boy-green/70">
                    <span>{suitName}</span>
                    {card.number !== null && card.number !== undefined && (
                      <span className="font-semibold">#{String(card.number).padStart(2, '0')}</span>
                    )}
                  </div>

                  {/* 正逆位指示 */}
                  <div className={cn(
                    'text-center text-pip-boy-green/60',
                    size === 'small' ? 'text-[10px]' : 'text-xs'
                  )}>
                    {position === 'upright' ? '正位' : '逆位'}
                  </div>
                </div>

                {/* 懸停邊框效果 */}
                {onClick && (
                  <div
                    className="absolute inset-0 border-2 border-transparent group-hover:border-pip-boy-green/50 rounded-sm pointer-events-none transition-colors duration-300"
                    aria-hidden="true"
                  />
                )}
              </PipBoyCard>
            </div>
          </div>
        </div>

        {/* 位置標籤 */}
        {positionLabel && (
          <div className={cn(
            'text-center text-pip-boy-green transition-all duration-300',
            size === 'small' ? 'text-xs' : 'text-sm',
            isRevealed ? 'opacity-100' : 'opacity-50'
          )}>
            {positionLabel}
          </div>
        )}
      </div>
    )
  }

  // ========== 渲染：靜態 Link 模式 ==========
  return (
    <Link
      ref={tiltRef}
      href={`/cards/${routeSuit}/${card.id}`}
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
        isClickable
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
              <PixelIcon
                name="image"
                size={32}
                className="text-pip-boy-green/50"
                decorative
              />
            </div>
          )}

          {/* 載入中旋轉圖示（中央） */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <PixelIcon
                name="loader"
                animation="spin"
                variant="primary"
                sizePreset="lg"
                decorative
              />
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
            onLoadingComplete={handleImageLoadingComplete}
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
          <h4 className="text-sm md:text-base font-semibold text-pip-boy-green uppercase tracking-wide line-clamp-2 group-hover:text-pip-boy-green-bright transition-colors">
            {card.name}
          </h4>

          {/* 花色與編號 */}
          <div className="flex items-center justify-between text-xs text-pip-boy-green/70">
            <span>{suitName}</span>
            {card.number !== null && card.number !== undefined && (
              <span className="font-semibold">#{String(card.number).padStart(2, '0')}</span>
            )}
          </div>
        </div>

        {/* 懸停邊框效果 */}
        <div
          className="absolute inset-0 border-2 border-transparent group-hover:border-pip-boy-green/50 rounded-sm pointer-events-none transition-colors duration-300"
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
          <PixelIcon
            name="image"
            size={32}
            className="text-pip-boy-green/30"
            decorative
          />
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

  // 將 API 枚舉值轉換為簡短路由名稱（SEO 友善）
  const routeSuit = convertApiToRouteSuit(card.suit as SuitType)

  return (
    <Link
      href={`/cards/${routeSuit}/${card.id}`}
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
        <h5 className="text-sm font-semibold text-pip-boy-green truncate">{card.name}</h5>
        <p className="text-xs text-pip-boy-green/60">
          {suitName} {card.number ? `#${String(card.number).padStart(2, '0')}` : ''}
        </p>
      </div>
    </Link>
  )
}
