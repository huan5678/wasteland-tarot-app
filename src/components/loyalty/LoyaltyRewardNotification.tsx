'use client'

/**
 * LoyaltyRewardNotification Component
 *
 * Token 延長忠誠度獎勵通知
 * - 當使用者透過每日登入獲得 Token 延長時顯示
 * - Framer Motion 慶祝動畫
 * - Fallout/Pip-Boy 綠色主題
 * - 自動或手動關閉
 */

import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'

interface LoyaltyRewardNotificationProps {
  /** 是否顯示通知 */
  show: boolean
  /** 關閉通知的回調函數 */
  onClose: () => void
  /** 連續登入天數 */
  loyaltyDays?: number
  /** Token 延長時間（分鐘） */
  tokenExtension?: number
}

/**
 * 忠誠度獎勵通知元件
 *
 * 功能:
 * - Modal 顯示 Token 延長獎勵通知
 * - Framer Motion 慶祝動畫（Pip-Boy 綠色粒子）
 * - 5 秒後自動關閉或手動關閉
 * - Fallout Vault-Tec 風格設計
 */
export default function LoyaltyRewardNotification({
  show,
  onClose,
  loyaltyDays = 1,
  tokenExtension = 30,
}: LoyaltyRewardNotificationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  // 生成 Pip-Boy 綠色粒子效果
  useEffect(() => {
    if (show) {
      // 生成隨機粒子位置
      const newParticles = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 120 - 60, // -60 to 60
        y: Math.random() * 120 - 60,
        delay: Math.random() * 0.6,
      }))
      setParticles(newParticles)

      // TODO: 整合 Web Audio 系統播放 Pip-Boy 開啟音效
      // 例如: audioSystem.play('pip-boy-notification')

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* 通知卡片 - Pip-Boy 終端機風格 */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: -50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-wasteland-darker border-4 border-pip-boy-green rounded-none shadow-2xl shadow-pip-boy-green/40 overflow-hidden"
            >
              {/* 粒子效果層 - Pip-Boy 綠色 */}
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
                      duration: 1.8,
                      delay: particle.delay,
                      ease: 'easeOut',
                    }}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-pip-boy-green rounded-full shadow-[0_0_8px_rgba(0,255,136,0.8)]"
                  />
                ))}
              </div>

              {/* 掃描線效果（裝飾） */}
              <motion.div
                animate={{
                  y: ['0%', '100%'],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-pip-boy-green/10 to-transparent h-24 pointer-events-none"
              />

              {/* 內容區 */}
              <div className="relative z-10 p-8 text-center">
                {/* Vault-Tec 徽章圖標 */}
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 3, -3, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                  }}
                  className="mb-6 flex justify-center"
                >
                  <PixelIcon
                    name="shield"
                    sizePreset="xxl"
                    variant="primary"
                    animation="pulse"
                    decorative
                  />
                </motion.div>

                {/* 標題 - Vault-Tec 風格 */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-3xl font-bold text-pip-boy-green tracking-wider mb-2 uppercase"
                >
                  🔋 忠誠度獎勵
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-xl text-pip-boy-green/80 mb-6 border border-pip-boy-green/30 bg-pip-boy-green/5 p-2"
                >
                  Token 延長已啟動！
                </motion.p>

                {/* 獎勵詳情卡片 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="mb-6 p-6 bg-black border-2 border-pip-boy-green/50 shadow-inner"
                >
                  {/* 連續登入天數 */}
                  <div className="mb-4 pb-4 border-b border-pip-boy-green/30">
                    <p className="text-pip-boy-green/70 text-sm mb-1 uppercase tracking-wider">
                      Vault 忠誠度
                    </p>
                    <p className="text-pip-boy-green text-2xl font-bold font-mono">
                      連續 {loyaltyDays} 天登入
                    </p>
                  </div>

                  {/* Token 延長時間 */}
                  <div>
                    <p className="text-pip-boy-green/70 text-sm mb-1 uppercase tracking-wider">
                      Token 延長時間
                    </p>
                    <p className="text-pip-boy-green-bright text-3xl font-bold font-mono">
                      + {tokenExtension} 分鐘
                    </p>
                  </div>
                </motion.div>

                {/* Vault-Tec 慶祝訊息 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="mb-6 text-pip-boy-green/70"
                >
                  <p className="text-sm mb-2 flex items-center justify-center gap-2">
                    <PixelIcon name="star" sizePreset="xs" variant="primary" decorative />
                    <span>感謝您對 Vault-Tec 的忠誠！</span>
                    <PixelIcon name="star" sizePreset="xs" variant="primary" decorative />
                  </p>
                  <p className="text-xs italic">
                    持續登入可獲得更長的 Token 有效期
                  </p>
                </motion.div>

                {/* 關閉按鈕 - Pip-Boy 風格 */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,255,136,0.6)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-8 py-3 bg-pip-boy-green border-2 border-pip-boy-green-dark text-wasteland-dark font-bold text-lg uppercase tracking-wider hover:bg-pip-boy-green-bright transition-all duration-200 shadow-lg shadow-pip-boy-green/50"
                >
                  <PixelIcon name="check" sizePreset="sm" decorative className="mr-2 inline" />
                  確認
                </motion.button>
              </div>

              {/* 裝飾性光暈（Pip-Boy 綠色） */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-gradient-radial from-pip-boy-green/20 to-transparent pointer-events-none"
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
