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
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleNext, handlePrevious]);

  // ========== Render ==========

  return (
    <div className={`flex flex-col gap-4 ${className || ''}`}>
      {/* Main Playback Controls */}
      <div
        className="flex items-center justify-center gap-4"
        role="group"
        aria-label="播放控制">

        {/* Previous Button */}
        <Button size="icon" variant="outline"
        onClick={handlePrevious}
        className="flex items-center justify-center w-10 h-10 transition-all"
        aria-label="上一首">

          <PixelIcon name="skip-back" sizePreset="sm" aria-label="上一首" />
        </Button>

        {/* Play/Pause Button */}
        <Button size="icon" variant="outline"
        onClick={handlePlayPause}
        className="flex items-center justify-center w-14 h-14 transition-all"
        aria-label={isPlaying ? '暫停' : '播放'}>

          {isPlaying ?
          <PixelIcon name="pause" sizePreset="sm" aria-label="暫停" /> :

          <PixelIcon name="play" sizePreset="sm" aria-label="播放" />
          }
        </Button>

        {/* Next Button */}
        <Button size="icon" variant="outline"
        onClick={handleNext}
        className="flex items-center justify-center w-10 h-10 transition-all"
        aria-label="下一首">

          <PixelIcon name="skip-forward" sizePreset="sm" aria-label="下一首" />
        </Button>
      </div>

      {/* Secondary Controls: Shuffle & Repeat */}
      <div
        className="flex items-center justify-center gap-6"
        role="group"
        aria-label="播放模式控制">

        {/* Shuffle Button */}
        <Button size="icon" variant="default"
        onClick={handleToggleShuffle}
        className="{expression}"




        aria-label={shuffleEnabled ? '停用隨機播放' : '啟用隨機播放'}
        aria-pressed={shuffleEnabled}>

          <PixelIcon
            name="shuffle"
            sizePreset="sm"
            variant={shuffleEnabled ? 'primary' : 'muted'}
            aria-label={shuffleEnabled ? '停用隨機播放' : '啟用隨機播放'} />

        </Button>

        {/* Repeat Button */}
        <Button size="icon" variant="default"
        onClick={handleToggleRepeat}
        className="{expression}"




        aria-label={
        repeatMode === 'off' ?
        '啟用循環播放' :
        repeatMode === 'one' ?
        '單曲循環' :
        '列表循環'
        }
        aria-pressed={repeatMode !== 'off'}>

          <PixelIcon
            name="repeat"
            sizePreset="sm"
            variant={repeatMode !== 'off' ? 'primary' : 'muted'}
            aria-label={
            repeatMode === 'off' ?
            '啟用循環播放' :
            repeatMode === 'one' ?
            '單曲循環' :
            '列表循環'
            } />

        </Button>
      </div>

      {/* Keyboard Hints */}
      <div className="text-center text-xs text-pip-boy-green/50">
        快捷鍵: 空白鍵 (播放/暫停) | ← → (上一首/下一首)
      </div>
    </div>);

});