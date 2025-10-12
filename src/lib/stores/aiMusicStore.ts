/**
 * AIMusicStore - AI 音樂生成狀態管理
 * Task 7.1-7.3: 建立 aiMusicStore 與 AI 音樂生成
 * Requirements: 13-15, 17
 */

import { create } from 'zustand';
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
 * API Base URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

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
      const response = await fetch(`${API_BASE_URL}/ai/generate-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('請先登入以使用 AI 音樂生成功能');
        }
        if (response.status === 403) {
          throw new Error('本月配額已用完，下月 1 日重置');
        }

        const errorData = await response.json();
        throw new Error(errorData.detail || 'AI 生成失敗');
      }

      const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/ai/quota`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 未登入時不顯示錯誤，只是不載入配額資訊
          set({ quotaInfo: null });
          return;
        }
        throw new Error('載入配額資訊失敗');
      }

      const data = await response.json();
      const quotaInfo: QuotaInfo = {
        quotaLimit: data.quota_limit || data.quotaLimit,
        usedCount: data.used_count || data.usedCount,
        remaining: data.remaining,
        resetAt: data.reset_at || data.resetAt,
      };

      set({ quotaInfo });
    } catch (error) {
      console.error('[AIMusicStore] Failed to fetch quota info:', error);
      // 不設定錯誤狀態，配額載入失敗不影響其他功能
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
