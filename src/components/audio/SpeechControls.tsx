'use client';

/**
 * SpeechControls - TTS 控制按鈕
 * 需求 2.1, 2.4, 2.5, 2.6: TTS 播放控制
 */

import React from 'react';
import { useTextToSpeech } from '@/hooks/audio/useTextToSpeech';

interface SpeechControlsProps {
  text: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export function SpeechControls({ text, onPlayStateChange }: SpeechControlsProps) {
  const { speak, pause, resume, stop, isSpeaking, isPaused, isSupported } = useTextToSpeech();

  React.useEffect(() => {
    onPlayStateChange?.(isSpeaking);
  }, [isSpeaking, onPlayStateChange]);

  // 需求 2.6: IF 瀏覽器不支援 THEN 隱藏控制按鈕
  if (!isSupported) {
    return (
      <div className="speech-controls speech-controls--unsupported">
        <p className="speech-controls__error">
          您的瀏覽器不支援語音播放功能
        </p>
      </div>
    );
  }

  const handlePlay = () => {
    if (isPaused) {
      resume();
    } else {
      speak(text);
    }
  };

  return (
    <div className="speech-controls" role="group" aria-label="語音播放控制">
      {!isSpeaking ? (
        <button
          onClick={handlePlay}
          className="speech-controls__btn speech-controls__btn--play"
          aria-label="播放語音"
        >
          ▶️ 播放
        </button>
      ) : (
        <>
          <button
            onClick={isPaused ? resume : pause}
            className="speech-controls__btn speech-controls__btn--pause"
            aria-label={isPaused ? '繼續播放' : '暫停播放'}
          >
            {isPaused ? '▶️ 繼續' : '⏸️ 暫停'}
          </button>
          <button
            onClick={stop}
            className="speech-controls__btn speech-controls__btn--stop"
            aria-label="停止播放"
          >
            ⏹️ 停止
          </button>
        </>
      )}
    </div>
  );
}
