'use client'

import { useBingoStore, BingoHistoryRecord } from '@/lib/stores/bingoStore'
import { motion } from 'motion/react'
import { useState } from 'react'
import BingoGrid from './BingoGrid'

/**
 * 賓果歷史查詢元件
 *
 * 功能:
 * - 月份選擇器 (YYYY-MM 格式)
 * - 查詢歷史記錄按鈕
 * - 顯示歷史賓果卡
 * - 顯示已領取號碼、連線數、獎勵狀態
 *
 * 設計風格: Fallout/Wasteland
 */
export default function BingoHistory() {
  const { fetchHistory, isLoading } = useBingoStore()

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // 預設為上個月
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
  })

  const [historyData, setHistoryData] = useState<BingoHistoryRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasQueried, setHasQueried] = useState(false)

  /**
   * 生成可選月份列表 (最近12個月)
   */
  const generateMonthOptions = (): string[] => {
    const options: string[] = []
    const now = new Date()

    for (let i = 1; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      options.push(yearMonth)
    }

    return options
  }

  /**
   * 處理查詢
   */
  const handleQuery = async () => {
    if (isLoading) return

    setError(null)
    setHasQueried(true)

    try {
      const result = await fetchHistory(selectedMonth)

      if (result) {
        setHistoryData(result)
      } else {
        setHistoryData(null)
        setError('該月份沒有賓果記錄')
      }
    } catch (err: any) {
      setHistoryData(null)
      setError(err.message || '查詢失敗')
    }
  }

  /**
   * 格式化月份顯示
   */
  const formatMonthDisplay = (yearMonth: string): string => {
    const [year, month] = yearMonth.split('-')
    return `${year}年${parseInt(month)}月`
  }

  const monthOptions = generateMonthOptions()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-6 bg-black/80 border-2 border-pip-boy-green/50 rounded-lg backdrop-blur-sm">
        {/* 標題 */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-pip-boy-green tracking-wider">
            歷史記錄查詢
          </h3>
          <p className="text-green-400 text-sm mt-1">
            查看過去的賓果遊戲記錄
          </p>
        </div>

        {/* 查詢控制 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* 月份選擇器 */}
          <div className="flex-1">
            <label className="block text-sm text-wasteland-lighter mb-2">
              選擇月份
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-wasteland-dark border-2 border-metal-gray-light rounded-lg text-pip-boy-green focus:border-pip-boy-green focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatMonthDisplay(month)}
                </option>
              ))}
            </select>
          </div>

          {/* 查詢按鈕 */}
          <div className="flex items-end">
            <motion.button
              onClick={handleQuery}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-lg
                transition-all duration-200
                ${isLoading
                  ? 'bg-metal-gray border-2 border-metal-gray-light text-wasteland-light cursor-not-allowed'
                  : 'bg-pip-boy-green border-2 border-pip-boy-green-bright text-black hover:bg-amber-500 shadow-lg shadow-pip-boy-green/50'
                }
                disabled:pointer-events-none
              `}
            >
              {isLoading ? '查詢中...' : '🔍 查詢'}
            </motion.button>
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* 歷史記錄顯示 */}
        {hasQueried && historyData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* 統計資訊 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 月份 */}
              <div className="p-4 bg-wasteland-dark/50 border border-metal-gray-light rounded-lg text-center">
                <p className="text-xs text-wasteland-lighter mb-1">月份</p>
                <p className="text-lg font-bold text-pip-boy-green">
                  {formatMonthDisplay(historyData.month_year)}
                </p>
              </div>

              {/* 連線數 */}
              <div className="p-4 bg-wasteland-dark/50 border border-metal-gray-light rounded-lg text-center">
                <p className="text-xs text-wasteland-lighter mb-1">連線數</p>
                <p className="text-2xl font-bold text-green-400">
                  {historyData.line_count}
                </p>
              </div>

              {/* 獎勵狀態 */}
              <div className="p-4 bg-wasteland-dark/50 border border-metal-gray-light rounded-lg text-center">
                <p className="text-xs text-wasteland-lighter mb-1">獎勵狀態</p>
                <p className={`text-lg font-bold ${historyData.has_reward ? 'text-green-400' : 'text-wasteland-light'}`}>
                  {historyData.has_reward ? '✓ 已獲得' : '✗ 未達成'}
                </p>
              </div>
            </div>

            {/* 歷史賓果卡 */}
            <div>
              <h4 className="text-lg font-bold text-pip-boy-green mb-3">
                賓果卡
              </h4>
              <BingoGrid
                card={historyData.card_data}
                claimedNumbers={new Set(historyData.claimed_numbers)}
              />
            </div>

            {/* 已領取號碼列表 */}
            <div>
              <h4 className="text-lg font-bold text-pip-boy-green mb-3">
                已領取號碼 ({historyData.claimed_numbers.length} 個)
              </h4>
              <div className="p-4 bg-wasteland-dark/50 border border-metal-gray-light rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {historyData.claimed_numbers.length > 0 ? (
                    historyData.claimed_numbers.sort((a, b) => a - b).map((num) => (
                      <span
                        key={num}
                        className="px-3 py-1 bg-green-600 border border-green-400 rounded font-bold text-black"
                      >
                        {num}
                      </span>
                    ))
                  ) : (
                    <p className="text-wasteland-lighter text-sm">
                      該月份沒有領取任何號碼
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 建立時間 */}
            <div className="text-center text-xs text-wasteland-light">
              賓果卡建立於: {new Date(historyData.created_at).toLocaleString('zh-TW')}
            </div>
          </motion.div>
        ) : hasQueried && !historyData && !error ? (
          <div className="text-center p-8 bg-wasteland-dark/50 border border-metal-gray-light rounded-lg">
            <p className="text-wasteland-lighter text-sm">
              沒有找到該月份的記錄
            </p>
          </div>
        ) : !hasQueried ? (
          <div className="text-center p-8 bg-wasteland-dark/50 border border-metal-gray-light rounded-lg">
            <p className="text-wasteland-lighter text-sm">
              選擇月份後點擊查詢按鈕
            </p>
          </div>
        ) : null}

        {/* 說明文字 */}
        <div className="mt-6 p-4 bg-wasteland-dark/50 border border-metal-gray-light rounded text-wasteland-lighter text-xs">
          <p className="mb-2">💡 <span className="text-pip-boy-green">說明:</span></p>
          <ul className="list-disc list-inside space-y-1">
            <li>僅顯示最近 12 個月的歷史記錄</li>
            <li>歷史記錄每月自動歸檔</li>
            <li>可以查看過往的賓果卡與領取記錄</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
