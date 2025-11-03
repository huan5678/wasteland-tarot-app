/**
 * VolumeControl - 音量控制元件
 * Task 14: 實作音量滑桿 UI
 * Requirements 4.1, 9.2
 */

'use client';

import React, { useCallback } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { Slider } from '@/components/ui/slider';
import { useAudioStore } from '@/lib/audio/audioStore';
import { motion } from 'motion/react';

/**
 * VolumeControl Props
 */import { Button } from "@/components/ui/button";
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

  // ========== Debug: Log initial state ==========
  React.useEffect(() => {
    console.log('[VolumeControl] Component mounted with state:', {
      volume,
      isMuted,
      displayVolume: isMuted ? 0 : volume
    });
  }, []);

  // ========== Debug: Log state changes ==========
  React.useEffect(() => {
    console.log('[VolumeControl] State changed:', {
      volume,
      isMuted,
      displayVolume: isMuted ? 0 : volume
    });
  }, [volume, isMuted]);

  // ========== Handlers ==========
  const setMute = useAudioStore((state) => state.setMute);

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0] / 100; // Slider 回傳 0-100，轉換為 0-1
      console.log('[VolumeControl] handleVolumeChange called:', {
        sliderValue: value[0],
        newVolume,
        isMuted
      });

      // 如果用戶調整音量且音量大於 0，自動解除靜音
      if (newVolume > 0 && isMuted) {
        console.log('[VolumeControl] Auto-unmuting due to volume increase');
        setMute('music', false);
      }

      setVolume('music', newVolume);
    },
    [setVolume, setMute, isMuted]
  );

  const handleToggleMute = useCallback(() => {
    console.log('[VolumeControl] handleToggleMute called');
    toggleMute('music');
  }, [toggleMute]);

  // ========== Compute Volume Icon ==========
  const displayVolume = isMuted ? 0 : volume;
  const volumeIconName =
  displayVolume === 0 ? 'volume-x' : displayVolume < 0.5 ? 'volume-1' : 'volume';

  // ========== Render ==========
  return (
    <div className={`flex items-center gap-4 ${className || ''}`} role="group" aria-label="音量控制">
      {/* Mute Button */}
      <Button size="icon" variant="default"
      onClick={handleToggleMute}
      className="{expression}"




      aria-label={isMuted ? '取消靜音' : '靜音'}
      aria-pressed={isMuted}>

        <PixelIcon name={volumeIconName} sizePreset="sm" aria-label={isMuted ? '取消靜音' : '靜音'} />
      </Button>

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
          aria-valuenow={Math.round(displayVolume * 100)} />


        {/* Visual Feedback Animation */}
        {!isMuted && volume > 0 &&
        <motion.div
          className="absolute -top-6 right-0 px-2 py-1 bg-pip-boy-green/20 border border-pip-boy-green/50 rounded text-xs text-pip-boy-green"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true">

            {Math.round(volume * 100)}%
          </motion.div>
        }
      </div>
    </div>);

});