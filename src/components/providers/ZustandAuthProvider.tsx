'use client'
import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/authStore'
import { AsciiDonutLoading } from '@/components/loading/AsciiDonutLoading'

export function ZustandAuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize)
  const isInitialized = useAuthStore(s => s.isInitialized)
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    initialize((newProgress) => {
      setProgress(newProgress)
    })
  }, [initialize, mounted])

  // Prevent hydration mismatch by always showing loading on initial render
  if (!mounted || !isInitialized) {
    return (
      <AsciiDonutLoading
        message="INITIALIZING VAULT RESIDENT STATUS..."
        progress={progress}
      />
    )
  }

  return <>{children}</>
}
