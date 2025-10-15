/**
 * CardDraw Component - Interactive Card Drawing Interface
 * Supports different spread types and drawing animations
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { CardThumbnailFlippable } from '@/components/cards/CardThumbnailFlippable'
import { CardDetailModal, DetailedTarotCard } from './CardDetailModal'
import { mockTarotCards } from '@/test/mocks/data'
import { enhanceCardWithWastelandData } from '@/data/enhancedCards'
import { PixelIcon } from '@/components/ui/icons'
import { useDailyCardBackContext } from '@/components/providers/DailyCardBackProvider'
import { getLayout } from '@/lib/spreadLayouts'
import { useSpreadTemplatesStore } from '@/lib/spreadTemplatesStore'

interface TarotCardWithPosition {
  id: number
  name: string
  suit: string
  number?: number
  meaning_upright: string
  meaning_reversed: string
  image_url: string
  keywords: string[]
  position: 'upright' | 'reversed'
}

interface CardDrawProps {
  spreadType: string
  positionsMeta?: { id: string; label: string }[]
  onCardsDrawn: (cards: TarotCardWithPosition[]) => void
  onDrawingStateChange?: (isDrawing: boolean) => void
  isLoading?: boolean
  enablePositionSelection?: boolean
  enableRedraw?: boolean
  animationDuration?: number
}

export function CardDraw({
  spreadType,
  onCardsDrawn,
  onDrawingStateChange,
  positionsMeta,
  isLoading = false,
  enablePositionSelection = false,
  enableRedraw = false,
  animationDuration = 1000
}: CardDrawProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawnCards, setDrawnCards] = useState<TarotCardWithPosition[]>([])
  const [selectedPositions, setSelectedPositions] = useState<number[]>([])
  const [revealCount, setRevealCount] = useState(0)
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set()) // 記錄哪些卡片已翻開
  const [manualRevealMode, setManualRevealMode] = useState(true) // 預設為手動翻卡模式
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<DetailedTarotCard | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileCardIndex, setMobileCardIndex] = useState(0)

  // 取得每日隨機卡背
  const { cardBackPath } = useDailyCardBackContext()

  // 取得 spread templates
  const templates = useSpreadTemplatesStore(s => s.templates)

  // 響應式偵測
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 手動模式：當所有卡片都翻完後，自動進入 Step 3
  useEffect(() => {
    if (manualRevealMode && drawnCards.length > 0 && revealedCards.size === drawnCards.length) {
      // 延遲 500ms 讓使用者看到「全部翻開完成」的訊息
      const timer = setTimeout(() => {
        onCardsDrawn(drawnCards)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [manualRevealMode, drawnCards, revealedCards, onCardsDrawn])

  // 自動模式：當切換到自動模式且有未翻開的卡片時，開始自動翻牌
  useEffect(() => {
    if (!manualRevealMode && drawnCards.length > 0 && revealedCards.size < drawnCards.length) {
      const interval = setInterval(() => {
        setRevealedCards(prev => {
          const newRevealed = new Set(prev)
          // 找到下一張未翻開的卡片
          for (let i = 0; i < drawnCards.length; i++) {
            if (!newRevealed.has(i)) {
              newRevealed.add(i)
              // 同步更新 revealCount 用於顯示進度
              setRevealCount(newRevealed.size)
              break
            }
          }

          // 全部翻完後自動進入 Step 3
          if (newRevealed.size >= drawnCards.length) {
            clearInterval(interval)
            setTimeout(() => onCardsDrawn(drawnCards), 500)
          }

          return newRevealed
        })
      }, Math.max(250, animationDuration / (drawnCards.length * 2)))

      return () => clearInterval(interval)
    }
  }, [manualRevealMode, drawnCards, revealedCards.size, animationDuration, onCardsDrawn])

  const getCardCount = () => {
    // 優先使用 positionsMeta 的長度（從 layout 傳來的實際位置數量）
    if (positionsMeta && positionsMeta.length > 0) {
      return positionsMeta.length
    }

    // Fallback: 根據 spread type 返回預設數量
    if (spreadType === 'single' || spreadType === 'single_wasteland' || spreadType === 'single_wasteland_reading') return 1
    if (spreadType === 'three_card' || spreadType === 'vault_tec_spread') return 3
    if (spreadType === 'wasteland_survival' || spreadType === 'wasteland_survival_spread') return 5
    if (spreadType === 'raider_chaos' || spreadType === 'raider_chaos_spread' || spreadType === 'custom_spread') return 4
    if (spreadType === 'ncr_strategic' || spreadType === 'ncr_strategic_spread') return 6
    if (spreadType === 'brotherhood_council' || spreadType === 'brotherhood_council_spread') return 7
    if (spreadType === 'celtic_cross') return 10
    if (spreadType === 'horseshoe') return 7

    // 最後的 fallback
    return 1
  }

  const shuffleCards = (cards: any[]): any[] => {
    const shuffled = [...cards]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const drawCards = useCallback(async () => {
    if (isLoading || isDrawing) return

    setIsDrawing(true)
    onDrawingStateChange?.(true)
    setError(null)

    try {
      // Simulate drawing animation delay
      await new Promise(resolve => setTimeout(resolve, animationDuration / 2))

      const shuffledDeck = shuffleCards(mockTarotCards)
      const cardCount = getCardCount()
      const selectedCards = shuffledDeck.slice(0, cardCount)

      // Add position (upright/reversed) and meta label
      const cardsWithPositions: TarotCardWithPosition[] = selectedCards.map((card, idx) => ({
        ...card,
        position: Math.random() > 0.5 ? 'upright' : 'reversed',
        _position_meta: positionsMeta?.[idx]?.label || `位置 ${idx+1}`
      }) as any)

      setDrawnCards(cardsWithPositions)
      setRevealCount(0)
      setRevealedCards(new Set()) // 重置已翻開的卡片
      if (!manualRevealMode) {
        const interval = setInterval(()=> {
          setRevealCount(rc => {
            if (rc + 1 >= cardsWithPositions.length) {
              clearInterval(interval)
              // 自動模式：全部翻完後自動進入 Step 3
              setTimeout(() => onCardsDrawn(cardsWithPositions), 500)
              return cardsWithPositions.length
            }
            return rc + 1
          })
        }, Math.max(250, animationDuration / (cardsWithPositions.length * 2)))
      }
      // 手動模式：不自動呼叫 onCardsDrawn，等待使用者全部翻完

      // Complete drawing animation
      await new Promise(resolve => setTimeout(resolve, animationDuration / 2))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '抽牌失敗'
      setError(errorMessage)
      console.error('Card drawing error:', err)
    } finally {
      setIsDrawing(false)
      onDrawingStateChange?.(false)
    }
  }, [spreadType, onCardsDrawn, onDrawingStateChange, isLoading, isDrawing, animationDuration, manualRevealMode])

  const handlePositionClick = (positionIndex: number) => {
    if (isLoading || selectedPositions.includes(positionIndex)) return

    setSelectedPositions(prev => [...prev, positionIndex])

    // Draw single card for this position
    const shuffledDeck = shuffleCards(mockTarotCards)
    const card = shuffledDeck[0]
    const cardWithPosition: TarotCardWithPosition = {
      ...card,
      position: Math.random() > 0.5 ? 'upright' : 'reversed'
    }

    setDrawnCards(prev => {
      const newCards = [...prev]
      newCards[positionIndex] = cardWithPosition
      return newCards
    })

    // If all positions filled, call onCardsDrawn
    if (selectedPositions.length + 1 === getCardCount()) {
      const finalCards = [...drawnCards]
      finalCards[positionIndex] = cardWithPosition
      onCardsDrawn(finalCards)
    }
  }

  const handleRedraw = () => {
    setDrawnCards([])
    setSelectedPositions([])
    setError(null)
    drawCards()
  }

  const handleCardClick = (card: any) => {
    // Use enhanced card data for rich modal display
    const detailedCard = enhanceCardWithWastelandData(card)
    setSelectedCard(detailedCard)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCard(null)
  }

  const renderPositionSelectors = () => {
    const positions = Array.from({ length: getCardCount() }, (_, index) => (
      <div
        key={index}
        data-testid={`position-${index}`}
        className={`
          w-40 h-60 border-2 border-dashed border-pip-boy-green/40 rounded-lg
          flex items-center justify-center cursor-pointer
          transition-all duration-300 hover:border-pip-boy-green
          ${selectedPositions.includes(index) ? 'border-pip-boy-green bg-pip-boy-green/10' : ''}
        `}
        onClick={() => handlePositionClick(index)}
        aria-disabled={selectedPositions.includes(index)}
      >
        {drawnCards[index] ? (
          <CardThumbnailFlippable
            card={drawnCards[index]}
            isRevealed={true}
            position={drawnCards[index].position}
            size="medium"
            onClick={handleCardClick}
            cardBackUrl={cardBackPath}
          />
        ) : (
          <div className="text-pip-boy-green text-sm text-center">
            <div>位置 {index + 1}</div>
            <div>點擊抽牌</div>
          </div>
        )}
      </div>
    ))

    return (
      <div className="flex gap-4 justify-center mt-6">
        {positions}
      </div>
    )
  }

  const renderDrawnCards = () => {
    if (drawnCards.length === 0) return null

    // Get layout for current spread
    const template = templates.find(t => t.name === spreadType)
    const layout = getLayout(spreadType, template)

    // Calculate stagger delay for sequential animations
    const getAnimationDelay = (index: number) => {
      return index * 150 // 150ms stagger
    }

    // Mobile: Carousel 模式
    if (isMobile) {
      return (
        <div className="space-y-6">
          {/* Carousel Container */}
          <div className="relative w-full">
            <div className="overflow-hidden py-8">
              <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${mobileCardIndex * 100}%)` }}>
                {drawnCards.map((card, index) => {
                  const revealed = revealedCards.has(index)
                  const animationDelay = getAnimationDelay(index)

                  return (
                    <div
                      key={`${card.id}-${index}`}
                      className="w-full flex-shrink-0 flex flex-col items-center justify-center px-4"
                      onClick={() => {
                        if (!revealed && manualRevealMode) {
                          setRevealedCards(prev => {
                            const newRevealed = new Set(prev)
                            newRevealed.add(index)
                            setRevealCount(newRevealed.size)
                            return newRevealed
                          })
                        }
                      }}
                    >
                      <CardThumbnailFlippable
                        card={card}
                        isRevealed={revealed}
                        position={card.position}
                        size="large"
                        onClick={undefined}  // Disable modal in Step 2 - only allow in Step 3
                        cardBackUrl={cardBackPath}
                        animationDelay={animationDelay}
                        positionLabel={(card as any)._position_meta || `位置 ${index+1}`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setMobileCardIndex(Math.max(0, mobileCardIndex - 1))}
              disabled={mobileCardIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border-2 border-pip-boy-green bg-black/80 text-pip-boy-green disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pip-boy-green hover:text-black transition-colors"
            >
              <PixelIcon name="chevron-left" size={20} decorative />
            </button>
            <button
              onClick={() => setMobileCardIndex(Math.min(drawnCards.length - 1, mobileCardIndex + 1))}
              disabled={mobileCardIndex === drawnCards.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border-2 border-pip-boy-green bg-black/80 text-pip-boy-green disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pip-boy-green hover:text-black transition-colors"
            >
              <PixelIcon name="chevron-right" size={20} decorative />
            </button>

            {/* Position Indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {drawnCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setMobileCardIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === mobileCardIndex ? 'bg-pip-boy-green w-6' : 'bg-pip-boy-green/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Enhanced control panel */}
          <div className="flex items-center justify-center gap-4 p-4 bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg">
          <button
            onClick={()=> setManualRevealMode(m=>!m)}
            className={`
              px-4 py-2 text-sm border border-pip-boy-green/50
              text-pip-boy-green hover:bg-pip-boy-green/10 hover:border-pip-boy-green/70
              transition-all duration-200 rounded focus:outline-none focus:ring-2 focus:ring-pip-boy-green/30
              ${manualRevealMode ? 'bg-pip-boy-green/10' : ''}
            `}
          >
            {manualRevealMode ? '切換至自動模式' : '切換至手動模式'}
          </button>

          {manualRevealMode && revealedCards.size < drawnCards.length && drawnCards.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-pip-boy-green/70">
              <PixelIcon name="info" className="w-4 h-4" decorative />
              <span>點擊卡背翻牌 ({revealedCards.size}/{drawnCards.length})</span>
            </div>
          )}

          {revealedCards.size === drawnCards.length && drawnCards.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-pip-boy-green animate-pulse">
              <PixelIcon name="star" className="w-4 h-4" decorative />
              <span>全部翻開完成</span>
            </div>
          )}
        </div>
        </div>
      )
    }

    // Desktop: Layout 模式（類似 SpreadLayoutPreview）
    const cardCount = drawnCards.length

    // Dynamic sizing based on card count (matching SpreadLayoutPreview logic)
    const getCardSize = (): 'small' | 'medium' | 'large' => {
      if (cardCount <= 3) return 'medium'  // 160×240px for 1-3 cards
      if (cardCount <= 5) return 'small'   // 128×192px for 4-5 cards
      return 'small'                        // 128×192px for 6+ cards
    }

    // Calculate total element size (card + label + gap)
    // CardThumbnailFlippable structure: card + gap-3 (12px) + label (~16px text-xs)
    const getElementDimensions = () => {
      const cardSize = getCardSize()
      const dimensions = {
        small: { cardW: 128, cardH: 192, labelH: 16, gap: 12 },   // w-32 h-48
        medium: { cardW: 160, cardH: 240, labelH: 18, gap: 12 },  // w-40 h-60
        large: { cardW: 192, cardH: 288, labelH: 20, gap: 12 }    // w-48 h-72
      }
      const d = dimensions[cardSize]
      return {
        width: d.cardW,
        height: d.cardH + d.gap + d.labelH,  // Total height including label
        cardHeight: d.cardH
      }
    }

    const getContainerHeight = () => {
      // Account for full element height (card + gap + label)
      // Small card: 192 + 12 + 16 = 220px total
      // Medium card: 240 + 12 + 18 = 270px total
      // Container should be ~3x this to prevent overlap

      if (cardCount <= 3) return 'h-[750px]'  // Medium cards need more space
      if (cardCount <= 5) return 'h-[650px]'  // Small cards with 5 positions
      return 'h-[700px]'                      // Small cards with 6-7 positions (increased)
    }

    return (
      <div className="w-full space-y-6">
        {/* Spread Layout Container */}
        <div className={`w-full ${getContainerHeight()} relative mx-auto max-w-7xl`}>
          {drawnCards.map((card, index) => {
            const revealed = revealedCards.has(index)
            const layoutPos = layout[index]
            if (!layoutPos) return null

            const animationDelay = getAnimationDelay(index)
            const cardSize = getCardSize()

            return (
              <div
                key={`${card.id}-${index}`}
                data-testid={`drawn-card-${index}`}
                className={`
                  absolute
                  ${revealed ? 'opacity-100' : 'opacity-30 cursor-pointer'}
                `}
                style={{
                  left: `${layoutPos.x * 100}%`,
                  top: `${layoutPos.y * 100}%`,
                  transform: `translate(-50%, -50%)`,
                  transition: 'opacity 0.3s ease-out',
                }}
                onClick={() => {
                  if (!revealed && manualRevealMode) {
                    setRevealedCards(prev => {
                      const newRevealed = new Set(prev)
                      newRevealed.add(index)
                      setRevealCount(newRevealed.size)
                      return newRevealed
                    })
                  }
                }}
              >
                <CardThumbnailFlippable
                  card={card}
                  isRevealed={revealed}
                  position={card.position}
                  size={cardSize}
                  onClick={undefined}  // Disable modal in Step 2 - only allow in Step 3
                  cardBackUrl={cardBackPath}
                  animationDelay={animationDelay}
                  positionLabel={(card as any)._position_meta || `位置 ${index+1}`}
                />
              </div>
            )
          })}
        </div>

        {/* Enhanced control panel */}
        <div className="flex items-center justify-center gap-4 p-4 bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg">
          <button
            onClick={()=> setManualRevealMode(m=>!m)}
            className={`
              px-4 py-2 text-sm border border-pip-boy-green/50
              text-pip-boy-green hover:bg-pip-boy-green/10 hover:border-pip-boy-green/70
              transition-all duration-200 rounded focus:outline-none focus:ring-2 focus:ring-pip-boy-green/30
              ${manualRevealMode ? 'bg-pip-boy-green/10' : ''}
            `}
          >
            {manualRevealMode ? '切換至自動模式' : '切換至手動模式'}
          </button>

          {manualRevealMode && revealedCards.size < drawnCards.length && drawnCards.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-pip-boy-green/70">
              <PixelIcon name="info" className="w-4 h-4" decorative />
              <span>點擊卡背翻牌 ({revealedCards.size}/{drawnCards.length})</span>
            </div>
          )}

          {revealedCards.size === drawnCards.length && drawnCards.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-pip-boy-green animate-pulse">
              <PixelIcon name="star" className="w-4 h-4" decorative />
              <span>全部翻開完成</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center p-6">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 border border-red-400 bg-red-900/20 text-red-400 rounded flex items-center gap-2">
          <PixelIcon name="alert-triangle" className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Draw Button */}
      {!enablePositionSelection && drawnCards.length === 0 && (
        <button
          data-testid="card-deck"
          onClick={drawCards}
          disabled={isLoading || isDrawing}
          className={`
            w-full max-w-md mx-auto py-4 px-6
            bg-pip-boy-green text-wasteland-dark font-bold text-lg
            border-2 border-pip-boy-green
            hover:bg-pip-boy-green/90 hover:shadow-lg hover:shadow-pip-boy-green/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
            flex items-center justify-center gap-3
            focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50
          `}
        >
          <PixelIcon
            name="sparkles"
            size={24}
            className={isDrawing ? 'animate-spin' : ''}
            decorative
          />
          <span>{isDrawing ? '抽牌中...' : `開始抽牌（${getCardCount()} 張）`}</span>
        </button>
      )}

      {/* Position Selection Mode */}
      {enablePositionSelection && renderPositionSelectors()}

      {/* Regular Card Display Mode */}
      {!enablePositionSelection && renderDrawnCards()}

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

// Enhanced CardDraw component with improved animations and positioning
// Uses optimized Tailwind animations for better performance and accessibility