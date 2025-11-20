/**
 * useParallax Hook Tests
 * 測試視差效果 hook 的核心功能與響應式調整
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useParallax } from '../useParallax';
import type { UseParallaxOptions } from '../useParallax';
import * as animationUtils from '../animationUtils';

// Mock GSAP and ScrollTrigger
const mockScrollTrigger = {
  kill: vi.fn(),
  refresh: vi.fn(),
  create: vi.fn(function(config: any) {
    // Store the config for verification
    return {
      kill: mockScrollTrigger.kill,
      refresh: mockScrollTrigger.refresh,
    };
  }),
};

const mockMatchMediaContext = {
  add: vi.fn((query: string, callback: () => void) => {
    // Vitest expects callback as second parameter
    if (typeof callback === 'function') {
      callback();
    }
    return { revert: vi.fn() };
  }),
  revert: vi.fn(),
};

const mockGSAP = {
  to: vi.fn(),
  registerPlugin: vi.fn(),
  matchMedia: vi.fn(() => mockMatchMediaContext),
};

// Mock gsap module
vi.mock('gsap', () => ({
  gsap: mockGSAP,
}));

// Mock gsap/ScrollTrigger module
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: mockScrollTrigger,
}));

// Mock animationUtils - must return inline functions due to hoisting
vi.mock('../animationUtils', () => ({
  getViewportCategory: vi.fn(() => 'desktop'),
  isGSAPAvailable: vi.fn(() => true),
}));

describe('useParallax', () => {
  let mockBackgroundElement: HTMLDivElement;
  let mockForegroundElement: HTMLDivElement;
  let mockBackgroundRef: React.RefObject<HTMLDivElement>;
  let mockForegroundRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    // Create DOM elements
    mockBackgroundElement = document.createElement('div');
    mockForegroundElement = document.createElement('div');
    mockBackgroundRef = { current: mockBackgroundElement };
    mockForegroundRef = { current: mockForegroundElement };

    vi.clearAllMocks();
    // Default to desktop viewport
    (animationUtils.getViewportCategory as Mock).mockReturnValue('desktop');
    (animationUtils.isGSAPAvailable as Mock).mockReturnValue(true);
  });

  describe('Core Functionality (5.1)', () => {
    it('should apply parallax effect with correct speed', async () => {
      const options: UseParallaxOptions = {
        backgroundRef: mockBackgroundRef,
        backgroundSpeed: 0.5,
      };

      renderHook(() => useParallax(options));

      // Wait for async import and setup
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGSAP.to).toHaveBeenCalledWith(
        mockBackgroundElement,
        expect.objectContaining({
          yPercent: expect.any(Number),
          ease: 'none',
        })
      );

      expect(mockScrollTrigger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: mockBackgroundElement,
          scrub: true,
        })
      );
    });

    it('should use default background speed of 0.5 from gsapConfig', async () => {
      const options: UseParallaxOptions = {
        backgroundRef: mockBackgroundRef,
      };

      renderHook(() => useParallax(options));

      // Wait for async import and setup
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGSAP.to).toHaveBeenCalled();
    });

    it('should apply parallax to both background and foreground layers', async () => {
      const options: UseParallaxOptions = {
        backgroundRef: mockBackgroundRef,
        foregroundRef: mockForegroundRef,
        backgroundSpeed: 0.5,
        foregroundSpeed: 1.0,
      };

      renderHook(() => useParallax(options));

      // Wait for async import and setup
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGSAP.to).toHaveBeenCalledWith(
        mockBackgroundElement,
        expect.any(Object)
      );

      expect(mockGSAP.to).toHaveBeenCalledWith(
        mockForegroundElement,
        expect.any(Object)
      );
    });
  });

  describe('Responsive Adjustments & Cleanup (5.2)', () => {
    it('should disable parallax on mobile devices when disableOnMobile is true', async () => {
      (animationUtils.getViewportCategory as Mock).mockReturnValue('mobile');

      const options: UseParallaxOptions = {
        backgroundRef: mockBackgroundRef,
        disableOnMobile: true,
      };

      renderHook(() => useParallax(options));

      // Wait for async check
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not create parallax animation on mobile
      expect(mockGSAP.to).not.toHaveBeenCalled();
    });

    it('should allow parallax on mobile when disableOnMobile is false', async () => {
      (animationUtils.getViewportCategory as Mock).mockReturnValue('mobile');

      const options: UseParallaxOptions = {
        backgroundRef: mockBackgroundRef,
        disableOnMobile: false,
      };

      renderHook(() => useParallax(options));

      // Wait for async import and setup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should create parallax even on mobile
      expect(mockGSAP.to).toHaveBeenCalled();
    });

    it('should use GSAP matchMedia for responsive breakpoints', async () => {
      const options: UseParallaxOptions = {
        backgroundRef: mockBackgroundRef,
      };

      renderHook(() => useParallax(options));

      // Wait for async import and setup
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGSAP.matchMedia).toHaveBeenCalled();
    });

    it('should kill ScrollTrigger on unmount', async () => {
      const options: UseParallaxOptions = {
        backgroundRef: mockBackgroundRef,
      };

      const { unmount } = renderHook(() => useParallax(options));

      // Wait for async import and setup
      await new Promise(resolve => setTimeout(resolve, 100));

      unmount();

      expect(mockScrollTrigger.kill).toHaveBeenCalled();
    });

    it('should handle null backgroundRef gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
      const nullRef = { current: null };

      const options: UseParallaxOptions = {
        backgroundRef: nullRef as any,
      };

      renderHook(() => useParallax(options));

      // Wait for check
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('backgroundRef.current is null')
      );
      expect(mockGSAP.to).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should work on tablet viewport', async () => {
      (animationUtils.getViewportCategory as Mock).mockReturnValue('tablet');

      const options: UseParallaxOptions = {
        backgroundRef: mockBackgroundRef,
        disableOnMobile: true, // Only disable on mobile, not tablet
      };

      renderHook(() => useParallax(options));

      // Wait for async import and setup
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGSAP.to).toHaveBeenCalled();
    });

    it('should handle custom speed values', async () => {
      const options: UseParallaxOptions = {
        backgroundRef: mockBackgroundRef,
        backgroundSpeed: 0.3,
        foregroundRef: mockForegroundRef,
        foregroundSpeed: 0.8,
      };

      renderHook(() => useParallax(options));

      // Wait for async import and setup
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockGSAP.to).toHaveBeenCalledTimes(2);
    });
  });
});
