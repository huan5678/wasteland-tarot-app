/**
 * PlaylistList - Playlist List Component
 * 播放清單列表元件
 *
 * Task 18: 實作 PlaylistList 播放清單列表元件
 * Requirements 3.1, 3.2, 3.3, 5.6
 */

'use client';

import React, { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons/PixelIcon';
import { AnimatePresence, motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface PlaylistListProps {
  /** 當點擊播放按鈕時的回調 */
  onPlayPlaylist?: (playlistId: string) => void;
  /** 當點擊編輯按鈕時的回調 */
  onEditPlaylist?: (playlistId: string) => void;
  /** 當點擊刪除按鈕時的回調 */
  onDeletePlaylist?: (playlistId: string) => void;
  /** 自訂樣式類別 */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PlaylistList - 播放清單列表元件
 *
 * Features:
 * - 顯示所有播放清單卡片
 * - 每個卡片包含：名稱、音樂模式數量、建立時間、操作按鈕
 * - 當前播放的播放清單高亮顯示
 * - 支援列表新增/刪除動畫
 * - 播放按鈕：載入播放清單並自動播放第一首
 *
 * @example
 * ```tsx
 * <PlaylistList
 *   onPlayPlaylist={(id) => console.log('Play:', id)}
 *   onEditPlaylist={(id) => console.log('Edit:', id)}
 *   onDeletePlaylist={(id) => console.log('Delete:', id)}
 * />
 * ```
 */
export function PlaylistList({
  onPlayPlaylist,
  onEditPlaylist,
  onDeletePlaylist,
  className,
}: PlaylistListProps) {
  // ========== Hooks ==========
  const playlists = usePlaylistStore((state) => state.playlists);
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);
  const currentPlaylist = useMusicPlayerStore((state) => state.currentPlaylist);
  const loadPlaylist = useMusicPlayerStore((state) => state.loadPlaylist);
  const playMode = useMusicPlayerStore((state) => state.playMode);
  const getPlaylistById = usePlaylistStore((state) => state.getPlaylistById);

  // ========== State ==========
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ========== Handlers ==========

  /**
   * 處理播放按鈕點擊
   * Requirements 3.2: 點擊播放按鈕時載入播放清單並自動播放第一首
   */
  const handlePlay = async (playlistId: string) => {
    try {
      logger.info(`[PlaylistList] Playing playlist: ${playlistId}`);

      // 載入播放清單
      loadPlaylist(playlistId);

      // 取得播放清單的第一個音樂模式
      const playlist = getPlaylistById(playlistId);
      if (playlist && playlist.modes.length > 0) {
        const firstMode = playlist.modes[0];
        await playMode(firstMode);
      }

      // 執行外部回調
      onPlayPlaylist?.(playlistId);
    } catch (error) {
      logger.error('[PlaylistList] Failed to play playlist', { playlistId, error });
    }
  };

  /**
   * 處理編輯按鈕點擊
   */
  const handleEdit = (playlistId: string) => {
    logger.info(`[PlaylistList] Editing playlist: ${playlistId}`);
    onEditPlaylist?.(playlistId);
  };

  /**
   * 處理刪除按鈕點擊
   * Requirements 3.3: 點擊刪除按鈕時移除播放清單
   */
  const handleDelete = (playlistId: string) => {
    logger.info(`[PlaylistList] Deleting playlist: ${playlistId}`);

    // 設定刪除中狀態（用於動畫）
    setDeletingId(playlistId);

    // 延遲刪除以顯示動畫
    setTimeout(() => {
      deletePlaylist(playlistId);
      setDeletingId(null);
      onDeletePlaylist?.(playlistId);
    }, 300);
  };

  /**
   * 格式化相對時間
   */
  const formatRelativeTime = (date: Date): string => {
    try {
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: zhTW,
      });
    } catch (error) {
      logger.warn('[PlaylistList] Failed to format date', { error });
      return '未知時間';
    }
  };

  // ========== Empty State ==========
  if (playlists.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center h-full',
          'text-pip-boy-green/50 text-center',
          className
        )}
      >
        <p className="text-sm mb-2">尚無播放清單</p>
        <p className="text-xs">點擊「新增播放清單」建立第一個播放清單</p>
      </div>
    );
  }

  // ========== Render ==========
  return (
    <div
      className={cn('space-y-4', className)}
      role="list"
      aria-label="播放清單列表"
      data-testid="playlist-list"
    >
      <AnimatePresence mode="popLayout">
        {playlists.map((playlist) => {
          const isCurrentPlaylist = playlist.id === currentPlaylist;
          const isDeleting = playlist.id === deletingId;

          return (
            <motion.div
              key={playlist.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                // Base Layout
                'relative p-4 rounded-md',
                'border-2 transition-all duration-300',
                // Pip-Boy Theme
                'bg-black/60',
                // Current Playlist Highlight
                isCurrentPlaylist
                  ? 'border-pip-boy-green shadow-[0_0_15px_rgba(0,255,136,0.5)]'
                  : 'border-pip-boy-green/30 hover:border-pip-boy-green/60',
                // Deleting State
                isDeleting && 'opacity-50 pointer-events-none',
                // Hover Effect
                !isCurrentPlaylist && 'hover:shadow-[0_0_10px_rgba(0,255,136,0.3)]'
              )}
              role="listitem"
              data-testid={`playlist-item-${playlist.id}`}
            >
              {/* Current Playlist Indicator */}
              {isCurrentPlaylist && (
                <motion.div
                  layoutId="current-playlist-indicator"
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-pip-boy-green rounded-r-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Playlist Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Playlist Name */}
                  <h3
                    className={cn(
                      'text-base font-semibold truncate',
                      isCurrentPlaylist ? 'text-pip-boy-green' : 'text-pip-boy-green/80'
                    )}
                  >
                    {playlist.name}
                  </h3>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-1 text-xs text-pip-boy-green/50">
                    <span>{playlist.modes.length} 首</span>
                    <span>•</span>
                    <span>{formatRelativeTime(playlist.createdAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Play Button */}
                  <button
                    onClick={() => handlePlay(playlist.id)}
                    className={cn(
                      'p-2 rounded transition-all duration-200',
                      'border border-pip-boy-green/30',
                      'hover:border-pip-boy-green hover:bg-pip-boy-green/10',
                      'focus:outline-none focus:ring-2 focus:ring-pip-boy-green',
                      'disabled:opacity-30 disabled:cursor-not-allowed'
                    )}
                    aria-label={`播放 ${playlist.name}`}
                    data-testid={`play-playlist-${playlist.id}`}
                    disabled={isDeleting}
                  >
                    <PixelIcon name="play" sizePreset="xs" variant="primary" decorative />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(playlist.id)}
                    className={cn(
                      'p-2 rounded transition-all duration-200',
                      'border border-pip-boy-green/30',
                      'hover:border-pip-boy-green hover:bg-pip-boy-green/10',
                      'focus:outline-none focus:ring-2 focus:ring-pip-boy-green',
                      'disabled:opacity-30 disabled:cursor-not-allowed'
                    )}
                    aria-label={`編輯 ${playlist.name}`}
                    data-testid={`edit-playlist-${playlist.id}`}
                    disabled={isDeleting}
                  >
                    <PixelIcon name="edit" sizePreset="xs" variant="primary" decorative />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(playlist.id)}
                    className={cn(
                      'p-2 rounded transition-all duration-200',
                      'border border-red-500/30',
                      'hover:border-red-500 hover:bg-red-500/10',
                      'focus:outline-none focus:ring-2 focus:ring-red-500',
                      'disabled:opacity-30 disabled:cursor-not-allowed'
                    )}
                    aria-label={`刪除 ${playlist.name}`}
                    data-testid={`delete-playlist-${playlist.id}`}
                    disabled={isDeleting}
                  >
                    <PixelIcon name="delete" sizePreset="xs" variant="error" decorative />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

PlaylistList.displayName = 'PlaylistList';
