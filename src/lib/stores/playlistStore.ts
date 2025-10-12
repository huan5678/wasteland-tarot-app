/**
 * PlaylistStore - 播放清單狀態管理
 * Task 6.1-6.5: 建立 playlistStore 與播放清單管理
 * Requirements: 3, 6, 16-19
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
 * API Base URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

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

      deletePlaylist: async (playlistId: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '刪除播放清單失敗');
          }

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

          const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ name: newName }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '重新命名失敗');
          }

          const updatedPlaylist = await response.json();

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

          const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ track_id: trackId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '加入音樂失敗');
          }

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

          const response = await fetch(
            `${API_BASE_URL}/playlists/${playlistId}/tracks/${trackId}`,
            {
              method: 'DELETE',
              credentials: 'include',
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '移除音樂失敗');
          }

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

          const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks/reorder`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ track_ids: trackIds }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '重新排序失敗');
          }

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

          const response = await fetch(`${API_BASE_URL}/music`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('載入音樂庫失敗');
          }

          const data = await response.json();
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

          const response = await fetch(`${API_BASE_URL}/playlists`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('載入播放清單失敗');
          }

          const playlists: Playlist[] = await response.json();
          set({ playlists, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '載入播放清單失敗';
          set({ error: errorMessage, isLoading: false });
        }
      },

      saveGeneratedMusic: async (music: GeneratedMusic) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch(`${API_BASE_URL}/music`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(music),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '儲存音樂失敗');
          }

          const savedTrack = await response.json();
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

          const response = await fetch(`${API_BASE_URL}/music/${trackId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '刪除音樂失敗');
          }

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
        // TODO: Implement Supabase Realtime subscription
        // Requirements 18: 跨裝置即時同步
        console.log('[PlaylistStore] Realtime subscription not yet implemented');
        return () => {
          console.log('[PlaylistStore] Unsubscribed from Realtime');
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
