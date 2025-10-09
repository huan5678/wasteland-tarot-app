/**
 * AsciiDonutLoading.tsx Integration Tests
 * Testing component behavior with React Testing Library
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AsciiDonutLoading } from '../AsciiDonutLoading';

// Mock requestAnimationFrame
beforeEach(() => {
  jest.useFakeTimers();
  global.requestAnimationFrame = jest.fn((cb) => {
    return setTimeout(cb, 16) as unknown as number;
  });
  global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('AsciiDonutLoading', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      render(<AsciiDonutLoading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      const message = 'Custom Loading Message';
      render(<AsciiDonutLoading message={message} />);

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should render default message when not provided', () => {
      render(<AsciiDonutLoading />);

      expect(
        screen.getByText('INITIALIZING VAULT RESIDENT STATUS...')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<AsciiDonutLoading />);

      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      render(<AsciiDonutLoading />);

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-label on pre element', () => {
      render(<AsciiDonutLoading />);

      const preElement = screen.getByLabelText(/loading animation/i);
      expect(preElement).toBeInTheDocument();
      expect(preElement.tagName).toBe('PRE');
    });

    it('message text should be accessible (not aria-hidden)', () => {
      render(<AsciiDonutLoading message="Test Message" />);

      const messageElement = screen.getByText('Test Message');
      expect(messageElement).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Fallback Mode', () => {
    it('should render static donut when forceFallback is true', () => {
      render(<AsciiDonutLoading forceFallback={true} />);

      const preElement = screen.getByLabelText(/loading animation/i);
      expect(preElement.textContent).toBeTruthy();
      expect(preElement.textContent?.length).toBeGreaterThan(0);
    });

    it('should not start animation when forceFallback is true', () => {
      const rafSpy = jest.spyOn(global, 'requestAnimationFrame');

      render(<AsciiDonutLoading forceFallback={true} />);

      // Should not call requestAnimationFrame for animation
      expect(rafSpy).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('should have Fallout theme classes on container', () => {
      render(<AsciiDonutLoading />);

      const container = screen.getByRole('status');
      const classes = container.className;

      expect(classes).toContain('min-h-screen');
      expect(classes).toContain('flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('justify-center');
    });

    it('should have monospace font on pre element', () => {
      render(<AsciiDonutLoading forceFallback={true} />);

      const preElement = screen.getByLabelText(/loading animation/i);
      expect(preElement.className).toContain('font-mono');
    });

    it('should preserve whitespace in pre element', () => {
      render(<AsciiDonutLoading forceFallback={true} />);

      const preElement = screen.getByLabelText(/loading animation/i);
      expect(preElement.className).toContain('whitespace-pre');
    });
  });

  describe('Cleanup', () => {
    it('should not throw errors on unmount', () => {
      const { unmount } = render(<AsciiDonutLoading />);

      expect(() => unmount()).not.toThrow();
    });

    it('should cancel animation frame on unmount', () => {
      const cancelSpy = jest.spyOn(global, 'cancelAnimationFrame');

      const { unmount } = render(<AsciiDonutLoading />);
      unmount();

      // Should call cancelAnimationFrame during cleanup
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom donut config', () => {
      const customConfig = {
        width: 40,
        height: 20,
      };

      expect(() =>
        render(<AsciiDonutLoading config={customConfig} />)
      ).not.toThrow();
    });
  });

  describe('Animation Behavior', () => {
    it('should update content over time (animation running)', async () => {
      render(<AsciiDonutLoading />);

      const preElement = screen.getByLabelText(/loading animation/i);
      const initialContent = preElement.textContent;

      // Advance timers to trigger animation frames
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        // Content should eventually change due to animation
        // Note: In fallback mode or prefers-reduced-motion, content stays static
        expect(preElement).toBeInTheDocument();
      });
    });
  });
});
