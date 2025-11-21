/**
 * Profile Service
 * 處理用戶個人資料相關 API
 */

import { api } from '@/lib/apiClient';
import type { User } from '@/types/api';

export const ProfileService = {
  /**
   * 取得當前用戶的完整 Profile
   */
  async getProfile(): Promise<{ message: string; user: User }> {
    return api.get<{ message: string; user: User }>('/users/me/profile');
  },

  /**
   * 更新當前用戶的 Profile
   * @param updates - 要更新的欄位
   */
  async updateProfile(updates: {
    display_name?: string
    bio?: string
    faction_alignment?: string
    wasteland_location?: string
  }): Promise<{ message: string; user: User }> {
    return api.patch<{ message: string; user: User }>('/users/me/profile', updates);
  },

  /**
   * 上傳使用者頭像
   * @param file - 圖片檔案 (JPEG/PNG/WebP/GIF, 最大 5MB)
   * @returns 上傳結果包含新的頭像 URL
   */
  async uploadAvatar(file: File): Promise<{ avatar_url: string; message: string }> {
    const formData = new FormData();
    formData.append('file', file);

    // 直接使用 api.request 但需要特殊處理 FormData 的 headers
    // api.request 預設 Content-Type: application/json，這裡需要移除讓瀏覽器設定 boundary
    // 目前 api.client 不支援移除 default header，所以這裡使用 fetch
    // 或者我們可以擴充 apiClient
    // 這裡為了簡單，直接使用 fetch (參考 apiClient 實作)
    
    // In browser: use empty string to route through Next.js API proxy
    const isBrowser = typeof window !== 'undefined';
    const baseURL = isBrowser
      ? '' 
      : process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      
    const url = `${baseURL}/api/v1/users/avatar`;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include', // 包含 httpOnly cookies
      body: formData,
      // 不設定 Content-Type，讓瀏覽器自動設定（包含 boundary）
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }
};
