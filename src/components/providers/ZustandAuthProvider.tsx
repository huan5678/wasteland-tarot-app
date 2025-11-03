'use client'
import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { LoadingSpinner } from '@/components/ui/pipboy'
import { AsciiLoading } from '@/components/loading/AsciiLoading'

// 需要顯示 auth loading 的路由（與 middleware 中的保護路由對應）
const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/profile',
  '/readings',
  '/cards/favorites',
  '/settings',
  '/admin',
  '/bingo', // 賓果頁面需要認證
  '/achievements', // 成就頁面需要認證
  '/journal', // 日誌頁面需要認證
]

export function ZustandAuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize)
  const isInitialized = useAuthStore(s => s.isInitialized)
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // 檢查是否為首頁
  const isHomePage = pathname === '/'

  // 檢查是否為需要認證的路由
  const isAuthRequiredRoute = AUTH_REQUIRED_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  // 只在需要認證的路由或首頁才執行 auth 初始化
  // 注意：pathname 變化時不應重新初始化 auth
  useEffect(() => {
    if (!mounted) return
    if (!isAuthRequiredRoute && !isHomePage) return

    initialize((newProgress) => {
      setProgress(newProgress)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialize, mounted])

  // 如果不是需要認證的路由且不是首頁（例如 404、about、contact 等），直接渲染 children
  // 這樣 not-found.js 和其他公開頁面可以立即顯示，完全跳過 auth 初始化
  if (!isAuthRequiredRoute && !isHomePage) {
    return <>{children}</>
  }

  // Prevent hydration mismatch by always showing loading on initial render
  // SSR 時 mounted = false，所以總是顯示 loading
  // 客戶端初次渲染時 mounted = false，也顯示 loading（與 SSR 一致）
  // 首頁使用 AsciiLoading，需要認證的頁面使用 LoadingSpinner
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

    // 需要認證的頁面：使用 LoadingSpinner
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
