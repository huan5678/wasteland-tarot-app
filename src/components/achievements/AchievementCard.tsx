'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PixelIcon } from '@/components/ui/icons'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  UserAchievementProgress,
  AchievementStatus,
  AchievementRarity,
  AchievementCategory
} from '@/lib/stores/achievementStore'

// ============================================================================
// Types
// ============================================================================

interface AchievementCardProps {
  achievement: UserAchievementProgress
  onClaim?: (code: string) => void
  isClaiming?: boolean
  className?: string
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 取得稀有度顏色和標籤
 */
const getRarityConfig = (rarity: AchievementRarity): {
  color: string
  bgColor: string
  label: string
  glow: string
} => {
  switch (rarity) {
    case 'COMMON':
      return {
        color: 'text-gray-400',
        bgColor: 'bg-gray-900/50',
        label: '普通',
        glow: 'shadow-[0_0_5px_rgba(156,163,175,0.3)]'
      }
    case 'UNCOMMON':
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-900/50',
        label: '罕見',
        glow: 'shadow-[0_0_8px_rgba(74,222,128,0.4)]'
      }
    case 'RARE':
      return {
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/50',
        label: '稀有',
        glow: 'shadow-[0_0_10px_rgba(96,165,250,0.5)]'
      }
    case 'EPIC':
      return {
        color: 'text-purple-400',
        bgColor: 'bg-purple-900/50',
        label: '史詩',
        glow: 'shadow-[0_0_12px_rgba(192,132,252,0.6)]'
      }
    case 'LEGENDARY':
      return {
        color: 'text-pip-boy-green',
        bgColor: 'bg-pip-boy-green/10',
        label: '傳說',
        glow: 'shadow-[0_0_15px_rgba(0,255,136,0.7)]'
      }
    default:
      return {
        color: 'text-gray-400',
        bgColor: 'bg-gray-900/50',
        label: '普通',
        glow: ''
      }
  }
}

/**
 * 取得類別圖示
 */
const getCategoryIcon = (category: AchievementCategory): string => {
  switch (category) {
    case AchievementCategory.READING:
      return 'book'
    case AchievementCategory.SOCIAL:
      return 'users'
    case AchievementCategory.BINGO:
      return 'grid'
    case AchievementCategory.KARMA:
      return 'zap'
    case AchievementCategory.EXPLORATION:
      return 'compass'
    default:
      return 'trophy'
  }
}

/**
 * 取得狀態配置
 */
const getStatusConfig = (status: AchievementStatus): {
  label: string
  color: string
  icon: string
} => {
  switch (status) {
    case AchievementStatus.IN_PROGRESS:
      return {
        label: '進行中',
        color: 'text-yellow-400',
        icon: 'clock'
      }
    case AchievementStatus.UNLOCKED:
      return {
        label: '已解鎖',
        color: 'text-pip-boy-green',
        icon: 'unlock'
      }
    case AchievementStatus.CLAIMED:
      return {
        label: '已領取',
        color: 'text-green-400',
        icon: 'check-circle'
      }
    default:
      return {
        label: '未知',
        color: 'text-gray-400',
        icon: 'help-circle'
      }
  }
}

// ============================================================================
// Component
// ============================================================================

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onClaim,
  isClaiming = false,
  className
}) => {
  const { achievement: achievementDef, status, current_progress, target_progress, progress_percentage } = achievement
  const rarityConfig = getRarityConfig(achievementDef.rarity)
  const statusConfig = getStatusConfig(status)
  const categoryIcon = getCategoryIcon(achievementDef.category)

  const isUnlocked = status === AchievementStatus.UNLOCKED
  const isClaimed = status === AchievementStatus.CLAIMED
  const isInProgress = status === AchievementStatus.IN_PROGRESS

  const handleClaim = () => {
    if (isUnlocked && onClaim) {
      onClaim(achievementDef.code)
    }
  }

  return (
    <Card
      variant={isUnlocked ? 'elevated' : 'default'}
      padding="sm"
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        rarityConfig.glow,
        isUnlocked && 'border-pip-boy-green/50',
        isClaimed && 'opacity-75',
        className
      )}
    >
      {/* 稀有度標籤 */}
      <div className={cn(
        'absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold',
        rarityConfig.color,
        rarityConfig.bgColor
      )}>
        {rarityConfig.label}
      </div>

      <CardHeader className="pb-3">
        {/* 圖示和類別 */}
        <div className="flex items-start gap-3 mb-2">
          <div className={cn(
            'flex items-center justify-center w-12 h-12 rounded-md',
            isClaimed ? 'bg-bg-tertiary' : rarityConfig.bgColor
          )}>
            <PixelIcon
              name={achievementDef.icon_name || categoryIcon}
              sizePreset="md"
              variant={isClaimed ? 'muted' : 'primary'}
            />
          </div>

          <div className="flex-1 mt-1">
            <CardTitle className={cn(
              'text-base mb-1',
              isClaimed && 'text-text-secondary'
            )}>
              {achievementDef.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <PixelIcon
                name={statusConfig.icon}
                sizePreset="xs"
                className={statusConfig.color}
                decorative
              />
              <span className={statusConfig.color}>{statusConfig.label}</span>
            </div>
          </div>
        </div>

        <CardDescription className="text-sm line-clamp-2">
          {achievementDef.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="py-3">
        {/* 進度條（進行中狀態顯示） */}
        {isInProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>進度</span>
              <span>{current_progress} / {target_progress}</span>
            </div>
            <ProgressBar
              current={current_progress}
              max={target_progress}
              variant="pip-boy"
              size="sm"
              showPercentage={true}
            />
          </div>
        )}

        {/* 獎勵資訊 */}
        {achievementDef.rewards && Object.keys(achievementDef.rewards).length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-xs text-text-secondary mb-1">獎勵：</div>
            <div className="flex flex-wrap gap-2">
              {achievementDef.rewards.karma_points && (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-bg-tertiary text-xs">
                  <PixelIcon name="zap" sizePreset="xs" variant="warning" decorative />
                  <span className="text-pip-boy-green">{achievementDef.rewards.karma_points} Karma</span>
                </div>
              )}
              {achievementDef.rewards.title && (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-bg-tertiary text-xs">
                  <PixelIcon name="bookmark" sizePreset="xs" variant="info" decorative />
                  <span className="text-blue-400">「{achievementDef.rewards.title}」</span>
                </div>
              )}
              {achievementDef.rewards.badge && (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-bg-tertiary text-xs">
                  <PixelIcon name="award" sizePreset="xs" variant="success" decorative />
                  <span className="text-green-400">徽章</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* 領取按鈕（已解鎖狀態） */}
      {isUnlocked && onClaim && (
        <CardFooter className="pt-3">
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full"
            variant="default"
            size="sm"
          >
            {isClaiming ? (
              <>
                <PixelIcon name="loader" sizePreset="xs" animation="spin" decorative />
                <span className="ml-2">領取中...</span>
              </>
            ) : (
              <>
                <PixelIcon name="gift" sizePreset="xs" decorative />
                <span className="ml-2">領取獎勵</span>
              </>
            )}
          </Button>
        </CardFooter>
      )}

      {/* 已領取時間 */}
      {isClaimed && achievement.claimed_at && (
        <CardFooter className="pt-3 text-xs text-text-secondary">
          <PixelIcon name="check" sizePreset="xs" variant="success" decorative />
          <span className="ml-2">
            已於 {new Date(achievement.claimed_at).toLocaleDateString('zh-TW')} 領取
          </span>
        </CardFooter>
      )}
    </Card>
  )
}

export default AchievementCard
