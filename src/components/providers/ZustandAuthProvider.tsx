'use client'
import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { LoadingSpinner } from '@/components/ui/pipboy'
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

  // 檢查是否為首頁
  const isHomePage = pathname === '/'

  // Prevent hydration mismatch by always showing loading on initial render
  // SSR 時 mounted = false，所以總是顯示 loading
  // 客戶端初次渲染時 mounted = false，也顯示 loading（與 SSR 一致）
  // 首頁使用 AsciiLoading，其他頁面使用 LoadingSpinner
  if (!mounted || !isInitialized) {
    if (isHomePage) {
      // 首頁：使用 AsciiLoading（Nuka Cola 瓶子動畫）
      return (
        <AsciiLoading
          type="bottle"
          message="INITIALIZING VAULT RESIDENT STATUS..."
          progress={progress}
        />
      )
    }

    // 非首頁：使用 LoadingSpinner
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
