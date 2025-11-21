/**
 * System Service
 * 處理系統狀態檢查相關 API
 */

import { api } from '@/lib/apiClient';
import type { HealthCheck } from '@/types/api';

export const SystemService = {
  /**
   * 系統健康檢查
   */
  async checkHealth(): Promise<HealthCheck> {
    return api.get<HealthCheck>('/health');
  }
};
