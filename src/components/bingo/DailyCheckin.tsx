'use client'

import { useBingoStore } from '@/lib/stores/bingoStore'
import { motion } from 'motion/react'
import { useState } from 'react'

/**
 * 每日簽到元件
 *
 * 功能:
 * - 顯示今日系統號碼
 * - 提供「領取今日號碼」按鈕
 * - 處理已領取狀態
 * - 領取成功後觸發動畫與音效
 *
 * 設計風格: Fallout/Wasteland
 */
export default function DailyCheckin() {
  const {
    dailyNumber,
    hasClaimed,
    isLoading,
    error,
    claimDailyNumber,
  } = useBingoStore()

  const [isClaiming, setIsClaiming] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  /**
   * 處理領取號碼
   */
  const handleClaim = async () => {
    if (hasClaimed || isClaiming || isLoading || dailyNumber === null) return

    setIsClaiming(true)
    try {
      await claimDailyNumber()
      setShowSuccess(true)

      // 3秒後隱藏成功訊息
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('領取號碼失敗:', err)
    } finally {
      setIsClaiming(false)
    }
  }

  // 如果沒有今日號碼，顯示載入或錯誤狀態
  if (dailyNumber === null) {
    return (
      <div className="max-w-md mx-auto p-6 bg-black/80 border-2 border-gray-600 rounded-lg backdrop-blur-sm text-center">
        <p className="text-gray-400 font-mono">
          {isLoading ? '載入今日號碼中...' : '今日號碼尚未生成'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* 今日號碼顯示 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 bg-black/80 border-2 border-amber-600/50 rounded-lg backdrop-blur-sm"
      >
        {/* 標題 */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-amber-400 font-mono tracking-wider">
            今日廢土號碼
          </h3>
          <p className="text-green-400 text-sm font-mono mt-1">
            {new Date().toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* 號碼顯示 */}
        <motion.div
          animate={{
            scale: hasClaimed ? 1 : [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: hasClaimed ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          className={`
            relative mx-auto w-32 h-32 rounded-full
            flex items-center justify-center
            text-6xl font-bold font-mono
            border-4
            ${hasClaimed
              ? 'bg-green-600 border-green-400 text-black shadow-lg shadow-green-600/50'
              : 'bg-amber-600 border-amber-400 text-black shadow-lg shadow-amber-600/50'
            }
          `}
        >
          {dailyNumber}

          {/* 已領取勾選標記 */}
          {hasClaimed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="absolute top-0 right-0 w-10 h-10 bg-green-400 rounded-full flex items-center justify-center border-2 border-green-600"
            >
              <span className="text-2xl">✓</span>
            </motion.div>
          )}
        </motion.div>

        {/* 領取按鈕 */}
        <div className="mt-6">
          {hasClaimed ? (
            <div className="text-center p-3 bg-green-900/30 border border-green-600 rounded-lg">
              <p className="text-green-400 font-mono text-sm">
                ✓ 今日號碼已領取
              </p>
              <p className="text-green-500 font-mono text-xs mt-1">
                明天再來領取新號碼吧！
              </p>
            </div>
          ) : (
            <motion.button
              onClick={handleClaim}
              disabled={isClaiming || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full px-6 py-4 rounded-lg font-mono font-bold text-lg
                transition-all duration-200
                ${isClaiming || isLoading
                  ? 'bg-gray-700 border-2 border-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 border-2 border-green-400 text-black hover:bg-green-500 shadow-lg shadow-green-600/50'
                }
                disabled:pointer-events-none
              `}
            >
              {isClaiming ? '領取中...' : '🎁 領取今日號碼'}
            </motion.button>
          )}
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300 font-mono text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* 成功訊息 */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-4 p-3 bg-green-900/50 border border-green-600 rounded text-green-300 font-mono text-sm text-center"
          >
            🎉 領取成功！號碼已加入你的賓果卡
          </motion.div>
        )}

        {/* 說明文字 */}
        <div className="mt-4 p-3 bg-gray-900/50 border border-gray-700 rounded text-gray-400 text-xs font-mono">
          <p className="mb-1">💡 <span className="text-amber-400">提示:</span></p>
          <ul className="list-disc list-inside space-y-1">
            <li>每天只能領取一次號碼</li>
            <li>領取後自動檢查是否連線</li>
            <li>達成三連線可獲得獎勵</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
