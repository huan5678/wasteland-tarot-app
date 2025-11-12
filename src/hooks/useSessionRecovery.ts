/**
 * useSessionRecovery Hook
 *
 * Provides session recovery functionality for incomplete readings:
 * - Stores drawing state in sessionStorage
 * - Detects incomplete readings on page load
 * - Provides restore and clear operations
 * - Auto-expires after 24 hours
 *
 * Requirements: 1.10
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { CardWithPosition } from '@/components/tarot/InteractiveCardDraw';

/**
 * Saved reading state structure
 *
 * IMPORTANT: Only store minimal data to avoid QuotaExceededError
 * - Store IDs instead of full card objects
 * - Store only position info (upright/reversed) for revealed cards
 */
export interface SavedReadingState {
  spreadType: string;
  drawingState: 'idle' | 'shuffling' | 'selecting' | 'flipping' | 'complete';
  shuffledDeckIds: Array<string | number>; // Only card IDs
  revealedCards: Array<{
    index: number;
    position: 'upright' | 'reversed';
  }>; // Only position info for revealed cards
  timestamp: number;
}

/**
 * Session recovery hook return type
 */
export interface UseSessionRecoveryReturn {
  /** Whether there is an incomplete reading saved */
  hasIncompleteReading: boolean;

  /** The saved state (if any) */
  savedState: SavedReadingState | null;

  /** Save current reading state */
  saveState: (state: Omit<SavedReadingState, 'timestamp'>) => void;

  /** Restore saved state and clear from storage */
  restoreState: () => SavedReadingState | null;

  /** Clear saved state without restoring */
  clearState: () => void;
}

/**
 * Session expiration time (24 hours in milliseconds)
 */
const SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Generate storage key for a reading session
 */
function getStorageKey(readingId: string): string {
  return `incomplete-reading-${readingId}`;
}

/**
 * Validate saved state structure
 */
function isValidSavedState(data: any): data is SavedReadingState {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.spreadType === 'string' &&
    typeof data.drawingState === 'string' &&
    Array.isArray(data.shuffledDeckIds) &&
    Array.isArray(data.revealedCards) &&
    typeof data.timestamp === 'number'
  );
}

/**
 * Check if saved state is expired
 */
function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > SESSION_EXPIRATION_MS;
}

/**
 * useSessionRecovery Hook
 *
 * Main hook for managing session recovery
 */
export function useSessionRecovery(readingId: string): UseSessionRecoveryReturn {
  const [savedState, setSavedState] = useState<SavedReadingState | null>(null);
  const [hasIncompleteReading, setHasIncompleteReading] = useState(false);

  const storageKey = getStorageKey(readingId);

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem(storageKey);

      if (!savedData) {
        return;
      }

      const parsed = JSON.parse(savedData);

      // Validate structure
      if (!isValidSavedState(parsed)) {
        console.warn('[useSessionRecovery] Invalid saved state structure, clearing');
        sessionStorage.removeItem(storageKey);
        return;
      }

      // Check expiration
      if (isExpired(parsed.timestamp)) {
        console.log('[useSessionRecovery] Saved state expired, clearing');
        sessionStorage.removeItem(storageKey);
        return;
      }

      // Valid saved state found
      setSavedState(parsed);
      setHasIncompleteReading(true);
    } catch (error) {
      console.error('[useSessionRecovery] Error loading saved state:', error);
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  /**
   * Save current reading state to sessionStorage
   */
  const saveState = useCallback(
    (state: Omit<SavedReadingState, 'timestamp'>) => {
      try {
        const stateToSave: SavedReadingState = {
          ...state,
          timestamp: Date.now(),
        };

        const serialized = JSON.stringify(stateToSave);

        // Check size before saving (warn if > 100KB)
        const sizeInKB = new Blob([serialized]).size / 1024;
        if (sizeInKB > 100) {
          console.warn(`[useSessionRecovery] Large state size: ${sizeInKB.toFixed(2)}KB`);
          console.warn('[useSessionRecovery] State content:', stateToSave);
        }

        sessionStorage.setItem(storageKey, serialized);
        setSavedState(stateToSave);
        setHasIncompleteReading(true);
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.error('[useSessionRecovery] Storage quota exceeded!');
          console.error('[useSessionRecovery] Clearing ALL sessionStorage to free up space...');

          // Clear entire sessionStorage (more aggressive)
          sessionStorage.clear();

          // Try saving again with empty storage
          try {
            const serialized = JSON.stringify(stateToSave);
            sessionStorage.setItem(storageKey, serialized);
            setSavedState(stateToSave);
            setHasIncompleteReading(true);
            console.log('[useSessionRecovery] Successfully saved after clearing storage');
          } catch (retryError) {
            console.error('[useSessionRecovery] Still failed after clearing. State too large:', retryError);
            setHasIncompleteReading(false);
            setSavedState(null);
          }
        } else {
          console.error('[useSessionRecovery] Error saving state:', error);
        }
      }
    },
    [storageKey]
  );

  /**
   * Restore saved state and clear from storage
   */
  const restoreState = useCallback((): SavedReadingState | null => {
    if (!savedState) {
      return null;
    }

    // Clear from storage after restoring
    try {
      sessionStorage.removeItem(storageKey);
      setHasIncompleteReading(false);
      setSavedState(null);

      return savedState;
    } catch (error) {
      console.error('[useSessionRecovery] Error clearing state:', error);
      return savedState;
    }
  }, [savedState, storageKey]);

  /**
   * Clear saved state without restoring
   */
  const clearState = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
      setHasIncompleteReading(false);
      setSavedState(null);
    } catch (error) {
      console.error('[useSessionRecovery] Error clearing state:', error);
    }
  }, [storageKey]);

  return {
    hasIncompleteReading,
    savedState,
    saveState,
    restoreState,
    clearState,
  };
}
