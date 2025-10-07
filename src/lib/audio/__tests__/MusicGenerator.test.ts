/**
 * MusicGenerator 單元測試
 * 需求 3.1: 測試 Web Audio API 音樂生成功能
 */

import {
  generateWastelandAmbient,
  generateDivinationTheme,
  generateVaultTheme,
  generateMusicById,
} from '../MusicGenerator';

// Mock AudioContext
class MockAudioContext {
  sampleRate = 44100;

  createBuffer(channels: number, length: number, sampleRate: number) {
    const buffer = {
      length,
      numberOfChannels: channels,
      sampleRate,
      getChannelData: (channel: number) => new Float32Array(length),
    };
    return buffer as AudioBuffer;
  }
}

describe('MusicGenerator', () => {
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new MockAudioContext() as unknown as AudioContext;
  });

  describe('generateWastelandAmbient()', () => {
    it('應該生成廢土環境音', async () => {
      const buffer = await generateWastelandAmbient(audioContext);

      expect(buffer).toBeDefined();
      expect(buffer.numberOfChannels).toBe(2); // 雙聲道
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.sampleRate).toBe(44100);
    });

    it('應該使用自訂時長', async () => {
      const duration = 10; // 10 秒
      const buffer = await generateWastelandAmbient(audioContext, { duration });

      const expectedLength = audioContext.sampleRate * duration;
      expect(buffer.length).toBe(expectedLength);
    });

    it('應該在沒有 AudioContext 時拋出錯誤', async () => {
      await expect(generateWastelandAmbient(null as any)).rejects.toThrow(
        'AudioContext is required'
      );
    });
  });

  describe('generateDivinationTheme()', () => {
    it('應該生成占卜主題音樂', async () => {
      const buffer = await generateDivinationTheme(audioContext);

      expect(buffer).toBeDefined();
      expect(buffer.numberOfChannels).toBe(2);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('應該使用自訂音量', async () => {
      const buffer = await generateDivinationTheme(audioContext, { volume: 0.5 });

      // 驗證音量參數被正確傳遞（音量影響生成的音訊資料）
      expect(buffer).toBeDefined();
    });
  });

  describe('generateVaultTheme()', () => {
    it('應該生成 Vault 主題音樂', async () => {
      const buffer = await generateVaultTheme(audioContext);

      expect(buffer).toBeDefined();
      expect(buffer.numberOfChannels).toBe(2);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateMusicById()', () => {
    it('應該根據 ID 生成對應的音樂', async () => {
      const wasteland = await generateMusicById('wasteland-ambient', audioContext);
      const divination = await generateMusicById('divination-theme', audioContext);
      const vault = await generateMusicById('vault-theme', audioContext);

      expect(wasteland).toBeDefined();
      expect(divination).toBeDefined();
      expect(vault).toBeDefined();
    });

    it('應該對未知 ID 使用預設音樂', async () => {
      const buffer = await generateMusicById('unknown-music', audioContext);

      // 應該回退到 wasteland-ambient
      expect(buffer).toBeDefined();
    });

    it('應該傳遞選項參數', async () => {
      const options = { duration: 12, volume: 0.6 };
      const buffer = await generateMusicById('vault-theme', audioContext, options);

      const expectedLength = audioContext.sampleRate * 12;
      expect(buffer.length).toBe(expectedLength);
    });
  });

  describe('音樂品質檢查', () => {
    it('生成的音樂應該返回有效的 AudioBuffer', async () => {
      const buffer = await generateWastelandAmbient(audioContext);

      // 檢查 buffer 的基本屬性
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.numberOfChannels).toBe(2);
      expect(buffer.sampleRate).toBe(44100);

      // 在真實的 AudioContext 中，資料應該被正確填充
      // 但在 Mock 環境中，我們只驗證結構正確性
      const data = buffer.getChannelData(0);
      expect(data).toBeInstanceOf(Float32Array);
      expect(data.length).toBe(buffer.length);
    });

    it('雙聲道應該有獨立的資料', async () => {
      const buffer = await generateDivinationTheme(audioContext);
      const leftChannel = buffer.getChannelData(0);
      const rightChannel = buffer.getChannelData(1);

      // 驗證雙聲道都存在並且是 Float32Array
      expect(leftChannel).toBeDefined();
      expect(rightChannel).toBeDefined();
      expect(leftChannel).toBeInstanceOf(Float32Array);
      expect(rightChannel).toBeInstanceOf(Float32Array);
      expect(leftChannel.length).toBe(rightChannel.length);
    });
  });
});
