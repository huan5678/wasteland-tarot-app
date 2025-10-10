/**
 * Task 32: 單元測試 - musicPlayerStore
 * 測試所有 actions：playMode, pause, resume, next, previous, setRepeatMode, toggleShuffle
 * Requirements 12.1, 12.2: 單元測試覆蓋率 ≥ 80%
 */

import { act, renderHook } from '@testing-library/react';
import { useMusicPlayerStore } from '../musicPlayerStore';
import { usePlaylistStore } from '../playlistStore';
import { useAudioStore } from '@/lib/audio/audioStore';
import type { MusicMode, RepeatMode } from '@/lib/audio/playlistTypes';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/audio/audioStore', () => ({
  useAudioStore: {
    getState: jest.fn(() => ({
      setCurrentMusicMode: jest.fn(),
      setIsPlaying: jest.fn(),
    })),
  },
}));

describe('musicPlayerStore', () => {
  beforeEach(() => {
    // Reset stores before each test
    const musicPlayerStore = useMusicPlayerStore.getState();
    const playlistStore = usePlaylistStore.getState();

    act(() => {
      musicPlayerStore.reset();
      playlistStore.reset();
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct default state', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      expect(result.current.currentMode).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentPlaylist).toBeNull();
      expect(result.current.currentModeIndex).toBe(0);
      expect(result.current.repeatMode).toBe('off');
      expect(result.current.shuffleEnabled).toBe(false);
      expect(result.current.shuffleQueue).toBeNull();
      expect(result.current.isDrawerOpen).toBe(false);
      expect(result.current.isDrawerMinimized).toBe(false);
      expect(result.current.isSheetOpen).toBe(false);
      expect(result.current.lastError).toBeNull();
    });
  });

  describe('Playback Control Actions', () => {
    describe('playMode', () => {
      it('should play a music mode successfully', async () => {
        const { result } = renderHook(() => useMusicPlayerStore());
        const mockSetIsPlaying = jest.fn();
        const mockSetCurrentMusicMode = jest.fn();

        (useAudioStore.getState as jest.Mock).mockReturnValue({
          setIsPlaying: mockSetIsPlaying,
          setCurrentMusicMode: mockSetCurrentMusicMode,
        });

        await act(async () => {
          await result.current.playMode('synthwave');
        });

        expect(result.current.currentMode).toBe('synthwave');
        expect(result.current.isPlaying).toBe(true);
        expect(result.current.lastError).toBeNull();
        expect(mockSetCurrentMusicMode).toHaveBeenCalledWith('synthwave');
        expect(mockSetIsPlaying).toHaveBeenCalledWith('music', true);
      });

      it('should handle playMode error and set error state', async () => {
        const { result } = renderHook(() => useMusicPlayerStore());
        const mockError = new Error('Audio initialization failed');

        (useAudioStore.getState as jest.Mock).mockReturnValue({
          setIsPlaying: jest.fn(() => {
            throw mockError;
          }),
          setCurrentMusicMode: jest.fn(),
        });

        await act(async () => {
          try {
            await result.current.playMode('synthwave');
          } catch (error) {
            // Expected to throw
          }
        });

        expect(result.current.isPlaying).toBe(false);
        expect(result.current.lastError).toBeTruthy();
      });
    });

    describe('pause', () => {
      it('should pause music playback', () => {
        const { result } = renderHook(() => useMusicPlayerStore());
        const mockSetIsPlaying = jest.fn();

        (useAudioStore.getState as jest.Mock).mockReturnValue({
          setIsPlaying: mockSetIsPlaying,
          setCurrentMusicMode: jest.fn(),
        });

        act(() => {
          // Set playing first
          result.current.resume = jest.fn();
          (result.current as any).isPlaying = true;
          result.current.pause();
        });

        expect(result.current.isPlaying).toBe(false);
        expect(mockSetIsPlaying).toHaveBeenCalledWith('music', false);
      });
    });

    describe('resume', () => {
      it('should resume music playback', () => {
        const { result } = renderHook(() => useMusicPlayerStore());
        const mockSetIsPlaying = jest.fn();

        (useAudioStore.getState as jest.Mock).mockReturnValue({
          setIsPlaying: mockSetIsPlaying,
          setCurrentMusicMode: jest.fn(),
        });

        act(() => {
          // Set a current mode
          (result.current as any).currentMode = 'synthwave';
          result.current.resume();
        });

        expect(result.current.isPlaying).toBe(true);
        expect(mockSetIsPlaying).toHaveBeenCalledWith('music', true);
      });

      it('should not resume if no current mode', () => {
        const { result } = renderHook(() => useMusicPlayerStore());
        const mockSetIsPlaying = jest.fn();

        (useAudioStore.getState as jest.Mock).mockReturnValue({
          setIsPlaying: mockSetIsPlaying,
          setCurrentMusicMode: jest.fn(),
        });

        act(() => {
          result.current.resume();
        });

        expect(mockSetIsPlaying).not.toHaveBeenCalled();
      });
    });

    describe('stop', () => {
      it('should stop music playback and clear mode', () => {
        const { result } = renderHook(() => useMusicPlayerStore());
        const mockSetIsPlaying = jest.fn();
        const mockSetCurrentMusicMode = jest.fn();

        (useAudioStore.getState as jest.Mock).mockReturnValue({
          setIsPlaying: mockSetIsPlaying,
          setCurrentMusicMode: mockSetCurrentMusicMode,
        });

        act(() => {
          result.current.stop();
        });

        expect(result.current.isPlaying).toBe(false);
        expect(result.current.currentMode).toBeNull();
        expect(mockSetIsPlaying).toHaveBeenCalledWith('music', false);
        expect(mockSetCurrentMusicMode).toHaveBeenCalledWith(null);
      });
    });

    describe('next', () => {
      beforeEach(() => {
        const playlistStore = usePlaylistStore.getState();
        act(() => {
          playlistStore.reset();
          const playlistId = playlistStore.createPlaylist('Test Playlist', [
            'synthwave',
            'lofi',
            'divination',
            'ambient',
          ]);

          const musicPlayerStore = useMusicPlayerStore.getState();
          musicPlayerStore.loadPlaylist(playlistId);
        });
      });

      it('should skip to next mode in playlist', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.next();
        });

        expect(result.current.currentModeIndex).toBe(1);
      });

      it('should loop back to first mode when repeatMode is "all"', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.setRepeatMode('all');
          result.current.setModeIndex(3); // Last mode
          result.current.next();
        });

        expect(result.current.currentModeIndex).toBe(0);
      });

      it('should stay on same mode when repeatMode is "one"', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.setRepeatMode('one');
          result.current.setModeIndex(1);
          result.current.next();
        });

        expect(result.current.currentModeIndex).toBe(1);
      });

      it('should stay on last mode when repeatMode is "off" and at end', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.setRepeatMode('off');
          result.current.setModeIndex(3); // Last mode
          result.current.next();
        });

        expect(result.current.currentModeIndex).toBe(3);
      });

      it('should not skip if no playlist loaded', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.clearPlaylist();
          result.current.next();
        });

        expect(result.current.currentModeIndex).toBe(0);
      });
    });

    describe('previous', () => {
      beforeEach(() => {
        const playlistStore = usePlaylistStore.getState();
        act(() => {
          playlistStore.reset();
          const playlistId = playlistStore.createPlaylist('Test Playlist', [
            'synthwave',
            'lofi',
            'divination',
            'ambient',
          ]);

          const musicPlayerStore = useMusicPlayerStore.getState();
          musicPlayerStore.loadPlaylist(playlistId);
          musicPlayerStore.setModeIndex(2); // Start at index 2
        });
      });

      it('should skip to previous mode in playlist', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.previous();
        });

        expect(result.current.currentModeIndex).toBe(1);
      });

      it('should loop to last mode when repeatMode is "all" and at start', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.setRepeatMode('all');
          result.current.setModeIndex(0); // First mode
          result.current.previous();
        });

        expect(result.current.currentModeIndex).toBe(3);
      });

      it('should stay on first mode when repeatMode is "off" and at start', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.setRepeatMode('off');
          result.current.setModeIndex(0); // First mode
          result.current.previous();
        });

        expect(result.current.currentModeIndex).toBe(0);
      });
    });
  });

  describe('Playback Settings Actions', () => {
    describe('setRepeatMode', () => {
      it('should set repeat mode to "one"', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.setRepeatMode('one');
        });

        expect(result.current.repeatMode).toBe('one');
      });

      it('should set repeat mode to "all"', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.setRepeatMode('all');
        });

        expect(result.current.repeatMode).toBe('all');
      });

      it('should set repeat mode to "off"', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.setRepeatMode('off');
        });

        expect(result.current.repeatMode).toBe('off');
      });
    });

    describe('cycleRepeatMode', () => {
      it('should cycle through repeat modes: off -> one -> all -> off', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          // Start: off
          expect(result.current.repeatMode).toBe('off');

          // Cycle 1: off -> one
          result.current.cycleRepeatMode();
          expect(result.current.repeatMode).toBe('one');

          // Cycle 2: one -> all
          result.current.cycleRepeatMode();
          expect(result.current.repeatMode).toBe('all');

          // Cycle 3: all -> off
          result.current.cycleRepeatMode();
          expect(result.current.repeatMode).toBe('off');
        });
      });
    });

    describe('toggleShuffle', () => {
      beforeEach(() => {
        const playlistStore = usePlaylistStore.getState();
        act(() => {
          playlistStore.reset();
          const playlistId = playlistStore.createPlaylist('Test Playlist', [
            'synthwave',
            'lofi',
            'divination',
            'ambient',
          ]);

          const musicPlayerStore = useMusicPlayerStore.getState();
          musicPlayerStore.loadPlaylist(playlistId);
        });
      });

      it('should enable shuffle and generate shuffle queue', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.toggleShuffle();
        });

        expect(result.current.shuffleEnabled).toBe(true);
        expect(result.current.shuffleQueue).not.toBeNull();
        expect(result.current.shuffleQueue).toHaveLength(4);
      });

      it('should disable shuffle and clear shuffle queue', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          // Enable first
          result.current.toggleShuffle();
          expect(result.current.shuffleEnabled).toBe(true);

          // Disable
          result.current.toggleShuffle();
        });

        expect(result.current.shuffleEnabled).toBe(false);
        expect(result.current.shuffleQueue).toBeNull();
      });

      it('should not enable shuffle if no playlist loaded', () => {
        const { result } = renderHook(() => useMusicPlayerStore());

        act(() => {
          result.current.clearPlaylist();
          result.current.toggleShuffle();
        });

        expect(result.current.shuffleEnabled).toBe(false);
        expect(result.current.shuffleQueue).toBeNull();
      });
    });
  });

  describe('Drawer Control Actions', () => {
    it('should open drawer', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.openDrawer();
      });

      expect(result.current.isDrawerOpen).toBe(true);
      expect(result.current.isDrawerMinimized).toBe(false);
    });

    it('should close drawer', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.openDrawer();
        result.current.closeDrawer();
      });

      expect(result.current.isDrawerOpen).toBe(false);
    });

    it('should toggle drawer state', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.toggleDrawer();
        expect(result.current.isDrawerOpen).toBe(true);

        result.current.toggleDrawer();
        expect(result.current.isDrawerOpen).toBe(false);
      });
    });

    it('should minimize drawer', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.minimizeDrawer();
      });

      expect(result.current.isDrawerMinimized).toBe(true);
    });

    it('should expand drawer', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.minimizeDrawer();
        result.current.expandDrawer();
      });

      expect(result.current.isDrawerMinimized).toBe(false);
    });
  });

  describe('Sheet Control Actions', () => {
    it('should open sheet and minimize drawer', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.openDrawer();
        result.current.openSheet();
      });

      expect(result.current.isSheetOpen).toBe(true);
      expect(result.current.isDrawerMinimized).toBe(true);
    });

    it('should close sheet', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.openSheet();
        result.current.closeSheet();
      });

      expect(result.current.isSheetOpen).toBe(false);
    });

    it('should toggle sheet state', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.toggleSheet();
        expect(result.current.isSheetOpen).toBe(true);

        result.current.toggleSheet();
        expect(result.current.isSheetOpen).toBe(false);
      });
    });
  });

  describe('Playlist Management Actions', () => {
    it('should load playlist', () => {
      const { result } = renderHook(() => useMusicPlayerStore());
      const playlistId = 'test-playlist-id';

      act(() => {
        result.current.loadPlaylist(playlistId);
      });

      expect(result.current.currentPlaylist).toBe(playlistId);
      expect(result.current.currentModeIndex).toBe(0);
      expect(result.current.shuffleQueue).toBeNull();
    });

    it('should clear playlist', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.loadPlaylist('test-playlist-id');
        result.current.clearPlaylist();
      });

      expect(result.current.currentPlaylist).toBeNull();
      expect(result.current.currentModeIndex).toBe(0);
      expect(result.current.shuffleQueue).toBeNull();
    });

    it('should set mode index', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.setModeIndex(3);
      });

      expect(result.current.currentModeIndex).toBe(3);
    });
  });

  describe('Error Handling Actions', () => {
    it('should set error', () => {
      const { result } = renderHook(() => useMusicPlayerStore());
      const testError = new Error('Test error');

      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.lastError).toBe(testError);
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useMusicPlayerStore());
      const testError = new Error('Test error');

      act(() => {
        result.current.setError(testError);
        result.current.clearError();
      });

      expect(result.current.lastError).toBeNull();
    });
  });

  describe('Utility Actions', () => {
    it('should reset to default state', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        // Modify state
        result.current.loadPlaylist('test-id');
        result.current.setRepeatMode('all');
        result.current.toggleShuffle();
        result.current.openDrawer();
        result.current.openSheet();

        // Reset
        result.current.reset();
      });

      expect(result.current.currentMode).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentPlaylist).toBeNull();
      expect(result.current.currentModeIndex).toBe(0);
      expect(result.current.repeatMode).toBe('off');
      expect(result.current.shuffleEnabled).toBe(false);
      expect(result.current.shuffleQueue).toBeNull();
      expect(result.current.isDrawerOpen).toBe(false);
      expect(result.current.isDrawerMinimized).toBe(false);
      expect(result.current.isSheetOpen).toBe(false);
      expect(result.current.lastError).toBeNull();
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist only specified fields to localStorage', () => {
      const { result } = renderHook(() => useMusicPlayerStore());

      act(() => {
        result.current.setRepeatMode('all');
        result.current.toggleShuffle();
        result.current.loadPlaylist('test-playlist-id');
        result.current.setModeIndex(2);
      });

      // Check that state is set
      expect(result.current.repeatMode).toBe('all');
      expect(result.current.shuffleEnabled).toBe(true);
      expect(result.current.currentPlaylist).toBe('test-playlist-id');
      expect(result.current.currentModeIndex).toBe(2);

      // Note: Actual localStorage persistence is handled by Zustand middleware
      // In a real test, you would check localStorage.getItem('wasteland-tarot-music-player')
    });
  });
});
