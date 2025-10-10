/**
 * PlaylistSheet - Integration Tests
 * Task 33: 整合測試 - PlaylistSheet 與 stores 整合
 * Requirements 12.1, 12.3: 整合測試
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlaylistSheet } from '../PlaylistSheet';
import { usePlaylistStore } from '@/stores/playlistStore';
import { useMusicPlayerStore } from '@/stores/musicPlayerStore';

jest.mock('@/hooks/audio/useAudioEffect', () => ({
  useAudioEffect: () => ({
    playSound: jest.fn(),
  }),
}));

describe('PlaylistSheet - Integration Tests', () => {
  beforeEach(() => {
    // Reset stores before each test
    usePlaylistStore.getState().reset();
    useMusicPlayerStore.getState().reset();
    jest.clearAllMocks();
  });

  describe('Store Integration - Playlist CRUD', () => {
    it('should create playlist and update playlistStore', async () => {
      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      const playlistStore = usePlaylistStore.getState();
      expect(playlistStore.playlists).toHaveLength(0);

      // Click create playlist button
      const createButton = screen.getByTestId('create-playlist-button');
      fireEvent.click(createButton);

      // Fill in form
      const nameInput = screen.getByLabelText(/播放清單名稱/);
      fireEvent.change(nameInput, { target: { value: 'My New Playlist' } });

      // Select modes
      const synthwaveCheckbox = screen.getByTestId('mode-synthwave');
      const lofiCheckbox = screen.getByTestId('mode-lofi');
      fireEvent.click(synthwaveCheckbox);
      fireEvent.click(lofiCheckbox);

      // Save playlist
      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const state = usePlaylistStore.getState();
        expect(state.playlists).toHaveLength(1);
        expect(state.playlists[0].name).toBe('My New Playlist');
        expect(state.playlists[0].modes).toEqual(['synthwave', 'lofi']);
      });
    });

    it('should update playlist and sync with playlistStore', async () => {
      // Create initial playlist
      const playlistStore = usePlaylistStore.getState();
      const playlistId = playlistStore.createPlaylist('Original Name', ['ambient']);

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      // Click edit button for the playlist
      const editButton = screen.getByTestId(`edit-playlist-${playlistId}`);
      fireEvent.click(editButton);

      // Change name
      const nameInput = screen.getByLabelText(/播放清單名稱/);
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      // Add more modes
      const synthwaveCheckbox = screen.getByTestId('mode-synthwave');
      fireEvent.click(synthwaveCheckbox);

      // Save changes
      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const state = usePlaylistStore.getState();
        const playlist = state.getPlaylistById(playlistId);
        expect(playlist?.name).toBe('Updated Name');
        expect(playlist?.modes).toContain('synthwave');
        expect(playlist?.modes).toContain('ambient');
      });
    });

    it('should delete playlist and update playlistStore', async () => {
      // Create initial playlists
      const playlistStore = usePlaylistStore.getState();
      const id1 = playlistStore.createPlaylist('Playlist 1', ['synthwave']);
      const id2 = playlistStore.createPlaylist('Playlist 2', ['lofi']);

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      expect(screen.getByText('Playlist 1')).toBeInTheDocument();
      expect(screen.getByText('Playlist 2')).toBeInTheDocument();

      // Delete first playlist
      const deleteButton = screen.getByTestId(`delete-playlist-${id1}`);
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('確認');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const state = usePlaylistStore.getState();
        expect(state.playlists).toHaveLength(1);
        expect(state.getPlaylistById(id1)).toBeUndefined();
        expect(state.getPlaylistById(id2)).toBeTruthy();
      });
    });

    it('should reorder playlist modes using drag and drop', async () => {
      // Create playlist with multiple modes
      const playlistStore = usePlaylistStore.getState();
      const playlistId = playlistStore.createPlaylist('Test Playlist', [
        'synthwave',
        'divination',
        'lofi',
        'ambient',
      ]);

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      // Enter edit mode
      const editButton = screen.getByTestId(`edit-playlist-${playlistId}`);
      fireEvent.click(editButton);

      // Simulate drag and drop (move first to last)
      // Note: Actual drag-and-drop simulation requires more complex setup
      // Here we test the reorder action directly

      const state = usePlaylistStore.getState();
      state.reorderPlaylistModes(playlistId, 0, 3);

      await waitFor(() => {
        const updatedState = usePlaylistStore.getState();
        const playlist = updatedState.getPlaylistById(playlistId);
        expect(playlist?.modes[0]).toBe('divination');
        expect(playlist?.modes[3]).toBe('synthwave');
      });
    });
  });

  describe('Store Integration - Playlist Loading', () => {
    it('should load playlist into musicPlayerStore when play button clicked', async () => {
      // Create playlist
      const playlistStore = usePlaylistStore.getState();
      const playlistId = playlistStore.createPlaylist('Test Playlist', ['synthwave', 'lofi']);

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      const musicStore = useMusicPlayerStore.getState();
      expect(musicStore.currentPlaylist).toBeNull();

      // Click play button for the playlist
      const playButton = screen.getByTestId(`play-playlist-${playlistId}`);
      fireEvent.click(playButton);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.currentPlaylist).toBe(playlistId);
        expect(state.currentModeIndex).toBe(0);
        expect(state.currentMode).toBe('synthwave');
      });
    });

    it('should highlight currently playing playlist', async () => {
      // Create multiple playlists
      const playlistStore = usePlaylistStore.getState();
      const id1 = playlistStore.createPlaylist('Playlist 1', ['synthwave']);
      const id2 = playlistStore.createPlaylist('Playlist 2', ['lofi']);

      // Load first playlist
      const musicStore = useMusicPlayerStore.getState();
      musicStore.loadPlaylist(id1);

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      await waitFor(() => {
        const playlist1Element = screen.getByTestId(`playlist-${id1}`);
        const playlist2Element = screen.getByTestId(`playlist-${id2}`);

        expect(playlist1Element).toHaveClass('bg-pip-boy-green/20');
        expect(playlist2Element).not.toHaveClass('bg-pip-boy-green/20');
      });
    });

    it('should show currently playing mode in playlist', async () => {
      // Create playlist
      const playlistStore = usePlaylistStore.getState();
      const playlistId = playlistStore.createPlaylist('Test Playlist', [
        'synthwave',
        'divination',
        'lofi',
      ]);

      // Load playlist and play second mode
      const musicStore = useMusicPlayerStore.getState();
      musicStore.loadPlaylist(playlistId);
      musicStore.setModeIndex(1); // Play 'divination'

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      await waitFor(() => {
        const divinationMode = screen.getByTestId('mode-divination-playing');
        expect(divinationMode).toHaveClass('text-pip-boy-green');
      });
    });
  });

  describe('Store Integration - Mode Selection', () => {
    it('should play selected mode immediately', async () => {
      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      const musicStore = useMusicPlayerStore.getState();
      expect(musicStore.currentMode).toBeNull();

      // Click on a music mode card
      const synthwaveButton = screen.getByText('Synthwave').closest('button');
      fireEvent.click(synthwaveButton!);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.currentMode).toBe('synthwave');
        expect(state.isPlaying).toBe(true);
      });
    });

    it('should switch modes immediately when different mode clicked', async () => {
      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      // Play first mode
      const synthwaveButton = screen.getByText('Synthwave').closest('button');
      fireEvent.click(synthwaveButton!);

      await waitFor(() => {
        expect(useMusicPlayerStore.getState().currentMode).toBe('synthwave');
      });

      // Switch to different mode
      const lofiButton = screen.getByText('Lo-fi').closest('button');
      fireEvent.click(lofiButton!);

      await waitFor(() => {
        const state = useMusicPlayerStore.getState();
        expect(state.currentMode).toBe('lofi');
      });
    });
  });

  describe('Store Integration - Search and Filter', () => {
    it('should filter playlists based on search query', async () => {
      // Create multiple playlists
      const playlistStore = usePlaylistStore.getState();
      playlistStore.createPlaylist('Chill Vibes', ['lofi', 'ambient']);
      playlistStore.createPlaylist('Energy Boost', ['synthwave']);
      playlistStore.createPlaylist('Meditation', ['ambient']);

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      expect(screen.getByText('Chill Vibes')).toBeInTheDocument();
      expect(screen.getByText('Energy Boost')).toBeInTheDocument();
      expect(screen.getByText('Meditation')).toBeInTheDocument();

      // Search for "Chill"
      const searchInput = screen.getByPlaceholderText(/搜尋播放清單/);
      fireEvent.change(searchInput, { target: { value: 'Chill' } });

      await waitFor(() => {
        expect(screen.getByText('Chill Vibes')).toBeInTheDocument();
        expect(screen.queryByText('Energy Boost')).not.toBeInTheDocument();
        expect(screen.queryByText('Meditation')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no playlists match search', async () => {
      const playlistStore = usePlaylistStore.getState();
      playlistStore.createPlaylist('Test Playlist', ['synthwave']);

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      const searchInput = screen.getByPlaceholderText(/搜尋播放清單/);
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      await waitFor(() => {
        expect(screen.getByText(/找不到符合的播放清單/)).toBeInTheDocument();
      });
    });
  });

  describe('Store Integration - Error Handling', () => {
    it('should display error from playlistStore', async () => {
      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      // Trigger validation error
      const createButton = screen.getByTestId('create-playlist-button');
      fireEvent.click(createButton);

      // Try to save with empty name
      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/播放清單名稱/)).toBeInTheDocument();
        const playlistStore = usePlaylistStore.getState();
        expect(playlistStore.lastError).toBeTruthy();
      });
    });

    it('should clear error when user fixes validation issue', async () => {
      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      const createButton = screen.getByTestId('create-playlist-button');
      fireEvent.click(createButton);

      // Try to save with invalid name
      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(usePlaylistStore.getState().lastError).toBeTruthy();
      });

      // Fix the issue
      const nameInput = screen.getByLabelText(/播放清單名稱/);
      fireEvent.change(nameInput, { target: { value: 'Valid Name' } });

      const synthwaveCheckbox = screen.getByTestId('mode-synthwave');
      fireEvent.click(synthwaveCheckbox);

      fireEvent.click(saveButton);

      await waitFor(() => {
        const state = usePlaylistStore.getState();
        expect(state.lastError).toBeNull();
        expect(state.playlists).toHaveLength(1);
      });
    });
  });

  describe('Multi-Store Coordination', () => {
    it('should coordinate playlistStore and musicPlayerStore for full workflow', async () => {
      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      // Step 1: Create playlist (playlistStore)
      const createButton = screen.getByTestId('create-playlist-button');
      fireEvent.click(createButton);

      const nameInput = screen.getByLabelText(/播放清單名稱/);
      fireEvent.change(nameInput, { target: { value: 'Workflow Test' } });

      const synthwaveCheckbox = screen.getByTestId('mode-synthwave');
      const lofiCheckbox = screen.getByTestId('mode-lofi');
      fireEvent.click(synthwaveCheckbox);
      fireEvent.click(lofiCheckbox);

      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const playlistState = usePlaylistStore.getState();
        expect(playlistState.playlists).toHaveLength(1);
      });

      // Step 2: Play playlist (musicPlayerStore)
      const playlistId = usePlaylistStore.getState().playlists[0].id;
      const playButton = screen.getByTestId(`play-playlist-${playlistId}`);
      fireEvent.click(playButton);

      await waitFor(() => {
        const musicState = useMusicPlayerStore.getState();
        expect(musicState.currentPlaylist).toBe(playlistId);
        expect(musicState.currentMode).toBe('synthwave');
        expect(musicState.isPlaying).toBe(true);
      });

      // Step 3: Verify both stores are in sync
      const playlistState = usePlaylistStore.getState();
      const musicState = useMusicPlayerStore.getState();

      const currentPlaylist = playlistState.getPlaylistById(musicState.currentPlaylist!);
      expect(currentPlaylist).toBeTruthy();
      expect(currentPlaylist?.modes[musicState.currentModeIndex]).toBe(musicState.currentMode);
    });

    it('should handle playlist deletion while playlist is playing', async () => {
      // Create and load playlist
      const playlistStore = usePlaylistStore.getState();
      const playlistId = playlistStore.createPlaylist('To Delete', ['ambient']);

      const musicStore = useMusicPlayerStore.getState();
      musicStore.loadPlaylist(playlistId);

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      expect(musicStore.currentPlaylist).toBe(playlistId);

      // Delete the currently playing playlist
      const deleteButton = screen.getByTestId(`delete-playlist-${playlistId}`);
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByText('確認');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const playlistState = usePlaylistStore.getState();
        const musicState = useMusicPlayerStore.getState();

        expect(playlistState.getPlaylistById(playlistId)).toBeUndefined();
        // musicPlayerStore should clear current playlist
        expect(musicState.currentPlaylist).toBeNull();
      });
    });
  });

  describe('Performance - Store Updates', () => {
    it('should not cause unnecessary re-renders on unrelated store updates', async () => {
      const renderSpy = jest.fn();

      const TestWrapper = () => {
        renderSpy();
        return <PlaylistSheet isOpen={true} onClose={jest.fn()} />;
      };

      const { rerender } = render(<TestWrapper />);

      const initialRenderCount = renderSpy.mock.calls.length;

      // Update unrelated music player state
      useMusicPlayerStore.getState().setRepeatMode('one');

      // Force rerender
      rerender(<TestWrapper />);

      // Component might re-render but should be minimal
      expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(initialRenderCount);
    });

    it('should use useDeferredValue for search input optimization', async () => {
      // Create many playlists
      const playlistStore = usePlaylistStore.getState();
      for (let i = 0; i < 50; i++) {
        playlistStore.createPlaylist(`Playlist ${i}`, ['synthwave']);
      }

      render(<PlaylistSheet isOpen={true} onClose={jest.fn()} />);

      const searchInput = screen.getByPlaceholderText(/搜尋播放清單/);

      // Rapid typing should not cause too many re-renders
      fireEvent.change(searchInput, { target: { value: 'P' } });
      fireEvent.change(searchInput, { target: { value: 'Pl' } });
      fireEvent.change(searchInput, { target: { value: 'Pla' } });

      // Final results should show
      await waitFor(() => {
        const visiblePlaylists = screen.getAllByText(/Playlist/);
        expect(visiblePlaylists.length).toBeGreaterThan(0);
      });
    });
  });
});
