/**
 * PlaylistStore - 播放清單狀態管理
 * Task 6.1-6.5: 建立 playlistStore 與播放清單管理
 * Requirements: 3, 6, 16-19
 * ✅ Refactored to use unified API Client
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/apiClient';

/**
 * 音樂參數 (來自 LLM 解析)
 * Requirements 13-15: AI 音樂生成
 */
export interface MusicParameters {
  key: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  mode: 'major' | 'minor';
  tempo: number; // 60-180 BPM
  timbre: 'sine' | 'square' | 'sawtooth' | 'triangle';
  genre: string[]; // ['ambient', 'synthwave', 'lofi', 'industrial']
  mood: string[]; // ['mysterious', 'energetic', 'calm', 'dark']
}

/**
 * 音樂軌道
 * Requirements 16: 音樂資料庫整合
 */
export interface MusicTrack {
  id: string;
  user_id: string | null; // NULL 表示系統音樂
  title: string;
  prompt?: string; // 生成 prompt（系統音樂無此欄位）
  parameters: MusicParameters;
  audio_data: string; // 序列化的 Web Audio API 參數
  duration: number;
  is_public: boolean;
  is_system: boolean; // 系統預設音樂標記
  play_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 播放清單
 * Requirements 18: 播放清單與音樂庫分離管理
 */
export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  tracks: MusicTrack[]; // JOIN 後的完整音樂資料
  created_at: string;
  updated_at: string;
}

/**
 * AI 生成的音樂資料
 */
export interface GeneratedMusic {
  title: string;
  prompt: string;
  parameters: MusicParameters;
  audio_data: string;
}

/**
 * PlaylistStore 狀態
 */
export interface PlaylistState {
  // === 資料狀態 ===
  playlists: Playlist[];
  currentPlaylistId: string | null;
  userMusicTracks: MusicTrack[];
  systemTracks: MusicTrack[];

  // === 載入狀態 ===
  isLoading: boolean;
  error: string | null;

  // === Actions: 播放清單管理 ===
  createPlaylist: (name: string, description?: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  renamePlaylist: (playlistId: string, newName: string) => Promise<void>;
  selectPlaylist: (playlistId: string | null) => void;

  // === Actions: 音樂管理 ===
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderPlaylistTracks: (playlistId: string, trackIds: string[]) => Promise<void>;

  // === Actions: 音樂庫同步 ===
  fetchUserMusic: () => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  saveGeneratedMusic: (music: GeneratedMusic) => Promise<string>;
  deleteMusic: (trackId: string) => Promise<void>;

  // === Actions: Realtime 同步 ===
  subscribeToPlaylistChanges: () => () => void;

  // === Actions: 錯誤處理 ===
  setError: (error: string | null) => void;
  clearError: () => void;

  // === Internal Actions ===
  _setPlaylists: (playlists: Playlist[]) => void;
  _setUserMusicTracks: (tracks: MusicTrack[]) => void;
  _setSystemTracks: (tracks: MusicTrack[]) => void;
  _setLoading: (loading: boolean) => void;
}

/**
 * localStorage 儲存鍵值
 * Requirements 6: 狀態持久化
 */
const STORAGE_KEY = 'wasteland-tarot-playlists';

/**
 * PlaylistStore - 播放清單狀態管理
 */
export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      // === 初始狀態 ===
      playlists: [],
      currentPlaylistId: null,
      userMusicTracks: [],
      systemTracks: [],
      isLoading: false,
      error: null,

      // === Actions: 播放清單管理 ===
      createPlaylist: async (name: string, description?: string) => {
        try {
          set({ isLoading: true, error: null });

          const newPlaylist = await api.post<Playlist>('/playlists', { name, description });

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

      deletePlaylist: async (playlistId: string) => {
        try {
          set({ isLoading: true, error: null });

          await api.delete(`/playlists/${playlistId}`);

          // 樂觀更新
          set((state) => ({
            playlists: state.playlists.filter((p) => p.id !== playlistId),
            currentPlaylistId:
              state.currentPlaylistId === playlistId ? null : state.currentPlaylistId,
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '刪除播放清單失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      renamePlaylist: async (playlistId: string, newName: string) => {
        try {
          set({ isLoading: true, error: null });

          const updatedPlaylist = await api.patch<Playlist>(`/playlists/${playlistId}`, { name: newName });

          // 樂觀更新
          set((state) => ({
            playlists: state.playlists.map((p) =>
              p.id === playlistId ? updatedPlaylist : p
            ),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '重新命名失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      selectPlaylist: (playlistId: string | null) =>
        set({ currentPlaylistId: playlistId }),

      // === Actions: 音樂管理 ===
      addTrackToPlaylist: async (playlistId: string, trackId: string) => {
        try {
          set({ isLoading: true, error: null });

          await api.post(`/playlists/${playlistId}/tracks`, { track_id: trackId });

          // 重新載入播放清單
          await get().fetchPlaylists();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '加入音樂失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      removeTrackFromPlaylist: async (playlistId: string, trackId: string) => {
        try {
          set({ isLoading: true, error: null });

          await api.delete(`/playlists/${playlistId}/tracks/${trackId}`);

          // 重新載入播放清單
          await get().fetchPlaylists();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '移除音樂失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      reorderPlaylistTracks: async (playlistId: string, trackIds: string[]) => {
        try {
          set({ isLoading: true, error: null });

          await api.patch(`/playlists/${playlistId}/tracks/reorder`, { track_ids: trackIds });

          // 重新載入播放清單
          await get().fetchPlaylists();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '重新排序失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // === Actions: 音樂庫同步 ===
      fetchUserMusic: async () => {
        try {
          set({ isLoading: true, error: null });

          const data = await api.get<{ data: MusicTrack[] }>('/music');
          const tracks: MusicTrack[] = data.data || [];

          // 分離系統音樂和使用者音樂
          const systemTracks = tracks.filter((t) => t.is_system);
          const userTracks = tracks.filter((t) => !t.is_system);

          set({
            systemTracks,
            userMusicTracks: userTracks,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '載入音樂庫失敗';
          set({ error: errorMessage, isLoading: false });
        }
      },

      fetchPlaylists: async () => {
        try {
          set({ isLoading: true, error: null });

          const playlists = await api.get<Playlist[]>('/playlists');
          set({ playlists, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '載入播放清單失敗';
          set({ error: errorMessage, isLoading: false });
        }
      },

      saveGeneratedMusic: async (music: GeneratedMusic) => {
        try {
          set({ isLoading: true, error: null });

          const savedTrack = await api.post<{ id: string }>('/music', music);
          const trackId: string = savedTrack.id;

          // 重新載入音樂庫
          await get().fetchUserMusic();

          set({ isLoading: false });
          return trackId;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '儲存音樂失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      deleteMusic: async (trackId: string) => {
        try {
          set({ isLoading: true, error: null });

          await api.delete(`/music/${trackId}`);

          // 樂觀更新
          set((state) => ({
            userMusicTracks: state.userMusicTracks.filter((t) => t.id !== trackId),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '刪除音樂失敗';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // === Actions: Realtime 同步 ===
      subscribeToPlaylistChanges: () => {
        /**
         * 實作 Requirements 18: 跨裝置即時同步（5 秒內完成）
         *
         * 實作策略：輕量級輪詢（Polling）
         * - 每 5 秒輪詢一次 fetchPlaylists API
         * - 當 tab 不可見時暫停輪詢（節省電池和流量）
         * - 靜默更新（不觸發 loading 狀態，避免 UI 閃爍）
         *
         * 為何選擇輪詢而非 WebSocket/SSE：
         * 1. P3 優先級，避免過度工程化（符合 CLAUDE.md 原則）
         * 2. 5 秒延遲足夠滿足需求（非即時聊天，不需毫秒級同步）
         * 3. 實作簡單，無需後端 WebSocket 基礎設施
         * 4. 未來可升級為 WebSocket（保持介面相容）
         */

        const SYNC_INTERVAL = 5000; // 5 秒（符合 Requirements 18）

        // 靜默同步函式（不觸發 loading 狀態）
        const silentSync = async () => {
          try {
            // 只在 tab 可見時同步（省電）
            if (document.visibilityState === 'hidden') {
              return;
            }

            const playlists = await api.get<Playlist[]>('/playlists');

            // 只更新 playlists，不觸發 loading/error 狀態
            // 比較是否有變化（避免不必要的 re-render）
            const currentPlaylists = get().playlists;
            const hasChanges = JSON.stringify(currentPlaylists) !== JSON.stringify(playlists);

            if (hasChanges) {
              set({ playlists });
              console.log('[PlaylistStore] Synced playlists from server (changes detected)');
            }
          } catch (error) {
            // 靜默失敗（不干擾使用者體驗）
            console.warn('[PlaylistStore] Silent sync failed:', error);
          }
        };

        // 啟動輪詢
        const intervalId = setInterval(silentSync, SYNC_INTERVAL);

        // 監聽 visibility change（tab 切換時立即同步）
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            silentSync();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        console.log('[PlaylistStore] Realtime sync started (polling every 5s)');

        // 返回取消訂閱函式
        return () => {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          console.log('[PlaylistStore] Realtime sync stopped');
        };
      },

      // === Actions: 錯誤處理 ===
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // === Internal Actions ===
      _setPlaylists: (playlists: Playlist[]) => set({ playlists }),
      _setUserMusicTracks: (tracks: MusicTrack[]) => set({ userMusicTracks: tracks }),
      _setSystemTracks: (tracks: MusicTrack[]) => set({ systemTracks: tracks }),
      _setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: STORAGE_KEY,
      // 只持久化特定欄位
      partialize: (state) => ({
        currentPlaylistId: state.currentPlaylistId,
        // 注意：playlists 和 tracks 不持久化，每次啟動時重新載入
      }),
    }
  )
);

/**
 * Hook: 取得播放清單清單
 */
export const usePlaylists = () =>
  usePlaylistStore((state) => ({
    playlists: state.playlists,
    currentPlaylistId: state.currentPlaylistId,
    selectPlaylist: state.selectPlaylist,
    fetchPlaylists: state.fetchPlaylists,
  }));

/**
 * Hook: 取得音樂庫
 */
export const useMusicLibrary = () =>
  usePlaylistStore((state) => ({
    systemTracks: state.systemTracks,
    userTracks: state.userMusicTracks,
    fetchUserMusic: state.fetchUserMusic,
  }));

/**
 * Hook: 播放清單管理
 */
export const usePlaylistManagement = () =>
  usePlaylistStore((state) => ({
    createPlaylist: state.createPlaylist,
    deletePlaylist: state.deletePlaylist,
    renamePlaylist: state.renamePlaylist,
    addTrackToPlaylist: state.addTrackToPlaylist,
    removeTrackFromPlaylist: state.removeTrackFromPlaylist,
    reorderPlaylistTracks: state.reorderPlaylistTracks,
  }));
