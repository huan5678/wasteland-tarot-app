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

/**
 * 軌道標籤映射
 */
const TRACK_LABELS: Record<TrackType, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hihat: 'HiHat',
  openhat: 'OpenHat',
  clap: 'Clap',
};

/**
 * StepButton 組件 - 單個步驟按鈕
 */
interface StepButtonProps {
  track: TrackType;
  step: number;
  isActive: boolean;
  isPlayhead: boolean;
  onClick: (track: TrackType, step: number) => void;
}

const StepButton: React.FC<StepButtonProps> = ({
  track,
  step,
  isActive,
  isPlayhead,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={cn(
        'w-full aspect-square rounded border transition-all duration-150',
        'hover:border-pip-boy-green/70 focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50',
        // 啟用狀態：Pip-Boy 綠色填滿
        isActive
          ? 'bg-pip-boy-green border-pip-boy-green shadow-sm'
          : 'bg-gray-800 border-gray-600',
        // 播放頭高亮（脈衝動畫）
        isPlayhead && 'ring-2 ring-pip-boy-green/80 animate-pulse'
      )}
      onClick={() => onClick(track, step)}
      aria-label={`${TRACK_LABELS[track]} 步驟 ${step + 1}${isActive ? ' (啟用)' : ' (停用)'}`}
      aria-pressed={isActive}
    />
  );
};

/**
 * InstrumentTrackRow 組件 - 單個樂器軌道
 */
interface InstrumentTrackRowProps {
  track: TrackType;
  pattern: boolean[];
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (track: TrackType, step: number) => void;
}

const InstrumentTrackRow: React.FC<InstrumentTrackRowProps> = ({
  track,
  pattern,
  currentStep,
  isPlaying,
  onToggleStep,
}) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* 軌道標籤 */}
      <div className="w-16 sm:w-20 text-left">
        <span className="text-pip-boy-green text-xs sm:text-sm font-medium uppercase tracking-wide">
          {TRACK_LABELS[track]}
        </span>
      </div>

      {/* 16 個步驟按鈕 */}
      <div className="flex-1 grid grid-cols-16 gap-1 sm:gap-2">
        {pattern.map((isActive, step) => {
          const isPlayhead = isPlaying && currentStep === step;
          const showDivider = step % 4 === 0 && step !== 0;

          return (
            <React.Fragment key={step}>
              {/* 每 4 步驟顯示視覺分隔線 */}
              {showDivider && (
                <div className="w-px bg-pip-boy-green/30 -mx-0.5" aria-hidden="true" />
              )}
              <StepButton
                track={track}
                step={step}
                isActive={isActive}
                isPlayhead={isPlayhead}
                onClick={onToggleStep}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

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
  const { pattern, currentStep, isPlaying, toggleStep } = useRhythmEditorStore(
    (state) => ({
      pattern: state.pattern,
      currentStep: state.currentStep,
      isPlaying: state.isPlaying,
      toggleStep: state.toggleStep,
    })
  );

  // 軌道列表（排列順序）
  const tracks: TrackType[] = useMemo(
    () => ['kick', 'snare', 'hihat', 'openhat', 'clap'],
    []
  );

  return (
    <div
      className="w-full"
      role="region"
      aria-label="節奏編輯器網格"
    >
      {/* 步驟標籤（顯示 1-16） */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3">
        <div className="w-16 sm:w-20" aria-hidden="true" />
        <div className="flex-1 grid grid-cols-16 gap-1 sm:gap-2">
          {Array.from({ length: 16 }, (_, i) => {
            const showDivider = i % 4 === 0 && i !== 0;
            return (
              <React.Fragment key={i}>
                {showDivider && (
                  <div className="w-px -mx-0.5" aria-hidden="true" />
                )}
                <div className="text-center text-xs text-pip-boy-green/60 font-mono">
                  {i + 1}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 響應式佈局容器 */}
      <div
        className={cn(
          // 桌面：完整網格顯示
          'hidden sm:flex flex-col gap-2',
          // 手機：橫向捲動
          'sm:overflow-visible overflow-x-auto'
        )}
      >
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

      {/* 手機版：橫向捲動容器 */}
      <div className="sm:hidden overflow-x-auto pb-4">
        <div className="min-w-[640px] flex flex-col gap-2">
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
