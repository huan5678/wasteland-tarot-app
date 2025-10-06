/**
 * AudioErrorHandler 單元測試
 * 需求 5.1, 5.2, 5.3: 錯誤處理測試
 */

import { AudioErrorHandler } from '../AudioErrorHandler';

describe('AudioErrorHandler', () => {
  let errorHandler: AudioErrorHandler;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorHandler = new AudioErrorHandler();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('應該在載入失敗時重試', async () => {
    const retryFn = jest.fn().mockResolvedValue(undefined);
    const error = new Error('Load failed');

    await errorHandler.handleLoadError('test-sound', error, retryFn);

    expect(retryFn).toHaveBeenCalledTimes(1);
  });

  it('應該在達到最大重試次數後停止', async () => {
    const retryFn = jest.fn().mockRejectedValue(new Error('Failed'));
    const error = new Error('Load failed');

    // Try 4 times (initial + 3 retries)
    for (let i = 0; i < 4; i++) {
      try {
        await errorHandler.handleLoadError('test-sound', error, retryFn);
      } catch (e) {
        // Ignore errors
      }
    }

    // Should only retry 3 times
    expect(retryFn).toHaveBeenCalledTimes(3);
  });

  it('應該檢測瀏覽器支援', () => {
    const support = errorHandler.checkBrowserSupport();

    expect(support).toHaveProperty('audioContext');
    expect(support).toHaveProperty('speechSynthesis');
  });

  it('應該在不支援時提供降級方案', () => {
    const mockSupport = {
      audioContext: false,
      speechSynthesis: true,
    };

    const fallback = errorHandler.getFallbackStrategy(mockSupport);

    expect(fallback).toHaveProperty('useAudioContext', false);
    expect(fallback).toHaveProperty('useSpeechSynthesis', true);
  });

  it('應該追蹤錯誤率', () => {
    const error = new Error('Test error');

    errorHandler.recordError('test-sound', error);
    errorHandler.recordError('test-sound', error);
    errorHandler.recordError('test-sound', error);

    const errorRate = errorHandler.getErrorRate('test-sound');
    expect(errorRate).toBeGreaterThan(0);
  });

  it('應該在錯誤率過高時警告', () => {
    const error = new Error('Test error');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Record many errors to trigger high error rate
    for (let i = 0; i < 10; i++) {
      errorHandler.recordError('test-sound', error);
    }

    const isHighErrorRate = errorHandler.isHighErrorRate('test-sound');
    expect(isHighErrorRate).toBe(true);

    warnSpy.mockRestore();
  });

  it('應該能夠重置錯誤計數', () => {
    const error = new Error('Test error');

    errorHandler.recordError('test-sound', error);
    errorHandler.resetErrorCount('test-sound');

    const errorRate = errorHandler.getErrorRate('test-sound');
    expect(errorRate).toBe(0);
  });

  it('應該處理網路錯誤', async () => {
    const networkError = new Error('Network error');
    const retryFn = jest.fn().mockResolvedValue(undefined);

    await errorHandler.handleNetworkError('test-sound', networkError, retryFn);

    expect(retryFn).toHaveBeenCalled();
  });

  it('應該處理解碼錯誤', () => {
    const decodeError = new Error('Decode failed');

    const handled = errorHandler.handleDecodeError('test-sound', decodeError);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(handled).toBe(true);
  });
});
