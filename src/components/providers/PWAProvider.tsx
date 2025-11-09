'use client'

import { useEffect } from 'react'
import { OfflineBanner } from '@/components/pwa/OfflineBanner'
import { UpdateNotification } from '@/components/pwa/UpdateNotification'
import { useServiceWorker } from '@/hooks/useServiceWorker'

/**
 * PWA Provider
 *
 * Manages Progressive Web App features:
 * - Service Worker registration
 * - Offline detection and notification
 * - Update notifications
 * - Cache management
 *
 * This provider should be placed high in the component tree
 * to ensure PWA features are available throughout the app.
 */
export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { registration, isOnline } = useServiceWorker()

  useEffect(() => {
    if (registration) {
      console.log('[PWA] Provider initialized with registration')
    }
  }, [registration])

  return (
    <>
      {children}

      {/* Offline Banner - Shows when connection is lost */}
      <OfflineBanner />

      {/* Update Notification - Shows when new version is available */}
      <UpdateNotification />
    </>
  )
}
