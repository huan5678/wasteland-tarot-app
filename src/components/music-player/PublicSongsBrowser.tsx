'use client';

/**
 * PublicSongsBrowser - 公開歌曲瀏覽器組件
 * Task 5.3: 實作 PublicSongsBrowser 公開歌曲瀏覽器
 * Feature: playlist-music-player
 * Requirements: 需求 31.1-31.7
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { useRhythmPlaylistStore, type UserRhythmPreset } from '@/lib/stores/rhythmPlaylistStore';

/**
 * 排序選項
 */import { Button } from "@/components/ui/button";
type SortOption = 'created_at_desc' | 'created_at_asc' | 'name_asc' | 'name_desc';

export interface PublicSongsBrowserProps {
  isGuest: boolean;
  onAddToPlaylist: (patternId: string) => void;
  className?: string;
}

/**
 * PublicSongsBrowser - 瀏覽公開歌曲（系統預設 + 使用者創作）
 *
 * 功能：
 * - 顯示系統預設歌曲（5 首）
 * - 顯示公開使用者創作歌曲（UserRhythmPreset.isPublic = true）
 * - 搜尋功能（debounced）
 * - 排序功能
 * - 分頁控制
 * - 顯示創作者名稱
 */
export function PublicSongsBrowser({
  isGuest,
  onAddToPlaylist,
  className
}: PublicSongsBrowserProps) {
  // ========== State ==========
  const [systemPresets, setSystemPresets] = useState<UserRhythmPreset[]>([]);
  const [publicPresets, setPublicPresets] = useState<UserRhythmPreset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created_at_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== Constants ==========
  const ITEMS_PER_PAGE = 10;
  // Use relative path to go through Next.js API proxy
  const API_BASE_URL = '/api/v1';

  // ========== Effects ==========

  /**
   * 載入公開歌曲（debounced search）
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPublicSongs();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, sortBy, currentPage]);

  /**
   * 從 API 載入公開歌曲
   */
  const fetchPublicSongs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sort: sortBy,
        ...(searchQuery.trim() && { search: searchQuery.trim() })
      });

      const response = await fetch(`${API_BASE_URL}/music/presets/public?${params}`);

      if (!response.ok) {
        throw new Error('載入公開歌曲失敗');
      }

      const data = await response.json();

      setSystemPresets(data.systemPresets || []);
      setPublicPresets(data.publicPresets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入失敗');
      console.error('[PublicSongsBrowser] Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== Computed Values ==========

  /**
   * 過濾後的公開歌曲（前端過濾，作為後端的補充）
   */
  const filteredPublicPresets = useMemo(() => {
    if (!searchQuery.trim()) return publicPresets;

    const query = searchQuery.toLowerCase();
    return publicPresets.filter(
      (preset) =>
      preset.name.toLowerCase().includes(query) ||
      preset.description?.toLowerCase().includes(query)
    );
  }, [publicPresets, searchQuery]);

  /**
   * 計算總頁數
   */
  const totalPages = Math.ceil(filteredPublicPresets.length / ITEMS_PER_PAGE);

  // ========== Handlers ==========

  const handleAddToPlaylist = (patternId: string) => {
    onAddToPlaylist(patternId);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  // ========== Render ==========

  return (
    <div className={`flex flex-col gap-6 ${className || ''}`}>
      {/* 搜尋和排序 */}
      <div className="flex flex-col gap-3">
        {/* 搜尋框 */}
        <div className="relative">
          <PixelIcon
            name="search"
            sizePreset="xs"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-pip-boy-green/50"
            decorative />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋歌曲名稱或描述..."
            className="
              w-full pl-10 pr-10 py-2 rounded
              bg-black border-2 border-pip-boy-green/30
              text-pip-boy-green text-sm
              placeholder:text-pip-boy-green/30
              focus:outline-none focus:border-pip-boy-green
              focus:ring-2 focus:ring-pip-boy-green/30
              transition-all duration-200
            "








            aria-label="搜尋歌曲" />

          {searchQuery &&
          <Button size="icon" variant="link"
          onClick={handleClearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2\n"



          aria-label="清除搜尋">

              <PixelIcon name="close" sizePreset="xs" decorative />
            </Button>
          }
        </div>

        {/* 排序下拉選單 */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs text-pip-boy-green/70">
            排序：
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="
              px-3 py-1 rounded
              bg-black border-2 border-pip-boy-green/30
              text-pip-boy-green text-xs
              focus:outline-none focus:border-pip-boy-green
              focus:ring-2 focus:ring-pip-boy-green/30
            ">







            <option value="created_at_desc">最新建立</option>
            <option value="created_at_asc">最早建立</option>
            <option value="name_asc">名稱 A-Z</option>
            <option value="name_desc">名稱 Z-A</option>
          </select>
        </div>
      </div>

      {/* 載入中 */}
      {isLoading &&
      <div className="flex items-center justify-center py-8">
          <PixelIcon
          name="loader"
          sizePreset="md"
          variant="primary"
          animation="spin"
          decorative />

          <span className="ml-2 text-sm text-pip-boy-green">載入中...</span>
        </div>
      }

      {/* 錯誤訊息 */}
      {error &&
      <div className="p-4 bg-red-500/10 border border-red-500/50 rounded">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      }

      {/* 內容 */}
      {!isLoading && !error &&
      <>
          {/* 系統預設歌曲區塊 */}
          {systemPresets.length > 0 &&
        <div className="space-y-3">
              <h3 className="text-sm font-bold text-pip-boy-green uppercase tracking-wider flex items-center gap-2">
                <PixelIcon name="star" sizePreset="xs" variant="warning" decorative />
                系統預設歌曲
              </h3>
              <div className="space-y-2">
                {systemPresets.map((preset) =>
            <PresetCard
              key={preset.id}
              preset={preset}
              onAdd={handleAddToPlaylist} />

            )}
              </div>
            </div>
        }

          {/* 公開使用者創作區塊 */}
          {filteredPublicPresets.length > 0 &&
        <div className="space-y-3">
              <h3 className="text-sm font-bold text-pip-boy-green uppercase tracking-wider flex items-center gap-2">
                <PixelIcon name="users" sizePreset="xs" variant="primary" decorative />
                公開使用者創作
              </h3>
              <div className="space-y-2">
                {filteredPublicPresets.map((preset) =>
            <PresetCard
              key={preset.id}
              preset={preset}
              onAdd={handleAddToPlaylist}
              showCreator />

            )}
              </div>
            </div>
        }

          {/* 空狀態 */}
          {systemPresets.length === 0 && filteredPublicPresets.length === 0 &&
        <div className="flex flex-col items-center justify-center py-12 text-center">
              <PixelIcon name="music-off" sizePreset="lg" variant="muted" decorative />
              <p className="mt-4 text-sm text-pip-boy-green/50">
                找不到符合的歌曲
              </p>
            </div>
        }
        </>
      }
    </div>);

}

/**
 * PresetCard - 單一歌曲卡片
 */
interface PresetCardProps {
  preset: UserRhythmPreset;
  onAdd: (patternId: string) => void;
  showCreator?: boolean;
}

function PresetCard({ preset, onAdd, showCreator }: PresetCardProps) {
  return (
    <div
      className="
        p-3 rounded
        bg-pip-boy-green/5 border border-pip-boy-green/30
        hover:bg-pip-boy-green/10 hover:border-pip-boy-green/50
        transition-all duration-200
      ">






      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-pip-boy-green truncate">
            {preset.name}
          </h4>
          {preset.description &&
          <p className="text-xs text-pip-boy-green/70 mt-1 line-clamp-2">
              {preset.description}
            </p>
          }
          {showCreator &&
          <p className="text-xs text-pip-boy-green/50 mt-1">
              創作者：{preset.userId || '未知'}
            </p>
          }
        </div>
        <Button size="icon" variant="outline"
        onClick={() => onAdd(preset.id)}
        className="flex-shrink-0 p-2\n border rounded transition-all duration-200\n"






        aria-label={`加入 ${preset.name} 到播放清單`}>

          <PixelIcon name="add" sizePreset="xs" decorative />
        </Button>
      </div>
    </div>);

}