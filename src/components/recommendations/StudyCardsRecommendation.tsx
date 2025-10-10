/**
 * Study Cards Recommendation Component
 * Shows personalized card study recommendations
 */

import React from 'react'
import { BookOpen, TrendingUp, RefreshCw } from 'lucide-react'
import { useStudyCards } from '@/hooks/useRecommendations'
import { Card } from '@/components/ui/card'

interface StudyCardsRecommendationProps {
  limit?: number
  className?: string
}

export function StudyCardsRecommendation({
  limit = 5,
  className = ''
}: StudyCardsRecommendationProps) {
  const { cards, loading, refetch } = useStudyCards(limit)

  if (loading && cards.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pip-boy-green" />
        </div>
      </Card>
    )
  }

  if (cards.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-pip-boy-green" />
          <h3 className="text-lg font-semibold">建議學習的卡片</h3>
        </div>

        <p className="text-sm text-wasteland-tan/70">
          繼續進行占卜，我們會根據你的使用習慣推薦適合學習的卡片。
        </p>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-pip-boy-green" />
          <h3 className="text-lg font-semibold">建議學習的卡片</h3>
        </div>

        <button
          onClick={refetch}
          disabled={loading}
          className="
            p-2 rounded-lg
            hover:bg-pip-boy-green/10
            transition-colors
            disabled:opacity-50
          "
          aria-label="重新整理推薦"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {cards.map((card, index) => (
          <div
            key={card.card_id}
            className="
              p-3 rounded-lg
              bg-wasteland-dark/40
              border border-pip-boy-green/20
              hover:border-pip-boy-green/40
              transition-colors
              group
            "
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="
                    text-xs
                    px-2 py-0.5 rounded
                    bg-pip-boy-green/20
                    text-pip-boy-green
                  ">
                    #{index + 1}
                  </span>
                  <p className="font-medium text-sm truncate">
                    {getCardName(card.card_id)}
                  </p>
                </div>

                <p className="text-xs text-wasteland-tan/70 mb-2">
                  {card.reason}
                </p>

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <div className="flex-1 h-1.5 bg-wasteland-darker rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${card.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-wasteland-tan/60">
                    {Math.round(card.confidence * 100)}%
                  </span>
                </div>
              </div>

              <button
                className="
                  px-3 py-1.5 rounded text-xs
                  bg-pip-boy-green/20 hover:bg-pip-boy-green/30
                  border border-pip-boy-green/40
                  text-pip-boy-green
                  transition-colors
                  opacity-0 group-hover:opacity-100
                 
                "
              >
                學習
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-pip-boy-green/20">
        <p className="text-xs text-wasteland-tan/60 text-center">
          根據你抽取的頻率和學習時間智慧推薦
        </p>
      </div>
    </Card>
  )
}

function getCardName(cardId: string): string {
  // Extract readable name from card ID
  // Format: "major-0" -> "The Fool", "cups-1" -> "Ace of Cups"
  const [suit, num] = cardId.split('-')

  if (suit === 'major') {
    const majorNames = [
      'The Fool', 'The Magician', 'The High Priestess', 'The Empress',
      'The Emperor', 'The Hierophant', 'The Lovers', 'The Chariot',
      'Strength', 'The Hermit', 'Wheel of Fortune', 'Justice',
      'The Hanged Man', 'Death', 'Temperance', 'The Devil',
      'The Tower', 'The Star', 'The Moon', 'The Sun',
      'Judgement', 'The World'
    ]
    return majorNames[parseInt(num)] || cardId
  }

  const suitNames: Record<string, string> = {
    'cups': 'Cups',
    'wands': 'Wands',
    'swords': 'Swords',
    'pentacles': 'Pentacles',
    'bottle-caps': 'Bottle Caps',
    'combat-weapons': 'Combat Weapons',
    'nuka-cola-bottles': 'Nuka-Cola Bottles',
    'radiation-rods': 'Radiation Rods'
  }

  const number = parseInt(num)
  const rank = number === 1 ? 'Ace' : number > 10 ? ['Page', 'Knight', 'Queen', 'King'][number - 11] : number.toString()

  return `${rank} of ${suitNames[suit] || suit}`
}
