/**
 * 錯誤處理整合測試
 * 需求 5.1, 5.2, 5.3: 錯誤處理整合測試
 */

import { AudioEngine } from '@/lib/audio/AudioEngine';
import { AudioErrorHandler } from '@/lib/audio/AudioErrorHandler';
import { SpeechEngine } from '@/lib/audio/SpeechEngine';

// Mock fetch
global.fetch = jest.fn();

// Mock console methods
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

describe('Error Handling Integration', () => {
  let audioEngine: AudioEngine;
  let errorHandler: AudioErrorHandler;

  beforeEach(() => {
    audioEngine = AudioEngine.getInstance();
    errorHandler = new AudioErrorHandler();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('應該在載入失敗時重試', async () => {
    let attemptCount = 0;

    (global.fetch as jest.Mock).mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(1024),
      });
    });

    const retryFn = async () => {
      await fetch('/test.mp3');
    };

    await errorHandler.handleLoadError('test-sound', new Error('Network error'), retryFn);

    expect(attemptCount).toBeGreaterThan(1);
  });

  it('應該在達到重試上限後停止', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Persistent error'));

    const retryFn = jest.fn().mockRejectedValue(new Error('Failed'));

    for (let i = 0; i < 5; i++) {
      try {
        await errorHandler.handleLoadError('test-sound', new Error('Failed'), retryFn);
      } catch (e) {
        // Ignore
      }
    }

    // Should only retry 3 times
    expect(retryFn).toHaveBeenCalledTimes(3);
  });

  it('應該偵測並處理不支援的瀏覽器', () => {
    const support = errorHandler.checkBrowserSupport();

    expect(support).toHaveProperty('audioContext');
    expect(support).toHaveProperty('speechSynthesis');

    if (!support.audioContext) {
      const fallback = errorHandler.getFallbackStrategy(support);
      expect(fallback.useAudioContext).toBe(false);
    }
  });

  it('應該在高錯誤率時發出警告', () => {
    const error = new Error('Test error');

    // Simulate high error rate
    for (let i = 0; i < 10; i++) {
      errorHandler.recordError('test-sound', error);
    }

    const isHighErrorRate = errorHandler.isHighErrorRate('test-sound');
    expect(isHighErrorRate).toBe(true);
  });

  it('應該能夠優雅降級', async () => {
    // Mock unsupported AudioContext
    const originalAudioContext = (global as any).AudioContext;
    (global as any).AudioContext = undefined;

    const support = errorHandler.checkBrowserSupport();
    const fallback = errorHandler.getFallbackStrategy(support);

    expect(fallback.useAudioContext).toBe(false);

    // Restore
    (global as any).AudioContext = originalAudioContext;
  });

  it('應該處理網路錯誤', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

    const retryFn = jest.fn().mockResolvedValue(undefined);

    await errorHandler.handleNetworkError('test-sound', new Error('Network timeout'), retryFn);

    expect(retryFn).toHaveBeenCalled();
  });

  it('應該處理解碼錯誤', () => {
    const decodeError = new Error('Invalid audio data');

    const handled = errorHandler.handleDecodeError('test-sound', decodeError);

    expect(handled).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('應該追蹤多個音效的錯誤率', () => {
    const error = new Error('Test error');

    errorHandler.recordError('sound-1', error);
    errorHandler.recordError('sound-2', error);
    errorHandler.recordError('sound-1', error);

    const errorRate1 = errorHandler.getErrorRate('sound-1');
    const errorRate2 = errorHandler.getErrorRate('sound-2');

    expect(errorRate1).toBeGreaterThan(errorRate2);
  });

  it('應該能夠重置錯誤計數', () => {
    const error = new Error('Test error');

    errorHandler.recordError('test-sound', error);
    errorHandler.recordError('test-sound', error);

    expect(errorHandler.getErrorRate('test-sound')).toBeGreaterThan(0);

    errorHandler.resetErrorCount('test-sound');

    expect(errorHandler.getErrorRate('test-sound')).toBe(0);
  });

  it('應該在 TTS 不支援時優雅處理', () => {
    const originalSpeechSynthesis = (global as any).speechSynthesis;
    (global as any).speechSynthesis = undefined;

    const speechEngine = SpeechEngine.getInstance();
    const isSupported = speechEngine.isSupported();

    expect(isSupported).toBe(false);

    // Restore
    (global as any).speechSynthesis = originalSpeechSynthesis;
  });
});
