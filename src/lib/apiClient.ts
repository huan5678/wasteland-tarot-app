/**
 * API Client - 統一的 API 請求服務
 *
 * 提供統一的 HTTP 請求方法，整合：
 * - 自動 URL 拼接
 * - 認證處理（httpOnly cookies）
 * - 錯誤處理與重定向
 * - 網路狀態檢測
 * - TypeScript 類型支持
 */

import { useErrorStore } from './errorStore';

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

// ============================================================================
// API Client Class
// ============================================================================

class APIClient {
  private readonly baseURL: string;
  private readonly apiPrefix = '/api/v1';

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
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
      requireAuth = true
    } = options;

    // 1. 網路連線檢測
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      useErrorStore.getState().setNetworkOnline(false);
      throw new Error('網路連線中斷');
    }

    // 2. 組裝完整 URL（自動加上 /api/v1 前綴）
    const url = `${this.baseURL}${this.apiPrefix}${endpoint}`;

    // 3. 組裝 fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // 4. 認證處理（httpOnly cookies）
    if (requireAuth) {
      fetchOptions.credentials = 'include';
    }

    // 5. Body 處理
    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    // 6. 發送請求
    const response = await fetch(url, fetchOptions);

    // 7. 處理 401 未認證錯誤（自動跳轉登入）
    if (response.status === 401) {
      // 儲存當前頁面，登入後返回
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth-return-url', window.location.pathname);
        window.location.href = '/auth/login?reason=session_expired';
      }
      throw new Error('請先登入');
    }

    // 8. 處理其他錯誤
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '未知錯誤' })) as APIErrorResponse;

      // 提取錯誤訊息（確保是字串）
      let errorMessage: string;

      // 如果 error 是物件，提取 message 欄位
      if (errorData.error && typeof errorData.error === 'object') {
        errorMessage = errorData.error.message || JSON.stringify(errorData.error);
      } 
      // 如果 detail 是物件，嘗試提取 message 欄位
      else if (errorData.detail && typeof errorData.detail === 'object') {
        errorMessage = (errorData.detail as any).message || JSON.stringify(errorData.detail);
      } 
      // 否則嘗試從各個字串欄位提取
      else {
        errorMessage =
          (typeof errorData.error === 'string' ? errorData.error : null) ||
          (typeof errorData.detail === 'string' ? errorData.detail : null) ||
          errorData.message ||
          `API 錯誤 (${response.status})`;
      }

      // 推送錯誤到 errorStore
      useErrorStore.getState().pushError({
        source: 'api',
        message: errorMessage,
        statusCode: response.status,
      });

      throw new Error(errorMessage);
    }

    // 9. 解析成功回應
    return response.json();
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

/**
 * 統一的 API Client 實例
 *
 * @example
 * // GET 請求
 * const summary = await api.get<KarmaSummary>('/karma/summary');
 *
 * @example
 * // POST 請求
 * const result = await api.post<ClaimRewardResponse>('/tasks/daily/123/claim');
 *
 * @example
 * // 不需要認證的請求
 * const presets = await api.get<UserRhythmPreset[]>('/music/presets/public', false);
 */
export const api = new APIClient();
