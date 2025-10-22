/**
 * TDD Tests for useStreamingText - Retry Mechanism
 * Testing automatic retry with exponential backoff
 *
 * 🔴 RED: Write failing tests first
 * 🟢 GREEN: Make tests pass with minimal code
 * 🔵 REFACTOR: Improve code quality
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useStreamingText } from '../useStreamingText';

// Mock fetch API
global.fetch = jest.fn();

// Helper: Create mock SSE response
const createMockSSEResponse = (chunks: string[]): Response => {
  const encoder = new TextEncoder();
  let currentChunk = 0;

  const mockReader = {
    read: jest.fn(async () => {
      if (currentChunk < chunks.length) {
        const chunk = chunks[currentChunk++];
        return {
          done: false,
          value: encoder.encode(chunk),
        };
      }
      return { done: true, value: undefined };
    }),
  };

  const mockBody = {
    getReader: () => mockReader,
  };

  return new Response(mockBody as any, {
    headers: { 'Content-Type': 'text/event-stream' },
    status: 200,
  });
};

describe('useStreamingText - Retry Mechanism (TDD)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // 🔴 TDD Cycle 1: Basic Retry Functionality
  // ========================================

  describe('Cycle 1: Basic Retry', () => {
    it('🔴 should retry on network error and eventually succeed', async () => {
      // 這個測試現在會失敗，因為 retry 功能還沒實作

      let callCount = 0;

      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;

        if (callCount <= 2) {
          // 前兩次失敗（網路錯誤）
          return Promise.reject(new Error('Network error'));
        }

        // 第三次成功
        return Promise.resolve(
          createMockSSEResponse([
            'data: Hello\n\n',
            'data:  from\n\n',
            'data:  retry\n\n',
            'data: [DONE]\n\n',
          ])
        );
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          maxRetries: 3,
          retryDelay: 100, // 快速測試（100ms 基礎延遲）
          enabled: true,
        })
      );

      // 等待串流完成
      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 10000 } // 給予充足時間（包含重試延遲）
      );

      // 驗證：應該重試 2 次後成功（總共 3 次呼叫）
      expect(callCount).toBe(3);
      expect(result.current.text).toContain('Hello');
      expect(result.current.text).toContain('retry');
      expect(result.current.error).toBeNull();
    });

    it('🔴 should expose retry state to user', async () => {
      // 測試重試狀態是否正確暴露

      let callCount = 0;

      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;

        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }

        return Promise.resolve(
          createMockSSEResponse(['data: Success\n\n', 'data: [DONE]\n\n'])
        );
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          maxRetries: 3,
          retryDelay: 100,
          enabled: true,
        })
      );

      // 等待第一次失敗和重試
      await waitFor(
        () => {
          // 應該進入重試狀態
          return result.current.isRetrying === true || result.current.isComplete === true;
        },
        { timeout: 5000 }
      );

      // 如果還在重試中，驗證重試狀態
      if (result.current.isRetrying) {
        expect(result.current.retryCount).toBeGreaterThan(0);
      }

      // 等待最終完成
      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toBeNull();
    });
  });

  // ========================================
  // 🔴 TDD Cycle 2: Retry Limit
  // ========================================

  describe('Cycle 2: Retry Limit', () => {
    it('🔴 should respect maxRetries limit and fail after exhausting retries', async () => {
      // 所有請求都失敗
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('Network error'));
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          maxRetries: 3,
          retryDelay: 100,
          enabled: true,
        })
      );

      // 等待錯誤發生
      await waitFor(
        () => {
          expect(result.current.error).not.toBeNull();
        },
        { timeout: 5000 }
      );

      // 驗證：應該嘗試 4 次（初始 1 次 + 重試 3 次）
      expect(callCount).toBe(4);
      expect(result.current.error?.message).toContain('Network error');
      expect(result.current.isComplete).toBe(false);
    });

    it('🔴 should not retry on user abort', async () => {
      // 模擬用戶取消
      let callCount = 0;

      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        const error = new Error('User aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          maxRetries: 3,
          retryDelay: 100,
          enabled: true,
        })
      );

      // 等待錯誤發生
      await waitFor(
        () => {
          expect(result.current.error).not.toBeNull();
        },
        { timeout: 2000 }
      );

      // 驗證：用戶取消不應該重試，只嘗試 1 次
      expect(callCount).toBe(1);
      expect(result.current.error?.name).toBe('AbortError');
    });
  });

  // ========================================
  // 🔴 TDD Cycle 3: Exponential Backoff
  // ========================================

  describe('Cycle 3: Exponential Backoff', () => {
    it('🔴 should use exponential backoff for retry delays', async () => {
      const delays: number[] = [];
      let lastTime = Date.now();
      let callCount = 0;

      (global.fetch as jest.Mock).mockImplementation(() => {
        const now = Date.now();

        if (callCount > 0) {
          // 記錄延遲時間（跳過第一次，因為沒有延遲）
          delays.push(now - lastTime);
        }

        lastTime = now;
        callCount++;

        if (callCount <= 3) {
          // 前 3 次失敗
          return Promise.reject(new Error('Network error'));
        }

        // 第 4 次成功
        return Promise.resolve(
          createMockSSEResponse(['data: Success\n\n', 'data: [DONE]\n\n'])
        );
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          maxRetries: 3,
          retryDelay: 100, // 基礎延遲 100ms
          enabled: true,
        })
      );

      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 15000 }
      );

      // 驗證：延遲應該是指數增長
      // 第 1 次重試：100ms * 2^0 = 100ms
      // 第 2 次重試：100ms * 2^1 = 200ms
      // 第 3 次重試：100ms * 2^2 = 400ms

      expect(delays.length).toBe(3);

      // 允許 ±50ms 誤差（因為測試環境的時間不精確）
      expect(delays[0]).toBeGreaterThanOrEqual(80);
      expect(delays[0]).toBeLessThan(150);

      expect(delays[1]).toBeGreaterThanOrEqual(180);
      expect(delays[1]).toBeLessThan(250);

      expect(delays[2]).toBeGreaterThanOrEqual(380);
      expect(delays[2]).toBeLessThan(500);
    });
  });

  // ========================================
  // 🔴 TDD Cycle 4: Timeout Handling
  // ========================================

  describe('Cycle 4: Timeout Handling', () => {
    it('🔴 should timeout if request takes too long', async () => {
      // 模擬永遠不回應的請求
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(() => {
            // 永遠不 resolve 或 reject
          })
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          timeout: 500, // 500ms 超時
          maxRetries: 0, // 不重試，只測試超時
          enabled: true,
        })
      );

      // 等待超時錯誤
      await waitFor(
        () => {
          expect(result.current.error).not.toBeNull();
        },
        { timeout: 2000 }
      );

      expect(result.current.error?.message).toContain('timeout');
      expect(result.current.isComplete).toBe(false);
    });

    it('🔴 should retry after timeout', async () => {
      let callCount = 0;

      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;

        if (callCount === 1) {
          // 第一次超時（永不回應）
          return new Promise(() => {});
        }

        // 第二次成功
        return Promise.resolve(
          createMockSSEResponse(['data: After timeout\n\n', 'data: [DONE]\n\n'])
        );
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          timeout: 500, // 500ms 超時
          maxRetries: 2,
          retryDelay: 100,
          enabled: true,
        })
      );

      // 等待完成（應該在超時後重試並成功）
      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.text).toContain('After timeout');
      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });
});
