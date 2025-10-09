'use client'

import { useEffect } from 'react'
import { initMetrics } from '@/lib/metrics'
import { startBatchLogging, setUserId } from '@/lib/logger'
import { useAuthStore } from '@/lib/authStore'

/**
 * Metrics and Logging Initializer
 * Initializes performance monitoring and logging system
 */
export function MetricsInitializer() {
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Initialize metrics and monitoring
    initMetrics()

    // Start batch logging in production
    if (process.env.NODE_ENV === 'production') {
      startBatchLogging()
    }

    console.info('[Metrics] Performance monitoring initialized')
  }, [])

  // Update user ID when user changes
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id)
    } else {
      setUserId(undefined)
    }
  }, [user?.id])

  return null // This is a side-effect only component
}
