/**
 * Unified API Client
 * 統一的 API 客戶端，提供錯誤處理、重試機制、快取等功能
 */

import { useErrorStore } from '@/lib/errorStore'
import { timedFetch } from '@/lib/metrics'

// ============================================================================
// Types
// ============================================================================

export interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  headers?: HeadersInit
}

export interface RequestConfig extends RequestInit {
  retry?: {
    retries: number
    delay: number
  }
  timeout?: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network offline') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.name = 'TimeoutError'
  }
}

// ============================================================================
// API Client Class
// ============================================================================

export class ApiClient {
  private baseURL: string
  private defaultTimeout: number
  private defaultRetries: number
  private defaultRetryDelay: number
  private defaultHeaders: HeadersInit

  constructor(config: ApiClientConfig = {}) {
    // CRITICAL: Use empty string in browser to route through Next.js API proxy
    // This ensures cookies are properly set and CORS is handled
    // Only use direct backend URL in server-side (SSR) context
    const isBrowser = typeof window !== 'undefined'
    const defaultBaseURL = isBrowser
      ? '' // Browser: use relative path → Next.js proxy at /api/v1/[...path]
      : process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000' // SSR: direct backend

    this.baseURL = config.baseURL !== undefined ? config.baseURL : defaultBaseURL
    this.defaultTimeout = config.timeout || 30000 // 30 seconds
    this.defaultRetries = config.retries || 3
    this.defaultRetryDelay = config.retryDelay || 500
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  }

  /**
   * 更新基礎 headers（例如添加認證 token）
   */
  setHeaders(headers: HeadersInit): void {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      ...headers,
    }
  }

  /**
   * 設定認證 token
   */
  setAuthToken(token: string): void {
    this.setHeaders({
      'Authorization': `Bearer ${token}`,
    })
  }

  /**
   * 移除認證 token
   */
  clearAuthToken(): void {
    const headers = { ...this.defaultHeaders }
    delete (headers as any).Authorization
    this.defaultHeaders = headers
  }

  /**
   * GET 請求
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'GET',
    })
  }

  /**
   * POST 請求
   */
  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT 請求
   */
  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH 請求
   */
  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE 請求
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
    })
  }

  /**
   * 核心請求方法
   */
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const maxRetries = config.retry?.retries ?? this.defaultRetries
    const retryDelay = config.retry?.delay ?? this.defaultRetryDelay
    const timeout = config.timeout ?? this.defaultTimeout

    let attempt = 0
    let lastError: Error | null = null

    while (attempt <= maxRetries) {
      try {
        // 檢查網路連線
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          useErrorStore.getState().setNetworkOnline(false)
          throw new NetworkError('Network offline')
        } else {
          useErrorStore.getState().setNetworkOnline(true)
        }

        // 準備請求選項
        const requestOptions: RequestInit = {
          ...config,
          headers: {
            ...this.defaultHeaders,
            ...config.headers,
          },
        }

        // 使用 timedFetch 並添加 timeout 控制
        const response = await this.fetchWithTimeout(url, requestOptions, timeout)

        // 處理 HTTP 錯誤
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))

          // 5xx 錯誤且還有重試次數，則重試
          if (response.status >= 500 && attempt < maxRetries) {
            attempt++
            await this.delay(retryDelay * attempt)
            continue
          }

          const error = new ApiError(
            errorData.detail || `HTTP ${response.status}`,
            response.status,
            errorData
          )
          throw error
        }

        // 成功回應
        const data = await response.json()
        return data as T

      } catch (err: any) {
        lastError = err

        // 記錄錯誤到 error store
        if (attempt >= maxRetries || !this.isRetryableError(err)) {
          useErrorStore.getState().pushError({
            source: 'api',
            message: err.message || 'API Error',
            detail: { endpoint, config },
            statusCode: err instanceof ApiError ? err.status : undefined,
          })
          throw err
        }

        // 可重試的錯誤，繼續重試
        attempt++
        await this.delay(retryDelay * attempt)
      }
    }

    throw lastError || new Error('Unknown API error')
  }

  /**
   * 帶 timeout 的 fetch
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await timedFetch(url, {
        ...options,
        signal: controller.signal,
      })
      return response
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${timeout}ms`)
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 判斷錯誤是否可重試
   */
  private isRetryableError(error: Error): boolean {
    // 網路錯誤可重試
    if (error instanceof NetworkError) {
      return true
    }

    // Timeout 錯誤可重試
    if (error instanceof TimeoutError) {
      return true
    }

    // 5xx 錯誤可重試
    if (error instanceof ApiError && error.status >= 500) {
      return true
    }

    return false
  }

  /**
   * 延遲函數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// Default Instance
// ============================================================================

export const apiClient = new ApiClient()
