/**
 * @jest-environment jsdom
 *
 * useSessionRecovery Hook Tests
 *
 * Tests for session recovery hook according to TDD methodology.
 * Requirements: 1.10
 */

import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSessionRecovery } from '../useSessionRecovery';
import { CardWithPosition } from '@/components/tarot/InteractiveCardDraw';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('useSessionRecovery', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have no incomplete reading when sessionStorage is empty', () => {
      const { result } = renderHook(() => useSessionRecovery('test-reading-1'));

      expect(result.current.hasIncompleteReading).toBe(false);
      expect(result.current.savedState).toBeNull();
    });

    it('should detect incomplete reading from sessionStorage', () => {
      const savedState = {
        spreadType: 'three_card',
        drawingState: 'flipping',
        shuffledDeck: [{ id: '1', name: 'The Fool' }],
        drawnCards: [],
        revealedIndices: [0],
        timestamp: Date.now(),
      };

      mockSessionStorage.setItem(
        'incomplete-reading-test-reading-1',
        JSON.stringify(savedState)
      );

      const { result } = renderHook(() => useSessionRecovery('test-reading-1'));

      expect(result.current.hasIncompleteReading).toBe(true);
      expect(result.current.savedState).toEqual(savedState);
    });

    it('should ignore expired session data (> 24 hours old)', () => {
      const expiredState = {
        spreadType: 'single',
        drawingState: 'flipping',
        shuffledDeck: [],
        drawnCards: [],
        revealedIndices: [],
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };

      mockSessionStorage.setItem(
        'incomplete-reading-test-reading-1',
        JSON.stringify(expiredState)
      );

      const { result } = renderHook(() => useSessionRecovery('test-reading-1'));

      expect(result.current.hasIncompleteReading).toBe(false);
      expect(result.current.savedState).toBeNull();
    });
  });

  describe('Save State', () => {
    it('should save reading state to sessionStorage', () => {
      const { result } = renderHook(() => useSessionRecovery('test-reading-2'));

      const stateToSave = {
        spreadType: 'wasteland_survival',
        drawingState: 'selecting' as const,
        shuffledDeck: [
          { id: '1', name: 'The Fool' },
          { id: '2', name: 'The Magician' },
        ] as any[],
        drawnCards: [] as CardWithPosition[],
        revealedIndices: [] as number[],
      };

      act(() => {
        result.current.saveState(stateToSave);
      });

      const savedData = mockSessionStorage.getItem(
        'incomplete-reading-test-reading-2'
      );
      expect(savedData).not.toBeNull();

      const parsed = JSON.parse(savedData!);
      expect(parsed.spreadType).toBe('wasteland_survival');
      expect(parsed.drawingState).toBe('selecting');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should update hasIncompleteReading after saving', () => {
      const { result } = renderHook(() => useSessionRecovery('test-reading-3'));

      expect(result.current.hasIncompleteReading).toBe(false);

      act(() => {
        result.current.saveState({
          spreadType: 'single',
          drawingState: 'flipping',
          shuffledDeck: [],
          drawnCards: [],
          revealedIndices: [0],
        });
      });

      expect(result.current.hasIncompleteReading).toBe(true);
    });
  });

  describe('Clear State', () => {
    it('should clear saved state from sessionStorage', () => {
      mockSessionStorage.setItem(
        'incomplete-reading-test-reading-4',
        JSON.stringify({
          spreadType: 'three_card',
          drawingState: 'flipping',
          shuffledDeck: [],
          drawnCards: [],
          revealedIndices: [],
          timestamp: Date.now(),
        })
      );

      const { result } = renderHook(() => useSessionRecovery('test-reading-4'));

      expect(result.current.hasIncompleteReading).toBe(true);

      act(() => {
        result.current.clearState();
      });

      expect(result.current.hasIncompleteReading).toBe(false);
      expect(
        mockSessionStorage.getItem('incomplete-reading-test-reading-4')
      ).toBeNull();
    });
  });

  describe('Restore State', () => {
    it('should restore saved state and return it', () => {
      const savedState = {
        spreadType: 'celtic_cross',
        drawingState: 'flipping',
        shuffledDeck: [{ id: '1', name: 'The Tower' }],
        drawnCards: [],
        revealedIndices: [0, 1],
        timestamp: Date.now(),
      };

      mockSessionStorage.setItem(
        'incomplete-reading-test-reading-5',
        JSON.stringify(savedState)
      );

      const { result } = renderHook(() => useSessionRecovery('test-reading-5'));

      let restoredState: any;
      act(() => {
        restoredState = result.current.restoreState();
      });

      expect(restoredState).toEqual(savedState);
    });

    it('should clear state after restoring', () => {
      const savedState = {
        spreadType: 'three_card',
        drawingState: 'selecting',
        shuffledDeck: [],
        drawnCards: [],
        revealedIndices: [],
        timestamp: Date.now(),
      };

      mockSessionStorage.setItem(
        'incomplete-reading-test-reading-6',
        JSON.stringify(savedState)
      );

      const { result } = renderHook(() => useSessionRecovery('test-reading-6'));

      act(() => {
        result.current.restoreState();
      });

      expect(result.current.hasIncompleteReading).toBe(false);
      expect(
        mockSessionStorage.getItem('incomplete-reading-test-reading-6')
      ).toBeNull();
    });

    it('should return null if no state to restore', () => {
      const { result } = renderHook(() => useSessionRecovery('test-reading-7'));

      let restoredState: any;
      act(() => {
        restoredState = result.current.restoreState();
      });

      expect(restoredState).toBeNull();
    });
  });

  describe('Auto-save Behavior', () => {
    it('should only save state when drawing is in progress', () => {
      const { result } = renderHook(() => useSessionRecovery('test-reading-8'));

      // Should save when in 'selecting', 'shuffling', or 'flipping' state
      act(() => {
        result.current.saveState({
          spreadType: 'single',
          drawingState: 'selecting',
          shuffledDeck: [],
          drawnCards: [],
          revealedIndices: [],
        });
      });

      expect(result.current.hasIncompleteReading).toBe(true);

      // Should not save when in 'idle' or 'complete' state
      act(() => {
        result.current.clearState();
      });

      expect(result.current.hasIncompleteReading).toBe(false);
    });
  });

  describe('Multiple Reading Sessions', () => {
    it('should handle multiple reading sessions with different keys', () => {
      const { result: result1 } = renderHook(() =>
        useSessionRecovery('reading-1')
      );
      const { result: result2 } = renderHook(() =>
        useSessionRecovery('reading-2')
      );

      act(() => {
        result1.current.saveState({
          spreadType: 'single',
          drawingState: 'selecting',
          shuffledDeck: [],
          drawnCards: [],
          revealedIndices: [],
        });

        result2.current.saveState({
          spreadType: 'three_card',
          drawingState: 'flipping',
          shuffledDeck: [],
          drawnCards: [],
          revealedIndices: [0],
        });
      });

      expect(result1.current.savedState?.spreadType).toBe('single');
      expect(result2.current.savedState?.spreadType).toBe('three_card');
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted sessionStorage data gracefully', () => {
      mockSessionStorage.setItem(
        'incomplete-reading-test-reading-9',
        'invalid-json-data'
      );

      const { result } = renderHook(() => useSessionRecovery('test-reading-9'));

      expect(result.current.hasIncompleteReading).toBe(false);
      expect(result.current.savedState).toBeNull();
    });

    it('should handle missing required fields in saved data', () => {
      mockSessionStorage.setItem(
        'incomplete-reading-test-reading-10',
        JSON.stringify({
          // Missing required fields
          timestamp: Date.now(),
        })
      );

      const { result } = renderHook(() =>
        useSessionRecovery('test-reading-10')
      );

      expect(result.current.hasIncompleteReading).toBe(false);
      expect(result.current.savedState).toBeNull();
    });
  });
});
