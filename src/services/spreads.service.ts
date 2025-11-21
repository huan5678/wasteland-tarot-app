/**
 * Spreads Service
 * 處理牌陣模板相關 API
 */

import { api } from '@/lib/apiClient';
import type { SpreadTemplate } from '@/types/api';

export const SpreadService = {
  /**
   * 獲取所有牌陣模板
   */
  async getAll(): Promise<SpreadTemplate[]> {
    return api.get<SpreadTemplate[]>('/spreads/');
  }
};
