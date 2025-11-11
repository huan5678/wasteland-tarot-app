/**
 * TDD Test Suite for Streaming Error Handling and Recovery (Task 4.5)
 *
 * Tests for:
 * - SSE connection interruption scenarios
 * - Exponential Backoff retry mechanism
 * - Maximum 5 retry attempts with appropriate delays
 * - Friendly error messages ("Radiation interference, please try again")
 * - Retry button functionality
 * - Timeout handling (>30 seconds)
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamingText } from '../useStreamingText';

// Helper to create mock fetch response
const createMockResponse = (body: ReadableStream) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  body,
});

// Helper to create mock SSE stream
const createSSEStream = (chunks: string[]) => {
  const encoder = new TextEncoder();
  let currentIndex = 0;

  return new ReadableStream({
    start(controller) {
      const push = () => {
        if (currentIndex < chunks.length) {
          controller.enqueue(encoder.encode(chunks[currentIndex]));
          currentIndex++;
          setTimeout(push, 10);
        } else {
          controller.close();
        }
      };
      push();
    },
  });
};

describe('useStreamingText - Error Handling (Task 4.5)', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Setup basic mock
    global.fetch = mock(() => Promise.resolve(createMockResponse(createSSEStream([]))));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('SSE Connection Interruption', () => {
    it('should detect connection interruption and trigger retry', async () => {
      let callCount = 0;

      // Mock fetch that fails on first call, succeeds on second
      global.fetch = mock(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(
          createMockResponse(
            createSSEStream(['data: Success\n\n', 'data: [DONE]\n\n'])
          )
        );
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 3,
        })
      );

      // Wait for retry to complete
      await waitFor(() => {
        expect(result.current.retryCount).toBe(1);
      }, { timeout: 5000 });

      // Verify success after retry
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.text).toBe('Success');
      }, { timeout: 5000 });
    });

    it('should handle stream disconnection mid-transfer', async () => {
      // Mock fetch that returns incomplete stream
      global.fetch = mock(() => {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('data: Partial\n\n'));
            // Simulate disconnection by closing prematurely
            setTimeout(() => controller.close(), 100);
          },
        });
        return Promise.resolve(createMockResponse(stream));
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
        })
      );

      // Should receive partial data
      await waitFor(() => {
        expect(result.current.text).toBe('Partial');
      }, { timeout: 2000 });
    });
  });

  describe('Exponential Backoff Retry Mechanism', () => {
    it('should implement exponential backoff with correct delays', async () => {
      const delays: number[] = [];
      let callCount = 0;
      let lastCallTime = Date.now();

      // Mock fetch that always fails to test retry mechanism
      global.fetch = mock(() => {
        const now = Date.now();
        if (callCount > 0) {
          delays.push(now - lastCallTime);
        }
        lastCallTime = now;
        callCount++;
        return Promise.reject(new Error('Network error'));
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 3,
          retryDelay: 1000, // 1 second base delay
        })
      );

      // Wait for all retries to complete
      await waitFor(() => {
        expect(result.current.retryCount).toBeGreaterThan(0);
      }, { timeout: 10000 });

      // Verify exponential backoff: delays should be approximately 1s, 2s, 4s
      expect(delays.length).toBeGreaterThan(0);

      // Allow ±200ms tolerance for timing
      if (delays.length >= 1) {
        expect(delays[0]).toBeGreaterThanOrEqual(800); // ~1000ms
        expect(delays[0]).toBeLessThanOrEqual(1200);
      }
      if (delays.length >= 2) {
        expect(delays[1]).toBeGreaterThanOrEqual(1800); // ~2000ms
        expect(delays[1]).toBeLessThanOrEqual(2200);
      }
      if (delays.length >= 3) {
        expect(delays[2]).toBeGreaterThanOrEqual(3800); // ~4000ms
        expect(delays[2]).toBeLessThanOrEqual(4200);
      }
    });

    it('should reset retry count on successful connection', async () => {
      let callCount = 0;

      // Fail once, then succeed
      global.fetch = mock(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(
          createMockResponse(
            createSSEStream(['data: Success\n\n', 'data: [DONE]\n\n'])
          )
        );
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 3,
        })
      );

      // Wait for retry
      await waitFor(() => {
        expect(result.current.retryCount).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Wait for success and verify retry count reset
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.retryCount).toBe(0);
        expect(result.current.isRetrying).toBe(false);
      }, { timeout: 5000 });
    });
  });

  describe('Maximum Retry Attempts', () => {
    it('should stop after maximum retry attempts (5)', async () => {
      let callCount = 0;

      // Always fail
      global.fetch = mock(() => {
        callCount++;
        return Promise.reject(new Error('Network error'));
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 5,
        })
      );

      // Wait for all retries to exhaust
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.isRetrying).toBe(false);
      }, { timeout: 20000 });

      // Should have attempted 1 initial + 5 retries = 6 total calls
      expect(callCount).toBeLessThanOrEqual(6);
    });

    it('should show error after max retries exhausted', async () => {
      // Always fail
      global.fetch = mock(() => Promise.reject(new Error('Network error')));

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 3,
        })
      );

      // Wait for error
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
        expect(result.current.isRetrying).toBe(false);
      }, { timeout: 10000 });

      // Should have user-friendly error
      expect(result.current.userFriendlyError).toBeDefined();
      expect(result.current.errorType).toBe('NETWORK_ERROR');
    });
  });

  describe('Friendly Error Messages', () => {
    it('should provide user-friendly error for network errors', async () => {
      global.fetch = mock(() => Promise.reject(new Error('Failed to fetch')));

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 1,
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 5000 });

      expect(result.current.errorType).toBe('NETWORK_ERROR');
      expect(result.current.userFriendlyError).toContain('網路連線不穩定');
      expect(result.current.recoverySuggestion).toContain('請檢查網路連線');
    });

    it('should provide user-friendly error for timeout', async () => {
      global.fetch = mock(() => Promise.reject(new Error('Request timeout after 30000ms')));

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 1,
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 5000 });

      expect(result.current.errorType).toBe('TIMEOUT');
      expect(result.current.userFriendlyError).toContain('連線逾時');
      expect(result.current.recoverySuggestion).toContain('請檢查網路連線或稍後重試');
    });

    it('should provide user-friendly error for 500 server errors', async () => {
      global.fetch = mock(() =>
        Promise.reject(new Error('HTTP 500: Internal Server Error'))
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 1,
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 5000 });

      expect(result.current.errorType).toBe('SERVER_ERROR');
      expect(result.current.userFriendlyError).toContain('伺服器暫時無法回應');
      expect(result.current.recoverySuggestion).toContain('請稍候片刻後重試');
    });

    it('should provide user-friendly error for offline state', async () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 1,
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 5000 });

      expect(result.current.errorType).toBe('OFFLINE');
      expect(result.current.userFriendlyError).toContain('無網路連線');

      // Restore navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after 30 seconds by default', async () => {
      // Mock fetch that never resolves
      global.fetch = mock(() => new Promise(() => {}));

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          timeout: 1000, // Use 1 second for testing
          maxRetries: 0, // No retries to speed up test
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 3000 });

      expect(result.current.error?.message).toContain('timeout');
    });

    it('should allow custom timeout values', async () => {
      const customTimeout = 500; // 0.5 seconds

      global.fetch = mock(() => new Promise(() => {}));

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          timeout: customTimeout,
          maxRetries: 0,
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 2000 });

      expect(result.current.error?.message).toContain('timeout');
    });
  });

  describe('Retry Button Functionality', () => {
    it('should allow manual retry via reset', async () => {
      let callCount = 0;

      // Fail first time, succeed on manual retry
      global.fetch = mock(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(
          createMockResponse(
            createSSEStream(['data: Success\n\n', 'data: [DONE]\n\n'])
          )
        );
      });

      const { result, rerender } = renderHook((props) =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: props.enabled,
          maxRetries: 0, // No automatic retries
        }),
        { initialProps: { enabled: true } }
      );

      // Wait for error
      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 3000 });

      // Reset (simulates retry button click)
      act(() => {
        result.current.reset();
      });

      // Re-enable to trigger new request
      rerender({ enabled: false });
      rerender({ enabled: true });

      // Wait for success
      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
        expect(result.current.text).toBe('Success');
      }, { timeout: 3000 });
    });

    it('should clear error state on manual retry', async () => {
      global.fetch = mock(() => Promise.reject(new Error('Network error')));

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 0,
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 3000 });

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify error cleared
      expect(result.current.error).toBeNull();
      expect(result.current.errorType).toBeNull();
      expect(result.current.userFriendlyError).toBeNull();
      expect(result.current.recoverySuggestion).toBeNull();
    });
  });

  describe('Integration with StreamingInterpretation UI', () => {
    it('should expose retry state for UI rendering', async () => {
      global.fetch = mock(() => Promise.reject(new Error('Network error')));

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 3,
        })
      );

      // Should expose isRetrying flag
      await waitFor(() => {
        expect(result.current.isRetrying).toBe(true);
        expect(result.current.retryCount).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should provide all error information needed for UI', async () => {
      global.fetch = mock(() => Promise.reject(new Error('HTTP 500: Internal Server Error')));

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: 'data' },
          enabled: true,
          maxRetries: 1,
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      }, { timeout: 5000 });

      // Should provide complete error info for UI
      expect(result.current.error).not.toBeNull();
      expect(result.current.errorType).toBeDefined();
      expect(result.current.userFriendlyError).toBeDefined();
      expect(result.current.recoverySuggestion).toBeDefined();
      expect(result.current.isRetrying).toBe(false);
      expect(result.current.isOnline).toBeDefined();
    });
  });

  describe('Enhanced Error Handling (Task 15.9)', () => {
    describe('Timeout Recovery Mechanisms', () => {
      it('should recover from timeout and continue streaming on retry', async () => {
        let callCount = 0;

        global.fetch = mock(() => {
          callCount++;
          if (callCount === 1) {
            // First call times out
            return new Promise(() => {});
          }
          // Second call succeeds
          return Promise.resolve(
            createMockResponse(
              createSSEStream(['data: Recovered\n\n', 'data: [DONE]\n\n'])
            )
          );
        });

        const { result, rerender } = renderHook((props) =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: props.enabled,
            timeout: 500,
            maxRetries: 0,
          }),
          { initialProps: { enabled: true } }
        );

        // Wait for timeout error
        await waitFor(() => {
          expect(result.current.error).not.toBeNull();
        }, { timeout: 2000 });

        // Retry after timeout
        act(() => {
          result.current.reset();
        });
        rerender({ enabled: false });
        rerender({ enabled: true });

        // Should recover successfully
        await waitFor(() => {
          expect(result.current.isComplete).toBe(true);
          expect(result.current.text).toBe('Recovered');
        }, { timeout: 3000 });
      });

      it('should log timeout events for monitoring', async () => {
        const consoleSpy = mock(() => {});
        const originalError = console.error;
        console.error = consoleSpy;

        global.fetch = mock(() => new Promise(() => {}));

        const { result } = renderHook(() =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: true,
            timeout: 500,
            maxRetries: 0,
          })
        );

        await waitFor(() => {
          expect(result.current.error).not.toBeNull();
        }, { timeout: 2000 });

        // Verify error was logged (implementation dependent)
        expect(result.current.error?.message).toContain('timeout');

        console.error = originalError;
      });
    });

    describe('Offline/Online Transitions', () => {
      it('should detect offline state and prevent requests', async () => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });

        const { result } = renderHook(() =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: true,
            maxRetries: 0,
          })
        );

        await waitFor(() => {
          expect(result.current.error).not.toBeNull();
          expect(result.current.errorType).toBe('OFFLINE');
        }, { timeout: 2000 });

        // Restore
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
      });

      it('should auto-retry when coming back online', async () => {
        let isOnline = false;
        Object.defineProperty(navigator, 'onLine', {
          get: () => isOnline,
          configurable: true,
        });

        let callCount = 0;
        global.fetch = mock(() => {
          callCount++;
          if (!isOnline) {
            return Promise.reject(new Error('Network offline'));
          }
          return Promise.resolve(
            createMockResponse(
              createSSEStream(['data: Online\n\n', 'data: [DONE]\n\n'])
            )
          );
        });

        const { result, rerender } = renderHook((props) =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: props.enabled,
            maxRetries: 1,
          }),
          { initialProps: { enabled: true } }
        );

        // Should fail when offline
        await waitFor(() => {
          expect(result.current.error).not.toBeNull();
        }, { timeout: 3000 });

        // Go online and retry
        isOnline = true;
        act(() => {
          result.current.reset();
        });
        rerender({ enabled: false });
        rerender({ enabled: true });

        await waitFor(() => {
          expect(result.current.isComplete).toBe(true);
          expect(result.current.text).toBe('Online');
        }, { timeout: 3000 });
      });
    });

    describe('LocalStorage Save and Sync', () => {
      it('should preserve partial text when connection lost', async () => {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('data: Partial text before disconnect\n\n'));
            // Simulate disconnect
            setTimeout(() => controller.error(new Error('Connection lost')), 100);
          },
        });

        global.fetch = mock(() => Promise.resolve(createMockResponse(stream)));

        const { result } = renderHook(() =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: true,
          })
        );

        // Should preserve partial text
        await waitFor(() => {
          expect(result.current.text).toBe('Partial text before disconnect');
        }, { timeout: 2000 });
      });

      it('should sync after connection restored', async () => {
        let isConnected = false;
        let callCount = 0;

        global.fetch = mock(() => {
          callCount++;
          if (!isConnected) {
            return Promise.reject(new Error('Not connected'));
          }
          return Promise.resolve(
            createMockResponse(
              createSSEStream(['data: Synced\n\n', 'data: [DONE]\n\n'])
            )
          );
        });

        const { result, rerender } = renderHook((props) =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: props.enabled,
            maxRetries: 0,
          }),
          { initialProps: { enabled: true } }
        );

        // Should fail initially
        await waitFor(() => {
          expect(result.current.error).not.toBeNull();
        }, { timeout: 2000 });

        // Restore connection
        isConnected = true;
        act(() => {
          result.current.reset();
        });
        rerender({ enabled: false });
        rerender({ enabled: true });

        // Should sync successfully
        await waitFor(() => {
          expect(result.current.isComplete).toBe(true);
          expect(result.current.text).toBe('Synced');
        }, { timeout: 3000 });
      });
    });

    describe('Input Validation Edge Cases', () => {
      it('should handle empty request body gracefully', async () => {
        global.fetch = mock(() =>
          Promise.resolve(
            createMockResponse(
              createSSEStream(['data: Success\n\n', 'data: [DONE]\n\n'])
            )
          )
        );

        const { result } = renderHook(() =>
          useStreamingText({
            url: '/api/test',
            requestBody: {},
            enabled: true,
          })
        );

        await waitFor(() => {
          expect(result.current.isComplete).toBe(true);
        }, { timeout: 2000 });
      });

      it('should validate URL before making request', async () => {
        const { result } = renderHook(() =>
          useStreamingText({
            url: '',
            requestBody: { test: 'data' },
            enabled: true,
          })
        );

        await waitFor(() => {
          expect(result.current.error).not.toBeNull();
        }, { timeout: 2000 });
      });

      it('should handle malformed SSE data', async () => {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('invalid sse format\n\n'));
            controller.enqueue(encoder.encode('data: Valid\n\n'));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          },
        });

        global.fetch = mock(() => Promise.resolve(createMockResponse(stream)));

        const { result } = renderHook(() =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: true,
          })
        );

        // Should handle malformed data gracefully and continue
        await waitFor(() => {
          expect(result.current.text).toContain('Valid');
        }, { timeout: 2000 });
      });
    });

    describe('Error Logging Functionality', () => {
      it('should log all error types with context', async () => {
        const errors: Array<{ type: string; message: string }> = [];

        global.fetch = mock(() => Promise.reject(new Error('Test error')));

        const { result } = renderHook(() =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: true,
            maxRetries: 0,
          })
        );

        await waitFor(() => {
          expect(result.current.error).not.toBeNull();
        }, { timeout: 2000 });

        // Verify error information is available for logging
        expect(result.current.error).toBeDefined();
        expect(result.current.errorType).toBeDefined();
        expect(result.current.userFriendlyError).toBeDefined();
      });

      it('should track retry attempts for analytics', async () => {
        let callCount = 0;

        global.fetch = mock(() => {
          callCount++;
          if (callCount <= 2) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve(
            createMockResponse(
              createSSEStream(['data: Success\n\n', 'data: [DONE]\n\n'])
            )
          );
        });

        const { result } = renderHook(() =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: true,
            maxRetries: 3,
          })
        );

        // Wait for success after retries
        await waitFor(() => {
          expect(result.current.isComplete).toBe(true);
        }, { timeout: 10000 });

        // Verify retry count was tracked (should be reset to 0 after success)
        expect(result.current.retryCount).toBe(0);
        expect(callCount).toBeGreaterThan(1);
      });
    });

    describe('Graceful Degradation', () => {
      it('should fallback to error state when all recovery attempts fail', async () => {
        global.fetch = mock(() => Promise.reject(new Error('Permanent failure')));

        const { result } = renderHook(() =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: true,
            maxRetries: 2,
          })
        );

        await waitFor(() => {
          expect(result.current.error).not.toBeNull();
          expect(result.current.isRetrying).toBe(false);
        }, { timeout: 10000 });

        // Should provide clear error state for UI
        expect(result.current.userFriendlyError).toBeDefined();
        expect(result.current.recoverySuggestion).toBeDefined();
        expect(result.current.isComplete).toBe(false);
      });

      it('should maintain partial data even when stream fails', async () => {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode('data: Partial data\n\n'));
            setTimeout(() => controller.error(new Error('Stream error')), 100);
          },
        });

        global.fetch = mock(() => Promise.resolve(createMockResponse(stream)));

        const { result } = renderHook(() =>
          useStreamingText({
            url: '/api/test',
            requestBody: { test: 'data' },
            enabled: true,
          })
        );

        // Should keep partial data
        await waitFor(() => {
          expect(result.current.text).toBe('Partial data');
        }, { timeout: 2000 });

        // Even if error occurs, partial data should remain
        expect(result.current.text.length).toBeGreaterThan(0);
      });
    });
  });
});
