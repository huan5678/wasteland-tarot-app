/**
 * useMusicEngine - ProceduralMusicEngine Integration Hook
 * 整合 ProceduralMusicEngine 與 musicPlayerStore
 *
 * 當 musicPlayerStore 的 currentMode 或 isPlaying 改變時，
 * 自動控制 ProceduralMusicEngine 的播放/停止
 */

'use client';

import { useEffect, useRef } from 'react';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import { useAudioStore } from '@/lib/audio/audioStore';
import { ProceduralMusicEngine, type MusicMode } from '@/lib/audio/ProceduralMusicEngine';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { logger } from '@/lib/logger';

export function useMusicEngine() {
  const engineRef = useRef<ProceduralMusicEngine | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitialized = useRef(false);

  // 使用獨立的 selector 避免物件重建
  const currentMode = useMusicPlayerStore((state) => state.currentMode);
  const isPlaying = useMusicPlayerStore((state) => state.isPlaying);
  const volume = useAudioStore((state) => state.volumes.music);
  const isMuted = useAudioStore((state) => state.muted.music);

  // ========== Debug: Log state from stores ==========
  useEffect(() => {
    console.log('[useMusicEngine] Store state:', {
      currentMode,
      isPlaying,
      volume,
      isMuted,
      finalVolume: isMuted ? 0 : volume,
    });
  }, [currentMode, isPlaying, volume, isMuted]);

  // 初始化 AudioContext 和 ProceduralMusicEngine
  // 延遲初始化直到使用者主動開始播放音樂
  // Task 7.7: 移除自動場景音樂 - 首次訪問時不自動播放
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialized.current) return;

    // 只有當使用者主動點擊播放按鈕時才初始化
    // 不再根據場景自動播放
    if (!isPlaying) return;

    const initEngine = async () => {
      try {
        logger.info('[useMusicEngine] Starting initialization...', {
          isPlaying,
          currentMode: currentMode || 'null (will use default)',
        });

        // 取得 AudioEngine 的 AudioContext
        const audioEngine = AudioEngine.getInstance();
        await audioEngine.initialize();

        const context = audioEngine.getContext();
        if (!context) {
          logger.error('[useMusicEngine] Failed to get AudioContext');
          return;
        }

        logger.info('[useMusicEngine] AudioContext obtained:', {
          state: context.state,
          sampleRate: context.sampleRate,
        });

        audioContextRef.current = context;

        // 使用 currentMode 或預設模式 'synthwave'
        const initialMode = (currentMode || 'synthwave') as MusicMode;

        // 建立 ProceduralMusicEngine
        const destination = context.destination;
        engineRef.current = new ProceduralMusicEngine(
          context,
          destination,
          {
            mode: initialMode,
            volume: isMuted ? 0 : volume,
          }
        );

        isInitialized.current = true;
        logger.info('[useMusicEngine] Initialized successfully with mode:', initialMode);

        // ========== 立即開始播放 ==========
        if (isPlaying) {
          logger.info('[useMusicEngine] Starting playback immediately after initialization');
          engineRef.current.start();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        logger.error('[useMusicEngine] Initialization failed', {
          message: errorMessage,
          stack: errorStack,
          isPlaying,
          currentMode,
        });
      }
    };

    initEngine();

    // Cleanup
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      isInitialized.current = false;
    };
  }, [isPlaying, currentMode, volume, isMuted]);

  // 控制音樂播放
  useEffect(() => {
    console.log('[useMusicEngine] Playback control effect triggered', {
      hasEngine: !!engineRef.current,
      isInitialized: isInitialized.current,
      isPlaying,
      currentMode,
    });

    if (!engineRef.current || !isInitialized.current) {
      console.log('[useMusicEngine] Skipping: engine not ready');
      return;
    }

    const engine = engineRef.current;

    if (isPlaying && currentMode) {
      logger.info(`[useMusicEngine] Playing mode: ${currentMode}`);

      // 如果當前模式與引擎模式不同，先切換模式
      if (engine.getCurrentMode() !== currentMode) {
        logger.info('[useMusicEngine] Switching mode and restarting playback');
        engine.switchMode(currentMode as MusicMode, false) // false = 不淡出，直接切換
          .then(() => {
            logger.info('[useMusicEngine] Mode switched, starting playback');
            engine.start();
          })
          .catch((error) => {
            logger.error('[useMusicEngine] Failed to switch mode', error);
          });
      } else if (!engine.playing) {
        // 相同模式，直接開始播放
        logger.info('[useMusicEngine] Starting playback (same mode)');
        engine.start();
      }
    } else if (!isPlaying && engine.playing) {
      logger.info('[useMusicEngine] Stopping playback');
      engine.stop();
    }
  }, [currentMode, isPlaying]);

  // 控制音量
  useEffect(() => {
    if (!engineRef.current || !isInitialized.current) {
      return;
    }

    const finalVolume = isMuted ? 0 : volume;
    engineRef.current.setVolume(finalVolume);
    logger.info(`[useMusicEngine] Volume set to ${finalVolume}`);
  }, [volume, isMuted]);

  return {
    engine: engineRef.current,
    isReady: isInitialized.current,
  };
}
