/**
 * Analytics Service
 * 處理統計數據與分析相關 API
 */

import { api } from '@/lib/apiClient';
import type { LandingStatsResponse } from '@/types/api';

export const AnalyticsService = {
  /**
   * Get user analytics data including most drawn cards
   */
  async getUserAnalytics(): Promise<{
    user_analytics: {
      id: string
      user_id: string
      most_drawn_cards: string[] // Array of card IDs ordered by frequency
      favorited_cards: string[]
      readings_count: number
      shares_count: number
      notes_count: number
      exports_count: number
      favorite_spread_type: string | null
      favorite_character_voice: string | null
      [key: string]: any
    }
    recent_events: any[]
    patterns: any[]
    recommendations: any[]
  }> {
    return api.get('/analytics/user');
  },

  /**
   * Get landing page statistics
   */
  async getLandingStats(): Promise<LandingStatsResponse> {
    return api.get<LandingStatsResponse>('/landing-stats');
  },

  /**
   * 獲取解讀統計摘要
   */
  async getInterpretationStats(): Promise<{
    total_interpretations: number
    active_interpretations: number
    inactive_interpretations: number
    cards_with_interpretations: number
    characters_with_interpretations: number
  }> {
    return api.get('/interpretations/stats/summary');
  }
};
