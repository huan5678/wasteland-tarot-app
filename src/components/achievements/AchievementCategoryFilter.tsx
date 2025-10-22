'use client'

import React from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { AchievementCategory } from '@/lib/stores/achievementStore'

// ============================================================================
// Types
// ============================================================================

interface CategoryOption {
  value: AchievementCategory | null
  label: string
  icon: string
  description: string
}

interface AchievementCategoryFilterProps {
  currentFilter: AchievementCategory | null
  onFilterChange: (category: AchievementCategory | null) => void
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    value: null,
    label: '全部',
    icon: 'apps',
    description: '顯示所有成就'
  },
  {
    value: AchievementCategory.READING,
    label: '閱讀',
    icon: 'book',
    description: '塔羅閱讀相關成就'
  },
  {
    value: AchievementCategory.SOCIAL,
    label: '社交',
    icon: 'users',
    description: '社群互動相關成就'
  },
  {
    value: AchievementCategory.BINGO,
    label: 'Bingo',
    icon: 'grid',
    description: 'Bingo 遊戲相關成就'
  },
  {
    value: AchievementCategory.KARMA,
    label: 'Karma',
    icon: 'zap',
    description: 'Karma 累積相關成就'
  },
  {
    value: AchievementCategory.EXPLORATION,
    label: '探索',
    icon: 'compass',
    description: '廢土探索相關成就'
  }
]

// ============================================================================
// Component
// ============================================================================

export const AchievementCategoryFilter: React.FC<AchievementCategoryFilterProps> = ({
  currentFilter,
  onFilterChange,
  className
}) => {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {CATEGORY_OPTIONS.map((option) => {
        const isActive = currentFilter === option.value

        return (
          <button
            key={option.value || 'all'}
            onClick={() => onFilterChange(option.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md',
              'border transition-all duration-200',
              'hover:border-pip-boy-green/50 hover:bg-bg-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-pip-boy-green/30',
              'group',
              isActive
                ? 'border-pip-boy-green bg-pip-boy-green/10 text-pip-boy-green shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                : 'border-border-secondary bg-bg-secondary text-text-secondary'
            )}
            aria-label={`篩選 ${option.label} 類別成就`}
            title={option.description}
          >
            <PixelIcon
              name={option.icon}
              sizePreset="xs"
              variant={isActive ? 'primary' : 'default'}
              decorative
            />
            <span className={cn(
              'text-sm font-medium',
              isActive && 'text-pip-boy-green'
            )}>
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default AchievementCategoryFilter
