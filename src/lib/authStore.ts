import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI, User } from '@/lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  // OAuth 相關 state
  isOAuthUser: boolean
  oauthProvider: string | null
  profilePicture: string | null

  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  // OAuth 專用 actions
  setOAuthUser: (user: User) => void
}

// Token 儲存在 httpOnly cookies 中，由後端管理
// localStorage 只儲存登入狀態與過期時間
const USER_KEY = 'pip-boy-user'
const AUTH_STATE_KEY = 'pip-boy-auth-state'

interface AuthStateStorage {
  expiresAt: number // JWT exp timestamp (秒)
  issuedAt: number  // 本地儲存時間戳記(毫秒)
}

/**
 * 檢查 localStorage 中的登入狀態是否過期
 * @returns true 表示有效登入狀態，false 表示過期或不存在
 */
function isAuthStateValid(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const authStateStr = localStorage.getItem(AUTH_STATE_KEY)
    if (!authStateStr) return false

    const authState: AuthStateStorage = JSON.parse(authStateStr)
    const currentTimestamp = Math.floor(Date.now() / 1000) // 轉換為秒

    // 檢查是否過期（提前 60 秒判定過期，避免邊界情況）
    return authState.expiresAt > currentTimestamp + 60
  } catch (error) {
    console.warn('Failed to parse auth state:', error)
    return false
  }
}

/**
 * 儲存登入狀態至 localStorage
 */
function saveAuthState(expiresAt: number): void {
  if (typeof window === 'undefined') return

  try {
    const authState: AuthStateStorage = {
      expiresAt,
      issuedAt: Date.now()
    }
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authState))
  } catch (error) {
    console.warn('Failed to save auth state:', error)
  }
}

/**
 * 清除登入狀態
 */
function clearAuthState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_STATE_KEY)
}

export const useAuthStore = create<AuthState>()(persist((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  // OAuth 初始值
  isOAuthUser: false,
  oauthProvider: null,
  profilePicture: null,

  /**
   * 初始化認證狀態
   *
   * 重構變更：
   * - 檢查 localStorage 登入狀態，若過期則直接設為未登入
   * - 僅在有效登入狀態時才呼叫後端 /api/v1/auth/me
   * - 後端會自動驗證 cookie 中的 access token 並返回過期時間
   */
  initialize: async () => {
    if (get().isInitialized) return
    set({ isLoading: true })

    // 檢查 localStorage 中的登入狀態
    if (!isAuthStateValid()) {
      // 登入狀態過期或不存在，直接設為未登入（避免不必要的 API 呼叫）
      console.log('Auth state expired or not found, skipping API call')
      clearAuthState()
      set({
        user: null,
        isOAuthUser: false,
        oauthProvider: null,
        profilePicture: null,
        isLoading: false,
        isInitialized: true
      })
      return
    }

    try {
      // 呼叫後端 /me 端點（會自動使用 httpOnly cookie 中的 token）
      const response = await authAPI.getCurrentUser()

      // 儲存新的過期時間至 localStorage
      if (response.token_expires_at) {
        saveAuthState(response.token_expires_at)
      }

      // 成功取得使用者，表示已登入
      set({
        user: response.user,
        isOAuthUser: response.user.isOAuthUser || false,
        oauthProvider: response.user.oauthProvider || null,
        profilePicture: response.user.profilePicture || null,
        isLoading: false,
        isInitialized: true,
        error: null
      })
    } catch (error: any) {
      // 清除過期的登入狀態
      clearAuthState()

      // 401 表示未登入或 token 過期，這是正常情況
      if (error?.status === 401) {
        set({
          user: null,
          isOAuthUser: false,
          oauthProvider: null,
          profilePicture: null,
          isLoading: false,
          isInitialized: true
        })
      } else {
        // 其他錯誤（網路錯誤等）- 靜默失敗，不顯示錯誤
        console.warn('Auth initialization failed (silent):', error.message || error)
        set({
          user: null,
          isLoading: false,
          isInitialized: true
          // 不設定 error，避免顯示 toast
        })
      }
    }
  },

  /**
   * 登入
   *
   * 重構變更：
   * - 後端會自動設定 httpOnly cookies
   * - 儲存登入狀態與過期時間至 localStorage
   * - 更新 authStore 狀態
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      // 呼叫後端登入 API（會自動設定 httpOnly cookies）
      const res = await authAPI.login({ email, password })

      // 儲存登入狀態與過期時間至 localStorage
      if (res.token_expires_at) {
        saveAuthState(res.token_expires_at)
      }

      // 判斷是否為 OAuth 使用者
      const isOAuth = res.user.isOAuthUser || res.user.oauthProvider !== null

      // 更新 store 狀態
      set({
        user: res.user,
        isOAuthUser: isOAuth,
        oauthProvider: res.user.oauthProvider || null,
        profilePicture: res.user.profilePicture || null,
        isLoading: false,
        error: null
      })

      // 追蹤登入事件
      import('@/lib/actionTracker').then(m => m.track('app:login', { user: res.user?.id }))
    } catch (e: any) {
      set({ error: e?.message || '登入失敗', isLoading: false })
      throw e
    }
  },

  /**
   * 登出
   *
   * 重構變更：
   * - 呼叫後端 /api/v1/auth/logout 清除 httpOnly cookies
   * - 清除 localStorage 登入狀態
   * - 清除 authStore 狀態
   */
  logout: async () => {
    try {
      // 呼叫後端 logout API（會清除 httpOnly cookies）
      await authAPI.logout()
    } catch (e) {
      console.error('Backend logout failed:', e)
      // 繼續執行本地登出，即使後端失敗
    } finally {
      // 清除本地儲存
      if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem('pip-boy-remember')
        clearAuthState() // 清除登入狀態
      }

      // 清除 store 狀態
      set({
        user: null,
        isOAuthUser: false,
        oauthProvider: null,
        profilePicture: null,
        error: null
      })

      // 追蹤登出事件
      import('@/lib/actionTracker').then(m => m.track('app:logout', {}))

      // 重導向至首頁
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  },

  clearError: () => set({ error: null }),

  /**
   * 設定 OAuth 使用者
   *
   * 重構變更：
   * - 移除 token 參數（不再需要，後端已設定 httpOnly cookies）
   * - 移除 localStorage token 儲存
   * - 僅更新 authStore 狀態
   */
  setOAuthUser: (user: User) => {
    set({
      user,
      isOAuthUser: true,
      oauthProvider: user.oauthProvider || null,
      profilePicture: user.profilePicture || null,
      error: null,
      isLoading: false,
      isInitialized: true
    })

    // 追蹤 OAuth 登入事件
    import('@/lib/actionTracker').then(m => m.track('app:oauth-login', {
      user: user.id,
      provider: user.oauthProvider
    }))
  }
}), {
  name: 'auth-store',
  partialize: (state) => ({
    // 移除 token from persist（不再儲存在 localStorage）
    user: state.user,
    isOAuthUser: state.isOAuthUser,
    oauthProvider: state.oauthProvider,
    profilePicture: state.profilePicture
  })
}))
