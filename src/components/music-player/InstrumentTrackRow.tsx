'use client';

/**
 * InstrumentTrackRow - 樂器軌道組件
 * Task 6.2: 實作 InstrumentTrackRow 樂器軌道組件
 * Feature: playlist-music-player
 * Requirements: 需求 21.2-21.7
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { TrackType } from '@/lib/stores/rhythmEditorStore';

/**
 * 軌道標籤映射
 */import { Button } from "@/components/ui/button";
const TRACK_LABELS: Record<TrackType, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hihat: 'HiHat',
  openhat: 'OpenHat',
  clap: 'Clap'
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

export const StepButton: React.FC<StepButtonProps> = ({
  track,
  step,
  isActive,
  isPlayhead,
  onClick
}) => {
  return (
    <Button size="icon" variant="default"
    type="button"
    className="{expression}"









    onClick={() => onClick(track, step)}
    aria-label={`${TRACK_LABELS[track]} 步驟 ${step + 1}${isActive ? ' (啟用)' : ' (停用)'}`}
    aria-pressed={isActive} />);


};

/**
 * InstrumentTrackRow 組件屬性
 */
export interface InstrumentTrackRowProps {
  track: TrackType;
  pattern: boolean[];
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (track: TrackType, step: number) => void;
}

/**
 * InstrumentTrackRow 組件 - 單個樂器軌道
 *
 * 功能：
 * - 顯示軌道標籤（Kick, Snare, HiHat, OpenHat, Clap）
 * - 顯示 16 個步驟按鈕（StepButton）
 * - 實作點擊切換步驟狀態
 * - 整合 rhythmEditorStore.toggleStep()
 *
 * @example
 * ```tsx
 * <InstrumentTrackRow
 *   track="kick"
 *   pattern={[true, false, false, false, ...]}
 *   currentStep={0}
 *   isPlaying={true}
 *   onToggleStep={(track, step) => toggleStep(track, step)}
 * />
 * ```
 */
export const InstrumentTrackRow: React.FC<InstrumentTrackRowProps> = ({
  track,
  pattern,
  currentStep,
  isPlaying,
  onToggleStep
}) => {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* 軌道標籤 */}
      <div className="w-16 sm:w-20 flex-shrink-0 text-left">
        <span className="text-pip-boy-green text-xs sm:text-sm font-medium uppercase tracking-wide">
          {TRACK_LABELS[track]}
        </span>
      </div>

      {/* 16 個步驟按鈕 - 使用固定寬度確保不換行 */}
      <div className="flex gap-1">
        {pattern.map((isActive, step) => {
          const isPlayhead = isPlaying && currentStep === step;
          // 每 4 步驟增加右側間距作為視覺分組
          const isGroupEnd = (step + 1) % 4 === 0 && step !== 15;

          return (
            <div
              key={step}
              className={cn(
                'w-8 sm:w-10 flex-shrink-0',
                isGroupEnd && 'mr-1'
              )}>

              <StepButton
                track={track}
                step={step}
                isActive={isActive}
                isPlayhead={isPlayhead}
                onClick={onToggleStep} />

            </div>);

        })}
      </div>
    </div>);

};

InstrumentTrackRow.displayName = 'InstrumentTrackRow';