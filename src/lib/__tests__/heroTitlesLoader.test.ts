/**
 * Hero Titles Loader 測試
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { validateHeroTitles, loadHeroTitles, filterEnabledTitles } from '../heroTitlesLoader';
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
});
