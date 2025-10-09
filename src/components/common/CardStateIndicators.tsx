'use client'

import React from 'react'
import {
  Zap,
  Eye,
  EyeOff,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MousePointer,
  Smartphone
} from 'lucide-react'

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
    icon: null,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    label: '待機',
    priority: 0
  },
  hoverable: {
    icon: MousePointer,
    color: 'text-pip-boy-green/60',
    bgColor: 'bg-pip-boy-green/10',
    label: '可互動',
    priority: 1
  },
  hovered: {
    icon: Target,
    color: 'text-pip-boy-green',
    bgColor: 'bg-pip-boy-green/20',
    label: '游標懸停',
    priority: 2,
    animate: 'animate-pulse'
  },
  selectable: {
    icon: Smartphone,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    label: '可選擇',
    priority: 2,
    animate: 'animate-bounce'
  },
  selected: {
    icon: CheckCircle,
    color: 'text-pip-boy-green',
    bgColor: 'bg-pip-boy-green/30',
    label: '已選擇',
    priority: 5,
    animate: 'animate-card-selection'
  },
  revealing: {
    icon: Eye,
    color: 'text-warning-yellow',
    bgColor: 'bg-warning-yellow/20',
    label: '翻牌中',
    priority: 4,
    animate: 'animate-spin'
  },
  revealed: {
    icon: EyeOff,
    color: 'text-pip-boy-green',
    bgColor: 'bg-pip-boy-green/20',
    label: '已顯示',
    priority: 3
  },
  animating: {
    icon: Sparkles,
    color: 'text-radiation-orange',
    bgColor: 'bg-radiation-orange/20',
    label: '動畫中',
    priority: 6,
    animate: 'animate-card-shimmer'
  },
  loading: {
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/20',
    label: '載入中',
    priority: 7,
    animate: 'animate-pulse'
  },
  error: {
    icon: AlertCircle,
    color: 'text-error',
    bgColor: 'bg-error/20',
    label: '錯誤',
    priority: 8,
    animate: 'animate-bounce'
  }
}

const sizeConfig = {
  small: {
    iconSize: 'w-3 h-3',
    padding: 'p-1',
    textSize: 'text-[8px]',
    indicatorSize: 'w-2 h-2'
  },
  medium: {
    iconSize: 'w-4 h-4',
    padding: 'p-1.5',
    textSize: 'text-[10px]',
    indicatorSize: 'w-2.5 h-2.5'
  },
  large: {
    iconSize: 'w-5 h-5',
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

  if (!config.icon || state === 'idle') {
    return null
  }

  const IconComponent = config.icon

  return (
    <div
      className={`
        absolute ${positionClass} z-20
        ${config.bgColor} ${config.color}
        ${sizeProps.padding} rounded-full
        flex items-center gap-1
        transition-all duration-200 ease-out
        ${animate && config.animate ? config.animate : ''}
        backdrop-blur-sm border border-current/20
        shadow-sm
      `}
      role="status"
      aria-label={`卡片狀態: ${config.label}`}
    >
      <IconComponent className={sizeProps.iconSize} />

      {showLabels && (
        <span className={`${sizeProps.textSize} font-mono font-medium whitespace-nowrap`}>
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
        <span className={`${sizeProps.textSize} font-mono font-medium text-pip-boy-green`}>
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