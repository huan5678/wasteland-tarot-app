/**
 * API 服務層 - 與後端 FastAPI 通信
 *
 * 重要：使用 Next.js API Proxy 解決 Cookie 跨 port 問題
 * - 所有 /api/v1/* 請求會自動被 Next.js rewrites 轉發至 localhost:8000
 * - 這解決了 Chrome 拒絕接收 SameSite=lax cookies 的問題
 * - API_BASE_URL 設為空字串，使用相對路徑（/api/v1/...）
 */

// Import types first
import type {
  Reading,
  ReadingSession,
  LegacyReading,
  TarotCard as WastelandCard,
  User as APIUser,
  SpreadTemplate,
} from '@/types/api'
import { isReadingSession, isLegacyReading } from '@/types/api'
import { useErrorStore } from './errorStore'
import { timedFetch } from './metrics'

// Re-export types for backward compatibility
export type { Reading, ReadingSession, LegacyReading }
export { isReadingSession, isLegacyReading }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

// Legacy interface for backward compatibility
interface TarotCard {
  id: string
  name: string
  suit: string
  number?: number
  upright_meaning: string
  reversed_meaning: string
  image_url?: string
  keywords?: string[]
  radiation_level?: number
  threat_level?: number
  vault_number?: number
  pip_boy_analysis?: string
  wasteland_humor?: string
  nuka_cola_reference?: string
}

interface User {
  id: string
  username?: string // 向後相容
  name: string // OAuth 和傳統認證都使用 name
  email: string
  display_name?: string
  faction_alignment?: string
  karma_score?: number
  experience_level?: string
  total_readings?: number
  created_at: string
  // 權限相關欄位
  is_admin?: boolean
  // OAuth 相關欄位
  isOAuthUser?: boolean
  oauthProvider?: string | null // 如 'google'
  profilePicture?: string | null // OAuth 頭像 URL
  // 用戶上傳的頭像
  avatar_url?: string | null // 用戶自行上傳的頭像 URL（優先於 OAuth 頭像）
}

class APIError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'APIError'
  }
}

// Global token refresh lock to prevent concurrent refresh requests
let refreshTokenPromise: Promise<boolean> | null = null

/**
 * Global token refresh with concurrency lock
 * - Only one refresh request can be in flight at a time
 * - Other requests wait for the active refresh to complete
 * - Returns true if refresh succeeded, false otherwise
 */
async function refreshToken(): Promise<boolean> {
  // If refresh is already in progress, wait for it
  if (refreshTokenPromise) {
    return refreshTokenPromise
  }

  // Create new refresh promise
  refreshTokenPromise = (async () => {
    try {
      const refreshResponse = await timedFetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      return refreshResponse.ok
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    } finally {
      // Clear the lock after 100ms to allow future refreshes
      setTimeout(() => {
        refreshTokenPromise = null
      }, 100)
    }
  })()

  return refreshTokenPromise
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const maxRetries = (options as any).retry?.retries ?? 1
  const retryDelay = (options as any).retry?.delay ?? 500

  let attempt = 0
  let lastError: any = null

  while (attempt <= maxRetries) {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        // network offline - push and break
        try { useErrorStore.getState().setNetworkOnline(false) } catch {}
        throw new APIError('Network offline', 0)
      } else {
        try { useErrorStore.getState().setNetworkOnline(true) } catch {}
      }

      // Use timedFetch instead of fetch for automatic performance tracking
      const response = await timedFetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        // 重構變更：加入 credentials: 'include' 以自動發送 httpOnly cookies
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))

        // 401 Unauthorized - 嘗試刷新 token（使用全域鎖）
        if (response.status === 401 && endpoint !== '/api/v1/auth/refresh' && endpoint !== '/api/v1/auth/login') {
          console.warn('[API] 🚫 401 Unauthorized - Attempting token refresh', {
            timestamp: new Date().toISOString(),
            endpoint,
            method: options.method || 'GET'
          })

          const refreshSucceeded = await refreshToken()

          if (refreshSucceeded) {
            console.log('[API] ✅ Token refresh succeeded, retrying request', {
              timestamp: new Date().toISOString(),
              endpoint
            })

            // Token 刷新成功，重試原始請求
            const retryResponse = await timedFetch(url, {
              ...options,
              headers: {
                ...defaultHeaders,
                ...options.headers,
              },
              credentials: 'include',
            })

            if (retryResponse.ok) {
              // 204 No Content responses have no body
              if (retryResponse.status === 204) {
                return undefined as T
              }
              return retryResponse.json()
            } else {
              // Retry also failed - token might be expired
              console.warn('[API] ⚠️ Retry after token refresh failed', {
                timestamp: new Date().toISOString(),
                endpoint,
                status: retryResponse.status
              })
              const retryError = await retryResponse.json().catch(() => ({ detail: 'Unknown error' }))
              throw new APIError(retryError.detail || `HTTP ${retryResponse.status}`, retryResponse.status)
            }
          } else {
            console.warn('[API] ❌ Token refresh failed - Clearing auth state', {
              timestamp: new Date().toISOString(),
              endpoint,
              currentPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
            })

            // Refresh failed - clear auth state and redirect to login (only for protected routes)
            if (typeof window !== 'undefined') {
              // Clear localStorage auth state
              localStorage.removeItem('auth-store')

              // Dynamically import authStore to avoid circular dependencies
              import('@/lib/authStore').then(({ useAuthStore }) => {
                // Clear Zustand store state
                useAuthStore.setState({
                  user: null,
                  isOAuthUser: false,
                  oauthProvider: null,
                  profilePicture: null
                })
              }).catch(err => {
                console.error('Failed to clear auth store:', err)
              })

              const currentPath = window.location.pathname

              // 定義公開路由（不需要登入就能訪問）
              const publicPaths = [
                '/',              // 首頁
                '/cards',         // 卡牌圖書館
                '/readings/quick', // 快速占卜
              ]

              // 只有在受保護的路由才跳轉到登入頁
              const isPublicPath = publicPaths.includes(currentPath) || currentPath.startsWith('/auth')

              if (!isPublicPath) {
                console.log('[API] 🔀 Redirecting to login (protected route)', {
                  timestamp: new Date().toISOString(),
                  from: currentPath,
                  to: `/auth/login?returnUrl=${encodeURIComponent(currentPath)}`
                })
                window.location.href = `/auth/login?returnUrl=${encodeURIComponent(currentPath)}`
              } else {
                console.log('[API] ℹ️ Skipping redirect (public route)', {
                  timestamp: new Date().toISOString(),
                  currentPath
                })
              }
            }
            throw new APIError('Authentication expired', 401)
          }
        }

        // 5xx retryable
        if (response.status >= 500 && attempt < maxRetries) {
          attempt++
          await new Promise(r => setTimeout(r, retryDelay * attempt))
          continue
        }
        throw new APIError(errorData.detail || `HTTP ${response.status}`, response.status)
      }

      // 204 No Content responses have no body
      if (response.status === 204) {
        return undefined as T
      }

      return response.json()
    } catch (err: any) {
      lastError = err
      if (attempt >= maxRetries || (err instanceof APIError && err.status < 500)) {
        // push to error store，但排除預期的錯誤情況
        // 1. /api/v1/auth/me 端點的 401 錯誤 - 正常的未登入狀態
        // 2. 404 Not Found - 資源不存在，由頁面組件處理跳轉
        const isAuthCheckEndpoint = endpoint === '/api/v1/auth/me'
        const isUnauthorized = err instanceof APIError && err.status === 401
        const isNotFound = err instanceof APIError && err.status === 404
        const shouldNotDisplayError = (isAuthCheckEndpoint && isUnauthorized) || isNotFound

        if (!shouldNotDisplayError) {
          try {
            useErrorStore.getState().pushError({
              source: 'api',
              message: err.message || 'API Error',
              detail: { endpoint, options },
              statusCode: err.status,
            })
          } catch {}
        }
        throw err
      }
      attempt++
      await new Promise(r => setTimeout(r, retryDelay * attempt))
    }
  }
  throw lastError || new Error('Unknown API error')
}

// Cards API
export const cardsAPI = {
  // 獲取所有卡牌（支援分頁回應）
  getAll: async (options?: { limit?: number }): Promise<TarotCard[]> => {
    const pageSize = options?.limit || 100 // 預設取得 100 張卡片
    const response = await apiRequest<{
      cards: TarotCard[]
      total_count: number
      page: number
      page_size: number
      has_more: boolean
    }>(`/api/v1/cards/?page=1&page_size=${pageSize}`)
    return response.cards
  },

  // 根據 ID 獲取卡牌
  getById: (id: string): Promise<TarotCard> =>
    apiRequest<TarotCard>(`/api/v1/cards/${id}`),

  // 抽取隨機卡牌（使用 RESTful 端點）
  drawRandom: (count: number = 1): Promise<TarotCard[]> =>
    apiRequest<TarotCard[]>(`/api/v1/cards/draws?count=${count}`),

  // 根據花色獲取卡牌
  getBySuit: (suit: string): Promise<TarotCard[]> =>
    apiRequest<TarotCard[]>(`/api/v1/cards/?suit=${suit}`),
}

import type { CreateReadingPayload } from '@/types/api'

// Readings API
export const readingsAPI = {
  // 創建新占卜
  create: (readingData: CreateReadingPayload): Promise<Reading> =>
    apiRequest<Reading>('/api/v1/readings/', {
      method: 'POST',
      body: JSON.stringify(readingData),
    }),

  // 獲取用戶的占卜記錄（使用正確的後端端點）
  getUserReadings: (userId: string): Promise<{ readings: Reading[], total_count: number, page: number, page_size: number, has_more: boolean }> =>
    apiRequest(`/api/v1/readings/?page=1&page_size=100&sort_by=created_at&sort_order=desc`),

  // 根據 ID 獲取占卜
  getById: (id: string): Promise<Reading> =>
    apiRequest<Reading>(`/api/v1/readings/${id}`),

  // 更新占卜 (完整更新)
  update: (id: string, updateData: Partial<Reading>): Promise<Reading> =>
    apiRequest<Reading>(`/api/v1/readings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  // 部分更新占卜 (包含 AI 解讀)
  patch: (id: string, updateData: Partial<ReadingSession>): Promise<ReadingSession> =>
    apiRequest<ReadingSession>(`/api/v1/readings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),

  // 儲存 AI 解讀結果
  saveAIInterpretation: (
    id: string,
    interpretation: {
      overall_interpretation: string
      summary_message?: string
      prediction_confidence?: number
    }
  ): Promise<ReadingSession> =>
    apiRequest<ReadingSession>(`/api/v1/readings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...interpretation,
        ai_interpretation_requested: true,
      }),
    }),

  // 刪除占卜
  delete: (id: string): Promise<void> =>
    apiRequest<void>(`/api/v1/readings/${id}`, {
      method: 'DELETE',
    }),
}

// Auth API
export const authAPI = {
  // 註冊（使用 email + password + name）
  // 重構變更：使用正確的後端 API 路徑，tokens 將儲存在 httpOnly cookies
  register: (userData: {
    email: string
    password: string
    confirm_password: string
    name: string
    display_name?: string
    faction_alignment?: string
    wasteland_location?: string
  }): Promise<{ message: string; user: User }> =>
    apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // 登入（使用 email + password）
  // 重構變更：使用正確的後端 API 路徑，tokens 將儲存在 httpOnly cookies
  // 返回值包含 token_expires_at (JWT exp timestamp)
  login: (credentials: {
    email: string
    password: string
  }): Promise<{ message: string; user: User; token_expires_at?: number }> =>
    apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // 獲取當前用戶信息
  // 重構變更：移除 token 參數，改為依賴 httpOnly cookies
  // 返回值包含 token_expires_at (JWT exp timestamp)
  getCurrentUser: (): Promise<{ user: User; token_expires_at?: number }> =>
    apiRequest('/api/v1/auth/me', {
      method: 'GET',
    }),

  // 刷新 token
  // 重構變更：移除 refreshToken 參數，改為從 httpOnly cookies 讀取
  refreshToken: (): Promise<{ access_token: string; refresh_token: string; token_type: string }> =>
    apiRequest('/api/v1/auth/refresh', {
      method: 'POST',
    }),

  // 登出
  // 重構變更：移除 token 參數，改為依賴 httpOnly cookies
  logout: (): Promise<{ message: string; is_oauth_user: boolean; oauth_provider: string | null }> =>
    apiRequest('/api/v1/auth/logout', {
      method: 'POST',
    }),

  // 延長 Token（活躍度或忠誠度）
  extendToken: (data: {
    extension_type: 'activity' | 'loyalty'
    activity_duration?: number // 活躍時長（秒），activity 類型必填
  }): Promise<{
    success: boolean
    message: string
    extended_minutes: number
    token_expires_at: number
    rewards?: {
      karma_bonus: number
      badge_unlocked: string
    }
  }> =>
    apiRequest('/api/v1/auth/extend-token', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 取得忠誠度狀態
  getLoyaltyStatus: (): Promise<{
    is_eligible: boolean
    login_days_count: number
    login_dates: string[]
    extension_available: boolean
    current_streak: number
  }> =>
    apiRequest('/api/v1/auth/loyalty-status', {
      method: 'GET',
    }),

  // 取得用戶的認證方式狀態 (Stage 12.3)
  getAuthMethods: (): Promise<{
    has_passkey: boolean
    has_password: boolean
    has_oauth: boolean
  }> =>
    apiRequest('/api/v1/auth/methods', {
      method: 'GET',
    }),
}

// Health check
export const healthAPI = {
  check: (): Promise<{ status: string; service: string; version: string }> =>
    apiRequest('/health'),
}

// Sessions API (Reading Save & Resume)
import type {
  SessionListResponse,
  SessionCreateRequest,
  SessionUpdateRequest,
  OfflineSessionSync,
  SyncResponse,
  ConflictResolution,
  SessionCompletionResult,
} from '@/types/session'

export const sessionsAPI = {
  // Create new session
  create: (data: SessionCreateRequest): Promise<ReadingSession> =>
    apiRequest('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // List user's incomplete sessions
  list: (params?: { limit?: number; offset?: number; status?: string }): Promise<SessionListResponse> => {
    const query = new URLSearchParams()
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.offset) query.append('offset', params.offset.toString())
    if (params?.status) query.append('status_filter', params.status)
    return apiRequest(`/api/v1/sessions?${query.toString()}`)
  },

  // Get session by ID
  getById: (id: string): Promise<ReadingSession> =>
    apiRequest(`/api/v1/sessions/${id}`),

  // Update session (auto-save)
  update: (id: string, data: SessionUpdateRequest, expectedUpdatedAt?: string): Promise<ReadingSession> => {
    // Include expected_updated_at in request body for optimistic locking
    const requestBody = expectedUpdatedAt
      ? { ...data, expected_updated_at: expectedUpdatedAt }
      : data

    return apiRequest(`/api/v1/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(requestBody),
    })
  },

  // Delete session
  delete: (id: string): Promise<void> =>
    apiRequest(`/api/v1/sessions/${id}`, {
      method: 'DELETE',
    }),

  // Complete session (convert to Reading)
  complete: (id: string, data?: {
    interpretation?: string
    character_voice?: string
    karma_context?: string
    faction_influence?: string
  }): Promise<SessionCompletionResult> =>
    apiRequest(`/api/v1/sessions/${id}/complete`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // Sync offline session
  syncOffline: (data: OfflineSessionSync): Promise<SyncResponse> =>
    apiRequest('/api/v1/sessions/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Resolve conflict
  resolveConflict: (data: ConflictResolution): Promise<ReadingSession> =>
    apiRequest('/api/v1/sessions/resolve-conflict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const spreadTemplatesAPI = {
  getAll: (): Promise<SpreadTemplate[]> => apiRequest<SpreadTemplate[]>('/api/v1/spreads/'),
}

// Interpretations API
export const interpretationsAPI = {
  // 獲取解讀統計摘要
  getStats: (): Promise<{
    total_interpretations: number
    active_interpretations: number
    inactive_interpretations: number
    cards_with_interpretations: number
    characters_with_interpretations: number
  }> => apiRequest('/api/v1/interpretations/stats/summary'),
}

// Story Mode API (Wasteland Story Mode)
import type {
  WastelandCardWithStory,
  GenerateStoryAudioRequest,
  GenerateStoryAudioResponse,
} from '@/types/database'

/**
 * Get card with story content and audio URLs
 * @param id - Card ID
 * @returns Card with story and audio URLs
 */
export async function getCardWithStory(id: string): Promise<WastelandCardWithStory> {
  const response = await apiRequest<any>(`/api/v1/cards/${id}?include_story=true`)

  // 🔄 欄位映射：將後端巢狀結構轉換為前端扁平結構
  return {
    ...response,
    // 映射 audio_urls (snake_case) → audioUrls (camelCase)
    audioUrls: response.audio_urls || response.audioUrls,
    // 映射 metadata.radiation_level → radiation_factor
    radiation_factor: response.metadata?.radiation_level ?? response.radiation_factor ?? 0,
    // 映射 visuals.image_url → image_url
    image_url: response.visuals?.image_url ?? response.image_url ?? '',
    // 映射 character_voices key 名稱
    character_voices: response.character_voices ? {
      pip_boy: response.character_voices.pip_boy_analysis ?? response.character_voices.pip_boy,
      vault_dweller: response.character_voices.vault_dweller_perspective ?? response.character_voices.vault_dweller,
      wasteland_trader: response.character_voices.wasteland_trader_wisdom ?? response.character_voices.wasteland_trader,
      super_mutant: response.character_voices.super_mutant_simplicity ?? response.character_voices.super_mutant,
      codsworth: response.character_voices.codsworth_analysis ?? response.character_voices.codsworth,
    } : {},
    // 映射其他巢狀欄位
    fallout_reference: response.fallout_reference ?? response.fallout_easter_egg,
    vault_reference: response.metadata?.vault_number ?? response.vault_reference,
    threat_level: response.metadata?.threat_level ?? response.threat_level,
  } as WastelandCardWithStory
}

/**
 * Generate story audio for specific characters
 * Falls back to Web Speech API if TTS service is unavailable (503)
 * @param cardId - Card ID
 * @param characterKeys - Array of character voice keys
 * @param forceRegenerate - Force regenerate even if audio exists
 * @returns Audio URLs and cache status
 */
export async function generateStoryAudio(
  cardId: string,
  characterKeys: string[],
  forceRegenerate: boolean = false
): Promise<GenerateStoryAudioResponse> {
  try {
    const response = await apiRequest<GenerateStoryAudioResponse>('/api/v1/audio/generate/story', {
      method: 'POST',
      body: JSON.stringify({
        card_id: cardId,              // 使用蛇形命名符合後端 schema
        character_keys: characterKeys, // 使用蛇形命名符合後端 schema
        force_regenerate: forceRegenerate, // 使用蛇形命名符合後端 schema
      }),
    })
    return response
  } catch (error: any) {
    // Handle TTS service unavailable (503) - return fallback hint
    if (error instanceof APIError && error.status === 503) {
      console.warn('TTS service unavailable, client should use Web Speech API fallback')
      return {
        cardId,
        audioUrls: {},
        cached: {},
        generatedAt: new Date().toISOString(),
      }
    }
    throw error
  }
}

/**
 * Get all story audio URLs for a card
 * @param cardId - Card ID
 * @returns Record of character keys to audio URLs
 */
export async function getStoryAudioUrls(cardId: string): Promise<Record<string, string>> {
  try {
    const response = await apiRequest<{ audioUrls: Record<string, string> }>(
      `/api/v1/audio/story/${cardId}`
    )
    return response.audioUrls || {}
  } catch (error: any) {
    // Return empty object on error (404 or network failure)
    console.warn(`Failed to fetch story audio URLs for card ${cardId}:`, error.message)
    return {}
  }
}

// ==================== Analytics API ====================

export const analyticsAPI = {
  /**
   * Get user analytics data including most drawn cards
   */
  getUserAnalytics: async (): Promise<{
    user_analytics: {
      id: string
      user_id: string
      most_drawn_cards: string[] // Array of card IDs ordered by frequency
      favorited_cards: string[]
      readings_count: number
      shares_count: number
      notes_count: number
      exports_count: number
      favorite_spread_type: string | null
      favorite_character_voice: string | null
      [key: string]: any
    }
    recent_events: any[]
    patterns: any[]
    recommendations: any[]
  }> => {
    return apiRequest('/api/v1/analytics/user')
  },
}

export type { TarotCard, Reading, User, APIError }