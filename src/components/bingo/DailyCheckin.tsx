'use client'

import { useBingoStore } from '@/lib/stores/bingoStore'
import { motion } from 'motion/react'
import { useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'

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
    lineCount,
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

  /**
   * 超過 25 日時顯示 Fallout 風格的結束訊息
   *
   * 計算邏輯：
   * - 取得當前日期
   * - 計算距離下個月 1 日還有幾天
   * - 顯示本月達成的線數
   */
  if (dailyNumber === null) {
    // 如果正在載入，顯示載入畫面
    if (isLoading) {
      return (
        <div className="max-w-md mx-auto p-6 bg-black/80 border-2 border-metal-gray-light rounded-lg backdrop-blur-sm text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pip-boy-green mx-auto mb-2" />
          <p className="text-wasteland-lighter">載入今日號碼中...</p>
        </div>
      )
    }

    // 計算倒數天數（到下個月 1 日）
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // 下個月 1 日
    const nextMonth = new Date(currentYear, currentMonth + 1, 1)
    const daysUntilNextMonth = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Fallout 風格的結束訊息
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md mx-auto"
      >
        <div className="p-6 bg-black/80 border-2 border-radiation-orange/50 rounded-lg backdrop-blur-sm">
          {/* 標題 */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PixelIcon name="alert-triangle" sizePreset="md" variant="warning" decorative />
              <h3 className="text-xl font-bold text-radiation-orange tracking-wider">
                輻射讀數已達上限
              </h3>
            </div>
            <p className="text-metal-gray-light text-sm">
              Pip-Boy 避難所系統正在重新校準
            </p>
          </div>

          {/* 主要訊息區塊 */}
          <div className="bg-wasteland-dark/50 border border-radiation-orange/30 rounded p-4 mb-4">
            <div className="text-center space-y-3">
              {/* 倒數計時器 */}
              <div>
                <div className="text-5xl font-bold text-pip-boy-green mb-2 text-glow-green">
                  {daysUntilNextMonth}
                </div>
                <div className="text-pip-boy-green/70 text-sm">
                  天後系統重置
                </div>
              </div>

              {/* 分隔線 */}
              <div className="h-px bg-metal-gray-light/30 my-3" />

              {/* 本月成績 */}
              <div>
                <div className="text-sm text-wasteland-lighter mb-1 flex items-center justify-center gap-2">
                  <PixelIcon name="trophy" sizePreset="xs" variant="primary" decorative />
                  本月廢土探索成果
                </div>
                <div className="text-3xl font-bold text-pip-boy-green">
                  {lineCount} 條線
                </div>
                {lineCount >= 3 && (
                  <div className="mt-2 text-xs text-green-400 flex items-center justify-center gap-1">
                    <PixelIcon name="check-circle" size={12} variant="success" decorative />
                    已達成本月目標！
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fallout 風格的狀態訊息 */}
          <div className="bg-pip-boy-green/5 border border-pip-boy-green/30 rounded p-3 text-xs text-pip-boy-green/80 space-y-2">
            <div className="flex items-start gap-2">
              <PixelIcon name="info" size={12} variant="info" decorative />
              <div>
                <p className="font-bold text-pip-boy-green mb-1">系統狀態報告：</p>
                <ul className="space-y-1 text-pip-boy-green/70">
                  <li>→ 本月賓果號碼週期已結束</li>
                  <li>→ 避難所資料庫正在進行月度維護</li>
                  <li>→ 下個月 1 日將啟動新的號碼生成程序</li>
                  <li>→ 請在輻射冷卻期間檢查你的裝備</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 廢土生存者的黑色幽默 */}
          <div className="mt-4 text-center text-xs text-wasteland-lighter/60 italic">
            "在廢土上，等待也是一種生存技能。" - Vault-Tec 生存手冊
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      {/* 今日號碼顯示 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 bg-black/80 border-2 border-pip-boy-green/50 rounded-lg backdrop-blur-sm"
      >
        {/* 標題 */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-pip-boy-green tracking-wider">
            今日廢土號碼
          </h3>
          <p className="text-green-400 text-sm mt-1">
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
            text-6xl font-bold
            border-4
            ${hasClaimed
              ? 'bg-green-600 border-green-400 text-black shadow-lg shadow-green-600/50'
              : 'bg-pip-boy-green border-pip-boy-green-bright text-black shadow-lg shadow-pip-boy-green/50'
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
              <PixelIcon name="check" sizePreset="sm" className="text-black" decorative />
            </motion.div>
          )}
        </motion.div>

        {/* 領取按鈕 */}
        <div className="mt-6">
          {hasClaimed ? (
            <div className="text-center p-3 bg-green-900/30 border border-green-600 rounded-lg">
              <p className="text-green-400 text-sm flex items-center justify-center gap-2">
                <PixelIcon name="check" sizePreset="xs" variant="success" decorative />
                今日號碼已領取
              </p>
              <p className="text-green-500 text-xs mt-1">
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
                w-full px-6 py-4 rounded-lg font-bold text-lg
                transition-all duration-200
                ${isClaiming || isLoading
                  ? 'bg-metal-gray border-2 border-metal-gray-light text-wasteland-light cursor-not-allowed'
                  : 'bg-green-600 border-2 border-green-400 text-black hover:bg-green-500 shadow-lg shadow-green-600/50'
                }
                disabled:pointer-events-none
              `}
            >
              {isClaiming ? (
                <>
                  <PixelIcon name="loader" sizePreset="sm" animation="spin" decorative />
                  領取中...
                </>
              ) : (
                <>
                  <PixelIcon name="gift" sizePreset="sm" decorative />
                  領取今日號碼
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300 text-sm"
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
            className="mt-4 p-3 bg-green-900/50 border border-green-600 rounded text-green-300 text-sm text-center flex items-center justify-center gap-2"
          >
            <PixelIcon name="gift" sizePreset="xs" variant="success" decorative />
            領取成功！號碼已加入你的賓果卡
          </motion.div>
        )}

        {/* 說明文字 */}
        <div className="mt-4 p-3 bg-wasteland-dark/50 border border-metal-gray-light rounded text-wasteland-lighter text-xs">
          <p className="mb-1 flex items-center gap-1">
            <PixelIcon name="info" size={12} variant="info" decorative />
            <span className="text-pip-boy-green">提示:</span>
          </p>
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
