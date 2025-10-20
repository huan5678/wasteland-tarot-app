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

  initialize: (onProgress?: (progress: number) => void) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  // OAuth 專用 actions
  setOAuthUser: (user: User) => void
  // 通用設定使用者方法
  setUser: (user: User, tokenExpiresAt?: number) => void
  // Token 驗證方法
  checkTokenValidity: () => boolean
  startTokenExpiryMonitor: () => void
  stopTokenExpiryMonitor: () => void
  // Token 延長方法
  extendTokenByActivity: (activityDuration: number) => Promise<void>
  extendTokenByLoyalty: () => Promise<void>
  checkLoyaltyStatus: () => Promise<{
    is_eligible: boolean
    login_days_count: number
    login_dates: string[]
    extension_available: boolean
    current_streak: number
  }>
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

/**
 * Token 過期監控定時器 ID
 */
let tokenExpiryTimerId: NodeJS.Timeout | null = null

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
   * - 支援進度回調（最小顯示時間 5 秒）
   */
  initialize: async (onProgress?: (progress: number) => void) => {
    if (get().isInitialized) return
    set({ isLoading: true })

    // 最小 loading 時間：5 秒（讓使用者有時間欣賞 WebGL 動畫）
    const minLoadingTime = 5000 // ms
    const startTime = Date.now()

    // Helper function to report progress
    const reportProgress = (progress: number) => {
      if (onProgress) {
        onProgress(Math.min(100, Math.max(0, progress)))
      }
    }

    // 檢查 localStorage 中的登入狀態
    const hasValidAuthState = isAuthStateValid()

    // Start progress tracking
    let apiCompleted = false
    let timeProgress = 0

    // Time-based progress updater
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      timeProgress = Math.min(100, (elapsed / minLoadingTime) * 100)

      if (hasValidAuthState) {
        // 50% 權重給時間進度，50% 權重給 API 狀態
        const progress = (timeProgress * 0.5) + (apiCompleted ? 50 : 0)
        reportProgress(progress)
      } else {
        // 100% 時間進度
        reportProgress(timeProgress)
      }
    }, 50) // Update every 50ms for smooth animation

    if (!hasValidAuthState) {
      // 登入狀態過期或不存在，直接設為未登入（避免不必要的 API 呼叫）
      console.log('Auth state expired or not found, skipping API call')
      clearAuthState()

      // 等待最小 loading 時間
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }

      clearInterval(progressInterval)
      reportProgress(100)

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
      apiCompleted = true

      // 儲存新的過期時間至 localStorage
      if (response.token_expires_at) {
        saveAuthState(response.token_expires_at)
      }

      // 等待最小 loading 時間
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }

      clearInterval(progressInterval)
      reportProgress(100)

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

      // 啟動 token 過期監控
      get().startTokenExpiryMonitor()
    } catch (error: any) {
      apiCompleted = true
      clearInterval(progressInterval)

      // 清除過期的登入狀態
      clearAuthState()

      // 等待最小 loading 時間
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }

      reportProgress(100)

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
        // 不設定 isInitialized，讓頁面重新載入時重新執行 initialize
        error: null
      })

      // 啟動 token 過期監控
      get().startTokenExpiryMonitor()

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
   * - 停止 token 過期監控
   */
  logout: async () => {
    try {
      // 停止 token 過期監控
      get().stopTokenExpiryMonitor()

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

      // 清除 store 狀態（重置 isInitialized 讓下次登入時重新初始化）
      set({
        user: null,
        isOAuthUser: false,
        oauthProvider: null,
        profilePicture: null,
        isInitialized: false, // 重置初始化狀態
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
   * - 啟動 token 過期監控
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

    // 啟動 token 過期監控
    get().startTokenExpiryMonitor()

    // 追蹤 OAuth 登入事件
    import('@/lib/actionTracker').then(m => m.track('app:oauth-login', {
      user: user.id,
      provider: user.oauthProvider
    }))
  },

  /**
   * 設定使用者（用於註冊後或其他需要直接設定用戶的場景）
   *
   * @param user - 用戶資料
   * @param tokenExpiresAt - Token 過期時間（可選）
   */
  setUser: (user: User, tokenExpiresAt?: number) => {
    // 儲存登入狀態
    if (tokenExpiresAt) {
      saveAuthState(tokenExpiresAt)
    }

    // 判斷是否為 OAuth 使用者
    const isOAuth = user.isOAuthUser || user.oauthProvider !== null

    set({
      user,
      isOAuthUser: isOAuth,
      oauthProvider: user.oauthProvider || null,
      profilePicture: user.profilePicture || null,
      error: null,
      isLoading: false,
      isInitialized: true
    })

    // 啟動 token 過期監控
    get().startTokenExpiryMonitor()
  },

  /**
   * 檢查 Token 有效性
   *
   * @returns true 表示 token 有效，false 表示過期或不存在
   */
  checkTokenValidity: () => {
    return isAuthStateValid()
  },

  /**
   * 啟動 Token 過期監控
   *
   * 每 60 秒檢查一次 token 狀態：
   * - 如果 token 過期且使用者仍在登入狀態，自動登出
   */
  startTokenExpiryMonitor: () => {
    // 只在瀏覽器環境執行
    if (typeof window === 'undefined') return

    // 清除舊的定時器（避免重複）
    if (tokenExpiryTimerId) {
      clearInterval(tokenExpiryTimerId)
    }

    // 每 60 秒檢查一次
    tokenExpiryTimerId = setInterval(() => {
      const state = get()

      // 如果使用者已登入，檢查 token 是否過期
      if (state.user && !isAuthStateValid()) {
        console.warn('Token expired, logging out user')

        // 自動登出
        get().logout()
      }
    }, 60 * 1000) // 60 秒
  },

  /**
   * 停止 Token 過期監控
   */
  stopTokenExpiryMonitor: () => {
    if (tokenExpiryTimerId) {
      clearInterval(tokenExpiryTimerId)
      tokenExpiryTimerId = null
    }
  },

  /**
   * 延長 Token（活躍度模式）
   *
   * @param activityDuration - 活躍時長（秒）
   * @throws 如果未登入、活躍時間不足、達到延長上限等
   */
  extendTokenByActivity: async (activityDuration: number) => {
    const state = get()

    // 檢查登入狀態
    if (!state.user) {
      throw new Error('未登入，無法延長 Token')
    }

    try {
      // 呼叫後端 API
      const response = await authAPI.extendToken({
        extension_type: 'activity',
        activity_duration: activityDuration,
      })

      // 更新 localStorage 中的 token 過期時間
      if (response.token_expires_at) {
        saveAuthState(response.token_expires_at)
      }

      console.log(`✅ Token 延長成功：${response.extended_minutes} 分鐘`)
    } catch (error: any) {
      console.error('❌ Token 延長失敗:', error.message || error)
      throw error
    }
  },

  /**
   * 延長 Token（忠誠度模式）
   *
   * 需滿足條件：7 天內登入 3 天以上
   * @throws 如果未登入、不符合忠誠度條件、今日已領取等
   */
  extendTokenByLoyalty: async () => {
    const state = get()

    // 檢查登入狀態
    if (!state.user) {
      throw new Error('未登入，無法延長 Token')
    }

    try {
      // 呼叫後端 API
      const response = await authAPI.extendToken({
        extension_type: 'loyalty',
      })

      // 更新 localStorage 中的 token 過期時間
      if (response.token_expires_at) {
        saveAuthState(response.token_expires_at)
      }

      // 如果有獎勵，更新使用者資料
      if (response.rewards && state.user) {
        set({
          user: {
            ...state.user,
            karma_score: (state.user.karma_score || 0) + response.rewards.karma_bonus,
          }
        })
      }

      console.log(`✅ 忠誠度 Token 延長成功：${response.extended_minutes} 分鐘`)
      if (response.rewards) {
        console.log(`🎁 獲得獎勵：Karma +${response.rewards.karma_bonus}, 徽章：${response.rewards.badge_unlocked}`)
      }
    } catch (error: any) {
      console.error('❌ 忠誠度 Token 延長失敗:', error.message || error)
      throw error
    }
  },

  /**
   * 檢查忠誠度狀態
   *
   * @returns 忠誠度資訊（是否符合資格、登入天數、連續天數等）
   */
  checkLoyaltyStatus: async () => {
    const state = get()

    // 檢查登入狀態
    if (!state.user) {
      throw new Error('未登入，無法查詢忠誠度狀態')
    }

    try {
      const status = await authAPI.getLoyaltyStatus()
      return status
    } catch (error: any) {
      console.error('❌ 查詢忠誠度狀態失敗:', error.message || error)
      throw error
    }
  }
}), {
  name: 'auth-store',
  version: 2, // 版本號：變更 persist 結構時遞增，自動清除舊資料
  partialize: (state) => ({
    // 移除 token from persist（不再儲存在 localStorage）
    user: state.user,
    isOAuthUser: state.isOAuthUser,
    oauthProvider: state.oauthProvider,
    profilePicture: state.profilePicture,
    // 不保存 isInitialized，讓每次頁面載入都重新初始化（確保正確執行 auth 流程）
    // isLoading: false, // 不保存此狀態（loading 應該每次重新開始）
  }),
  migrate: (persistedState: any, version: number) => {
    // 版本 < 2：清除舊的 isInitialized 資料
    if (version < 2) {
      console.log('[AuthStore] Migrating from version', version, 'to 2 - clearing isInitialized')
      const { isInitialized, ...rest } = persistedState || {}
      return rest
    }
    return persistedState
  }
}))
