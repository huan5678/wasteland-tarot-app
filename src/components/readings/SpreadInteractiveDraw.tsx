'use client'
import React, { useMemo, useState, useRef, useEffect } from 'react'
import { getLayout, getAdaptiveLayout, getCardTransform, useResponsiveLayout } from '@/lib/spreadLayouts'
import { CardDraw } from '@/components/tarot/CardDraw'

interface Props {
  spreadType: string
  onDone: (cards: any[]) => void
}

export function SpreadInteractiveDraw({ spreadType, onDone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerDimensions, setContainerDimensions] = useState({ width: 1200, height: 600 })
  const deviceType = useResponsiveLayout()

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setContainerDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const layout = useMemo(() =>
    getAdaptiveLayout(
      spreadType,
      containerDimensions.width,
      containerDimensions.height
    ),
    [spreadType, containerDimensions.width, containerDimensions.height]
  )
  return (
    <div ref={containerRef} className="space-y-6">
      {/* Enhanced spread preview */}
      <div className="border border-pip-boy-green/40 p-4 rounded-lg bg-pip-boy-green/5">
        <div className="text-sm font-mono text-pip-boy-green/90 mb-3 flex items-center gap-2">
          <span>牌陣位置概覽</span>
          <span className="text-xs text-pip-boy-green/60">({layout.length} 張牌)</span>
        </div>

        <div className="relative w-full bg-pip-boy-green/5 border border-pip-boy-green/30 rounded-lg overflow-hidden" style={{ height: deviceType === 'mobile' ? '200px' : '280px' }}>
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" className="text-pip-boy-green/30">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Card position indicators */}
          {layout.map((position, index) => {
            const transform = getCardTransform(position)
            const animationDelay = position.animationDelay || 0

            return (
              <div
                key={position.id}
                className={`
                  absolute transition-all duration-500 ease-out animate-card-position
                  ${deviceType === 'mobile' ? 'w-6 h-9' : 'w-8 h-12'}
                  border border-pip-boy-green/40 text-[10px] font-mono
                  flex items-center justify-center bg-pip-boy-green/10
                  hover:bg-pip-boy-green/20 hover:border-pip-boy-green/60
                  rounded shadow-sm hover:animate-card-glow
                  ${position.zIndex ? `z-${Math.min(position.zIndex, 50)}` : ''}
                `}
                style={{
                  left: `${position.x * 100}%`,
                  top: `${position.y * 100}%`,
                  transform: `translate(-50%, -50%) ${transform || ''}`,
                  animationDelay: `${animationDelay}ms`,
                  scale: position.scale || 1
                }}
                title={`${position.label} - 位置 ${index + 1}`}
              >
                <span className="text-pip-boy-green/80 font-bold">
                  {position.label.length > 3 ? position.label.substring(0, 2) + '...' : position.label}
                </span>
              </div>
            )
          })}

          {/* Center indicator for reference */}
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-pip-boy-green/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Layout info */}
        <div className="mt-2 flex items-center justify-between text-xs text-pip-boy-green/60">
          <span>設備: {deviceType === 'desktop' ? '桌面' : deviceType === 'tablet' ? '平板' : '手機'}</span>
          <span>尺寸: {Math.round(containerDimensions.width)} × {Math.round(containerDimensions.height)}</span>
        </div>
      </div>

      {/* Enhanced card draw */}
      <CardDraw
        spreadType={spreadType}
        positionsMeta={layout.map(p => ({ id: p.id, label: p.label }))}
        onCardsDrawn={onDone}
        enableRedraw
        animationDuration={1200}
      />
    </div>
  )
}
