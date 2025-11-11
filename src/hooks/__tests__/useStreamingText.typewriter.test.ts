/**
 * useStreamingText - Typewriter Effect Optimization Tests
 *
 * Tests for Task 4.1: Optimize typewriter effect rendering
 * - 30-50 characters/second display speed
 * - ±20% random variation to simulate human typing
 * - Batch rendering (10 chars per batch) if FPS < 30
 * - First batch renders within 200ms of receiving data
 * - Pause/resume controls
 * - 2x speed controls
 *
 * @see requirements.md Requirement 2.3, 2.12
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamingText } from '../useStreamingText';

// Mock fetch for testing
global.fetch = jest.fn();

describe('useStreamingText - Typewriter Effect Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Speed Control', () => {
    it('should display at 30-50 characters per second by default', async () => {
      // Create mock readable stream
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: Hello World!\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/test',
          requestBody: {},
          enabled: true,
          charsPerSecond: 40 // Default speed
        })
      );

      // Wait for streaming to start
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // With 40 chars/sec, expect ~25ms per char
      // After 200ms, should show ~8 chars
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.text.length).toBeGreaterThanOrEqual(6);
      expect(result.current.text.length).toBeLessThanOrEqual(10);
    });

    it('should support 2x speed mode', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: ' + 'A'.repeat(100) + '\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/test',
          requestBody: {},
          enabled: true,
          charsPerSecond: 40
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Enable 2x speed
      act(() => {
        result.current.setSpeed(2);
      });

      // With 2x speed (80 chars/sec), after 500ms should show ~40 chars
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.text.length).toBeGreaterThanOrEqual(35);
      expect(result.current.text.length).toBeLessThanOrEqual(45);
    });

    it('should support custom speed multipliers', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: ' + 'A'.repeat(100) + '\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/test',
          requestBody: {},
          enabled: true,
          charsPerSecond: 40
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Set 0.5x speed
      act(() => {
        result.current.setSpeed(0.5);
      });

      // With 0.5x speed (20 chars/sec), after 500ms should show ~10 chars
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.text.length).toBeGreaterThanOrEqual(8);
      expect(result.current.text.length).toBeLessThanOrEqual(12);
    });
  });

  describe('Pause/Resume Control', () => {
    it('should support pausing typewriter effect', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: ' + 'A'.repeat(100) + '\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/test',
          requestBody: {},
          enabled: true,
          charsPerSecond: 40
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Pause after 200ms
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      const textLengthBeforePause = result.current.text.length;

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);

      // Advance time while paused
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Text should not change while paused
      expect(result.current.text.length).toBe(textLengthBeforePause);
    });

    it('should support resuming typewriter effect', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: ' + 'A'.repeat(100) + '\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/test',
          requestBody: {},
          enabled: true,
          charsPerSecond: 40
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Pause
      act(() => {
        result.current.pause();
      });

      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      const textLengthBeforeResume = result.current.text.length;

      // Resume
      act(() => {
        result.current.resume();
      });

      expect(result.current.isPaused).toBe(false);

      // Advance time after resume
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      // Text should continue displaying after resume
      expect(result.current.text.length).toBeGreaterThan(textLengthBeforeResume);
    });

    it('should toggle pause state correctly', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: Test\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/test',
          requestBody: {},
          enabled: true
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Initially not paused
      expect(result.current.isPaused).toBe(false);

      // Toggle pause
      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(true);

      // Toggle again (resume)
      act(() => {
        result.current.togglePause();
      });

      expect(result.current.isPaused).toBe(false);
    });
  });

  describe('Random Variation (±20%)', () => {
    it('should apply random variation to typing speed', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: ' + 'A'.repeat(100) + '\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      // Run multiple times to test random variation
      const lengths: number[] = [];

      for (let i = 0; i < 5; i++) {
        const { result } = renderHook(() =>
          useStreamingText({
            url: '/test',
            requestBody: {},
            enabled: true,
            charsPerSecond: 40,
            enableRandomVariation: true
          })
        );

        await act(async () => {
          jest.advanceTimersByTime(100);
        });

        await act(async () => {
          jest.advanceTimersByTime(500);
        });

        lengths.push(result.current.text.length);
      }

      // Check that lengths vary (not all the same)
      const uniqueLengths = new Set(lengths);
      expect(uniqueLengths.size).toBeGreaterThan(1);

      // Check that all lengths are within expected range
      // 40 chars/sec * 0.5s = 20 chars
      // With ±20% variation: 16-24 chars
      lengths.forEach(length => {
        expect(length).toBeGreaterThanOrEqual(14);
        expect(length).toBeLessThanOrEqual(26);
      });
    });

    it('should work without random variation when disabled', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: ' + 'A'.repeat(100) + '\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const lengths: number[] = [];

      for (let i = 0; i < 3; i++) {
        const { result } = renderHook(() =>
          useStreamingText({
            url: '/test',
            requestBody: {},
            enabled: true,
            charsPerSecond: 40,
            enableRandomVariation: false
          })
        );

        await act(async () => {
          jest.advanceTimersByTime(100);
        });

        await act(async () => {
          jest.advanceTimersByTime(500);
        });

        lengths.push(result.current.text.length);
      }

      // All lengths should be similar (within 1-2 chars due to chunking)
      const firstLength = lengths[0];
      lengths.forEach(length => {
        expect(Math.abs(length - firstLength)).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should use batch rendering when FPS drops below 30', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: ' + 'A'.repeat(1000) + '\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/test',
          requestBody: {},
          enabled: true,
          charsPerSecond: 40
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Simulate low FPS by calling internal performance detector
      act(() => {
        result.current.simulateLowFPS();
      });

      // Check that batch rendering is enabled
      expect(result.current.isBatchRendering).toBe(true);
      expect(result.current.batchSize).toBe(10);
    });

    it('should render first batch within 200ms of receiving data', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: Hello World!\n\n'));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const startTime = Date.now();

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/test',
          requestBody: {},
          enabled: true,
          charsPerSecond: 40
        })
      );

      // Wait for first render
      await waitFor(() => {
        expect(result.current.text.length).toBeGreaterThan(0);
      }, { timeout: 300 });

      const firstRenderTime = Date.now() - startTime;

      // First render should happen within 200ms
      expect(firstRenderTime).toBeLessThan(200);
    });
  });

  describe('Skip Functionality (Existing)', () => {
    it('should skip to full text when skip is called', async () => {
      const fullText = 'Hello World! This is a test message.';

      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`data: ${fullText}\n\n`));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream
      });

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/test',
          requestBody: {},
          enabled: true,
          charsPerSecond: 40
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Skip after partial display
      await act(async () => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.text.length).toBeLessThan(fullText.length);

      // Call skip
      act(() => {
        result.current.skip();
      });

      // Should show full text immediately
      expect(result.current.text).toBe(fullText);
    });
  });
});
