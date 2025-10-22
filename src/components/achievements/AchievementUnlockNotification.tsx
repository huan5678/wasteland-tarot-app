'use client'

import React, { useEffect, useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UserAchievementProgress, AchievementRarity } from '@/lib/stores/achievementStore'

// ============================================================================
// Types
// ============================================================================

interface AchievementUnlockNotificationProps {
  achievements: UserAchievementProgress[]
  onDismiss?: (achievementId: string) => void
  onDismissAll?: () => void
  autoDismissDelay?: number // 毫秒，0 表示不自動消失
  className?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 取得稀有度顏色和光暈
 */
const getRarityGlow = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case 'COMMON':
      return 'shadow-[0_0_20px_rgba(156,163,175,0.5)]'
    case 'UNCOMMON':
      return 'shadow-[0_0_25px_rgba(74,222,128,0.6)]'
    case 'RARE':
      return 'shadow-[0_0_30px_rgba(96,165,250,0.7)]'
    case 'EPIC':
      return 'shadow-[0_0_35px_rgba(192,132,252,0.8)]'
    case 'LEGENDARY':
      return 'shadow-[0_0_40px_rgba(0,255,136,0.9)]'
    default:
      return ''
  }
}

/**
 * 取得稀有度標籤顏色
 */
const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case 'COMMON':
      return 'text-gray-400'
    case 'UNCOMMON':
      return 'text-green-400'
    case 'RARE':
      return 'text-blue-400'
    case 'EPIC':
      return 'text-purple-400'
    case 'LEGENDARY':
      return 'text-pip-boy-green'
    default:
      return 'text-gray-400'
  }
}

/**
 * 取得稀有度標籤文字
 */
const getRarityLabel = (rarity: AchievementRarity): string => {
  const labels: Record<AchievementRarity, string> = {
    COMMON: '普通',
    UNCOMMON: '罕見',
    RARE: '稀有',
    EPIC: '史詩',
    LEGENDARY: '傳說'
  }
  return labels[rarity] || '未知'
}

// ============================================================================
// Single Notification Component
// ============================================================================

interface SingleNotificationProps {
  achievement: UserAchievementProgress
  onDismiss: () => void
  autoDismissDelay: number
  index: number
}

const SingleNotification: React.FC<SingleNotificationProps> = ({
  achievement,
  onDismiss,
  autoDismissDelay,
  index
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const { achievement: achievementDef } = achievement
  const rarityGlow = getRarityGlow(achievementDef.rarity)
  const rarityColor = getRarityColor(achievementDef.rarity)
  const rarityLabel = getRarityLabel(achievementDef.rarity)

  // 進入動畫
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100)
    return () => clearTimeout(timer)
  }, [index])

  // 自動消失
  useEffect(() => {
    if (autoDismissDelay > 0) {
      const timer = setTimeout(() => handleDismiss(), autoDismissDelay)
      return () => clearTimeout(timer)
    }
  }, [autoDismissDelay])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => onDismiss(), 300) // 等待離開動畫完成
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border-2',
        'bg-bg-primary backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        rarityGlow,
        isVisible && !isLeaving
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95',
        achievementDef.rarity === 'LEGENDARY'
          ? 'border-pip-boy-green'
          : 'border-border-primary'
      )}
    >
      {/* 背景光暈效果 */}
      <div
        className={cn(
          'absolute inset-0 opacity-10',
          achievementDef.rarity === 'LEGENDARY' && 'bg-gradient-to-br from-pip-boy-green to-transparent animate-pulse'
        )}
      />

      {/* 內容 */}
      <div className="relative p-4">
        {/* 關閉按鈕 */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded hover:bg-bg-tertiary transition-colors"
          aria-label="關閉通知"
        >
          <PixelIcon name="close" sizePreset="xs" variant="muted" decorative />
        </button>

        {/* 標題 */}
        <div className="flex items-center gap-2 mb-3">
          <PixelIcon
            name="trophy"
            sizePreset="sm"
            variant="primary"
            animation="bounce"
            decorative
          />
          <h3 className="text-lg font-bold text-pip-boy-green">
            成就解鎖！
          </h3>
        </div>

        {/* 成就資訊 */}
        <div className="flex gap-3">
          {/* 成就圖示 */}
          <div className={cn(
            'flex items-center justify-center w-16 h-16 rounded-md',
            'bg-bg-tertiary',
            rarityGlow
          )}>
            <PixelIcon
              name={achievementDef.icon_name || 'award'}
              sizePreset="lg"
              variant="primary"
              decorative
            />
          </div>

          {/* 成就詳情 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-base font-semibold text-text-primary truncate">
                {achievementDef.name}
              </h4>
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded',
                rarityColor
              )}>
                {rarityLabel}
              </span>
            </div>

            <p className="text-sm text-text-secondary line-clamp-2 mb-2">
              {achievementDef.description}
            </p>

            {/* 獎勵 */}
            {achievementDef.rewards && Object.keys(achievementDef.rewards).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {achievementDef.rewards.karma_points && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-bg-tertiary text-xs">
                    <PixelIcon name="zap" sizePreset="xs" variant="warning" decorative />
                    <span className="text-pip-boy-green font-semibold">
                      +{achievementDef.rewards.karma_points} Karma
                    </span>
                  </div>
                )}
                {achievementDef.rewards.title && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-bg-tertiary text-xs">
                    <PixelIcon name="bookmark" sizePreset="xs" variant="info" decorative />
                    <span className="text-blue-400">
                      「{achievementDef.rewards.title}」
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export const AchievementUnlockNotification: React.FC<AchievementUnlockNotificationProps> = ({
  achievements,
  onDismiss,
  onDismissAll,
  autoDismissDelay = 5000,
  className
}) => {
  if (achievements.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed top-20 right-4 z-50',
        'flex flex-col gap-3',
        'max-w-sm w-full',
        'pointer-events-auto',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      {/* 全部關閉按鈕（多個成就時顯示） */}
      {achievements.length > 1 && onDismissAll && (
        <Button
          onClick={onDismissAll}
          variant="outline"
          size="sm"
          className="self-end mb-2"
        >
          <PixelIcon name="close" sizePreset="xs" decorative />
          <span className="ml-2">全部關閉</span>
        </Button>
      )}

      {/* 成就通知列表 */}
      {achievements.map((achievement, index) => (
        <SingleNotification
          key={achievement.id || achievement.achievement_id}
          achievement={achievement}
          onDismiss={() => onDismiss?.(achievement.achievement_id)}
          autoDismissDelay={autoDismissDelay}
          index={index}
        />
      ))}
    </div>
  )
}

export default AchievementUnlockNotification
