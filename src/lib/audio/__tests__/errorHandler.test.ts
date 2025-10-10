/**
 * ErrorHandler - Unit Tests
 * Task 4: 錯誤處理模組測試
 *
 * Requirements 10.1, 10.2, 10.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ErrorHandler,
  MusicPlayerError,
  MusicPlayerErrorType,
  createMusicPlayerError,
  getErrorHandler,
} from '../errorHandler';

describe('MusicPlayerError', () => {
  it('should create error with correct properties', () => {
    const error = new MusicPlayerError(
      MusicPlayerErrorType.ENGINE_INIT_FAILED,
      'Engine initialization failed',
      true
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MusicPlayerError);
    expect(error.name).toBe('MusicPlayerError');
    expect(error.type).toBe(MusicPlayerErrorType.ENGINE_INIT_FAILED);
    expect(error.message).toBe('Engine initialization failed');
    expect(error.recoverable).toBe(true);
    expect(error.timestamp).toBeGreaterThan(0);
  });

  it('should wrap original error', () => {
    const originalError = new Error('Original error');
    const error = new MusicPlayerError(
      MusicPlayerErrorType.MODE_LOAD_FAILED,
      'Mode load failed',
      true,
      originalError
    );

    expect(error.originalError).toBe(originalError);
  });

  it('should provide user-friendly messages', () => {
    const testCases = [
      {
        type: MusicPlayerErrorType.ENGINE_INIT_FAILED,
        expected: '音樂引擎初始化失敗。請檢查瀏覽器音訊支援。',
      },
      {
        type: MusicPlayerErrorType.MODE_LOAD_FAILED,
        expected: '音樂模式載入失敗。正在重試...',
      },
      {
        type: MusicPlayerErrorType.AUDIO_CONTEXT_SUSPENDED,
        expected: '音訊已被瀏覽器暫停。請點擊任意位置以繼續播放。',
      },
      {
        type: MusicPlayerErrorType.STORAGE_WRITE_FAILED,
        expected: '無法儲存設定。請檢查瀏覽器儲存空間。',
      },
      {
        type: MusicPlayerErrorType.PLAYLIST_CORRUPTED,
        expected: '播放清單資料損壞。已重置為預設設定。',
      },
    ];

    for (const { type, expected } of testCases) {
      const error = new MusicPlayerError(type, 'Test message');
      expect(error.getUserMessage()).toBe(expected);
    }
  });

  it('should serialize to JSON correctly', () => {
    const originalError = new Error('Original');
    const error = new MusicPlayerError(
      MusicPlayerErrorType.ENGINE_INIT_FAILED,
      'Test error',
      true,
      originalError
    );

    const json = error.toJSON();

    expect(json).toMatchObject({
      name: 'MusicPlayerError',
      type: MusicPlayerErrorType.ENGINE_INIT_FAILED,
      message: 'Test error',
      recoverable: true,
    });
    expect(json.timestamp).toBeGreaterThan(0);
    expect(json.originalError).toBeDefined();
    expect(json.originalError?.message).toBe('Original');
  });
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    // 重置 ErrorHandler 指標
    ErrorHandler.resetMetrics();
    errorHandler = ErrorHandler.getInstance();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorHandler.getInstance();
      const instance2 = ErrorHandler.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should be accessible via getErrorHandler', () => {
      const instance = getErrorHandler();
      expect(instance).toBe(ErrorHandler.getInstance());
    });
  });

  describe('retry mechanism', () => {
    it('should retry operation on failure', async () => {
      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await errorHandler.retry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const operation = vi.fn(async () => {
        throw new Error('Persistent failure');
      });

      await expect(
        errorHandler.retry(operation, { maxRetries: 2 })
      ).rejects.toThrow('Persistent failure');

      expect(operation).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Failure');
        }
        return 'success';
      });

      const result = await errorHandler.retry(operation, {
        maxRetries: 3,
        backoffMs: 10, // 使用較短的延遲以加快測試
        backoffMultiplier: 2,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      let attemptCount = 0;

      const operation = async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      await errorHandler.retry(operation, { onRetry, maxRetries: 2 });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should respect maxBackoffMs', async () => {
      let attemptCount = 0;
      const operation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 4) {
          throw new Error('Failure');
        }
        return 'success';
      });

      const result = await errorHandler.retry(operation, {
        maxRetries: 4,
        backoffMs: 10,
        backoffMultiplier: 10,
        maxBackoffMs: 20,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(4);
    });
  });

  describe('error rate monitoring', () => {
    it('should track error count and total attempts', async () => {
      const failingOperation = async () => {
        throw new Error('Failure');
      };

      // 執行 3 次失敗的操作
      for (let i = 0; i < 3; i++) {
        try {
          await errorHandler.retry(failingOperation, { maxRetries: 0 });
        } catch {
          // 預期錯誤
        }
      }

      const metrics = ErrorHandler.getMetrics();
      expect(metrics.errorCount).toBe(3);
      expect(metrics.totalAttempts).toBe(3);
      expect(metrics.errorRate).toBe(1.0);
    });

    it('should calculate error rate correctly', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValueOnce('Success 1')
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('Success 2');

      for (let i = 0; i < 4; i++) {
        try {
          await errorHandler.retry(() => operation(), { maxRetries: 0 });
        } catch {
          // 預期錯誤
        }
      }

      const metrics = ErrorHandler.getMetrics();
      expect(metrics.errorCount).toBe(2);
      expect(metrics.totalAttempts).toBe(4);
      expect(metrics.errorRate).toBe(0.5);
    });

    it('should detect when error rate exceeds threshold', async () => {
      const failingOperation = async () => {
        throw new Error('Failure');
      };

      // 執行足夠多的失敗操作以超過 30% 閾值
      for (let i = 0; i < 10; i++) {
        try {
          await errorHandler.retry(failingOperation, { maxRetries: 0 });
        } catch {
          // 預期錯誤
        }
      }

      const metrics = ErrorHandler.getMetrics();
      expect(metrics.isAboveThreshold).toBe(true);
      expect(metrics.errorRate).toBeGreaterThan(0.3);
    });

    it('should reset metrics correctly', async () => {
      const failingOperation = async () => {
        throw new Error('Failure');
      };

      // 製造一些錯誤
      try {
        await errorHandler.retry(failingOperation, { maxRetries: 0 });
      } catch {
        // 預期錯誤
      }

      ErrorHandler.resetMetrics();

      const metrics = ErrorHandler.getMetrics();
      expect(metrics.errorCount).toBe(0);
      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.recentErrors).toBe(0);
    });
  });

  describe('handleError', () => {
    it('should handle MusicPlayerError', () => {
      const error = createMusicPlayerError(
        MusicPlayerErrorType.ENGINE_INIT_FAILED,
        'Test error'
      );

      expect(() => errorHandler.handleError(error)).not.toThrow();
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');

      expect(() => errorHandler.handleError(error)).not.toThrow();
    });

    it('should accept context information', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'playMusic' };

      expect(() => errorHandler.handleError(error, context)).not.toThrow();
    });
  });

  describe('helper functions', () => {
    it('createMusicPlayerError should create error correctly', () => {
      const error = createMusicPlayerError(
        MusicPlayerErrorType.MODE_LOAD_FAILED,
        'Test message',
        true
      );

      expect(error).toBeInstanceOf(MusicPlayerError);
      expect(error.type).toBe(MusicPlayerErrorType.MODE_LOAD_FAILED);
      expect(error.message).toBe('Test message');
      expect(error.recoverable).toBe(true);
    });
  });
});
