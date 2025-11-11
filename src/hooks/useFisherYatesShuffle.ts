/**
 * Fisher-Yates Shuffle Algorithm
 *
 * Implements the Fisher-Yates (Durstenfeld optimization) shuffle algorithm
 * for unbiased, efficient array shuffling.
 *
 * Time Complexity: O(n)
 * Space Complexity: O(1) for in-place, O(n) for immutable
 *
 * Mathematical Guarantee: Every permutation has equal probability (1/n!)
 *
 * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 */

/**
 * Core Fisher-Yates shuffle implementation (Durstenfeld optimization).
 *
 * This is a pure function that shuffles an array in-place.
 *
 * Algorithm:
 * 1. Start from the last element
 * 2. Pick a random index from 0 to current index (inclusive)
 * 3. Swap current element with the randomly selected element
 * 4. Move to the previous element and repeat
 *
 * This ensures O(n) time complexity and uniform distribution.
 *
 * @param array - The array to shuffle in-place
 */
function fisherYatesShuffle<T>(array: T[]): void {
  // Handle empty array or single element (no shuffling needed)
  if (array.length <= 1) {
    return;
  }

  // Durstenfeld optimization: iterate backwards
  for (let i = array.length - 1; i > 0; i--) {
    // Pick random index from 0 to i (inclusive)
    // Using Math.floor(Math.random() * (i + 1)) ensures uniform distribution
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements using destructuring (cleaner than temp variable)
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Shuffles an array and returns a new shuffled array (immutable).
 * The original array is not modified.
 *
 * @param array - The array to shuffle
 * @returns A new shuffled array
 *
 * @example
 * ```ts
 * const original = [1, 2, 3, 4, 5];
 * const shuffled = shuffle(original);
 * // original remains [1, 2, 3, 4, 5]
 * // shuffled is a new shuffled array
 * ```
 */
export function shuffle<T>(array: T[]): T[] {
  // Create a copy to avoid mutating the original
  const arrayCopy = [...array];

  // Shuffle the copy
  fisherYatesShuffle(arrayCopy);

  return arrayCopy;
}

/**
 * Shuffles an array in-place (mutable).
 * The original array is modified directly.
 *
 * @param array - The array to shuffle in-place
 *
 * @example
 * ```ts
 * const deck = [1, 2, 3, 4, 5];
 * shuffleInPlace(deck);
 * // deck is now shuffled in-place
 * ```
 */
export function shuffleInPlace<T>(array: T[]): void {
  fisherYatesShuffle(array);
}

/**
 * Custom hook for Fisher-Yates shuffle algorithm.
 *
 * Provides two shuffle variants:
 * - `shuffle`: Returns a new shuffled array (immutable)
 * - `shuffleInPlace`: Modifies the array directly (mutable)
 *
 * This is a simple wrapper around the pure functions above.
 * Since the functions are pure and stateless, using a hook is optional.
 * You can import the pure functions directly if preferred.
 *
 * @example
 * ```tsx
 * const { shuffle, shuffleInPlace } = useFisherYatesShuffle();
 *
 * // Immutable shuffle
 * const original = [1, 2, 3, 4, 5];
 * const shuffled = shuffle(original);
 * // original remains [1, 2, 3, 4, 5]
 *
 * // Mutable shuffle
 * const deck = [1, 2, 3, 4, 5];
 * shuffleInPlace(deck);
 * // deck is now shuffled in-place
 * ```
 */
export function useFisherYatesShuffle() {
  // Since shuffle and shuffleInPlace are pure functions,
  // we can return them directly without useCallback.
  // They don't depend on any component state or props.
  return {
    shuffle,
    shuffleInPlace,
  };
}
