'use client'

import { useBingoStore } from '@/lib/stores/bingoStore'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'

/**
 * 連線指示器元件
 *
 * 功能:
 * - 顯示當前連線數量
 * - 視覺化呈現連線類型
 * - 顯示達成三連線的進度條
 * - 連線數增加時觸發動畫
 *
 * 設計風格: Fallout/Wasteland
 */
export default function LineIndicator() {
  const { lineCount, hasReward } = useBingoStore()
  const [prevLineCount, setPrevLineCount] = useState(lineCount)
  const [showAnimation, setShowAnimation] = useState(false)

  // 監控連線數變化，觸發動畫
  useEffect(() => {
    if (lineCount > prevLineCount) {
      setShowAnimation(true)
      setTimeout(() => setShowAnimation(false), 1500)
    }
    setPrevLineCount(lineCount)
  }, [lineCount, prevLineCount])

  const targetLines = 3 // 目標連線數
  const progress = Math.min((lineCount / targetLines) * 100, 100)

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 bg-black/80 border-2 border-pip-boy-green/50 rounded-lg backdrop-blur-sm"
      >
        {/* 標題 */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-pip-boy-green tracking-wider">
            連線進度
          </h3>
          <p className="text-green-400 text-sm mt-1">
            達成三連線即可獲得獎勵
          </p>
        </div>

        {/* 連線數顯示 */}
        <motion.div
          animate={showAnimation ? {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-baseline gap-2">
            <motion.span
              key={lineCount}
              initial={{ scale: 1.5, color: '#10b981' }}
              animate={{ scale: 1, color: '#f59e0b' }}
              transition={{ duration: 0.5 }}
              className="text-6xl font-bold text-pip-boy-green"
            >
              {lineCount}
            </motion.span>
            <span className="text-3xl text-wasteland-lighter">/ {targetLines}</span>
          </div>
          <p className="text-wasteland-lighter text-sm mt-2">連線數</p>
        </motion.div>

        {/* 進度條 */}
        <div className="mb-6">
          <div className="relative h-8 bg-metal-gray border-2 border-metal-gray-light rounded-lg overflow-hidden">
            {/* 進度填充 */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`
                h-full flex items-center justify-center text-sm font-bold
                ${hasReward
                  ? 'bg-gradient-to-r from-green-600 to-green-400 text-black'
                  : 'bg-gradient-to-r from-pip-boy-green to-pip-boy-green-bright text-black'
                }
              `}
            >
              {progress >= 30 && `${Math.round(progress)}%`}
            </motion.div>

            {/* 進度百分比 (當進度小於30%時顯示在外面) */}
            {progress < 30 && progress > 0 && (
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-pip-boy-green">
                {Math.round(progress)}%
              </span>
            )}
          </div>

          {/* 進度里程碑標記 */}
          <div className="relative mt-2 flex justify-between text-xs text-wasteland-light">
            <span className={lineCount >= 1 ? 'text-green-400' : ''}>1連線</span>
            <span className={lineCount >= 2 ? 'text-green-400' : ''}>2連線</span>
            <span className={lineCount >= 3 ? 'text-green-400' : ''}>3連線</span>
          </div>
        </div>

        {/* 連線類型視覺化 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* 橫向 */}
          <div className="text-center p-2 bg-wasteland-dark/50 border border-metal-gray-light rounded">
            <div className="text-2xl mb-1">━</div>
            <p className="text-xs text-wasteland-lighter">橫向</p>
          </div>

          {/* 縱向 */}
          <div className="text-center p-2 bg-wasteland-dark/50 border border-metal-gray-light rounded">
            <div className="text-2xl mb-1 rotate-90">━</div>
            <p className="text-xs text-wasteland-lighter">縱向</p>
          </div>

          {/* 對角線 */}
          <div className="text-center p-2 bg-wasteland-dark/50 border border-metal-gray-light rounded">
            <div className="text-2xl mb-1 rotate-45">━</div>
            <p className="text-xs text-wasteland-lighter">對角線</p>
          </div>
        </div>

        {/* 狀態訊息 */}
        {hasReward ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-3 bg-green-900/30 border border-green-600 rounded-lg text-center"
          >
            <p className="text-green-400 text-sm font-bold flex items-center justify-center gap-2">
              <PixelIcon name="gift" sizePreset="xs" variant="success" decorative />
              恭喜達成三連線！
            </p>
            <p className="text-green-500 text-xs mt-1">
              獎勵已發放至你的帳戶
            </p>
          </motion.div>
        ) : lineCount === 0 ? (
          <div className="p-3 bg-wasteland-dark/50 border border-metal-gray-light rounded-lg text-center">
            <p className="text-wasteland-lighter text-sm">
              開始領取號碼以完成連線
            </p>
          </div>
        ) : lineCount < targetLines ? (
          <div className="p-3 bg-pip-boy-green-deep/30 border border-pip-boy-green rounded-lg text-center">
            <p className="text-pip-boy-green text-sm">
              還差 <span className="font-bold text-lg">{targetLines - lineCount}</span> 條連線就能獲得獎勵！
            </p>
            <p className="text-pip-boy-green-dark text-xs mt-1">
              繼續領取號碼吧
            </p>
          </div>
        ) : null}

        {/* 說明文字 */}
        <div className="mt-4 p-3 bg-wasteland-dark/50 border border-metal-gray-light rounded text-wasteland-lighter text-xs">
          <p className="mb-1 flex items-center gap-1">
            <PixelIcon name="info" size={12} variant="info" decorative />
            <span className="text-pip-boy-green">連線規則:</span>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>橫向、縱向、對角線各算一條連線</li>
            <li>達成三條連線即可獲得獎勵</li>
            <li>每月只能獲得一次獎勵</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
