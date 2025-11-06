/**
 * AIMusicStore - AI 音樂生成狀態管理
 * Task 7.1-7.3: 建立 aiMusicStore 與 AI 音樂生成
 * Requirements: 13-15, 17
 * ✅ Refactored to use unified API Client
 */

import { create } from 'zustand';
import { api } from '@/lib/apiClient';
import type { MusicParameters } from './playlistStore';

/**
 * LLM Provider 類型
 * Requirements 14: LLM Provider 整合
 */
export type LLMProvider = 'gemini' | 'openai' | 'fallback';

/**
 * 配額資訊
 * Requirements 17: 使用者認證與權限控制
 */
export interface QuotaInfo {
  quotaLimit: number; // 配額上限（免費 20, 付費 100）
  usedCount: number; // 本月已使用次數
  remaining: number; // 剩餘配額
  resetAt: string; // 下次重置時間 (ISO 8601)
}

/**
 * AI 生成結果
 */
export interface GenerationResult {
  parameters: MusicParameters;
  provider: LLMProvider;
  quotaRemaining: number;
}

/**
 * AIMusicStore 狀態
 */
export interface AIMusicState {
  // === 輸入狀態 ===
  prompt: string;

  // === 生成狀態 ===
  isGenerating: boolean;
  generatedParameters: MusicParameters | null;
  provider: LLMProvider | null;

  // === 配額狀態 ===
  quotaInfo: QuotaInfo | null;

  // === 錯誤狀態 ===
  error: string | null;

  // === Actions: Prompt 管理 ===
  setPrompt: (prompt: string) => void;
  clearPrompt: () => void;

  // === Actions: AI 生成 ===
  generateMusic: (prompt: string) => Promise<GenerationResult>;

  // === Actions: 配額管理 ===
  fetchQuotaInfo: () => Promise<void>;

  // === Actions: 錯誤處理 ===
  setError: (error: string | null) => void;
  clearError: () => void;

  // === Internal Actions ===
  _setGenerating: (generating: boolean) => void;
  _setGeneratedParameters: (parameters: MusicParameters | null) => void;
  _setProvider: (provider: LLMProvider | null) => void;
  _setQuotaInfo: (info: QuotaInfo | null) => void;
}

/**
 * AIMusicStore - AI 音樂生成狀態管理
 */
export const useAIMusicStore = create<AIMusicState>((set, get) => ({
  // === 初始狀態 ===
  prompt: '',
  isGenerating: false,
  generatedParameters: null,
  provider: null,
  quotaInfo: null,
  error: null,

  // === Actions: Prompt 管理 ===
  setPrompt: (prompt: string) => {
    // Prompt 長度限制：最多 200 字元
    // Requirements 13: AI 驅動音樂生成
    const trimmedPrompt = prompt.slice(0, 200);
    set({ prompt: trimmedPrompt });
  },

  clearPrompt: () => set({ prompt: '', generatedParameters: null, provider: null }),

  // === Actions: AI 生成 ===
  generateMusic: async (prompt: string) => {
    try {
      set({ isGenerating: true, error: null });

      // Prompt 驗證
      if (!prompt.trim()) {
        throw new Error('請輸入音樂描述');
      }

      if (prompt.length > 200) {
        throw new Error('音樂描述不得超過 200 字元');
      }

      // 呼叫 AI 生成 API
      // Requirements 14: LLM Provider 整合與管理
      const data = await api.post<{
        data: {
          parameters: MusicParameters;
          provider: LLMProvider;
          quotaRemaining: number;
        };
      }>('/ai/generate-music', { prompt });
      const result: GenerationResult = {
        parameters: data.data.parameters,
        provider: data.data.provider,
        quotaRemaining: data.data.quotaRemaining,
      };

      // 更新狀態
      set({
        generatedParameters: result.parameters,
        provider: result.provider,
        isGenerating: false,
      });

      // 更新配額資訊
      if (get().quotaInfo) {
        set((state) => ({
          quotaInfo: state.quotaInfo
            ? {
                ...state.quotaInfo,
                usedCount: state.quotaInfo.quotaLimit - result.quotaRemaining,
                remaining: result.quotaRemaining,
              }
            : null,
        }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI 生成失敗，請重試';
      set({ error: errorMessage, isGenerating: false });
      throw error;
    }
  },

  // === Actions: 配額管理 ===
  fetchQuotaInfo: async () => {
    try {
      const data = await api.get<{
        quota_limit?: number;
        quotaLimit?: number;
        quota_used?: number;
        quotaUsed?: number;
        used_count?: number;
        usedCount?: number;
        remaining: number;
        reset_at?: string;
        resetAt?: string;
      }>('/ai/quota');
      const quotaInfo: QuotaInfo = {
        quotaLimit: data.quota_limit || data.quotaLimit,
        usedCount: data.used_count || data.usedCount,
        remaining: data.remaining,
        resetAt: data.reset_at || data.resetAt,
      };

      set({ quotaInfo });
    } catch (error) {
      // 未登入或其他錯誤，靜默失敗
      console.error('[AIMusicStore] Failed to fetch quota info:', error);
      set({ quotaInfo: null });
    }
  },

  // === Actions: 錯誤處理 ===
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  // === Internal Actions ===
  _setGenerating: (generating: boolean) => set({ isGenerating: generating }),
  _setGeneratedParameters: (parameters: MusicParameters | null) =>
    set({ generatedParameters: parameters }),
  _setProvider: (provider: LLMProvider | null) => set({ provider }),
  _setQuotaInfo: (info: QuotaInfo | null) => set({ quotaInfo: info }),
}));

/**
 * Hook: 取得 AI 生成狀態
 */
export const useAIGeneration = () =>
  useAIMusicStore((state) => ({
    prompt: state.prompt,
    isGenerating: state.isGenerating,
    generatedParameters: state.generatedParameters,
    provider: state.provider,
    setPrompt: state.setPrompt,
    clearPrompt: state.clearPrompt,
    generateMusic: state.generateMusic,
  }));

/**
 * Hook: 取得配額資訊
 */
export const useQuotaInfo = () =>
  useAIMusicStore((state) => ({
    quotaInfo: state.quotaInfo,
    fetchQuotaInfo: state.fetchQuotaInfo,
  }));

/**
 * Hook: 取得錯誤狀態
 */
export const useAIError = () =>
  useAIMusicStore((state) => ({
    error: state.error,
    setError: state.setError,
    clearError: state.clearError,
  }));
