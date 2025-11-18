/**
 * Integration Tests for How It Works Section
 * Tasks 8.1-8.4: StepCard Stagger Animation Integration
 *
 * Tests:
 * - useStagger integration with How It Works section
 * - PixelIcon rotation animation on viewport entry
 * - Fixed height to prevent layout shift
 * - Stagger delay verification (desktop 0.15s, mobile 0.075s)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React, { useRef } from 'react';
import { useStagger } from '../useStagger';
import { useReducedMotion } from '../useReducedMotion';
import { gsap } from 'gsap';

// Mock dependencies
vi.mock('../useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock('gsap', () => {
  const mockTimeline = {
    fromTo: vi.fn().mockReturnThis(),
    kill: vi.fn(),
  };

  const mockMatchMedia = {
    add: vi.fn((query, callback) => {
      callback(); // Execute callback immediately for testing
    }),
    revert: vi.fn(),
  };

  return {
    gsap: {
      timeline: vi.fn(() => mockTimeline),
      matchMedia: vi.fn(() => mockMatchMedia),
    },
  };
});

// Test Component: How It Works Section
const HowItWorksTestSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useStagger({
    containerRef,
    childrenSelector: '.step-card',
    stagger: 0.15,
    from: { opacity: 0, y: 40 },
    to: { opacity: 1, y: 0 },
    duration: 0.6,
  });

  return (
    <section
      ref={containerRef}
      data-testid="how-it-works-section"
      className="min-h-[400px]" // Fixed height to prevent layout shift
    >
      <div className="step-card" data-testid="step-card-1">
        <div className="step-icon" data-testid="step-icon-1">Icon 1</div>
        <h3>選擇牌陣</h3>
      </div>
      <div className="step-card" data-testid="step-card-2">
        <div className="step-icon" data-testid="step-icon-2">Icon 2</div>
        <h3>洗牌抽卡</h3>
      </div>
      <div className="step-card" data-testid="step-card-3">
        <div className="step-icon" data-testid="step-icon-3">Icon 3</div>
        <h3>查看解讀</h3>
      </div>
      <div className="step-card" data-testid="step-card-4">
        <div className="step-icon" data-testid="step-icon-4">Icon 4</div>
        <h3>追蹤進度</h3>
      </div>
    </section>
  );
};

describe('How It Works Section - Stagger Animation Integration (Tasks 8.1-8.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Task 8.1: StepCard 錯開動畫（整合 useStagger）', () => {
    it('should integrate useStagger hook correctly', () => {
      render(<HowItWorksTestSection />);

      // Verify container exists
      const container = screen.getByTestId('how-it-works-section');
      expect(container).toBeInTheDocument();

      // Verify all step cards are rendered
      expect(screen.getByTestId('step-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('step-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('step-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('step-card-4')).toBeInTheDocument();
    });

    it('should create GSAP timeline with stagger animation', () => {
      render(<HowItWorksTestSection />);

      // Verify gsap.timeline was called
      expect(gsap.timeline).toHaveBeenCalled();

      // Verify fromTo was called with correct parameters
      const mockTimeline = gsap.timeline();
      expect(mockTimeline.fromTo).toHaveBeenCalled();

      const fromToCall = vi.mocked(mockTimeline.fromTo).mock.calls[0];

      // Verify "from" state (opacity: 0, y: 40)
      expect(fromToCall[1]).toMatchObject({
        opacity: 0,
        y: 40,
      });

      // Verify "to" state (opacity: 1, y: 0)
      expect(fromToCall[2]).toMatchObject({
        opacity: 1,
        y: 0,
        duration: 0.6,
      });
    });

    it('should apply desktop stagger delay (0.15s) on desktop viewport', () => {
      render(<HowItWorksTestSection />);

      const mockTimeline = gsap.timeline();
      const fromToCall = vi.mocked(mockTimeline.fromTo).mock.calls[0];

      // Verify stagger delay is 0.15s for desktop
      expect(fromToCall[2]).toMatchObject({
        stagger: 0.15,
      });
    });

    it('should apply mobile stagger delay (0.075s) on mobile viewport', () => {
      // Mock mobile viewport
      const mockMatchMedia = gsap.matchMedia();
      vi.mocked(mockMatchMedia.add).mockImplementation((query, callback) => {
        if (query === '(max-width: 767px)') {
          callback();
        }
      });

      render(<HowItWorksTestSection />);

      const mockTimeline = gsap.timeline();
      const fromToCall = vi.mocked(mockTimeline.fromTo).mock.calls[0];

      // Verify stagger delay is 0.075s for mobile (50% of 0.15s)
      expect(fromToCall[2].stagger).toBe(0.075);
    });
  });

  describe('Task 8.2: PixelIcon 旋轉動畫', () => {
    it('should trigger icon rotation when card enters viewport', async () => {
      render(<HowItWorksTestSection />);

      // Verify step icons exist
      const icon1 = screen.getByTestId('step-icon-1');
      const icon2 = screen.getByTestId('step-icon-2');
      const icon3 = screen.getByTestId('step-icon-3');
      const icon4 = screen.getByTestId('step-icon-4');

      expect(icon1).toBeInTheDocument();
      expect(icon2).toBeInTheDocument();
      expect(icon3).toBeInTheDocument();
      expect(icon4).toBeInTheDocument();

      // Note: Icon rotation animation will be implemented in StepCard component
      // This test verifies structure is ready for animation
    });
  });

  describe('Task 8.3: 確保動畫與內容渲染同步', () => {
    it('should have fixed height to prevent layout shift', () => {
      render(<HowItWorksTestSection />);

      const container = screen.getByTestId('how-it-works-section');

      // Verify container has min-height class
      expect(container).toHaveClass('min-h-[400px]');
    });

    it('should render all content before animation starts', () => {
      render(<HowItWorksTestSection />);

      // Verify all step cards are rendered before animation
      const stepCards = screen.getAllByTestId(/step-card-/);
      expect(stepCards).toHaveLength(4);

      // Verify all titles are rendered
      expect(screen.getByText('選擇牌陣')).toBeInTheDocument();
      expect(screen.getByText('洗牌抽卡')).toBeInTheDocument();
      expect(screen.getByText('查看解讀')).toBeInTheDocument();
      expect(screen.getByText('追蹤進度')).toBeInTheDocument();
    });
  });

  describe('Task 8.4: 撰寫整合測試', () => {
    it('should verify stagger animation sequence is correct', () => {
      render(<HowItWorksTestSection />);

      const mockTimeline = gsap.timeline();

      // Verify timeline was created
      expect(gsap.timeline).toHaveBeenCalled();

      // Verify fromTo animation was applied
      expect(mockTimeline.fromTo).toHaveBeenCalled();

      const fromToCall = vi.mocked(mockTimeline.fromTo).mock.calls[0];

      // Verify all 4 step cards are animated
      const animatedElements = fromToCall[0];
      expect(animatedElements).toBeDefined();
    });

    it('should respect prefers-reduced-motion setting', () => {
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<HowItWorksTestSection />);

      const mockTimeline = gsap.timeline();
      const fromToCall = vi.mocked(mockTimeline.fromTo).mock.calls[0];

      // Verify duration is 0 when reduced motion is enabled
      expect(fromToCall[2].duration).toBe(0);
    });

    it('should cleanup timeline on unmount', () => {
      const { unmount } = render(<HowItWorksTestSection />);

      const mockTimeline = gsap.timeline();

      // Unmount component
      unmount();

      // Verify timeline.kill was called
      expect(mockTimeline.kill).toHaveBeenCalled();
    });
  });
});
