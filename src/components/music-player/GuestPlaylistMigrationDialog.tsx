/**
 * GuestPlaylistMigrationDialog - 訪客播放清單匯入對話框
 * Task 7.3: 首次登入時檢測並匯入訪客播放清單
 * Requirements 34.1-34.8
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { guestPlaylistManager } from '@/lib/localStorage/guestPlaylistManager';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/authStore';

/**
 * GuestPlaylistMigrationDialog Props
 */
export interface GuestPlaylistMigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (playlistId: string) => void;
}

/**
 * GuestPlaylistMigrationDialog Component
 * 訪客轉註冊使用者時的播放清單匯入對話框
 */
export function GuestPlaylistMigrationDialog({
  isOpen,
  onClose,
  onImportSuccess,
}: GuestPlaylistMigrationDialogProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();

  // ========== State ==========
  const [guestPlaylist, setGuestPlaylist] = useState<ReturnType<
    typeof guestPlaylistManager.loadFromLocalStorage
  > | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== Effects ==========
  // 檢測 localStorage 中的訪客播放清單
  useEffect(() => {
    if (isOpen) {
      const playlist = guestPlaylistManager.loadFromLocalStorage();
      setGuestPlaylist(playlist);
    }
  }, [isOpen]);

  // ========== Handlers ==========
  /**
   * 匯入訪客播放清單到使用者帳號
   */
  const handleImport = async () => {
    if (!guestPlaylist) return;

    setIsImporting(true);
    setError(null);

    try {
      // 檢查使用者是否已登入
      if (!user) {
        throw new Error('未登入');
      }

      // 呼叫匯入 API（使用 httpOnly cookies 進行認證）
      const response = await fetch('/api/v1/playlists/import-guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // 自動發送 httpOnly cookies
        body: JSON.stringify({
          guestPlaylist: guestPlaylistManager.exportForMigration(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 處理部分 Pattern ID 無效的情況
        if (errorData.error === 'INVALID_PATTERN_ID') {
          const validCount =
            guestPlaylist.patterns.length -
            (errorData.invalidPatternIds?.length || 0);
          toast({
            title: '部分歌曲無法匯入',
            description: `部分歌曲已無法使用（${
              errorData.invalidPatternIds?.length || 0
            } 首），已匯入其餘 ${validCount} 首歌曲`,
            variant: 'warning',
          });
          // 仍清除 localStorage
          guestPlaylistManager.clearPlaylist();
          onClose();
          return;
        }

        throw new Error(errorData.message || '匯入失敗');
      }

      // 匯入成功
      const data = await response.json();
      guestPlaylistManager.clearPlaylist();

      toast({
        title: '匯入成功',
        description: `已成功匯入 ${data.patternCount} 首歌曲到「訪客播放清單（已匯入）」`,
        variant: 'success',
      });

      if (onImportSuccess) {
        onImportSuccess(data.playlistId);
      }

      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      setError(errorMessage);
      toast({
        title: '匯入失敗',
        description: `${errorMessage}。你的訪客播放清單已保留，可稍後重試。`,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * 跳過匯入並清除 localStorage
   */
  const handleSkip = () => {
    guestPlaylistManager.clearPlaylist();
    toast({
      title: '已跳過',
      description: '訪客播放清單已清除',
    });
    onClose();
  };

  // ========== Render ==========
  if (!guestPlaylist || guestPlaylist.patterns.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-wasteland-darker border-2 border-pip-boy-green text-pip-boy-green sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PixelIcon
              name="upload"
              sizePreset="sm"
              variant="primary"
              decorative
            />
            匯入訪客播放清單
          </DialogTitle>
          <DialogDescription className="text-pip-boy-green/70">
            你在訪客模式時建立了播放清單
          </DialogDescription>
        </DialogHeader>

        {/* Playlist Info */}
        <div className="py-4">
          <div className="bg-pip-boy-green/5 border border-pip-boy-green/30 p-4 rounded">
            <div className="flex items-center gap-3 mb-3">
              <PixelIcon
                name="playlist"
                sizePreset="md"
                variant="primary"
                decorative
              />
              <div>
                <div className="text-lg font-bold">
                  {guestPlaylist.patterns.length} 首歌曲
                </div>
                <div className="text-xs text-pip-boy-green/60">
                  等待匯入到你的帳號
                </div>
              </div>
            </div>

            <p className="text-sm text-pip-boy-green/80">
              是否要將這些歌曲匯入到你的帳號中？
              <br />
              匯入後將建立新播放清單：「訪客播放清單（已匯入）」
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 p-3 rounded">
              <div className="flex items-start gap-2">
                <PixelIcon
                  name="alert"
                  sizePreset="xs"
                  variant="error"
                  decorative
                />
                <div className="text-sm text-red-400">{error}</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {/* Skip Button */}
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isImporting}
            className="border-pip-boy-green/30 text-pip-boy-green hover:bg-pip-boy-green/10"
          >
            <PixelIcon
              name="close"
              sizePreset="xs"
              decorative
              className="mr-2"
            />
            跳過
          </Button>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="bg-pip-boy-green text-black hover:bg-pip-boy-bright"
          >
            {isImporting ? (
              <>
                <PixelIcon
                  name="loader"
                  sizePreset="xs"
                  animation="spin"
                  decorative
                  className="mr-2"
                />
                匯入中...
              </>
            ) : (
              <>
                <PixelIcon
                  name="check"
                  sizePreset="xs"
                  decorative
                  className="mr-2"
                />
                匯入到我的帳號
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Warning */}
        <div className="text-xs text-pip-boy-green/50 text-center pt-2 border-t border-pip-boy-green/20">
          <PixelIcon
            name="info"
            sizePreset="xs"
            variant="info"
            decorative
            className="inline mr-1"
          />
          匯入後訪客播放清單將自動清除
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * useGuestPlaylistMigration Hook
 * 自動檢測訪客播放清單並顯示匯入對話框
 */
export function useGuestPlaylistMigration() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    const checkForGuestPlaylist = () => {
      // 等待 authStore 載入完成
      if (isLoading) return;

      // 檢查使用者是否已登入
      if (!user) return;

      // 檢查 localStorage 是否有訪客播放清單
      const guestPlaylist = guestPlaylistManager.loadFromLocalStorage();
      if (guestPlaylist && guestPlaylist.patterns.length > 0) {
        // 檢查是否已顯示過匯入對話框（避免重複提示）
        const hasShownMigrationDialog = sessionStorage.getItem(
          'hasShownMigrationDialog'
        );
        if (!hasShownMigrationDialog) {
          setIsOpen(true);
          sessionStorage.setItem('hasShownMigrationDialog', 'true');
        }
      }
    };

    checkForGuestPlaylist();
  }, [user, isLoading]);

  return {
    isOpen,
    onClose: () => setIsOpen(false),
  };
}
