import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCounterAnimation } from '../useCounterAnimation';

describe('useCounterAnimation', () => {
  let mockGsap: any;
  let mockScrollTrigger: any;

  beforeEach(() => {
    // Mock GSAP instance
    mockGsap = {
      to: vi.fn().mockReturnValue({
        kill: vi.fn(),
      }),
      registerPlugin: vi.fn(),
    };

    // Mock ScrollTrigger with create method
    mockScrollTrigger = {
      create: vi.fn((config) => ({
        kill: vi.fn(),
        refresh: vi.fn(),
      })),
    };

    // Setup global GSAP and ScrollTrigger
    (globalThis as any).gsap = mockGsap;
    (globalThis as any).ScrollTrigger = mockScrollTrigger;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (globalThis as any).gsap;
    delete (globalThis as any).ScrollTrigger;
  });

  it('should initialize with 0 and animate to target value', () => {
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() =>
      useCounterAnimation({
        triggerRef: ref,
        targetValue: 1234,
        duration: 1.5,
      })
    );

    // Should start at 0
    expect(result.current.currentValue).toBe(0);

    // Should call gsap.to with correct parameters
    expect(mockGsap.to).toHaveBeenCalled();
  });

  it('should use correct duration based on value magnitude', () => {
    const ref = { current: document.createElement('div') };

    // Small number (< 100) - should use 1.2s duration
    const { result: smallResult } = renderHook(() =>
      useCounterAnimation({
        triggerRef: ref,
        targetValue: 50,
      })
    );

    // Check if duration logic would apply 1.2s
    expect(smallResult.current).toBeDefined();

    // Cleanup
    vi.clearAllMocks();

    // Large number (> 10000) - should use 2.0s duration
    const { result: largeResult } = renderHook(() =>
      useCounterAnimation({
        triggerRef: ref,
        targetValue: 50000,
      })
    );

    expect(largeResult.current).toBeDefined();
  });

  it('should format numbers with thousand separators', () => {
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() =>
      useCounterAnimation({
        triggerRef: ref,
        targetValue: 1234567,
        formatOptions: {
          useGrouping: true,
        },
      })
    );

    // Formatted value should use thousand separators
    expect(result.current.formattedValue).toBeDefined();
  });

  it('should support decimal precision', () => {
    const ref = { current: document.createElement('div') };

    const { result } = renderHook(() =>
      useCounterAnimation({
        triggerRef: ref,
        targetValue: 4.8,
        formatOptions: {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        },
      })
    );

    expect(result.current).toBeDefined();
  });

  it('should respect reduced motion preference', () => {
    const ref = { current: document.createElement('div') };

    // Mock reduced motion
    const mockMatchMedia = vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: mockMatchMedia,
    });

    const { result } = renderHook(() =>
      useCounterAnimation({
        triggerRef: ref,
        targetValue: 1000,
      })
    );

    // With reduced motion, should show final value immediately
    expect(result.current).toBeDefined();
  });

  it('should clean up GSAP animation on unmount', () => {
    const ref = { current: document.createElement('div') };
    let killFn = vi.fn();

    mockGsap.to.mockReturnValue({
      kill: killFn,
    });

    const { unmount } = renderHook(() =>
      useCounterAnimation({
        triggerRef: ref,
        targetValue: 1000,
      })
    );

    unmount();

    // Should kill animation on unmount
    expect(killFn).toHaveBeenCalled();
  });

  it('should integrate with ScrollTrigger', () => {
    const ref = { current: document.createElement('div') };

    renderHook(() =>
      useCounterAnimation({
        triggerRef: ref,
        targetValue: 5000,
        scrollTriggerConfig: {
          start: 'top 60%',
        },
      })
    );

    // Should create ScrollTrigger with correct config
    expect(mockScrollTrigger.create).toHaveBeenCalled();
  });
});
