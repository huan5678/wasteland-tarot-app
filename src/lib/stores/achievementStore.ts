import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useErrorStore } from '@/lib/errorStore'
import { timedFetch } from '@/lib/metrics'
import { z } from 'zod'

// ============================================================================
// Inline Zod Schemas (避免模組載入問題)
// ============================================================================

// Enum Schemas
const AchievementCategorySchema = z.enum([
  'READING',
  'SOCIAL',
  'BINGO',
  'KARMA',
  'EXPLORATION'
])

const AchievementRaritySchema = z.enum([
  'COMMON',
  'RARE',
  'EPIC',
  'LEGENDARY'
])

const AchievementStatusSchema = z.enum([
  'IN_PROGRESS',
  'UNLOCKED',
  'CLAIMED'
])

// Main Schemas
const AchievementSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  category: AchievementCategorySchema,
  rarity: AchievementRaritySchema,
  icon_name: z.string(),
  icon_image_url: z.string().nullable().optional(),
  criteria: z.record(z.any()),
  rewards: z.record(z.any()),
  is_hidden: z.boolean(),
  display_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

const UserAchievementProgressSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  achievement_id: z.string(),
  achievement: AchievementSchema.nullable().optional(),
  current_progress: z.number(),
  target_progress: z.number(),
  progress_percentage: z.number(),
  status: AchievementStatusSchema,
  unlocked_at: z.string().nullable().optional(),
  claimed_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

const AchievementListResponseSchema = z.object({
  achievements: z.array(AchievementSchema),
  total: z.number(),
  category_filter: AchievementCategorySchema.nullable().optional(),
})

const UserProgressSummaryResponseSchema = z.object({
  user_id: z.string(),
  total_achievements: z.number(),
  unlocked_count: z.number(),
  claimed_count: z.number(),
  in_progress_count: z.number(),
  completion_percentage: z.number(),
  achievements: z.array(UserAchievementProgressSchema),
  category_summary: z.record(z.object({
    total: z.number(),
    unlocked: z.number(),
    claimed: z.number(),
  })).optional(),
})

const ClaimRewardResponseSchema = z.object({
  success: z.boolean(),
  achievement_code: z.string(),
  rewards: z.record(z.any()),
  message: z.string(), // ← 添加缺少的 message 欄位
  claimed_at: z.string(),
})

// Type Exports
export type AchievementCategory = z.infer<typeof AchievementCategorySchema>
export type AchievementStatus = z.infer<typeof AchievementStatusSchema>
export type AchievementRarity = z.infer<typeof AchievementRaritySchema>
export type Achievement = z.infer<typeof AchievementSchema>
export type UserAchievementProgress = z.infer<typeof UserAchievementProgressSchema>
export type AchievementListResponse = z.infer<typeof AchievementListResponseSchema>
export type UserProgressSummaryResponse = z.infer<typeof UserProgressSummaryResponseSchema>
export type ClaimRewardResponse = z.infer<typeof ClaimRewardResponseSchema>

// 使用環境變數或預設值
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// ============================================================================
// Types & Interfaces
// ============================================================================

// ⚠️ 注意：核心型別已從 @/types/achievement 匯入
// 只保留 Store 特定的內部型別

/**
 * 成就總覽統計
 */
interface AchievementSummary {
  total_achievements: number
  unlocked_count: number
  claimed_count: number
  in_progress_count: number
  completion_percentage: number
  by_category: Record<string, {
    total: number
    unlocked: number
    claimed: number
    completion_percentage: number
  }>
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

interface AchievementStore {
  // ========== State ==========

  /** 所有成就定義 */
  achievements: Achievement[]

  /** 使用者成就進度 */
  userProgress: UserAchievementProgress[]

  /** 成就總覽統計 */
  summary: AchievementSummary | null

  /** 新解鎖的成就（用於顯示通知） */
  newlyUnlockedAchievements: UserAchievementProgress[]

  /** 當前篩選的類別 */
  currentFilter: AchievementCategory | null

  /** 載入狀態 */
  isLoading: boolean

  /** 錯誤訊息 */
  error: string | null

  /** 是否正在領取獎勵 */
  isClaiming: boolean

  // ========== Actions ==========

  /**
   * 載入所有成就定義
   * @param category - 可選的類別篩選
   */
  fetchAchievements: (category?: AchievementCategory) => Promise<void>

  /**
   * 載入使用者成就進度
   * @param category - 可選的類別篩選
   */
  fetchUserProgress: (category?: AchievementCategory) => Promise<void>

  /**
   * 載入成就總覽統計
   */
  fetchSummary: () => Promise<void>

  /**
   * 領取成就獎勵
   * @param code - 成就代碼
   */
  claimReward: (code: string) => Promise<ClaimRewardResponse | null>

  /**
   * 設定類別篩選
   * @param category - 類別篩選（null 表示顯示全部）
   */
  setFilter: (category: AchievementCategory | null) => void

  /**
   * 標記新解鎖的成就為已讀
   * @param achievementId - 成就 ID
   */
  markAsRead: (achievementId: string) => void

  /**
   * 清除所有新解鎖通知
   */
  clearNewlyUnlocked: () => void

  /**
   * 重置 Store 狀態
   */
  reset: () => void

  /**
   * 清除錯誤訊息
   */
  clearError: () => void
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
      console.error(`[AchievementStore] API Error: ${endpoint}`, {
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
      console.warn('[AchievementStore] 🚫 401 Error - Redirecting to login', {
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

      console.error(`[AchievementStore] API Error: ${endpoint}`, errorMessage, {
        status: response.status,
        errorData,  // 加入完整錯誤資料供除錯
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
    console.error(`[AchievementStore] API Error: ${endpoint}`, err?.message || '未知錯誤', {
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

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      // ========== Initial State ==========
      achievements: [],
      userProgress: [],
      summary: null,
      newlyUnlockedAchievements: [],
      currentFilter: null,
      isLoading: false,
      error: null,
      isClaiming: false,

  // ========== Actions Implementation ==========

  /**
   * 載入所有成就定義
   */
  fetchAchievements: async (category?: AchievementCategory) => {
    set({ isLoading: true, error: null })

    try {
      const params = category ? `?category=${category}` : ''
      const rawResponse = await apiRequest<unknown>(
        `/api/v1/achievements${params}`
      )

      console.log('[AchievementStore] Raw API Response:', rawResponse)

      // ✅ Zod v3 Runtime validation
      const parseResult = AchievementListResponseSchema.safeParse(rawResponse)

      if (!parseResult.success) {
        console.error('[AchievementStore] Zod Validation Failed:', parseResult.error.issues)
        console.error('[AchievementStore] Raw Response:', JSON.stringify(rawResponse, null, 2))

        set({
          error: `資料格式錯誤: ${parseResult.error.issues[0]?.message || '未知錯誤'}`,
          isLoading: false,
        })
        return
      }

      const validated = parseResult.data

      set({
        achievements: validated.achievements,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      console.error('[AchievementStore] fetchAchievements Error:', err)
      set({
        error: err.message || '載入成就列表失敗',
        isLoading: false,
      })
    }
  },

  /**
   * 載入使用者成就進度
   */
  fetchUserProgress: async (category?: AchievementCategory) => {
    set({ isLoading: true, error: null })

    try {
      const params = category ? `?category=${category}` : ''
      const rawResponse = await apiRequest<unknown>(
        `/api/v1/achievements/progress${params}`
      )

      console.log('[AchievementStore] fetchUserProgress Raw Response:', rawResponse)

      // ✅ Zod v3 Runtime validation
      const parseResult = UserProgressSummaryResponseSchema.safeParse(rawResponse)

      if (!parseResult.success) {
        console.error('[AchievementStore] Zod Validation Failed for UserProgress:', parseResult.error.issues)
        console.error('[AchievementStore] Raw Response:', JSON.stringify(rawResponse, null, 2))

        set({
          error: `資料格式錯誤: ${parseResult.error.issues[0]?.message || '未知錯誤'}`,
          isLoading: false,
        })
        return
      }

      const validated = parseResult.data

      // 檢測新解鎖的成就（與上次比對）
      const previousProgress = get().userProgress
      const newlyUnlocked = validated.achievements.filter(achievement => {
        const previous = previousProgress.find(p => p.achievement_id === achievement.achievement_id)
        return (
          achievement.status === 'UNLOCKED' &&
          (!previous || previous.status === 'IN_PROGRESS')
        )
      })

      set({
        userProgress: validated.achievements,
        summary: {
          total_achievements: validated.total_achievements,
          unlocked_count: validated.unlocked_count,
          claimed_count: validated.claimed_count,
          in_progress_count: validated.in_progress_count,
          completion_percentage: validated.completion_percentage,
          by_category: validated.category_summary || {},
        },
        newlyUnlockedAchievements: [
          ...get().newlyUnlockedAchievements,
          ...newlyUnlocked,
        ],
        isLoading: false,
        error: null,
      })

      console.log('[AchievementStore] ✅ 用戶成就進度載入成功，數量:', validated.achievements.length)

      return validated.achievements
    } catch (err: any) {
      console.error('[AchievementStore] fetchUserProgress Error:', err)
      set({
        error: err.message || '載入使用者進度失敗',
        isLoading: false,
      })
    }
  },

  /**
   * 載入成就總覽統計
   */
  fetchSummary: async () => {
    set({ isLoading: true, error: null })

    try {
      console.log('[AchievementStore] 📡 呼叫 /api/v1/achievements/summary...')
      const response = await apiRequest<{
        user_id: string
        overall: {
          total_achievements: number
          unlocked_count: number
          claimed_count: number
          in_progress_count: number
          completion_percentage: number
        }
        by_category: Record<string, {
          total: number
          unlocked: number
          claimed: number
          completion_percentage: number
        }>
      }>('/api/v1/achievements/summary')

      console.log('[AchievementStore] ✅ 成就摘要載入成功:', response)

      const summaryData = {
        ...response.overall,
        by_category: response.by_category,
      }

      set({
        summary: summaryData,
        isLoading: false,
        error: null,
      })

      return summaryData
    } catch (err: any) {
      set({
        error: err.message || '載入成就總覽失敗',
        isLoading: false,
      })
    }
  },

  /**
   * 領取成就獎勵
   */
  claimReward: async (code: string): Promise<ClaimRewardResponse | null> => {
    set({ isClaiming: true, error: null })

    try {
      const rawResponse = await apiRequest<unknown>(
        `/api/v1/achievements/${code}/claim`,
        {
          method: 'POST',
        }
      )

      console.log('[AchievementStore] claimReward Raw Response:', rawResponse)

      // ✅ Zod v3 Runtime validation
      const parseResult = ClaimRewardResponseSchema.safeParse(rawResponse)

      if (!parseResult.success) {
        console.error('[AchievementStore] Zod Validation Failed for ClaimReward:', parseResult.error.issues)
        console.error('[AchievementStore] Raw Response:', JSON.stringify(rawResponse, null, 2))

        set({
          error: `資料格式錯誤: ${parseResult.error.issues[0]?.message || '未知錯誤'}`,
          isClaiming: false,
        })
        return null
      }

      const validated = parseResult.data

      // 更新本地進度狀態
      const updatedProgress = get().userProgress.map(progress => {
        if (progress.achievement && progress.achievement.code === code) {
          return {
            ...progress,
            status: 'CLAIMED' as const,
            claimed_at: validated.claimed_at,
          }
        }
        return progress
      })

      set({
        userProgress: updatedProgress,
        isClaiming: false,
        error: null,
      })

      // 重新載入總覽統計
      await get().fetchSummary()

      return validated
    } catch (err: any) {
      console.error('[AchievementStore] claimReward Error:', err)
      set({
        error: err.message || '領取獎勵失敗',
        isClaiming: false,
      })
      return null
    }
  },

  /**
   * 設定類別篩選
   */
  setFilter: (category: AchievementCategory | null) => {
    set({ currentFilter: category })
    // 重新載入資料
    get().fetchUserProgress(category || undefined)
  },

  /**
   * 標記新解鎖的成就為已讀
   */
  markAsRead: (achievementId: string) => {
    set({
      newlyUnlockedAchievements: get().newlyUnlockedAchievements.filter(
        achievement => achievement.achievement_id !== achievementId
      ),
    })
  },

  /**
   * 清除所有新解鎖通知
   */
  clearNewlyUnlocked: () => {
    set({ newlyUnlockedAchievements: [] })
  },

  /**
   * 重置 Store 狀態
   */
  reset: () => {
    set({
      achievements: [],
      userProgress: [],
      summary: null,
      newlyUnlockedAchievements: [],
      currentFilter: null,
      isLoading: false,
      error: null,
      isClaiming: false,
    })
  },

      /**
       * 清除錯誤訊息
       */
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 只快取靜態的成就定義，不快取動態的使用者進度
        achievements: state.achievements,
        // 不快取：userProgress, summary, newlyUnlockedAchievements (這些會頻繁更新)
        // 不快取：isLoading, error, isClaiming (UI 狀態)
        // 不快取：currentFilter (使用者偏好，但每次重新選擇也可以)
      }),
      version: 1,
      // 快取過期時間：1 小時
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // 舊版本遷移邏輯（如果需要）
          return persistedState
        }
        return persistedState
      },
    }
  )
)

// ============================================================================
// Export Types (Re-export for convenience)
// ============================================================================

export type {
  AchievementCategory,
  AchievementStatus,
  AchievementRarity,
  Achievement,
  UserAchievementProgress,
  AchievementListResponse,
  UserProgressSummaryResponse,
  ClaimRewardResponse,
  AchievementSummary,
}
