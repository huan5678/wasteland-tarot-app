/**
 * Test Suite: API Timeout Handling Hook
 *
 * Tests timeout detection, retry mechanism, and user feedback
 * for API requests exceeding 30 seconds.
 *
 * Requirements: 9.1
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiTimeout } from '../useApiTimeout';

describe('useApiTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Timeout Detection', () => {
    it('should detect timeout after 30 seconds', async () => {
      const mockFetch = jest.fn(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useApiTimeout({
        timeout: 30000
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.hasTimedOut).toBe(false);

      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current.hasTimedOut).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should not timeout if request completes in time', async () => {
      const mockFetch = jest.fn(() => Promise.resolve({ data: 'success' }));

      const { result } = renderHook(() => useApiTimeout({
        timeout: 30000
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      // Fast-forward 15 seconds (less than timeout)
      act(() => {
        jest.advanceTimersByTime(15000);
      });

      await waitFor(() => {
        expect(result.current.hasTimedOut).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toEqual({ data: 'success' });
      });
    });
  });

  describe('Error Messages', () => {
    it('should show zh-TW timeout message', async () => {
      const mockFetch = jest.fn(() => new Promise(() => {}));

      const { result } = renderHook(() => useApiTimeout({
        timeout: 30000
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('輻射干擾，連線中斷。請稍後再試');
        expect(result.current.error?.type).toBe('TIMEOUT');
      });
    });

    it('should include retry callback in error', async () => {
      const mockFetch = jest.fn(() => new Promise(() => {}));

      const { result } = renderHook(() => useApiTimeout({
        timeout: 30000
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current.error?.canRetry).toBe(true);
        expect(typeof result.current.retry).toBe('function');
      });
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry request when retry() is called', async () => {
      const mockFetch = jest.fn()
        .mockImplementationOnce(() => new Promise(() => {})) // First call times out
        .mockImplementationOnce(() => Promise.resolve({ data: 'success' })); // Second call succeeds

      const { result } = renderHook(() => useApiTimeout({
        timeout: 30000
      }));

      // First attempt
      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current.hasTimedOut).toBe(true);
      });

      // Retry
      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(result.current.hasTimedOut).toBe(false);
        expect(result.current.data).toEqual({ data: 'success' });
      });
    });

    it('should reset error state on retry', async () => {
      const mockFetch = jest.fn(() => new Promise(() => {}));

      const { result } = renderHook(() => useApiTimeout({
        timeout: 30000
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.retry();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.hasTimedOut).toBe(false);
    });
  });

  describe('Event Logging', () => {
    it('should log timeout event', async () => {
      const onTimeout = jest.fn();
      const mockFetch = jest.fn(() => new Promise(() => {}));

      const { result } = renderHook(() => useApiTimeout({
        timeout: 30000,
        onTimeout
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(onTimeout).toHaveBeenCalledWith({
          timestamp: expect.any(String),
          duration: 30000,
          endpoint: undefined
        });
      });
    });

    it('should include endpoint in log', async () => {
      const onTimeout = jest.fn();
      const mockFetch = jest.fn(() => new Promise(() => {}));

      const { result } = renderHook(() => useApiTimeout({
        timeout: 30000,
        onTimeout
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch, {
          endpoint: '/api/v1/readings'
        });
      });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(onTimeout).toHaveBeenCalledWith({
          timestamp: expect.any(String),
          duration: 30000,
          endpoint: '/api/v1/readings'
        });
      });
    });
  });

  describe('Custom Timeout Duration', () => {
    it('should respect custom timeout value', async () => {
      const mockFetch = jest.fn(() => new Promise(() => {}));

      const { result } = renderHook(() => useApiTimeout({
        timeout: 10000 // 10 seconds
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      // Should not timeout at 9 seconds
      act(() => {
        jest.advanceTimersByTime(9000);
      });

      expect(result.current.hasTimedOut).toBe(false);

      // Should timeout at 10 seconds
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.hasTimedOut).toBe(true);
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timer on unmount', () => {
      const mockFetch = jest.fn(() => new Promise(() => {}));

      const { result, unmount } = renderHook(() => useApiTimeout({
        timeout: 30000
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      unmount();

      // Advance time after unmount - should not throw
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(30000);
        });
      }).not.toThrow();
    });

    it('should cancel timeout if request completes', async () => {
      const mockFetch = jest.fn(() => Promise.resolve({ data: 'success' }));

      const { result } = renderHook(() => useApiTimeout({
        timeout: 30000
      }));

      act(() => {
        result.current.executeWithTimeout(mockFetch);
      });

      await waitFor(() => {
        expect(result.current.data).toBeTruthy();
      });

      // Advance time - should not trigger timeout
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(result.current.hasTimedOut).toBe(false);
    });
  });
});
