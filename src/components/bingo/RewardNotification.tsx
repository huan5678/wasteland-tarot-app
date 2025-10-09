'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'

interface RewardNotificationProps {
  /** 是否顯示通知 */
  show: boolean
  /** 關閉通知的回調函數 */
  onClose: () => void
  /** 獎勵詳情 (選填) */
  rewardDetails?: {
    type: string
    amount?: number
    description?: string
  }
}

/**
 * 獎勵通知元件
 *
 * 功能:
 * - Modal/Toast 顯示三連線獎勵通知
 * - Framer Motion 慶祝動畫
 * - 音效播放 (整合 Web Audio 系統)
 * - 自動關閉或手動關閉
 *
 * 設計風格: Fallout/Wasteland
 */
export default function RewardNotification({
  show,
  onClose,
  rewardDetails,
}: RewardNotificationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  // 生成粒子效果
  useEffect(() => {
    if (show) {
      // 生成隨機粒子位置
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50, // -50 to 50
        y: Math.random() * 100 - 50,
        delay: Math.random() * 0.5,
      }))
      setParticles(newParticles)

      // TODO: 整合 Web Audio 系統播放音效
      // 例如: audioSystem.play('reward-celebration')

      // 5秒後自動關閉
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* 通知卡片 */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full bg-black border-4 border-amber-600 rounded-lg shadow-2xl shadow-amber-600/50 overflow-hidden"
            >
              {/* 粒子效果層 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {particles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{
                      x: particle.x,
                      y: particle.y,
                      scale: 0,
                      opacity: 0,
                    }}
                    transition={{
                      duration: 1.5,
                      delay: particle.delay,
                      ease: 'easeOut',
                    }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-400 rounded-full"
                  />
                ))}
              </div>

              {/* 內容區 */}
              <div className="relative z-10 p-8 text-center">
                {/* 獎杯圖標 */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  className="text-8xl mb-4"
                >
                  🏆
                </motion.div>

                {/* 標題 */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-bold text-amber-400 font-mono tracking-wider mb-2"
                >
                  恭喜！
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl text-green-400 font-mono mb-4"
                >
                  達成三連線！
                </motion.p>

                {/* 獎勵詳情 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6 p-4 bg-amber-900/30 border border-amber-600 rounded-lg"
                >
                  <p className="text-amber-300 font-mono text-lg mb-2">
                    {rewardDetails?.description || '本月賓果獎勵已發放'}
                  </p>
                  {rewardDetails?.amount && (
                    <p className="text-green-400 font-mono text-2xl font-bold">
                      + {rewardDetails.amount} {rewardDetails.type || '點數'}
                    </p>
                  )}
                </motion.div>

                {/* 慶祝訊息 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mb-6"
                >
                  <p className="text-gray-300 font-mono text-sm mb-2">
                    🎉 你在廢土中找到了珍貴的補給！
                  </p>
                  <p className="text-gray-400 font-mono text-xs">
                    下個月可以再次挑戰賓果遊戲
                  </p>
                </motion.div>

                {/* 關閉按鈕 */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-8 py-3 bg-green-600 border-2 border-green-400 rounded-lg font-mono font-bold text-lg text-black hover:bg-green-500 transition-all duration-200 shadow-lg shadow-green-600/50"
                >
                  太棒了！
                </motion.button>
              </div>

              {/* 裝飾性光暈 */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-gradient-radial from-amber-600/20 to-transparent pointer-events-none"
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
