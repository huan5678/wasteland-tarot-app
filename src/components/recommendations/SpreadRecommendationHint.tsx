/**
 * Spread Recommendation Hint Component
 * Shows intelligent spread recommendations based on question analysis
 */

import React from 'react'
import { Lightbulb, Sparkles } from 'lucide-react'
import { useSpreadRecommendation } from '@/hooks/useRecommendations'

interface SpreadRecommendationHintProps {
  question: string
  currentSpread: string
  onSpreadChange: (spreadType: string) => void
  className?: string
}

export function SpreadRecommendationHint({
  question,
  currentSpread,
  onSpreadChange,
  className = ''
}: SpreadRecommendationHintProps) {
  const { recommendation, loading } = useSpreadRecommendation(question)

  // Don't show if loading, no recommendation, or already using recommended spread
  if (loading || !recommendation || recommendation.spread_type === currentSpread) {
    return null
  }

  // Confidence-based styling
  const confidenceColor = recommendation.confidence > 0.8
    ? 'border-emerald-500/50 bg-emerald-950/20'
    : recommendation.confidence > 0.6
    ? 'border-pip-boy-green/50 bg-pip-boy-green/10'
    : 'border-yellow-500/50 bg-yellow-950/20'

  const confidenceIcon = recommendation.confidence > 0.8
    ? <Sparkles className="w-4 h-4 text-emerald-500" />
    : <Lightbulb className="w-4 h-4 text-pip-boy-green" />

  return (
    <div
      className={`
        mt-3 p-3 rounded-lg border-2
        ${confidenceColor}
        animate-in fade-in-50 slide-in-from-top-2
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {confidenceIcon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-pip-boy-green mb-1">
            建議使用牌陣
          </p>

          <p className="text-sm text-wasteland-tan/80 mb-2">
            {recommendation.reason}
          </p>

          <button
            onClick={() => onSpreadChange(recommendation.spread_type)}
            className="
              text-xs px-3 py-1.5 rounded
              bg-pip-boy-green/20 hover:bg-pip-boy-green/30
              border border-pip-boy-green/40
              text-pip-boy-green
              transition-colors
             
            "
          >
            切換至 {getSpreadName(recommendation.spread_type)}
          </button>

          <span className="
            ml-2 text-xs text-wasteland-tan/60
          ">
            信心度: {Math.round(recommendation.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function getSpreadName(spreadType: string): string {
  const names: Record<string, string> = {
    'single': '單張卡',
    'three_card': '三張卡',
    'celtic_cross': '塞爾特十字',
    'horseshoe': '馬蹄形',
    'relationship_spread': '關係牌陣',
    'year_ahead': '年度展望'
  }
  return names[spreadType] || spreadType
}
