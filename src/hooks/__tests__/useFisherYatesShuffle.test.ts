import { describe, it, expect } from 'bun:test';
import { shuffle, shuffleInPlace, useFisherYatesShuffle } from '../useFisherYatesShuffle';

describe('Fisher-Yates Shuffle Algorithm', () => {
  describe('shuffle (immutable)', () => {
    it('should return a new array and preserve original array', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];

      const shuffled = shuffle(original);

      // Original array should be unchanged
      expect(original).toEqual(originalCopy);
      // Shuffled should be a different array reference
      expect(shuffled).not.toBe(original);
    });

    it('should preserve array length', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const shuffled = shuffle(array);

      expect(shuffled.length).toBe(array.length);
    });

    it('should preserve all elements', () => {
      const array = [1, 2, 3, 4, 5];

      const shuffled = shuffle(array);

      // All elements should exist in shuffled array
      expect(shuffled.sort()).toEqual([...array].sort());
    });

    it('should handle empty array', () => {
      const array: number[] = [];

      const shuffled = shuffle(array);

      expect(shuffled).toEqual([]);
    });

    it('should handle single element array', () => {
      const array = [42];

      const shuffled = shuffle(array);

      expect(shuffled).toEqual([42]);
    });

    it('should handle array with duplicate elements', () => {
      const array = ['a', 'b', 'a', 'c', 'b'];

      const shuffled = shuffle(array);

      expect(shuffled.length).toBe(5);
      expect(shuffled.sort()).toEqual(['a', 'a', 'b', 'b', 'c']);
    });

    it('should produce different results on multiple shuffles (probabilistic)', () => {
      const array = [1, 2, 3, 4, 5];
      const results = new Set<string>();

      // Run shuffle 100 times
      for (let i = 0; i < 100; i++) {
        const shuffled = shuffle(array);
        results.add(JSON.stringify(shuffled));
      }

      // With 5 elements, we should get multiple different permutations
      // (5! = 120 possible permutations)
      // Getting at least 20 different results in 100 tries is reasonable
      expect(results.size).toBeGreaterThan(20);
    });
  });

  describe('shuffleInPlace (mutable)', () => {
    it('should modify the original array', () => {
      const array = [1, 2, 3, 4, 5];
      const originalReference = array;

      shuffleInPlace(array);

      // Same reference
      expect(array).toBe(originalReference);
    });

    it('should preserve array length', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const originalLength = array.length;

      shuffleInPlace(array);

      expect(array.length).toBe(originalLength);
    });

    it('should preserve all elements', () => {
      const array = [1, 2, 3, 4, 5];
      const sortedOriginal = [...array].sort();

      shuffleInPlace(array);

      expect([...array].sort()).toEqual(sortedOriginal);
    });

    it('should handle empty array', () => {
      const array: number[] = [];

      expect(() => shuffleInPlace(array)).not.toThrow();
      expect(array).toEqual([]);
    });

    it('should handle single element array', () => {
      const array = [42];

      shuffleInPlace(array);

      expect(array).toEqual([42]);
    });
  });

  describe('distribution uniformity (mathematical correctness)', () => {
    it('should produce roughly uniform distribution across positions', () => {
      const array = [1, 2, 3];
      const iterations = 10000;

      // Track how often each element appears in each position
      const positionCounts: Record<number, Record<number, number>> = {
        1: { 0: 0, 1: 0, 2: 0 },
        2: { 0: 0, 1: 0, 2: 0 },
        3: { 0: 0, 1: 0, 2: 0 },
      };

      for (let i = 0; i < iterations; i++) {
        const shuffled = shuffle(array);
        shuffled.forEach((value, position) => {
          positionCounts[value][position]++;
        });
      }

      // Each element should appear in each position roughly 1/3 of the time
      // With 10000 iterations, we expect ~3333 per position
      // Allow 10% deviation (±333)
      const expected = iterations / 3;
      const tolerance = expected * 0.1;

      Object.values(positionCounts).forEach(positions => {
        Object.values(positions).forEach(count => {
          expect(count).toBeGreaterThan(expected - tolerance);
          expect(count).toBeLessThan(expected + tolerance);
        });
      });
    });
  });

  describe('type safety', () => {
    it('should work with different data types', () => {
      // Numbers
      const numbers = [1, 2, 3];
      const shuffledNumbers = shuffle(numbers);
      expect(shuffledNumbers).toHaveLength(3);

      // Strings
      const strings = ['a', 'b', 'c'];
      const shuffledStrings = shuffle(strings);
      expect(shuffledStrings).toHaveLength(3);

      // Objects
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const shuffledObjects = shuffle(objects);
      expect(shuffledObjects).toHaveLength(3);
    });
  });

  describe('useFisherYatesShuffle hook', () => {
    it('should provide shuffle and shuffleInPlace functions', () => {
      const { shuffle: hookShuffle, shuffleInPlace: hookShuffleInPlace } = useFisherYatesShuffle();

      expect(typeof hookShuffle).toBe('function');
      expect(typeof hookShuffleInPlace).toBe('function');
    });

    it('hook shuffle should work correctly', () => {
      const { shuffle: hookShuffle } = useFisherYatesShuffle();
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];

      const shuffled = hookShuffle(original);

      expect(original).toEqual(originalCopy);
      expect(shuffled).toHaveLength(5);
    });

    it('hook shuffleInPlace should work correctly', () => {
      const { shuffleInPlace: hookShuffleInPlace } = useFisherYatesShuffle();
      const array = [1, 2, 3, 4, 5];
      const sortedOriginal = [...array].sort();

      hookShuffleInPlace(array);

      expect([...array].sort()).toEqual(sortedOriginal);
    });
  });
});
