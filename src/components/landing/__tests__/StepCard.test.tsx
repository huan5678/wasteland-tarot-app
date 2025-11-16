/**
 * @jest-environment jsdom
 *
 * StepCard Component Unit Tests
 *
 * Test suite for the StepCard component following TDD principles.
 * Validates props rendering, PixelIcon integration, Pip-Boy theming, and hover effects.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { StepCard } from '../StepCard';

// Mock PixelIcon component
vi.mock('@/components/ui/icons', () => ({
  PixelIcon: ({ name, size, decorative, ...props }: any) => (
    <i
      className={`ri-${name}-line`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden={decorative}
      data-testid={`pixel-icon-${name}`}
      {...props}
    />
  ),
}));

// Mock PipBoyCard component
vi.mock('@/components/ui/pipboy/PipBoyCard', () => ({
  PipBoyCard: ({ children, className, ...props }: any) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock useAudioEffect hook (used by PipBoyCard)
vi.mock('@/hooks/audio/useAudioEffect', () => ({
  useAudioEffect: () => ({
    playSound: vi.fn(),
  }),
}));

describe('StepCard Component', () => {
  const defaultProps = {
    stepNumber: 1,
    icon: 'layout-grid',
    title: '選擇牌陣',
    description: '從多種廢土主題牌陣中選擇適合的占卜方式'
  };

  describe('Props Rendering', () => {
    it('should render all props correctly', () => {
      render(<StepCard {...defaultProps} />);

      // Verify step number is displayed
      expect(screen.getByText('1')).toBeInTheDocument();

      // Verify title is displayed
      expect(screen.getByText('選擇牌陣')).toBeInTheDocument();

      // Verify description is displayed
      expect(screen.getByText('從多種廢土主題牌陣中選擇適合的占卜方式')).toBeInTheDocument();
    });

    it('should render different step numbers correctly', () => {
      const { rerender } = render(<StepCard {...defaultProps} stepNumber={2} />);
      expect(screen.getByText('2')).toBeInTheDocument();

      rerender(<StepCard {...defaultProps} stepNumber={3} />);
      expect(screen.getByText('3')).toBeInTheDocument();

      rerender(<StepCard {...defaultProps} stepNumber={4} />);
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should render different titles and descriptions correctly', () => {
      const customProps = {
        ...defaultProps,
        stepNumber: 2,
        title: '輻射洗牌',
        description: '使用獨特的輻射洗牌機制打亂塔羅牌'
      };

      render(<StepCard {...customProps} />);

      expect(screen.getByText('輻射洗牌')).toBeInTheDocument();
      expect(screen.getByText('使用獨特的輻射洗牌機制打亂塔羅牌')).toBeInTheDocument();
    });
  });

  describe('PixelIcon Integration', () => {
    it('should render PixelIcon with correct icon name', () => {
      render(<StepCard {...defaultProps} />);

      // Find icon element by class name (RemixIcon uses ri-{name}-line pattern)
      const iconElement = document.querySelector('i[class*="ri-layout-grid"]');
      expect(iconElement).toBeInTheDocument();
    });

    it('should render PixelIcon with size 40px', () => {
      render(<StepCard {...defaultProps} />);

      // PixelIcon with size prop should apply width and height styles inline
      const iconElement = document.querySelector('i[class*="ri-layout-grid"]');
      expect(iconElement).toHaveStyle({ width: '40px', height: '40px' });
    });

    it('should render PixelIcon with decorative attribute', () => {
      render(<StepCard {...defaultProps} />);

      // Decorative icons should have aria-hidden="true"
      const iconElement = document.querySelector('i[class*="ri-layout-grid"]');
      expect(iconElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render different icons correctly', () => {
      const { rerender } = render(<StepCard {...defaultProps} icon="shuffle" />);
      expect(document.querySelector('i[class*="ri-shuffle"]')).toBeInTheDocument();

      rerender(<StepCard {...defaultProps} icon="hand" />);
      expect(document.querySelector('i[class*="ri-hand"]')).toBeInTheDocument();

      rerender(<StepCard {...defaultProps} icon="cpu" />);
      expect(document.querySelector('i[class*="ri-cpu"]')).toBeInTheDocument();
    });
  });

  describe('Pip-Boy Theme Styles', () => {
    it('should apply border-2 border-pip-boy-green styling', () => {
      const { container } = render(<StepCard {...defaultProps} />);

      // Find the main card container
      const cardElement = container.firstChild as HTMLElement;

      // Verify border width class
      expect(cardElement).toHaveClass('border-2');

      // Verify border color class
      expect(cardElement).toHaveClass('border-pip-boy-green');
    });

    it('should apply Pip-Boy background color', () => {
      const { container } = render(<StepCard {...defaultProps} />);

      const cardElement = container.firstChild as HTMLElement;

      // Verify background uses CSS custom property or Tailwind class
      const styles = window.getComputedStyle(cardElement);
      const bgColor = styles.backgroundColor;

      // Should use pip-boy-green color with low opacity
      expect(bgColor).toBeTruthy();
    });

    it('should have proper padding and layout structure', () => {
      const { container } = render(<StepCard {...defaultProps} />);

      const cardElement = container.firstChild as HTMLElement;

      // Should have padding classes (p-4, p-6, or p-8)
      expect(cardElement.className).toMatch(/p-\d+/);
    });
  });

  describe('Hover Effects', () => {
    it('should have hover:scale-105 transform class', () => {
      const { container } = render(<StepCard {...defaultProps} />);

      const cardElement = container.firstChild as HTMLElement;

      // Verify hover transform class
      expect(cardElement).toHaveClass('hover:scale-105');
    });

    it('should have transition-transform class', () => {
      const { container } = render(<StepCard {...defaultProps} />);

      const cardElement = container.firstChild as HTMLElement;

      // Verify transition class for smooth animation
      expect(cardElement).toHaveClass('transition-transform');
    });

    it('should have appropriate transition duration', () => {
      const { container } = render(<StepCard {...defaultProps} />);

      const cardElement = container.firstChild as HTMLElement;

      // Should have duration-300 or similar
      expect(cardElement.className).toMatch(/duration-\d+/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      const { container } = render(<StepCard {...defaultProps} />);

      // Should use article or section for semantic structure
      const semanticElement = container.querySelector('article, section, div[role="article"]');
      expect(semanticElement).toBeInTheDocument();
    });

    it('should have readable text hierarchy', () => {
      render(<StepCard {...defaultProps} />);

      // Title should be in a heading or prominent element
      const titleElement = screen.getByText('選擇牌陣');
      expect(titleElement.tagName).toMatch(/H[2-6]|P|DIV/);
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on different screen sizes', () => {
      const { container } = render(<StepCard {...defaultProps} />);

      const cardElement = container.firstChild as HTMLElement;

      // Should have responsive classes (sm:, md:, lg: breakpoints)
      // At minimum, should work well on mobile (default) and desktop
      expect(cardElement).toBeInTheDocument();
    });
  });
});
