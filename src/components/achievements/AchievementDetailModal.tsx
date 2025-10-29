'use client'

import React, { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PixelIcon } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { SimpleProgressBar } from '@/components/ui/ProgressBar'
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

interface AchievementDetailModalProps {
  achievement: UserAchievementProgress | null
  isOpen: boolean
  onClose: () => void
  onClaim?: (code: string) => void
  isClaiming?: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 取得稀有度配置
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
        glow: 'shadow-[0_0_15px_rgba(156,163,175,0.4)]'
      }
    case 'UNCOMMON':
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-900/50',
        label: '罕見',
        glow: 'shadow-[0_0_20px_rgba(74,222,128,0.5)]'
      }
    case 'RARE':
      return {
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/50',
        label: '稀有',
        glow: 'shadow-[0_0_25px_rgba(96,165,250,0.6)]'
      }
    case 'EPIC':
      return {
        color: 'text-purple-400',
        bgColor: 'bg-purple-900/50',
        label: '史詩',
        glow: 'shadow-[0_0_30px_rgba(192,132,252,0.7)]'
      }
    case 'LEGENDARY':
      return {
        color: 'text-pip-boy-green',
        bgColor: 'bg-pip-boy-green/10',
        label: '傳說',
        glow: 'shadow-[0_0_35px_rgba(0,255,136,0.8)]'
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
 * 取得類別標籤
 */
const getCategoryLabel = (category: AchievementCategory): string => {
  const labels: Record<AchievementCategory, string> = {
    [AchievementCategory.READING]: '閱讀',
    [AchievementCategory.SOCIAL]: '社交',
    [AchievementCategory.BINGO]: 'Bingo',
    [AchievementCategory.KARMA]: 'Karma',
    [AchievementCategory.EXPLORATION]: '探索'
  }
  return labels[category] || '未知'
}

/**
 * 解析解鎖條件文字
 */
const parseCriteriaDescription = (criteria: any): string => {
  const { type, target, filters } = criteria

  switch (type) {
    case 'READING_COUNT':
      if (filters?.spread_type) {
        return `使用${filters.spread_type}排列完成${target}次占卜`
      }
      if (filters?.karma_range) {
        return `維持 Karma 在 ${filters.karma_range.min}-${filters.karma_range.max} 之間完成${target}次占卜`
      }
      return `完成${target}次占卜`

    case 'SOCIAL_SHARE':
      return `分享${target}次占卜結果`

    case 'FRIEND_COUNT':
      return `添加${target}位好友`

    case 'BINGO_LINE':
      return `完成${target}次 Bingo 連線`

    case 'CONSECUTIVE_LOGIN':
      return `連續簽到${target}天`

    case 'KARMA_THRESHOLD':
      return `Karma 分數達到${target}`

    case 'CARD_VIEW':
      if (filters?.card_suit === 'major_arcana') {
        return `抽到所有${target}張大阿卡納卡牌`
      }
      return `收藏${target}張不同的卡牌`

    case 'PLAYLIST_CREATE':
      return `建立${target}個播放清單`

    case 'TIME_BASED':
      if (filters?.time_range === 'midnight') {
        return `在午夜時段（00:00-06:00）完成${target}次占卜`
      }
      return `在特定時段完成${target}次占卜`

    default:
      return `達成特定條件 ${target} 次`
  }
}

// ============================================================================
// Component
// ============================================================================

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  achievement,
  isOpen,
  onClose,
  onClaim,
  isClaiming = false
}) => {
  // 處理鍵盤導航 - MUST be before early return to follow React Hooks rules
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Early return after all Hooks
  if (!achievement) return null

  const { achievement: achievementDef, status, current_progress, target_progress, progress_percentage, unlocked_at, claimed_at } = achievement
  const rarityConfig = getRarityConfig(achievementDef.rarity)
  const categoryLabel = getCategoryLabel(achievementDef.category as AchievementCategory)
  const criteriaDescription = parseCriteriaDescription(achievementDef.criteria)

  const isUnlocked = status === AchievementStatus.UNLOCKED
  const isClaimed = status === AchievementStatus.CLAIMED
  const isInProgress = status === AchievementStatus.IN_PROGRESS

  const handleClaim = () => {
    if (isUnlocked && onClaim) {
      onClaim(achievementDef.code)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-2xl border-2",
        rarityConfig.glow,
        isUnlocked ? 'border-pip-boy-green' : 'border-border-primary'
      )}>
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start gap-4">
            {/* 成就圖示 */}
            <div className={cn(
              'flex items-center justify-center w-20 h-20 rounded-lg overflow-hidden',
              rarityConfig.bgColor,
              rarityConfig.glow
            )}>
              {achievementDef.icon_image_url ? (
                <img
                  src={achievementDef.icon_image_url}
                  alt={achievementDef.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PixelIcon
                  name={achievementDef.icon_name || 'trophy'}
                  sizePreset="xl"
                  variant="primary"
                  decorative
                />
              )}
            </div>

            {/* 標題與標籤 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  'px-3 py-1 rounded text-xs font-semibold',
                  rarityConfig.color,
                  rarityConfig.bgColor
                )}>
                  {rarityConfig.label}
                </span>
                <span className="px-3 py-1 rounded text-xs font-semibold bg-bg-tertiary text-text-secondary">
                  {categoryLabel}
                </span>
                {achievementDef.is_hidden && (
                  <span className="px-3 py-1 rounded text-xs font-semibold bg-purple-900/50 text-purple-400">
                    隱藏成就
                  </span>
                )}
              </div>

              <DialogTitle className="text-2xl mb-2">
                {achievementDef.name}
              </DialogTitle>

              <DialogDescription className="text-base">
                {achievementDef.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 內容 */}
        <div className="space-y-6 py-4">
          {/* 進度資訊（進行中狀態） */}
          {isInProgress && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <PixelIcon name="chart" sizePreset="xs" variant="primary" decorative />
                進度追蹤
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>當前進度</span>
                  <span className="font-semibold">{current_progress} / {target_progress}</span>
                </div>
                <SimpleProgressBar percentage={progress_percentage || 0} />
              </div>
            </div>
          )}

          {/* 解鎖條件 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <PixelIcon name="list-check" sizePreset="xs" variant="primary" decorative />
              解鎖條件
            </h3>
            <div className="p-4 rounded-md bg-bg-tertiary border border-border-secondary">
              <p className="text-sm text-text-primary">
                {criteriaDescription}
              </p>
            </div>
          </div>

          {/* 獎勵細節 */}
          {achievementDef.rewards && Object.keys(achievementDef.rewards).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <PixelIcon name="gift" sizePreset="xs" variant="primary" decorative />
                獎勵內容
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievementDef.rewards.karma_points && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-bg-tertiary border border-border-secondary">
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-yellow-900/30">
                      <PixelIcon name="zap" sizePreset="md" variant="warning" decorative />
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary">Karma 點數</div>
                      <div className="text-lg font-bold text-pip-boy-green">
                        +{achievementDef.rewards.karma_points}
                      </div>
                    </div>
                  </div>
                )}

                {achievementDef.rewards.title && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-bg-tertiary border border-border-secondary">
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-blue-900/30">
                      <PixelIcon name="bookmark" sizePreset="md" variant="info" decorative />
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary">獲得稱號</div>
                      <div className="text-sm font-semibold text-blue-400">
                        「{achievementDef.rewards.title}」
                      </div>
                    </div>
                  </div>
                )}

                {achievementDef.rewards.badge && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-bg-tertiary border border-border-secondary">
                    <div className="flex items-center justify-center w-10 h-10 rounded bg-green-900/30">
                      <PixelIcon name="award" sizePreset="md" variant="success" decorative />
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary">獲得徽章</div>
                      <div className="text-sm font-semibold text-green-400">
                        特殊徽章
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 解鎖時間（已解鎖或已領取） */}
          {(isUnlocked || isClaimed) && unlocked_at && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <PixelIcon name="calendar" sizePreset="xs" variant="primary" decorative />
                解鎖時間
              </h3>
              <p className="text-sm text-text-secondary">
                {new Date(unlocked_at).toLocaleString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}

          {/* 領取時間（已領取） */}
          {isClaimed && claimed_at && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <PixelIcon name="check-circle" sizePreset="xs" variant="success" decorative />
                領取時間
              </h3>
              <p className="text-sm text-text-secondary">
                {new Date(claimed_at).toLocaleString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4 border-t border-border-secondary">
          {/* 領取按鈕（已解鎖狀態） */}
          {isUnlocked && onClaim && (
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="flex-1"
              size="lg"
            >
              {isClaiming ? (
                <>
                  <PixelIcon name="loader" sizePreset="sm" animation="spin" decorative />
                  <span className="ml-2">領取中...</span>
                </>
              ) : (
                <>
                  <PixelIcon name="gift" sizePreset="sm" decorative />
                  <span className="ml-2">領取獎勵</span>
                </>
              )}
            </Button>
          )}

          {/* 關閉按鈕 */}
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
            className={cn(
              isUnlocked && onClaim ? 'flex-none' : 'flex-1'
            )}
          >
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AchievementDetailModal
