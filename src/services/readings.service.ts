/**
 * Reading Service
 * 處理所有與占卜記錄相關的 API 請求
 */

import { api } from '@/lib/apiClient';
import type { 
  Reading, 
  ReadingSession, 
  CreateReadingPayload 
} from '@/types/api';

export const ReadingService = {
  /**
   * 創建新占卜
   */
  async create(readingData: CreateReadingPayload): Promise<Reading> {
    return api.post<Reading>('/readings/', readingData);
  },

  /**
   * 獲取當前用戶的占卜記錄
   */
  async getUserReadings(options?: { 
    page?: number; 
    limit?: number; 
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' 
  }): Promise<{ 
    readings: Reading[], 
    total_count: number, 
    page: number, 
    page_size: number, 
    has_more: boolean 
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    
    return api.get(`/readings/?page=${page}&page_size=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`);
  },

  /**
   * 根據 ID 獲取占卜
   */
  async getById(id: string): Promise<Reading> {
    return api.get<Reading>(`/readings/${id}`);
  },

  /**
   * 更新占卜 (完整更新)
   */
  async update(id: string, updateData: Partial<Reading>): Promise<Reading> {
    return api.put<Reading>(`/readings/${id}`, updateData);
  },
  
  /**
   * 部分更新占卜
   */
  async patch(id: string, updateData: Partial<ReadingSession>): Promise<ReadingSession> {
    return api.patch<ReadingSession>(`/readings/${id}`, updateData);
  },

  /**
   * 儲存 AI 解讀結果
   */
  async saveAIInterpretation(
    id: string,
    interpretation: {
      overall_interpretation: string
      summary_message?: string
      prediction_confidence?: number
    }
  ): Promise<ReadingSession> {
    return api.patch<ReadingSession>(`/readings/${id}`, {
      ...interpretation,
      ai_interpretation_requested: true,
    });
  },

  /**
   * 刪除占卜
   */
  async delete(id: string): Promise<void> {
    return api.delete(`/readings/${id}`);
  }
};
