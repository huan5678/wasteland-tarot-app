/**
 * Hero Titles Loader 測試
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { validateHeroTitles, loadHeroTitles, filterEnabledTitles, getRandomTitles } from '../heroTitlesLoader';
import type { HeroTitlesCollection } from '@/types/hero';
import { FALLBACK_TITLE } from '@/types/hero';

describe('heroTitlesLoader', () => {
  describe('validateHeroTitles', () => {
    it('should validate correct data structure', () => {
      const validData: HeroTitlesCollection = {
        version: '1.0.0',
        titles: [
          {
            id: 'test-1',
            title: 'Test Title',
            subtitle: 'Test Subtitle',
            description: 'Test Description',
            enabled: true,
          },
        ],
      };

      const result = validateHeroTitles(validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for null data', () => {
      expect(() => validateHeroTitles(null)).toThrow('Invalid JSON structure');
    });

    it('should throw error for non-object data', () => {
      expect(() => validateHeroTitles('string')).toThrow('Invalid JSON structure');
    });

    it('should throw error for missing titles array', () => {
      const invalidData = { version: '1.0.0' };
      expect(() => validateHeroTitles(invalidData)).toThrow('titles array is required');
    });

    it('should throw error for empty titles array', () => {
      const invalidData = { version: '1.0.0', titles: [] };
      expect(() => validateHeroTitles(invalidData)).toThrow('titles array is required and must not be empty');
    });

    it('should throw error for missing required field', () => {
      const invalidData = {
        version: '1.0.0',
        titles: [
          {
            id: 'test-1',
            title: 'Test Title',
            // missing subtitle
            description: 'Test Description',
            enabled: true,
          },
        ],
      };

      expect(() => validateHeroTitles(invalidData)).toThrow('subtitle is required');
    });

    it('should throw error for empty string field', () => {
      const invalidData = {
        version: '1.0.0',
        titles: [
          {
            id: '',
            title: 'Test Title',
            subtitle: 'Test Subtitle',
            description: 'Test Description',
            enabled: true,
          },
        ],
      };

      expect(() => validateHeroTitles(invalidData)).toThrow('id is required and must be a non-empty string');
    });

    it('should default enabled to true if missing', () => {
      const dataWithoutEnabled = {
        version: '1.0.0',
        titles: [
          {
            id: 'test-1',
            title: 'Test Title',
            subtitle: 'Test Subtitle',
            description: 'Test Description',
          },
        ],
      };

      const result = validateHeroTitles(dataWithoutEnabled);
      expect(result.titles[0].enabled).toBe(true);
    });
  });

  describe('loadHeroTitles', () => {
    beforeEach(() => {
      // 清除所有 mock
      jest.clearAllMocks();
    });

    it('should load and validate JSON successfully', async () => {
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              version: '1.0.0',
              titles: [
                {
                  id: 'test-1',
                  title: 'Test Title',
                  subtitle: 'Test Subtitle',
                  description: 'Test Description',
                  enabled: true,
                },
              ],
            }),
        })
      ) as jest.Mock;

      const result = await loadHeroTitles();

      expect(result.titles).toHaveLength(1);
      expect(result.titles[0].id).toBe('test-1');
    });

    it('should return fallback on network error', async () => {
      // Mock fetch failure
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

      const result = await loadHeroTitles();

      expect(result.titles).toHaveLength(1);
      expect(result.titles[0]).toEqual(FALLBACK_TITLE);
    });

    it('should return fallback on HTTP error', async () => {
      // Mock HTTP error
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Not Found',
        })
      ) as jest.Mock;

      const result = await loadHeroTitles();

      expect(result.titles).toHaveLength(1);
      expect(result.titles[0]).toEqual(FALLBACK_TITLE);
    });

    it('should return fallback on JSON parse error', async () => {
      // Mock JSON parse error
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON')),
        })
      ) as jest.Mock;

      const result = await loadHeroTitles();

      expect(result.titles).toHaveLength(1);
      expect(result.titles[0]).toEqual(FALLBACK_TITLE);
    });

    it('should return fallback on validation error', async () => {
      // Mock invalid data structure
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              version: '1.0.0',
              titles: [], // Empty array will fail validation
            }),
        })
      ) as jest.Mock;

      const result = await loadHeroTitles();

      expect(result.titles).toHaveLength(1);
      expect(result.titles[0]).toEqual(FALLBACK_TITLE);
    });
  });

  describe('filterEnabledTitles', () => {
    it('should filter only enabled titles', () => {
      const collection: HeroTitlesCollection = {
        version: '1.0.0',
        titles: [
          {
            id: 'test-1',
            title: 'Enabled Title',
            subtitle: 'Subtitle',
            description: 'Description',
            enabled: true,
          },
          {
            id: 'test-2',
            title: 'Disabled Title',
            subtitle: 'Subtitle',
            description: 'Description',
            enabled: false,
          },
          {
            id: 'test-3',
            title: 'Another Enabled Title',
            subtitle: 'Subtitle',
            description: 'Description',
            enabled: true,
          },
        ],
      };

      const result = filterEnabledTitles(collection);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-1');
      expect(result[1].id).toBe('test-3');
    });

    it('should return empty array if no titles are enabled', () => {
      const collection: HeroTitlesCollection = {
        version: '1.0.0',
        titles: [
          {
            id: 'test-1',
            title: 'Disabled Title',
            subtitle: 'Subtitle',
            description: 'Description',
            enabled: false,
          },
        ],
      };

      const result = filterEnabledTitles(collection);
      expect(result).toHaveLength(0);
    });
  });

  describe('getRandomTitles', () => {
    it('should return requested number of items when array is larger', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      const result = getRandomTitles(items, 10);

      expect(result).toHaveLength(10);
      // All items should be from original array
      result.forEach(item => {
        expect(items).toContain(item);
      });
      // All items should be unique
      expect(new Set(result).size).toBe(10);
    });

    it('should return all items shuffled when array is smaller than requested count', () => {
      const items = [1, 2, 3, 4, 5];
      const result = getRandomTitles(items, 10);

      expect(result).toHaveLength(5);
      // All original items should be in result
      items.forEach(item => {
        expect(result).toContain(item);
      });
    });

    it('should return all items shuffled when array equals requested count', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = getRandomTitles(items, 10);

      expect(result).toHaveLength(10);
      // All original items should be in result
      items.forEach(item => {
        expect(result).toContain(item);
      });
    });

    it('should not modify original array', () => {
      const items = [1, 2, 3, 4, 5];
      const originalCopy = [...items];

      getRandomTitles(items, 3);

      expect(items).toEqual(originalCopy);
    });

    it('should return different results on multiple calls (randomness)', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      const result1 = getRandomTitles(items, 10);
      const result2 = getRandomTitles(items, 10);

      // Note: There's a very small chance they could be the same, but extremely unlikely
      // with 20 items choosing 10
      expect(result1).not.toEqual(result2);
    });

    it('should work with HeroTitle objects', () => {
      const titles: HeroTitlesCollection = {
        version: '1.0.0',
        titles: [
          { id: 'test-1', title: 'Title 1', subtitle: 'Sub 1', description: 'Desc 1', enabled: true },
          { id: 'test-2', title: 'Title 2', subtitle: 'Sub 2', description: 'Desc 2', enabled: true },
          { id: 'test-3', title: 'Title 3', subtitle: 'Sub 3', description: 'Desc 3', enabled: true },
          { id: 'test-4', title: 'Title 4', subtitle: 'Sub 4', description: 'Desc 4', enabled: true },
          { id: 'test-5', title: 'Title 5', subtitle: 'Sub 5', description: 'Desc 5', enabled: true },
        ],
      };

      const result = getRandomTitles(titles.titles, 3);

      expect(result).toHaveLength(3);
      // All selected titles should be from original array
      result.forEach(title => {
        expect(titles.titles.some(t => t.id === title.id)).toBe(true);
      });
    });

    it('should handle empty array', () => {
      const items: number[] = [];
      const result = getRandomTitles(items, 10);

      expect(result).toHaveLength(0);
    });

    it('should handle single item array', () => {
      const items = [1];
      const result = getRandomTitles(items, 5);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(1);
    });
  });
});
