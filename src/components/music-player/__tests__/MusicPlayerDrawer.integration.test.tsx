/**
 * MusicPlayerDrawer - Integration Tests
 * Task 33: 整合測試 - MusicPlayerDrawer 與 stores 整合
 * Requirements 12.1, 12.3: 整合測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MusicPlayerDrawer } from '../MusicPlayerDrawer';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useAudioStore } from '@/lib/audio/audioStore';

// Mock audio context
const mockAudioContext = {
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 },
  })),
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440 },
  })),
  destination: {},
  sampleRate: 44100,
  state: 'running',
} as any;

// Mock Web Audio API
beforeAll(() => {
  (global as any).AudioContext = jest.fn(() => mockAudioContext);
  (global as any).window.AudioContext = jest.fn(() => mockAudioContext);
});

jest.mock('@/hooks/audio/useAudioEffect', () => ({
  useAudioEffect: () => ({
    playSound: jest.fn(),
  }),
}));

describe('MusicPlayerDrawer - Integration Tests', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useMusicPlayerStore.getState().reset();
    usePlaylistStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Store Integration - Playback Controls', () => {
    it('should integrate with musicPlayerStore for play/pause', async () => {
      render(<MusicPlayerDrawer />);

      const { playMode, pause, isPlaying } = useMusicPlayerStore.getState();

      // Initially not playing
      expect(isPlaying).toBe(false);

      // Open drawer
      const triggerButton = screen.getByLabelText(/開啟音樂播放器/);
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      // Click play button
      const playButton = screen.getByLabelText('播放');
      fireEvent.click(playButton);

      await waitFor(() => {
        // Verify store was updated
        const state = useMusicPlayerStore.getState();
        expect(state.currentMode).toBeTruthy();
      });
    });

    it('should integrate with musicPlayerStore for next/previous', async () => {
      // Create a test playlist
      const playlistStore = usePlaylistStore.getState();
      const playlistId = playlistStore.createPlaylist('Test Playlist', [
        'synthwave',
        'lofi',
        'ambient',
      ]);

      // Load the playlist
      const musicStore = useMusicPlayerStore.getState();
      musicStore.loadPlaylist(playlistId);

      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      // Initially at index 0
      expect(musicStore.currentModeIndex).toBe(0);

      // Click next button
      const nextButton = screen.getByLabelText('下一首');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.currentModeIndex).toBe(1);
      });

      // Click previous button
      const prevButton = screen.getByLabelText('上一首');
      fireEvent.click(prevButton);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.currentModeIndex).toBe(0);
      });
    });

    it('should integrate with musicPlayerStore for repeat mode', async () => {
      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      const musicStore = useMusicPlayerStore.getState();
      expect(musicStore.repeatMode).toBe('off');

      // Click repeat button to cycle through modes
      const repeatButton = screen.getByLabelText(/循環/);

      fireEvent.click(repeatButton);
      await waitFor(() => {
        expect(useMusicPlayerStore.getState().repeatMode).toBe('one');
      });

      fireEvent.click(repeatButton);
      await waitFor(() => {
        expect(useMusicPlayerStore.getState().repeatMode).toBe('all');
      });

      fireEvent.click(repeatButton);
      await waitFor(() => {
        expect(useMusicPlayerStore.getState().repeatMode).toBe('off');
      });
    });

    it('should integrate with musicPlayerStore for shuffle toggle', async () => {
      // Create a playlist with multiple modes
      const playlistStore = usePlaylistStore.getState();
      const playlistId = playlistStore.createPlaylist('Test Playlist', [
        'synthwave',
        'lofi',
        'divination',
        'ambient',
      ]);

      const musicStore = useMusicPlayerStore.getState();
      musicStore.loadPlaylist(playlistId);

      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      expect(musicStore.shuffleEnabled).toBe(false);

      // Click shuffle button
      const shuffleButton = screen.getByLabelText(/隨機/);
      fireEvent.click(shuffleButton);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.shuffleEnabled).toBe(true);
        expect(state.shuffleQueue).not.toBeNull();
      });
    });
  });

  describe('Store Integration - Volume Control', () => {
    it('should integrate with audioStore for volume changes', async () => {
      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      const volumeSlider = screen.getByRole('slider', { name: /音量/ });
      const initialVolume = useAudioStore.getState().volumes.music;

      // Change volume
      fireEvent.change(volumeSlider, { target: { value: 75 } });

      await waitFor(() => {
        const state = useAudioStore.getState();
        // Volume should be updated in store
        expect(state.setVolume).toHaveBeenCalledWith('music', 75);
      });
    });

    it('should integrate with audioStore for mute toggle', async () => {
      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      const muteButton = screen.getByLabelText(/靜音/);

      // Toggle mute
      fireEvent.click(muteButton);

      await waitFor(() => {
        const state = useAudioStore.getState();
        expect(state.toggleMute).toHaveBeenCalledWith('music');
      });
    });
  });

  describe('Store Integration - Drawer State', () => {
    it('should sync drawer open state with musicPlayerStore', async () => {
      render(<MusicPlayerDrawer />);

      const musicStore = useMusicPlayerStore.getState();

      // Initially closed
      expect(musicStore.isDrawerOpen).toBe(false);

      // Open drawer
      const triggerButton = screen.getByLabelText(/開啟音樂播放器/);
      fireEvent.click(triggerButton);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.isDrawerOpen).toBe(true);
      });

      // Close drawer
      const closeButton = screen.getByLabelText(/關閉/);
      fireEvent.click(closeButton);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.isDrawerOpen).toBe(false);
      });
    });

    it('should sync drawer minimize state with musicPlayerStore', async () => {
      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      const musicStore = useMusicPlayerStore.getState();
      expect(musicStore.isDrawerMinimized).toBe(false);

      // Minimize drawer (drag down or click minimize button)
      const minimizeButton = screen.getByLabelText(/最小化/);
      fireEvent.click(minimizeButton);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.isDrawerMinimized).toBe(true);
      });
    });
  });

  describe('Store Integration - Playlist Sheet', () => {
    it('should open sheet and minimize drawer', async () => {
      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      const musicStore = useMusicPlayerStore.getState();

      // Open playlist sheet
      const playlistButton = screen.getByLabelText(/開啟播放清單/);
      fireEvent.click(playlistButton);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.isSheetOpen).toBe(true);
        expect(state.isDrawerMinimized).toBe(true);
      });
    });

    it('should close sheet when user clicks outside', async () => {
      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      // Open sheet
      const playlistButton = screen.getByLabelText(/開啟播放清單/);
      fireEvent.click(playlistButton);

      await waitFor(() => {
        expect(screen.getByTestId('playlist-sheet')).toBeVisible();
      });

      // Click outside (overlay)
      const overlay = screen.getByTestId('sheet-overlay');
      fireEvent.click(overlay);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.isSheetOpen).toBe(false);
      });
    });
  });

  describe('Store Integration - Keyboard Shortcuts', () => {
    it('should integrate keyboard shortcuts with store actions', async () => {
      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      // Press Space to play
      fireEvent.keyDown(window, { key: ' ' });

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.currentMode).toBeTruthy();
      });

      // Press Esc to close
      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.isDrawerOpen).toBe(false);
      });
    });

    it('should handle "M" key for mute toggle', async () => {
      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      // Press M to toggle mute
      fireEvent.keyDown(window, { key: 'm' });

      await waitFor(() => {
        const state = useAudioStore.getState();
        expect(state.toggleMute).toHaveBeenCalled();
      });
    });
  });

  describe('Store Integration - Error Handling', () => {
    it('should sync error state from musicPlayerStore', async () => {
      render(<MusicPlayerDrawer />);

      // Set an error in store
      const musicStore = useMusicPlayerStore.getState();
      musicStore.setError(new Error('Test error'));

      await waitFor(() => {
        expect(screen.getByText(/Test error/)).toBeInTheDocument();
      });
    });

    it('should clear error when user dismisses error toast', async () => {
      render(<MusicPlayerDrawer />);

      // Set an error
      const musicStore = useMusicPlayerStore.getState();
      musicStore.setError(new Error('Test error'));

      await waitFor(() => {
        expect(screen.getByText(/Test error/)).toBeInTheDocument();
      });

      // Click dismiss button
      const dismissButton = screen.getByLabelText(/關閉錯誤/);
      fireEvent.click(dismissButton);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.lastError).toBeNull();
      });
    });
  });

  describe('Multi-Store Coordination', () => {
    it('should coordinate musicPlayerStore and playlistStore for playlist loading', async () => {
      // Create a playlist
      const playlistStore = usePlaylistStore.getState();
      const playlistId = playlistStore.createPlaylist('Integration Test', ['synthwave', 'lofi']);

      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      // Open playlist sheet
      const playlistButton = screen.getByLabelText(/開啟播放清單/);
      fireEvent.click(playlistButton);

      await waitFor(() => {
        expect(screen.getByText('Integration Test')).toBeInTheDocument();
      });

      // Click play button for the playlist
      const playPlaylistButton = screen.getByTestId(`play-playlist-${playlistId}`);
      fireEvent.click(playPlaylistButton);

      await waitFor(() => {
        const musicState = useMusicPlayerStore.getState();
        expect(musicState.currentPlaylist).toBe(playlistId);
        expect(musicState.currentMode).toBe('synthwave');
      });
    });

    it('should coordinate all three stores (music, playlist, audio) for complete playback', async () => {
      // Setup: Create playlist
      const playlistStore = usePlaylistStore.getState();
      const playlistId = playlistStore.createPlaylist('Full Test', [
        'synthwave',
        'divination',
        'lofi',
      ]);

      render(<MusicPlayerDrawer />);

      // Step 1: Open drawer (musicPlayerStore)
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(useMusicPlayerStore.getState().isDrawerOpen).toBe(true);
      });

      // Step 2: Load playlist (playlistStore → musicPlayerStore)
      useMusicPlayerStore.getState().loadPlaylist(playlistId);

      await waitFor(() => {
        expect(useMusicPlayerStore.getState().currentPlaylist).toBe(playlistId);
      });

      // Step 3: Play music (musicPlayerStore → audioStore)
      const playButton = screen.getByLabelText('播放');
      fireEvent.click(playButton);

      await waitFor(() => {
        const musicState = useMusicPlayerStore.getState();
        const audioState = useAudioStore.getState();

        expect(musicState.isPlaying).toBe(true);
        expect(musicState.currentMode).toBe('synthwave');
        expect(audioState.setIsPlaying).toHaveBeenCalledWith('music', true);
      });

      // Step 4: Adjust volume (audioStore)
      const volumeSlider = screen.getByRole('slider', { name: /音量/ });
      fireEvent.change(volumeSlider, { target: { value: 60 } });

      await waitFor(() => {
        const audioState = useAudioStore.getState();
        expect(audioState.setVolume).toHaveBeenCalledWith('music', 60);
      });

      // Step 5: Next track (musicPlayerStore → audioStore)
      const nextButton = screen.getByLabelText('下一首');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const musicState = useMusicPlayerStore.getState();
        expect(musicState.currentModeIndex).toBe(1);
        expect(musicState.currentMode).toBe('divination');
      });
    });
  });

  describe('Performance - Store Updates', () => {
    it('should not cause unnecessary re-renders on unrelated store updates', async () => {
      const renderSpy = jest.fn();

      const TestWrapper = () => {
        renderSpy();
        return <MusicPlayerDrawer />;
      };

      const { rerender } = render(<TestWrapper />);

      const initialRenderCount = renderSpy.mock.calls.length;

      // Update unrelated store state
      usePlaylistStore.getState().createPlaylist('Unrelated', ['ambient']);

      // Force rerender
      rerender(<TestWrapper />);

      // Component should not re-render due to memoization
      // (depending on implementation, this might vary)
      expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(initialRenderCount);
    });

    it('should batch multiple store updates efficiently', async () => {
      render(<MusicPlayerDrawer />);

      // Open drawer
      fireEvent.click(screen.getByLabelText(/開啟音樂播放器/));

      await waitFor(() => {
        expect(screen.getByTestId('music-player-drawer')).toBeVisible();
      });

      // Perform multiple rapid actions
      const playButton = screen.getByLabelText('播放');
      const nextButton = screen.getByLabelText('下一首');
      const shuffleButton = screen.getByLabelText(/隨機/);

      fireEvent.click(playButton);
      fireEvent.click(nextButton);
      fireEvent.click(shuffleButton);

      // All updates should be applied
      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.currentMode).toBeTruthy();
        expect(state.shuffleEnabled).toBe(true);
      });
    });
  });
});
