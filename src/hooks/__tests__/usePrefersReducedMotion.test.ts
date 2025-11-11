/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { usePrefersReducedMotion } from '../usePrefersReducedMotion';

// Define a proper type for MediaQueryList mock
type MediaQueryListMock = {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof mock>;
  removeEventListener: ReturnType<typeof mock>;
  addListener: ReturnType<typeof mock>;
  removeListener: ReturnType<typeof mock>;
  dispatchEvent: ReturnType<typeof mock>;
};

describe('usePrefersReducedMotion', () => {
  // Save original matchMedia
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    // Save original matchMedia before each test
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    // Restore original matchMedia after each test
    if (originalMatchMedia) {
      window.matchMedia = originalMatchMedia;
    }
  });

  describe('SSR safety', () => {
    it('should return true during SSR (no window.matchMedia)', async () => {
      // Simulate SSR by removing matchMedia
      // @ts-ignore - Intentionally setting to undefined for test
      window.matchMedia = undefined;

      const { result } = renderHook(() => usePrefersReducedMotion());

      // Initial state should be true (SSR default)
      expect(result.current.prefersReducedMotion).toBe(true);

      // Wait for effect to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should remain true after effect (no matchMedia available)
      expect(result.current.prefersReducedMotion).toBe(true);
    });

    it('should default to true when matchMedia is unavailable', async () => {
      // @ts-ignore
      window.matchMedia = undefined;

      const { result } = renderHook(() => usePrefersReducedMotion());

      expect(result.current.prefersReducedMotion).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('client-side detection', () => {
    it('should detect prefers-reduced-motion: reduce', async () => {
      // Mock matchMedia to return reduced motion preference
      const mockMatchMedia = mock((query: string): MediaQueryListMock => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: mock(),
        removeEventListener: mock(),
        addListener: mock(),
        removeListener: mock(),
        dispatchEvent: mock(),
      }));

      window.matchMedia = mockMatchMedia as any;

      const { result } = renderHook(() => usePrefersReducedMotion());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.prefersReducedMotion).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('should detect prefers-reduced-motion: no-preference', async () => {
      // Mock matchMedia to return no preference
      const mockMatchMedia = mock((query: string): MediaQueryListMock => ({
        matches: false,
        media: query,
        addEventListener: mock(),
        removeEventListener: mock(),
        addListener: mock(),
        removeListener: mock(),
        dispatchEvent: mock(),
      }));

      window.matchMedia = mockMatchMedia as any;

      const { result } = renderHook(() => usePrefersReducedMotion());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.prefersReducedMotion).toBe(false);
    });
  });

  describe('dynamic updates', () => {
    it('should register change event listener', async () => {
      const addEventListener = mock();

      const mockMatchMedia = mock((query: string): MediaQueryListMock => ({
        matches: false,
        media: query,
        addEventListener,
        removeEventListener: mock(),
        addListener: mock(),
        removeListener: mock(),
        dispatchEvent: mock(),
      }));

      window.matchMedia = mockMatchMedia as any;

      renderHook(() => usePrefersReducedMotion());

      await waitFor(() => {
        expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      });
    });

    it('should clean up event listener on unmount', async () => {
      const removeEventListener = mock();

      const mockMatchMedia = mock((query: string): MediaQueryListMock => ({
        matches: false,
        media: query,
        addEventListener: mock(),
        removeEventListener,
        addListener: mock(),
        removeListener: mock(),
        dispatchEvent: mock(),
      }));

      window.matchMedia = mockMatchMedia as any;

      const { unmount } = renderHook(() => usePrefersReducedMotion());

      // Wait for initial setup
      await waitFor(() => {
        expect(removeEventListener).not.toHaveBeenCalled();
      });

      unmount();

      expect(removeEventListener).toHaveBeenCalled();
    });
  });

  describe('browser compatibility', () => {
    it('should handle browsers without addEventListener', async () => {
      // Some older browsers only support addListener/removeListener
      const addListener = mock();
      const removeListener = mock();

      const mockMatchMedia = mock((query: string): Partial<MediaQueryListMock> => ({
        matches: false,
        media: query,
        // No addEventListener/removeEventListener
        addListener,
        removeListener,
        dispatchEvent: mock(),
      }));

      window.matchMedia = mockMatchMedia as any;

      const { unmount } = renderHook(() => usePrefersReducedMotion());

      // Wait for setup
      await waitFor(() => {
        expect(addListener).toHaveBeenCalled();
      });

      unmount();

      // Should fall back to removeListener
      expect(removeListener).toHaveBeenCalled();
    });

    it('should handle matchMedia returning null', async () => {
      // Some browsers might return null
      // @ts-ignore
      window.matchMedia = mock(() => null);

      const { result } = renderHook(() => usePrefersReducedMotion());

      // Should default to true for safety
      expect(result.current.prefersReducedMotion).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('return value structure', () => {
    it('should return object with prefersReducedMotion and isLoading', async () => {
      const mockMatchMedia = mock((query: string): MediaQueryListMock => ({
        matches: false,
        media: query,
        addEventListener: mock(),
        removeEventListener: mock(),
        addListener: mock(),
        removeListener: mock(),
        dispatchEvent: mock(),
      }));

      window.matchMedia = mockMatchMedia as any;

      const { result } = renderHook(() => usePrefersReducedMotion());

      expect(result.current).toHaveProperty('prefersReducedMotion');
      expect(result.current).toHaveProperty('isLoading');
      expect(typeof result.current.prefersReducedMotion).toBe('boolean');
      expect(typeof result.current.isLoading).toBe('boolean');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
