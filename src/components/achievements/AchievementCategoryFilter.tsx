'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { AchievementCategory } from '@/lib/stores/achievementStore';
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

interface CategoryOption {
  value: AchievementCategory | null;
  label: string;
  icon: string;
  description: string;
}

interface AchievementCategoryFilterProps {
  currentFilter: AchievementCategory | null;
  onFilterChange: (category: AchievementCategory | null) => void;
  className?: string;
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
    value: 'READING',
    label: '閱讀',
    icon: 'book',
    description: '塔羅閱讀相關成就'
  },
  {
    value: 'SOCIAL',
    label: '社交',
    icon: 'group',
    description: '社群互動相關成就'
  },
  {
    value: 'BINGO',
    label: 'Bingo',
    icon: 'grid',
    description: 'Bingo 遊戲相關成就'
  },
  {
    value: 'KARMA',
    label: 'Karma',
    icon: 'zap',
    description: 'Karma 累積相關成就'
  },
  {
    value: 'EXPLORATION',
    label: '探索',
    icon: 'compass',
    description: '廢土探索相關成就'
  }
];

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
        const isActive = currentFilter === option.value;

        return (
          <Button
            key={option.value || 'all'}
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            onClick={() => onFilterChange(option.value)}
            className="gap-2"
            aria-label={`篩選 ${option.label} 類別成就`}
            title={option.description}
          >
            <PixelIcon
              name={option.icon}
              sizePreset="xs"
              decorative
            />
            <span className="text-sm font-medium">
              {option.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export default AchievementCategoryFilter;
