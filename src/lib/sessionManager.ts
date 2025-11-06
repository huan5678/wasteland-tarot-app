/**
 * Session Manager V2 - Backend API 會話管理工具
 * 使用後端 API 處理 token 刷新和會話驗證
 *
 * 改進：
 * - ✅ 不再直接呼叫 Supabase Auth API
 * - ✅ 完全使用後端 API (/api/v1/auth/refresh, /api/v1/auth/me)
 * - ✅ 符合前後端分離原則
 * - ✅ 提升安全性（token 由 httpOnly cookie 管理）
 *
 * @version 2.0.0
 * @since 2025-10-31
 */

import { useAuthStore } from './authStore'

interface SessionStatus {
  isValid: boolean
  expiresAt?: number
  needsRefresh: boolean
}

interface UserInfo {
  id: string
  email: string
  name: string
  display_name?: string
  avatar_url?: string
  oauth_provider?: string
  profile_picture_url?: string
  karma_score: number
  karma_alignment: string
  faction_alignment?: string
  wasteland_location?: string
  is_oauth_user: boolean
  is_verified: boolean
  is_active: boolean
  is_admin: boolean
  created_at?: string
}

interface MeResponse {
  user: UserInfo
  statistics?: Record<string, any>
  token_expires_at?: number
}

/**
 * 刷新會話 - 使用後端 API
 * 呼叫 /api/v1/auth/refresh 刷新 access token
 *
 * 後端會：
 * 1. 從 cookie 讀取 refresh_token
 * 2. 驗證 refresh_token
 * 3. 生成新的 access_token 和 refresh_token
 * 4. 設定新的 httpOnly cookies
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include', // 必須帶 httpOnly cookie
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Session refresh failed' }))
      console.error('[SessionManagerV2] ❌ Session refresh failed:', error)

      // 監控日誌：追蹤 Session 刷新失敗導致的登出
      console.warn('[SessionManagerV2] 🚫 Session refresh failed - Logging out', {
        timestamp: new Date().toISOString(),
        status: response.status,
        error: error.detail,
      })

      // 清除會話並重導向登入
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
      return false
    }

    const data = await response.json()

    // 成功刷新，token 已由後端設定在 httpOnly cookie 中
    console.log('[SessionManagerV2] ✅ Session refreshed successfully', {
      timestamp: new Date().toISOString(),
      expiresAt: data.expires_at,
    })

    // 可選：如果後端返回使用者資訊，更新 auth store
    if (data.user) {
      const authState = useAuthStore.getState()
      if (authState.isOAuthUser) {
        authState.setOAuthUser({
          ...authState.user!,
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || authState.user?.name!,
          oauthProvider: data.user.oauth_provider || authState.oauthProvider,
          profilePicture: data.user.avatar_url || authState.profilePicture,
        })
      }
    }

    return true
  } catch (error) {
    console.error('[SessionManagerV2] ❌ Session refresh error:', error)

    // 監控日誌：追蹤 Session 刷新異常導致的登出
    console.warn('[SessionManagerV2] 🚫 Exception during session refresh - Logging out', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    })

    useAuthStore.getState().logout()
    return false
  }
}

/**
 * 驗證當前會話有效性 - 使用後端 API
 * 呼叫 /api/v1/auth/me 驗證 access token 並取得使用者資訊
 *
 * 後端會：
 * 1. 從 cookie 讀取 access_token
 * 2. 驗證 access_token
 * 3. 返回使用者資訊和 token 過期時間
 */
export async function validateSession(): Promise<SessionStatus> {
  try {
    const response = await fetch('/api/v1/auth/me', {
      method: 'GET',
      credentials: 'include', // 必須帶 httpOnly cookie
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn('[SessionManagerV2] ⚠️ Session validation failed:', response.status)
      return {
        isValid: false,
        needsRefresh: false,
      }
    }

    const data: MeResponse = await response.json()

    // 更新 auth store 的使用者資訊
    const authState = useAuthStore.getState()
    if (data.user) {
      // 如果是 OAuth 使用者，更新資訊
      if (data.user.is_oauth_user && data.user.oauth_provider) {
        authState.setOAuthUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          oauthProvider: data.user.oauth_provider as 'google',
          profilePicture: data.user.avatar_url || null,
        })
      } else if (authState.user) {
        // 更新一般使用者資訊
        authState.setUser({
          ...authState.user,
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        })
      }
    }

    // 檢查 token 過期時間
    const expiresAt = data.token_expires_at ? data.token_expires_at * 1000 : 0
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000

    // 如果 token 即將在 5 分鐘內過期，標記為需要刷新
    const needsRefresh = expiresAt > 0 && (expiresAt - now < fiveMinutes)

    if (needsRefresh) {
      console.log('[SessionManagerV2] ⏰ Token expiring soon, auto-refreshing...', {
        expiresAt: new Date(expiresAt).toISOString(),
        timeLeft: Math.round((expiresAt - now) / 1000) + 's',
      })
      // 自動刷新
      await refreshSession()
    }

    return {
      isValid: true,
      expiresAt,
      needsRefresh,
    }
  } catch (error) {
    console.error('[SessionManagerV2] ❌ Session validation error:', error)
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

      console.log('[SessionManagerV2] 📅 Next refresh scheduled in:', Math.round(refreshTime / 1000) + 's')

      refreshTimer = setTimeout(async () => {
        console.log('[SessionManagerV2] 🔄 Auto-refreshing session...')
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
 * 監聽認證狀態變化 - 使用 API 輪詢
 * 每分鐘檢查一次會話狀態
 *
 * 注意：不再使用 Supabase realtime，改用輪詢機制
 */
export function setupAuthListener(): () => void {
  let intervalId: NodeJS.Timeout | null = null

  // 每分鐘檢查一次會話狀態
  intervalId = setInterval(async () => {
    const status = await validateSession()

    if (!status.isValid) {
      // 會話無效，清除 auth store
      const authStore = useAuthStore.getState()
      if (authStore.user) {
        console.warn('[SessionManagerV2] 🚫 Session invalid - Logging out')
        authStore.logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    }
  }, 60 * 1000) // 每 60 秒檢查一次

  // 初始檢查
  validateSession()

  // 返回清理函式
  return () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

/**
 * 初始化會話管理
 * 啟動自動刷新和認證監聽
 */
export function initializeSessionManager(): () => void {
  console.log('[SessionManagerV2] 🚀 Initializing session manager...')

  const cleanupAutoRefresh = setupAutoRefresh()
  const cleanupAuthListener = setupAuthListener()

  // 返回組合的清理函式
  return () => {
    console.log('[SessionManagerV2] 🛑 Cleaning up session manager...')
    cleanupAutoRefresh()
    cleanupAuthListener()
  }
}
