import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI, User } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  // OAuth 相關 state
  isOAuthUser: boolean
  oauthProvider: string | null
  profilePicture: string | null

  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void> // 改用 email
  logout: () => Promise<void> // 改為 async
  refreshToken: () => Promise<void>
  clearError: () => void
  // OAuth 專用 actions
  setOAuthUser: (user: User, token: string) => void
}

const TOKEN_KEY = 'pip-boy-token'
const USER_KEY = 'pip-boy-user'

export const useAuthStore = create<AuthState>()(persist((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  // OAuth 初始值
  isOAuthUser: false,
  oauthProvider: null,
  profilePicture: null,

  initialize: async () => {
    if (get().isInitialized) return
    set({ isLoading: true })
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
      const userStr = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null
      if (token && userStr) {
        try {
          const currentUser = await authAPI.getCurrentUser(token)
          set({ user: currentUser, token, isLoading: false, isInitialized: true, error: null })
        } catch {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
          }
          set({ user: null, token: null, isLoading: false, isInitialized: true })
        }
      } else {
        set({ isLoading: false, isInitialized: true })
      }
    } catch (e) {
      console.error('Auth initialization failed', e)
      set({ isLoading: false, isInitialized: true })
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await authAPI.login({ email, password })
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, res.access_token)
        localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      }
      // 判斷是否為 OAuth 使用者
      const isOAuth = res.user.isOAuthUser || res.user.oauthProvider !== null
      set({
        user: res.user,
        token: res.access_token,
        isOAuthUser: isOAuth,
        oauthProvider: res.user.oauthProvider || null,
        profilePicture: res.user.profilePicture || null,
        isLoading: false,
        error: null
      });
      import('@/lib/actionTracker').then(m=>m.track('app:login',{user: res.user?.id}))
    } catch (e: any) {
      set({ error: e?.message || '登入失敗', isLoading: false })
      throw e
    }
  },

  logout: async () => {
    const { token, isOAuthUser } = get()

    try {
      // 若為 OAuth 使用者，呼叫 Supabase signOut
      if (isOAuthUser && typeof window !== 'undefined') {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        await supabase.auth.signOut()
      }

      // 呼叫後端 logout API 清除 httpOnly cookies
      if (token) {
        try {
          await authAPI.logout(token)
        } catch (e) {
          console.error('Backend logout failed:', e)
          // 繼續執行本地登出，即使後端失敗
        }
      }
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      // 清除本地儲存
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem('pip-boy-remember')

        // 清除 Supabase 相關 cookies (由瀏覽器處理)
        // sb-access-token, sb-refresh-token 等會由 Supabase signOut 處理
      }

      // 清除 store 狀態
      set({
        user: null,
        token: null,
        isOAuthUser: false,
        oauthProvider: null,
        profilePicture: null,
        error: null
      })

      import('@/lib/actionTracker').then(m=>m.track('app:logout',{}))

      // 重導向至首頁
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  },

  refreshToken: async () => {
    const token = get().token
    if (!token) return
    try {
      const res = await authAPI.refreshToken(token)
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, res.access_token)
      }
      set({ token: res.access_token })
    } catch (e) {
      get().logout()
    }
  },

  clearError: () => set({ error: null }),

  /**
   * 設定 OAuth 使用者
   * 用於 OAuth 登入流程完成後更新 store 狀態
   */
  setOAuthUser: (user: User, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    set({
      user,
      token,
      isOAuthUser: true,
      oauthProvider: user.oauthProvider || null,
      profilePicture: user.profilePicture || null,
      error: null,
      isLoading: false
    });
    import('@/lib/actionTracker').then(m=>m.track('app:oauth-login',{
      user: user.id,
      provider: user.oauthProvider
    }))
  }
}), {
  name: 'auth-store',
  partialize: (state) => ({
    token: state.token,
    user: state.user,
    isOAuthUser: state.isOAuthUser,
    oauthProvider: state.oauthProvider,
    profilePicture: state.profilePicture
  })
}))
