/**
 * useTypewriter Hook 測試
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTypewriter } from '../useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with empty display text', () => {
      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hello',
        })
      );

      expect(result.current.displayText).toBe('');
      expect(result.current.animationMode).toBe('idle');
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.progress).toBe(0);
    });
  });

  describe('Typing Mode', () => {
    it('should type text character by character', async () => {
      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hi',
          typingSpeed: 10,
        })
      );

      expect(result.current.displayText).toBe('');

      act(() => {
        result.current.startTyping();
      });

      expect(result.current.animationMode).toBe('typing');
      expect(result.current.isAnimating).toBe(true);

      // 等待動畫完成
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await waitFor(
        () => {
          expect(result.current.displayText).toBe('Hi');
          expect(result.current.animationMode).toBe('idle');
        },
        { timeout: 200 }
      );
    });

    it('should call onTypingComplete when typing finishes', async () => {
      const onTypingComplete = jest.fn();

      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hi',
          typingSpeed: 10,
          onTypingComplete,
        })
      );

      act(() => {
        result.current.startTyping();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await waitFor(
        () => {
          expect(onTypingComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 200 }
      );
    });

    it('should update progress during typing', async () => {
      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Test',
          typingSpeed: 10,
        })
      );

      act(() => {
        result.current.startTyping();
      });

      expect(result.current.progress).toBe(0);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // 進度應該在 0 和 1 之間
      await waitFor(() => {
        expect(result.current.progress).toBeGreaterThan(0);
      });
    });
  });

  describe('Deleting Mode', () => {
    it('should delete text character by character', async () => {
      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hi',
          deletingSpeed: 10,
        })
      );

      // 先打字
      act(() => {
        result.current.startTyping();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        expect(result.current.displayText).toBe('Hi');
      });

      // 開始刪除
      act(() => {
        result.current.startDeleting();
      });

      expect(result.current.animationMode).toBe('deleting');

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await waitFor(
        () => {
          expect(result.current.displayText).toBe('');
          expect(result.current.animationMode).toBe('idle');
        },
        { timeout: 200 }
      );
    });

    it('should call onDeletingComplete when deleting finishes', async () => {
      const onDeletingComplete = jest.fn();

      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hi',
          deletingSpeed: 10,
          onDeletingComplete,
        })
      );

      // 先打字
      act(() => {
        result.current.startTyping();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        expect(result.current.displayText).toBe('Hi');
      });

      // 開始刪除
      act(() => {
        result.current.startDeleting();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await waitFor(
        () => {
          expect(onDeletingComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 200 }
      );
    });
  });

  describe('Pause and Resume', () => {
    it('should pause animation', async () => {
      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hello',
          typingSpeed: 10,
        })
      );

      act(() => {
        result.current.startTyping();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      const textBeforePause = result.current.displayText;

      act(() => {
        result.current.pause();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // 暫停時文字不應該改變
      expect(result.current.displayText).toBe(textBeforePause);
    });

    it('should resume animation after pause', async () => {
      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hello',
          typingSpeed: 10,
        })
      );

      act(() => {
        result.current.startTyping();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      act(() => {
        result.current.pause();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      });

      const textAfterPause = result.current.displayText;

      act(() => {
        result.current.resume();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // 恢復後文字應該繼續增加
      await waitFor(() => {
        expect(result.current.displayText.length).toBeGreaterThan(textAfterPause.length);
      });
    });
  });

  describe('Reset', () => {
    it('should reset animation to initial state', async () => {
      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hello',
          typingSpeed: 10,
        })
      );

      act(() => {
        result.current.startTyping();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.displayText).toBe('');
      expect(result.current.animationMode).toBe('idle');
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.progress).toBe(0);
    });
  });

  describe('Reduced Motion', () => {
    it('should skip animation when prefersReducedMotion is true', () => {
      const onTypingComplete = jest.fn();

      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hello',
          prefersReducedMotion: true,
          onTypingComplete,
        })
      );

      act(() => {
        result.current.startTyping();
      });

      // 應該立即顯示完整文字
      expect(result.current.displayText).toBe('Hello');
      expect(result.current.animationMode).toBe('idle');
      expect(onTypingComplete).toHaveBeenCalledTimes(1);
    });

    it('should skip deleting animation when prefersReducedMotion is true', async () => {
      const onDeletingComplete = jest.fn();

      const { result } = renderHook(() =>
        useTypewriter({
          text: 'Hello',
          prefersReducedMotion: true,
          onDeletingComplete,
        })
      );

      // 先設定文字
      act(() => {
        result.current.startTyping();
      });

      expect(result.current.displayText).toBe('Hello');

      // 開始刪除
      act(() => {
        result.current.startDeleting();
      });

      // 應該立即清空
      expect(result.current.displayText).toBe('');
      expect(result.current.animationMode).toBe('idle');
      expect(onDeletingComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('should clean up animation frame on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useTypewriter({
          text: 'Hello',
          typingSpeed: 10,
        })
      );

      act(() => {
        result.current.startTyping();
      });

      // unmount 不應該報錯
      expect(() => unmount()).not.toThrow();
    });
  });
});
