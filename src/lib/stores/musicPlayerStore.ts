/**
 * MusicPlayerStore - 播放器狀態管理
 * Task 5.1-5.3: 建立 musicPlayerStore 基礎架構與播放控制
 * Requirements: 2, 4, 6
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MusicMode } from '../audio/ProceduralMusicEngine';

/**
 * 循環模式
 */
export type RepeatMode = 'off' | 'one' | 'all';

/**
 * 播放器狀態
 */
export interface MusicPlayerState {
  // === Drawer 狀態 ===
  isDrawerOpen: boolean;
  isDrawerMinimized: boolean;

  // === 播放狀態 ===
  currentMode: MusicMode | null;
  isPlaying: boolean;
  volume: number; // 0.0-1.0
  repeatMode: RepeatMode;
  shuffleMode: boolean;

  // === 播放清單狀態 ===
  currentPlaylistId: string | null;
  currentTrackIndex: number;

  // === 效能狀態 ===
  isLoading: boolean;
  error: string | null;

  // === Actions: Drawer 控制 ===
  setDrawerOpen: (open: boolean) => void;
  setDrawerMinimized: (minimized: boolean) => void;
  toggleDrawer: () => void;

  // === Actions: 播放控制 ===
  playMode: (mode: MusicMode) => void;
  pauseMusic: () => void;
  resumeMusic: () => void;
  stopMusic: () => void;
  nextMode: () => void;
  previousMode: () => void;
  setVolume: (volume: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffleMode: (shuffle: boolean) => void;
  toggleShuffle: () => void;

  // === Actions: 播放清單控制 ===
  setCurrentPlaylist: (playlistId: string | null) => void;
  setCurrentTrackIndex: (index: number) => void;

  // === Actions: 錯誤處理 ===
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

/**
 * 預設音樂模式順序
 * Requirements 1.1: 4 種預設音樂模式
 */
const DEFAULT_MUSIC_MODES: MusicMode[] = ['synthwave', 'divination', 'lofi', 'ambient'];

/**
 * localStorage 儲存鍵值
 * Requirements 6: 狀態持久化
 */
const STORAGE_KEY = 'wasteland-tarot-music-player';

/**
 * MusicPlayerStore - 音樂播放器狀態管理
 */
export const useMusicPlayerStore = create<MusicPlayerState>()(
  persist(
    (set, get) => ({
      // === 初始狀態 ===
      isDrawerOpen: false,
      isDrawerMinimized: false,
      currentMode: null,
      isPlaying: false,
      volume: 0.5,
      repeatMode: 'off',
      shuffleMode: false,
      currentPlaylistId: null,
      currentTrackIndex: 0,
      isLoading: false,
      error: null,

      // === Actions: Drawer 控制 ===
      setDrawerOpen: (open: boolean) => set({ isDrawerOpen: open }),

      setDrawerMinimized: (minimized: boolean) =>
        set({ isDrawerMinimized: minimized }),

      toggleDrawer: () =>
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      // === Actions: 播放控制 ===
      playMode: (mode: MusicMode) =>
        set({
          currentMode: mode,
          isPlaying: true,
          error: null,
        }),

      pauseMusic: () => set({ isPlaying: false }),

      resumeMusic: () => {
        const state = get();
        if (state.currentMode) {
          set({ isPlaying: true });
        }
      },

      stopMusic: () =>
        set({
          isPlaying: false,
          currentMode: null,
        }),

      nextMode: () => {
        const state = get();
        if (!state.currentMode) return;

        const { repeatMode, shuffleMode } = state;
        let nextMode: MusicMode | null = null;

        // 單曲循環模式：保持當前模式
        if (repeatMode === 'one') {
          nextMode = state.currentMode;
        }
        // 隨機模式：隨機選擇（排除當前模式）
        else if (shuffleMode) {
          const availableModes = DEFAULT_MUSIC_MODES.filter(
            (m) => m !== state.currentMode
          );
          const randomIndex = Math.floor(Math.random() * availableModes.length);
          nextMode = availableModes[randomIndex];
        }
        // 正常模式：下一首
        else {
          const currentIndex = DEFAULT_MUSIC_MODES.indexOf(state.currentMode);
          const nextIndex = (currentIndex + 1) % DEFAULT_MUSIC_MODES.length;
          nextMode = DEFAULT_MUSIC_MODES[nextIndex];

          // 列表循環模式：循環播放
          if (nextIndex === 0 && repeatMode !== 'all') {
            // 如果不是列表循環，播放完最後一首後停止
            set({ isPlaying: false, currentMode: null });
            return;
          }
        }

        set({ currentMode: nextMode, isPlaying: true });
      },

      previousMode: () => {
        const state = get();
        if (!state.currentMode) return;

        const { shuffleMode } = state;

        // 隨機模式：隨機選擇（排除當前模式）
        if (shuffleMode) {
          const availableModes = DEFAULT_MUSIC_MODES.filter(
            (m) => m !== state.currentMode
          );
          const randomIndex = Math.floor(Math.random() * availableModes.length);
          set({ currentMode: availableModes[randomIndex], isPlaying: true });
          return;
        }

        // 正常模式：上一首
        const currentIndex = DEFAULT_MUSIC_MODES.indexOf(state.currentMode);
        const prevIndex =
          (currentIndex - 1 + DEFAULT_MUSIC_MODES.length) %
          DEFAULT_MUSIC_MODES.length;
        set({ currentMode: DEFAULT_MUSIC_MODES[prevIndex], isPlaying: true });
      },

      setVolume: (volume: number) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }),

      setRepeatMode: (mode: RepeatMode) => set({ repeatMode: mode }),

      setShuffleMode: (shuffle: boolean) => set({ shuffleMode: shuffle }),

      toggleShuffle: () => set((state) => ({ shuffleMode: !state.shuffleMode })),

      // === Actions: 播放清單控制 ===
      setCurrentPlaylist: (playlistId: string | null) =>
        set({ currentPlaylistId: playlistId }),

      setCurrentTrackIndex: (index: number) =>
        set({ currentTrackIndex: index }),

      // === Actions: 錯誤處理 ===
      setError: (error: string | null) => set({ error }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      // 只持久化特定欄位
      // Requirements 6: 狀態持久化
      partialize: (state) => ({
        currentMode: state.currentMode,
        volume: state.volume,
        repeatMode: state.repeatMode,
        shuffleMode: state.shuffleMode,
        isDrawerMinimized: state.isDrawerMinimized,
      }),
    }
  )
);

/**
 * Hook: 取得 Drawer 狀態
 */
export const useDrawerState = () =>
  useMusicPlayerStore((state) => ({
    isOpen: state.isDrawerOpen,
    isMinimized: state.isDrawerMinimized,
    setOpen: state.setDrawerOpen,
    setMinimized: state.setDrawerMinimized,
    toggle: state.toggleDrawer,
  }));

/**
 * Hook: 取得播放狀態
 */
export const usePlaybackState = () =>
  useMusicPlayerStore((state) => ({
    currentMode: state.currentMode,
    isPlaying: state.isPlaying,
    volume: state.volume,
    repeatMode: state.repeatMode,
    shuffleMode: state.shuffleMode,
    playMode: state.playMode,
    pauseMusic: state.pauseMusic,
    resumeMusic: state.resumeMusic,
    stopMusic: state.stopMusic,
    nextMode: state.nextMode,
    previousMode: state.previousMode,
    setVolume: state.setVolume,
    setRepeatMode: state.setRepeatMode,
    toggleShuffle: state.toggleShuffle,
  }));

/**
 * Hook: 取得錯誤狀態
 */
export const usePlayerError = () =>
  useMusicPlayerStore((state) => ({
    error: state.error,
    isLoading: state.isLoading,
    setError: state.setError,
    clearError: state.clearError,
  }));
