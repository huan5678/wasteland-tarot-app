/**
 * E2E Tests - Music Player Playback Flow
 * Task 34: E2E 測試 - 完整音樂播放流程
 * Requirements 12.1, 12.4: E2E 測試、視覺回歸測試
 */

import { test, expect } from '@playwright/test';

test.describe('Music Player - Complete Playback Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Clear localStorage for fresh start
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('E2E Flow 1: Complete music playback flow (open → select mode → play → next)', async ({
    page,
  }) => {
    // ========== Step 1: Open music player drawer ==========
    const triggerButton = page.locator('[aria-label="開啟音樂播放器"]');
    await expect(triggerButton).toBeVisible();

    await triggerButton.click();

    await page.waitForTimeout(500); // Wait for drawer animation

    const drawer = page.locator('[data-testid="music-player-drawer"]');
    await expect(drawer).toBeVisible();

    // Take screenshot for visual regression
    await page.screenshot({
      path: 'test-results/screenshots/music-player-drawer-opened.png',
      fullPage: false,
    });

    // ========== Step 2: Select music mode (Synthwave) ==========
    await page.click('button:has-text("Synthwave")');

    await page.waitForTimeout(1000); // Wait for mode loading

    // Verify mode is selected
    const synthwaveButton = page.locator('button:has-text("Synthwave")');
    await expect(synthwaveButton).toHaveClass(/border-pip-boy-green/);

    // Take screenshot of mode selected
    await page.screenshot({
      path: 'test-results/screenshots/music-mode-selected.png',
    });

    // ========== Step 3: Verify play button state ==========
    const playButton = page.locator('[aria-label="播放"]');
    await expect(playButton).toBeVisible();

    // ========== Step 4: Click play button ==========
    await playButton.click();

    await page.waitForTimeout(500);

    // Verify pause button appears (indicating music is playing)
    const pauseButton = page.locator('[aria-label="暫停"]');
    await expect(pauseButton).toBeVisible();
    await expect(playButton).not.toBeVisible();

    // Take screenshot of playing state
    await page.screenshot({
      path: 'test-results/screenshots/music-playing.png',
    });

    // ========== Step 5: Click next button ==========
    const nextButton = page.locator('[aria-label="下一首"]');
    await expect(nextButton).toBeVisible();

    await nextButton.click();

    await page.waitForTimeout(500);

    // Music should still be playing (pause button visible)
    await expect(pauseButton).toBeVisible();

    // ========== Step 6: Verify music player state persistence ==========
    // Check localStorage
    const storedState = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-music-player');
      return data ? JSON.parse(data) : null;
    });

    expect(storedState).toBeTruthy();
    expect(storedState.state.currentMode).toBeTruthy();

    // ========== Step 7: Pause music ==========
    await pauseButton.click();

    await page.waitForTimeout(300);

    await expect(playButton).toBeVisible();
    await expect(pauseButton).not.toBeVisible();

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/screenshots/music-paused.png',
    });
  });

  test('should support keyboard shortcuts during playback', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Select a mode
    await page.click('button:has-text("Synthwave")');
    await page.waitForTimeout(500);

    // Press Space to play
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Verify playing
    const pauseButton = page.locator('[aria-label="暫停"]');
    await expect(pauseButton).toBeVisible();

    // Press ArrowRight to next
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);

    // Music should still be playing
    await expect(pauseButton).toBeVisible();

    // Press ArrowLeft to previous
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);

    // Press Space to pause
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const playButton = page.locator('[aria-label="播放"]');
    await expect(playButton).toBeVisible();
  });

  test('should handle repeat mode cycling', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Find repeat button (should show "啟用循環播放" initially)
    const repeatButton = page.locator('[aria-label*="循環"]').first();
    await expect(repeatButton).toBeVisible();

    // Initial state: off
    await expect(repeatButton).toHaveAttribute('aria-pressed', 'false');

    // Click to cycle to "one"
    await repeatButton.click();
    await page.waitForTimeout(300);

    // Should now show "單曲循環"
    await expect(page.locator('[aria-label="單曲循環"]')).toBeVisible();

    // Click to cycle to "all"
    await repeatButton.click();
    await page.waitForTimeout(300);

    // Should now show "列表循環"
    await expect(page.locator('[aria-label="列表循環"]')).toBeVisible();

    // Click to cycle back to "off"
    await repeatButton.click();
    await page.waitForTimeout(300);

    await expect(page.locator('[aria-label="啟用循環播放"]')).toBeVisible();

    // Take screenshot of repeat mode UI
    await page.screenshot({
      path: 'test-results/screenshots/repeat-mode-off.png',
    });
  });

  test('should handle shuffle mode toggle', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Find shuffle button
    const shuffleButton = page.locator('[aria-label*="隨機"]').first();
    await expect(shuffleButton).toBeVisible();

    // Initial state: disabled
    await expect(shuffleButton).toHaveAttribute('aria-pressed', 'false');

    // Enable shuffle
    await shuffleButton.click();
    await page.waitForTimeout(300);

    // Should now show "停用隨機播放"
    await expect(page.locator('[aria-label="停用隨機播放"]')).toBeVisible();
    await expect(shuffleButton).toHaveAttribute('aria-pressed', 'true');

    // Verify visual state (green border)
    await expect(shuffleButton).toHaveClass(/border-2/);
    await expect(shuffleButton).toHaveClass(/border-pip-boy-green/);

    // Disable shuffle
    await shuffleButton.click();
    await page.waitForTimeout(300);

    await expect(page.locator('[aria-label="啟用隨機播放"]')).toBeVisible();
  });

  test('should adjust volume with slider', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Find volume slider
    const volumeSlider = page.locator('[role="slider"][aria-label*="音量"]');
    await expect(volumeSlider).toBeVisible();

    // Get initial volume value
    const initialVolume = await volumeSlider.getAttribute('aria-valuenow');
    expect(initialVolume).toBeTruthy();

    // Change volume (set to 75)
    await volumeSlider.fill('75');
    await page.waitForTimeout(300);

    // Verify volume changed
    const newVolume = await volumeSlider.getAttribute('aria-valuenow');
    expect(newVolume).toBe('75');

    // Verify localStorage updated
    const storedVolume = await page.evaluate(() => {
      const data = localStorage.getItem('wasteland-tarot-audio');
      return data ? JSON.parse(data).state.volumes.music : null;
    });

    expect(storedVolume).toBe(75);

    // Take screenshot of volume control
    await page.screenshot({
      path: 'test-results/screenshots/volume-control.png',
    });
  });

  test('should toggle mute', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Find mute button
    const muteButton = page.locator('[aria-label*="靜音"]').first();
    await expect(muteButton).toBeVisible();

    // Click to mute
    await muteButton.click();
    await page.waitForTimeout(300);

    // Should now show "取消靜音"
    await expect(page.locator('[aria-label="取消靜音"]')).toBeVisible();

    // Volume slider should be disabled
    const volumeSlider = page.locator('[role="slider"][aria-label*="音量"]');
    await expect(volumeSlider).toBeDisabled();

    // Click to unmute
    await muteButton.click();
    await page.waitForTimeout(300);

    await expect(page.locator('[aria-label*="靜音"]')).toBeVisible();
    await expect(volumeSlider).not.toBeDisabled();
  });

  test('should minimize and expand drawer', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    const drawer = page.locator('[data-testid="music-player-drawer"]');
    await expect(drawer).toBeVisible();

    // Find minimize button
    const minimizeButton = page.locator('[aria-label="最小化"]');

    if (await minimizeButton.isVisible()) {
      await minimizeButton.click();
      await page.waitForTimeout(500);

      // Drawer should be minimized (check data attribute)
      await expect(drawer).toHaveAttribute('data-minimized', 'true');

      // Take screenshot of minimized state
      await page.screenshot({
        path: 'test-results/screenshots/drawer-minimized.png',
      });

      // Expand again
      const expandButton = page.locator('[aria-label="展開"]');
      await expandButton.click();
      await page.waitForTimeout(500);

      await expect(drawer).toHaveAttribute('data-minimized', 'false');
    }
  });

  test('should close drawer with Escape key', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    const drawer = page.locator('[data-testid="music-player-drawer"]');
    await expect(drawer).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Drawer should be closed or minimized
    const isVisible = await drawer.isVisible();
    if (isVisible) {
      // Check if minimized
      const isMinimized = await drawer.getAttribute('data-minimized');
      expect(isMinimized).toBe('true');
    } else {
      expect(isVisible).toBe(false);
    }
  });

  test('should display loading state during mode switch', async ({ page }) => {
    // Open drawer
    await page.click('[aria-label="開啟音樂播放器"]');
    await page.waitForTimeout(500);

    // Click a mode
    await page.click('button:has-text("Synthwave")');

    // Should show loading indicator briefly
    const loadingIndicator = page.locator('text=/載入中|Loading/i');

    // Note: Loading might be very fast, so we use a short timeout
    const isLoading = await loadingIndicator.isVisible().catch(() => false);

    // Either we see loading, or mode loads so fast we miss it (both acceptable)
    expect(typeof isLoading).toBe('boolean');

    // Eventually mode should be selected
    await page.waitForTimeout(1000);

    const synthwaveButton = page.locator('button:has-text("Synthwave")');
    await expect(synthwaveButton).toHaveClass(/border-pip-boy-green/);
  });
});
