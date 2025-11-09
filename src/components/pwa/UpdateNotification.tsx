'use client'

import { useEffect, useState } from 'react'
import { PixelIcon } from '@/components/ui/icons'
import { motion, AnimatePresence } from 'motion/react'

/**
 * UpdateNotification Component
 *
 * Displays a notification when a new version of the Service Worker is available.
 * Allows users to update immediately or dismiss.
 *
 * Features:
 * - Service Worker update detection
 * - User-triggered update with reload
 * - Vault-Tec themed notification UI
 * - Slide-up animation from bottom
 */
export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Check for updates on page load
      navigator.serviceWorker.ready.then((registration) => {
        // Check if there's a waiting worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          setShowUpdate(true)
        }

        // Listen for new service worker installations
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker installed and ready to activate
                setWaitingWorker(newWorker)
                setShowUpdate(true)
              }
            })
          }
        })
      })

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload page to use new service worker
        window.location.reload()
      })
    }
  }, [])

  const handleUpdate = () => {
    if (waitingWorker) {
      // Send message to skip waiting
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      setShowUpdate(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[9999]"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 80px)',
          }}
        >
          <div className="mx-auto max-w-7xl px-4 pb-4">
            <div className="bg-pip-boy-green/10 backdrop-blur-xl border border-pip-boy-green/30 rounded-lg p-4 shadow-lg">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-pip-boy-green/20 flex items-center justify-center">
                    <PixelIcon
                      name="download"
                      sizePreset="sm"
                      variant="primary"
                      animation="bounce"
                      decorative
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-pip-boy-green font-bold mb-1">
                    新版本可用
                  </h3>
                  <p className="text-pip-boy-green/80 text-sm mb-3">
                    Vault-Tec 終端機已更新。點擊更新以取得最新功能。
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-pip-boy-green/20 hover:bg-pip-boy-green/30 border border-pip-boy-green/40 rounded text-pip-boy-green text-sm font-medium transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <PixelIcon name="refresh" sizePreset="xs" decorative />
                        立即更新
                      </span>
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 border border-pip-boy-green/30 rounded text-pip-boy-green/80 text-sm font-medium hover:bg-pip-boy-green/5 transition-colors"
                    >
                      稍後提醒
                    </button>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 hover:bg-pip-boy-green/10 rounded transition-colors"
                  aria-label="關閉通知"
                >
                  <PixelIcon
                    name="close"
                    sizePreset="xs"
                    variant="primary"
                    aria-label="關閉"
                  />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
