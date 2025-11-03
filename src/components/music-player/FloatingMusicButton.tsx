'use client';

/**
 * FloatingMusicButton - 浮動音樂按鈕
 * 固定在右下角，點擊開啟音樂播放器
 * Pip-Boy 風格設計
 */

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { useMusicPlayerStore } from '@/lib/stores/musicPlayerStore';import { Button } from "@/components/ui/button";

interface FloatingMusicButtonProps {
  onClick: () => void;
}

export function FloatingMusicButton({ onClick }: FloatingMusicButtonProps) {
  const { isPlaying, currentMode } = useMusicPlayerStore();

  return (
    <Button size="icon" variant="outline"
    onClick={onClick}
    className="fixed bottom-6 right-6 z-50\n w-14 h-14\n flex items-center justify-center\n transition-all duration-300\n group\n"













    aria-label={isPlaying ? '開啟音樂播放器（正在播放）' : '開啟音樂播放器'}>

      {/* 音樂圖示 */}
      <div className="relative">
        <PixelIcon
          name="note"
          size={24}
          decorative
          className={isPlaying ? 'animate-pulse' : ''} />


        {/* 播放狀態指示器 */}
        {isPlaying &&
        <span
          className="
              absolute -top-1 -right-1
              w-2 h-2
              bg-pip-boy-green
              rounded-full
              animate-ping
            " />







        }
      </div>

      {/* 懸停提示 */}
      <div className="
        absolute bottom-full right-0 mb-2
        px-3 py-1.5
        bg-wasteland-darker border border-pip-boy-green/50
        text-xs text-pip-boy-green uppercase
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none
        whitespace-nowrap
        shadow-[0_0_10px_rgba(0,255,136,0.3)]
      ">










        {isPlaying ? `播放中: ${currentMode}` : '音樂播放器'}
      </div>
    </Button>);

}