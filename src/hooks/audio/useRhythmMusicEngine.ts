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

  // ========== Refs for latest values ==========
  const isPlayingRef = useRef(isPlaying);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // ========== Initialization Lock ==========
  // 使用 ref 追蹤初始化狀態，防止重複初始化
  const isInitializing = useRef(false);
  

  // 載入系統預設 Pattern
  useEffect(() => {
    if (systemPresets.length === 0 && loadSystemPresets) {
      loadSystemPresets().catch((error) => {
        logger.error('[useRhythmMusicEngine] Failed to load system presets', error);
      });
    }
  }, [systemPresets.length, loadSystemPresets]);

  // 初始化 RhythmAudioSynthesizer
  // 重要：只在用戶真正想要播放時才初始化（避免 autoplay policy 阻止）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (systemPresets.length === 0) {
      logger.warn('[useRhythmMusicEngine] No system presets loaded yet, waiting...');
      return;
    }

    // 如果 synth 已存在，跳過初始化
    if (synth) {
      return;
    }

    // 關鍵：只在用戶真正想播放時才初始化（確保有用戶互動）
    if (!isPlaying) {
      return;
    }

    // 如果 isInitialized 是 true 但 synth 不存在（例如頁面重新載入），重置狀態
    if (isInitialized && !synth) {
      logger.warn('[useRhythmMusicEngine] State inconsistency: initialized but no synth, resetting...');
      setInitialized(false);
    }

    // 防止並發初始化
    if (isInitializing.current) {
      return;
    }

    let isCancelled = false;

    const initSynth = async () => {
      isInitializing.current = true;

      try {
        const audioEngine = AudioEngine.getInstance();
        await audioEngine.initialize();
        
        if (isCancelled) {
          logger.warn('[useRhythmMusicEngine] Initialization cancelled (cleanup called)');
          isInitializing.current = false;
          return;
        }

        const context = audioEngine.getContext();

        if (!context) {
          logger.error('[useRhythmMusicEngine] Failed to get AudioContext');
          isInitializing.current = false;
          return;
        }

        if (context.state === 'suspended') {
          logger.info('[useRhythmMusicEngine] AudioContext is suspended, will resume on first play()');
        }

        setAudioContext(context);

        const currentPreset = systemPresets[currentPatternIndex] || systemPresets[0];

        const newSynth = new RhythmAudioSynthesizer(
          context,
          context.destination,
          {
            bpm: 120,
            volume: isMuted ? 0 : volume,
            loopCount: 4,
          }
        );

        const patterns = systemPresets.map(preset => preset.pattern);
        newSynth.loadPlaylist(patterns, currentPatternIndex);

        if (isCancelled) {
          logger.warn('[useRhythmMusicEngine] Initialization completed but cancelled, cleaning up');
          newSynth.stop();
          newSynth.destroy();
          isInitializing.current = false;
          return;
        }

        newSynth.setOnStateUpdate((state) => {
          updateSynthState({
            currentStep: state.currentStep,
            currentLoop: state.currentLoop,
          });
        });

        // 設置到 store（這會觸發全域狀態更新）
        setSynth(newSynth);
        setInitialized(true);

        // 如果 store 狀態是 playing，自動開始播放（使用 ref 獲取最新值）
        if (isPlayingRef.current && !isCancelled) {
          // 確保 AudioContext 是 running
          if (context.state === 'suspended') {
            try {
              await context.resume();
            } catch (err) {
              logger.error('[useRhythmMusicEngine] Failed to resume AudioContext', err);
            }
          }
          newSynth.play();
        }
      } catch (error) {
        logger.error('[useRhythmMusicEngine] Initialization failed', error);
        // 重要：確保錯誤時也重置 flag
        isInitializing.current = false;
      } finally {
        // 成功時也重置 flag（雙保險）
        if (!isCancelled) {
          isInitializing.current = false;
        }
      }
    };

    initSynth();

    return () => {
      // 在 cleanup 時標記為 cancelled，但不要破壞已初始化的 synth
      isCancelled = true;

      // 重要：如果初始化還沒完成就被取消，需要重置 isInitializing flag
      // 否則在 React Strict Mode 下會導致第二次 mount 時無法初始化
      if (isInitializing.current && !synth) {
        isInitializing.current = false;
      }
    };
  }, [systemPresets.length, isPlaying, synth, isInitialized]); // 加入 isPlaying 觸發初始化

  // 控制播放/暫停 - 只響應 isPlaying 變化
  useEffect(() => {
    // 如果 synth 未就緒，等待初始化完成
    if (!synth || !isInitialized) {
      // 初始化會在 isPlaying 為 true 時自動觸發（見上面的初始化 effect）
      // 初始化完成後會自動開始播放，所以這裡不需要做任何事
      return;
    }

    // 取得 synth 當前狀態
    const synthState = synth.getState();

    if (isPlaying) {
      // 用戶想要播放
      
      // 檢查 synth 是否已經在播放
      if (synthState.isPlaying) {
        return;
      }

      // 先確保 AudioContext 是 running 狀態（用戶交互後才能 resume）
      const resumeAndPlay = async () => {
        try {
          if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          synth.play();
          
          // 立即同步狀態
          updateSynthState();
        } catch (error) {
          logger.error('[useRhythmMusicEngine] Play() failed', error);
        }
      };

      resumeAndPlay();
    } else {
      // 用戶想要暫停
      
      // 檢查 synth 是否已經暫停
      if (!synthState.isPlaying) {
        return;
      }

      try {
        synth.pause();
        
        // 立即同步狀態
        updateSynthState();
      } catch (error) {
        logger.error('[useRhythmMusicEngine] Pause() failed', error);
      }
    }
  }, [isPlaying, synth, isInitialized, audioContext, updateSynthState, systemPresets, volume, isMuted, currentPatternIndex]); // 完整依賴

  // 控制音量（實時更新）
  useEffect(() => {
    if (!synth || !isInitialized) return;

    const finalVolume = isMuted ? 0 : volume;
    synth.setVolume(finalVolume);
  }, [volume, isMuted, synth, isInitialized]);

  // 定期同步 synth 狀態到 store（用於 progress bar 更新）
  // 當 isPlaying 為 true 時啟動輪詢
  useEffect(() => {
    if (!synth || !isInitialized || !isPlaying) return;

    // 立即同步一次
    updateSynthState();

    const intervalId = setInterval(() => {
      updateSynthState(); // 每 100ms 同步一次狀態
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [synth, isInitialized, isPlaying, updateSynthState]);

  // 切換 Pattern (next/previous) - 實時切換不需要重建
  useEffect(() => {
    if (!synth || !isInitialized) return;
    if (systemPresets.length === 0) return;

    const currentPreset = systemPresets[currentPatternIndex];
    if (!currentPreset) {
      logger.warn('[useRhythmMusicEngine] Invalid pattern index:', currentPatternIndex);
      return;
    }

    // 切換到指定的 Pattern（保持播放狀態）
    synth.setCurrentPatternIndex(currentPatternIndex);
    updateSynthState(); // 同步狀態到 store
  }, [currentPatternIndex, systemPresets, synth, isInitialized, updateSynthState]);

  // 暴露 stop 方法供外部調用
  const stopAndReset = useCallback(() => {
    if (synth && isInitialized) {
      synth.stop();
      updateSynthState(); // 同步狀態到 store
    }
  }, [synth, isInitialized, updateSynthState]);

  // 組件卸載時清理
  // 注意：在 Strict Mode 下，這會導致 synth 被銷毀然後重新創建
  // 我們不希望這樣，所以註解掉全域清理
  // useEffect(() => {
  //   return () => {
  //     logger.event('[useRhythmMusicEngine] Component unmounting, destroying synth');
  //     destroySynth();
  //   };
  // }, [destroySynth]);

  return {
    synth,
    isReady: isInitialized,
    systemPresets,
    stopAndReset, // 暴露 stop 方法
  };
}
