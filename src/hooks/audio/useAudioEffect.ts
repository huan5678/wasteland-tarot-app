/**
 * useAudioEffect - 音效播放 Hook
 * 需求 1.1-1.7: 簡化組件中的音效播放邏輯
 */

import { useCallback } from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import type { PlayOptions } from '@/lib/audio/types';

export function useAudioEffect() {
  const { volumes, muted, isAudioEnabled } = useAudioStore();
  const audioEngine = AudioEngine.getInstance();

  const playSound = useCallback(
    (soundId: string, options?: PlayOptions) => {
      // 檢查音效是否啟用
      if (!isAudioEnabled) return;

      // 檢查是否靜音
      if (muted.sfx) return;

      // 使用當前音量設定
      const volume = options?.volume ?? volumes.sfx;

      audioEngine.play(soundId, {
        ...options,
        volume,
      });
    },
    [volumes.sfx, muted.sfx, isAudioEnabled]
  );

  const stopSound = useCallback((soundId: string) => {
    audioEngine.stop(soundId);
  }, []);

  const stopAll = useCallback(() => {
    audioEngine.stopAll();
  }, []);

  return {
    playSound,
    stopSound,
    stopAll,
  };
}
