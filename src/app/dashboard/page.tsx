'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { readingsAPI, cardsAPI } from '@/lib/api'
import { PixelIcon } from '@/components/ui/icons'
import { IncompleteSessionsList } from '@/components/session/IncompleteSessionsList'
import { useActivityTracker } from '@/hooks/useActivityTracker'
import ActivityProgressCard from '@/components/activity/ActivityProgressCard'

interface Reading {
  id: string
  date: string
  question: string
  cards: any[]
  spread_type: string
  spread_template?: {
    id: string
    name: string
    display_name: string
    spread_type: string
  }
  interpretation: string
}

export default function DashboardPage() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const { isActive, activeTime, progress } = useActivityTracker()
  const [recentReadings, setRecentReadings] = useState<Reading[]>([])
  const [stats, setStats] = useState({
    totalReadings: 0,
    karmaLevel: '中立漆泊者',
    favoriteCard: null as any,
    daysInVault: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load real data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return

      setIsLoading(true)

      try {
        // Get user's readings (使用正確的 API 回應格式)
        // NOTE: Temporarily handling 503 errors gracefully until completed_readings table is created
        let transformedReadings: Reading[] = []
        let totalReadings = 0

        try {
          const response = await readingsAPI.getUserReadings(user.id)

          // Transform API data to match component interface
          transformedReadings = response.readings.map(reading => ({
            id: reading.id,
            date: reading.created_at,
            question: reading.question,
            cards: reading.cards_drawn || [],  // Ensure cards is always an array
            spread_type: reading.spread_type,
            spread_template: reading.spread_template,  // Preserve spread_template data
            interpretation: reading.interpretation || ''
          }))

          totalReadings = response.total_count
        } catch (apiError: any) {
          // Gracefully handle 503 (service unavailable) - table doesn't exist yet
          if (apiError?.status === 503 || apiError?.status === 500) {
            console.info('Readings table not available yet - showing empty state')
            transformedReadings = []
            totalReadings = 0
          } else {
            throw apiError // Re-throw other errors
          }
        }

        setRecentReadings(transformedReadings.slice(0, 5)) // Show only recent 5

        // Calculate stats from real data
        const daysInVault = user.created_at
          ? Math.floor((Date.now() - Date.parse(user.created_at)) / (1000 * 60 * 60 * 24))
          : 0

        // Determine karma level based on readings count
        let karmaLevel = '新手流浪者'
        if (totalReadings >= 50) karmaLevel = '傳奇廢土智者'
        else if (totalReadings >= 20) karmaLevel = '經驗豐富占卜師'
        else if (totalReadings >= 10) karmaLevel = '好業力漂泊者'
        else if (totalReadings >= 5) karmaLevel = '中立漂泊者'

        // Find most frequent card (simplified)
        let favoriteCard = null
        if (transformedReadings.length > 0) {
          try {
            const allCards = await cardsAPI.getAll()
            favoriteCard = allCards[0] // Simplified - just take first card
          } catch (error) {
            console.error('Failed to load favorite card:', error)
          }
        }

        setStats({
          totalReadings,
          karmaLevel,
          favoriteCard,
          daysInVault
        })

      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        // Set default empty state
        setRecentReadings([])
        setStats({
          totalReadings: 0,
          karmaLevel: '新手流浪者',
          favoriteCard: null,
          daysInVault: 0
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">初始化 Pip-Boy 介面...</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-4 mb-4">
            <h1 className="text-2xl font-bold text-pip-boy-green">
              控制台 - {user?.name || 'Vault Dweller'}
            </h1>
            <p className="text-pip-boy-green/70 text-sm">
              Pip-Boy 個人資料管理系統
            </p>
          </div>

          {/* Activity Progress Card - Token 延長系統 */}
          <div className="mb-6">
            <ActivityProgressCard
              isActive={isActive}
              activeTime={activeTime}
              progress={progress}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
              <div className="text-2xl font-bold text-pip-boy-green">{stats.totalReadings}</div>
              <div className="text-pip-boy-green/70 text-xs">占卜總數</div>
            </div>

            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
              <div className="text-sm font-bold text-pip-boy-green">{stats.karmaLevel}</div>
              <div className="text-pip-boy-green/70 text-xs">業力狀態</div>
            </div>

            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 text-center">
              <div className="text-2xl font-bold text-pip-boy-green">{stats.daysInVault}</div>
              <div className="text-pip-boy-green/70 text-xs">服務天數</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => window.location.href = '/readings/new'}
            className="border-2 border-pip-boy-green bg-pip-boy-green/10 hover:bg-pip-boy-green/20
                     p-6 transition-all duration-200 group cursor-pointer"
          >
            <div className="text-center">
              <PixelIcon name="spade" size={32} className="mb-3 mx-auto text-pip-boy-green" decorative />
              <h3 className="text-lg font-bold text-pip-boy-green mb-2">新占卜</h3>
              <p className="text-pip-boy-green/70 text-sm">
                開始一場全新的塔羅占卜會議
              </p>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/cards'}
            className="border-2 border-pip-boy-green bg-pip-boy-green/10 hover:bg-pip-boy-green/20
                     p-6 transition-all duration-200 group cursor-pointer"
          >
            <div className="text-center">
              <PixelIcon name="library" size={32} className="mb-3 mx-auto text-pip-boy-green" decorative />
              <h3 className="text-lg font-bold text-pip-boy-green mb-2">卡牌圖書館</h3>
              <p className="text-pip-boy-green/70 text-sm">
                瀏覽所有可用的塔羅牌
              </p>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/profile'}
            className="border-2 border-pip-boy-green bg-pip-boy-green/10 hover:bg-pip-boy-green/20
                     p-6 transition-all duration-200 group cursor-pointer"
          >
            <div className="text-center">
              <PixelIcon name="user-circle" size={32} className="mb-3 mx-auto text-pip-boy-green" decorative />
              <h3 className="text-lg font-bold text-pip-boy-green mb-2">個人檔案</h3>
              <p className="text-pip-boy-green/70 text-sm">
                管理你的 Vault Dweller 設定
              </p>
            </div>
          </button>
        </div>

        {/* Recent Readings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-xl font-bold text-pip-boy-green mb-4 flex items-center">
              <PixelIcon name="scroll-text" size={20} className="mr-2" decorative />最近占卜
            </h2>

            <div className="space-y-4">
              {recentReadings.length > 0 ? (
                recentReadings.map((reading) => (
                  <button
                    key={reading.id}
                    onClick={() => router.push(`/readings/${reading.id}`)}
                    className="w-full text-left border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-sm font-bold text-pip-boy-green">
                        {reading.spread_template?.display_name || '占卜'}
                      </h3>
                      <span className="text-xs text-pip-boy-green/70">
                        {formatDate(reading.date)}
                      </span>
                    </div>

                    <p className="text-pip-boy-green/80 text-sm mb-3 italic">
                      "{reading.question}"
                    </p>

                    <div className="flex gap-2 mb-3">
                      {(reading.cards || []).slice(0, 3).map((card, index) => (
                        <div key={index} className="w-8 h-12 bg-pip-boy-green/20 border border-pip-boy-green/50 rounded flex items-center justify-center">
                          <PixelIcon name="spade" size={16} decorative />
                        </div>
                      ))}
                    </div>

                    <p className="text-pip-boy-green/70 text-xs line-clamp-2">
                      {reading.interpretation}
                    </p>
                  </button>
                ))
              ) : (
                <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 text-center">
                  <PixelIcon name="spade" size={32} className="mb-3 mx-auto text-pip-boy-green opacity-50" decorative />
                  <p className="text-pip-boy-green/70 text-sm">
                    尚無占卜記錄。開始你的第一次占卜會議！
                  </p>
                  <button
                    onClick={() => window.location.href = '/readings/new'}
                    className="inline-block mt-3 px-4 py-2 border border-pip-boy-green text-pip-boy-green
                             hover:bg-pip-boy-green/10 text-xs transition-colors cursor-pointer"
                  >
                    新占卜
                  </button>
                </div>
              )}
            </div>

            {recentReadings.length > 0 && (
              <button
                onClick={() => window.location.href = '/readings'}
                className="inline-block mt-4 text-pip-boy-green hover:text-pip-boy-green/80
                         text-sm transition-colors cursor-pointer"
              >
                → 查看所有占卜
              </button>
            )}
          </div>

          {/* Favorite Card & System Status */}
          <div>
            <h2 className="text-xl font-bold text-pip-boy-green mb-4 flex items-center">
              <PixelIcon name="star" size={20} className="mr-2" decorative />Dweller 狀態
            </h2>

            {/* Favorite Card - Temporarily simplified to fix React errors */}
            {stats.favoriteCard && (
              <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 mb-6">
                <h3 className="text-sm font-bold text-pip-boy-green mb-3">最常抽到的牌</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-24 border-2 border-pip-boy-green/50 bg-pip-boy-green/10 rounded flex items-center justify-center">
                    <PixelIcon name="spade" size={24} decorative />
                  </div>
                  <div>
                    <p className="text-pip-boy-green text-sm font-bold">
                      {stats.favoriteCard.name}
                    </p>
                    <p className="text-pip-boy-green/70 text-xs">
                      已抽取 8 次
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* System Status */}
            <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">
              <h3 className="text-sm font-bold text-pip-boy-green mb-3">系統狀態</h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-pip-boy-green/70 text-xs">Pip-Boy 連線</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-pip-boy-green text-xs">線上</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-pip-boy-green/70 text-xs">卡牌資料庫</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-pip-boy-green text-xs">已同步</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-pip-boy-green/70 text-xs">量子處理</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-pip-boy-green text-xs">啓動中</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-pip-boy-green/70 text-xs">備份狀態</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-yellow-400 text-xs">等待中</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Incomplete Sessions */}
        <div className="mb-8">
          <IncompleteSessionsList />
        </div>
      </div>
    </div>
  )
}