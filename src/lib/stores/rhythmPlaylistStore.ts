/**
 * RhythmPlaylistStore - Pattern-Based 播放清單狀態管理
 * Task 4.1: 建立 playlistStore（播放清單狀態管理）
 * Task 4.4: 整合訪客與註冊使用者狀態同步
 * Feature: playlist-music-player
 * Requirements: 需求 28.1-28.7, 需求 33.1, 需求 34.1-34.2
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { guestPlaylistManager } from '../localStorage/guestPlaylistManager';

/**
 * 16 步驟節奏 Pattern
 * 每個軌道包含 16 個布林值，true 表示該步驟啟用
 */
export interface Pattern {
  kick: boolean[];      // Kick Drum（16 步驟）
  snare: boolean[];     // Snare Drum（16 步驟）
  hihat: boolean[];     // Hi-Hat（16 步驟）
  openhat: boolean[];   // Open Hi-Hat（16 步驟）
  clap: boolean[];      // Clap（16 步驟）
}

/**
 * 使用者節奏 Preset（對應 DB 表：user_rhythm_presets）
 */
export interface UserRhythmPreset {
  id: string;                  // UUID
  userId: string;              // FK to auth.users(id)
  name: string;                // Preset 名稱（最多 50 字元）
  description?: string;        // 描述（可選）
  pattern: Pattern;            // 16 步驟 Pattern（JSONB）
  isSystemPreset: boolean;     // 是否為系統預設
  isPublic: boolean;           // 是否公開分享
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
}

/**
 * 播放清單（對應 DB 表：playlists）
 */
export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  patterns: UserRhythmPreset[]; // JOIN 後的完整 Pattern 資料
  createdAt: string;
  updatedAt: string;
}

/**
 * 播放清單 Pattern 關聯（對應 DB 表：playlist_patterns）
 */
export interface PlaylistPattern {
  id: string;
  playlistId: string;
  patternId: string;
  position: number;
  createdAt: string;
}

/**
 * RhythmPlaylistStore 狀態
 */
export interface RhythmPlaylistState {
  // === 資料狀態 ===
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  systemPresets: UserRhythmPreset[];  // 系統預設 Pattern（用於音樂播放器）
  isLoading: boolean;
  error: string | null;
  isGuest: boolean;

  // === Actions: 播放清單管理 ===
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  loadPlaylist: (id: string) => Promise<void>;
  loadSystemPresets: () => Promise<UserRhythmPreset[]>;  // 載入系統預設 Pattern

  // === Actions: Pattern 管理 ===
  addPatternToPlaylist: (patternId: string) => Promise<void>;
  removePatternFromPlaylist: (patternId: string) => Promise<void>;
  reorderPattern: (patternId: string, newPosition: number) => Promise<void>;

  // === Actions: 訪客模式管理（整合 guestPlaylistManager）===
  addPatternToGuestPlaylist: (patternId: string) => boolean;
  removePatternFromGuestPlaylist: (patternId: string) => void;
  getGuestPlaylistPatterns: () => string[];
  isGuestPlaylistFull: () => boolean;
  getGuestPatternCount: () => number;

  // === Actions: 訪客轉註冊遷移 ===
  detectGuestPlaylist: () => boolean;
  promptMigration: () => void;
  migrateGuestPlaylist: () => Promise<void>;

  // === Actions: 錯誤處理 ===
  setError: (error: string | null) => void;
  clearError: () => void;

  // === Internal Actions ===
  _setPlaylists: (playlists: Playlist[]) => void;
  _setCurrentPlaylist: (playlist: Playlist | null) => void;
  _setLoading: (loading: boolean) => void;
  _setIsGuest: (isGuest: boolean) => void;
}

/**
 * localStorage 儲存鍵值
 */
const STORAGE_KEY = 'wasteland-tarot-rhythm-playlists';

/**
 * API Base URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * 檢查是否為訪客
 * 注意：初始值為 true（訪客模式）
 * 組件應使用 useAuthStore 檢查用戶狀態並調用 _setIsGuest() 更新此值
 */
const checkIsGuest = (): boolean => {
  // 初始化時預設為訪客模式
  // 實際的用戶狀態應由組件通過 useAuthStore 檢查並更新
  return true;
};

/**
 * RhythmPlaylistStore - Pattern-Based 播放清單狀態管理
 */
export const useRhythmPlaylistStore = create<RhythmPlaylistState>()(
  persist(
    (set, get) => ({
      // === 初始狀態 ===
      playlists: [],
      currentPlaylist: null,
      systemPresets: [],
      isLoading: false,
      error: null,
      isGuest: checkIsGuest(),

      // === Actions: 播放清單管理 ===
      fetchPlaylists: async () => {
        try {
          set({ isLoading: true, error: null });

          // 檢查是否為訪客
          if (get().isGuest) {
            // 訪客不需要從 API 載入
            set({ playlists: [], isLoading: false });
            return;
          }

          const response = await fetch(`${API_BASE_URL}/playlists`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            if (response.status === 401) {
              // 未登入，設定為訪客模式
              set({ isGuest: true, playlists: [], isLoading: false });
              return;
            }
            const errorData = await response.json();
            throw new Error(errorData.detail || '載入播放清單失敗');
          }

          const playlists: Playlist[] = await response.json();
          set({ playlists, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '載入播放清單失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      createPlaylist: async (name: string, description?: string) => {
        try {
          set({ isLoading: true, error: null });

          if (get().isGuest) {
            throw new Error('訪客無法建立播放清單，請先註冊');
          }

          const response = await fetch(`${API_BASE_URL}/playlists`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ name, description }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '建立播放清單失敗');
          }

          const newPlaylist = await response.json();

          // 樂觀更新
          set((state) => ({
            playlists: [...state.playlists, newPlaylist],
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '建立播放清單失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      deletePlaylist: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          if (get().isGuest) {
            throw new Error('訪客無法刪除播放清單');
          }

          const response = await fetch(`${API_BASE_URL}/playlists/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '刪除播放清單失敗');
          }

          // 樂觀更新
          set((state) => ({
            playlists: state.playlists.filter((p) => p.id !== id),
            currentPlaylist: state.currentPlaylist?.id === id ? null : state.currentPlaylist,
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '刪除播放清單失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      loadPlaylist: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          if (get().isGuest) {
            throw new Error('訪客無法載入播放清單');
          }

          const response = await fetch(`${API_BASE_URL}/playlists/${id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '載入播放清單失敗');
          }

          const playlist: Playlist = await response.json();
          set({ currentPlaylist: playlist, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '載入播放清單失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      /**
       * 載入系統預設 Pattern（用於音樂播放器）
       * Requirements 20.1: 從資料庫載入 5 個系統預設 Pattern
       */
      loadSystemPresets: async () => {
        try {
          set({ isLoading: true, error: null });

          // 從後端 API 載入系統預設 Pattern
          const response = await fetch(`${API_BASE_URL}/music/presets/public`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to load system presets: ${response.statusText}`);
          }

          const data = await response.json();
          const systemPresets: UserRhythmPreset[] = data.system_presets.map((p: any) => ({
            id: p.id,
            userId: p.user_id || null,
            name: p.name,
            description: p.description || '',
            pattern: p.pattern,
            isSystemPreset: p.is_system_preset,
            isPublic: p.is_public,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          }));

          set({ systemPresets, isLoading: false });
          return systemPresets;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '載入系統預設 Pattern 失敗';
          set({ error: errorMessage, isLoading: false });
          console.error('[rhythmPlaylistStore] Failed to load system presets', error);
          throw error;
        }
      },

      // === Actions: Pattern 管理 ===
      addPatternToPlaylist: async (patternId: string) => {
        try {
          set({ isLoading: true, error: null });

          const { currentPlaylist, isGuest } = get();

          if (isGuest) {
            // 訪客模式：使用 localStorage（在 guestPlaylistManager 中處理）
            throw new Error('訪客請使用訪客播放清單功能');
          }

          if (!currentPlaylist) {
            throw new Error('請先選擇播放清單');
          }

          const response = await fetch(
            `${API_BASE_URL}/playlists/${currentPlaylist.id}/patterns`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ pattern_id: patternId }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '加入 Pattern 失敗');
          }

          // 重新載入播放清單
          await get().loadPlaylist(currentPlaylist.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '加入 Pattern 失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      removePatternFromPlaylist: async (patternId: string) => {
        try {
          set({ isLoading: true, error: null });

          const { currentPlaylist, isGuest } = get();

          if (isGuest) {
            throw new Error('訪客請使用訪客播放清單功能');
          }

          if (!currentPlaylist) {
            throw new Error('請先選擇播放清單');
          }

          const response = await fetch(
            `${API_BASE_URL}/playlists/${currentPlaylist.id}/patterns/${patternId}`,
            {
              method: 'DELETE',
              credentials: 'include',
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '移除 Pattern 失敗');
          }

          // 重新載入播放清單
          await get().loadPlaylist(currentPlaylist.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '移除 Pattern 失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      reorderPattern: async (patternId: string, newPosition: number) => {
        try {
          set({ isLoading: true, error: null });

          const { currentPlaylist, isGuest } = get();

          if (isGuest) {
            throw new Error('訪客無法調整順序');
          }

          if (!currentPlaylist) {
            throw new Error('請先選擇播放清單');
          }

          const response = await fetch(
            `${API_BASE_URL}/playlists/${currentPlaylist.id}/patterns/${patternId}/position`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ position: newPosition }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '調整順序失敗');
          }

          // 重新載入播放清單
          await get().loadPlaylist(currentPlaylist.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '調整順序失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // === Actions: 訪客模式管理（整合 guestPlaylistManager）===
      addPatternToGuestPlaylist: (patternId: string) => {
        try {
          const success = guestPlaylistManager.addPattern(patternId);
          if (!success) {
            set({ error: '訪客播放清單已滿（上限 4 首），請先註冊以解除限制' });
          }
          return success;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '加入失敗';
          set({ error: errorMessage });
          return false;
        }
      },

      removePatternFromGuestPlaylist: (patternId: string) => {
        try {
          guestPlaylistManager.removePattern(patternId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '移除失敗';
          set({ error: errorMessage });
        }
      },

      getGuestPlaylistPatterns: () => {
        const playlist = guestPlaylistManager.loadFromLocalStorage();
        return playlist ? playlist.patterns.map((p) => p.patternId) : [];
      },

      isGuestPlaylistFull: () => {
        return guestPlaylistManager.isFull();
      },

      getGuestPatternCount: () => {
        return guestPlaylistManager.getPatternCount();
      },

      // === Actions: 訪客轉註冊遷移 ===
      detectGuestPlaylist: () => {
        if (typeof window === 'undefined') return false;

        try {
          const guestPlaylist = localStorage.getItem('guest_playlist');
          return !!guestPlaylist;
        } catch {
          return false;
        }
      },

      promptMigration: () => {
        // 此方法會觸發 GuestPlaylistMigrationDialog 組件顯示
        // 實際實作在 UI 層
        console.log('[RhythmPlaylistStore] Migration prompt triggered');
      },

      migrateGuestPlaylist: async () => {
        try {
          set({ isLoading: true, error: null });

          // 匯出訪客播放清單
          const exportData = guestPlaylistManager.exportForMigration();
          if (!exportData) {
            throw new Error('沒有訪客播放清單可匯入');
          }

          // 呼叫匯入 API
          const response = await fetch(`${API_BASE_URL}/playlists/import-guest`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              guestPlaylist: exportData,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '匯入失敗');
          }

          const data = await response.json();
          const { playlistId, patternCount } = data;

          // 清除 localStorage
          guestPlaylistManager.clearPlaylist();

          // 重新載入播放清單
          await get().fetchPlaylists();

          // 載入剛匯入的播放清單
          if (playlistId) {
            await get().loadPlaylist(playlistId);
          }

          set({
            isLoading: false,
            error: null,
          });

          console.log(
            `[RhythmPlaylistStore] Successfully migrated ${patternCount} patterns from guest playlist`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '匯入訪客播放清單失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // === Actions: 錯誤處理 ===
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // === Internal Actions ===
      _setPlaylists: (playlists: Playlist[]) => set({ playlists }),
      _setCurrentPlaylist: (playlist: Playlist | null) => set({ currentPlaylist: playlist }),
      _setLoading: (loading: boolean) => set({ isLoading: loading }),
      _setIsGuest: (isGuest: boolean) => set({ isGuest }),
    }),
    {
      name: STORAGE_KEY,
      // 只持久化特定欄位
      partialize: (state) => ({
        // 不持久化 playlists 和 currentPlaylist，每次啟動時重新載入
        isGuest: state.isGuest,
      }),
    }
  )
);

/**
 * Hook: 取得播放清單列表
 */
export const useRhythmPlaylists = () =>
  useRhythmPlaylistStore((state) => ({
    playlists: state.playlists,
    currentPlaylist: state.currentPlaylist,
    isLoading: state.isLoading,
    error: state.error,
    isGuest: state.isGuest,
    fetchPlaylists: state.fetchPlaylists,
    loadPlaylist: state.loadPlaylist,
  }));

/**
 * Hook: 播放清單管理
 */
export const useRhythmPlaylistManagement = () =>
  useRhythmPlaylistStore((state) => ({
    createPlaylist: state.createPlaylist,
    deletePlaylist: state.deletePlaylist,
    addPatternToPlaylist: state.addPatternToPlaylist,
    removePatternFromPlaylist: state.removePatternFromPlaylist,
    reorderPattern: state.reorderPattern,
    isLoading: state.isLoading,
    error: state.error,
  }));

/**
 * Hook: 訪客模式管理
 */
export const useGuestMode = () =>
  useRhythmPlaylistStore((state) => ({
    isGuest: state.isGuest,
    detectGuestPlaylist: state.detectGuestPlaylist,
    promptMigration: state.promptMigration,
    migrateGuestPlaylist: state.migrateGuestPlaylist,
    addPatternToGuestPlaylist: state.addPatternToGuestPlaylist,
    removePatternFromGuestPlaylist: state.removePatternFromGuestPlaylist,
    getGuestPlaylistPatterns: state.getGuestPlaylistPatterns,
    isGuestPlaylistFull: state.isGuestPlaylistFull,
    getGuestPatternCount: state.getGuestPatternCount,
  }));
