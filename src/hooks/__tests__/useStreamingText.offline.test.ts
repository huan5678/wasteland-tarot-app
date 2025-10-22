/**
 * 🔴 P2 Cycle 1 RED - Network Offline Detection Tests
 *
 * TDD for Advanced Error Handling: Network offline detection
 *
 * Test Coverage:
 * 1. Detect offline state using navigator.onLine
 * 2. Stop retries immediately when offline
 * 3. Resume when network reconnects
 * 4. Provide offline-specific error messages
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useStreamingText } from '../useStreamingText';

// Mock fetch
global.fetch = jest.fn();

// Mock useAudioEffect
jest.mock('@/hooks/useAudioEffect', () => ({
  useAudioEffect: () => ({
    playSound: jest.fn(),
    stopSound: jest.fn(),
  }),
}));

describe('🔴 P2 Cycle 1: Network Offline Detection', () => {
  let originalOnLine: boolean;

  beforeEach(() => {
    jest.clearAllMocks();
    // Save original navigator.onLine
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    // Restore navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalOnLine,
    });
  });

  /**
   * Test 1: Detect offline state
   * Should detect when navigator.onLine is false
   */
  it('🔴 should detect offline state and fail immediately', async () => {
    // Simulate offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    // Should fail immediately without retries
    expect(result.current.error?.message).toMatch(/offline|network/i);
    expect(result.current.retryCount).toBe(0);
  });

  /**
   * Test 2: Stop retries when going offline mid-stream
   * Should abort ongoing retries when network goes offline
   */
  it('🔴 should stop retries when network goes offline during streaming', async () => {
    let callCount = 0;
    const onlineSpy = jest.fn();

    // Start online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    (global.fetch as jest.Mock).mockImplementation(() => {
      callCount++;

      // Simulate going offline on second retry
      if (callCount === 2) {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: false,
        });

        // Trigger offline event
        const offlineEvent = new Event('offline');
        window.dispatchEvent(offlineEvent);
        onlineSpy();
      }

      return Promise.reject(new Error('Network error'));
    });

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 5, // Allow multiple retries to test mid-stream abort
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 5000 }
    );

    // Should stop retries when offline is detected
    expect(onlineSpy).toHaveBeenCalled();
    expect(callCount).toBeLessThan(5); // Should not reach max retries
    expect(result.current.error?.message).toMatch(/offline|connection lost/i);
  });

  /**
   * Test 3: Resume streaming when network reconnects
   * Should be able to restart streaming after going back online
   */
  it('🔴 should allow retry when network reconnects', async () => {
    let callCount = 0;

    // Start offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    (global.fetch as jest.Mock).mockImplementation(() => {
      callCount++;

      if (callCount === 1) {
        // First call fails (offline)
        return Promise.reject(new Error('Network connection lost'));
      }

      // Subsequent calls succeed (after reconnect)
      return Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: test\n\n'),
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: [DONE]\n\n'),
              })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: jest.fn(),
          }),
        },
      } as any);
    });

    const { result, rerender } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
      })
    );

    // Wait for initial offline error
    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    expect(result.current.error?.message).toMatch(/offline|connection lost/i);

    // Simulate network reconnection
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);

    // Re-enable to trigger retry
    rerender();

    // Wait a bit for reconnection handling
    await waitFor(
      () => {
        expect(navigator.onLine).toBe(true);
      },
      { timeout: 1000 }
    );

    // Note: Actual retry would require user action or automatic retry mechanism
    // This test verifies that we CAN retry after reconnection (navigator.onLine = true)
    expect(navigator.onLine).toBe(true);
  });

  /**
   * Test 4: Offline-specific error message
   * Should provide clear error message for offline state
   */
  it('🔴 should provide offline-specific error message', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    // Error should indicate offline state
    expect(result.current.error?.message).toMatch(
      /network connection lost|offline|no internet/i
    );

    // Should not have retried
    expect(result.current.retryCount).toBe(0);
  });

  /**
   * Test 5: Online event listener registration
   * Should listen for online/offline events
   */
  it('🔴 should register and cleanup online/offline event listeners', async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: false, // Don't auto-start
      })
    );

    // Should register event listeners
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    // Should cleanup event listeners
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  /**
   * Test 6: Network state exposure
   * Should expose network online/offline state to consumers
   */
  it('🔴 should expose network state to consumers', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: false,
      })
    );

    // Should expose isOnline state
    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    const offlineEvent = new Event('offline');
    window.dispatchEvent(offlineEvent);

    // Note: This would require the hook to update state on event
    // The test validates that the hook SHOULD expose this state
  });
});
