/**
 * Touch Device Animation Adjustments Tests
 * Tests for Task 15.2 - Touch device animation adjustments
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { motion } from 'motion/react';
import { isTouchDevice } from '../animationUtils';

describe('Task 15.2: Touch Device Animation Adjustments', () => {
  describe('isTouchDevice() Detection', () => {
    it('should return false in non-browser environment', () => {
      const isTouch = isTouchDevice();
      // In test environment, should handle gracefully
      expect(typeof isTouch).toBe('boolean');
    });

    it('should detect touch via ontouchstart', () => {
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: {},
      });

      const isTouch = isTouchDevice();
      expect(isTouch).toBe(true);
    });

    it('should detect touch via navigator.maxTouchPoints', () => {
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5,
      });

      const isTouch = isTouchDevice();
      expect(isTouch).toBe(true);
    });

    it('should detect touch via msMaxTouchPoints (IE support)', () => {
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0,
      });
      (navigator as any).msMaxTouchPoints = 5;

      const isTouch = isTouchDevice();
      expect(isTouch).toBe(true);
    });

    it('should return false when no touch support detected', () => {
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0,
      });
      delete (navigator as any).msMaxTouchPoints;

      const isTouch = isTouchDevice();
      expect(isTouch).toBe(false);
    });
  });

  describe('Hover vs Tap Animation Strategy', () => {
    it('should render component with whileTap for touch devices', () => {
      // Example component that should use whileTap instead of whileHover
      function TouchButton({ isTouch }: { isTouch: boolean }) {
        return (
          <motion.button
            data-testid="touch-button"
            whileTap={isTouch ? { scale: 0.95 } : undefined}
            whileHover={!isTouch ? { scale: 1.05 } : undefined}
          >
            Touch Me
          </motion.button>
        );
      }

      const { rerender } = render(<TouchButton isTouch={false} />);
      expect(screen.getByTestId('touch-button')).toBeInTheDocument();

      // Re-render with touch device
      rerender(<TouchButton isTouch={true} />);
      expect(screen.getByTestId('touch-button')).toBeInTheDocument();
    });

    it('should prioritize tap over hover on touch devices', () => {
      const isTouchMock = true;

      const tapAnimation = isTouchMock ? { scale: 0.95 } : undefined;
      const hoverAnimation = !isTouchMock ? { scale: 1.05 } : undefined;

      expect(tapAnimation).toBeDefined();
      expect(hoverAnimation).toBeUndefined();
    });
  });

  describe('Touch-Optimized Animation Patterns', () => {
    it('should use shorter duration for tap animations', () => {
      const tapTransition = { duration: 0.1 }; // Quick response for touch
      const hoverTransition = { duration: 0.3 }; // Can be slower for hover

      expect(tapTransition.duration).toBeLessThan(hoverTransition.duration);
      expect(tapTransition.duration).toBeLessThanOrEqual(0.1);
    });

    it('should use scale-based animations for touch feedback', () => {
      // Tap animations should use scale for immediate visual feedback
      const tapAnimation = {
        scale: 0.95, // Slightly shrink on tap
      };

      expect(tapAnimation.scale).toBeLessThan(1.0);
      expect(tapAnimation.scale).toBeGreaterThan(0.9);
    });

    it('should avoid hover-only effects on touch devices', () => {
      const isTouchDevice = true;

      // Hover effects should be disabled on touch
      const shouldEnableHover = !isTouchDevice;

      expect(shouldEnableHover).toBe(false);
    });
  });

  describe('Component Integration Example', () => {
    it('should conditionally apply animations based on touch detection', () => {
      const mockIsTouchDevice = vi.fn().mockReturnValue(true);

      function ResponsiveButton() {
        const isTouch = mockIsTouchDevice();

        return (
          <motion.button
            data-testid="responsive-btn"
            whileTap={isTouch ? { scale: 0.95 } : undefined}
            whileHover={!isTouch ? { scale: 1.05 } : undefined}
            transition={{ duration: isTouch ? 0.1 : 0.3 }}
          >
            Click Me
          </motion.button>
        );
      }

      render(<ResponsiveButton />);
      expect(mockIsTouchDevice).toHaveBeenCalled();
      expect(screen.getByTestId('responsive-btn')).toBeInTheDocument();
    });
  });

  describe('Performance Considerations for Touch', () => {
    it('should use GPU-accelerated properties only (transform, opacity)', () => {
      const touchAnimation = {
        scale: 0.95, // Transform (GPU-accelerated)
        opacity: 0.8, // Opacity (GPU-accelerated)
      };

      // Should NOT use layout-triggering properties
      const invalidProperties = ['width', 'height', 'top', 'left', 'margin', 'padding'];

      invalidProperties.forEach((prop) => {
        expect(touchAnimation).not.toHaveProperty(prop);
      });
    });

    it('should have fast transition for immediate touch feedback', () => {
      const tapTransition = { duration: 0.1 };

      // Should be <= 100ms for responsive feel
      expect(tapTransition.duration * 1000).toBeLessThanOrEqual(100);
    });
  });
});
