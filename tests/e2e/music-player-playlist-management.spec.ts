/**
 * E2E Tests - Music Player Playlist Management Flow
 * Task 34: E2E 測試 - 播放清單管理流程
 * Requirements 12.1, 12.4: E2E 測試、視覺回歸測試
 */

import { test, expect } from '@playwright/test';

test.describe('Music Player - Playlist Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('E2E Flow 2: Complete playlist management flow (open → create → save → verify)', async ({
    page,
  }) => {
    // ========== Step 1: Open music player drawer ==========
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    const drawer = page.locator('[data-testid="music-player-drawer"]');
    await expect(drawer).toBeVisible();

    // ========== Step 2: Open playlist sheet ==========
    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(500);

    const sheet = page.locator('[data-testid="playlist-sheet"]');
    await expect(sheet).toBeVisible();

    // Take screenshot of empty playlist state
    await page.screenshot({
      path: 'test-results/screenshots/playlist-sheet-empty.png',
    });

    // ========== Step 3: Create new playlist ==========
    const createButton = page.locator('[data-testid="create-playlist-button"]');
    await expect(createButton).toBeVisible();

    await createButton.click();
    await page.waitForTimeout(300);

    // Should show playlist editor form
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();

    // ========== Step 4: Fill in playlist details ==========
    await nameInput.fill('My Test Playlist');

    // Select Synthwave mode
    const synthwaveCheckbox = page.locator('[data-testid="mode-synthwave"]');
    await expect(synthwaveCheckbox).toBeVisible();
    await synthwaveCheckbox.check();

    // Select Lo-fi mode
    const lofiCheckbox = page.locator('[data-testid="mode-lofi"]');
    await lofiCheckbox.check();

    // Take screenshot of filled form
    await page.screenshot({
      path: 'test-results/screenshots/playlist-form-filled.png',
    });

    // ========== Step 5: Save playlist ==========
    const saveButton = page.locator('button:has-text("儲存")');
    await expect(saveButton).toBeVisible();

    await saveButton.click();
    await page.waitForTimeout(500);

    // ========== Step 6: Verify playlist appears in list ==========
    const playlistName = page.locator('text=My Test Playlist');
    await expect(playlistName).toBeVisible();

    // Take screenshot of created playlist
    await page.screenshot({
      path: 'test-results/screenshots/playlist-created.png',
    });

    // ========== Step 7: Verify playlist in localStorage ==========
    const storedPlaylists = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      return data ? JSON.parse(data).state.playlists : [];
    });

    expect(storedPlaylists).toHaveLength(1);
    expect(storedPlaylists[0].name).toBe('My Test Playlist');
    expect(storedPlaylists[0].modes).toEqual(['synthwave', 'lofi']);

    // ========== Step 8: Play the playlist ==========
    const playlistId = storedPlaylists[0].id;
    const playButton = page.locator(`[data-testid="play-playlist-${playlistId}"]`);

    if (await playButton.isVisible()) {
      await playButton.click();
      await page.waitForTimeout(500);

      // Verify music player loaded the playlist
      const playerState = await page.evaluate(() => {
        const data = localStorage.getItem('wasteland-tarot-music-player');
        return data ? JSON.parse(data).state : null;
      });

      expect(playerState.currentPlaylist).toBe(playlistId);
      expect(playerState.currentMode).toBe('synthwave');
    }

    // ========== Step 9: Close sheet ==========
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Sheet should be closed
    const sheetVisible = await sheet.isVisible().catch(() => false);
    expect(sheetVisible).toBe(false);
  });

  test('should edit existing playlist', async ({ page }) => {
    // Pre-create a playlist using store API
    await page.evaluate(() => {
      localStorage.setItem(
        'wasteland-tarot-playlists',
        JSON.stringify({
          state: {
            playlists: [
              {
                id: 'test-playlist-1',
                name: 'Original Name',
                modes: ['ambient'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          version: 0,
        })
      );
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open drawer and sheet
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    // Verify playlist exists
    await expect(page.locator('text=Original Name')).toBeVisible();

    // Click edit button
    const editButton = page.locator('[data-testid="edit-playlist-test-playlist-1"]');
    await editButton.click();
    await page.waitForTimeout(300);

    // Change name
    const nameInput = page.locator('input[name="name"]');
    await nameInput.clear();
    await nameInput.fill('Updated Playlist Name');

    // Add another mode
    const synthwaveCheckbox = page.locator('[data-testid="mode-synthwave"]');
    await synthwaveCheckbox.check();

    // Save changes
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    // Verify updated name appears
    await expect(page.locator('text=Updated Playlist Name')).toBeVisible();

    // Verify in localStorage
    const storedPlaylists = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      return data ? JSON.parse(data).state.playlists : [];
    });

    expect(storedPlaylists[0].name).toBe('Updated Playlist Name');
    expect(storedPlaylists[0].modes).toContain('synthwave');
    expect(storedPlaylists[0].modes).toContain('ambient');

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/playlist-edited.png',
    });
  });

  test('should delete playlist with confirmation', async ({ page }) => {
    // Pre-create playlists
    await page.evaluate(() => {
      localStorage.setItem(
        'wasteland-tarot-playlists',
        JSON.stringify({
          state: {
            playlists: [
              {
                id: 'playlist-1',
                name: 'Playlist to Delete',
                modes: ['synthwave'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'playlist-2',
                name: 'Playlist to Keep',
                modes: ['lofi'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          version: 0,
        })
      );
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open drawer and sheet
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    // Verify both playlists exist
    await expect(page.locator('text=Playlist to Delete')).toBeVisible();
    await expect(page.locator('text=Playlist to Keep')).toBeVisible();

    // Click delete button for first playlist
    const deleteButton = page.locator('[data-testid="delete-playlist-playlist-1"]');
    await deleteButton.click();
    await page.waitForTimeout(300);

    // Should show confirmation dialog
    await expect(page.locator('text=/確認刪除|確認/i')).toBeVisible();

    // Take screenshot of confirmation dialog
    await page.screenshot({
      path: 'test-results/screenshots/playlist-delete-confirm.png',
    });

    // Confirm deletion
    await page.click('button:has-text("確認")');
    await page.waitForTimeout(500);

    // Verify first playlist is gone
    await expect(page.locator('text=Playlist to Delete')).not.toBeVisible();

    // Verify second playlist still exists
    await expect(page.locator('text=Playlist to Keep')).toBeVisible();

    // Verify in localStorage
    const storedPlaylists = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      return data ? JSON.parse(data).state.playlists : [];
    });

    expect(storedPlaylists).toHaveLength(1);
    expect(storedPlaylists[0].name).toBe('Playlist to Keep');
  });

  test('should validate playlist name length', async ({ page }) => {
    // Open drawer and sheet
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    // Click create
    await page.click('[data-testid="create-playlist-button"]');
    await page.waitForTimeout(300);

    // Try to save with empty name
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(300);

    // Should show validation error
    await expect(page.locator('text=/名稱/i')).toBeVisible();

    // Try to save with name too long (>50 characters)
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill('a'.repeat(51));

    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(300);

    // Should show validation error
    await expect(page.locator('text=/長度|字元/i')).toBeVisible();

    // Fill with valid name
    await nameInput.clear();
    await nameInput.fill('Valid Playlist Name');

    // Select a mode
    await page.locator('[data-testid="mode-synthwave"]').check();

    // Save should succeed
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Valid Playlist Name')).toBeVisible();
  });

  test('should search and filter playlists', async ({ page }) => {
    // Pre-create multiple playlists
    await page.evaluate(() => {
      localStorage.setItem(
        'wasteland-tarot-playlists',
        JSON.stringify({
          state: {
            playlists: [
              {
                id: 'pl-1',
                name: 'Chill Vibes',
                modes: ['lofi', 'ambient'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'pl-2',
                name: 'Energy Boost',
                modes: ['synthwave'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'pl-3',
                name: 'Meditation',
                modes: ['ambient'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          version: 0,
        })
      );
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open drawer and sheet
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    // Verify all playlists are visible
    await expect(page.locator('text=Chill Vibes')).toBeVisible();
    await expect(page.locator('text=Energy Boost')).toBeVisible();
    await expect(page.locator('text=Meditation')).toBeVisible();

    // Search for "Chill"
    const searchInput = page.locator('input[placeholder*="搜尋"]');
    await searchInput.fill('Chill');
    await page.waitForTimeout(300);

    // Only "Chill Vibes" should be visible
    await expect(page.locator('text=Chill Vibes')).toBeVisible();
    await expect(page.locator('text=Energy Boost')).not.toBeVisible();
    await expect(page.locator('text=Meditation')).not.toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/playlist-search-results.png',
    });

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // All playlists should be visible again
    await expect(page.locator('text=Energy Boost')).toBeVisible();
    await expect(page.locator('text=Meditation')).toBeVisible();
  });

  test('should show empty state when no playlists exist', async ({ page }) => {
    // Open drawer and sheet (with no playlists)
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    // Should show empty state message
    await expect(page.locator('text=/還沒有播放清單|尚無播放清單|建立第一個/i')).toBeVisible();

    // Should show create button
    await expect(page.locator('[data-testid="create-playlist-button"]')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/playlist-empty-state.png',
    });
  });

  test('should display playlist with current playing indicator', async ({ page }) => {
    // Pre-create playlist
    await page.evaluate(() => {
      localStorage.setItem(
        'wasteland-tarot-playlists',
        JSON.stringify({
          state: {
            playlists: [
              {
                id: 'active-playlist',
                name: 'Now Playing',
                modes: ['synthwave', 'lofi'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          version: 0,
        })
      );

      localStorage.setItem(
        'wasteland-tarot-music-player',
        JSON.stringify({
          state: {
            currentPlaylist: 'active-playlist',
            currentMode: 'synthwave',
            currentModeIndex: 0,
            isPlaying: true,
          },
          version: 0,
        })
      );
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open sheet
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    // Playlist should be highlighted as currently playing
    const playlistElement = page.locator('[data-testid="playlist-active-playlist"]');
    await expect(playlistElement).toHaveClass(/bg-pip-boy-green/);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/playlist-now-playing.png',
    });
  });
});
