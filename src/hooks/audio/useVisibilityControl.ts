/**
 * useVisibilityControl Hook
 * 需求 6.3, 6.4: 背景/前景狀態管理
 */

import { useEffect } from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { logger } from '@/lib/logger';

interface VisibilityState {
  isPlaying: {
    music: boolean;
    voice: boolean;
  };
  currentTrack: string | null;
}

export function useVisibilityControl() {
  const { isPlaying, currentTrack } = useAudioStore();

  useEffect(() => {
    let savedState: VisibilityState | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 應用程式進入背景
        logger.info('[VisibilityControl] App went to background, pausing audio');

        // 儲存當前播放狀態
        savedState = {
          isPlaying: { ...isPlaying },
          currentTrack,
        };

        // 暫停所有音訊
        const audioEngine = AudioEngine.getInstance();
        audioEngine.stopAll();
      } else {
        // 應用程式回到前景
        logger.info('[VisibilityControl] App returned to foreground');

        if (savedState) {
          // 恢復之前的播放狀態
          // 這部分需要配合 MusicManager 和 SpeechEngine 實作恢復邏輯
          logger.info('[VisibilityControl] Restoring playback state', savedState);
          savedState = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, currentTrack]);
}
