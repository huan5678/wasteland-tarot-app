/**
 * Karma Store - Zustand state management for Dashboard Gamification Karma System
 * Handles Karma summary, logs, loading states, and error handling
 */

import { create } from 'zustand';

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
// Helper Functions
// ============================================================================

/**
 * Get Supabase access token from localStorage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const authData = localStorage.getItem('auth');
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed.state?.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const token = getAccessToken();

  if (!token) {
    throw new Error('未認證：請先登入');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 錯誤 (${response.status}): ${errorText}`);
  }

  return response.json();
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

  fetchSummary: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/karma/summary`
      );

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

  fetchLogs: async (page = 1) => {
    set({ isLoading: true, error: null });

    try {
      const data = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/karma/logs?page=${page}&limit=20`
      );

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
