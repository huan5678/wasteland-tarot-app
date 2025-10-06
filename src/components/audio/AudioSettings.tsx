'use client';

/**
 * AudioSettings - 音訊設定頁面組件
 * 需求 10.1, 10.2, 10.5, 10.6: 完整音訊設定控制
 */

import React from 'react';
import { useAudioStore } from '@/lib/audio/audioStore';
import { AudioControls } from './AudioControls';
import { VoiceSelector } from './VoiceSelector';
import { useAudioKeyboard } from '@/hooks/audio/useAudioKeyboard';

export function AudioSettings() {
  const {
    isAudioEnabled,
    isSilentMode,
    prefersReducedMotion,
    setAudioEnabled,
    setSilentMode,
    setPrefersReducedMotion,
  } = useAudioStore();

  // 需求 10.2: 鍵盤快捷鍵支援
  useAudioKeyboard();

  // 需求 10.1: 偵測系統偏好設定
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setPrefersReducedMotion]);

  const handleSilentModeToggle = () => {
    setSilentMode(!isSilentMode);
  };

  const handleAudioToggle = () => {
    setAudioEnabled(!isAudioEnabled);
  };

  return (
    <section
      className="audio-settings"
      aria-label="音訊控制"
      role="region"
    >
      <h2 className="audio-settings__title">音訊設定</h2>

      {/* 主開關 */}
      <div className="audio-settings__section">
        <div className="audio-settings__toggle">
          <label htmlFor="audio-enabled" className="audio-settings__toggle-label">
            啟用音訊系統
          </label>
          <input
            type="checkbox"
            id="audio-enabled"
            checked={isAudioEnabled}
            onChange={handleAudioToggle}
            className="audio-settings__toggle-input"
            aria-label="啟用或停用音訊系統"
          />
        </div>

        <div className="audio-settings__toggle">
          <label htmlFor="silent-mode" className="audio-settings__toggle-label">
            完全靜音模式
          </label>
          <input
            type="checkbox"
            id="silent-mode"
            checked={isSilentMode}
            onChange={handleSilentModeToggle}
            disabled={!isAudioEnabled}
            className="audio-settings__toggle-input"
            aria-label="啟用或停用完全靜音模式"
          />
        </div>
      </div>

      {/* 音量控制 */}
      {isAudioEnabled && !isSilentMode && (
        <>
          <div className="audio-settings__section">
            <h3 className="audio-settings__subtitle">音量控制</h3>
            <AudioControls type="sfx" label="音效" />
            <AudioControls type="music" label="背景音樂" />
            <AudioControls type="voice" label="語音" />
          </div>

          {/* 語音設定 */}
          <div className="audio-settings__section">
            <h3 className="audio-settings__subtitle">語音設定</h3>
            <VoiceSelector />
          </div>
        </>
      )}

      {/* 無障礙提示 */}
      {prefersReducedMotion && (
        <div className="audio-settings__notice" role="alert">
          <p>
            偵測到您的系統啟用了「減少動態效果」偏好設定。
            音訊功能已預設停用，您可以手動啟用。
          </p>
        </div>
      )}

      {/* 鍵盤快捷鍵說明 */}
      <div className="audio-settings__section">
        <h3 className="audio-settings__subtitle">鍵盤快捷鍵</h3>
        <dl className="audio-settings__shortcuts">
          <dt>M</dt>
          <dd>切換靜音</dd>
          <dt>↑ / ↓</dt>
          <dd>調整音量</dd>
        </dl>
      </div>
    </section>
  );
}
