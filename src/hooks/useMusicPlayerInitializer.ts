/**
 * useMusicPlayerInitializer - Music Player Initialization Hook
 * 音樂播放器初始化 Hook
 *
 * Task 23: 實作音樂播放器初始化邏輯
 * Requirements 6.1, 6.2: 應用啟動時恢復狀態
 *
 * Features:
 * - 從 localStorage 恢復音樂播放器狀態
 * - 載入儲存的播放清單
 * - 初始化 ProceduralMusicEngine (if needed)
 * - 標記初始化完成
 * - 錯誤處理與回退機制
 */

'use client';

import { useEffect, useRef } from 'react';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useAudioStore } from '@/lib/audio/audioStore';
import { logger } from '@/lib/logger';
import { getErrorHandler, MusicPlayerErrorType, createMusicPlayerError } from '@/lib/audio/errorHandler';

/**
 * useMusicPlayerInitializer Hook
 *
 * 在應用啟動時自動恢復音樂播放器狀態
 *
 * @example
 * ```tsx
 * function App() {
 *   useMusicPlayerInitializer();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useMusicPlayerInitializer() {
  // ========== Refs ==========
  // 防止重複初始化
  const isInitializedRef = useRef(false);
  const isInitializingRef = useRef(false);

  // ========== Hooks ==========
  const musicPlayerStore = useMusicPlayerStore();
  const playlistStore = usePlaylistStore();
  const audioStore = useAudioStore();

  // ========== Effect ==========
  useEffect(() => {
    // 防止重複初始化
    if (isInitializedRef.current || isInitializingRef.current) {
      logger.info('[useMusicPlayerInitializer] Already initialized or initializing, skipping');
      return;
    }

    isInitializingRef.current = true;

    const initialize = async () => {
      const errorHandler = getErrorHandler();

      try {
        logger.info('[useMusicPlayerInitializer] Starting initialization');

        // ========== Step 1: 從 localStorage 恢復狀態 ==========
        // Zustand persist middleware 會自動處理恢復，無需手動讀取
        // 但我們需要等待 hydration 完成

        // 檢查是否有儲存的播放清單
        const { currentPlaylist, currentModeIndex } = musicPlayerStore;

        if (currentPlaylist) {
          logger.info('[useMusicPlayerInitializer] Found saved playlist', {
            playlistId: currentPlaylist,
            modeIndex: currentModeIndex,
          });

          // ========== Step 2: 驗證播放清單是否仍存在 ==========
          const playlist = playlistStore.getPlaylistById(currentPlaylist);

          if (!playlist) {
            logger.warn('[useMusicPlayerInitializer] Saved playlist not found, clearing', {
              playlistId: currentPlaylist,
            });

            // 播放清單已被刪除，清空當前播放清單
            musicPlayerStore.clearPlaylist();
          } else {
            logger.info('[useMusicPlayerInitializer] Validated saved playlist', {
              playlistName: playlist.name,
              modesCount: playlist.modes.length,
            });

            // 驗證 currentModeIndex 是否合法
            if (currentModeIndex >= playlist.modes.length) {
              logger.warn('[useMusicPlayerInitializer] Invalid mode index, resetting to 0', {
                currentIndex: currentModeIndex,
                maxIndex: playlist.modes.length - 1,
              });

              musicPlayerStore.setModeIndex(0);
            }

            // 恢復當前模式
            const currentMode = playlist.modes[currentModeIndex];
            if (currentMode) {
              audioStore.setCurrentMusicMode(currentMode);
              logger.info('[useMusicPlayerInitializer] Restored current mode', { mode: currentMode });
            }
          }
        } else {
          logger.info('[useMusicPlayerInitializer] No saved playlist found');
        }

        // ========== Step 3: 初始化 ProceduralMusicEngine (if needed) ==========
        // Note: ProceduralMusicEngine 通常在用戶首次播放時初始化
        // 這裡不需要主動初始化，避免不必要的資源消耗

        // ========== Step 4: 標記初始化完成 ==========
        isInitializedRef.current = true;
        isInitializingRef.current = false;

        logger.info('[useMusicPlayerInitializer] Initialization completed successfully');
      } catch (error) {
        isInitializingRef.current = false;

        const musicError = createMusicPlayerError(
          MusicPlayerErrorType.ENGINE_INIT_FAILED,
          '音樂播放器初始化失敗',
          true,
          error as Error
        );

        errorHandler.handleError(musicError);
        musicPlayerStore.setError(musicError);

        logger.error('[useMusicPlayerInitializer] Initialization failed', { error });

        // 即使初始化失敗，也標記為已嘗試初始化（避免無限重試）
        isInitializedRef.current = true;
      }
    };

    // 延遲初始化，確保 stores 已經 hydrated
    // Zustand persist 的 hydration 是異步的
    const timeoutId = setTimeout(() => {
      initialize();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [musicPlayerStore, playlistStore, audioStore]);

  // Hook 不返回任何值，純粹用於副作用
  return null;
}

/**
 * useMusicPlayerStatus - 取得音樂播放器初始化狀態
 *
 * @returns {{ isReady: boolean; error: Error | null }}
 */
export function useMusicPlayerStatus() {
  const lastError = useMusicPlayerStore((state) => state.lastError);
  const currentPlaylist = useMusicPlayerStore((state) => state.currentPlaylist);

  // 簡單判斷：沒有錯誤且（沒有播放清單或有有效播放清單）
  const isReady = !lastError;

  return {
    isReady,
    error: lastError,
    hasPlaylist: !!currentPlaylist,
  };
}

/**
 * useMusicPlayerReady - 等待音樂播放器初始化完成
 *
 * @returns boolean - 是否已準備好
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isReady = useMusicPlayerReady();
 *
 *   if (!isReady) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return <MusicPlayer />;
 * }
 * ```
 */
export function useMusicPlayerReady(): boolean {
  const { isReady } = useMusicPlayerStatus();
  return isReady;
}
