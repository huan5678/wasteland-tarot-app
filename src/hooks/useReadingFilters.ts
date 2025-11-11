'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';

/**
 * Filter criteria interface for reading history
 *
 * Requirements: 3.4, 3.5 (搜尋與篩選功能)
 */
export interface FilterCriteria {
  searchQuery?: string;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  categories?: string[];
  favoriteOnly?: boolean;
  archivedOnly?: boolean;
  spreadTypes?: string[];
}

/**
 * Zod validation schema for date range
 */
const dateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine(
  (data) => data.start <= data.end,
  {
    message: '開始日期必須早於或等於結束日期',
    path: ['start'],
  }
);

/**
 * useReadingFilters - Custom hook for managing reading filter state
 *
 * Features:
 * - React Hook Form integration
 * - Zod validation for date ranges
 * - URL query parameter persistence
 * - Filter state management
 *
 * Requirements: 3.4, 3.5, 6.4 (篩選狀態管理與 URL 持久化)
 */
export function useReadingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<Partial<FilterCriteria>>(() => {
    const initialFilters: Partial<FilterCriteria> = {};

    // Parse search query
    const search = searchParams.get('search');
    if (search) {
      initialFilters.searchQuery = search;
    }

    // Parse tags (comma-separated)
    const tags = searchParams.get('tags');
    if (tags) {
      initialFilters.tags = tags.split(',').filter(Boolean);
    }

    // Parse categories (comma-separated)
    const categories = searchParams.get('categories');
    if (categories) {
      initialFilters.categories = categories.split(',').filter(Boolean);
    }

    // Parse date range
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');
    if (dateStart && dateEnd) {
      try {
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        // Validate date range
        dateRangeSchema.parse({ start, end });
        initialFilters.dateRange = { start, end };
      } catch (error) {
        // Invalid date range, skip
        console.warn('Invalid date range in URL:', error);
      }
    }

    // Parse boolean filters
    const favoriteOnly = searchParams.get('favoriteOnly');
    if (favoriteOnly === 'true') {
      initialFilters.favoriteOnly = true;
    }

    const archivedOnly = searchParams.get('archivedOnly');
    if (archivedOnly === 'true') {
      initialFilters.archivedOnly = true;
    }

    // Parse spread types (comma-separated)
    const spreadTypes = searchParams.get('spreadTypes');
    if (spreadTypes) {
      initialFilters.spreadTypes = spreadTypes.split(',').filter(Boolean);
    }

    return initialFilters;
  });

  /**
   * Update URL query parameters based on current filters
   */
  const updateURL = useCallback((currentFilters: Partial<FilterCriteria>) => {
    const params = new URLSearchParams();

    // Add search query
    if (currentFilters.searchQuery) {
      params.set('search', currentFilters.searchQuery);
    }

    // Add tags
    if (currentFilters.tags && currentFilters.tags.length > 0) {
      params.set('tags', currentFilters.tags.join(','));
    }

    // Add categories
    if (currentFilters.categories && currentFilters.categories.length > 0) {
      params.set('categories', currentFilters.categories.join(','));
    }

    // Add date range
    if (currentFilters.dateRange) {
      params.set('dateStart', currentFilters.dateRange.start.toISOString().split('T')[0]);
      params.set('dateEnd', currentFilters.dateRange.end.toISOString().split('T')[0]);
    }

    // Add boolean filters
    if (currentFilters.favoriteOnly) {
      params.set('favoriteOnly', 'true');
    }

    if (currentFilters.archivedOnly) {
      params.set('archivedOnly', 'true');
    }

    // Add spread types
    if (currentFilters.spreadTypes && currentFilters.spreadTypes.length > 0) {
      params.set('spreadTypes', currentFilters.spreadTypes.join(','));
    }

    // Update URL with new query string
    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    router.push(newUrl);
  }, [router]);

  /**
   * Update filters and persist to URL
   */
  const updateFilters = useCallback((newFilters: Partial<FilterCriteria>) => {
    setFilters(newFilters);
    updateURL(newFilters);
  }, [updateURL]);

  /**
   * Set search query
   */
  const setSearchQuery = useCallback((query: string) => {
    const newFilters = { ...filters, searchQuery: query || undefined };
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  /**
   * Set tags
   */
  const setTags = useCallback((tags: string[]) => {
    const newFilters = { ...filters, tags: tags.length > 0 ? tags : undefined };
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  /**
   * Set categories
   */
  const setCategories = useCallback((categories: string[]) => {
    const newFilters = { ...filters, categories: categories.length > 0 ? categories : undefined };
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  /**
   * Set date range with validation
   */
  const setDateRange = useCallback((dateRange: { start: Date; end: Date } | undefined) => {
    if (dateRange) {
      // Validate date range
      try {
        dateRangeSchema.parse(dateRange);
        const newFilters = { ...filters, dateRange };
        updateFilters(newFilters);
      } catch (error) {
        // Validation failed, throw error
        throw new Error('開始日期必須早於或等於結束日期');
      }
    } else {
      const newFilters = { ...filters, dateRange: undefined };
      updateFilters(newFilters);
    }
  }, [filters, updateFilters]);

  /**
   * Toggle favorite filter
   */
  const toggleFavorite = useCallback(() => {
    const newFilters = { ...filters, favoriteOnly: !filters.favoriteOnly || undefined };
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  /**
   * Toggle archived filter
   */
  const toggleArchived = useCallback(() => {
    const newFilters = { ...filters, archivedOnly: !filters.archivedOnly || undefined };
    updateFilters(newFilters);
  }, [filters, updateFilters]);

  /**
   * Remove a specific filter
   */
  const removeFilter = useCallback((filterType: keyof FilterCriteria, value: any) => {
    const newFilters = { ...filters };

    if (filterType === 'tags' && Array.isArray(newFilters.tags)) {
      newFilters.tags = newFilters.tags.filter((t) => t !== value);
      if (newFilters.tags.length === 0) {
        newFilters.tags = undefined;
      }
    } else if (filterType === 'categories' && Array.isArray(newFilters.categories)) {
      newFilters.categories = newFilters.categories.filter((c) => c !== value);
      if (newFilters.categories.length === 0) {
        newFilters.categories = undefined;
      }
    } else if (filterType === 'spreadTypes' && Array.isArray(newFilters.spreadTypes)) {
      newFilters.spreadTypes = newFilters.spreadTypes.filter((s) => s !== value);
      if (newFilters.spreadTypes.length === 0) {
        newFilters.spreadTypes = undefined;
      }
    } else {
      // Remove scalar filters
      newFilters[filterType] = undefined;
    }

    updateFilters(newFilters);
  }, [filters, updateFilters]);

  /**
   * Clear all filters
   */
  const clearAll = useCallback(() => {
    updateFilters({});
  }, [updateFilters]);

  /**
   * Check if there are any active filters
   */
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.searchQuery ||
      (filters.tags && filters.tags.length > 0) ||
      (filters.categories && filters.categories.length > 0) ||
      filters.dateRange ||
      filters.favoriteOnly ||
      filters.archivedOnly ||
      (filters.spreadTypes && filters.spreadTypes.length > 0)
    );
  }, [filters]);

  return {
    filters,
    setSearchQuery,
    setTags,
    setCategories,
    setDateRange,
    toggleFavorite,
    toggleArchived,
    removeFilter,
    clearAll,
    hasActiveFilters,
  };
}
