/**
 * Journal Store - Zustand state management for tarot journals
 * 塔羅日記 Store
 */

import { create } from 'zustand'

// CRITICAL: Use empty string to route through Next.js API proxy
const API_BASE_URL = ''

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * 日記資料介面
 */
export interface Journal {
  id: string
  reading_id: string
  user_id: string
  content: string
  mood_tags: string[]
  is_private: boolean
  created_at: string
  updated_at: string
}

/**
 * 建立日記請求資料
 */
export interface JournalCreateData {
  content: string
  mood_tags?: string[]
  is_private?: boolean
}

/**
 * 更新日記請求資料（支援部分更新）
 */
export interface JournalUpdateData {
  content?: string
  mood_tags?: string[]
  is_private?: boolean
}

/**
 * 分頁資訊
 */
interface PaginationInfo {
  total: number
}

/**
 * API 回應格式（列表）
 */
interface JournalListAPIResponse {
  items: Journal[]
  total: number
}

/**
 * Journal Store 狀態介面
 */
interface JournalStore {
  // ========== State ==========

  /** 日記列表 */
  journals: Journal[]

  /** 當前查看的日記 */
  currentJournal: Journal | null

  /** 載入狀態 */
  isLoading: boolean

  /** 錯誤訊息 */
  error: Error | null

  /** 分頁資訊 */
  pagination: PaginationInfo | null

  // ========== Actions ==========

  /**
   * 獲取日記列表
   * @param skip - 跳過的記錄數 (預設: 0)
   * @param limit - 返回的記錄數 (預設: 20)
   */
  fetchJournals: (skip?: number, limit?: number) => Promise<void>

  /**
   * 根據 ID 獲取單一日記
   * @param journalId - 日記 ID
   */
  fetchJournalById: (journalId: string) => Promise<void>

  /**
   * 建立新日記
   * @param readingId - 占卜 ID
   * @param data - 日記資料
   * @returns 建立的日記
   */
  createJournal: (readingId: string, data: JournalCreateData) => Promise<Journal>

  /**
   * 更新日記
   * @param journalId - 日記 ID
   * @param data - 更新資料（部分更新）
   * @returns 更新後的日記
   */
  updateJournal: (journalId: string, data: JournalUpdateData) => Promise<Journal>

  /**
   * 刪除日記
   * @param journalId - 日記 ID
   */
  deleteJournal: (journalId: string) => Promise<void>

  /**
   * 清除錯誤訊息
   */
  clearError: () => void

  /**
   * 重置 store 到初始狀態
   */
  reset: () => void
}

// ============================================================================
// API Helper Functions
// ============================================================================

/**
 * 建立認證 Headers
 *
 * 重要：專案使用 httpOnly cookies 進行認證，token 會自動附加到請求中
 * 不需要手動從 localStorage 讀取 token
 */
const createAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json'
  }
}

/**
 * 通用 API 請求函數
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',  // ✅ 啟用 httpOnly cookies 傳送
      headers: {
        ...createAuthHeaders(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '未知錯誤' }))
      const errorMessage = errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      console.error(`[journalStore] API Error at ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url
      })
      throw new Error(errorMessage)
    }

    // 204 No Content 不需要解析 JSON
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  } catch (err: any) {
    // 網路錯誤或其他錯誤
    if (!err.message || err.message === 'Failed to fetch') {
      console.error(`[journalStore] Network Error at ${endpoint}:`, err)
      throw new Error('網路連線失敗，請檢查後端服務是否運行')
    }

    throw err
  }
}

// ============================================================================
// Zustand Store Implementation
// ============================================================================

export const useJournalStore = create<JournalStore>((set, get) => ({
  // ========== Initial State ==========
  journals: [],
  currentJournal: null,
  isLoading: false,
  error: null,
  pagination: null,

  // ========== Actions Implementation ==========

  /**
   * 獲取日記列表
   */
  fetchJournals: async (skip: number = 0, limit: number = 20): Promise<void> => {
    console.log(`[journalStore] Fetching journals: skip=${skip}, limit=${limit}`)
    set({ isLoading: true, error: null })

    try {
      const response = await apiRequest<JournalListAPIResponse>(
        `/api/v1/journals?skip=${skip}&limit=${limit}`
      )

      console.log(`[journalStore] Successfully fetched ${response.items.length} journals`)

      set({
        journals: response.items,
        pagination: { total: response.total },
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      console.error('[journalStore] Error in fetchJournals:', err)
      const error = err instanceof Error ? err : new Error('載入日記失敗')
      set({
        error,
        isLoading: false,
      })
      throw error
    }
  },

  /**
   * 根據 ID 獲取單一日記
   */
  fetchJournalById: async (journalId: string): Promise<void> => {
    console.log(`[journalStore] Fetching journal by id: ${journalId}`)
    set({ isLoading: true, error: null })

    try {
      const journal = await apiRequest<Journal>(`/api/v1/journals/${journalId}`)

      console.log(`[journalStore] Successfully fetched journal: ${journalId}`)

      set({
        currentJournal: journal,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      console.error('[journalStore] Error in fetchJournalById:', err)
      const error = err instanceof Error ? err : new Error('載入日記失敗')
      set({
        error,
        isLoading: false,
        currentJournal: null,
      })
      throw error
    }
  },

  /**
   * 建立新日記
   */
  createJournal: async (
    readingId: string,
    data: JournalCreateData
  ): Promise<Journal> => {
    console.log(`[journalStore] Creating journal for reading: ${readingId}`)
    set({ isLoading: true, error: null })

    try {
      const journal = await apiRequest<Journal>(
        `/api/v1/readings/${readingId}/journal`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      )

      console.log(`[journalStore] Successfully created journal: ${journal.id}`)

      // 將新日記加入列表開頭（最新的在前）
      const currentJournals = get().journals
      set({
        journals: [journal, ...currentJournals],
        isLoading: false,
        error: null,
      })

      return journal
    } catch (err: any) {
      console.error('[journalStore] Error in createJournal:', err)
      const error = err instanceof Error ? err : new Error('建立日記失敗')
      set({
        error,
        isLoading: false,
      })
      throw error
    }
  },

  /**
   * 更新日記
   */
  updateJournal: async (
    journalId: string,
    data: JournalUpdateData
  ): Promise<Journal> => {
    console.log(`[journalStore] Updating journal: ${journalId}`)
    set({ isLoading: true, error: null })

    try {
      const updatedJournal = await apiRequest<Journal>(
        `/api/v1/journals/${journalId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      )

      console.log(`[journalStore] Successfully updated journal: ${journalId}`)

      // 更新列表中的日記
      const currentJournals = get().journals
      const updatedJournals = currentJournals.map(journal =>
        journal.id === journalId ? updatedJournal : journal
      )

      // 更新 currentJournal（如果正在查看）
      const currentJournal = get().currentJournal
      const updatedCurrentJournal = currentJournal?.id === journalId
        ? updatedJournal
        : currentJournal

      set({
        journals: updatedJournals,
        currentJournal: updatedCurrentJournal,
        isLoading: false,
        error: null,
      })

      return updatedJournal
    } catch (err: any) {
      console.error('[journalStore] Error in updateJournal:', err)
      const error = err instanceof Error ? err : new Error('更新日記失敗')
      set({
        error,
        isLoading: false,
      })
      throw error
    }
  },

  /**
   * 刪除日記
   */
  deleteJournal: async (journalId: string): Promise<void> => {
    console.log(`[journalStore] Deleting journal: ${journalId}`)
    set({ isLoading: true, error: null })

    try {
      await apiRequest<void>(`/api/v1/journals/${journalId}`, {
        method: 'DELETE',
      })

      console.log(`[journalStore] Successfully deleted journal: ${journalId}`)

      // 從列表中移除日記
      const currentJournals = get().journals
      const updatedJournals = currentJournals.filter(journal => journal.id !== journalId)

      // 清除 currentJournal（如果正在查看）
      const currentJournal = get().currentJournal
      const updatedCurrentJournal = currentJournal?.id === journalId
        ? null
        : currentJournal

      set({
        journals: updatedJournals,
        currentJournal: updatedCurrentJournal,
        isLoading: false,
        error: null,
      })
    } catch (err: any) {
      console.error('[journalStore] Error in deleteJournal:', err)
      const error = err instanceof Error ? err : new Error('刪除日記失敗')
      set({
        error,
        isLoading: false,
      })
      throw error
    }
  },

  /**
   * 清除錯誤訊息
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * 重置 store 到初始狀態
   */
  reset: () => {
    set({
      journals: [],
      currentJournal: null,
      isLoading: false,
      error: null,
      pagination: null,
    })
  },
}))
