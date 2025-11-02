/**
 * useRequireAuth Hook
 *
 * 統一處理頁面認證檢查，防止重複代碼
 *
 * 功能：
 * 1. 自動檢查認證狀態初始化
 * 2. 未登入自動重導向到登入頁
 * 3. 返回認證狀態供頁面使用
 *
 * 使用範例：
 * ```tsx
 * function MyPage() {
 *   const { isReady, user } = useRequireAuth()
 *
 *   if (!isReady) {
 *     return <Loading message="驗證認證狀態..." />
 *   }
 *
 *   // 頁面內容
 * }
 * ```
 */

'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'

interface UseRequireAuthOptions {
  /** 登入後重導向的路徑（預設：當前頁面） */
  returnUrl?: string
  /** 是否啟用詳細日誌 */
  enableLog?: boolean
}

interface UseRequireAuthReturn {
  /** 認證狀態是否已就緒（已初始化且已驗證） */
  isReady: boolean
  /** 認證狀態是否已初始化 */
  isInitialized: boolean
  /** 當前登入用戶 */
  user: ReturnType<typeof useAuthStore>['user']
  /** 是否已認證（已初始化且有用戶） */
  isAuthenticated: boolean
}

/**
 * 要求頁面必須登入才能訪問的 Hook
 *
 * @param options - 配置選項
 * @returns 認證狀態
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}): UseRequireAuthReturn {
  const { returnUrl, enableLog = true } = options

  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)
  const isInitialized = useAuthStore(s => s.isInitialized)
  const initialize = useAuthStore(s => s.initialize)

  const pageName = pathname || 'Unknown'
  const finalReturnUrl = returnUrl || pathname || '/'

  useEffect(() => {
    if (enableLog) {
      console.log(`[useRequireAuth:${pageName}] 🔍 驗證登入狀態...`, {
        isInitialized,
        hasUser: !!user,
        userId: user?.id,
        pathname
      })
    }

    // 如果尚未初始化，先初始化
    if (!isInitialized) {
      if (enableLog) {
        console.log(`[useRequireAuth:${pageName}] ⏳ 尚未初始化，開始初始化...`)
      }
      initialize()
      return
    }

    // 初始化完成後，檢查是否有使用者
    if (isInitialized && !user) {
      if (enableLog) {
        console.log(`[useRequireAuth:${pageName}] 🔀 Auth check redirect`, {
          timestamp: new Date().toISOString(),
          from: pathname,
          to: `/auth/login?returnUrl=${encodeURIComponent(finalReturnUrl)}`,
          reason: 'User not authenticated',
          isInitialized
        })
      }
      router.push(`/auth/login?returnUrl=${encodeURIComponent(finalReturnUrl)}`)
      return
    }

    if (enableLog && isInitialized && user) {
      console.log(`[useRequireAuth:${pageName}] ✅ 登入狀態有效，使用者:`, user.email)
    }
  }, [user, isInitialized, initialize, router, pathname, finalReturnUrl, pageName, enableLog])

  const isAuthenticated = isInitialized && !!user
  const isReady = isAuthenticated

  return {
    isReady,
    isInitialized,
    user,
    isAuthenticated
  }
}

/**
 * 輕量版認證檢查（不自動重導向）
 *
 * 適用於不需要強制登入的頁面，但需要知道用戶登入狀態
 */
export function useAuthStatus(): Omit<UseRequireAuthReturn, 'isReady'> {
  const user = useAuthStore(s => s.user)
  const isInitialized = useAuthStore(s => s.isInitialized)
  const initialize = useAuthStore(s => s.initialize)

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  const isAuthenticated = isInitialized && !!user

  return {
    isInitialized,
    user,
    isAuthenticated
  }
}
