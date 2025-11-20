'use client'

/**
 * LoadingStrategy - 分級 Loading 管理
 *
 * 設計理念（基於用戶選擇：分級 Loading - 依頁面類型）：
 * - 首頁：AsciiLoading（Nuka Cola 瓶子動畫）
 * - Auth 頁面：LoadingSpinner（Pip-Boy 風格）
 * - 公開頁面：無 loading（直接顯示）
 * - 404 頁面：無 loading（完全獨立）
 *
 * 關鍵改變：
 * - 不再阻擋渲染，loading 只在必要時顯示
 * - 基於頁面類型而非 auth 狀態決定 loading UI
 */

import React, { ReactNode, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/pipboy'
import { AsciiLoading } from '@/components/loading/AsciiLoading'
import { useAuthReady } from './StagedAuthProvider'

interface LoadingStrategyProps {
  children: ReactNode
}

type PageType = 'home' | 'auth-required' | 'public' | 'not-found'

// 需要認證的路由
const AUTH_REQUIRED_ROUTES = [
  '/dashboard',
  '/profile',
  '/readings',
  '/cards/favorites',
  '/settings',
  '/admin',
  '/bingo',
  '/achievements',
  '/journal',
]

// 已知的公開路由
const PUBLIC_ROUTES = [
  '/about',
  '/contact',
  '/faq',
  '/privacy',
  '/terms',
  '/auth',
  '/cards',
  '/reading',
  '/test',
  '/icon-showcase',
  '/api',
]

/**
 * 判斷頁面類型
 */
function getPageType(pathname: string): PageType {
  // 首頁
  if (pathname === '/') {
    return 'home'
  }

  // 需要認證的頁面
  if (AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route))) {
    return 'auth-required'
  }

  // 已知的公開頁面
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return 'public'
  }

  // 未知路由（可能是 404）
  return 'not-found'
}

/**
 * LoadingStrategy - 根據頁面類型顯示不同的 loading
 *
 * 行為：
 * - home: 顯示 AsciiLoading（只在 auth 未準備好時）
 * - auth-required: 顯示 LoadingSpinner（只在 auth 未準備好時）
 * - public: 直接顯示內容（不等待 auth）
 * - not-found: 直接顯示 404（完全不涉及 auth）
 */
export function LoadingStrategy({ children }: LoadingStrategyProps) {
  const pathname = usePathname()
  const pageType = getPageType(pathname)
  const { isReady } = useAuthReady()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 404、公開頁面、首頁：直接渲染，不管 auth 狀態
  // 首頁改為非阻塞模式，提升使用者體驗
  if (pageType === 'not-found' || pageType === 'public' || pageType === 'home') {
    return <>{children}</>
  }

  // 防止 hydration mismatch
  if (!mounted) {
    // SSR 時顯示對應的 loading
    if (pageType === 'home') {
      return (
        <AsciiLoading
          type="bottle"
          message="INITIALIZING VAULT RESIDENT STATUS..."
          progress={0}
        />
      )
    }

    if (pageType === 'auth-required') {
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
  }

  // 客戶端：根據 auth 狀態決定是否顯示 loading
  // 關鍵改變：auth 準備好後立即顯示內容，不管是否登入
  if (!isReady) {
    if (pageType === 'home') {
      return (
        <AsciiLoading
          type="bottle"
          message="INITIALIZING VAULT RESIDENT STATUS..."
          progress={0}
        />
      )
    }

    if (pageType === 'auth-required') {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
          <LoadingSpinner
            size="lg"
            text="INITIALIZING VAULT RESIDENT STATUS..."
            centered
          />
        </div>
      )
    }
  }

  // Auth 準備好了，顯示內容
  return <>{children}</>
}

/**
 * PageTypeIndicator - 開發用：顯示當前頁面類型
 * 只在開發環境顯示
 */
export function PageTypeIndicator() {
  const pathname = usePathname()
  const pageType = getPageType(pathname)

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const colors = {
    home: 'bg-blue-500',
    'auth-required': 'bg-red-500',
    public: 'bg-green-500',
    'not-found': 'bg-yellow-500',
  }

  return (
    <div className={`fixed bottom-4 left-4 ${colors[pageType]} text-white text-xs px-2 py-1 rounded z-50 font-mono`}>
      {pageType}
    </div>
  )
}
