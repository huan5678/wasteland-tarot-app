/**
 * CardThumbnailFlippable Component
 * 可翻牌的卡片縮圖元件
 *
 * 結合 CardThumbnail 的視覺樣式和 TarotCard 的翻牌動畫
 * 用於抽牌情境：點擊卡背翻牌，點擊卡面打開詳情 Modal
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { PipBoyCard } from '@/components/ui/pipboy'
import { PixelIcon } from '@/components/ui/icons/PixelIcon'
import type { TarotCard } from '@/types/api'
import { getCardImageUrl, getCardImageAlt, getFallbackImageUrl } from '@/lib/utils/cardImages'
import { getSuitDisplayName } from '@/types/suits'
import { use3DTilt } from '@/hooks/tilt/use3DTilt'
import { TiltVisualEffects } from '@/components/tilt/TiltVisualEffects'
import { CardBackPixelEffect } from '@/components/cards/CardBackPixelEffect'
import { useAudioEffect } from '@/hooks/audio/useAudioEffect'

export interface CardThumbnailFlippableProps {
  /**
   * 卡牌資料
   */
  card: TarotCard

  /**
   * 是否已翻開
   */
  isRevealed: boolean

  /**
   * 卡牌正逆位
   */
  position: 'upright' | 'reversed'

  /**
   * 卡片尺寸
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * 自定義類別
   */
  className?: string

  /**
   * 是否優先載入(用於首屏卡牌)
   */
  priority?: boolean

  /**
   * 點擊已翻開的卡片時的回調（打開 Modal）
   */
  onClick?: (card: TarotCard) => void

  /**
   * 翻牌動畫完成的回調
   */
  onFlipComplete?: () => void

  /**
   * 卡背圖片 URL
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

  /**
   * 動畫延遲（ms）
   */
  animationDelay?: number

  /**
   * 位置標籤（如：「過去」、「現在」、「未來」）
   */
  positionLabel?: string
}

const sizeClasses = {
  small: 'w-32 h-48',   // 128×192px (2:3)
  medium: 'w-40 h-60',  // 160×240px (2:3)
  large: 'w-48 h-72'    // 192×288px (2:3)
}

/**
 * CardThumbnailFlippable 元件
 *
 * @example
 * ```tsx
 * <CardThumbnailFlippable
 *   card={card}
 *   isRevealed={false}
 *   position="upright"
 *   onClick={(card) => setSelectedCard(card)}
 * />
 * ```
 */
export function CardThumbnailFlippable({
  card,
  isRevealed,
  position,
  size = 'medium',
  className,
  priority = false,
  onClick,
  onFlipComplete,
  cardBackUrl = '/assets/cards/card-backs/01.png',
  enable3DTilt = true,
  tiltMaxAngle = 15,
  tiltTransitionDuration = 400,
  enableGyroscope = true,
  enableGloss = true,
  animationDelay = 0,
  positionLabel
}: CardThumbnailFlippableProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [previousRevealed, setPreviousRevealed] = useState(isRevealed)
  const { playSound } = useAudioEffect()

  // 3D 傾斜效果（翻牌時暫時停用以避免衝突）
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
    size,
    loading: !imageLoaded
  })

  // 處理翻牌動畫
  useEffect(() => {
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
  }, [isRevealed, previousRevealed, playSound, onFlipComplete])

  // 取得圖片路徑
  const imageUrl = imageError ? getFallbackImageUrl() : getCardImageUrl(card)
  const imageAlt = getCardImageAlt(card)

  // 取得花色顯示名稱
  const suitName = getSuitDisplayName(card.suit)

  // 處理圖片載入錯誤
  const handleImageError = useCallback(() => {
    console.warn(`[CardThumbnailFlippable] Image load failed for card: ${card.id}`)
    setImageError(true)
  }, [card.id])

  // 處理圖片載入成功
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // 處理點擊事件
  const handleClick = useCallback(() => {
    if (isRevealed && onClick) {
      onClick(card)
    }
  }, [isRevealed, onClick, card])

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
              interactive={false}
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
              interactive={!!onClick}
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
                  onLoad={handleImageLoad}
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
                  className="absolute inset-0 border-2 border-transparent group-hover:border-pip-boy-green/50 pointer-events-none transition-colors duration-300"
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
