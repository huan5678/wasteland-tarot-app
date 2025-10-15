'use client'
import React from 'react'
import { getLayout } from '@/lib/spreadLayouts'
import { useSpreadTemplatesStore } from '@/lib/spreadTemplatesStore'

interface Props {
  spreadType: string
}

export function SpreadLayoutPreview({ spreadType }: Props) {
  const templates = useSpreadTemplatesStore(s => s.templates)

  // Find the template for this spread
  const template = templates.find(t => t.name === spreadType)

  // Get layout with template data (will fallback to hardcoded if no layout in API)
  const layout = getLayout(spreadType, template)

  // Dynamic sizing based on card count
  const cardCount = layout.length

  // Card size classes based on count
  const getCardSize = () => {
    if (cardCount <= 3) return 'w-12 h-16'  // 48x64px - Large for 1-3 cards
    if (cardCount <= 5) return 'w-10 h-14'  // 40x56px - Medium for 4-5 cards
    return 'w-8 h-11'                        // 32x44px - Small for 6+ cards
  }

  // Text size classes based on count
  const getTextSize = () => {
    if (cardCount <= 3) return 'text-sm'     // 14px - Large and readable
    if (cardCount <= 5) return 'text-xs'     // 12px - Medium readable
    return 'text-[11px]'                     // 11px - Small but still readable
  }

  // Container height based on count
  const getContainerHeight = () => {
    if (cardCount <= 3) return 'h-40'        // 160px - Compact for few cards
    if (cardCount <= 5) return 'h-44'        // 176px - Medium height
    return 'h-52'                            // 208px - Taller for many cards
  }

  return (
    <div className={`w-full ${getContainerHeight()} relative border border-pip-boy-green/30 bg-pip-boy-green/5 rounded-sm`}>
      {layout.map(pos => (
        <div
          key={pos.id}
          className={`absolute ${getCardSize()} border-2 border-pip-boy-green/40 bg-pip-boy-green/10 flex items-center justify-center ${getTextSize()} text-pip-boy-green font-medium rounded-sm transition-all duration-200`}
          style={{
            left: `${pos.x * 100}%`,
            top: `${pos.y * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {pos.label}
        </div>
      ))}
    </div>
  )
}
