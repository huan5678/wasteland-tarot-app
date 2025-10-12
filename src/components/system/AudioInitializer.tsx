'use client';

/**
 * AudioInitializer - 音訊系統初始化組件
 * 需求 6.1: 整合音訊系統至應用程式
 *
 * 注意：背景音樂功能已移除，改由使用者透過 MusicPlayerDrawer 手動控制
 */

import React from 'react';
import { useAudioInitialization } from '@/hooks/audio/useAudioInitialization';
import { useVisibilityControl } from '@/hooks/audio/useVisibilityControl';
import { usePrefersReducedMotion } from '@/hooks/audio/usePrefersReducedMotion';

export function AudioInitializer() {
  const {
    isInitialized,
    isPreloading,
    isSilentMode,
    showSilentModeWarning,
    dismissSilentModeWarning,
  } = useAudioInitialization();

  // 背景/前景狀態管理
  useVisibilityControl();

  // 移除自動背景音樂 - 改由 MusicPlayerDrawer 手動控制
  // useBackgroundMusic();

  // prefers-reduced-motion 偵測
  usePrefersReducedMotion();

  // 顯示載入狀態（僅在預載時）
  if (isPreloading) {
    return (
      <div
        className="audio-initializer__loading"
        role="status"
        aria-live="polite"
        aria-label="音訊系統載入中"
      >
        {/* 可選：顯示載入動畫或文字 */}
      </div>
    );
  }

  // 顯示靜音模式警告
  if (showSilentModeWarning) {
    return (
      <div
        className="audio-initializer__warning"
        role="alert"
        aria-live="assertive"
      >
        <div className="audio-initializer__warning-content">
          <p>偵測到您的裝置處於靜音模式，音訊功能可能無法正常運作。</p>
          <button
            onClick={dismissSilentModeWarning}
            className="audio-initializer__dismiss-btn"
            aria-label="關閉靜音模式警告"
          >
            知道了
          </button>
        </div>
      </div>
    );
  }

  // 音訊系統在背景運作，不顯示 UI
  return null;
}
