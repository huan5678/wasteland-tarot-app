/**
 * PlaylistSheet - Complete Playlist Sheet Component
 * 播放清單 Sheet 元件（完整功能）
 *
 * Task 21: 實作 PlaylistSheet 完整功能
 * Requirements 3.1, 3.2, 3.3, 3.4, 5.5, 5.6, 7.1, 7.2
 */

'use client';

import React, { useState, useMemo, useDeferredValue } from 'react';
import { PixelIcon } from '@/components/ui/icons/PixelIcon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle } from
'@/components/ui/sheet';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { PlaylistList } from './PlaylistList';
import { PlaylistEditor } from './PlaylistEditor';
import type { Playlist } from '@/lib/audio/playlistTypes';

// ============================================================================
// Types
// ============================================================================
import { Button } from "@/components/ui/button";
export interface PlaylistSheetProps {
  /** Sheet 是否開啟（外部控制） */
  open?: boolean;
  /** Sheet 開啟/關閉回調 */
  onOpenChange?: (open: boolean) => void;
  /** 自訂樣式類別 */
  className?: string;
}

/**
 * Sheet 模式
 */
type SheetMode = 'list' | 'create' | 'edit';

// ============================================================================
// Component
// ============================================================================

/**
 * PlaylistSheet - 播放清單 Sheet 主元件（完整功能）
 *
 * Features:
 * - 列表模式：顯示所有播放清單
 * - 建立模式：建立新播放清單
 * - 編輯模式：編輯現有播放清單
 * - 搜尋功能：過濾播放清單（使用 useDeferredValue 優化效能）
 * - 空狀態提示
 * - 響應式設計（桌面 400px / 行動 90vw）
 *
 * @example
 * ```tsx
 * <PlaylistSheet open={isOpen} onOpenChange={setIsOpen} />
 * ```
 */
export function PlaylistSheet({
  open: controlledOpen,
  onOpenChange,
  className
}: PlaylistSheetProps) {
  // ========== Hooks ==========
  const { isSheetOpen, openSheet, closeSheet } = useMusicPlayer();
  const playlists = usePlaylistStore((state) => state.playlists);

  // ========== State ==========
  const [mode, setMode] = useState<SheetMode>('list');
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ========== Deferred Values (效能優化) ==========
  // Requirements 7.2: 使用 useDeferredValue 優化搜尋效能
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // ========== Controlled / Uncontrolled ==========
  // 必須在 useFocusTrap 之前定義 isOpen
  const isOpen = controlledOpen !== undefined ? controlledOpen : isSheetOpen;
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      open ? openSheet() : closeSheet();
    }

    // 關閉時重置模式和搜尋
    if (!open) {
      setMode('list');
      setSearchQuery('');
      setEditingPlaylistId(null);
    }
  };

  // ========== Focus Management ==========
  // Task 28: 焦點陷阱 - 當 Sheet 開啟時限制焦點在 Sheet 內
  const sheetContentRef = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    autoFocus: true,
    restoreFocus: true,
    onEscape: () => handleOpenChange(false)
  });

  // ========== Computed Values ==========

  /**
   * 過濾後的播放清單
   * Requirements 7.1: 搜尋框過濾播放清單
   */
  const filteredPlaylists = useMemo(() => {
    if (!deferredSearchQuery.trim()) {
      return playlists;
    }

    const query = deferredSearchQuery.toLowerCase();
    return playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(query)
    );
  }, [playlists, deferredSearchQuery]);

  // ========== Handlers ==========

  /**
   * 處理新增播放清單按鈕
   */
  const handleCreateNew = () => {
    logger.info('[PlaylistSheet] Switching to create mode');
    setMode('create');
    setEditingPlaylistId(null);
  };

  /**
   * 處理編輯播放清單
   */
  const handleEditPlaylist = (playlistId: string) => {
    logger.info('[PlaylistSheet] Switching to edit mode', { playlistId });
    setMode('edit');
    setEditingPlaylistId(playlistId);
  };

  /**
   * 處理播放播放清單（關閉 Sheet）
   */
  const handlePlayPlaylist = (playlistId: string) => {
    logger.info('[PlaylistSheet] Playing playlist, closing sheet', { playlistId });
    handleOpenChange(false);
  };

  /**
   * 處理刪除播放清單
   */
  const handleDeletePlaylist = (playlistId: string) => {
    logger.info('[PlaylistSheet] Playlist deleted', { playlistId });
    // 如果正在編輯被刪除的播放清單，回到列表模式
    if (mode === 'edit' && editingPlaylistId === playlistId) {
      setMode('list');
      setEditingPlaylistId(null);
    }
  };

  /**
   * 處理儲存播放清單（建立或編輯）
   */
  const handleSavePlaylist = (playlist: Playlist) => {
    logger.info('[PlaylistSheet] Playlist saved', { playlistId: playlist.id });
    setMode('list');
    setEditingPlaylistId(null);
  };

  /**
   * 處理取消編輯
   */
  const handleCancelEdit = () => {
    logger.info('[PlaylistSheet] Cancelled edit/create');
    setMode('list');
    setEditingPlaylistId(null);
  };

  /**
   * 處理清除搜尋
   */
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // ========== Render ==========
  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        ref={sheetContentRef}
        side="right"
        className={cn(
          // Base Layout
          'w-[90vw] md:w-[400px] h-full flex flex-col',
          // Pip-Boy Theme
          'bg-black border-2 border-pip-boy-green',
          'text-pip-boy-green',
          // CRT Scanline Effect
          'before:absolute before:inset-0 before:pointer-events-none before:z-10',
          'before:bg-[linear-gradient(transparent_50%,rgba(0,255,136,0.03)_50%)]',
          'before:bg-[length:100%_4px]',
          // Glow Effect
          'shadow-[0_0_20px_rgba(0,255,136,0.3)]',
          // Custom Styles
          className
        )}
        aria-label="播放清單"
        aria-live="polite"
        aria-atomic="false"
        data-testid="playlist-sheet">

        {/* Header - 標題列 */}
        <SheetHeader className="border-b-2 border-pip-boy-green pb-4 flex-shrink-0">
          <SheetTitle className="text-pip-boy-green text-xl">
            {mode === 'list' && '播放清單'}
            {mode === 'create' && '新增播放清單'}
            {mode === 'edit' && '編輯播放清單'}
          </SheetTitle>

          {/* Search Bar (List mode only) */}
          {mode === 'list' && playlists.length > 0 &&
          <div className="relative mt-4">
              <PixelIcon name="search" sizePreset="xs" className="absolute left-3 top-1/2 -translate-y-1/2 text-pip-boy-green/50" decorative />
              <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋播放清單..."
              className={cn(
                'w-full pl-10 pr-10 py-2 rounded',
                'bg-black border-2 border-pip-boy-green/30',
                'text-pip-boy-green text-sm placeholder:text-pip-boy-green/30',
                'focus:outline-none focus:border-pip-boy-green focus:ring-2 focus:ring-pip-boy-green/30',
                'transition-all duration-200'
              )}
              aria-label="搜尋播放清單"
              data-testid="search-playlists-input" />

              {searchQuery &&
            <Button size="icon" variant="link"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            aria-label="清除搜尋">

                  <PixelIcon name="close" sizePreset="xs" decorative />
                </Button>
            }
            </div>
          }
        </SheetHeader>

        {/* Content Area - 可滾動區域 */}
        <div className="flex-1 overflow-y-auto py-6 px-6 relative z-0 min-h-0">
          {/* List Mode */}
          {mode === 'list' &&
          <>
              {filteredPlaylists.length > 0 ?
            <PlaylistList
              onPlayPlaylist={handlePlayPlaylist}
              onEditPlaylist={handleEditPlaylist}
              onDeletePlaylist={handleDeletePlaylist} /> :

            playlists.length === 0 ?
            // Empty State (No playlists)
            <div className="flex flex-col items-center justify-center h-full text-center text-pip-boy-green/50">
                  <p className="text-sm">尚無播放清單</p>
                  <p className="text-xs mt-2">點擊下方按鈕建立第一個播放清單</p>
                </div> :

            // Empty State (No search results)
            <div className="flex flex-col items-center justify-center h-full text-center text-pip-boy-green/50">
                  <p className="text-sm mb-2">找不到符合的播放清單</p>
                  <p className="text-xs">請嘗試其他搜尋關鍵字</p>
                </div>
            }
            </>
          }

          {/* Create Mode */}
          {mode === 'create' &&
          <PlaylistEditor
            mode="create"
            onSave={handleSavePlaylist}
            onCancel={handleCancelEdit} />

          }

          {/* Edit Mode */}
          {mode === 'edit' && editingPlaylistId &&
          <PlaylistEditor
            mode="edit"
            playlistId={editingPlaylistId}
            onSave={handleSavePlaylist}
            onCancel={handleCancelEdit} />

          }
        </div>

        {/* Fixed Bottom Button (List mode only) */}
        {mode === 'list' &&
        <div className="border-t-2 border-pip-boy-green pt-4 px-6 pb-6 flex-shrink-0">
            <Button size="default" variant="default"
          onClick={handleCreateNew}
          className="{expression}"






          aria-label="新增播放清單"
          data-testid="create-playlist-button">

              <PixelIcon name="add" sizePreset="sm" decorative />
              新增播放清單
            </Button>
          </div>
        }
      </SheetContent>
    </Sheet>);

}

PlaylistSheet.displayName = 'PlaylistSheet';