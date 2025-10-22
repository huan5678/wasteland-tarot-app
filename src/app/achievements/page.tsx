'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { useAchievementStore, AchievementCategory } from '@/lib/stores/achievementStore'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { PixelIcon } from '@/components/ui/icons'
import {
  AchievementCategoryFilter,
  AchievementGrid,
} from '@/components/achievements'

/**
 * 成就系統主頁面
 *
 * 功能:
 * - JWT 認證保護
 * - 成就類別篩選
 * - 成就進度展示
 * - 成就獎勵領取
 * - 統計總覽
 *
 * 設計風格: Fallout/Wasteland
 */
export default function AchievementsPage() {
  const router = useRouter()
  const { user, token, isInitialized } = useAuthStore()
  const {
    userProgress,
    summary,
    currentFilter,
    isLoading,
    error,
    isClaiming,
    fetchUserProgress,
    fetchSummary,
    setFilter,
    claimReward,
    clearError,
  } = useAchievementStore()

  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)

  // 認證檢查
  useEffect(() => {
    if (isInitialized && !token) {
      router.push('/auth/login')
    }
  }, [isInitialized, token, router])

  // 載入成就資料
  useEffect(() => {
    if (token) {
      fetchUserProgress()
      fetchSummary()
    }
  }, [token, fetchUserProgress, fetchSummary])

  // 處理類別篩選變更
  const handleFilterChange = (category: AchievementCategory | null) => {
    setFilter(category)
  }

  // 處理領取獎勵
  const handleClaimReward = async (code: string) => {
    const result = await claimReward(code)
    if (result) {
      setShowSuccessMessage(result.message)
      setTimeout(() => setShowSuccessMessage(null), 3000)
    }
  }

  // 等待認證初始化
  if (!isInitialized || !token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pip-boy-green mx-auto mb-4" />
          <p className="text-pip-boy-green">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-black border-b-2 border-pip-boy-green/50">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <PixelIcon
                name="trophy"
                sizePreset="xl"
                variant="primary"
                animation="bounce"
                decorative
              />
              <h1 className="text-4xl md:text-5xl font-bold text-pip-boy-green tracking-wider">
                廢土成就
              </h1>
            </div>
            <p className="text-green-400 mb-4">
              探索廢土，完成挑戰，解鎖成就，獲得獎勵
            </p>
            {user && (
              <p className="text-gray-400 text-sm">
                歡迎回來, <span className="text-pip-boy-green">{user.name}</span>
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* 統計總覽 */}
      {summary && (
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {/* 總成就數 */}
            <div className="card-wasteland p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <PixelIcon name="apps" sizePreset="md" variant="primary" decorative />
              </div>
              <div className="text-2xl font-bold text-pip-boy-green">
                {summary.total_achievements}
              </div>
              <div className="text-xs text-text-secondary mt-1">總成就</div>
            </div>

            {/* 已解鎖 */}
            <div className="card-wasteland p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <PixelIcon name="unlock" sizePreset="md" variant="success" decorative />
              </div>
              <div className="text-2xl font-bold text-green-400">
                {summary.unlocked_count}
              </div>
              <div className="text-xs text-text-secondary mt-1">已解鎖</div>
            </div>

            {/* 已領取 */}
            <div className="card-wasteland p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <PixelIcon name="check-circle" sizePreset="md" variant="info" decorative />
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {summary.claimed_count}
              </div>
              <div className="text-xs text-text-secondary mt-1">已領取</div>
            </div>

            {/* 完成度 */}
            <div className="card-wasteland p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <PixelIcon name="chart" sizePreset="md" variant="warning" decorative />
              </div>
              <div className="text-2xl font-bold text-yellow-400">
                {summary.completion_percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-text-secondary mt-1">完成度</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 類別篩選 */}
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AchievementCategoryFilter
            currentFilter={currentFilter}
            onFilterChange={handleFilterChange}
          />
        </motion.div>
      </div>

      {/* 成就網格 */}
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <PixelIcon
                  name="loader"
                  sizePreset="xl"
                  variant="primary"
                  animation="spin"
                  decorative
                />
                <p className="text-pip-boy-green mt-4">載入成就資料中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="card-wasteland p-8 text-center">
              <PixelIcon
                name="alert-triangle"
                sizePreset="xl"
                variant="error"
                animation="wiggle"
                className="mx-auto mb-4"
                decorative
              />
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                載入失敗
              </h3>
              <p className="text-text-secondary mb-4">{error}</p>
              <button
                onClick={() => {
                  clearError()
                  fetchUserProgress()
                }}
                className="px-4 py-2 bg-pip-boy-green/20 border border-pip-boy-green rounded hover:bg-pip-boy-green/30 transition-colors"
              >
                <PixelIcon name="refresh-cw" sizePreset="xs" decorative />
                <span className="ml-2">重試</span>
              </button>
            </div>
          ) : (
            <AchievementGrid
              achievements={userProgress}
              onClaim={handleClaimReward}
              isClaiming={isClaiming}
            />
          )}
        </motion.div>
      </div>

      {/* 成功訊息提示 */}
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="card-wasteland p-4 shadow-[0_0_20px_rgba(0,255,136,0.5)] border-pip-boy-green">
            <div className="flex items-center gap-3">
              <PixelIcon name="check-circle" sizePreset="md" variant="success" decorative />
              <p className="text-pip-boy-green font-semibold">
                {showSuccessMessage}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
