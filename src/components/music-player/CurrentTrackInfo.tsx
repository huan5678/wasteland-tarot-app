'use client';

/**
 * CurrentTrackInfo - 當前曲目資訊組件
 * Task 5.6: 實作 CurrentTrackInfo 當前曲目資訊
 * Feature: playlist-music-player
 * Requirements: 需求 4.13, 需求 30.9
 */

import React from 'react';
import { UserRhythmPreset } from '@/lib/stores/rhythmPlaylistStore';

export interface CurrentTrackInfoProps {
  pattern: UserRhythmPreset | null;
  playlistName?: string;
}

/**
 * CurrentTrackInfo - 顯示當前播放的曲目資訊
 *
 * 顯示內容：
 * - Pattern 名稱（大字體）
 * - Pattern 描述
 * - 播放清單名稱
 */
export function CurrentTrackInfo({ pattern, playlistName }: CurrentTrackInfoProps) {
  if (!pattern) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-pip-boy-green/50 text-sm uppercase tracking-wider">
          沒有正在播放的曲目
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Pattern 名稱（大字體） */}
      <h2
        className="
          text-2xl md:text-3xl font-bold
          text-pip-boy-green
          uppercase tracking-wider
          drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]
        "
      >
        {pattern.name}
      </h2>

      {/* Pattern 描述 */}
      {pattern.description && (
        <p className="text-sm md:text-base text-pip-boy-green/80 leading-relaxed">
          {pattern.description}
        </p>
      )}

      {/* 播放清單名稱 */}
      {playlistName && (
        <div className="flex items-center gap-2 mt-2">
          <div className="h-px flex-1 bg-pip-boy-green/30" />
          <p className="text-xs text-pip-boy-green/60 uppercase tracking-wider">
            來自播放清單：{playlistName}
          </p>
          <div className="h-px flex-1 bg-pip-boy-green/30" />
        </div>
      )}

      {/* 系統預設標記 */}
      {pattern.isSystemPreset && (
        <div className="flex items-center gap-2 mt-1">
          <span
            className="
              px-2 py-1 text-xs uppercase
              border border-radiation-orange/50
              text-radiation-orange
              rounded
            "
          >
            系統預設
          </span>
        </div>
      )}

      {/* 公開分享標記 */}
      {pattern.isPublic && !pattern.isSystemPreset && (
        <div className="flex items-center gap-2 mt-1">
          <span
            className="
              px-2 py-1 text-xs uppercase
              border border-pip-boy-green/50
              text-pip-boy-green
              rounded
            "
          >
            公開分享
          </span>
        </div>
      )}
    </div>
  );
}
