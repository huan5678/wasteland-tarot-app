/**
 * Tasks Store - Zustand state management for Dashboard Gamification Tasks System
 * Handles daily/weekly tasks, progress tracking, reward claiming
 */

import { create } from 'zustand';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Single task data
 */
export interface Task {
  id: string;
  task_key: string;
  name: string;
  description: string;
  target_value: number;
  current_value: number;
  karma_reward: number;
  is_completed: boolean;
  is_claimed: boolean;
  progress_percentage: number;
}

/**
 * Daily tasks response
 */
export interface DailyTasksData {
  tasks: Task[];
  reset_time: string;
  completed_count: number;
  total_count: number;
}

/**
 * Weekly tasks response
 */
export interface WeeklyTasksData {
  tasks: Task[];
  reset_time: string;
  completed_count: number;
  total_count: number;
}

/**
 * Claim reward response
 */
export interface ClaimRewardResponse {
  success: boolean;
  karma_earned: number;
  total_karma: number;
  message: string;
}

/**
 * Tasks Store state and actions
 */
interface TasksStore {
  // ========================================
  // State
  // ========================================
  dailyTasks: DailyTasksData | null;
  weeklyTasks: WeeklyTasksData | null;
  isLoading: boolean;
  error: string | null;

  // Loading states for individual actions
  isClaimingDaily: Record<string, boolean>;
  isClaimingWeekly: Record<string, boolean>;

  // ========================================
  // Actions
  // ========================================

  /**
   * Fetch daily tasks for current user
   */
  fetchDailyTasks: () => Promise<void>;

  /**
   * Fetch weekly tasks for current user
   */
  fetchWeeklyTasks: () => Promise<void>;

  /**
   * Claim daily task reward
   * @param taskId - User daily task ID
   */
  claimDailyTaskReward: (taskId: string) => Promise<boolean>;

  /**
   * Claim weekly task reward
   * @param taskId - User weekly task ID
   */
  claimWeeklyTaskReward: (taskId: string) => Promise<boolean>;

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
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.detail?.message || errorData?.message || `API 錯誤 (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useTasksStore = create<TasksStore>((set, get) => ({
  // ========================================
  // Initial State
  // ========================================
  dailyTasks: null,
  weeklyTasks: null,
  isLoading: false,
  error: null,
  isClaimingDaily: {},
  isClaimingWeekly: {},

  // ========================================
  // Actions
  // ========================================

  fetchDailyTasks: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/tasks/daily`
      );

      set({
        dailyTasks: data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入每日任務失敗';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[TasksStore] fetchDailyTasks error:', error);
    }
  },

  fetchWeeklyTasks: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/tasks/weekly`
      );

      set({
        weeklyTasks: data,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入每週任務失敗';
      set({
        error: errorMessage,
        isLoading: false,
      });
      console.error('[TasksStore] fetchWeeklyTasks error:', error);
    }
  },

  claimDailyTaskReward: async (taskId: string) => {
    // Set claiming state for this specific task
    set((state) => ({
      isClaimingDaily: { ...state.isClaimingDaily, [taskId]: true },
      error: null,
    }));

    try {
      const data: ClaimRewardResponse = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/tasks/daily/${taskId}/claim`,
        {
          method: 'POST',
        }
      );

      // Refresh daily tasks after claiming
      await get().fetchDailyTasks();

      // Clear claiming state
      set((state) => {
        const newClaimingState = { ...state.isClaimingDaily };
        delete newClaimingState[taskId];
        return { isClaimingDaily: newClaimingState };
      });

      console.log(`[TasksStore] Claimed daily task reward: +${data.karma_earned} Karma`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '領取獎勵失敗';
      set((state) => {
        const newClaimingState = { ...state.isClaimingDaily };
        delete newClaimingState[taskId];
        return {
          error: errorMessage,
          isClaimingDaily: newClaimingState,
        };
      });
      console.error('[TasksStore] claimDailyTaskReward error:', error);
      return false;
    }
  },

  claimWeeklyTaskReward: async (taskId: string) => {
    // Set claiming state for this specific task
    set((state) => ({
      isClaimingWeekly: { ...state.isClaimingWeekly, [taskId]: true },
      error: null,
    }));

    try {
      const data: ClaimRewardResponse = await makeAuthenticatedRequest(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/tasks/weekly/${taskId}/claim`,
        {
          method: 'POST',
        }
      );

      // Refresh weekly tasks after claiming
      await get().fetchWeeklyTasks();

      // Clear claiming state
      set((state) => {
        const newClaimingState = { ...state.isClaimingWeekly };
        delete newClaimingState[taskId];
        return { isClaimingWeekly: newClaimingState };
      });

      console.log(`[TasksStore] Claimed weekly task reward: +${data.karma_earned} Karma`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '領取獎勵失敗';
      set((state) => {
        const newClaimingState = { ...state.isClaimingWeekly };
        delete newClaimingState[taskId];
        return {
          error: errorMessage,
          isClaimingWeekly: newClaimingState,
        };
      });
      console.error('[TasksStore] claimWeeklyTaskReward error:', error);
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      dailyTasks: null,
      weeklyTasks: null,
      isLoading: false,
      error: null,
      isClaimingDaily: {},
      isClaimingWeekly: {},
    });
  },
}));
