/**
 * MusicModeSelector - 音樂模式選擇器
 * Task 12: 實作音樂模式選擇 UI
 * Requirements 2.1, 2.2, 9.2, 11.1
 */

'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';
import type { MusicMode } from '@/lib/audio/playlistTypes';
import { Piano, Sparkles, Headphones, Waves, LucideIcon } from 'lucide-react';

/**
 * 音樂模式資訊
 */
const MODES: Array<{ id: MusicMode; label: string; icon: LucideIcon; description: string }> = [
  { id: 'synthwave', label: 'Synthwave', icon: Piano, description: '80 年代電子合成器風格' },
  { id: 'divination', label: '占卜', icon: Sparkles, description: '神秘氛圍音樂' },
  { id: 'lofi', label: 'Lo-fi', icon: Headphones, description: 'Lo-fi 節奏音樂' },
  { id: 'ambient', label: 'Ambient', icon: Waves, description: '環境音樂' },
];

/**
 * MusicModeSelector Props
 */
export interface MusicModeSelectorProps {
  currentMode: MusicMode | null;
  onModeSelect: (mode: MusicMode) => Promise<void>;
  className?: string;
}

/**
 * MusicModeSelector Component
 * Requirements: 顯示 4 個音樂模式按鈕，當前播放模式高亮顯示
 */
export const MusicModeSelector = React.memo(function MusicModeSelector({
  currentMode,
  onModeSelect,
  className,
}: MusicModeSelectorProps) {
  const { playSound } = useAudioEffect();

  // ========== Handler ==========
  const handleModeSelect = useCallback(
    async (mode: MusicMode) => {
      if (mode === currentMode) {
        return; // 已經在播放此模式
      }

      // 播放切換音效
      playSound('ui-hover', { volume: 0.3 });

      // 顯示載入動畫
      try {
        await onModeSelect(mode);
      } catch (error) {
        console.error('[MusicModeSelector] Failed to select mode:', error);
      }
    },
    [currentMode, onModeSelect, playSound]
  );

  // ========== Render ==========
  return (
    <div
      className={`grid grid-cols-2 gap-3 ${className || ''}`}
      role="radiogroup"
      aria-label="音樂模式選擇"
    >
      <AnimatePresence mode="wait">
        {MODES.map((mode) => {
          const isActive = mode.id === currentMode;

          return (
            <motion.button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className={`relative p-3 flex flex-col items-center gap-2 rounded border-2 transition-all focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-wasteland-darker ${
                isActive
                  ? 'bg-pip-boy-green/20 border-pip-boy-green shadow-[0_0_15px_rgba(0,255,136,0.4)]'
                  : 'bg-pip-boy-green/5 border-pip-boy-green/30 hover:bg-pip-boy-green/10 hover:border-pip-boy-green/50'
              }`}
              role="radio"
              aria-checked={isActive}
              aria-label={`${mode.label} - ${mode.description}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {/* Icon */}
              <mode.icon className="w-8 h-8" aria-hidden="true" />

              {/* Label */}
              <div className="text-sm font-bold text-center">{mode.label}</div>

              {/* Description */}
              <div className="text-xs text-pip-boy-green/60 text-center line-clamp-1">
                {mode.description}
              </div>

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 border-2 border-pip-boy-green rounded pointer-events-none"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Playing Animation */}
              {isActive && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-pip-boy-green rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  aria-hidden="true"
                />
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
});
