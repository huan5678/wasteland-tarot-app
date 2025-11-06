/**
 * Authentication Utilities - Centralized Authentication Helper
 * Provides unified authenticated API request function using httpOnly cookies
 *
 * Following achievementStore's proven pattern:
 * - Uses credentials: 'include' for httpOnly cookie transmission
 * - Integrates with errorStore for global error management
 * - Handles 401 errors with redirect to login
 * - No manual Authorization header (cookies handle this)
 */

import { useErrorStore } from './errorStore'

/**
 * Make authenticated API request using Supabase httpOnly cookies
 *
 * @template T - Expected response type
 * @param endpoint - API endpoint path (e.g., '/api/v1/karma/summary')
 * @param options - Fetch RequestInit options (method, body, etc.)
 * @returns Promise resolving to typed response data
 * @throws {Error} When authentication fails or API returns error
 *
 * @example
 * ```typescript
 * const summary = await makeAuthenticatedRequest<KarmaSummary>('/api/v1/karma/summary')
 * ```
 */
export async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Task 1.2: Check network status before making request
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      useErrorStore.getState().setNetworkOnline(false)

      // Log network error with endpoint context
      console.error('[authUtils] Network Error:', {
        endpoint,
        method: options.method || 'GET',
        error: '網路連線中斷',
        timestamp: new Date().toISOString(),
      })

      // Push error to errorStore
      useErrorStore.getState().pushError({
        source: 'api',
        message: '網路連線中斷',
        detail: {
          endpoint,
          method: options.method || 'GET',
        },
      })

      throw new Error('網路連線中斷')
    } else if (typeof navigator !== 'undefined') {
      useErrorStore.getState().setNetworkOnline(true)
    }

    // Task 1.1: Make authenticated request with credentials: 'include'
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include', // Enable httpOnly cookie transmission
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        // Note: No Authorization header needed - httpOnly cookies handle authentication
      },
    })

    // Task 1.3: Handle 401 Unauthorized errors
    if (response.status === 401) {
      // Determine reason: token expired or missing
      const reason = response.statusText === 'Token expired'
        ? 'session_expired'
        : 'auth_required'

      // Log authentication error
      console.error('[authUtils] API Error:', endpoint, {
        status: 401,
        reason,
        endpoint,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
      })

      // Push error to errorStore
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

      // Save current URL to sessionStorage for post-login redirect
      if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
        try {
          sessionStorage.setItem('auth-return-url', window.location.pathname)
          window.location.href = `/auth/login?reason=${reason}`
        } catch (err) {
          // Handle sessionStorage/window access errors in non-browser environments
          console.error('[authUtils] Failed to redirect to login:', err)
        }
      }

      throw new Error('Authentication required')
    }

    // Task 1.4: Handle other API errors (4xx, 5xx)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '未知錯誤' }))

      // Parse error message: support FastAPI standard format {error, message, detail}
      let errorMessage: string
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail
      } else if (typeof errorData.detail === 'object' && errorData.detail?.message) {
        errorMessage = errorData.detail.message
      } else {
        errorMessage = `HTTP ${response.status}`
      }

      // Log error with full context
      console.error(`[authUtils] API Error: ${endpoint}`, errorMessage, {
        status: response.status,
        errorData,
        endpoint,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
      })

      // Push error to errorStore
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

    // Success: return parsed JSON response
    return response.json()
  } catch (err: any) {
    // Catch all errors (including network errors, ReferenceError, etc.)
    console.error(`[authUtils] API Error: ${endpoint}`, err?.message || '未知錯誤', {
      error: err?.message || '未知錯誤',
      stack: err?.stack,
      endpoint,
      method: options.method || 'GET',
      timestamp: new Date().toISOString(),
    })

    // Push error to global errorStore (if not already pushed)
    if (err?.message !== 'Authentication required' && err?.message !== '網路連線中斷') {
      useErrorStore.getState().pushError({
        source: 'api',
        message: err?.message || 'API 請求失敗',
        detail: {
          endpoint,
          method: options.method || 'GET',
        },
      })
    }

    throw err
  }
}
