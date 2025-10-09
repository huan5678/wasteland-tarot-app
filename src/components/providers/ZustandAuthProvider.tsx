'use client'
import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { AsciiDonutLoading } from '@/components/loading/AsciiDonutLoading'

export function ZustandAuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize)
  const isInitialized = useAuthStore(s => s.isInitialized)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    console.log('[ZustandAuthInitializer] Calling initialize() with progress tracking')
    initialize((newProgress) => {
      setProgress(newProgress)
    })
  }, [initialize])

  useEffect(() => {
    console.log('[ZustandAuthInitializer] isInitialized:', isInitialized)
  }, [isInitialized])

  if (!isInitialized) {
    console.log('[ZustandAuthInitializer] Rendering AsciiDonutLoading with progress:', progress)
    return (
      <AsciiDonutLoading
        message="INITIALIZING VAULT RESIDENT STATUS..."
        progress={progress}
      />
    )
  }

  console.log('[ZustandAuthInitializer] Rendering children')
  return <>{children}</>
}
