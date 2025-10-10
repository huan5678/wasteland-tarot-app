/**
 * Playlist Store - Zustand state management for playlists
 * 播放清單狀態管理
 *
 * Task 6: 建立 playlistStore (播放清單管理)
 * Task 30: localStorage 配額超限處理
 * Task 31: 播放清單損壞恢復邏輯
 * Requirements 3.1, 3.2, 3.3, 3.4, 6.1, 6.3, 10.1, 10.3, 10.4
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Playlist, MusicMode } from '@/lib/audio/playlistTypes';
import { validatePlaylist, PlaylistValidationError, MUSIC_MODES } from '@/lib/audio/playlistTypes';
import { logger } from '@/lib/logger';
import { createMusicPlayerError, MusicPlayerErrorType, getErrorHandler } from '@/lib/audio/errorHandler';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Playlist Store 介面
 * Requirements 3.1, 3.2, 3.3, 3.4
 */
export interface PlaylistStore {
  // ========== State ==========
  playlists: Playlist[];

  // ========== CRUD Actions ==========
  createPlaylist: (name: string, modes?: MusicMode[]) => string;  // 回傳 UUID
  updatePlaylist: (id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => void;
  deletePlaylist: (id: string) => void;
  reorderPlaylistModes: (id: string, modes: MusicMode[]) => void;
  addModeToPlaylist: (playlistId: string, mode: MusicMode) => void;
  removeModeFromPlaylist: (playlistId: string, modeIndex: number) => void;

  // ========== Query Actions ==========
  getPlaylistById: (id: string) => Playlist | undefined;
  getAllPlaylists: () => Playlist[];
  getPlaylistModes: (id: string) => MusicMode[] | null;

  // ========== Utility Actions ==========
  reset: () => void;
  clearError: () => void;
  setError: (error: Error | null) => void;

  // ========== Error State ==========
  lastError: Error | null;
}

// ============================================================================
// Default State
// ============================================================================

const DEFAULT_STATE = {
  playlists: [] as Playlist[],
  lastError: null as Error | null,
};

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Task 31: 驗證播放清單陣列是否有效
 * Requirements 10.4: 播放清單損壞恢復
 *
 * @param playlists - 待驗證的播放清單陣列
 * @returns 驗證通過的播放清單陣列（過濾掉損壞的項目）
 */
function validatePlaylists(playlists: unknown): Playlist[] {
  // 檢查是否為陣列
  if (!Array.isArray(playlists)) {
    logger.error('[validatePlaylists] Playlists is not an array', { type: typeof playlists });
    return [];
  }

  // 過濾並驗證每個播放清單
  const validPlaylists: Playlist[] = [];

  for (const playlist of playlists) {
    try {
      // 基本型別檢查
      if (!playlist || typeof playlist !== 'object') {
        logger.warn('[validatePlaylists] Invalid playlist object', { playlist });
        continue;
      }

      // 檢查必要欄位
      if (
        typeof playlist.id !== 'string' ||
        typeof playlist.name !== 'string' ||
        !Array.isArray(playlist.modes)
      ) {
        logger.warn('[validatePlaylists] Missing required fields', { playlist });
        continue;
      }

      // 驗證 modes 陣列
      if (
        playlist.modes.length < 1 ||
        playlist.modes.length > 20 ||
        !playlist.modes.every((m: unknown) => typeof m === 'string' && MUSIC_MODES.includes(m as MusicMode))
      ) {
        logger.warn('[validatePlaylists] Invalid modes array', { playlist });
        continue;
      }

      // 處理時間欄位 (可能是字串或 Date 物件)
      let createdAt: Date;
      let updatedAt: Date;

      if (playlist.createdAt instanceof Date) {
        createdAt = playlist.createdAt;
      } else if (typeof playlist.createdAt === 'string') {
        createdAt = new Date(playlist.createdAt);
        if (isNaN(createdAt.getTime())) {
          logger.warn('[validatePlaylists] Invalid createdAt date', { playlist });
          continue;
        }
      } else {
        logger.warn('[validatePlaylists] Missing createdAt', { playlist });
        continue;
      }

      if (playlist.updatedAt instanceof Date) {
        updatedAt = playlist.updatedAt;
      } else if (typeof playlist.updatedAt === 'string') {
        updatedAt = new Date(playlist.updatedAt);
        if (isNaN(updatedAt.getTime())) {
          logger.warn('[validatePlaylists] Invalid updatedAt date', { playlist });
          continue;
        }
      } else {
        logger.warn('[validatePlaylists] Missing updatedAt', { playlist });
        continue;
      }

      // 建立有效的播放清單物件
      const validPlaylist: Playlist = {
        id: playlist.id,
        name: playlist.name.trim(),
        modes: playlist.modes as MusicMode[],
        createdAt,
        updatedAt,
      };

      // 使用完整驗證函數
      validatePlaylist(validPlaylist);

      // 通過所有驗證，新增到有效清單
      validPlaylists.push(validPlaylist);
    } catch (error) {
      logger.error('[validatePlaylists] Validation failed for playlist', { playlist, error });
      // 繼續處理下一個播放清單
      continue;
    }
  }

  logger.info('[validatePlaylists] Validation complete', {
    total: playlists.length,
    valid: validPlaylists.length,
    invalid: playlists.length - validPlaylists.length,
  });

  return validPlaylists;
}

/**
 * 驗證播放清單名稱
 * Requirements 3.1: 播放清單名稱限制為 1-50 字元
 */
function validatePlaylistName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new PlaylistValidationError('播放清單名稱必須是字串');
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 1 || trimmedName.length > 50) {
    throw new PlaylistValidationError('播放清單名稱長度必須在 1-50 個字元之間');
  }
}

/**
 * 驗證音樂模式陣列
 * Requirements 3.2: 音樂模式數量限制為 1-20 個
 */
function validateModes(modes: MusicMode[]): void {
  if (!Array.isArray(modes)) {
    throw new PlaylistValidationError('音樂模式必須是陣列');
  }

  if (modes.length < 1 || modes.length > 20) {
    throw new PlaylistValidationError('播放清單必須包含 1-20 個音樂模式');
  }
}

/**
 * 檢查 UUID 唯一性
 */
function isUniqueId(id: string, playlists: Playlist[]): boolean {
  return !playlists.some((playlist) => playlist.id === id);
}

// ============================================================================
// Zustand Store Implementation
// ============================================================================

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      // ========== Initial State ==========
      ...DEFAULT_STATE,

      // ========== CRUD Actions ==========

      /**
       * 建立播放清單
       * Requirements 3.1: 建立新的播放清單
       * Task 30: localStorage 配額超限處理
       *
       * @param name - 播放清單名稱 (1-50 字元)
       * @param modes - 音樂模式陣列 (可選，預設為空陣列)
       * @returns 新建立的播放清單 UUID
       * @throws {PlaylistValidationError} 當驗證失敗時
       * @throws {MusicPlayerError} 當 localStorage 寫入失敗且無法恢復時
       */
      createPlaylist: (name: string, modes: MusicMode[] = []) => {
        const errorHandler = getErrorHandler();
        const MAX_RETRY_ATTEMPTS = 3; // Task 30: 最多重試 3 次
        let retryAttempt = 0;

        const attemptCreate = (): string => {
          try {
            // 驗證名稱
            validatePlaylistName(name);

            // 如果提供了 modes，驗證它們
            if (modes.length > 0) {
              validateModes(modes);
            }

            // 生成唯一 UUID
            let id = uuidv4();
            const { playlists } = get();

            // 確保 UUID 唯一性 (理論上 uuid v4 碰撞機率極低，但還是檢查)
            while (!isUniqueId(id, playlists)) {
              id = uuidv4();
            }

            // 建立新播放清單
            const now = new Date();
            const newPlaylist: Playlist = {
              id,
              name: name.trim(),
              modes,
              createdAt: now,
              updatedAt: now,
            };

            // 驗證完整播放清單 (確保符合所有規則)
            validatePlaylist(newPlaylist);

            logger.info(`[playlistStore] Creating playlist: ${name}`, { id, modesCount: modes.length });

            // 更新 store (這裡可能觸發 localStorage 寫入)
            set((state) => ({
              playlists: [...state.playlists, newPlaylist],
              lastError: null,
            }));

            return id;
          } catch (error) {
            // Task 30: 處理 localStorage 配額超限錯誤
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              retryAttempt++;

              const storageError = createMusicPlayerError(
                MusicPlayerErrorType.STORAGE_WRITE_FAILED,
                `localStorage 配額已滿 (重試 ${retryAttempt}/${MAX_RETRY_ATTEMPTS})`,
                retryAttempt < MAX_RETRY_ATTEMPTS,
                error
              );

              errorHandler.handleError(storageError);
              set({ lastError: storageError });

              const { playlists } = get();

              // 檢查是否還有可清理的播放清單
              if (playlists.length === 0) {
                logger.error('[playlistStore] No playlists to clean, storage quota exhausted');
                throw createMusicPlayerError(
                  MusicPlayerErrorType.STORAGE_WRITE_FAILED,
                  'localStorage 配額已滿，且無可清理的播放清單',
                  false,
                  error
                );
              }

              // 檢查重試次數
              if (retryAttempt >= MAX_RETRY_ATTEMPTS) {
                logger.error('[playlistStore] Max retry attempts reached, giving up');
                throw createMusicPlayerError(
                  MusicPlayerErrorType.STORAGE_WRITE_FAILED,
                  `localStorage 配額已滿，重試 ${MAX_RETRY_ATTEMPTS} 次後仍失敗`,
                  false,
                  error
                );
              }

              // 清理最舊的播放清單
              const sortedPlaylists = [...playlists].sort(
                (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
              );

              const oldestPlaylist = sortedPlaylists[0];
              logger.warn(`[playlistStore] Removing oldest playlist to free space: ${oldestPlaylist.name}`, {
                id: oldestPlaylist.id,
                createdAt: oldestPlaylist.createdAt,
              });

              // 移除最舊的播放清單
              set({ playlists: sortedPlaylists.slice(1) });

              // 等待一小段時間讓 localStorage 清理完成
              // 注意：這裡使用同步延遲，因為 Zustand actions 不支援 async
              // 在實際場景中，persist middleware 會自動處理序列化

              // 重試建立
              logger.info('[playlistStore] Retrying createPlaylist after cleanup');
              return attemptCreate();
            }

            // 其他錯誤
            errorHandler.handleError(error as Error);
            set({ lastError: error as Error });
            throw error;
          }
        };

        return attemptCreate();
      },

      /**
       * 更新播放清單
       * Requirements 3.3: 編輯播放清單
       *
       * @param id - 播放清單 ID
       * @param updates - 要更新的欄位
       * @throws {Error} 當播放清單不存在時
       */
      updatePlaylist: (id: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => {
        const { playlists } = get();
        const playlistIndex = playlists.findIndex((p) => p.id === id);

        if (playlistIndex === -1) {
          const error = new Error(`播放清單不存在: ${id}`);
          logger.error('[playlistStore] Playlist not found', { id });
          set({ lastError: error });
          throw error;
        }

        try {
          // 驗證更新內容
          if (updates.name !== undefined) {
            validatePlaylistName(updates.name);
          }

          if (updates.modes !== undefined) {
            validateModes(updates.modes);
          }

          const now = new Date();
          const updatedPlaylist: Playlist = {
            ...playlists[playlistIndex],
            ...updates,
            updatedAt: now,
          };

          // 驗證更新後的播放清單
          validatePlaylist(updatedPlaylist);

          logger.info(`[playlistStore] Updating playlist: ${id}`, updates);

          // 更新 store
          const newPlaylists = [...playlists];
          newPlaylists[playlistIndex] = updatedPlaylist;

          set({ playlists: newPlaylists, lastError: null });
        } catch (error) {
          const errorHandler = getErrorHandler();
          errorHandler.handleError(error as Error);
          set({ lastError: error as Error });
          throw error;
        }
      },

      /**
       * 刪除播放清單
       * Requirements 3.4: 刪除播放清單
       *
       * @param id - 播放清單 ID
       */
      deletePlaylist: (id: string) => {
        const { playlists } = get();
        const playlistIndex = playlists.findIndex((p) => p.id === id);

        if (playlistIndex === -1) {
          logger.warn('[playlistStore] Attempted to delete non-existent playlist', { id });
          return;
        }

        logger.info(`[playlistStore] Deleting playlist: ${id}`);

        const newPlaylists = playlists.filter((p) => p.id !== id);
        set({ playlists: newPlaylists, lastError: null });
      },

      /**
       * 重新排序播放清單中的音樂模式
       * Requirements 3.4: 調整播放清單中的音樂順序
       *
       * @param id - 播放清單 ID
       * @param modes - 新的音樂模式陣列
       */
      reorderPlaylistModes: (id: string, modes: MusicMode[]) => {
        try {
          validateModes(modes);

          logger.info(`[playlistStore] Reordering playlist modes: ${id}`, { modes });

          get().updatePlaylist(id, { modes });
        } catch (error) {
          const errorHandler = getErrorHandler();
          errorHandler.handleError(error as Error);
          set({ lastError: error as Error });
          throw error;
        }
      },

      /**
       * 新增音樂模式至播放清單
       * Requirements 3.2: 將音樂模式新增至播放清單
       *
       * @param playlistId - 播放清單 ID
       * @param mode - 音樂模式
       */
      addModeToPlaylist: (playlistId: string, mode: MusicMode) => {
        const playlist = get().getPlaylistById(playlistId);

        if (!playlist) {
          const error = new Error(`播放清單不存在: ${playlistId}`);
          set({ lastError: error });
          throw error;
        }

        const newModes = [...playlist.modes, mode];

        try {
          validateModes(newModes);

          logger.info(`[playlistStore] Adding mode to playlist: ${playlistId}`, { mode });

          get().updatePlaylist(playlistId, { modes: newModes });
        } catch (error) {
          const errorHandler = getErrorHandler();
          errorHandler.handleError(error as Error);
          set({ lastError: error as Error });
          throw error;
        }
      },

      /**
       * 從播放清單移除音樂模式
       * Requirements 3.3: 從播放清單移除音樂模式
       *
       * @param playlistId - 播放清單 ID
       * @param modeIndex - 要移除的模式索引
       */
      removeModeFromPlaylist: (playlistId: string, modeIndex: number) => {
        const playlist = get().getPlaylistById(playlistId);

        if (!playlist) {
          const error = new Error(`播放清單不存在: ${playlistId}`);
          set({ lastError: error });
          throw error;
        }

        if (modeIndex < 0 || modeIndex >= playlist.modes.length) {
          const error = new Error(`無效的模式索引: ${modeIndex}`);
          set({ lastError: error });
          throw error;
        }

        const newModes = playlist.modes.filter((_, index) => index !== modeIndex);

        try {
          // 確保至少保留 1 個模式
          if (newModes.length < 1) {
            throw new PlaylistValidationError('播放清單必須至少包含 1 個音樂模式');
          }

          logger.info(`[playlistStore] Removing mode from playlist: ${playlistId}`, { modeIndex });

          get().updatePlaylist(playlistId, { modes: newModes });
        } catch (error) {
          const errorHandler = getErrorHandler();
          errorHandler.handleError(error as Error);
          set({ lastError: error as Error });
          throw error;
        }
      },

      // ========== Query Actions ==========

      /**
       * 根據 ID 取得播放清單
       *
       * @param id - 播放清單 ID
       * @returns 播放清單物件，若不存在則回傳 undefined
       */
      getPlaylistById: (id: string) => {
        const { playlists } = get();
        return playlists.find((p) => p.id === id);
      },

      /**
       * 取得所有播放清單
       *
       * @returns 所有播放清單陣列
       */
      getAllPlaylists: () => {
        return get().playlists;
      },

      /**
       * 取得播放清單的音樂模式陣列
       *
       * @param id - 播放清單 ID
       * @returns 音樂模式陣列，若播放清單不存在則回傳 null
       */
      getPlaylistModes: (id: string) => {
        const playlist = get().getPlaylistById(id);
        return playlist ? playlist.modes : null;
      },

      // ========== Utility Actions ==========

      /**
       * 重置狀態至預設值
       */
      reset: () => {
        logger.info('[playlistStore] Resetting state');
        set({ ...DEFAULT_STATE });
      },

      /**
       * 清除錯誤
       */
      clearError: () => {
        set({ lastError: null });
      },

      /**
       * 設定錯誤
       */
      setError: (error: Error | null) => {
        set({ lastError: error });
      },
    }),
    {
      name: 'wasteland-tarot-playlists', // localStorage key
      // Requirements 6.1, 6.3: 持久化播放清單至 localStorage
      partialize: (state) => ({
        playlists: state.playlists.map((playlist) => ({
          ...playlist,
          // 將 Date 物件序列化為 ISO 字串
          createdAt: playlist.createdAt.toISOString(),
          updatedAt: playlist.updatedAt.toISOString(),
        })),
      }),
      // Task 31: 從 localStorage 載入時驗證並修復損壞的資料
      // Requirements 10.4: 播放清單損壞恢復
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        logger.info('[playlistStore] Rehydrating from localStorage');

        try {
          // 驗證並清理播放清單
          const validatedPlaylists = validatePlaylists(state.playlists);

          if (validatedPlaylists.length !== (state.playlists || []).length) {
            // 有損壞的播放清單被移除
            const removedCount = (state.playlists || []).length - validatedPlaylists.length;

            logger.warn('[playlistStore] Corrupted playlists detected and removed', {
              total: (state.playlists || []).length,
              valid: validatedPlaylists.length,
              removed: removedCount,
            });

            // 更新狀態
            state.playlists = validatedPlaylists;

            // 記錄錯誤到 ErrorHandler
            const errorHandler = getErrorHandler();
            const corruptionError = createMusicPlayerError(
              MusicPlayerErrorType.PLAYLIST_CORRUPTED,
              `偵測到 ${removedCount} 個損壞的播放清單已被移除`,
              false // 不可恢復，已自動修復
            );
            errorHandler.handleError(corruptionError);

            // 設定錯誤狀態 (可選：用於顯示 Toast)
            state.lastError = corruptionError;
          } else {
            // 所有播放清單有效
            state.playlists = validatedPlaylists;
            logger.info('[playlistStore] All playlists validated successfully');
          }
        } catch (error) {
          // 嚴重錯誤：無法驗證播放清單，清空資料
          logger.error('[playlistStore] Fatal error during rehydration, clearing all playlists', { error });

          const errorHandler = getErrorHandler();
          errorHandler.handleError(error as Error);

          // 清空所有播放清單
          state.playlists = [];
          state.lastError = createMusicPlayerError(
            MusicPlayerErrorType.PLAYLIST_CORRUPTED,
            '播放清單資料嚴重損壞，已重置為預設值',
            false
          );
        }
      },
    }
  )
);

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook: 取得所有播放清單 (僅 ID 和名稱)
 */
export const usePlaylistSummaries = () =>
  usePlaylistStore((state) =>
    state.playlists.map((p) => ({
      id: p.id,
      name: p.name,
      modesCount: p.modes.length,
    }))
  );

/**
 * Hook: 取得特定播放清單
 */
export const usePlaylist = (id: string | null) =>
  usePlaylistStore((state) =>
    id ? state.playlists.find((p) => p.id === id) : undefined
  );
