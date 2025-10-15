'use client'
import React, { useMemo, useState } from 'react'
import { getLayout } from '@/lib/spreadLayouts'
import { CardDraw } from '@/components/tarot/CardDraw'
import { SpreadLayoutPreview } from '@/components/readings/SpreadLayoutPreview'

interface Props {
  spreadType: string
  onDone: (cards: any[]) => void
}

export function SpreadInteractiveDraw({ spreadType, onDone }: Props) {
  const layout = useMemo(() => getLayout(spreadType), [spreadType])
  const [hasStartedDrawing, setHasStartedDrawing] = useState(false)

  const handleDrawingStateChange = (isDrawing: boolean) => {
    if (isDrawing) {
      setHasStartedDrawing(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Spread preview - hidden after drawing starts */}
      {!hasStartedDrawing && (
        <div className="border border-pip-boy-green/40 p-4 rounded-lg bg-pip-boy-green/5 transition-all duration-500">
          <div className="text-sm text-pip-boy-green/90 mb-3 flex items-center gap-2">
            <span>牌陣位置概覽</span>
            <span className="text-xs text-pip-boy-green/60">({layout.length} 張牌)</span>
          </div>

          <SpreadLayoutPreview spreadType={spreadType} />
        </div>
      )}

      {/* Enhanced card draw */}
      <CardDraw
        spreadType={spreadType}
        positionsMeta={layout.map(p => ({ id: p.id, label: p.label }))}
        onCardsDrawn={onDone}
        onDrawingStateChange={handleDrawingStateChange}
        enableRedraw
        animationDuration={1200}
      />
    </div>
  )
}
