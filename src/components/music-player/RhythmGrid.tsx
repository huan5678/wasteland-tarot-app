'use client';

/**
 * RhythmGrid - 16 步驟節奏網格組件
 * Task 6.1: 實作 RhythmGrid 16 步驟網格組件
 * Feature: playlist-music-player
 * Requirements: 需求 21.1-21.9
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useRhythmEditorStore, type TrackType } from '@/lib/stores/rhythmEditorStore';
import { InstrumentTrackRow } from './InstrumentTrackRow';

/**
 * RhythmGrid 組件 - 5 × 16 節奏網格
 *
 * 功能：
 * - 顯示 5 × 16 網格（Kick, Snare, HiHat, OpenHat, Clap）
 * - 實作步驟格子切換（toggleStep）
 * - 啟用狀態：Pip-Boy 綠色（#00ff88），停用：深灰色
 * - 每 4 步驟顯示視覺分隔線
 * - 實作播放頭高亮（脈衝動畫）
 * - 響應式佈局：桌面完整網格，手機橫向捲動
 */
export const RhythmGrid: React.FC = () => {
  // 使用穩定的 selector 避免無限迴圈
  const pattern = useRhythmEditorStore((state) => state.pattern);
  const currentStep = useRhythmEditorStore((state) => state.currentStep);
  const isPlaying = useRhythmEditorStore((state) => state.isPlaying);
  const toggleStep = useRhythmEditorStore((state) => state.toggleStep);

  // 軌道列表（排列順序）
  const tracks: TrackType[] = useMemo(
    () => ['kick', 'snare', 'hihat', 'openhat', 'clap'],
    []
  );

  return (
    <div
      className="w-full overflow-x-auto"
      role="region"
      aria-label="節奏編輯器網格"
    >
      <div className="min-w-fit">
        {/* 步驟標籤（顯示 1-16） */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="w-16 sm:w-20 flex-shrink-0" aria-hidden="true" />
          <div className="flex gap-1">
            {Array.from({ length: 16 }, (_, i) => {
              const isGroupEnd = (i + 1) % 4 === 0 && i !== 15;
              return (
                <div
                  key={i}
                  className={cn(
                    'w-8 sm:w-10 text-center text-xs text-pip-boy-green/60 font-mono flex-shrink-0',
                    isGroupEnd && 'mr-1'
                  )}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* 軌道列表 */}
        <div className="flex flex-col gap-2">
          {tracks.map((track) => (
            <InstrumentTrackRow
              key={track}
              track={track}
              pattern={pattern[track]}
              currentStep={currentStep}
              isPlaying={isPlaying}
              onToggleStep={toggleStep}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

RhythmGrid.displayName = 'RhythmGrid';
