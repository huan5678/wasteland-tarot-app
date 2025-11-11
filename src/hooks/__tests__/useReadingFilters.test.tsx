/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useReadingFilters } from '../useReadingFilters';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('useReadingFilters', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  describe('Initial State', () => {
    it('should initialize with empty filters', () => {
      const { result } = renderHook(() => useReadingFilters());

      expect(result.current.filters).toEqual({});
    });

    it('should initialize from URL query parameters', () => {
      const params = new URLSearchParams({
        tags: 'love,career',
        favoriteOnly: 'true',
      });
      (useSearchParams as jest.Mock).mockReturnValue(params);

      const { result } = renderHook(() => useReadingFilters());

      expect(result.current.filters).toEqual({
        tags: ['love', 'career'],
        favoriteOnly: true,
      });
    });

    it('should parse date range from URL', () => {
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';
      const params = new URLSearchParams({
        dateStart: startDate,
        dateEnd: endDate,
      });
      (useSearchParams as jest.Mock).mockReturnValue(params);

      const { result } = renderHook(() => useReadingFilters());

      expect(result.current.filters.dateRange).toEqual({
        start: new Date(startDate),
        end: new Date(endDate),
      });
    });
  });

  describe('Filter Updates', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setSearchQuery('test query');
      });

      expect(result.current.filters.searchQuery).toBe('test query');
    });

    it('should update tags', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setTags(['love', 'career']);
      });

      expect(result.current.filters.tags).toEqual(['love', 'career']);
    });

    it('should update categories', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setCategories(['health', 'survival']);
      });

      expect(result.current.filters.categories).toEqual(['health', 'survival']);
    });

    it('should update date range', () => {
      const { result } = renderHook(() => useReadingFilters());
      const dateRange = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      act(() => {
        result.current.setDateRange(dateRange);
      });

      expect(result.current.filters.dateRange).toEqual(dateRange);
    });

    it('should toggle favorite filter', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.toggleFavorite();
      });

      expect(result.current.filters.favoriteOnly).toBe(true);

      act(() => {
        result.current.toggleFavorite();
      });

      expect(result.current.filters.favoriteOnly).toBe(false);
    });

    it('should toggle archived filter', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.toggleArchived();
      });

      expect(result.current.filters.archivedOnly).toBe(true);

      act(() => {
        result.current.toggleArchived();
      });

      expect(result.current.filters.archivedOnly).toBe(false);
    });
  });

  describe('Remove Filters', () => {
    it('should remove single tag', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setTags(['love', 'career', 'health']);
      });

      act(() => {
        result.current.removeFilter('tags', 'career');
      });

      expect(result.current.filters.tags).toEqual(['love', 'health']);
    });

    it('should remove single category', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setCategories(['health', 'survival']);
      });

      act(() => {
        result.current.removeFilter('categories', 'health');
      });

      expect(result.current.filters.categories).toEqual(['survival']);
    });

    it('should remove date range', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setDateRange({
          start: new Date('2025-01-01'),
          end: new Date('2025-01-31'),
        });
      });

      act(() => {
        result.current.removeFilter('dateRange', null);
      });

      expect(result.current.filters.dateRange).toBeUndefined();
    });

    it('should remove boolean filters', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.toggleFavorite();
      });

      act(() => {
        result.current.removeFilter('favoriteOnly', false);
      });

      expect(result.current.filters.favoriteOnly).toBeUndefined();
    });
  });

  describe('Clear All Filters', () => {
    it('should clear all active filters', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setSearchQuery('test');
        result.current.setTags(['love', 'career']);
        result.current.setCategories(['health']);
        result.current.toggleFavorite();
      });

      expect(result.current.filters).not.toEqual({});

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.filters).toEqual({});
    });
  });

  describe('URL Persistence', () => {
    it('should update URL when filters change', async () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setTags(['love', 'career']);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('tags=love%2Ccareer')
        );
      });
    });

    it('should update URL when search query changes', async () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setSearchQuery('test query');
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('search=test+query')
        );
      });
    });

    it('should remove parameters from URL when filters cleared', async () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setTags(['love']);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      mockPush.mockClear();

      act(() => {
        result.current.clearAll();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.not.stringContaining('tags=')
        );
      });
    });
  });

  describe('Has Active Filters', () => {
    it('should return false when no filters active', () => {
      const { result } = renderHook(() => useReadingFilters());

      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('should return true when tags are active', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setTags(['love']);
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should return true when search query is active', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.setSearchQuery('test');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should return true when favorite filter is active', () => {
      const { result } = renderHook(() => useReadingFilters());

      act(() => {
        result.current.toggleFavorite();
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe('Filter Validation', () => {
    it('should validate date range (start must be before end)', () => {
      const { result } = renderHook(() => useReadingFilters());

      const invalidRange = {
        start: new Date('2025-02-01'),
        end: new Date('2025-01-01'), // end before start
      };

      act(() => {
        try {
          result.current.setDateRange(invalidRange);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.filters.dateRange).toBeUndefined();
    });

    it('should allow valid date range', () => {
      const { result } = renderHook(() => useReadingFilters());

      const validRange = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      act(() => {
        result.current.setDateRange(validRange);
      });

      expect(result.current.filters.dateRange).toEqual(validRange);
    });
  });
});
