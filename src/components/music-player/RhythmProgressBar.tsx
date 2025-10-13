'use client';

/**
 * RhythmProgressBar - Pattern-Based 播放進度條組件
 * Task 5.7: 實作 ProgressBar 播放進度條
 * Feature: playlist-music-player
 * Requirements: 需求 4.13
 */

import React from 'react';

export interface RhythmProgressBarProps {
  currentStep: number;     // 當前步驟（0-15）
  currentLoop: number;     // 當前循環（1-4）
  totalSteps?: number;     // 總步驟數（預設 16）
  totalLoops?: number;     // 總循環數（預設 4）
  className?: string;
}

/**
 * RhythmProgressBar - 顯示 Pattern 播放進度
 *
 * 顯示內容：
 * - 當前步驟進度（1-16 步驟）
 * - 當前循環進度（1-4 循環）
 * - Pip-Boy 綠色進度條
 * - CRT 掃描線效果
 */
export function RhythmProgressBar({
  currentStep = 0,
  currentLoop = 1,
  totalSteps = 16,
  totalLoops = 4,
  className,
}: RhythmProgressBarProps) {
  // 計算進度百分比
  const stepProgress = ((currentStep + 1) / totalSteps) * 100;
  const loopProgress = (currentLoop / totalLoops) * 100;

  return (
    <div className={`flex flex-col gap-3 py-4 ${className || ''}`}>
      {/* 步驟進度 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-pip-boy-green/70 uppercase tracking-wider">
            步驟進度 (Steps)
          </span>
          <span className="text-xs text-pip-boy-green font-mono tabular-nums">
            {String(currentStep + 1).padStart(2, '0')} / {totalSteps}
          </span>
        </div>
        <div
          className="
            relative h-3 w-full
            bg-wasteland-darker
            border border-pip-boy-green/30
            rounded-sm
            overflow-hidden
          "
        >
          {/* 進度條填充 */}
          <div
            className="
              absolute inset-y-0 left-0
              bg-gradient-to-r from-pip-boy-green-dark to-pip-boy-green
              shadow-[0_0_10px_rgba(0,255,136,0.5)]
              transition-all duration-100 ease-linear
            "
            style={{ width: `${stepProgress}%` }}
          />
          {/* 16 步驟分隔線 */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: totalSteps - 1 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-pip-boy-green/20"
                style={{ width: `${100 / totalSteps}%` }}
              />
            ))}
          </div>
          {/* 當前步驟高亮（脈衝效果） */}
          <div
            className="
              absolute inset-y-0
              w-[6.25%]
              bg-pip-boy-bright/30
              animate-pulse
            "
            style={{
              left: `${(currentStep / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* 循環進度 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-pip-boy-green/70 uppercase tracking-wider">
            循環進度 (Loops)
          </span>
          <span className="text-xs text-radiation-orange font-mono tabular-nums">
            {currentLoop} / {totalLoops}
          </span>
        </div>
        <div
          className="
            relative h-3 w-full
            bg-wasteland-darker
            border border-radiation-orange/30
            rounded-sm
            overflow-hidden
          "
        >
          {/* 進度條填充 */}
          <div
            className="
              absolute inset-y-0 left-0
              bg-gradient-to-r from-radiation-orange-dark to-radiation-orange
              shadow-[0_0_10px_rgba(255,136,0,0.5)]
              transition-all duration-300 ease-in-out
            "
            style={{ width: `${loopProgress}%` }}
          />
          {/* 4 循環分隔線 */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: totalLoops - 1 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-radiation-orange/20"
                style={{ width: `${100 / totalLoops}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 狀態說明 */}
      <div className="flex items-center justify-between text-xs text-pip-boy-green/50 mt-1">
        <span>每個 Pattern 循環 {totalLoops} 次後自動切歌</span>
        <span className="font-mono tabular-nums">
          {((currentLoop - 1) * totalSteps + currentStep + 1)} / {totalSteps * totalLoops}
        </span>
      </div>
    </div>
  );
}
