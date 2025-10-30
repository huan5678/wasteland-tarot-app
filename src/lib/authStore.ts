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
  // Passkey 認證方式 state (Stage 12.3)
  authMethod: 'passkey' | 'password' | 'oauth' | null
  hasPasskey: boolean
  hasPassword: boolean
  hasOAuth: boolean

  initialize: (onProgress?: (progress: number) => void) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  // OAuth 專用 actions
  setOAuthUser: (user: User, tokenExpiresAt?: number) => void
  // 通用設定使用者方法（擴充支援 authMethod）
  setUser: (user: User, tokenExpiresAt?: number, authMethod?: 'passkey' | 'password' | 'oauth') => void
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
  // 認證方式管理 (Stage 12.3)
  setAuthMethodsState: (state: { hasPasskey: boolean; hasPassword: boolean; hasOAuth: boolean }) => void
  refreshAuthMethods: () => Promise<void>
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
 *
 * 修復日誌（2025-10-30）：
 * - 移除過於激進的 5 分鐘提前判定
 * - 改為 1 分鐘緩衝，避免 API 請求途中過期
 * - 解決「不定時登出」問題
 */
function isAuthStateValid(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const authStateStr = localStorage.getItem(AUTH_STATE_KEY)
    if (!authStateStr) return false

    const authState: AuthStateStorage = JSON.parse(authStateStr)
    const currentTimestamp = Math.floor(Date.now() / 1000) // 轉換為秒

    // 檢查是否過期（保留 1 分鐘緩衝，避免在 API 請求途中過期）
    // 1 分鐘 = 60 秒
    // 注意：原本提前 5 分鐘判定（300 秒）導致過早登出
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
  if (typeof window === 'undefined') {
    console.warn('⚠️ [AuthStore] Cannot save auth state: not in browser environment')
    return
  }

  try {
    const authState: AuthStateStorage = {
      expiresAt,
      issuedAt: Date.now()
    }
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(authState))
    console.log('✅ [AuthStore] Auth state saved to localStorage:', {
      key: AUTH_STATE_KEY,
      expiresAt,
      expiresAtDate: new Date(expiresAt * 1000).toISOString(),
      issuedAt: authState.issuedAt
    })
  } catch (error) {
    console.error('❌ [AuthStore] Failed to save auth state:', error)
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
  // Passkey 認證方式初始值 (Stage 12.3)
  authMethod: null,
  hasPasskey: false,
  hasPassword: false,
  hasOAuth: false,

  /**
   * 初始化認證狀態
   *
   * 重構變更（2025-10-29）：
   * - 改進分頁切換時的登入狀態保持
   * - 優先檢查 localStorage 中的持久化用戶資料
   * - 如果有持久化資料且未過期，先恢復登入狀態
   * - 然後在背景呼叫後端驗證，失敗時才清空狀態
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

    // 檢查 localStorage 中的 auth state 是否有效
    const hasValidAuthState = isAuthStateValid()

    // 如果有有效的 auth state，先從 persist 恢復用戶狀態
    // 這樣即使後端驗證失敗，用戶也不會看到「閃一下」就登出的情況
    if (hasValidAuthState && get().user) {
      console.log('[AuthStore] ✅ 發現有效的持久化登入狀態，先恢復用戶資料')
      // 不需要額外操作，persist middleware 已經恢復了 user 資料
    }

    console.log('[AuthStore] 🔐 嘗試使用 httpOnly cookies 驗證登入狀態...')

    // Start progress tracking
    let apiCompleted = false
    let timeProgress = 0

    // Time-based progress updater
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      timeProgress = Math.min(100, (elapsed / minLoadingTime) * 100)
      // 50% 權重給時間進度，50% 權重給 API 狀態
      const progress = (timeProgress * 0.5) + (apiCompleted ? 50 : 0)
      reportProgress(progress)
    }, 50) // Update every 50ms for smooth animation

    try {
      // 呼叫後端 /me 端點（會自動使用 httpOnly cookie 中的 token）
      console.log('[AuthStore] 📡 呼叫後端 /me 驗證...')
      const response = await authAPI.getCurrentUser()
      apiCompleted = true

      console.log('[AuthStore] ✅ 後端驗證成功:', {
        userId: response.user?.id,
        email: response.user?.email,
        hasTokenExpires: !!response.token_expires_at
      })

      // 儲存新的過期時間至 localStorage
      if (response.token_expires_at) {
        console.log('[AuthStore] 💾 儲存 token 過期時間:', response.token_expires_at)
        saveAuthState(response.token_expires_at)
      } else {
        console.warn('[AuthStore] ⚠️ 後端未返回 token_expires_at')
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

      console.log('[AuthStore] ❌ 後端驗證失敗:', {
        status: error?.status,
        message: error?.message,
        hasPersistedUser: !!get().user
      })

      // 等待最小 loading 時間
      const elapsed = Date.now() - startTime
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed))
      }

      reportProgress(100)

      // 重要修正（2025-10-30）：
      // 如果有持久化的用戶資料且 auth state 有效，暫時保留登入狀態
      // 但**不啟動監控**，避免過度檢查導致誤判登出
      // 讓下次 API 請求自然處理 401 錯誤
      if (hasValidAuthState && get().user) {
        console.log('[AuthStore] ⚠️ 後端驗證失敗，但 localStorage 狀態有效，暫時保留用戶登入狀態')
        set({
          isLoading: false,
          isInitialized: true,
          // 保留 user、isOAuthUser 等資料
          // 不設定 error，避免顯示錯誤訊息
        })

        // 修復：不啟動 token 監控，避免誤判
        // 原因：後端驗證失敗可能是暫時性網路問題
        // 應該讓下次 API 請求自然地處理 401 錯誤
        // get().startTokenExpiryMonitor()  // ⚠️ 已移除
      } else {
        // auth state 已過期或沒有持久化資料，清除登入狀態
        console.log('[AuthStore] 🔒 Token 過期或未登入，清除登入狀態')
        clearAuthState()

        set({
          user: null,
          isOAuthUser: false,
          oauthProvider: null,
          profilePicture: null,
          isLoading: false,
          isInitialized: true,
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
        authMethod: null,  // Stage 12.3: 清除認證方式
        hasPasskey: false, // Stage 12.3: 清除認證狀態
        hasPassword: false,
        hasOAuth: false,
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
   * - 新增 tokenExpiresAt 參數以儲存 token 過期時間
   * - 儲存登入狀態至 localStorage
   * - 更新 authStore 狀態
   * - 啟動 token 過期監控
   */
  setOAuthUser: (user: User, tokenExpiresAt?: number) => {
    // 調試日誌：檢查 tokenExpiresAt
    console.log('🔍 [AuthStore] setOAuthUser called:', {
      has_tokenExpiresAt: tokenExpiresAt !== undefined,
      tokenExpiresAt,
      type: typeof tokenExpiresAt
    })

    // 儲存登入狀態至 localStorage（使用更嚴格的類型檢查）
    if (typeof tokenExpiresAt === 'number' && tokenExpiresAt > 0) {
      console.log('✅ [AuthStore] Saving auth state with expires:', tokenExpiresAt)
      saveAuthState(tokenExpiresAt)
    } else {
      console.error('❌ [AuthStore] Invalid tokenExpiresAt:', {
        value: tokenExpiresAt,
        type: typeof tokenExpiresAt,
        isNumber: typeof tokenExpiresAt === 'number',
        isPositive: typeof tokenExpiresAt === 'number' && tokenExpiresAt > 0
      })
    }

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
   * @param authMethod - 認證方式（'passkey' | 'password' | 'oauth'）(Stage 12.3)
   */
  setUser: (user: User, tokenExpiresAt?: number, authMethod?: 'passkey' | 'password' | 'oauth') => {
    // 儲存登入狀態（使用更嚴格的類型檢查）
    if (typeof tokenExpiresAt === 'number' && tokenExpiresAt > 0) {
      saveAuthState(tokenExpiresAt)
    } else if (tokenExpiresAt !== undefined) {
      console.warn('[AuthStore] setUser: Invalid tokenExpiresAt:', tokenExpiresAt)
    }

    // 判斷是否為 OAuth 使用者
    const isOAuth = user.isOAuthUser || user.oauthProvider !== null

    set({
      user,
      isOAuthUser: isOAuth,
      oauthProvider: user.oauthProvider || null,
      profilePicture: user.profilePicture || null,
      authMethod: authMethod || null,  // Stage 12.3: 設定認證方式
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
   * 修復日誌（2025-10-30）：
   * - 降低檢查頻率從 5 分鐘改為 10 分鐘
   * - 搭配 isAuthStateValid() 的 1 分鐘緩衝
   * - 避免過於激進的登出檢查
   *
   * 每 10 分鐘檢查一次 token 狀態：
   * - 如果 token 過期且使用者仍在登入狀態，自動登出
   * - 降低檢查頻率以減少效能消耗和誤判機率
   */
  startTokenExpiryMonitor: () => {
    // 只在瀏覽器環境執行
    if (typeof window === 'undefined') return

    // 清除舊的定時器（避免重複）
    if (tokenExpiryTimerId) {
      clearInterval(tokenExpiryTimerId)
    }

    // 每 10 分鐘檢查一次（降低頻率，避免過度檢查）
    tokenExpiryTimerId = setInterval(() => {
      const state = get()

      // 如果使用者已登入，檢查 token 是否過期
      if (state.user && !isAuthStateValid()) {
        console.warn('[AuthStore] Token expired, logging out user')

        // 自動登出
        get().logout()
      }
    }, 10 * 60 * 1000) // 10 分鐘 = 600 秒（原本 5 分鐘過於頻繁）
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
  },

  /**
   * 設定認證方式狀態 (Stage 12.3)
   *
   * @param state - 認證方式狀態
   */
  setAuthMethodsState: (state: { hasPasskey: boolean; hasPassword: boolean; hasOAuth: boolean }) => {
    set({
      hasPasskey: state.hasPasskey,
      hasPassword: state.hasPassword,
      hasOAuth: state.hasOAuth
    })
  },

  /**
   * 重新查詢用戶的認證方式狀態 (Stage 12.3)
   *
   * 呼叫後端 /api/v1/auth/methods 端點並更新 store 狀態
   */
  refreshAuthMethods: async () => {
    const state = get()

    // 只有已登入用戶才能查詢
    if (!state.user) {
      return
    }

    try {
      const methods = await authAPI.getAuthMethods()
      set({
        hasPasskey: methods.has_passkey,
        hasPassword: methods.has_password,
        hasOAuth: methods.has_oauth
      })
    } catch (error: any) {
      console.warn('❌ 查詢認證方式失敗（靜默處理）:', error.message || error)
      // 靜默處理錯誤，不更新狀態
    }
  }
}), {
  name: 'auth-store',
  version: 3, // 版本號：變更 persist 結構時遞增，自動清除舊資料 (Stage 12.3: v2 -> v3)
  partialize: (state) => ({
    // 移除 token from persist（不再儲存在 localStorage）
    user: state.user,
    isOAuthUser: state.isOAuthUser,
    oauthProvider: state.oauthProvider,
    profilePicture: state.profilePicture,
    // Stage 12.3: 新增認證方式狀態
    authMethod: state.authMethod,
    hasPasskey: state.hasPasskey,
    hasPassword: state.hasPassword,
    hasOAuth: state.hasOAuth,
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
    // 版本 < 3：新增 Stage 12.3 認證方式欄位
    if (version < 3) {
      console.log('[AuthStore] Migrating from version', version, 'to 3 - adding authMethod fields')
      return {
        ...persistedState,
        authMethod: null,
        hasPasskey: false,
        hasPassword: false,
        hasOAuth: false
      }
    }
    return persistedState
  },
  // 方案 2：持久化狀態監控（偵測寫入完成和錯誤）
  onRehydrateStorage: () => {
    console.log('[AuthStore] 🔄 開始從 localStorage 還原狀態...')

    return (state, error) => {
      if (error) {
        console.error('[AuthStore] ❌ 狀態還原失敗:', error)
      } else if (state) {
        console.log('[AuthStore] ✅ 狀態還原成功:', {
          hasUser: !!state.user,
          isOAuthUser: state.isOAuthUser,
          oauthProvider: state.oauthProvider,
          authMethod: state.authMethod,
          hasPasskey: state.hasPasskey,
          hasPassword: state.hasPassword,
          hasOAuth: state.hasOAuth
        })
      } else {
        console.log('[AuthStore] ℹ️ 沒有儲存的狀態（首次訪問或已清除）')
      }
    }
  }
}))
