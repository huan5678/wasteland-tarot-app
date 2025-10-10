/**
 * ErrorHandler Integration Tests
 * Task 29, 30, 31: 錯誤處理整合測試
 *
 * Requirements 10.1, 10.2, 10.3 (錯誤處理、重試機制、錯誤率監控)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ErrorHandler,
  MusicPlayerError,
  MusicPlayerErrorType,
  getErrorHandler,
  createMusicPlayerError,
} from '../errorHandler';

describe('ErrorHandler Integration Tests', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = getErrorHandler();
    ErrorHandler.resetMetrics();
    vi.clearAllMocks();
  });

  afterEach(() => {
    ErrorHandler.resetMetrics();
  });

  // ============================================================================
  // Task 29: 音訊載入失敗處理測試
  // ============================================================================

  describe('Task 29: Audio Loading Error Handling', () => {
    it('should retry operation up to 3 times on failure', async () => {
      let attemptCount = 0;

      const failingOperation = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Simulated audio loading failure');
        }
        return 'success';
      });

      const result = await errorHandler.retry(failingOperation, {
        maxRetries: 3,
        backoffMs: 10, // Fast for testing
      });

      expect(result).toBe('success');
      expect(failingOperation).toHaveBeenCalledTimes(3);
      expect(attemptCount).toBe(3);
    });

    it('should throw error after max retries exhausted', async () => {
      const alwaysFailingOperation = vi.fn(async () => {
        throw new Error('Persistent audio loading failure');
      });

      await expect(
        errorHandler.retry(alwaysFailingOperation, {
          maxRetries: 3,
          backoffMs: 10,
        })
      ).rejects.toThrow('Persistent audio loading failure');

      expect(alwaysFailingOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should use exponential backoff between retries', async () => {
      const timestamps: number[] = [];
      let attemptCount = 0;

      const operation = vi.fn(async () => {
        timestamps.push(Date.now());
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Simulated failure');
        }
        return 'success';
      });

      await errorHandler.retry(operation, {
        maxRetries: 3,
        backoffMs: 100,
        backoffMultiplier: 2,
      });

      // 驗證第二次嘗試至少延遲 100ms
      expect(timestamps[1]! - timestamps[0]!).toBeGreaterThanOrEqual(90); // 允許 10ms 誤差

      // 驗證第三次嘗試至少延遲 200ms (100 * 2)
      expect(timestamps[2]! - timestamps[1]!).toBeGreaterThanOrEqual(180);
    });

    it('should call onRetry callback with attempt number', async () => {
      const onRetry = vi.fn();
      let attemptCount = 0;

      const operation = async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Simulated failure');
        }
        return 'success';
      };

      await errorHandler.retry(operation, {
        maxRetries: 3,
        backoffMs: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should track error metrics correctly', async () => {
      const operation = async () => {
        throw new Error('Simulated failure');
      };

      try {
        await errorHandler.retry(operation, { maxRetries: 2, backoffMs: 10 });
      } catch {
        // Expected to fail
      }

      const metrics = ErrorHandler.getMetrics();

      expect(metrics.totalAttempts).toBe(1);
      expect(metrics.errorCount).toBe(1);
      expect(metrics.errorRate).toBe(1.0); // 100% error rate
    });
  });

  // ============================================================================
  // Task 29: 錯誤率監控測試
  // ============================================================================

  describe('Task 29: Error Rate Monitoring', () => {
    it('should calculate error rate correctly', async () => {
      // 3 次成功，1 次失敗 = 25% 錯誤率
      const successfulOperation = async () => 'success';
      const failingOperation = async () => {
        throw new Error('Simulated failure');
      };

      // 3 次成功
      await errorHandler.retry(successfulOperation, { maxRetries: 0 });
      await errorHandler.retry(successfulOperation, { maxRetries: 0 });
      await errorHandler.retry(successfulOperation, { maxRetries: 0 });

      // 1 次失敗
      try {
        await errorHandler.retry(failingOperation, { maxRetries: 0 });
      } catch {
        // Expected
      }

      const metrics = ErrorHandler.getMetrics();

      expect(metrics.totalAttempts).toBe(4);
      expect(metrics.errorCount).toBe(1);
      expect(metrics.errorRate).toBe(0.25); // 25%
    });

    it('should detect when error rate exceeds 30% threshold', async () => {
      const failingOperation = async () => {
        throw new Error('Simulated failure');
      };

      // 觸發 4 次錯誤（總共 4 次嘗試）= 100% 錯誤率
      for (let i = 0; i < 4; i++) {
        try {
          await errorHandler.retry(failingOperation, { maxRetries: 0 });
        } catch {
          // Expected
        }
      }

      const metrics = ErrorHandler.getMetrics();

      expect(metrics.isAboveThreshold).toBe(true);
      expect(metrics.errorRate).toBeGreaterThan(0.3);
    });

    it('should reset metrics correctly', async () => {
      const failingOperation = async () => {
        throw new Error('Simulated failure');
      };

      try {
        await errorHandler.retry(failingOperation, { maxRetries: 0 });
      } catch {
        // Expected
      }

      ErrorHandler.resetMetrics();

      const metrics = ErrorHandler.getMetrics();

      expect(metrics.totalAttempts).toBe(0);
      expect(metrics.errorCount).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });
  });

  // ============================================================================
  // MusicPlayerError 測試
  // ============================================================================

  describe('MusicPlayerError', () => {
    it('should create error with correct properties', () => {
      const error = createMusicPlayerError(
        MusicPlayerErrorType.MODE_LOAD_FAILED,
        'Failed to load music mode',
        true
      );

      expect(error).toBeInstanceOf(MusicPlayerError);
      expect(error.type).toBe(MusicPlayerErrorType.MODE_LOAD_FAILED);
      expect(error.message).toBe('Failed to load music mode');
      expect(error.recoverable).toBe(true);
      expect(error.timestamp).toBeGreaterThan(0);
    });

    it('should return user-friendly message', () => {
      const error = createMusicPlayerError(
        MusicPlayerErrorType.ENGINE_INIT_FAILED,
        'Internal error',
        false
      );

      const userMessage = error.getUserMessage();

      expect(userMessage).toBe('音樂引擎初始化失敗。請檢查瀏覽器音訊支援。');
    });

    it('should serialize to JSON correctly', () => {
      const originalError = new Error('Original error');
      const error = createMusicPlayerError(
        MusicPlayerErrorType.STORAGE_WRITE_FAILED,
        'Storage full',
        true,
        originalError
      );

      const json = error.toJSON();

      expect(json.name).toBe('MusicPlayerError');
      expect(json.type).toBe(MusicPlayerErrorType.STORAGE_WRITE_FAILED);
      expect(json.message).toBe('Storage full');
      expect(json.recoverable).toBe(true);
      expect(json.originalError).toBeDefined();
      expect(json.originalError?.message).toBe('Original error');
    });
  });

  // ============================================================================
  // ErrorHandler 單例測試
  // ============================================================================

  describe('ErrorHandler Singleton', () => {
    it('should return same instance', () => {
      const handler1 = getErrorHandler();
      const handler2 = getErrorHandler();

      expect(handler1).toBe(handler2);
    });

    it('should track errors across multiple operations', async () => {
      const handler1 = getErrorHandler();
      const handler2 = getErrorHandler();

      const operation = async () => 'success';

      await handler1.retry(operation);
      await handler2.retry(operation);

      const metrics = ErrorHandler.getMetrics();

      expect(metrics.totalAttempts).toBe(2);
    });
  });
});
