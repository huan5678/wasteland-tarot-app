/**
 * useAudioKeyboard - 鍵盤快捷鍵 Hook
 * 需求 10.2: 鍵盤導航和快捷鍵
 */

import { useEffect } from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';

export function useAudioKeyboard() {
  const { volumes, muted, setVolume, setMute } = useAudioStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只在沒有 input/textarea focus 時處理
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          // M: 切換靜音（所有類型）
          e.preventDefault();
          const allMuted = muted.sfx && muted.music && muted.voice;
          setMute('sfx', !allMuted);
          setMute('music', !allMuted);
          setMute('voice', !allMuted);
          break;

        case 'arrowup':
          // 上箭頭: 增加音量
          e.preventDefault();
          setVolume('sfx', Math.min(1, volumes.sfx + 0.1));
          setVolume('music', Math.min(1, volumes.music + 0.1));
          setVolume('voice', Math.min(1, volumes.voice + 0.1));
          break;

        case 'arrowdown':
          // 下箭頭: 降低音量
          e.preventDefault();
          setVolume('sfx', Math.max(0, volumes.sfx - 0.1));
          setVolume('music', Math.max(0, volumes.music - 0.1));
          setVolume('voice', Math.max(0, volumes.voice - 0.1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [volumes, muted, setVolume, setMute]);
}
