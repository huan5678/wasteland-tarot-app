'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PixelIcon } from '@/components/ui/icons'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface NumberPickerModalProps {
  /** Modal 是否開啟 */
  isOpen: boolean
  /** 關閉 Modal 回調 */
  onClose: () => void
  /** 選擇數字回調 */
  onSelectNumber: (number: number) => void
  /** 已被使用的號碼集合（包括已領取 + 卡片上的所有數字） */
  usedNumbers: Set<number>
  /** 卡片上已有的數字（用於高亮顯示） */
  cardNumbers?: Set<number>
}

// ============================================================================
// Component
// ============================================================================

/**
 * 賓果數字選擇 Modal
 *
 * 功能:
 * - 顯示 1-25 的數字網格
 * - 標示已使用的數字（不可選）
 * - 標示卡片上已有的數字（高亮）
 * - 選擇數字後自動關閉
 *
 * 設計風格: Fallout/Wasteland - Pip-Boy 終端機
 */
export const NumberPickerModal: React.FC<NumberPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectNumber,
  usedNumbers,
  cardNumbers = new Set(),
}) => {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)

  // 生成 1-25 的數字陣列
  const numbers = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => i + 1)
  }, [])

  // 計算各狀態的數量
  const stats = useMemo(() => {
    let availableCount = 0
    let usedCount = 0
    let onCardCount = 0

    numbers.forEach((num) => {
      const isUsed = usedNumbers.has(num)
      const isOnCard = cardNumbers.has(num)

      if (isUsed) {
        usedCount++
      } else if (isOnCard) {
        onCardCount++
      } else {
        availableCount++
      }
    })

    return { availableCount, usedCount, onCardCount }
  }, [numbers, usedNumbers, cardNumbers])

  // 處理數字選擇
  const handleNumberClick = (num: number) => {
    // 已使用的數字不可選
    if (usedNumbers.has(num)) {
      return
    }

    setSelectedNumber(num)
    // 短暫延遲以顯示選中動畫，然後關閉 modal
    setTimeout(() => {
      onSelectNumber(num)
      onClose()
      setSelectedNumber(null)
    }, 300)
  }

  // 檢查數字狀態
  const getNumberStatus = (num: number) => {
    const isUsed = usedNumbers.has(num)
    const isOnCard = cardNumbers.has(num)
    const isSelected = selectedNumber === num

    return {
      isUsed,
      isOnCard,
      isSelected,
      isAvailable: !isUsed && !isOnCard,
    }
  }

  // 取得數字樣式
  const getNumberClassName = (num: number) => {
    const { isUsed, isOnCard, isSelected, isAvailable } = getNumberStatus(num)

    return cn(
      'aspect-square rounded-lg flex items-center justify-center',
      'text-xl sm:text-2xl font-bold transition-all duration-200',
      'border-2 relative overflow-hidden',
      {
        // 已使用（不可選）
        'bg-metal-gray/30 border-metal-gray text-wasteland-lighter cursor-not-allowed opacity-50':
          isUsed,
        // 卡片上已有（不可選，但高亮顯示）
        'bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green cursor-not-allowed':
          isOnCard,
        // 可選擇（未使用且不在卡片上）
        'bg-wasteland-dark border-pip-boy-green/50 text-pip-boy-green cursor-pointer hover:bg-pip-boy-green/10 hover:border-pip-boy-green-bright hover:scale-105 hover:shadow-lg hover:shadow-pip-boy-green/30':
          isAvailable,
        // 已選中
        'bg-pip-boy-green border-pip-boy-green-bright text-black scale-110 shadow-2xl shadow-pip-boy-green/60':
          isSelected,
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-2 border-pip-boy-green shadow-[0_0_30px_rgba(0,255,136,0.4)] bg-black">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <PixelIcon
              name="grid"
              sizePreset="lg"
              variant="primary"
              animation="pulse"
              decorative
            />
            <DialogTitle className="text-2xl text-pip-boy-green">
              選擇廢土號碼
            </DialogTitle>
          </div>
          <DialogDescription className="text-terminal-green">
            點擊數字加入你的賓果卡片。灰色為已使用，綠色框為卡片已有。
          </DialogDescription>
        </DialogHeader>

        {/* 數字網格 */}
        <div className="py-4">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {numbers.map((num, idx) => {
              const { isUsed, isOnCard, isSelected, isAvailable } =
                getNumberStatus(num)

              return (
                <motion.button
                  key={num}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.015 }}
                  onClick={() => handleNumberClick(num)}
                  disabled={isUsed || isOnCard}
                  className={getNumberClassName(num)}
                  aria-label={`選擇號碼 ${num}`}
                  aria-disabled={isUsed || isOnCard}
                >
                  {/* 數字 */}
                  <span className="relative z-10">{num}</span>

                  {/* 已選中動畫 */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 bg-pip-boy-green rounded-lg"
                    />
                  )}

                  {/* 可選擇高亮效果 */}
                  {isAvailable && (
                    <motion.div
                      animate={{
                        opacity: [0.1, 0.3, 0.1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 bg-pip-boy-green rounded-lg pointer-events-none"
                    />
                  )}

                  {/* 已使用標記 */}
                  {isUsed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PixelIcon
                        name="close"
                        sizePreset="md"
                        variant="muted"
                        decorative
                      />
                    </div>
                  )}

                  {/* 卡片已有標記 */}
                  {isOnCard && (
                    <div className="absolute top-1 right-1">
                      <PixelIcon
                        name="check"
                        sizePreset="xs"
                        variant="primary"
                        decorative
                      />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* 圖例 */}
        <div className="flex flex-wrap justify-center gap-4 text-sm py-4 border-t border-metal-gray">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-wasteland-dark border-2 border-pip-boy-green/50 rounded flex items-center justify-center text-pip-boy-green text-sm">
              <PixelIcon name="check-circle" size={16} variant="primary" decorative />
            </div>
            <span className="text-wasteland-lighter">
              可選擇 <span className="text-pip-boy-green font-bold">({stats.availableCount})</span>
            </span>
          </div>
          {stats.onCardCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-pip-boy-green/20 border-2 border-pip-boy-green rounded flex items-center justify-center text-pip-boy-green text-sm">
                <PixelIcon name="check" size={16} variant="primary" decorative />
              </div>
              <span className="text-pip-boy-green">
                卡片已有 <span className="font-bold">({stats.onCardCount})</span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-metal-gray/30 border-2 border-metal-gray rounded flex items-center justify-center text-wasteland-lighter text-sm opacity-50">
              <PixelIcon name="close" size={16} variant="muted" decorative />
            </div>
            <span className="text-metal-gray-light">
              已使用 <span className="font-bold">({stats.usedCount})</span>
            </span>
          </div>
        </div>

        {/* Vault-Tec 裝飾 */}
        <div className="absolute top-2 left-2 text-pip-boy-green-medium text-xs opacity-30 pointer-events-none">
          VAULT-TEC
        </div>
        <div className="absolute bottom-2 right-2 text-pip-boy-green-medium text-xs opacity-30 pointer-events-none">
          NUM-SELECT
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NumberPickerModal
