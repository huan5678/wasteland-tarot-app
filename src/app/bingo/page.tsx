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
import NumberPickerModal from '@/components/bingo/NumberPickerModal'
import { PixelIcon } from '@/components/ui/icons'

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
  const { user, isInitialized } = useAuthStore()
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
    claimManualNumber,
    reset,
  } = useBingoStore()

  const [showRewardNotification, setShowRewardNotification] = useState(false)
  const [prevHasReward, setPrevHasReward] = useState(false)
  const [activeTab, setActiveTab] = useState<'game' | 'history'>('game')
  const [showNumberPicker, setShowNumberPicker] = useState(false)
  const [clickedNumber, setClickedNumber] = useState<number | null>(null)

  // 認證檢查
  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/auth/login')
    }
  }, [isInitialized, user, router])

  // 載入賓果狀態
  useEffect(() => {
    if (user) {
      fetchBingoStatus()
    }
  }, [user, fetchBingoStatus])

  // 監控獎勵狀態變化，顯示通知
  useEffect(() => {
    if (hasReward && !prevHasReward) {
      setShowRewardNotification(true)
    }
    setPrevHasReward(hasReward)
  }, [hasReward, prevHasReward])

  // 處理 BingoGrid 號碼點擊 - 彈出選號 modal
  const handleNumberClick = (number: number) => {
    setShowNumberPicker(true)
  }

  // 處理從 modal 選擇號碼
  const handleSelectNumber = async (number: number) => {
    await claimManualNumber(number)
    setShowNumberPicker(false)
  }

  // 計算已使用的號碼（已領取的號碼）
  const usedNumbers = claimedNumbers

  // 計算卡片上的所有號碼
  const cardNumbersSet = userCard ? new Set(userCard.flat()) : new Set<number>()

  // 處理重建賓果卡
  const handleRebuildCard = () => {
    // 重置 store 狀態，回到設定介面
    reset()
    clearError()
  }

  // 等待認證初始化
  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pip-boy-green mx-auto mb-4" />
          <p className="text-pip-boy-green">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-pip-boy-green tracking-wider mb-2">
              廢土賓果簽到
            </h1>
            <p className="text-terminal-green">
              每日簽到領取號碼，達成三連線獲得獎勵
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div>
        {/* 全域錯誤訊息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rust-red/20 border-2 border-rust-red rounded-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-radiation-orange font-bold mb-2">
                  <PixelIcon name="alert-triangle" sizePreset="sm" variant="error" decorative />
                  <span>錯誤</span>
                </div>
                <p className="text-radiation-orange">{error}</p>

                {/* 如果是資料庫狀態異常，提供重建選項 */}
                {error.includes('資料庫狀態異常') && (
                  <div className="mt-3 flex gap-2">
                    <motion.button
                      onClick={handleRebuildCard}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 bg-pip-boy-green text-black font-bold rounded hover:bg-pip-boy-green-bright transition-colors"
                    >
                      重新建立賓果卡
                    </motion.button>
                    <motion.button
                      onClick={() => fetchBingoStatus()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 bg-metal-gray text-white font-bold rounded hover:bg-metal-gray-light transition-colors border border-metal-gray-light"
                    >
                      重新載入
                    </motion.button>
                  </div>
                )}
              </div>
              <button
                onClick={clearError}
                className="text-radiation-orange hover:text-radiation-orange-bright font-bold flex-shrink-0"
              >
                <PixelIcon name="close" sizePreset="sm" decorative />
              </button>
            </div>
          </motion.div>
        )}

        {/* 載入狀態 */}
        {isLoading && !hasCard ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pip-boy-green mx-auto mb-4" />
            <p className="text-pip-boy-green">載入賓果狀態中...</p>
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
                  px-6 py-3 rounded-lg font-bold transition-all duration-200 flex items-center gap-2
                  ${activeTab === 'game'
                    ? 'bg-pip-boy-green border-2 border-pip-boy-green-bright text-black shadow-lg shadow-pip-boy-green/50'
                    : 'bg-metal-gray border-2 border-metal-gray-light text-wasteland-lighter hover:border-pip-boy-green/50'
                  }
                `}
              >
                <PixelIcon name="grid" sizePreset="sm" decorative />
                賓果遊戲
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`
                  px-6 py-3 rounded-lg font-bold transition-all duration-200 flex items-center gap-2
                  ${activeTab === 'history'
                    ? 'bg-pip-boy-green border-2 border-pip-boy-green-bright text-black shadow-lg shadow-pip-boy-green/50'
                    : 'bg-metal-gray border-2 border-metal-gray-light text-wasteland-lighter hover:border-pip-boy-green/50'
                  }
                `}
              >
                <PixelIcon name="history" sizePreset="sm" decorative />
                歷史記錄
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
                    {/* Debug 訊息：當 hasCard 為 true 但 userCard 為 null */}
                    {hasCard && !userCard && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rust-red/20 border-2 border-rust-red rounded-lg text-radiation-orange"
                      >
                        <div className="space-y-2">
                          <p className="font-bold flex items-center gap-2">
                            <PixelIcon name="alert-triangle" sizePreset="sm" variant="warning" decorative />
                            賓果卡載入異常
                          </p>
                          <p className="text-sm">檢測到賓果卡存在但資料未載入</p>
                          <div className="text-xs bg-black/50 p-2 rounded font-mono">
                            <p>hasCard: {String(hasCard)}</p>
                            <p>userCard: {String(userCard)}</p>
                            <p>isLoading: {String(isLoading)}</p>
                          </div>
                          <motion.button
                            onClick={() => fetchBingoStatus()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full mt-2 px-4 py-2 bg-pip-boy-green text-black font-bold rounded hover:bg-pip-boy-green-bright"
                          >
                            重新載入賓果卡
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {/* 正常顯示賓果卡 */}
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
                    className="p-6 bg-pip-boy-green/10 border-2 border-pip-boy-green rounded-lg text-center"
                  >
                    <p className="text-2xl font-bold text-pip-boy-green mb-2 flex items-center justify-center gap-2">
                      <PixelIcon name="trophy" sizePreset="md" variant="success" decorative />
                      本月已達成三連線！
                    </p>
                    <p className="text-terminal-green text-sm">
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

      {/* 數字選擇 Modal */}
      <NumberPickerModal
        isOpen={showNumberPicker}
        onClose={() => setShowNumberPicker(false)}
        onSelectNumber={handleSelectNumber}
        usedNumbers={usedNumbers}
        cardNumbers={cardNumbersSet}
      />

        {/* Footer */}
        <footer className="mt-12 md:mt-16">
          <div className="border-t-2 border-metal-gray pt-6">
            <div className="text-center text-wasteland-lighter text-sm">
              <p>每日簽到領取號碼 | 達成三連線獲得獎勵</p>
              <p className="mt-2 text-xs">
                系統每月1日自動重置 | 號碼每25天循環一次
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
