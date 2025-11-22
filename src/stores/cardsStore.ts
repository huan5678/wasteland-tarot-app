/**
 * Cards Store - Zustand state management for tarot cards
 * 塔羅牌 Store
 * 
 * Refactored to use unified API client and adapter pattern.
 */

import { create } from 'zustand'
import type { TarotCard } from '@/types/api'
import { convertRouteToApiSuit } from '@/types/suits'
import { api } from '@/lib/apiClient'
import { adaptBackendCardToFrontend } from '@/lib/adapters/cardAdapter'

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
      // 使用統一的 API Client
      // API Client 會自動加上 /api/v1 前綴，所以這裡不需要寫
      const response = await api.get<CardsAPIResponse>(
        `/cards/suits/${apiSuit}?page=${page}`,
        { signal }
      )

      // 使用 Adapter 清洗數據
      // 對列表中的每一張卡片都進行標準化處理，確保前端數據的一致性
      // 加強防禦性編程：確保 response.cards 存在
      const rawCards = response.cards || [];
      const adaptedCards = rawCards.map(adaptBackendCardToFrontend);

      // 檢查請求是否已被取消
      if (signal?.aborted) {
        console.log(`[cardsStore] Request aborted for ${cacheKey}`)
        return []
      }

      console.log(`[cardsStore] Successfully fetched ${adaptedCards.length} cards for ${cacheKey}`)

      // 更新快取
      const newCache = new Map(get().cache)
      newCache.set(cacheKey, adaptedCards)

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

      return adaptedCards
    } catch (err: any) {
      // 如果請求被取消，不更新 error 狀態
      if (err.name === 'AbortError' || err.message === 'AbortError') {
        console.log(`[cardsStore] Request aborted (caught in fetchCardsBySuit)`)
        return []
      }

      console.error('[cardsStore] Error in fetchCardsBySuit:', err)
      // API Client 已經將錯誤封裝為 APIError 或 Error
      set({
        error: err,
        isLoading: false,
      })
      throw err
    }
  },

  /**
   * 根據 ID 獲取單張卡牌詳情
   */
  fetchCardById: async (cardId: string): Promise<TarotCard | null> => {
    set({ isLoading: true, error: null })

    try {
      // 使用統一的 API Client
      // 包含 include_story=true 參數以取得故事內容和音頻 URLs
      const response = await api.get<any>(`/cards/${cardId}?include_story=true`)

      // 使用 Adapter 清洗數據
      // 這將處理所有繁瑣的字段映射和默認值填充
      const card = adaptBackendCardToFrontend(response)

      set({
        isLoading: false,
        error: null,
      })

      return card
    } catch (err: any) {
      console.error('[cardsStore] Error in fetchCardById:', err)
      set({
        error: err,
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