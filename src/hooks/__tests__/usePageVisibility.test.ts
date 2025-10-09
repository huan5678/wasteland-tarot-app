/**
 * usePageVisibility Hook 測試
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { usePageVisibility } from '../usePageVisibility';

describe('usePageVisibility', () => {
  let visibilityState: 'visible' | 'hidden';
  let listeners: Array<() => void>;

  beforeEach(() => {
    visibilityState = 'visible';
    listeners = [];

    // Mock document.visibilityState
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get() {
        return visibilityState;
      },
    });

    // Mock addEventListener/removeEventListener
    const originalAddEventListener = document.addEventListener;
    const originalRemoveEventListener = document.removeEventListener;

    document.addEventListener = jest.fn((event: string, handler: any) => {
      if (event === 'visibilitychange') {
        listeners.push(handler);
      }
    }) as any;

    document.removeEventListener = jest.fn((event: string, handler: any) => {
      if (event === 'visibilitychange') {
        const index = listeners.indexOf(handler);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return true when page is visible initially', () => {
    visibilityState = 'visible';
    const { result } = renderHook(() => usePageVisibility());

    expect(result.current).toBe(true);
  });

  it('should return false when page becomes hidden', () => {
    const { result } = renderHook(() => usePageVisibility());

    expect(result.current).toBe(true);

    // 模擬頁面切換至背景
    act(() => {
      visibilityState = 'hidden';
      listeners.forEach((listener) => listener());
    });

    expect(result.current).toBe(false);
  });

  it('should return true when page becomes visible again', () => {
    const { result } = renderHook(() => usePageVisibility());

    // 切換至背景
    act(() => {
      visibilityState = 'hidden';
      listeners.forEach((listener) => listener());
    });

    expect(result.current).toBe(false);

    // 恢復至前景
    act(() => {
      visibilityState = 'visible';
      listeners.forEach((listener) => listener());
    });

    expect(result.current).toBe(true);
  });

  it('should handle multiple visibility changes', () => {
    const { result } = renderHook(() => usePageVisibility());

    // 第一次切換
    act(() => {
      visibilityState = 'hidden';
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe(false);

    // 第二次切換
    act(() => {
      visibilityState = 'visible';
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe(true);

    // 第三次切換
    act(() => {
      visibilityState = 'hidden';
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe(false);
  });

  it('should register visibilitychange event listener', () => {
    renderHook(() => usePageVisibility());

    expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('should clean up event listener on unmount', () => {
    const { unmount } = renderHook(() => usePageVisibility());

    expect(listeners.length).toBe(1);

    unmount();

    expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(listeners.length).toBe(0);
  });

  it('should not leak event listeners', () => {
    const { unmount: unmount1 } = renderHook(() => usePageVisibility());
    const { unmount: unmount2 } = renderHook(() => usePageVisibility());

    expect(listeners.length).toBe(2);

    unmount1();
    expect(listeners.length).toBe(1);

    unmount2();
    expect(listeners.length).toBe(0);
  });
});
