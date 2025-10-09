/**
 * SoundGenerator 單元測試
 * 需求: 3.1 - Web Audio API 音效生成器實作
 */

import {
  generateButtonClick,
  generateCardFlip,
  generatePipBoyBeep,
  generateTerminalType,
  generateVaultDoor,
  generateShuffle,
  generateReveal,
} from '../SoundGenerator';

// Mock Web Audio API
class MockAudioContext {
  sampleRate = 44100;
  destination = {
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  createBuffer(channels: number, length: number, sampleRate: number) {
    const buffer = {
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: (channel: number) => new Float32Array(length),
    };
    return buffer as AudioBuffer;
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as any;
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      onended: null,
    } as any;
  }

  createOscillator() {
    return {
      frequency: { value: 440 },
      type: 'sine' as OscillatorType,
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    } as any;
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }

  get state() {
    return 'running';
  }
}

describe('SoundGenerator', () => {
  let audioContext: AudioContext;
  let destination: AudioNode;

  beforeEach(() => {
    // 使用 Mock AudioContext
    audioContext = new MockAudioContext() as any;
    destination = audioContext.destination;
  });

  afterEach(() => {
    // 清理
    if (audioContext && typeof audioContext.close === 'function') {
      audioContext.close();
    }
  });

  describe('generateButtonClick', () => {
    it('應該生成短促的點擊音', async () => {
      const buffer = await generateButtonClick(audioContext, destination);

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
      expect(buffer).toHaveProperty('numberOfChannels');
      expect(buffer.duration).toBeGreaterThan(0);
      expect(buffer.duration).toBeLessThan(0.2); // 短於 200ms
      expect(buffer.numberOfChannels).toBeGreaterThanOrEqual(1);
    });

    it('應該支援自訂選項', async () => {
      const buffer = await generateButtonClick(audioContext, destination, {
        frequency: 800,
        duration: 0.1,
        volume: 0.5,
      });

      expect(buffer).toBeTruthy();
      expect(buffer.duration).toBeCloseTo(0.1, 2);
    });
  });

  describe('generateCardFlip', () => {
    it('應該生成翻牌音效（noise + envelope）', async () => {
      const buffer = await generateCardFlip(audioContext, destination);

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
      expect(buffer.duration).toBeGreaterThan(0);
      expect(buffer.duration).toBeLessThan(0.5); // 短於 500ms
    });

    it('應該包含 envelope 效果', async () => {
      const buffer = await generateCardFlip(audioContext, destination, {
        envelope: {
          attack: 0.01,
          decay: 0.05,
          sustain: 0.5,
          release: 0.1,
        },
      });

      expect(buffer).toBeTruthy();
      // 驗證 buffer 包含音訊資料
      const channelData = buffer.getChannelData(0);
      expect(channelData.length).toBeGreaterThan(0);
    });
  });

  describe('generatePipBoyBeep', () => {
    it('應該生成 Pip-Boy 特色嗶聲（方波）', async () => {
      const buffer = await generatePipBoyBeep(audioContext, destination);

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
      expect(buffer.duration).toBeGreaterThan(0);
      expect(buffer.duration).toBeLessThan(0.3);
    });

    it('應該使用方波振盪器', async () => {
      const buffer = await generatePipBoyBeep(audioContext, destination, {
        waveType: 'square',
        frequency: 1000,
      });

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
    });
  });

  describe('generateTerminalType', () => {
    it('應該生成終端機打字音（短脈衝）', async () => {
      const buffer = await generateTerminalType(audioContext, destination);

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
      expect(buffer.duration).toBeLessThan(0.1); // 非常短促
    });
  });

  describe('generateVaultDoor', () => {
    it('應該生成 Vault 門開啟音（低頻 + 掃頻）', async () => {
      const buffer = await generateVaultDoor(audioContext, destination);

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
      expect(buffer.duration).toBeGreaterThan(1); // 較長的音效
      expect(buffer.duration).toBeLessThan(3);
    });

    it('應該支援掃頻參數', async () => {
      const buffer = await generateVaultDoor(audioContext, destination, {
        startFrequency: 100,
        endFrequency: 50,
        duration: 2.0,
      });

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
      expect(buffer.duration).toBeCloseTo(2.0, 1);
    });
  });

  describe('generateShuffle', () => {
    it('應該生成洗牌音效', async () => {
      const buffer = await generateShuffle(audioContext, destination);

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
      expect(buffer.duration).toBeGreaterThan(0.3);
      expect(buffer.duration).toBeLessThan(1.0);
    });
  });

  describe('generateReveal', () => {
    it('應該生成揭示音效', async () => {
      const buffer = await generateReveal(audioContext, destination);

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
      expect(buffer.duration).toBeGreaterThan(0.5);
      expect(buffer.duration).toBeLessThan(2.0);
    });
  });

  describe('錯誤處理', () => {
    it('應該在 AudioContext 為 null 時拋出錯誤', async () => {
      await expect(
        generateButtonClick(null as any, destination)
      ).rejects.toThrow();
    });

    it('應該在無效參數時使用預設值', async () => {
      const buffer = await generateButtonClick(audioContext, destination, {
        frequency: -100, // 無效頻率
        duration: -1, // 無效持續時間
      });

      expect(buffer).toBeTruthy();
      expect(buffer).toHaveProperty('duration');
      expect(buffer.duration).toBeGreaterThan(0);
    });
  });

  describe('效能測試', () => {
    it('應該在 50ms 內生成簡單音效', async () => {
      const start = performance.now();
      await generateButtonClick(audioContext, destination);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });

    it('應該在 100ms 內生成複雜音效', async () => {
      const start = performance.now();
      await generateVaultDoor(audioContext, destination);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });
});
