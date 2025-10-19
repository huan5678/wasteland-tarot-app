/**
 * useTextToSpeech - 文字轉語音 Hook
 * 需求 2.1-2.7: TTS 語音合成功能
 */

import { useState, useEffect, useCallback } from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';
import { SpeechEngine } from '@/lib/audio/SpeechEngine';
import type { SpeechOptions } from '@/lib/audio/types';

export function useTextToSpeech() {
  const { volumes, muted, selectedVoice, setSpeechProgress, isAudioEnabled } = useAudioStore();
  const speechEngine = SpeechEngine.getInstance();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 初始化檢測支援
  useEffect(() => {
    const initializeSpeech = async () => {
      const supported = await speechEngine.initialize();
      setIsSupported(supported);
    };
    initializeSpeech();
  }, []);

  // 監聽播放狀態
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeaking(speechEngine.isSpeaking());
      setIsPaused(speechEngine.isPaused());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const speak = useCallback(
    (text: string, options?: Omit<SpeechOptions, 'voice' | 'volume'>) => {
      if (!isSupported || !isAudioEnabled) return;
      if (muted.voice) return;

      setIsSpeaking(true);
      setIsPaused(false);

      speechEngine.speak(text, {
        voice: selectedVoice,
        volume: volumes.voice,
        onProgress: (charIndex) => {
          setSpeechProgress(charIndex);
          options?.onProgress?.(charIndex);
        },
        onComplete: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setSpeechProgress(0);
          options?.onComplete?.();
        },
        onError: (error) => {
          setIsSpeaking(false);
          setIsPaused(false);
          setSpeechProgress(0);
          options?.onError?.(error);
        },
      });
    },
    [isSupported, muted.voice, volumes.voice, selectedVoice, isAudioEnabled]
  );

  const pause = useCallback(() => {
    speechEngine.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    speechEngine.resume();
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    speechEngine.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeechProgress(0);
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    isSupported,
  };
}
