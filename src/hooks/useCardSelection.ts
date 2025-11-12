/**
 * useCardSelection Hook
 *
 * Manages card selection state for tarot fan drawer:
 * - Track selected card indices
 * - Enforce maximum selection limit
 * - Prevent selection during drag
 * - Provide haptic feedback (mobile)
 * - Selection validation
 */

'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * Selection state and methods
 */
export interface CardSelectionState {
  /** Set of selected card indices */
  selected: Set<number>;

  /** Maximum number of cards that can be selected */
  maxSelections: number;

  /** Whether selection is confirmed */
  isConfirmed: boolean;

  /** Toggle card selection */
  toggleCard: (index: number) => void;

  /** Confirm selection (returns selected indices or null if invalid) */
  confirmSelection: () => number[] | null;

  /** Reset selection */
  reset: () => void;

  /** Check if a card is selected */
  isSelected: (index: number) => boolean;

  /** Check if max limit is reached */
  isMaxReached: boolean;

  /** Current selection count */
  count: number;
}

/**
 * Options for card selection hook
 */
export interface UseCardSelectionOptions {
  /** Maximum cards to select */
  maxSelections: number;

  /** Callback when selection changes */
  onSelectionChange?: (selected: Set<number>) => void;

  /** Callback when max limit is reached */
  onMaxReached?: () => void;

  /** Callback when selection is confirmed */
  onConfirm?: (indices: number[]) => void;

  /** Enable haptic feedback on mobile */
  enableHaptics?: boolean;
}

/**
 * Haptic feedback utility
 */
function triggerHaptic(pattern: number | number[] = 10) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Main hook for card selection management
 */
export function useCardSelection({
  maxSelections,
  onSelectionChange,
  onMaxReached,
  onConfirm,
  enableHaptics = true,
}: UseCardSelectionOptions): CardSelectionState {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isConfirmed, setIsConfirmed] = useState(false);
  const isDraggingRef = useRef(false);

  /**
   * Toggle card selection
   * - Add if under limit
   * - Remove if already selected
   * - Ignore if dragging or at max limit
   */
  const toggleCard = useCallback(
    (index: number) => {
      // Prevent selection during drag
      if (isDraggingRef.current) {
        return;
      }

      setSelected((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(index)) {
          // Deselect card
          newSet.delete(index);

          // Light haptic feedback for deselection
          if (enableHaptics) {
            triggerHaptic(5);
          }
        } else if (newSet.size < maxSelections) {
          // Select card (under limit)
          newSet.add(index);

          // Medium haptic feedback for selection
          if (enableHaptics) {
            triggerHaptic(10);
          }
        } else {
          // Max limit reached - double tap feedback
          if (enableHaptics) {
            triggerHaptic([10, 50, 10]);
          }

          // Notify callback
          onMaxReached?.();

          console.warn(`[useCardSelection] 已達到最大選擇數量: ${maxSelections}`);
          return prev; // No change
        }

        // Notify selection change
        onSelectionChange?.(newSet);

        return newSet;
      });
    },
    [maxSelections, enableHaptics, onSelectionChange, onMaxReached]
  );

  /**
   * Confirm selection
   * Returns selected indices if valid, null otherwise
   */
  const confirmSelection = useCallback(() => {
    if (selected.size !== maxSelections) {
      console.warn(
        `[useCardSelection] 無法確認: 已選 ${selected.size}/${maxSelections} 張`
      );
      return null;
    }

    // Mark as confirmed
    setIsConfirmed(true);

    // Strong haptic feedback for confirmation
    if (enableHaptics) {
      triggerHaptic([20, 50, 20]);
    }

    // Convert to sorted array
    const indices = Array.from(selected).sort((a, b) => a - b);

    // Notify callback
    onConfirm?.(indices);

    return indices;
  }, [selected, maxSelections, enableHaptics, onConfirm]);

  /**
   * Reset selection state
   */
  const reset = useCallback(() => {
    setSelected(new Set());
    setIsConfirmed(false);
    isDraggingRef.current = false;
  }, []);

  /**
   * Check if a card is selected
   */
  const isSelected = useCallback((index: number) => selected.has(index), [selected]);

  /**
   * Check if max limit is reached
   */
  const isMaxReached = selected.size >= maxSelections;

  return {
    selected,
    maxSelections,
    isConfirmed,
    toggleCard,
    confirmSelection,
    reset,
    isSelected,
    isMaxReached,
    count: selected.size,
  };
}

/**
 * Utility: Set drag state to prevent clicks during drag
 */
export function useDragPrevention() {
  const isDraggingRef = useRef(false);

  const setDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging;
  }, []);

  const isDragging = () => isDraggingRef.current;

  return { setDragging, isDragging };
}
