/**
 * RhythmEditorStore - 節奏編輯器狀態管理
 * Task 4.2: 建立 rhythmEditorStore（節奏編輯器狀態管理）
 * Feature: playlist-music-player
 * Requirements: 需求 21.8, 需求 22.1-22.8, 需求 24.2
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pattern, UserRhythmPreset } from './rhythmPlaylistStore';

/**
 * 軌道類型
 */
export type TrackType = 'kick' | 'snare' | 'hihat' | 'openhat' | 'clap';

/**
 * AI 配額資訊
 */
export interface AIQuota {
  limit: number;           // 配額上限（每日 20 次）
  used: number;            // 已使用次數
  remaining: number;       // 剩餘次數
  resetAt: string;         // 重置時間（ISO timestamp）
}

/**
 * RhythmEditorStore 狀態
 */
export interface RhythmEditorState {
  // === 編輯狀態 ===
  pattern: Pattern;
  tempo: number;           // BPM（60-180，預設 120）
  isPlaying: boolean;
  currentStep: number;     // 當前步驟（0-15）
  loop: boolean;           // 循環播放（預設 true）

  // === Preset 狀態 ===
  systemPresets: UserRhythmPreset[];
  userPresets: UserRhythmPreset[];

  // === AI 配額狀態 ===
  aiQuota: AIQuota | null;

  // === 載入狀態 ===
  isLoading: boolean;
  error: string | null;

  // === Actions: Pattern 編輯 ===
  toggleStep: (track: TrackType, step: number) => void;
  setTempo: (tempo: number) => void;
  clear: () => void;

  // === Actions: 播放控制 ===
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentStep: (step: number) => void;
  setLoop: (loop: boolean) => void;

  // === Actions: Preset 管理 ===
  loadPreset: (preset: UserRhythmPreset) => void;
  savePreset: (name: string, description?: string, isPublic?: boolean) => Promise<void>;
  deletePreset: (presetId: string) => Promise<void>;
  fetchSystemPresets: () => Promise<void>;
  fetchUserPresets: () => Promise<void>;

  // === Actions: AI 生成 ===
  generateRhythm: (prompt: string) => Promise<Pattern>;
  fetchQuota: () => Promise<void>;

  // === Actions: 錯誤處理 ===
  setError: (error: string | null) => void;
  clearError: () => void;

  // === Internal Actions ===
  _setPattern: (pattern: Pattern) => void;
  _setLoading: (loading: boolean) => void;
  _setSystemPresets: (presets: UserRhythmPreset[]) => void;
  _setUserPresets: (presets: UserRhythmPreset[]) => void;
  _setAIQuota: (quota: AIQuota | null) => void;
}

/**
 * localStorage 儲存鍵值
 */
const STORAGE_KEY = 'wasteland-tarot-rhythm-editor';

/**
 * API Base URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * 建立空白 Pattern
 */
const createEmptyPattern = (): Pattern => ({
  kick: Array(16).fill(false),
  snare: Array(16).fill(false),
  hihat: Array(16).fill(false),
  openhat: Array(16).fill(false),
  clap: Array(16).fill(false),
});

/**
 * 驗證 Pattern 結構
 */
const isValidPattern = (pattern: Pattern): boolean => {
  const tracks: TrackType[] = ['kick', 'snare', 'hihat', 'openhat', 'clap'];

  for (const track of tracks) {
    if (!Array.isArray(pattern[track]) || pattern[track].length !== 16) {
      return false;
    }
    if (!pattern[track].every((step) => typeof step === 'boolean')) {
      return false;
    }
  }

  return true;
};

/**
 * RhythmEditorStore - 節奏編輯器狀態管理
 */
export const useRhythmEditorStore = create<RhythmEditorState>()(
  persist(
    (set, get) => ({
      // === 初始狀態 ===
      pattern: createEmptyPattern(),
      tempo: 120,
      isPlaying: false,
      currentStep: 0,
      loop: true,
      systemPresets: [],
      userPresets: [],
      aiQuota: null,
      isLoading: false,
      error: null,

      // === Actions: Pattern 編輯 ===
      toggleStep: (track: TrackType, step: number) => {
        if (step < 0 || step >= 16) {
          console.error(`[RhythmEditorStore] Invalid step: ${step}`);
          return;
        }

        set((state) => {
          const newPattern = { ...state.pattern };
          newPattern[track] = [...state.pattern[track]];
          newPattern[track][step] = !newPattern[track][step];
          return { pattern: newPattern };
        });
      },

      setTempo: (tempo: number) => {
        // BPM 範圍：60-180
        const clampedTempo = Math.max(60, Math.min(180, tempo));
        set({ tempo: clampedTempo });
      },

      clear: () => {
        set({ pattern: createEmptyPattern() });
      },

      // === Actions: 播放控制 ===
      play: () => {
        set({ isPlaying: true });
      },

      pause: () => {
        set({ isPlaying: false });
      },

      stop: () => {
        set({ isPlaying: false, currentStep: 0 });
      },

      setCurrentStep: (step: number) => {
        set({ currentStep: step });
      },

      setLoop: (loop: boolean) => {
        set({ loop });
      },

      // === Actions: Preset 管理 ===
      loadPreset: (preset: UserRhythmPreset) => {
        if (!isValidPattern(preset.pattern)) {
          console.error('[RhythmEditorStore] Invalid preset pattern');
          set({ error: 'Preset 格式錯誤' });
          return;
        }

        set({
          pattern: preset.pattern,
          error: null,
        });
      },

      savePreset: async (name: string, description?: string, isPublic = false) => {
        try {
          set({ isLoading: true, error: null });

          const { pattern } = get();

          // 驗證 Pattern
          if (!isValidPattern(pattern)) {
            throw new Error('Pattern 格式錯誤');
          }

          // 驗證名稱
          if (!name.trim()) {
            throw new Error('請輸入 Preset 名稱');
          }

          if (name.length > 50) {
            throw new Error('Preset 名稱不得超過 50 字元');
          }

          // 驗證描述
          if (description && description.length > 200) {
            throw new Error('描述不得超過 200 字元');
          }

          const response = await fetch(`${API_BASE_URL}/music/presets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // 啟用 httpOnly cookie 傳輸
            body: JSON.stringify({
              name,
              description,
              pattern,
              is_public: isPublic,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '儲存 Preset 失敗');
          }

          // 重新載入使用者 Presets
          await get().fetchUserPresets();

          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '儲存 Preset 失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      deletePreset: async (presetId: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(`${API_BASE_URL}/music/presets/${presetId}`, {
            method: 'DELETE',
            credentials: 'include', // 啟用 httpOnly cookie 傳輸
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '刪除 Preset 失敗');
          }

          // 樂觀更新
          set((state) => ({
            userPresets: state.userPresets.filter((p) => p.id !== presetId),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '刪除 Preset 失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      fetchSystemPresets: async () => {
        try {
          set({ isLoading: true, error: null });

          // 系統 Presets 可以訪客存取
          const response = await fetch(`${API_BASE_URL}/music/presets/public`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            // API 尚未實作，靜默失敗
            console.warn('[RhythmEditorStore] System presets API not available:', response.status);
            set({ systemPresets: [], isLoading: false, error: null });
            return;
          }

          const data = await response.json();
          const systemPresets: UserRhythmPreset[] = data.systemPresets || [];

          set({ systemPresets, isLoading: false });
        } catch (error) {
          // 網路錯誤，靜默失敗，不顯示錯誤訊息
          console.warn('[RhythmEditorStore] Failed to fetch system presets:', error);
          set({ systemPresets: [], isLoading: false, error: null });
        }
      },

      fetchUserPresets: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(`${API_BASE_URL}/music/presets`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // 啟用 httpOnly cookie 傳輸
          });

          if (!response.ok) {
            if (response.status === 401) {
              // 未登入，不載入使用者 Presets
              set({ userPresets: [], systemPresets: [], isLoading: false, error: null });
              return;
            }
            // API 尚未實作，靜默失敗
            console.warn('[RhythmEditorStore] User presets API not available:', response.status);
            set({ userPresets: [], systemPresets: [], isLoading: false, error: null });
            return;
          }

          const allPresetsRaw: any[] = await response.json();

          // 轉換欄位名稱並分離系統預設和使用者預設
          const allPresets: UserRhythmPreset[] = allPresetsRaw.map((p) => ({
            id: p.id,
            userId: p.user_id,
            name: p.name,
            description: p.description,
            pattern: p.pattern,
            isSystemPreset: p.is_system_preset,
            isPublic: p.is_public,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }));

          const systemPresets = allPresets.filter(p => p.isSystemPreset === true);
          const userPresets = allPresets.filter(p => p.isSystemPreset !== true);

          set({ systemPresets, userPresets, isLoading: false });
        } catch (error) {
          // 網路錯誤，靜默失敗，不顯示錯誤訊息
          console.warn('[RhythmEditorStore] Failed to fetch user presets:', error);
          set({ userPresets: [], systemPresets: [], isLoading: false, error: null });
        }
      },

      // === Actions: AI 生成 ===
      generateRhythm: async (prompt: string) => {
        try {
          set({ isLoading: true, error: null });

          // Prompt 驗證
          if (!prompt.trim()) {
            throw new Error('請輸入生成提示');
          }

          if (prompt.length > 200) {
            throw new Error('提示不得超過 200 字元');
          }

          // 呼叫後端 API（使用 httpOnly cookies 認證）
          const response = await fetch(`${API_BASE_URL}/music/generate-rhythm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // 啟用 httpOnly cookie 傳輸
            body: JSON.stringify({ prompt }),
          });

          // 處理 API 回應
          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (e) {
              // JSON 解析失敗
              throw new Error(`API 錯誤 (${response.status}): ${response.statusText}`);
            }

            // 401 未認證
            if (response.status === 401) {
              throw new Error('請先登入才能使用 AI 生成功能');
            }

            // 配額用盡
            if (response.status === 400 && errorData.error === 'Daily quota exceeded') {
              const quota: AIQuota = {
                limit: errorData.quota_limit ?? errorData.quotaLimit ?? 20,
                used: errorData.quota_used ?? errorData.quotaUsed ?? 20,
                remaining: 0,
                resetAt: errorData.reset_at ?? errorData.resetAt ?? new Date().toISOString(),
              };
              set({ aiQuota: quota, isLoading: false });
              throw new Error(`今日配額已用完（${quota.used}/${quota.limit}），明日重置`);
            }

            // 其他錯誤 - 確保錯誤訊息是字串
            let errorMessage = `API 錯誤 (${response.status})`;
            if (typeof errorData.detail === 'string' && errorData.detail) {
              errorMessage = errorData.detail;
            } else if (typeof errorData.error === 'string' && errorData.error) {
              errorMessage = errorData.error;
            } else if (typeof errorData.message === 'string' && errorData.message) {
              errorMessage = errorData.message;
            }

            console.error('[RhythmEditorStore] API Error:', {
              status: response.status,
              data: errorData,
              message: errorMessage,
            });

            throw new Error(errorMessage);
          }

          // 解析成功回應
          const data = await response.json();
          const pattern = data.pattern;

          // 驗證生成的 Pattern
          if (!isValidPattern(pattern)) {
            throw new Error('生成的節奏格式錯誤');
          }

          // 更新配額
          const quotaRemaining = data.quota_remaining ?? data.quotaRemaining ?? 0;
          const { aiQuota } = get();
          if (aiQuota) {
            set({
              aiQuota: {
                ...aiQuota,
                used: aiQuota.limit - quotaRemaining,
                remaining: quotaRemaining,
              },
            });
          }

          // 更新 Pattern
          set({ pattern, isLoading: false });

          return pattern;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '生成失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      fetchQuota: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/music/quota`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // 啟用 httpOnly cookie 傳輸
          });

          if (!response.ok) {
            if (response.status === 401) {
              // 未登入，不載入配額
              set({ aiQuota: null });
              return;
            }
            // API 尚未實作，靜默失敗
            console.warn('[RhythmEditorStore] Quota API not available:', response.status);
            set({ aiQuota: null });
            return;
          }

          const data = await response.json();
          const quota: AIQuota = {
            limit: data.quota_limit ?? data.quotaLimit ?? 20,
            used: data.quota_used ?? data.quotaUsed ?? 0,
            remaining: data.quota_remaining ?? data.quotaRemaining ?? data.remaining ?? 20,
            resetAt: data.reset_at ?? data.resetAt ?? new Date().toISOString(),
          };

          set({ aiQuota: quota });
        } catch (error) {
          // 網路錯誤，靜默失敗，不影響其他功能
          console.warn('[RhythmEditorStore] Failed to fetch quota:', error);
          set({ aiQuota: null });
        }
      },

      // === Actions: 錯誤處理 ===
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // === Internal Actions ===
      _setPattern: (pattern: Pattern) => set({ pattern }),
      _setLoading: (loading: boolean) => set({ isLoading: loading }),
      _setSystemPresets: (presets: UserRhythmPreset[]) => set({ systemPresets: presets }),
      _setUserPresets: (presets: UserRhythmPreset[]) => set({ userPresets: presets }),
      _setAIQuota: (quota: AIQuota | null) => set({ aiQuota: quota }),
    }),
    {
      name: STORAGE_KEY,
      // 只持久化特定欄位
      partialize: (state) => ({
        pattern: state.pattern,
        tempo: state.tempo,
        // 不持久化播放狀態、Presets、配額（每次重新載入）
      }),
    }
  )
);

/**
 * Hook: 取得編輯器狀態
 */
export const useRhythmEditor = () =>
  useRhythmEditorStore((state) => ({
    pattern: state.pattern,
    tempo: state.tempo,
    isPlaying: state.isPlaying,
    currentStep: state.currentStep,
    isLoading: state.isLoading,
    error: state.error,
    toggleStep: state.toggleStep,
    setTempo: state.setTempo,
    clear: state.clear,
    play: state.play,
    pause: state.pause,
    stop: state.stop,
  }));

/**
 * Hook: 取得 Preset 管理
 */
export const useRhythmPresets = () =>
  useRhythmEditorStore((state) => ({
    systemPresets: state.systemPresets,
    userPresets: state.userPresets,
    isLoading: state.isLoading,
    error: state.error,
    loadPreset: state.loadPreset,
    savePreset: state.savePreset,
    deletePreset: state.deletePreset,
    fetchSystemPresets: state.fetchSystemPresets,
    fetchUserPresets: state.fetchUserPresets,
  }));

/**
 * Hook: 取得 AI 生成功能
 */
export const useRhythmAI = () =>
  useRhythmEditorStore((state) => ({
    aiQuota: state.aiQuota,
    isLoading: state.isLoading,
    error: state.error,
    generateRhythm: state.generateRhythm,
    fetchQuota: state.fetchQuota,
  }));
