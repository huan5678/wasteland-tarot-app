'use client'

import { useEffect, useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { motion, AnimatePresence } from 'motion/react'

/**
 * OfflineBanner Component
 *
 * Displays a banner at the top of the page when the user goes offline.
 * Auto-hides when the connection is restored.
 *
 * Features:
 * - Network status detection (online/offline events)
 * - Smooth slide-down animation
 * - Pip-Boy themed styling
 * - Auto-hide after reconnection
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Initialize with current status
    setIsOnline(navigator.onLine)

    // Handle online event
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-hide banner after 2 seconds
      setTimeout(() => setShowBanner(false), 2000)
    }

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    // Listen to network events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup listeners
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Show banner when offline
  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true)
    }
  }, [isOnline])

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          <div
            className={`mx-auto max-w-7xl px-4 py-3 ${
              isOnline
                ? 'bg-pip-boy-green/10 border-pip-boy-green'
                : 'bg-radiation-orange/10 border-radiation-orange'
            } border-b backdrop-blur-lg`}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Icon + Message */}
              <div className="flex items-center gap-3">
                <PixelIcon
                  name={isOnline ? 'wifi' : 'wifi-off'}
                  sizePreset="sm"
                  variant={isOnline ? 'success' : 'warning'}
                  animation={isOnline ? undefined : 'pulse'}
                  decorative
                />
                <div className="text-sm">
                  {isOnline ? (
                    <span className="text-pip-boy-green font-medium">
                      連線已恢復
                    </span>
                  ) : (
                    <>
                      <span className="text-radiation-orange font-medium">
                        離線模式
                      </span>
                      <span className="text-pip-boy-green/60 ml-2">
                        部分功能暫時無法使用
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowBanner(false)}
                className="pointer-events-auto p-1 hover:bg-pip-boy-green/10 rounded transition-colors"
                aria-label="關閉通知"
              >
                <PixelIcon
                  name="close"
                  sizePreset="xs"
                  variant={isOnline ? 'success' : 'warning'}
                  aria-label="關閉"
                />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
