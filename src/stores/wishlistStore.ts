import { create } from 'zustand'
import { useErrorStore } from '@/lib/errorStore'
import { timedFetch } from '@/lib/metrics'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Wish 介面（對應後端 WishResponse schema）
 */
export interface Wish {
  id: string
  user_id: string
  content: string
  admin_reply: string | null
  created_at: string
  updated_at: string
  admin_reply_timestamp: string | null
  has_been_edited: boolean
  is_hidden: boolean
}

/**
 * 管理員願望列表回應介面
 */
interface AdminWishListResponse {
  wishes: Wish[]
  total: number
  page: number
  per_page: number
}

/**
 * API 錯誤介面
 */
interface APIError {
  detail: string | {
    error: string
    message: string
    detail?: any
  }
  status?: number
}

// ============================================================================
// Zustand Store State & Actions
// ============================================================================

interface WishlistStore {
  // ========== User State ==========

  /** 使用者的願望列表 */
  wishes: Wish[]

  /** 載入狀態 */
  isLoading: boolean

  /** 錯誤訊息 */
  error: string | null

  /** 今日是否已提交願望 */
  hasSubmittedToday: boolean

  // ========== Admin State ==========

  /** 管理員願望列表 */
  adminWishes: Wish[]

  /** 管理員篩選條件 */
  adminFilter: 'all' | 'replied' | 'unreplied'

  /** 管理員排序方式 */
  adminSort: 'newest' | 'oldest'

  /** 管理員當前頁碼 */
  adminPage: number

  /** 管理員願望總數 */
  adminTotal: number

  /** 管理員每頁筆數 */
  adminPageSize: number

  // ========== User Actions ==========

  /**
   * 取得當前使用者的願望列表
   */
  fetchUserWishes: () => Promise<void>

  /**
   * 提交新願望
   * @param content - 願望內容（Markdown 格式）
   */
  submitWish: (content: string) => Promise<void>

  /**
   * 編輯願望
   * @param wishId - 願望 ID
   * @param content - 新內容（Markdown 格式）
   */
  updateWish: (wishId: string, content: string) => Promise<void>

  // ========== Admin Actions ==========

  /**
   * 取得所有願望列表（管理員專用）
   */
  fetchAdminWishes: () => Promise<void>

  /**
   * 設定管理員篩選條件
   * @param filter - 篩選條件（all, replied, unreplied）
   */
  setAdminFilter: (filter: 'all' | 'replied' | 'unreplied') => void

  /**
   * 設定管理員排序方式
   * @param sort - 排序方式（newest, oldest）
   */
  setAdminSort: (sort: 'newest' | 'oldest') => void

  /**
   * 設定管理員頁碼
   * @param page - 頁碼
   */
  setAdminPage: (page: number) => void

  /**
   * 提交或編輯管理員回覆
   * @param wishId - 願望 ID
   * @param reply - 回覆內容（Markdown 格式）
   */
  submitReply: (wishId: string, reply: string) => Promise<void>

  /**
   * 切換願望隱藏狀態
   * @param wishId - 願望 ID
   * @param isHidden - 是否隱藏
   */
  toggleHidden: (wishId: string, isHidden: boolean) => Promise<void>

  // ========== Utility Actions ==========

  /**
   * 檢查今日是否已提交願望（UTC+8）
   */
  checkDailyLimit: () => boolean

  /**
   * 清除錯誤訊息
   */
  clearError: () => void

  /**
   * 重置 Store 狀態
   */
  reset: () => void
}

// ============================================================================
// API Helper Functions
// ============================================================================

/**
 * 統一的 API 請求函數
 * 使用 httpOnly cookies 進行認證（透過 credentials: 'include'）
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    // 檢查網路狀態
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      useErrorStore.getState().setNetworkOnline(false)
      throw new Error('網路連線中斷')
    } else {
      useErrorStore.getState().setNetworkOnline(true)
    }

    // 使用 timedFetch 追蹤效能，並透過 credentials: 'include' 自動傳送 httpOnly cookies
    const response = await timedFetch(url, {
      ...options,
      credentials: 'include', // 啟用 httpOnly cookie 傳輸
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        // 注意：不需要手動設定 Authorization header，httpOnly cookie 會自動傳送
      },
    })

    // 處理 401 Unauthorized 錯誤
    if (response.status === 401) {
      // 判斷是 token 過期還是缺少 token
      const reason = response.statusText === 'Token expired'
        ? 'session_expired'
        : 'auth_required'

      // 記錄錯誤
      console.error(`[WishlistStore] API Error: ${endpoint}`, {
        status: 401,
        reason,
        endpoint,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
      })

      // 推送錯誤至 errorStore
      useErrorStore.getState().pushError({
        source: 'api',
        message: '認證失敗',
        detail: {
          endpoint,
          method: options.method || 'GET',
          statusCode: 401,
          reason,
        },
      })

      // 🔍 監控日誌：追蹤 401 錯誤導致的登出
      console.warn('[WishlistStore] 🚫 401 Error - Redirecting to login', {
        timestamp: new Date().toISOString(),
        endpoint,
        reason,
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
      })

      // 儲存當前 URL 到 sessionStorage 供登入後返回
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth-return-url', window.location.pathname)
        window.location.href = `/auth/login?reason=${reason}`
      }

      throw new Error('Authentication required')
    }

    // 處理其他錯誤
    if (!response.ok) {
      const errorData: APIError = await response.json().catch(() => ({ detail: '未知錯誤' }))

      // 解析錯誤訊息：支援 FastAPI 標準格式 {error, message, detail}
      let errorMessage: string
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail
      } else if (typeof errorData.detail === 'object' && errorData.detail?.message) {
        errorMessage = errorData.detail.message
      } else {
        errorMessage = `HTTP ${response.status}`
      }

      console.error(`[WishlistStore] API Error: ${endpoint}`, errorMessage, {
        status: response.status,
        errorData,
        endpoint,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
      })

      useErrorStore.getState().pushError({
        source: 'api',
        message: errorMessage,
        detail: {
          endpoint,
          method: options.method || 'GET',
          statusCode: response.status,
        },
      })

      throw new Error(errorMessage)
    }

    return response.json()
  } catch (err: any) {
    // 捕獲所有錯誤（包括網路錯誤、ReferenceError 等）
    console.error(`[WishlistStore] API Error: ${endpoint}`, err?.message || '未知錯誤', {
      error: err?.message || '未知錯誤',
      stack: err?.stack,
      endpoint,
      method: options.method || 'GET',
      timestamp: new Date().toISOString(),
    })

    // 推送錯誤至全域錯誤 Store
    useErrorStore.getState().pushError({
      source: 'api',
      message: err?.message || 'API 請求失敗',
      detail: {
        endpoint,
        method: options.method || 'GET',
      },
    })

    throw err
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 檢查最新願望是否在今日（UTC+8）
 * @param wishes - 願望列表（按時間降序排列）
 * @returns 今日是否已提交願望
 */
function checkDailyLimitFromWishes(wishes: Wish[]): boolean {
  if (wishes.length === 0) return false

  // 取得最新的願望
  const latestWish = wishes[0]

  // 將 UTC 時間轉換為 UTC+8
  const createdAt = new Date(latestWish.created_at)
  const utc8Offset = 8 * 60 * 60 * 1000 // 8 小時的毫秒數
  const utc8Time = new Date(createdAt.getTime() + utc8Offset)

  // 取得今日 UTC+8 的日期（YYYY-MM-DD）
  const today = new Date(Date.now() + utc8Offset).toISOString().split('T')[0]
  const wishDate = utc8Time.toISOString().split('T')[0]

  console.log('[WishlistStore] checkDailyLimit:', {
    latestWishId: latestWish.id,
    createdAtUTC: createdAt.toISOString(),
    createdAtUTC8: utc8Time.toISOString(),
    todayUTC8: today,
    wishDateUTC8: wishDate,
    hasSubmittedToday: wishDate === today,
  })

  return wishDate === today
}

// ============================================================================
// Zustand Store Implementation
// ============================================================================

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  // ========== Initial State ==========
  wishes: [],
  isLoading: false,
  error: null,
  hasSubmittedToday: false,
  adminWishes: [],
  adminFilter: 'all',
  adminSort: 'newest',
  adminPage: 1,
  adminTotal: 0,
  adminPageSize: 50,

  // ========== User Actions Implementation ==========

  /**
   * 取得當前使用者的願望列表
   */
  fetchUserWishes: async () => {
    set({ isLoading: true, error: null })

    try {
      console.log('[WishlistStore] 開始載入使用者願望列表...')
      const wishes = await apiRequest<Wish[]>('/api/v1/wishlist')

      console.log('[WishlistStore] fetchUserWishes 回應:', {
        count: wishes.length,
        wishes: wishes.map(w => ({
          id: w.id,
          created_at: w.created_at,
          has_admin_reply: !!w.admin_reply,
          has_been_edited: w.has_been_edited,
        })),
      })

      // 檢查今日是否已提交願望
      const hasSubmittedToday = checkDailyLimitFromWishes(wishes)

      set({
        wishes,
        hasSubmittedToday,
        isLoading: false,
        error: null,
      })

      console.log('[WishlistStore] 狀態更新完成:', {
        wishesCount: wishes.length,
        hasSubmittedToday,
      })
    } catch (err: any) {
      console.error('[WishlistStore] fetchUserWishes 錯誤:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      })
      set({
        error: err.message || '載入願望列表失敗',
        isLoading: false,
      })
    }
  },

  /**
   * 提交新願望
   */
  submitWish: async (content: string) => {
    set({ isLoading: true, error: null })

    try {
      console.log('[WishlistStore] 提交新願望...')
      const newWish = await apiRequest<Wish>('/api/v1/wishlist', {
        method: 'POST',
        body: JSON.stringify({ content }),
      })

      console.log('[WishlistStore] submitWish 成功:', {
        wishId: newWish.id,
        created_at: newWish.created_at,
      })

      // 重新載入願望列表（確保資料一致性）
      await get().fetchUserWishes()
    } catch (err: any) {
      console.error('[WishlistStore] submitWish 錯誤:', {
        error: err.message,
        timestamp: new Date().toISOString(),
      })
      set({
        error: err.message || '提交願望失敗',
        isLoading: false,
      })
      throw err // 重新拋出錯誤，讓 UI 層可以處理
    }
  },

  /**
   * 編輯願望
   */
  updateWish: async (wishId: string, content: string) => {
    set({ isLoading: true, error: null })

    try {
      console.log('[WishlistStore] 編輯願望:', { wishId })
      const updatedWish = await apiRequest<Wish>(`/api/v1/wishlist/${wishId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      })

      console.log('[WishlistStore] updateWish 成功:', {
        wishId: updatedWish.id,
        has_been_edited: updatedWish.has_been_edited,
      })

      // 更新本地願望列表
      const updatedWishes = get().wishes.map(wish =>
        wish.id === wishId ? updatedWish : wish
      )

      set({
        wishes: updatedWishes,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      console.error('[WishlistStore] updateWish 錯誤:', {
        wishId,
        error: err.message,
        timestamp: new Date().toISOString(),
      })
      set({
        error: err.message || '編輯願望失敗',
        isLoading: false,
      })
      throw err
    }
  },

  // ========== Admin Actions Implementation ==========

  /**
   * 取得所有願望列表（管理員專用）
   */
  fetchAdminWishes: async () => {
    set({ isLoading: true, error: null })

    try {
      const { adminFilter, adminSort, adminPage, adminPageSize } = get()

      console.log('[WishlistStore] 開始載入管理員願望列表...', {
        filter: adminFilter,
        sort: adminSort,
        page: adminPage,
        pageSize: adminPageSize,
      })

      const queryParams = new URLSearchParams({
        filter_status: adminFilter,
        sort_order: adminSort,
        page: adminPage.toString(),
        page_size: adminPageSize.toString(),
      })

      const response = await apiRequest<AdminWishListResponse>(
        `/api/v1/wishlist/admin?${queryParams.toString()}`
      )

      console.log('[WishlistStore] fetchAdminWishes 回應:', {
        wishesCount: response.wishes.length,
        total: response.total,
        page: response.page,
        per_page: response.per_page,
      })

      set({
        adminWishes: response.wishes,
        adminTotal: response.total,
        adminPage: response.page,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      console.error('[WishlistStore] fetchAdminWishes 錯誤:', {
        error: err.message,
        timestamp: new Date().toISOString(),
      })
      set({
        error: err.message || '載入管理員願望列表失敗',
        isLoading: false,
      })
    }
  },

  /**
   * 設定管理員篩選條件
   */
  setAdminFilter: (filter: 'all' | 'replied' | 'unreplied') => {
    set({ adminFilter: filter, adminPage: 1 }) // 重置頁碼
    // 重新載入資料
    get().fetchAdminWishes()
  },

  /**
   * 設定管理員排序方式
   */
  setAdminSort: (sort: 'newest' | 'oldest') => {
    set({ adminSort: sort, adminPage: 1 }) // 重置頁碼
    // 重新載入資料
    get().fetchAdminWishes()
  },

  /**
   * 設定管理員頁碼
   */
  setAdminPage: (page: number) => {
    set({ adminPage: page })
    // 重新載入資料
    get().fetchAdminWishes()
  },

  /**
   * 提交或編輯管理員回覆
   */
  submitReply: async (wishId: string, reply: string) => {
    set({ isLoading: true, error: null })

    try {
      console.log('[WishlistStore] 提交管理員回覆:', { wishId })
      const updatedWish = await apiRequest<Wish>(`/api/v1/wishlist/admin/${wishId}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ reply }),
      })

      console.log('[WishlistStore] submitReply 成功:', {
        wishId: updatedWish.id,
        has_reply: !!updatedWish.admin_reply,
        admin_reply_timestamp: updatedWish.admin_reply_timestamp,
      })

      // 更新本地管理員願望列表
      const updatedAdminWishes = get().adminWishes.map(wish =>
        wish.id === wishId ? updatedWish : wish
      )

      set({
        adminWishes: updatedAdminWishes,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      console.error('[WishlistStore] submitReply 錯誤:', {
        wishId,
        error: err.message,
        timestamp: new Date().toISOString(),
      })
      set({
        error: err.message || '提交回覆失敗',
        isLoading: false,
      })
      throw err
    }
  },

  /**
   * 切換願望隱藏狀態
   */
  toggleHidden: async (wishId: string, isHidden: boolean) => {
    set({ isLoading: true, error: null })

    try {
      console.log('[WishlistStore] 切換隱藏狀態:', { wishId, isHidden })

      const endpoint = isHidden
        ? `/api/v1/wishlist/admin/${wishId}/hide`
        : `/api/v1/wishlist/admin/${wishId}/unhide`

      const updatedWish = await apiRequest<Wish>(endpoint, {
        method: 'PUT',
      })

      console.log('[WishlistStore] toggleHidden 成功:', {
        wishId: updatedWish.id,
        is_hidden: updatedWish.is_hidden,
      })

      // 更新本地管理員願望列表
      const updatedAdminWishes = get().adminWishes.map(wish =>
        wish.id === wishId ? updatedWish : wish
      )

      set({
        adminWishes: updatedAdminWishes,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      console.error('[WishlistStore] toggleHidden 錯誤:', {
        wishId,
        isHidden,
        error: err.message,
        timestamp: new Date().toISOString(),
      })
      set({
        error: err.message || '切換隱藏狀態失敗',
        isLoading: false,
      })
      throw err
    }
  },

  // ========== Utility Actions Implementation ==========

  /**
   * 檢查今日是否已提交願望（UTC+8）
   */
  checkDailyLimit: () => {
    return get().hasSubmittedToday
  },

  /**
   * 清除錯誤訊息
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * 重置 Store 狀態
   */
  reset: () => {
    set({
      wishes: [],
      isLoading: false,
      error: null,
      hasSubmittedToday: false,
      adminWishes: [],
      adminFilter: 'all',
      adminSort: 'newest',
      adminPage: 1,
      adminTotal: 0,
      adminPageSize: 50,
    })
  },
}))
