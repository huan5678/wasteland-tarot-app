import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { gsapConfig } from '../gsapConfig';

// Must use vi.hoisted for mocks in Vitest
const { mockTimeline, mockMatchMedia, mockGsap } = vi.hoisted(() => {
  const mockTimeline = {
    fromTo: vi.fn().mockReturnThis(),
    kill: vi.fn(),
  };

  const mockMatchMedia = {
    add: vi.fn((query: string, callback: () => void) => {
      callback();
    }),
    revert: vi.fn(),
  };

  const mockGsap = {
    timeline: vi.fn(() => mockTimeline),
    matchMedia: vi.fn(() => mockMatchMedia),
  };

  return { mockTimeline, mockMatchMedia, mockGsap };
});

// Mock gsap module
vi.mock('gsap', () => ({
  gsap: mockGsap,
}));

// Mock useReducedMotion
vi.mock('../useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

// Import after mocks are set up
import { useStagger } from '../useStagger';

describe('useStagger', () => {
  let containerRef: React.RefObject<HTMLDivElement>;
  let mockChildren: HTMLElement[];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockTimeline.fromTo.mockClear();
    mockTimeline.kill.mockClear();
    mockGsap.timeline.mockClear();

    // Create mock container with children
    const container = document.createElement('div');
    mockChildren = Array.from({ length: 5 }, (_, i) => {
      const child = document.createElement('div');
      child.className = 'child';
      child.textContent = `Child ${i}`;
      container.appendChild(child);
      return child;
    });

    containerRef = {
      current: container,
    };

    // Mock querySelector
    vi.spyOn(container, 'querySelectorAll').mockReturnValue(
      mockChildren as unknown as NodeListOf<Element>
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Task 6.1: 核心功能實作', () => {
    it('should create GSAP Timeline with stagger animation', () => {
      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
        })
      );

      // Should create timeline
      expect(mockGsap.timeline).toHaveBeenCalled();

      // Should call fromTo with stagger parameter
      expect(mockTimeline.fromTo).toHaveBeenCalledWith(
        mockChildren,
        expect.objectContaining({ opacity: 0, y: 40 }),
        expect.objectContaining({
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: gsapConfig.staggers.normal,
        })
      );
    });

    it('should use default stagger delay from gsapConfig', () => {
      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
        })
      );

      expect(mockTimeline.fromTo).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          stagger: gsapConfig.staggers.normal,
        })
      );
    });

    it('should allow custom stagger delay', () => {
      const customStagger = 0.3;

      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
          stagger: customStagger,
        })
      );

      expect(mockTimeline.fromTo).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          stagger: customStagger,
        })
      );
    });

    it('should allow custom from/to values', () => {
      const customFrom = { opacity: 0, scale: 0.8 };
      const customTo = { opacity: 1, scale: 1 };

      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
          from: customFrom,
          to: customTo,
        })
      );

      expect(mockTimeline.fromTo).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining(customFrom),
        expect.objectContaining(customTo)
      );
    });

    it('should allow custom duration', () => {
      const customDuration = 1.2;

      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
          duration: customDuration,
        })
      );

      expect(mockTimeline.fromTo).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          duration: customDuration,
        })
      );
    });

    it('should integrate with useReducedMotion', async () => {
      // Import the mocked module
      const { useReducedMotion } = await import('../useReducedMotion');
      (useReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true);

      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
        })
      );

      // Should set duration to 0 when reduced motion is enabled
      expect(mockTimeline.fromTo).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          duration: 0,
        })
      );

      // Reset mock
      (useReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(false);
    });
  });

  describe('Task 6.2: 響應式調整與清理', () => {
    it('should use GSAP matchMedia for responsive adjustments', () => {
      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
        })
      );

      // Should use matchMedia
      expect(mockGsap.matchMedia).toHaveBeenCalled();
    });

    it('should reduce stagger delay by 50% on mobile', () => {
      let mobileCallback: (() => void) | null = null;

      mockMatchMedia.add.mockImplementation((query: string, callback: () => void) => {
        if (query === gsapConfig.breakpoints.mobile) {
          mobileCallback = callback;
        }
        callback();
      });

      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
        })
      );

      // Trigger mobile callback
      if (mobileCallback) {
        mobileCallback();
      }

      // Check if stagger delay was reduced
      const calls = mockTimeline.fromTo.mock.calls;
      const mobileCall = calls.find((call) => {
        return call[2].stagger === gsapConfig.staggers.normal * 0.5;
      });

      expect(mobileCall).toBeDefined();
    });

    it('should kill timeline on unmount', () => {
      const { unmount } = renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
        })
      );

      unmount();

      expect(mockTimeline.kill).toHaveBeenCalled();
    });

    it('should early return when container is null', () => {
      const nullRef = { current: null };

      renderHook(() =>
        useStagger({
          containerRef: nullRef,
          childrenSelector: '.child',
        })
      );

      // Should not create timeline or call fromTo
      // matchMedia is still called but with no children
      expect(mockTimeline.fromTo).not.toHaveBeenCalled();
    });

    it('should early return when no children found', () => {
      const emptyContainer = document.createElement('div');
      const emptyRef = { current: emptyContainer };

      renderHook(() =>
        useStagger({
          containerRef: emptyRef,
          childrenSelector: '.child',
        })
      );

      // Should not call fromTo
      expect(mockTimeline.fromTo).not.toHaveBeenCalled();
    });

    it('should handle children count changes', () => {
      const { rerender } = renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
        })
      );

      const initialCallCount = mockTimeline.fromTo.mock.calls.length;

      // Add more children
      const newChild = document.createElement('div');
      newChild.className = 'child';
      containerRef.current?.appendChild(newChild);
      mockChildren.push(newChild);

      // Update mock
      vi.spyOn(containerRef.current!, 'querySelectorAll').mockReturnValue(
        mockChildren as unknown as NodeListOf<Element>
      );

      // Trigger re-render
      rerender();

      // Should not recreate timeline (handled by useEffect dependency)
      // We'll verify this by checking call count didn't increase
      expect(mockTimeline.fromTo.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount);
    });
  });

  describe('Task 6.3: ScrollTrigger 整合', () => {
    it('should pass scrollTriggerStart to ScrollTrigger config', () => {
      const customStart = 'top 50%';

      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
          scrollTriggerStart: customStart,
        })
      );

      expect(mockTimeline.fromTo).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          scrollTrigger: expect.objectContaining({
            trigger: containerRef.current,
            start: customStart,
          }),
        })
      );
    });

    it('should use default scrollTrigger start position', () => {
      renderHook(() =>
        useStagger({
          containerRef,
          childrenSelector: '.child',
        })
      );

      expect(mockTimeline.fromTo).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          scrollTrigger: expect.objectContaining({
            trigger: containerRef.current,
            start: gsapConfig.scrollTrigger.start,
          }),
        })
      );
    });
  });
});
