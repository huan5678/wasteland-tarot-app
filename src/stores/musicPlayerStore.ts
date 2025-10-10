/**
 * Music Player Store - Zustand state management for music player
 * 音樂播放器狀態管理
 *
 * Task 5: 建立 musicPlayerStore (Zustand store)
 * Requirements 1.1, 1.2, 1.3, 2.1, 4.2, 4.3, 6.1
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MusicMode, RepeatMode } from '@/lib/audio/playlistTypes';
import { useAudioStore } from '@/lib/audio/audioStore';
import { logger } from '@/lib/logger';
import { getErrorHandler, MusicPlayerErrorType, createMusicPlayerError } from '@/lib/audio/errorHandler';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fisher-Yates Shuffle 演算法
 * Task 8: 生成隨機播放佇列
 * Requirements 4.3: 隨機播放功能
 *
 * @param length - 播放清單長度
 * @param currentIndex - 當前播放索引 (確保不在第一位)
 * @returns 隨機排列的索引陣列
 */
function generateShuffleQueue(length: number, currentIndex: number): number[] {
  if (length <= 0) return [];
  if (length === 1) return [0];

  // 建立索引陣列 [0, 1, 2, ..., length-1]
  const queue: number[] = Array.from({ length }, (_, i) => i);

  // Fisher-Yates shuffle 演算法
  // 從最後一個元素開始，與前面隨機位置的元素交換
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }

  // 確保當前播放的索引不在第一位
  // 如果當前索引在第一位，則與第二個元素交換
  const currentQueueIndex = queue.indexOf(currentIndex);
  if (currentQueueIndex === 0 && length > 1) {
    // 與第二個元素交換
    [queue[0], queue[1]] = [queue[1], queue[0]];
  }

  logger.info(`[generateShuffleQueue] Generated shuffle queue`, {
    length,
    currentIndex,
    queue,
  });

  return queue;
}

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * 播放器狀態 (musicPlayerStore)
 * Requirements 1.1, 1.2, 1.3, 2.1, 4.2, 4.3, 6.1
 */
export interface MusicPlayerState {
  // ========== Playback State ==========
  currentMode: MusicMode | null;          // 當前播放模式
  isPlaying: boolean;                     // 是否正在播放
  currentPlaylist: string | null;         // 當前播放清單 ID
  currentModeIndex: number;               // 當前模式在播放清單中的索引

  // ========== Playback Settings ==========
  repeatMode: RepeatMode;                 // 循環模式 (off, one, all)
  shuffleEnabled: boolean;                // 隨機播放
  shuffleQueue: number[] | null;          // 隨機播放時的索引佇列 (Task 8)

  // ========== UI State ==========
  isDrawerOpen: boolean;                  // Drawer 是否開啟
  isDrawerMinimized: boolean;             // Drawer 是否最小化
  isSheetOpen: boolean;                   // Sheet 是否開啟

  // ========== Error State ==========
  lastError: Error | null;                // 最後一次錯誤

  // ========== Actions - Playback Control ==========
  playMode: (mode: MusicMode) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;

  // ========== Actions - Playback Settings ==========
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;              // 循環切換 repeatMode (off -> one -> all -> off)

  // ========== Actions - Drawer Control ==========
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  minimizeDrawer: () => void;
  expandDrawer: () => void;

  // ========== Actions - Sheet Control ==========
  openSheet: () => void;
  closeSheet: () => void;
  toggleSheet: () => void;

  // ========== Actions - Playlist Management ==========
  loadPlaylist: (playlistId: string) => void;
  clearPlaylist: () => void;
  setModeIndex: (index: number) => void;

  // ========== Actions - Error Handling ==========
  setError: (error: Error | null) => void;
  clearError: () => void;

  // ========== Actions - Utility ==========
  reset: () => void;                        // 重置狀態至預設值
}

// ============================================================================
// Default State
// ============================================================================

const DEFAULT_STATE = {
  // Playback State
  currentMode: null as MusicMode | null,
  isPlaying: false,
  currentPlaylist: null as string | null,
  currentModeIndex: 0,

  // Playback Settings
  repeatMode: 'off' as RepeatMode,
  shuffleEnabled: false,
  shuffleQueue: null as number[] | null,

  // UI State
  isDrawerOpen: false,
  isDrawerMinimized: false,
  isSheetOpen: false,

  // Error State
  lastError: null as Error | null,
};

// ============================================================================
// Zustand Store Implementation
// ============================================================================

export const useMusicPlayerStore = create<MusicPlayerState>()(
  persist(
    (set, get) => ({
      // ========== Initial State ==========
      ...DEFAULT_STATE,

      // ========== Actions - Playback Control ==========

      /**
       * 播放音樂模式
       * Requirements 1.1, 1.2: 音樂模式播放
       */
      playMode: async (mode: MusicMode) => {
        const errorHandler = getErrorHandler();

        try {
          logger.info(`[musicPlayerStore] Playing mode: ${mode}`);

          // 使用 ErrorHandler 重試機制
          await errorHandler.retry(
            async () => {
              // 更新 audioStore 的當前音樂模式
              useAudioStore.getState().setCurrentMusicMode(mode);
              useAudioStore.getState().setIsPlaying('music', true);

              // 更新播放器狀態
              set({
                currentMode: mode,
                isPlaying: true,
                lastError: null,
              });

              // Note: 實際的 ProceduralMusicEngine 整合將在 UI 層處理
              // 這裡只管理狀態
            },
            {
              maxRetries: 3,
              backoffMs: 200,
              onRetry: (attempt, error) => {
                logger.warn(`[musicPlayerStore] Retrying playMode (${attempt}/3)`, { error });
              },
            }
          );
        } catch (error) {
          const musicError = createMusicPlayerError(
            MusicPlayerErrorType.MODE_LOAD_FAILED,
            `Failed to play mode: ${mode}`,
            true,
            error as Error
          );

          errorHandler.handleError(musicError);
          set({ lastError: musicError, isPlaying: false });
          throw musicError;
        }
      },

      /**
       * 暫停播放
       * Requirements 2.2: 暫停音樂播放並保留播放位置
       */
      pause: () => {
        logger.info('[musicPlayerStore] Pausing music');

        useAudioStore.getState().setIsPlaying('music', false);

        set({ isPlaying: false });
      },

      /**
       * 繼續播放
       * Requirements 2.2: 繼續播放音樂
       */
      resume: () => {
        const { currentMode } = get();

        if (!currentMode) {
          logger.warn('[musicPlayerStore] No mode to resume');
          return;
        }

        logger.info('[musicPlayerStore] Resuming music');

        useAudioStore.getState().setIsPlaying('music', true);

        set({ isPlaying: true });
      },

      /**
       * 停止播放
       */
      stop: () => {
        logger.info('[musicPlayerStore] Stopping music');

        useAudioStore.getState().setIsPlaying('music', false);
        useAudioStore.getState().setCurrentMusicMode(null);

        set({
          isPlaying: false,
          currentMode: null,
        });
      },

      /**
       * 下一首
       * Requirements 2.3: 切換至播放清單中的下一個音樂模式
       * Task 8: 整合播放清單長度和隨機播放邏輯
       */
      next: () => {
        const { currentPlaylist, currentModeIndex, repeatMode, shuffleEnabled, shuffleQueue } = get();

        // 如果沒有播放清單，不做任何事
        if (!currentPlaylist) {
          logger.warn('[musicPlayerStore] No playlist loaded, cannot skip to next');
          return;
        }

        // Task 6, 8: 從 playlistStore 取得播放清單資料
        const playlistStore = require('./playlistStore').usePlaylistStore;
        const playlist = playlistStore.getState().getPlaylistById(currentPlaylist);

        if (!playlist || playlist.modes.length === 0) {
          logger.warn('[musicPlayerStore] Playlist not found or empty');
          return;
        }

        const playlistLength = playlist.modes.length;

        // Task 8: 隨機播放邏輯
        if (shuffleEnabled && shuffleQueue && shuffleQueue.length > 0) {
          // 使用隨機佇列
          const currentQueueIndex = shuffleQueue.indexOf(currentModeIndex);
          const nextQueueIndex = (currentQueueIndex + 1) % shuffleQueue.length;
          const nextModeIndex = shuffleQueue[nextQueueIndex];

          logger.info(`[musicPlayerStore] Next (shuffle): ${currentModeIndex} -> ${nextModeIndex}`);
          set({ currentModeIndex: nextModeIndex });
        } else {
          // 正常順序播放
          let nextIndex = currentModeIndex + 1;

          // Requirements 2.6: 列表循環模式
          if (nextIndex >= playlistLength) {
            if (repeatMode === 'all') {
              nextIndex = 0; // 回到第一首
            } else if (repeatMode === 'one') {
              nextIndex = currentModeIndex; // 單曲循環，停留在當前
            } else {
              nextIndex = currentModeIndex; // 停留在最後一首
            }
          }

          logger.info(`[musicPlayerStore] Next: ${currentModeIndex} -> ${nextIndex}`);
          set({ currentModeIndex: nextIndex });
        }
      },

      /**
       * 上一首
       * Requirements 2.4: 切換至播放清單中的上一個音樂模式
       * Task 8: 整合播放清單長度和隨機播放邏輯
       */
      previous: () => {
        const { currentPlaylist, currentModeIndex, repeatMode, shuffleEnabled, shuffleQueue } = get();

        if (!currentPlaylist) {
          logger.warn('[musicPlayerStore] No playlist loaded, cannot skip to previous');
          return;
        }

        // Task 6, 8: 從 playlistStore 取得播放清單資料
        const playlistStore = require('./playlistStore').usePlaylistStore;
        const playlist = playlistStore.getState().getPlaylistById(currentPlaylist);

        if (!playlist || playlist.modes.length === 0) {
          logger.warn('[musicPlayerStore] Playlist not found or empty');
          return;
        }

        const playlistLength = playlist.modes.length;

        // Task 8: 隨機播放邏輯
        if (shuffleEnabled && shuffleQueue && shuffleQueue.length > 0) {
          const currentQueueIndex = shuffleQueue.indexOf(currentModeIndex);
          const prevQueueIndex = (currentQueueIndex - 1 + shuffleQueue.length) % shuffleQueue.length;
          const prevModeIndex = shuffleQueue[prevQueueIndex];

          logger.info(`[musicPlayerStore] Previous (shuffle): ${currentModeIndex} -> ${prevModeIndex}`);
          set({ currentModeIndex: prevModeIndex });
        } else {
          // 正常順序播放
          let prevIndex = currentModeIndex - 1;

          if (prevIndex < 0) {
            if (repeatMode === 'all') {
              prevIndex = playlistLength - 1; // 回到最後一首
            } else if (repeatMode === 'one') {
              prevIndex = currentModeIndex; // 單曲循環，停留在當前
            } else {
              prevIndex = 0; // 停留在第一首
            }
          }

          logger.info(`[musicPlayerStore] Previous: ${currentModeIndex} -> ${prevIndex}`);
          set({ currentModeIndex: prevIndex });
        }
      },

      // ========== Actions - Playback Settings ==========

      /**
       * 設定循環模式
       * Requirements 2.5-2.7: 單曲循環、列表循環、關閉循環
       */
      setRepeatMode: (mode: RepeatMode) => {
        logger.info(`[musicPlayerStore] Repeat mode set to: ${mode}`);
        set({ repeatMode: mode });
      },

      /**
       * 循環切換 repeatMode
       */
      cycleRepeatMode: () => {
        const { repeatMode } = get();
        const modes: RepeatMode[] = ['off', 'one', 'all'];
        const currentIndex = modes.indexOf(repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];

        logger.info(`[musicPlayerStore] Cycling repeat mode: ${repeatMode} -> ${nextMode}`);
        set({ repeatMode: nextMode });
      },

      /**
       * 切換隨機播放
       * Requirements 4.3: 隨機播放功能
       * Task 8: 實作隨機播放邏輯
       */
      toggleShuffle: () => {
        const { shuffleEnabled, currentPlaylist, currentModeIndex } = get();
        const newShuffleEnabled = !shuffleEnabled;

        logger.info(`[musicPlayerStore] Shuffle toggled: ${shuffleEnabled} -> ${newShuffleEnabled}`);

        // Task 8: 生成或清空隨機佇列
        if (newShuffleEnabled && currentPlaylist) {
          // 需要取得播放清單長度
          // 從 playlistStore 取得播放清單資料
          const playlistStore = require('./playlistStore').usePlaylistStore;
          const playlist = playlistStore.getState().getPlaylistById(currentPlaylist);

          if (playlist && playlist.modes.length > 0) {
            // 生成隨機佇列
            const shuffleQueue = generateShuffleQueue(playlist.modes.length, currentModeIndex);

            logger.info(`[musicPlayerStore] Shuffle enabled, generated queue`, {
              playlistLength: playlist.modes.length,
              currentIndex: currentModeIndex,
              shuffleQueue,
            });

            set({ shuffleEnabled: newShuffleEnabled, shuffleQueue });
          } else {
            // 播放清單無效或為空
            logger.warn('[musicPlayerStore] Cannot shuffle: playlist invalid or empty');
            set({ shuffleEnabled: false, shuffleQueue: null });
          }
        } else {
          // 清空隨機佇列
          logger.info('[musicPlayerStore] Shuffle disabled, clearing queue');
          set({ shuffleEnabled: newShuffleEnabled, shuffleQueue: null });
        }
      },

      // ========== Actions - Drawer Control ==========

      /**
       * 開啟 Drawer
       * Requirements 5.2: Drawer 開啟
       */
      openDrawer: () => {
        logger.info('[musicPlayerStore] Opening drawer');
        set({ isDrawerOpen: true, isDrawerMinimized: false });
      },

      /**
       * 關閉 Drawer
       * Requirements 5.2: Drawer 關閉
       */
      closeDrawer: () => {
        logger.info('[musicPlayerStore] Closing drawer');
        set({ isDrawerOpen: false });
      },

      /**
       * 切換 Drawer 開啟/關閉
       */
      toggleDrawer: () => {
        const { isDrawerOpen } = get();
        logger.info(`[musicPlayerStore] Toggling drawer: ${isDrawerOpen} -> ${!isDrawerOpen}`);
        set({ isDrawerOpen: !isDrawerOpen });
      },

      /**
       * 最小化 Drawer
       * Requirements 5.2: Drawer 最小化為浮動控制條
       */
      minimizeDrawer: () => {
        logger.info('[musicPlayerStore] Minimizing drawer');
        set({ isDrawerMinimized: true });
      },

      /**
       * 展開 Drawer
       */
      expandDrawer: () => {
        logger.info('[musicPlayerStore] Expanding drawer');
        set({ isDrawerMinimized: false });
      },

      // ========== Actions - Sheet Control ==========

      /**
       * 開啟 Sheet
       * Requirements 5.5: Sheet 開啟
       * Task 25: 開啟 Sheet 時自動最小化 Drawer（避免視覺衝突）
       */
      openSheet: () => {
        logger.info('[musicPlayerStore] Opening sheet, minimizing drawer');
        set({ isSheetOpen: true, isDrawerMinimized: true });
      },

      /**
       * 關閉 Sheet
       * Requirements 5.6: Sheet 關閉
       * Task 25: 關閉 Sheet 時恢復 Drawer 原始高度（如果之前是展開狀態）
       * Note: 僅恢復 minimized 狀態，不自動展開 Drawer (UX 考量)
       */
      closeSheet: () => {
        logger.info('[musicPlayerStore] Closing sheet');
        // Note: 不自動恢復 isDrawerMinimized，讓用戶手動控制
        // 如果需要自動恢復，可以儲存 Sheet 開啟前的狀態
        set({ isSheetOpen: false });
      },

      /**
       * 切換 Sheet 開啟/關閉
       */
      toggleSheet: () => {
        const { isSheetOpen } = get();
        logger.info(`[musicPlayerStore] Toggling sheet: ${isSheetOpen} -> ${!isSheetOpen}`);
        set({ isSheetOpen: !isSheetOpen });
      },

      // ========== Actions - Playlist Management ==========

      /**
       * 載入播放清單
       * Requirements 3.1: 選擇播放清單
       */
      loadPlaylist: (playlistId: string) => {
        logger.info(`[musicPlayerStore] Loading playlist: ${playlistId}`);

        set({
          currentPlaylist: playlistId,
          currentModeIndex: 0,
          shuffleQueue: null, // 清空隨機佇列
        });
      },

      /**
       * 清空播放清單
       */
      clearPlaylist: () => {
        logger.info('[musicPlayerStore] Clearing playlist');

        set({
          currentPlaylist: null,
          currentModeIndex: 0,
          shuffleQueue: null,
        });
      },

      /**
       * 設定當前模式索引
       */
      setModeIndex: (index: number) => {
        logger.info(`[musicPlayerStore] Setting mode index: ${index}`);
        set({ currentModeIndex: index });
      },

      // ========== Actions - Error Handling ==========

      /**
       * 設定錯誤
       */
      setError: (error: Error | null) => {
        set({ lastError: error });
      },

      /**
       * 清除錯誤
       */
      clearError: () => {
        set({ lastError: null });
      },

      // ========== Actions - Utility ==========

      /**
       * 重置狀態至預設值
       */
      reset: () => {
        logger.info('[musicPlayerStore] Resetting state');
        set({ ...DEFAULT_STATE });
      },
    }),
    {
      name: 'wasteland-tarot-music-player', // localStorage key
      // Requirements 6.1: 持久化狀態至 localStorage
      partialize: (state) => ({
        repeatMode: state.repeatMode,
        shuffleEnabled: state.shuffleEnabled,
        currentPlaylist: state.currentPlaylist,
        currentModeIndex: state.currentModeIndex,
      }),
    }
  )
);

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook: 取得播放狀態
 */
export const usePlaybackState = () =>
  useMusicPlayerStore((state) => ({
    currentMode: state.currentMode,
    isPlaying: state.isPlaying,
    repeatMode: state.repeatMode,
    shuffleEnabled: state.shuffleEnabled,
  }));

/**
 * Hook: 取得 UI 狀態
 */
export const useUIState = () =>
  useMusicPlayerStore((state) => ({
    isDrawerOpen: state.isDrawerOpen,
    isDrawerMinimized: state.isDrawerMinimized,
    isSheetOpen: state.isSheetOpen,
  }));

/**
 * Hook: 取得播放清單狀態
 */
export const usePlaylistState = () =>
  useMusicPlayerStore((state) => ({
    currentPlaylist: state.currentPlaylist,
    currentModeIndex: state.currentModeIndex,
  }));
