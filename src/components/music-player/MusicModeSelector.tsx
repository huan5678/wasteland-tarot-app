/**
 * MusicModeSelector - 音樂模式選擇器
 * Task 12: 實作音樂模式選擇 UI
 * Requirements 2.1, 2.2, 9.2, 11.1
 *
 * 更新：從資料庫載入的系統預設 Pattern 取代硬編碼模式
 */

'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioEffect } from '@/hooks/audio/useAudioEffect';
import { useRhythmPlaylistStore } from '@/lib/stores/rhythmPlaylistStore';
import { PixelIcon } from '@/components/ui/icons';

/**
 * Pattern 類型對應的圖示名稱
 */
const PATTERN_ICONS: Record<string, string> = {
  'Techno': 'music',
  'House': 'disc',
  'Trap': 'headphone',
  'Breakbeat': 'sparkling-2',
  'Minimal': 'radio',
};

/**
 * MusicModeSelector Props
 */
export interface MusicModeSelectorProps {
  currentMode: string | null; // 現在是 Pattern 名稱而不是 MusicMode
  onModeSelect: (patternIndex: number) => Promise<void>; // 現在傳遞 Pattern index
  className?: string;
}

/**
 * MusicModeSelector Component
 * Requirements: 顯示系統預設 Pattern 按鈕，當前播放模式高亮顯示
 */
export const MusicModeSelector = React.memo(function MusicModeSelector({
  currentMode,
  onModeSelect,
  className,
}: MusicModeSelectorProps) {
  const { playSound } = useAudioEffect();

  // 從 store 獲取系統預設 Pattern
  const systemPresets = useRhythmPlaylistStore((state) => state.systemPresets || []);

  // ========== Handler ==========
  const handleModeSelect = useCallback(
    async (patternIndex: number, patternName: string) => {
      if (patternName === currentMode) {
        return; // 已經在播放此模式
      }

      // 播放切換音效
      playSound('ui-hover', { volume: 0.3 });

      // 顯示載入動畫
      try {
        await onModeSelect(patternIndex);
      } catch (error) {
        console.error('[MusicModeSelector] Failed to select mode:', error);
      }
    },
    [currentMode, onModeSelect, playSound]
  );

  // ========== Loading State ==========
  if (systemPresets.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 flex items-center justify-center bg-pip-boy-green/5 border-2 border-pip-boy-green/30 rounded">
          <span className="text-xs text-pip-boy-green/60">載入中...</span>
        </div>
      </div>
    );
  }

  // ========== Render ==========
  return (
    <div
      className={`grid grid-cols-2 gap-3 ${className || ''}`}
      role="radiogroup"
      aria-label="節奏 Pattern 選擇"
    >
      {systemPresets.map((preset, index) => {
        const isActive = preset.name === currentMode;

        const iconName = PATTERN_ICONS[preset.name] || 'music';

        return (
          <motion.button
            key={preset.id}
            onClick={() => handleModeSelect(index, preset.name)}
            className={`relative p-3 flex flex-col items-center gap-2 rounded border-2 transition-all focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-wasteland-darker ${
              isActive
                ? 'bg-pip-boy-green/20 border-pip-boy-green shadow-[0_0_15px_rgba(0,255,136,0.4)]'
                : 'bg-pip-boy-green/5 border-pip-boy-green/30 hover:bg-pip-boy-green/10 hover:border-pip-boy-green/50'
            }`}
            role="radio"
            aria-checked={isActive}
            aria-label={`${preset.name} - ${preset.description}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Icon */}
            <PixelIcon name={iconName} sizePreset="md" decorative />

            {/* Label */}
            <div className="text-sm font-bold text-center">{preset.name}</div>

            {/* Description */}
            <div className="text-xs text-pip-boy-green/60 text-center line-clamp-1">
              {preset.description}
            </div>

            {/* Active Indicator */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  className="absolute inset-0 border-2 border-pip-boy-green rounded pointer-events-none"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>

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
    </div>
  );
});
