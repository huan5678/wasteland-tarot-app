'use client';

/**
 * GuestPlaylistManager - 訪客播放清單管理組件
 * Task 5.4: 實作 GuestPlaylistManager 訪客播放清單管理
 * Feature: playlist-music-player
 * Requirements: 需求 33.4-33.8
 */

import React, { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { guestPlaylistManager } from '@/lib/localStorage/guestPlaylistManager';
import type { UserRhythmPreset } from '@/lib/stores/rhythmPlaylistStore';

export interface GuestPlaylistManagerProps {
  onRegisterClick: () => void;
  className?: string;
}

/**
 * GuestPlaylistManager - 管理訪客的 localStorage 播放清單
 *
 * 功能：
 * - 顯示訪客播放清單（上限 4 首）
 * - 加入/移除歌曲
 * - 已滿時顯示警告並引導註冊
 * - 資料清除警告提示
 */
export function GuestPlaylistManager({
  onRegisterClick,
  className,
}: GuestPlaylistManagerProps) {
  // ========== State ==========
  const [patternCount, setPatternCount] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const [patterns, setPatterns] = useState<UserRhythmPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ========== Constants ==========
  const MAX_GUEST_PATTERNS = 4;
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

  // ========== Effects ==========

  /**
   * 載入訪客播放清單
   */
  useEffect(() => {
    loadGuestPlaylist();
  }, []);

  /**
   * 從 localStorage 和 API 載入完整 Pattern 資料
   */
  const loadGuestPlaylist = async () => {
    try {
      setIsLoading(true);

      // 從 localStorage 載入 Pattern IDs
      const playlist = guestPlaylistManager.loadFromLocalStorage();
      const count = guestPlaylistManager.getPatternCount();
      const full = guestPlaylistManager.isFull();

      setPatternCount(count);
      setIsFull(full);

      if (!playlist || playlist.patterns.length === 0) {
        setPatterns([]);
        return;
      }

      // 批次獲取 Pattern 詳情
      const patternIds = playlist.patterns.map((p) => p.patternId);
      const response = await fetch(`${API_BASE_URL}/music/presets/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patternIds }),
      });

      if (!response.ok) {
        throw new Error('載入歌曲資料失敗');
      }

      const data = await response.json();
      setPatterns(data.patterns || []);
    } catch (error) {
      console.error('[GuestPlaylistManager] Failed to load:', error);
      // 即使失敗也顯示 localStorage 中的數量
      const count = guestPlaylistManager.getPatternCount();
      setPatternCount(count);
      setIsFull(count >= MAX_GUEST_PATTERNS);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== Handlers ==========

  /**
   * 移除 Pattern
   */
  const handleRemovePattern = (patternId: string) => {
    guestPlaylistManager.removePattern(patternId);
    loadGuestPlaylist(); // 重新載入
  };

  /**
   * 清空播放清單
   */
  const handleClearPlaylist = () => {
    if (confirm('確定要清空訪客播放清單嗎？此操作無法復原。')) {
      guestPlaylistManager.clearPlaylist();
      loadGuestPlaylist(); // 重新載入
    }
  };

  // ========== Render ==========

  return (
    <div className={`flex flex-col gap-4 ${className || ''}`}>
      {/* 標題和統計 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-pip-boy-green uppercase tracking-wider">
          訪客播放清單（{patternCount}/{MAX_GUEST_PATTERNS} 首）
        </h3>
        {patternCount > 0 && (
          <button
            onClick={handleClearPlaylist}
            className="
              text-xs text-red-500
              hover:text-red-400
              transition-colors
            "
            aria-label="清空播放清單"
          >
            清空
          </button>
        )}
      </div>

      {/* 已滿警告 */}
      {isFull && (
        <div
          className="
            p-3 rounded
            bg-radiation-orange/10
            border border-radiation-orange/50
          "
        >
          <div className="flex items-start gap-2">
            <PixelIcon
              name="alert-triangle"
              sizePreset="sm"
              variant="warning"
              decorative
            />
            <div className="flex-1 text-xs text-radiation-orange">
              <p className="font-bold">播放清單已滿（上限 {MAX_GUEST_PATTERNS} 首）</p>
              <p className="mt-1">
                <button
                  onClick={onRegisterClick}
                  className="underline hover:text-radiation-orange-bright"
                >
                  立即註冊
                </button>
                以解除限制
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 資料清除警告 */}
      <div
        className="
          p-3 rounded
          bg-pip-boy-green/5
          border border-pip-boy-green/30
        "
      >
        <div className="flex items-start gap-2">
          <PixelIcon name="info" sizePreset="xs" variant="info" decorative />
          <p className="text-xs text-pip-boy-green/70">
            訪客播放清單儲存在瀏覽器中，清除瀏覽器資料後將會遺失。建議註冊帳號以永久保存。
          </p>
        </div>
      </div>

      {/* 載入中 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <PixelIcon
            name="loader"
            sizePreset="md"
            variant="primary"
            animation="spin"
            decorative
          />
          <span className="ml-2 text-sm text-pip-boy-green">載入中...</span>
        </div>
      )}

      {/* 歌曲列表 */}
      {!isLoading && patterns.length > 0 && (
        <div className="space-y-2">
          {patterns.map((pattern, index) => (
            <div
              key={pattern.id}
              className="
                p-3 rounded
                bg-pip-boy-green/5 border border-pip-boy-green/30
                hover:bg-pip-boy-green/10 hover:border-pip-boy-green/50
                transition-all duration-200
              "
            >
              <div className="flex items-start gap-3">
                {/* 順序編號 */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold text-pip-boy-green/70 border border-pip-boy-green/30 rounded">
                  {index + 1}
                </div>

                {/* 歌曲資訊 */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-pip-boy-green truncate">
                    {pattern.name}
                  </h4>
                  {pattern.description && (
                    <p className="text-xs text-pip-boy-green/70 mt-1 line-clamp-1">
                      {pattern.description}
                    </p>
                  )}
                </div>

                {/* 移除按鈕 */}
                <button
                  onClick={() => handleRemovePattern(pattern.id)}
                  className="
                    flex-shrink-0 p-2
                    text-red-500 bg-red-500/10
                    border border-red-500/50
                    rounded hover:bg-red-500 hover:text-white
                    transition-all duration-200
                  "
                  aria-label={`移除 ${pattern.name}`}
                >
                  <PixelIcon name="trash" sizePreset="xs" decorative />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空狀態 */}
      {!isLoading && patterns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <PixelIcon name="music-off" sizePreset="lg" variant="muted" decorative />
          <p className="mt-4 text-sm text-pip-boy-green/50">
            播放清單是空的
          </p>
          <p className="mt-2 text-xs text-pip-boy-green/40">
            瀏覽公開歌曲並加入到播放清單
          </p>
        </div>
      )}

      {/* 註冊導引（底部） */}
      {patternCount > 0 && !isFull && (
        <div className="pt-4 border-t border-pip-boy-green/30">
          <button
            onClick={onRegisterClick}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-2 rounded
              bg-pip-boy-green/10 text-pip-boy-green
              border border-pip-boy-green/50
              hover:bg-pip-boy-green hover:text-black
              transition-all duration-200
              text-sm font-semibold
            "
          >
            <PixelIcon name="user-plus" sizePreset="xs" decorative />
            註冊帳號以解除 {MAX_GUEST_PATTERNS} 首上限
          </button>
        </div>
      )}
    </div>
  );
}
