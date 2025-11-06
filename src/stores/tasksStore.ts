/**
 * Tasks Store - Zustand state management for Dashboard Gamification Tasks System
 * Handles daily/weekly tasks, progress tracking, reward claiming
 *
 * ✅ Refactored to use unified API Client (Task 3)
 */

import { create } from 'zustand';
import { api } from '@/lib/apiClient';

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

  /**
   * Task 3.1: Fetch daily tasks using unified API Client
   */
  fetchDailyTasks: async () => {
    console.log('🔄 [TasksStore] fetchDailyTasks 開始執行...');
    set({ isLoading: true, error: null });

    try {
      const data = await api.get<DailyTasksData>('/tasks/daily');

      console.log('✅ [TasksStore] fetchDailyTasks 成功取得資料:', {
        tasks_count: data.tasks.length,
        completed_count: data.completed_count,
        total_count: data.total_count,
        tasks: data.tasks.map(t => ({
          name: t.name,
          progress: `${t.current_value}/${t.target_value}`,
          completed: t.is_completed,
          claimed: t.is_claimed
        }))
      });

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

  /**
   * Task 3.2: Fetch weekly tasks using unified API Client
   */
  fetchWeeklyTasks: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await api.get<WeeklyTasksData>('/tasks/weekly');

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

  /**
   * Task 3.3: Claim daily task reward using unified API Client
   */
  claimDailyTaskReward: async (taskId: string) => {
    // Set claiming state for this specific task
    set((state) => ({
      isClaimingDaily: { ...state.isClaimingDaily, [taskId]: true },
      error: null,
    }));

    try {
      const data = await api.post<ClaimRewardResponse>(`/tasks/daily/${taskId}/claim`);

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

      // Clear claiming state and set error
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

  /**
   * Task 3.4: Claim weekly task reward using unified API Client
   */
  claimWeeklyTaskReward: async (taskId: string) => {
    // Set claiming state for this specific task
    set((state) => ({
      isClaimingWeekly: { ...state.isClaimingWeekly, [taskId]: true },
      error: null,
    }));

    try {
      const data = await api.post<ClaimRewardResponse>(`/tasks/weekly/${taskId}/claim`);

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

      // Clear claiming state and set error
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
