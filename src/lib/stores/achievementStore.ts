import { create } from 'zustand'
import { useErrorStore } from '@/lib/errorStore'
import { timedFetch } from '@/lib/metrics'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * 成就類別
 */
export enum AchievementCategory {
  READING = 'READING',
  SOCIAL = 'SOCIAL',
  BINGO = 'BINGO',
  KARMA = 'KARMA',
  EXPLORATION = 'EXPLORATION'
}

/**
 * 成就狀態
 */
export enum AchievementStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  UNLOCKED = 'UNLOCKED',
  CLAIMED = 'CLAIMED'
}

/**
 * 成就稀有度
 */
export type AchievementRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

/**
 * 成就定義介面
 */
export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  icon_name: string
  criteria: Record<string, any>
  rewards: Record<string, any>
  is_hidden: boolean
  display_order: number
  created_at: string
  updated_at: string
}

/**
 * 使用者成就進度介面
 */
export interface UserAchievementProgress {
  id: string
  user_id: string
  achievement_id: string
  achievement: Achievement
  current_progress: number
  target_progress: number
  progress_percentage: number
  status: AchievementStatus
  unlocked_at: string | null
  claimed_at: string | null
  created_at: string
  updated_at: string
}

/**
 * 成就列表回應
 */
interface AchievementListResponse {
  achievements: Achievement[]
  total: number
  category_filter: AchievementCategory | null
}

/**
 * 使用者進度總覽回應
 */
interface UserProgressSummaryResponse {
  user_id: string
  total_achievements: number
  unlocked_count: number
  claimed_count: number
  in_progress_count: number
  completion_percentage: number
  achievements: UserAchievementProgress[]
}

/**
 * 領取獎勵回應
 */
interface ClaimRewardResponse {
  success: boolean
  achievement_code: string
  rewards: Record<string, any>
  message: string
  claimed_at: string
}

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
 * 取得認證 Token
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('pip-boy-token')
}

/**
 * 建立認證 Headers
 */
const createAuthHeaders = (): HeadersInit => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  }
}

/**
 * 統一的 API 請求函數
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

    // 使用 timedFetch 追蹤效能
    const response = await timedFetch(url, {
      ...options,
      headers: {
        ...createAuthHeaders(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData: APIError = await response.json().catch(() => ({ detail: '未知錯誤' }))
      const errorMessage = typeof errorData.detail === 'string'
        ? errorData.detail
        : errorData.detail?.message || `HTTP ${response.status}`
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (err: any) {
    // 推送錯誤至全域錯誤 Store
    useErrorStore.getState().pushError({
      source: 'achievement-api',
      message: err.message || 'API 錯誤',
      detail: { endpoint, options },
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
      const response = await apiRequest<AchievementListResponse>(
        `/api/v1/achievements${params}`
      )

      set({
        achievements: response.achievements,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
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
      const response = await apiRequest<UserProgressSummaryResponse>(
        `/api/v1/achievements/progress${params}`
      )

      // 檢測新解鎖的成就（與上次比對）
      const previousProgress = get().userProgress
      const newlyUnlocked = response.achievements.filter(achievement => {
        const previous = previousProgress.find(p => p.achievement_id === achievement.achievement_id)
        return (
          achievement.status === AchievementStatus.UNLOCKED &&
          (!previous || previous.status === AchievementStatus.IN_PROGRESS)
        )
      })

      set({
        userProgress: response.achievements,
        summary: {
          total_achievements: response.total_achievements,
          unlocked_count: response.unlocked_count,
          claimed_count: response.claimed_count,
          in_progress_count: response.in_progress_count,
          completion_percentage: response.completion_percentage,
          by_category: {},
        },
        newlyUnlockedAchievements: [
          ...get().newlyUnlockedAchievements,
          ...newlyUnlocked,
        ],
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
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

      set({
        summary: {
          ...response.overall,
          by_category: response.by_category,
        },
        isLoading: false,
        error: null,
      })
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
      const response = await apiRequest<ClaimRewardResponse>(
        `/api/v1/achievements/${code}/claim`,
        {
          method: 'POST',
        }
      )

      // 更新本地進度狀態
      const updatedProgress = get().userProgress.map(progress => {
        if (progress.achievement.code === code) {
          return {
            ...progress,
            status: AchievementStatus.CLAIMED,
            claimed_at: response.claimed_at,
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

      return response
    } catch (err: any) {
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
// Export Types
// ============================================================================

export type {
  Achievement,
  UserAchievementProgress,
  AchievementListResponse,
  UserProgressSummaryResponse,
  ClaimRewardResponse,
  AchievementSummary,
}
