'use client'

/**
 * Carousel Container Component
 *
 * Framer Motion 自訂 Carousel，支援：
 * - 觸控滑動手勢 + 3D 透視旋轉效果
 * - 鍵盤方向鍵導航
 * - 左右箭頭按鈕
 * - 位置指示器
 * - 響應式設計
 * - 無障礙支援
 * - 速度感應切換
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DetailedTarotCard } from '@/components/tarot/CardDetailModal'
import { useAudioEffect } from '@/hooks/audio/useAudioEffect'

export interface CarouselContainerProps {
  cards: DetailedTarotCard[]
  selectedCardId: string | null
  activeIndex: number
  onIndexChange: (index: number) => void
  onCardFlip: (cardId: string) => void
  onCardClick: (card: DetailedTarotCard) => void
  isDisabled?: boolean
  children: (card: DetailedTarotCard, index: number, isActive: boolean) => React.ReactNode
}

// Carousel 動畫常數（從 Carousel.tsx 移植）
const DRAG_BUFFER = 0
const VELOCITY_THRESHOLD = 500
const GAP = 16
const SPRING_OPTIONS = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function CarouselContainer({
  cards,
  selectedCardId,
  activeIndex,
  onIndexChange,
  onCardFlip,
  onCardClick,
  isDisabled = false,
  children,
}: CarouselContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { playSound } = useAudioEffect()

  // Motion values for smooth drag animation
  const x = useMotionValue(0)

  // 計算寬度（模仿 Carousel.tsx 的邏輯）
  const containerPadding = 32 // 外層容器 padding
  const baseWidth = 384 // 外層容器總寬度
  const cardWidth = baseWidth - containerPadding * 2 // 卡片實際寬度 = 320px
  const trackItemOffset = cardWidth + GAP

  /**
   * 導航至下一張卡牌
   */
  const goToNext = useCallback(() => {
    if (activeIndex < cards.length - 1) {
      // 播放切換音效
      playSound('ui-hover', { volume: 0.3 })
      onIndexChange(activeIndex + 1)
    }
  }, [activeIndex, cards.length, onIndexChange, playSound])

  /**
   * 導航至上一張卡牌
   */
  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      // 播放切換音效
      playSound('ui-hover', { volume: 0.3 })
      onIndexChange(activeIndex - 1)
    }
  }, [activeIndex, onIndexChange, playSound])

  /**
   * 導航至指定索引
   */
  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < cards.length) {
        onIndexChange(index)
      }
    },
    [cards.length, onIndexChange]
  )

  /**
   * 鍵盤導航支援
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDisabled) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrevious, isDisabled])

  /**
   * 處理拖曳結束（使用速度感應切換，移植自 Carousel.tsx）
   */
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x
      const velocity = info.velocity.x

      // 使用速度或偏移量判斷切換方向
      if (offset < -DRAG_BUFFER || velocity < -VELOCITY_THRESHOLD) {
        goToNext()
      } else if (offset > DRAG_BUFFER || velocity > VELOCITY_THRESHOLD) {
        goToPrevious()
      }
    },
    [goToNext, goToPrevious]
  )

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      role="region"
      aria-label="卡牌選擇輪播"
      aria-roledescription="carousel"
    >
      {/* 卡片區域容器 */}
      <div className="relative flex justify-center">
        {/* Carousel 主容器 - 完全模仿 Carousel.tsx 的結構 */}
        <div
          className="relative overflow-hidden py-8"
          style={{
            width: `${baseWidth}px`,
            padding: `${containerPadding}px`
          }}
        >
          <motion.div
            className="flex cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{
              left: -(trackItemOffset * (cards.length - 1)),
              right: 0
            }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            animate={{ x: -(activeIndex * trackItemOffset) }}
            transition={SPRING_OPTIONS}
            style={{
              width: cardWidth,
              gap: `${GAP}px`,
              perspective: 1000,
              perspectiveOrigin: `${activeIndex * trackItemOffset + cardWidth / 2}px 50%`,
              x
            }}
          >
            {/* 卡牌陣列 - 橫向排列 with 3D rotation */}
            {cards.map((card, index) => {
              // 計算 3D 旋轉效果（完全照搬 Carousel.tsx）
              const range = [
                -(index + 1) * trackItemOffset,
                -index * trackItemOffset,
                -(index - 1) * trackItemOffset
              ]
              const outputRange = [90, 0, -90]
              const rotateY = useTransform(x, range, outputRange, { clamp: false })

              const isActive = index === activeIndex

              return (
                <motion.div
                  key={card.id}
                  className="shrink-0 flex items-center justify-center min-h-[400px]"
                  style={{
                    width: cardWidth,
                    rotateY: rotateY,
                  }}
                  transition={SPRING_OPTIONS}
                >
                  {children(card, index, isActive)}
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* 左箭頭按鈕 with Enhanced Accessibility */}
        <button
          onClick={goToPrevious}
          disabled={activeIndex === 0 || isDisabled}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border-2 border-pip-boy-green bg-black/80 text-pip-boy-green disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pip-boy-green hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-black z-10"
          aria-label="上一張卡牌"
          aria-disabled={activeIndex === 0 || isDisabled}
        >
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>

        {/* 右箭頭按鈕 with Enhanced Accessibility */}
        <button
          onClick={goToNext}
          disabled={activeIndex === cards.length - 1 || isDisabled}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border-2 border-pip-boy-green bg-black/80 text-pip-boy-green disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pip-boy-green hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-black z-10"
          aria-label="下一張卡牌"
          aria-disabled={activeIndex === cards.length - 1 || isDisabled}
        >
          <ChevronRight className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      {/* 位置指示器 with Enhanced Accessibility - 移到最外層 */}
      <div className="flex justify-center items-center gap-4 mt-4">
        {/* 數字指示器 */}
        <div
          className="font-mono text-pip-boy-green text-sm"
          aria-live="polite"
          aria-atomic="true"
          data-testid="position-indicator"
          role="status"
        >
          <span className="sr-only">當前卡牌: </span>
          {activeIndex + 1} / {cards.length}
        </div>

        {/* 點狀指示器 */}
        <div className="flex gap-2" role="tablist" aria-label="卡牌選擇指示器">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls={`card-panel-${index}`}
              tabIndex={index === activeIndex ? 0 : -1}
              className={`w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-black ${
                index === activeIndex
                  ? 'bg-pip-boy-green w-6'
                  : 'bg-pip-boy-green/30 hover:bg-pip-boy-green/50'
              }`}
              aria-label={`第 ${index + 1} 張卡牌${index === activeIndex ? ' (當前)' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 鍵盤提示 with Screen Reader Support */}
      <div className="text-center mt-4">
        <p className="text-xs text-pip-boy-green/60 font-mono" role="note">
          使用方向鍵 ← → 或滑動切換卡牌
        </p>
      </div>

      {/* Screen Reader Only Instructions */}
      <div className="sr-only" aria-live="polite">
        {selectedCardId
          ? `已選擇卡牌。點擊卡牌以查看詳細解讀，或使用重新抽卡按鈕選擇新卡牌。`
          : `使用左右方向鍵或點擊箭頭按鈕瀏覽卡牌，點擊卡背以翻牌。`
        }
      </div>
    </div>
  )
}
