'use client'

import React from 'react'
import Link from 'next/link'
import { PixelIcon } from '@/components/ui/icons'
import { AvatarUpload } from '@/components/profile/AvatarUpload'

interface OverviewTabProps {
  user: any
  profile: any
  isOAuthUser: boolean
  profilePicture?: string
  updateAvatarUrl: (url: string) => void
  getDaysInService: () => number
}

// 快速動作配置
const QUICK_ACTIONS = [
  {
    href: '/readings/new',
    icon: 'magic',
    label: '新占卜'
  },
  {
    href: '/cards',
    icon: 'book',
    label: '卡牌圖鑑'
  },
  {
    href: '/readings',
    icon: 'history',
    label: '占卜歷史'
  }
] as const

// 統計數據配置
const getStatistics = (profile: any) => [
  {
    value: profile.totalReadings,
    label: '總占卜次數',
    isNumeric: true
  },
  {
    value: profile.monthlyReadings,
    label: '本月',
    isNumeric: true
  },
  {
    value: profile.favoritedCount,
    label: '收藏',
    isNumeric: true
  },
  {
    value: profile.favoriteCardName,
    label: '最常抽到',
    isNumeric: false
  }
] as const

export function OverviewTab({
  user,
  profile,
  isOAuthUser,
  profilePicture,
  updateAvatarUrl,
  getDaysInService
}: OverviewTabProps) {
  const statistics = getStatistics(profile)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Card */}
      <div className="lg:col-span-1">
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
          <AvatarUpload
            currentAvatarUrl={user?.avatar_url || (isOAuthUser ? profilePicture : undefined)}
            onUploadSuccess={(newAvatarUrl) => {
              console.log('頭像上傳成功，新 URL:', newAvatarUrl)
              updateAvatarUrl(newAvatarUrl)
            }}
          />

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-pip-boy-green">
              {user?.name || profile.username}
            </h2>
            <p className="text-pip-boy-green/70 text-sm">Vault Dweller</p>

            {isOAuthUser && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 border border-pip-boy-green/50 bg-pip-boy-green/10 rounded-full">
                <svg className="w-4 h-4 text-pip-boy-green" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                </svg>
                <span className="text-pip-boy-green text-xs">已連結 Google 帳號</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pip-boy-green numeric tabular-nums">
                {getDaysInService()}
              </div>
              <div className="text-pip-boy-green/70 text-xs">服務天數</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-pip-boy-green">{profile.karmaLevel}</div>
              <div className="text-pip-boy-green/70 text-xs">業力狀態</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pip-boy-green numeric tabular-nums">
                {profile.totalReadings}
              </div>
              <div className="text-pip-boy-green/70 text-xs">總占卜次數</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Quick Actions */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
          <h3 className="text-xl font-bold text-pip-boy-green mb-4">
            <PixelIcon name="flash" size={24} className="mr-2 inline" decorative />快速動作
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center justify-center gap-2 py-4 border border-pip-boy-green/50 text-pip-boy-green hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-colors"
              >
                <PixelIcon name={action.icon} size={24} decorative />
                <span className="text-sm">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
          <h3 className="text-xl font-bold text-pip-boy-green mb-4">
            <PixelIcon name="chart-bar" size={24} className="mr-2 inline" decorative />占卜統計
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statistics.map((stat, index) => (
              <div key={index} className="text-center p-3 border border-pip-boy-green/20 bg-pip-boy-green/5">
                <div className={`${stat.isNumeric ? 'text-xl' : 'text-sm'} font-bold text-pip-boy-green ${stat.isNumeric ? 'numeric tabular-nums' : ''}`}>
                  {stat.value}
                </div>
                <div className="text-pip-boy-green/70 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
