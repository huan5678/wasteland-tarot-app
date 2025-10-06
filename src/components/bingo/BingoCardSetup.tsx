'use client'

import { useBingoStore } from '@/lib/stores/bingoStore'
import { motion } from 'motion/react'
import { useState } from 'react'

/**
 * 賓果卡設定元件
 *
 * 功能:
 * - 顯示 1-25 號碼選擇器 (5x5 Grid)
 * - 點擊切換號碼選擇狀態
 * - 即時驗證與錯誤提示
 * - 提交建立賓果卡
 *
 * 設計風格: Fallout/Wasteland
 */
export default function BingoCardSetup() {
  const {
    selectedNumbers,
    validationError,
    isLoading,
    error,
    toggleNumber,
    clearSelection,
    createCard,
    canSubmitCard,
  } = useBingoStore()

  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * 處理號碼點擊
   */
  const handleNumberClick = (num: number) => {
    if (isLoading || isSubmitting) return
    toggleNumber(num)
  }

  /**
   * 處理提交
   */
  const handleSubmit = async () => {
    if (!canSubmitCard() || isLoading || isSubmitting) return

    setIsSubmitting(true)
    try {
      const numbers = Array.from(selectedNumbers).sort((a, b) => a - b)
      await createCard(numbers)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 處理清除選擇
   */
  const handleClearSelection = () => {
    if (isLoading || isSubmitting) return
    clearSelection()
  }

  /**
   * 自動填充隨機號碼
   */
  const handleAutoFill = () => {
    if (isLoading || isSubmitting) return

    // 清除現有選擇
    clearSelection()

    // 生成隨機號碼陣列
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1)

    // Fisher-Yates shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }

    // 選擇前 25 個號碼
    numbers.forEach(num => toggleNumber(num))
  }

  const selectedCount = selectedNumbers.size
  const canSubmit = canSubmitCard() && !isLoading && !isSubmitting

  return (
    <div className="max-w-4xl mx-auto p-6 bg-black/80 border-2 border-amber-600/50 rounded-lg backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-amber-400 mb-2 font-mono tracking-wider">
          設定你的賓果卡
        </h2>
        <p className="text-green-400 text-sm font-mono">
          選擇 25 個號碼 (1-25) 來建立你的廢土賓果卡
        </p>
        <div className="mt-3 text-amber-300 font-mono">
          已選擇: <span className="text-2xl font-bold">{selectedCount}</span> / 25
        </div>
      </div>

      {/* 錯誤訊息 */}
      {(validationError || error) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300 font-mono text-sm"
        >
          {validationError || error}
        </motion.div>
      )}

      {/* 號碼選擇器 Grid */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Array.from({ length: 25 }, (_, i) => i + 1).map(num => {
          const isSelected = selectedNumbers.has(num)

          return (
            <motion.button
              key={num}
              onClick={() => handleNumberClick(num)}
              disabled={isLoading || isSubmitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative aspect-square rounded-lg font-mono text-2xl font-bold
                transition-all duration-200 border-2
                ${isSelected
                  ? 'bg-amber-600 border-amber-400 text-black shadow-lg shadow-amber-600/50'
                  : 'bg-gray-800/80 border-gray-600 text-gray-400 hover:border-amber-600/50 hover:text-amber-400'
                }
                ${(isLoading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                disabled:pointer-events-none
              `}
            >
              {num}

              {/* 選中標記 */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full"
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 自動填充按鈕 */}
        <motion.button
          onClick={handleAutoFill}
          disabled={isLoading || isSubmitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            flex-1 px-6 py-3 rounded-lg font-mono font-bold
            bg-blue-900/50 border-2 border-blue-600 text-blue-300
            hover:bg-blue-800/50 hover:border-blue-400
            transition-all duration-200
            ${(isLoading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}
            disabled:pointer-events-none
          `}
        >
          🎲 隨機填充
        </motion.button>

        {/* 清除選擇按鈕 */}
        <motion.button
          onClick={handleClearSelection}
          disabled={isLoading || isSubmitting || selectedCount === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            flex-1 px-6 py-3 rounded-lg font-mono font-bold
            bg-red-900/50 border-2 border-red-600 text-red-300
            hover:bg-red-800/50 hover:border-red-400
            transition-all duration-200
            ${(isLoading || isSubmitting || selectedCount === 0) ? 'opacity-50 cursor-not-allowed' : ''}
            disabled:pointer-events-none
          `}
        >
          🗑️ 清除
        </motion.button>

        {/* 提交按鈕 */}
        <motion.button
          onClick={handleSubmit}
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          className={`
            flex-1 px-6 py-3 rounded-lg font-mono font-bold text-lg
            transition-all duration-200
            ${canSubmit
              ? 'bg-green-600 border-2 border-green-400 text-black hover:bg-green-500 shadow-lg shadow-green-600/50'
              : 'bg-gray-700 border-2 border-gray-600 text-gray-500 cursor-not-allowed'
            }
            disabled:pointer-events-none
          `}
        >
          {isSubmitting ? '建立中...' : '✓ 確認建立'}
        </motion.button>
      </div>

      {/* 說明文字 */}
      <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded text-gray-400 text-sm font-mono">
        <p className="mb-2">💡 <span className="text-amber-400">提示:</span></p>
        <ul className="list-disc list-inside space-y-1">
          <li>點擊號碼來選擇或取消選擇</li>
          <li>使用「隨機填充」快速生成隨機賓果卡</li>
          <li>每月只能建立一張賓果卡，請謹慎選擇</li>
          <li>建立後將無法修改，請確認後再提交</li>
        </ul>
      </div>
    </div>
  )
}
