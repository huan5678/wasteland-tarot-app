'use client'

/**
 * Carousel Container Component
 *
 * Framer Motion 自訂 Carousel，支援：
 * - 觸控滑動手勢
 * - 鍵盤方向鍵導航
 * - 左右箭頭按鈕
 * - 位置指示器
 * - 響應式設計
 * - 無障礙支援
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DetailedTarotCard } from '@/components/tarot/CardDetailModal'

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
  const [dragOffset, setDragOffset] = useState(0)

  /**
   * 導航至下一張卡牌
   */
  const goToNext = useCallback(() => {
    if (activeIndex < cards.length - 1) {
      onIndexChange(activeIndex + 1)
    }
  }, [activeIndex, cards.length, onIndexChange])

  /**
   * 導航至上一張卡牌
   */
  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      onIndexChange(activeIndex - 1)
    }
  }, [activeIndex, onIndexChange])

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
   * 處理拖曳結束
   */
  const handleDragEnd = useCallback(
    (event: any, info: any) => {
      const threshold = 50 // 拖曳閾值

      if (Math.abs(info.offset.x) > threshold) {
        if (info.offset.x > 0) {
          goToPrevious()
        } else {
          goToNext()
        }
      }

      setDragOffset(0)
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
      {/* Carousel 主容器 */}
      <div className="relative overflow-hidden py-8">
        <motion.div
          className="flex items-center justify-center gap-4"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          animate={{ x: dragOffset }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* 卡牌容器 */}
          <div className="flex items-center justify-center min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center"
              >
                {children(cards[activeIndex], activeIndex, true)}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* 左箭頭按鈕 with Enhanced Accessibility */}
        <button
          onClick={goToPrevious}
          disabled={activeIndex === 0 || isDisabled}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border-2 border-pip-boy-green bg-black/80 text-pip-boy-green disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pip-boy-green hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-black"
          aria-label="上一張卡牌"
          aria-disabled={activeIndex === 0 || isDisabled}
        >
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </button>

        {/* 右箭頭按鈕 with Enhanced Accessibility */}
        <button
          onClick={goToNext}
          disabled={activeIndex === cards.length - 1 || isDisabled}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center border-2 border-pip-boy-green bg-black/80 text-pip-boy-green disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pip-boy-green hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-black"
          aria-label="下一張卡牌"
          aria-disabled={activeIndex === cards.length - 1 || isDisabled}
        >
          <ChevronRight className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      {/* 位置指示器 with Enhanced Accessibility */}
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
