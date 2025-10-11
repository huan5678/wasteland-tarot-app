'use client'

import React from 'react'
import { PixelIcon } from '@/components/ui/icons'
import type { IconName, IconColorVariant, IconAnimation } from '@/components/ui/icons'

export type CardState =
  | 'idle'
  | 'hoverable'
  | 'hovered'
  | 'selectable'
  | 'selected'
  | 'revealing'
  | 'revealed'
  | 'animating'
  | 'loading'
  | 'error'

export interface CardStateIndicatorsProps {
  state: CardState
  size?: 'small' | 'medium' | 'large'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  showLabels?: boolean
  animate?: boolean
}

const stateConfig = {
  idle: {
    iconName: null as IconName | null,
    variant: 'muted' as const,
    bgColor: 'bg-gray-400/10',
    label: '待機',
    priority: 0
  },
  hoverable: {
    iconName: 'cursor' as IconName,
    variant: 'primary' as const,
    bgColor: 'bg-pip-boy-green/10',
    label: '可互動',
    priority: 1
  },
  hovered: {
    iconName: 'target' as IconName,
    variant: 'primary' as const,
    bgColor: 'bg-pip-boy-green/20',
    label: '游標懸停',
    priority: 2,
    animate: 'pulse' as const
  },
  selectable: {
    iconName: 'device-mobile' as IconName,
    variant: 'info' as const,
    bgColor: 'bg-blue-400/20',
    label: '可選擇',
    priority: 2,
    animate: 'bounce' as const
  },
  selected: {
    iconName: 'checkbox-on' as IconName,
    variant: 'success' as const,
    bgColor: 'bg-pip-boy-green/30',
    label: '已選擇',
    priority: 5,
    animate: 'pulse' as const
  },
  revealing: {
    iconName: 'eye' as IconName,
    variant: 'warning' as const,
    bgColor: 'bg-warning-yellow/20',
    label: '翻牌中',
    priority: 4,
    animate: 'spin' as const
  },
  revealed: {
    iconName: 'eye-closed' as IconName,
    variant: 'success' as const,
    bgColor: 'bg-pip-boy-green/20',
    label: '已顯示',
    priority: 3
  },
  animating: {
    iconName: 'sparkles' as IconName,
    variant: 'secondary' as const,
    bgColor: 'bg-radiation-orange/20',
    label: '動畫中',
    priority: 6,
    animate: 'float' as const
  },
  loading: {
    iconName: 'clock' as IconName,
    variant: 'muted' as const,
    bgColor: 'bg-gray-500/20',
    label: '載入中',
    priority: 7,
    animate: 'pulse' as const
  },
  error: {
    iconName: 'alert' as IconName,
    variant: 'error' as const,
    bgColor: 'bg-error/20',
    label: '錯誤',
    priority: 8,
    animate: 'wiggle' as const
  }
}

const sizeConfig = {
  small: {
    sizePreset: 'xs' as const,
    padding: 'p-1',
    textSize: 'text-[8px]',
    indicatorSize: 'w-2 h-2'
  },
  medium: {
    sizePreset: 'xs' as const,
    padding: 'p-1.5',
    textSize: 'text-[10px]',
    indicatorSize: 'w-2.5 h-2.5'
  },
  large: {
    sizePreset: 'sm' as const,
    padding: 'p-2',
    textSize: 'text-xs',
    indicatorSize: 'w-3 h-3'
  }
}

const positionConfig = {
  'top-left': 'top-1 left-1',
  'top-right': 'top-1 right-1',
  'bottom-left': 'bottom-1 left-1',
  'bottom-right': 'bottom-1 right-1',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
}

export function CardStateIndicators({
  state,
  size = 'medium',
  position = 'top-right',
  showLabels = false,
  animate = true
}: CardStateIndicatorsProps) {
  const config = stateConfig[state]
  const sizeProps = sizeConfig[size]
  const positionClass = positionConfig[position]

  if (!config.iconName || state === 'idle') {
    return null
  }

  return (
    <div
      className={`
        absolute ${positionClass} z-20
        ${config.bgColor}
        ${sizeProps.padding} rounded-full
        flex items-center gap-1
        transition-all duration-200 ease-out
        backdrop-blur-sm border border-current/20
        shadow-sm
      `}
      role="status"
      aria-label={`卡片狀態: ${config.label}`}
    >
      <PixelIcon
        name={config.iconName}
        sizePreset={sizeProps.sizePreset}
        variant={config.variant}
        animation={animate && config.animate ? config.animate : undefined}
        decorative
      />

      {showLabels && (
        <span className={`${sizeProps.textSize} font-medium whitespace-nowrap`}>
          {config.label}
        </span>
      )}
    </div>
  )
}

// Multi-state indicator for complex states
export interface MultiStateIndicatorsProps {
  states: CardState[]
  size?: 'small' | 'medium' | 'large'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showLabels?: boolean
  animate?: boolean
}

export function MultiStateIndicators({
  states,
  size = 'medium',
  position = 'top-right',
  showLabels = false,
  animate = true
}: MultiStateIndicatorsProps) {
  // Sort states by priority and show only the highest priority ones
  const sortedStates = states
    .filter(state => state !== 'idle')
    .sort((a, b) => stateConfig[b].priority - stateConfig[a].priority)
    .slice(0, 2) // Show max 2 indicators

  if (sortedStates.length === 0) {
    return null
  }

  const positionClass = positionConfig[position]

  return (
    <div
      className={`absolute ${positionClass} z-20 flex items-center gap-1`}
      role="status"
      aria-label={`卡片狀態: ${sortedStates.map(s => stateConfig[s].label).join(', ')}`}
    >
      {sortedStates.map((state, index) => (
        <CardStateIndicators
          key={state}
          state={state}
          size={size}
          position="center"
          showLabels={showLabels && index === 0} // Only show label for primary state
          animate={animate}
        />
      ))}
    </div>
  )
}

// Progress indicator for sequential reveals
export interface CardProgressIndicatorProps {
  current: number
  total: number
  size?: 'small' | 'medium' | 'large'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  showNumbers?: boolean
}

export function CardProgressIndicator({
  current,
  total,
  size = 'medium',
  position = 'bottom-right',
  showNumbers = true
}: CardProgressIndicatorProps) {
  const sizeProps = sizeConfig[size]
  const positionClass = positionConfig[position]
  const progress = (current / total) * 100

  return (
    <div
      className={`
        absolute ${positionClass} z-20
        ${sizeProps.padding} rounded-full
        bg-pip-boy-green/10 border border-pip-boy-green/30
        flex items-center gap-1
        backdrop-blur-sm
      `}
      role="progressbar"
      aria-valuenow={current}
      aria-valuemax={total}
      aria-label={`進度: ${current}/${total}`}
    >
      {/* Circular progress */}
      <div className={`${sizeProps.indicatorSize} relative`}>
        <svg className="transform -rotate-90" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-pip-boy-green/30"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${progress * 0.628} 62.8`}
            className="text-pip-boy-green transition-all duration-300"
          />
        </svg>
      </div>

      {/* Numbers */}
      {showNumbers && (
        <span className={`${sizeProps.textSize} font-medium text-pip-boy-green`}>
          {current}/{total}
        </span>
      )}
    </div>
  )
}

// Loading shimmer effect
export function CardLoadingShimmer() {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pip-boy-green/5 to-transparent animate-card-shimmer" />
    </div>
  )
}