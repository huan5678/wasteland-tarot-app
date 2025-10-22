/**
 * TDD Tests for useStreamingText - Audio Integration
 * Testing typing sound effects integration
 *
 * 🔴 RED: Write failing tests first
 * 🟢 GREEN: Make tests pass with minimal code
 * 🔵 REFACTOR: Improve code quality
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useStreamingText } from '../useStreamingText';
import * as audioHooks from '@/hooks/audio/useAudioEffect';

// Mock useAudioEffect hook
jest.mock('@/hooks/audio/useAudioEffect');

// Mock fetch API
global.fetch = jest.fn();

// Helper: Create mock SSE response
const createMockSSEResponse = (text: string): Response => {
  const encoder = new TextEncoder();
  const chunks = text.split('').map(char => `data: ${char}\n\n`);
  chunks.push('data: [DONE]\n\n');

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

describe('useStreamingText - Audio Integration (TDD)', () => {
  let mockPlaySound: jest.Mock;
  let mockStopSound: jest.Mock;
  let mockStopAll: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    // Setup audio mocks
    mockPlaySound = jest.fn();
    mockStopSound = jest.fn();
    mockStopAll = jest.fn();

    (audioHooks.useAudioEffect as jest.Mock).mockReturnValue({
      playSound: mockPlaySound,
      stopSound: mockStopSound,
      stopAll: mockStopAll,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // 🔴 TDD Cycle 1: Basic Audio Playback
  // ========================================

  describe('Cycle 1: Basic Audio Playback', () => {
    it('🔴 should play typing sound when enableTypingSound is true', async () => {
      // 這個測試現在會失敗，因為音效功能還沒實作

      (global.fetch as jest.Mock).mockResolvedValue(
        createMockSSEResponse('Hello')
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          enableTypingSound: true,
          charsPerSecond: 10, // 較慢，方便測試
          enabled: true,
        })
      );

      // 等待串流完成
      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 5000 }
      );

      // 驗證：應該播放了打字音效
      expect(mockPlaySound).toHaveBeenCalled();
      expect(mockPlaySound).toHaveBeenCalledWith(
        'typing',
        expect.objectContaining({
          volume: expect.any(Number),
        })
      );
    });

    it('🔴 should NOT play sound when enableTypingSound is false', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockSSEResponse('Hello')
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          enableTypingSound: false, // 關閉音效
          charsPerSecond: 10,
          enabled: true,
        })
      );

      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 5000 }
      );

      // 驗證：不應該播放音效
      expect(mockPlaySound).not.toHaveBeenCalled();
    });

    it('🔴 should NOT play sound by default (enableTypingSound undefined)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockSSEResponse('Hello')
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          // enableTypingSound 未設定，預設應該是 false
          charsPerSecond: 10,
          enabled: true,
        })
      );

      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 5000 }
      );

      // 驗證：預設不播放音效
      expect(mockPlaySound).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // 🔴 TDD Cycle 2: Sound Throttling
  // ========================================

  describe('Cycle 2: Sound Throttling', () => {
    it('🔴 should throttle sound playback to prevent excessive calls', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue(
        createMockSSEResponse('Hello World Test') // 16 字元
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          enableTypingSound: true,
          soundThrottle: 100, // 100ms 節流
          charsPerSecond: 100, // 快速打字（10ms/字元）
          enabled: true,
        })
      );

      // 快進時間讓打字機效果完成
      jest.advanceTimersByTime(2000);

      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 5000 }
      );

      // 驗證：音效呼叫次數應該少於字元數（因為有節流）
      // 16 字元，但 100ms 節流，理論上最多 20 次（2000ms / 100ms）
      expect(mockPlaySound.mock.calls.length).toBeLessThan(16);
      expect(mockPlaySound.mock.calls.length).toBeGreaterThan(0);

      jest.useRealTimers();
    });

    it('🔴 should respect custom soundThrottle value', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue(
        createMockSSEResponse('Test')
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          enableTypingSound: true,
          soundThrottle: 200, // 更長的節流時間
          charsPerSecond: 100,
          enabled: true,
        })
      );

      jest.advanceTimersByTime(1000);

      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 5000 }
      );

      // 驗證：更長的節流時間 = 更少的音效呼叫
      // 1000ms / 200ms = 最多 5 次
      expect(mockPlaySound.mock.calls.length).toBeLessThanOrEqual(5);

      jest.useRealTimers();
    });
  });

  // ========================================
  // 🔴 TDD Cycle 3: Sound Volume Control
  // ========================================

  describe('Cycle 3: Sound Volume Control', () => {
    it('🔴 should use default volume (0.3) if not specified', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockSSEResponse('Hi')
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          enableTypingSound: true,
          charsPerSecond: 10,
          enabled: true,
        })
      );

      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 5000 }
      );

      // 驗證：使用預設音量 0.3
      expect(mockPlaySound).toHaveBeenCalledWith(
        'typing',
        expect.objectContaining({
          volume: 0.3,
        })
      );
    });

    it('🔴 should use custom typingSoundVolume if provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockSSEResponse('Hi')
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          enableTypingSound: true,
          typingSoundVolume: 0.5, // 自訂音量
          charsPerSecond: 10,
          enabled: true,
        })
      );

      await waitFor(
        () => {
          expect(result.current.isComplete).toBe(true);
        },
        { timeout: 5000 }
      );

      // 驗證：使用自訂音量
      expect(mockPlaySound).toHaveBeenCalledWith(
        'typing',
        expect.objectContaining({
          volume: 0.5,
        })
      );
    });

    it('🔴 should not play sound when skipped', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockSSEResponse('Hello World')
      );

      const { result } = renderHook(() =>
        useStreamingText({
          url: '/api/test',
          requestBody: { test: true },
          enableTypingSound: true,
          charsPerSecond: 5, // 很慢，方便 skip
          enabled: true,
        })
      );

      // 等待一點點文字出現
      await waitFor(
        () => {
          expect(result.current.text.length).toBeGreaterThan(0);
        },
        { timeout: 2000 }
      );

      // 清除之前的呼叫記錄
      mockPlaySound.mockClear();

      // Skip 到完整文字
      result.current.skip();

      // 等待一小段時間
      await new Promise(resolve => setTimeout(resolve, 200));

      // 驗證：skip 後不應該繼續播放音效
      expect(mockPlaySound).not.toHaveBeenCalled();
    });
  });
});
