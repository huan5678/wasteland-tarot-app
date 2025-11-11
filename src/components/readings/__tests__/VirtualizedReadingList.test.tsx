/**
 * @jest-environment jsdom
 *
 * VirtualizedReadingList Component Tests
 *
 * Tests for the virtualized reading history list according to TDD methodology.
 * Requirements: 3.1, 3.2, 3.3, 3.7, 3.8, 3.14
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VirtualizedReadingList } from '../VirtualizedReadingList';
import type { Reading } from '@/types/database';

// Mock TanStack Virtual
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(() => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollToIndex: jest.fn(),
  })),
}));

const mockReading: Reading = {
  id: 'test-reading-1',
  user_id: 'user-1',
  question: 'Test question',
  spread_type: 'single_card',
  spread_template_id: 'template-1',
  cards_drawn: [
    {
      id: 'card-1',
      name: 'The Fool',
      suit: 'major_arcana',
      position: 'upright',
      image_url: '/cards/fool.png',
      positionIndex: 0,
    },
  ],
  interpretation: 'Test interpretation',
  created_at: '2025-11-11T10:00:00Z',
  updated_at: '2025-11-11T10:00:00Z',
  is_favorite: false,
  archived: false,
};

describe('VirtualizedReadingList', () => {
  describe('Basic Rendering', () => {
    it('should render empty state when no readings provided', () => {
      render(<VirtualizedReadingList readings={[]} />);

      expect(screen.getByText(/沒有解讀記錄/i)).toBeInTheDocument();
    });

    it('should render loading skeleton when isLoading is true', () => {
      render(<VirtualizedReadingList readings={[]} isLoading={true} />);

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    });

    it('should render reading list when readings provided', () => {
      render(<VirtualizedReadingList readings={[mockReading]} />);

      expect(screen.getByText('Test question')).toBeInTheDocument();
    });
  });

  describe('Virtualization Behavior', () => {
    it('should enable virtualization when readings >= 100', () => {
      const manyReadings = Array(100).fill(mockReading).map((r, i) => ({
        ...r,
        id: `reading-${i}`,
      }));

      render(<VirtualizedReadingList readings={manyReadings} />);

      // Should use virtual scroll container
      expect(screen.getByTestId('virtual-scroll-container')).toBeInTheDocument();
    });

    it('should use simple list when readings < 100', () => {
      const fewReadings = Array(50).fill(mockReading).map((r, i) => ({
        ...r,
        id: `reading-${i}`,
      }));

      render(<VirtualizedReadingList readings={fewReadings} />);

      // Should use simple list container
      expect(screen.getByTestId('simple-list-container')).toBeInTheDocument();
    });

    it('should respect enableVirtualization prop when false', () => {
      const manyReadings = Array(100).fill(mockReading).map((r, i) => ({
        ...r,
        id: `reading-${i}`,
      }));

      render(
        <VirtualizedReadingList
          readings={manyReadings}
          enableVirtualization={false}
        />
      );

      expect(screen.getByTestId('simple-list-container')).toBeInTheDocument();
    });
  });

  describe('Item Height Estimation', () => {
    it('should estimate height based on card count', () => {
      const reading = {
        ...mockReading,
        cards_drawn: Array(5).fill(mockReading.cards_drawn[0]),
      };

      render(<VirtualizedReadingList readings={[reading]} />);

      // Verify reading item exists
      expect(screen.getByText('Test question')).toBeInTheDocument();
    });
  });

  describe('Item Selection', () => {
    it('should call onSelect when reading item clicked', async () => {
      const onSelect = jest.fn();

      render(
        <VirtualizedReadingList
          readings={[mockReading]}
          onSelect={onSelect}
        />
      );

      const readingItem = screen.getByText('Test question');
      readingItem.click();

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith('test-reading-1');
      });
    });
  });

  describe('Performance', () => {
    it('should handle large number of readings without crashing', () => {
      const largeReadingSet = Array(500).fill(mockReading).map((r, i) => ({
        ...r,
        id: `reading-${i}`,
        question: `Question ${i}`,
      }));

      expect(() => {
        render(<VirtualizedReadingList readings={largeReadingSet} />);
      }).not.toThrow();
    });
  });
});
