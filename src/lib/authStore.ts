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

// 已移除 TOKEN_KEY - 不再使用 localStorage 儲存 token
// Token 現在儲存在 httpOnly cookies 中，由後端管理
const USER_KEY = 'pip-boy-user'

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
   * - 移除 localStorage token 檢查
   * - 改為呼叫後端 /api/v1/auth/me（依賴 httpOnly cookies）
   * - 後端會自動驗證 cookie 中的 access token
   */
  initialize: async () => {
    if (get().isInitialized) return
    set({ isLoading: true })

    try {
      // 呼叫後端 /me 端點（會自動使用 httpOnly cookie 中的 token）
      const currentUser = await authAPI.getCurrentUser()

      // 成功取得使用者，表示已登入
      set({
        user: currentUser,
        isOAuthUser: currentUser.isOAuthUser || false,
        oauthProvider: currentUser.oauthProvider || null,
        profilePicture: currentUser.profilePicture || null,
        isLoading: false,
        isInitialized: true,
        error: null
      })
    } catch (error: any) {
      // 401 表示未登入或 token 過期，這是正常情況
      if (error?.response?.status === 401) {
        set({
          user: null,
          isOAuthUser: false,
          oauthProvider: null,
          profilePicture: null,
          isLoading: false,
          isInitialized: true
        })
      } else {
        // 其他錯誤（網路錯誤等）
        console.error('Auth initialization failed:', error)
        set({
          user: null,
          isLoading: false,
          isInitialized: true,
          error: '初始化失敗'
        })
      }
    }
  },

  /**
   * 登入
   *
   * 重構變更：
   * - 移除 localStorage token 儲存
   * - 後端會自動設定 httpOnly cookies
   * - 僅更新 authStore 狀態
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      // 呼叫後端登入 API（會自動設定 httpOnly cookies）
      const res = await authAPI.login({ email, password })

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
   * - 移除 Supabase 客戶端呼叫
   * - 呼叫後端 /api/v1/auth/logout 清除 httpOnly cookies（不再傳 token 參數）
   * - 移除 localStorage token 管理
   */
  logout: async () => {
    try {
      // 呼叫後端 logout API（會清除 httpOnly cookies），不再傳 token
      await authAPI.logout()
    } catch (e) {
      console.error('Backend logout failed:', e)
      // 繼續執行本地登出，即使後端失敗
    } finally {
      // 清除本地儲存（僅保留必要的 user 資訊）
      if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem('pip-boy-remember')
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
