/**
 * 🔴 P2 Cycle 2 RED - Fallback Strategy Tests
 *
 * TDD for Advanced Error Handling: Fallback to non-streaming response
 *
 * Test Coverage:
 * 1. Fallback to full response when streaming fails
 * 2. Handle full JSON response format
 * 3. Mark as non-streaming mode
 * 4. Fallback only after maxRetries exhausted
 * 5. No typewriter effect in fallback mode
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

describe('🔴 P2 Cycle 2: Fallback Strategy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  /**
   * Test 1: Fallback to full response when streaming fails
   * Should attempt fallback after all retries exhausted
   */
  it('🔴 should fallback to full response when streaming fails after retries', async () => {
    let callCount = 0;

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      callCount++;

      // First 4 calls: streaming endpoint fails (1 initial + 3 retries)
      if (url.includes('/stream') && callCount <= 4) {
        return Promise.reject(new Error('Streaming service unavailable'));
      }

      // 5th call: fallback to non-streaming endpoint succeeds
      if (url.includes('/interpretation') && !url.includes('/stream')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            interpretation: 'Full interpretation text from fallback',
          }),
        } as Response);
      }

      return Promise.reject(new Error('Unexpected URL'));
    });

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/v1/readings/interpretation/stream',
        requestBody: { card_id: 1 },
        enabled: true,
        maxRetries: 3,
        enableFallback: true, // 🟢 New option to enable fallback
      })
    );

    // Wait for streaming to fail and fallback to succeed
    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 10000 }
    );

    // Should have full text from fallback
    expect(result.current.text).toBe('Full interpretation text from fallback');
    expect(result.current.error).toBeNull();
    expect(result.current.usedFallback).toBe(true); // 🟢 New state flag
  });

  /**
   * Test 2: Handle full JSON response format
   * Should correctly parse JSON response from fallback endpoint
   */
  it('🔴 should correctly parse JSON response from fallback endpoint', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stream')) {
        return Promise.reject(new Error('Streaming failed'));
      }

      // Fallback endpoint returns JSON
      return Promise.resolve({
        ok: true,
        json: async () => ({
          interpretation: 'Fallback interpretation',
          card_name: 'The Fool',
          position: 'upright',
        }),
      } as Response);
    });

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/v1/readings/interpretation/stream',
        requestBody: { card_id: 0 },
        enabled: true,
        maxRetries: 1,
        enableFallback: true,
        fallbackResponseKey: 'interpretation', // 🟢 Configure which key to use
      })
    );

    await waitFor(
      () => {
        expect(result.current.text).toBe('Fallback interpretation');
      },
      { timeout: 5000 }
    );

    expect(result.current.usedFallback).toBe(true);
  });

  /**
   * Test 3: No fallback when disabled
   * Should fail normally if fallback is disabled
   */
  it('🔴 should fail without fallback when enableFallback is false', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Streaming failed'));

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/v1/readings/interpretation/stream',
        requestBody: { card_id: 1 },
        enabled: true,
        maxRetries: 1,
        enableFallback: false, // Fallback disabled
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 5000 }
    );

    // Should fail with error, no fallback
    expect(result.current.error?.message).toMatch(/streaming failed/i);
    expect(result.current.usedFallback).toBe(false);
  });

  /**
   * Test 4: Fallback URL derivation
   * Should correctly derive fallback URL from streaming URL
   */
  it('🔴 should derive fallback URL by removing /stream suffix', async () => {
    let capturedUrls: string[] = [];

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      capturedUrls.push(url);

      if (url.includes('/stream')) {
        return Promise.reject(new Error('Streaming failed'));
      }

      // Fallback should be /interpretation (without /stream)
      return Promise.resolve({
        ok: true,
        json: async () => ({ interpretation: 'Fallback text' }),
      } as Response);
    });

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/v1/readings/interpretation/stream',
        requestBody: { card_id: 1 },
        enabled: true,
        maxRetries: 1,
        enableFallback: true,
      })
    );

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 5000 }
    );

    // Should have called both streaming and fallback URLs
    expect(capturedUrls).toContain('/api/v1/readings/interpretation/stream');
    expect(capturedUrls).toContain('/api/v1/readings/interpretation');
  });

  /**
   * Test 5: No typewriter effect in fallback mode
   * Fallback should display text immediately without streaming effect
   */
  it('🔴 should display fallback text immediately without typewriter effect', async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stream')) {
        return Promise.reject(new Error('Streaming failed'));
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ interpretation: 'Immediate fallback text' }),
      } as Response);
    });

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/v1/readings/interpretation/stream',
        requestBody: { card_id: 1 },
        enabled: true,
        maxRetries: 0, // No retries, immediate fallback
        enableFallback: true,
        charsPerSecond: 10, // Slow typewriter (should be bypassed)
      })
    );

    await waitFor(
      () => {
        expect(result.current.text).toBe('Immediate fallback text');
      },
      { timeout: 5000 }
    );

    // Text should appear immediately, not gradually
    expect(result.current.text.length).toBe('Immediate fallback text'.length);
    expect(result.current.isComplete).toBe(true);

    jest.useRealTimers();
  });

  /**
   * Test 6: Fallback failure handling
   * Should set error if fallback also fails
   */
  it('🔴 should set error if fallback endpoint also fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Complete service outage'));

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/v1/readings/interpretation/stream',
        requestBody: { card_id: 1 },
        enabled: true,
        maxRetries: 1,
        enableFallback: true,
      })
    );

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
      },
      { timeout: 5000 }
    );

    // Both streaming and fallback failed
    expect(result.current.error?.message).toMatch(/service outage|failed/i);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.usedFallback).toBe(false);
  });

  /**
   * Test 7: Custom fallback URL
   * Should support custom fallback URL instead of auto-derived
   */
  it('🔴 should support custom fallback URL', async () => {
    let capturedUrl = '';

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stream')) {
        return Promise.reject(new Error('Streaming failed'));
      }

      capturedUrl = url;
      return Promise.resolve({
        ok: true,
        json: async () => ({ result: 'Custom fallback response' }),
      } as Response);
    });

    const { result } = renderHook(() =>
      useStreamingText({
        url: '/api/v1/readings/interpretation/stream',
        requestBody: { card_id: 1 },
        enabled: true,
        maxRetries: 0,
        enableFallback: true,
        fallbackUrl: '/api/v1/readings/full-interpretation', // 🟢 Custom fallback URL
        fallbackResponseKey: 'result',
      })
    );

    await waitFor(
      () => {
        expect(result.current.text).toBe('Custom fallback response');
      },
      { timeout: 5000 }
    );

    expect(capturedUrl).toBe('/api/v1/readings/full-interpretation');
  });
});
