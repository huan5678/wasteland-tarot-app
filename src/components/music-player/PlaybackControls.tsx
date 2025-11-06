/**
 * PlaybackControls - 播放控制元件
 * Task 11: 實作播放控制按鈕群組
 * Requirements 1.1, 1.2, 1.3, 4.2, 4.3, 8.1
 */

'use client';

import React, { useEffect, useCallback } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';
import type { RepeatMode } from '@/lib/audio/playlistTypes';

/**
 * PlaybackControls Props
 */import { Button } from "@/components/ui/button";
export interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  className?: string;
}

/**
 * PlaybackControls Component
 * Requirements: 播放/暫停、上一首/下一首、循環模式、隨機播放
 */
export const PlaybackControls = React.memo(function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  shuffleEnabled,
  repeatMode,
  className
}: PlaybackControlsProps) {
  const { playSound } = useAudioEffect();

  // ========== Handlers with UI Sound Effects ==========

  const handlePlayPause = useCallback(() => {
    playSound('button-click', { volume: 0.3 });
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause, playSound]);

  const handleNext = useCallback(() => {
    playSound('ui-hover', { volume: 0.3 });
    onNext();
  }, [onNext, playSound]);

  const handlePrevious = useCallback(() => {
    playSound('ui-hover', { volume: 0.3 });
    onPrevious();
  }, [onPrevious, playSound]);

  const handleStop = useCallback(() => {
    playSound('button-click', { volume: 0.3 });
    // 停止播放並重置播放位置到開頭
    onStop();
  }, [onStop, playSound]);

  const handleToggleShuffle = useCallback(() => {
    playSound('button-click', { volume: 0.3 });
    onToggleShuffle();
  }, [onToggleShuffle, playSound]);

  const handleToggleRepeat = useCallback(() => {
    playSound('button-click', { volume: 0.3 });
    onToggleRepeat();
  }, [onToggleRepeat, playSound]);

  // ========== Keyboard Shortcuts ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在輸入框時觸發
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 's':
        case 'S':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleStop();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleNext, handlePrevious, handleStop]);

  // ========== Render ==========

  return (
    <div className={`flex flex-col gap-4 ${className || ''}`}>
      {/* Main Playback Controls */}
      <div
        className="flex items-center justify-center gap-2"
        role="group"
        aria-label="播放控制">

        {/* Previous Button */}
        <Button
          size="icon"
          variant="outline"
          onClick={handlePrevious}
          className="w-10 h-10"
          aria-label="上一首"
        >
          <PixelIcon name="skip-back" sizePreset="sm" decorative />
        </Button>

        {/* 播放中：顯示暫停 + 停止 */}
        {isPlaying ? (
          <>
            {/* Pause Button */}
            <Button
              size="icon"
              variant="default"
              onClick={handlePlayPause}
              className="w-10 h-10 bg-radiation-orange/20 hover:bg-radiation-orange/30 border border-radiation-orange"
              aria-label="暫停"
            >
              <PixelIcon name="pause" sizePreset="sm" variant="secondary" decorative />
            </Button>

            {/* Stop Button */}
            <Button
              size="icon"
              variant="default"
              onClick={handleStop}
              className="w-10 h-10 bg-red-900/20 hover:bg-red-900/30 border border-red-500"
              aria-label="停止"
            >
              <PixelIcon name="stop" sizePreset="sm" variant="error" decorative />
            </Button>
          </>
        ) : (
          /* 暫停/停止狀態：顯示播放 */
          <Button
            size="icon"
            variant="default"
            onClick={handlePlayPause}
            className="w-10 h-10 bg-pip-boy-green/20 hover:bg-pip-boy-green/30 border border-pip-boy-green"
            aria-label="播放"
          >
            <PixelIcon name="play" sizePreset="sm" variant="primary" decorative />
          </Button>
        )}

        {/* Next Button */}
        <Button
          size="icon"
          variant="outline"
          onClick={handleNext}
          className="w-10 h-10"
          aria-label="下一首"
        >
          <PixelIcon name="skip-forward" sizePreset="sm" decorative />
        </Button>
      </div>

      {/* Secondary Controls: Shuffle & Repeat */}
      <div
        className="flex items-center justify-center gap-6"
        role="group"
        aria-label="播放模式控制">

        {/* Shuffle Button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleToggleShuffle}
          className={`
            flex items-center justify-center w-10 h-10 transition-all
            ${shuffleEnabled ? 'bg-pip-boy-green/20 hover:bg-pip-boy-green/30' : 'hover:bg-pip-boy-green/10'}
          `}
          aria-label={shuffleEnabled ? '停用隨機播放' : '啟用隨機播放'}
          aria-pressed={shuffleEnabled}
        >
          <PixelIcon
            name="shuffle"
            sizePreset="sm"
            variant={shuffleEnabled ? 'primary' : 'muted'}
            aria-label={shuffleEnabled ? '停用隨機播放' : '啟用隨機播放'}
          />
        </Button>

        {/* Repeat Button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleToggleRepeat}
          className={`
            flex items-center justify-center w-10 h-10 transition-all
            ${repeatMode !== 'off' ? 'bg-pip-boy-green/20 hover:bg-pip-boy-green/30' : 'hover:bg-pip-boy-green/10'}
          `}
          aria-label={
            repeatMode === 'off'
              ? '啟用循環播放'
              : repeatMode === 'one'
              ? '單曲循環'
              : '列表循環'
          }
          aria-pressed={repeatMode !== 'off'}
        >
          <PixelIcon
            name="repeat"
            sizePreset="sm"
            variant={repeatMode !== 'off' ? 'primary' : 'muted'}
            aria-label={
              repeatMode === 'off'
                ? '啟用循環播放'
                : repeatMode === 'one'
                ? '單曲循環'
                : '列表循環'
            }
          />
        </Button>
      </div>

      {/* Keyboard Hints */}
      <div className="text-center text-xs text-pip-boy-green/50">
        快捷鍵: 空白鍵 (播放/暫停) | ← → (上一首/下一首)
      </div>
    </div>);

});