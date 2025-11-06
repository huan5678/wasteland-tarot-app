'use client'

import React from 'react'
import Link from 'next/link'
import { PixelIcon } from '@/components/ui/icons'
import { TitleSelector } from '@/components/profile/TitleSelector'

interface AchievementsTabProps {
  summary: any
  userProgress: any[]
}

// 成就統計配置
const getAchievementStats = (summary: any) => {
  // ✅ 已解鎖 = 未領取(UNLOCKED) + 已領取(CLAIMED)
  const totalUnlocked = (summary?.unlocked_count || 0) + (summary?.claimed_count || 0)

  return [
    {
      value: totalUnlocked,
      label: '已解鎖'
    },
    {
      value: summary?.total_achievements || 0,
      label: '總成就'
    },
    {
      value: `${Math.round(summary?.completion_percentage || 0)}%`,
      label: '完成度'
    }
  ] as const
}

export function AchievementsTab({ summary, userProgress }: AchievementsTabProps) {
  console.log('[AchievementsTab] 📊 收到的 props:', { summary, userProgressCount: userProgress?.length || 0 })

  const achievementStats = summary ? getAchievementStats(summary) : []

  // ✅ 計算真實的已解鎖數量（UNLOCKED + CLAIMED）
  const totalUnlocked = (summary?.unlocked_count || 0) + (summary?.claimed_count || 0)

  // 取得最近解鎖的成就
  const recentlyUnlocked = (userProgress || [])
    .filter(p => p.status === 'UNLOCKED' || p.status === 'CLAIMED')
    .filter(p => p.unlocked_at)
    .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
    .slice(0, 3)

  console.log('[AchievementsTab] 🏅 最近解鎖成就數量:', recentlyUnlocked.length)

  return (
    <div className="space-y-6">
      {/* Achievements Overview */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-pip-boy-green">
            <PixelIcon name="trophy" size={24} className="mr-2 inline" decorative />成就系統
          </h3>
          <Link
            href="/achievements"
            className="text-pip-boy-green/70 hover:text-pip-boy-green text-sm transition-colors"
          >
            查看全部 <PixelIcon name="chevron-right" size={16} className="inline" decorative />
          </Link>
        </div>

        {summary ? (
          <>
            {/* Achievement Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {achievementStats.map((stat, index) => (
                <div key={index} className="text-center p-3 border border-pip-boy-green/20 bg-pip-boy-green/5">
                  <div className="text-2xl font-bold text-pip-boy-green numeric tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-pip-boy-green/70 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-pip-boy-green/70 mb-1">
                <span>總進度</span>
                <span>{totalUnlocked} / {summary.total_achievements}</span>
              </div>
              <div className="h-2 bg-black border border-pip-boy-green/30 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-pip-boy-green transition-all duration-500 shadow-[0_0_8px_rgba(0,255,136,0.6)]"
                  style={{ width: `${summary.completion_percentage}%` }}
                />
              </div>
            </div>

            {/* Recent Unlocked Achievements */}
            {recentlyUnlocked.length > 0 ? (
              <div>
                <div className="text-pip-boy-green/70 text-xs mb-2">最近解鎖</div>
                <div className="space-y-2">
                  {recentlyUnlocked.map((progress) => (
                    <div
                      key={progress.id}
                      className="flex items-center gap-3 p-2 border border-pip-boy-green/20 bg-pip-boy-green/5 hover:bg-pip-boy-green/10 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <PixelIcon
                          name={progress.achievement.icon_name || 'trophy'}
                          sizePreset="md"
                          variant="primary"
                          decorative
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-pip-boy-green text-sm font-semibold truncate">
                          {progress.achievement.name}
                        </div>
                        <div className="text-pip-boy-green/60 text-xs">
                          {progress.unlocked_at && new Date(progress.unlocked_at).toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                      {progress.status === 'UNLOCKED' && (
                        <div className="flex-shrink-0">
                          <span className="text-xs text-pip-boy-green border border-pip-boy-green/50 px-2 py-1 rounded-sm">
                            待領取
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-pip-boy-green/50 text-sm">
                <PixelIcon name="trophy" sizePreset="lg" variant="muted" decorative />
                <p className="mt-2">尚未解鎖任何成就</p>
                <p className="text-xs mt-1">探索廢土來獲得成就吧！</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-pip-boy-green/70 text-sm">載入成就資料中...</p>
          </div>
        )}
      </div>

      {/* Title Selector */}
      <TitleSelector />
    </div>
  )
}
