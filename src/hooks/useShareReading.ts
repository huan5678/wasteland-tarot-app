/**
 * useShareReading Hook
 *
 * Task 16.2: Hook for reading share API integration
 * Requirements: 10.2, 10.3
 *
 * Features:
 * - Generate anonymous share links
 * - Password protection support
 * - PII stripping (handled by backend)
 * - Error handling
 *
 * Architecture:
 * - 完全遵循 frontend-backend-architecture-refactor 規範
 * - 不直接使用 Supabase SDK
 * - 使用 httpOnly cookies 進行認證
 * - 所有認證邏輯由後端處理
 */

'use client';

import { useState } from 'react';

interface ShareLinkRequest {
  require_password: boolean;
  password?: string;
}

interface ShareLinkResponse {
  uuid: string;
  url: string;
  require_password: boolean;
  access_count: number;
  created_at: string;
  is_active: boolean;
}

interface ShareError {
  message: string;
  code?: string;
}

export function useShareReading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ShareError | null>(null);

  /**
   * Generate share link for a reading
   *
   * Architecture:
   * - ✅ 使用 httpOnly cookies 認證（不需要手動提供 token）
   * - ✅ 後端 get_current_user dependency 自動從 cookie 讀取 token
   * - ✅ 前端完全不接觸 Supabase SDK
   */
  const generateShareLink = async (
    readingId: string,
    requirePassword: boolean = false,
    password?: string
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      // Validate password length if protection is required (4-8 digits)
      if (requirePassword && password) {
        if (password.length < 4 || password.length > 8) {
          throw new Error('密碼長度必須為 4-8 位數');
        }
      }

      const requestBody: ShareLinkRequest = {
        require_password: requirePassword,
      };

      if (requirePassword && password) {
        requestBody.password = password;
      }

      // ✅ 正確：直接呼叫後端 API，httpOnly cookies 會自動發送
      const response = await fetch(`/api/v1/readings/${readingId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ✅ 不需要 Authorization header
          // httpOnly cookies 會自動包含在請求中
        },
        credentials: 'include', // ✅ 重要：確保瀏覽器發送 cookies
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '生成分享連結失敗');
      }

      const data: ShareLinkResponse = await response.json();
      return data.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setError({ message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * View shared reading (public endpoint, no auth required)
   */
  const viewSharedReading = async (
    uuid: string,
    password?: string
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/v1/share/${uuid}`, window.location.origin);
      if (password) {
        url.searchParams.set('password', password);
      }

      const response = await fetch(url.toString());

      if (response.status === 410) {
        throw new Error('此解讀已被擁有者撤回');
      }

      if (response.status === 403) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '密碼錯誤');
      }

      if (!response.ok) {
        throw new Error('無法載入分享內容');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setError({ message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Revoke share link
   *
   * Architecture:
   * - ✅ 使用 httpOnly cookies 認證
   * - ✅ 後端 get_current_user dependency 自動驗證擁有權
   */
  const revokeShareLink = async (uuid: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // ✅ 正確：直接呼叫後端 API，httpOnly cookies 會自動發送
      const response = await fetch(`/api/v1/share/${uuid}`, {
        method: 'DELETE',
        credentials: 'include', // ✅ 確保發送 cookies
        // ✅ 不需要手動提供 Authorization header
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '撤銷分享失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setError({ message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * List all shares for a reading
   *
   * Architecture:
   * - ✅ 使用 httpOnly cookies 認證
   * - ✅ 後端 get_current_user dependency 自動驗證擁有權
   */
  const listShares = async (
    readingId: string,
    activeOnly: boolean = false
  ): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/v1/readings/${readingId}/shares`, window.location.origin);
      if (activeOnly) {
        url.searchParams.set('active_only', 'true');
      }

      // ✅ 正確：直接呼叫後端 API，httpOnly cookies 會自動發送
      const response = await fetch(url.toString(), {
        credentials: 'include', // ✅ 確保發送 cookies
        // ✅ 不需要手動提供 Authorization header
      });

      if (!response.ok) {
        throw new Error('無法載入分享列表');
      }

      const data = await response.json();
      return data.shares || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setError({ message: errorMessage });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateShareLink,
    viewSharedReading,
    revokeShareLink,
    listShares,
    loading,
    error,
  };
}
