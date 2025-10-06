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
  })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
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
        // push to error store
        try {
          useErrorStore.getState().pushError({
            source: 'api',
            message: err.message || 'API Error',
            detail: { endpoint, options },
            statusCode: err.status,
          })
        } catch {}
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

  // 獲取用戶的占卜記錄
  getUserReadings: (userId: string): Promise<Reading[]> =>
    apiRequest<Reading[]>(`/api/v1/readings/user/${userId}`),

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
  register: (userData: {
    email: string
    password: string
    confirm_password: string
    name: string
    display_name?: string
    faction_alignment?: string
    vault_number?: number
    wasteland_location?: string
  }): Promise<{ message: string; access_token: string; refresh_token: string; token_type: string; user: User }> =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // 登入（使用 email + password）
  login: (credentials: {
    email: string
    password: string
  }): Promise<{ message: string; access_token: string; refresh_token: string; token_type: string; user: User }> =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // 獲取當前用戶信息
  getCurrentUser: (token: string): Promise<User> =>
    apiRequest('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }),

  // 刷新 token
  refreshToken: (refreshToken: string): Promise<{ access_token: string; refresh_token: string; token_type: string }> =>
    apiRequest('/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  // 登出
  logout: (token: string): Promise<{ message: string; is_oauth_user: boolean; oauth_provider: string | null }> =>
    apiRequest('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }),
}

// Health check
export const healthAPI = {
  check: (): Promise<{ status: string; service: string; version: string }> =>
    apiRequest('/health'),
}

export type { TarotCard, Reading, User, APIError }