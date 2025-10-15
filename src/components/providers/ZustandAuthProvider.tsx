'use client'
import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { LoadingSpinner } from '@/components/ui/pipboy/LoadingSpinner'
import { AsciiDonutLoading } from '@/components/loading/AsciiDonutLoading'

export function ZustandAuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize)
  const isInitialized = useAuthStore(s => s.isInitialized)
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

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
    // 首頁使用 AsciiDonutLoading，其他頁面使用 LoadingSpinner
    const isHomePage = pathname === '/'

    if (isHomePage) {
      return (
        <AsciiDonutLoading
          message="INITIALIZING VAULT RESIDENT STATUS..."
          progress={progress}
        />
      )
    }

    // 其他頁面使用簡單的 LoadingSpinner
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50" suppressHydrationWarning>
        <LoadingSpinner
          size="lg"
          text="INITIALIZING VAULT RESIDENT STATUS..."
          centered
        />
      </div>
    )
  }

  return <>{children}</>
}
