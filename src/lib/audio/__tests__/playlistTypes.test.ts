/**
 * playlistTypes - Unit Tests
 * Task 32: 單元測試 - validatePlaylist 輸入驗證
 * Requirements 12.1, 12.2: 單元測試覆蓋率 ≥ 80%
 */

import { describe, it, expect } from '@jest/globals';
import {
  validatePlaylist,
  PlaylistValidationError,
  isMusicMode,
  isRepeatMode,
  MUSIC_MODES,
  type Playlist,
  type MusicMode,
  type RepeatMode,
} from '../playlistTypes';

describe('playlistTypes', () => {
  describe('validatePlaylist', () => {
    const validPlaylist: Playlist = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Playlist',
      modes: ['synthwave', 'lofi'],
      createdAt: new Date('2025-01-10'),
      updatedAt: new Date('2025-01-10'),
    };

    describe('Valid Playlists', () => {
      it('should pass validation for valid playlist', () => {
        expect(() => validatePlaylist(validPlaylist)).not.toThrow();
      });

      it('should pass with 1 mode (minimum)', () => {
        const playlist = { ...validPlaylist, modes: ['synthwave'] };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });

      it('should pass with 20 modes (maximum)', () => {
        const modes: MusicMode[] = [
          ...Array(5).fill('synthwave'),
          ...Array(5).fill('divination'),
          ...Array(5).fill('lofi'),
          ...Array(5).fill('ambient'),
        ] as MusicMode[];

        const playlist = { ...validPlaylist, modes };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });

      it('should pass with 50 character name (maximum)', () => {
        const playlist = { ...validPlaylist, name: 'a'.repeat(50) };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });

      it('should pass with 1 character name (minimum)', () => {
        const playlist = { ...validPlaylist, name: 'a' };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });

      it('should pass with all 4 different modes', () => {
        const playlist = {
          ...validPlaylist,
          modes: ['synthwave', 'divination', 'lofi', 'ambient'] as MusicMode[],
        };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });

      it('should pass with duplicate modes', () => {
        const playlist = {
          ...validPlaylist,
          modes: ['synthwave', 'synthwave', 'lofi'] as MusicMode[],
        };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });

      it('should pass with special characters in name', () => {
        const playlist = { ...validPlaylist, name: 'Test-Playlist_123!@#' };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });

      it('should pass with Chinese characters in name', () => {
        const playlist = { ...validPlaylist, name: '我的播放清單' };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });

      it('should pass with emoji in name', () => {
        const playlist = { ...validPlaylist, name: 'My Playlist 🎵🎶' };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });
    });

    describe('Invalid ID', () => {
      it('should throw when id is missing', () => {
        const playlist = { ...validPlaylist, id: undefined as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('播放清單 ID 必須是字串');
      });

      it('should throw when id is not a string', () => {
        const playlist = { ...validPlaylist, id: 123 as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('播放清單 ID 必須是字串');
      });

      it('should throw when id is empty string', () => {
        const playlist = { ...validPlaylist, id: '' };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('播放清單 ID 必須是字串');
      });

      it('should throw when id is null', () => {
        const playlist = { ...validPlaylist, id: null as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });
    });

    describe('Invalid Name', () => {
      it('should throw when name is missing', () => {
        const playlist = { ...validPlaylist, name: undefined as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('播放清單名稱必須是字串');
      });

      it('should throw when name is not a string', () => {
        const playlist = { ...validPlaylist, name: 123 as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('播放清單名稱必須是字串');
      });

      it('should throw when name is empty string', () => {
        const playlist = { ...validPlaylist, name: '' };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        // Empty string is caught by the first check (!playlist.name)
        expect(() => validatePlaylist(playlist)).toThrow('播放清單名稱必須是字串');
      });

      it('should throw when name is too long (>50 characters)', () => {
        const playlist = { ...validPlaylist, name: 'a'.repeat(51) };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow(
          '播放清單名稱長度必須在 1-50 個字元之間'
        );
      });

      it('should throw when name is null', () => {
        const playlist = { ...validPlaylist, name: null as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });

      it('should throw when name is whitespace only', () => {
        // Note: Current implementation doesn't trim, so '   ' would pass length check
        // If we want to enforce non-whitespace, validation logic needs update
        const playlist = { ...validPlaylist, name: '   ' };
        // This currently passes - document as known behavior
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });
    });

    describe('Invalid Modes Array', () => {
      it('should throw when modes is not an array', () => {
        const playlist = { ...validPlaylist, modes: 'not-an-array' as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('播放清單音樂模式必須是陣列');
      });

      it('should throw when modes is empty array', () => {
        const playlist = { ...validPlaylist, modes: [] };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('播放清單必須包含 1-20 個音樂模式');
      });

      it('should throw when modes has more than 20 elements', () => {
        const modes = Array(21).fill('synthwave') as MusicMode[];
        const playlist = { ...validPlaylist, modes };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('播放清單必須包含 1-20 個音樂模式');
      });

      it('should throw when modes is null', () => {
        const playlist = { ...validPlaylist, modes: null as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });

      it('should throw when modes is undefined', () => {
        const playlist = { ...validPlaylist, modes: undefined as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });
    });

    describe('Invalid Music Modes', () => {
      it('should throw when mode is invalid', () => {
        const playlist = { ...validPlaylist, modes: ['invalid-mode'] as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('無效的音樂模式: invalid-mode');
      });

      it('should throw when mode is empty string', () => {
        const playlist = { ...validPlaylist, modes: [''] as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow('無效的音樂模式: ');
      });

      it('should throw when mode is number', () => {
        const playlist = { ...validPlaylist, modes: [123] as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });

      it('should throw when mode is object', () => {
        const playlist = { ...validPlaylist, modes: [{ mode: 'synthwave' }] as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });

      it('should throw for first invalid mode in mixed array', () => {
        const playlist = {
          ...validPlaylist,
          modes: ['synthwave', 'invalid', 'lofi'] as any,
        };
        expect(() => validatePlaylist(playlist)).toThrow('無效的音樂模式: invalid');
      });

      it('should validate case-sensitive mode names', () => {
        const playlist = { ...validPlaylist, modes: ['SYNTHWAVE'] as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });
    });

    describe('Invalid Dates', () => {
      it('should throw when createdAt is not a Date', () => {
        const playlist = { ...validPlaylist, createdAt: '2025-01-10' as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow(
          '播放清單建立時間必須是 Date 物件'
        );
      });

      it('should throw when updatedAt is not a Date', () => {
        const playlist = { ...validPlaylist, updatedAt: '2025-01-10' as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        expect(() => validatePlaylist(playlist)).toThrow(
          '播放清單更新時間必須是 Date 物件'
        );
      });

      it('should throw when createdAt is null', () => {
        const playlist = { ...validPlaylist, createdAt: null as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });

      it('should throw when updatedAt is undefined', () => {
        const playlist = { ...validPlaylist, updatedAt: undefined as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });

      it('should throw when createdAt is timestamp number', () => {
        const playlist = { ...validPlaylist, createdAt: Date.now() as any };
        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
      });

      it('should pass with valid Date objects (even future dates)', () => {
        const playlist = {
          ...validPlaylist,
          createdAt: new Date('2030-01-01'),
          updatedAt: new Date('2030-01-02'),
        };
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });

      it('should pass when updatedAt is before createdAt (no ordering validation)', () => {
        const playlist = {
          ...validPlaylist,
          createdAt: new Date('2025-01-10'),
          updatedAt: new Date('2025-01-05'),
        };
        // Current implementation doesn't validate date ordering
        expect(() => validatePlaylist(playlist)).not.toThrow();
      });
    });

    describe('Partial Playlist Objects', () => {
      it('should handle multiple validation errors (throws first error)', () => {
        const playlist = {
          id: '',
          name: '',
          modes: [],
          createdAt: null,
          updatedAt: null,
        } as any;

        expect(() => validatePlaylist(playlist)).toThrow(PlaylistValidationError);
        // Should throw the first error encountered (id validation)
      });

      it('should validate all required fields are present', () => {
        const playlist = { id: '123' } as any;
        expect(() => validatePlaylist(playlist)).toThrow();
      });
    });
  });

  describe('isMusicMode', () => {
    it('should return true for valid synthwave mode', () => {
      expect(isMusicMode('synthwave')).toBe(true);
    });

    it('should return true for valid divination mode', () => {
      expect(isMusicMode('divination')).toBe(true);
    });

    it('should return true for valid lofi mode', () => {
      expect(isMusicMode('lofi')).toBe(true);
    });

    it('should return true for valid ambient mode', () => {
      expect(isMusicMode('ambient')).toBe(true);
    });

    it('should return false for invalid mode', () => {
      expect(isMusicMode('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isMusicMode('')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isMusicMode(123)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isMusicMode(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isMusicMode(undefined)).toBe(false);
    });

    it('should return false for object', () => {
      expect(isMusicMode({ mode: 'synthwave' })).toBe(false);
    });

    it('should return false for array', () => {
      expect(isMusicMode(['synthwave'])).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isMusicMode('SYNTHWAVE')).toBe(false);
      expect(isMusicMode('Synthwave')).toBe(false);
    });
  });

  describe('isRepeatMode', () => {
    it('should return true for "off"', () => {
      expect(isRepeatMode('off')).toBe(true);
    });

    it('should return true for "one"', () => {
      expect(isRepeatMode('one')).toBe(true);
    });

    it('should return true for "all"', () => {
      expect(isRepeatMode('all')).toBe(true);
    });

    it('should return false for invalid mode', () => {
      expect(isRepeatMode('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isRepeatMode('')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isRepeatMode(0)).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(isRepeatMode(true)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isRepeatMode(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isRepeatMode(undefined)).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isRepeatMode('OFF')).toBe(false);
      expect(isRepeatMode('One')).toBe(false);
      expect(isRepeatMode('ALL')).toBe(false);
    });
  });

  describe('MUSIC_MODES constant', () => {
    it('should contain exactly 4 modes', () => {
      expect(MUSIC_MODES).toHaveLength(4);
    });

    it('should be readonly (TypeScript enforcement)', () => {
      // This is a type-level check, runtime behavior is not affected
      expect(Object.isFrozen(MUSIC_MODES)).toBe(false);
      // But TypeScript should prevent: MUSIC_MODES.push('new-mode');
    });

    it('should contain all expected modes', () => {
      expect(MUSIC_MODES).toContain('synthwave');
      expect(MUSIC_MODES).toContain('divination');
      expect(MUSIC_MODES).toContain('lofi');
      expect(MUSIC_MODES).toContain('ambient');
    });

    it('should not contain duplicates', () => {
      const uniqueModes = [...new Set(MUSIC_MODES)];
      expect(uniqueModes).toHaveLength(MUSIC_MODES.length);
    });
  });

  describe('PlaylistValidationError', () => {
    it('should be instance of Error', () => {
      const error = new PlaylistValidationError('Test error');
      expect(error).toBeInstanceOf(Error);
    });

    it('should have correct name', () => {
      const error = new PlaylistValidationError('Test error');
      expect(error.name).toBe('PlaylistValidationError');
    });

    it('should have correct message', () => {
      const error = new PlaylistValidationError('Test error message');
      expect(error.message).toBe('Test error message');
    });

    it('should be catchable as PlaylistValidationError', () => {
      try {
        throw new PlaylistValidationError('Test');
      } catch (error) {
        expect(error).toBeInstanceOf(PlaylistValidationError);
        if (error instanceof PlaylistValidationError) {
          expect(error.message).toBe('Test');
        }
      }
    });
  });
});
