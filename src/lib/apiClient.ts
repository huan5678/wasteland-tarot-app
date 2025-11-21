/**
 * API Client - 統一的 API 請求服務
 *
 * 提供統一的 HTTP 請求方法，整合：
 * - 自動 URL 拼接
 * - 認證處理（httpOnly cookies）
 * - 錯誤處理與重定向 (包含自動 Token 刷新)
 * - 網路狀態檢測
 * - TypeScript 類型支持
 * - 效能監控 (timedFetch)
 */

import { useErrorStore } from './errorStore';
import { timedFetch } from './metrics';

// ============================================================================
// Types
// ============================================================================

/**
 * API 請求選項
 */
interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
  retry?: {
    retries: number;
    delay: number;
  };
}

/**
 * API 錯誤回應
 */
interface APIErrorResponse {
  detail?: string;
  message?: string;
  error?: string | {
    code?: string;
    message?: string;
    details?: any;
    radiation_level?: string;
  };
}

/**
 * 自定義 API 錯誤類別
 * 包含狀態碼和詳細資訊
 */
export class APIError extends Error {
  status: number;
  detail?: any;

  constructor(message: string, status: number, detail?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.detail = detail;
  }
}

// 全域 Token 刷新鎖 (防止併發刷新請求)
let refreshTokenPromise: Promise<boolean> | null = null;

// ============================================================================
// API Client Class
// ============================================================================

class APIClient {
  private readonly baseURL: string;
  private readonly apiPrefix = '/api/v1';

  constructor() {
    // In browser: use empty string to route through Next.js API proxy
    // In SSR: use backend URL from environment variable
    const isBrowser = typeof window !== 'undefined';
    this.baseURL = isBrowser
      ? '' // Browser: relative path → Next.js proxy
      : process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'; // SSR: direct backend
  }

  /**
   * 執行 Token 刷新
   * 使用全域鎖確保同一時間只有一個刷新請求
   */
  private async refreshToken(): Promise<boolean> {
    // 如果已經有刷新正在進行，等待它完成
    if (refreshTokenPromise) {
      return refreshTokenPromise;
    }

    // 創建新的刷新 Promise
    refreshTokenPromise = (async () => {
      try {
        console.log('[API] 🔄 Attempting token refresh', {
          timestamp: new Date().toISOString()
        });

        // 使用完整的 URL，確保在 SSR 環境也能工作
        const refreshUrl = `${this.baseURL}${this.apiPrefix}/auth/refresh`;
        
        const refreshResponse = await timedFetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshResponse.ok) {
          const errorData = await refreshResponse.json().catch(() => ({ detail: 'Unknown error' }));
          console.warn('[API] ⚠️ Token refresh failed (expected if not logged in)', {
            status: refreshResponse.status,
            detail: errorData.detail
          });
          return false;
        }

        const data = await refreshResponse.json();
        console.log('[API] ✅ Token refresh successful', {
          message: data.message,
          timestamp: new Date().toISOString()
        });

        // 給瀏覽器一點時間完全設置 cookies
        await new Promise(resolve => setTimeout(resolve, 50));

        return true;
      } catch (error) {
        console.error('[API] ❌ Token refresh network/parse error:', error);
        return false;
      } finally {
        // 500ms 後清除鎖，允許未來的刷新
        setTimeout(() => {
          refreshTokenPromise = null;
        }, 500);
      }
    })();

    return refreshTokenPromise;
  }

  /**
   * 清除認證狀態並重導向
   */
  private async clearAuthStateAndRedirect() {
    if (typeof window !== 'undefined') {
      // 清除 LocalStorage
      localStorage.removeItem('auth-store');

      // 動態導入 authStore 以避免循環依賴
      try {
        const { useAuthStore } = await import('@/lib/authStore');
        useAuthStore.setState({
          user: null,
          isOAuthUser: false,
          oauthProvider: null,
          profilePicture: null
        });
      } catch (err) {
        console.error('Failed to clear auth store:', err);
      }

      // 處理重導向 logic
      const currentPath = window.location.pathname;
      
      // 定義公開路由（不需要登入就能訪問）
      const publicPaths = [
        '/',              // 首頁
        '/cards',         // 卡牌圖書館
        '/readings/quick', // 快速占卜
      ];

      // 只有在受保護的路由才跳轉到登入頁
      // 如果當前路徑以 publicPaths 開頭，或者已經在 auth 頁面，則不跳轉
      const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith(path + '/')) || currentPath.startsWith('/auth');

      if (!isPublicPath) {
        console.log('[API] 🔀 Redirecting to login (protected route)', {
          timestamp: new Date().toISOString(),
          from: currentPath,
          to: `/auth/login?returnUrl=${encodeURIComponent(currentPath)}`
        });
        window.location.href = `/auth/login?returnUrl=${encodeURIComponent(currentPath)}`;
      } else {
        console.log('[API] ℹ️ Skipping redirect (public route)', {
          timestamp: new Date().toISOString(),
          currentPath
        });
      }
    }
  }

  /**
   * 通用請求方法
   *
   * @param endpoint - API endpoint (自動加上 /api/v1 前綴)
   * @param options - 請求選項
   * @returns Promise<T> - 回應資料
   */
  async request<T>(endpoint: string, options: APIRequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      requireAuth = true,
      retry = { retries: 1, delay: 500 } // 默認重試配置
    } = options;

    const url = `${this.baseURL}${this.apiPrefix}${endpoint}`;
    
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (isFormData) {
      delete defaultHeaders['Content-Type'];
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    };

    if (requireAuth) {
      fetchOptions.credentials = 'include';
    }

    if (body !== undefined) {
      fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    let attempt = 0;
    const maxRetries = retry.retries;

    while (attempt <= maxRetries) {
      try {
        // 1. 網路連線檢測
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          try { useErrorStore.getState().setNetworkOnline(false); } catch {}
          throw new APIError('網路連線中斷', 0);
        } else {
          try { useErrorStore.getState().setNetworkOnline(true); } catch {}
        }

        // 2. 發送請求 (使用 timedFetch)
        const response = await timedFetch(url, fetchOptions);

        // 3. 處理成功回應
        if (response.ok) {
          if (response.status === 204) {
            return undefined as T;
          }
          return response.json();
        }

        // 4. 處理 401 Unauthorized (Token Refresh 邏輯)
        const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');
        
        if (response.status === 401 && !isAuthEndpoint) {
          console.warn('[API] 🚫 401 Unauthorized - Attempting token refresh', {
            endpoint,
            method
          });

          const refreshSucceeded = await this.refreshToken();

          if (refreshSucceeded) {
            console.log('[API] ✅ Token refresh succeeded, retrying request', { endpoint });
            
            // 重試請求
            const retryResponse = await timedFetch(url, fetchOptions);
            
            if (retryResponse.ok) {
              if (retryResponse.status === 204) {
                return undefined as T;
              }
              return retryResponse.json();
            }
            
            // 重試仍然失敗
            if (retryResponse.status === 401) {
               console.warn('[API] ⚠️ Refresh token also expired (on retry), clearing auth state');
               await this.clearAuthStateAndRedirect();
            }
            
            // 拋出重試後的錯誤
            const retryError = await retryResponse.json().catch(() => ({ detail: 'Unknown error' }));
            throw new APIError(retryError.detail || `HTTP ${retryResponse.status}`, retryResponse.status, retryError);
          } else {
            // 刷新失敗
            console.warn('[API] ❌ Token refresh failed - Clearing auth state');
            await this.clearAuthStateAndRedirect();
            throw new APIError('認證已過期，請重新登入', 401);
          }
        }

        // 5. 處理 5xx 伺服器錯誤 (可重試)
        if (response.status >= 500 && attempt < maxRetries) {
          console.warn(`[API] Server error ${response.status}, retrying (${attempt + 1}/${maxRetries})...`);
          attempt++;
          await new Promise(r => setTimeout(r, retry.delay * attempt));
          continue;
        }

        // 6. 處理其他錯誤 (4xx or 5xx after retries)
        const errorData = await response.json().catch(() => ({ detail: '未知錯誤' })) as APIErrorResponse;
        
        // 構建錯誤訊息
        let errorMessage: string;
        if (errorData.error && typeof errorData.error === 'object') {
          errorMessage = errorData.error.message || JSON.stringify(errorData.error);
        } else if (errorData.detail && typeof errorData.detail === 'object') {
          errorMessage = (errorData.detail as any).message || JSON.stringify(errorData.detail);
        } else {
          errorMessage = 
            (typeof errorData.error === 'string' ? errorData.error : null) ||
            (typeof errorData.detail === 'string' ? errorData.detail : null) ||
            errorData.message ||
            `API 錯誤 (${response.status})`;
        }

        // 排除預期的錯誤不推送到 errorStore (如 /auth/me 的 401)
        const isAuthCheckEndpoint = endpoint === '/auth/me';
        const isUnauthorized = response.status === 401;
        const isNotFound = response.status === 404;
        const shouldSkipErrorLog = (isAuthCheckEndpoint && isUnauthorized) || isNotFound;

        if (!shouldSkipErrorLog) {
          useErrorStore.getState().pushError({
            source: 'api',
            message: errorMessage,
            detail: { endpoint, method },
            statusCode: response.status,
          });
        }

        throw new APIError(errorMessage, response.status, errorData);

      } catch (err: any) {
        // 如果已經達到最大重試次數，或者錯誤不適合重試（非 5xx 且非網路錯誤），則拋出
        const isRetryable = (err.message === '網路連線中斷') || (err.status && err.status >= 500);
        
        if (attempt >= maxRetries || !isRetryable) {
             throw err;
        }
        
        attempt++;
        await new Promise(r => setTimeout(r, retry.delay * attempt));
      }
    }
    
    throw new APIError('Request failed after retries', 0);
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  /**
   * GET 請求
   * @example api.get<KarmaSummary>('/karma/summary')
   */
  get<T>(endpoint: string, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', requireAuth });
  }

  /**
   * POST 請求
   * @example api.post<ClaimRewardResponse>('/tasks/daily/123/claim')
   */
  post<T>(endpoint: string, body?: any, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, requireAuth });
  }

  /**
   * PUT 請求
   * @example api.put('/playlists/123/patterns/456/position', { position: 2 })
   */
  put<T>(endpoint: string, body?: any, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, requireAuth });
  }

  /**
   * PATCH 請求
   * @example api.patch('/playlists/123', { name: 'New Name' })
   */
  patch<T>(endpoint: string, body?: any, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requireAuth });
  }

  /**
   * DELETE 請求
   * @example api.delete('/playlists/123')
   */
  delete<T = void>(endpoint: string, requireAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', requireAuth });
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const api = new APIClient();
