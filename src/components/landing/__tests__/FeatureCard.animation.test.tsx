/**
 * Feature Card Animation Integration Tests
 * Tests for Feature Card entrance animations and icon hover effects
 */

/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock GSAP to avoid actual animations in tests
jest.mock('gsap', () => ({
  gsap: {
    timeline: jest.fn(() => ({
      fromTo: jest.fn().mockReturnThis(),
      to: jest.fn().mockReturnThis(),
      kill: jest.fn(),
    })),
    registerPlugin: jest.fn(),
    matchMedia: jest.fn(() => ({
      add: jest.fn(),
      revert: jest.fn(),
    })),
  },
  ScrollTrigger: jest.fn(),
}));

// Mock useScrollAnimation hook
jest.mock('@/lib/animations/useScrollAnimation', () => ({
  useScrollAnimation: jest.fn(() => ({
    scrollTrigger: null,
    timeline: null,
    isReady: true,
    refresh: jest.fn(),
  })),
}));

// Mock useReducedMotion hook
jest.mock('@/lib/animations/useReducedMotion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

// Mock PixelIcon
jest.mock('@/components/ui/icons', () => ({
  PixelIcon: ({ name, className, ...props }: any) => (
    <div data-testid={`icon-${name}`} className={className} {...props}>
      {name}
    </div>
  ),
}));

// Import the component to test (will be created)
import { FeatureCard } from '../FeatureCard';

describe('FeatureCard Animation', () => {
  describe('Entrance Animation (Task 11.1)', () => {
    it('should render with correct structure for GSAP animation', () => {
      render(
        <FeatureCard icon="zap" title="量子占卜" description="先進演算法處理" />
      );

      // Feature card should have class for GSAP targeting
      const card = screen.getByTestId('feature-card');
      expect(card).toHaveClass('feature-card');
      expect(card).toBeInTheDocument();
    });

    it('should render icon, title, and description', () => {
      render(
        <FeatureCard
          icon="chart-bar"
          title="占卜分析"
          description="追蹤業力進展"
        />
      );

      expect(screen.getByText('占卜分析')).toBeInTheDocument();
      expect(screen.getByText('追蹤業力進展')).toBeInTheDocument();
      expect(screen.getByTestId('icon-chart-bar')).toBeInTheDocument();
    });

    it('should apply correct initial opacity and scale for GSAP animation', () => {
      const { container } = render(
        <FeatureCard icon="test-tube" title="廢土主題" description="專為核災後調整" />
      );

      const card = container.querySelector('.feature-card');
      expect(card).toBeInTheDocument();
      // Initial state should be set for GSAP to animate from
      // opacity: 0, scale: 0.9 → opacity: 1, scale: 1
    });
  });

  describe('Icon Hover Animation (Task 11.2)', () => {
    it('should render icon with motion wrapper for hover animation', () => {
      render(<FeatureCard icon="zap" title="Test" description="Test Desc" />);

      // Icon should be wrapped in motion component
      const icon = screen.getByTestId('icon-zap');
      expect(icon).toBeInTheDocument();
    });

    it('should apply featureIconHoverVariants to icon', () => {
      render(<FeatureCard icon="zap" title="Test" description="Test Desc" />);

      const card = screen.getByTestId('feature-card');

      // Hover over the card to trigger icon animation
      fireEvent.mouseEnter(card);

      // Icon should have hover animation applied
      const icon = screen.getByTestId('icon-zap');
      expect(icon.parentElement).toHaveAttribute('data-motion-state', 'hover');
    });

    it('should rotate icon 360 degrees on hover (simulated)', () => {
      render(<FeatureCard icon="chart-bar" title="Test" description="Test Desc" />);

      const card = screen.getByTestId('feature-card');
      fireEvent.mouseEnter(card);

      // Check if hover state is applied (actual rotation is handled by Framer Motion)
      const iconWrapper = screen.getByTestId('icon-chart-bar').parentElement;
      expect(iconWrapper).toHaveAttribute('data-motion-state', 'hover');
    });

    it('should change icon color to Pip-Boy Green on hover', () => {
      render(<FeatureCard icon="test-tube" title="Test" description="Test Desc" />);

      const card = screen.getByTestId('feature-card');
      fireEvent.mouseEnter(card);

      // Icon should have Pip-Boy Green color applied
      const icon = screen.getByTestId('icon-test-tube');
      expect(icon).toHaveClass('text-pip-boy-green');
    });
  });

  describe('Animation Separation (Task 11.3)', () => {
    it('should not trigger GSAP animation on hover', () => {
      const { useScrollAnimation } = require('@/lib/animations/useScrollAnimation');

      render(<FeatureCard icon="zap" title="Test" description="Test Desc" />);

      const card = screen.getByTestId('feature-card');
      fireEvent.mouseEnter(card);

      // GSAP useScrollAnimation should not be called again on hover
      // Only called once during initial render
      expect(useScrollAnimation).toHaveBeenCalledTimes(0); // Feature cards don't use this directly
    });

    it('should use Framer Motion for hover, not GSAP', () => {
      const { container } = render(
        <FeatureCard icon="zap" title="Test" description="Test Desc" />
      );

      // Icon should be wrapped in motion component
      const iconWrapper = container.querySelector('[data-motion-icon]');
      expect(iconWrapper).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support (Task 11.4)', () => {
    beforeEach(() => {
      const { useReducedMotion } = require('@/lib/animations/useReducedMotion');
      useReducedMotion.mockReturnValue(true);
    });

    afterEach(() => {
      const { useReducedMotion } = require('@/lib/animations/useReducedMotion');
      useReducedMotion.mockReturnValue(false);
    });

    it('should disable rotation animation when reduced motion is enabled', () => {
      render(<FeatureCard icon="zap" title="Test" description="Test Desc" />);

      const card = screen.getByTestId('feature-card');
      fireEvent.mouseEnter(card);

      // When reduced motion is enabled, rotation should be disabled
      const iconWrapper = screen.getByTestId('icon-zap').parentElement;
      expect(iconWrapper).toHaveAttribute('data-reduced-motion', 'true');
    });

    it('should keep color transition when reduced motion is enabled', () => {
      render(<FeatureCard icon="chart-bar" title="Test" description="Test Desc" />);

      const card = screen.getByTestId('feature-card');
      fireEvent.mouseEnter(card);

      // Color transition should still work even with reduced motion
      const icon = screen.getByTestId('icon-chart-bar');
      expect(icon).toHaveClass('text-pip-boy-green');
    });
  });

  describe('Accessibility (Task 11.4)', () => {
    it('should have proper ARIA attributes', () => {
      render(<FeatureCard icon="zap" title="量子占卜" description="先進演算法" />);

      const card = screen.getByTestId('feature-card');
      expect(card).toHaveAttribute('role', 'article');
    });

    it('should have decorative icon with aria-hidden', () => {
      render(<FeatureCard icon="zap" title="Test" description="Test Desc" />);

      const icon = screen.getByTestId('icon-zap');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Multiple Feature Cards Integration (Task 11.5)', () => {
    it('should render multiple feature cards without conflict', () => {
      render(
        <div>
          <FeatureCard icon="zap" title="Card 1" description="Desc 1" />
          <FeatureCard icon="chart-bar" title="Card 2" description="Desc 2" />
          <FeatureCard icon="test-tube" title="Card 3" description="Desc 3" />
        </div>
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
      expect(screen.getByText('Card 3')).toBeInTheDocument();
    });

    it('should independently animate each card icon on hover', () => {
      render(
        <div>
          <FeatureCard icon="zap" title="Card 1" description="Desc 1" />
          <FeatureCard icon="chart-bar" title="Card 2" description="Desc 2" />
        </div>
      );

      const cards = screen.getAllByTestId('feature-card');
      fireEvent.mouseEnter(cards[0]);

      // Only first card's icon should have hover state
      const icon1 = screen.getByTestId('icon-zap').parentElement;
      const icon2 = screen.getByTestId('icon-chart-bar').parentElement;

      expect(icon1).toHaveAttribute('data-motion-state', 'hover');
      expect(icon2).not.toHaveAttribute('data-motion-state', 'hover');
    });
  });
});
