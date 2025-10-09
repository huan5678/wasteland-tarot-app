/**
 * useBackgroundMusic - 背景音樂 Hook
 * 需求 3.1-3.6: 背景音樂管理
 */

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAudioStore } from '@/lib/audio/audioStore';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { MusicManager } from '@/lib/audio/MusicManager';

export function useBackgroundMusic() {
  const { volumes, muted, setCurrentTrack, isAudioEnabled } = useAudioStore();
  const pathname = usePathname();
  const [musicManager] = useState(() => new MusicManager(AudioEngine.getInstance()));

  // 根據路由自動切換場景音樂
  useEffect(() => {
    if (!isAudioEnabled || muted.music) {
      musicManager.stop();
      setCurrentTrack(null);
      return;
    }

    // 根據路徑切換場景（使用 async IIFE 並捕獲錯誤）
    (async () => {
      try {
        await musicManager.switchScene(pathname);
      } catch (error) {
        // 靜默失敗 - AudioContext 可能尚未初始化
        console.warn('[useBackgroundMusic] Failed to switch scene:', error);
      }
    })();

    return () => {
      musicManager.stop();
      setCurrentTrack(null);
    };
  }, [pathname, muted.music, isAudioEnabled]);

  // 同步音量變化
  useEffect(() => {
    const effectiveVolume = muted.music ? 0 : volumes.music;
    musicManager.setVolume(effectiveVolume);
  }, [volumes.music, muted.music]);

  return {
    musicManager,
    currentTrack: musicManager.getCurrentTrack(),
    isPlaying: musicManager.isPlaying(),
  };
}
