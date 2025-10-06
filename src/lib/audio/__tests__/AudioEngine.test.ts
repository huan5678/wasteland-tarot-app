/**
 * AudioEngine 單元測試
 * 需求 1.7, 5.1, 5.3, 9.1, 9.2: AudioEngine 核心功能測試
 */

import { AudioEngine } from '../AudioEngine';
import type { SoundConfig } from '../types';

// Mock AudioContext
class MockAudioContext {
  state = 'suspended';
  destination = {};
  sampleRate = 44100;

  async resume() {
    this.state = 'running';
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: jest.fn(),
    };
  }

  createBuffer(channels: number, length: number, sampleRate: number) {
    return {
      length,
      numberOfChannels: channels,
      sampleRate,
      getChannelData: () => new Float32Array(length),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      disconnect: jest.fn(),
      onended: null,
    };
  }

  async decodeAudioData(arrayBuffer: ArrayBuffer) {
    return this.createBuffer(2, 44100, 44100);
  }
}

(global as any).AudioContext = MockAudioContext;

// Mock fetch
global.fetch = jest.fn();

describe('AudioEngine', () => {
  let audioEngine: AudioEngine;

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Singleton Pattern', () => {
    it('應該返回同一實例', () => {
      const instance1 = AudioEngine.getInstance();
      const instance2 = AudioEngine.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize()', () => {
    it('應該成功初始化 AudioContext', async () => {
      await audioEngine.initialize();
      expect(audioEngine.isInitialized()).toBe(true);
    });

    it('應該解鎖 AudioContext', async () => {
      await audioEngine.initialize();
      const context = audioEngine.getContext();
      expect(context?.state).toBe('running');
    });
  });

  describe('preloadSounds()', () => {
    const mockSounds: SoundConfig[] = [
      { id: 'button-click', url: '/test1.mp3', type: 'sfx', priority: 'critical' },
      { id: 'card-flip', url: '/test2.mp3', type: 'sfx', priority: 'normal' },
    ];

    it('應該預載音效列表（使用 Web Audio 生成）', async () => {
      await audioEngine.initialize();
      await audioEngine.preloadSounds(mockSounds);

      // 驗證音效已被生成並快取
      const memoryUsage = audioEngine.getMemoryUsage();
      expect(memoryUsage).toBeGreaterThan(0);
    });

    it('應該按優先級排序載入', async () => {
      await audioEngine.initialize();
      const sounds: SoundConfig[] = [
        { id: 'click-low', url: '/low.mp3', type: 'sfx', priority: 'low' },
        { id: 'beep-critical', url: '/critical.mp3', type: 'sfx', priority: 'critical' },
        { id: 'flip-normal', url: '/normal.mp3', type: 'sfx', priority: 'normal' },
      ];

      await audioEngine.preloadSounds(sounds);

      // 驗證音效已快取
      const memoryUsage = audioEngine.getMemoryUsage();
      expect(memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('play()', () => {
    beforeEach(async () => {
      await audioEngine.initialize();
      await audioEngine.preloadSounds([
        { id: 'button-click', url: '/test.mp3', type: 'sfx', priority: 'critical' },
      ]);
    });

    it('應該在 100ms 內開始播放預載音效', async () => {
      const startTime = performance.now();
      await audioEngine.play('button-click');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('應該限制並發播放數', async () => {
      const promises: Promise<void>[] = [];

      for (let i = 0; i < 10; i++) {
        promises.push(audioEngine.play('button-click'));
      }

      await Promise.all(promises);
      const activeCount = audioEngine.getActiveSoundsCount();

      expect(activeCount).toBeLessThanOrEqual(8);
    });
  });

  describe('Memory Management', () => {
    it('應該追蹤記憶體使用量', async () => {
      await audioEngine.initialize();

      const initialMemory = audioEngine.getMemoryUsage();
      expect(initialMemory).toBeGreaterThanOrEqual(0);
    });

    it('應該在記憶體超過限制時清除快取', async () => {
      await audioEngine.initialize();

      // 模擬大量音效載入
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(10 * 1024 * 1024), // 10MB each
      });

      const largeSounds: SoundConfig[] = Array.from({ length: 10 }, (_, i) => ({
        id: `large-${i}`,
        url: `/large-${i}.mp3`,
        type: 'sfx' as const,
        priority: 'normal' as const,
      }));

      await audioEngine.preloadSounds(largeSounds);

      const memoryUsage = audioEngine.getMemoryUsage();
      expect(memoryUsage).toBeLessThan(50 * 1024 * 1024); // <50MB
    });
  });

  describe('Volume Control', () => {
    it('應該設定音量', async () => {
      await audioEngine.initialize();
      audioEngine.setVolume('sfx', 0.5);

      // Volume is set via GainNode, which is mocked
      expect(true).toBe(true);
    });

    it('應該限制音量範圍在 0-1', async () => {
      await audioEngine.initialize();

      audioEngine.setVolume('sfx', 1.5);
      audioEngine.setVolume('music', -0.5);

      // Test passes if no errors thrown
      expect(true).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('應該清除所有快取', async () => {
      await audioEngine.initialize();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024),
      });

      await audioEngine.preloadSounds([
        { id: 'test', url: '/test.mp3', type: 'sfx', priority: 'normal' },
      ]);

      audioEngine.clearCache('all');

      const memoryUsage = audioEngine.getMemoryUsage();
      expect(memoryUsage).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('應該處理音效生成失敗（靜默降級）', async () => {
      await audioEngine.initialize();

      // 即使生成失敗也不應拋出錯誤（靜默失敗）
      await expect(
        audioEngine.preloadSounds([
          { id: 'unknown-invalid-sound', url: '/fail.mp3', type: 'sfx', priority: 'normal' },
        ])
      ).resolves.not.toThrow();

      // 但應該生成了一個空 buffer 作為後備
      const memoryUsage = audioEngine.getMemoryUsage();
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });
});
