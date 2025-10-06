/**
 * API Services
 * 使用 ApiClient 和 Zod schemas 的 API 服務層
 */

import { apiClient } from './client'
import type {
  TarotCard,
  Reading,
  CreateReadingPayload,
  User,
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  RefreshTokenResponse,
  LogoutResponse,
  BingoCard,
  BingoStatus,
  ClaimResult,
  HealthCheck,
  PasskeyCredential,
} from '@/types/api'
import {
  TarotCardSchema,
  TarotCardArraySchema,
  PaginatedCardsResponseSchema,
  ReadingSchema,
  ReadingArraySchema,
  UserSchema,
  AuthResponseSchema,
  RefreshTokenResponseSchema,
  LogoutResponseSchema,
  BingoCardSchema,
  BingoStatusSchema,
  ClaimResultSchema,
  HealthCheckSchema,
  PasskeyCredentialArraySchema,
} from '@/types/api'

// ============================================================================
// Helper: Validate Response
// ============================================================================

/**
 * 使用 Zod schema 驗證 API 回應
 */
function validateResponse<T>(data: unknown, schema: any): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.error('API Response Validation Error:', result.error)
    throw new Error(`Invalid API response: ${result.error.message}`)
  }

  return result.data as T
}

// ============================================================================
// Cards API
// ============================================================================

export const cardsAPI = {
  /**
   * 獲取所有卡牌
   */
  async getAll(): Promise<TarotCard[]> {
    const data = await apiClient.get('/api/v1/cards/')
    const paginatedResponse = validateResponse(data, PaginatedCardsResponseSchema)
    return paginatedResponse.cards
  },

  /**
   * 根據 ID 獲取卡牌
   */
  async getById(id: string): Promise<TarotCard> {
    const data = await apiClient.get(`/api/v1/cards/${id}`)
    return validateResponse<TarotCard>(data, TarotCardSchema)
  },

  /**
   * 隨機抽取卡牌
   */
  async drawRandom(count: number = 1): Promise<TarotCard[]> {
    const data = await apiClient.get(`/api/v1/cards/draw-random?count=${count}`)
    return validateResponse<TarotCard[]>(data, TarotCardArraySchema)
  },

  /**
   * 根據花色獲取卡牌
   */
  async getBySuit(suit: string): Promise<TarotCard[]> {
    const data = await apiClient.get(`/api/v1/cards/?suit=${suit}`)
    return validateResponse<TarotCard[]>(data, TarotCardArraySchema)
  },
}

// ============================================================================
// Readings API
// ============================================================================

export const readingsAPI = {
  /**
   * 創建新占卜
   */
  async create(payload: CreateReadingPayload): Promise<Reading> {
    const data = await apiClient.post('/api/v1/readings/', payload)
    return validateResponse<Reading>(data, ReadingSchema)
  },

  /**
   * 獲取用戶的占卜記錄
   */
  async getUserReadings(userId: string): Promise<Reading[]> {
    const data = await apiClient.get(`/api/v1/readings/user/${userId}`)
    return validateResponse<Reading[]>(data, ReadingArraySchema)
  },

  /**
   * 根據 ID 獲取占卜
   */
  async getById(id: string): Promise<Reading> {
    const data = await apiClient.get(`/api/v1/readings/${id}`)
    return validateResponse<Reading>(data, ReadingSchema)
  },

  /**
   * 更新占卜
   */
  async update(id: string, updateData: Partial<Reading>): Promise<Reading> {
    const data = await apiClient.put(`/api/v1/readings/${id}`, updateData)
    return validateResponse<Reading>(data, ReadingSchema)
  },

  /**
   * 刪除占卜
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/readings/${id}`)
  },
}

// ============================================================================
// Auth API
// ============================================================================

export const authAPI = {
  /**
   * 註冊
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const data = await apiClient.post('/api/v1/auth/register', payload)
    return validateResponse<AuthResponse>(data, AuthResponseSchema)
  },

  /**
   * 登入
   */
  async login(credentials: LoginPayload): Promise<AuthResponse> {
    const data = await apiClient.post('/api/v1/auth/login', new URLSearchParams(credentials).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return validateResponse<AuthResponse>(data, AuthResponseSchema)
  },

  /**
   * 獲取當前用戶信息
   */
  async getCurrentUser(token: string): Promise<User> {
    // 暫時設定 token
    const prevHeaders = { ...apiClient['defaultHeaders'] }
    apiClient.setAuthToken(token)

    try {
      const data = await apiClient.get('/api/v1/auth/me')
      return validateResponse<User>(data, UserSchema)
    } finally {
      // 恢復原本的 headers
      apiClient['defaultHeaders'] = prevHeaders
    }
  },

  /**
   * 刷新 token
   */
  async refreshToken(token: string): Promise<RefreshTokenResponse> {
    const prevHeaders = { ...apiClient['defaultHeaders'] }
    apiClient.setAuthToken(token)

    try {
      const data = await apiClient.post('/api/v1/auth/refresh')
      return validateResponse<RefreshTokenResponse>(data, RefreshTokenResponseSchema)
    } finally {
      apiClient['defaultHeaders'] = prevHeaders
    }
  },

  /**
   * 登出
   */
  async logout(token: string): Promise<LogoutResponse> {
    const prevHeaders = { ...apiClient['defaultHeaders'] }
    apiClient.setAuthToken(token)

    try {
      const data = await apiClient.post('/api/v1/auth/logout')
      return validateResponse<LogoutResponse>(data, LogoutResponseSchema)
    } finally {
      apiClient['defaultHeaders'] = prevHeaders
    }
  },
}

// ============================================================================
// Bingo API
// ============================================================================

export const bingoAPI = {
  /**
   * 獲取賓果遊戲狀態
   */
  async getStatus(): Promise<BingoStatus> {
    const data = await apiClient.get('/api/v1/bingo/status')
    return validateResponse<BingoStatus>(data, BingoStatusSchema)
  },

  /**
   * 建立賓果卡
   */
  async createCard(numbers: number[]): Promise<BingoCard> {
    const data = await apiClient.post('/api/v1/bingo/card', { numbers })
    return validateResponse<BingoCard>(data, BingoCardSchema)
  },

  /**
   * 領取今日號碼
   */
  async claimDailyNumber(): Promise<ClaimResult> {
    const data = await apiClient.post('/api/v1/bingo/claim')
    return validateResponse<ClaimResult>(data, ClaimResultSchema)
  },

  /**
   * 檢查連線狀態
   */
  async checkLines(): Promise<any> {
    return apiClient.get('/api/v1/bingo/lines')
  },

  /**
   * 查詢歷史記錄
   */
  async getHistory(month: string): Promise<any> {
    return apiClient.get(`/api/v1/bingo/history/${month}`)
  },

  /**
   * 查詢獎勵記錄
   */
  async getRewards(): Promise<any> {
    return apiClient.get('/api/v1/bingo/rewards')
  },
}

// ============================================================================
// Passkey API
// ============================================================================

export const passkeyAPI = {
  /**
   * 列出所有 Passkeys
   */
  async listCredentials(): Promise<PasskeyCredential[]> {
    const data = await apiClient.get('/api/webauthn/credentials')
    // 假設回應格式為 { credentials: [...] }
    const credentials = (data as any).credentials || data
    return validateResponse<PasskeyCredential[]>(credentials, PasskeyCredentialArraySchema)
  },

  /**
   * 更新 Passkey 名稱
   */
  async updateCredentialName(credentialId: string, newName: string): Promise<void> {
    await apiClient.patch(`/api/webauthn/credentials/${credentialId}/name`, {
      device_name: newName,
    })
  },

  /**
   * 刪除 Passkey
   */
  async deleteCredential(credentialId: string): Promise<void> {
    await apiClient.delete(`/api/webauthn/credentials/${credentialId}`)
  },
}

// ============================================================================
// Health API
// ============================================================================

export const healthAPI = {
  /**
   * 健康檢查
   */
  async check(): Promise<HealthCheck> {
    const data = await apiClient.get('/health')
    return validateResponse<HealthCheck>(data, HealthCheckSchema)
  },
}
