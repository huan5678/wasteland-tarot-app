/**
 * Karma Store - Zustand state management for Dashboard Gamification Karma System
 * Handles Karma summary, logs, loading states, and error handling
 *
 * ✅ Refactored to use unified API Client (Task 2)
 */

import { create } from 'zustand';
import { api } from '@/lib/apiClient';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Single Karma log entry
 */
export interface KarmaLog {
  id: string;
  action_type: string;
  karma_amount: number;
  description: string;
  created_at: string;
  metadata: Record<string, any>;
}

/**
 * Karma summary data
 */
export interface KarmaSummary {
  total_karma: number;
  current_level: number;
  karma_to_next_level: number;
  rank: number | null;
  today_earned: number;
  level_title: string;
}

/**
 * Pagination info for karma logs
 */
export interface KarmaPaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Karma Store state and actions
 */
interface KarmaStore {
  // ========================================
  // State
  // ========================================
  summary: KarmaSummary | null;
  logs: KarmaLog[];
  isLoading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalLogs: number;

  // ========================================
  // Actions
  // ========================================

  /**
   * Fetch Karma summary for current user
   */
  fetchSummary: () => Promise<void>;

  /**
   * Fetch Karma logs with pagination
   * @param page - Page number (default: 1)
   */
  fetchLogs: (page?: number) => Promise<void>;

  /**
   * Clear error state
   */
  clearError: () => void;

  /**
   * Reset store to initial state
   */
  reset: () => void;
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useKarmaStore = create<KarmaStore>((set, get) => ({
  // ========================================
  // Initial State
  // ========================================
  summary: null,
  logs: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalLogs: 0,

  // ========================================
  // Actions
  // ========================================

  /**
   * Task 2.1: Fetch Karma summary using unified API Client
   */
  fetchSummary: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await api.get<KarmaSummary>('/karma/summary');

      set({
        summary: data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入 Karma 總覽失敗';

      set({
        error: errorMessage,
        isLoading: false,
      });

      console.error('[KarmaStore] fetchSummary error:', error);
    }
  },

  /**
   * Task 2.2: Fetch Karma logs with pagination using unified API Client
   */
  fetchLogs: async (page = 1) => {
    set({ isLoading: true, error: null });

    try {
      const data = await api.get<{
        logs: KarmaLog[];
        pagination: KarmaPaginationInfo;
      }>(`/karma/logs?page=${page}&limit=20`);

      set({
        logs: data.logs,
        currentPage: data.pagination.page,
        totalPages: data.pagination.total_pages,
        totalLogs: data.pagination.total,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入 Karma 記錄失敗';

      set({
        error: errorMessage,
        isLoading: false,
      });

      console.error('[KarmaStore] fetchLogs error:', error);
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      summary: null,
      logs: [],
      isLoading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalLogs: 0,
    });
  },
}));
