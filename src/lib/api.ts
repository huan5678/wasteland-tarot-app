/**
 * API 服務層 - 與後端 FastAPI 通信
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

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

interface Reading {
  id: string
  user_id: string
  question: string
  spread_type: string
  cards_drawn: any[]
  interpretation?: string
  character_voice?: string
  karma_context?: string
  faction_influence?: string
  created_at: string
  updated_at?: string
}

interface User {
  id: string
  username?: string // 向後相容
  name: string // OAuth 和傳統認證都使用 name
  email: string
  display_name?: string
  faction_alignment?: string
  karma_score?: number
  vault_number?: number
  experience_level?: string
  total_readings?: number
  created_at: string
  // OAuth 相關欄位
  isOAuthUser?: boolean
  oauthProvider?: string | null // 如 'google'
  profilePicture?: string | null // OAuth 頭像 URL
}

class APIError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'APIError'
  }
}

import { useErrorStore } from './errorStore'
import { timedFetch } from './metrics'

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

        // 401 Unauthorized - 嘗試刷新 token（僅一次）
        if (response.status === 401 && endpoint !== '/api/v1/auth/refresh' && endpoint !== '/api/v1/auth/login') {
          try {
            // 呼叫 refresh endpoint
            const refreshResponse = await timedFetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
            })

            if (refreshResponse.ok) {
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
                return retryResponse.json()
              }
            }
          } catch (refreshError) {
            // 刷新失敗，繼續拋出原始 401 錯誤
            console.error('Token refresh failed:', refreshError)
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

      return response.json()
    } catch (err: any) {
      lastError = err
      if (attempt >= maxRetries || (err instanceof APIError && err.status < 500)) {
        // push to error store，但排除預期的未登入情況
        // 如果是 /api/v1/auth/me 端點的 401 錯誤，這是正常的未登入狀態，不需要顯示錯誤
        const isAuthCheckEndpoint = endpoint === '/api/v1/auth/me'
        const isUnauthorized = err instanceof APIError && err.status === 401
        const shouldNotDisplayError = isAuthCheckEndpoint && isUnauthorized

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
  // 獲取所有卡牌
  getAll: (): Promise<TarotCard[]> =>
    apiRequest<TarotCard[]>('/api/v1/cards/'),

  // 根據 ID 獲取卡牌
  getById: (id: string): Promise<TarotCard> =>
    apiRequest<TarotCard>(`/api/v1/cards/${id}`),

  // 隨機抽取卡牌
  drawRandom: (count: number = 1): Promise<TarotCard[]> =>
    apiRequest<TarotCard[]>(`/api/v1/cards/draw-random?count=${count}`),

  // 根據花色獲取卡牌
  getBySuit: (suit: string): Promise<TarotCard[]> =>
    apiRequest<TarotCard[]>(`/api/v1/cards/?suit=${suit}`),
}

// Readings API
export const readingsAPI = {
  // 創建新占卜
  create: (readingData: {
    question: string
    spread_type: string
    cards_drawn: any[]
    interpretation?: string
    character_voice?: string
    karma_context?: string
    faction_influence?: string
  }): Promise<Reading> =>
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

  // 更新占卜
  update: (id: string, updateData: Partial<Reading>): Promise<Reading> =>
    apiRequest<Reading>(`/api/v1/readings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
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
    vault_number?: number
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
}

// Health check
export const healthAPI = {
  check: (): Promise<{ status: string; service: string; version: string }> =>
    apiRequest('/health'),
}

// Sessions API (Reading Save & Resume)
import type {
  ReadingSession,
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
    const query = expectedUpdatedAt ? `?expected_updated_at=${expectedUpdatedAt}` : ''
    return apiRequest(`/api/v1/sessions/${id}${query}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Delete session
  delete: (id: string): Promise<void> =>
    apiRequest(`/api/v1/sessions/${id}`, {
      method: 'DELETE',
    }),

  // Complete session (convert to Reading)
  complete: (id: string): Promise<SessionCompletionResult> =>
    apiRequest(`/api/v1/sessions/${id}/complete`, {
      method: 'POST',
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

export type { TarotCard, Reading, User, APIError }