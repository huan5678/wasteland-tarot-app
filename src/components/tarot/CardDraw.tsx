/**
 * CardDraw Component - Interactive Card Drawing Interface
 * Supports different spread types and drawing animations
 */

'use client'

import React, { useState, useCallback } from 'react'
import { TarotCard } from './TarotCard'
import { CardDetailModal, DetailedTarotCard } from './CardDetailModal'
import { mockTarotCards } from '@/test/mocks/data'
import { enhanceCardWithWastelandData } from '@/data/enhancedCards'
import { AlertTriangle, Star } from 'lucide-react'

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
  isLoading?: boolean
  enablePositionSelection?: boolean
  enableRedraw?: boolean
  animationDuration?: number
}

export function CardDraw({
  spreadType,
  onCardsDrawn,
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
  const [manualRevealMode, setManualRevealMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<DetailedTarotCard | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getCardCount = () => {
    if (spreadType === 'single' || spreadType === 'single_wasteland') return 1
    if (spreadType === 'three_card' || spreadType === 'vault_tec_spread') return 3
    if (spreadType === 'celtic_cross') return 10
    if (spreadType === 'horseshoe') return 7
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
      if (!manualRevealMode) {
        const interval = setInterval(()=> {
          setRevealCount(rc => {
            if (rc + 1 >= cardsWithPositions.length) { clearInterval(interval); return cardsWithPositions.length }
            return rc + 1
          })
        }, Math.max(250, animationDuration / (cardsWithPositions.length * 2)))
      }

      // Complete drawing animation
      await new Promise(resolve => setTimeout(resolve, animationDuration / 2))

      onCardsDrawn(cardsWithPositions)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '抽牌失敗'
      setError(errorMessage)
      console.error('Card drawing error:', err)
    } finally {
      setIsDrawing(false)
    }
  }, [spreadType, onCardsDrawn, isLoading, isDrawing, animationDuration, manualRevealMode])

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
          w-32 h-48 border-2 border-dashed border-gray-400 rounded-lg
          flex items-center justify-center cursor-pointer
          transition-all duration-300 hover:border-blue-500
          ${selectedPositions.includes(index) ? 'border-blue-500 bg-blue-50' : ''}
        `}
        onClick={() => handlePositionClick(index)}
        aria-disabled={selectedPositions.includes(index)}
      >
        {drawnCards[index] ? (
          <TarotCard
            card={drawnCards[index]}
            isRevealed={true}
            position={drawnCards[index].position}
            size="small"
            onClick={handleCardClick}
          />
        ) : (
          <div className="text-gray-500 text-sm text-center">
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

    // Calculate optimal spacing based on card count and container width
    const getCardSpacing = () => {
      const cardCount = drawnCards.length
      if (cardCount === 1) return 'gap-0'
      if (cardCount <= 3) return 'gap-6'
      if (cardCount <= 5) return 'gap-4'
      return 'gap-2'
    }

    // Calculate stagger delay for sequential animations
    const getAnimationDelay = (index: number) => {
      return index * 150 // 150ms stagger
    }

    return (
      <div className="space-y-6">
        <div data-testid="drawn-cards" className={`flex ${getCardSpacing()} justify-center items-start mt-6 flex-wrap`}>
          {drawnCards.map((card, index) => {
            const revealed = index < revealCount
            const animationDelay = getAnimationDelay(index)

            return (
              <div
                key={`${card.id}-${index}`}
                data-testid={`drawn-card-${index}`}
                className={`
                  flex flex-col items-center gap-3 transition-all duration-700 ease-out
                  ${revealed ? 'animate-card-position opacity-100' : 'opacity-30'}
                `}
                style={{
                  animationDelay: `${animationDelay}ms`,
                  transform: revealed ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)'
                }}
              >
                <TarotCard
                  card={card}
                  isRevealed={revealed}
                  position={card.position}
                  size="medium"
                  showKeywords={revealed}
                  flipStyle="kokonut"
                  onClick={handleCardClick}
                  animationDelay={animationDelay}
                  showGlow={revealed && index === revealCount - 1}
                  isSelectable={!revealed && manualRevealMode}
                  isSelected={revealed}
                  enableHaptic={true}
                  cardIndex={index}
                  totalCards={drawnCards.length}
                  showProgress={!revealed && manualRevealMode}
                  onLongPress={(card) => {
                    // Show card details on long press
                    handleCardClick(card)
                  }}
                  onSwipe={(direction, card) => {
                    if (direction === 'up' && !revealed && manualRevealMode) {
                      setRevealCount(c => Math.min(c + 1, drawnCards.length))
                    }
                  }}
                />

                {/* Manual reveal button */}
                {!revealed && manualRevealMode && (
                  <button
                    onClick={()=> setRevealCount(c=> Math.min(c+1, drawnCards.length))}
                    className={`
                      mt-1 px-3 py-1 text-xs font-mono border border-pip-boy-green/40
                      text-pip-boy-green/70 hover:bg-pip-boy-green/10 hover:border-pip-boy-green/60
                      hover:text-pip-boy-green transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-pip-boy-green/30
                    `}
                  >
                    翻牌
                  </button>
                )}

                {/* Position label */}
                <div className={`
                  text-center text-xs font-mono transition-all duration-300
                  ${revealed ? 'text-pip-boy-green' : 'text-pip-boy-green/50'}
                `}>
                  {(card as any)._position_meta || `位置 ${index+1}`}
                </div>
              </div>
            )
          })}
        </div>

        {/* Enhanced control panel */}
        <div className="flex items-center justify-center gap-4 p-4 bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg">
          <button
            onClick={()=> setManualRevealMode(m=>!m)}
            className={`
              px-4 py-2 text-sm font-mono border border-pip-boy-green/50
              text-pip-boy-green hover:bg-pip-boy-green/10 hover:border-pip-boy-green/70
              transition-all duration-200 rounded focus:outline-none focus:ring-2 focus:ring-pip-boy-green/30
              ${manualRevealMode ? 'bg-pip-boy-green/10' : ''}
            `}
          >
            {manualRevealMode ? '自動翻牌模式' : '手動翻牌模式'}
          </button>

          {manualRevealMode && revealCount < drawnCards.length && drawnCards.length > 0 && (
            <button
              onClick={()=> setRevealCount(c=> Math.min(c+1, drawnCards.length))}
              className={`
                px-4 py-2 text-sm font-mono bg-pip-boy-green text-wasteland-dark font-bold
                hover:bg-pip-boy-green/90 transition-all duration-200 rounded
                focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50
                shadow-lg hover:shadow-xl transform hover:scale-105
              `}
            >
              翻下一張 ({revealCount + 1}/{drawnCards.length})
            </button>
          )}

          {revealCount === drawnCards.length && drawnCards.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-mono text-pip-boy-green animate-pulse">
              <Star className="w-4 h-4" />
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
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Enhanced Card Deck */}
      {!enablePositionSelection && (
        <div className="relative">
          <div
            data-testid="card-deck"
            className={`
              relative w-40 h-60 bg-gradient-to-br from-purple-900 to-indigo-900
              rounded-lg border-2 border-gold-400 cursor-pointer group
              transition-all duration-400 ease-out
              ${isDrawing ? 'animate-card-draw scale-105' : 'hover:animate-card-hover hover:shadow-2xl hover:shadow-gold-400/20'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              focus:outline-none focus:ring-4 focus:ring-gold-400/30
            `}
            onClick={drawCards}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && !isDrawing && drawCards()}
            aria-disabled={isLoading || isDrawing}
            role="button"
            aria-label="點擊抽牌"
          >
          {/* Enhanced Deck Stack Effect with improved depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-800 to-indigo-800 rounded-lg transform translate-x-1 translate-y-1 -z-10 transition-transform duration-300 group-hover:translate-x-2 group-hover:translate-y-2" />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-indigo-700 rounded-lg transform translate-x-2 translate-y-2 -z-20 transition-transform duration-300 group-hover:translate-x-4 group-hover:translate-y-4" />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg transform translate-x-3 translate-y-3 -z-30 transition-transform duration-300 group-hover:translate-x-6 group-hover:translate-y-6 opacity-60" />

          {/* Deck Content */}
          <div className="flex items-center justify-center h-full text-gold-400">
            <div className="text-center">
              <Star className={`
                w-16 h-16 mb-4 mx-auto text-pip-boy-green transition-all duration-300
                ${isDrawing ? 'animate-spin' : 'group-hover:scale-110 group-hover:text-gold-400'}
              `} />
              <div className="text-lg font-serif">
                {isDrawing ? '抽牌中...' : '點擊抽牌'}
              </div>
              <div className="text-sm opacity-75 mt-2">
                {spreadType === 'single' ? '單張牌' : '三張牌'}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Position Selection Mode */}
      {enablePositionSelection && renderPositionSelectors()}

      {/* Regular Card Display Mode */}
      {!enablePositionSelection && renderDrawnCards()}

      {/* Redraw Button */}
      {enableRedraw && drawnCards.length > 0 && (
        <button
          data-testid="redraw-button"
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={handleRedraw}
          disabled={isDrawing || isLoading}
        >
          重新抽牌
        </button>
      )}

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