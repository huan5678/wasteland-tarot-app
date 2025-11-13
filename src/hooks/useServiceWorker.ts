'use client'

import { useEffect, useState } from 'react'

/**
 * useServiceWorker Hook
 *
 * Manages Service Worker registration and updates.
 *
 * Features:
 * - Auto-register service worker on mount
 * - Check for updates every 60 minutes
 * - Detect new versions and notify user
 * - Handle service worker lifecycle events
 *
 * @returns {Object} Service Worker state and methods
 */
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Register service worker
      registerServiceWorker()

      // Check for updates periodically (every 60 minutes)
      const interval = setInterval(() => {
        checkForUpdates()
      }, 60 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initialize status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const registerServiceWorker = async () => {
    // 🔧 FIX: Only register Service Worker in production to prevent caching issues in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PWA] Service Worker registration skipped in development mode')
      return
    }

    try {
      console.log('[PWA] Registering Service Worker...')

      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      setRegistration(reg)

      console.log('[PWA] Service Worker registered:', reg.scope)

      // Check for updates on registration
      reg.update()

      // Listen for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing

        if (newWorker) {
          console.log('[PWA] New Service Worker found')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] Update available')
              setUpdateAvailable(true)
            }
          })
        }
      })
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error)
    }
  }

  const checkForUpdates = async () => {
    if (registration) {
      try {
        console.log('[PWA] Checking for updates...')
        await registration.update()
      } catch (error) {
        console.error('[PWA] Update check failed:', error)
      }
    }
  }

  const skipWaiting = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  const clearCaches = async () => {
    if (registration && registration.active) {
      registration.active.postMessage({ type: 'CACHE_CLEAR' })
      console.log('[PWA] Cache clear requested')
    }
  }

  return {
    registration,
    isOnline,
    updateAvailable,
    checkForUpdates,
    skipWaiting,
    clearCaches,
  }
}
