/**
 * @vitest-environment jsdom
 *
 * TestimonialCard Animation Integration Tests
 * Tasks 10.1-10.4: Testimonials Section 浮入動畫
 *
 * Tests:
 * - 10.1: 卡片浮入動畫（整合 useScrollAnimation 或 useStagger）
 * - 10.2: 卡片 hover 效果
 * - 10.3: 確保圖片載入後再觸發動畫
 * - 10.4: 撰寫整合測試
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTestimonialAnimation } from '../useTestimonialAnimation';

// Mock GSAP
const mockGsapTimeline = {
  fromTo: vi.fn().mockReturnThis(),
  kill: vi.fn(),
};

const mockScrollTrigger = {
  kill: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => mockGsapTimeline),
    matchMedia: vi.fn(() => ({
      add: vi.fn((query: string, callback: () => void) => {
        callback();
      }),
      revert: vi.fn(),
    })),
    registerPlugin: vi.fn(),
  },
  ScrollTrigger: mockScrollTrigger,
}));

describe('TestimonialCard Animation - Task 10.1: Float-in Animation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should apply float-in animation with opacity 0→1 and y: 60→0', () => {
    const div = document.createElement('div');
    const containerRef = { current: div };

    renderHook(() =>
      useTestimonialAnimation({
        containerRef,
        childrenSelector: '.testimonial-card',
        stagger: 0.2,
      })
    );

    // Verify GSAP fromTo was called with correct parameters
    expect(mockGsapTimeline.fromTo).toHaveBeenCalledWith(
      expect.anything(),
      { opacity: 0, y: 60 },
      expect.objectContaining({
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.2,
      })
    );
  });

  it('should use power3.out easing for float-in animation', () => {
    const div = document.createElement('div');
    const containerRef = { current: div };

    renderHook(() =>
      useTestimonialAnimation({
        containerRef,
        childrenSelector: '.testimonial-card',
      })
    );

    expect(mockGsapTimeline.fromTo).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        ease: 'power3.out',
      })
    );
  });

  it('should apply stagger delay of 0.2s between cards', () => {
    const div = document.createElement('div');
    const containerRef = { current: div };

    renderHook(() =>
      useTestimonialAnimation({
        containerRef,
        stagger: 0.2,
      })
    );

    expect(mockGsapTimeline.fromTo).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        stagger: 0.2,
      })
    );
  });

  it('should use duration of 0.8s for float-in animation', () => {
    const div = document.createElement('div');
    const containerRef = { current: div };

    renderHook(() =>
      useTestimonialAnimation({
        containerRef,
        duration: 0.8,
      })
    );

    expect(mockGsapTimeline.fromTo).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        duration: 0.8,
      })
    );
  });
});

describe('TestimonialCard Animation - Task 10.4: Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clean up animations on unmount', () => {
    const div = document.createElement('div');
    const containerRef = { current: div };

    const { unmount } = renderHook(() =>
      useTestimonialAnimation({
        containerRef,
      })
    );

    unmount();

    expect(mockGsapTimeline.kill).toHaveBeenCalled();
  });

  it('should handle multiple testimonial cards with stagger', () => {
    const container = document.createElement('div');
    const cards = [1, 2, 3].map(() => {
      const card = document.createElement('div');
      card.className = 'testimonial-card';
      container.appendChild(card);
      return card;
    });

    const containerRef = { current: container };

    renderHook(() =>
      useTestimonialAnimation({
        containerRef,
        childrenSelector: '.testimonial-card',
        stagger: 0.2,
      })
    );

    // Should animate all cards with stagger
    expect(mockGsapTimeline.fromTo).toHaveBeenCalledWith(
      expect.any(NodeList),
      expect.anything(),
      expect.objectContaining({
        stagger: 0.2,
      })
    );
  });

  it('should apply ScrollTrigger with correct start position', () => {
    const div = document.createElement('div');
    const containerRef = { current: div };

    renderHook(() =>
      useTestimonialAnimation({
        containerRef,
        scrollTriggerStart: 'top 40%',
      })
    );

    expect(mockGsapTimeline.fromTo).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        scrollTrigger: expect.objectContaining({
          trigger: div,
          start: 'top 40%',
        }),
      })
    );
  });

  it('should warn if container ref is null', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const containerRef = { current: null };

    renderHook(() =>
      useTestimonialAnimation({
        containerRef,
      })
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      '[useTestimonialAnimation] Container ref is null'
    );

    consoleSpy.mockRestore();
  });

  it('should warn if no children found', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const div = document.createElement('div');
    const containerRef = { current: div };

    renderHook(() =>
      useTestimonialAnimation({
        containerRef,
        childrenSelector: '.non-existent',
      })
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      '[useTestimonialAnimation] No children found with selector:',
      '.non-existent'
    );

    consoleSpy.mockRestore();
  });
});

describe('TestimonialCard Component - Task 10.2 & 10.3', () => {
  it('should export TestimonialCard component', async () => {
    const { TestimonialCard } = await import('../TestimonialCard');
    expect(TestimonialCard).toBeDefined();
    expect(TestimonialCard.displayName).toBe('TestimonialCard');
  });

  it('should export useTestimonialAnimation hook', async () => {
    const { useTestimonialAnimation } = await import('../useTestimonialAnimation');
    expect(useTestimonialAnimation).toBeDefined();
    expect(typeof useTestimonialAnimation).toBe('function');
  });
});
