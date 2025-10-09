/**
 * Hero 型別定義測試
 */

import { describe, it, expect } from '@jest/globals';
import type { HeroTitle, HeroTitlesCollection } from '../hero';
import { FALLBACK_TITLE } from '../hero';
import heroTitlesData from '@/data/heroTitles.json';

describe('Hero Types', () => {
  describe('FALLBACK_TITLE', () => {
    it('should have all required fields', () => {
      expect(FALLBACK_TITLE).toHaveProperty('id');
      expect(FALLBACK_TITLE).toHaveProperty('title');
      expect(FALLBACK_TITLE).toHaveProperty('subtitle');
      expect(FALLBACK_TITLE).toHaveProperty('description');
      expect(FALLBACK_TITLE).toHaveProperty('enabled');
    });

    it('should be enabled by default', () => {
      expect(FALLBACK_TITLE.enabled).toBe(true);
    });

    it('should have non-empty string fields', () => {
      expect(FALLBACK_TITLE.id).toBeTruthy();
      expect(FALLBACK_TITLE.title).toBeTruthy();
      expect(FALLBACK_TITLE.subtitle).toBeTruthy();
      expect(FALLBACK_TITLE.description).toBeTruthy();
    });
  });

  describe('heroTitles.json', () => {
    it('should conform to HeroTitlesCollection interface', () => {
      const data = heroTitlesData as HeroTitlesCollection;

      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('titles');
      expect(Array.isArray(data.titles)).toBe(true);
    });

    it('should have at least 5 titles', () => {
      const data = heroTitlesData as HeroTitlesCollection;
      expect(data.titles.length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid title objects', () => {
      const data = heroTitlesData as HeroTitlesCollection;

      data.titles.forEach((title: HeroTitle, index: number) => {
        expect(title.id).toBeTruthy();
        expect(typeof title.id).toBe('string');
        expect(title.title).toBeTruthy();
        expect(typeof title.title).toBe('string');
        expect(title.subtitle).toBeTruthy();
        expect(typeof title.subtitle).toBe('string');
        expect(title.description).toBeTruthy();
        expect(typeof title.description).toBe('string');
        expect(typeof title.enabled).toBe('boolean');
      });
    });

    it('should have defaultConfig with correct types', () => {
      const data = heroTitlesData as HeroTitlesCollection;

      if (data.defaultConfig) {
        if (data.defaultConfig.typingSpeed !== undefined) {
          expect(typeof data.defaultConfig.typingSpeed).toBe('number');
        }
        if (data.defaultConfig.autoPlayInterval !== undefined) {
          expect(typeof data.defaultConfig.autoPlayInterval).toBe('number');
        }
      }
    });

    it('should have unique IDs', () => {
      const data = heroTitlesData as HeroTitlesCollection;
      const ids = data.titles.map((t: HeroTitle) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
