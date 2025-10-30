'use client'

import { useBingoStore } from '@/lib/stores/bingoStore'
import { motion } from 'motion/react'
import { useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'

/**
 * 賓果卡設定元件 - 全新 Grid 佈局設計
 *
 * 功能:
 * - 顯示 5x5 空白 Grid，使用者點擊每個格子選擇數字
 * - 每個格子可以選擇 1-25 的任一數字
 * - 即時驗證與錯誤提示
 * - 提交建立賓果卡
 *
 * 設計風格: Fallout/Wasteland
 */
export default function BingoCardSetup() {
  const {
    validationError,
    isLoading,
    error,
    createCard,
  } = useBingoStore()

  // 5x5 Grid 狀態 (初始為空，值為 null)
  const [gridNumbers, setGridNumbers] = useState<(number | null)[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(null))
  )

  // 目前選擇的 cell 位置 (用於彈窗選擇數字)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  /**
   * 處理 Grid Cell 點擊
   */
  const handleCellClick = (row: number, col: number) => {
    if (isLoading || isSubmitting) return
    setSelectedCell({ row, col })
    setLocalError(null)
  }

  /**
   * 處理數字選擇
   */
  const handleNumberSelect = (num: number) => {
    if (!selectedCell) return

    const { row, col } = selectedCell

    // 檢查這個數字是否已經被使用
    const isNumberUsed = gridNumbers.some(row => row.includes(num))
    if (isNumberUsed) {
      setLocalError(`數字 ${num} 已經被使用了！`)
      return
    }

    // 更新 grid
    const newGrid = gridNumbers.map((r, rIndex) =>
      rIndex === row
        ? r.map((c, cIndex) => (cIndex === col ? num : c))
        : r
    )
    setGridNumbers(newGrid)
    setSelectedCell(null)
    setLocalError(null)
  }

  /**
   * 移除 Cell 中的數字
   */
  const handleClearCell = (row: number, col: number) => {
    if (isLoading || isSubmitting) return

    const newGrid = gridNumbers.map((r, rIndex) =>
      rIndex === row
        ? r.map((c, cIndex) => (cIndex === col ? null : c))
        : r
    )
    setGridNumbers(newGrid)
    setLocalError(null)
  }

  /**
   * 處理提交
   */
  const handleSubmit = async () => {
    if (isLoading || isSubmitting) return

    // 驗證所有格子都已填入數字
    const flatGrid = gridNumbers.flat()
    const filledCount = flatGrid.filter(n => n !== null).length

    if (filledCount < 25) {
      setLocalError(`還有 ${25 - filledCount} 個格子未填入數字！`)
      return
    }

    // 驗證所有數字都不重複（應該不會發生，但還是檢查一下）
    const uniqueNumbers = new Set(flatGrid.filter(n => n !== null))
    if (uniqueNumbers.size !== 25) {
      setLocalError('數字有重複，請檢查！')
      return
    }

    setIsSubmitting(true)
    try {
      // 將 5x5 grid 展平為一維陣列 (row by row)
      const numbers = flatGrid as number[]
      await createCard(numbers)
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 處理清除 Grid
   */
  const handleClearGrid = () => {
    if (isLoading || isSubmitting) return
    setGridNumbers(Array.from({ length: 5 }, () => Array(5).fill(null)))
    setLocalError(null)
  }

  /**
   * 自動填充隨機號碼
   */
  const handleAutoFill = () => {
    if (isLoading || isSubmitting) return

    // 生成隨機號碼陣列
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1)

    // Fisher-Yates shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]]
    }

    // 填充到 5x5 grid
    const newGrid = Array.from({ length: 5 }, (_, row) =>
      Array.from({ length: 5 }, (_, col) => numbers[row * 5 + col])
    )
    setGridNumbers(newGrid)
    setLocalError(null)
  }

  const filledCount = gridNumbers.flat().filter(n => n !== null).length
  const canSubmit = filledCount === 25 && !isLoading && !isSubmitting

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6 text-center"
      >
        <h2 className="text-3xl font-bold text-pip-boy-green mb-2 tracking-wider">
          設定你的賓果卡
        </h2>
        <p className="text-terminal-green text-sm">
          點擊格子選擇 1-25 的號碼，排列出你獨一無二的廢土賓果卡
        </p>
        <div className="mt-3 text-pip-boy-green-dark">
          已填入: <span className="text-2xl font-bold text-pip-boy-green">{filledCount}</span> / 25
        </div>
      </motion.div>

      {/* 錯誤訊息 */}
      {(localError || validationError || error) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-rust-red/20 border-2 border-rust-red rounded text-radiation-orange text-sm flex items-center gap-2"
        >
          <PixelIcon name="alert-triangle" sizePreset="sm" variant="error" decorative />
          {localError || validationError || error}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 5x5 賓果卡 Grid */}
        <div className="lg:col-span-2">
          <div className="p-6 bg-wasteland-dark/80 border-2 border-pip-boy-green/50 rounded-lg backdrop-blur-sm">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {gridNumbers.map((row, rowIndex) =>
                row.map((num, colIndex) => (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={isLoading || isSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative aspect-square rounded-lg text-2xl sm:text-3xl font-bold
                      transition-all duration-200 border-2
                      ${num !== null
                        ? 'bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green shadow-lg shadow-pip-boy-green/30'
                        : 'bg-metal-gray/80 border-metal-gray-light text-wasteland-lighter hover:border-pip-boy-green/50 hover:bg-pip-boy-green/10'
                      }
                      ${(isLoading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      disabled:pointer-events-none
                    `}
                  >
                    {num !== null ? (
                      <>
                        {num}
                        {/* 刪除按鈕 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClearCell(rowIndex, colIndex)
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-rust-red rounded-full flex items-center justify-center hover:bg-radiation-orange transition-colors"
                          aria-label="清除"
                        >
                          <PixelIcon name="close" size={12} className="text-black" decorative />
                        </button>
                      </>
                    ) : (
                      <PixelIcon name="plus" sizePreset="md" variant="muted" decorative />
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右側: 數字選擇器 */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-wasteland-dark/80 border-2 border-vault-blue-light/50 rounded-lg backdrop-blur-sm">
            <h3 className="text-lg font-bold text-vault-blue-light mb-4 flex items-center gap-2">
              <PixelIcon name="grid" sizePreset="sm" variant="info" decorative />
              {selectedCell ? `選擇數字 (列 ${selectedCell.row + 1}, 行 ${selectedCell.col + 1})` : '點擊格子選擇數字'}
            </h3>

            {/* 數字選擇器 Grid */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 25 }, (_, i) => i + 1).map(num => {
                const isUsed = gridNumbers.flat().includes(num)
                const isDisabled = isUsed || !selectedCell

                return (
                  <motion.button
                    key={num}
                    onClick={() => handleNumberSelect(num)}
                    disabled={isDisabled || isLoading || isSubmitting}
                    whileHover={!isDisabled ? { scale: 1.1 } : {}}
                    whileTap={!isDisabled ? { scale: 0.9 } : {}}
                    className={`
                      aspect-square rounded text-lg font-bold
                      transition-all duration-200 border
                      ${isUsed
                        ? 'bg-concrete-dark/50 border-concrete text-concrete-light line-through cursor-not-allowed'
                        : selectedCell
                          ? 'bg-vault-blue/30 border-vault-blue-light text-vault-blue-light hover:bg-vault-blue/50 cursor-pointer'
                          : 'bg-metal-gray-dark/50 border-metal-gray text-wasteland-lighter cursor-not-allowed'
                      }
                      ${(isLoading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}
                      disabled:pointer-events-none
                    `}
                  >
                    {num}
                  </motion.button>
                )
              })}
            </div>

            {/* 操作按鈕 */}
            <div className="space-y-2">
              <motion.button
                onClick={handleAutoFill}
                disabled={isLoading || isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2
                  bg-radiation-orange/20 border-2 border-radiation-orange text-radiation-orange
                  hover:bg-radiation-orange/30 hover:border-radiation-orange-bright
                  transition-all duration-200
                  ${(isLoading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}
                  disabled:pointer-events-none
                `}
              >
                <PixelIcon name="shuffle" sizePreset="sm" decorative />
                隨機填充
              </motion.button>

              <motion.button
                onClick={handleClearGrid}
                disabled={isLoading || isSubmitting || filledCount === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2
                  bg-rust-red/20 border-2 border-rust-red text-rust-light
                  hover:bg-rust-red/30 hover:border-rust-light
                  transition-all duration-200
                  ${(isLoading || isSubmitting || filledCount === 0) ? 'opacity-50 cursor-not-allowed' : ''}
                  disabled:pointer-events-none
                `}
              >
                <PixelIcon name="trash" sizePreset="sm" decorative />
                清空格子
              </motion.button>

              <motion.button
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                className={`
                  w-full px-4 py-3 rounded-lg font-bold text-lg flex items-center justify-center gap-2
                  transition-all duration-200
                  ${canSubmit
                    ? 'bg-pip-boy-green border-2 border-pip-boy-green-bright text-black hover:bg-pip-boy-green-bright shadow-lg shadow-pip-boy-green/50'
                    : 'bg-concrete-dark border-2 border-concrete text-concrete-light cursor-not-allowed'
                  }
                  disabled:pointer-events-none
                `}
              >
                <PixelIcon name="check" sizePreset="sm" decorative />
                {isSubmitting ? '建立中...' : '確認建立'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* 說明文字 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 p-4 bg-vault-blue-deep/50 border border-vault-blue rounded text-wasteland-lighter text-sm"
      >
        <p className="mb-2 flex items-center gap-2">
          <PixelIcon name="info" sizePreset="xs" variant="info" decorative />
          <span className="text-vault-blue-light font-bold">操作提示:</span>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-6">
          <li>點擊左側空格子，然後從右側選擇要放入的數字 (1-25)</li>
          <li>每個數字只能使用一次，已使用的數字會標示刪除線</li>
          <li>點擊格子右上角的 × 可以移除該數字</li>
          <li>使用「隨機填充」可快速生成隨機賓果卡</li>
          <li>每月只能建立一張賓果卡，建立後無法修改，請謹慎選擇！</li>
        </ul>
      </motion.div>
    </div>
  )
}
