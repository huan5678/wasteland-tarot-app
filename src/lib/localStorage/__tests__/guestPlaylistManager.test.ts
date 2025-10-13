/**
 * GuestPlaylistManager 測試
 * Task 4.3: 實作 localStorage 訪客播放清單管理（測試）
 * Feature: playlist-music-player
 */

import {
  GuestPlaylistManager,
  GUEST_PLAYLIST_LIMIT,
  type GuestPlaylist,
} from '../guestPlaylistManager';

describe('GuestPlaylistManager', () => {
  let manager: GuestPlaylistManager;

  // Mock localStorage
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    manager = new GuestPlaylistManager();

    // 初始化 localStorage mock
    localStorageMock = {};

    global.Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
    global.Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    global.Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });
    global.Storage.prototype.clear = jest.fn(() => {
      localStorageMock = {};
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadFromLocalStorage', () => {
    test('should return null when no data exists', () => {
      const result = manager.loadFromLocalStorage();
      expect(result).toBeNull();
    });

    test('should load valid playlist from localStorage', () => {
      const mockPlaylist: GuestPlaylist = {
        id: 'guest-playlist-local',
        name: '訪客播放清單',
        patterns: [
          {
            patternId: 'pattern-uuid-1',
            position: 0,
            addedAt: '2025-10-13T12:00:00Z',
          },
        ],
        createdAt: '2025-10-13T12:00:00Z',
        updatedAt: '2025-10-13T12:00:00Z',
      };

      localStorageMock['guest_playlist'] = JSON.stringify(mockPlaylist);

      const result = manager.loadFromLocalStorage();
      expect(result).toEqual(mockPlaylist);
    });

    test('should clear and return null for invalid JSON', () => {
      localStorageMock['guest_playlist'] = 'invalid-json';

      const result = manager.loadFromLocalStorage();
      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('guest_playlist');
    });

    test('should clear and return null for invalid playlist structure', () => {
      const invalidData = { id: 123, name: 'Invalid' };
      localStorageMock['guest_playlist'] = JSON.stringify(invalidData);

      const result = manager.loadFromLocalStorage();
      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('guest_playlist');
    });
  });

  describe('addPattern', () => {
    test('should add pattern to empty playlist', () => {
      const success = manager.addPattern('pattern-uuid-1');

      expect(success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();

      const playlist = manager.loadFromLocalStorage();
      expect(playlist).not.toBeNull();
      expect(playlist!.patterns).toHaveLength(1);
      expect(playlist!.patterns[0].patternId).toBe('pattern-uuid-1');
      expect(playlist!.patterns[0].position).toBe(0);
    });

    test('should add multiple patterns', () => {
      manager.addPattern('pattern-uuid-1');
      manager.addPattern('pattern-uuid-2');
      manager.addPattern('pattern-uuid-3');

      const playlist = manager.loadFromLocalStorage();
      expect(playlist!.patterns).toHaveLength(3);
      expect(playlist!.patterns[0].position).toBe(0);
      expect(playlist!.patterns[1].position).toBe(1);
      expect(playlist!.patterns[2].position).toBe(2);
    });

    test('should reject adding 5th pattern (exceeds limit)', () => {
      // 加入 4 首
      manager.addPattern('pattern-uuid-1');
      manager.addPattern('pattern-uuid-2');
      manager.addPattern('pattern-uuid-3');
      manager.addPattern('pattern-uuid-4');

      // 嘗試加入第 5 首
      const success = manager.addPattern('pattern-uuid-5');

      expect(success).toBe(false);
      expect(manager.isFull()).toBe(true);

      const playlist = manager.loadFromLocalStorage();
      expect(playlist!.patterns).toHaveLength(GUEST_PLAYLIST_LIMIT);
    });

    test('should not add duplicate pattern', () => {
      manager.addPattern('pattern-uuid-1');
      manager.addPattern('pattern-uuid-1'); // 重複

      const playlist = manager.loadFromLocalStorage();
      expect(playlist!.patterns).toHaveLength(1);
    });
  });

  describe('removePattern', () => {
    test('should remove pattern from playlist', () => {
      manager.addPattern('pattern-uuid-1');
      manager.addPattern('pattern-uuid-2');
      manager.addPattern('pattern-uuid-3');

      manager.removePattern('pattern-uuid-2');

      const playlist = manager.loadFromLocalStorage();
      expect(playlist!.patterns).toHaveLength(2);
      expect(playlist!.patterns.map((p) => p.patternId)).toEqual([
        'pattern-uuid-1',
        'pattern-uuid-3',
      ]);
    });

    test('should recalculate positions after removal', () => {
      manager.addPattern('pattern-uuid-1');
      manager.addPattern('pattern-uuid-2');
      manager.addPattern('pattern-uuid-3');

      manager.removePattern('pattern-uuid-1');

      const playlist = manager.loadFromLocalStorage();
      expect(playlist!.patterns[0].position).toBe(0);
      expect(playlist!.patterns[1].position).toBe(1);
    });

    test('should clear playlist when last pattern is removed', () => {
      manager.addPattern('pattern-uuid-1');
      manager.removePattern('pattern-uuid-1');

      const playlist = manager.loadFromLocalStorage();
      expect(playlist).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('guest_playlist');
    });

    test('should handle removing non-existent pattern', () => {
      manager.addPattern('pattern-uuid-1');
      manager.removePattern('pattern-uuid-999'); // 不存在

      const playlist = manager.loadFromLocalStorage();
      expect(playlist!.patterns).toHaveLength(1);
    });
  });

  describe('isFull', () => {
    test('should return false for empty playlist', () => {
      expect(manager.isFull()).toBe(false);
    });

    test('should return false when less than limit', () => {
      manager.addPattern('pattern-uuid-1');
      manager.addPattern('pattern-uuid-2');

      expect(manager.isFull()).toBe(false);
    });

    test('should return true when at limit (>= 4)', () => {
      manager.addPattern('pattern-uuid-1');
      manager.addPattern('pattern-uuid-2');
      manager.addPattern('pattern-uuid-3');
      manager.addPattern('pattern-uuid-4');

      expect(manager.isFull()).toBe(true);
      expect(manager.getPatternCount()).toBe(GUEST_PLAYLIST_LIMIT);
    });
  });

  describe('getPatternCount', () => {
    test('should return 0 for empty playlist', () => {
      expect(manager.getPatternCount()).toBe(0);
    });

    test('should return correct count', () => {
      manager.addPattern('pattern-uuid-1');
      manager.addPattern('pattern-uuid-2');
      manager.addPattern('pattern-uuid-3');

      expect(manager.getPatternCount()).toBe(3);
    });
  });

  describe('exportForMigration', () => {
    test('should return null for empty playlist', () => {
      const exported = manager.exportForMigration();
      expect(exported).toBeNull();
    });

    test('should export playlist for migration', () => {
      manager.addPattern('pattern-uuid-1');
      manager.addPattern('pattern-uuid-2');

      const exported = manager.exportForMigration();

      expect(exported).not.toBeNull();
      expect(exported!.patternCount).toBe(2);
      expect(exported!.patterns).toHaveLength(2);
      expect(exported!.patterns[0]).toEqual({
        patternId: 'pattern-uuid-1',
        position: 0,
      });
      expect(exported!.patterns[1]).toEqual({
        patternId: 'pattern-uuid-2',
        position: 1,
      });
      expect(exported!.createdAt).toBeDefined();
      expect(exported!.updatedAt).toBeDefined();
    });
  });

  describe('clearPlaylist', () => {
    test('should clear playlist from localStorage', () => {
      manager.addPattern('pattern-uuid-1');
      manager.clearPlaylist();

      const playlist = manager.loadFromLocalStorage();
      expect(playlist).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('guest_playlist');
    });
  });

  describe('Edge Cases', () => {
    test('should handle localStorage quota exceeded', () => {
      // Mock localStorage 滿了
      global.Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const success = manager.addPattern('pattern-uuid-1');
      expect(success).toBe(false);
    });

    test('should validate pattern limit strictly', () => {
      // 手動建立超過上限的播放清單
      const invalidPlaylist: GuestPlaylist = {
        id: 'guest-playlist-local',
        name: '訪客播放清單',
        patterns: Array(10)
          .fill(null)
          .map((_, i) => ({
            patternId: `pattern-uuid-${i}`,
            position: i,
            addedAt: new Date().toISOString(),
          })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorageMock['guest_playlist'] = JSON.stringify(invalidPlaylist);

      const result = manager.loadFromLocalStorage();
      expect(result).toBeNull(); // 超過上限視為無效
      expect(localStorage.removeItem).toHaveBeenCalledWith('guest_playlist');
    });
  });
});
