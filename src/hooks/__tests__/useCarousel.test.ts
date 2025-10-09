/**
 * useCarousel Hook 測試
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useCarousel } from '../useCarousel';

// Mock usePageVisibility
jest.mock('../usePageVisibility', () => ({
  usePageVisibility: jest.fn(() => true),
}));

describe('useCarousel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with index 0', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 5,
        })
      );

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isPlaying).toBe(true);
    });

    it('should initialize with custom initial index', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 5,
          initialIndex: 2,
        })
      );

      expect(result.current.currentIndex).toBe(2);
    });

    it('should respect autoPlay option', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 5,
          autoPlay: false,
        })
      );

      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should go to next index', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 5,
          autoPlay: false,
        })
      );

      expect(result.current.currentIndex).toBe(0);

      act(() => {
        result.current.next();
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it('should go to previous index', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 5,
          initialIndex: 2,
          autoPlay: false,
        })
      );

      expect(result.current.currentIndex).toBe(2);

      act(() => {
        result.current.previous();
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it('should loop to beginning when reaching end', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          initialIndex: 2,
          autoPlay: false,
        })
      );

      expect(result.current.currentIndex).toBe(2);

      act(() => {
        result.current.next();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should loop to end when going before beginning', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          initialIndex: 0,
          autoPlay: false,
        })
      );

      expect(result.current.currentIndex).toBe(0);

      act(() => {
        result.current.previous();
      });

      expect(result.current.currentIndex).toBe(2);
    });

    it('should go to specific index', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 5,
          autoPlay: false,
        })
      );

      act(() => {
        result.current.goToIndex(3);
      });

      expect(result.current.currentIndex).toBe(3);
    });

    it('should call onIndexChange when index changes', () => {
      const onIndexChange = jest.fn();

      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 5,
          autoPlay: false,
          onIndexChange,
        })
      );

      act(() => {
        result.current.next();
      });

      expect(onIndexChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Auto Play', () => {
    it('should auto-advance after interval', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          autoPlay: true,
          interval: 1000,
        })
      );

      expect(result.current.currentIndex).toBe(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.currentIndex).toBe(1);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.currentIndex).toBe(2);
    });

    it('should not auto-advance when paused', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          autoPlay: true,
          interval: 1000,
        })
      );

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // 索引不應該改變
      expect(result.current.currentIndex).toBe(0);
    });

    it('should resume auto-play after pause', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          autoPlay: true,
          interval: 1000,
        })
      );

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.resume();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it('should not auto-play when totalCount is 1', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 1,
          autoPlay: true,
          interval: 1000,
        })
      );

      expect(result.current.currentIndex).toBe(0);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // 索引不應該改變
      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe('Interaction Pause', () => {
    it('should pause on mouse move', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          autoPlay: true,
          pauseOnInteraction: true,
          interval: 1000,
        })
      );

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        const event = new Event('mousemove');
        window.dispatchEvent(event);
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should resume after 5 seconds of no interaction', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          autoPlay: true,
          pauseOnInteraction: true,
          interval: 1000,
        })
      );

      act(() => {
        const event = new Event('mousemove');
        window.dispatchEvent(event);
      });

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should reset interaction timeout on repeated interaction', () => {
      const { result } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          autoPlay: true,
          pauseOnInteraction: true,
          interval: 1000,
        })
      );

      // 第一次互動
      act(() => {
        const event = new Event('mousemove');
        window.dispatchEvent(event);
      });

      // 等待 3 秒
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // 仍然暫停中
      expect(result.current.isPlaying).toBe(false);

      // 第二次互動
      act(() => {
        const event = new Event('mousemove');
        window.dispatchEvent(event);
      });

      // 再等待 3 秒（總共 6 秒，但計時器已重置）
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // 仍然暫停中（因為從第二次互動開始只過了 3 秒）
      expect(result.current.isPlaying).toBe(false);

      // 再等待 2 秒（距離第二次互動 5 秒）
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // 現在應該恢復了
      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clean up timers on unmount', () => {
      const { unmount } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          autoPlay: true,
          interval: 1000,
        })
      );

      // unmount 不應該報錯
      expect(() => unmount()).not.toThrow();
    });

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useCarousel({
          totalCount: 3,
          autoPlay: true,
          pauseOnInteraction: true,
        })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
