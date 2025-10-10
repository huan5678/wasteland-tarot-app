/**
 * useMusicPlayer - Custom Hook for Music Player
 * 音樂播放器自訂 Hook
 *
 * Task 7: 實作 useMusicPlayer 自訂 Hook
 * Requirements 1.1, 1.2, 1.3, 2.1
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import { usePlaylistStore } from '@/stores/playlistStore';
import type { MusicMode, RepeatMode } from '@/lib/audio/playlistTypes';

// ============================================================================
// Types
// ============================================================================

/**
 * 播放控制方法
 */
export interface PlaybackControls {
  currentMode: MusicMode | null;
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;

  playMode: (mode: MusicMode) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
}

/**
 * 播放清單管理方法
 */
export interface PlaylistManager {
  currentPlaylist: string | null;
  currentModeIndex: number;
  playlists: Array<{
    id: string;
    name: string;
    modesCount: number;
  }>;

  loadPlaylist: (playlistId: string) => void;
  clearPlaylist: () => void;
  setModeIndex: (index: number) => void;
  getCurrentPlaylistModes: () => MusicMode[] | null;
}

/**
 * UI 控制方法
 */
export interface UIControls {
  isDrawerOpen: boolean;
  isDrawerMinimized: boolean;
  isSheetOpen: boolean;

  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  minimizeDrawer: () => void;
  expandDrawer: () => void;

  openSheet: () => void;
  closeSheet: () => void;
  toggleSheet: () => void;
}

/**
 * 完整的音樂播放器 Hook 回傳值
 */
export interface MusicPlayerHook extends PlaybackControls, UIControls {
  currentPlaylist: string | null;
  currentModeIndex: number;
  lastError: Error | null;
  clearError: () => void;
}

// ============================================================================
// Main Hook: useMusicPlayer
// ============================================================================

/**
 * 主要音樂播放器 Hook
 * Requirements 1.1, 1.2, 1.3, 2.1: 統一存取播放器狀態和控制方法
 *
 * @returns 播放控制、UI 控制和錯誤狀態
 */
export function useMusicPlayer(): MusicPlayerHook {
  // ========== State Selectors ==========
  const currentMode = useMusicPlayerStore((state) => state.currentMode);
  const isPlaying = useMusicPlayerStore((state) => state.isPlaying);
  const repeatMode = useMusicPlayerStore((state) => state.repeatMode);
  const shuffleEnabled = useMusicPlayerStore((state) => state.shuffleEnabled);
  const currentPlaylist = useMusicPlayerStore((state) => state.currentPlaylist);
  const currentModeIndex = useMusicPlayerStore((state) => state.currentModeIndex);
  const isDrawerOpen = useMusicPlayerStore((state) => state.isDrawerOpen);
  const isDrawerMinimized = useMusicPlayerStore((state) => state.isDrawerMinimized);
  const isSheetOpen = useMusicPlayerStore((state) => state.isSheetOpen);
  const lastError = useMusicPlayerStore((state) => state.lastError);

  // ========== Action Selectors ==========
  const playMode = useMusicPlayerStore((state) => state.playMode);
  const pause = useMusicPlayerStore((state) => state.pause);
  const resume = useMusicPlayerStore((state) => state.resume);
  const stop = useMusicPlayerStore((state) => state.stop);
  const next = useMusicPlayerStore((state) => state.next);
  const previous = useMusicPlayerStore((state) => state.previous);
  const setRepeatMode = useMusicPlayerStore((state) => state.setRepeatMode);
  const toggleShuffle = useMusicPlayerStore((state) => state.toggleShuffle);
  const cycleRepeatMode = useMusicPlayerStore((state) => state.cycleRepeatMode);

  const openDrawer = useMusicPlayerStore((state) => state.openDrawer);
  const closeDrawer = useMusicPlayerStore((state) => state.closeDrawer);
  const toggleDrawer = useMusicPlayerStore((state) => state.toggleDrawer);
  const minimizeDrawer = useMusicPlayerStore((state) => state.minimizeDrawer);
  const expandDrawer = useMusicPlayerStore((state) => state.expandDrawer);

  const openSheet = useMusicPlayerStore((state) => state.openSheet);
  const closeSheet = useMusicPlayerStore((state) => state.closeSheet);
  const toggleSheet = useMusicPlayerStore((state) => state.toggleSheet);

  const clearError = useMusicPlayerStore((state) => state.clearError);

  // ========== Memoized Return Value ==========
  return useMemo(
    () => ({
      // Playback State
      currentMode,
      isPlaying,
      repeatMode,
      shuffleEnabled,
      currentPlaylist,
      currentModeIndex,
      lastError,

      // Playback Controls
      playMode,
      pause,
      resume,
      stop,
      next,
      previous,
      setRepeatMode,
      toggleShuffle,
      cycleRepeatMode,

      // UI Controls
      isDrawerOpen,
      isDrawerMinimized,
      isSheetOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      minimizeDrawer,
      expandDrawer,
      openSheet,
      closeSheet,
      toggleSheet,

      // Error Handling
      clearError,
    }),
    [
      // Playback State
      currentMode,
      isPlaying,
      repeatMode,
      shuffleEnabled,
      currentPlaylist,
      currentModeIndex,
      lastError,

      // Playback Controls
      playMode,
      pause,
      resume,
      stop,
      next,
      previous,
      setRepeatMode,
      toggleShuffle,
      cycleRepeatMode,

      // UI Controls
      isDrawerOpen,
      isDrawerMinimized,
      isSheetOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      minimizeDrawer,
      expandDrawer,
      openSheet,
      closeSheet,
      toggleSheet,

      // Error Handling
      clearError,
    ]
  );
}

// ============================================================================
// Specialized Hook: usePlaybackControls
// ============================================================================

/**
 * 播放控制專用 Hook
 * 僅訂閱播放控制相關狀態，減少不必要的重新渲染
 *
 * @returns 播放控制狀態和方法
 */
export function usePlaybackControls(): PlaybackControls {
  // ========== State Selectors ==========
  const currentMode = useMusicPlayerStore((state) => state.currentMode);
  const isPlaying = useMusicPlayerStore((state) => state.isPlaying);
  const repeatMode = useMusicPlayerStore((state) => state.repeatMode);
  const shuffleEnabled = useMusicPlayerStore((state) => state.shuffleEnabled);

  // ========== Action Selectors ==========
  const playMode = useMusicPlayerStore((state) => state.playMode);
  const pause = useMusicPlayerStore((state) => state.pause);
  const resume = useMusicPlayerStore((state) => state.resume);
  const stop = useMusicPlayerStore((state) => state.stop);
  const next = useMusicPlayerStore((state) => state.next);
  const previous = useMusicPlayerStore((state) => state.previous);
  const setRepeatMode = useMusicPlayerStore((state) => state.setRepeatMode);
  const toggleShuffle = useMusicPlayerStore((state) => state.toggleShuffle);
  const cycleRepeatMode = useMusicPlayerStore((state) => state.cycleRepeatMode);

  // ========== Memoized Callbacks ==========
  const handlePlayMode = useCallback(
    (mode: MusicMode) => playMode(mode),
    [playMode]
  );

  const handlePause = useCallback(() => pause(), [pause]);
  const handleResume = useCallback(() => resume(), [resume]);
  const handleStop = useCallback(() => stop(), [stop]);
  const handleNext = useCallback(() => next(), [next]);
  const handlePrevious = useCallback(() => previous(), [previous]);

  const handleSetRepeatMode = useCallback(
    (mode: RepeatMode) => setRepeatMode(mode),
    [setRepeatMode]
  );

  const handleToggleShuffle = useCallback(() => toggleShuffle(), [toggleShuffle]);
  const handleCycleRepeatMode = useCallback(() => cycleRepeatMode(), [cycleRepeatMode]);

  // ========== Memoized Return Value ==========
  return useMemo(
    () => ({
      currentMode,
      isPlaying,
      repeatMode,
      shuffleEnabled,
      playMode: handlePlayMode,
      pause: handlePause,
      resume: handleResume,
      stop: handleStop,
      next: handleNext,
      previous: handlePrevious,
      setRepeatMode: handleSetRepeatMode,
      toggleShuffle: handleToggleShuffle,
      cycleRepeatMode: handleCycleRepeatMode,
    }),
    [
      currentMode,
      isPlaying,
      repeatMode,
      shuffleEnabled,
      handlePlayMode,
      handlePause,
      handleResume,
      handleStop,
      handleNext,
      handlePrevious,
      handleSetRepeatMode,
      handleToggleShuffle,
      handleCycleRepeatMode,
    ]
  );
}

// ============================================================================
// Specialized Hook: usePlaylistManager
// ============================================================================

/**
 * 播放清單管理專用 Hook
 * 僅訂閱播放清單相關狀態
 *
 * @returns 播放清單狀態和管理方法
 */
export function usePlaylistManager(): PlaylistManager {
  // ========== State Selectors ==========
  const currentPlaylist = useMusicPlayerStore((state) => state.currentPlaylist);
  const currentModeIndex = useMusicPlayerStore((state) => state.currentModeIndex);

  // 從 playlistStore 取得播放清單數量（用於依賴追蹤）
  const playlistsCount = usePlaylistStore((state) => state.playlists.length);
  const rawPlaylists = usePlaylistStore((state) => state.playlists);

  // Memoize playlists 摘要以避免無限循環
  const playlists = useMemo(
    () =>
      rawPlaylists.map((p) => ({
        id: p.id,
        name: p.name,
        modesCount: p.modes.length,
      })),
    [playlistsCount, rawPlaylists]
  );

  // ========== Action Selectors ==========
  const loadPlaylist = useMusicPlayerStore((state) => state.loadPlaylist);
  const clearPlaylist = useMusicPlayerStore((state) => state.clearPlaylist);
  const setModeIndex = useMusicPlayerStore((state) => state.setModeIndex);
  const getPlaylistModes = usePlaylistStore((state) => state.getPlaylistModes);

  // ========== Memoized Callbacks ==========
  const handleLoadPlaylist = useCallback(
    (playlistId: string) => loadPlaylist(playlistId),
    [loadPlaylist]
  );

  const handleClearPlaylist = useCallback(() => clearPlaylist(), [clearPlaylist]);

  const handleSetModeIndex = useCallback(
    (index: number) => setModeIndex(index),
    [setModeIndex]
  );

  const getCurrentPlaylistModes = useCallback(() => {
    if (!currentPlaylist) return null;
    return getPlaylistModes(currentPlaylist);
  }, [currentPlaylist, getPlaylistModes]);

  // ========== Memoized Return Value ==========
  return useMemo(
    () => ({
      currentPlaylist,
      currentModeIndex,
      playlists,
      loadPlaylist: handleLoadPlaylist,
      clearPlaylist: handleClearPlaylist,
      setModeIndex: handleSetModeIndex,
      getCurrentPlaylistModes,
    }),
    [
      currentPlaylist,
      currentModeIndex,
      playlists,
      handleLoadPlaylist,
      handleClearPlaylist,
      handleSetModeIndex,
      getCurrentPlaylistModes,
    ]
  );
}

// ============================================================================
// Specialized Hook: useUIControls
// ============================================================================

/**
 * UI 控制專用 Hook
 * 僅訂閱 UI 狀態
 *
 * @returns UI 控制狀態和方法
 */
export function useUIControls(): UIControls {
  // ========== State Selectors ==========
  const isDrawerOpen = useMusicPlayerStore((state) => state.isDrawerOpen);
  const isDrawerMinimized = useMusicPlayerStore((state) => state.isDrawerMinimized);
  const isSheetOpen = useMusicPlayerStore((state) => state.isSheetOpen);

  // ========== Action Selectors ==========
  const openDrawer = useMusicPlayerStore((state) => state.openDrawer);
  const closeDrawer = useMusicPlayerStore((state) => state.closeDrawer);
  const toggleDrawer = useMusicPlayerStore((state) => state.toggleDrawer);
  const minimizeDrawer = useMusicPlayerStore((state) => state.minimizeDrawer);
  const expandDrawer = useMusicPlayerStore((state) => state.expandDrawer);

  const openSheet = useMusicPlayerStore((state) => state.openSheet);
  const closeSheet = useMusicPlayerStore((state) => state.closeSheet);
  const toggleSheet = useMusicPlayerStore((state) => state.toggleSheet);

  // ========== Memoized Callbacks ==========
  const handleOpenDrawer = useCallback(() => openDrawer(), [openDrawer]);
  const handleCloseDrawer = useCallback(() => closeDrawer(), [closeDrawer]);
  const handleToggleDrawer = useCallback(() => toggleDrawer(), [toggleDrawer]);
  const handleMinimizeDrawer = useCallback(() => minimizeDrawer(), [minimizeDrawer]);
  const handleExpandDrawer = useCallback(() => expandDrawer(), [expandDrawer]);

  const handleOpenSheet = useCallback(() => openSheet(), [openSheet]);
  const handleCloseSheet = useCallback(() => closeSheet(), [closeSheet]);
  const handleToggleSheet = useCallback(() => toggleSheet(), [toggleSheet]);

  // ========== Memoized Return Value ==========
  return useMemo(
    () => ({
      isDrawerOpen,
      isDrawerMinimized,
      isSheetOpen,
      openDrawer: handleOpenDrawer,
      closeDrawer: handleCloseDrawer,
      toggleDrawer: handleToggleDrawer,
      minimizeDrawer: handleMinimizeDrawer,
      expandDrawer: handleExpandDrawer,
      openSheet: handleOpenSheet,
      closeSheet: handleCloseSheet,
      toggleSheet: handleToggleSheet,
    }),
    [
      isDrawerOpen,
      isDrawerMinimized,
      isSheetOpen,
      handleOpenDrawer,
      handleCloseDrawer,
      handleToggleDrawer,
      handleMinimizeDrawer,
      handleExpandDrawer,
      handleOpenSheet,
      handleCloseSheet,
      handleToggleSheet,
    ]
  );
}
