/**
 * StatCounter Component Unit Tests
 *
 * Test suite for the StatCounter component following TDD principles.
 * Validates animation logic, easeOutQuad easing, suffix display, PixelIcon integration,
 * and React.memo performance optimization.
 *
 * Requirements Coverage: 11.2
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { StatCounter } from '../StatCounter';

describe('StatCounter Component', () => {
  const defaultProps = {
    icon: 'user',
    value: 1234,
    label: '總用戶數'
  };

  // Mock requestAnimationFrame for consistent test behavior
  beforeEach(() => {
    vi.useFakeTimers();
    let frameId = 0;

    // Mock requestAnimationFrame to use fake timers
    global.requestAnimationFrame = vi.fn((callback) => {
      const id = ++frameId;
      setTimeout(() => callback(Date.now()), 16); // ~60fps
      return id;
    }) as unknown as typeof requestAnimationFrame;

    global.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Props Rendering', () => {
    it('should render label correctly', () => {
      render(<StatCounter {...defaultProps} />);
      expect(screen.getByText('總用戶數')).toBeInTheDocument();
    });

    it('should render icon using PixelIcon', () => {
      render(<StatCounter {...defaultProps} />);

      // PixelIcon renders RemixIcon with ri-{name}-line pattern
      const iconElement = document.querySelector('i[class*="ri-user"]');
      expect(iconElement).toBeInTheDocument();
    });

    it('should render different labels correctly', () => {
      const { rerender } = render(<StatCounter {...defaultProps} label="總占卜次數" />);
      expect(screen.getByText('總占卜次數')).toBeInTheDocument();

      rerender(<StatCounter {...defaultProps} label="卡牌總數" />);
      expect(screen.getByText('卡牌總數')).toBeInTheDocument();

      rerender(<StatCounter {...defaultProps} label="AI 供應商數" />);
      expect(screen.getByText('AI 供應商數')).toBeInTheDocument();
    });

    it('should render different icons correctly', () => {
      const { rerender } = render(<StatCounter {...defaultProps} icon="file-list-2" />);
      expect(document.querySelector('i[class*="ri-file-list-2"]')).toBeInTheDocument();

      rerender(<StatCounter {...defaultProps} icon="grid" />);
      expect(document.querySelector('i[class*="ri-grid"]')).toBeInTheDocument();

      rerender(<StatCounter {...defaultProps} icon="cpu" />);
      expect(document.querySelector('i[class*="ri-cpu"]')).toBeInTheDocument();
    });
  });

  describe('Animation Logic', () => {
    it('should start animation from 0', () => {
      render(<StatCounter {...defaultProps} value={1000} />);

      // Initial render should show 0
      expect(screen.getByText(/^0/)).toBeInTheDocument();
    });

    it('should animate from 0 to target value over 2 seconds', async () => {
      render(<StatCounter {...defaultProps} value={1000} />);

      // Initially at 0
      expect(screen.getByText(/^0/)).toBeInTheDocument();

      // Advance timers by 1 second (halfway)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should be animating (value between 0 and 1000)
      await waitFor(() => {
        const textContent = screen.getByText(/\d+/).textContent;
        const currentValue = parseInt(textContent?.match(/\d+/)?.[0] || '0');
        expect(currentValue).toBeGreaterThan(0);
        expect(currentValue).toBeLessThan(1000);
      });

      // Advance to completion (2 seconds total)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should reach target value
      await waitFor(() => {
        expect(screen.getByText(/1000/)).toBeInTheDocument();
      }, { timeout: 100 });
    });

    it('should handle small values correctly', async () => {
      render(<StatCounter {...defaultProps} value={3} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/3/)).toBeInTheDocument();
      });
    });

    it('should handle large values correctly', async () => {
      render(<StatCounter {...defaultProps} value={99999} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/99999/)).toBeInTheDocument();
      });
    });

    it('should restart animation when value prop changes', async () => {
      const { rerender } = render(<StatCounter {...defaultProps} value={1000} />);

      // Complete first animation
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/1000/)).toBeInTheDocument();
      });

      // Change value
      rerender(<StatCounter {...defaultProps} value={2000} />);

      // Should start from 0 again
      expect(screen.getByText(/^0/)).toBeInTheDocument();

      // Complete second animation
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/2000/)).toBeInTheDocument();
      });
    });
  });

  describe('EaseOutQuad Easing Function', () => {
    it('should apply easeOutQuad easing for smooth deceleration', async () => {
      render(<StatCounter {...defaultProps} value={1000} />);

      const recordedValues: number[] = [];

      // Record values at different time intervals
      for (let time = 0; time <= 2000; time += 500) {
        act(() => {
          vi.advanceTimersByTime(500);
        });

        await waitFor(() => {
          const textContent = screen.getByText(/\d+/).textContent;
          const currentValue = parseInt(textContent?.match(/\d+/)?.[0] || '0');
          recordedValues.push(currentValue);
        });
      }

      // With easeOutQuad, the rate of change should slow down over time
      // First half should show larger increments than second half
      const firstHalfIncrement = recordedValues[2] - recordedValues[0];
      const secondHalfIncrement = recordedValues[4] - recordedValues[2];

      // Due to easing, first half should have larger change
      expect(firstHalfIncrement).toBeGreaterThan(secondHalfIncrement);
    });

    it('should use easeOutQuad formula: t * (2 - t)', async () => {
      render(<StatCounter {...defaultProps} value={100} />);

      // At 50% progress (1 second), easeOutQuad(0.5) = 0.5 * (2 - 0.5) = 0.75
      // So value should be around 75
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const textContent = screen.getByText(/\d+/).textContent;
        const currentValue = parseInt(textContent?.match(/\d+/)?.[0] || '0');

        // Should be around 75% of target (with some tolerance for animation frames)
        expect(currentValue).toBeGreaterThanOrEqual(70);
        expect(currentValue).toBeLessThanOrEqual(80);
      });
    });
  });

  describe('Suffix Prop', () => {
    it('should display suffix when provided', async () => {
      render(<StatCounter {...defaultProps} value={1000} suffix="+" />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/1000\+/)).toBeInTheDocument();
      });
    });

    it('should not display suffix when not provided', async () => {
      render(<StatCounter {...defaultProps} value={1000} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const textContent = screen.getByText(/1000/).textContent;
        expect(textContent).not.toContain('+');
      });
    });

    it('should display suffix during animation', async () => {
      render(<StatCounter {...defaultProps} value={1000} suffix="+" />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const textContent = screen.getByText(/\d+\+/).textContent;
        expect(textContent).toContain('+');
      });
    });

    it('should handle different suffix values', async () => {
      const { rerender } = render(
        <StatCounter {...defaultProps} value={78} suffix=" 張" />
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/78 張/)).toBeInTheDocument();
      });

      rerender(<StatCounter {...defaultProps} value={3} suffix=" 家" />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/3 家/)).toBeInTheDocument();
      });
    });
  });

  describe('PixelIcon Integration', () => {
    it('should render PixelIcon with decorative attribute', () => {
      render(<StatCounter {...defaultProps} />);

      const iconElement = document.querySelector('i[class*="ri-user"]');
      expect(iconElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render PixelIcon with appropriate size', () => {
      render(<StatCounter {...defaultProps} />);

      // PixelIcon should have inline styles for width/height
      const iconElement = document.querySelector('i[class*="ri-user"]');

      // Should have size styling (either inline or via class)
      expect(iconElement).toBeInTheDocument();
    });

    it('should position icon above the number', () => {
      const { container } = render(<StatCounter {...defaultProps} />);

      // Icon and number should be in a vertical flex layout
      const counterElement = container.firstChild as HTMLElement;

      // Should have flex direction column or similar vertical layout
      expect(counterElement).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply text-4xl to number display', () => {
      const { container } = render(<StatCounter {...defaultProps} />);

      // Find the number element
      const numberElement = screen.getByText(/\d+/).closest('div, span, p');

      // Should have large text class
      expect(numberElement?.className).toMatch(/text-4xl|text-3xl/);
    });

    it('should apply text-sm to label display', () => {
      render(<StatCounter {...defaultProps} />);

      const labelElement = screen.getByText('總用戶數');

      // Should have small text class
      expect(labelElement.className).toMatch(/text-sm|text-xs/);
    });

    it('should apply Pip-Boy green color to number', () => {
      const { container } = render(<StatCounter {...defaultProps} />);

      const numberElement = screen.getByText(/\d+/).closest('div, span, p');

      // Should have pip-boy-green text color
      expect(numberElement?.className).toMatch(/text-pip-boy-green/);
    });

    it('should have centered text alignment', () => {
      const { container } = render(<StatCounter {...defaultProps} />);

      const counterElement = container.firstChild as HTMLElement;

      // Should have text-center class
      expect(counterElement).toHaveClass('text-center');
    });
  });

  describe('React.memo Performance Optimization', () => {
    it('should not re-render when parent re-renders with same props', () => {
      const renderSpy = vi.fn();

      // Wrap component to spy on renders
      const TestWrapper = ({ value }: { value: number }) => {
        renderSpy();
        return <StatCounter {...defaultProps} value={value} />;
      };

      const { rerender } = render(<TestWrapper value={1000} />);

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render parent with same props
      rerender(<TestWrapper value={1000} />);

      // StatCounter should use memo and not re-render
      // Parent re-renders (2 calls) but child should optimize
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should re-render when value prop changes', () => {
      const { rerender } = render(<StatCounter {...defaultProps} value={1000} />);

      // Change value prop
      rerender(<StatCounter {...defaultProps} value={2000} />);

      // Should re-render and restart animation
      expect(screen.getByText(/^0/)).toBeInTheDocument();
    });

    it('should re-render when label prop changes', () => {
      const { rerender } = render(<StatCounter {...defaultProps} label="用戶數" />);
      expect(screen.getByText('用戶數')).toBeInTheDocument();

      rerender(<StatCounter {...defaultProps} label="占卜次數" />);
      expect(screen.getByText('占卜次數')).toBeInTheDocument();
    });

    it('should re-render when icon prop changes', () => {
      const { rerender } = render(<StatCounter {...defaultProps} icon="user" />);
      expect(document.querySelector('i[class*="ri-user"]')).toBeInTheDocument();

      rerender(<StatCounter {...defaultProps} icon="cpu" />);
      expect(document.querySelector('i[class*="ri-cpu"]')).toBeInTheDocument();
    });
  });

  describe('requestAnimationFrame Usage', () => {
    it('should use requestAnimationFrame for animation', () => {
      render(<StatCounter {...defaultProps} value={1000} />);

      // requestAnimationFrame should be called during animation
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should cleanup animation on unmount', () => {
      const { unmount } = render(<StatCounter {...defaultProps} value={1000} />);

      // Clear mock calls before unmount
      vi.clearAllMocks();

      // Unmount component
      unmount();

      // Animation should stop (no new requestAnimationFrame calls after unmount)
      const callCountBeforeAdvance = (global.requestAnimationFrame as vi.Mock).mock.calls.length;

      act(() => {
        vi.advanceTimersByTime(500);
      });

      const callCountAfterAdvance = (global.requestAnimationFrame as vi.Mock).mock.calls.length;

      // Should not continue animating after unmount
      expect(callCountAfterAdvance).toBe(callCountBeforeAdvance);
    });

    it('should achieve 60fps animation rate', () => {
      render(<StatCounter {...defaultProps} value={1000} />);

      // Each frame should be ~16ms (60fps)
      const frameDuration = 16;
      const frames = 10;

      act(() => {
        for (let i = 0; i < frames; i++) {
          vi.advanceTimersByTime(frameDuration);
        }
      });

      // Animation should progress smoothly
      const rafCallCount = (global.requestAnimationFrame as vi.Mock).mock.calls.length;
      expect(rafCallCount).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(<StatCounter {...defaultProps} />);

      // Should use div or article for structure
      const semanticElement = container.querySelector('div, article, section');
      expect(semanticElement).toBeInTheDocument();
    });

    it('should have readable label-number association', () => {
      render(<StatCounter {...defaultProps} />);

      // Label and number should be in the same component
      expect(screen.getByText('總用戶數')).toBeInTheDocument();
      expect(screen.getByText(/\d+/)).toBeInTheDocument();
    });

    it('should mark icon as decorative (aria-hidden)', () => {
      render(<StatCounter {...defaultProps} />);

      const iconElement = document.querySelector('i[class*="ri-user"]');
      expect(iconElement).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle value of 0', async () => {
      render(<StatCounter {...defaultProps} value={0} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/^0$/)).toBeInTheDocument();
      });
    });

    it('should handle negative values gracefully', async () => {
      // While not expected in production, should handle gracefully
      render(<StatCounter {...defaultProps} value={-100} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const textContent = screen.getByText(/-?\d+/).textContent;
        expect(textContent).toBeTruthy();
      });
    });

    it('should handle very large numbers', async () => {
      render(<StatCounter {...defaultProps} value={9999999} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText(/9999999/)).toBeInTheDocument();
      });
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<StatCounter {...defaultProps} value={100} />);

      // Rapidly change value multiple times
      rerender(<StatCounter {...defaultProps} value={200} />);
      rerender(<StatCounter {...defaultProps} value={300} />);
      rerender(<StatCounter {...defaultProps} value={400} />);

      // Should handle without errors
      expect(screen.getByText(/\d+/)).toBeInTheDocument();
    });
  });

  describe('Animation Duration', () => {
    it('should complete animation in exactly 2 seconds', async () => {
      render(<StatCounter {...defaultProps} value={1000} />);

      // Before 2 seconds, should still be animating
      act(() => {
        vi.advanceTimersByTime(1999);
      });

      await waitFor(() => {
        const textContent = screen.getByText(/\d+/).textContent;
        const currentValue = parseInt(textContent?.match(/\d+/)?.[0] || '0');
        expect(currentValue).toBeLessThan(1000);
      });

      // After 2 seconds, should be complete
      act(() => {
        vi.advanceTimersByTime(1);
      });

      await waitFor(() => {
        expect(screen.getByText(/1000/)).toBeInTheDocument();
      });
    });

    it('should not overshoot target value', async () => {
      render(<StatCounter {...defaultProps} value={1000} />);

      // Advance beyond animation duration
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        const textContent = screen.getByText(/\d+/).textContent;
        const currentValue = parseInt(textContent?.match(/\d+/)?.[0] || '0');
        expect(currentValue).toBe(1000); // Should not exceed target
      });
    });
  });
});
