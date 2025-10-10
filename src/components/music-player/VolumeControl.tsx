/**
 * VolumeControl - 音量控制元件
 * Task 14: 實作音量滑桿 UI
 * Requirements 4.1, 9.2
 */

'use client';

import React, { useCallback } from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudioStore } from '@/lib/audio/audioStore';
import { motion } from 'motion/react';

/**
 * VolumeControl Props
 */
export interface VolumeControlProps {
  className?: string;
}

/**
 * VolumeControl Component
 * Requirements: 音量滑桿、靜音按鈕、即時同步到 audioStore
 */
export const VolumeControl = React.memo(function VolumeControl({ className }: VolumeControlProps) {
  // ========== State from audioStore ==========
  const volume = useAudioStore((state) => state.volumes.music);
  const isMuted = useAudioStore((state) => state.muted.music);
  const setVolume = useAudioStore((state) => state.setVolume);
  const toggleMute = useAudioStore((state) => state.toggleMute);

  // ========== Handlers ==========
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0] / 100; // Slider 回傳 0-100，轉換為 0-1
      setVolume('music', newVolume);
    },
    [setVolume]
  );

  const handleToggleMute = useCallback(() => {
    toggleMute('music');
  }, [toggleMute]);

  // ========== Compute Volume Icon ==========
  const displayVolume = isMuted ? 0 : volume;
  const VolumeIcon =
    displayVolume === 0 ? VolumeX : displayVolume < 0.5 ? Volume1 : Volume2;

  // ========== Render ==========
  return (
    <div className={`flex items-center gap-4 ${className || ''}`} role="group" aria-label="音量控制">
      {/* Mute Button */}
      <button
        onClick={handleToggleMute}
        className={`flex items-center justify-center w-10 h-10 rounded border-2 transition-all focus:outline-none focus:ring-2 focus:ring-pip-boy-green focus:ring-offset-2 focus:ring-offset-wasteland-darker ${
          isMuted
            ? 'bg-pip-boy-green/5 border-pip-boy-green/30 text-pip-boy-green/50'
            : 'bg-pip-boy-green/10 border-pip-boy-green text-pip-boy-green hover:bg-pip-boy-green hover:text-black'
        }`}
        aria-label={isMuted ? '取消靜音' : '靜音'}
        aria-pressed={isMuted}
      >
        <VolumeIcon className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Volume Slider */}
      <div className="flex-1 relative">
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          className="pip-boy-slider"
          aria-label="音量"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(displayVolume * 100)}
        />

        {/* Visual Feedback Animation */}
        {!isMuted && volume > 0 && (
          <motion.div
            className="absolute -top-6 right-0 px-2 py-1 bg-pip-boy-green/20 border border-pip-boy-green/50 rounded text-xs text-pip-boy-green"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          >
            {Math.round(volume * 100)}%
          </motion.div>
        )}
      </div>

      {/* Volume Percentage Display */}
      <div
        className="min-w-[3rem] text-right text-sm text-pip-boy-green/80"
        aria-live="polite"
        aria-atomic="true"
      >
        {Math.round(displayVolume * 100)}%
      </div>
    </div>
  );
});
