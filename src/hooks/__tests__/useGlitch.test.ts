/**
 * useGlitch Hook 測試
 *
 * 測試涵蓋：
 * - 隨機觸發機制
 * - prefers-reduced-motion 停用邏輯
 * - 分頁隱藏時暫停觸發
 * - 行動裝置降低頻率邏輯
 * - cleanup function 正確清理計時器
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useGlitch } from '../useGlitch';

// Mock usePageVisibility hook
jest.mock('../usePageVisibility', () => ({
  usePageVisibility: jest.fn(() => true),
}));

describe('useGlitch', () => {
  let prefersReducedMotion = false;
  let mediaQueryListeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    jest.useFakeTimers();
    prefersReducedMotion = false;
    mediaQueryListeners = [];

    // Mock window.matchMedia
    window.matchMedia = jest.fn((query: string) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return {
          matches: prefersReducedMotion,
          addEventListener: jest.fn((event: string, handler: any) => {
            if (event === 'change') {
              mediaQueryListeners.push(handler);
            }
          }),
          removeEventListener: jest.fn((event: string, handler: any) => {
            if (event === 'change') {
              const index = mediaQueryListeners.indexOf(handler);
              if (index > -1) {
                mediaQueryListeners.splice(index, 1);
              }
            }
          }),
        } as any;
      }
      return {
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as any;
    }) as any;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('基礎功能', () => {
    it('should initialize with isGlitching = false', () => {
      const { result } = renderHook(() => useGlitch());
      expect(result.current.isGlitching).toBe(false);
    });

    it('should trigger glitch after random interval', async () => {
      const { result } = renderHook(() =>
        useGlitch({ minInterval: 8000, maxInterval: 15000 })
      );

      expect(result.current.isGlitching).toBe(false);

      // 快進至最大間隔
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });

      expect(result.current.isGlitching).toBe(true);
    });

    it('should reset isGlitching after 250ms (GLITCH_DURATION)', async () => {
      const { result } = renderHook(() =>
        useGlitch({ minInterval: 8000, maxInterval: 15000 })
      );

      // 觸發 glitch
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);

      // 快進 250ms
      await act(async () => {
        jest.advanceTimersByTime(250);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(false);
    });

    it('should schedule next glitch after current glitch completes', async () => {
      const { result } = renderHook(() =>
        useGlitch({ minInterval: 8000, maxInterval: 15000 })
      );

      // 第一次 glitch
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);

      await act(async () => {
        jest.advanceTimersByTime(250);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(false);

      // 第二次 glitch
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);
    });
  });

  describe('prefers-reduced-motion 停用邏輯', () => {
    it('should not trigger glitch when prefersReducedMotion is true', async () => {
      prefersReducedMotion = true;
      const { result } = renderHook(() => useGlitch());

      await act(async () => {
        jest.advanceTimersByTime(20000);
        await Promise.resolve();
      });

      expect(result.current.isGlitching).toBe(false);
    });

    it('should stop glitch when prefers-reduced-motion changes to reduce', async () => {
      const { result } = renderHook(() => useGlitch());

      // 觸發 glitch
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);

      // 模擬 prefers-reduced-motion 變更
      await act(async () => {
        prefersReducedMotion = true;
        mediaQueryListeners.forEach((listener) => {
          listener({ matches: true } as MediaQueryListEvent);
        });
        await Promise.resolve();
      });

      expect(result.current.isGlitching).toBe(false);
    });

    it('should resume glitch when prefers-reduced-motion changes back to no-preference', async () => {
      prefersReducedMotion = true;
      const { result } = renderHook(() => useGlitch());

      expect(result.current.isGlitching).toBe(false);

      // 恢復動畫偏好
      await act(async () => {
        prefersReducedMotion = false;
        mediaQueryListeners.forEach((listener) => {
          listener({ matches: false } as MediaQueryListEvent);
        });
        await Promise.resolve();
      });

      // 等待觸發
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });

      expect(result.current.isGlitching).toBe(true);
    });
  });

  describe('分頁可見性控制', () => {
    it('should pause glitch when page is hidden', async () => {
      const { usePageVisibility } = require('../usePageVisibility');

      // 模擬頁面可見
      usePageVisibility.mockReturnValue(true);
      const { result, rerender } = renderHook(() => useGlitch());

      // 觸發 glitch
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);

      // 模擬頁面隱藏
      usePageVisibility.mockReturnValue(false);
      rerender();

      expect(result.current.isGlitching).toBe(false);
    });

    it('should resume glitch when page becomes visible again', async () => {
      const { usePageVisibility } = require('../usePageVisibility');

      // 初始隱藏
      usePageVisibility.mockReturnValue(false);
      const { result, rerender } = renderHook(() => useGlitch());

      await act(async () => {
        jest.advanceTimersByTime(20000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(false);

      // 恢復可見
      usePageVisibility.mockReturnValue(true);
      rerender();

      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);
    });
  });

  describe('行動裝置降低頻率', () => {
    it('should double interval on mobile devices', async () => {
      const { result } = renderHook(() =>
        useGlitch({ minInterval: 8000, maxInterval: 15000, isMobile: true })
      );

      // 行動裝置間隔 x2：minInterval 16000, maxInterval 30000
      // 使用較小間隔應該無法觸發
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(false);

      // 使用最大間隔應該能觸發
      await act(async () => {
        jest.advanceTimersByTime(15000); // 總計 30000ms
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);
    });

    it('should use normal interval on desktop', async () => {
      const { result } = renderHook(() =>
        useGlitch({ minInterval: 8000, maxInterval: 15000, isMobile: false })
      );

      // 桌面裝置使用原始間隔
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);
    });
  });

  describe('enabled 參數控制', () => {
    it('should not trigger glitch when enabled is false', async () => {
      const { result } = renderHook(() => useGlitch({ enabled: false }));

      await act(async () => {
        jest.advanceTimersByTime(20000);
        await Promise.resolve();
      });

      expect(result.current.isGlitching).toBe(false);
    });

    it('should stop glitch when enabled changes from true to false', async () => {
      const { result, rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) => useGlitch({ enabled }),
        { initialProps: { enabled: true } }
      );

      // 觸發 glitch
      await act(async () => {
        jest.advanceTimersByTime(15000);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);

      // 停用
      rerender({ enabled: false });

      expect(result.current.isGlitching).toBe(false);
    });
  });

  describe('資源清理', () => {
    it('should clear timers on unmount', () => {
      const { unmount } = renderHook(() => useGlitch());

      // 取得 setTimeout 的 spy
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clear media query listener on unmount', () => {
      const { unmount } = renderHook(() => useGlitch());

      const initialListenerCount = mediaQueryListeners.length;
      expect(initialListenerCount).toBeGreaterThan(0);

      unmount();

      // 驗證 listener 已被移除
      expect(mediaQueryListeners.length).toBe(initialListenerCount - 1);
    });

    it('should not leak timers across multiple instances', () => {
      const { unmount: unmount1 } = renderHook(() => useGlitch());
      const { unmount: unmount2 } = renderHook(() => useGlitch());

      const pendingTimers1 = jest.getTimerCount();

      unmount1();
      const pendingTimers2 = jest.getTimerCount();

      unmount2();
      const pendingTimers3 = jest.getTimerCount();

      // 驗證計時器數量遞減
      expect(pendingTimers2).toBeLessThan(pendingTimers1);
      expect(pendingTimers3).toBeLessThan(pendingTimers2);
    });
  });

  describe('隨機間隔範圍', () => {
    it('should trigger glitch within minInterval and maxInterval range', async () => {
      const { result } = renderHook(() =>
        useGlitch({ minInterval: 5000, maxInterval: 10000 })
      );

      // 應該不會在 minInterval 之前觸發
      await act(async () => {
        jest.advanceTimersByTime(4999);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(false);

      // 應該在 maxInterval 之前觸發
      await act(async () => {
        jest.advanceTimersByTime(5001); // 總計 10000ms
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);
    });

    it('should use default intervals when not provided', async () => {
      const { result } = renderHook(() => useGlitch());

      // 預設 minInterval = 8000, maxInterval = 15000
      await act(async () => {
        jest.advanceTimersByTime(7999);
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(false);

      await act(async () => {
        jest.advanceTimersByTime(7001); // 總計 15000ms
        await Promise.resolve();
      });
      expect(result.current.isGlitching).toBe(true);
    });
  });
});
