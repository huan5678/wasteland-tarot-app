import { create } from 'zustand'
import { useErrorStore } from '@/lib/errorStore'
import { timedFetch } from '@/lib/metrics'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * 賓果卡回應介面
 */
interface BingoCardResponse {
  id: string
  user_id: string
  month_year: string
  card_data: number[][] // 5x5 grid
  is_active: boolean
  created_at: string
}

/**
 * 每日號碼回應介面
 */
interface DailyNumberResponse {
  id: string
  number: number
  date_generated: string
  is_current: boolean
}

/**
 * 領取結果介面
 */
interface ClaimResult {
  success: boolean
  number: number
  is_on_card: boolean
  current_lines: number
  has_reward: boolean
  message: string
}

/**
 * 連線檢測結果介面
 */
interface LineCheckResult {
  user_id: string
  line_count: number
  line_types: string[] // e.g., ["horizontal_0", "vertical_2", "diagonal_main"]
  has_reward: boolean
}

/**
 * 賓果遊戲狀態介面
 */
interface BingoStatusResponse {
  has_card: boolean
  card_data: number[][] | null
  daily_number: number | null
  claimed_numbers: number[]
  line_count: number
  has_reward: boolean
  has_claimed_today: boolean
}

/**
 * 歷史記錄介面
 */
interface BingoHistoryRecord {
  month_year: string
  card_data: number[][]
  claimed_numbers: number[]
  line_count: number
  has_reward: boolean
  created_at: string
}

/**
 * 獎勵記錄介面
 */
interface RewardRecord {
  id: string
  user_id: string
  month_year: string
  line_types: string[]
  claimed_at: string
}

/**
 * API 錯誤介面
 */
interface APIError {
  detail: string
  status?: number
}

// ============================================================================
// Zustand Store State & Actions
// ============================================================================

interface BingoStore {
  // ========== State ==========

  /** 今日系統號碼 */
  dailyNumber: number | null

  /** 使用者賓果卡 (5x5 grid) */
  userCard: number[][] | null

  /** 已領取的號碼集合 */
  claimedNumbers: Set<number>

  /** 當前連線數 */
  lineCount: number

  /** 是否已獲得獎勵 */
  hasReward: boolean

  /** 載入狀態 */
  isLoading: boolean

  /** 錯誤訊息 */
  error: string | null

  /** 是否已領取今日號碼 */
  hasClaimed: boolean

  /** 是否有賓果卡 */
  hasCard: boolean

  // ========== Selection State (for card setup) ==========

  /** 目前選擇的號碼集合 (建立賓果卡時使用) */
  selectedNumbers: Set<number>

  /** 驗證錯誤訊息 */
  validationError: string | null

  // ========== Actions ==========

  /**
   * 從後端載入賓果遊戲狀態
   */
  fetchBingoStatus: () => Promise<void>

  /**
   * 建立新的賓果卡
   * @param numbers - 25個號碼 (1-25, 無重複)
   */
  createCard: (numbers: number[]) => Promise<void>

  /**
   * 領取今日號碼
   */
  claimDailyNumber: () => Promise<void>

  /**
   * 檢查連線狀態
   */
  checkLines: () => Promise<void>

  /**
   * 查詢歷史記錄
   * @param month - 格式: YYYY-MM
   */
  fetchHistory: (month: string) => Promise<BingoHistoryRecord | null>

  /**
   * 查詢獎勵記錄
   */
  fetchRewards: () => Promise<RewardRecord[]>

  /**
   * 重置 Store 狀態
   */
  reset: () => void

  /**
   * 清除錯誤訊息
   */
  clearError: () => void

  // ========== Validation Actions ==========

  /**
   * 驗證賓果卡號碼
   * @param numbers - 要驗證的號碼陣列
   * @returns 驗證是否通過
   */
  validateCardNumbers: (numbers: number[]) => boolean

  /**
   * 切換號碼選擇狀態
   * @param num - 要切換的號碼
   */
  toggleNumber: (num: number) => void

  /**
   * 清除選擇狀態
   */
  clearSelection: () => void

  /**
   * 是否可以提交賓果卡
   */
  canSubmitCard: () => boolean
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
      console.error(`[BingoStore] API Error: ${endpoint}`, {
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

      // Task 3.2: 儲存當前 URL 到 sessionStorage 供登入後返回
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth-return-url', window.location.pathname)
        window.location.href = `/auth/login?reason=${reason}`
      }

      throw new Error('Authentication required')
    }

    // 處理其他錯誤
    if (!response.ok) {
      const errorData: APIError = await response.json().catch(() => ({ detail: '未知錯誤' }))

      console.error(`[BingoStore] API Error: ${endpoint}`, {
        status: response.status,
        message: errorData.detail,
        endpoint,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
      })

      useErrorStore.getState().pushError({
        source: 'api',
        message: errorData.detail || `HTTP ${response.status}`,
        detail: {
          endpoint,
          method: options.method || 'GET',
          statusCode: response.status,
        },
      })

      throw new Error(errorData.detail || `HTTP ${response.status}`)
    }

    return response.json()
  } catch (err: any) {
    // 捕獲所有錯誤（包括網路錯誤、ReferenceError 等）
    console.error(`[BingoStore] API Error: ${endpoint}`, {
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
// Zustand Store Implementation
// ============================================================================

export const useBingoStore = create<BingoStore>((set, get) => ({
  // ========== Initial State ==========
  dailyNumber: null,
  userCard: null,
  claimedNumbers: new Set<number>(),
  lineCount: 0,
  hasReward: false,
  isLoading: false,
  error: null,
  hasClaimed: false,
  hasCard: false,
  selectedNumbers: new Set<number>(),
  validationError: null,

  // ========== Actions Implementation ==========

  /**
   * 載入賓果遊戲狀態
   */
  fetchBingoStatus: async () => {
    set({ isLoading: true, error: null })

    try {
      const status = await apiRequest<BingoStatusResponse>('/api/v1/bingo/status')

      set({
        hasCard: status.has_card,
        userCard: status.card_data,
        dailyNumber: status.daily_number,
        claimedNumbers: new Set(status.claimed_numbers),
        lineCount: status.line_count,
        hasReward: status.has_reward,
        hasClaimed: status.has_claimed_today,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      set({
        error: err.message || '載入賓果狀態失敗',
        isLoading: false,
      })
    }
  },

  /**
   * 建立賓果卡
   */
  createCard: async (numbers: number[]) => {
    set({ isLoading: true, error: null })

    // 前端驗證
    if (!get().validateCardNumbers(numbers)) {
      set({ isLoading: false })
      return
    }

    try {
      const response = await apiRequest<BingoCardResponse>('/api/v1/bingo/card', {
        method: 'POST',
        body: JSON.stringify({ numbers }),
      })

      set({
        hasCard: true,
        userCard: response.card_data,
        isLoading: false,
        error: null,
        selectedNumbers: new Set(), // 清除選擇狀態
        validationError: null,
      })

      // 建立成功後重新載入狀態
      await get().fetchBingoStatus()
    } catch (err: any) {
      set({
        error: err.message || '建立賓果卡失敗',
        isLoading: false,
      })
    }
  },

  /**
   * 領取今日號碼
   */
  claimDailyNumber: async () => {
    set({ isLoading: true, error: null })

    try {
      const result = await apiRequest<ClaimResult>('/api/v1/bingo/claim', {
        method: 'POST',
      })

      // 更新狀態
      const newClaimedNumbers = new Set(get().claimedNumbers)
      newClaimedNumbers.add(result.number)

      set({
        claimedNumbers: newClaimedNumbers,
        lineCount: result.current_lines,
        hasReward: result.has_reward,
        hasClaimed: true,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      set({
        error: err.message || '領取號碼失敗',
        isLoading: false,
      })
    }
  },

  /**
   * 檢查連線狀態
   */
  checkLines: async () => {
    set({ isLoading: true, error: null })

    try {
      const result = await apiRequest<LineCheckResult>('/api/v1/bingo/lines')

      set({
        lineCount: result.line_count,
        hasReward: result.has_reward,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      set({
        error: err.message || '檢查連線失敗',
        isLoading: false,
      })
    }
  },

  /**
   * 查詢歷史記錄
   */
  fetchHistory: async (month: string): Promise<BingoHistoryRecord | null> => {
    set({ isLoading: true, error: null })

    try {
      const history = await apiRequest<BingoHistoryRecord>(`/api/v1/bingo/history/${month}`)

      set({ isLoading: false, error: null })
      return history
    } catch (err: any) {
      set({
        error: err.message || '查詢歷史記錄失敗',
        isLoading: false,
      })
      return null
    }
  },

  /**
   * 查詢獎勵記錄
   */
  fetchRewards: async (): Promise<RewardRecord[]> => {
    set({ isLoading: true, error: null })

    try {
      const rewards = await apiRequest<RewardRecord[]>('/api/v1/bingo/rewards')

      set({ isLoading: false, error: null })
      return rewards
    } catch (err: any) {
      set({
        error: err.message || '查詢獎勵記錄失敗',
        isLoading: false,
      })
      return []
    }
  },

  /**
   * 重置 Store 狀態
   */
  reset: () => {
    set({
      dailyNumber: null,
      userCard: null,
      claimedNumbers: new Set<number>(),
      lineCount: 0,
      hasReward: false,
      isLoading: false,
      error: null,
      hasClaimed: false,
      hasCard: false,
      selectedNumbers: new Set<number>(),
      validationError: null,
    })
  },

  /**
   * 清除錯誤訊息
   */
  clearError: () => {
    set({ error: null, validationError: null })
  },

  // ========== Validation Actions ==========

  /**
   * 驗證賓果卡號碼
   */
  validateCardNumbers: (numbers: number[]): boolean => {
    // 檢查數量
    if (numbers.length !== 25) {
      set({ validationError: '必須選擇 25 個號碼' })
      return false
    }

    // 檢查範圍
    const invalidNumbers = numbers.filter(n => n < 1 || n > 25)
    if (invalidNumbers.length > 0) {
      set({ validationError: '號碼必須在 1-25 之間' })
      return false
    }

    // 檢查重複
    const uniqueNumbers = new Set(numbers)
    if (uniqueNumbers.size !== 25) {
      set({ validationError: '號碼不可重複' })
      return false
    }

    set({ validationError: null })
    return true
  },

  /**
   * 切換號碼選擇狀態
   */
  toggleNumber: (num: number) => {
    const { selectedNumbers } = get()
    const newSelected = new Set(selectedNumbers)

    if (newSelected.has(num)) {
      newSelected.delete(num)
    } else {
      // 最多只能選 25 個
      if (newSelected.size >= 25) {
        set({ validationError: '最多只能選擇 25 個號碼' })
        return
      }
      newSelected.add(num)
    }

    set({
      selectedNumbers: newSelected,
      validationError: null, // 清除錯誤訊息
    })
  },

  /**
   * 清除選擇狀態
   */
  clearSelection: () => {
    set({
      selectedNumbers: new Set<number>(),
      validationError: null,
    })
  },

  /**
   * 是否可以提交賓果卡
   */
  canSubmitCard: (): boolean => {
    return get().selectedNumbers.size === 25
  },
}))

// ============================================================================
// Export Types
// ============================================================================

export type {
  BingoCardResponse,
  DailyNumberResponse,
  ClaimResult,
  LineCheckResult,
  BingoStatusResponse,
  BingoHistoryRecord,
  RewardRecord,
}
