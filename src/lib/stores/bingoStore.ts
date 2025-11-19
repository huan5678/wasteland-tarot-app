import { create } from 'zustand'
import { useErrorStore } from '@/lib/errorStore'
import { timedFetch } from '@/lib/metrics'

// CRITICAL: Use empty string to route through Next.js API proxy
const API_BASE_URL = ''

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
 *
 * 注意：後端回傳的是 card 物件，而非直接的 card_data
 */
interface BingoStatusResponse {
  has_card: boolean
  card: BingoCardResponse | null  // 後端回傳的是完整的 card 物件
  claimed_numbers: number[]
  line_count: number
  has_reward: boolean
  today_claimed: boolean  // 注意：後端欄位名是 today_claimed，不是 has_claimed_today
  daily_number: number | null
}

/**
 * 歷史記錄介面
 *
 * 注意：與後端 BingoHistoryResponse 對應
 * - had_reward: 該月份是否獲得獎勵（過去式）
 * - reward: 獎勵詳細資訊（如果有）
 */
interface BingoHistoryRecord {
  month_year: string
  card_data: number[][]
  claimed_numbers: number[]
  line_count: number
  had_reward: boolean  // 注意：後端使用 had_reward，不是 has_reward
  reward?: RewardRecord | null  // 獎勵詳細資訊（可選）
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
   * 手動領取指定號碼
   * @param number - 要領取的號碼 (1-25)
   */
  claimManualNumber: (number: number) => Promise<void>

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

      // 🔍 監控日誌：追蹤 401 錯誤導致的登出
      console.warn('[BingoStore] 🚫 401 Error - Redirecting to login', {
        timestamp: new Date().toISOString(),
        endpoint,
        reason,
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
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
      const errorData: any = await response.json().catch(() => ({ detail: '未知錯誤' }))

      // 提取錯誤訊息（支援多種後端格式）
      let errorMessage: string
      if (typeof errorData === 'string') {
        errorMessage = errorData
      } else if (typeof errorData === 'object' && errorData !== null) {
        // FastAPI 標準格式：{detail: {...}} 或 {detail: "string"}
        if (typeof errorData.detail === 'object' && errorData.detail !== null) {
          // detail 是物件，提取其中的 message
          errorMessage =
            errorData.detail.message ||
            errorData.detail.error ||
            `HTTP ${response.status}`
        } else {
          // detail 是字串，或其他格式
          errorMessage =
            errorData.message ||      // 後端自訂格式
            errorData.detail ||        // FastAPI 標準格式（字串）
            errorData.error ||         // 其他格式
            `HTTP ${response.status}`  // 預設
        }
      } else {
        errorMessage = `HTTP ${response.status}`
      }

      // 404 是正常情況（如無歷史記錄），使用 log 而非 error
      const logLevel = response.status === 404 ? console.log : console.error
      logLevel(`[BingoStore] API ${response.status === 404 ? 'Info' : 'Error'}: ${endpoint}`, {
        status: response.status,
        errorMessage,
        errorData,
        endpoint,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
      })

      // 404 錯誤不推送到全域錯誤 Store（可能是正常情況，如無歷史記錄）
      if (response.status !== 404) {
        useErrorStore.getState().pushError({
          source: 'api',
          message: errorMessage,
          detail: {
            endpoint,
            method: options.method || 'GET',
            statusCode: response.status,
          },
        })
      }

      // 為 404 錯誤建立特殊的錯誤物件，方便呼叫方識別
      const error = new Error(errorMessage)
      ;(error as any).status = response.status
      throw error
    }

    return response.json()
  } catch (err: any) {
    // 捕獲所有錯誤（包括網路錯誤、ReferenceError 等）
    // 404 是正常情況（如無歷史記錄），使用 log 而非 error
    const logLevel = err?.status === 404 ? console.log : console.error
    logLevel(`[BingoStore] API ${err?.status === 404 ? 'Info' : 'Error'}: ${endpoint}`, {
      error: err?.message || '未知錯誤',
      stack: err?.stack,
      endpoint,
      method: options.method || 'GET',
      timestamp: new Date().toISOString(),
    })

    // 404 錯誤不推送到全域錯誤 Store（可能是正常情況，如無歷史記錄）
    if (err?.status !== 404) {
      useErrorStore.getState().pushError({
        source: 'api',
        message: err?.message || 'API 請求失敗',
        detail: {
          endpoint,
          method: options.method || 'GET',
        },
      })
    }

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
      console.log('[BingoStore] 開始載入賓果狀態...')
      const status = await apiRequest<BingoStatusResponse>('/api/v1/bingo/status')

      // 詳細日誌：API 回應
      console.log('[BingoStore] fetchBingoStatus 回應:', {
        has_card: status.has_card,
        card: status.card,
        card_exists: !!status.card,
        card_data_exists: status.card?.card_data ? true : false,
        claimed_numbers: status.claimed_numbers,
        claimed_count: status.claimed_numbers?.length,
        daily_number: status.daily_number,
        line_count: status.line_count,
        has_reward: status.has_reward,
        today_claimed: status.today_claimed,
      })

      // 提取 card_data（如果 card 物件存在的話）
      const cardData = status.card?.card_data ?? null

      // 驗證 card_data 格式（如果有卡片的話）
      if (status.has_card && cardData) {
        if (!Array.isArray(cardData) || cardData.length !== 5) {
          console.error('[BingoStore] 無效的賓果卡格式:', {
            card_data: cardData,
            is_array: Array.isArray(cardData),
            length: Array.isArray(cardData) ? cardData.length : 'N/A',
          })
          throw new Error('賓果卡資料格式錯誤：不是 5x5 陣列')
        }
        // 檢查每一行是否都是長度為 5 的陣列
        for (let i = 0; i < 5; i++) {
          if (!Array.isArray(cardData[i]) || cardData[i].length !== 5) {
            console.error(`[BingoStore] 第 ${i} 行格式錯誤:`, {
              row: cardData[i],
              is_array: Array.isArray(cardData[i]),
              length: Array.isArray(cardData[i]) ? cardData[i].length : 'N/A',
            })
            throw new Error(`賓果卡資料格式錯誤：第 ${i} 行不是長度為 5 的陣列`)
          }
        }
        console.log('[BingoStore] 賓果卡格式驗證通過')
      } else if (status.has_card && !cardData) {
        console.error('[BingoStore] 嚴重錯誤：has_card 為 true 但 card_data 為空', {
          has_card: status.has_card,
          card: status.card,
          card_is_null: status.card === null,
          card_data: cardData,
        })

        // 資料不一致：後端說有卡片但沒有給卡片資料
        // 這是資料庫狀態異常，需要提示使用者
        throw new Error('賓果卡資料載入失敗：資料庫狀態異常，請聯繫客服或重新建立賓果卡')
      }

      set({
        hasCard: status.has_card,
        userCard: cardData,
        dailyNumber: status.daily_number,
        claimedNumbers: new Set(status.claimed_numbers),
        lineCount: status.line_count,
        hasReward: status.has_reward,
        hasClaimed: status.today_claimed,  // 修正：後端欄位名是 today_claimed
        isLoading: false,
        error: null,
      })

      console.log('[BingoStore] 狀態更新完成:', {
        hasCard: status.has_card,
        userCard_exists: !!cardData,
        claimedNumbers_size: status.claimed_numbers?.length,
      })
    } catch (err: any) {
      console.error('[BingoStore] fetchBingoStatus 錯誤:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      })
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
      // 將一維陣列轉換為 5x5 二維陣列（後端期望此格式）
      const grid: number[][] = []
      for (let i = 0; i < 5; i++) {
        grid.push(numbers.slice(i * 5, (i + 1) * 5))
      }

      const response = await apiRequest<BingoCardResponse>('/api/v1/bingo/card', {
        method: 'POST',
        body: JSON.stringify({ numbers: grid }),
      })

      // 建立成功後重新載入完整狀態（避免資料不一致）
      await get().fetchBingoStatus()
    } catch (err: any) {
      set({
        error: err.message || '建立賓果卡失敗',
        isLoading: false,
      })
      throw err // 重新拋出錯誤，讓 UI 層可以處理
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
   * 手動領取指定號碼
   */
  claimManualNumber: async (number: number) => {
    // 驗證號碼
    if (number < 1 || number > 25) {
      set({ error: '號碼必須在 1-25 之間' })
      return
    }

    // 檢查是否已領取
    if (get().claimedNumbers.has(number)) {
      set({ error: '此號碼已經領取過了' })
      return
    }

    // 檢查是否在卡片上
    const { userCard } = get()
    if (!userCard) {
      set({ error: '請先建立賓果卡' })
      return
    }

    const isOnCard = userCard.flat().includes(number)
    if (!isOnCard) {
      set({ error: '此號碼不在你的賓果卡上' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      // 呼叫手動領取 API
      const result = await apiRequest<ClaimResult>('/api/v1/bingo/claim/manual', {
        method: 'POST',
        body: JSON.stringify({ number }),
      })

      // 更新狀態
      const newClaimedNumbers = new Set(get().claimedNumbers)
      newClaimedNumbers.add(result.number)

      set({
        claimedNumbers: newClaimedNumbers,
        lineCount: result.current_lines,
        hasReward: result.has_reward,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      set({
        error: err.message || '手動領取號碼失敗',
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

    console.log('[BingoStore] fetchHistory 開始:', {
      month,
      endpoint: `/api/v1/bingo/history/${month}`,
      timestamp: new Date().toISOString(),
    })

    try {
      const history = await apiRequest<BingoHistoryRecord>(`/api/v1/bingo/history/${month}`)

      console.log('[BingoStore] fetchHistory API 回應:', {
        month,
        has_data: !!history,
        data_preview: history ? {
          month_year: history.month_year,
          line_count: history.line_count,
          has_reward: history.has_reward,
          claimed_numbers_count: history.claimed_numbers?.length,
          card_data_exists: !!history.card_data,
          card_data_type: typeof history.card_data,
          card_data_is_array: Array.isArray(history.card_data),
        } : null,
      })

      // 驗證歷史記錄格式
      if (history && history.card_data) {
        if (!Array.isArray(history.card_data) || history.card_data.length !== 5) {
          console.error('[BingoStore] 歷史記錄賓果卡格式錯誤:', {
            card_data: history.card_data,
            is_array: Array.isArray(history.card_data),
            length: Array.isArray(history.card_data) ? history.card_data.length : 'N/A',
          })
          throw new Error('歷史記錄資料格式錯誤：賓果卡不是 5x5 陣列')
        }

        // 驗證每一行
        for (let i = 0; i < 5; i++) {
          if (!Array.isArray(history.card_data[i]) || history.card_data[i].length !== 5) {
            console.error('[BingoStore] 歷史記錄第 ${i} 行格式錯誤:', {
              row: history.card_data[i],
              is_array: Array.isArray(history.card_data[i]),
              length: Array.isArray(history.card_data[i]) ? history.card_data[i].length : 'N/A',
            })
            throw new Error(`歷史記錄資料格式錯誤：第 ${i} 行不是長度為 5 的陣列`)
          }
        }

        console.log('[BingoStore] 歷史記錄格式驗證通過')
      }

      set({ isLoading: false, error: null })
      console.log('[BingoStore] fetchHistory 成功完成')
      return history
    } catch (err: any) {
      // 檢查是否為 404 錯誤（該月份沒有記錄）- 使用 status 屬性而非訊息內容
      const is404 = err.status === 404

      console.log('[BingoStore] fetchHistory 錯誤:', {
        month,
        error: err.message,
        error_type: err.constructor.name,
        status: err.status,
        is404,
        timestamp: new Date().toISOString(),
      })

      // 404 不是錯誤，而是正常的「沒有記錄」狀態
      set({
        error: is404 ? null : (err.message || '查詢歷史記錄失敗'),
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
