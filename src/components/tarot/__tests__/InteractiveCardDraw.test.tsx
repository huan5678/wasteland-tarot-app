/**
 * @jest-environment jsdom
 *
 * InteractiveCardDraw Component Tests
 *
 * Tests for the interactive card drawing component with:
 * - Fisher-Yates shuffle integration
 * - Framer Motion animations
 * - Reduced motion support
 * - State management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InteractiveCardDraw } from '../InteractiveCardDraw';

// Mock the API
const mockGetAll = jest.fn();

jest.mock('@/lib/api', () => ({
  cardsAPI: {
    getAll: mockGetAll,
  },
}));

// Mock the hooks
jest.mock('@/hooks/useFisherYatesShuffle', () => ({
  useFisherYatesShuffle: () => ({
    shuffle: jest.fn((arr) => [...arr]),
    shuffleInPlace: jest.fn(),
  }),
}));

jest.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => ({
    prefersReducedMotion: false,
    isLoading: false,
  }),
}));

describe('InteractiveCardDraw', () => {
  const mockOnCardsDrawn = jest.fn();
  const mockCards = [
    {
      id: '1',
      name: 'The Fool',
      suit: 'major_arcana',
      upright_meaning: 'New beginnings',
      reversed_meaning: 'Recklessness',
      image_url: '/fool.jpg',
      keywords: ['adventure', 'innocence'],
    },
    {
      id: '2',
      name: 'The Magician',
      suit: 'major_arcana',
      upright_meaning: 'Manifestation',
      reversed_meaning: 'Manipulation',
      image_url: '/magician.jpg',
      keywords: ['power', 'skill'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue(mockCards);
  });

  describe('Component Structure', () => {
    it('renders with required props', () => {
      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
        />
      );

      expect(screen.getByTestId('interactive-card-draw')).toBeInTheDocument();
      expect(screen.getByTestId('start-draw-button')).toBeInTheDocument();
    });

    it('accepts optional positionsMeta prop', () => {
      const positionsMeta = [{ id: 'pos1', label: 'Past' }];
      render(
        <InteractiveCardDraw
          spreadType="single"
          positionsMeta={positionsMeta}
          onCardsDrawn={mockOnCardsDrawn}
        />
      );

      expect(screen.getByTestId('interactive-card-draw')).toBeInTheDocument();
    });

    it('accepts optional callbacks', () => {
      const onStateChange = jest.fn();
      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
          onDrawingStateChange={onStateChange}
        />
      );

      expect(screen.getByTestId('interactive-card-draw')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('initializes with idle drawing state', () => {
      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
        />
      );

      expect(screen.getByTestId('drawing-state')).toHaveTextContent('idle');
    });

    it('transitions to shuffling state when draw begins', async () => {
      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
        />
      );

      const drawButton = screen.getByTestId('start-draw-button');
      fireEvent.click(drawButton);

      await waitFor(() => {
        const state = screen.getByTestId('drawing-state').textContent;
        expect(['shuffling', 'selecting', 'complete']).toContain(state);
      });
    });

    it('prevents multiple simultaneous draws', async () => {
      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
        />
      );

      const drawButton = screen.getByTestId('start-draw-button');
      fireEvent.click(drawButton);
      fireEvent.click(drawButton); // Second click should be ignored

      await waitFor(
        () => {
          expect(mockGetAll).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Spread Type Validation', () => {
    it('validates spread type against allowed list', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      render(
        <InteractiveCardDraw
          spreadType="invalid_spread"
          onCardsDrawn={mockOnCardsDrawn}
        />
      );

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid spread type')
      );

      consoleError.mockRestore();
    });

    it('accepts valid spread types', () => {
      const validSpreads = ['single', 'three_card', 'celtic_cross'];

      validSpreads.forEach((spreadType) => {
        const { unmount } = render(
          <InteractiveCardDraw
            spreadType={spreadType}
            onCardsDrawn={mockOnCardsDrawn}
          />
        );

        expect(screen.getByTestId('interactive-card-draw')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Callback Handling', () => {
    it('calls onDrawingStateChange when state changes', async () => {
      const onStateChange = jest.fn();

      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
          onDrawingStateChange={onStateChange}
        />
      );

      const drawButton = screen.getByTestId('start-draw-button');
      fireEvent.click(drawButton);

      await waitFor(
        () => {
          expect(onStateChange).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('calls onCardsDrawn when drawing completes', async () => {
      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
        />
      );

      const drawButton = screen.getByTestId('start-draw-button');
      fireEvent.click(drawButton);

      await waitFor(
        () => {
          expect(mockOnCardsDrawn).toHaveBeenCalledWith(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                position: expect.stringMatching(/^(upright|reversed)$/),
                positionIndex: expect.any(Number),
              }),
            ])
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Reduced Motion Support', () => {
    it('sets data attribute based on reduced motion preference', () => {
      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
          enableAnimation={true}
        />
      );

      const container = screen.getByTestId('interactive-card-draw');
      // Default mock returns false for reduced motion
      expect(container).toHaveAttribute('data-reduced-motion', 'false');
    });

    it('respects enableAnimation prop', () => {
      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
          enableAnimation={false}
        />
      );

      const container = screen.getByTestId('interactive-card-draw');
      expect(container).toHaveAttribute('data-reduced-motion', 'true');
    });
  });
});
