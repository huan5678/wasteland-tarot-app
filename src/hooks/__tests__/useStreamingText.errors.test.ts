/**
 * 🔴 P2 Cycle 3 RED - Friendly Error Messages Tests
 *
 * TDD for Advanced Error Handling: Classify errors and provide friendly messages
 *
 * Test Coverage:
 * 1. Network errors → "網路連線不穩定，請檢查您的網路設定"
 * 2. Timeout errors → "連線逾時，請稍後再試"
 * 3. HTTP 4xx errors → "請求無效，請確認參數是否正確"
 * 4. HTTP 5xx errors → "伺服器暫時無法回應，請稍後再試"
 * 5. Offline errors → "目前無網路連線，請檢查網路設定"
 * 6. Unknown errors → "發生未知錯誤，請稍後再試"
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

describe('🔴 P2 Cycle 3: Friendly Error Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  /**
   * Test 1: Network error classification
   * Should provide friendly message for network errors
   */
  it('🔴 should provide friendly message for network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    // Should have user-friendly message
    expect(result.current.userFriendlyError).toMatch(
      /網路連線|網路設定|connection|network/i
    );
    expect(result.current.errorType).toBe('NETWORK_ERROR');
  });

  /**
   * Test 2: Timeout error classification
   * Should provide friendly message for timeout errors
   */
  it('🔴 should provide friendly message for timeout errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error('Request timeout after 30000ms')
    );

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    expect(result.current.userFriendlyError).toMatch(
      /逾時|稍後再試|timeout/i
    );
    expect(result.current.errorType).toBe('TIMEOUT');
  });

  /**
   * Test 3: HTTP 400 error classification
   * Should provide friendly message for client errors
   */
  it('🔴 should provide friendly message for HTTP 4xx errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    } as Response);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    expect(result.current.userFriendlyError).toMatch(
      /請求無效|參數|invalid|parameter/i
    );
    expect(result.current.errorType).toBe('CLIENT_ERROR');
  });

  /**
   * Test 4: HTTP 500 error classification
   * Should provide friendly message for server errors
   */
  it('🔴 should provide friendly message for HTTP 5xx errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as Response);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    expect(result.current.userFriendlyError).toMatch(
      /伺服器|暫時無法|server|unavailable/i
    );
    expect(result.current.errorType).toBe('SERVER_ERROR');
  });

  /**
   * Test 5: Offline error classification
   * Should provide friendly message for offline state
   */
  it('🔴 should provide friendly message for offline errors', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: false,
    });

    (global.fetch as jest.Mock).mockRejectedValue(
      new Error('Network connection lost')
    );

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

    expect(result.current.userFriendlyError).toMatch(
      /無網路|網路連線|offline|no connection/i
    );
    expect(result.current.errorType).toBe('OFFLINE');
  });

  /**
   * Test 6: Unknown error classification
   * Should provide generic friendly message for unknown errors
   */
  it('🔴 should provide generic message for unknown errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error('SomeWeirdInternalError')
    );

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    expect(result.current.userFriendlyError).toMatch(
      /未知錯誤|稍後再試|unknown error|try again/i
    );
    expect(result.current.errorType).toBe('UNKNOWN');
  });

  /**
   * Test 7: Error recovery suggestions
   * Should provide actionable suggestions for different error types
   */
  it('🔴 should provide recovery suggestions for errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    // Should have recovery suggestion
    expect(result.current.recoverySuggestion).toBeTruthy();
    expect(result.current.recoverySuggestion).toMatch(
      /檢查|重試|try|check/i
    );
  });

  /**
   * Test 8: Preserve technical error details
   * Should keep original error for debugging
   */
  it('🔴 should preserve original error for debugging', async () => {
    const technicalError = new Error('Technical: Database connection failed');

    (global.fetch as jest.Mock).mockRejectedValue(technicalError);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    // Original error preserved
    expect(result.current.error?.message).toBe(technicalError.message);

    // But user sees friendly message
    expect(result.current.userFriendlyError).not.toBe(technicalError.message);
    expect(result.current.userFriendlyError).toMatch(/友善|friendly/i);
  });

  /**
   * Test 9: HTTP 404 specific handling
   * Should identify missing endpoints
   */
  it('🔴 should handle HTTP 404 specifically', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    expect(result.current.errorType).toBe('NOT_FOUND');
    expect(result.current.userFriendlyError).toMatch(
      /找不到|資源不存在|not found/i
    );
  });

  /**
   * Test 10: HTTP 401/403 authentication errors
   * Should identify permission issues
   */
  it('🔴 should handle authentication errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/test',
        requestBody: {},
        enabled: true,
        maxRetries: 0,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 2000 }
    );

    expect(result.current.errorType).toBe('AUTH_ERROR');
    expect(result.current.userFriendlyError).toMatch(
      /權限|登入|authentication|permission/i
    );
  });
});
