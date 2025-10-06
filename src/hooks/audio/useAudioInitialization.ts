/**
 * useAudioInitialization - 音訊初始化 Hook
 * 需求 6.1: 行動裝置首次互動時初始化 AudioContext
 */

import { useState, useEffect } from 'react';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { SilentModeDetector } from '@/lib/audio/SilentModeDetector';
import { fetchAudioManifest, getCriticalSounds } from '@/lib/audio/manifest';
import { logger } from '@/lib/logger';

export function useAudioInitialization() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [isSilentMode, setIsSilentMode] = useState(false);
  const [showSilentModeWarning, setShowSilentModeWarning] = useState(false);
  const audioEngine = AudioEngine.getInstance();
  const silentModeDetector = SilentModeDetector.getInstance();

  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (isInitialized) return;

      try {
        logger.info('[useAudioInitialization] First interaction detected');

        // 初始化 AudioContext
        await audioEngine.initialize();
        setIsInitialized(true);

        // 偵測靜音模式（僅行動裝置）
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          const silent = await silentModeDetector.detect();
          setIsSilentMode(silent);
          if (silent) {
            setShowSilentModeWarning(true);
            logger.warn('[useAudioInitialization] Device is in silent mode');
          }
        }

        // 預載關鍵音效
        setIsPreloading(true);
        const criticalSounds = await getCriticalSounds();
        await audioEngine.preloadSounds(criticalSounds);
        setIsPreloading(false);

        logger.info('[useAudioInitialization] Audio system ready');

        // 移除事件監聽器
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('keydown', handleFirstInteraction);
      } catch (error) {
        logger.error('[useAudioInitialization] Failed to initialize', error);
        setIsPreloading(false);
      }
    };

    // 監聽首次使用者互動
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [isInitialized]);

  // 延遲載入非關鍵音效
  useEffect(() => {
    if (!isInitialized || isPreloading) return;

    const loadNonCritical = async () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          try {
            const manifest = await fetchAudioManifest();
            const nonCritical = manifest.sounds.filter(s => s.priority !== 'critical');
            await audioEngine.preloadSounds(nonCritical);
            logger.info('[useAudioInitialization] Non-critical sounds loaded');
          } catch (error) {
            logger.error('[useAudioInitialization] Failed to load non-critical sounds', error);
          }
        });
      }
    };

    loadNonCritical();
  }, [isInitialized, isPreloading]);

  return {
    isInitialized,
    isPreloading,
    isSilentMode,
    showSilentModeWarning,
    dismissSilentModeWarning: () => setShowSilentModeWarning(false),
  };
}
