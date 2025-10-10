/**
 * AudioStore Smoke Test
 * 簡單的煙霧測試來驗證 audioStore 可以被正確導入和使用
 */

// Setup localStorage mock BEFORE imports
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
} as Storage;

import { describe, it, expect } from 'vitest';
import { useAudioStore } from '../audioStore';

describe('AudioStore Smoke Test', () => {
  it('should import useAudioStore successfully', () => {
    expect(useAudioStore).toBeDefined();
    expect(typeof useAudioStore).toBe('function');
  });

  it('should have getState method', () => {
    expect(useAudioStore.getState).toBeDefined();
    expect(typeof useAudioStore.getState).toBe('function');
  });

  it('should have initial state', () => {
    const state = useAudioStore.getState();
    expect(state).toBeDefined();
    expect(state).toHaveProperty('volumes');
    expect(state).toHaveProperty('muted');
    expect(state).toHaveProperty('isPlaying');
  });

  it('should have Task 1 actions', () => {
    const state = useAudioStore.getState();

    console.log('State keys:', Object.keys(state));
    console.log('setCurrentMusicMode type:', typeof state.setCurrentMusicMode);
    console.log('setMusicPlayerInitialized type:', typeof state.setMusicPlayerInitialized);
    console.log('setIsPlaying type:', typeof state.setIsPlaying);

    expect(state).toHaveProperty('setCurrentMusicMode');
    expect(state).toHaveProperty('setMusicPlayerInitialized');
    expect(state).toHaveProperty('setIsPlaying');

    expect(typeof state.setCurrentMusicMode).toBe('function');
    expect(typeof state.setMusicPlayerInitialized).toBe('function');
    expect(typeof state.setIsPlaying).toBe('function');
  });
});
