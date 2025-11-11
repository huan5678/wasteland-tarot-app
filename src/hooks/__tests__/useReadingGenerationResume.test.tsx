import { renderHook, act, waitFor } from '@testing-library/react';
import { useReadingGenerationResume } from '../useReadingGenerationResume';

describe('useReadingGenerationResume', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('Session Storage', () => {
    it('should save ongoing interpretation to sessionStorage', () => {
      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'test-reading-123',
          enabled: true,
        })
      );

      act(() => {
        result.current.saveProgress('This is partial text...');
      });

      const stored = sessionStorage.getItem('reading-generation-test-reading-123');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.text).toBe('This is partial text...');
      expect(parsed.timestamp).toBeTruthy();
    });

    it('should restore interpretation on mount', () => {
      const storedData = {
        text: 'Previously generated text',
        timestamp: Date.now(),
      };

      sessionStorage.setItem(
        'reading-generation-test-reading-456',
        JSON.stringify(storedData)
      );

      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'test-reading-456',
          enabled: true,
        })
      );

      expect(result.current.hasIncompleteReading).toBe(true);
      expect(result.current.savedText).toBe('Previously generated text');
    });

    it('should clear session data when reading completes', () => {
      sessionStorage.setItem(
        'reading-generation-test-reading-789',
        JSON.stringify({ text: 'Some text', timestamp: Date.now() })
      );

      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'test-reading-789',
          enabled: true,
        })
      );

      act(() => {
        result.current.clearProgress();
      });

      const stored = sessionStorage.getItem('reading-generation-test-reading-789');
      expect(stored).toBeNull();
    });
  });

  describe('Expiration Handling', () => {
    it('should detect expired sessions (> 24 hours)', () => {
      const yesterday = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const storedData = {
        text: 'Old text',
        timestamp: yesterday,
      };

      sessionStorage.setItem(
        'reading-generation-expired',
        JSON.stringify(storedData)
      );

      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'expired',
          enabled: true,
        })
      );

      expect(result.current.hasIncompleteReading).toBe(false);
      expect(result.current.savedText).toBeNull();
    });

    it('should accept non-expired sessions (< 24 hours)', () => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const storedData = {
        text: 'Recent text',
        timestamp: oneHourAgo,
      };

      sessionStorage.setItem(
        'reading-generation-recent',
        JSON.stringify(storedData)
      );

      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'recent',
          enabled: true,
        })
      );

      expect(result.current.hasIncompleteReading).toBe(true);
      expect(result.current.savedText).toBe('Recent text');
    });

    it('should use custom expiration time', () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      const storedData = {
        text: 'Custom expiration text',
        timestamp: twoHoursAgo,
      };

      sessionStorage.setItem(
        'reading-generation-custom',
        JSON.stringify(storedData)
      );

      // 3 hour expiration - should accept
      const { result: result1 } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'custom',
          enabled: true,
          expirationHours: 3,
        })
      );

      expect(result1.current.hasIncompleteReading).toBe(true);

      // 1 hour expiration - should reject
      const { result: result2 } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'custom',
          enabled: true,
          expirationHours: 1,
        })
      );

      expect(result2.current.hasIncompleteReading).toBe(false);
    });
  });

  describe('Resume Notification', () => {
    it('should show resume notification for incomplete readings', () => {
      sessionStorage.setItem(
        'reading-generation-notify',
        JSON.stringify({
          text: 'Incomplete text...',
          timestamp: Date.now(),
        })
      );

      const onResumeAvailable = jest.fn();

      renderHook(() =>
        useReadingGenerationResume({
          readingId: 'notify',
          enabled: true,
          onResumeAvailable,
        })
      );

      expect(onResumeAvailable).toHaveBeenCalledWith('Incomplete text...');
    });

    it('should not show notification for new readings', () => {
      const onResumeAvailable = jest.fn();

      renderHook(() =>
        useReadingGenerationResume({
          readingId: 'new-reading',
          enabled: true,
          onResumeAvailable,
        })
      );

      expect(onResumeAvailable).not.toHaveBeenCalled();
    });
  });

  describe('Progress Tracking', () => {
    it('should update last saved position', () => {
      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'test',
          enabled: true,
        })
      );

      act(() => {
        result.current.saveProgress('First chunk');
      });

      expect(result.current.lastSavedPosition).toBe('First chunk'.length);

      act(() => {
        result.current.saveProgress('First chunk, second chunk');
      });

      expect(result.current.lastSavedPosition).toBe('First chunk, second chunk'.length);
    });

    it('should provide resume from position', () => {
      sessionStorage.setItem(
        'reading-generation-resume-pos',
        JSON.stringify({
          text: 'Previously saved text',
          timestamp: Date.now(),
        })
      );

      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'resume-pos',
          enabled: true,
        })
      );

      expect(result.current.resumeFromPosition).toBe('Previously saved text'.length);
    });
  });

  describe('Corrupted Data Handling', () => {
    it('should handle corrupted JSON gracefully', () => {
      sessionStorage.setItem('reading-generation-corrupt', 'invalid json {');

      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'corrupt',
          enabled: true,
        })
      );

      expect(result.current.hasIncompleteReading).toBe(false);
      expect(result.current.savedText).toBeNull();
    });

    it('should handle missing fields in stored data', () => {
      sessionStorage.setItem(
        'reading-generation-incomplete',
        JSON.stringify({ timestamp: Date.now() }) // Missing text field
      );

      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'incomplete',
          enabled: true,
        })
      );

      expect(result.current.hasIncompleteReading).toBe(false);
    });
  });

  describe('Disabled State', () => {
    it('should not restore data when disabled', () => {
      sessionStorage.setItem(
        'reading-generation-disabled',
        JSON.stringify({
          text: 'Should not restore',
          timestamp: Date.now(),
        })
      );

      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'disabled',
          enabled: false,
        })
      );

      expect(result.current.hasIncompleteReading).toBe(false);
      expect(result.current.savedText).toBeNull();
    });

    it('should not save data when disabled', () => {
      const { result } = renderHook(() =>
        useReadingGenerationResume({
          readingId: 'disabled-save',
          enabled: false,
        })
      );

      act(() => {
        result.current.saveProgress('Should not save');
      });

      const stored = sessionStorage.getItem('reading-generation-disabled-save');
      expect(stored).toBeNull();
    });
  });
});
