/**
 * Auth Service
 * 處理所有與身份驗證相關的 API 請求
 */

import { api } from '@/lib/apiClient';
import type { User } from '@/types/api';

export const AuthService = {
  /**
   * 註冊
   */
  async register(userData: {
    email: string
    password: string
    confirm_password: string
    name: string
    display_name?: string
    faction_alignment?: string
    wasteland_location?: string
  }): Promise<{ message: string; user: User }> {
    return api.post<{ message: string; user: User }>('/auth/register', userData);
  },

  /**
   * 登入
   */
  async login(credentials: {
    email: string
    password: string
  }): Promise<{ message: string; user: User; token_expires_at?: number }> {
    return api.post<{ message: string; user: User; token_expires_at?: number }>(
      '/auth/login', 
      credentials
    );
  },

  /**
   * 獲取當前用戶信息
   */
  async getCurrentUser(): Promise<{ user: User; token_expires_at?: number }> {
    return api.get<{ user: User; token_expires_at?: number }>('/auth/me');
  },

  /**
   * 刷新 token
   * 通常由 apiClient 自動處理，但在某些情況下可能需要手動調用
   */
  async refreshToken(): Promise<{ access_token: string; refresh_token: string; token_type: string }> {
    return api.post<{ access_token: string; refresh_token: string; token_type: string }>('/auth/refresh');
  },

  /**
   * 登出
   */
  async logout(): Promise<{ message: string; is_oauth_user: boolean; oauth_provider: string | null }> {
    return api.post<{ message: string; is_oauth_user: boolean; oauth_provider: string | null }>('/auth/logout');
  },

  /**
   * 延長 Token（活躍度或忠誠度）
   */
  async extendToken(data: {
    extension_type: 'activity' | 'loyalty'
    activity_duration?: number
  }): Promise<{
    success: boolean
    message: string
    extended_minutes: number
    token_expires_at: number
    rewards?: {
      karma_bonus: number
      badge_unlocked: string
    }
  }> {
    return api.post('/auth/extend-token', data);
  },

  /**
   * 取得忠誠度狀態
   */
  async getLoyaltyStatus(): Promise<{
    is_eligible: boolean
    login_days_count: number
    login_dates: string[]
    extension_available: boolean
    current_streak: number
  }> {
    return api.get('/auth/loyalty-status');
  },

  /**
   * 取得用戶的認證方式狀態
   */
  async getAuthMethods(): Promise<{
    has_passkey: boolean
    has_password: boolean
    has_oauth: boolean
  }> {
    return api.get('/auth/methods');
  }
};
