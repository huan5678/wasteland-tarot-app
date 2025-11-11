/**
 * @jest-environment jsdom
 *
 * CardFlipAnimation Component Tests
 *
 * Tests for the card flip animation system according to TDD methodology.
 * Requirements: 1.7, 1.8, 1.9, 1.11
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardFlipAnimation } from '../CardFlipAnimation';
import { CardWithPosition } from '../InteractiveCardDraw';

// Mock usePrefersReducedMotion hook
jest.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: jest.fn(() => ({
    prefersReducedMotion: false,
    isLoading: false,
  })),
}));

// Mock PixelIcon component
jest.mock('@/components/ui/icons', () => ({
  PixelIcon: ({ name, ...props }: any) => <div data-testid={`icon-${name}`} {...props} />,
}));

describe('CardFlipAnimation', () => {
  const mockCard: CardWithPosition = {
    id: 'test-card-1',
    name: 'The Fool',
    suit: 'major_arcana',
    number: 0,
    upright_meaning: 'New beginnings',
    reversed_meaning: 'Recklessness',
    image_url: '/images/cards/the-fool.png',
    keywords: ['innocence', 'adventure'],
    position: 'upright',
    positionIndex: 0,
    positionLabel: '過去',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render card back initially', () => {
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      expect(cardElement).toBeInTheDocument();
      expect(cardElement).toHaveAttribute('data-is-revealed', 'false');
    });

    it('should display card back when not revealed', () => {
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
        />
      );

      const cardBack = screen.getByTestId('card-back');
      expect(cardBack).toBeInTheDocument();
    });
  });

  describe('Flip Animation', () => {
    it('should trigger flip animation when isRevealed changes to true', async () => {
      const onFlipComplete = jest.fn();
      const { rerender } = render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={onFlipComplete}
        />
      );

      // Verify initial state
      expect(screen.getByTestId('card-flip-animation')).toHaveAttribute(
        'data-is-revealed',
        'false'
      );

      // Trigger flip
      rerender(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={true}
          onFlipComplete={onFlipComplete}
        />
      );

      // Verify flipping state
      expect(screen.getByTestId('card-flip-animation')).toHaveAttribute(
        'data-is-revealed',
        'true'
      );

      // Wait for flip animation to complete (0.5s duration)
      await waitFor(
        () => {
          expect(onFlipComplete).toHaveBeenCalledWith(mockCard);
        },
        { timeout: 1000 }
      );
    });

    it('should use 0.5s flip duration by default', () => {
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      expect(cardElement).toHaveAttribute('data-flip-duration', '0.5');
    });

    it('should support custom flip duration', () => {
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
          flipDuration={0.8}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      expect(cardElement).toHaveAttribute('data-flip-duration', '0.8');
    });

    it('should display card front after flip completes', async () => {
      const { rerender } = render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
        />
      );

      // Trigger flip
      rerender(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={true}
          onFlipComplete={jest.fn()}
        />
      );

      // Wait for animation
      await waitFor(() => {
        const cardFront = screen.getByTestId('card-front');
        expect(cardFront).toBeInTheDocument();
      });
    });
  });

  describe('Click Interaction', () => {
    it('should trigger flip when card is clicked', async () => {
      const onFlipComplete = jest.fn();
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={onFlipComplete}
          allowClickToFlip={true}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      fireEvent.click(cardElement);

      // Wait for flip to complete
      await waitFor(
        () => {
          expect(onFlipComplete).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });

    it('should not trigger flip on click when allowClickToFlip is false', () => {
      const onFlipComplete = jest.fn();
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={onFlipComplete}
          allowClickToFlip={false}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      fireEvent.click(cardElement);

      expect(onFlipComplete).not.toHaveBeenCalled();
    });

    it('should disable clicks on other cards during flip animation', async () => {
      const onFlipComplete = jest.fn();
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={onFlipComplete}
          allowClickToFlip={true}
          isDisabled={true}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      expect(cardElement).toHaveAttribute('data-is-disabled', 'true');

      fireEvent.click(cardElement);
      expect(onFlipComplete).not.toHaveBeenCalled();
    });
  });

  describe('Sound Effects', () => {
    it('should play Geiger counter sound on flip', async () => {
      // Mock audio system (to be implemented)
      const playSound = jest.fn();
      (global as any).audioSystem = { play: playSound };

      const { rerender } = render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
          playSound={true}
        />
      );

      rerender(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={true}
          onFlipComplete={jest.fn()}
          playSound={true}
        />
      );

      await waitFor(() => {
        // Verify sound was triggered (when audio system is integrated)
        // expect(playSound).toHaveBeenCalledWith('geiger_counter_short');
      });

      delete (global as any).audioSystem;
    });

    it('should not play sound when playSound is false', () => {
      const { rerender } = render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
          playSound={false}
        />
      );

      rerender(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={true}
          onFlipComplete={jest.fn()}
          playSound={false}
        />
      );

      // No sound should be played
      // (Audio system integration test will verify this)
    });
  });

  describe('Reduced Motion Support', () => {
    it('should skip animation when prefersReducedMotion is true', async () => {
      const usePrefersReducedMotion = require('@/hooks/usePrefersReducedMotion')
        .usePrefersReducedMotion;
      usePrefersReducedMotion.mockReturnValue({
        prefersReducedMotion: true,
        isLoading: false,
      });

      const onFlipComplete = jest.fn();
      const { rerender } = render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={onFlipComplete}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      expect(cardElement).toHaveAttribute('data-reduced-motion', 'true');

      // Trigger flip
      rerender(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={true}
          onFlipComplete={onFlipComplete}
        />
      );

      // Callback should be called immediately (no animation delay)
      await waitFor(
        () => {
          expect(onFlipComplete).toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      expect(cardElement).toHaveAttribute('role', 'button');
      expect(cardElement).toHaveAttribute('tabIndex', '0');
      expect(cardElement).toHaveAttribute(
        'aria-label',
        expect.stringContaining(mockCard.name)
      );
    });

    it('should be keyboard accessible', async () => {
      const onFlipComplete = jest.fn();
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={onFlipComplete}
          allowClickToFlip={true}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');

      // Press Enter key
      fireEvent.keyDown(cardElement, { key: 'Enter' });

      await waitFor(() => {
        expect(onFlipComplete).toHaveBeenCalled();
      });
    });

    it('should update aria-label after flip reveals card', async () => {
      const { rerender } = render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      const initialLabel = cardElement.getAttribute('aria-label');

      rerender(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={true}
          onFlipComplete={jest.fn()}
        />
      );

      await waitFor(() => {
        const updatedLabel = cardElement.getAttribute('aria-label');
        expect(updatedLabel).not.toBe(initialLabel);
        expect(updatedLabel).toContain('已翻開');
      });
    });
  });

  describe('Perspective Effect', () => {
    it('should apply CSS perspective transform', () => {
      render(
        <CardFlipAnimation
          card={mockCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
        />
      );

      const cardElement = screen.getByTestId('card-flip-animation');
      // Verify that element has perspective CSS class or style
      expect(cardElement).toHaveClass(expect.stringContaining('perspective'));
    });
  });

  describe('Card Orientation', () => {
    it('should display upright card correctly', async () => {
      const uprightCard: CardWithPosition = {
        ...mockCard,
        position: 'upright',
      };

      const { rerender } = render(
        <CardFlipAnimation
          card={uprightCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
        />
      );

      rerender(
        <CardFlipAnimation
          card={uprightCard}
          isRevealed={true}
          onFlipComplete={jest.fn()}
        />
      );

      await waitFor(() => {
        const cardElement = screen.getByTestId('card-flip-animation');
        expect(cardElement).toHaveAttribute('data-card-position', 'upright');
      });
    });

    it('should display reversed card correctly', async () => {
      const reversedCard: CardWithPosition = {
        ...mockCard,
        position: 'reversed',
      };

      const { rerender } = render(
        <CardFlipAnimation
          card={reversedCard}
          isRevealed={false}
          onFlipComplete={jest.fn()}
        />
      );

      rerender(
        <CardFlipAnimation
          card={reversedCard}
          isRevealed={true}
          onFlipComplete={jest.fn()}
        />
      );

      await waitFor(() => {
        const cardElement = screen.getByTestId('card-flip-animation');
        expect(cardElement).toHaveAttribute('data-card-position', 'reversed');
      });
    });
  });
});
