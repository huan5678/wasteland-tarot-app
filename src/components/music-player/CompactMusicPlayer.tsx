/**
 * CompactMusicPlayer - Compact Music Player for Mobile Bottom Nav
 * Phase 7: Mobile Layout Refinements
 * Task 7.4: 整合音樂播放器到底部選單
 *
 * 簡化版音樂播放器，顯示在移動端底部導航上方
 * 點擊時打開完整的 MusicPlayerDrawer
 */

'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { cn } from '@/lib/utils';

export interface CompactMusicPlayerProps {
  className?: string;
  onExpand?: () => void; // Callback to open full MusicPlayerDrawer
}

export function CompactMusicPlayer({ className, onExpand }: CompactMusicPlayerProps) {
  const {
    currentMode,
    isPlaying,
    pause,
    resume,
  } = useMusicPlayer();

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onExpand
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleExpand = () => {
    if (onExpand) {
      onExpand();
    }
  };

  return (
    <div
      onClick={handleExpand}
      className={cn(
        'flex items-center justify-between px-4 py-2',
        'bg-black/90 border-t border-pip-boy-green/30',
        'cursor-pointer hover:bg-black/95 transition-colors',
        'min-h-[40px]',
        className
      )}
      role="button"
      tabIndex={0}
      aria-label="展開音樂播放器"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleExpand();
        }
      }}
    >
      {/* Current Mode Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <PixelIcon
          name="music"
          sizePreset="xs"
          variant="primary"
          decorative
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate">
            {currentMode || '未播放'}
          </div>
          <div className="text-[10px] text-pip-boy-green/60">
            {isPlaying ? '播放中' : '已暫停'}
          </div>
        </div>
      </div>

      {/* Play/Pause Button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={handlePlayPause}
        className="h-8 w-8 p-0 hover:bg-pip-boy-green/10"
        aria-label={isPlaying ? '暫停音樂播放' : '開始音樂播放'}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <PixelIcon name="pause" size={16} decorative />
        ) : (
          <PixelIcon name="play" size={16} decorative />
        )}
      </Button>
    </div>
  );
}
