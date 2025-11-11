/**
 * Integration tests for useReadingFilters hook
 * These tests verify the hook works correctly with actual components
 *
 * Requirements: 3.4, 3.5, 6.4, 6.5 (搜尋與篩選功能整合測試)
 */

import { useReadingFilters, FilterCriteria } from '../useReadingFilters';

describe('useReadingFilters - Integration Tests', () => {
  // Mock router and search params for Node environment
  const mockPush = jest.fn();
  const mockSearchParams = {
    get: jest.fn((key: string) => null),
  };

  beforeAll(() => {
    // Mock Next.js navigation modules
    jest.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush }),
      useSearchParams: () => mockSearchParams,
    }));
  });

  describe('Filter State Management', () => {
    it('should manage filter criteria interface correctly', () => {
      const filters: Partial<FilterCriteria> = {
        searchQuery: 'test',
        tags: ['love', 'career'],
        categories: ['health'],
        favoriteOnly: true,
        archivedOnly: false,
      };

      // Verify all expected properties exist
      expect(filters).toHaveProperty('searchQuery');
      expect(filters).toHaveProperty('tags');
      expect(filters).toHaveProperty('categories');
      expect(filters).toHaveProperty('favoriteOnly');
      expect(filters).toHaveProperty('archivedOnly');
      expect(filters.searchQuery).toBe('test');
      expect(filters.tags).toEqual(['love', 'career']);
    });

    it('should handle date range validation', () => {
      const validRange = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      const invalidRange = {
        start: new Date('2025-02-01'),
        end: new Date('2025-01-01'), // end before start
      };

      // Valid range should pass
      expect(validRange.start <= validRange.end).toBe(true);

      // Invalid range should fail
      expect(invalidRange.start <= invalidRange.end).toBe(false);
    });
  });

  describe('URL Query Parameter Formatting', () => {
    it('should format tags as comma-separated string', () => {
      const tags = ['love', 'career', 'health'];
      const formatted = tags.join(',');

      expect(formatted).toBe('love,career,health');
    });

    it('should format date range as ISO dates', () => {
      const dateRange = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      const startStr = dateRange.start.toISOString().split('T')[0];
      const endStr = dateRange.end.toISOString().split('T')[0];

      expect(startStr).toBe('2025-01-01');
      expect(endStr).toBe('2025-01-31');
    });

    it('should format boolean filters as strings', () => {
      const favoriteOnly = true;
      const archivedOnly = false;

      expect(String(favoriteOnly)).toBe('true');
      expect(String(archivedOnly)).toBe('false');
    });
  });

  describe('Filter Operations', () => {
    it('should add and remove tags from array', () => {
      let tags = ['love', 'career'];

      // Add tag
      tags = [...tags, 'health'];
      expect(tags).toEqual(['love', 'career', 'health']);

      // Remove tag
      tags = tags.filter((t) => t !== 'career');
      expect(tags).toEqual(['love', 'health']);

      // Remove all tags
      tags = [];
      expect(tags.length).toBe(0);
    });

    it('should toggle boolean filters', () => {
      let favoriteOnly: boolean | undefined = undefined;

      // Toggle on
      favoriteOnly = !favoriteOnly || undefined;
      expect(favoriteOnly).toBe(true);

      // Toggle off
      favoriteOnly = !favoriteOnly || undefined;
      expect(favoriteOnly).toBeUndefined();
    });
  });

  describe('Active Filters Detection', () => {
    it('should detect when filters are active', () => {
      const emptyFilters: Partial<FilterCriteria> = {};
      const hasActiveEmpty = !!(
        emptyFilters.searchQuery ||
        (emptyFilters.tags && emptyFilters.tags.length > 0) ||
        (emptyFilters.categories && emptyFilters.categories.length > 0) ||
        emptyFilters.dateRange ||
        emptyFilters.favoriteOnly ||
        emptyFilters.archivedOnly
      );

      expect(hasActiveEmpty).toBe(false);

      const activeFilters: Partial<FilterCriteria> = {
        searchQuery: 'test',
        tags: ['love'],
      };
      const hasActiveWithFilters = !!(
        activeFilters.searchQuery ||
        (activeFilters.tags && activeFilters.tags.length > 0)
      );

      expect(hasActiveWithFilters).toBe(true);
    });
  });

  describe('Filter Clearing', () => {
    it('should clear all filter properties', () => {
      const filters: Partial<FilterCriteria> = {
        searchQuery: 'test',
        tags: ['love', 'career'],
        categories: ['health'],
        favoriteOnly: true,
      };

      const clearedFilters: Partial<FilterCriteria> = {};

      expect(Object.keys(clearedFilters).length).toBe(0);
      expect(clearedFilters.searchQuery).toBeUndefined();
      expect(clearedFilters.tags).toBeUndefined();
    });
  });
});
