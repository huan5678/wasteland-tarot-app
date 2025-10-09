'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { useBingoStore } from '@/lib/stores/bingoStore'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

// Bingo components
import BingoCardSetup from '@/components/bingo/BingoCardSetup'
import BingoGrid from '@/components/bingo/BingoGrid'
import DailyCheckin from '@/components/bingo/DailyCheckin'
import LineIndicator from '@/components/bingo/LineIndicator'
import RewardNotification from '@/components/bingo/RewardNotification'
import BingoHistory from '@/components/bingo/BingoHistory'

/**
 * 賓果遊戲主頁面
 *
 * 功能:
 * - JWT 認證保護
 * - 根據狀態顯示不同介面 (設定卡片 vs 遊戲介面)
 * - 整合所有賓果元件
 * - Responsive 佈局
 *
 * 設計風格: Fallout/Wasteland
 */
export default function BingoPage() {
  const router = useRouter()
  const { user, token, isInitialized } = useAuthStore()
  const {
    hasCard,
    userCard,
    dailyNumber,
    claimedNumbers,
    lineCount,
    hasReward,
    isLoading,
    error,
    fetchBingoStatus,
    clearError,
  } = useBingoStore()

  const [showRewardNotification, setShowRewardNotification] = useState(false)
  const [prevHasReward, setPrevHasReward] = useState(false)
  const [activeTab, setActiveTab] = useState<'game' | 'history'>('game')

  // 認證檢查
  useEffect(() => {
    if (isInitialized && !token) {
      router.push('/auth/login')
    }
  }, [isInitialized, token, router])

  // 載入賓果狀態
  useEffect(() => {
    if (token) {
      fetchBingoStatus()
    }
  }, [token, fetchBingoStatus])

  // 監控獎勵狀態變化，顯示通知
  useEffect(() => {
    if (hasReward && !prevHasReward) {
      setShowRewardNotification(true)
    }
    setPrevHasReward(hasReward)
  }, [hasReward, prevHasReward])

  // 等待認證初始化
  if (!isInitialized || !token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4" />
          <p className="text-amber-400 font-mono">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-black border-b-2 border-amber-600/50">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-amber-400 font-mono tracking-wider mb-2">
              廢土賓果簽到
            </h1>
            <p className="text-green-400 font-mono">
              每日簽到領取號碼，達成三連線獲得獎勵
            </p>
            {user && (
              <p className="text-gray-400 font-mono text-sm mt-2">
                歡迎回來, <span className="text-amber-400">{user.username}</span>
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* 全域錯誤訊息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-900/50 border-2 border-red-600 rounded-lg text-red-300 font-mono"
          >
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300 font-bold"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {/* 載入狀態 */}
        {isLoading && !hasCard ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-4" />
            <p className="text-amber-400 font-mono">載入賓果狀態中...</p>
          </div>
        ) : !hasCard ? (
          /* 賓果卡設定介面 */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BingoCardSetup />
          </motion.div>
        ) : (
          /* 賓果遊戲介面 */
          <>
            {/* Tab Navigation */}
            <div className="flex justify-center mb-6 gap-4">
              <button
                onClick={() => setActiveTab('game')}
                className={`
                  px-6 py-3 rounded-lg font-mono font-bold transition-all duration-200
                  ${activeTab === 'game'
                    ? 'bg-amber-600 border-2 border-amber-400 text-black'
                    : 'bg-gray-800 border-2 border-gray-600 text-gray-400 hover:border-amber-600/50'
                  }
                `}
              >
                🎲 賓果遊戲
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`
                  px-6 py-3 rounded-lg font-mono font-bold transition-all duration-200
                  ${activeTab === 'history'
                    ? 'bg-amber-600 border-2 border-amber-400 text-black'
                    : 'bg-gray-800 border-2 border-gray-600 text-gray-400 hover:border-amber-600/50'
                  }
                `}
              >
                📜 歷史記錄
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'game' ? (
              <motion.div
                key="game"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* 遊戲區塊 - Desktop 2 column, Mobile 1 column */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 左側: 賓果卡 */}
                  <div>
                    {userCard && (
                      <BingoGrid
                        card={userCard}
                        claimedNumbers={claimedNumbers}
                        highlightNumber={dailyNumber ?? undefined}
                      />
                    )}
                  </div>

                  {/* 右側: 簽到 & 連線指示器 */}
                  <div className="space-y-6">
                    <DailyCheckin />
                    <LineIndicator />
                  </div>
                </div>

                {/* 獎勵狀態提示 */}
                {hasReward && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 bg-green-900/30 border-2 border-green-600 rounded-lg text-center"
                  >
                    <p className="text-2xl font-bold text-green-400 font-mono mb-2">
                      🏆 本月已達成三連線！
                    </p>
                    <p className="text-green-500 font-mono text-sm">
                      獎勵已發放，下個月可以繼續挑戰
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              /* 歷史記錄 Tab */
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <BingoHistory />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* 獎勵通知 Modal */}
      <RewardNotification
        show={showRewardNotification}
        onClose={() => setShowRewardNotification(false)}
        rewardDetails={{
          type: '廢土幣',
          amount: 100,
          description: '達成本月三連線獎勵',
        }}
      />

      {/* Footer */}
      <div className="mt-12 py-6 border-t-2 border-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500 font-mono text-sm">
            <p>每日簽到領取號碼 | 達成三連線獲得獎勵</p>
            <p className="mt-2 text-xs">
              系統每月1日自動重置 | 號碼每25天循環一次
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
