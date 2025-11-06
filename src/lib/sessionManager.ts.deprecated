/**
 * Session Manager - Supabase 會話管理工具
 * 處理 token 刷新和會話驗證
 *
 * @deprecated 此檔案直接使用 Supabase 客戶端進行 session 管理，違反前後端分離原則
 *
 * 問題：
 * - 前端直接呼叫 Supabase Auth API 進行 session 刷新和驗證
 * - 應該改為透過後端 API (/api/v1/auth/refresh, /api/v1/auth/verify) 進行
 *
 * TODO: 重構為使用後端 API
 * - refreshSession() → 呼叫 /api/v1/auth/refresh
 * - validateSession() → 呼叫 /api/v1/auth/verify
 * - setupAuthListener() → 移除 Supabase 監聽，改用 API 輪詢或 WebSocket
 *
 * 目前保留此檔案以維持向後相容性，但新功能不應使用此檔案
 */

import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from './authStore'

interface SessionStatus {
  isValid: boolean
  expiresAt?: number
  needsRefresh: boolean
}

/**
 * 刷新 Supabase 會話
 * 使用 Supabase 客戶端執行會話刷新
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.refreshSession()

    if (error || !data.session) {
      console.error('[SessionManager] ❌ Session refresh failed:', error)

      // 🔍 監控日誌：追蹤 Session 刷新失敗導致的登出
      console.warn('[SessionManager] 🚫 Session refresh failed - Logging out', {
        timestamp: new Date().toISOString(),
        error: error?.message,
        hasSession: !!data.session
      })

      // 清除會話並重導向登入
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
      return false
    }

    // 更新 auth store 的會話資料（如果使用者是 OAuth 使用者）
    const { user, session } = data
    const authState = useAuthStore.getState()

    if (authState.isOAuthUser && user) {
      // 只更新使用者資料，token 由後端 httpOnly cookie 管理
      authState.setOAuthUser({
        ...authState.user!,
        id: user.id,
        email: user.email!,
        name: authState.user?.name || user.user_metadata?.name || user.email!.split('@')[0],
        oauthProvider: authState.oauthProvider,
        profilePicture: authState.profilePicture,
      })
    }

    return true
  } catch (error) {
    console.error('[SessionManager] ❌ Session refresh error:', error)

    // 🔍 監控日誌：追蹤 Session 刷新異常導致的登出
    console.warn('[SessionManager] 🚫 Exception during session refresh - Logging out', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    })

    useAuthStore.getState().logout()
    return false
  }
}

/**
 * 驗證當前會話有效性
 * 檢查會話是否即將過期（< 5 分鐘），若是則自動刷新
 */
export async function validateSession(): Promise<SessionStatus> {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return {
        isValid: false,
        needsRefresh: false,
      }
    }

    // 檢查 token 過期時間
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000

    // 如果 token 即將在 5 分鐘內過期，標記為需要刷新
    const needsRefresh = expiresAt - now < fiveMinutes

    if (needsRefresh) {
      // 自動刷新
      await refreshSession()
    }

    return {
      isValid: true,
      expiresAt,
      needsRefresh,
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      isValid: false,
      needsRefresh: false,
    }
  }
}

/**
 * 設定自動刷新定時器
 * 在 token 過期前自動執行刷新
 */
export function setupAutoRefresh(): () => void {
  let refreshTimer: NodeJS.Timeout | null = null

  const scheduleRefresh = async () => {
    const status = await validateSession()

    if (!status.isValid) {
      // 會話無效，停止自動刷新
      if (refreshTimer) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }
      return
    }

    if (status.expiresAt) {
      const now = Date.now()
      const expiresIn = status.expiresAt - now
      const refreshTime = Math.max(expiresIn - 5 * 60 * 1000, 60 * 1000) // 至少 1 分鐘後刷新

      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }

      refreshTimer = setTimeout(async () => {
        await refreshSession()
        scheduleRefresh() // 遞迴排程下次刷新
      }, refreshTime)
    }
  }

  // 啟動初始排程
  scheduleRefresh()

  // 返回清理函式
  return () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }
}

/**
 * 監聽 Supabase 認證狀態變化
 * 當使用者登入/登出時自動同步 auth store
 */
export function setupAuthListener(): () => void {
  const supabase = createClient()

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      const authStore = useAuthStore.getState()

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            // OAuth 登入事件
            const user = session.user
            if (user.app_metadata?.provider === 'google') {
              authStore.setOAuthUser({
                id: user.id,
                email: user.email!,
                name: user.user_metadata?.name || user.email!.split('@')[0],
                oauthProvider: 'google',
                profilePicture: user.user_metadata?.avatar_url || null,
              })
            }
          }
          break

        case 'SIGNED_OUT':
          // 確保清除 auth store
          authStore.logout()
          break

        case 'TOKEN_REFRESHED':
          // Token 已刷新，更新 store（如果是 OAuth 使用者）
          if (session && authStore.isOAuthUser) {
            await refreshSession()
          }
          break

        case 'USER_UPDATED':
          // 使用者資料更新
          if (session?.user && authStore.isOAuthUser) {
            const user = session.user
            authStore.setOAuthUser({
              ...authStore.user!,
              name: user.user_metadata?.name || authStore.user?.name!,
              profilePicture: user.user_metadata?.avatar_url || authStore.profilePicture,
            })
          }
          break
      }
    }
  )

  // 返回清理函式
  return () => {
    subscription.unsubscribe()
  }
}

/**
 * 初始化會話管理
 * 啟動自動刷新和認證監聽
 */
export function initializeSessionManager(): () => void {
  const cleanupAutoRefresh = setupAutoRefresh()
  const cleanupAuthListener = setupAuthListener()

  // 返回組合的清理函式
  return () => {
    cleanupAutoRefresh()
    cleanupAuthListener()
  }
}
