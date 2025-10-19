'use client'
import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { LoadingSpinner } from '@/components/ui/pipboy/LoadingSpinner'
import { AsciiLoading } from '@/components/loading/AsciiLoading'

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
  // SSR 時 mounted = false，所以總是顯示 loading
  // 客戶端初次渲染時 mounted = false，也顯示 loading（與 SSR 一致）
  // 只有在 mounted = true 之後才檢查 isInitialized
  if (!mounted) {
    // 在 SSR 和客戶端初次渲染時，總是顯示相同的 loading 畫面
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

  // mounted = true 之後，才根據頁面路徑和初始化狀態決定顯示內容
  if (!isInitialized) {
    const isHomePage = pathname === '/'

    if (isHomePage) {
      return (
        <AsciiLoading
          type="bottle"
          message="INITIALIZING VAULT RESIDENT STATUS..."
          progress={progress}
        />
      )
    }

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
