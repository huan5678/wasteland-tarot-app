/**
 * Zustand Store for RhythmAudioSynthesizer
 * 管理全域唯一的音樂合成器實例
 */

import { create } from 'zustand';
import { RhythmAudioSynthesizer } from '@/lib/audio/RhythmAudioSynthesizer';
import { logger } from '@/lib/logger';

interface RhythmEngineState {
  // 合成器實例（全域唯一）
  synth: RhythmAudioSynthesizer | null;
  
  // AudioContext
  audioContext: AudioContext | null;
  
  // 初始化狀態
  isInitialized: boolean;
  
  // 合成器當前狀態（從 synth.getState() 同步）
  currentStep: number;
  currentLoop: number;
  currentPatternIndex: number;
  isPlaying: boolean;
  
  // Actions
  setSynth: (synth: RhythmAudioSynthesizer | null) => void;
  setAudioContext: (context: AudioContext | null) => void;
  setInitialized: (initialized: boolean) => void;
  updateSynthState: (partialState?: { currentStep?: number; currentLoop?: number }) => void; // 從 synth 同步狀態
  destroySynth: () => void; // 清理並銷毀 synth
}

export const useRhythmEngineStore = create<RhythmEngineState>((set, get) => ({
  // Initial state
  synth: null,
  audioContext: null,
  isInitialized: false,
  currentStep: 0,
  currentLoop: 1,
  currentPatternIndex: 0,
  isPlaying: false,

  // Set synth instance
  setSynth: (synth) => {
    logger.info('[RhythmEngineStore] Setting synth instance', { hasValue: !!synth });
    set({ synth });
    
    // 如果設置了新的 synth，立即同步狀態
    if (synth) {
      const state = synth.getState();
      set({
        currentStep: state.currentStep,
        currentLoop: state.currentLoop,
        currentPatternIndex: state.currentPatternIndex,
        isPlaying: state.isPlaying,
      });
    }
  },

  // Set audio context
  setAudioContext: (context) => {
    set({ audioContext: context });
  },

  // Set initialized flag
  setInitialized: (initialized) => {
    logger.info('[RhythmEngineStore] Setting initialized', { initialized });
    set({ isInitialized: initialized });
  },

  // Update synth state from the synth instance
  updateSynthState: (partialState?: { currentStep?: number; currentLoop?: number }) => {
    const { synth } = get();
    if (!synth) {
      logger.warn('[RhythmEngineStore] Cannot update state: synth not available');
      return;
    }

    // 如果有 partial state，只更新那些欄位
    if (partialState) {
      set(partialState);
      return;
    }

    // 否則從 synth 完整同步
    const state = synth.getState();
    set({
      currentStep: state.currentStep,
      currentLoop: state.currentLoop,
      currentPatternIndex: state.currentPatternIndex,
      isPlaying: state.isPlaying,
    });
  },

  // Destroy synth and reset state
  destroySynth: () => {
    const { synth } = get();
    
    if (synth) {
      logger.info('[RhythmEngineStore] Destroying synth instance');
      synth.stop();
      synth.destroy();
    }

    set({
      synth: null,
      isInitialized: false,
      currentStep: 0,
      currentLoop: 1,
      currentPatternIndex: 0,
      isPlaying: false,
    });
  },
}));
