import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useReducedMotion } from '../useReducedMotion';

describe('useReducedMotion', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create mock matchMedia function
    mockMatchMedia = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when prefers-reduced-motion is not set', () => {
    // Mock matchMedia to return false (user prefers animations)
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should return true when prefers-reduced-motion is set to reduce', () => {
    // Mock matchMedia to return true (user prefers reduced motion)
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should add event listener for media query changes', () => {
    const addEventListenerMock = vi.fn();
    const removeEventListenerMock = vi.fn();

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
    });

    const { unmount } = renderHook(() => useReducedMotion());

    // Should register change listener
    expect(addEventListenerMock).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );

    // Should cleanup listener on unmount
    unmount();
    expect(removeEventListenerMock).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });

  it('should update when media query changes', () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;
    const addEventListenerMock = vi.fn((event, handler) => {
      if (event === 'change') {
        changeHandler = handler as (e: MediaQueryListEvent) => void;
      }
    });

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: addEventListenerMock,
      removeEventListener: vi.fn(),
    });

    const { result, rerender } = renderHook(() => useReducedMotion());

    // Initially false
    expect(result.current).toBe(false);

    // Simulate media query change to reduced motion
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent);
      }
    });

    // Force re-render to get updated state
    rerender();

    // Should now be true
    expect(result.current).toBe(true);
  });

  it('should handle SSR environment gracefully (no window.matchMedia)', () => {
    // Remove matchMedia to simulate SSR
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useReducedMotion());

    // Should default to false (no reduced motion) in SSR
    expect(result.current).toBe(false);
  });
});
