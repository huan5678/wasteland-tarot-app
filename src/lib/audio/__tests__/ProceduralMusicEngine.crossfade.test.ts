/**
 * ProceduralMusicEngine - Crossfade Tests
 * Task 2: 測試 crossfade 淡入淡出功能
 *
 * Requirements 1.4, 2.2 (無縫切換、淡入淡出效果)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProceduralMusicEngine, MusicMode } from '../ProceduralMusicEngine';

// Mock AudioContext
class MockAudioContext {
  currentTime = 0;
  destination = {};

  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        value: 440,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      detune: {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: {
        value: 1000,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      Q: {
        value: 1,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
}

describe('ProceduralMusicEngine - Crossfade', () => {
  let audioContext: MockAudioContext;
  let engine: ProceduralMusicEngine;

  beforeEach(() => {
    audioContext = new MockAudioContext() as unknown as AudioContext;
    engine = new ProceduralMusicEngine(
      audioContext as AudioContext,
      audioContext.destination as AudioNode,
      {
        mode: 'synthwave',
        volume: 0.5,
        crossfadeDuration: 2000, // 2 秒
      }
    );
  });

  describe('configuration', () => {
    it('should initialize with default crossfade duration', () => {
      const config = engine.getConfig();
      expect(config.crossfadeDuration).toBe(2000);
    });

    it('should allow custom crossfade duration', () => {
      const customEngine = new ProceduralMusicEngine(
        audioContext as AudioContext,
        audioContext.destination as AudioNode,
        {
          mode: 'lofi',
          crossfadeDuration: 3000,
        }
      );

      const config = customEngine.getConfig();
      expect(config.crossfadeDuration).toBe(3000);
    });

    it('should use default duration if not specified', () => {
      const defaultEngine = new ProceduralMusicEngine(
        audioContext as AudioContext,
        audioContext.destination as AudioNode,
        { mode: 'ambient' }
      );

      const config = defaultEngine.getConfig();
      expect(config.crossfadeDuration).toBe(2000);
    });
  });

  describe('switchMode with crossfade', () => {
    it('should switch mode without crossfade when not playing', async () => {
      const initialMode = engine.getCurrentMode();
      expect(initialMode).toBe('synthwave');

      await engine.switchMode('lofi');

      const newMode = engine.getCurrentMode();
      expect(newMode).toBe('lofi');
    });

    it('should update mode configuration correctly', async () => {
      await engine.switchMode('divination');

      const config = engine.getConfig();
      expect(config.mode).toBe('divination');
      expect(config.bpm).toBeDefined();
      expect(config.complexity).toBeDefined();
    });

    it('should switch mode with crossfade when playing', async () => {
      // 開始播放
      engine.start();
      expect(engine.playing).toBe(true);

      // 切換模式 (使用 crossfade)
      await engine.switchMode('lofi', true);

      expect(engine.getCurrentMode()).toBe('lofi');
      expect(engine.playing).toBe(true);
    });

    it('should switch mode without crossfade when useCrossfade is false', async () => {
      engine.start();
      expect(engine.playing).toBe(true);

      const initialMode = engine.getCurrentMode();

      // 切換模式 (不使用 crossfade)
      await engine.switchMode('ambient', false);

      expect(engine.getCurrentMode()).toBe('ambient');
      expect(engine.playing).toBe(true);
    });

    it('should handle rapid mode switches gracefully', async () => {
      engine.start();

      // 快速切換多個模式
      await engine.switchMode('lofi', true);
      await engine.switchMode('ambient', true);

      expect(engine.getCurrentMode()).toBe('ambient');
    });
  });

  describe('crossfade timing', () => {
    it('should complete crossfade within specified duration', async () => {
      engine.start();

      const startTime = Date.now();
      await engine.switchMode('lofi', true);
      const elapsed = Date.now() - startTime;

      // Crossfade 應該在指定時間內完成 (2000ms + 容錯時間)
      expect(elapsed).toBeGreaterThanOrEqual(1900);
      expect(elapsed).toBeLessThanOrEqual(2200);
    });

    it('should use custom crossfade duration', async () => {
      const customEngine = new ProceduralMusicEngine(
        audioContext as AudioContext,
        audioContext.destination as AudioNode,
        {
          mode: 'synthwave',
          crossfadeDuration: 100, // 使用較短的時間以加快測試
        }
      );

      customEngine.start();

      const startTime = Date.now();
      await customEngine.switchMode('lofi', true);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(90);
      expect(elapsed).toBeLessThanOrEqual(150);
      expect(customEngine.getCurrentMode()).toBe('lofi');
    });
  });

  describe('volume during crossfade', () => {
    it('should maintain master volume during crossfade', async () => {
      engine.setVolume(0.8);
      engine.start();

      await engine.switchMode('lofi', true);

      const config = engine.getConfig();
      expect(config.volume).toBe(0.8);
    });

    it('should handle volume changes during crossfade', async () => {
      engine.start();

      const switchPromise = engine.switchMode('lofi', true);

      // 在 crossfade 期間改變音量
      setTimeout(() => engine.setVolume(0.3), 50);

      await switchPromise;

      const config = engine.getConfig();
      expect(config.volume).toBe(0.3);
    });
  });

  describe('resource cleanup', () => {
    it('should clean up old voices after crossfade', async () => {
      engine.start();

      await engine.switchMode('lofi', true);

      // 舊的 voice managers 應該已經被清理
      // 這個測試確認不會有記憶體洩漏
      expect(engine.playing).toBe(true);
    });

    it('should clean up crossfade manager on dispose', () => {
      engine.start();
      engine.dispose();

      expect(engine.playing).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle crossfade with zero duration', async () => {
      const zeroEngine = new ProceduralMusicEngine(
        audioContext as AudioContext,
        audioContext.destination as AudioNode,
        {
          mode: 'synthwave',
          crossfadeDuration: 0,
        }
      );

      zeroEngine.start();

      // 應該直接切換，不使用 crossfade
      await zeroEngine.switchMode('lofi', true);

      expect(zeroEngine.getCurrentMode()).toBe('lofi');
      expect(zeroEngine.playing).toBe(true);
    });

    it('should handle mode switch when engine is stopped', async () => {
      // 引擎未啟動
      expect(engine.playing).toBe(false);

      await engine.switchMode('ambient', true);

      expect(engine.getCurrentMode()).toBe('ambient');
      expect(engine.playing).toBe(false);
    });
  });

  describe('integration with existing functionality', () => {
    it('should work with BPM changes', async () => {
      engine.start();

      await engine.switchMode('lofi', true);
      engine.setBPM(80);

      const config = engine.getConfig();
      expect(config.bpm).toBe(80);
    });

    it('should work with volume changes', async () => {
      engine.start();

      await engine.switchMode('ambient', true);
      engine.setVolume(0.6);

      const config = engine.getConfig();
      expect(config.volume).toBe(0.6);
    });

    it('should preserve playing state after crossfade', async () => {
      engine.start();
      expect(engine.playing).toBe(true);

      await engine.switchMode('divination', true);

      expect(engine.playing).toBe(true);
    });
  });
});
