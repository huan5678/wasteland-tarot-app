/**
 * TarotCard Component - Interactive Tarot Card with Flip Animation
 * Supports different sizes, positions, and reveal states
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { useTouchInteractions, useDeviceCapabilities } from '@/hooks/useTouchInteractions'
import { CardStateIndicators, CardProgressIndicator, CardLoadingShimmer, type CardState } from '@/components/common/CardStateIndicators'
import { useAudioEffect } from '@/hooks/audio/useAudioEffect'
import { use3DTilt } from '@/hooks/tilt/use3DTilt'
import { TiltVisualEffects } from '@/components/tilt/TiltVisualEffects'
import { CardBackPixelEffect } from '@/components/cards/CardBackPixelEffect'

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

interface TarotCardProps {
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

const sizeClasses = {
  small: 'w-24 h-36',
  medium: 'w-32 h-48',
  large: 'w-48 h-72'
}

export function TarotCard({
  card,
  isRevealed,
  position,
  size = 'medium',
  loading = false,
  showKeywords = false,
  onClick,
  flipStyle = 'default',
  isSelectable = false,
  isSelected = false,
  animationDelay = 0,
  showGlow = false,
  enableHaptic = true,
  cardIndex = 0,
  totalCards = 1,
  showProgress = false,
  onLongPress,
  onSwipe,
  cardBackUrl = '/assets/cards/card-backs/01.png',
  enable3DTilt = true,
  tiltMaxAngle = 15,
  tiltTransitionDuration = 400,
  enableGyroscope = true,
  enableGloss = true
}: TarotCardProps) {
  const [isFlipping, setIsFlipping] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [previousRevealed, setPreviousRevealed] = useState(isRevealed)
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [cardState, setCardState] = useState<CardState>('idle')
  const cardRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { isTouchDevice, prefersReducedMotion } = useDeviceCapabilities()
  const { playSound } = useAudioEffect()

  // 3D 傾斜效果（當卡片翻轉時停用以避免衝突）
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
    size,
    isFlipping,
    loading
  })

  // Handle flip animation when isRevealed changes
  useEffect(() => {
    if (previousRevealed !== isRevealed) {
      console.log('[TarotCard] isRevealed changed:', {
        cardName: card.name,
        from: previousRevealed,
        to: isRevealed
      });

      setCardState('revealing')
      setIsFlipping(true)
      setIsAnimating(true)

      // 播放卡牌翻轉音效
      playSound('card-flip')

      const timer = setTimeout(() => {
        setIsFlipping(false)
        setIsAnimating(false)
        setCardState(isRevealed ? 'revealed' : 'idle')
      }, 600)

      setPreviousRevealed(isRevealed)

      return () => clearTimeout(timer)
    }
  }, [isRevealed, previousRevealed, card.name, playSound]) // card.name 用於 logging

  // Handle animation delay for sequential reveals
  useEffect(() => {
    if (animationDelay > 0) {
      setCardState('animating')
      setIsAnimating(true)
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
        setCardState('idle')
      }, animationDelay)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [animationDelay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Touch interaction handlers
  const { touchHandlers, mouseHandlers, triggerHaptic } = useTouchInteractions(
    {
      onTap: handleClick,
      onLongPress: onLongPress ? () => onLongPress(card) : undefined,
      onSwipe: onSwipe ? (direction, event) => {
        event.preventDefault()
        onSwipe(direction, card)
      } : undefined,
    },
    {
      enableHaptic,
      longPressDelay: 600,
      swipeThreshold: 50
    }
  )

  function handleClick() {
    if (onClick && (isRevealed || isSelectable)) {
      triggerHaptic('light')
      onClick(card)
    }
  }

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    setCardState(isSelected ? 'selected' : isSelectable ? 'selectable' : 'hovered')
    if ((isRevealed || isSelectable) && !isTouchDevice) {
      triggerHaptic('light')
      // 移除 hover 音效 - 只在按左右鍵切換時播放
    }
  }, [isRevealed, isSelectable, isSelected, isTouchDevice, triggerHaptic])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setCardState(isSelected ? 'selected' : isSelectable ? 'selectable' : 'idle')
  }, [isSelected, isSelectable])

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  // Enhanced loading skeleton with state indicators
  if (loading) {
    return (
      <div
        data-testid="card-skeleton"
        className={`${sizeClasses[size]} bg-gray-300 rounded-lg flex items-center justify-center relative`}
      >
        <CardLoadingShimmer />
        <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <CardStateIndicators state="loading" size={size === 'large' ? 'large' : 'medium'} />
        {showProgress && totalCards > 1 && (
          <CardProgressIndicator
            current={cardIndex + 1}
            total={totalCards}
            size={size === 'large' ? 'large' : 'medium'}
          />
        )}
      </div>
    )
  }

  if (flipStyle === 'kokonut') {
    return (
      <div
        ref={(el) => {
          // Merge refs: cardRef and tiltRef
          if (el) {
            cardRef.current = el
            if (tiltRef) {
              ;(tiltRef as React.MutableRefObject<HTMLDivElement | null>).current = el
            }
          }
        }}
        onClick={isTouchDevice ? undefined : handleClick}
        onMouseEnter={isTouchDevice ? undefined : (e) => {
          handleMouseEnter()
          tiltHandlers.onMouseEnter?.(e)
        }}
        onMouseMove={isTouchDevice ? undefined : tiltHandlers.onMouseMove}
        onMouseLeave={isTouchDevice ? undefined : (e) => {
          handleMouseLeave()
          tiltHandlers.onMouseLeave?.(e)
        }}
        {...(isTouchDevice ? touchHandlers : mouseHandlers)}
        className={`
          ${sizeClasses[size]} relative cursor-pointer
          ${isSelected ? 'animate-card-selection' : ''}
          ${showGlow ? 'animate-card-glow' : ''}
          ${isAnimating ? 'animate-card-draw' : ''}
        `}
        style={{
          ...tiltStyle,
          animationDelay: `${animationDelay}ms`,
          touchAction: 'manipulation'
        }}
      >
        {/* 3D Tilt Visual Effects */}
        {tiltState.isTilted && (
          <TiltVisualEffects
            tiltState={tiltState}
            enableGloss={enableGloss}
          />
        )}

        {/* State indicators */}
        <CardStateIndicators
          state={cardState}
          size={size === 'large' ? 'large' : 'medium'}
          animate={!prefersReducedMotion}
        />

        {/* Progress indicator */}
        {showProgress && totalCards > 1 && (
          <CardProgressIndicator
            current={cardIndex + 1}
            total={totalCards}
            size={size === 'large' ? 'large' : 'medium'}
          />
        )}

        {/* Loading shimmer */}
        {isAnimating && <CardLoadingShimmer />}
        <div className={`
          relative w-full h-full group
          ${isHovered ? 'animate-card-hover' : ''}
          transition-all duration-300 ease-out
        `}
        style={{ perspective: '1200px' }}>
          <div
            className={`
              relative w-full h-full
              ${isFlipping ? 'animate-card-flip' : 'transition-all duration-700'}
            `}
            style={{
              transformStyle: 'preserve-3d',
              transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}>
            {/* Back */}
            <div
              className={`
                absolute inset-0 w-full h-full rounded-lg
                border-2 ${isSelected ? 'border-pip-boy-green animate-pulse' : 'border-pip-boy-green/60'}
                flex items-center justify-center bg-black overflow-hidden
                ${isHovered && !isRevealed ? 'shadow-lg shadow-pip-boy-green/20' : ''}
                transition-all duration-300 relative
              `}
              style={{ backfaceVisibility: 'hidden' }}>
              <img
                src={cardBackUrl}
                alt="Wasteland Tarot Card Back"
                className="w-full h-full object-cover"
              />
              {/* Pixel hover effect for card back */}
              {!isRevealed && (
                <CardBackPixelEffect
                  isHovered={isHovered}
                  gap={size === 'small' ? 10 : size === 'medium' ? 8 : 6}
                  speed={35}
                />
              )}
            </div>
            {/* Front */}
            <div
              className={`
                absolute inset-0 w-full h-full rounded-lg
                border-2 ${isSelected ? 'border-pip-boy-green animate-pulse' : 'border-pip-boy-green/60'}
                bg-black overflow-hidden
                ${isHovered ? 'shadow-xl shadow-pip-boy-green/30' : ''}
                transition-all duration-300
              `}
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)'
              }}>
              {/* Enhanced indicators */}
              {(onClick || isSelectable) && (
                <div className={`
                  absolute top-1 right-1 flex items-center gap-1 z-10
                  ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}
                  transition-all duration-200
                `}>
                  <div className="w-2 h-2 bg-pip-boy-green/70 rounded-full animate-pulse"></div>
                  {isSelected && (
                    <PixelIcon name="zap" size={12} className="text-pip-boy-green animate-pulse" aria-hidden="true" />
                  )}
                </div>
              )}

              {/* Shimmer effect for special states */}
              {showGlow && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-pip-boy-green/10 to-transparent animate-card-shimmer z-10"></div>
              )}

              {/* Card Image - 絕對定位佔滿整個卡片 */}
              <div className="absolute inset-0 flex items-center justify-center p-1 bg-pip-boy-green/5 w-full h-full">
                {imageError ? (
                  <div className="text-pip-boy-green/60 text-xs">無圖</div>
                ) : (
                  <img src={card.image_url} alt={card.name} onError={handleImageError} className="object-contain max-h-full" />
                )}
              </div>

              {/* Card Info - 絕對定位在底部 */}
              <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-pip-boy-green/30 bg-wasteland-dark/60 z-10">
                <div className="text-center text-pip-boy-green text-[11px] font-bold leading-tight">{card.name}</div>
                <div className="text-center text-pip-boy-green/60 text-[10px] line-clamp-2 mt-0.5">{position === 'upright' ? card.meaning_upright : card.meaning_reversed}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={(el) => {
        // Merge refs: cardRef and tiltRef
        if (el) {
          cardRef.current = el
          if (tiltRef) {
            ;(tiltRef as React.MutableRefObject<HTMLDivElement | null>).current = el
          }
        }
      }}
      data-testid="tarot-card"
      className={`
        ${sizeClasses[size]} relative group cursor-pointer
        ${position === 'reversed' ? 'reversed rotate-180' : ''}
        ${isFlipping ? 'animate-card-flip' : ''}
        ${isHovered ? 'animate-card-hover' : ''}
        ${isSelected ? 'animate-card-selection' : ''}
        ${showGlow ? 'animate-card-glow' : ''}
        ${isAnimating ? 'animate-card-draw' : ''}
        transition-all duration-300 ease-out
      `}
      onClick={isTouchDevice ? undefined : handleClick}
      onMouseEnter={isTouchDevice ? undefined : (e) => {
        handleMouseEnter()
        tiltHandlers.onMouseEnter?.(e)
      }}
      onMouseMove={isTouchDevice ? undefined : tiltHandlers.onMouseMove}
      onMouseLeave={isTouchDevice ? undefined : (e) => {
        handleMouseLeave()
        tiltHandlers.onMouseLeave?.(e)
      }}
      {...(isTouchDevice ? touchHandlers : mouseHandlers)}
      style={{
        ...tiltStyle,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        animationDelay: `${animationDelay}ms`,
        touchAction: 'manipulation'
      }}
    >
      {/* 3D Tilt Visual Effects */}
      {tiltState.isTilted && (
        <TiltVisualEffects
          tiltState={tiltState}
          enableGloss={enableGloss}
        />
      )}

      {/* State indicators */}
      <CardStateIndicators
        state={cardState}
        size={size === 'large' ? 'large' : 'medium'}
        animate={!prefersReducedMotion}
      />

      {/* Progress indicator */}
      {showProgress && totalCards > 1 && (
        <CardProgressIndicator
          current={cardIndex + 1}
          total={totalCards}
          size={size === 'large' ? 'large' : 'medium'}
        />
      )}

      {/* Loading shimmer */}
      {isAnimating && <CardLoadingShimmer />}
      {/* Card Back */}
      {!isRevealed && (
        <div
          data-testid="card-back"
          className={`
            absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900
            rounded-lg border-2 ${isSelected ? 'border-gold-400 animate-pulse' : 'border-gold-400/70'}
            flex items-center justify-center
            ${isHovered ? 'shadow-lg shadow-gold-400/20' : ''}
            transition-all duration-300 relative overflow-hidden
          `}
          style={{
            backfaceVisibility: 'hidden',
            transform: isFlipping ? 'rotateY(-180deg)' : 'rotateY(0deg)',
            transition: isFlipping ? 'none' : 'transform 0.6s ease-out'
          }}
        >
          <div className="text-center text-gold-400 relative z-10">
            <PixelIcon name="sparkles" size={32} className="mb-2 mx-auto" aria-hidden="true" />
            <div className="text-xs">TAROT</div>
          </div>
          {/* Pixel hover effect for card back */}
          <CardBackPixelEffect
            isHovered={isHovered}
            colors="#fbbf24,#f59e0b,#d97706,#b45309" // Gold variants for default style
            gap={size === 'small' ? 10 : size === 'medium' ? 8 : 6}
            speed={35}
          />
        </div>
      )}

      {/* Card Front */}
      {isRevealed && (
        <div
          className={`
            absolute inset-0 w-full h-full bg-white rounded-lg
            border-2 ${isSelected ? 'border-gray-400 animate-pulse' : 'border-gray-300'}
            shadow-lg ${isHovered ? 'shadow-xl shadow-gray-400/30' : ''}
            overflow-hidden relative transition-all duration-300
          `}
          style={{
            backfaceVisibility: 'hidden',
            transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: isFlipping ? 'none' : 'transform 0.6s ease-out'
          }}
        >
          {/* Enhanced indicators */}
          {(onClick || isSelectable) && (
            <div className={`
              absolute top-1 right-1 flex items-center gap-1
              ${isHovered || isSelected ? 'opacity-100' : 'opacity-0'}
              transition-all duration-200
            `}>
              <div className="w-2 h-2 bg-blue-400/70 rounded-full animate-pulse"></div>
              {isSelected && (
                <PixelIcon name="zap" size={12} className="text-blue-400 animate-pulse" aria-hidden="true" />
              )}
            </div>
          )}

          {/* Shimmer effect */}
          {showGlow && (
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-card-shimmer"></div>
          )}
          {/* Card Image */}
          <div className="relative h-3/4">
            {imageError ? (
              <div
                data-testid="card-placeholder"
                className="w-full h-full bg-gray-200 flex items-center justify-center"
              >
                <div className="text-center text-gray-500">
                  <PixelIcon name="image" size={24} className="mb-2 mx-auto" aria-hidden="true" />
                  <div className="text-xs">圖片載入失敗</div>
                </div>
              </div>
            ) : (
              <img
                src={card.image_url}
                alt={`${card.name} 塔羅牌`}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            )}
          </div>

          {/* Card Info */}
          <div className="h-1/4 p-2 bg-white">
            <h3 className="font-bold text-sm text-center mb-1">{card.name}</h3>

            {/* Card Meaning */}
            <p className="text-xs text-gray-600 text-center line-clamp-2">
              {position === 'upright' ? card.meaning_upright : card.meaning_reversed}
            </p>

            {/* Keywords */}
            {showKeywords && card.keywords && (
              <div className="flex flex-wrap gap-1 mt-1">
                {card.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="text-xs bg-blue-100 text-blue-800 px-1 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced TarotCard component with improved interactions, animations, and accessibility
// Uses Tailwind animations defined in globals.css for better performance