import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '@/services/auth.service'
import type { User } from '@/types/api'
import { adaptBackendUserToFrontend } from '@/lib/adapters/userAdapter'

interface AuthState {
// ... existing interface ...
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
  // 頭像管理
  updateAvatarUrl: (avatarUrl: string) => void
  // Token 自動續期
  tryRefreshToken: () => Promise<boolean>
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
    const result = authState.expiresAt > currentTimestamp + 60

    // 🔍 監控日誌：只在即將過期或已過期時記錄
    const remainingSeconds = authState.expiresAt - currentTimestamp
    if (!result || remainingSeconds < 300) {
      console.log('[AuthStore] ⏰ Token Status Check', {
        timestamp: new Date().toISOString(),
        isValid: result,
        expiresAt: new Date(authState.expiresAt * 1000).toISOString(),
        currentTime: new Date(currentTimestamp * 1000).toISOString(),
        remainingSeconds: remainingSeconds,
        remainingMinutes: Math.floor(remainingSeconds / 60),
      })
    }

    return result
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
   *
   * 重構變更（2025-10-30）：
   * - 新增 cookie 檢查，確保與 middleware 同步
   * - 如果 cookie 已過期但 localStorage 還在，清除狀態
   * - 解決「不定時登出」的狀態不同步問題
   */
  initialize: async (onProgress?: (progress: number) => void) => {
    if (get().isInitialized) return
    set({ isLoading: true })

    // 最小 loading 時間：開發環境 100ms，生產環境 5 秒（讓使用者有時間欣賞 WebGL 動畫）
    const minLoadingTime = process.env.NODE_ENV === 'development' ? 100 : 5000 // ms
    const startTime = Date.now()

    // Helper function to report progress
    const reportProgress = (progress: number) => {
      if (onProgress) {
        onProgress(Math.min(100, Math.max(0, progress)))
      }
    }

    // 檢查 localStorage 中的 auth state 是否有效
    const hasValidAuthState = isAuthStateValid()

    // ⚠️ 重要：不要在這裡檢查 httpOnly cookies！
    // Backend 設置的 access_token 和 refresh_token 都是 httpOnly cookies
    // httpOnly cookies 無法被 JavaScript 讀取（document.cookie 看不到）
    // 只能通過後端 API 調用來驗證登入狀態
    // 如果 API 返回 401，再清除 localStorage

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
      const response = await AuthService.getCurrentUser()
      apiCompleted = true

      // 適配後端使用者資料到前端格式
      const adaptedUser = response.user ? adaptBackendUserToFrontend(response.user) : null

      console.log('[AuthStore] ✅ Initialize: Backend validation successful', {
        timestamp: new Date().toISOString(),
        userId: adaptedUser?.id,
        email: adaptedUser?.email,
        hasTokenExpires: !!response.token_expires_at,
        tokenExpiresAt: response.token_expires_at ? new Date(response.token_expires_at * 1000).toISOString() : 'N/A'
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

      if (adaptedUser) {
        // 成功取得使用者，表示已登入
        set({
          user: adaptedUser,
          isOAuthUser: adaptedUser.isOAuthUser || false,
          oauthProvider: adaptedUser.oauthProvider || null,
          profilePicture: adaptedUser.profilePicture || null,
          isLoading: false,
          isInitialized: true,
          error: null
        })

        // 啟動 token 過期監控
        get().startTokenExpiryMonitor()
      } else {
        // 雖然請求成功但沒有 user (不應該發生在 /me 成功的情況下)
        throw new Error('無法取得使用者資料')
      }
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

      // 🔧 改進的 fallback 邏輯（2025-11-14）：
      // 區分 401 認證錯誤 vs 網路錯誤
      const is401Error = error?.status === 401 || error?.message?.includes('401')
      const isNetworkError = !error?.status && (
        error?.message?.includes('fetch') ||
        error?.message?.includes('network') ||
        error?.message?.includes('timeout')
      )

      if (is401Error) {
        // Token 確實過期，清除登入狀態
        console.log('[AuthStore] 🔒 Initialize: Token expired (401), clearing auth state', {
          timestamp: new Date().toISOString(),
          reason: '401 Unauthorized - Token expired or invalid'
        })
        clearAuthState()

        set({
          user: null,
          isOAuthUser: false,
          oauthProvider: null,
          profilePicture: null,
          isLoading: false,
          isInitialized: true,
        })
      } else if (isNetworkError && hasValidAuthState && get().user) {
        // 網路問題，暫時保留登入狀態
        console.log('[AuthStore] ⚠️ Initialize: Network error, using localStorage fallback', {
          timestamp: new Date().toISOString(),
          hasValidAuthState,
          user: get().user?.email,
          reason: 'Network error - temporary failure'
        })
        set({
          isLoading: false,
          isInitialized: true,
          // 保留 user、isOAuthUser 等資料
        })

        // 🔧 嘗試使用 refresh token 續期
        get().tryRefreshToken().catch(err => {
          console.warn('[AuthStore] Auto refresh failed:', err)
        })
      } else {
        // 其他錯誤或無有效狀態，清除登入
        console.log('[AuthStore] 🔒 Initialize: Clearing auth state', {
          timestamp: new Date().toISOString(),
          reason: 'Unknown error or invalid state',
          hasValidAuthState,
          hasUser: !!get().user
        })
        clearAuthState()

        set({
          user: null,
          isOAuthUser: false,
          oauthProvider: null,
          profilePicture: null,
          isLoading: false,
          isInitialized: true,
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
      const res = await AuthService.login({ email, password })

      // 適配後端使用者資料到前端格式
      const adaptedUser = adaptBackendUserToFrontend(res.user)

      // 儲存登入狀態與過期時間至 localStorage
      if (res.token_expires_at) {
        saveAuthState(res.token_expires_at)
      }

      // 判斷是否為 OAuth 使用者
      const isOAuth = adaptedUser.isOAuthUser || adaptedUser.oauthProvider !== null

      // 更新 store 狀態
      set({
        user: adaptedUser,
        isOAuthUser: isOAuth,
        oauthProvider: adaptedUser.oauthProvider || null,
        profilePicture: adaptedUser.profilePicture || null,
        isLoading: false,
        // 不設定 isInitialized，讓頁面重新載入時重新執行 initialize
        error: null
      })

      // 啟動 token 過期監控
      get().startTokenExpiryMonitor()

      // 追蹤登入事件
      import('@/lib/actionTracker').then(m => m.track('app:login', { user: adaptedUser.id }))
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
    // 🔍 監控日誌：追蹤登出觸發來源
    const currentUser = get().user?.email
    const stackTrace = new Error().stack?.split('\n').slice(1, 4).map(line => line.trim())

    console.log('[AuthStore] 🚪 LOGOUT TRIGGERED', {
      timestamp: new Date().toISOString(),
      caller: stackTrace,
      currentUser,
      isInitialized: get().isInitialized,
      authMethod: get().authMethod
    })

    try {
      // 停止 token 過期監控
      get().stopTokenExpiryMonitor()

      // 呼叫後端 logout API（會清除 httpOnly cookies）
      await AuthService.logout()
    } catch (e) {
      console.error('[AuthStore] ❌ Backend logout failed:', e)
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

      console.log('[AuthStore] ✅ Logout completed', {
        timestamp: new Date().toISOString(),
        redirectTo: '/'
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
   * 啟動 Token 過期監控（帶自動續期）
   *
   * 升級日誌（2025-11-14）：
   * - 加入自動續期機制：token 剩餘 5 分鐘時自動呼叫 refresh
   * - 每 3 分鐘檢查一次（平衡效能與及時性）
   * - 續期失敗時才執行登出
   *
   * 檢查邏輯：
   * 1. 如果 token 剩餘 > 5 分鐘：繼續監控
   * 2. 如果 token 剩餘 ≤ 5 分鐘：嘗試自動續期
   * 3. 如果續期失敗或 token 已過期：自動登出
   */
  startTokenExpiryMonitor: () => {
    // 只在瀏覽器環境執行
    if (typeof window === 'undefined') return

    // 清除舊的定時器（避免重複）
    if (tokenExpiryTimerId) {
      clearInterval(tokenExpiryTimerId)
    }

    console.log('[AuthStore] 🔄 Token expiry monitor started (with auto-refresh)', {
      timestamp: new Date().toISOString(),
      checkInterval: '3 minutes',
      autoRefreshThreshold: '5 minutes remaining'
    })

    // 每 3 分鐘檢查一次
    tokenExpiryTimerId = setInterval(async () => {
      const state = get()

      // 如果使用者未登入，停止監控
      if (!state.user) {
        get().stopTokenExpiryMonitor()
        return
      }

      // 檢查 token 狀態
      const authStateStr = localStorage.getItem('pip-boy-auth-state')
      if (!authStateStr) {
        console.warn('[AuthStore] ⚠️ No auth state found, logging out')
        get().logout()
        return
      }

      try {
        const authState = JSON.parse(authStateStr)
        const currentTimestamp = Math.floor(Date.now() / 1000)
        const remainingSeconds = authState.expiresAt - currentTimestamp

        console.log('[AuthStore] ⏰ Token status check', {
          timestamp: new Date().toISOString(),
          remainingMinutes: Math.floor(remainingSeconds / 60),
          expiresAt: new Date(authState.expiresAt * 1000).toISOString()
        })

        // 如果 token 剩餘 ≤ 5 分鐘，嘗試自動續期
        if (remainingSeconds <= 5 * 60 && remainingSeconds > 0) {
          console.log('[AuthStore] 🔄 Token expiring soon, attempting auto-refresh')
          const refreshSuccess = await get().tryRefreshToken()

          if (!refreshSuccess) {
            console.warn('[AuthStore] ⚠️ Auto-refresh failed, logging out')
            get().logout()
          } else {
            console.log('[AuthStore] ✅ Token auto-refreshed successfully')
          }
        } else if (remainingSeconds <= 0) {
          // Token 已過期
          console.warn('[AuthStore] ⚠️ TOKEN EXPIRED - Auto logout triggered', {
            timestamp: new Date().toISOString(),
            user: state.user.email
          })
          get().logout()
        }
      } catch (error) {
        console.error('[AuthStore] ❌ Error checking token status:', error)
      }
    }, 3 * 60 * 1000) // 3 分鐘檢查一次
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
      const response = await AuthService.extendToken({
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
      const response = await AuthService.extendToken({
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
            karmaScore: (state.user.karmaScore || 0) + response.rewards.karma_bonus,
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
      const status = await AuthService.getLoyaltyStatus()
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
      const methods = await AuthService.getAuthMethods()
      set({
        hasPasskey: methods.has_passkey,
        hasPassword: methods.has_password,
        hasOAuth: methods.has_oauth
      })
    } catch (error: any) {
      console.warn('❌ 查詢認證方式失敗（靜默處理）:', error.message || error)
      // 靜默處理錯誤，不更新狀態
    }
  },

  /**
   * 更新使用者頭像 URL
   *
   * @param avatarUrl - 新的頭像 URL
   */
  updateAvatarUrl: (avatarUrl: string) => {
    const state = get()

    if (!state.user) {
      console.warn('[AuthStore] ⚠️ 無法更新頭像：使用者未登入')
      return
    }

    console.log('[AuthStore] 🖼️ 更新頭像 URL:', avatarUrl)

    set({
      user: {
        ...state.user,
        avatarUrl: avatarUrl
      }
    })
  },

  /**
   * 嘗試使用 refresh token 續期
   *
   * 呼叫後端 /api/v1/auth/refresh 端點，使用 httpOnly cookie 中的 refresh_token
   * 來獲取新的 access_token 和 refresh_token。
   *
   * @returns Promise<boolean> - 成功返回 true，失敗返回 false
   */
  tryRefreshToken: async () => {
    console.log('[AuthStore] 🔄 嘗試使用 refresh token 續期...')

    try {
      // 呼叫後端 refresh API（會自動使用 httpOnly cookie 中的 refresh_token）
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include', // 確保發送 cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.warn('[AuthStore] ⚠️ Refresh token 續期失敗:', response.status)
        return false
      }

      const data = await response.json()
      console.log('[AuthStore] ✅ Token 續期成功')

      // 從 response header 中提取新的 token 過期時間
      // 注意：後端會自動設定新的 httpOnly cookies，我們只需要更新 localStorage
      // 假設 token 有效期為 1 小時
      const newExpiresAt = Math.floor(Date.now() / 1000) + 3600 // 當前時間 + 1 小時
      saveAuthState(newExpiresAt)

      return true
    } catch (error) {
      console.error('[AuthStore] ❌ Refresh token 續期失敗:', error)
      return false
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
