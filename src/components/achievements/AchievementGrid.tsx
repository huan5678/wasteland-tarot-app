'use client'

import React from 'react'
import { AchievementCard } from './AchievementCard'
import { PixelIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import {
  UserAchievementProgress,
  AchievementStatus,
  useAchievementStore
} from '@/lib/stores/achievementStore'

// ============================================================================
// Types
// ============================================================================

interface AchievementGridProps {
  achievements: UserAchievementProgress[]
  onClaim?: (code: string) => void
  onCardClick?: (achievement: UserAchievementProgress) => void
  isClaiming?: boolean
  className?: string
  emptyMessage?: string
}

// ============================================================================
// Component
// ============================================================================

export const AchievementGrid: React.FC<AchievementGridProps> = ({
  achievements,
  onClaim,
  onCardClick,
  isClaiming = false,
  className,
  emptyMessage = '目前沒有成就'
}) => {
  // 分組成就：已解鎖 > 進行中 > 已領取
  const sortedAchievements = React.useMemo(() => {
    const statusOrder = {
      'UNLOCKED': 0,
      'IN_PROGRESS': 1,
      'CLAIMED': 2
    }

    return [...achievements].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff

      // 相同狀態下，依進度百分比排序（進行中）或稀有度排序（其他）
      if (a.status === 'IN_PROGRESS') {
        return b.progress_percentage - a.progress_percentage
      }

      // 稀有度排序
      const rarityOrder = { LEGENDARY: 0, EPIC: 1, RARE: 2, COMMON: 3 }
      const rarityA = rarityOrder[a.achievement.rarity as keyof typeof rarityOrder] ?? 3
      const rarityB = rarityOrder[b.achievement.rarity as keyof typeof rarityOrder] ?? 3
      return rarityA - rarityB
    })
  }, [achievements])

  // 空狀態
  if (achievements.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center min-h-[400px] text-center',
        className
      )}>
        <div className="mb-4">
          <PixelIcon
            name="trophy"
            sizePreset="xxl"
            variant="muted"
            decorative
          />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {emptyMessage}
        </h3>
        <p className="text-sm text-text-secondary max-w-md">
          繼續探索廢土，完成任務來解鎖成就吧！
        </p>
      </div>
    )
  }

  return (
    <div className={cn(
      'grid gap-4',
      // 響應式網格：手機1列，平板2列，桌機3列，大螢幕4列
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      className
    )}>
      {sortedAchievements.map((achievement) => (
        <AchievementCard
          key={achievement.id || achievement.achievement_id}
          achievement={achievement}
          onClaim={onClaim}
          onClick={onCardClick}
          isClaiming={isClaiming}
        />
      ))}
    </div>
  )
}

export default AchievementGrid
