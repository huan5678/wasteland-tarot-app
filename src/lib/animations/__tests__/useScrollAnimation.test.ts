/**
 * useScrollAnimation Hook Tests
 * TDD Approach: Tests written before implementation
 * 測試 useScrollAnimation 核心功能、cleanup、錯誤處理
 */
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useScrollAnimation } from '../useScrollAnimation';
import type { UseScrollAnimationOptions } from '../useScrollAnimation';

// Mock dependencies
vi.mock('../useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock('../animationUtils', () => ({
  isGSAPAvailable: vi.fn(() => true),
}));

// Import mocked modules
import { useReducedMotion } from '../useReducedMotion';
import { isGSAPAvailable } from '../animationUtils';

// Mock GSAP
const mockTimeline = {
  kill: vi.fn(),
  to: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  fromTo: vi.fn().mockReturnThis(),
};

const mockScrollTrigger = {
  kill: vi.fn(),
  refresh: vi.fn(),
};

const mockGSAP = {
  timeline: vi.fn(() => mockTimeline),
  registerPlugin: vi.fn(),
  context: vi.fn(() => ({
    add: vi.fn(),
    revert: vi.fn(),
  })),
};

const mockScrollTriggerPlugin = vi.fn(() => mockScrollTrigger);
mockScrollTriggerPlugin.refresh = vi.fn();

// Setup global mocks
Object.defineProperty(globalThis, 'gsap', {
  writable: true,
  configurable: true,
  value: mockGSAP,
});

Object.defineProperty(globalThis, 'ScrollTrigger', {
  writable: true,
  configurable: true,
  value: mockScrollTriggerPlugin,
});

describe('useScrollAnimation', () => {
  let mockElement: HTMLDivElement;
  let mockTriggerRef: { current: HTMLDivElement };

  beforeEach(() => {
    vi.clearAllMocks();
    (useReducedMotion as any).mockReturnValue(false);
    (isGSAPAvailable as any).mockReturnValue(true);

    // Create mock element in beforeEach
    mockElement = document.createElement('div');
    mockTriggerRef = { current: mockElement };
  });

  describe('Core Functionality (4.1)', () => {
    it('should initialize GSAP Timeline when triggerRef is available', () => {
      const options: UseScrollAnimationOptions = {
        triggerRef: mockTriggerRef,
        animations: [
          {
            target: '.test-element',
            to: { opacity: 1, duration: 0.6 },
          },
        ],
      };

      const { result } = renderHook(() => useScrollAnimation(options));

      expect(mockGSAP.timeline).toHaveBeenCalled();
      expect(result.current.isReady).toBe(true);
    });

    it('should create ScrollTrigger with correct configuration', () => {
      const options: UseScrollAnimationOptions = {
        triggerRef: mockTriggerRef,
        scrollTriggerConfig: {
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none none',
        },
        animations: [
          {
            target: '.test-element',
            to: { opacity: 1 },
          },
        ],
      };

      renderHook(() => useScrollAnimation(options));

      expect(mockScrollTriggerPlugin).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: mockElement,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none none',
        })
      );
    });

    it('should apply animations to timeline in correct order', () => {
      const options: UseScrollAnimationOptions = {
        triggerRef: mockTriggerRef,
        animations: [
          {
            target: '.element-1',
            from: { opacity: 0 },
            to: { opacity: 1, duration: 0.8 },
          },
          {
            target: '.element-2',
            to: { y: 0, duration: 0.6 },
            position: '+=0.3',
          },
        ],
      };

      renderHook(() => useScrollAnimation(options));

      expect(mockTimeline.fromTo).toHaveBeenCalledWith(
        '.element-1',
        { opacity: 0 },
        expect.objectContaining({ opacity: 1, duration: 0.8 })
      );

      expect(mockTimeline.to).toHaveBeenCalledWith(
        '.element-2',
        expect.objectContaining({ y: 0, duration: 0.6 }),
        '+=0.3'
      );
    });

    it('should integrate with useReducedMotion and set duration to 0', () => {
      (useReducedMotion as any).mockReturnValue(true);

      const options: UseScrollAnimationOptions = {
        triggerRef: mockTriggerRef,
        animations: [
          {
            target: '.test',
            to: { opacity: 1, duration: 0.8 },
          },
        ],
      };

      renderHook(() => useScrollAnimation(options));

      // Should override duration to 0 when reduced motion is enabled
      expect(mockTimeline.to).toHaveBeenCalledWith(
        '.test',
        expect.objectContaining({ duration: 0 })
      );
    });

    it('should return ScrollTrigger and Timeline instances', () => {
      const options: UseScrollAnimationOptions = {
        triggerRef: mockTriggerRef,
        animations: [
          {
            target: '.test',
            to: { opacity: 1 },
          },
        ],
      };

      const { result } = renderHook(() => useScrollAnimation(options));

      expect(result.current.scrollTrigger).toBeTruthy();
      expect(result.current.timeline).toBe(mockTimeline);
      expect(result.current.isReady).toBe(true);
    });
  });

  describe('Cleanup & Error Handling (4.2)', () => {
    it('should kill Timeline and ScrollTrigger on unmount', () => {
      const options: UseScrollAnimationOptions = {
        triggerRef: mockTriggerRef,
        animations: [
          {
            target: '.test',
            to: { opacity: 1 },
          },
        ],
      };

      const { unmount } = renderHook(() => useScrollAnimation(options));

      unmount();

      expect(mockTimeline.kill).toHaveBeenCalled();
      expect(mockScrollTrigger.kill).toHaveBeenCalled();
    });

    it('should handle null triggerRef gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const nullRef = { current: null };

      const options: UseScrollAnimationOptions = {
        triggerRef: nullRef as any,
        animations: [
          {
            target: '.test',
            to: { opacity: 1 },
          },
        ],
      };

      const { result } = renderHook(() => useScrollAnimation(options));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('triggerRef.current is null')
      );
      expect(result.current.isReady).toBe(false);
      expect(mockGSAP.timeline).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle GSAP unavailable gracefully', () => {
      (isGSAPAvailable as any).mockReturnValueOnce(false);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const options: UseScrollAnimationOptions = {
        triggerRef: mockTriggerRef,
        animations: [
          {
            target: '.test',
            to: { opacity: 1 },
          },
        ],
      };

      const { result } = renderHook(() => useScrollAnimation(options));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GSAP is not available')
      );
      expect(result.current.isReady).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should provide refresh method', () => {
      const options: UseScrollAnimationOptions = {
        triggerRef: mockTriggerRef,
        animations: [
          {
            target: '.test',
            to: { opacity: 1 },
          },
        ],
      };

      const { result } = renderHook(() => useScrollAnimation(options));

      result.current.refresh();

      expect(mockScrollTrigger.refresh).toHaveBeenCalled();
    });

    it('should not create animation when enabled is false', () => {
      const options: UseScrollAnimationOptions = {
        triggerRef: mockTriggerRef,
        animations: [
          {
            target: '.test',
            to: { opacity: 1 },
          },
        ],
        enabled: false,
      };

      const { result } = renderHook(() => useScrollAnimation(options));

      expect(mockGSAP.timeline).not.toHaveBeenCalled();
      expect(result.current.isReady).toBe(false);
    });
  });
});
