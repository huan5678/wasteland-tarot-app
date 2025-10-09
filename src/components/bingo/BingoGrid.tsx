'use client'

import { motion } from 'motion/react'

interface BingoGridProps {
  /** 賓果卡 5x5 grid */
  card: number[][]
  /** 已領取的號碼集合 */
  claimedNumbers: Set<number>
  /** 高亮顯示的號碼 (例如今日號碼) */
  highlightNumber?: number
  /** 連線類型陣列 (用於繪製連線) */
  lineTypes?: string[]
}

/**
 * 賓果卡顯示元件
 *
 * 功能:
 * - 顯示 5x5 賓果卡
 * - 高亮已領取號碼
 * - 高亮今日號碼
 * - 視覺化連線 (橫向、縱向、對角線)
 *
 * 設計風格: Fallout/Wasteland
 */
export default function BingoGrid({
  card,
  claimedNumbers,
  highlightNumber,
  lineTypes = [],
}: BingoGridProps) {
  /**
   * 檢查號碼是否已領取
   */
  const isClaimed = (num: number): boolean => {
    return claimedNumbers.has(num)
  }

  /**
   * 檢查是否為高亮號碼
   */
  const isHighlighted = (num: number): boolean => {
    return highlightNumber === num
  }

  /**
   * 解析連線類型並生成 SVG 連線
   */
  const renderLines = () => {
    if (!lineTypes || lineTypes.length === 0) return null

    const lines: JSX.Element[] = []

    lineTypes.forEach((lineType, idx) => {
      if (lineType.startsWith('horizontal_')) {
        // 橫向連線
        const row = parseInt(lineType.split('_')[1])
        lines.push(
          <line
            key={`h-${idx}`}
            x1="2.5%"
            y1={`${row * 20 + 10}%`}
            x2="97.5%"
            y2={`${row * 20 + 10}%`}
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )
      } else if (lineType.startsWith('vertical_')) {
        // 縱向連線
        const col = parseInt(lineType.split('_')[1])
        lines.push(
          <line
            key={`v-${idx}`}
            x1={`${col * 20 + 10}%`}
            y1="2.5%"
            x2={`${col * 20 + 10}%`}
            y2="97.5%"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )
      } else if (lineType === 'diagonal_main') {
        // 主對角線 (左上到右下)
        lines.push(
          <line
            key={`d-main-${idx}`}
            x1="2.5%"
            y1="2.5%"
            x2="97.5%"
            y2="97.5%"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )
      } else if (lineType === 'diagonal_anti') {
        // 反對角線 (右上到左下)
        lines.push(
          <line
            key={`d-anti-${idx}`}
            x1="97.5%"
            y1="2.5%"
            x2="2.5%"
            y2="97.5%"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            className="animate-pulse"
          />
        )
      }
    })

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {lines}
      </svg>
    )
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* 賓果卡標題 */}
      <div className="mb-4 text-center">
        <h3 className="text-2xl font-bold text-amber-400 font-mono tracking-wider">
          廢土賓果卡
        </h3>
        <p className="text-green-400 text-sm font-mono mt-1">
          領取每日號碼來完成連線
        </p>
      </div>

      {/* 賓果卡 Grid 容器 */}
      <div className="relative bg-black/80 border-2 border-amber-600/50 rounded-lg p-4 backdrop-blur-sm">
        {/* 連線 SVG 覆蓋層 */}
        {renderLines()}

        {/* 賓果卡 Grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 relative z-0">
          {card.flat().map((num, idx) => {
            const claimed = isClaimed(num)
            const highlighted = isHighlighted(num)
            const row = Math.floor(idx / 5)
            const col = idx % 5

            return (
              <motion.div
                key={`${row}-${col}-${num}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className={`
                  relative aspect-square rounded-lg font-mono
                  flex items-center justify-center text-2xl sm:text-3xl font-bold
                  transition-all duration-300 border-2
                  ${claimed
                    ? 'bg-green-600 border-green-400 text-black shadow-lg shadow-green-600/50'
                    : 'bg-gray-800/80 border-gray-600 text-gray-400'
                  }
                  ${highlighted
                    ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-black animate-pulse'
                    : ''
                  }
                `}
              >
                {/* 號碼 */}
                <span className="relative z-10">{num}</span>

                {/* 已領取標記 */}
                {claimed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-4xl sm:text-5xl">✓</span>
                  </motion.div>
                )}

                {/* 今日號碼閃爍效果 */}
                {highlighted && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 bg-amber-400 rounded-lg"
                  />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* 角標裝飾 */}
        <div className="absolute top-2 left-2 text-amber-600 text-xs font-mono opacity-50">
          VAULT-TEC
        </div>
        <div className="absolute bottom-2 right-2 text-amber-600 text-xs font-mono opacity-50">
          BINGO-76
        </div>
      </div>

      {/* 圖例 */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-mono">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-800 border-2 border-gray-600 rounded" />
          <span className="text-gray-400">未領取</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-600 border-2 border-green-400 rounded flex items-center justify-center text-black">
            ✓
          </div>
          <span className="text-green-400">已領取</span>
        </div>
        {highlightNumber && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-400 border-2 border-amber-300 rounded animate-pulse" />
            <span className="text-amber-400">今日號碼</span>
          </div>
        )}
      </div>
    </div>
  )
}
