/**
 * useRhythmMusicEngine - RhythmAudioSynthesizer Integration Hook
 * 整合 RhythmAudioSynthesizer 與 rhythmPlaylistStore
 *
 * 從資料庫載入系統預設 Pattern 並播放節奏音樂
 */

'use client';

import { useEffect, useRef } from 'react';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import { useRhythmPlaylistStore } from '@/lib/stores/rhythmPlaylistStore';
import { useAudioStore } from '@/lib/audio/audioStore';
import { RhythmAudioSynthesizer } from '@/lib/audio/RhythmAudioSynthesizer';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { logger } from '@/lib/logger';

export function useRhythmMusicEngine() {
  const synthRef = useRef<RhythmAudioSynthesizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitialized = useRef(false);

  // Store selectors
  const isPlaying = useMusicPlayerStore((state) => state.isPlaying);
  const volume = useAudioStore((state) => state.volumes.music);
  const isMuted = useAudioStore((state) => state.muted.music);

  // Rhythm store
  const systemPresets = useRhythmPlaylistStore((state) => state.systemPresets || []);
  const currentPatternIndex = useMusicPlayerStore((state) => state.currentModeIndex);
  const loadSystemPresets = useRhythmPlaylistStore((state) => state.loadSystemPresets);

  // 載入系統預設 Pattern
  useEffect(() => {
    if (systemPresets.length === 0 && loadSystemPresets) {
      logger.info('[useRhythmMusicEngine] Loading system presets from database');
      loadSystemPresets().catch((error) => {
        logger.error('[useRhythmMusicEngine] Failed to load system presets', error);
      });
    }
  }, [systemPresets.length, loadSystemPresets]);

  // 初始化 RhythmAudioSynthesizer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialized.current) return;
    if (!isPlaying) return;
    if (systemPresets.length === 0) {
      logger.warn('[useRhythmMusicEngine] No system presets loaded yet');
      return;
    }

    const initSynth = async () => {
      try {
        logger.info('[useRhythmMusicEngine] Initializing RhythmAudioSynthesizer');

        // 取得 AudioContext
        const audioEngine = AudioEngine.getInstance();
        await audioEngine.initialize();
        const context = audioEngine.getContext();

        if (!context) {
          logger.error('[useRhythmMusicEngine] Failed to get AudioContext');
          return;
        }

        audioContextRef.current = context;

        // 取得當前 Pattern
        const currentPreset = systemPresets[currentPatternIndex] || systemPresets[0];

        logger.info('[useRhythmMusicEngine] Creating synthesizer with pattern:', {
          name: currentPreset.name,
          id: currentPreset.id,
          index: currentPatternIndex,
        });

        // 創建 RhythmAudioSynthesizer
        synthRef.current = new RhythmAudioSynthesizer(
          context,
          context.destination,
          {
            bpm: 120,
            volume: isMuted ? 0 : volume,
            loopCount: 4,
          }
        );

        // 載入 Pattern 到播放清單
        synthRef.current.loadPlaylist(
          systemPresets.map(preset => preset.pattern),
          currentPatternIndex
        );

        isInitialized.current = true;
        logger.info('[useRhythmMusicEngine] Initialized successfully');

        // 開始播放
        if (isPlaying) {
          synthRef.current.play();
          logger.info('[useRhythmMusicEngine] Started playback');
        }
      } catch (error) {
        logger.error('[useRhythmMusicEngine] Initialization failed', error);
      }
    };

    initSynth();

    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
        synthRef.current.destroy();
        synthRef.current = null;
      }
      isInitialized.current = false;
    };
  }, [isPlaying, systemPresets, currentPatternIndex, volume, isMuted]);

  // 控制播放/暫停
  useEffect(() => {
    if (!synthRef.current || !isInitialized.current) return;

    if (isPlaying) {
      logger.info('[useRhythmMusicEngine] Resuming playback');
      synthRef.current.play();
    } else {
      logger.info('[useRhythmMusicEngine] Pausing playback');
      synthRef.current.pause();
    }
  }, [isPlaying]);

  // 控制音量
  useEffect(() => {
    if (!synthRef.current || !isInitialized.current) return;

    const finalVolume = isMuted ? 0 : volume;
    synthRef.current.setVolume(finalVolume);
    logger.info(`[useRhythmMusicEngine] Volume set to ${finalVolume}`);
  }, [volume, isMuted]);

  // 切換 Pattern (next/previous)
  useEffect(() => {
    if (!synthRef.current || !isInitialized.current) return;
    if (systemPresets.length === 0) return;

    const currentPreset = systemPresets[currentPatternIndex];
    if (!currentPreset) return;

    logger.info('[useRhythmMusicEngine] Switching to pattern:', {
      index: currentPatternIndex,
      name: currentPreset.name,
    });

    // 切換到指定的 Pattern
    synthRef.current.setCurrentPatternIndex(currentPatternIndex);
  }, [currentPatternIndex, systemPresets]);

  return {
    synth: synthRef.current,
    isReady: isInitialized.current,
    systemPresets,
  };
}
