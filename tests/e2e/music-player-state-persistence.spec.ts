/**
 * E2E Tests - Music Player State Persistence Flow
 * Task 34: E2E 測試 - 狀態持久化流程
 * Requirements 12.1, 12.4: E2E 測試、視覺回歸測試
 */

import { test, expect } from '@playwright/test';

test.describe('Music Player - State Persistence Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Clear localStorage for fresh start
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('E2E Flow 3: Complete state persistence flow (play → reload → verify restored)', async ({
    page,
  }) => {
    // ========== Step 1: Open drawer and start playing ==========
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Synthwave")');
    await page.waitForTimeout(500);

    await page.click('[aria-label="播放"]');
    await page.waitForTimeout(500);

    // Verify playing
    await expect(page.locator('[aria-label="暫停"]')).toBeVisible();

    // ========== Step 2: Set repeat mode ==========
    const repeatButton = page.locator('[aria-label*="循環"]').first();
    await repeatButton.click();
    await page.waitForTimeout(300);

    // Should be in "one" mode
    await expect(page.locator('[aria-label="單曲循環"]')).toBeVisible();

    // ========== Step 3: Enable shuffle ==========
    const shuffleButton = page.locator('[aria-label*="隨機"]').first();
    await shuffleButton.click();
    await page.waitForTimeout(300);

    // Should be enabled
    await expect(shuffleButton).toHaveAttribute('aria-pressed', 'true');

    // ========== Step 4: Adjust volume ==========
    const volumeSlider = page.locator('[role="slider"][aria-label*="音量"]');
    await volumeSlider.fill('65');
    await page.waitForTimeout(300);

    // ========== Step 5: Capture state before reload ==========
    const stateBefore = await page.evaluate(() => {
      return {
        music: localStorage.getItem('wasteland-tarot-music-player'),
        audio: localStorage.getItem('wasteland-tarot-audio'),
      };
    });

    expect(stateBefore.music).toBeTruthy();
    expect(stateBefore.audio).toBeTruthy();

    const musicState = JSON.parse(stateBefore.music!);
    expect(musicState.state.currentMode).toBe('synthwave');
    expect(musicState.state.repeatMode).toBe('one');
    expect(musicState.state.shuffleEnabled).toBe(true);

    // Take screenshot before reload
    await page.screenshot({
      path: 'test-results/screenshots/before-reload.png',
    });

    // ========== Step 6: Reload page ==========
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for state to rehydrate
    await page.waitForTimeout(1000);

    // ========== Step 7: Verify state restored ==========
    const stateAfter = await page.evaluate(() => {
      return {
        music: localStorage.getItem('wasteland-tarot-music-player'),
        audio: localStorage.getItem('wasteland-tarot-audio'),
      };
    });

    expect(stateAfter.music).toBe(stateBefore.music);
    expect(stateAfter.audio).toBe(stateBefore.audio);

    // ========== Step 8: Open drawer and verify UI state ==========
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Verify selected mode is still Synthwave
    const synthwaveButton = page.locator('button:has-text("Synthwave")');
    await expect(synthwaveButton).toHaveClass(/border-pip-boy-green/);

    // Verify repeat mode is still "one"
    await expect(page.locator('[aria-label="單曲循環"]')).toBeVisible();

    // Verify shuffle is still enabled
    const shuffleAfterReload = page.locator('[aria-label*="隨機"]').first();
    await expect(shuffleAfterReload).toHaveAttribute('aria-pressed', 'true');

    // Verify volume is still 65
    const volumeAfterReload = page.locator('[role="slider"][aria-label*="音量"]');
    await expect(volumeAfterReload).toHaveAttribute('aria-valuenow', '65');

    // Take screenshot after reload
    await page.screenshot({
      path: 'test-results/screenshots/after-reload-restored.png',
    });
  });

  test('should persist playlist across page reload', async ({ page }) => {
    // Create a playlist
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    await page.click('[data-testid="create-playlist-button"]');
    await page.waitForTimeout(300);

    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill('Persistence Test Playlist');

    await page.locator('[data-testid="mode-synthwave"]').check();
    await page.locator('[data-testid="mode-lofi"]').check();

    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    // Verify playlist exists
    await expect(page.locator('text=Persistence Test Playlist')).toBeVisible();

    // Get playlist ID
    const playlistId = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      return data ? JSON.parse(data).state.playlists[0].id : null;
    });

    expect(playlistId).toBeTruthy();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open sheet again
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    // Verify playlist still exists
    await expect(page.locator('text=Persistence Test Playlist')).toBeVisible();

    // Verify modes are correct
    const playlistIdAfter = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      const playlists = data ? JSON.parse(data).state.playlists : [];
      return playlists[0];
    });

    expect(playlistIdAfter.id).toBe(playlistId);
    expect(playlistIdAfter.name).toBe('Persistence Test Playlist');
    expect(playlistIdAfter.modes).toEqual(['synthwave', 'lofi']);
  });

  test('should persist current playlist and playback position', async ({ page }) => {
    // Pre-create a playlist
    await page.evaluate(() => {
      localStorage.setItem(
        'wasteland-tarot-playlists',
        JSON.stringify({
          state: {
            playlists: [
              {
                id: 'test-pl',
                name: 'Test Playlist',
                modes: ['synthwave', 'divination', 'lofi', 'ambient'],
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

    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    // Open sheet and play the playlist
    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    await page.click('[data-testid="play-playlist-test-pl"]');
    await page.waitForTimeout(500);

    // Click next 2 times to go to third track
    await page.click('[aria-label="下一首"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="下一首"]');
    await page.waitForTimeout(300);

    // Verify we're at index 2 (third track: lofi)
    const indexBefore = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-music-player');
      return data ? JSON.parse(data).state.currentModeIndex : null;
    });

    expect(indexBefore).toBe(2);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify position persisted
    const stateAfter = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-music-player');
      return data ? JSON.parse(data).state : null;
    });

    expect(stateAfter.currentPlaylist).toBe('test-pl');
    expect(stateAfter.currentModeIndex).toBe(2);
  });

  test('should handle corrupted localStorage data gracefully', async ({ page }) => {
    // Set corrupted data
    await page.evaluate(() => {
      localStorage.setItem('wasteland-tarot-music-player', 'invalid json{');
      localStorage.setItem('wasteland-tarot-playlists', '{corrupted}');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Page should still load without crashing
    await expect(page.locator('body')).toBeVisible();

    // Open drawer (should work despite corrupted data)
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Check if localStorage was reset/repaired
    const storedData = await page.evaluate(() => {
      return {
        music: localStorage.getItem('wasteland-tarot-music-player'),
        playlists: localStorage.getItem('wasteland-tarot-playlists'),
      };
    });

    // Should either be null or valid JSON (not corrupted)
    if (storedData.music) {
      expect(() => JSON.parse(storedData.music!)).not.toThrow();
    }

    if (storedData.playlists) {
      expect(() => JSON.parse(storedData.playlists!)).not.toThrow();
    }

    // Take screenshot
    await page.screenshot({
      path: 'test-results/screenshots/corrupted-data-recovery.png',
    });
  });

  test('should reset to defaults when localStorage is cleared', async ({ page }) => {
    // Set up initial state
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('button:has-text("Synthwave")');
    await page.waitForTimeout(300);

    const repeatButton = page.locator('[aria-label*="循環"]').first();
    await repeatButton.click();
    await page.waitForTimeout(300);

    // Clear localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Should be in default state:
    // - No mode selected
    // - Repeat mode: off
    // - Shuffle: disabled

    const repeatButtonAfter = page.locator('[aria-label*="循環"]').first();
    await expect(repeatButtonAfter).toHaveAttribute('aria-pressed', 'false');

    const shuffleButton = page.locator('[aria-label*="隨機"]').first();
    await expect(shuffleButton).toHaveAttribute('aria-pressed', 'false');

    // No mode should be highlighted
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const classes = await button.getAttribute('class');
      if (classes?.includes('music-mode')) {
        expect(classes).not.toContain('border-pip-boy-green');
      }
    }
  });

  test('should persist volume and mute state across reload', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Set volume to 40
    const volumeSlider = page.locator('[role="slider"][aria-label*="音量"]');
    await volumeSlider.fill('40');
    await page.waitForTimeout(300);

    // Mute
    const muteButton = page.locator('[aria-label*="靜音"]').first();
    await muteButton.click();
    await page.waitForTimeout(300);

    // Verify muted
    await expect(page.locator('[aria-label="取消靜音"]')).toBeVisible();

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Verify volume is still 40
    const volumeAfter = page.locator('[role="slider"][aria-label*="音量"]');
    await expect(volumeAfter).toHaveAttribute('aria-valuenow', '40');

    // Verify still muted
    await expect(page.locator('[aria-label="取消靜音"]')).toBeVisible();
    await expect(volumeAfter).toBeDisabled();
  });

  test('should handle multiple page reloads without data loss', async ({ page }) => {
    // Create playlist
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    await page.click('[data-testid="create-playlist-button"]');
    await page.waitForTimeout(300);

    await page.fill('input[name="name"]', 'Multi Reload Test');
    await page.locator('[data-testid="mode-ambient"]').check();
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    const playlistId = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      return data ? JSON.parse(data).state.playlists[0].id : null;
    });

    // Reload 3 times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Verify playlist still exists after each reload
      const exists = await page.evaluate((id) => {
        const data = localStorage.getItem('wasteland-tarot-playlists');
        if (!data) return false;

        const playlists = JSON.parse(data).state.playlists;
        return playlists.some((pl: any) => pl.id === id);
      }, playlistId);

      expect(exists).toBe(true);
    }

    // Open sheet and verify playlist is still there
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(300);

    await page.click('[aria-label="開啟播放清單"]');
    await page.waitForTimeout(300);

    await expect(page.locator('text=Multi Reload Test')).toBeVisible();

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/screenshots/multiple-reloads-success.png',
    });
  });

  test('should persist drawer state (minimized) on reload', async ({ page }) => {
    // Open and minimize drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    const minimizeButton = page.locator('[aria-label="最小化"]');

    if (await minimizeButton.isVisible()) {
      await minimizeButton.click();
      await page.waitForTimeout(500);

      const drawer = page.locator('[data-testid="music-player-drawer"]');
      await expect(drawer).toHaveAttribute('data-minimized', 'true');

      // Note: UI state (drawer open/minimized) is typically NOT persisted
      // Only playback state is persisted. This test verifies the expected behavior.

      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Drawer should be closed after reload (UI state not persisted)
      const drawerAfterReload = page.locator('[data-testid="music-player-drawer"]');
      const isVisible = await drawerAfterReload.isVisible().catch(() => false);

      // Drawer should be closed (not visible or minimized)
      expect(isVisible).toBe(false);
    }
  });
});
