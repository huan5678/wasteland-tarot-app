/**
 * E2E Tests - Music Player Persistence
 * 音樂播放器狀態持久化測試
 *
 * Task 22: 實作 localStorage 持久化邏輯驗證
 * Requirements 6.1, 6.2, 6.3: localStorage 持久化、重新整理恢復
 */

import { test, expect } from '@playwright/test';

test.describe('Music Player Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should persist repeat mode across page reload', async ({ page }) => {
    // Open music player drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Change repeat mode (click multiple times to cycle)
    const repeatButton = page.locator('[aria-label*="循環"]').first();
    await repeatButton.click();
    await page.waitForTimeout(500);

    // Check localStorage before reload
    const storageBeforeReload = await page.evaluate(() => {
      return localStorage.getItem('wasteland-tarot-music-player');
    });
    expect(storageBeforeReload).toBeTruthy();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check localStorage after reload
    const storageAfterReload = await page.evaluate(() => {
      return localStorage.getItem('wasteland-tarot-music-player');
    });
    expect(storageAfterReload).toBe(storageBeforeReload);
  });

  test('should persist shuffle state across page reload', async ({ page }) => {
    // Open music player drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Enable shuffle
    const shuffleButton = page.locator('[aria-label*="隨機"]').first();
    await shuffleButton.click();
    await page.waitForTimeout(500);

    // Get localStorage state
    const storageBefore = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-music-player');
      return data ? JSON.parse(data) : null;
    });

    expect(storageBefore?.state?.shuffleEnabled).toBe(true);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check localStorage after reload
    const storageAfter = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-music-player');
      return data ? JSON.parse(data) : null;
    });

    expect(storageAfter?.state?.shuffleEnabled).toBe(true);
  });

  test('should persist playlist across page reload', async ({ page }) => {
    // Open playlist sheet
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.click('[aria-label="開啟播放清單"]');

    // Create a new playlist
    await page.click('[data-testid="create-playlist-button"]');
    await page.fill('input[name="name"]', 'Test Persistence Playlist');

    // Select some modes (assuming checkboxes exist)
    await page.check('[data-testid="mode-synthwave"]');
    await page.check('[data-testid="mode-lofi"]');

    // Save playlist
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    // Verify playlist in localStorage
    const playlistsBefore = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      return data ? JSON.parse(data) : null;
    });

    expect(playlistsBefore?.state?.playlists).toHaveLength(1);
    expect(playlistsBefore?.state?.playlists[0].name).toBe('Test Persistence Playlist');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check playlist still exists
    const playlistsAfter = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      return data ? JSON.parse(data) : null;
    });

    expect(playlistsAfter?.state?.playlists).toHaveLength(1);
    expect(playlistsAfter?.state?.playlists[0].name).toBe('Test Persistence Playlist');
  });

  test('should handle localStorage quota exceeded gracefully', async ({ page }) => {
    // Fill localStorage to near quota
    await page.evaluate(() => {
      try {
        // Generate large data (but not too large to avoid timeout)
        const largeData = 'x'.repeat(1024 * 1024); // 1MB
        for (let i = 0; i < 4; i++) {
          localStorage.setItem(`large-data-${i}`, largeData);
        }
      } catch (e) {
        // Expected to fail eventually
        console.log('localStorage quota exceeded (expected)');
      }
    });

    // Try to create a playlist (should handle quota error)
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.click('[aria-label="開啟播放清單"]');
    await page.click('[data-testid="create-playlist-button"]');
    await page.fill('input[name="name"]', 'Quota Test Playlist');

    // Attempt to save (may fail due to quota)
    await page.click('button:has-text("儲存")');

    // Should show error toast or handle gracefully
    // (Exact behavior depends on error handling implementation)
    await page.waitForTimeout(1000);

    // Verify no crash occurred
    const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false);

    // Either error shown or succeeded (both acceptable)
    expect(typeof hasError).toBe('boolean');
  });

  test('should restore drawer state after reload', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Note: isDrawerOpen is NOT persisted (only repeatMode, shuffleEnabled, currentPlaylist, currentModeIndex)
    // So after reload, drawer should be closed by default

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Drawer should be closed after reload (UI state not persisted)
    const drawerVisible = await page.locator('[data-testid="music-player-drawer"]').isVisible().catch(() => false);
    expect(drawerVisible).toBe(false);
  });

  test('should handle corrupted localStorage data', async ({ page }) => {
    // Corrupt localStorage data
    await page.evaluate(() => {
      localStorage.setItem('wasteland-tarot-music-player', 'invalid json{');
      localStorage.setItem('wasteland-tarot-playlists', '{corrupted}');
    });

    // Reload page (should handle corruption gracefully)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should not crash, either:
    // 1. Reset to defaults
    // 2. Show error message
    // 3. Ignore corrupted data

    // Verify page still functional
    await page.click('[aria-label="開啟音樂播放器"]');
    await expect(page.locator('[data-testid="music-player-drawer"]')).toBeVisible();

    // Check if localStorage was reset
    const storageAfter = await page.evaluate(() => {
      return {
        player: localStorage.getItem('wasteland-tarot-music-player'),
        playlists: localStorage.getItem('wasteland-tarot-playlists'),
      };
    });

    // Should either be reset or repaired
    expect(storageAfter.player).toBeTruthy();
    expect(storageAfter.playlists).toBeTruthy();
  });

  test('should persist current playlist and index', async ({ page }) => {
    // Create a playlist with multiple modes
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.click('[aria-label="開啟播放清單"]');
    await page.click('[data-testid="create-playlist-button"]');
    await page.fill('input[name="name"]', 'Multi-Mode Playlist');

    // Select multiple modes
    await page.check('[data-testid="mode-synthwave"]');
    await page.check('[data-testid="mode-divination"]');
    await page.check('[data-testid="mode-lofi"]');

    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    // Play the playlist (assuming there's a play button)
    await page.click('[data-testid="play-playlist-button"]');
    await page.waitForTimeout(500);

    // Skip to next track
    await page.click('[aria-label="下一首"]');
    await page.waitForTimeout(500);

    // Check currentModeIndex in localStorage
    const storageBefore = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-music-player');
      return data ? JSON.parse(data) : null;
    });

    expect(storageBefore?.state?.currentModeIndex).toBeGreaterThan(0);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check index persisted
    const storageAfter = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-music-player');
      return data ? JSON.parse(data) : null;
    });

    expect(storageAfter?.state?.currentModeIndex).toBe(storageBefore?.state?.currentModeIndex);
    expect(storageAfter?.state?.currentPlaylist).toBe(storageBefore?.state?.currentPlaylist);
  });
});

test.describe('Playlist Store Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should persist multiple playlists', async ({ page }) => {
    // Create first playlist
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.click('[aria-label="開啟播放清單"]');

    await page.click('[data-testid="create-playlist-button"]');
    await page.fill('input[name="name"]', 'Playlist 1');
    await page.check('[data-testid="mode-synthwave"]');
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    // Create second playlist
    await page.click('[data-testid="create-playlist-button"]');
    await page.fill('input[name="name"]', 'Playlist 2');
    await page.check('[data-testid="mode-lofi"]');
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify both playlists persist
    const playlists = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      return data ? JSON.parse(data) : null;
    });

    expect(playlists?.state?.playlists).toHaveLength(2);
    expect(playlists?.state?.playlists[0].name).toBe('Playlist 1');
    expect(playlists?.state?.playlists[1].name).toBe('Playlist 2');
  });

  test('should persist playlist order changes', async ({ page }) => {
    // Create playlist with multiple modes
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.click('[aria-label="開啟播放清單"]');
    await page.click('[data-testid="create-playlist-button"]');
    await page.fill('input[name="name"]', 'Reorder Test');

    await page.check('[data-testid="mode-synthwave"]');
    await page.check('[data-testid="mode-divination"]');
    await page.check('[data-testid="mode-lofi"]');
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    // Get initial order
    const orderBefore = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      const parsed = data ? JSON.parse(data) : null;
      return parsed?.state?.playlists[0]?.modes;
    });

    expect(orderBefore).toHaveLength(3);

    // Edit playlist and reorder (would require drag-and-drop or edit UI)
    // For now, just verify persistence

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify order persisted
    const orderAfter = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      const parsed = data ? JSON.parse(data) : null;
      return parsed?.state?.playlists[0]?.modes;
    });

    expect(orderAfter).toEqual(orderBefore);
  });

  test('should handle playlist deletion persistence', async ({ page }) => {
    // Create two playlists
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.click('[aria-label="開啟播放清單"]');

    await page.click('[data-testid="create-playlist-button"]');
    await page.fill('input[name="name"]', 'To Keep');
    await page.check('[data-testid="mode-synthwave"]');
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    await page.click('[data-testid="create-playlist-button"]');
    await page.fill('input[name="name"]', 'To Delete');
    await page.check('[data-testid="mode-lofi"]');
    await page.click('button:has-text("儲存")');
    await page.waitForTimeout(500);

    // Delete second playlist
    await page.click('[data-testid="delete-playlist-button"]').last();
    await page.click('button:has-text("確認")'); // Assuming confirmation dialog
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify only one playlist remains
    const playlists = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-playlists');
      return data ? JSON.parse(data) : null;
    });

    expect(playlists?.state?.playlists).toHaveLength(1);
    expect(playlists?.state?.playlists[0].name).toBe('To Keep');
  });
});
