/**
 * ProgressBar - 播放進度條元件
 * Task 13: 實作循環進度動畫 (程序生成音樂無固定長度)
 * Requirements 5.3, 11.1
 */

'use client';

import React from 'react';
import { motion } from 'motion/react';

/**
 * ProgressBar Props
 */
export interface ProgressBarProps {
  isPlaying: boolean;
  className?: string;
}

/**
 * ProgressBar Component
 * Requirements: 顯示循環進度動畫 (因為 ProceduralMusicEngine 無固定長度)
 */
export const ProgressBar = React.memo(function ProgressBar({
  isPlaying,
  className,
}: ProgressBarProps) {
  return (
    <div className={`w-full ${className || ''}`} role="progressbar" aria-label="播放進度">
      {/* Progress Track */}
      <div className="relative w-full h-2 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded-full overflow-hidden">
        {/* Animated Progress Bar */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-pip-boy-green-dark to-pip-boy-green rounded-full shadow-[0_0_8px_rgba(0,255,136,0.5)]"
          animate={
            isPlaying
              ? { width: ['0%', '100%'] }
              : { width: '0%' }
          }
          transition={
            isPlaying
              ? { duration: 30, repeat: Infinity, ease: 'linear' }
              : { duration: 0.3 }
          }
        />

        {/* Scanline Effect (Pip-Boy 風格) */}
        {isPlaying && (
          <motion.div
            className="absolute left-0 top-0 h-full w-1 bg-pip-boy-green-bright shadow-[0_0_6px_rgba(0,255,65,0.8)]"
            animate={{ left: ['0%', '100%'] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
      </div>

      {/* Time Display (Simulated for procedural music) */}
      <div className="flex justify-between mt-2 text-xs text-pip-boy-green/60 font-mono">
        <span aria-live="polite">
          {isPlaying ? '播放中' : '已暫停'}
        </span>
        <span>∞</span>
      </div>
    </div>
  );
});
