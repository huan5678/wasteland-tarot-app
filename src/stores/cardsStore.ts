/**
 * Cards Store - Zustand state management for tarot cards
 * 塔羅牌 Store
 */

import { create } from 'zustand'
import type { TarotCard } from '@/types/api'
import { convertRouteToApiSuit } from '@/types/suits'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * 分頁資訊
 */
interface PaginationInfo {
  page: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

/**
 * API 回應格式（與後端 CardListResponse 對應）
 */
interface CardsAPIResponse {
  cards: TarotCard[]
  total_count: number
  page: number
  page_size: number
  has_more: boolean
}

/**
 * Cards Store 狀態介面
 */
interface CardsStore {
  // ========== State ==========

  /** 載入狀態 */
  isLoading: boolean

  /** 錯誤訊息 */
  error: Error | null

  /** 分頁資訊 */
  pagination: PaginationInfo | null

  /** 快取卡牌資料 (以 suit + page 為 key) */
  cache: Map<string, TarotCard[]>

  // ========== Actions ==========

  /**
   * 根據花色獲取卡牌列表
   * @param suit - 花色路由參數 (major, bottles, weapons, caps, rods) 或 API 枚舉值
   * @param page - 頁碼 (預設: 1)
   * @param signal - AbortSignal 用於取消請求 (可選)
   * @returns 卡牌列表
   */
  fetchCardsBySuit: (suit: string, page?: number, signal?: AbortSignal) => Promise<TarotCard[]>

  /**
   * 根據 ID 獲取單張卡牌詳情
   * @param cardId - 卡牌 ID
   * @returns 卡牌資料
   */
  fetchCardById: (cardId: string) => Promise<TarotCard | null>

  /**
   * 清除錯誤訊息
   */
  clearError: () => void

  /**
   * 清除快取
   */
  clearCache: () => void
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
 * 通用 API 請求函數
 * 支援 AbortSignal 來取消請求，修復 React 18 Strict Mode 雙重執行問題
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...createAuthHeaders(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '未知錯誤' }))
      const errorMessage = errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      console.error(`[cardsStore] API Error at ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url
      })
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (err: any) {
    // 如果請求被取消，仍需拋出以便上層處理
    if (err.name === 'AbortError') {
      throw err
    }

    // 網路錯誤或其他錯誤
    if (!err.message || err.message === 'Failed to fetch') {
      console.error(`[cardsStore] Network Error at ${endpoint}:`, err)
      throw new Error('網路連線失敗，請檢查後端服務是否運行')
    }

    throw err
  }
}

// ============================================================================
// Zustand Store Implementation
// ============================================================================

export const useCardsStore = create<CardsStore>((set, get) => ({
  // ========== Initial State ==========
  isLoading: false,
  error: null,
  pagination: null,
  cache: new Map<string, TarotCard[]>(),

  // ========== Actions Implementation ==========

  /**
   * 根據花色獲取卡牌列表
   * 支援 AbortSignal 來取消請求，避免 React 18 Strict Mode 的雙重執行問題
   */
  fetchCardsBySuit: async (suit: string, page: number = 1, signal?: AbortSignal): Promise<TarotCard[]> => {
    // 將路由參數轉換為 API 枚舉值
    let apiSuit: string
    try {
      apiSuit = convertRouteToApiSuit(suit)
    } catch (err) {
      const error = new Error(`無效的花色參數: ${suit}`)
      console.error('[cardsStore] Invalid suit parameter:', suit)
      set({ error, isLoading: false })
      throw error
    }

    const cacheKey = `${suit}-${page}`

    // 檢查快取
    const cachedCards = get().cache.get(cacheKey)
    if (cachedCards) {
      console.log(`[cardsStore] Using cached cards for ${cacheKey}`)
      return cachedCards
    }

    console.log(`[cardsStore] Fetching cards for suit: ${suit} (API: ${apiSuit}), page: ${page}`)
    set({ isLoading: true, error: null })

    try {
      // 使用轉換後的 API 枚舉值呼叫後端，並傳入 AbortSignal
      const response = await apiRequest<CardsAPIResponse>(
        `/api/v1/cards/suits/${apiSuit}?page=${page}`,
        signal ? { signal } : {}
      )

      // 檢查請求是否已被取消
      if (signal?.aborted) {
        console.log(`[cardsStore] Request aborted for ${cacheKey}`)
        return []
      }

      console.log(`[cardsStore] Successfully fetched ${response.cards.length} cards for ${cacheKey}`)

      // 更新快取
      const newCache = new Map(get().cache)
      newCache.set(cacheKey, response.cards)

      // 轉換 API 回應為 pagination 格式
      const pagination: PaginationInfo = {
        page: response.page,
        totalPages: Math.ceil(response.total_count / response.page_size),
        totalItems: response.total_count,
        itemsPerPage: response.page_size,
      }

      set({
        isLoading: false,
        error: null,
        pagination,
        cache: newCache,
      })

      return response.cards
    } catch (err: any) {
      // 如果請求被取消，不更新 error 狀態
      if (err.name === 'AbortError') {
        console.log(`[cardsStore] Request aborted (caught in fetchCardsBySuit)`)
        return []
      }

      console.error('[cardsStore] Error in fetchCardsBySuit:', err)
      const error = err instanceof Error ? err : new Error('載入卡牌失敗')
      set({
        error,
        isLoading: false,
      })
      throw error
    }
  },

  /**
   * 根據 ID 獲取單張卡牌詳情
   */
  fetchCardById: async (cardId: string): Promise<TarotCard | null> => {
    set({ isLoading: true, error: null })

    try {
      const card = await apiRequest<TarotCard>(`/api/v1/cards/${cardId}`)

      set({
        isLoading: false,
        error: null,
      })

      return card
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error('載入卡牌詳情失敗')
      set({
        error,
        isLoading: false,
      })
      return null
    }
  },

  /**
   * 清除錯誤訊息
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * 清除快取
   */
  clearCache: () => {
    set({ cache: new Map<string, TarotCard[]>() })
  },
}))

// ============================================================================
// Export Types
// ============================================================================

export type {
  PaginationInfo,
  CardsAPIResponse,
}
