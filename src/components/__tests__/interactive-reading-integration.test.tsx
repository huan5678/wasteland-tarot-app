/**
 * Integration Tests for Interactive Reading Experience
 *
 * Tests the complete flow from card drawing to interpretation display
 * Requirements: 1.1-1.13, 2.1-2.12, 3.1-3.14
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InteractiveCardDraw } from '@/components/tarot/InteractiveCardDraw';
import { StreamingInterpretation } from '@/components/readings/StreamingInterpretation';
import { VirtualizedReadingList } from '@/components/readings/VirtualizedReadingList';

// Mock the hooks
vi.mock('@/hooks/useFisherYatesShuffle', () => ({
  useFisherYatesShuffle: () => ({
    shuffle: <T,>(array: T[]): T[] => {
      // Deterministic shuffle for testing
      return [...array].reverse();
    },
    shuffleInPlace: vi.fn(),
  }),
}));

vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => ({
    prefersReducedMotion: false,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useSessionRecovery', () => ({
  useSessionRecovery: () => ({
    hasIncompleteReading: false,
    savedState: null,
    saveState: vi.fn(),
    clearState: vi.fn(),
    restoreState: vi.fn(),
  }),
}));

vi.mock('@/hooks/useStreamingText', () => ({
  useStreamingText: () => ({
    streamedText: 'Test interpretation text',
    isComplete: true,
    isError: false,
    error: null,
    isRetrying: false,
    retryCount: 0,
    startStreaming: vi.fn(),
    reset: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    togglePause: vi.fn(),
    setSpeed: vi.fn(),
    isPaused: false,
    currentSpeed: 1,
  }),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Interactive Reading Experience - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Complete Reading Flow', () => {
    it('should complete full reading flow from shuffle to interpretation', async () => {
      const user = userEvent.setup();
      const mockOnCardsDrawn = vi.fn();
      const mockOnDrawingStateChange = vi.fn();

      // Step 1: Render card draw component
      const { rerender } = render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
          onDrawingStateChange={mockOnDrawingStateChange}
          enableAnimation={false}
        />
      );

      // Step 2: Verify initial idle state
      expect(mockOnDrawingStateChange).toHaveBeenCalledWith('idle');

      // Step 3: Click to start shuffle
      const shuffleButton = screen.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
      await user.click(shuffleButton);

      // Step 4: Verify shuffling state
      await waitFor(() => {
        expect(mockOnDrawingStateChange).toHaveBeenCalledWith('shuffling');
      });

      // Step 5: Wait for cards to be laid out
      await waitFor(() => {
        expect(mockOnDrawingStateChange).toHaveBeenCalledWith('selecting');
      }, { timeout: 3000 });

      // Step 6: Verify card is available to flip
      const cardButton = await screen.findByRole('button', { name: /flip|翻牌/i });
      expect(cardButton).toBeInTheDocument();

      // Step 7: Flip the card
      await user.click(cardButton);

      // Step 8: Verify flipping state
      await waitFor(() => {
        expect(mockOnDrawingStateChange).toHaveBeenCalledWith('flipping');
      });

      // Step 9: Wait for complete state
      await waitFor(() => {
        expect(mockOnDrawingStateChange).toHaveBeenCalledWith('complete');
        expect(mockOnCardsDrawn).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Step 10: Verify cards were drawn
      const drawnCards = mockOnCardsDrawn.mock.calls[0][0];
      expect(drawnCards).toHaveLength(1);
      expect(drawnCards[0]).toHaveProperty('id');
      expect(drawnCards[0]).toHaveProperty('name');
    });

    it('should handle multi-card spread (3 cards) correctly', async () => {
      const user = userEvent.setup();
      const mockOnCardsDrawn = vi.fn();

      render(
        <InteractiveCardDraw
          spreadType="three_card"
          positionsMeta={[
            { id: 'past', label: '過去' },
            { id: 'present', label: '現在' },
            { id: 'future', label: '未來' },
          ]}
          onCardsDrawn={mockOnCardsDrawn}
          enableAnimation={false}
        />
      );

      // Start shuffle
      const shuffleButton = screen.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
      await user.click(shuffleButton);

      // Wait for cards to be laid out
      await waitFor(() => {
        const cardButtons = screen.getAllByRole('button', { name: /flip|翻牌/i });
        expect(cardButtons).toHaveLength(3);
      }, { timeout: 3000 });

      // Flip all cards
      const cardButtons = screen.getAllByRole('button', { name: /flip|翻牌/i });
      for (const button of cardButtons) {
        await user.click(button);
        await waitFor(() => {
          // Wait for flip animation
        }, { timeout: 1000 });
      }

      // Verify all cards were drawn
      await waitFor(() => {
        expect(mockOnCardsDrawn).toHaveBeenCalled();
        const drawnCards = mockOnCardsDrawn.mock.calls[0][0];
        expect(drawnCards).toHaveLength(3);
      }, { timeout: 3000 });
    });
  });

  describe('Streaming Interpretation Integration', () => {
    it('should display streaming interpretation after cards are drawn', async () => {
      const mockReading = {
        id: 'test-reading-1',
        question: 'Test question',
        spread_type: 'single',
        created_at: new Date().toISOString(),
        is_favorite: false,
        cards_drawn: [],
      };

      render(
        <StreamingInterpretation
          readingId="test-reading-1"
          onComplete={vi.fn()}
        />
      );

      // Verify loading state initially
      expect(screen.getByText(/載入中|loading/i)).toBeInTheDocument();

      // Wait for interpretation to stream
      await waitFor(() => {
        expect(screen.getByText(/test interpretation text/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify complete state
      await waitFor(() => {
        expect(screen.getByText(/完成|complete/i)).toBeInTheDocument();
      });
    });

    it('should support pause and resume during streaming', async () => {
      const user = userEvent.setup();

      render(
        <StreamingInterpretation
          readingId="test-reading-1"
          onComplete={vi.fn()}
        />
      );

      // Wait for streaming to start
      await waitFor(() => {
        expect(screen.getByText(/test interpretation text/i)).toBeInTheDocument();
      });

      // Find and click pause button
      const pauseButton = screen.getByRole('button', { name: /暫停|pause/i });
      await user.click(pauseButton);

      // Verify pause state
      expect(screen.getByRole('button', { name: /繼續|resume/i })).toBeInTheDocument();

      // Click resume
      const resumeButton = screen.getByRole('button', { name: /繼續|resume/i });
      await user.click(resumeButton);

      // Verify resumed state
      expect(screen.getByRole('button', { name: /暫停|pause/i })).toBeInTheDocument();
    });
  });

  describe('Reading History Integration', () => {
    it('should display reading list after completing a reading', async () => {
      const mockReadings = [
        {
          id: '1',
          question: 'Reading 1',
          spread_type: 'single',
          created_at: '2025-01-01T00:00:00Z',
          is_favorite: false,
          cards_drawn: [
            {
              id: 'the-fool',
              name: 'The Fool',
              suit: 'major_arcana',
              position: 'upright' as const,
              imageUrl: '/cards/the-fool.png',
              positionIndex: 0,
            },
          ],
        },
        {
          id: '2',
          question: 'Reading 2',
          spread_type: 'three_card',
          created_at: '2025-01-02T00:00:00Z',
          is_favorite: true,
          cards_drawn: [],
        },
      ];

      render(
        <VirtualizedReadingList
          readings={mockReadings}
          onSelect={vi.fn()}
          isLoading={false}
          enableVirtualization={false}
        />
      );

      // Verify readings are displayed
      expect(screen.getByText('Reading 1')).toBeInTheDocument();
      expect(screen.getByText('Reading 2')).toBeInTheDocument();

      // Verify favorite indicator
      const favoriteIcons = screen.getAllByText(/★|收藏/);
      expect(favoriteIcons.length).toBeGreaterThan(0);
    });

    it('should enable virtualization for large datasets', () => {
      const mockReadings = Array.from({ length: 200 }, (_, i) => ({
        id: `reading-${i}`,
        question: `Reading ${i}`,
        spread_type: 'single',
        created_at: new Date().toISOString(),
        is_favorite: false,
        cards_drawn: [],
      }));

      render(
        <VirtualizedReadingList
          readings={mockReadings}
          onSelect={vi.fn()}
          isLoading={false}
          enableVirtualization={true}
        />
      );

      // Verify virtualization container exists
      const virtualContainer = screen.getByRole('list');
      expect(virtualContainer).toBeInTheDocument();

      // Verify not all items are rendered at once (virtualization working)
      const visibleItems = screen.queryAllByText(/Reading \d+/);
      expect(visibleItems.length).toBeLessThan(200);
      expect(visibleItems.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully during interpretation', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <StreamingInterpretation
          readingId="test-reading-error"
          onComplete={vi.fn()}
        />
      );

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/錯誤|error|輻射干擾/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify retry button is present
      expect(screen.getByRole('button', { name: /重試|retry/i })).toBeInTheDocument();
    });

    it('should handle empty reading list gracefully', () => {
      render(
        <VirtualizedReadingList
          readings={[]}
          onSelect={vi.fn()}
          isLoading={false}
        />
      );

      // Verify empty state message
      expect(screen.getByText(/尚未有解讀記錄|no readings yet/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should support keyboard navigation throughout the flow', async () => {
      const user = userEvent.setup();
      const mockOnCardsDrawn = vi.fn();

      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={mockOnCardsDrawn}
          enableAnimation={false}
        />
      );

      // Tab to shuffle button
      await user.tab();
      const shuffleButton = screen.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
      expect(shuffleButton).toHaveFocus();

      // Activate with Enter
      await user.keyboard('{Enter}');

      // Wait for card to appear
      await waitFor(() => {
        const cardButton = screen.getByRole('button', { name: /flip|翻牌/i });
        expect(cardButton).toBeInTheDocument();
      }, { timeout: 3000 });

      // Tab to card button
      await user.tab();
      const cardButton = screen.getByRole('button', { name: /flip|翻牌/i });
      expect(cardButton).toHaveFocus();

      // Activate with Space
      await user.keyboard(' ');

      // Verify card was flipped
      await waitFor(() => {
        expect(mockOnCardsDrawn).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should have proper ARIA labels throughout', async () => {
      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={vi.fn()}
          enableAnimation={false}
        />
      );

      // Verify shuffle button has proper ARIA
      const shuffleButton = screen.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
      expect(shuffleButton).toHaveAttribute('aria-label');

      // Start shuffle
      await userEvent.click(shuffleButton);

      // Wait for card
      await waitFor(() => {
        const cardButton = screen.getByRole('button', { name: /flip|翻牌/i });
        expect(cardButton).toHaveAttribute('aria-label');
      }, { timeout: 3000 });
    });
  });

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.mock('@/hooks/usePrefersReducedMotion', () => ({
        usePrefersReducedMotion: () => ({
          prefersReducedMotion: true,
          isLoading: false,
        }),
      }));
    });

    it('should skip animations when reduced motion is enabled', async () => {
      const user = userEvent.setup();
      const mockOnDrawingStateChange = vi.fn();

      render(
        <InteractiveCardDraw
          spreadType="single"
          onCardsDrawn={vi.fn()}
          onDrawingStateChange={mockOnDrawingStateChange}
          enableAnimation={true} // Animation should be overridden by reduced motion
        />
      );

      // Start shuffle
      const shuffleButton = screen.getByRole('button', { name: /開始抽牌|開始洗牌|shuffle|start|draw/i });
      await user.click(shuffleButton);

      // Cards should appear immediately without animation delay
      await waitFor(() => {
        const cardButton = screen.getByRole('button', { name: /flip|翻牌/i });
        expect(cardButton).toBeInTheDocument();
      }, { timeout: 500 }); // Much shorter timeout for instant display
    });
  });
});
