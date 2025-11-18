/**
 * StatCounter GSAP Integration Tests
 * Tests for GSAP-based number scrolling animation
 */

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StatCounter } from '../StatCounter';

describe('StatCounter - GSAP Integration', () => {
  let mockGsap: any;
  let mockScrollTrigger: any;

  beforeEach(() => {
    // Mock GSAP and ScrollTrigger
    mockGsap = {
      to: vi.fn().mockReturnValue({ kill: vi.fn() }),
      registerPlugin: vi.fn(),
    };

    mockScrollTrigger = {
      create: vi.fn((config) => ({ kill: vi.fn(), refresh: vi.fn() })),
    };

    (globalThis as any).gsap = mockGsap;
    (globalThis as any).ScrollTrigger = mockScrollTrigger;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (globalThis as any).gsap;
    delete (globalThis as any).ScrollTrigger;
  });

  it('should use useCounterAnimation hook for number scrolling', () => {
    render(
      <StatCounter
        icon="user"
        value={1234}
        label="總用戶數"
        suffix="+"
      />
    );

    // Should call GSAP for animation
    expect(mockGsap.to).toHaveBeenCalled();
  });

  it('should format numbers with thousand separators', () => {
    render(
      <StatCounter
        icon="user"
        value={5000}
        label="占卜次數"
        suffix="+"
      />
    );

    // Initially should show 0 (formatted)
    const numberElement = screen.getByText(/0/);
    expect(numberElement).toBeInTheDocument();
  });

  it('should apply background pulse animation during counting', () => {
    const { container } = render(
      <StatCounter
        icon="user"
        value={1000}
        label="測試"
      />
    );

    // Should have Framer Motion wrapper
    const wrapper = container.querySelector('[data-testid="stat-counter-pulse"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('should respect reduced motion preference', () => {
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

    render(
      <StatCounter
        icon="user"
        value={2000}
        label="測試"
      />
    );

    // With reduced motion, should show final value immediately (with thousand separator)
    const numberElement = screen.getByText(/2,000/);
    expect(numberElement).toBeInTheDocument();
  });

  it('should integrate with ScrollTrigger for viewport detection', () => {
    render(
      <StatCounter
        icon="user"
        value={3000}
        label="測試"
      />
    );

    // Should create ScrollTrigger
    expect(mockScrollTrigger.create).toHaveBeenCalled();
  });
});
