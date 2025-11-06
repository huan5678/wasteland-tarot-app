/**
 * useRhythmMusicEngine - RhythmAudioSynthesizer Integration Hook
 * 整合 RhythmAudioSynthesizer 與 rhythmPlaylistStore
 *
 * 從資料庫載入系統預設 Pattern 並播放節奏音樂
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import { useRhythmPlaylistStore } from '@/lib/stores/rhythmPlaylistStore';
import { useAudioStore } from '@/lib/audio/audioStore';
import { RhythmAudioSynthesizer } from '@/lib/audio/RhythmAudioSynthesizer';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { logger } from '@/lib/logger';
import { useRhythmEngineStore } from '@/stores/rhythmEngineStore';

export function useRhythmMusicEngine() {
  // 從 Zustand store 獲取全域狀態
  const synth = useRhythmEngineStore((state) => state.synth);
  const audioContext = useRhythmEngineStore((state) => state.audioContext);
  const isInitialized = useRhythmEngineStore((state) => state.isInitialized);
  const setSynth = useRhythmEngineStore((state) => state.setSynth);
  const setAudioContext = useRhythmEngineStore((state) => state.setAudioContext);
  const setInitialized = useRhythmEngineStore((state) => state.setInitialized);
  const updateSynthState = useRhythmEngineStore((state) => state.updateSynthState);
  const destroySynth = useRhythmEngineStore((state) => state.destroySynth);

  // Store selectors
  const isPlaying = useMusicPlayerStore((state) => state.isPlaying);
  const volume = useAudioStore((state) => state.volumes.music);
  const isMuted = useAudioStore((state) => state.muted.music);

  // Rhythm store
  const systemPresets = useRhythmPlaylistStore((state) => state.systemPresets || []);
  const currentPatternIndex = useMusicPlayerStore((state) => state.currentModeIndex);
  const loadSystemPresets = useRhythmPlaylistStore((state) => state.loadSystemPresets);

  // Debug: Log when hook is called
  logger.info('[useRhythmMusicEngine] Hook called', {
    presetsCount: systemPresets.length,
    hasLoadFunction: !!loadSystemPresets,
    currentIndex: currentPatternIndex,
  });

  // 載入系統預設 Pattern
  useEffect(() => {
    logger.info('[useRhythmMusicEngine] Load presets effect triggered', {
      presetsCount: systemPresets.length,
      hasLoadFunction: !!loadSystemPresets,
    });

    if (systemPresets.length === 0 && loadSystemPresets) {
      logger.info('[useRhythmMusicEngine] Loading system presets from database');
      loadSystemPresets().catch((error) => {
        logger.error('[useRhythmMusicEngine] Failed to load system presets', error);
      });
    } else if (systemPresets.length > 0) {
      logger.info('[useRhythmMusicEngine] System presets already loaded', {
        count: systemPresets.length,
      });
    }
  }, [systemPresets.length, loadSystemPresets]);

  // 初始化 RhythmAudioSynthesizer - 只在 systemPresets 載入後初始化一次
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 如果已經初始化，跳過
    if (isInitialized && synth) {
      logger.info('[useRhythmMusicEngine] Already initialized, skipping');
      return;
    }
    
    if (systemPresets.length === 0) {
      logger.warn('[useRhythmMusicEngine] No system presets loaded yet, waiting...');
      return;
    }

    let isCancelled = false;
    let newSynth: RhythmAudioSynthesizer | null = null;

    const initSynth = async () => {
      try {
        logger.info('[useRhythmMusicEngine] Initializing RhythmAudioSynthesizer', {
          presetsCount: systemPresets.length,
          currentIndex: currentPatternIndex,
        });

        const audioEngine = AudioEngine.getInstance();
        await audioEngine.initialize();
        
        if (isCancelled) {
          logger.warn('[useRhythmMusicEngine] Initialization cancelled (cleanup called)');
          return;
        }

        const context = audioEngine.getContext();

        if (!context) {
          logger.error('[useRhythmMusicEngine] Failed to get AudioContext');
          return;
        }

        if (context.state === 'suspended') {
          logger.info('[useRhythmMusicEngine] AudioContext is suspended, will resume on first play()');
        }

        setAudioContext(context);

        const currentPreset = systemPresets[currentPatternIndex] || systemPresets[0];

        logger.info('[useRhythmMusicEngine] Creating synthesizer with pattern:', {
          name: currentPreset.name,
          id: currentPreset.id,
          index: currentPatternIndex,
        });

        newSynth = new RhythmAudioSynthesizer(
          context,
          context.destination,
          {
            bpm: 120,
            volume: isMuted ? 0 : volume,
            loopCount: 4,
          }
        );

        const patterns = systemPresets.map(preset => preset.pattern);
        logger.info('[useRhythmMusicEngine] Loading patterns to synthesizer', {
          patternsCount: patterns.length,
          startIndex: currentPatternIndex,
        });
        
        newSynth.loadPlaylist(patterns, currentPatternIndex);

        if (isCancelled) {
          logger.warn('[useRhythmMusicEngine] Initialization completed but cancelled, cleaning up');
          newSynth.stop();
          newSynth.destroy();
          return;
        }

        newSynth.setOnStateUpdate((state) => {
          updateSynthState({
            currentStep: state.currentStep,
            currentLoop: state.currentLoop,
          });
        });

        setSynth(newSynth);
        setInitialized(true);

        logger.info('[useRhythmMusicEngine] Initialized successfully');
      } catch (error) {
        logger.error('[useRhythmMusicEngine] Initialization failed', error);
      }
    };

    initSynth();

    return () => {
      isCancelled = true;
      logger.event('[useRhythmMusicEngine] Init cleanup triggered');
      
      // 清理 newSynth（如果創建了但未設置到 store）
      if (newSynth && newSynth !== synth) {
        logger.event('[useRhythmMusicEngine] Destroying newly created synth during cleanup');
        newSynth.stop();
        newSynth.destroy();
      }
    };
  }, [systemPresets.length, isInitialized, synth]); // 添加依賴確保正確跳過

  // 控制播放/暫停 - 只響應 isPlaying 變化
  useEffect(() => {
    if (!synth || !isInitialized) {
      logger.warn('[useRhythmMusicEngine] Cannot control playback - synth not ready', {
        hasSynth: !!synth,
        isInitialized,
      });
      return;
    }

    // 取得 synth 當前狀態
    const synthState = synth.getState();
    
    logger.info('[useRhythmMusicEngine] Play/Pause effect triggered', {
      isPlaying,
      synthIsPlaying: synthState.isPlaying,
      currentStep: synthState.currentStep,
      currentLoop: synthState.currentLoop,
    });

    if (isPlaying) {
      // 用戶想要播放
      
      // 檢查 synth 是否已經在播放
      if (synthState.isPlaying) {
        logger.info('[useRhythmMusicEngine] Already playing, skipping play() call');
        return;
      }

      // 先確保 AudioContext 是 running 狀態（用戶交互後才能 resume）
      const resumeAndPlay = async () => {
        try {
          if (audioContext && audioContext.state === 'suspended') {
            logger.info('[useRhythmMusicEngine] Resuming AudioContext before playback');
            await audioContext.resume();
          }

          logger.info('[useRhythmMusicEngine] Calling synth.play()');
          synth.play();
          logger.info('[useRhythmMusicEngine] Play() called successfully');
          updateSynthState(); // 同步狀態到 store
        } catch (error) {
          logger.error('[useRhythmMusicEngine] Play() failed', error);
        }
      };

      resumeAndPlay();
    } else {
      // 用戶想要暫停
      
      // 檢查 synth 是否已經暫停
      if (!synthState.isPlaying) {
        logger.info('[useRhythmMusicEngine] Already paused, skipping pause() call');
        return;
      }

      logger.info('[useRhythmMusicEngine] Calling synth.pause()');
      try {
        synth.pause();
        logger.info('[useRhythmMusicEngine] Pause() called successfully');
        updateSynthState(); // 同步狀態到 store
      } catch (error) {
        logger.error('[useRhythmMusicEngine] Pause() failed', error);
      }
    }
  }, [isPlaying]); // 只依賴 isPlaying，避免不必要的重複執行

  // 控制音量（實時更新）
  useEffect(() => {
    if (!synth || !isInitialized) return;

    const finalVolume = isMuted ? 0 : volume;
    synth.setVolume(finalVolume);
    logger.info(`[useRhythmMusicEngine] Volume updated to ${finalVolume}`);
  }, [volume, isMuted, synth, isInitialized]);

  // 定期同步 synth 狀態到 store（用於 progress bar 更新）
  useEffect(() => {
    if (!synth || !isInitialized) return;

    const intervalId = setInterval(() => {
      updateSynthState(); // 每 100ms 同步一次狀態
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [synth, isInitialized, updateSynthState]);

  // 切換 Pattern (next/previous) - 實時切換不需要重建
  useEffect(() => {
    if (!synth || !isInitialized) return;
    if (systemPresets.length === 0) return;

    const currentPreset = systemPresets[currentPatternIndex];
    if (!currentPreset) {
      logger.warn('[useRhythmMusicEngine] Invalid pattern index:', currentPatternIndex);
      return;
    }

    logger.info('[useRhythmMusicEngine] Switching to pattern:', {
      index: currentPatternIndex,
      name: currentPreset.name,
      patternsLoaded: synth.getState().isPlaying ? 'playing' : 'stopped',
    });

    // 切換到指定的 Pattern（保持播放狀態）
    synth.setCurrentPatternIndex(currentPatternIndex);
    updateSynthState(); // 同步狀態到 store
  }, [currentPatternIndex, systemPresets, synth, isInitialized, updateSynthState]);

  // 暴露 stop 方法供外部調用
  const stopAndReset = useCallback(() => {
    if (synth && isInitialized) {
      logger.info('[useRhythmMusicEngine] Manual stop and reset called');
      synth.stop();
      updateSynthState(); // 同步狀態到 store
    }
  }, [synth, isInitialized, updateSynthState]);

  // 組件卸載時清理
  useEffect(() => {
    return () => {
      logger.event('[useRhythmMusicEngine] Component unmounting, destroying synth');
      destroySynth();
    };
  }, [destroySynth]);

  return {
    synth,
    isReady: isInitialized,
    systemPresets,
    stopAndReset, // 暴露 stop 方法
  };
}
