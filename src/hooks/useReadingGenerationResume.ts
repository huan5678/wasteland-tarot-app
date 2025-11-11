import { useState, useEffect, useCallback } from 'react';

interface SavedReadingData {
  text: string;
  timestamp: number;
}

export interface UseReadingGenerationResumeOptions {
  /**
   * Unique reading ID to track the session
   */
  readingId: string;

  /**
   * Whether to enable session recovery
   */
  enabled: boolean;

  /**
   * Expiration time in hours (default: 24)
   */
  expirationHours?: number;

  /**
   * Callback when resume is available
   */
  onResumeAvailable?: (savedText: string) => void;
}

export interface UseReadingGenerationResumeReturn {
  /**
   * Whether there's an incomplete reading session
   */
  hasIncompleteReading: boolean;

  /**
   * Saved text from previous session (if any)
   */
  savedText: string | null;

  /**
   * Position to resume from (character index)
   */
  resumeFromPosition: number;

  /**
   * Last saved position (character index)
   */
  lastSavedPosition: number;

  /**
   * Save current progress
   */
  saveProgress: (currentText: string) => void;

  /**
   * Clear saved progress
   */
  clearProgress: () => void;
}

const STORAGE_PREFIX = 'reading-generation-';
const DEFAULT_EXPIRATION_HOURS = 24;

/**
 * Hook to manage reading generation session recovery
 *
 * @example
 * ```tsx
 * const {
 *   hasIncompleteReading,
 *   savedText,
 *   resumeFromPosition,
 *   saveProgress,
 *   clearProgress,
 * } = useReadingGenerationResume({
 *   readingId: reading.id,
 *   enabled: isStreaming && !isComplete,
 *   onResumeAvailable: (text) => {
 *     showNotification('繼續未完成的解讀...');
 *   },
 * });
 * ```
 */
export function useReadingGenerationResume({
  readingId,
  enabled,
  expirationHours = DEFAULT_EXPIRATION_HOURS,
  onResumeAvailable,
}: UseReadingGenerationResumeOptions): UseReadingGenerationResumeReturn {
  const [hasIncompleteReading, setHasIncompleteReading] = useState(false);
  const [savedText, setSavedText] = useState<string | null>(null);
  const [lastSavedPosition, setLastSavedPosition] = useState(0);

  const storageKey = `${STORAGE_PREFIX}${readingId}`;

  // Restore saved progress on mount
  useEffect(() => {
    if (!enabled) {
      return;
    }

    try {
      const stored = sessionStorage.getItem(storageKey);
      if (!stored) {
        return;
      }

      const data: SavedReadingData = JSON.parse(stored);

      // Validate data structure
      if (!data.text || typeof data.text !== 'string' || !data.timestamp) {
        sessionStorage.removeItem(storageKey);
        return;
      }

      // Check expiration
      const expirationMs = expirationHours * 60 * 60 * 1000;
      const age = Date.now() - data.timestamp;

      if (age > expirationMs) {
        // Expired - clear storage
        sessionStorage.removeItem(storageKey);
        return;
      }

      // Valid saved data
      setSavedText(data.text);
      setLastSavedPosition(data.text.length);
      setHasIncompleteReading(true);

      // Notify callback
      onResumeAvailable?.(data.text);
    } catch (error) {
      console.error('Failed to restore reading progress:', error);
      // Clear corrupted data
      sessionStorage.removeItem(storageKey);
    }
  }, [readingId, enabled, expirationHours, storageKey, onResumeAvailable]);

  const saveProgress = useCallback(
    (currentText: string) => {
      if (!enabled) {
        return;
      }

      try {
        const data: SavedReadingData = {
          text: currentText,
          timestamp: Date.now(),
        };

        sessionStorage.setItem(storageKey, JSON.stringify(data));
        setLastSavedPosition(currentText.length);
      } catch (error) {
        console.error('Failed to save reading progress:', error);
      }
    },
    [enabled, storageKey]
  );

  const clearProgress = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      setSavedText(null);
      setLastSavedPosition(0);
      setHasIncompleteReading(false);
    } catch (error) {
      console.error('Failed to clear reading progress:', error);
    }
  }, [storageKey]);

  return {
    hasIncompleteReading,
    savedText,
    resumeFromPosition: savedText?.length ?? 0,
    lastSavedPosition,
    saveProgress,
    clearProgress,
  };
}
