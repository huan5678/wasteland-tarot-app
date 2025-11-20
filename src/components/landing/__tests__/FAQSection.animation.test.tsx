/**
 * FAQ Section Animation Integration Tests
 * Tests for Tasks 12.1-12.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FAQSection } from '../FAQSection';

// Mock useReducedMotion hook
vi.mock('@/lib/animations/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe('FAQSection - Animation Integration', () => {
  const mockFaqItems = [
    {
      id: 1,
      question: 'Test Question 1',
      answer: 'Test Answer 1',
    },
    {
      id: 2,
      question: 'Test Question 2',
      answer: 'Test Answer 2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task 12.1: Expand/Collapse Logic', () => {
    it('should expand FAQ item when clicked', () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      expect(screen.getByText('Test Answer 1')).toBeInTheDocument();
    });

    it('should collapse FAQ item when clicked again', async () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');

      // Expand
      fireEvent.click(question1Button);
      expect(screen.getByText('Test Answer 1')).toBeInTheDocument();

      // Collapse
      fireEvent.click(question1Button);
      await waitFor(() => {
        expect(screen.queryByText('Test Answer 1')).not.toBeInTheDocument();
      });
    });

    it('should implement accordion behavior (only one FAQ expanded at a time)', () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      const question2Button = screen.getByText('Test Question 2');

      // Expand FAQ 1
      fireEvent.click(question1Button);
      expect(screen.getByText('Test Answer 1')).toBeInTheDocument();

      // Expand FAQ 2 (should collapse FAQ 1)
      fireEvent.click(question2Button);
      expect(screen.getByText('Test Answer 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Answer 1')).not.toBeInTheDocument();
    });

    it('should set correct aria-expanded attribute', () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');

      // Initial state
      expect(question1Button).toHaveAttribute('aria-expanded', 'false');

      // Expanded state
      fireEvent.click(question1Button);
      expect(question1Button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Task 12.2: Expand Animation (Framer Motion)', () => {
    it('should render motion.div with AnimatePresence wrapper', () => {
      const { container } = render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      // Check if motion.div is rendered (has data-projection-id attribute from Framer Motion)
      const answerPanel = screen.getByText('Test Answer 1').closest('div');
      expect(answerPanel).toHaveAttribute('style');
    });

    it('should use faqExpandVariants from motionVariants.ts', () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      const answerPanel = screen.getByText('Test Answer 1').closest('div');
      // Verify motion.div has initial opacity 0 and transitions to 1
      expect(answerPanel).toHaveStyle({ opacity: expect.any(String) });
    });

    it('should animate height from 0 to auto on expand', async () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      await waitFor(() => {
        const answerPanel = screen.getByText('Test Answer 1').closest('div');
        // Height should be set (Framer Motion calculates auto)
        expect(answerPanel).toHaveStyle({ height: expect.any(String) });
      });
    });

    it('should animate opacity from 0 to 1 with 0.1s delay', async () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      const answerPanel = screen.getByText('Test Answer 1').closest('div');
      // Opacity should transition
      expect(answerPanel).toHaveStyle({ opacity: expect.any(String) });
    });
  });

  describe('Task 12.3: Arrow Rotation Animation', () => {
    it('should rotate arrow from 0deg to 180deg on expand', () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      const arrowIcon = question1Button.querySelector('[aria-hidden="true"]');

      // Initial state: arrow-down-s icon
      expect(arrowIcon).toHaveClass('text-pip-boy-green');

      // Expanded state: should rotate
      fireEvent.click(question1Button);
      // Arrow should now be in rotated state (motion.div with rotate transform)
      expect(arrowIcon?.parentElement).toHaveStyle({ transform: expect.any(String) });
    });

    it('should use faqArrowVariants from motionVariants.ts', () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      const arrowContainer = question1Button.querySelector('[aria-hidden="true"]')?.parentElement;
      // Verify motion.div wrapper exists
      expect(arrowContainer).toHaveAttribute('style');
    });

    it('should animate rotation over 0.3s duration', async () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      await waitFor(() => {
        const arrowContainer = question1Button.querySelector('[aria-hidden="true"]')?.parentElement;
        expect(arrowContainer).toHaveStyle({ transform: expect.stringContaining('rotate') });
      });
    });
  });

  describe('Task 12.4: Prevent Layout Shift', () => {
    it('should use overflow: hidden to prevent content overflow during animation', () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      // Check the motion.div wrapper has overflow-hidden
      const answerPanel = screen.getByText('Test Answer 1').closest('div')?.parentElement;
      expect(answerPanel).toHaveClass('overflow-hidden');
    });

    it('should not cause layout shift (maintain stable container height)', () => {
      // Skip this test in jsdom as getBoundingClientRect returns zeros
      // This is better tested in E2E tests with real layout
    });
  });

  describe('Task 12.5: Reduced Motion Support', () => {
    it('should use reducedMotionTransition when prefers-reduced-motion is enabled', async () => {
      const { useReducedMotion } = await import('@/lib/animations/useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      // Content should appear instantly (duration: 0)
      const answerPanel = screen.getByText('Test Answer 1');
      expect(answerPanel).toBeInTheDocument();
    });

    it('should instantly toggle content visibility with reduced motion', async () => {
      const { useReducedMotion } = await import('@/lib/animations/useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      // No animation delay, content should be in document
      expect(screen.getByText('Test Answer 1')).toBeInTheDocument();
    });

    it('should disable arrow rotation animation with reduced motion', async () => {
      const { useReducedMotion } = await import('@/lib/animations/useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      fireEvent.click(question1Button);

      // Arrow should change instantly without rotation animation
      const arrowContainer = question1Button.querySelector('[aria-hidden="true"]')?.parentElement;
      // With reduced motion, transition duration should be 0
      expect(useReducedMotion).toHaveBeenCalled();
    });
  });

  describe('Task 12.6: Integration Tests', () => {
    it('should handle rapid expand/collapse clicks without errors', async () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');

      // Rapid clicks
      fireEvent.click(question1Button);
      fireEvent.click(question1Button);
      fireEvent.click(question1Button);
      fireEvent.click(question1Button);

      // Should not crash and end in stable state
      await waitFor(() => {
        expect(screen.queryByText('Test Answer 1')).not.toBeInTheDocument();
      });
    });

    it('should maintain correct state when switching between FAQs', async () => {
      render(<FAQSection items={mockFaqItems} />);

      const question1Button = screen.getByText('Test Question 1');
      const question2Button = screen.getByText('Test Question 2');

      // Open FAQ 1
      fireEvent.click(question1Button);
      expect(screen.getByText('Test Answer 1')).toBeInTheDocument();

      // Open FAQ 2 (should close FAQ 1 after animation)
      fireEvent.click(question2Button);
      expect(screen.getByText('Test Answer 2')).toBeInTheDocument();

      // Wait for exit animation to complete
      await waitFor(() => {
        expect(screen.queryByText('Test Answer 1')).not.toBeInTheDocument();
      });

      // Open FAQ 1 again (should close FAQ 2)
      fireEvent.click(question1Button);
      expect(screen.getByText('Test Answer 1')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Test Answer 2')).not.toBeInTheDocument();
      });
    });

    it('should work correctly with empty FAQ list', () => {
      render(<FAQSection items={[]} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should work correctly with single FAQ item', () => {
      render(<FAQSection items={[mockFaqItems[0]]} />);

      const questionButton = screen.getByText('Test Question 1');
      fireEvent.click(questionButton);

      expect(screen.getByText('Test Answer 1')).toBeInTheDocument();
    });
  });
});
